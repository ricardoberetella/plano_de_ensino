import { Syllabus } from "../types/syllabus";
import { rawProeducadorUnits } from "./proeducadorData";
import { generateSyllabusSchedule } from "../utils/scheduleGenerator";
import { INITIAL_SCHOOL_EVENTS_2026, TEACHER_SCHEDULE_RULES } from "../utils/calendarConfig";

// Generate independent schedule and lesson plans for Prof. Ricardo Beretella
const beretellaRules = TEACHER_SCHEDULE_RULES.filter(
  (r) => r.professor === "Prof. Ricardo Beretella"
);
const { updatedUnits: beretellaUnits, masterSchedule: beretellaSchedule } =
  generateSyllabusSchedule(
    JSON.parse(JSON.stringify(rawProeducadorUnits)),
    INITIAL_SCHOOL_EVENTS_2026,
    beretellaRules
  );

// Generate independent schedule and lesson plans for Prof. Ricardo Gea
const geaRules = TEACHER_SCHEDULE_RULES.filter(
  (r) => r.professor === "Prof. Ricardo Gea"
);
const { updatedUnits: geaUnits, masterSchedule: geaSchedule } =
  generateSyllabusSchedule(
    JSON.parse(JSON.stringify(rawProeducadorUnits)),
    INITIAL_SCHOOL_EVENTS_2026,
    geaRules
  );

