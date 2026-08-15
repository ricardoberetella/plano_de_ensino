import React from "react";
import {
  Menu as MenuIcon,
  User,
} from "lucide-react";
import { Syllabus, UserProfile, ActiveTab } from "../types/syllabus";

interface HeaderProps {
  syllabi: Syllabus[];
  activeSyllabus: Syllabus;
  activeTab: ActiveTab;
  currentUser: UserProfile;
  onSelectSyllabus: (id: string) => void;
  onChangeUser?: (user: UserProfile) => void;
  onOpenLoginModal: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syllabi,
  activeSyllabus,
  activeTab,
  currentUser,
  onSelectSyllabus,
  onChangeUser,
  onOpenLoginModal,
  onToggleMobileSidebar,
}) => {
  const isAdmin = currentUser.role === "admin";

  const tabLabels: Record<ActiveTab, string> = {
    menu: "MENU",
    plano: "PLANO DE CURSO",
    unidades: "UNIDADES CURRICULARES",
    cronograma: "CALENDÁRIO ESCOLAR",
    gerar_ia: "PROEDUCADOR IA",
    visao_aluno: "IMPRIMIR (PDF)",
  };

  const isBeretella = currentUser.name.toLowerCase().includes("beretella");

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChangeUser) return;
    const val = e.target.value;
    if (val === "gea") {
      onChangeUser({
        ...currentUser,
        id: "user-gea",
        name: "Prof. Ricardo Gea",
        email: "ricardo.gea@sp.senai.br",
        role: "admin",
        unit: "Departamento Regional SENAI - SP",
      });
    } else {
      onChangeUser({
        ...currentUser,
        id: "user-beretella",
        name: "Prof. Ricardo Beretella",
        email: "ricardo.beretella@sp.senai.br",
        role: "admin",
        unit: "Escola SENAI Roberto Mange - Campinas",
      });
    }
  };

  return (
    <header className="no-print bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left Side Breadcrumb & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            title="Abrir Menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-slate-700 dark:text-slate-200">
            <span className="text-blue-600 dark:text-blue-400">
              {tabLabels[activeTab] || "MENU"}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="relative inline-block">
              <select
                value={activeSyllabus.id}
                onChange={(e) => onSelectSyllabus(e.target.value)}
                className="bg-transparent font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-blue-600"
              >
                {syllabi.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {s.courseTitle.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Side Status Indicators & Professor Profile Selector */}
        <div className="flex items-center gap-3">
          {/* Cloud Online Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FIREBASE CLOUD ONLINE</span>
          </div>

          {/* Exclusive Professor Profile Selector */}
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all ${
              isBeretella
                ? "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                : "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">PERFIL DOCENTE:</span>
            <select
              value={isBeretella ? "beretella" : "gea"}
              onChange={handleProfileChange}
              className="bg-transparent font-black focus:outline-none cursor-pointer uppercase pr-1"
            >
              <option value="beretella" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                Prof. Ricardo Beretella
              </option>
              <option value="gea" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                Prof. Ricardo Gea
              </option>
            </select>
          </div>

          {/* Admin / Edit Status Badge & Login Modal trigger */}
          <button
            onClick={onOpenLoginModal}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
              isAdmin
                ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100"
                : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100"
            }`}
            title="Clique para abrir o login de acesso / alterar permissão"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>{isAdmin ? "MODO EDIÇÃO (ADMIN)" : "LEITURA"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
