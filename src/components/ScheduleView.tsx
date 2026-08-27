import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  X,
  Layers,
  Info,
  User,
  Settings,
  RefreshCw,
  Users,
} from "lucide-react";
import { ScheduleItem, ClassType, ClassStatus, Syllabus, ProgrammaticUnit, LessonPlanItem, UserProfile } from "../types/syllabus";
import {
  formatDateBR,
  calculateScheduleProgress,
  getClassTypeBadgeColor,
  getClassStatusBadge,
} from "../utils/dateUtils";
import {
  parseDateToISO,
  getMonthGrid,
  MONTH_NAMES_PT,
  WEEKDAY_NAMES_PT,
  getUcColor,
  UC_COLOR_PALETTE,
  UcColorConfig,
} from "../utils/calendarUtils";
import {
  SchoolCalendarEvent,
  TeacherWeeklyRule,
  INITIAL_SCHOOL_EVENTS_2026,
  TEACHER_SCHEDULE_RULES,
} from "../utils/calendarConfig";
import { proeducadorUnits } from "../data/proeducadorData";
import { generateSyllabusSchedule } from "../utils/scheduleGenerator";

interface ScheduleViewProps {
  syllabus: Syllabus;
  currentUser?: UserProfile;
  onChangeSchedule: (newSchedule: ScheduleItem[]) => void;
  onOpenAIGenerator?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  syllabus,
  currentUser,
  onChangeSchedule,
  onOpenAIGenerator,
}) => {
  const schedule = syllabus.schedule || [];

  // Modals for editing school calendar & teacher rules
  const [showSchoolEventsModal, setShowSchoolEventsModal] = useState(false);
  const [schoolEvents, setSchoolEvents] = useState<SchoolCalendarEvent[]>(INITIAL_SCHOOL_EVENTS_2026);
  const [teacherRules, setTeacherRules] = useState<TeacherWeeklyRule[]>(TEACHER_SCHEDULE_RULES);

  const isGeaSyllabus = (syllabus?.professorName && syllabus.professorName.toLowerCase().includes("gea")) ||
    (syllabus?.id && syllabus.id.includes("gea")) ||
    (currentUser?.name && currentUser.name.toLowerCase().includes("gea"));
  const activeProfessorName = isGeaSyllabus ? "Prof. Ricardo Gea" : "Prof. Ricardo Beretella";

  // Programmatic units directly from active syllabus
  const units = useMemo(() => {
    if (syllabus && Array.isArray(syllabus.programmaticContent) && syllabus.programmaticContent.length > 0) {
      return syllabus.programmaticContent;
    }
    return proeducadorUnits || [];
  }, [syllabus?.programmaticContent]);

  // View & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("todos");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"calendario" | "semanas" | "tabela">("calendario");

  // Separate Teacher Profile state: Prof. Ricardo Beretella OR Prof. Ricardo Gea
  const [selectedProfessorFilter, setSelectedProfessorFilter] = useState<"Prof. Ricardo Beretella" | "Prof. Ricardo Gea">(
    activeProfessorName
  );

  useEffect(() => {
    setSelectedProfessorFilter(activeProfessorName);
  }, [activeProfessorName]);

  // Calendar semester state: "1º SEMESTRE" | "2º SEMESTRE"
  const [selectedSemester, setSelectedSemester] = useState<"1º SEMESTRE" | "2º SEMESTRE">("1º SEMESTRE");
  const [selectedDayModalDate, setSelectedDayModalDate] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const progress = calculateScheduleProgress(schedule);

  // Recalculate schedule based on current rules & calendar for this specific professor
  const handleRecalculateSchedule = () => {
    const specificRules = teacherRules.filter((r) => r.professor === activeProfessorName);
    const { updatedUnits, masterSchedule: newMasterSchedule } = generateSyllabusSchedule(
      JSON.parse(JSON.stringify(units)),
      schoolEvents,
      specificRules
    );
    syllabus.programmaticContent = updatedUnits;
    onChangeSchedule(newMasterSchedule);
  };

  // Helper to compute acronym for a UC
  const getAcronym = (unit?: Partial<ProgrammaticUnit> | null): string => {
    if (!unit) return "UC";
    const title = (unit.unitTitle || "").toUpperCase();
    const ac = (unit.acronym || "").toUpperCase();
    if (ac === "PROC" || ac === "PRUSC" || title.includes("PROCESSOS")) return "PRUSC";
    if (ac === "METR" || ac === "MINDU" || title.includes("METROLOGIA")) return "MINDU";
    if (ac === "LIDT" || title.includes("LEITURA") || title.includes("DESENHO")) return "LIDT";
    if (ac === "CIEMA" || title.includes("CIÊNCIAS") || title.includes("CIENCIAS") || title.includes("MATERIAIS")) return "CIEMA";
    if (ac === "CRD" || ac === "CDMAT" || title.includes("CONTROLE") || title.includes("DIMENSIONAL")) return "CRD";
    if (ac === "MAP" || title.includes("MATEMÁTICA") || title.includes("MATEMATICA")) return "MAP";
    if (ac === "FUSI" || title.includes("FUNDAMENTOS") || title.includes("USINAGEM")) return "FUSI";
    if (ac) return ac;
    return title.substring(0, 5);
  };

  // Color mapping by UC Acronym (MAP is explicitly Red)
  const getAcronymColor = (acronym: string): UcColorConfig => {
    const ac = (acronym || "").toUpperCase();
    if (ac === "LIDT" || ac.includes("LEITURA") || ac.includes("DESENHO")) return UC_COLOR_PALETTE[0]; // Blue
    if (ac === "CIEMA" || ac.includes("CIÊNCIAS") || ac.includes("CIENCIAS") || ac.includes("MATERIAIS")) return UC_COLOR_PALETTE[1]; // Emerald Green
    if (ac === "CRD" || ac === "CDMAT" || ac.includes("CONTROLE") || ac.includes("DIMENSIONAL")) return UC_COLOR_PALETTE[2]; // Amber
    if (ac === "MAP" || ac.includes("MATEMÁTICA") || ac.includes("MATEMATICA")) return UC_COLOR_PALETTE[3]; // RED (Vermelho)
    if (ac === "FUSI" || ac.includes("FUNDAMENTOS")) return UC_COLOR_PALETTE[4]; // Purple
    if (ac === "PRUSC" || ac === "PROC" || ac.includes("PROCESSOS")) return UC_COLOR_PALETTE[5]; // Cyan
    if (ac === "MINDU" || ac === "METR" || ac.includes("METROLOGIA")) return UC_COLOR_PALETTE[6]; // Pink
    return UC_COLOR_PALETTE[0];
  };

  // Master date map aggregating all UCs for the active semester & teacher
  interface DateEntry {
    unit: ProgrammaticUnit;
    lesson: LessonPlanItem;
    ucAcronym: string;
    ucColor: UcColorConfig;
  }

  // Helper to determine if a lesson belongs strictly to the selected teacher profile
  const isLessonForTeacher = (
    lesson: LessonPlanItem,
    unit: Partial<ProgrammaticUnit>,
    isoDate: string,
    targetProfessor: "Prof. Ricardo Beretella" | "Prof. Ricardo Gea",
    semester: "1º SEMESTRE" | "2º SEMESTRE"
  ): boolean => {
    const isTargetBeretella = targetProfessor === "Prof. Ricardo Beretella";
    const isTargetGea = targetProfessor === "Prof. Ricardo Gea";
    const ucAcronym = getAcronym(unit);

    // 1. Explicit professor exclusion/inclusion check
    if (lesson.professor && lesson.professor.trim()) {
      const profLower = lesson.professor.toLowerCase();
      if (isTargetBeretella && profLower.includes("gea") && !profLower.includes("beretella")) {
        return false;
      }
      if (isTargetGea && profLower.includes("beretella") && !profLower.includes("gea")) {
        return false;
      }
      if (isTargetBeretella && profLower.includes("beretella")) {
        return true;
      }
      if (isTargetGea && profLower.includes("gea")) {
        return true;
      }
    }

    // 2. Check lesson.id for generated teacher slug
    if (lesson.id) {
      const idLower = lesson.id.toLowerCase();
      if (isTargetBeretella && idLower.includes("-gea-")) {
        return false;
      }
      if (isTargetGea && idLower.includes("-beretella-")) {
        return false;
      }
      if (isTargetBeretella && idLower.includes("-beretella-")) {
        return true;
      }
      if (isTargetGea && idLower.includes("-gea-")) {
        return true;
      }
    }

    // 3. Stage / Turma check (e.g. for FUSI in 1º Semestre, PRUSC in 2º Semestre)
    const stageTurma = ((lesson as any).stageTurma || (lesson as any).stageTitle || "").toLowerCase();
    if (stageTurma) {
      if (stageTurma.includes("turma a") || stageTurma.includes("etapa 1") || stageTurma.includes("etapa 3")) {
        if (!isTargetBeretella) return false;
        return true;
      }
      if (stageTurma.includes("turma b") || stageTurma.includes("etapa 2") || stageTurma.includes("etapa 4")) {
        if (!isTargetGea) return false;
        return true;
      }
    }

    // 4. Verification against official weekly timetable rules for this day of week & UC
    const dateObj = new Date(isoDate + "T12:00:00");
    let dayOfWeek = dateObj.getDay(); // 0=Dom, 1=Seg... 6=Sáb

    // Check school event overrides (balanceamento ou compensação)
    const ev = schoolEvents.find((e) => e.date === isoDate);
    if (ev) {
      if (ev.type === "balanceamento" && ev.balanceForDayOfWeek) {
        dayOfWeek = ev.balanceForDayOfWeek;
      } else if (ev.type === "compensacao" && ev.balanceForDayOfWeek) {
        dayOfWeek = ev.balanceForDayOfWeek;
      }
    }

    // Check if the current professor has a rule for this day, semester & UC
    const matchingRulesForTarget = teacherRules.filter(
      (r) =>
        r.professor === targetProfessor &&
        r.semester === semester &&
        r.dayOfWeek === dayOfWeek &&
        (r.ucAcronym === ucAcronym || ucAcronym.includes(r.ucAcronym) || r.ucAcronym.includes(ucAcronym))
    );

    if (matchingRulesForTarget.length > 0) {
      return true;
    }

    return false;
  };

  // Filter semester units strictly
  const semesterUnits = units.filter((u) => {
    const ac = getAcronym(u);
    if (selectedSemester === "1º SEMESTRE") {
      return ["LIDT", "CIEMA", "CRD", "MAP", "FUSI"].includes(ac);
    } else {
      return ["PRUSC", "MINDU"].includes(ac);
    }
  });

  const masterDateMap: Record<string, DateEntry[]> = {};
  const profKeyword = selectedProfessorFilter.replace("Prof. ", "").trim().toLowerCase();

  // 1. Build calendar data directly from each Curricular Unit's programmatic content / lessonPlan
  semesterUnits.forEach((unit) => {
    const ucAcronym = getAcronym(unit);
    const ucColor = getAcronymColor(ucAcronym);

    // Extract lessons for this specific UC
    let unitLessons: LessonPlanItem[] = [];

    if (unit.stages && unit.stages.length > 0) {
      unitLessons = unit.stages.flatMap((st) => {
        const stTurma = (st.turma || st.title || "").toLowerCase();
        if (selectedProfessorFilter === "Prof. Ricardo Beretella") {
          if (stTurma.includes("turma b") || stTurma.includes("etapa 2") || stTurma.includes("etapa 4")) return [];
        } else if (selectedProfessorFilter === "Prof. Ricardo Gea") {
          if (stTurma.includes("turma a") || stTurma.includes("etapa 1") || stTurma.includes("etapa 3")) return [];
        }
        return (st.lessonPlan || []).map((lp) => ({
          ...lp,
          stageId: st.id,
          stageTitle: st.title,
          stageTurma: st.turma,
        }));
      });
    } else if (unit.lessonPlan && unit.lessonPlan.length > 0) {
      unitLessons = unit.lessonPlan;
    } else {
      // Fallback to proeducadorUnits template if unit.lessonPlan is currently empty
      const baseMatch = (proeducadorUnits || []).find((pu) => getAcronym(pu) === ucAcronym);
      if (baseMatch?.stages && baseMatch.stages.length > 0) {
        unitLessons = baseMatch.stages.flatMap((st) => {
          const stTurma = (st.turma || st.title || "").toLowerCase();
          if (selectedProfessorFilter === "Prof. Ricardo Beretella") {
            if (stTurma.includes("turma b") || stTurma.includes("etapa 2") || stTurma.includes("etapa 4")) return [];
          } else if (selectedProfessorFilter === "Prof. Ricardo Gea") {
            if (stTurma.includes("turma a") || stTurma.includes("etapa 1") || stTurma.includes("etapa 3")) return [];
          }
          return st.lessonPlan || [];
        });
      } else if (baseMatch?.lessonPlan) {
        unitLessons = baseMatch.lessonPlan;
      }
    }

    unitLessons.forEach((lesson) => {
      const iso = parseDateToISO(lesson.date);
      if (!iso) return;

      const dateObj = new Date(iso + "T12:00:00");
      const monthIdx = dateObj.getMonth();

      // Check if date belongs strictly to the active semester
      const isFirstSemesterDate = monthIdx < 6;
      if (selectedSemester === "1º SEMESTRE" && !isFirstSemesterDate) return;
      if (selectedSemester === "2º SEMESTRE" && isFirstSemesterDate) return;

      // Filter strictly by selected professor
      const belongsToProfessor = isLessonForTeacher(
        lesson,
        unit,
        iso,
        selectedProfessorFilter,
        selectedSemester
      );
      if (!belongsToProfessor) return;

      if (!masterDateMap[iso]) masterDateMap[iso] = [];
      const alreadyExists = masterDateMap[iso].some(
        (e) => e.ucAcronym === ucAcronym
      );
      if (!alreadyExists) {
        masterDateMap[iso].push({
          unit,
          lesson,
          ucAcronym,
          ucColor,
        });
      }
    });
  });

  // 2. Derive combined schedule list from masterDateMap to guarantee 100% sync across views
  const derivedScheduleItems: ScheduleItem[] = [];
  const sortedDates = Object.keys(masterDateMap).sort();

  let globalCounter = 1;
  sortedDates.forEach((iso) => {
    const entries = masterDateMap[iso];
    const dateObj = new Date(iso + "T12:00:00");
    const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const pastDaysOfYear = (dateObj.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    entries.forEach((entry) => {
      // Find matching item in custom schedule if user modified status or details
      const customMatch = (schedule || []).find((s) => {
        const sIso = parseDateToISO(s.date);
        return sIso === iso && (s.unit === entry.ucAcronym || s.topic === entry.lesson.conhecimentos);
      });

      derivedScheduleItems.push({
        id: customMatch?.id || entry.lesson.id || `sched-${iso}-${entry.ucAcronym}`,
        classNumber: customMatch?.classNumber || globalCounter++,
        weekNumber: customMatch?.weekNumber || weekNum,
        date: entry.lesson.date || formatDateBR(iso),
        unit: entry.ucAcronym,
        topic: customMatch?.topic || entry.lesson.conhecimentos || `${entry.ucAcronym} - Aula ${globalCounter}`,
        type: customMatch?.type || (entry.lesson.hours === "4h" ? "pratica" : "teorica"),
        status: customMatch?.status || entry.lesson.status || "planejada",
        activities: customMatch?.activities || entry.lesson.estrategias || "",
        notes: customMatch?.notes || entry.lesson.recursos || "",
        professor: customMatch?.professor || entry.lesson.professor || selectedProfessorFilter,
      });
    });
  });

  // Filtered schedule for semanas / tabela view
  const filteredSchedule = derivedScheduleItems.filter((item) => {
    const matchesSearch =
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.activities && item.activities.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedTypeFilter === "todos" || item.type === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === "todos" || item.status === selectedStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Group by Week Number for "semanas" view
  const weeksMap: Record<number, ScheduleItem[]> = {};
  filteredSchedule.forEach((item) => {
    const w = item.weekNumber || 1;
    if (!weeksMap[w]) weeksMap[w] = [];
    weeksMap[w].push(item);
  });

  const sortedWeekNumbers = Object.keys(weeksMap)
    .map(Number)
    .sort((a, b) => a - b);

  // Actions
  const toggleStatus = (id: string) => {
    const updated = schedule.map((item) => {
      if (item.id === id) {
        const nextStatus: ClassStatus =
          item.status === "planejada"
            ? "concluida"
            : item.status === "concluida"
            ? "reagendada"
            : item.status === "reagendada"
            ? "cancelada"
            : "planejada";
        return { ...item, status: nextStatus };
      }
      return item;
    });
    onChangeSchedule(updated);
  };

  const addClassItem = () => {
    const lastClass = schedule[schedule.length - 1];
    const newClassNumber = lastClass ? lastClass.classNumber + 1 : 1;
    const newWeekNumber = lastClass ? lastClass.weekNumber : 1;

    const newItem: ScheduleItem = {
      id: "class-" + Date.now(),
      classNumber: newClassNumber,
      weekNumber: newWeekNumber,
      date: new Date().toISOString().split("T")[0],
      topic: "Nova Aula Planejada",
      type: "teorica",
      status: "planejada",
      activities: "",
      professor: selectedProfessorFilter,
    };

    onChangeSchedule([...schedule, newItem]);
    setEditingItem(newItem);
  };

  const updateClassItem = (updated: ScheduleItem) => {
    const list = schedule.map((item) => (item.id === updated.id ? updated : item));
    onChangeSchedule(list);
    setEditingItem(null);
  };

  const deleteClassItem = (id: string) => {
    onChangeSchedule(schedule.filter((item) => item.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Month indices strictly separated by semester
  const monthIndices =
    selectedSemester === "1º SEMESTRE"
      ? [0, 1, 2, 3, 4, 5]     // Jan a Jun
      : [6, 7, 8, 9, 10, 11];  // Jul a Dez

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Calendário Escolar – {selectedProfessorFilter}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Visualização semestral exclusiva do cronograma de aulas e Unidades Curriculares
          </p>
        </div>

        {/* Header Controls: Teacher Profile and Semester Selector */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Teacher Profile Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <select
              value={selectedProfessorFilter}
              onChange={(e) => setSelectedProfessorFilter(e.target.value as any)}
              aria-label="Filtrar por docente"
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="Prof. Ricardo Beretella">Prof. Ricardo Beretella</option>
              <option value="Prof. Ricardo Gea">Prof. Ricardo Gea</option>
            </select>
          </div>

          {/* Semester Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedSemester("1º SEMESTRE")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedSemester === "1º SEMESTRE"
                  ? "bg-indigo-600 text-white shadow-md font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              1º SEMESTRE (JAN - JUN)
            </button>
            <button
              onClick={() => setSelectedSemester("2º SEMESTRE")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedSemester === "2º SEMESTRE"
                  ? "bg-indigo-600 text-white shadow-md font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              2º SEMESTRE (JUL - DEZ)
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Switcher and Calendar Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode("calendario")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "calendario"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendário Mensal</span>
          </button>
          <button
            onClick={() => setViewMode("semanas")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "semanas"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Visão por Semanas</span>
          </button>
          <button
            onClick={() => setViewMode("tabela")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "tabela"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Tabela Completa</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculateSchedule}
            title="Recalcular cronograma baseado no calendário oficial de 2026 e regras semanais"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Sincronizar Aulas</span>
          </button>
        </div>
      </div>

      {/* MASTER CALENDAR GRID */}
      {viewMode === "calendario" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* UC Color Legend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Legenda de Unidades Curriculares ({selectedSemester} – {semesterUnits.length} UCs)
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Feriados/Recessos são neutros (sem cor de fundo)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {semesterUnits.map((unit) => {
                const ucAcronym = getAcronym(unit);
                const ucColor = getAcronymColor(ucAcronym);

                return (
                  <div
                    key={unit.id}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 border ${
                      ucColor.bg
                    } ${ucColor.text} ${ucColor.border} shadow-2xs`}
                  >
                    <span>{ucAcronym}</span>
                    <span className="text-[10px] opacity-90 font-medium hidden sm:inline">
                      ({unit.workload || "40h"}) – {unit.unitTitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Month Grids for Selected Semester */}
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
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                      {monthName} 2026
                    </h4>
                  </div>

                  {/* Weekday Labels (Starting Sunday / DOM to Saturday / SÁB) */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {WEEKDAY_NAMES_PT.map((dayName) => (
                      <div key={dayName} className="py-1">{dayName}</div>
                    ))}
                  </div>

                  {/* Day Cells Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {grid.map((cell, cIdx) => {
                      if (!cell.isCurrentMonth || !cell.dayNumber || !cell.isoDate) {
                        return <div key={cIdx} className="h-11 bg-slate-50/40 dark:bg-slate-800/10 rounded-xl opacity-20" />;
                      }

                      const entries = masterDateMap[cell.isoDate] || [];
                      const schoolEvent = schoolEvents.find((ev) => ev.date === cell.isoDate);
                      const isHoliday = schoolEvent && (schoolEvent.type === "feriado" || schoolEvent.type === "suspensao");
                      const hasClasses = entries.length > 0;

                      // Single UC takes the full block color; Multiple UCs render distinct color bars
                      const singleEntry = entries.length === 1 ? entries[0] : null;

                      return (
                        <button
                          key={cIdx}
                          onClick={() => (hasClasses || isHoliday) && setSelectedDayModalDate(cell.isoDate)}
                          className={`min-h-12 rounded-xl font-bold flex flex-col items-center justify-between p-1 transition-all cursor-pointer border ${
                            isHoliday
                              ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500"
                              : singleEntry
                              ? `${singleEntry.ucColor.bg} ${singleEntry.ucColor.text} ${singleEntry.ucColor.border} shadow-2xs hover:scale-105 ring-1 ring-white/10`
                              : hasClasses
                              ? "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-2xs hover:scale-105"
                              : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span
                            className={`text-[11px] font-black leading-none ${
                              singleEntry ? "text-white" : isHoliday ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {cell.dayNumber}
                          </span>
                          
                          {/* Holiday Label (Neutral, No Color) */}
                          {isHoliday ? (
                            <span className="text-[7px] font-bold uppercase text-slate-400 dark:text-slate-500 truncate max-w-full leading-tight">
                              {schoolEvent?.type === "feriado" ? "Feriado" : "Recesso"}
                            </span>
                          ) : singleEntry ? (
                            <span className="text-[8px] font-black uppercase tracking-tight text-white leading-none truncate max-w-full">
                              {singleEntry.ucAcronym}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                              {entries.map((entry, eIdx) => (
                                <span
                                  key={eIdx}
                                  className={`px-1 py-0.5 text-[7px] font-black rounded ${entry.ucColor.bg} ${entry.ucColor.text} leading-none tracking-tighter truncate text-center shadow-2xs`}
                                  title={`${entry.ucAcronym} (${entry.lesson.hours}): ${entry.lesson.conhecimentos}`}
                                >
                                  {entry.ucAcronym} {entry.lesson.hours}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Day Classes Modal */}
          {selectedDayModalDate && (() => {
            const dayClasses = masterDateMap[selectedDayModalDate] || [];
            const formattedDate = formatDateBR(selectedDayModalDate);
            const schoolEvent = schoolEvents.find((ev) => ev.date === selectedDayModalDate);

            return (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">
                        {formattedDate} – {selectedProfessorFilter}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedDayModalDate(null)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  {schoolEvent && (
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-black uppercase text-slate-600 dark:text-slate-300">
                        {schoolEvent.type === "feriado" ? "Feriado Escolar" : "Recesso / Expediente Suspenso"}:
                      </span>{" "}
                      <span className="font-bold text-slate-800 dark:text-white">{schoolEvent.title}</span>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {dayClasses.length === 0 && !schoolEvent && (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Nenhuma aula registrada para este docente nesta data.
                      </p>
                    )}

                    {dayClasses.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-1 text-xs font-black rounded-lg ${item.ucColor.bg} ${item.ucColor.text}`}>
                            {item.ucAcronym} – {item.unit.unitTitle}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[10px] rounded">
                            {item.lesson.hours}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Conteúdo / Conhecimentos</span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.lesson.conhecimentos}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Estratégias</span>
                            <p className="text-slate-600 dark:text-slate-300">{item.lesson.estrategias}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Recursos</span>
                            <p className="text-slate-600 dark:text-slate-300">{item.lesson.recursos}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      onClick={() => setSelectedDayModalDate(null)}
                      className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* VIEW 2: SEMANAS VIEW & VIEW 3: TABELA VIEW */}
      {viewMode !== "calendario" && (
        <>
          {/* Filters and View Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por tópico, conteúdo ou atividade..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="todos">Todos os Tipos de Aula</option>
                <option value="teorica">Teórica</option>
                <option value="pratica">Prática</option>
                <option value="laboratorio">Laboratório</option>
                <option value="avaliacao">Avaliação / Prova</option>
                <option value="apresentacao">Apresentação</option>
                <option value="feriado">Feriado / Sem Aula</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="planejada">Planejada</option>
                <option value="concluida">Concluída</option>
                <option value="reagendada">Reagendada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Main Schedule Content */}
          {filteredSchedule.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nenhuma aula encontrada para o semestre e docente selecionados
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Ajuste os filtros ou adicione novas aulas ao cronograma.
              </p>
              <button
                onClick={addClassItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Adicionar Aula
              </button>
            </div>
          ) : viewMode === "semanas" ? (
            /* VIEW 2: Grouped by Weeks */
            <div className="space-y-6">
              {sortedWeekNumbers.map((weekNum) => {
                const weekClasses = weeksMap[weekNum];
                return (
                  <div
                    key={weekNum}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
                  >
                    {/* Week Header */}
                    <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-indigo-600 text-white text-xs font-extrabold rounded-lg flex items-center justify-center">
                          S{weekNum}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Semana {weekNum} ({weekClasses.length} {weekClasses.length === 1 ? "aula" : "aulas"})
                        </h4>
                      </div>

                      {weekClasses[0]?.unit && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          {weekClasses[0].unit}
                        </span>
                      )}
                    </div>

                    {/* Week Classes List */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {weekClasses.map((item) => {
                        const badge = getClassTypeBadgeColor(item.type);
                        const statusBadge = getClassStatusBadge(item.status);
                        const isExpanded = !!expandedItems[item.id];

                        return (
                          <div key={item.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              
                              {/* Left Info */}
                              <div className="flex items-start gap-3 flex-1">
                                {/* Class Number Badge */}
                                <button
                                  onClick={() => toggleStatus(item.id)}
                                  title="Clique para alterar status"
                                  className={`mt-0.5 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${statusBadge.bg} ${statusBadge.text}`}
                                >
                                  <span>Aula {item.classNumber}</span>
                                  {item.status === "concluida" && <Check className="w-3.5 h-3.5" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                                      {badge.label}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      {formatDateBR(item.date)}
                                    </span>
                                  </div>

                                  <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                    {item.topic}
                                  </h5>
                                </div>
                              </div>

                              {/* Right Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
                                >
                                  <span>Detalhes</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Editar Aula"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => deleteClassItem(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Excluir Aula"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl">
                                {item.activities && (
                                  <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                                      Atividades & Entregas:
                                    </span>
                                    <p className="text-slate-600 dark:text-slate-400">{item.activities}</p>
                                  </div>
                                )}

                                {item.notes && (
                                  <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                                      Observações / Recursos:
                                    </span>
                                    <p className="text-slate-600 dark:text-slate-400">{item.notes}</p>
                                  </div>
                                )}

                                {!item.activities && !item.notes && (
                                  <p className="text-slate-400 italic">Sem observações adicionais gravadas nesta aula.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW 3: Full Table View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-14 text-center">Nº</th>
                    <th className="p-3 w-16 text-center">Sem.</th>
                    <th className="p-3 w-32">Data</th>
                    <th className="p-3">Tópico / Conteúdo</th>
                    <th className="p-3 w-28">Tipo</th>
                    <th className="p-3 w-28 text-center">Status</th>
                    <th className="p-3">Atividades</th>
                    <th className="p-3 w-20 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSchedule.map((item) => {
                    const badge = getClassTypeBadgeColor(item.type);
                    const statusBadge = getClassStatusBadge(item.status);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-center font-extrabold text-slate-900 dark:text-white">
                          {item.classNumber}
                        </td>
                        <td className="p-3 text-center text-slate-500 font-medium">
                          S{item.weekNumber}
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatDateBR(item.date)}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {item.topic}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleStatus(item.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.label}
                          </button>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                          {item.activities || "-"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteClassItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Edit Class Modal */}
      {editingItem && (
        <EditClassModal
          item={editingItem}
          onSave={updateClassItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* School Calendar Events Management Modal */}
      {showSchoolEventsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">
                  Gerenciar Calendário Escolar 2026 (Feriados e Recessos)
                </h3>
              </div>
              <button
                onClick={() => setShowSchoolEventsModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Ajuste feriados, suspensões de expediente e sábados letivos para recalcular automaticamente os cronogramas de aula dos docentes.
            </p>

            {/* Form to add a new event */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Adicionar Feriado ou Recesso
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="date"
                  id="newEventDate"
                  defaultValue="2026-03-19"
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
                <input
                  type="text"
                  id="newEventTitle"
                  placeholder="Nome do evento (Ex: Padroeiro)"
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
                <select
                  id="newEventType"
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="feriado">Feriado / Recesso</option>
                  <option value="suspensao">Expediente Suspenso</option>
                  <option value="compensacao">Sábado de Compensação</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const d = (document.getElementById("newEventDate") as HTMLInputElement)?.value;
                  const t = (document.getElementById("newEventTitle") as HTMLInputElement)?.value;
                  const tp = (document.getElementById("newEventType") as HTMLSelectElement)?.value as any;
                  if (d && t) {
                    setSchoolEvents((prev) => [
                      ...prev,
                      { id: `ev-${Date.now()}`, date: d, title: t, type: tp },
                    ]);
                  }
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                + Adicionar ao Calendário
              </button>
            </div>

            {/* List of current events */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {schoolEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                      {ev.date.split("-").reverse().join("/")}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{ev.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        ev.type === "feriado"
                          ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          : ev.type === "compensacao"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {ev.type}
                    </span>
                  </div>
                  <button
                    onClick={() => setSchoolEvents((prev) => prev.filter((item) => item.id !== ev.id))}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSchoolEventsModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRecalculateSchedule();
                  setShowSchoolEventsModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Salvar e Recalcular Cronograma</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Edit Class Modal
interface EditClassModalProps {
  item: ScheduleItem;
  onSave: (updated: ScheduleItem) => void;
  onClose: () => void;
}

const EditClassModal: React.FC<EditClassModalProps> = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState<ScheduleItem>({ ...item });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Editar Aula {formData.classNumber}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Número da Aula
              </label>
              <input
                type="number"
                value={formData.classNumber}
                onChange={(e) => setFormData({ ...formData, classNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Semana
              </label>
              <input
                type="number"
                value={formData.weekNumber}
                onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tipo de Aula
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ClassType })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold"
              >
                <option value="teorica">Teórica</option>
                <option value="pratica">Prática</option>
                <option value="laboratorio">Laboratório</option>
                <option value="avaliacao">Avaliação / Prova</option>
                <option value="apresentacao">Apresentação</option>
                <option value="feriado">Feriado / Sem Aula</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Tópico / Conteúdo
            </label>
            <input
              type="text"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Status da Aula
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClassStatus })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold"
            >
              <option value="planejada">Planejada</option>
              <option value="concluida">Concluída</option>
              <option value="reagendada">Reagendada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Atividades / Leituras / Entregas
            </label>
            <input
              type="text"
              value={formData.activities || ""}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              placeholder="Ex: Leitura do cap. 2 ou Entrega do Trabalho 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
