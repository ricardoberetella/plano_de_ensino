import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Syllabus, ProgrammaticUnit } from "../types/syllabus";
import { initialSyllabi } from "../data/mockSyllabi";
import { proeducadorUnits, rawProeducadorUnits, defaultCoursePlanData } from "../data/proeducadorData";
import { generateSyllabusSchedule } from "./scheduleGenerator";
import { INITIAL_SCHOOL_EVENTS_2026, TEACHER_SCHEDULE_RULES } from "./calendarConfig";

const STORAGE_KEY = "senai_plano_ensino_persistent_data";
const ACTIVE_ID_KEY = "senai_plano_ensino_active_id";

// Remove undefined values to prevent Firestore serialization errors
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function getStandardUcKey(u?: Partial<ProgrammaticUnit> | null): string {
  if (!u) return "UC";
  const ac = (u.acronym || "").toUpperCase().trim();
  const id = (u.id || "").toLowerCase().trim();
  const title = (u.unitTitle || "").toUpperCase().trim();
  const wl = (u.workload || "").toLowerCase().replace(/\s+/g, "");

  // 1. Direct IDs
  if (id === "uc-fusi") return "FUSI";
  if (id === "uc-lidt") return "LIDT";
  if (id === "uc-crd" || id === "uc-cdmat") return "CRD";
  if (id === "uc-map") return "MAP";
  if (id === "uc-ciema") return "CIEMA";
  if (id === "uc-prusc" || id === "uc-proc") return "PRUSC";
  if (id === "uc-mindu" || id === "uc-metr") return "MINDU";

  // 2. Strict 40h checks (resolves historical misclassification where 40h CRD was named MINDU, or 40h MAP was named PRUSC)
  if (wl === "40h" || wl === "40") {
    if (ac === "CIEMA" || title.includes("CIÊNCI") || title.includes("CIENCIA") || title.includes("MATERIAIS")) {
      return "CIEMA";
    }
    if (ac === "LIDT" || title.includes("DESENHO") || title.includes("LEITURA")) {
      return "LIDT";
    }
    if (
      ac === "MAP" ||
      title.includes("MATEMÁT") ||
      title.includes("MATEMAT") ||
      title.includes("CÁLCUL") ||
      title.includes("CALCUL") ||
      ac === "PRUSC" ||
      ac === "PROC"
    ) {
      return "MAP";
    }
    if (
      ac === "CRD" ||
      ac === "CDMAT" ||
      ac === "MINDU" ||
      ac === "METR" ||
      title.includes("CONTROLE") ||
      title.includes("DIMENSIONAL") ||
      title.includes("METROLOGIA")
    ) {
      return "CRD";
    }
  }

  // 3. Workload based resolution for major units
  if (wl === "240h" || wl === "240") return "FUSI";
  if (wl === "160h" || wl === "280h" || wl === "160" || wl === "280") return "PRUSC";
  if (wl === "80h" || wl === "120h" || wl === "80" || wl === "120") return "MINDU";

  // 4. Title Keyword matching
  if (title.includes("FUNDAMENTOS DA USINAGEM") || title.includes("AJUSTAGEM")) return "FUSI";
  if (title.includes("LEITURA E INTERPRETAÇÃO") || title.includes("DESENHO TÉCNICO")) return "LIDT";
  if (
    title.includes("CONTROLE DIMENSIONAL") ||
    title.includes("METROLOGIA BÁSICA") ||
    title.includes("METROLOGIA BASICA")
  ) {
    return "CRD";
  }
  if (title.includes("MATEMÁTICA") || title.includes("MATEMATICA")) return "MAP";
  if (
    title.includes("CIÊNCIAS DOS MATERIAIS") ||
    title.includes("CIENCIAS DOS MATERIAIS") ||
    title.includes("CIÊNCIA DOS MATERIAIS")
  ) {
    return "CIEMA";
  }
  if (
    title.includes("PROCESSOS DE USINAGEM") ||
    title.includes("TORNEAMENTO") ||
    title.includes("FRESAMENTO")
  ) {
    return "PRUSC";
  }
  if (
    title.includes("METROLOGIA INDUSTRIAL") ||
    title.includes("CONTROLE GEOMÉTRICO") ||
    title.includes("CONTROLE GEOMETRICO")
  ) {
    return "MINDU";
  }

  // 5. Acronym Fallback
  if (ac === "FUSI") return "FUSI";
  if (ac === "LIDT") return "LIDT";
  if (ac === "CRD" || ac === "CDMAT") return "CRD";
  if (ac === "MAP") return "MAP";
  if (ac === "CIEMA") return "CIEMA";
  if (ac === "PRUSC" || ac === "PROC") return "PRUSC";
  if (ac === "MINDU" || ac === "METR") return "MINDU";

  return ac || id || "UC";
}

