import React, { useState, useEffect, useRef } from "react";
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
import { deduplicateAndSanitizeUnits, getStandardUcKey, loadSyllabiFromStorage } from "../utils/storage";
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
  syllabi?: Syllabus[];
  currentUser: UserProfile;
  onUpdateSyllabus: (updated: Syllabus) => void;
  onOpenLoginModal: () => void;
  onPrint?: () => void;
  onOpenExport?: () => void;
}

export const UnidadesCurricularesView: React.FC<UnidadesCurricularesViewProps> = ({
  syllabus,
  syllabi,
  currentUser,
  onUpdateSyllabus,
  onOpenLoginModal,
  onPrint,
  onOpenExport,
}) => {
  // Available Syllabi (for cross-professor / cross-syllabus import)
  const availableSyllabi = React.useMemo(() => {
    if (syllabi && Array.isArray(syllabi) && syllabi.length > 0) {
      return syllabi;
    }
    return loadSyllabiFromStorage();
  }, [syllabi]);
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

  const prevUnitIdRef = useRef<string>("");
  const prevUserKeyRef = useRef<string>("");

  // Keep selected stage in sync ONLY when unit or active professor in sidebar actually changes
  useEffect(() => {
    if (!currentUnit?.stages || currentUnit.stages.length === 0) {
      setSelectedStageId("");
      prevUnitIdRef.current = currentUnit?.id || "";
      return;
    }

    const unitChanged = prevUnitIdRef.current !== currentUnit.id;
    const userChanged = prevUserKeyRef.current !== (currentUser?.name || currentUser?.id || "");
    const currentStageIsValid = currentUnit.stages.some((s) => s.id === selectedStageId);

    // Only auto-determine stage on initial load, unit change, user change, or if current stage is invalid
    if (unitChanged || userChanged || !currentStageIsValid) {
      prevUnitIdRef.current = currentUnit.id;
      prevUserKeyRef.current = currentUser?.name || currentUser?.id || "";

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
      } else {
        setSelectedStageId(currentUnit.stages[0].id);
      }
    }
  }, [currentUnit?.id, currentUnit?.stages, currentUser?.name, currentUser?.id, selectedStageId]);

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
    ? (activeStage.title?.toUpperCase().includes("TÉCNICA") || activeStage.title?.toUpperCase().includes("TECNICA")
        ? "CAPACIDADES TÉCNICAS DA ETAPA"
        : activeStage.title?.toUpperCase().includes("BÁSICA") || activeStage.title?.toUpperCase().includes("BASICA")
        ? "CAPACIDADES BÁSICAS DA ETAPA"
        : "CAPACIDADES DA ETAPA")
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
  const [capacityCategory, setCapacityCategory] = useState<
    "basic_technical" | "socioemotional" | "basic_torneamento" | "basic_fresagem" | "technical_torneamento" | "technical_fresagem"
  >("basic_technical");
  const [capacityModalText, setCapacityModalText] = useState("");

  const isCurrentFUSI = getStandardUcKey(currentUnit || {}) === "FUSI" || currentUnit?.acronym?.toUpperCase() === "FUSI";

  const fusiBasicTorneamento: string[] =
    currentUnit?.basicCapacitiesTorneamento && currentUnit.basicCapacitiesTorneamento.length > 0
      ? currentUnit.basicCapacitiesTorneamento
      : defaultMatchingUnit?.basicCapacitiesTorneamento || [];

  const fusiBasicFresagem: string[] =
    currentUnit?.basicCapacitiesFresagem && currentUnit.basicCapacitiesFresagem.length > 0
      ? currentUnit.basicCapacitiesFresagem
      : defaultMatchingUnit?.basicCapacitiesFresagem || [];

  const fusiTechTorneamento: string[] =
    currentUnit?.technicalCapacitiesTorneamento && currentUnit.technicalCapacitiesTorneamento.length > 0
      ? currentUnit.technicalCapacitiesTorneamento
      : defaultMatchingUnit?.technicalCapacitiesTorneamento || [];

  const fusiTechFresagem: string[] =
    currentUnit?.technicalCapacitiesFresagem && currentUnit.technicalCapacitiesFresagem.length > 0
      ? currentUnit.technicalCapacitiesFresagem
      : defaultMatchingUnit?.technicalCapacitiesFresagem || [];

  const handleOpenAddCapacity = (
    category: "basic_technical" | "socioemotional" | "basic_torneamento" | "basic_fresagem" | "technical_torneamento" | "technical_fresagem"
  ) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingCapacityIndex(null);
    setCapacityCategory(category);
    setCapacityModalText("");
    setIsCapacityModalOpen(true);
  };

  const handleOpenEditCapacity = (
    category: "basic_technical" | "socioemotional" | "basic_torneamento" | "basic_fresagem" | "technical_torneamento" | "technical_fresagem",
    index: number,
    currentText: string
  ) => {
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

    if (capacityCategory === "basic_torneamento") {
      const list = [...fusiBasicTorneamento];
      const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
      handleUpdateCurrentUnit({ ...currentUnit, basicCapacitiesTorneamento: nextList });
    } else if (capacityCategory === "basic_fresagem") {
      const list = [...fusiBasicFresagem];
      const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
      handleUpdateCurrentUnit({ ...currentUnit, basicCapacitiesFresagem: nextList });
    } else if (capacityCategory === "technical_torneamento") {
      const list = [...fusiTechTorneamento];
      const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
      handleUpdateCurrentUnit({ ...currentUnit, technicalCapacitiesTorneamento: nextList });
    } else if (capacityCategory === "technical_fresagem") {
      const list = [...fusiTechFresagem];
      const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
      handleUpdateCurrentUnit({ ...currentUnit, technicalCapacitiesFresagem: nextList });
    } else if (activeStage) {
      if (capacityCategory === "socioemotional") {
        const list = [...(activeStage.socioemotionalCapacities || [])];
        const nextList = isAdding ? [...list, text] : list.map((c, i) => (i === editingCapacityIndex ? text : c));
        handleUpdateActiveStage({ socioemotionalCapacities: nextList });
      } else {
        const hasBasic = activeStage.basicCapacities !== undefined && activeStage.basicCapacities !== null;
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
  const [insertRubricAfterIndex, setInsertRubricAfterIndex] = useState<number | null>(null);
  const [rubricForm, setRubricForm] = useState<RubricItem>({
    capacity: "",
    criteria: "",
    nsa: "",
    apo: "",
    par: "",
    aut: "",
  });

  const handleOpenAddRubric = (afterIndex?: number) => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    setEditingRubricIndex(null);
    setInsertRubricAfterIndex(afterIndex !== undefined ? afterIndex : null);
    setRubricForm({
      capacity: "",
      criteria: "",
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
    setInsertRubricAfterIndex(null);
    setRubricForm({
      capacity: rubric.capacity || "",
      criteria: rubric.criteria || rubric.criterios || "",
      nsa: rubric.nsa || "",
      apo: rubric.apo || "",
      par: rubric.par || "",
      aut: rubric.aut || "",
    });
    setIsRubricModalOpen(true);
  };

  const handleSaveRubric = () => {
    if (!currentUnit) return;
    const currentList = activeRubricsList;
    let nextList: RubricItem[];

    if (editingRubricIndex !== null) {
      nextList = currentList.map((item, idx) => (idx === editingRubricIndex ? { ...rubricForm } : item));
    } else if (insertRubricAfterIndex !== null && insertRubricAfterIndex >= 0 && insertRubricAfterIndex < currentList.length) {
      nextList = [
        ...currentList.slice(0, insertRubricAfterIndex + 1),
        { ...rubricForm },
        ...currentList.slice(insertRubricAfterIndex + 1),
      ];
    } else {
      nextList = [...currentList, { ...rubricForm }];
    }

    if (activeStage) {
      handleUpdateActiveStage({ rubrics: nextList });
    } else {
      handleUpdateCurrentUnit({
        ...currentUnit,
        rubrics: nextList,
      });
    }

    setIsRubricModalOpen(false);
    setInsertRubricAfterIndex(null);
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
  const [viewAllStagesChronological, setViewAllStagesChronological] = useState<boolean>(false);
  const [lessonForm, setLessonForm] = useState<Partial<LessonPlanItem & { stageId?: string }>>({
    date: "",
    hours: "4h",
    professor: "Prof. Ricardo Beretella",
    conhecimentos: "",
    estrategias: "",
    recursos: "Laboratório / Oficina de Usinagem, ferramentas e EPIs",
    capacities: "Demonstrar conhecimento técnico e visão operacional",
    criteriosAvaliacao: "",
    instrumentosAvaliacao: "",
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
      criteriosAvaliacao: "Atendimento às tolerâncias dimensionais, normas de segurança NR-12 e acabamento superficial.",
      instrumentosAvaliacao: "Observação direta em oficina, ficha de autoinspeção e folha de processo.",
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
      criteriosAvaliacao: referenceLesson.criteriosAvaliacao || "",
      instrumentosAvaliacao: referenceLesson.instrumentosAvaliacao || "",
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
      criteriosAvaliacao: referenceLesson.criteriosAvaliacao || "",
      instrumentosAvaliacao: referenceLesson.instrumentosAvaliacao || "",
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
                  conhecimentos: lessonForm.conhecimentos !== undefined ? lessonForm.conhecimentos : item.conhecimentos,
                  estrategias: lessonForm.estrategias !== undefined ? lessonForm.estrategias : item.estrategias,
                  recursos: lessonForm.recursos !== undefined ? lessonForm.recursos : item.recursos,
                  capacities: lessonForm.capacities !== undefined ? lessonForm.capacities : item.capacities,
                  criteriosAvaliacao: lessonForm.criteriosAvaliacao !== undefined ? lessonForm.criteriosAvaliacao : (item.criteriosAvaliacao || ""),
                  instrumentosAvaliacao: lessonForm.instrumentosAvaliacao !== undefined ? lessonForm.instrumentosAvaliacao : (item.instrumentosAvaliacao || ""),
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
            criteriosAvaliacao: lessonForm.criteriosAvaliacao || "",
            instrumentosAvaliacao: lessonForm.instrumentosAvaliacao || "",
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
                conhecimentos: lessonForm.conhecimentos !== undefined ? lessonForm.conhecimentos : item.conhecimentos,
                estrategias: lessonForm.estrategias !== undefined ? lessonForm.estrategias : item.estrategias,
                recursos: lessonForm.recursos !== undefined ? lessonForm.recursos : item.recursos,
                capacities: lessonForm.capacities !== undefined ? lessonForm.capacities : item.capacities,
                criteriosAvaliacao: lessonForm.criteriosAvaliacao !== undefined ? lessonForm.criteriosAvaliacao : (item.criteriosAvaliacao || ""),
                instrumentosAvaliacao: lessonForm.instrumentosAvaliacao !== undefined ? lessonForm.instrumentosAvaliacao : (item.instrumentosAvaliacao || ""),
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
          criteriosAvaliacao: lessonForm.criteriosAvaliacao || "",
          instrumentosAvaliacao: lessonForm.instrumentosAvaliacao || "",
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

  // 6. CROSS-PROFESSOR / CROSS-UC LESSON PLAN IMPORT STATE & HANDLERS
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sourceSyllabusId, setSourceSyllabusId] = useState<string>("");
  const [sourceUnitId, setSourceUnitId] = useState<string>("");
  const [sourceStageId, setSourceStageId] = useState<string>("todas");
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [targetStageId, setTargetStageId] = useState<string>("todas");
  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const [updateProfessorNameToCurrent, setUpdateProfessorNameToCurrent] = useState<boolean>(true);
  const [sourceLessonSearch, setSourceLessonSearch] = useState<string>("");

  const sourceSyllabusObj = React.useMemo(() => {
    return availableSyllabi.find((s) => s.id === sourceSyllabusId) || availableSyllabi[0] || syllabus;
  }, [availableSyllabi, sourceSyllabusId, syllabus]);

  const sourceUnitObj = React.useMemo(() => {
    if (!sourceSyllabusObj?.programmaticContent) return null;
    return (
      sourceSyllabusObj.programmaticContent.find((u) => u.id === sourceUnitId) ||
      sourceSyllabusObj.programmaticContent[0] ||
      null
    );
  }, [sourceSyllabusObj, sourceUnitId]);

  const availableSourceLessons: Array<LessonPlanItem & { stageIndex?: number; stageName?: string }> = React.useMemo(() => {
    if (!sourceUnitObj) return [];
    if (sourceUnitObj.stages && sourceUnitObj.stages.length > 0) {
      if (sourceStageId === "todas") {
        return sourceUnitObj.stages.flatMap((st, sIdx) =>
          (st.lessonPlan || []).map((item) => ({
            ...item,
            stageIndex: sIdx,
            stageName: `Etapa ${sIdx + 1}: ${st.turma || st.title.replace(/^\d+\.\s*/, "")}`,
          }))
        );
      } else {
        const st = sourceUnitObj.stages.find((s) => s.id === sourceStageId);
        const sIdx = sourceUnitObj.stages.findIndex((s) => s.id === sourceStageId);
        return (st?.lessonPlan || []).map((item) => ({
          ...item,
          stageIndex: sIdx >= 0 ? sIdx : 0,
          stageName: `Etapa ${(sIdx >= 0 ? sIdx : 0) + 1}: ${st?.turma || st?.title.replace(/^\d+\.\s*/, "")}`,
        }));
      }
    }
    return (sourceUnitObj.lessonPlan || []).map((item) => ({
      ...item,
      stageIndex: 0,
      stageName: sourceUnitObj.unitTitle,
    }));
  }, [sourceUnitObj, sourceStageId]);

  // Filter source lessons by search query inside the modal
  const filteredSourceLessons = React.useMemo(() => {
    if (!sourceLessonSearch.trim()) return availableSourceLessons;
    const q = sourceLessonSearch.toLowerCase().trim();
    return availableSourceLessons.filter(
      (l) =>
        (l.date || "").toLowerCase().includes(q) ||
        (l.conhecimentos || "").toLowerCase().includes(q) ||
        (l.estrategias || "").toLowerCase().includes(q) ||
        (l.recursos || "").toLowerCase().includes(q) ||
        (l.capacities || "").toLowerCase().includes(q) ||
        (l.stageName || "").toLowerCase().includes(q) ||
        (l.professor || "").toLowerCase().includes(q)
    );
  }, [availableSourceLessons, sourceLessonSearch]);

  const handleOpenImportModal = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    // Automatically select the other professor's syllabus if available
    const otherSyllabus = availableSyllabi.find((s) => s.id !== syllabus.id) || availableSyllabi[0] || syllabus;
    const initialSourceSyllabusId = otherSyllabus?.id || syllabus.id;
    setSourceSyllabusId(initialSourceSyllabusId);

    const targetUcKey = getStandardUcKey(currentUnit);
    const sourceSyl = availableSyllabi.find((s) => s.id === initialSourceSyllabusId) || otherSyllabus;
    const matchedUnit =
      sourceSyl?.programmaticContent?.find(
        (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
      ) || sourceSyl?.programmaticContent?.[0];

    const initialSourceUnitId = matchedUnit?.id || "";
    setSourceUnitId(initialSourceUnitId);
    setSourceStageId("todas");
    setTargetStageId(selectedStageId || (currentUnit?.stages?.[0]?.id ? "todas" : ""));
    setImportMode("append");
    setUpdateProfessorNameToCurrent(true);
    setSourceLessonSearch("");

    if (matchedUnit) {
      const raw =
        matchedUnit.stages && matchedUnit.stages.length > 0
          ? matchedUnit.stages.flatMap((st) => st.lessonPlan || [])
          : matchedUnit.lessonPlan || [];
      setSelectedLessonIds(raw.map((l) => l.id));
    } else {
      setSelectedLessonIds([]);
    }

    setIsImportModalOpen(true);
  };

  const handleSelectAllSourceLessons = () => {
    setSelectedLessonIds(availableSourceLessons.map((l) => l.id));
  };

  const handleDeselectAllSourceLessons = () => {
    setSelectedLessonIds([]);
  };

  const handleToggleSourceLessonSelect = (id: string) => {
    setSelectedLessonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmImportLessons = () => {
    if (!currentUnit) return;
    const lessonsToCopy = availableSourceLessons.filter((l) => selectedLessonIds.includes(l.id));
    if (lessonsToCopy.length === 0) return;

    const profName = updateProfessorNameToCurrent
      ? currentUser?.name?.includes("Gea")
        ? "Prof. Ricardo Gea"
        : "Prof. Ricardo Beretella"
      : undefined;

    const clonedItems: LessonPlanItem[] = lessonsToCopy.map((l, idx) => ({
      ...l,
      id: `lp-copy-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      professor:
        profName ||
        l.professor ||
        (currentUser?.name?.includes("Gea") ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella"),
      status: "planejada" as const,
    }));

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const updatedStages = currentUnit.stages.map((stage, sIdx) => {
        if (targetStageId !== "todas") {
          if (stage.id === targetStageId) {
            const formatted = clonedItems.map((item) => ({
              ...item,
              stageId: stage.id,
              stageTitle: stage.title,
              stageTurma: stage.turma,
            }));
            const newPlan =
              importMode === "replace" ? formatted : [...(stage.lessonPlan || []), ...formatted];
            return { ...stage, lessonPlan: newPlan };
          }
          return stage;
        }

        // targetStageId is "todas": map matching stageIndex or distribute
        const matchingItemsForStage = clonedItems.filter((item: any) => item.stageIndex === sIdx);
        const itemsToPut =
          matchingItemsForStage.length > 0 ? matchingItemsForStage : sIdx === 0 ? clonedItems : [];

        const formatted = itemsToPut.map((item) => ({
          ...item,
          stageId: stage.id,
          stageTitle: stage.title,
          stageTurma: stage.turma,
        }));

        const newPlan =
          importMode === "replace" ? formatted : [...(stage.lessonPlan || []), ...formatted];
        return { ...stage, lessonPlan: newPlan };
      });

      const mergedList = updatedStages.flatMap((st) =>
        (st.lessonPlan || []).map((lp) => ({
          ...lp,
          stageId: st.id,
          stageTitle: st.title,
          stageTurma: st.turma,
        }))
      );

      handleUpdateCurrentUnit({
        ...currentUnit,
        stages: updatedStages,
        lessonPlan: mergedList,
      });
    } else {
      const newPlan =
        importMode === "replace" ? clonedItems : [...(currentUnit.lessonPlan || []), ...clonedItems];
      handleUpdateCurrentUnit({
        ...currentUnit,
        lessonPlan: newPlan,
      });
    }

    setIsImportModalOpen(false);
  };

  // 7. CROSS-PROFESSOR / CROSS-UC GERAL (CAPACIDADES & CONHECIMENTOS) IMPORT
  const [isImportGeneralModalOpen, setIsImportGeneralModalOpen] = useState(false);
  const [sourceGeneralSyllabusId, setSourceGeneralSyllabusId] = useState<string>("");
  const [sourceGeneralUnitId, setSourceGeneralUnitId] = useState<string>("");
  const [sourceGeneralStageId, setSourceGeneralStageId] = useState<string>("todas");
  const [selectedGeneralPrimaryCaps, setSelectedGeneralPrimaryCaps] = useState<string[]>([]);
  const [selectedGeneralSocioCaps, setSelectedGeneralSocioCaps] = useState<string[]>([]);
  const [selectedGeneralTopics, setSelectedGeneralTopics] = useState<string[]>([]);
  const [targetGeneralStageId, setTargetGeneralStageId] = useState<string>("todas");
  const [generalImportMode, setGeneralImportMode] = useState<"replace" | "append">("append");
  const [generalSearch, setGeneralSearch] = useState<string>("");

  const sourceGeneralSyllabusObj = React.useMemo(() => {
    return availableSyllabi.find((s) => s.id === sourceGeneralSyllabusId) || availableSyllabi[0] || syllabus;
  }, [availableSyllabi, sourceGeneralSyllabusId, syllabus]);

  const sourceGeneralUnitObj = React.useMemo(() => {
    if (!sourceGeneralSyllabusObj?.programmaticContent) return null;
    return (
      sourceGeneralSyllabusObj.programmaticContent.find((u) => u.id === sourceGeneralUnitId) ||
      sourceGeneralSyllabusObj.programmaticContent[0] ||
      null
    );
  }, [sourceGeneralSyllabusObj, sourceGeneralUnitId]);

  const availableSourceGeneralData = React.useMemo(() => {
    if (!sourceGeneralUnitObj) {
      return { primaryCaps: [], socioCaps: [], topics: [] };
    }
    if (sourceGeneralUnitObj.stages && sourceGeneralUnitObj.stages.length > 0) {
      if (sourceGeneralStageId === "todas") {
        const primary = Array.from(
          new Set(
            sourceGeneralUnitObj.stages.flatMap((st) => [
              ...(st.basicCapacities || []),
              ...(st.technicalCapacities || []),
            ])
          )
        );
        const socio = Array.from(
          new Set(
            sourceGeneralUnitObj.stages.flatMap((st) => st.socioemotionalCapacities || [])
          )
        );
        const topics = Array.from(
          new Set(sourceGeneralUnitObj.stages.flatMap((st) => st.topics || []))
        );
        return {
          primaryCaps: primary.length > 0 ? primary : sourceGeneralUnitObj.technicalCapacities || sourceGeneralUnitObj.basicCapacities || [],
          socioCaps: socio.length > 0 ? socio : sourceGeneralUnitObj.socioemotionalCapacities || [],
          topics: topics.length > 0 ? topics : sourceGeneralUnitObj.topics || [],
        };
      } else {
        const st = sourceGeneralUnitObj.stages.find((s) => s.id === sourceGeneralStageId);
        const primary = st ? [...(st.basicCapacities || []), ...(st.technicalCapacities || [])] : [];
        return {
          primaryCaps: primary.length > 0 ? primary : sourceGeneralUnitObj.technicalCapacities || sourceGeneralUnitObj.basicCapacities || [],
          socioCaps: st?.socioemotionalCapacities || sourceGeneralUnitObj.socioemotionalCapacities || [],
          topics: st?.topics || sourceGeneralUnitObj.topics || [],
        };
      }
    }

    const primary = [
      ...(sourceGeneralUnitObj.technicalCapacities || []),
      ...(sourceGeneralUnitObj.basicCapacities || []),
    ];
    return {
      primaryCaps: Array.from(new Set(primary)),
      socioCaps: sourceGeneralUnitObj.socioemotionalCapacities || [],
      topics: sourceGeneralUnitObj.topics || [],
    };
  }, [sourceGeneralUnitObj, sourceGeneralStageId]);

  const handleOpenImportGeneralModal = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    const otherSyllabus = availableSyllabi.find((s) => s.id !== syllabus.id) || availableSyllabi[0] || syllabus;
    const initialSourceSyllabusId = otherSyllabus?.id || syllabus.id;
    setSourceGeneralSyllabusId(initialSourceSyllabusId);

    const targetUcKey = getStandardUcKey(currentUnit);
    const sourceSyl = availableSyllabi.find((s) => s.id === initialSourceSyllabusId) || otherSyllabus;
    const matchedUnit =
      sourceSyl?.programmaticContent?.find(
        (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
      ) || sourceSyl?.programmaticContent?.[0];

    const initialSourceUnitId = matchedUnit?.id || "";
    setSourceGeneralUnitId(initialSourceUnitId);
    setSourceGeneralStageId("todas");
    setTargetGeneralStageId(selectedStageId || (currentUnit?.stages?.[0]?.id ? "todas" : ""));
    setGeneralImportMode("append");
    setGeneralSearch("");

    if (matchedUnit) {
      const primary = Array.from(
        new Set([
          ...(matchedUnit.technicalCapacities || []),
          ...(matchedUnit.basicCapacities || []),
          ...(matchedUnit.stages?.flatMap((st) => [...(st.basicCapacities || []), ...(st.technicalCapacities || [])]) || []),
        ])
      );
      const socio = Array.from(
        new Set([
          ...(matchedUnit.socioemotionalCapacities || []),
          ...(matchedUnit.stages?.flatMap((st) => st.socioemotionalCapacities || []) || []),
        ])
      );
      const topics = Array.from(
        new Set([
          ...(matchedUnit.topics || []),
          ...(matchedUnit.stages?.flatMap((st) => st.topics || []) || []),
        ])
      );
      setSelectedGeneralPrimaryCaps(primary);
      setSelectedGeneralSocioCaps(socio);
      setSelectedGeneralTopics(topics);
    } else {
      setSelectedGeneralPrimaryCaps([]);
      setSelectedGeneralSocioCaps([]);
      setSelectedGeneralTopics([]);
    }

    setIsImportGeneralModalOpen(true);
  };

  const handleConfirmImportGeneral = () => {
    if (!currentUnit) return;

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const updatedStages = currentUnit.stages.map((stage) => {
        if (targetGeneralStageId !== "todas" && stage.id !== targetGeneralStageId) {
          return stage;
        }

        const isBasic = stage.basicCapacities !== undefined && stage.basicCapacities !== null;
        const newPrimaryBasic = isBasic
          ? generalImportMode === "replace"
            ? selectedGeneralPrimaryCaps
            : Array.from(new Set([...(stage.basicCapacities || []), ...selectedGeneralPrimaryCaps]))
          : stage.basicCapacities;

        const newPrimaryTech = !isBasic
          ? generalImportMode === "replace"
            ? selectedGeneralPrimaryCaps
            : Array.from(new Set([...(stage.technicalCapacities || []), ...selectedGeneralPrimaryCaps]))
          : stage.technicalCapacities;

        const newSocio =
          generalImportMode === "replace"
            ? selectedGeneralSocioCaps
            : Array.from(new Set([...(stage.socioemotionalCapacities || []), ...selectedGeneralSocioCaps]));

        const newTopics =
          generalImportMode === "replace"
            ? selectedGeneralTopics
            : Array.from(new Set([...(stage.topics || []), ...selectedGeneralTopics]));

        return {
          ...stage,
          basicCapacities: newPrimaryBasic,
          technicalCapacities: newPrimaryTech,
          socioemotionalCapacities: newSocio,
          topics: newTopics,
        };
      });

      handleUpdateCurrentUnit({
        ...currentUnit,
        stages: updatedStages,
      });
    } else {
      const hasTech = Array.isArray(currentUnit.technicalCapacities) && currentUnit.technicalCapacities.length > 0;
      const newTech = hasTech
        ? generalImportMode === "replace"
          ? selectedGeneralPrimaryCaps
          : Array.from(new Set([...(currentUnit.technicalCapacities || []), ...selectedGeneralPrimaryCaps]))
        : currentUnit.technicalCapacities;

      const newBasic = !hasTech
        ? generalImportMode === "replace"
          ? selectedGeneralPrimaryCaps
          : Array.from(new Set([...(currentUnit.basicCapacities || []), ...selectedGeneralPrimaryCaps]))
        : currentUnit.basicCapacities;

      const newSocio =
        generalImportMode === "replace"
          ? selectedGeneralSocioCaps
          : Array.from(new Set([...(currentUnit.socioemotionalCapacities || []), ...selectedGeneralSocioCaps]));

      const newTopics =
        generalImportMode === "replace"
          ? selectedGeneralTopics
          : Array.from(new Set([...(currentUnit.topics || []), ...selectedGeneralTopics]));

      handleUpdateCurrentUnit({
        ...currentUnit,
        technicalCapacities: newTech,
        basicCapacities: newBasic,
        socioemotionalCapacities: newSocio,
        topics: newTopics,
      });
    }

    setIsImportGeneralModalOpen(false);
  };

  // 8. CROSS-PROFESSOR / CROSS-UC SITUAÇÃO-PROBLEMA IMPORT
  const [isImportSPModalOpen, setIsImportSPModalOpen] = useState(false);
  const [sourceSPSyllabusId, setSourceSPSyllabusId] = useState<string>("");
  const [sourceSPUnitId, setSourceSPUnitId] = useState<string>("");
  const [sourceSPStageId, setSourceSPStageId] = useState<string>("todas");
  const [targetSPStageId, setTargetSPStageId] = useState<string>("todas");

  const sourceSPSyllabusObj = React.useMemo(() => {
    return availableSyllabi.find((s) => s.id === sourceSPSyllabusId) || availableSyllabi[0] || syllabus;
  }, [availableSyllabi, sourceSPSyllabusId, syllabus]);

  const sourceSPUnitObj = React.useMemo(() => {
    if (!sourceSPSyllabusObj?.programmaticContent) return null;
    return (
      sourceSPSyllabusObj.programmaticContent.find((u) => u.id === sourceSPUnitId) ||
      sourceSPSyllabusObj.programmaticContent[0] ||
      null
    );
  }, [sourceSPSyllabusObj, sourceSPUnitId]);

  const availableSourceSP: SituationProblem | null = React.useMemo(() => {
    if (!sourceSPUnitObj) return null;
    if (sourceSPUnitObj.stages && sourceSPUnitObj.stages.length > 0) {
      if (sourceSPStageId === "todas") {
        const stWithSP = sourceSPUnitObj.stages.find((s) => s.situationProblem && s.situationProblem.title);
        return stWithSP?.situationProblem || sourceSPUnitObj.stages[0]?.situationProblem || sourceSPUnitObj.situationProblem || null;
      } else {
        const st = sourceSPUnitObj.stages.find((s) => s.id === sourceSPStageId);
        return st?.situationProblem || sourceSPUnitObj.situationProblem || null;
      }
    }
    return sourceSPUnitObj.situationProblem || null;
  }, [sourceSPUnitObj, sourceSPStageId]);

  const handleOpenImportSPModal = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    const otherSyllabus = availableSyllabi.find((s) => s.id !== syllabus.id) || availableSyllabi[0] || syllabus;
    const initialSourceSyllabusId = otherSyllabus?.id || syllabus.id;
    setSourceSPSyllabusId(initialSourceSyllabusId);

    const targetUcKey = getStandardUcKey(currentUnit);
    const sourceSyl = availableSyllabi.find((s) => s.id === initialSourceSyllabusId) || otherSyllabus;
    const matchedUnit =
      sourceSyl?.programmaticContent?.find(
        (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
      ) || sourceSyl?.programmaticContent?.[0];

    const initialSourceUnitId = matchedUnit?.id || "";
    setSourceSPUnitId(initialSourceUnitId);
    setSourceSPStageId("todas");
    setTargetSPStageId(selectedStageId || (currentUnit?.stages?.[0]?.id ? "todas" : ""));

    setIsImportSPModalOpen(true);
  };

  const handleConfirmImportSP = () => {
    if (!currentUnit || !availableSourceSP) return;

    const clonedSP: SituationProblem = {
      title: availableSourceSP.title || `Situação de Aprendizagem - ${currentUnit.unitTitle}`,
      contextualization: availableSourceSP.contextualization || "",
      challenge: [...(availableSourceSP.challenge || [])],
      expectedResults: [...(availableSourceSP.expectedResults || [])],
    };

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const updatedStages = currentUnit.stages.map((stage) => {
        if (targetSPStageId !== "todas" && stage.id !== targetSPStageId) {
          return stage;
        }
        return {
          ...stage,
          situationProblem: clonedSP,
        };
      });

      handleUpdateCurrentUnit({
        ...currentUnit,
        situationProblem: clonedSP,
        stages: updatedStages,
      });
    } else {
      handleUpdateCurrentUnit({
        ...currentUnit,
        situationProblem: clonedSP,
      });
    }

    setIsImportSPModalOpen(false);
  };

  // 9. CROSS-PROFESSOR / CROSS-UC RUBRICAS IMPORT
  const [isImportRubricsModalOpen, setIsImportRubricsModalOpen] = useState(false);
  const [sourceRubricsSyllabusId, setSourceRubricsSyllabusId] = useState<string>("");
  const [sourceRubricsUnitId, setSourceRubricsUnitId] = useState<string>("");
  const [sourceRubricsStageId, setSourceRubricsStageId] = useState<string>("todas");
  const [selectedRubricIndices, setSelectedRubricIndices] = useState<number[]>([]);
  const [targetRubricsStageId, setTargetRubricsStageId] = useState<string>("todas");
  const [rubricsImportMode, setRubricsImportMode] = useState<"replace" | "append">("append");
  const [rubricsSearch, setRubricsSearch] = useState<string>("");

  const sourceRubricsSyllabusObj = React.useMemo(() => {
    return availableSyllabi.find((s) => s.id === sourceRubricsSyllabusId) || availableSyllabi[0] || syllabus;
  }, [availableSyllabi, sourceRubricsSyllabusId, syllabus]);

  const sourceRubricsUnitObj = React.useMemo(() => {
    if (!sourceRubricsSyllabusObj?.programmaticContent) return null;
    return (
      sourceRubricsSyllabusObj.programmaticContent.find((u) => u.id === sourceRubricsUnitId) ||
      sourceRubricsSyllabusObj.programmaticContent[0] ||
      null
    );
  }, [sourceRubricsSyllabusObj, sourceRubricsUnitId]);

  const availableSourceRubrics: RubricItem[] = React.useMemo(() => {
    if (!sourceRubricsUnitObj) return [];
    if (sourceRubricsUnitObj.stages && sourceRubricsUnitObj.stages.length > 0) {
      if (sourceRubricsStageId === "todas") {
        return sourceRubricsUnitObj.stages.flatMap((st) => st.rubrics || []);
      } else {
        const st = sourceRubricsUnitObj.stages.find((s) => s.id === sourceRubricsStageId);
        return st?.rubrics || [];
      }
    }
    return sourceRubricsUnitObj.rubrics || [];
  }, [sourceRubricsUnitObj, sourceRubricsStageId]);

  const filteredSourceRubrics = React.useMemo(() => {
    if (!rubricsSearch.trim()) return availableSourceRubrics;
    const q = rubricsSearch.toLowerCase().trim();
    return availableSourceRubrics.filter(
      (r) =>
        (r.capacity || "").toLowerCase().includes(q) ||
        (r.criteria || "").toLowerCase().includes(q) ||
        (r.criterios || "").toLowerCase().includes(q) ||
        (r.nsa || "").toLowerCase().includes(q) ||
        (r.apo || "").toLowerCase().includes(q) ||
        (r.par || "").toLowerCase().includes(q) ||
        (r.aut || "").toLowerCase().includes(q)
    );
  }, [availableSourceRubrics, rubricsSearch]);

  const handleOpenImportRubricsModal = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }
    const otherSyllabus = availableSyllabi.find((s) => s.id !== syllabus.id) || availableSyllabi[0] || syllabus;
    const initialSourceSyllabusId = otherSyllabus?.id || syllabus.id;
    setSourceRubricsSyllabusId(initialSourceSyllabusId);

    const targetUcKey = getStandardUcKey(currentUnit);
    const sourceSyl = availableSyllabi.find((s) => s.id === initialSourceSyllabusId) || otherSyllabus;
    const matchedUnit =
      sourceSyl?.programmaticContent?.find(
        (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
      ) || sourceSyl?.programmaticContent?.[0];

    const initialSourceUnitId = matchedUnit?.id || "";
    setSourceRubricsUnitId(initialSourceUnitId);
    setSourceRubricsStageId("todas");
    setTargetRubricsStageId(selectedStageId || (currentUnit?.stages?.[0]?.id ? "todas" : ""));
    setRubricsImportMode("append");
    setRubricsSearch("");

    const rubricsInMatched = matchedUnit?.stages && matchedUnit.stages.length > 0
      ? matchedUnit.stages.flatMap((st) => st.rubrics || [])
      : matchedUnit?.rubrics || [];

    setSelectedRubricIndices(rubricsInMatched.map((_, i) => i));
    setIsImportRubricsModalOpen(true);
  };

  const handleConfirmImportRubrics = () => {
    if (!currentUnit) return;
    const rubricsToCopy = availableSourceRubrics.filter((_, idx) => selectedRubricIndices.includes(idx));
    if (rubricsToCopy.length === 0) return;

    const clonedRubrics: RubricItem[] = rubricsToCopy.map((r) => ({
      capacity: r.capacity || "",
      nsa: r.nsa || "",
      apo: r.apo || "",
      par: r.par || "",
      aut: r.aut || "",
    }));

    if (currentUnit.stages && currentUnit.stages.length > 0) {
      const updatedStages = currentUnit.stages.map((stage) => {
        if (targetRubricsStageId !== "todas" && stage.id !== targetRubricsStageId) {
          return stage;
        }
        const newRubrics =
          rubricsImportMode === "replace"
            ? clonedRubrics
            : [...(stage.rubrics || []), ...clonedRubrics];
        return { ...stage, rubrics: newRubrics };
      });

      handleUpdateCurrentUnit({
        ...currentUnit,
        stages: updatedStages,
      });
    } else {
      const newRubrics =
        rubricsImportMode === "replace"
          ? clonedRubrics
          : [...(currentUnit.rubrics || []), ...clonedRubrics];
      handleUpdateCurrentUnit({
        ...currentUnit,
        rubrics: newRubrics,
      });
    }

    setIsImportRubricsModalOpen(false);
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
        ((item.recursos || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())) ||
        ((item.criteriosAvaliacao || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())) ||
        ((item.instrumentosAvaliacao || "").toString().toLowerCase().includes(lessonPlanSearch.toLowerCase())) ||
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
          const ucColor = getUcColor(unit);
          const isSelected = unit.id === (currentUnit?.id || selectedUnitId);

          return (
            <button
              key={unit.id}
              onClick={() => setSelectedUnitId(unit.id)}
              className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 border flex items-center gap-2 ${
                isSelected
                  ? `${ucColor.bg} text-white ${ucColor.border} shadow-lg ring-2 ${ucColor.ring}`
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-white" : ucColor.dotColor}`} />
              <span>{acronym}</span>
              {unit.workload && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                    isSelected ? "bg-black/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
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
                <span className={`inline-block px-3.5 py-1 ${getUcColor(currentUnit).bg} text-white font-black text-[11px] rounded-lg uppercase tracking-wider shadow-sm`}>
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
                        `Deseja sincronizar e restaurar a estrutura padrão oficial SENAI (ProEducador) para ${currentUnit.unitTitle}? Isso atualizará as etapas (turmas), capacidades, situação-problema e rubricas para a versão oficial.`
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
              <div className="flex items-center gap-1.5 py-2 sm:py-2 shrink-0">
                <button
                  onClick={() => {
                    if (currentUnit) {
                      const activeProf = currentUser?.name?.toLowerCase().includes("gea")
                        ? "Prof. Ricardo Gea"
                        : (currentUser?.name || syllabus.professorName || "Prof. Ricardo Beretella");
                      printUnidadeCurricularPDF(currentUnit, syllabus, {
                        activeStage: activeStage || null,
                        printAllStages: false,
                        professorName: activeProf,
                      });
                    } else if (onPrint) {
                      onPrint();
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-xs"
                  title={activeStage ? `Imprimir em PDF (${activeStage.title})` : "Imprimir Plano de Ensino em PDF"}
                >
                  <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>IMPRIMIR PDF</span>
                </button>

                {currentUnit?.stages && currentUnit.stages.length > 0 && (
                  <button
                    onClick={() => {
                      if (currentUnit) {
                        const activeProf = currentUser?.name?.toLowerCase().includes("gea")
                          ? "Prof. Ricardo Gea"
                          : (currentUser?.name || syllabus.professorName || "Prof. Ricardo Beretella");
                        printUnidadeCurricularPDF(currentUnit, syllabus, {
                          activeStage: null,
                          printAllStages: true,
                          professorName: activeProf,
                        });
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-xs"
                    title="Imprimir Todas as Etapas e Rotações da Unidade Curricular (Documento Completo)"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">TODAS AS ETAPAS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Body Content */}
            <div className="p-6 sm:p-10 text-slate-900 dark:text-slate-100 space-y-8">
              
              {/* TAB 1: GERAL */}
              {activeUcTab === "GERAL" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  
                  {/* Top Bar with Copy Feature */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Capacidades Básicas, Técnicas, Socioemocionais e Conhecimentos</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Definição do perfil de competências e matriz de conhecimentos da Unidade Curricular
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={handleOpenImportGeneralModal}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                        title="Copiar capacidades e conhecimentos de outro professor ou unidade curricular"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Geral de Outro Professor / UC</span>
                      </button>
                    )}
                  </div>

                  {/* Capacities Grid */}
                  {isCurrentFUSI ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. Capacidades Básicas - Torneamento */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              <span>CAPACIDADES BÁSICAS • TORNEAMENTO</span>
                            </h3>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenAddCapacity("basic_torneamento")}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ADICIONAR</span>
                              </button>
                            )}
                          </div>

                          <div className="bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 min-h-[120px] space-y-2">
                            {fusiBasicTorneamento.length > 0 ? (
                              fusiBasicTorneamento.map((cap, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                                >
                                  <span className="leading-relaxed">{cap}</span>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleOpenEditCapacity("basic_torneamento", i, cap)}
                                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                        title="Editar capacidade"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const next = fusiBasicTorneamento.filter((_, idx) => idx !== i);
                                          handleUpdateCurrentUnit({ ...currentUnit, basicCapacitiesTorneamento: next });
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

                        {/* 2. Capacidades Básicas - Fresagem */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>CAPACIDADES BÁSICAS • FRESAGEM</span>
                            </h3>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenAddCapacity("basic_fresagem")}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ADICIONAR</span>
                              </button>
                            )}
                          </div>

                          <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 min-h-[120px] space-y-2">
                            {fusiBasicFresagem.length > 0 ? (
                              fusiBasicFresagem.map((cap, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                                >
                                  <span className="leading-relaxed">{cap}</span>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleOpenEditCapacity("basic_fresagem", i, cap)}
                                        className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                                        title="Editar capacidade"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const next = fusiBasicFresagem.filter((_, idx) => idx !== i);
                                          handleUpdateCurrentUnit({ ...currentUnit, basicCapacitiesFresagem: next });
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

                        {/* 3. Capacidades Técnicas - Torneamento */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                              <span>CAPACIDADES TÉCNICAS • TORNEAMENTO</span>
                            </h3>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenAddCapacity("technical_torneamento")}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ADICIONAR</span>
                              </button>
                            )}
                          </div>

                          <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 min-h-[120px] space-y-2">
                            {fusiTechTorneamento.length > 0 ? (
                              fusiTechTorneamento.map((cap, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                                >
                                  <span className="leading-relaxed">{cap}</span>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleOpenEditCapacity("technical_torneamento", i, cap)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                        title="Editar capacidade"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const next = fusiTechTorneamento.filter((_, idx) => idx !== i);
                                          handleUpdateCurrentUnit({ ...currentUnit, technicalCapacitiesTorneamento: next });
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

                        {/* 4. Capacidades Técnicas - Fresagem */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-amber-600" />
                              <span>CAPACIDADES TÉCNICAS • FRESAGEM</span>
                            </h3>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenAddCapacity("technical_fresagem")}
                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>ADICIONAR</span>
                              </button>
                            )}
                          </div>

                          <div className="bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 min-h-[120px] space-y-2">
                            {fusiTechFresagem.length > 0 ? (
                              fusiTechFresagem.map((cap, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                                >
                                  <span className="leading-relaxed">{cap}</span>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleOpenEditCapacity("technical_fresagem", i, cap)}
                                        className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer"
                                        title="Editar capacidade"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const next = fusiTechFresagem.filter((_, idx) => idx !== i);
                                          handleUpdateCurrentUnit({ ...currentUnit, technicalCapacitiesFresagem: next });
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

                      </div>

                      {/* Capacidades Socioemocionais Full Width */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>CAPACIDADES SOCIOEMOCIONAIS</span>
                          </h3>

                          {isAdmin && (
                            <button
                              onClick={() => handleOpenAddCapacity("socioemotional")}
                              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>ADICIONAR</span>
                            </button>
                          )}
                        </div>

                        <div className="bg-purple-50/40 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 min-h-[100px] space-y-2">
                          {activeSocioemotionalCapacities.length > 0 ? (
                            activeSocioemotionalCapacities.map((cap, i) => (
                              <div
                                key={i}
                                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 group"
                              >
                                <span className="leading-relaxed">{cap}</span>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditCapacity("socioemotional", i, cap)}
                                      className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer"
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
                  ) : (
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
                  )}

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
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={handleOpenImportSPModal}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Copiar situação-problema de outro professor ou UC"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>COPIAR DE OUTRO PROFESSOR</span>
                              </button>
                              <button
                                onClick={handleOpenEditSP}
                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>EDITAR SITUAÇÃO-PROBLEMA</span>
                              </button>
                            </div>
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
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <button
                            onClick={handleOpenImportSPModal}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>COPIAR SITUAÇÃO-PROBLEMA</span>
                          </button>
                          <button
                            onClick={handleOpenEditSP}
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>CADASTRAR SITUAÇÃO-PROBLEMA</span>
                          </button>
                        </div>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={handleOpenImportRubricsModal}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            title="Copiar rubricas de outro professor ou UC"
                          >
                            <Copy className="w-4 h-4" />
                            <span>COPIAR RUBRICAS</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddRubric()}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>NOVA RUBRICA</span>
                          </button>
                        </div>
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
                          <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2.5 flex-1 min-w-0">
                              {/* Linha 1: Capacidade */}
                              <div className="flex items-start sm:items-center gap-2.5 flex-wrap">
                                <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-black text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
                                  CAPACIDADE
                                </span>
                                <span className="font-black text-xs sm:text-sm uppercase text-slate-900 dark:text-slate-100 leading-snug">
                                  {rubric.capacity}
                                </span>
                              </div>

                              {/* Linha 2: Critérios */}
                              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                                <span className="px-2.5 py-1 rounded-md bg-slate-700 dark:bg-slate-700 text-slate-100 dark:text-slate-200 font-black text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
                                  CRITÉRIOS
                                </span>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                                  {rubric.criteria || rubric.criterios || "Avaliação da capacidade técnica e metodológica conforme padrões normativos, segurança e qualidade operacional."}
                                </p>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1 shrink-0 self-start md:self-center">
                                <button
                                  onClick={() => handleOpenAddRubric(idx)}
                                  className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-black"
                                  title="Inserir nova rubrica abaixo desta"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>INSERIR ABAIXO</span>
                                </button>
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

                          {/* Quick Insert Below Button */}
                          {isAdmin && (
                            <div className="px-5 pb-3 pt-0 flex justify-end">
                              <button
                                onClick={() => handleOpenAddRubric(idx)}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Inserir nova linha de rubrica abaixo da #${idx + 1}`}
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>+ Inserir Linha Abaixo</span>
                              </button>
                            </div>
                          )}
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
                      {isAdmin && (
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <button
                            onClick={handleOpenImportRubricsModal}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>COPIAR RUBRICAS DE OUTRO PROFESSOR</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddRubric()}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>CADASTRAR PRIMEIRA RUBRICA</span>
                          </button>
                        </div>
                      )}
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

                      {/* Action Buttons for Admin */}
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleOpenImportModal}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                            title="Copiar cronograma completo ou selecionar aulas de outro professor ou UC"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copiar de Outro Professor / UC</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddLesson()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Adicionar Aula</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Stage Info Bar (Directly synced with top stage selector) */}
                  {currentUnit.stages && currentUnit.stages.length > 0 && (
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-[11px] font-black uppercase rounded-lg bg-amber-500 text-slate-950 shadow-xs">
                          {activeStage ? `${activeStage.turma} • ${activeStage.title.replace(/^\d+\.\s*/, '')}` : "Etapa Ativa"}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {viewAllStagesChronological
                            ? `Exibindo todas as ${currentUnit.stages.length} etapas mescladas`
                            : `Exibindo cronograma da etapa selecionada no topo`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewAllStagesChronological(!viewAllStagesChronological)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewAllStagesChronological
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-400"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{viewAllStagesChronological ? "Voltar para Etapa Selecionada" : "Ver Todas as Etapas Mescladas"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Multi-Stage Content: Unified chronological sequence when selected, or active stage selected at top */}
                  {currentUnit.stages && currentUnit.stages.length > 0 ? (
                    viewAllStagesChronological ? (
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
                              (item.recursos || "").toLowerCase().includes(q) ||
                              (item.criteriosAvaliacao || "").toLowerCase().includes(q) ||
                              (item.instrumentosAvaliacao || "").toLowerCase().includes(q);
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
                                    TODAS AS ETAPAS • CRONOGRAMA POR DIA
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
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleOpenImportModal}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                                    title="Copiar cronograma ou aulas de outro professor"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar de Outro Professor</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenAddLesson(undefined, activeStage?.id || currentUnit.stages?.[0]?.id)}
                                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Adicionar Aula</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Master Unified Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-4 w-36 whitespace-nowrap">Data / Horas & Etapa</th>
                                    <th className="p-4">Capacidades</th>
                                    <th className="p-4">Conhecimentos</th>
                                    <th className="p-4">Estratégias</th>
                                    <th className="p-4 hidden md:table-cell">Recursos/Ambientes</th>
                                    <th className="p-4">Critérios de Avaliação</th>
                                    <th className="p-4">Instrumentos de Avaliação</th>
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

                                          {/* 6. Critérios de Avaliação */}
                                          <td className="p-4 text-slate-700 dark:text-slate-200 font-medium leading-relaxed align-top">
                                            {renderFormattedText(lesson.criteriosAvaliacao || "-")}
                                          </td>

                                          {/* 7. Instrumentos de Avaliação */}
                                          <td className="p-4 text-slate-700 dark:text-slate-200 font-medium leading-relaxed align-top">
                                            {renderFormattedText(lesson.instrumentosAvaliacao || "-")}
                                          </td>

                                          {/* 8. Ações */}
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
                                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold italic">
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
                      /* Active Stage View (100% synced with top bar stage selector) */
                      <div className="space-y-8">
                        {(() => {
                          const stage = activeStage || currentUnit.stages[0];
                          const sIdx = currentUnit.stages.findIndex((s) => s.id === stage.id);
                          const stageIndex = sIdx >= 0 ? sIdx : 0;
                          const theme = STAGE_THEMES[stageIndex % STAGE_THEMES.length];
                          
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
                                (item.recursos || "").toLowerCase().includes(q) ||
                                (item.criteriosAvaliacao || "").toLowerCase().includes(q) ||
                                (item.instrumentosAvaliacao || "").toLowerCase().includes(q);
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
                                      ETAPA {stageIndex + 1}
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
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleOpenImportModal}
                                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                                      title="Copiar cronograma ou aulas de outro professor"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copiar de Outro Professor</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenAddLesson(undefined, stage.id)}
                                      className={`px-3.5 py-2 ${theme.bg} ${theme.hoverBg} text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0`}
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span>Adicionar Aula na Etapa {stageIndex + 1}</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Stage Lesson Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                      <th className="p-4 w-32 whitespace-nowrap">Horas/Data</th>
                                      <th className="p-4">Capacidades</th>
                                      <th className="p-4">Conhecimentos</th>
                                      <th className="p-4">Estratégias</th>
                                      <th className="p-4 hidden md:table-cell">Recursos/Ambientes</th>
                                      <th className="p-4">Critérios de Avaliação</th>
                                      <th className="p-4">Instrumentos de Avaliação</th>
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
                                                  E{stageIndex + 1}
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

                                            {/* 6. Critérios de Avaliação */}
                                            <td className="p-4 text-slate-700 dark:text-slate-200 font-medium leading-relaxed align-top">
                                              {renderFormattedText(lesson.criteriosAvaliacao || "-")}
                                            </td>

                                            {/* 7. Instrumentos de Avaliação */}
                                            <td className="p-4 text-slate-700 dark:text-slate-200 font-medium leading-relaxed align-top">
                                              {renderFormattedText(lesson.instrumentosAvaliacao || "-")}
                                            </td>

                                            {/* 8. Ações */}
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
                                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold italic">
                                          Nenhuma aula cadastrada nesta etapa ({stage.turma}).
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
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
                            <th className="p-4">Critérios de Avaliação</th>
                            <th className="p-4">Instrumentos de Avaliação</th>
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

                                  {/* 6. Critérios de Avaliação */}
                                  <td className="p-4 text-slate-700 dark:text-slate-200 font-medium leading-relaxed align-top">
                                    {renderFormattedText(lesson.criteriosAvaliacao || "-")}
                                  </td>

                                  {/* 7. Instrumentos de Avaliação */}
                                  <td className="p-4 text-slate-700 dark:text-slate-200 font-medium leading-relaxed align-top">
                                    {renderFormattedText(lesson.instrumentosAvaliacao || "-")}
                                  </td>

                                  {/* 8. Ações */}
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
                              <td colSpan={8} className="p-8 text-center text-slate-400 font-bold italic">
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
                const ucAcronym = getAcronym(currentUnit);
                const ucColor = getUcColor(currentUnit);

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
                        // If viewAllStagesChronological is false, filter strictly by activeStage
                        if (viewAllStagesChronological || (activeStage && activeStage.id === st.id) || (!activeStage && sIdx === 0)) {
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
                const hasMultipleStages = currentUnit.stages && currentUnit.stages.length > 1;

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Calendar Header with Stage Filter */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-1 text-xs font-black rounded-lg ${ucColor.bg} text-white shadow-xs`}>
                            {ucAcronym}
                          </span>
                          <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                            Cronograma em Calendário – {currentUnit.unitTitle}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Mapeamento interativo das datas e aulas no calendário oficial do curso
                        </p>
                      </div>

                      {/* Calendar Sync Status & Mode Toggle */}
                      {currentUnit.stages && currentUnit.stages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <span className={`px-3 py-1 text-xs font-black rounded-xl ${ucColor.bg} text-white shadow-xs`}>
                              {activeStage ? `${activeStage.turma} • ${activeStage.title.replace(/^\d+\.\s*/, '')}` : "Etapa Ativa"}
                            </span>
                            <button
                              onClick={() => setViewAllStagesChronological(!viewAllStagesChronological)}
                              className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                                viewAllStagesChronological
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{viewAllStagesChronological ? "Todas as Etapas" : "Ver Todas as Etapas"}</span>
                            </button>
                          </div>
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
                                const isMultiStage = hasMultipleStages && viewAllStagesChronological;
                                const cellTheme = meta
                                  ? isMultiStage
                                    ? STAGE_THEMES[meta.stageIndex % STAGE_THEMES.length]
                                    : {
                                        bg: ucColor.bg,
                                        ring: ucColor.ring,
                                        border: ucColor.border,
                                        badge: `${ucColor.bg} text-white`,
                                        text: "text-white",
                                      }
                                  : null;

                                return (
                                  <button
                                    key={cIdx}
                                    onClick={() => setSelectedCalendarDate(cell.isoDate)}
                                    className={`h-9 rounded-xl font-extrabold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                                      meta && cellTheme
                                        ? `${cellTheme.bg} text-white shadow-xs ring-2 ring-offset-1 ${cellTheme.ring}`
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    } ${isSelected ? "scale-105 ring-2 ring-amber-400 font-black" : ""}`}
                                    title={
                                      meta
                                        ? `Aula (${meta.stageTurma || ucAcronym}): ${meta.lesson.conhecimentos}`
                                        : `Dia ${cell.dayNumber}`
                                    }
                                  >
                                    <span className="text-xs leading-none">{cell.dayNumber}</span>
                                    {meta && (
                                      <span className="text-[8px] font-black tracking-tighter opacity-90 leading-none mt-0.5">
                                        {hasMultipleStages ? `E${meta.stageIndex + 1} • ` : ""}{meta.lesson.hours}
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
                        const isMultiStage = hasMultipleStages && viewAllStagesChronological;
                        const theme = isMultiStage
                          ? STAGE_THEMES[stageIndex % STAGE_THEMES.length]
                          : {
                              border: ucColor.border,
                              badge: `${ucColor.bg} text-white`,
                              text: "text-blue-400",
                              ring: ucColor.ring,
                              bg: ucColor.bg,
                            };
                        const isOk = lesson.status === "concluida";

                        return (
                          <div className={`p-6 bg-slate-900 text-white rounded-3xl shadow-lg border ${theme.border} space-y-4 animate-in fade-in`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-3 py-1 font-black text-xs rounded-xl uppercase ${theme.badge}`}>
                                  {hasMultipleStages ? `ETAPA ${stageIndex + 1}: ${stageTurma || "Turma A"}` : `${ucAcronym} • AULA`}
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
                                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Conhecimentos & Conteúdo</span>
                                <p className="font-bold text-sm text-white leading-snug">{lesson.conhecimentos}</p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Estratégia Pedagógica</span>
                                <p className="font-medium text-slate-300 leading-relaxed">{lesson.estrategias}</p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Recursos & Ambientes</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Data (DD/MM/AAAA)
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
                    Professor Responsável
                  </label>
                  <select
                    value={
                      lessonForm.professor ||
                      (currentUser?.name?.includes("Gea")
                        ? "Prof. Ricardo Gea"
                        : "Prof. Ricardo Beretella")
                    }
                    onChange={(e) => setLessonForm({ ...lessonForm, professor: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Prof. Ricardo Beretella">Prof. Ricardo Beretella</option>
                    <option value="Prof. Ricardo Gea">Prof. Ricardo Gea</option>
                    <option value="Ambos os Professores">Ambos os Professores</option>
                  </select>
                </div>
              </div>

              {/* 1. Capacidades */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Capacidades Associadas / Desenvolvidas
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.capacities || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, capacities: e.target.value })}
                  placeholder="Ex: Executar torneamento cônico por inclinação de carro superior; Demonstrar atenção aos detalhes..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 2. Conhecimentos */}
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

              {/* 3. Estratégias */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Estratégia Didática & Metodologia
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.estrategias || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, estrategias: e.target.value })}
                  placeholder="Ex: Exposição dialogada, resolução da Situação-Problema e prática de oficina..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4. Recursos / Ambientes */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Recursos Instrucionais / Ambientes
                </label>
                <input
                  type="text"
                  value={lessonForm.recursos || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, recursos: e.target.value })}
                  placeholder="Ex: Oficina de Usinagem / Laboratório SENAI, máquinas operatrizes, ferramentas de corte, instrumentos de medição"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 5. Critérios de Avaliação */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Critérios de Avaliação
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.criteriosAvaliacao || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, criteriosAvaliacao: e.target.value })}
                  placeholder="Ex: Avaliação formativa continuada de acordo com as normas técnicas de segurança e tolerâncias dimensionais..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 6. Instrumentos de Avaliação */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Instrumentos de Avaliação
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.instrumentosAvaliacao || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, instrumentosAvaliacao: e.target.value })}
                  placeholder="Ex: Folha de processo, Lista de checagem/Rubrica de desempenho, Relatório técnico..."
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
                  {editingRubricIndex !== null
                    ? `Editar Rubrica #${editingRubricIndex + 1} MSEP SENAI`
                    : insertRubricAfterIndex !== null
                    ? `Inserir Nova Rubrica Abaixo da #${insertRubricAfterIndex + 1}`
                    : "Nova Rubrica MSEP SENAI"}
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

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Critérios de Desempenho / Avaliação
                </label>
                <textarea
                  rows={2}
                  value={rubricForm.criteria || ""}
                  onChange={(e) => setRubricForm({ ...rubricForm, criteria: e.target.value })}
                  placeholder="Ex: Interpretação exata de projeções, cálculo de afastamentos limites ISO 286 e normas de segurança..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    ? (capacityCategory === "basic_torneamento"
                        ? "Editar Capacidade Básica • Torneamento"
                        : capacityCategory === "basic_fresagem"
                        ? "Editar Capacidade Básica • Fresagem"
                        : capacityCategory === "technical_torneamento"
                        ? "Editar Capacidade Técnica • Torneamento"
                        : capacityCategory === "technical_fresagem"
                        ? "Editar Capacidade Técnica • Fresagem"
                        : capacityCategory === "socioemotional"
                        ? "Editar Capacidade Socioemocional"
                        : `Editar Capacidade (${activePrimaryLabel})`)
                    : (capacityCategory === "basic_torneamento"
                        ? "Adicionar Capacidade Básica • Torneamento"
                        : capacityCategory === "basic_fresagem"
                        ? "Adicionar Capacidade Básica • Fresagem"
                        : capacityCategory === "technical_torneamento"
                        ? "Adicionar Capacidade Técnica • Torneamento"
                        : capacityCategory === "technical_fresagem"
                        ? "Adicionar Capacidade Técnica • Fresagem"
                        : capacityCategory === "socioemotional"
                        ? "Adicionar Capacidade Socioemocional"
                        : `Adicionar Nova Capacidade (${activePrimaryLabel})`)}
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
                  placeholder="Descreva a capacidade técnica, básica ou socioemocional..."
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

      {/* Cross-Professor / Cross-UC Lesson Plan Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white">
                    Copiar Cronograma / Aulas de Outro Professor ou UC
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Importe o cronograma completo ou selecione aulas específicas de outro plano de curso para a unidade atual ({currentUnit?.unitTitle || "UC"}).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Step 1: Origem do Conteúdo */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>Origem do Conteúdo (De onde copiar)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Professor / Plano de Origem */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Professor / Plano de Origem
                    </label>
                    <select
                      value={sourceSyllabusId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSourceSyllabusId(nextId);
                        const syl = availableSyllabi.find((s) => s.id === nextId);
                        const targetUcKey = getStandardUcKey(currentUnit);
                        const matched = syl?.programmaticContent?.find(
                          (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
                        ) || syl?.programmaticContent?.[0];
                        if (matched) {
                          setSourceUnitId(matched.id);
                        }
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableSyllabi.map((syl) => (
                        <option key={syl.id} value={syl.id}>
                          {syl.professorName || (syl.id.includes("beretella") ? "Prof. Ricardo Beretella" : "Prof. Ricardo Gea")} – {syl.courseTitle || "Mecânico de Usinagem"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unidade Curricular de Origem */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Unidade Curricular de Origem
                    </label>
                    <select
                      value={sourceUnitId}
                      onChange={(e) => setSourceUnitId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {sourceSyllabusObj?.programmaticContent?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitTitle} ({u.workload || "60h"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Etapa de Origem */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Etapa / Rotação de Origem
                    </label>
                    <select
                      value={sourceStageId}
                      onChange={(e) => setSourceStageId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Todas as Etapas (Cronograma Completo)</option>
                      {sourceUnitObj?.stages?.map((st, sIdx) => (
                        <option key={st.id} value={st.id}>
                          Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Seleção de Aulas */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Aulas Disponíveis ({availableSourceLessons.length} no total)</span>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-lg text-[11px]">
                      {selectedLessonIds.length} selecionada(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAllSourceLessons}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-extrabold text-[11px] rounded-lg cursor-pointer"
                    >
                      Selecionar Todas
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllSourceLessons}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-extrabold text-[11px] rounded-lg cursor-pointer"
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                </div>

                {/* Search in source lessons */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sourceLessonSearch}
                    onChange={(e) => setSourceLessonSearch(e.target.value)}
                    placeholder="Filtrar aulas de origem por conteúdo, data, etapa ou professor..."
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Lessons Scrollable Checklist */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700/80 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 p-1.5 space-y-1">
                  {filteredSourceLessons.length > 0 ? (
                    filteredSourceLessons.map((lesson) => {
                      const isSelected = selectedLessonIds.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleToggleSourceLessonSelect(lesson.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/70 shadow-xs"
                              : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSourceLessonSelect(lesson.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                          />

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-[10px] rounded-md flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-600" />
                                <span>{lesson.date || "Sem data"}</span>
                                <span className="text-slate-400">({lesson.hours || "4h"})</span>
                              </span>

                              {lesson.stageName && (
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] rounded-md">
                                  {lesson.stageName}
                                </span>
                              )}

                              {lesson.professor && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-md">
                                  {lesson.professor}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed line-clamp-2">
                              {lesson.conhecimentos || "Sem conteúdo especificado"}
                            </p>

                            {lesson.estrategias && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                                <span className="font-bold">Estratégia:</span> {lesson.estrategias}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-bold italic">
                      Nenhuma aula encontrada para a origem selecionada.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Destino na Unidade Atual & Opções */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>Destino na UC Atual & Opções de Gravação</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Stage (if current unit has stages) */}
                  {currentUnit?.stages && currentUnit.stages.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Etapa de Destino na UC Atual
                      </label>
                      <select
                        value={targetStageId}
                        onChange={(e) => setTargetStageId(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="todas">Distribuir automaticamente para as etapas correspondentes</option>
                        {currentUnit.stages.map((st, sIdx) => (
                          <option key={st.id} value={st.id}>
                            Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mode: Append vs Replace */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Modo de Gravação
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        importMode === "append"
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === "append"}
                          onChange={() => setImportMode("append")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs">Acrescentar às aulas existentes</span>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        importMode === "replace"
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === "replace"}
                          onChange={() => setImportMode("replace")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs">Substituir cronograma existente</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Option to set professor to current user */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 dark:text-slate-200 font-bold text-xs">
                    <input
                      type="checkbox"
                      checked={updateProfessorNameToCurrent}
                      onChange={(e) => setUpdateProfessorNameToCurrent(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span>
                      Atribuir meu nome ({currentUser?.name || "Professor Ativo"}) como professor responsável das aulas copiadas
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">
                {selectedLessonIds.length > 0 ? (
                  <span>
                    Pronto para copiar <strong>{selectedLessonIds.length}</strong> aula(s) ({selectedLessonIds.length * 4}h) para <strong>{currentUnit?.unitTitle}</strong>.
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Selecione ao menos 1 aula para habilitar a cópia.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedLessonIds.length === 0}
                  onClick={handleConfirmImportLessons}
                  className={`px-5 py-2.5 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                    selectedLessonIds.length > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar {selectedLessonIds.length} Aula(s) Selecionada(s)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cross-Professor / Cross-UC GERAL (Capacidades & Conhecimentos) Modal */}
      {isImportGeneralModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white">
                    Copiar Geral / Capacidades & Conhecimentos
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Importe capacidades básicas, técnicas, socioemocionais e conhecimentos para ({currentUnit?.unitTitle || "UC"}).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportGeneralModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Step 1: Origem */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>Origem do Conteúdo (De onde copiar)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Professor / Plano de Origem
                    </label>
                    <select
                      value={sourceGeneralSyllabusId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSourceGeneralSyllabusId(nextId);
                        const syl = availableSyllabi.find((s) => s.id === nextId);
                        const targetUcKey = getStandardUcKey(currentUnit);
                        const matched = syl?.programmaticContent?.find(
                          (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
                        ) || syl?.programmaticContent?.[0];
                        if (matched) {
                          setSourceGeneralUnitId(matched.id);
                        }
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableSyllabi.map((syl) => (
                        <option key={syl.id} value={syl.id}>
                          {syl.professorName || (syl.id.includes("beretella") ? "Prof. Ricardo Beretella" : "Prof. Ricardo Gea")} – {syl.courseTitle || "Mecânico de Usinagem"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Unidade Curricular de Origem
                    </label>
                    <select
                      value={sourceGeneralUnitId}
                      onChange={(e) => setSourceGeneralUnitId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {sourceGeneralSyllabusObj?.programmaticContent?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitTitle} ({u.workload || "60h"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Etapa / Rotação de Origem
                    </label>
                    <select
                      value={sourceGeneralStageId}
                      onChange={(e) => setSourceGeneralStageId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Todas as Etapas / Estrutura Geral</option>
                      {sourceGeneralUnitObj?.stages?.map((st, sIdx) => (
                        <option key={st.id} value={st.id}>
                          Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Seleção de Capacidades e Conhecimentos */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Itens para Copiar</span>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-lg text-[11px]">
                      {selectedGeneralPrimaryCaps.length + selectedGeneralSocioCaps.length + selectedGeneralTopics.length} selecionado(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGeneralPrimaryCaps([...availableSourceGeneralData.primaryCaps]);
                        setSelectedGeneralSocioCaps([...availableSourceGeneralData.socioCaps]);
                        setSelectedGeneralTopics([...availableSourceGeneralData.topics]);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-extrabold text-[11px] rounded-lg cursor-pointer"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGeneralPrimaryCaps([]);
                        setSelectedGeneralSocioCaps([]);
                        setSelectedGeneralTopics([]);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-extrabold text-[11px] rounded-lg cursor-pointer"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={generalSearch}
                    onChange={(e) => setGeneralSearch(e.target.value)}
                    placeholder="Filtrar capacidades ou conhecimentos por palavra-chave..."
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* 3 Accordions / Lists for Capacities and Topics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Primary Capacities */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-black text-[11px] uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Capacidades Técnicas / Básicas ({availableSourceGeneralData.primaryCaps.length})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={
                          availableSourceGeneralData.primaryCaps.length > 0 &&
                          availableSourceGeneralData.primaryCaps.every((c) => selectedGeneralPrimaryCaps.includes(c))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGeneralPrimaryCaps(Array.from(new Set([...selectedGeneralPrimaryCaps, ...availableSourceGeneralData.primaryCaps])));
                          } else {
                            setSelectedGeneralPrimaryCaps(selectedGeneralPrimaryCaps.filter((c) => !availableSourceGeneralData.primaryCaps.includes(c)));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                      {availableSourceGeneralData.primaryCaps.filter((c) => !generalSearch || c.toLowerCase().includes(generalSearch.toLowerCase())).map((cap, i) => {
                        const isChecked = selectedGeneralPrimaryCaps.includes(cap);
                        return (
                          <label key={i} className="pt-1 flex items-start gap-2 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedGeneralPrimaryCaps(selectedGeneralPrimaryCaps.filter((c) => c !== cap));
                                } else {
                                  setSelectedGeneralPrimaryCaps([...selectedGeneralPrimaryCaps, cap]);
                                }
                              }}
                              className="mt-0.5 w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 shrink-0"
                            />
                            <span>{cap}</span>
                          </label>
                        );
                      })}
                      {availableSourceGeneralData.primaryCaps.length === 0 && (
                        <p className="text-slate-400 italic text-[11px] py-3 text-center">Nenhuma encontrada</p>
                      )}
                    </div>
                  </div>

                  {/* Socioemotional Capacities */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-black text-[11px] uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Socioemocionais ({availableSourceGeneralData.socioCaps.length})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={
                          availableSourceGeneralData.socioCaps.length > 0 &&
                          availableSourceGeneralData.socioCaps.every((c) => selectedGeneralSocioCaps.includes(c))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGeneralSocioCaps(Array.from(new Set([...selectedGeneralSocioCaps, ...availableSourceGeneralData.socioCaps])));
                          } else {
                            setSelectedGeneralSocioCaps(selectedGeneralSocioCaps.filter((c) => !availableSourceGeneralData.socioCaps.includes(c)));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                      {availableSourceGeneralData.socioCaps.filter((c) => !generalSearch || c.toLowerCase().includes(generalSearch.toLowerCase())).map((cap, i) => {
                        const isChecked = selectedGeneralSocioCaps.includes(cap);
                        return (
                          <label key={i} className="pt-1 flex items-start gap-2 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedGeneralSocioCaps(selectedGeneralSocioCaps.filter((c) => c !== cap));
                                } else {
                                  setSelectedGeneralSocioCaps([...selectedGeneralSocioCaps, cap]);
                                }
                              }}
                              className="mt-0.5 w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 shrink-0"
                            />
                            <span>{cap}</span>
                          </label>
                        );
                      })}
                      {availableSourceGeneralData.socioCaps.length === 0 && (
                        <p className="text-slate-400 italic text-[11px] py-3 text-center">Nenhuma encontrada</p>
                      )}
                    </div>
                  </div>

                  {/* Topics / Conhecimentos */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-black text-[11px] uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Conhecimentos ({availableSourceGeneralData.topics.length})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={
                          availableSourceGeneralData.topics.length > 0 &&
                          availableSourceGeneralData.topics.every((t) => selectedGeneralTopics.includes(t))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGeneralTopics(Array.from(new Set([...selectedGeneralTopics, ...availableSourceGeneralData.topics])));
                          } else {
                            setSelectedGeneralTopics(selectedGeneralTopics.filter((t) => !availableSourceGeneralData.topics.includes(t)));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                      {availableSourceGeneralData.topics.filter((t) => !generalSearch || t.toLowerCase().includes(generalSearch.toLowerCase())).map((top, i) => {
                        const isChecked = selectedGeneralTopics.includes(top);
                        return (
                          <label key={i} className="pt-1 flex items-start gap-2 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedGeneralTopics(selectedGeneralTopics.filter((t) => t !== top));
                                } else {
                                  setSelectedGeneralTopics([...selectedGeneralTopics, top]);
                                }
                              }}
                              className="mt-0.5 w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 shrink-0"
                            />
                            <span>{top}</span>
                          </label>
                        );
                      })}
                      {availableSourceGeneralData.topics.length === 0 && (
                        <p className="text-slate-400 italic text-[11px] py-3 text-center">Nenhum encontrado</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Step 3: Destino na UC Atual & Modo de Gravação */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>Destino na UC Atual & Opções de Gravação</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUnit?.stages && currentUnit.stages.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Etapa de Destino na UC Atual
                      </label>
                      <select
                        value={targetGeneralStageId}
                        onChange={(e) => setTargetGeneralStageId(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="todas">Aplicar em Todas as Etapas da UC</option>
                        {currentUnit.stages.map((st, sIdx) => (
                          <option key={st.id} value={st.id}>
                            Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Modo de Gravação
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        generalImportMode === "append"
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="generalImportMode"
                          value="append"
                          checked={generalImportMode === "append"}
                          onChange={() => setGeneralImportMode("append")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs">Acrescentar aos existentes</span>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        generalImportMode === "replace"
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="generalImportMode"
                          value="replace"
                          checked={generalImportMode === "replace"}
                          onChange={() => setGeneralImportMode("replace")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs">Substituir existentes</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">
                Total selecionado: <strong>{selectedGeneralPrimaryCaps.length}</strong> cap. principais, <strong>{selectedGeneralSocioCaps.length}</strong> socioemocionais, <strong>{selectedGeneralTopics.length}</strong> conhecimentos.
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportGeneralModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedGeneralPrimaryCaps.length === 0 && selectedGeneralSocioCaps.length === 0 && selectedGeneralTopics.length === 0}
                  onClick={handleConfirmImportGeneral}
                  className={`px-5 py-2.5 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                    selectedGeneralPrimaryCaps.length > 0 || selectedGeneralSocioCaps.length > 0 || selectedGeneralTopics.length > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Itens Selecionados</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cross-Professor / Cross-UC SITUAÇÃO-PROBLEMA Modal */}
      {isImportSPModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white">
                    Copiar Situação-Problema (S.A.)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Importe a Situação de Aprendizagem completa (contextualização, desafios e entregáveis) para {currentUnit?.unitTitle}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportSPModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Step 1: Origem */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>Origem da Situação-Problema</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Professor / Plano de Origem
                    </label>
                    <select
                      value={sourceSPSyllabusId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSourceSPSyllabusId(nextId);
                        const syl = availableSyllabi.find((s) => s.id === nextId);
                        const targetUcKey = getStandardUcKey(currentUnit);
                        const matched = syl?.programmaticContent?.find(
                          (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
                        ) || syl?.programmaticContent?.[0];
                        if (matched) {
                          setSourceSPUnitId(matched.id);
                        }
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableSyllabi.map((syl) => (
                        <option key={syl.id} value={syl.id}>
                          {syl.professorName || (syl.id.includes("beretella") ? "Prof. Ricardo Beretella" : "Prof. Ricardo Gea")} – {syl.courseTitle || "Mecânico de Usinagem"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Unidade Curricular de Origem
                    </label>
                    <select
                      value={sourceSPUnitId}
                      onChange={(e) => setSourceSPUnitId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {sourceSPSyllabusObj?.programmaticContent?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitTitle} ({u.workload || "60h"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Etapa / Rotação de Origem
                    </label>
                    <select
                      value={sourceSPStageId}
                      onChange={(e) => setSourceSPStageId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Situação-Problema Padrão</option>
                      {sourceSPUnitObj?.stages?.map((st, sIdx) => (
                        <option key={st.id} value={st.id}>
                          Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Pré-visualização da Situação-Problema */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <span>Conteúdo a ser Copiado</span>
                </div>

                {availableSourceSP ? (
                  <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] uppercase block">Título da Situação de Aprendizagem</span>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">
                        {availableSourceSP.title || "Sem título"}
                      </h4>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 text-[10px] uppercase block">Contextualização</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {availableSourceSP.contextualization || "Sem contextualização"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase block mb-1">
                          Desafios Práticos ({availableSourceSP.challenge?.length || 0})
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                          {availableSourceSP.challenge?.map((ch, i) => (
                            <li key={i}>{ch}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase block mb-1">
                          Entregáveis Esperados ({availableSourceSP.expectedResults?.length || 0})
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                          {availableSourceSP.expectedResults?.map((res, i) => (
                            <li key={i}>{res}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 italic">
                    Nenhuma Situação-Problema encontrada para a origem selecionada.
                  </div>
                )}
              </div>

              {/* Step 3: Destino */}
              {currentUnit?.stages && currentUnit.stages.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                      3
                    </span>
                    <span>Destino na UC Atual</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Etapa de Destino na UC Atual
                    </label>
                    <select
                      value={targetSPStageId}
                      onChange={(e) => setTargetSPStageId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Aplicar em Todas as Etapas da UC</option>
                      {currentUnit.stages.map((st, sIdx) => (
                        <option key={st.id} value={st.id}>
                          Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">
                Pronto para copiar para <strong>{currentUnit?.unitTitle}</strong>.
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportSPModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!availableSourceSP}
                  onClick={handleConfirmImportSP}
                  className={`px-5 py-2.5 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                    availableSourceSP
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Situação-Problema</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cross-Professor / Cross-UC RUBRICAS Modal */}
      {isImportRubricsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white">
                    Copiar Rubricas de Avaliação (MSEP SENAI)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Importe critérios objetivos e matriz de níveis de desempenho (NSA, APO, PAR, AUT) para ({currentUnit?.unitTitle || "UC"}).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportRubricsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Step 1: Origem */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>Origem das Rubricas</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Professor / Plano de Origem
                    </label>
                    <select
                      value={sourceRubricsSyllabusId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSourceRubricsSyllabusId(nextId);
                        const syl = availableSyllabi.find((s) => s.id === nextId);
                        const targetUcKey = getStandardUcKey(currentUnit);
                        const matched = syl?.programmaticContent?.find(
                          (u) => getStandardUcKey(u) === targetUcKey || u.id === currentUnit?.id
                        ) || syl?.programmaticContent?.[0];
                        if (matched) {
                          setSourceRubricsUnitId(matched.id);
                        }
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableSyllabi.map((syl) => (
                        <option key={syl.id} value={syl.id}>
                          {syl.professorName || (syl.id.includes("beretella") ? "Prof. Ricardo Beretella" : "Prof. Ricardo Gea")} – {syl.courseTitle || "Mecânico de Usinagem"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Unidade Curricular de Origem
                    </label>
                    <select
                      value={sourceRubricsUnitId}
                      onChange={(e) => setSourceRubricsUnitId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {sourceRubricsSyllabusObj?.programmaticContent?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unitTitle} ({u.workload || "60h"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Etapa / Rotação de Origem
                    </label>
                    <select
                      value={sourceRubricsStageId}
                      onChange={(e) => setSourceRubricsStageId(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Todas as Rubricas da UC</option>
                      {sourceRubricsUnitObj?.stages?.map((st, sIdx) => (
                        <option key={st.id} value={st.id}>
                          Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Seleção de Rubricas */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Rubricas Disponíveis ({availableSourceRubrics.length} no total)</span>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-lg text-[11px]">
                      {selectedRubricIndices.length} selecionada(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRubricIndices(availableSourceRubrics.map((_, i) => i))}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-extrabold text-[11px] rounded-lg cursor-pointer"
                    >
                      Selecionar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRubricIndices([])}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-extrabold text-[11px] rounded-lg cursor-pointer"
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={rubricsSearch}
                    onChange={(e) => setRubricsSearch(e.target.value)}
                    placeholder="Filtrar rubricas por capacidade avaliada ou critério..."
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* List of Rubrics */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700/80 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 p-1.5 space-y-2">
                  {filteredSourceRubrics.length > 0 ? (
                    filteredSourceRubrics.map((rubric, idx) => {
                      const realIdx = availableSourceRubrics.findIndex((r) => r === rubric);
                      const isSelected = selectedRubricIndices.includes(realIdx >= 0 ? realIdx : idx);
                      const toggleIdx = realIdx >= 0 ? realIdx : idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedRubricIndices(selectedRubricIndices.filter((i) => i !== toggleIdx));
                            } else {
                              setSelectedRubricIndices([...selectedRubricIndices, toggleIdx]);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/70 shadow-xs"
                              : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedRubricIndices(selectedRubricIndices.filter((i) => i !== toggleIdx));
                                } else {
                                  setSelectedRubricIndices([...selectedRubricIndices, toggleIdx]);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider">
                                  CAPACIDADE
                                </span>
                                <h5 className="font-black text-xs text-slate-900 dark:text-white leading-snug">
                                  {rubric.capacity}
                                </h5>
                              </div>
                              {(rubric.criteria || rubric.criterios) && (
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  <span className="font-bold text-slate-700 dark:text-slate-200">Critérios:</span> {rubric.criteria || rubric.criterios}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pl-7">
                            <div className="p-1.5 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200/50 dark:border-red-900/30">
                              <span className="font-bold text-red-700 dark:text-red-300 block mb-0.5">NSA:</span>
                              <span className="text-slate-600 dark:text-slate-400 line-clamp-2">{rubric.nsa}</span>
                            </div>
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                              <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">APO:</span>
                              <span className="text-slate-600 dark:text-slate-400 line-clamp-2">{rubric.apo}</span>
                            </div>
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-900/30">
                              <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5">PAR:</span>
                              <span className="text-slate-600 dark:text-slate-400 line-clamp-2">{rubric.par}</span>
                            </div>
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">AUT:</span>
                              <span className="text-slate-600 dark:text-slate-400 line-clamp-2">{rubric.aut}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-bold italic">
                      Nenhuma rubrica encontrada para a origem selecionada.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Destino na UC Atual & Modo de Gravação */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>Destino na UC Atual & Opções de Gravação</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUnit?.stages && currentUnit.stages.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Etapa de Destino na UC Atual
                      </label>
                      <select
                        value={targetRubricsStageId}
                        onChange={(e) => setTargetRubricsStageId(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="todas">Aplicar em Todas as Etapas da UC</option>
                        {currentUnit.stages.map((st, sIdx) => (
                          <option key={st.id} value={st.id}>
                            Etapa {sIdx + 1}: {st.turma} – {st.title.replace(/^\d+\.\s*/, "")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Modo de Gravação
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        rubricsImportMode === "append"
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="rubricsImportMode"
                          value="append"
                          checked={rubricsImportMode === "append"}
                          onChange={() => setRubricsImportMode("append")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs">Acrescentar às existentes</span>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        rubricsImportMode === "replace"
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="rubricsImportMode"
                          value="replace"
                          checked={rubricsImportMode === "replace"}
                          onChange={() => setRubricsImportMode("replace")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs">Substituir existentes</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">
                {selectedRubricIndices.length > 0 ? (
                  <span>
                    Pronto para copiar <strong>{selectedRubricIndices.length}</strong> rubrica(s) para <strong>{currentUnit?.unitTitle}</strong>.
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Selecione ao menos 1 rubrica para habilitar a cópia.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportRubricsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedRubricIndices.length === 0}
                  onClick={handleConfirmImportRubrics}
                  className={`px-5 py-2.5 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                    selectedRubricIndices.length > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar {selectedRubricIndices.length} Rubrica(s)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
