import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
  Save,
  X,
  FileText,
  Check,
  Search,
  Download,
  Printer,
  Calendar,
  Users,
  Award,
  AlertCircle,
  Wrench,
  ChevronRight,
  Filter,
  ChevronLeft,
  Info,
  User,
} from "lucide-react";
import {
  Syllabus,
  ProgrammaticUnit,
  UserProfile,
  RubricItem,
  LessonPlanItem,
  SituationProblem,
} from "../types/syllabus";
import { proeducadorUnits } from "../data/proeducadorData";
import {
  parseDateToISO,
  getMonthGrid,
  MONTH_NAMES_PT,
  WEEKDAY_NAMES_PT,
  getUcColor,
} from "../utils/calendarUtils";
import { printUnidadeCurricularPDF } from "../utils/exportUtils";

const renderFormattedText = (text?: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

interface UnidadesCurricularesViewProps {
  syllabus: Syllabus;
  currentUser: UserProfile;
  onUpdateSyllabus: (updated: Syllabus) => void;
  onOpenLoginModal: () => void;
  onPrint?: () => void;
  onOpenExport?: () => void;
}

export const UnidadesCurricularesView: React.FC<UnidadesCurricularesViewProps> = ({
  syllabus,
  currentUser,
  onUpdateSyllabus,
  onOpenLoginModal,
  onPrint,
  onOpenExport,
}) => {
  // Use syllabus.programmaticContent directly as the source of truth so user edits persist
  const units = React.useMemo(() => {
    if (syllabus && Array.isArray(syllabus.programmaticContent) && syllabus.programmaticContent.length > 0) {
      return syllabus.programmaticContent;
    }
    return proeducadorUnits || [];
  }, [syllabus?.programmaticContent]);

  const isAdmin = currentUser?.role === "admin";

  // Semester state: "1º SEMESTRE" | "2º SEMESTRE"
  const [selectedSemester, setSelectedSemester] = useState<"1º SEMESTRE" | "2º SEMESTRE">("1º SEMESTRE");

  // Selected UC ID
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  // Inner UC Tab state
  const [activeUcTab, setActiveUcTab] = useState<
    "GERAL" | "SITUAÇÃO-PROBLEMA" | "RUBRICAS" | "PLANO DE ENSINO" | "CRONOGRAMA"
  >("GERAL");

  // UC Calendar state
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Helper to compute acronym for a UC
  const getAcronym = (unit?: ProgrammaticUnit | null): string => {
    if (!unit) return "UC";
    const title = (unit.unitTitle || "").toUpperCase();
    const ac = (unit.acronym || "").toUpperCase();
    if (ac === "PROC" || ac === "PRUSC" || title.includes("PROCESSOS")) return "PRUSC";
    if (ac === "METR" || ac === "MINDU" || title.includes("METROLOGIA")) return "MINDU";
    if (ac === "LIDT" || title.includes("LEITURA")) return "LIDT";
    if (ac === "CIEMA" || title.includes("CIÊNCIAS") || title.includes("CIENCIAS")) return "CIEMA";
    if (ac === "CRD" || ac === "CDMAT" || title.includes("CONTROLE")) return "CRD";
    if (ac === "MAP" || title.includes("MATEMÁTICA") || title.includes("MATEMATICA")) return "MAP";
    if (ac === "FUSI" || title.includes("FUNDAMENTOS")) return "FUSI";
    if (ac) return ac;
    return title ? title.substring(0, 5) : "UC";
  };

  // Filter UCs by selected semester
  const filteredSemesterUnits = (units || []).filter((u) => {
    if (!u) return false;
    const ac = getAcronym(u);
    if (selectedSemester === "1º SEMESTRE") {
      return !["PRUSC", "MINDU"].includes(ac);
    } else {
      return ["PRUSC", "MINDU"].includes(ac);
    }
  });

  // Fallback to all units if filtered is unexpectedly empty
  const semesterUnits = filteredSemesterUnits.length > 0 ? filteredSemesterUnits : units;

  // Effective selected unit or first available in filtered semester
  const currentUnit =
    semesterUnits.find((u) => u && u.id === selectedUnitId) ||
    semesterUnits[0] ||
    units[0] ||
    (proeducadorUnits || [])[0];

  // Default matching unit from proeducadorUnits as a fallback for missing nested objects
  const defaultMatchingUnit = (proeducadorUnits || []).find(
    (pu) =>
      pu.id === currentUnit?.id ||
      pu.acronym === currentUnit?.acronym ||
      getAcronym(pu) === getAcronym(currentUnit)
  ) || (proeducadorUnits || [])[0];

  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});

  // Search state for Plano de Aula / Calendário
  const [lessonPlanSearch, setLessonPlanSearch] = useState("");

  // Topic Inline Edit state
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
  const [editingTopicText, setEditingTopicText] = useState("");

  // Helper to update current unit in syllabus
  const handleUpdateCurrentUnit = (updatedUnit: ProgrammaticUnit) => {
    const updatedList = units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
    onUpdateSyllabus({
      ...syllabus,
      programmaticContent: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle topic deletion
  const handleDeleteTopic = (index: number) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (!currentUnit) return;
    const currentTopics = currentUnit.topics || defaultMatchingUnit.topics || [];
    const nextTopics = currentTopics.filter((_, i) => i !== index);
    handleUpdateCurrentUnit({ ...currentUnit, topics: nextTopics });
  };

  // Handle saving topic edit
  const handleSaveTopicEdit = (index: number) => {
    if (!currentUnit || !editingTopicText.trim()) return;
    const currentTopics = currentUnit.topics || defaultMatchingUnit.topics || [];
    const nextTopics = [...currentTopics];
    nextTopics[index] = editingTopicText.trim();
    handleUpdateCurrentUnit({ ...currentUnit, topics: nextTopics });
    setEditingTopicIndex(null);
  };

  // Active Situation-Problem with automatic fallback
  const activeSituationProblem: SituationProblem =
    currentUnit?.situationProblem || defaultMatchingUnit?.situationProblem || {
      title: `Situação de Aprendizagem - ${currentUnit?.unitTitle || "UC"}`,
      contextualization: "Otimização de processos produtivos na fábrica.",
      challenge: ["Analisar especificações técnicas e executar o plano."],
      expectedResults: ["Relatório técnico e inspeção dimensional."],
    };

  // Situation Problem Edit State
  const [isSPModalOpen, setIsSPModalOpen] = useState(false);
  const [spForm, setSPForm] = useState<SituationProblem>({
    title: "",
    contextualization: "",
    challenge: [],
    expectedResults: [],
  });

  const handleOpenEditSP = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (currentUnit?.situationProblem) {
      setSPForm({
        title: currentUnit.situationProblem.title || "",
        contextualization: currentUnit.situationProblem.contextualization || "",
        challenge: currentUnit.situationProblem.challenge ? [...currentUnit.situationProblem.challenge] : [""],
        expectedResults: currentUnit.situationProblem.expectedResults ? [...currentUnit.situationProblem.expectedResults] : [""],
      });
    } else {
      setSPForm({
        title: `Situação de Aprendizagem - ${currentUnit?.unitTitle || "UC"}`,
        contextualization: "Empresa parceira necessita de suporte técnico para otimização dos processos produtivos e garantia de qualidade.",
        challenge: [
          "Analisar as especificações técnicas e normas aplicáveis.",
          "Executar o planejamento e acompanhamento dos procedimentos práticos.",
        ],
        expectedResults: [
          "Entregável concluído dentro dos padrões de qualidade.",
          "Relatório de inspeção e verificação de conformidade.",
        ],
      });
    }
    setIsSPModalOpen(true);
  };

  const handleSaveSP = () => {
    if (!currentUnit) return;
    const cleanedSP: SituationProblem = {
      title: spForm.title.trim() || `Situação de Aprendizagem - ${currentUnit.unitTitle}`,
      contextualization: spForm.contextualization.trim(),
      challenge: spForm.challenge.map((c) => c.trim()).filter(Boolean),
      expectedResults: spForm.expectedResults.map((r) => r.trim()).filter(Boolean),
    };
    handleUpdateCurrentUnit({
      ...currentUnit,
      situationProblem: cleanedSP,
    });
    setIsSPModalOpen(false);
  };

  // Rubric Edit State
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [editingRubricIndex, setEditingRubricIndex] = useState<number | null>(null);
  const [rubricForm, setRubricForm] = useState<RubricItem>({
    capacity: "",
    nsa: "",
    apo: "",
    par: "",
    aut: "",
  });

  const handleOpenAddRubric = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingRubricIndex(null);
    setRubricForm({
      capacity: "",
      nsa: "Não atendeu aos critérios mínimos estabelecidos para a capacidade.",
      apo: "Demonstrou a capacidade mediante orientação e suporte técnico contínuo do docente.",
      par: "Demonstrou a capacidade de forma parcialmente autônoma com pequenos ajustes.",
      aut: "Demonstrou a capacidade de forma plena, autônoma e com rigorosa precisão.",
    });
    setIsRubricModalOpen(true);
  };

  const handleOpenEditRubric = (index: number, rubric: RubricItem) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingRubricIndex(index);
    setRubricForm({ ...rubric });
    setIsRubricModalOpen(true);
  };

  const handleSaveRubric = () => {
    if (!currentUnit) return;
    const currentList = currentUnit.rubrics || [];
    let nextList: RubricItem[] = [];

    if (editingRubricIndex !== null) {
      nextList = currentList.map((item, idx) => (idx === editingRubricIndex ? { ...rubricForm } : item));
    } else {
      nextList = [...currentList, { ...rubricForm }];
    }

    handleUpdateCurrentUnit({
      ...currentUnit,
      rubrics: nextList,
    });
    setIsRubricModalOpen(false);
  };

  const handleDeleteRubric = (index: number) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (!currentUnit) return;
    const nextList = (currentUnit.rubrics || []).filter((_, idx) => idx !== index);
    handleUpdateCurrentUnit({
      ...currentUnit,
      rubrics: nextList,
    });
  };

  // Lesson Plan Editing / Creation state
  const [editingLesson, setEditingLesson] = useState<LessonPlanItem | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<Partial<LessonPlanItem>>({
    date: "",
    hours: "4h",
    professor: "Prof. Ricardo Beretella",
    conhecimentos: "",
    estrategias: "",
    recursos: "Laboratório / Oficina de Usinagem, ferramentas e EPIs",
    capacities: "Demonstrar conhecimento técnico e visão operacional",
  });

  const handleOpenAddLesson = (defaultDate?: string) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingLesson(null);
    setLessonForm({
      date: defaultDate || "12/08/2026",
      hours: "4h",
      professor: currentUser?.name?.includes("Gea") ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella",
      conhecimentos: "",
      estrategias: "Apresentação expositiva dialogada e prática supervisionada em oficina.",
      recursos: "Máquinas, ferramentas de usinagem, paquímetro e EPIs.",
      capacities: "Demonstrar responsabilidade e autocontrole operacional.",
    });
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonPlanItem) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingLesson(lesson);
    setLessonForm({ ...lesson });
    setIsLessonModalOpen(true);
  };

  const handleSaveLessonModal = () => {
    if (!currentUnit) return;
    const currentList = currentUnit.lessonPlan || [];

    if (editingLesson) {
      const nextList = currentList.map((item) =>
        item.id === editingLesson.id
          ? {
              ...item,
              date: lessonForm.date || item.date,
              hours: lessonForm.hours || item.hours,
              professor: lessonForm.professor || item.professor,
              conhecimentos: lessonForm.conhecimentos || item.conhecimentos,
              estrategias: lessonForm.estrategias || item.estrategias,
              recursos: lessonForm.recursos || item.recursos,
              capacities: lessonForm.capacities || item.capacities,
            }
          : item
      );
      handleUpdateCurrentUnit({ ...currentUnit, lessonPlan: nextList });
    } else {
      const newItem: LessonPlanItem = {
        id: `lp-${Date.now()}`,
        date: lessonForm.date || "12/08/2026",
        hours: lessonForm.hours || "4h",
        professor: lessonForm.professor || "Prof. Ricardo Beretella",
        conhecimentos: lessonForm.conhecimentos || "Novo tópico lecionado",
        estrategias: lessonForm.estrategias || "Prática em bancada e oficina.",
        recursos: lessonForm.recursos || "Ferramentas manuais e máquinas.",
        capacities: lessonForm.capacities || "Demonstrar visão sistêmica.",
      };
      handleUpdateCurrentUnit({ ...currentUnit, lessonPlan: [...currentList, newItem] });
    }

    setIsLessonModalOpen(false);
  };

  const handleDeleteLessonItem = (lessonId: string) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (!currentUnit) return;
    const nextList = (currentUnit.lessonPlan || []).filter((item) => item.id !== lessonId);
    handleUpdateCurrentUnit({ ...currentUnit, lessonPlan: nextList });
  };

  const handleToggleLessonOk = (lessonId: string) => {
    if (!currentUnit) return;
    const nextList = (currentUnit.lessonPlan || []).map((item) => {
      if (item.id === lessonId) {
        return {
          ...item,
          status: item.status === "concluida" ? ("planejada" as const) : ("concluida" as const),
        };
      }
      return item;
    });
    handleUpdateCurrentUnit({ ...currentUnit, lessonPlan: nextList });
  };

  // Professor Profile Filter state
  const [selectedProfessorFilter, setSelectedProfessorFilter] = useState<string>(() => {
    if (currentUser?.name?.toLowerCase().includes("gea")) return "Prof. Ricardo Gea";
    if (currentUser?.name?.toLowerCase().includes("beretella")) return "Prof. Ricardo Beretella";
    return "todos";
  });

  useEffect(() => {
    if (currentUser?.name?.toLowerCase().includes("gea")) {
      setSelectedProfessorFilter("Prof. Ricardo Gea");
    } else if (currentUser?.name?.toLowerCase().includes("beretella")) {
      setSelectedProfessorFilter("Prof. Ricardo Beretella");
    }
  }, [currentUser]);

  // Active Lesson Plan filtered by selected professor
  const rawLessonPlan: LessonPlanItem[] =
    currentUnit && Array.isArray(currentUnit.lessonPlan)
      ? currentUnit.lessonPlan
      : (defaultMatchingUnit?.lessonPlan || []);

  const activeLessonPlan = rawLessonPlan.filter((item) => {
    if (!item) return false;
    if (selectedProfessorFilter === "todos") return true;
    const targetProf = selectedProfessorFilter.replace("Prof. ", "").trim().toLowerCase();
    if (!item.professor || typeof item.professor !== "string" || item.professor.trim() === "") {
      // If item has no professor tag, default it to item ID convention or match if active
      return item.id?.toLowerCase().includes(targetProf.includes("gea") ? "gea" : "beretella");
    }
    return item.professor.toLowerCase().includes(targetProf);
  });

  // Calculate total hours/aulas in the current unit schedule
  const totalLessonHours = activeLessonPlan.reduce((sum, lesson) => {
    const h = lesson?.hours;
    if (typeof h === "number") return sum + h;
    if (typeof h === "string") {
      const match = h.match(/\d+/);
      return sum + (match ? parseInt(match[0], 10) : 4);
    }
    return sum + 4;
  }, 0);

  // Filtered lesson plan search
  const filteredLessonPlan = activeLessonPlan.filter(
    (item) =>
      item &&
      (((item.conhecimentos || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())) ||
        ((item.estrategias || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())) ||
        ((item.date || "").toString().includes(lessonPlanSearch)) ||
        ((item.professor || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())) ||
        ((item.capacities || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Semester Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
            SEMESTRE DO CURSO:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setSelectedSemester("1º SEMESTRE");
                const first1st = units.find((u) => {
                  const ac = getAcronym(u);
                  return !["PRUSC", "MINDU"].includes(ac);
                });
                if (first1st) setSelectedUnitId(first1st.id);
              }}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedSemester === "1º SEMESTRE"
                  ? "bg-blue-600 text-white shadow-md font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              1º SEMESTRE (JAN - JUN)
            </button>
            <button
              onClick={() => {
                setSelectedSemester("2º SEMESTRE");
                const first2nd = units.find((u) => {
                  const ac = getAcronym(u);
                  return ["PRUSC", "MINDU"].includes(ac);
                });
                if (first2nd) setSelectedUnitId(first2nd.id);
              }}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedSemester === "2º SEMESTRE"
                  ? "bg-blue-600 text-white shadow-md font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              2º SEMESTRE (JUL - DEZ)
            </button>
          </div>

          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch (e) {
                console.error(e);
              }
              window.location.reload();
            }}
            title="Restaurar Unidades Curriculares Padrão SENAI"
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Restaurar UCs</span>
          </button>
        </div>
      </div>

      {/* UC Acronym Buttons Pills Row for Selected Semester */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {semesterUnits.map((unit) => {
          const acronym = getAcronym(unit);
          const isSelected = unit.id === (currentUnit?.id || selectedUnitId);

          return (
            <button
              key={unit.id}
              onClick={() => setSelectedUnitId(unit.id)}
              className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 border flex items-center gap-2 ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/40"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400"
              }`}
            >
              <span>{acronym}</span>
              {unit.workload && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                    isSelected ? "bg-blue-700 text-blue-100" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {unit.workload}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Selected UC Main Card Container */}
      {currentUnit && (
        <div className="bg-[#0b1226] text-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-800">
          
          {/* Dark Header Banner */}
          <div className="p-8 sm:p-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-3.5 py-1 bg-[#22c55e] text-slate-950 font-black text-[11px] rounded-lg uppercase tracking-wider shadow-sm">
                  {getAcronym(currentUnit)}
                </span>
                {currentUnit.workload && (
                  <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 font-bold text-[11px] rounded-lg uppercase">
                    Carga Horária Total: {currentUnit.workload}
                  </span>
                )}
                {selectedProfessorFilter !== "todos" && (
                  <span className="inline-block px-3 py-1 bg-blue-900/90 text-blue-200 border border-blue-700/80 font-black text-[11px] rounded-lg uppercase shadow-xs">
                    Seus Encontros ({selectedProfessorFilter}): {activeLessonPlan.length} Dias de Aula ({activeLessonPlan.reduce((acc, lp) => acc + (parseInt(String(lp?.hours || "").replace(/\D/g, ""), 10) || 0), 0)}h)
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase leading-tight text-white">
              {currentUnit.unitTitle}
            </h1>

            {currentUnit.objective && (
              <p className="text-slate-300 text-sm leading-relaxed max-w-4xl font-medium">
                {currentUnit.objective}
              </p>
            )}
          </div>

          {/* 4. Inner Navigation Tabs (GERAL, SITUAÇÃO-PROBLEMA, RUBRICAS, PLANO DE AULA, CALENDÁRIO) */}
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 gap-3 py-1 sm:py-0">
              <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none">
                {(
                  [
                    "GERAL",
                    "SITUAÇÃO-PROBLEMA",
                    "RUBRICAS",
                    "PLANO DE ENSINO",
                    "CRONOGRAMA",
                  ] as const
                ).map((tab) => {
                  const isTabActive = activeUcTab === tab;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveUcTab(tab)}
                      className={`py-4 px-3 sm:px-4 font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-2 ${
                        isTabActive
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 font-black"
                          : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {tab === "SITUAÇÃO-PROBLEMA" && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      {tab === "RUBRICAS" && <Award className="w-3.5 h-3.5 text-emerald-500" />}
                      {tab === "PLANO DE ENSINO" && <BookOpen className="w-3.5 h-3.5 text-blue-500" />}
                      {tab === "CRONOGRAMA" && <Calendar className="w-3.5 h-3.5 text-purple-500" />}
                      <span>{tab === "CRONOGRAMA" ? "CALENDÁRIO" : tab === "PLANO DE ENSINO" ? "PLANO DE AULA/CRONOGRAMA" : tab}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Button: Imprimir */}
              <div className="flex items-center gap-2 py-2 sm:py-2 shrink-0">
                <button
                  onClick={() => {
                    if (currentUnit) {
                      const activeProf = selectedProfessorFilter !== "todos"
                        ? selectedProfessorFilter
                        : (currentUser?.name?.toLowerCase().includes("gea") ? "Prof. Ricardo Gea" : (syllabus.professorName || "Prof. Ricardo Beretella"));
                      printUnidadeCurricularPDF(currentUnit, syllabus, activeProf);
                    } else if (onPrint) {
                      onPrint();
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-xs"
                  title="Imprimir Plano de Ensino em PDF"
                >
                  <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>IMPRIMIR PDF</span>
                </button>
              </div>
            </div>

            {/* Tab Body Content */}
            <div className="p-6 sm:p-10 text-slate-900 dark:text-slate-100 space-y-8">
              
              {/* TAB 1: GERAL */}
              {activeUcTab === "GERAL" && (
                <div className="space-y-10">
                  
                  {/* Capacities Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Capacidades Básicas / Técnicas */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>
                            {currentUnit.technicalCapacities ? "CAPACIDADES TÉCNICAS" : "CAPACIDADES BÁSICAS"}
                          </span>
                        </h3>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              const promptText = prompt("Digite a nova Capacidade:");
                              if (promptText && promptText.trim()) {
                                if (currentUnit.technicalCapacities) {
                                  handleUpdateCurrentUnit({
                                    ...currentUnit,
                                    technicalCapacities: [
                                      ...currentUnit.technicalCapacities,
                                      promptText.trim(),
                                    ],
                                  });
                                } else {
                                  handleUpdateCurrentUnit({
                                    ...currentUnit,
                                    basicCapacities: [
                                      ...(currentUnit.basicCapacities || []),
                                      promptText.trim(),
                                    ],
                                  });
                                }
                              }
                            }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADICIONAR</span>
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] space-y-2">
                        {(Array.isArray(currentUnit?.technicalCapacities) ? currentUnit.technicalCapacities : Array.isArray(currentUnit?.basicCapacities) ? currentUnit.basicCapacities : (defaultMatchingUnit?.technicalCapacities || defaultMatchingUnit?.basicCapacities || [])).length > 0 ? (
                          (Array.isArray(currentUnit?.technicalCapacities) ? currentUnit.technicalCapacities : Array.isArray(currentUnit?.basicCapacities) ? currentUnit.basicCapacities : (defaultMatchingUnit?.technicalCapacities || defaultMatchingUnit?.basicCapacities || [])).map((cap, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2"
                            >
                              <span>{cap}</span>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    if (currentUnit.technicalCapacities) {
                                      const next = currentUnit.technicalCapacities.filter((_, idx) => idx !== i);
                                      handleUpdateCurrentUnit({ ...currentUnit, technicalCapacities: next });
                                    } else if (currentUnit.basicCapacities) {
                                      const next = currentUnit.basicCapacities.filter((_, idx) => idx !== i);
                                      handleUpdateCurrentUnit({ ...currentUnit, basicCapacities: next });
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-bold text-slate-400 italic py-4 text-center">
                            Nenhuma capacidade cadastrada.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Capacidades Socioemocionais */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>CAPACIDADES SOCIOEMOCIONAIS</span>
                        </h3>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              const promptText = prompt("Digite a nova Capacidade Socioemocional:");
                              if (promptText && promptText.trim()) {
                                handleUpdateCurrentUnit({
                                  ...currentUnit,
                                  socioemotionalCapacities: [
                                    ...(currentUnit.socioemotionalCapacities || []),
                                    promptText.trim(),
                                  ],
                                });
                              }
                            }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADICIONAR</span>
                          </button>
                        )}
                      </div>

                      {/* Socioemotional Capacities List */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] space-y-2">
                        {(Array.isArray(currentUnit?.socioemotionalCapacities) ? currentUnit.socioemotionalCapacities : defaultMatchingUnit?.socioemotionalCapacities || []).length > 0 ? (
                          (Array.isArray(currentUnit?.socioemotionalCapacities) ? currentUnit.socioemotionalCapacities : defaultMatchingUnit?.socioemotionalCapacities || []).map((cap, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2"
                            >
                              <span>{cap}</span>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    const next = currentUnit.socioemotionalCapacities?.filter(
                                      (_, idx) => idx !== i
                                    );
                                    handleUpdateCurrentUnit({
                                      ...currentUnit,
                                      socioemotionalCapacities: next,
                                    });
                                  }}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-bold text-slate-400 italic py-4 text-center">
                            Nenhuma capacidade socioemocional cadastrada.
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Conhecimentos Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>CONHECIMENTOS & TÓPICOS PROGRAMÁTICOS</span>
                      </h3>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            const promptText = prompt("Digite o novo Tópico / Conhecimento:");
                            if (promptText && promptText.trim()) {
                              handleUpdateCurrentUnit({
                                ...currentUnit,
                                topics: [...(currentUnit.topics || []), promptText.trim()],
                              });
                            }
                          }}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>ADICIONAR CONHECIMENTO</span>
                        </button>
                      )}
                    </div>

                    {/* Topics List */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] space-y-2">
                      {(Array.isArray(currentUnit?.topics) ? currentUnit.topics : defaultMatchingUnit?.topics || []).length > 0 ? (
                        (Array.isArray(currentUnit?.topics) ? currentUnit.topics : defaultMatchingUnit?.topics || []).map((topic, i) => (
                          <div
                            key={i}
                            className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 group"
                          >
                            {editingTopicIndex === i ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingTopicText}
                                  onChange={(e) => setEditingTopicText(e.target.value)}
                                  className="flex-1 px-3 py-1.5 border border-blue-500 rounded-lg font-bold text-xs bg-slate-50 dark:bg-slate-800"
                                />
                                <button
                                  onClick={() => handleSaveTopicEdit(i)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditingTopicIndex(null)}
                                  className="text-xs text-slate-500 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="leading-relaxed">{topic}</span>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditingTopicIndex(i);
                                        setEditingTopicText(topic);
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTopic(i)}
                                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic py-6 text-center">
                          Nenhum conhecimento ou tópico cadastrado para esta Unidade.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: SITUAÇÃO-PROBLEMA */}
              {activeUcTab === "SITUAÇÃO-PROBLEMA" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {activeSituationProblem ? (
                    <div className="space-y-8">
                      
                      {/* SP Header Box */}
                      <div className="bg-gradient-to-br from-slate-900 to-[#0b1226] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-lg space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4" />
                            <span>Situação de Aprendizagem (S.A.) SENAI</span>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={handleOpenEditSP}
                              className="self-start sm:self-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>EDITAR SITUAÇÃO-PROBLEMA</span>
                            </button>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                          {activeSituationProblem.title}
                        </h2>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 leading-relaxed font-medium">
                          <span className="font-bold text-white uppercase block mb-1">Contextualização da Empresa:</span>
                          {activeSituationProblem.contextualization}
                        </div>
                      </div>

                      {/* Desafios Checklist */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-blue-600" />
                          <span>DESAFIOS PRÁTICOS & ETAPAS DE EXECUÇÃO</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                          {(Array.isArray(activeSituationProblem?.challenge) ? activeSituationProblem.challenge : []).map((step, idx) => {
                            const isDone = completedChallenges[`${currentUnit.id}-${idx}`] || false;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (!isAdmin) return;
                                  setCompletedChallenges((prev) => ({
                                    ...prev,
                                    [`${currentUnit.id}-${idx}`]: !isDone,
                                  }));
                                }}
                                className={`p-5 rounded-2xl border transition-all ${isAdmin ? 'cursor-pointer' : 'cursor-default'} flex items-start gap-4 ${
                                  isDone
                                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200"
                                    : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                                    isDone
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                  }`}
                                >
                                  {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <div className="text-xs font-bold leading-relaxed flex-1">
                                  {step}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Resultados Esperados */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>ENTREGÁVEIS & RESULTADOS ESPERADOS</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(Array.isArray(activeSituationProblem?.expectedResults) ? activeSituationProblem.expectedResults : []).map((res, idx) => (
                            <div
                              key={idx}
                              className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                                0{idx + 1}
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                                {res}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-10 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                      <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="text-base font-extrabold text-slate-900 dark:text-white uppercase">
                        Elaboração de Situação-Problema
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                        Esta Unidade Curricular aceita o cadastro de uma Situação de Aprendizagem no padrão SENAI.
                      </p>
                      {isAdmin && (
                        <button
                          onClick={handleOpenEditSP}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>CADASTRAR SITUAÇÃO-PROBLEMA</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RUBRICAS */}
              {activeUcTab === "RUBRICAS" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <span>Matriz de Rubricas de Desempenho (MSEP SENAI)</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Critérios objetivos de avaliação por níveis de autonomia e competência
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="hidden lg:flex items-center gap-2 text-[11px] font-extrabold">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md">NSA</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">APO</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">PAR</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">AUT</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={handleOpenAddRubric}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>NOVA RUBRICA</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rubrics Table / Cards */}
                  {(Array.isArray(currentUnit?.rubrics) ? currentUnit.rubrics : defaultMatchingUnit?.rubrics || []).length > 0 ? (
                    <div className="space-y-6">
                      {(Array.isArray(currentUnit?.rubrics) ? currentUnit.rubrics : defaultMatchingUnit?.rubrics || []).map((rubric, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                        >
                          <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                            <span className="font-black text-xs uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <span>{rubric.capacity}</span>
                            </span>
                            {isAdmin && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditRubric(idx, rubric)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Editar Rubrica"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRubric(idx)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir Rubrica"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* NSA */}
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-950/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-black text-[10px] rounded-md uppercase">
                                  NSA (Não Satisfez)
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                {rubric.nsa}
                              </p>
                            </div>

                            {/* APO */}
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-950/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-[10px] rounded-md uppercase">
                                  APO (Com Orientação)
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                {rubric.apo}
                              </p>
                            </div>

                            {/* PAR */}
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-950/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-[10px] rounded-md uppercase">
                                  PAR (Parcial. Autônomo)
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                {rubric.par}
                              </p>
                            </div>

                            {/* AUT */}
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-950/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] rounded-md uppercase">
                                  AUT (Autônomo)
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                {rubric.aut}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
                      <Award className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div className="text-base font-extrabold text-slate-900 dark:text-white uppercase">
                        Rubricas de Avaliação
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                        Nenhuma rubrica cadastrada nesta Unidade Curricular. Clique abaixo para cadastrar os critérios MSEP SENAI.
                      </p>
                      <button
                        onClick={handleOpenAddRubric}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>CADASTRAR PRIMEIRA RUBRICA</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PLANO DE ENSINO */}
              {activeUcTab === "PLANO DE ENSINO" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span>PLANO DE AULA CRONOGRAMA {totalLessonHours} AULAS - {currentUnit.unitTitle}</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Sequência didática diária, estratégias e recursos instrucionais SENAI
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      {/* Search Bar */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Buscar por data, conteúdo..."
                          value={lessonPlanSearch}
                          onChange={(e) => setLessonPlanSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Add Lesson Button for Admin */}
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenAddLesson()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Aula / Encontro</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Schedule Table */}
                  <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="p-4 w-32 whitespace-nowrap">Horas/Aulas/Data</th>
                          <th className="p-4">Capacidades</th>
                          <th className="p-4">Conhecimentos</th>
                          <th className="p-4">Estratégias</th>
                          <th className="p-4 hidden md:table-cell">Recursos/Ambientes</th>
                          <th className="p-3 w-24 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        {filteredLessonPlan.length > 0 ? (
                          filteredLessonPlan.map((lesson) => {
                            const isOk = lesson.status === "concluida";
                            return (
                              <tr
                                key={lesson.id}
                                className={`transition-all ${
                                  isOk
                                    ? "bg-emerald-100/90 dark:bg-emerald-950/70 border-l-4 border-l-emerald-500 font-medium"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                }`}
                              >
                                {/* 1. Horas/Aulas/Data */}
                                <td className="p-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap align-top">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{lesson.date}</span>
                                  </div>
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold text-[10px] mt-1 inline-block">
                                    {lesson.hours}
                                  </span>
                                </td>

                                {/* 2. Capacidades */}
                                <td className="p-4 text-slate-700 dark:text-slate-200 font-semibold leading-relaxed align-top">
                                  {renderFormattedText(lesson.capacities || "Demonstrar capacidades técnicas e socioemocionais")}
                                </td>

                                {/* 3. Conhecimentos */}
                                <td className="p-4 font-bold text-slate-800 dark:text-slate-100 align-top">
                                  <div className="leading-relaxed">{renderFormattedText(lesson.conhecimentos)}</div>
                                </td>

                                {/* 4. Estratégias */}
                                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium leading-relaxed align-top">
                                  {renderFormattedText(lesson.estrategias)}
                                </td>

                                {/* 5. Recursos/Ambientes */}
                                <td className="p-4 text-slate-500 dark:text-slate-400 font-medium hidden md:table-cell align-top">
                                  {lesson.recursos}
                                </td>

                                {/* 6. Ações */}
                                <td className="p-2 text-center whitespace-nowrap align-top">
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        handleToggleLessonOk(lesson.id);
                                      }}
                                      className={`px-3 py-1 rounded-lg font-black text-xs flex items-center gap-1 transition-all shadow-xs ${isAdmin ? 'cursor-pointer' : 'cursor-default'} ${
                                        isOk
                                          ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-400"
                                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white"
                                      }`}
                                      title={isAdmin ? (isOk ? "Aula Concluída (Clique para desmarcar)" : "Dar OK (Marcar Aula como Concluída)") : "Status da Aula"}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{isOk ? "OK!" : "OK"}</span>
                                    </button>

                                    {isAdmin && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleOpenEditLesson(lesson)}
                                          className="p-1.2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors cursor-pointer"
                                          title="Editar esta aula"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLessonItem(lesson.id)}
                                          className="p-1.2 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors cursor-pointer"
                                          title="Excluir aula"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-bold italic">
                              Nenhuma aula encontrada para o filtro.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: CRONOGRAMA (CALENDÁRIO DA UNIDADE) */}
              {activeUcTab === "CRONOGRAMA" && (() => {
                const ucIndex = units.findIndex((u) => u.id === currentUnit.id);
                const ucColor = getUcColor(ucIndex >= 0 ? ucIndex : 0);
                const ucAcronym = getAcronym(currentUnit);

                // Map of ISO date -> LessonPlanItem
                const lessonByIsoDate: Record<string, LessonPlanItem> = {};
                activeLessonPlan.forEach((item) => {
                  if (!item || !item.date) return;
                  const iso = parseDateToISO(item.date);
                  if (iso) lessonByIsoDate[iso] = item;
                });

                // Calendar months filtered by semester (1º Semestre: Jan-Jun | 2º Semestre: Jul-Dez)
                const is2ndSem = selectedSemester === "2º SEMESTRE" || ["PRUSC", "MINDU"].includes(ucAcronym);
                const monthIndices = is2ndSem ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];

                const selectedLessonDetail = selectedCalendarDate ? lessonByIsoDate[selectedCalendarDate] : null;

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Calendar Header */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-1 text-xs font-black rounded-lg ${ucColor.bg} ${ucColor.text}`}>
                            {ucAcronym}
                          </span>
                          <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                            Cronograma em Calendário – {currentUnit.unitTitle}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Mapeamento visual dos dias de aula da UC ({activeLessonPlan.length} encontros cadastrados)
                        </p>
                      </div>
                    </div>

                    {/* 12 Month Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {monthIndices.map((mIdx) => {
                        const monthName = MONTH_NAMES_PT[mIdx];
                        const grid = getMonthGrid(2026, mIdx);

                        return (
                          <div
                            key={mIdx}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                                {monthName} 2026
                              </h3>
                            </div>

                            {/* Weekday Labels */}
                            <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              {WEEKDAY_NAMES_PT.map((dayName) => (
                                <div key={dayName} className="py-1">{dayName}</div>
                              ))}
                            </div>

                            {/* Day Cells Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                              {grid.map((cell, cIdx) => {
                                if (!cell.isCurrentMonth || !cell.dayNumber || !cell.isoDate) {
                                  return <div key={cIdx} className="h-9 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl opacity-30" />;
                                }

                                const lesson = lessonByIsoDate[cell.isoDate];
                                const isSelected = selectedCalendarDate === cell.isoDate;

                                return (
                                  <button
                                    key={cIdx}
                                    onClick={() => setSelectedCalendarDate(cell.isoDate)}
                                    className={`h-9 rounded-xl font-extrabold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                                      lesson
                                        ? `${ucColor.bg} ${ucColor.text} shadow-xs ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-600`
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    } ${isSelected ? "scale-105 ring-2 ring-amber-400" : ""}`}
                                    title={lesson ? `Aula de ${ucAcronym}: ${lesson.conhecimentos}` : `Dia ${cell.dayNumber}`}
                                  >
                                    <span className="text-xs">{cell.dayNumber}</span>
                                    {lesson && (
                                      <span className="text-[9px] font-black tracking-tighter opacity-90 leading-none">
                                        {lesson.hours}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Date Detail Drawer / Box */}
                    {selectedLessonDetail ? (
                      <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-lg border border-blue-800 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-xl uppercase">
                              AULA EM {selectedLessonDetail.date} ({selectedLessonDetail.hours})
                            </span>
                            <span className="text-xs font-extrabold text-blue-200">
                              UC: {currentUnit.unitTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenEditLesson(selectedLessonDetail)}
                                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Editar Aula</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedCalendarDate(null)}
                              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4 text-blue-200" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black tracking-wider text-blue-300">Conhecimentos / Conteúdo</span>
                            <p className="font-bold text-sm text-white leading-snug">{selectedLessonDetail.conhecimentos}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black tracking-wider text-blue-300">Estratégia Didática</span>
                            <p className="font-medium text-blue-100">{selectedLessonDetail.estrategias}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black tracking-wider text-blue-300">Recursos / Ambientes</span>
                            <p className="font-medium text-blue-100">{selectedLessonDetail.recursos}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                        <span>
                          {selectedCalendarDate ? `Dia ${selectedCalendarDate.split("-").reverse().join("/")} sem aula agendada para esta UC.` : "Clique em um dia no calendário para ver os detalhes ou agendar a aula."}
                        </span>
                        {isAdmin && selectedCalendarDate && (
                          <button
                            onClick={() => {
                              const parts = selectedCalendarDate.split("-");
                              const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedCalendarDate;
                              handleOpenAddLesson(formatted);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Agendar Aula Neste Dia</span>
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })()}

            </div>
          </div>

        </div>
      )}

      {/* Edit / Add Lesson Plan Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>{editingLesson ? "Editar Encontro do Cronograma" : "Adicionar Encontro ao Cronograma"}</span>
              </h3>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Data do Encontro (DD/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    value={lessonForm.date || ""}
                    onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                    placeholder="Ex: 25/03/2026"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Carga Horária
                  </label>
                  <select
                    value={lessonForm.hours || "4h"}
                    onChange={(e) => setLessonForm({ ...lessonForm, hours: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1h">1h</option>
                    <option value="2h">2h</option>
                    <option value="3h">3h</option>
                    <option value="4h">4h</option>
                    <option value="8h">8h</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Docente Responsável
                  </label>
                  <select
                    value={lessonForm.professor || "Prof. Ricardo Beretella"}
                    onChange={(e) => setLessonForm({ ...lessonForm, professor: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Prof. Ricardo Beretella">Prof. Ricardo Beretella</option>
                    <option value="Prof. Ricardo Gea">Prof. Ricardo Gea</option>
                    <option value="Prof. Ricardo Beretella / Prof. Ricardo Gea">Ambos os Docentes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Conteúdo Programático / Conhecimentos Tópicos
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.conhecimentos || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, conhecimentos: e.target.value })}
                  placeholder="Digite o conteúdo detalhado lecionado nesta aula..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Estratégia Didática & Metodologia
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.estrategias || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, estrategias: e.target.value })}
                  placeholder="Ex: Aula prática em oficina, usinagem de eixos, resolução de problema..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Recursos Instrucionais / Ambientes
                </label>
                <input
                  type="text"
                  value={lessonForm.recursos || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, recursos: e.target.value })}
                  placeholder="Ex: Torno convencional, Paquímetro 0.02mm, EPIs, Óleo solúvel"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Capacidades Associadas (opcional)
                </label>
                <input
                  type="text"
                  value={lessonForm.capacities || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, capacities: e.target.value })}
                  placeholder="Ex: Demonstrar responsabilidade e autocontrole dimensional"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLessonModal}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Encontro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Editar Situação-Problema (S.A.) */}
      {isSPModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Editar Situação-Problema (S.A.)
                </h3>
              </div>
              <button
                onClick={() => setIsSPModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Título da Situação de Aprendizagem
                </label>
                <input
                  type="text"
                  value={spForm.title}
                  onChange={(e) => setSPForm({ ...spForm, title: e.target.value })}
                  placeholder="Ex: Situação de Aprendizagem - Metrologia Industrial"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Contextualização da Empresa
                </label>
                <textarea
                  rows={4}
                  value={spForm.contextualization}
                  onChange={(e) => setSPForm({ ...spForm, contextualization: e.target.value })}
                  placeholder="Descreva o cenário da empresa, o problema técnico e o contexto operacional..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Desafios Práticos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Desafios Práticos & Etapas de Execução
                  </label>
                  <button
                    onClick={() => setSPForm({ ...spForm, challenge: [...spForm.challenge, ""] })}
                    className="text-[11px] font-extrabold text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Etapa</span>
                  </button>
                </div>
                {spForm.challenge.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => {
                        const updated = [...spForm.challenge];
                        updated[idx] = e.target.value;
                        setSPForm({ ...spForm, challenge: updated });
                      }}
                      placeholder={`Etapa ${idx + 1}...`}
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={() => {
                        const updated = spForm.challenge.filter((_, i) => i !== idx);
                        setSPForm({ ...spForm, challenge: updated });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Resultados Esperados */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Entregáveis & Resultados Esperados
                  </label>
                  <button
                    onClick={() => setSPForm({ ...spForm, expectedResults: [...spForm.expectedResults, ""] })}
                    className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Resultado</span>
                  </button>
                </div>
                {spForm.expectedResults.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={r}
                      onChange={(e) => {
                        const updated = [...spForm.expectedResults];
                        updated[idx] = e.target.value;
                        setSPForm({ ...spForm, expectedResults: updated });
                      }}
                      placeholder={`Resultado Esperado ${idx + 1}...`}
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => {
                        const updated = spForm.expectedResults.filter((_, i) => i !== idx);
                        setSPForm({ ...spForm, expectedResults: updated });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsSPModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSP}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Situação-Problema</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Editar / Criar Rubrica */}
      {isRubricModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {editingRubricIndex !== null ? "Editar Rubrica MSEP SENAI" : "Nova Rubrica MSEP SENAI"}
                </h3>
              </div>
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Capacidade / Competência Avaliada
                </label>
                <input
                  type="text"
                  value={rubricForm.capacity}
                  onChange={(e) => setRubricForm({ ...rubricForm, capacity: e.target.value })}
                  placeholder="Ex: Executar medições direcionadas com instrumentos de precisão..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* NSA */}
              <div>
                <label className="block text-[10px] font-black uppercase text-red-600 mb-1">
                  NSA - Não Satisfez
                </label>
                <textarea
                  rows={2}
                  value={rubricForm.nsa}
                  onChange={(e) => setRubricForm({ ...rubricForm, nsa: e.target.value })}
                  placeholder="Descreva o critério para quando o aluno não atinge o desempenho mínimo..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* APO */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-600 mb-1">
                  APO - Com Orientação (Apresentou com Apoio)
                </label>
                <textarea
                  rows={2}
                  value={rubricForm.apo}
                  onChange={(e) => setRubricForm({ ...rubricForm, apo: e.target.value })}
                  placeholder="Descreva o critério para quando o aluno demonstra a capacidade com auxílio..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* PAR */}
              <div>
                <label className="block text-[10px] font-black uppercase text-blue-600 mb-1">
                  PAR - Parcialmente Autônomo
                </label>
                <textarea
                  rows={2}
                  value={rubricForm.par}
                  onChange={(e) => setRubricForm({ ...rubricForm, par: e.target.value })}
                  placeholder="Descreva o critério para quando o aluno é parcialmente autônomo..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* AUT */}
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1">
                  AUT - Autônomo (Excelência)
                </label>
                <textarea
                  rows={2}
                  value={rubricForm.aut}
                  onChange={(e) => setRubricForm({ ...rubricForm, aut: e.target.value })}
                  placeholder="Descreva o critério para quando o aluno demonstra total autonomia..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRubric}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Rubrica</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