export function deduplicateAndSanitizeUnits(units: ProgrammaticUnit[]): ProgrammaticUnit[] {
  if (!Array.isArray(units) || units.length === 0) {
    return JSON.parse(JSON.stringify(rawProeducadorUnits || []));
  }

  const seenKeys = new Set<string>();
  const cleaned: ProgrammaticUnit[] = [];

  for (const u of units) {
    if (!u) continue;
    const key = getStandardUcKey(u);
    if (seenKeys.has(key)) {
      // Duplicate UC found - merge any lesson plans into existing and skip
      const existing = cleaned.find((c) => getStandardUcKey(c) === key);
      if (existing) {
        if (Array.isArray(u.lessonPlan) && u.lessonPlan.length > 0) {
          const existingDates = new Set((existing.lessonPlan || []).map((lp) => `${lp.date}-${lp.hours}`));
          const newLessons = u.lessonPlan.filter((lp) => !existingDates.has(`${lp.date}-${lp.hours}`));
          existing.lessonPlan = [...(existing.lessonPlan || []), ...JSON.parse(JSON.stringify(newLessons))];
        }
      }
      continue;
    }
    seenKeys.add(key);

    const baseUnitMatch = rawProeducadorUnits.find((pu) => getStandardUcKey(pu) === key);
    const baseUnit = baseUnitMatch ? JSON.parse(JSON.stringify(baseUnitMatch)) : null;

    // Extract any stage data if present (e.g. from previous version where data was inside stages)
    const stageRubrics = Array.isArray((u as any).stages)
      ? (u as any).stages.flatMap((s: any) => s.rubrics || [])
      : [];
    const stageTopics = Array.isArray((u as any).stages)
      ? (u as any).stages.flatMap((s: any) => s.topics || [])
      : [];
    const stageLessons = Array.isArray((u as any).stages)
      ? (u as any).stages.flatMap((s: any) => s.lessonPlan || [])
      : [];
    const stageSP = Array.isArray((u as any).stages)
      ? (u as any).stages.map((s: any) => s.situationProblem).find((sp: any) => sp && (sp.title || sp.contextualization || (sp.challenge && sp.challenge.length > 0)))
      : undefined;
    const stageTechCap = Array.isArray((u as any).stages)
      ? (u as any).stages.flatMap((s: any) => s.technicalCapacities || s.basicCapacities || [])
      : [];
    const stageSocioCap = Array.isArray((u as any).stages)
      ? (u as any).stages.flatMap((s: any) => s.socioemotionalCapacities || [])
      : [];

    // Prioritize user data first, then stage data, then fallback to base template only if completely empty
    const finalObjective = (u.objective !== undefined && u.objective !== null && u.objective.trim() !== "")
      ? u.objective
      : (baseUnit?.objective || "");

    const finalBasicCapacities = (Array.isArray(u.basicCapacities) && u.basicCapacities.length > 0)
      ? JSON.parse(JSON.stringify(u.basicCapacities))
      : (baseUnit?.basicCapacities ? JSON.parse(JSON.stringify(baseUnit.basicCapacities)) : []);

    const finalTechCapacities = (Array.isArray(u.technicalCapacities) && u.technicalCapacities.length > 0)
      ? JSON.parse(JSON.stringify(u.technicalCapacities))
      : (stageTechCap.length > 0
          ? JSON.parse(JSON.stringify(stageTechCap))
          : (baseUnit?.technicalCapacities ? JSON.parse(JSON.stringify(baseUnit.technicalCapacities)) : []));

    const finalSocioCapacities = (Array.isArray(u.socioemotionalCapacities) && u.socioemotionalCapacities.length > 0)
      ? JSON.parse(JSON.stringify(u.socioemotionalCapacities))
      : (stageSocioCap.length > 0
          ? JSON.parse(JSON.stringify(stageSocioCap))
          : (baseUnit?.socioemotionalCapacities ? JSON.parse(JSON.stringify(baseUnit.socioemotionalCapacities)) : []));

    const finalTopics = (Array.isArray(u.topics) && u.topics.length > 0)
      ? JSON.parse(JSON.stringify(u.topics))
      : (stageTopics.length > 0
          ? JSON.parse(JSON.stringify(stageTopics))
          : (baseUnit?.topics ? JSON.parse(JSON.stringify(baseUnit.topics)) : []));

    const finalSituationProblem = (u.situationProblem && (u.situationProblem.title || u.situationProblem.contextualization || (u.situationProblem.challenge && u.situationProblem.challenge.length > 0)))
      ? JSON.parse(JSON.stringify(u.situationProblem))
      : (stageSP
          ? JSON.parse(JSON.stringify(stageSP))
          : (baseUnit?.situationProblem ? JSON.parse(JSON.stringify(baseUnit.situationProblem)) : undefined));

    const finalRubrics = (Array.isArray(u.rubrics) && u.rubrics.length > 0)
      ? JSON.parse(JSON.stringify(u.rubrics))
      : (stageRubrics.length > 0
          ? JSON.parse(JSON.stringify(stageRubrics))
          : (baseUnit?.rubrics ? JSON.parse(JSON.stringify(baseUnit.rubrics)) : []));

    const finalLessonPlan = (Array.isArray(u.lessonPlan) && u.lessonPlan.length > 0)
      ? JSON.parse(JSON.stringify(u.lessonPlan))
      : (stageLessons.length > 0
          ? JSON.parse(JSON.stringify(stageLessons))
          : (baseUnit?.lessonPlan ? JSON.parse(JSON.stringify(baseUnit.lessonPlan)) : []));

    cleaned.push({
      id: u.id || baseUnit?.id || `uc-${key.toLowerCase()}`,
      acronym: u.acronym || baseUnit?.acronym || key,
      semester: u.semester || baseUnit?.semester || (["PRUSC", "MINDU"].includes(key) ? "2º SEMESTRE" : "1º SEMESTRE"),
      module: u.module || baseUnit?.module || (["PRUSC", "MINDU"].includes(key) ? "Módulo Específico" : "Módulo Introdutório"),
      unitTitle: u.unitTitle || baseUnit?.unitTitle || "Unidade Curricular",
      workload: u.workload || baseUnit?.workload || (key === "FUSI" ? "240h" : key === "PRUSC" ? "160h" : key === "MINDU" ? "80h" : "40h"),
      objective: finalObjective,
      basicCapacities: finalBasicCapacities,
      technicalCapacities: finalTechCapacities,
      socioemotionalCapacities: finalSocioCapacities,
      topics: finalTopics,
      situationProblem: finalSituationProblem,
      rubrics: finalRubrics,
      stages: undefined,
      lessonPlan: finalLessonPlan,
    });
  }

  // Ensure all 7 official base units exist if missing
  for (const base of rawProeducadorUnits) {
    const key = getStandardUcKey(base);
    if (!seenKeys.has(key)) {
      cleaned.push(JSON.parse(JSON.stringify(base)));
      seenKeys.add(key);
    }
  }

  // Sort: 1º Semestre (FUSI, LIDT, CRD, MAP, CIEMA), then 2º Semestre (PRUSC, MINDU)
  const orderMap: Record<string, number> = {
    FUSI: 1,
    LIDT: 2,
    CRD: 3,
    MAP: 4,
    CIEMA: 5,
    PRUSC: 6,
    PROC: 6,
    MINDU: 7,
    METR: 7,
  };

  cleaned.sort((a, b) => {
    const keyA = getStandardUcKey(a);
    const keyB = getStandardUcKey(b);
    return (orderMap[keyA] || 99) - (orderMap[keyB] || 99);
  });

  return cleaned;
}

