import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Syllabus } from "../types/syllabus";
import { initialSyllabi } from "../data/mockSyllabi";
import { proeducadorUnits, defaultCoursePlanData } from "../data/proeducadorData";
import { generateSyllabusSchedule } from "./scheduleGenerator";
import { INITIAL_SCHOOL_EVENTS_2026, TEACHER_SCHEDULE_RULES } from "./calendarConfig";

const STORAGE_KEY = "senai_plano_ensino_persistent_data";
const ACTIVE_ID_KEY = "senai_plano_ensino_active_id";

// Remove undefined values to prevent Firestore serialization errors
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function sanitizeSyllabi(syllabiList: Syllabus[]): Syllabus[] {
  if (!Array.isArray(syllabiList) || syllabiList.length === 0) {
    return initialSyllabi;
  }

  let list = [...syllabiList];

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
    list.unshift(initialBeretella);
  }
  if (!hasGea && initialGea) {
    list.push(initialGea);
  }

  // Remove obsolete single-doc syllabus if both specific ones are present
  list = list.filter((s) => s.id !== "senai-usinagem-800h");

  return list.map((s) => {
    let currentUnits = Array.isArray(s?.programmaticContent) ? s.programmaticContent : [];

    // Clean any invalid units
    currentUnits = currentUnits.filter(
      (u) =>
        u &&
        u.unitTitle &&
        u.acronym !== "NOVA" &&
        !u.unitTitle.toLowerCase().includes("nova unidade") &&
        u.unitTitle.toLowerCase() !== "nova"
    );

    // If there are no units at all in programmaticContent, initialize with proeducadorUnits
    if (currentUnits.length === 0) {
      currentUnits = (proeducadorUnits || []).map((pu) => ({ ...pu }));
    }

    const sanitizedUnits = currentUnits.map((u) => {
      let ac = u.acronym;
      let unitId = u.id;
      const title = (u.unitTitle || "").toUpperCase();
      if (unitId === "uc-proc" || title.includes("PROCESSOS") || ac === "PROC" || ac === "PRUSC") {
        ac = "PRUSC";
        unitId = "uc-proc";
      } else if (unitId === "uc-metr" || title.includes("METROLOGIA") || ac === "METR" || ac === "MINDU") {
        ac = "MINDU";
        unitId = "uc-metr";
      } else if (unitId === "uc-fusi" || title.includes("FUNDAMENTOS")) {
        ac = "FUSI";
        unitId = "uc-fusi";
      } else if (unitId === "uc-lidt" || title.includes("LEITURA")) {
        ac = "LIDT";
        unitId = "uc-lidt";
      } else if (unitId === "uc-ciema" || title.includes("CIÊNCIAS") || title.includes("CIENCIAS")) {
        ac = "CIEMA";
        unitId = "uc-ciema";
      } else if (unitId === "uc-crd" || unitId === "uc-cdmat" || title.includes("CONTROLE") || ac === "CDMAT" || ac === "CRD") {
        ac = "CRD";
        unitId = "uc-crd";
      } else if (unitId === "uc-map" || title.includes("MATEMÁTICA") || title.includes("MATEMATICA") || ac === "MAP") {
        ac = "MAP";
        unitId = "uc-map";
      }

      let sem: "1º SEMESTRE" | "2º SEMESTRE" = u.semester || "1º SEMESTRE";
      if (["PRUSC", "MINDU"].includes(ac)) {
        sem = "2º SEMESTRE";
      } else if (["LIDT", "CIEMA", "CRD", "MAP", "FUSI"].includes(ac)) {
        sem = "1º SEMESTRE";
      }

      const { module, turmaOptions, ...rest } = u as any;

      return {
        ...rest,
        id: unitId,
        unitTitle: rest.unitTitle,
        acronym: ac,
        semester: sem,
        workload: rest.workload,
        objective: rest.objective,
        basicCapacities: Array.isArray(rest.basicCapacities) ? rest.basicCapacities : undefined,
        socioemotionalCapacities: Array.isArray(rest.socioemotionalCapacities) ? rest.socioemotionalCapacities : undefined,
        technicalCapacities: Array.isArray(rest.technicalCapacities) ? rest.technicalCapacities : undefined,
        topics: Array.isArray(rest.topics) ? rest.topics : [],
        lessonPlan: Array.isArray(rest.lessonPlan) ? rest.lessonPlan : [],
        situationProblem: rest.situationProblem,
        rubrics: Array.isArray(rest.rubrics) ? rest.rubrics : [],
      };
    });

    // Deduplicate units by id
    const uniqueUnits: any[] = [];
    const seenIds = new Set<string>();
    for (const unit of sanitizedUnits) {
      if (!seenIds.has(unit.id)) {
        seenIds.add(unit.id);
        uniqueUnits.push(unit);
      }
    }

    // Determine active professor and teacher schedule rules
    const isGea = (s.professorName && s.professorName.toLowerCase().includes("gea")) || s.id.includes("gea");
    const targetProfessor = isGea ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella";
    const teacherRules = TEACHER_SCHEDULE_RULES.filter((r) => r.professor === targetProfessor);

    // Check if the syllabus already has populated lesson plans
    const hasExistingLessons = uniqueUnits.some(
      (u) => Array.isArray(u.lessonPlan) && u.lessonPlan.length > 0
    );

    let syncedUnits = uniqueUnits;
    let syncedSchedule = s.schedule || [];

    // Only auto-generate initial schedule if the syllabus has never been initialized with lesson plans
    if (!hasExistingLessons) {
      const res = generateSyllabusSchedule(
        uniqueUnits,
        INITIAL_SCHOOL_EVENTS_2026,
        teacherRules
      );
      syncedUnits = res.updatedUnits;
      syncedSchedule = res.masterSchedule;
    }

    // Ensure coursePlanData is always available
    const preservedCoursePlan = s.coursePlanData
      ? {
          introducao: { ...defaultCoursePlanData.introducao, ...(s.coursePlanData.introducao || {}) },
          perfilProfissional: { ...defaultCoursePlanData.perfilProfissional, ...(s.coursePlanData.perfilProfissional || {}) },
          requisitosAcesso: { ...defaultCoursePlanData.requisitosAcesso, ...(s.coursePlanData.requisitosAcesso || {}) },
          desenvolvimentoMetodologico: { ...defaultCoursePlanData.desenvolvimentoMetodologico, ...(s.coursePlanData.desenvolvimentoMetodologico || {}) },
          persona: { ...defaultCoursePlanData.persona, ...(s.coursePlanData.persona || {}) },
        }
      : JSON.parse(JSON.stringify(defaultCoursePlanData));

    return {
      ...s,
      coursePlanData: preservedCoursePlan,
      programmaticContent: syncedUnits,
      schedule: syncedSchedule,
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
    await setDoc(doc(db, "syllabi", syllabus.id), cleanData, { merge: true });
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
 * Syncs automatically between different computers/browsers and Netlify deployments.
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
          saveSyllabiToStorage(sanitized);
          onUpdate(sanitized);
        } else {
          // If cloud database is empty, seed it with initial syllabi
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
