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
    if (!s) return s;

    // Preserving all user programmatic units exactly as customized
    let currentUnits = Array.isArray(s.programmaticContent) && s.programmaticContent.length > 0
      ? s.programmaticContent
      : (proeducadorUnits || []).map((pu) => ({ ...pu }));

    // Preserving user schedule
    let currentSchedule = Array.isArray(s.schedule) && s.schedule.length > 0
      ? s.schedule
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
    const finalCoursePlan = s.coursePlanData || JSON.parse(JSON.stringify(defaultCoursePlanData));

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