export function sanitizeSyllabi(syllabiList: Syllabus[]): Syllabus[] {
  if (!Array.isArray(syllabiList) || syllabiList.length === 0) {
    return JSON.parse(JSON.stringify(initialSyllabi));
  }

  let list = JSON.parse(JSON.stringify(syllabiList)) as Syllabus[];

  // Filter out unconfigured dummy placeholders
  list = list.filter((s) => {
    if (!s) return false;
    const isDummy =
      (s.courseTitle === "Nova Disciplina" || s.courseTitle === "NOVA DISCIPLINA") &&
      (!s.professorName || s.professorName === "Nome do Docente" || s.professorName.trim() === "");
    return !isDummy;
  });

  // Clean course titles
  list = list.map((s) => {
    if (!s) return s;
    let cleanTitle = s.courseTitle || "Mecânico de Usinagem Convencional";
    cleanTitle = cleanTitle.replace(/\s*-\s*prof\.?\s*ricardo\s*(beretella|gea)/i, "").trim();
    return {
      ...s,
      courseTitle: cleanTitle,
    };
  });

  // Guarantee both independent professor syllabi exist
  const hasBeretella = list.some(
    (s) =>
      s &&
      (s.id === "senai-usinagem-800h-beretella" ||
        (s.professorName && s.professorName.toLowerCase().includes("beretella")))
  );
  const hasGea = list.some(
    (s) =>
      s &&
      (s.id === "senai-usinagem-800h-gea" ||
        (s.professorName && s.professorName.toLowerCase().includes("gea")))
  );

  const initialBeretella = initialSyllabi.find((s) => s.id === "senai-usinagem-800h-beretella");
  const initialGea = initialSyllabi.find((s) => s.id === "senai-usinagem-800h-gea");

  if (!hasBeretella && initialBeretella) {
    list.unshift(JSON.parse(JSON.stringify(initialBeretella)));
  }
  if (!hasGea && initialGea) {
    list.push(JSON.parse(JSON.stringify(initialGea)));
  }

  // Remove obsolete single-doc syllabus if both specific ones are present
  list = list.filter((s) => s.id !== "senai-usinagem-800h");

  // Sort so official 800h courses always appear first
  list.sort((a, b) => {
    const isBaseA = a.id === "senai-usinagem-800h-beretella" ? 1 : a.id === "senai-usinagem-800h-gea" ? 2 : 3;
    const isBaseB = b.id === "senai-usinagem-800h-beretella" ? 1 : b.id === "senai-usinagem-800h-gea" ? 2 : 3;
    return isBaseA - isBaseB;
  });

  return list.map((s) => {
    if (!s) return s;

    // Preserving all user programmatic units exactly as customized, deduplicated and ordered
    let currentUnits = deduplicateAndSanitizeUnits(s.programmaticContent || []);

    // Preserving user schedule
    let currentSchedule = Array.isArray(s.schedule) && s.schedule.length > 0
      ? JSON.parse(JSON.stringify(s.schedule))
      : [];

    // ONLY generate initial default schedule & lesson plans if BOTH schedule and unit lesson plans are completely empty
    const hasAnyLessonPlans = currentUnits.some(
      (u) => Array.isArray(u.lessonPlan) && u.lessonPlan.length > 0
    );

    if (currentSchedule.length === 0 && !hasAnyLessonPlans) {
      const isGea = (s.professorName && s.professorName.toLowerCase().includes("gea")) || s.id.includes("gea");
      const targetProfessor = isGea ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella";
      const teacherRules = TEACHER_SCHEDULE_RULES.filter((r) => r.professor === targetProfessor);
      const res = generateSyllabusSchedule(
        currentUnits,
        INITIAL_SCHOOL_EVENTS_2026,
        teacherRules
      );
      currentUnits = res.updatedUnits;
      currentSchedule = res.masterSchedule;
    }

    // Preserve coursePlanData directly if user has edited it
    const finalCoursePlan = s.coursePlanData
      ? JSON.parse(JSON.stringify(s.coursePlanData))
      : JSON.parse(JSON.stringify(defaultCoursePlanData));

    return {
      ...s,
      coursePlanData: finalCoursePlan,
      programmaticContent: currentUnits,
      schedule: currentSchedule,
    };
  });
}

