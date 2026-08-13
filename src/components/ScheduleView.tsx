import React, { useState, useEffect } from "react";
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
  UcColorConfig,
} from "../utils/calendarUtils";
import {
  SchoolCalendarEvent,
  TeacherWeeklyRule,
  INITIAL_SCHOOL_EVENTS_2026,
  TEACHER_SCHEDULE_RULES,
} from "../utils/calendarConfig";
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
  const units = syllabus.programmaticContent || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("todos");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("todos");
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
  const [viewMode, setViewMode] = useState<"calendario" | "semanas" | "tabela">("calendario");

  // Calendar master states
  const [selectedSemester, setSelectedSemester] = useState<"1º SEMESTRE" | "2º SEMESTRE">("1º SEMESTRE");
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>("todas");
  const [selectedDayModalDate, setSelectedDayModalDate] = useState<string | null>(null);

  // Modals for editing school calendar & teacher rules
  const [showSchoolEventsModal, setShowSchoolEventsModal] = useState(false);
  const [showTeacherRulesModal, setShowTeacherRulesModal] = useState(false);
  const [schoolEvents, setSchoolEvents] = useState<SchoolCalendarEvent[]>(INITIAL_SCHOOL_EVENTS_2026);
  const [teacherRules, setTeacherRules] = useState<TeacherWeeklyRule[]>(TEACHER_SCHEDULE_RULES);

  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const progress = calculateScheduleProgress(schedule);

  // Recalculate schedule based on current rules & calendar
  const handleRecalculateSchedule = () => {
    const { updatedUnits, masterSchedule } = generateSyllabusSchedule(units, schoolEvents, teacherRules);
    syllabus.programmaticContent = updatedUnits;
    onChangeSchedule(masterSchedule);
  };

  // Helper to compute acronym for a UC
  const getAcronym = (unit: ProgrammaticUnit): string => {
    const title = (unit.unitTitle || "").toUpperCase();
    if (unit.acronym === "PROC" || unit.acronym === "PRUSC" || title.includes("PROCESSOS")) return "PRUSC";
    if (unit.acronym === "METR" || unit.acronym === "MINDU" || title.includes("METROLOGIA")) return "MINDU";
    if (unit.acronym === "LIDT" || title.includes("LEITURA")) return "LIDT";
    if (unit.acronym === "CIEMA" || title.includes("CIÊNCIAS") || title.includes("CIENCIAS")) return "CIEMA";
    if (unit.acronym === "CRD" || unit.acronym === "CDMAT" || title.includes("CONTROLE")) return "CRD";
    if (unit.acronym === "MAP" || title.includes("MATEMÁTICA") || title.includes("MATEMATICA")) return "MAP";
    if (unit.acronym === "FUSI" || title.includes("FUNDAMENTOS")) return "FUSI";
    if (unit.acronym) return unit.acronym;
    return title.substring(0, 5);
  };

  // Master date map aggregating all UCs
  interface DateEntry {
    unit: ProgrammaticUnit;
    lesson: LessonPlanItem;
    ucAcronym: string;
    ucColor: UcColorConfig;
  }

  const masterDateMap: Record<string, DateEntry[]> = {};

  units.forEach((unit, idx) => {
    const ucColor = getUcColor(idx);
    const ucAcronym = getAcronym(unit);
    const lessons = unit.lessonPlan || [];

    lessons.forEach((lesson) => {
      const iso = parseDateToISO(lesson.date);
      if (iso) {
        if (!masterDateMap[iso]) masterDateMap[iso] = [];
        masterDateMap[iso].push({
          unit,
          lesson,
          ucAcronym,
          ucColor,
        });
      }
    });
  });

  // Filtered schedule for semanas / tabela view
  const filteredSchedule = schedule.filter((item) => {
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

  const markAllPreviousCompleted = () => {
    const today = new Date().toISOString().split("T")[0];
    const updated = schedule.map((item) => {
      if (item.date && item.date <= today && item.status === "planejada") {
        return { ...item, status: "concluida" as ClassStatus };
      }
      return item;
    });
    onChangeSchedule(updated);
  };

  const reorderClassNumbers = () => {
    const updated = schedule.map((item, index) => ({
      ...item,
      classNumber: index + 1,
    }));
    onChangeSchedule(updated);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const monthIndices =
    selectedSemester === "1º SEMESTRE"
      ? [0, 1, 2, 3, 4, 5]
      : [6, 7, 8, 9, 10, 11];

  const semesterUnits = units.filter((u) => {
    const ac = getAcronym(u);
    if (selectedSemester === "1º SEMESTRE") {
      return !["PRUSC", "MINDU"].includes(ac);
    } else {
      return ["PRUSC", "MINDU"].includes(ac);
    }
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Simple Header with Title and Semester Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Calendário Escolar Integrado
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Acompanhamento de aulas por Unidade Curricular e distribuição dos semestres
          </p>
        </div>

        {/* Semester Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setSelectedSemester("1º SEMESTRE")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              selectedSemester === "1º SEMESTRE"
                ? "bg-indigo-600 text-white shadow-md font-extrabold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            1º SEMESTRE (JAN - JUN)
          </button>
          <button
            onClick={() => setSelectedSemester("2º SEMESTRE")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              selectedSemester === "2º SEMESTRE"
                ? "bg-indigo-600 text-white shadow-md font-extrabold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            2º SEMESTRE (JUL - DEZ)
          </button>
        </div>
      </div>

      {/* MASTER CALENDAR GRID */}
      {viewMode === "calendario" && (
        <div className="space-y-6 animate-in fade-in duration-200">
        {/* UC Color Legend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
            Legenda de Unidades Curriculares ({semesterUnits.length} UCs)
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {semesterUnits.map((unit) => {
              const originalIdx = units.findIndex((u) => u.id === unit.id);
              const ucColor = getUcColor(originalIdx >= 0 ? originalIdx : 0);
              const ucAcronym = getAcronym(unit);

              return (
                <div
                  key={unit.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border ${
                    ucColor.bg
                  } ${ucColor.text} ${ucColor.border}`}
                >
                  <span>{ucAcronym}</span>
                  <span className="text-[10px] opacity-80 font-semibold hidden sm:inline">
                    ({unit.workload || "40h"})
                  </span>
                </div>
              );
            })}
          </div>
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
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                      {monthName} 2026
                    </h4>
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
                        return <div key={cIdx} className="h-10 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl opacity-30" />;
                      }

                      let entries = masterDateMap[cell.isoDate] || [];
                      if (selectedUnitFilter !== "todas") {
                        entries = entries.filter((e) => e.unit.id === selectedUnitFilter);
                      }
                      if (selectedProfessorFilter !== "todos") {
                        const profKeyword = selectedProfessorFilter.replace("Prof. ", "");
                        entries = entries.filter((e) => e.lesson.professor?.includes(profKeyword));
                      }

                      const schoolEvent = schoolEvents.find((ev) => ev.date === cell.isoDate);
                      const isHoliday = schoolEvent && (schoolEvent.type === "feriado" || schoolEvent.type === "suspensao");
                      const hasClasses = entries.length > 0;

                      return (
                        <button
                          key={cIdx}
                          onClick={() => hasClasses && setSelectedDayModalDate(cell.isoDate)}
                          className={`min-h-12 rounded-xl font-bold flex flex-col items-center justify-between p-1 transition-all cursor-pointer border ${
                            isHoliday
                              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400"
                              : hasClasses
                              ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs hover:scale-105 hover:border-indigo-500"
                              : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="text-[11px] font-extrabold leading-none">{cell.dayNumber}</span>
                          
                          {/* Event or UC Chips */}
                          {isHoliday ? (
                            <span className="text-[7px] font-black uppercase text-red-600 dark:text-red-400 truncate max-w-full leading-tight">
                              {schoolEvent?.type === "feriado" ? "Feriado" : "Recesso"}
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-0.5 flex-wrap w-full overflow-hidden max-h-6">
                              {entries.map((entry, eIdx) => (
                                <span
                                  key={eIdx}
                                  className={`px-1 py-0.5 text-[8px] font-black rounded ${entry.ucColor.bg} ${entry.ucColor.text} leading-none tracking-tighter truncate max-w-full`}
                                  title={`${entry.ucAcronym} (${entry.lesson.professor || 'Docente'}): ${entry.lesson.conhecimentos}`}
                                >
                                  {entry.ucAcronym}
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
            const rawDayClasses = masterDateMap[selectedDayModalDate] || [];
            const dayClasses = rawDayClasses.filter((item) => {
              if (selectedProfessorFilter === "todos") return true;
              const profKeyword = selectedProfessorFilter.replace("Prof. ", "");
              return (item.lesson.professor || "").includes(profKeyword);
            });
            const formattedDate = formatDateBR(selectedDayModalDate);

            return (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">
                        Aulas Programadas para {formattedDate}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedDayModalDate(null)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
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
                Nenhuma aula encontrada
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Tente ajustar seus termos de busca/filtros ou adicione novas aulas.
              </p>
              <button
                onClick={addClassItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Adicionar Primeira Aula
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
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : ev.type === "compensacao"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
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
