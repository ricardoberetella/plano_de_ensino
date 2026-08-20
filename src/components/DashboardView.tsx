import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Syllabus, UserProfile } from "../types/syllabus";

interface DashboardViewProps {
  syllabi: Syllabus[];
  activeSyllabus: Syllabus;
  currentUser?: UserProfile | null;
  onSelectSyllabus: (id: string) => void;
  onGoToTab: (tab: "plano" | "unidades" | "cronograma" | "visao_aluno" | "gerar_ia") => void;
  onCreateNew?: () => void;
  onDeleteSyllabus: (id: string) => void;
  onSyncCloud?: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  isSyncing?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  syllabi,
  activeSyllabus,
  currentUser,
  onSelectSyllabus,
  onGoToTab,
  onDeleteSyllabus,
}) => {
  const isAdmin = currentUser?.role === "admin";

  // Filter courses for the currently active professor so only 1 entry appears for the course
  const isGea = currentUser?.name?.toLowerCase().includes("gea");
  const isBeretella = currentUser?.name?.toLowerCase().includes("beretella");

  const visibleSyllabi = syllabi.filter((s) => {
    if (!s) return false;
    const sIsGea = (s.professorName && s.professorName.toLowerCase().includes("gea")) || s.id.includes("gea");
    const sIsBeretella = (s.professorName && s.professorName.toLowerCase().includes("beretella")) || s.id.includes("beretella");

    if (isGea) {
      return sIsGea || (!sIsBeretella && s.id !== "senai-usinagem-800h-beretella");
    }
    if (isBeretella) {
      return sIsBeretella || (!sIsGea && s.id !== "senai-usinagem-800h-gea");
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Title Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
          PLANOS DE CURSO
        </h1>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
          GESTÃO PEDAGÓGICA MSEP • {currentUser?.name ? `DOCENTE ATIVO: ${currentUser.name.toUpperCase()}` : "SISTEMA PEDAGÓGICO"}
        </p>
      </div>

      {/* Plans Table / Cards List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
          <div className="col-span-5">CURSO / DOCENTE RESPONSÁVEL</div>
          <div className="col-span-2 text-center">CARGA</div>
          <div className="col-span-3 text-center">SINCRONIZADO</div>
          <div className="col-span-2 text-right">AÇÕES</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleSyllabi.map((s) => {
            const isSelected = s.id === activeSyllabus.id;
            const isBaseCourse =
              s.id === "senai-usinagem-800h-beretella" ||
              s.id === "senai-usinagem-800h-gea" ||
              s.id.includes("usinagem-800h") ||
              s.courseTitle.toLowerCase().includes("usinagem convencional");

            return (
              <div
                key={s.id}
                className={`p-5 md:px-6 md:py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors ${
                  isSelected
                    ? "bg-blue-50/30 dark:bg-blue-950/20"
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                }`}
              >
                {/* Course Name & Badge */}
                <div className="col-span-12 md:col-span-5 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onSelectSyllabus(s.id)}
                      className="text-base font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer"
                    >
                      {s.courseTitle.toUpperCase()}
                    </button>
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded-md border border-blue-200 dark:border-blue-800 uppercase">
                        ATIVO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5 flex-wrap">
                    <span className="text-blue-600 dark:text-blue-400 font-black">
                      {s.professorName || "DOCENTE SENAI"}
                    </span>
                    <span>•</span>
                    <span>{s.department || "SENAI-SP"}</span>
                  </div>
                </div>

                {/* Workload */}
                <div className="col-span-6 md:col-span-2 md:text-center">
                  <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Carga:
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {s.workload}
                  </span>
                </div>

                {/* Last Sync Date */}
                <div className="col-span-6 md:col-span-3 md:text-center">
                  <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Sincronizado:
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(s.updatedAt).toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 pt-2 md:pt-0">
                  {/* View / Student PDF */}
                  <button
                    onClick={() => {
                      onSelectSyllabus(s.id);
                      onGoToTab("visao_aluno");
                    }}
                    className="w-9 h-9 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    title="Visualizar Plano e Gerar PDF"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit Plan / UCs */}
                  <button
                    onClick={() => {
                      onSelectSyllabus(s.id);
                      onGoToTab("unidades");
                    }}
                    className="w-9 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    title="Editar Unidades Curriculares e Conteúdos"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete Plan - Disabled / Hidden for Base Official Courses */}
                  {!isBaseCourse && isAdmin && syllabi.length > 1 && (
                    <button
                      onClick={() => onDeleteSyllabus(s.id)}
                      className="w-9 h-9 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir Plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