export function loadSyllabiFromStorage(): Syllabus[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sanitizedInitial = sanitizeSyllabi(initialSyllabi);
      saveSyllabiToStorage(sanitizedInitial);
      return sanitizedInitial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return sanitizeSyllabi(parsed);
    }
    return sanitizeSyllabi(initialSyllabi);
  } catch (e) {
    console.error("Erro ao carregar dados do localStorage", e);
    return sanitizeSyllabi(initialSyllabi);
  }
}

export function saveSyllabiToStorage(syllabi: Syllabus[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syllabi));
  } catch (e) {
    console.error("Erro ao salvar no localStorage", e);
  }
}

export function getActiveSyllabusId(defaultId: string): string {
  return localStorage.getItem(ACTIVE_ID_KEY) || defaultId;
}

export function setActiveSyllabusId(id: string): void {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

// ----------------------------------------------------
// FIREBASE CLOUD DATABASE SYNC
// ----------------------------------------------------

/**
 * Saves a single syllabus to Firestore cloud database
 */
export async function saveSyllabusToCloud(syllabus: Syllabus): Promise<boolean> {
  try {
    if (!syllabus || !syllabus.id) return false;
    const cleanData = stripUndefined(syllabus);
    // Replace full doc so modifications/deletions inside arrays/objects are cleanly persisted
    await setDoc(doc(db, "syllabi", syllabus.id), cleanData);
    console.log(`[Firebase Cloud] Syllabus salvo com sucesso: ${syllabus.id}`);
    return true;
  } catch (err) {
    console.error("Erro ao gravar syllabus no Firebase Cloud:", err);
    return false;
  }
}

export async function deleteSyllabusFromCloud(syllabusId: string): Promise<boolean> {
  try {
    if (!syllabusId) return false;
    await deleteDoc(doc(db, "syllabi", syllabusId));
    return true;
  } catch (err) {
    console.error("Erro ao excluir syllabus do Firebase Cloud:", err);
    return false;
  }
}

/**
 * Saves all syllabi list to Firestore cloud database
 */
export async function saveAllSyllabiToCloud(syllabi: Syllabus[]): Promise<boolean> {
  try {
    let allOk = true;
    for (const item of syllabi) {
      if (item && item.id) {
        const ok = await saveSyllabusToCloud(item);
        if (!ok) allOk = false;
      }
    }
    return allOk;
  } catch (err) {
    console.error("Erro ao gravar todos os syllabi no Firebase:", err);
    return false;
  }
}

/**
 * Force fetches latest documents from Firestore Cloud database
 */
export async function fetchCloudSyllabiNow(): Promise<Syllabus[] | null> {
  try {
    const syllabiCol = collection(db, "syllabi");
    const snapshot = await getDocs(syllabiCol);
    if (!snapshot.empty) {
      const list: Syllabus[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Syllabus);
      });
      const sanitized = sanitizeSyllabi(list);
      saveSyllabiToStorage(sanitized);
      return sanitized;
    }
  } catch (err) {
    console.warn("Aviso ao buscar dados imediatos do Firebase:", err);
  }
  return null;
}

