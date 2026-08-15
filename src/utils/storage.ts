import { collection, doc, setDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Syllabus } from "../types/syllabus";
import { initialSyllabi } from "../data/mockSyllabi";
import { proeducadorUnits } from "../data/proeducadorData";

const STORAGE_KEY = "plano_ensino_app_data_v100_reset";
const ACTIVE_ID_KEY = "plano_ensino_active_id_v100";

// Remove undefined values to prevent Firestore serialization errors
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function sanitizeSyllabi(syllabiList: Syllabus[]): Syllabus[] {
  if (!Array.isArray(syllabiList) || syllabiList.length === 0) {
    return sanitizeSyllabi(initialSyllabi);
  }

  return syllabiList.map((s) => {
    let rawContent = Array.isArray(s?.programmaticContent) ? s.programmaticContent : [];
    let currentUnits = rawContent.filter(
      (u) =>
        u &&
        u.unitTitle &&
        u.acronym !== "NOVA" &&
        !u.unitTitle.toLowerCase().includes("nova unidade") &&
        u.unitTitle.toLowerCase() !== "nova"
    );

    // Guarantee all default units from proeducadorUnits are present
    for (const defaultUnit of proeducadorUnits || []) {
      if (!defaultUnit) continue;
      const exists = currentUnits.some(
        (u) =>
          u &&
          (u.id === defaultUnit.id ||
            u.acronym === defaultUnit.acronym ||
            (u.unitTitle && defaultUnit.unitTitle && u.unitTitle.toLowerCase().trim() === defaultUnit.unitTitle.toLowerCase().trim()))
      );
      if (!exists) {
        currentUnits.push(defaultUnit);
      }
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

      const defaultUnit = proeducadorUnits.find((pu) => pu.id === unitId || pu.acronym === ac);
      
      let lessonPlan = rest.lessonPlan;
      if (!lessonPlan || lessonPlan.length === 0 || (defaultUnit?.lessonPlan && lessonPlan.length < defaultUnit.lessonPlan.length)) {
        lessonPlan = defaultUnit?.lessonPlan || [];
      }

      const situationProblem = rest.situationProblem || defaultUnit?.situationProblem;
      const rubrics = (rest.rubrics && rest.rubrics.length > 0) ? rest.rubrics : (defaultUnit?.rubrics || []);

      return {
        ...rest,
        id: unitId,
        unitTitle: rest.unitTitle || defaultUnit?.unitTitle,
        acronym: ac,
        semester: sem,
        workload: rest.workload || defaultUnit?.workload,
        objective: rest.objective || defaultUnit?.objective,
        basicCapacities: rest.basicCapacities || defaultUnit?.basicCapacities,
        socioemotionalCapacities: rest.socioemotionalCapacities || defaultUnit?.socioemotionalCapacities,
        technicalCapacities: rest.technicalCapacities || defaultUnit?.technicalCapacities,
        topics: (rest.topics && rest.topics.length > 0) ? rest.topics : (defaultUnit?.topics || []),
        lessonPlan,
        situationProblem,
        rubrics,
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

    return {
      ...s,
      programmaticContent: uniqueUnits,
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
export async function saveSyllabusToCloud(syllabus: Syllabus): Promise<void> {
  try {
    if (!syllabus || !syllabus.id) return;
    const cleanData = stripUndefined(syllabus);
    await setDoc(doc(db, "syllabi", syllabus.id), cleanData, { merge: true });
  } catch (err) {
    console.error("Erro ao gravar syllabus no Firebase Cloud:", err);
  }
}

/**
 * Saves all syllabi list to Firestore cloud database
 */
export async function saveAllSyllabiToCloud(syllabi: Syllabus[]): Promise<void> {
  try {
    for (const item of syllabi) {
      if (item && item.id) {
        await saveSyllabusToCloud(item);
      }
    }
  } catch (err) {
    console.error("Erro ao gravar todos os syllabi no Firebase:", err);
  }
}

/**
 * Subscribes to real-time changes in Firestore syllabi collection.
 * Syncs automatically between different computers/browsers.
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
    courseTitle: "Nova Disciplina",
    courseCode: "DISC-101",
    workload: "60h",
    period,
    department: "Departamento Geral",
    level: "Graduação",
    professorName: "Nome do Docente",
    professorEmail: "docente@universidade.edu.br",
    summary: "Digite aqui a ementa da disciplina...",
    generalObjectives: "Digite o objetivo geral...",
    specificObjectives: ["Objetivo específico 1", "Objetivo específico 2"],
    programmaticContent: [
      {
        id: "unit-1-" + Date.now(),
        unitTitle: "Unidade I: Introdução aos Conceitos Fundamentais",
        topics: ["Tópico 1.1", "Tópico 1.2"],
      },
    ],
    methodology: "Aulas expositivas e práticas com uso de tecnologia.",
    evaluationCriteria: [
      {
        id: "eval-1",
        name: "Avaliação Teórica",
        weight: "50%",
        description: "Prova individual escrita.",
      },
      {
        id: "eval-2",
        name: "Trabalhos Práticos",
        weight: "50%",
        description: "Exercícios e entregas em grupo.",
      },
    ],
    basicBibliography: ["AUTOR, Nome. Título do Livro Principal. 1. ed. Cidade: Editora, 2024."],
    complementaryBibliography: ["AUTOR, Nome. Título do Livro Complementar. 1. ed. Cidade: Editora, 2023."],
    schedule: [
      {
        id: "class-1-" + Date.now(),
        classNumber: 1,
        weekNumber: 1,
        date: new Date().toISOString().split("T")[0],
        topic: "Apresentação da Disciplina e Visão Geral",
        unit: "Unidade I",
        type: "teorica",
        status: "planejada",
        activities: "Leitura da ementa",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
