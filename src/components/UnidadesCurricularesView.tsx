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
  RefreshCw,
  Copy,
  ArrowRightLeft,
  Share2,
  Sliders,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  Syllabus,
  ProgrammaticUnit,
  UserProfile,
  RubricItem,
  LessonPlanItem,
  SituationProblem,
} from "../types/syllabus";
import { proeducadorUnits, rawProeducadorUnits } from "../data/proeducadorData";
import { deduplicateAndSanitizeUnits, getStandardUcKey } from "../utils/storage";
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

export function parseDateSortKey(dateStr?: string): number {
  if (!dateStr || typeof dateStr !== "string") return 9999999999999;
  const iso = parseDateToISO(dateStr);
  if (iso) {
    return new Date(iso + "T12:00:00").getTime();
  }
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    let year = match[3] ? parseInt(match[3], 10) : 2026;
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day, 12, 0, 0).getTime();
  }
  return 9999999999999;
}

export const STAGE_THEMES = [
  {
    stageNum: 1,
    badge: "bg-blue-600 text-white",
    bg: "bg-blue-600",
    lightBg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    ring: "ring-blue-400 dark:ring-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    hoverBg: "hover:bg-blue-700",
    pillBg: "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200",
    dot: "bg-blue-500",
    tag: "E1 • Turma A",
    label: "Etapa 1: Turma A - Torneamento - Capacidades Básicas",
  },
  {
    stageNum: 2,
    badge: "bg-emerald-600 text-white",
    bg: "bg-emerald-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-400 dark:ring-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-700",
    pillBg: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
    tag: "E2 • Turma B",
    label: "Etapa 2: Turma B - Fresagem - Capacidades Básicas",
  },
  {
    stageNum: 3,
    badge: "bg-purple-600 text-white",
    bg: "bg-purple-600",
    lightBg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
    ring: "ring-purple-400 dark:ring-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    hoverBg: "hover:bg-purple-700",
    pillBg: "bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200",
    dot: "bg-purple-500",
    tag: "E3 • Turma A",
    label: "Etapa 3: Turma A - Torneamento - Capacidades Técnicas",
  },
  {
    stageNum: 4,
    badge: "bg-amber-600 text-white",
    bg: "bg-amber-600",
    lightBg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-400 dark:ring-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    hoverBg: "hover:bg-amber-700",
    pillBg: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
    tag: "E4 • Turma B",
    label: "Etapa 4: Turma B - Fresagem - Capacidades Técnicas",
  },
];

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
  // Use sanitized programmaticContent directly as the source of truth so user edits persist cleanly
  const units = React.useMemo(() => {
    if (syllabus && Array.isArray(syllabus.programmaticContent) && syllabus.programmaticContent.length > 0) {
      return deduplicateAndSanitizeUnits(syllabus.programmaticContent);
    }
    return JSON.parse(JSON.stringify(rawProeducadorUnits || []));
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

  // Helper to compute standard acronym for a UC
  const getAcronym = (unit?: ProgrammaticUnit | null): string => {
    if (!unit) return "UC";
    return getStandardUcKey(unit);
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

  // Stage Selector State (for multi-stage UCs like FUSI)
  const [selectedStageId, setSelectedStageId] = useState<string>("");

  // Keep selected stage in sync when unit or active professor in sidebar changes
  useEffect(() => {
    if (currentUnit?.stages && currentUnit.stages.length > 0) {
      const isGea = currentUser?.name?.toLowerCase().includes("gea");
      const isBeretella = currentUser?.name?.toLowerCase().includes("beretella");

      let matchingStage = null;
      if (isGea) {
        matchingStage = currentUnit.stages.find(
          (s) => s.turma === "Turma B" || s.title?.toLowerCase().includes("turma b") || s.title?.toLowerCase().includes("fresagem")
        );
      } else if (isBeretella) {
        matchingStage = currentUnit.stages.find(
          (s) => s.turma === "Turma A" || s.title?.toLowerCase().includes("turma a") || s.title?.toLowerCase().includes("torneamento")
        );
      }

      if (matchingStage) {
        setSelectedStageId(matchingStage.id);
      } else if (!selectedStageId || !currentUnit.stages.some((s) => s.id === selectedStageId)) {
        setSelectedStageId(currentUnit.stages[0].id);
      }
    } else {
      setSelectedStageId("");
    }
  }, [currentUnit?.id, currentUnit?.stages, currentUser?.name]);

  const activeStage =
    currentUnit?.stages && currentUnit.stages.length > 0
      ? currentUnit.stages.find((s) => s.id === selectedStageId) || currentUnit.stages[0]
      : null;

  // Helper to update current unit in syllabus (with stage support)
  const handleUpdateCurrentUnit = (updatedUnit: ProgrammaticUnit) => {
    const updatedList = units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
    onUpdateSyllabus({
      ...syllabus,
      programmaticContent: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to update active stage within current unit
  const handleUpdateActiveStage = (stageUpdates: Partial<typeof activeStage>) => {
    if (!currentUnit || !activeStage) return;
    const nextStages = (currentUnit.stages || []).map((s) =>
      s.id === activeStage.id ? { ...s, ...stageUpdates } : s
    );
    handleUpdateCurrentUnit({
      ...currentUnit,
      stages: nextStages as any,
    });
  };

  // Active Primary Capacities based on Stage or Unit
  const activePrimaryCapacities: string[] = activeStage
    ? (activeStage.basicCapacities && activeStage.basicCapacities.length > 0
        ? activeStage.basicCapacities
        : activeStage.technicalCapacities || [])
    : (currentUnit?.technicalCapacities && currentUnit.technicalCapacities.length > 0
        ? currentUnit.technicalCapacities
        : currentUnit?.basicCapacities || defaultMatchingUnit?.technicalCapacities || defaultMatchingUnit?.basicCapacities || []);

  const activePrimaryLabel = activeStage
    ? "CAPACIDADES BÁSICAS & TÉCNICAS DA ETAPA"
    : (currentUnit?.technicalCapacities && currentUnit.technicalCapacities.length > 0
        ? "CAPACIDADES TÉCNICAS"
        : "CAPACIDADES BÁSICAS");

  const activeSocioemotionalCapacities: string[] =
    (activeStage?.socioemotionalCapacities && activeStage.socioemotionalCapacities.length > 0
      ? activeStage.socioemotionalCapacities
      : currentUnit?.socioemotionalCapacities || defaultMatchingUnit?.socioemotionalCapacities) || [];

  const activeTopicsList: string[] =
    (activeStage?.topics && activeStage.topics.length > 0
      ? activeStage.topics
      : currentUnit?.topics || defaultMatchingUnit?.topics) || [];

  // 1. TOPICS (CONHECIMENTOS) MODAL STATE
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
  const [topicModalText, setTopicModalText] = useState("");

  const handleOpenAddTopic = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingTopicIndex(null);
    setTopicModalText("");
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (index: number, currentText: string) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingTopicIndex(index);
    setTopicModalText(currentText);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopicModal = () => {
    if (!currentUnit || !topicModalText.trim()) return;
    const text = topicModalText.trim();
    const isAdding = editingTopicIndex === null;

    if (activeStage) {
      const currentTopics = [...(activeStage.topics || [])];
      const nextTopics = isAdding
        ? [...currentTopics, text]
        : currentTopics.map((t, idx) => (idx === editingTopicIndex ? text : t));
      handleUpdateActiveStage({ topics: nextTopics });
    } else {
      const nextTopics = isAdding
        ? [...(currentUnit.topics || []), text]
        : (currentUnit.topics || []).map((t, idx) => (idx === editingTopicIndex ? text : t));
      handleUpdateCurrentUnit({ ...currentUnit, topics: nextTopics });
    }

    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = (index: number) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (!currentUnit) return;
    const currentTopics = activeTopicsList;
    const nextTopics = currentTopics.filter((_, i) => i !== index);
    if (activeStage) {
      handleUpdateActiveStage({ topics: nextTopics });
    } else {
      handleUpdateCurrentUnit({ ...currentUnit, topics: nextTopics });
    }
  };

  // 2. CAPACITIES (BÁSICAS/TÉCNICAS E SOCIOEMOCIONAIS) MODAL STATE
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [editingCapacityIndex, setEditingCapacityIndex] = useState<number | null>(null);
  const [capacityCategory, setCapacityCategory] = useState<"basic_technical" | "socioemotional">("basic_technical");
  const [capacityModalText, setCapacityModalText] = useState("");

  const handleOpenAddCapacity = (category: "basic_technical" | "socioemotional") => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingCapacityIndex(null);
    setCapacityCategory(category);
    setCapacityModalText("");
    setIsCapacityModalOpen(true);
  };

  const handleOpenEditCapacity = (category: "basic_technical" | "socioemotional", index: number, currentText: string) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingCapacityIndex(index);
    setCapacityCategory(category);
    setCapacityModalText(currentText);
    setIsCapacityModalOpen(true);
  };

  const handleSaveCapacityModal = () => {
    if (!currentUnit || !capacityModalText.trim()) return;
    const text = capacityModalText.trim();
    const isAdding = editingCapacityIndex === null;

    if (activeStage) {
      if (capacityCategory === "socioemotional") {
        const list = [...(activeStage.socioemotionalCapacities || [])];
        const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
        handleUpdateActiveStage({ socioemotionalCapacities: nextList });
      } else {
        const hasBasic = Array.isArray(activeStage.basicCapacities) && activeStage.basicCapacities.length > 0;
        if (hasBasic) {
          const list = [...(activeStage.basicCapacities || [])];
          const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
          handleUpdateActiveStage({ basicCapacities: nextList });
        } else {
          const list = [...(activeStage.technicalCapacities || [])];
          const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
          handleUpdateActiveStage({ technicalCapacities: nextList });
        }
      }
    } else {
      if (capacityCategory === "socioemotional") {
        const list = currentUnit.socioemotionalCapacities || [];
        const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
        handleUpdateCurrentUnit({ ...currentUnit, socioemotionalCapacities: nextList });
      } else {
        const hasTech = Array.isArray(currentUnit.technicalCapacities) && currentUnit.technicalCapacities.length > 0;
        if (hasTech) {
          const list = currentUnit.technicalCapacities || [];
          const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
          handleUpdateCurrentUnit({ ...currentUnit, technicalCapacities: nextList });
        } else {
          const list = currentUnit.basicCapacities || [];
          const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
          handleUpdateCurrentUnit({ ...currentUnit, basicCapacities: nextList });
        }
      }
    }

    setIsCapacityModalOpen(false);
  };

  // 3. SITUATION PROBLEM (S.A.) EDIT STATE & HANDLERS
  const activeSituationProblem: SituationProblem =
    activeStage?.situationProblem ||
    currentUnit?.situationProblem ||
    defaultMatchingUnit?.situationProblem || {
      title: `Situação de Aprendizagem - ${currentUnit?.unitTitle || "UC"}`,
      contextualization: "Otimização de processos produtivos na fábrica.",
      challenge: ["Analisar especificações técnicas e executar o plano."],
      expectedResults: ["Relatório técnico e inspeção dimensional."],
    };

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
    if (activeSituationProblem) {
      setSPForm({
        title: activeSituationProblem.title || "",
        contextualization: activeSituationProblem.contextualization || "",
        challenge: activeSituationProblem.challenge ? [...activeSituationProblem.challenge] : [""],
        expectedResults: activeSituationProblem.expectedResults ? [...activeSituationProblem.expectedResults] : [""],
      });
    }
    setIsSPModalOpen(true);
  };

  const handleSaveSP = () => {
    if (!currentUnit) return;
    const cleanedSP: SituationProblem = {
      title: spForm.title.trim() || `Situação de Aprendizagem - ${activeStage?.title || currentUnit.unitTitle}`,
      contextualization: spForm.contextualization.trim(),
      challenge: spForm.challenge.map((c) => c.trim()).filter(Boolean),
      expectedResults: spForm.expectedResults.map((r) => r.trim()).filter(Boolean),
    };

    if (activeStage) {
      handleUpdateActiveStage({ situationProblem: cleanedSP });
    } else {
      handleUpdateCurrentUnit({
        ...currentUnit,
        situationProblem: cleanedSP,
      });
    }

    setIsSPModalOpen(false);
  };

  // 4. RUBRICS EDIT STATE & HANDLERS
  const activeRubricsList: RubricItem[] =
    (activeStage?.rubrics && activeStage.rubrics.length > 0
      ? activeStage.rubrics
      : currentUnit?.rubrics || defaultMatchingUnit?.rubrics) || [];

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
    const currentList = activeRubricsList;
    const nextList = editingRubricIndex !== null
      ? currentList.map((item, idx) => (idx === editingRubricIndex ? { ...rubricForm } : item))
      : [...currentList, { ...rubricForm }];

    if (activeStage) {
      handleUpdateActiveStage({ rubrics: nextList });
    } else {
      handleUpdateCurrentUnit({
        ...currentUnit,
        rubrics: nextList,
      });
    }

    setIsRubricModalOpen(false);
  };

  const handleDeleteRubric = (index: number) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (!currentUnit) return;
    const nextList = activeRubricsList.filter((_, idx) => idx !== index);
    if (activeStage) {
      handleUpdateActiveStage({ rubrics: nextList });
    } else {
      handleUpdateCurrentUnit({
        ...currentUnit,
        rubrics: nextList,
      });
    }
  };

  // 5. LESSON PLAN EDITING / CREATION STATE & HANDLERS
  const [editingLesson, setEditingLesson] = useState<LessonPlanItem | null>(null);
  const [insertAfterLessonId, setInsertAfterLessonId] = useState<string | null>(null);
  const [isCopyingLesson, setIsCopyingLesson] = useState<boolean>(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonPlanStageFilter, setLessonPlanStageFilter] = useState<string>("todas");
  const [calendarStageFilter, setCalendarStageFilter] = useState<string>("todas");
  const [lessonForm, setLessonForm] = useState<Partial<LessonPlanItem & { stageId?: string }>>({
    date: "",
    hours: "4h",
    professor: "Prof. Ricardo Beretella",
    conhecimentos: "",
    estrategias: "",
    recursos: "Laboratório / Oficina de Usinagem, ferramentas e EPIs",
    capacities: "Demonstrar conhecimento técnico e visão operacional",
    stageId: "",
  });

  const handleOpenAddLesson = (defaultDate?: string, preselectedStageId?: string) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingLesson(null);
    setInsertAfterLessonId(null);
    setIsCopyingLesson(false);
    setLessonForm({
      date: defaultDate || "12/08/2026",
      hours: "4h",
      professor: currentUser?.name?.includes("Gea") ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella",
      conhecimentos: "",
      estrategias: "Apresentação expositiva dialogada e prática supervisionada em oficina.",
      recursos: "Máquinas, ferramentas de usinagem, paquímetro e EPIs.",
      capacities: "Demonstrar responsabilidade e autocontrole operacional.",
      stageId: preselectedStageId || selectedStageId || (currentUnit?.stages?.[0]?.id || ""),
    });
    setIsLessonModalOpen(true);
  };

  const handleOpenInsertLessonBelow = (referenceLesson: LessonPlanItem) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingLesson(null);
    setIsCopyingLesson(false);
    setInsertAfterLessonId(referenceLesson.id);
    setLessonForm({
      date: referenceLesson.date || "12/08/2026",
      hours: referenceLesson.hours || "4h",
      professor: referenceLesson.professor || (currentUser?.name?.includes("Gea") ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella"),
      conhecimentos: "",
      estrategias: referenceLesson.estrategias || "Apresentação expositiva dialogada e prática supervisionada em oficina.",
      recursos: referenceLesson.recursos || "Máquinas, ferramentas de usinagem, paquímetro e EPIs.",
      capacities: referenceLesson.capacities || "Demonstrar responsabilidade e autocontrole operacional.",
      stageId: referenceLesson.stageId || selectedStageId || (currentUnit?.stages?.[0]?.id || ""),
    });
    setIsLessonModalOpen(true);
  };

  const handleOpenCopyLesson = (referenceLesson: LessonPlanItem) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingLesson(null);
    setIsCopyingLesson(true);
    setInsertAfterLessonId(referenceLesson.id);
    setLessonForm({
      date: referenceLesson.date || "12/08/2026",
      hours: referenceLesson.hours || "4h",
      professor: referenceLesson.professor || (currentUser?.name?.includes("Gea") ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella"),
      conhecimentos: referenceLesson.conhecimentos || "",
      estrategias: referenceLesson.estrategias || "",
      recursos: referenceLesson.recursos || "",
      capacities: referenceLesson.capacities || "",
      stageId: referenceLesson.stageId || selectedStageId || (currentUnit?.stages?.[0]?.id || ""),
    });
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonPlanItem) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingLesson(lesson);
    setInsertAfterLessonId(null);
    setIsCopyingLesson(false);
    setLessonForm({ ...lesson });
    setIsLessonModalOpen(true);
  };

  const handleSaveLessonModal = () => {
    if (!currentUnit) return;
    const profName =
      lessonForm.professor ||
      (currentUser?.name?.includes("Gea") ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella");

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const targetStageId =
        lessonForm.stageId || editingLesson?.stageId || selectedStageId || currentUnit.stages[0].id;

      const nextStages = currentUnit.stages.map((st) => {
        if (st.id !== targetStageId) return st;
        const stageLessons = [...(st.lessonPlan || [])];

        if (editingLesson) {
          const updated = stageLessons.map((item) =>
            item.id === editingLesson.id
              ? {
                  ...item,
                  date: lessonForm.date || item.date,
                  hours: lessonForm.hours || item.hours,
                  professor: profName,
                  conhecimentos: lessonForm.conhecimentos || item.conhecimentos,
                  estrategias: lessonForm.estrategias || item.estrategias,
                  recursos: lessonForm.recursos || item.recursos,
                  capacities: lessonForm.capacities || item.capacities,
                  stageId: st.id,
                  stageTitle: st.title,
                  stageTurma: st.turma,
                }
              : item
          );
          return { ...st, lessonPlan: updated };
        } else {
          const newItem: LessonPlanItem = {
            id: `lp-${st.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: lessonForm.date || "12/08/2026",
            hours: lessonForm.hours || "4h",
            professor: profName,
            conhecimentos: lessonForm.conhecimentos || "Novo conteúdo lecionado",
            estrategias: lessonForm.estrategias || "Prática em bancada e oficina.",
            recursos: lessonForm.recursos || "Ferramentas manuais e máquinas.",
            capacities: lessonForm.capacities || "Demonstrar visão sistêmica.",
            stageId: st.id,
            stageTitle: st.title,
            stageTurma: st.turma,
          };

          const updatedList = [...stageLessons];
          if (insertAfterLessonId) {
            const targetIdx = updatedList.findIndex((item) => item.id === insertAfterLessonId);
            if (targetIdx !== -1) {
              updatedList.splice(targetIdx + 1, 0, newItem);
            } else {
              updatedList.push(newItem);
            }
          } else {
            updatedList.push(newItem);
          }

          return { ...st, lessonPlan: updatedList };
        }
      });

      const mergedLessons = nextStages.flatMap((st) =>
        (st.lessonPlan || []).map((lp) => ({
          ...lp,
          stageId: st.id,
          stageTitle: st.title,
          stageTurma: st.turma,
        }))
      );

      handleUpdateCurrentUnit({
        ...currentUnit,
        stages: nextStages,
        lessonPlan: mergedLessons,
      });
    } else {
      const currentList = currentUnit.lessonPlan || [];
      let nextList: LessonPlanItem[] = [];

      if (editingLesson) {
        nextList = currentList.map((item) =>
          item.id === editingLesson.id
            ? {
                ...item,
                date: lessonForm.date || item.date,
                hours: lessonForm.hours || item.hours,
                professor: profName,
                conhecimentos: lessonForm.conhecimentos || item.conhecimentos,
                estrategias: lessonForm.estrategias || item.estrategias,
                recursos: lessonForm.recursos || item.recursos,
                capacities: lessonForm.capacities || item.capacities,
              }
            : item
        );
      } else {
        const newItem: LessonPlanItem = {
          id: `lp-${Date.now()}`,
          date: lessonForm.date || "12/08/2026",
          hours: lessonForm.hours || "4h",
          professor: profName,
          conhecimentos: lessonForm.conhecimentos || "Novo conteúdo lecionado",
          estrategias: lessonForm.estrategias || "Prática em bancada e oficina.",
          recursos: lessonForm.recursos || "Ferramentas manuais e máquinas.",
          capacities: lessonForm.capacities || "Demonstrar visão sistêmica.",
        };

        nextList = [...currentList];
        if (insertAfterLessonId) {
          const targetIdx = nextList.findIndex((item) => item.id === insertAfterLessonId);
          if (targetIdx !== -1) {
            nextList.splice(targetIdx + 1, 0, newItem);
          } else {
            nextList.push(newItem);
          }
        } else {
          nextList.push(newItem);
        }
      }

      handleUpdateCurrentUnit({ ...currentUnit, lessonPlan: nextList });
    }

    setInsertAfterLessonId(null);
    setIsCopyingLesson(false);
    setIsLessonModalOpen(false);
  };

  const handleDeleteLessonItem = (lessonId: string) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    if (!currentUnit) return;

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const nextStages = currentUnit.stages.map((st) => ({
        ...st,
        lessonPlan: (st.lessonPlan || []).filter((item) => item.id !== lessonId),
      }));
      const mergedList = nextStages.flatMap((st) =>
        (st.lessonPlan || []).map((lp) => ({
          ...lp,
          stageId: st.id,
          stageTitle: st.title,
          stageTurma: st.turma,
        }))
      );
      handleUpdateCurrentUnit({ ...currentUnit, stages: nextStages, lessonPlan: mergedList });
    } else {
      const nextList = (currentUnit.lessonPlan || []).filter((item) => item.id !== lessonId);
      handleUpdateCurrentUnit({ ...currentUnit, lessonPlan: nextList });
    }
  };

  const handleToggleLessonOk = (lessonId: string) => {
    if (!currentUnit) return;

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const nextStages = currentUnit.stages.map((st) => ({
        ...st,
        lessonPlan: (st.lessonPlan || []).map((item) => {
          if (item.id === lessonId) {
            return {
              ...item,
              status: item.status === "concluida" ? ("planejada" as const) : ("concluida" as const),
            };
          }
          return item;
        }),
      }));
      const mergedList = nextStages.flatMap((st) =>
        (st.lessonPlan || []).map((lp) => ({
          ...lp,
          stageId: st.id,
          stageTitle: st.title,
          stageTurma: st.turma,
        }))
      );
      handleUpdateCurrentUnit({ ...currentUnit, stages: nextStages, lessonPlan: mergedList });
    } else {
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
    }
  };

  // Active Lesson Plan filtered by lateral active professor (currentUser)
  const rawLessonPlan: LessonPlanItem[] =
    currentUnit && Array.isArray(currentUnit.lessonPlan)
      ? currentUnit.lessonPlan
      : (defaultMatchingUnit?.lessonPlan || []);

  const activeLessonPlan = rawLessonPlan.filter((item) => {
    if (!item) return false;
    const isBeretella = currentUser?.name?.toLowerCase().includes("beretella");
    const isGea = currentUser?.name?.toLowerCase().includes("gea");

    if (!isBeretella && !isGea) return true;

    const profStr = (item.professor || "").toLowerCase();
    
    // If assigned to both professors or shared, always include
    if (profStr.includes("ambos") || profStr.includes("/")) return true;
    
    if (!item.professor || typeof item.professor !== "string" || item.professor.trim() === "") {
      // Default to matching stage turma or ID
      if (isBeretella) {
        return item.stageTurma === "Turma A" || !item.id?.toLowerCase().includes("gea");
      } else if (isGea) {
        return item.stageTurma === "Turma B" || item.id?.toLowerCase().includes("gea");
      }
      return true;
    }

    if (isBeretella) {
      return profStr.includes("beretella");
    }
    if (isGea) {
      return profStr.includes("gea");
    }
    return true;
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
                {currentUser?.name && (
                  <span className="inline-block px-3 py-1 bg-blue-900/90 text-blue-200 border border-blue-700/80 font-black text-[11px] rounded-lg uppercase shadow-xs">
                    Docente: {currentUser.name} • {activeLessonPlan.length} Aulas ({activeLessonPlan.reduce((acc, lp) => acc + (parseInt(String(lp?.hours || "").replace(/\D/g, ""), 10) || 0), 0)}h)
                  </span>
                )}
              </div>

              {isAdmin && defaultMatchingUnit && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Deseja sincronizar e restaurar a estrutura padrão oficial SENAI (ProEducador) para ${currentUnit.unitTitle}? Isso atualizará as 4 etapas, capacidades, situação-problema e rubricas para a versão oficial.`
                      )
                    ) {
                      handleUpdateCurrentUnit(JSON.parse(JSON.stringify(defaultMatchingUnit)));
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Sincronizar com padrão oficial ProEducador SENAI"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sincronizar Padrão SENAI</span>
                </button>
              )}
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

          {/* Multi-Stage Selector for FUSI and rotational units */}
          {currentUnit.stages && currentUnit.stages.length > 0 && (
            <div className="bg-slate-900/90 border-t border-b border-slate-800 px-6 sm:px-10 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Etapas & Rotações de Oficina (Turmas A/B):</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-wrap">
                  {currentUnit.stages.map((stage, sIdx) => {
                    const isStageActive = selectedStageId === stage.id || (!selectedStageId && sIdx === 0);
                    return (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
                          isStageActive
                            ? "bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-bold"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isStageActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                          {sIdx + 1}
                        </span>
                        <span>{stage.title.replace(/^\d+\.\s*/, '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
                      const activeProf = currentUser?.name?.toLowerCase().includes("gea")
                        ? "Prof. Ricardo Gea"
                        : (currentUser?.name || syllabus.professorName || "Prof. Ricardo Beretella");
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
                          <span>{activePrimaryLabel}</span>
                        </h3>

                        {isAdmin && (
                          <button
                            onClick={() => handleOpenAddCapacity("basic_technical")}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADICIONAR</span>
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] space-y-2">
                        {activePrimaryCapacities.length > 0 ? (
                          activePrimaryCapacities.map((cap, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                            >
                              <span className="leading-relaxed">{cap}</span>
                              {isAdmin && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenEditCapacity("basic_technical", i, cap)}
                                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                    title="Editar capacidade"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const next = activePrimaryCapacities.filter((_, idx) => idx !== i);
                                      if (activeStage) {
                                        if (activeStage.basicCapacities) {
                                          handleUpdateActiveStage({ basicCapacities: next });
                                        } else {
                                          handleUpdateActiveStage({ technicalCapacities: next });
                                        }
                                      } else {
                                        if (currentUnit.technicalCapacities && currentUnit.technicalCapacities.length > 0) {
                                          handleUpdateCurrentUnit({ ...currentUnit, technicalCapacities: next });
                                        } else {
                                          handleUpdateCurrentUnit({ ...currentUnit, basicCapacities: next });
                                        }
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                    title="Excluir capacidade"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                            onClick={() => handleOpenAddCapacity("socioemotional")}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADICIONAR</span>
                          </button>
                        )}
                      </div>

                      {/* Socioemotional Capacities List */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] space-y-2">
                        {activeSocioemotionalCapacities.length > 0 ? (
                          activeSocioemotionalCapacities.map((cap, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                            >
                              <span className="leading-relaxed">{cap}</span>
                              {isAdmin && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenEditCapacity("socioemotional", i, cap)}
                                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                    title="Editar capacidade socioemocional"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const next = activeSocioemotionalCapacities.filter((_, idx) => idx !== i);
                                      if (activeStage) {
                                        handleUpdateActiveStage({ socioemotionalCapacities: next });
                                      } else {
                                        handleUpdateCurrentUnit({ ...currentUnit, socioemotionalCapacities: next });
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                    title="Excluir capacidade socioemocional"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                          onClick={handleOpenAddTopic}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>ADICIONAR CONHECIMENTO</span>
                        </button>
                      )}
                    </div>

                    {/* Topics List */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] space-y-2">
                      {activeTopicsList.length > 0 ? (
                        activeTopicsList.map((topic, i) => (
                          <div
                            key={i}
                            className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 group"
                          >
                            <span className="leading-relaxed">{topic}</span>
                            {isAdmin && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditTopic(i, topic)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer transition-colors"
                                  title="Editar tópico/conhecimento"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTopic(i)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                                  title="Excluir tópico"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
                  {activeRubricsList.length > 0 ? (
                    <div className="space-y-6">
                      {activeRubricsList.map((rubric, idx) => (
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
                  {/* Top Bar with Title, Search and Global Add Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h2 className="text-base font-black uppercase text-slate-900 dark:text-white">
                          PLANO DE AULA & CRONOGRAMA ({currentUnit.workload || "60h"}) - {currentUnit.unitTitle}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Sequência pedagógica detalhada por etapas e rotações de oficina SENAI (Mecânico de Usinagem)
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
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Add Lesson Button for Admin */}
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenAddLesson()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Aula</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-Stage Tabs Filter (if UC has stages like FUSI 4 stages) */}
                  {currentUnit.stages && currentUnit.stages.length > 0 && (
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-wrap sm:flex-nowrap">
                        <button
                          onClick={() => setLessonPlanStageFilter("todas")}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            lessonPlanStageFilter === "todas"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Todas as 4 Etapas ({rawLessonPlan.length} Aulas • {currentUnit.workload || "240h"})</span>
                        </button>

                        {currentUnit.stages.map((stage, sIdx) => {
                          const theme = STAGE_THEMES[sIdx % STAGE_THEMES.length];
                          const isActive = lessonPlanStageFilter === stage.id;
                          const stageLessonsCount = (stage.lessonPlan || []).length;

                          return (
                            <button
                              key={stage.id}
                              onClick={() => setLessonPlanStageFilter(stage.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                isActive
                                  ? `${theme.bg} text-white shadow-md font-black ring-2 ${theme.ring}`
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : theme.bg}`} />
                              <span>Etapa {sIdx + 1}: {stage.turma} ({stageLessonsCount} Aulas)</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multi-Stage Content: Unified chronological sequence when "todas" is selected, or individual stage */}
                  {currentUnit.stages && currentUnit.stages.length > 0 ? (
                    lessonPlanStageFilter === "todas" ? (
                      (() => {
                        // Flatten all lessons from all stages
                        const allStagesLessons = currentUnit.stages!.flatMap((stage, sIdx) =>
                          (stage.lessonPlan || []).map((item) => ({
                            ...item,
                            stageId: stage.id,
                            stageTitle: stage.title,
                            stageTurma: stage.turma,
                            stageIdx: sIdx,
                          }))
                        );

                        // Filter by active professor & search query
                        const isBeretella = currentUser?.name?.toLowerCase().includes("beretella");
                        const isGea = currentUser?.name?.toLowerCase().includes("gea");

                        const filteredAllLessons = allStagesLessons.filter((item) => {
                          if (!item) return false;
                          if (isBeretella && item.professor) {
                            const p = item.professor.toLowerCase();
                            if (!p.includes("beretella") && !p.includes("ambos")) return false;
                          }
                          if (isGea && item.professor) {
                            const p = item.professor.toLowerCase();
                            if (!p.includes("gea") && !p.includes("ambos")) return false;
                          }

                          if (lessonPlanSearch.trim()) {
                            const q = lessonPlanSearch.toLowerCase();
                            const matchSearch =
                              (item.conhecimentos || "").toLowerCase().includes(q) ||
                              (item.estrategias || "").toLowerCase().includes(q) ||
                              (item.date || "").includes(q) ||
                              (item.capacities || "").toLowerCase().includes(q) ||
                              (item.recursos || "").toLowerCase().includes(q);
                            if (!matchSearch) return false;
                          }

                          return true;
                        });

                        // Sort strictly chronologically by date / day
                        const sortedAllLessons = [...filteredAllLessons].sort((a, b) => {
                          const tA = parseDateSortKey(a.date);
                          const tB = parseDateSortKey(b.date);
                          if (tA !== tB) return tA - tB;
                          return (a.id || "").localeCompare(b.id || "");
                        });

                        const totalAllHours = sortedAllLessons.reduce((acc, lp) => {
                          const h = lp?.hours;
                          if (typeof h === "number") return acc + h;
                          if (typeof h === "string") {
                            const match = h.match(/\d+/);
                            return acc + (match ? parseInt(match[0], 10) : 4);
                          }
                          return acc + 4;
                        }, 0);

                        const completedTotalCount = sortedAllLessons.filter((l) => l.status === "concluida").length;

                        return (
                          <div className="rounded-3xl border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
                            {/* Unified Table Header Banner */}
                            <div className="p-4 sm:p-6 border-b border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-1 text-[11px] font-black uppercase rounded-lg bg-purple-600 text-white shadow-xs">
                                    TODAS AS 4 ETAPAS • CRONOGRAMA POR DIA
                                  </span>
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    • {sortedAllLessons.length} Aulas classificadas em ordem cronológica ({totalAllHours}h)
                                  </span>
                                  {completedTotalCount > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-black rounded-md">
                                      ✓ {completedTotalCount}/{sortedAllLessons.length} Concluídas
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                  Sequência Cronológica Completa da Unidade de Aprendizagem
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  Todas as aulas das etapas mescladas e ordenadas dia a dia conforme o calendário letivo.
                                </p>
                              </div>

                              {isAdmin && (
                                <button
                                  onClick={() => handleOpenAddLesson(undefined, currentUnit.stages?.[0]?.id)}
                                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Adicionar Aula</span>
                                </button>
                              )}
                            </div>

                            {/* Master Unified Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-4 w-36 whitespace-nowrap">Data / Horas & Etapa</th>
                                    <th className="p-4">Capacidades Desenvolvidas</th>
                                    <th className="p-4">Conhecimentos / Conteúdo</th>
                                    <th className="p-4">Estratégias Pedagógicas</th>
                                    <th className="p-4 hidden md:table-cell">Recursos & Ambientes</th>
                                    <th className="p-3 w-28 text-center">Ações</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                  {sortedAllLessons.length > 0 ? (
                                    sortedAllLessons.map((lesson) => {
                                      const isOk = lesson.status === "concluida";
                                      const sIdx = lesson.stageIdx ?? 0;
                                      const theme = STAGE_THEMES[sIdx % STAGE_THEMES.length];
                                      return (
                                        <tr
                                          key={lesson.id}
                                          className={`transition-all ${
                                            isOk
                                              ? "bg-emerald-100/90 dark:bg-emerald-950/70 border-l-4 border-l-emerald-500 font-medium"
                                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                          }`}
                                        >
                                          {/* 1. Data / Horas & Etapa */}
                                          <td className="p-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap align-top">
                                            <div className="flex items-center gap-1.5">
                                              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                              <span>{lesson.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px]">
                                                {lesson.hours}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded font-black text-[10px] ${theme.pillBg}`}>
                                                Etapa {sIdx + 1}: {lesson.stageTurma || `E${sIdx + 1}`}
                                              </span>
                                            </div>
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

                                          {/* 5. Recursos & Ambientes */}
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
                                                    onClick={() => handleOpenCopyLesson(lesson)}
                                                    className="p-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
                                                    title="Copiar linha inteira (Duplicar conteúdo para novo dia)"
                                                  >
                                                    <Copy className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenInsertLessonBelow(lesson)}
                                                    className="p-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
                                                    title="Inserir nova linha abaixo desta"
                                                  >
                                                    <Plus className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenEditLesson(lesson)}
                                                    className="p-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors cursor-pointer"
                                                    title="Editar esta aula"
                                                  >
                                                    <Edit className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteLessonItem(lesson.id)}
                                                    className="p-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors cursor-pointer"
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
                                        Nenhuma aula encontrada para o filtro aplicado.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      /* Individual Stage View when a specific stage filter is chosen */
                      <div className="space-y-8">
                        {currentUnit.stages
                          .filter((stage) => lessonPlanStageFilter === stage.id)
                          .map((stage) => {
                            const sIdx = currentUnit.stages!.findIndex((s) => s.id === stage.id);
                            const theme = STAGE_THEMES[sIdx % STAGE_THEMES.length];
                            
                            const stageLessons = (stage.lessonPlan || []).filter((item) => {
                              if (!item) return false;
                              const isBeretella = currentUser?.name?.toLowerCase().includes("beretella");
                              const isGea = currentUser?.name?.toLowerCase().includes("gea");
                              if (isBeretella && item.professor && !item.professor.toLowerCase().includes("beretella") && !item.professor.toLowerCase().includes("ambos")) {
                                return false;
                              }
                              if (isGea && item.professor && !item.professor.toLowerCase().includes("gea") && !item.professor.toLowerCase().includes("ambos")) {
                                return false;
                              }

                              if (lessonPlanSearch.trim()) {
                                const q = lessonPlanSearch.toLowerCase();
                                const matchSearch =
                                  (item.conhecimentos || "").toLowerCase().includes(q) ||
                                  (item.estrategias || "").toLowerCase().includes(q) ||
                                  (item.date || "").includes(q) ||
                                  (item.capacities || "").toLowerCase().includes(q) ||
                                  (item.recursos || "").toLowerCase().includes(q);
                                if (!matchSearch) return false;
                              }

                              return true;
                            });

                            const totalStageHours = (stage.lessonPlan || []).reduce((acc, lp) => {
                              const h = lp?.hours;
                              if (typeof h === "number") return acc + h;
                              if (typeof h === "string") {
                                const match = h.match(/\d+/);
                                return acc + (match ? parseInt(match[0], 10) : 4);
                              }
                              return acc + 4;
                            }, 0);

                            const completedCount = (stage.lessonPlan || []).filter((l) => l.status === "concluida").length;

                            return (
                              <div
                                key={stage.id}
                                className={`rounded-3xl border ${theme.border} bg-white dark:bg-slate-900 shadow-sm overflow-hidden`}
                              >
                                {/* Stage Header Banner */}
                                <div className={`p-4 sm:p-6 border-b ${theme.border} ${theme.lightBg} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-lg ${theme.badge}`}>
                                        ETAPA {sIdx + 1}
                                      </span>
                                      <span className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-lg bg-slate-900 text-white dark:bg-slate-800`}>
                                        {stage.turma}
                                      </span>
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        • {(stage.lessonPlan || []).length} Aulas ({totalStageHours}h)
                                      </span>
                                      {completedCount > 0 && (
                                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-black rounded-md">
                                          ✓ {completedCount}/{(stage.lessonPlan || []).length} Concluídas
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                      {stage.title}
                                    </h3>
                                    {stage.situationProblem?.company && (
                                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                        Contexto Industrial: <span className="font-bold text-slate-900 dark:text-white">{stage.situationProblem.company}</span>
                                      </p>
                                    )}
                                  </div>

                                  {isAdmin && (
                                    <button
                                      onClick={() => handleOpenAddLesson(undefined, stage.id)}
                                      className={`px-3.5 py-2 ${theme.bg} ${theme.hoverBg} text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0`}
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span>Adicionar Aula na Etapa {sIdx + 1}</span>
                                    </button>
                                  )}
                                </div>

                                {/* Stage Lesson Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                        <th className="p-4 w-32 whitespace-nowrap">Horas/Data</th>
                                        <th className="p-4">Capacidades Desenvolvidas</th>
                                        <th className="p-4">Conhecimentos / Conteúdo</th>
                                        <th className="p-4">Estratégias Pedagógicas</th>
                                        <th className="p-4 hidden md:table-cell">Recursos & Ambientes</th>
                                        <th className="p-3 w-28 text-center">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                      {stageLessons.length > 0 ? (
                                        stageLessons.map((lesson) => {
                                          const isOk = lesson.status === "concluida";
                                          return (
                                            <tr
                                              key={lesson.id}
                                              className={`transition-all ${
                                                isOk
                                                  ? "bg-emerald-100/90 dark:bg-emerald-950/70 border-l-4 border-l-emerald-500 font-medium"
                                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                              }`}
                                            >
                                              {/* 1. Horas/Data */}
                                              <td className="p-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap align-top">
                                                <div className="flex items-center gap-1.5">
                                                  <Calendar className={`w-3.5 h-3.5 ${theme.text}`} />
                                                  <span>{lesson.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-bold text-[10px]">
                                                    {lesson.hours}
                                                  </span>
                                                  <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${theme.pillBg}`}>
                                                    E{sIdx + 1}
                                                  </span>
                                                </div>
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

                                              {/* 5. Recursos & Ambientes */}
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
                                                        onClick={() => handleOpenCopyLesson(lesson)}
                                                        className="p-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
                                                        title="Copiar linha inteira (Duplicar conteúdo para novo dia)"
                                                      >
                                                        <Copy className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleOpenInsertLessonBelow(lesson)}
                                                        className="p-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
                                                        title="Inserir nova linha abaixo desta"
                                                      >
                                                        <Plus className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleOpenEditLesson(lesson)}
                                                        className="p-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors cursor-pointer"
                                                        title="Editar esta aula"
                                                      >
                                                        <Edit className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteLessonItem(lesson.id)}
                                                        className="p-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors cursor-pointer"
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
                                          <td colSpan={6} className="p-6 text-center text-slate-400 font-bold italic">
                                            Nenhuma aula encontrada para esta etapa com o filtro aplicado.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )
                  ) : (
                    /* Single Table for UCs without multiple stages */
                    <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <th className="p-4 w-32 whitespace-nowrap">Horas/Aulas/Data</th>
                            <th className="p-4">Capacidades</th>
                            <th className="p-4">Conhecimentos</th>
                            <th className="p-4">Estratégias</th>
                            <th className="p-4 hidden md:table-cell">Recursos/Ambientes</th>
                            <th className="p-3 w-28 text-center">Ações</th>
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
                                            onClick={() => handleOpenCopyLesson(lesson)}
                                            className="p-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
                                            title="Copiar linha inteira (Duplicar conteúdo para novo dia)"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleOpenInsertLessonBelow(lesson)}
                                            className="p-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
                                            title="Inserir nova linha abaixo desta"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleOpenEditLesson(lesson)}
                                            className="p-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors cursor-pointer"
                                            title="Editar esta aula"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteLessonItem(lesson.id)}
                                            className="p-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors cursor-pointer"
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
                  )}
                </div>
              )}

              {/* TAB 5: CRONOGRAMA (CALENDÁRIO DA UNIDADE COM AS 4 ETAPAS) */}
              {activeUcTab === "CRONOGRAMA" && (() => {
                const ucIndex = units.findIndex((u) => u.id === currentUnit.id);
                const ucColor = getUcColor(ucIndex >= 0 ? ucIndex : 0);
                const ucAcronym = getAcronym(currentUnit);

                // Build lookup map for lessons by ISO date with stage information
                interface DateLessonMeta {
                  lesson: LessonPlanItem;
                  stageIndex: number;
                  stageId?: string;
                  stageTurma?: string;
                  stageTitle?: string;
                }

                const lessonMapByDate: Record<string, DateLessonMeta> = {};

                if (currentUnit.stages && currentUnit.stages.length > 0) {
                  currentUnit.stages.forEach((st, sIdx) => {
                    (st.lessonPlan || []).forEach((lp) => {
                      if (!lp || !lp.date) return;
                      const iso = parseDateToISO(lp.date);
                      if (iso) {
                        // If calendarStageFilter is applied, only index the relevant stage
                        if (calendarStageFilter === "todas" || calendarStageFilter === st.id) {
                          lessonMapByDate[iso] = {
                            lesson: lp,
                            stageIndex: sIdx,
                            stageId: st.id,
                            stageTurma: st.turma,
                            stageTitle: st.title,
                          };
                        }
                      }
                    });
                  });
                } else {
                  activeLessonPlan.forEach((item) => {
                    if (!item || !item.date) return;
                    const iso = parseDateToISO(item.date);
                    if (iso) {
                      lessonMapByDate[iso] = {
                        lesson: item,
                        stageIndex: 0,
                      };
                    }
                  });
                }

                // Calendar months filtered by semester (1º Semestre: Jan-Jun | 2º Semestre: Jul-Dez)
                const is2ndSem = selectedSemester === "2º SEMESTRE" || ["PRUSC", "MINDU"].includes(ucAcronym);
                const monthIndices = is2ndSem ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];

                const selectedLessonMeta = selectedCalendarDate ? lessonMapByDate[selectedCalendarDate] : null;

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Calendar Header with Stage Filter */}
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
                          Mapeamento interativo das datas e rotações de oficina divididas nas 4 etapas do semestre
                        </p>
                      </div>

                      {/* Stage Filter Pills for Calendar */}
                      {currentUnit.stages && currentUnit.stages.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-wrap">
                          <button
                            onClick={() => setCalendarStageFilter("todas")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                              calendarStageFilter === "todas"
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            Todas as 4 Etapas
                          </button>

                          {currentUnit.stages.map((st, sIdx) => {
                            const theme = STAGE_THEMES[sIdx % STAGE_THEMES.length];
                            const isActive = calendarStageFilter === st.id;
                            return (
                              <button
                                key={st.id}
                                onClick={() => setCalendarStageFilter(st.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                  isActive
                                    ? `${theme.bg} text-white shadow-xs font-black ring-2 ${theme.ring}`
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${theme.bg}`} />
                                <span>Etapa {sIdx + 1} ({st.turma})</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 6 Month Grids */}
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

                                const meta = lessonMapByDate[cell.isoDate];
                                const isSelected = selectedCalendarDate === cell.isoDate;
                                const theme = meta ? STAGE_THEMES[meta.stageIndex % STAGE_THEMES.length] : null;

                                return (
                                  <button
                                    key={cIdx}
                                    onClick={() => setSelectedCalendarDate(cell.isoDate)}
                                    className={`h-9 rounded-xl font-extrabold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                                      meta && theme
                                        ? `${theme.bg} text-white shadow-xs ring-2 ring-offset-1 ${theme.ring}`
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    } ${isSelected ? "scale-105 ring-2 ring-amber-400 font-black" : ""}`}
                                    title={
                                      meta
                                        ? `Etapa ${meta.stageIndex + 1} (${meta.stageTurma || 'Aula'}): ${meta.lesson.conhecimentos}`
                                        : `Dia ${cell.dayNumber}`
                                    }
                                  >
                                    <span className="text-xs leading-none">{cell.dayNumber}</span>
                                    {meta && (
                                      <span className="text-[8px] font-black tracking-tighter opacity-90 leading-none mt-0.5">
                                        E{meta.stageIndex + 1} • {meta.lesson.hours}
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
                    {selectedLessonMeta ? (
                      (() => {
                        const { lesson, stageIndex, stageTitle, stageTurma } = selectedLessonMeta;
                        const theme = STAGE_THEMES[stageIndex % STAGE_THEMES.length];
                        const isOk = lesson.status === "concluida";

                        return (
                          <div className={`p-6 bg-slate-900 text-white rounded-3xl shadow-lg border ${theme.border} space-y-4 animate-in fade-in`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-3 py-1 font-black text-xs rounded-xl uppercase ${theme.badge}`}>
                                  ETAPA {stageIndex + 1}: {stageTurma || "Turma A"}
                                </span>
                                <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-xl uppercase">
                                  {lesson.date} ({lesson.hours})
                                </span>
                                {stageTitle && (
                                  <span className="text-xs font-bold text-slate-300">
                                    {stageTitle}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (!isAdmin) return;
                                    handleToggleLessonOk(lesson.id);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                    isOk
                                      ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                                      : "bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white"
                                  }`}
                                  title="Marcar aula como realizada"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isOk ? "Concluída ✓" : "Marcar Concluída"}</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleOpenEditLesson(lesson)}
                                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Editar Aula</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedCalendarDate(null)}
                                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1 border-t border-slate-800">
                              <div className="space-y-1">
                                <span className={`text-[10px] uppercase font-black tracking-wider ${theme.text}`}>Conhecimentos & Conteúdo</span>
                                <p className="font-bold text-sm text-white leading-snug">{lesson.conhecimentos}</p>
                              </div>

                              <div className="space-y-1">
                                <span className={`text-[10px] uppercase font-black tracking-wider ${theme.text}`}>Estratégia Pedagógica</span>
                                <p className="font-medium text-slate-300 leading-relaxed">{lesson.estrategias}</p>
                              </div>

                              <div className="space-y-1">
                                <span className={`text-[10px] uppercase font-black tracking-wider ${theme.text}`}>Recursos & Ambientes</span>
                                <p className="font-medium text-slate-300 leading-relaxed">{lesson.recursos}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                        <span>
                          {selectedCalendarDate ? `Dia ${selectedCalendarDate.split("-").reverse().join("/")} sem aula agendada no filtro atual.` : "Clique em um dia destacado no calendário para ver os detalhes da aula."}
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

                    {/* Stage Color Legend */}
                    {currentUnit.stages && currentUnit.stages.length > 0 && (
                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>Legenda das 4 Etapas & Rotações de Oficina:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {currentUnit.stages.map((st, sIdx) => {
                            const theme = STAGE_THEMES[sIdx % STAGE_THEMES.length];
                            return (
                              <div
                                key={st.id}
                                className={`p-3 rounded-2xl border ${theme.border} ${theme.lightBg} flex items-start gap-2.5`}
                              >
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${theme.badge} shrink-0 mt-0.5`}>
                                  E{sIdx + 1}
                                </span>
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {st.turma} – {st.title.replace(/^\d+\.\s*/, '')}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    {(st.lessonPlan || []).length} Aulas • 60h
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                {isCopyingLesson ? (
                  <>
                    <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Copiar Linha & Inserir Encontro</span>
                  </>
                ) : insertAfterLessonId ? (
                  <>
                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Inserir Linha no Meio do Cronograma</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{editingLesson ? "Editar Encontro do Cronograma" : "Adicionar Encontro ao Cronograma"}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              {/* Context banner for copying or inserting in the middle */}
              {isCopyingLesson && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                  <Copy className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Conteúdo copiado com sucesso!</span>
                    <span className="block text-[11px] opacity-90">
                      Basta alterar a <strong>Data</strong> para o novo dia da aula (caso consecutivo) e salvar. A nova linha será inserida diretamente após a aula de origem.
                    </span>
                  </div>
                </div>
              )}

              {insertAfterLessonId && !isCopyingLesson && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Inserindo linha intermediária</span>
                    <span className="block text-[11px] opacity-90">
                      Esta nova aula será inserida exatamente abaixo da linha selecionada no cronograma.
                    </span>
                  </div>
                </div>
              )}

              {/* Select Stage if UC has stages */}
              {currentUnit && currentUnit.stages && currentUnit.stages.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Etapa / Rotação Ativa de Referência
                  </label>
                  <select
                    value={lessonForm.stageId || currentUnit.stages[0].id}
                    onChange={(e) => setLessonForm({ ...lessonForm, stageId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currentUnit.stages.map((st, sIdx) => (
                      <option key={st.id} value={st.id}>
                        Etapa {sIdx + 1}: {st.turma} – {st.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className={`px-5 py-2 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 ${
                  isCopyingLesson
                    ? "bg-amber-600 hover:bg-amber-700"
                    : insertAfterLessonId
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingLesson
                    ? "Salvar Alterações"
                    : isCopyingLesson
                    ? "Inserir Linha Copiada"
                    : insertAfterLessonId
                    ? "Inserir Linha Abaixo"
                    : "Salvar Encontro"}
                </span>
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

      {/* Modal 4: Editar / Adicionar Conhecimento & Tópico */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {editingTopicIndex !== null ? "Editar Conhecimento / Tópico" : "Adicionar Novo Conhecimento / Tópico"}
                </h3>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Texto do Conhecimento / Tópico Programático
                </label>
                <textarea
                  rows={4}
                  value={topicModalText}
                  onChange={(e) => setTopicModalText(e.target.value)}
                  placeholder="Digite o conhecimento ou conteúdo detalhado..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTopicModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Conhecimento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Editar / Adicionar Capacidade */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {editingCapacityIndex !== null
                    ? `Editar Capacidade (${capacityCategory === "socioemotional" ? "Socioemocional" : "Técnica"})`
                    : `Adicionar Nova Capacidade (${capacityCategory === "socioemotional" ? "Socioemocional" : "Técnica"})`}
                </h3>
              </div>
              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Texto da Capacidade
                </label>
                <textarea
                  rows={4}
                  value={capacityModalText}
                  onChange={(e) => setCapacityModalText(e.target.value)}
                  placeholder="Descreva a capacidade técnica ou socioemocional..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCapacityModal}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Capacidade</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