/**
 * Subscribes to real-time changes in Firestore syllabi collection.
 * Syncs automatically between different computers/browsers and deployments.
 */
export function subscribeToCloudSyllabi(onUpdate: (syllabi: Syllabus[]) => void): () => void {
  try {
    const syllabiCol = collection(db, "syllabi");

    const unsubscribe = onSnapshot(
      syllabiCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Syllabus[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Syllabus);
          });
          const sanitized = sanitizeSyllabi(list);

          const hasBeretella = list.some(
            (s) =>
              s &&
              (s.id === "senai-usinagem-800h-beretella" ||
                (s.professorName && s.professorName.toLowerCase().includes("beretella")))
          );
          const hasGea = list.some(
            (s) =>
              s &&
              (s.id === "senai-usinagem-800h-gea" ||
                (s.professorName && s.professorName.toLowerCase().includes("gea")))
          );
          const initialBeretella = initialSyllabi.find((s) => s.id === "senai-usinagem-800h-beretella");
          const initialGea = initialSyllabi.find((s) => s.id === "senai-usinagem-800h-gea");

          // Clean up any unconfigured dummy placeholder from Firestore in the cloud
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Syllabus;
            if (
              data &&
              (data.courseTitle === "Nova Disciplina" || data.courseTitle === "NOVA DISCIPLINA") &&
              (!data.professorName || data.professorName === "Nome do Docente" || data.professorName.trim() === "")
            ) {
              deleteDoc(doc(db, "syllabi", docSnap.id)).catch(() => {});
            }
          });

          // If any core teacher syllabus was missing in cloud, persist them to Firestore
          if (!hasBeretella && initialBeretella) {
            saveSyllabusToCloud(initialBeretella);
          }
          if (!hasGea && initialGea) {
            saveSyllabusToCloud(initialGea);
          }

          // Check if local storage has more recent edits to avoid stale cloud overwrites
          try {
            const rawLocal = localStorage.getItem(STORAGE_KEY);
            if (rawLocal) {
              const localList: Syllabus[] = JSON.parse(rawLocal);
              const merged = sanitized.map((cloudItem) => {
                const localMatch = localList.find((loc) => loc.id === cloudItem.id);
                if (localMatch && localMatch.updatedAt && cloudItem.updatedAt) {
                  const localTime = new Date(localMatch.updatedAt).getTime();
                  const cloudTime = new Date(cloudItem.updatedAt).getTime();
                  if (localTime > cloudTime) {
                    // Local is newer: save local to cloud and keep local
                    saveSyllabusToCloud(localMatch);
                    return localMatch;
                  }
                }
                return cloudItem;
              });
              saveSyllabiToStorage(merged);
              onUpdate(merged);
              return;
            }
          } catch (e) {
            console.warn("Aviso ao comparar timestamps local/cloud:", e);
          }

          saveSyllabiToStorage(sanitized);
          onUpdate(sanitized);
        } else {
          // If cloud database is empty, seed it with local storage
          const initial = sanitizeSyllabi(loadSyllabiFromStorage());
          saveAllSyllabiToCloud(initial);
          onUpdate(initial);
        }
      },
      (error) => {
        console.warn("Aviso na sincronização do Firestore:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("Erro ao iniciar listener do Firestore:", err);
    return () => {};
  }
}