export const initialSyllabi: Syllabus[] = [
  {
    id: "senai-usinagem-800h-beretella",
    courseTitle: "Mecânico de Usinagem Convencional - Prof. Ricardo Beretella",
    courseCode: "CAI-7212-15",
    workload: "800h (400h 1º Termo / 400h 2º Termo)",
    period: "2026/1 - Aprendizagem Industrial",
    department: "Escola SENAI Oscar Lúcio Baldan - CFP 6.62 - Monte Alto/SP",
    level: "Formação Inicial e Continuada (Nível 2)",
    professorName: "Prof. Ricardo Beretella",
    professorEmail: "ricardo.beretella@sp.senai.br",
    summary:
      "Usinar peças em máquinas de manufatura convencional da indústria metalmecânica (tornos, fresadoras, furadeiras, retificadoras e serras) de acordo com os conceitos de ESG, especificações, procedimentos e normas técnicas, ambientais, de qualidade e de saúde e segurança no trabalho.",
    generalObjectives:
      "Desenvolver competências relativas à usinagem de peças em máquinas de manufatura convencional da indústria metalmecânica de acordo com os conceitos de ESG, especificações técnicas, procedimentos de segurança e normas ambientais e de qualidade.",
    specificObjectives: [
      "Operar torno convencional definindo parâmetros, torneando e controlando a qualidade das peças.",
      "Operar fresadora convencional definindo processos, fresando e aplicando refrigeração adequada.",
      "Operar retíficas convencionais cilíndrica e plana executando balanceamento e dressamento de rebolo.",
      "Ajustar peças e conjuntos utilizando ferramentas manuais, bancada de ajustagem e instrumentos de metrologia.",
      "Controlar a qualidade dimensional e geométrica utilizando instrumentos da ordem direta, indireta, rugosímetros e braços de medição.",
      "Desenvolver competências transversais em desenvolvimento pessoal, comunicação, letramento digital e segurança no trabalho (NR-12, NR-15 e NR-06).",
    ],
    programmaticContent: beretellaUnits,
    methodology:
      "Metodologia SENAI de Educação Profissional (MSEP) com foco em Situações de Aprendizagem (S.A.) desafiadoras, estudos de caso industriais, projetos integradores em equipe, simulações de cenários fabris e práticas de oficina supervisionadas.",
    evaluationCriteria: [
      { id: "ev-1", name: "Dossiês Técnicos e Relatórios de SA", weight: "30%", description: "Qualidade dos relatórios técnicos, croquis ABNT e justificativas de projeto." },
      { id: "ev-2", name: "Avaliação Prática de Oficina (Torno e Fresadora)", weight: "40%", description: "Fabricação de peças e conjuntos em conformidade dimensional H7/g6 e rugosidade Ra." },
      { id: "ev-3", name: "Rubricas Socioemocionais e Segurança (NR-12)", weight: "30%", description: "Postura profissional, trabalho em equipe, organização da bancada e uso dos EPIs." },
    ],
    basicBibliography: [
      "SENAI-SP. Coleção Pedagógica Usinagem Convencional: Torneamento, Fresamento e Retificação. São Paulo: Editora SENAI, 2024.",
      "PROEDUCADOR SENAI. SMO Usinagem Convencional - Cronograma Integrador e MSEP. Brasília, 2026.",
      "NOVAIS, A. Metrologia Industrial e Controle Dimensional. São Paulo: Érica, 2022.",
    ],
    complementaryBibliography: [
      "HIBBELER, R. C. Resistência dos Materiais e Ciências dos Materiais. 10. ed. São Paulo: Pearson, 2020.",
      "ABNT NBR 8402 / NBR 10067. Desenho Técnico e Projeções Ortogonais. Rio de Janeiro: ABNT.",
      "CALLISTER, W. D. Ciência e Engenharia de Materiais: Uma Introdução. 9. ed. LTC, 2018.",
    ],
    schedule: beretellaSchedule,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "senai-usinagem-800h-gea",
    courseTitle: "Mecânico de Usinagem Convencional - Prof. Ricardo Gea",
    courseCode: "CAI-7212-15",
    workload: "800h (400h 1º Termo / 400h 2º Termo)",
    period: "2026/1 - Aprendizagem Industrial",
    department: "Escola SENAI Oscar Lúcio Baldan - CFP 6.62 - Monte Alto/SP",
    level: "Formação Inicial e Continuada (Nível 2)",
    professorName: "Prof. Ricardo Gea",
    professorEmail: "ricardo.gea@sp.senai.br",
    summary:
      "Usinar peças em máquinas de manufatura convencional da indústria metalmecânica (tornos, fresadoras, furadeiras, retificadoras e serras) de acordo com os conceitos de ESG, especificações, procedimentos e normas técnicas, ambientais, de qualidade e de saúde e segurança no trabalho.",
    generalObjectives:
      "Desenvolver competências relativas à usinagem de peças em máquinas de manufatura convencional da indústria metalmecânica de acordo com os conceitos de ESG, especificações técnicas, procedimentos de segurança e normas ambientais e de qualidade.",
    specificObjectives: [
      "Operar torno convencional definindo parâmetros, torneando e controlando a qualidade das peças.",
      "Operar fresadora convencional definindo processos, fresando e aplicando refrigeração adequada.",
      "Operar retíficas convencionais cilíndrica e plana executando balanceamento e dressamento de rebolo.",
      "Ajustar peças e conjuntos utilizando ferramentas manuais, bancada de ajustagem e instrumentos de metrologia.",
      "Controlar a qualidade dimensional e geométrica utilizando instrumentos da ordem direta, indireta, rugosímetros e braços de medição.",
      "Desenvolver competências transversais em desenvolvimento pessoal, comunicação, letramento digital e segurança no trabalho (NR-12, NR-15 e NR-06).",
    ],
    programmaticContent: geaUnits,
    methodology:
      "Metodologia SENAI de Educação Profissional (MSEP) com foco em Situações de Aprendizagem (S.A.) desafiadoras, estudos de caso industriais, projetos integradores em equipe, simulações de cenários fabris e práticas de oficina supervisionadas.",
    evaluationCriteria: [
      { id: "ev-1", name: "Dossiês Técnicos e Relatórios de SA", weight: "30%", description: "Qualidade dos relatórios técnicos, croquis ABNT e justificativas de projeto." },
      { id: "ev-2", name: "Avaliação Prática de Oficina (Torno e Fresadora)", weight: "40%", description: "Fabricação de peças e conjuntos em conformidade dimensional H7/g6 e rugosidade Ra." },
      { id: "ev-3", name: "Rubricas Socioemocionais e Segurança (NR-12)", weight: "30%", description: "Postura profissional, trabalho em equipe, organização da bancada e uso dos EPIs." },
    ],
    basicBibliography: [
      "SENAI-SP. Coleção Pedagógica Usinagem Convencional: Torneamento, Fresamento e Retificação. São Paulo: Editora SENAI, 2024.",
      "PROEDUCADOR SENAI. SMO Usinagem Convencional - Cronograma Integrador e MSEP. Brasília, 2026.",
      "NOVAIS, A. Metrologia Industrial e Controle Dimensional. São Paulo: Érica, 2022.",
    ],
    complementaryBibliography: [
      "HIBBELER, R. C. Resistência dos Materiais e Ciências dos Materiais. 10. ed. São Paulo: Pearson, 2020.",
      "ABNT NBR 8402 / NBR 10067. Desenho Técnico e Projeções Ortogonais. Rio de Janeiro: ABNT.",
      "CALLISTER, W. D. Ciência e Engenharia de Materiais: Uma Introdução. 9. ed. LTC, 2018.",
    ],
    schedule: geaSchedule,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
