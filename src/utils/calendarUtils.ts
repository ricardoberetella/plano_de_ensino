export interface UcColorConfig {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  hex: string;
  ring: string;
  lightBg: string;
  hoverBg: string;
}

export const UC_COLOR_PALETTE: UcColorConfig[] = [
  // 0: LIDT - Blue
  {
    bg: "bg-blue-600",
    text: "text-white",
    border: "border-blue-700",
    badgeBg: "bg-blue-100 dark:bg-blue-950/80",
    badgeText: "text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
    hex: "#2563eb",
    ring: "ring-blue-400 dark:ring-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/40",
    hoverBg: "hover:bg-blue-700",
  },
  // 1: CIEMA - Emerald Green
  {
    bg: "bg-emerald-600",
    text: "text-white",
    border: "border-emerald-700",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    hex: "#059669",
    ring: "ring-emerald-400 dark:ring-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/40",
    hoverBg: "hover:bg-emerald-700",
  },
  // 2: CRD / CDMAT - Amber
  {
    bg: "bg-amber-600",
    text: "text-white",
    border: "border-amber-700",
    badgeBg: "bg-amber-100 dark:bg-amber-950/80",
    badgeText: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
    hex: "#d97706",
    ring: "ring-amber-400 dark:ring-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/40",
    hoverBg: "hover:bg-amber-700",
  },
  // 3: MAP - Red (Vermelho)
  {
    bg: "bg-red-600",
    text: "text-white",
    border: "border-red-700",
    badgeBg: "bg-red-100 dark:bg-red-950/80",
    badgeText: "text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
    hex: "#dc2626",
    ring: "ring-red-400 dark:ring-red-500",
    lightBg: "bg-red-50 dark:bg-red-950/40",
    hoverBg: "hover:bg-red-700",
  },
  // 4: FUSI - Purple
  {
    bg: "bg-purple-600",
    text: "text-white",
    border: "border-purple-700",
    badgeBg: "bg-purple-100 dark:bg-purple-950/80",
    badgeText: "text-purple-700 dark:text-purple-300",
    dotColor: "bg-purple-500",
    hex: "#9333ea",
    ring: "ring-purple-400 dark:ring-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-950/40",
    hoverBg: "hover:bg-purple-700",
  },
  // 5: PRUSC - Cyan
  {
    bg: "bg-cyan-600",
    text: "text-white",
    border: "border-cyan-700",
    badgeBg: "bg-cyan-100 dark:bg-cyan-950/80",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    dotColor: "bg-cyan-500",
    hex: "#0891b2",
    ring: "ring-cyan-400 dark:ring-cyan-500",
    lightBg: "bg-cyan-50 dark:bg-cyan-950/40",
    hoverBg: "hover:bg-cyan-700",
  },
  // 6: MINDU - Pink
  {
    bg: "bg-pink-600",
    text: "text-white",
    border: "border-pink-700",
    badgeBg: "bg-pink-100 dark:bg-pink-950/80",
    badgeText: "text-pink-700 dark:text-pink-300",
    dotColor: "bg-pink-500",
    hex: "#db2777",
    ring: "ring-pink-400 dark:ring-pink-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/40",
    hoverBg: "hover:bg-pink-700",
  },
  // 7: Indigo (Fallback)
  {
    bg: "bg-indigo-600",
    text: "text-white",
    border: "border-indigo-700",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/80",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    dotColor: "bg-indigo-500",
    hex: "#4f46e5",
    ring: "ring-indigo-400 dark:ring-indigo-500",
    lightBg: "bg-indigo-50 dark:bg-indigo-950/40",
    hoverBg: "hover:bg-indigo-700",
  },
];

export function getUcColor(key: number | string | { acronym?: string; unitTitle?: string; id?: string } | undefined | null): UcColorConfig {
  if (key === null || key === undefined) return UC_COLOR_PALETTE[0];

  if (typeof key === "number") {
    return UC_COLOR_PALETTE[Math.abs(key) % UC_COLOR_PALETTE.length];
  }

  let text = "";
  if (typeof key === "object") {
    text = (key.acronym || key.unitTitle || key.id || "").toUpperCase();
  } else if (typeof key === "string") {
    text = key.toUpperCase().trim();
  }

  if (text.includes("LIDT") || text.includes("LEITURA") || text.includes("DESENHO")) {
    return UC_COLOR_PALETTE[0]; // Blue
  }
  if (text.includes("CIEMA") || text.includes("CIÊNCIAS") || text.includes("CIENCIAS") || text.includes("MATERIAIS")) {
    return UC_COLOR_PALETTE[1]; // Emerald Green
  }
  if (text.includes("CRD") || text.includes("CDMAT") || text.includes("CONTROLE") || text.includes("DIMENSIONAL")) {
    return UC_COLOR_PALETTE[2]; // Amber
  }
  if (text.includes("MAP") || text.includes("MATEMÁTICA") || text.includes("MATEMATICA")) {
    return UC_COLOR_PALETTE[3]; // Red
  }
  if (text.includes("FUSI") || text.includes("FUNDAMENTOS")) {
    return UC_COLOR_PALETTE[4]; // Purple
  }
  if (text.includes("PRUSC") || text.includes("PROC") || text.includes("PROCESSOS") || text.includes("USINAGEM CONVENCIONAL")) {
    return UC_COLOR_PALETTE[5]; // Cyan
  }
  if (text.includes("MINDU") || text.includes("METR") || text.includes("METROLOGIA")) {
    return UC_COLOR_PALETTE[6]; // Pink
  }

  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return UC_COLOR_PALETTE[hash % UC_COLOR_PALETTE.length];
}

export const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAY_NAMES_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function parseDateToISO(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const str = dateStr.trim();
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      let year = parts[2].trim();
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    } else if (parts.length === 2) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      return `2026-${month}-${day}`;
    }
  } else if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        return `${year}-${month}-${day}`;
      } else {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        let year = parts[2].trim();
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    } else if (parts.length === 2) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      return `2026-${month}-${day}`;
    }
  }
  return null;
}

export interface DayGridItem {
  dayNumber: number | null;
  isoDate: string | null;
  isCurrentMonth: boolean;
}

export function getMonthGrid(year: number, monthIndex: number): DayGridItem[] {
  const firstDay = new Date(year, monthIndex, 1);
  // Sunday-based day of week (0 = Dom, 1 = Seg, ..., 6 = Sáb)
  const startDayOfWeek = firstDay.getDay();

  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const grid: DayGridItem[] = [];

  // Padding days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    grid.push({ dayNumber: null, isoDate: null, isCurrentMonth: false });
  }

  // Days of the month
  for (let day = 1; day <= totalDays; day++) {
    const mStr = String(monthIndex + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    grid.push({
      dayNumber: day,
      isoDate: `${year}-${mStr}-${dStr}`,
      isCurrentMonth: true,
    });
  }

  // Pad remaining to complete row of 7 if necessary
  while (grid.length % 7 !== 0) {
    grid.push({ dayNumber: null, isoDate: null, isCurrentMonth: false });
  }

  return grid;
}
