import React from "react";
import {
  LayoutGrid,
  FileText,
  BookOpen,
  Calendar,
  LogOut,
  X,
} from "lucide-react";
import { ActiveTab, UserProfile } from "../types/syllabus";
import { SenaiLogo } from "./SenaiLogo";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  onOpenLoginModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onChangeUser,
  onOpenLoginModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Pre-defined profiles preserving login role
  const ricardoBeretella: UserProfile = {
    id: "user-beretella",
    name: "Prof. Ricardo Beretella",
    email: "ricardo.beretella@sp.senai.br",
    role: currentUser.role || "admin",
    unit: "Escola SENAI Roberto Mange - Campinas",
  };

  const ricardoGea: UserProfile = {
    id: "user-gea",
    name: "Prof. Ricardo Gea",
    email: "ricardo.gea@sp.senai.br",
    role: currentUser.role || "admin",
    unit: "Departamento Regional SENAI - SP",
  };

  const isBeretellaActive = currentUser.name.toLowerCase().includes("beretella");
  const isGeaActive = currentUser.name.toLowerCase().includes("gea");

  const menuItems = [
    {
      id: "menu" as ActiveTab,
      label: "MENU",
      icon: LayoutGrid,
    },
    {
      id: "plano" as ActiveTab,
      label: "PLANO DE CURSO",
      icon: FileText,
    },
    {
      id: "unidades" as ActiveTab,
      label: "UNIDADES CURRICULARES",
      icon: BookOpen,
    },
    {
      id: "cronograma" as ActiveTab,
      label: "CALENDÁRIO ESCOLAR",
      icon: Calendar,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a1128] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header Logo Section */}
        <div>
          <div className="p-4 flex items-center justify-center relative border-b border-slate-800/80">
            <div className="flex items-center justify-center w-full">
              <SenaiLogo size="md" showSubtitle={false} />
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="absolute right-3 top-4 lg:hidden p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section - PROFESSOR ATIVO & Profile Selector */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#070d20]">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            PROFESSOR ATIVO
          </span>

          <div className="space-y-1.5">
            {/* Ricardo Beretella Profile Option */}
            <button
              onClick={() => onChangeUser(ricardoBeretella)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isBeretellaActive
                  ? "bg-blue-900/60 border-blue-500 text-white shadow-xs"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                  isBeretellaActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                RB
              </div>
              <div className="text-xs font-black truncate">
                Ricardo Beretella
              </div>
            </button>

            {/* Ricardo Gea Profile Option */}
            <button
              onClick={() => onChangeUser(ricardoGea)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isGeaActive
                  ? "bg-indigo-900/60 border-indigo-500 text-white shadow-xs"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                  isGeaActive
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                RG
              </div>
              <div className="text-xs font-black truncate">
                Ricardo Gea
              </div>
            </button>
          </div>

          {/* Sair do Sistema / Login Modal Trigger */}
          <button
            onClick={onOpenLoginModal}
            className="w-full mt-2 py-2 px-3 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>LOGIN / PERMISSÃO</span>
          </button>
        </div>
      </aside>
    </>
  );
};
