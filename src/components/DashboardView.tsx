import React, { useRef } from "react";
import {
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Syllabus, UserProfile } from "../types/syllabus";

interface DashboardViewProps {
  syllabi: Syllabus[];
  activeSyllabus: Syllabus;
  currentUser?: UserProfile | null;
  onSelectSyllabus: (id: string) => void;
  onGoToTab: (tab: "plano" | "unidades" | "cronograma" | "visao_aluno" | "gerar_ia") => void;
  onCreateNew: () => void;
  onDeleteSyllabus: (id: string) => void;
  onSyncCloud: () => void;
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
  onCreateNew,
  onDeleteSyllabus,
  onSyncCloud,
  onExportBackup,
  onImportBackup,
  isSyncing = false,
}) => {
  const isAdmin = currentUser?.role === "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportBackup) {
      onImportBackup(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
      {/* Hidden file input for backup restoration */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            MEUS PLANOS DE CURSO
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
            GESTÃO PEDAGÓGICA MSEP • {currentUser?.name ? `DOCENTE ATIVO: ${currentUser.name.toUpperCase()}` : "SISTEMA PEDAGÓGICO"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export Backup JSON Button */}
          {onExportBackup && (
            <button
              onClick={onExportBackup}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
              title="Baixar cópia de segurança completa em arquivo .JSON no seu computador"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>BAIXAR BACKUP (.JSON)</span>
            </button>
          )}

          {/* Import Backup JSON Button */}
          {isAdmin && onImportBackup && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
              title="Restaurar dados a partir de um arquivo .JSON salvo anteriormente"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>RESTAURAR BACKUP</span>
            </button>
          )}

          <button
            onClick={onSyncCloud}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-extrabold border border-blue-200 dark:border-blue-800 flex items-center gap-2 transition-all shadow-xs cursor-pointer uppercase tracking-wider disabled:opacity-60"
            title="Salva e sincroniza todos os planos imediatamente no Firebase Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "SALVANDO..." : "SALVAR NA NUVEM"}</span>
          </button>

          {isAdmin && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>NOVO PLANO DE CURSO</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: PLANOS TOTAIS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            PLANOS REGISTRADOS
          </span>
          <div className="text-4xl font-black text-slate-900 dark:text-white">
            {visibleSyllabi.length}
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            PERFIS INDEPENDENTES POR PROFESSOR
          </p>
        </div>

        {/* Card 2: SERVIÇO DE DADOS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-500/80 dark:border-blue-600 shadow-xs space-y-2 relative overflow-hidden">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            BANCO DE DADOS EM NUVEM
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              Firebase Online
            </span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block ring-4 ring-emerald-500/20 animate-pulse" />
          </div>
          <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            SINCRONIZAÇÃO AUTOMÁTICA EM TEMPO REAL
          </p>
        </div>

        {/* Card 3: SEGURANÇA E BACKUP */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-500/80 dark:border-emerald-600 shadow-xs space-y-2 relative overflow-hidden">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            PROTEÇÃO DE DADOS
          </span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xl font-black text-slate-900 dark:text-white">
              Dupla Camada
            </span>
          </div>
          <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            NUVEM FIRESTORE + LOCAL STORAGE + BACKUP .JSON
          </p>
        </div>
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
