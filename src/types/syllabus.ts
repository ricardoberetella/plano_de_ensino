export type ClassType =
  | "teorica"
  | "pratica"
  | "laboratorio"
  | "avaliacao"
  | "apresentacao"
  | "feriado";

export type ClassStatus = "planejada" | "concluida" | "reagendada" | "cancelada";

export type ModuleType =
  | "Módulo Básico"
  | "Módulo Introdutório"
  | "Módulo Específico"
  | "Módulo Comum";

export type UserRole = "admin" | "viewer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  unit?: string;
}

export interface EvaluationItem {
  id: string;
  name: string;
  weight: string; // e.g., "30%" or "3.0 pontos"
  description?: string;
  dueDate?: string;
}

export interface RubricItem {
  capacity: string;
  nsa: string; // Não Satisfez
  apo: string; // Apresentou com Orientação
  par: string; // Parcialmente Autônomo
  aut: string; // Autônomo
}

export interface LessonPlanItem {
  id: string;
  date: string;
  hours: string;
  capacities: string;
  conhecimentos: string;
  estrategias: string;
  recursos: string;
  professor?: string; // "Prof. Ricardo Beretella" | "Prof. Ricardo Gea"
  status?: "planejada" | "concluida" | "reagendada";
}

export interface SituationProblem {
  title: string;
  contextualization: string;
  challenge: string[];
  expectedResults: string[];
}

export interface ProgrammaticUnit {
  id: string;
  unitTitle: string;
  acronym?: string; // e.g. "LIDT", "CIEMA", "CRD", "MAP", "FUSI", "PRUSC", "MINDU"
  semester?: "1º SEMESTRE" | "2º SEMESTRE";
  module?: ModuleType;
  workload?: string; // e.g. "40h", "240h"
  objective?: string;
  basicCapacities?: string[];
  technicalCapacities?: string[];
  socioemotionalCapacities?: string[];
  topics: string[];
  situationProblem?: SituationProblem;
  rubrics?: RubricItem[];
  lessonPlan?: LessonPlanItem[];
  turmaOptions?: {
    turmaA?: { title: string; situationProblem: SituationProblem; lessonPlan: LessonPlanItem[] };
    turmaB?: { title: string; situationProblem: SituationProblem; lessonPlan: LessonPlanItem[] };
  };
}

export interface ScheduleItem {
  id: string;
  classNumber: number;
  weekNumber: number;
  date: string; // YYYY-MM-DD
  topic: string;
  unit?: string;
  type: ClassType;
  status: ClassStatus;
  activities?: string; // Tarefas, leituras ou entregas
  notes?: string;
  location?: string;
  professor?: string;
}

export interface Syllabus {
  id: string;
  courseTitle: string;
  courseCode: string;
  workload: string; // e.g. "800h"
  period: string; // e.g. "2026.1"
  department: string; // e.g. "Escola SENAI Roberto Mange - Campinas"
  level: string; // e.g. "Aprendizagem Industrial"
  professorName: string;
  professorEmail?: string;
  summary: string; // Ementa
  generalObjectives: string;
  specificObjectives: string[];
  programmaticContent: ProgrammaticUnit[];
  methodology: string;
  evaluationCriteria: EvaluationItem[];
  basicBibliography: string[];
  complementaryBibliography: string[];
  schedule: ScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = "menu" | "plano" | "unidades" | "cronograma" | "gerar_ia" | "visao_aluno";