export function createEmptySyllabus(): Syllabus {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const period = `${year}.${month <= 6 ? 1 : 2}`;

  return {
    id: "syllabus-" + Date.now(),
    courseTitle: "Mecânico de Usinagem Convencional",
    courseCode: "CAI-7212-15",
    workload: "800h",
    period,
    department: "Escola SENAI Oscar Lúcio Baldan - Monte Alto/SP",
    level: "Formação Inicial e Continuada (Nível 2)",
    professorName: "Nome do Docente",
    professorEmail: "docente@sp.senai.br",
    summary: "Usinar peças em máquinas de manufatura convencional...",
    generalObjectives: "Desenvolver competências relativas à usinagem...",
    specificObjectives: ["Operar torno convencional", "Operar fresadora convencional"],
    programmaticContent: (proeducadorUnits || []).map((pu) => ({ ...pu })),
    methodology: "Metodologia SENAI de Educação Profissional (MSEP)",
    evaluationCriteria: [
      {
        id: "eval-1",
        name: "Dossiês Técnicos e Relatórios de SA",
        weight: "30%",
        description: "Qualidade dos relatórios técnicos e croquis ABNT.",
      },
      {
        id: "eval-2",
        name: "Avaliação Prática de Oficina",
        weight: "40%",
        description: "Fabricação de peças e conjuntos em tolerância dimensional.",
      },
      {
        id: "eval-3",
        name: "Rubricas Socioemocionais e Segurança",
        weight: "30%",
        description: "Postura profissional e uso de EPIs (NR-12).",
      },
    ],
    basicBibliography: ["SENAI-SP. Coleção Pedagógica Usinagem Convencional. São Paulo: Editora SENAI, 2024."],
    complementaryBibliography: ["ABNT NBR 8402. Desenho Técnico. Rio de Janeiro: ABNT."],
    schedule: [],
    coursePlanData: JSON.parse(JSON.stringify(defaultCoursePlanData)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
