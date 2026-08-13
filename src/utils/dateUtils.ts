import { ScheduleItem } from "../types/syllabus";

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return "Data a definir";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    const dayName = date.toLocaleDateString("pt-BR", { weekday: "short" });
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return `${formattedDay} ${formattedMonth} (${dayName})`;
  } catch (e) {
    return dateStr;
  }
}

export function calculateScheduleProgress(schedule: ScheduleItem[]): {
  total: number;
  completed: number;
  percentage: number;
  upcomingCount: number;
} {
  if (!schedule || schedule.length === 0) {
    return { total: 0, completed: 0, percentage: 0, upcomingCount: 0 };
  }
  const total = schedule.length;
  const completed = schedule.filter((item) => item.status === "concluida").length;
  const percentage = Math.round((completed / total) * 100);
  const upcomingCount = total - completed;
  return { total, completed, percentage, upcomingCount };
}

export function getClassTypeBadgeColor(type: string): { bg: string; text: string; border: string; label: string } {
  switch (type) {
    case "teorica":
      return { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", label: "Teórica" };
    case "pratica":
      return { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", label: "Prática" };
    case "laboratorio":
      return { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", label: "Laboratório" };
    case "avaliacao":
      return { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700", label: "Avaliação / Prova" };
    case "apresentacao":
      return { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800", label: "Apresentação" };
    case "feriado":
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300 dark:border-slate-700", label: "Feriado / Sem Aula" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", label: type };
  }
}

export function getClassStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "concluida":
      return { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-800 dark:text-emerald-200", label: "Concluída" };
    case "reagendada":
      return { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-800 dark:text-amber-200", label: "Reagendada" };
    case "cancelada":
      return { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-800 dark:text-rose-200", label: "Cancelada" };
    case "planejada":
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", label: "Planejada" };
  }
}
