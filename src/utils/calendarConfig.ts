export interface SchoolCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "feriado" | "suspensao" | "compensacao" | "balanceamento" | "inicio_fim" | "treinamento";
  description?: string;
  balanceForDayOfWeek?: number; // 1=Segunda, 2=Terça, etc.
}

export const INITIAL_SCHOOL_EVENTS_2026: SchoolCalendarEvent[] = [
  // 1º SEMESTRE 2026
  { id: "e-1-1", date: "2026-01-26", title: "Início do 1º Semestre Letivo", type: "inicio_fim" },
  { id: "e-1-2", date: "2026-02-16", title: "Carnaval - Expediente Suspenso", type: "feriado" },
  { id: "e-1-3", date: "2026-02-17", title: "Carnaval - Feriado", type: "feriado" },
  { id: "e-1-5", date: "2026-04-03", title: "Sexta-feira Santa - Feriado", type: "feriado" },
  { id: "e-1-6", date: "2026-04-21", title: "Tiradentes - Feriado Nacional", type: "feriado" },
  { id: "e-1-7", date: "2026-05-01", title: "Dia do Trabalho - Feriado", type: "feriado" },
  { id: "e-1-8", date: "2026-06-04", title: "Corpus Christi - Feriado", type: "feriado" },
  { id: "e-1-9", date: "2026-06-23", title: "Término do 1º Semestre Letivo", type: "inicio_fim" },

  // 2º SEMESTRE 2026 (SENAI CFP 6.62 Monte Alto)
  { id: "e-2-1", date: "2026-07-09", title: "Feriado Estadual - Rev. Constitucionalista", type: "feriado" },
  { id: "e-2-2", date: "2026-07-10", title: "Expediente Suspenso (Compensado em 01/08)", type: "suspensao" },
  { id: "e-2-3", date: "2026-07-22", title: "Início do 2º Semestre Letivo", type: "inicio_fim" },
  { id: "e-2-4", date: "2026-08-01", title: "Sábado de Compensação (do dia 10/07)", type: "compensacao" },
  { id: "e-2-5", date: "2026-08-05", title: "Balanceamento: Aula de Segunda-feira I", type: "balanceamento", balanceForDayOfWeek: 1 },
  { id: "e-2-6", date: "2026-08-06", title: "Feriado Municipal - Padroeiro Bom Jesus", type: "feriado" },
  { id: "e-2-7", date: "2026-08-07", title: "Expediente Suspenso (Compensado em 22/08)", type: "suspensao" },
  { id: "e-2-8", date: "2026-08-22", title: "Sábado de Compensação (do dia 07/08)", type: "compensacao" },
  { id: "e-2-9", date: "2026-08-26", title: "Balanceamento: Aula de Segunda-feira II", type: "balanceamento", balanceForDayOfWeek: 1 },
  { id: "e-2-10", date: "2026-09-07", title: "Feriado Nacional - Independência do Brasil", type: "feriado" },
  { id: "e-2-11", date: "2026-09-08", title: "Balanceamento: Aula de Terça-feira I", type: "balanceamento", balanceForDayOfWeek: 2 },
  { id: "e-2-12", date: "2026-10-03", title: "Sábado de Compensação (do dia 07/08)", type: "compensacao" },
  { id: "e-2-13", date: "2026-10-12", title: "Feriado Nacional - N. Sra. Aparecida", type: "feriado" },
  { id: "e-2-14", date: "2026-10-13", title: "Antecipação Dia do Professor (15/10)", type: "feriado" },
  { id: "e-2-15", date: "2026-10-17", title: "Sábado de Compensação (do dia 28/12)", type: "compensacao" },
  { id: "e-2-16", date: "2026-11-02", title: "Feriado Nacional - Finados", type: "feriado" },
  { id: "e-2-17", date: "2026-11-07", title: "Sábado de Compensação (do dia 29/12)", type: "compensacao" },
  { id: "e-2-18", date: "2026-11-15", title: "Feriado Nacional - Proclamação da República", type: "feriado" },
  { id: "e-2-19", date: "2026-11-20", title: "Feriado Estadual - Consciência Negra", type: "feriado" },
  { id: "e-2-20", date: "2026-11-28", title: "Sábado de Compensação (do dia 30/12)", type: "compensacao" },
  { id: "e-2-21", date: "2026-12-18", title: "Término do 2º Semestre Letivo", type: "inicio_fim" },
];

export interface TeacherWeeklyRule {
  professor: "Prof. Ricardo Beretella" | "Prof. Ricardo Gea";
  semester: "1º SEMESTRE" | "2º SEMESTRE";
  dayOfWeek: number; // 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta
  ucAcronym: string;
  hours: string;
}

export const TEACHER_SCHEDULE_RULES: TeacherWeeklyRule[] = [
  // 1º SEMESTRE - PROF. RICARDO BERETELLA
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 1, ucAcronym: "FUSI", hours: "4h" },
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 2, ucAcronym: "LIDT", hours: "2h" },
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 2, ucAcronym: "CRD", hours: "2h" },
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 3, ucAcronym: "MAP", hours: "2h" },
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 3, ucAcronym: "CIEMA", hours: "2h" },
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 4, ucAcronym: "FUSI", hours: "4h" },
  { professor: "Prof. Ricardo Beretella", semester: "1º SEMESTRE", dayOfWeek: 5, ucAcronym: "FUSI", hours: "4h" },

  // 1º SEMESTRE - PROF. RICARDO GEA
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 1, ucAcronym: "FUSI", hours: "4h" },
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 2, ucAcronym: "FUSI", hours: "4h" },
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 3, ucAcronym: "MAP", hours: "2h" },
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 3, ucAcronym: "CIEMA", hours: "2h" },
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 4, ucAcronym: "LIDT", hours: "2h" },
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 4, ucAcronym: "CRD", hours: "2h" },
  { professor: "Prof. Ricardo Gea", semester: "1º SEMESTRE", dayOfWeek: 5, ucAcronym: "FUSI", hours: "4h" },

  // 2º SEMESTRE - PROF. RICARDO BERETELLA
  { professor: "Prof. Ricardo Beretella", semester: "2º SEMESTRE", dayOfWeek: 1, ucAcronym: "MINDU", hours: "4h" },
  { professor: "Prof. Ricardo Beretella", semester: "2º SEMESTRE", dayOfWeek: 2, ucAcronym: "PRUSC", hours: "4h" },
  { professor: "Prof. Ricardo Beretella", semester: "2º SEMESTRE", dayOfWeek: 5, ucAcronym: "PRUSC", hours: "4h" },

  // 2º SEMESTRE - PROF. RICARDO GEA
  { professor: "Prof. Ricardo Gea", semester: "2º SEMESTRE", dayOfWeek: 3, ucAcronym: "MINDU", hours: "4h" },
  { professor: "Prof. Ricardo Gea", semester: "2º SEMESTRE", dayOfWeek: 4, ucAcronym: "PRUSC", hours: "4h" },
];
