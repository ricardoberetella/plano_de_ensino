import React from "react";
import {
  FileText,
  BookOpen,
  Calendar,
  Sparkles,
  Printer,
} from "lucide-react";
import { ActiveTab } from "../types/syllabus";

interface TabsNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  totalClasses: number;
  completedClasses: number;
  totalUnitsCount?: number;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onTabChange,
  totalClasses,
  completedClasses,
  totalUnitsCount = 9,
}) => {
  const tabs = [
    {
      id: "plano" as ActiveTab,
      label: "Plano de Ensino",
      icon: FileText,
      badge: null,
    },
    {
      id: "unidades" as ActiveTab,
      label: "Unidades Curriculares",
      icon: BookOpen,
      badge: `${totalUnitsCount} UCs`,
      badgeColor: "bg-red-950/80 text-red-300 border border-red-800",
    },
    {
      id: "cronograma" as ActiveTab,
      label: "Cronograma de Aulas",
      icon: Calendar,
      badge: `${completedClasses}/${totalClasses}`,
    },
    {
      id: "gerar_ia" as ActiveTab,
      label: "IA Assistente",
      icon: Sparkles,
      badge: "Gemini AI",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    },
    {
      id: "visao_aluno" as ActiveTab,
      label: "Imprimir",
      icon: Printer,
      badge: "PDF",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
    },
  ];

  return (
    <div className="no-print bg-slate-900/95 border-b border-slate-800 backdrop-blur-sm sticky top-[61px] z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <nav className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                      tab.badgeColor ||
                      (isActive
                        ? "bg-red-800 text-red-100"
                        : "bg-slate-800 text-slate-300 border border-slate-700")
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};


