import React, { useState } from "react";
import {
  FileText,
  UserCheck,
  CheckCircle2,
  Cpu,
  User,
  Sparkles,
  Save,
  Check,
  Lock,
  Printer,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Award,
  Layers,
  Wrench,
  BookOpen,
  Calendar,
  AlertCircle,
  Briefcase,
  Target,
  GraduationCap,
  Scale,
  Compass,
} from "lucide-react";
import { Syllabus, CoursePlanSectionData, UserProfile } from "../types/syllabus";
import { defaultCoursePlanData } from "../data/proeducadorData";
import { saveSyllabusToCloud } from "../utils/storage";

interface SyllabusEditorProps {
  syllabus: Syllabus;
  currentUser?: UserProfile | null;
  onChange: (updated: Syllabus) => void;
  onOpenRefineModal: (sectionName: string, content: string | any) => void;
}

type CoursePlanTab =
  | "introducao"
  | "perfil"
  | "requisitos"
  | "desenvolvimento"
  | "persona";

export const SyllabusEditor: React.FC<SyllabusEditorProps> = ({
  syllabus,
  currentUser,
  onChange,
  onOpenRefineModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CoursePlanTab>("introducao");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedSubfunction, setExpandedSubfunction] = useState<string | null>("1.1");
  const isAdmin = currentUser?.role === "admin";

  // Ensure coursePlanData is safely loaded
  const planData: CoursePlanSectionData =
    syllabus.coursePlanData || defaultCoursePlanData;

  const updateCoursePlan = (updater: (prev: CoursePlanSectionData) => CoursePlanSectionData) => {
    if (!isAdmin) return;
    const updatedPlan = updater(planData);
    const updatedSyllabus: Syllabus = {
      ...syllabus,
      coursePlanData: updatedPlan,
      updatedAt: new Date().toISOString(),
    };
    onChange(updatedSyllabus);
    saveSyllabusToCloud(updatedSyllabus);
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const inputStyle = isAdmin
    ? "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 rounded-xl"
    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-default rounded-xl";

  const subTabs = [
    {
      id: "introducao" as CoursePlanTab,
      title: "1. Introdução & Justificativa",
      icon: FileText,
      badge: "Estudo RAIS & CBO",
    },
    {
      id: "perfil" as CoursePlanTab,
      title: "2. Perfil Profissional",
      icon: Award,
      badge: "Funções & NRs",
    },
    {
      id: "requisitos" as CoursePlanTab,
      title: "3. Requisitos de Acesso",
      icon: UserCheck,
      badge: "Idade & Escolaridade",
    },
    {
      id: "desenvolvimento" as CoursePlanTab,
      title: "4. Desenv. & Recomendações",
      icon: Cpu,
      badge: "Módulos 800h & MSEP",
    },
    {
      id: "persona" as CoursePlanTab,
      title: "5. Persona do Aluno",
      icon: User,
      badge: "Perfil & Trilha",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner with Navigation & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Plano de Curso Oficial SENAI-SP
              </span>
              <span className="text-xs text-slate-400 font-bold">• 800 Horas</span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              Aprendizagem Industrial — Mecânico de Usinagem Convencional
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Imprimir ou Salvar PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              {saveSuccess ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
                  <Check className="w-4 h-4" /> Salvo na Nuvem
                </span>
              ) : (
                <button
                  onClick={() => {
                    saveSyllabusToCloud(syllabus);
                    triggerSaveFeedback();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5" /> Modo Somente Leitura
            </span>
          )}
        </div>
      </div>

      {/* Subtabs Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <span className="text-xs font-black leading-tight mt-1">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. INTRODUÇÃO & JUSTIFICATIVA */}
      {/* ========================================================================= */}
      {activeSubTab === "introducao" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    I. Justificativa, Demanda Industrial & Objetivos
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fundamentação legal e estudo socioeconômico da RAIS para a indústria paulista
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() =>
                    onOpenRefineModal(
                      "Introdução e Justificativa",
                      planData.introducao.justificativa
                    )
                  }
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refinar com IA</span>
                </button>
              )}
            </div>

            {/* Justificativa Geral */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Justificativa da Oferta do Curso
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={4}
                value={planData.introducao.justificativa}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    introducao: { ...prev.introducao, justificativa: val },
                  }));
                }}
                className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
              />
            </div>

            {/* Estudo de Demanda e Dados da RAIS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Estudo de Demanda Setorial (RAIS & CBO 7212-15)
                </label>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                  51,51% dos vínculos do Brasil em SP
                </span>
              </div>
              <textarea
                readOnly={!isAdmin}
                rows={8}
                value={planData.introducao.estudoDemanda}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    introducao: { ...prev.introducao, estudoDemanda: val },
                  }));
                }}
                className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
              />
            </div>

            {/* Objetivos do Curso */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Objetivos Gerais do Curso
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={3}
                value={planData.introducao.objetivos}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    introducao: { ...prev.introducao, objetivos: val },
                  }));
                }}
                className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
              />
            </div>

            {/* Legislação e Resoluções */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Amparo Legal & Resoluções do CNE/CP
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={3}
                value={planData.introducao.legislacao}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    introducao: { ...prev.introducao, legislacao: val },
                  }));
                }}
                className={`w-full p-4 border text-xs leading-relaxed font-mono ${inputStyle}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PERFIL PROFISSIONAL */}
      {/* ========================================================================= */}
      {activeSubTab === "perfil" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview Info Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    III. Perfil Profissional de Conclusão (CBO 7212-15)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Definição de competências, padrões de desempenho, equipamentos e normas de segurança
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Área / Segmento
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {planData.perfilProfissional.area} / {planData.perfilProfissional.segmento}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  CBO Oficial
                </span>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">
                  {planData.perfilProfissional.cbo}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Nível de Qualificação
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  Nível 2 (FIC / CAI)
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Carga Horária Total
                </span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  800 Horas (2 Termos)
                </p>
              </div>
            </div>

            {/* Competência Geral */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Competência Geral
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={3}
                value={planData.perfilProfissional.competenciaGeral}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    perfilProfissional: { ...prev.perfilProfissional, competenciaGeral: val },
                  }));
                }}
                className={`w-full p-4 border text-sm font-medium leading-relaxed ${inputStyle}`}
              />
            </div>
          </div>

          {/* Funções e Subfunções com Padrões de Desempenho */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Relação de Funções & Subfunções com Padrões de Desempenho
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {planData.perfilProfissional.funcoes.map((fn, fIdx) => (
                <div key={fIdx} className="space-y-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 tracking-wider">
                      {fn.titulo}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {fn.subfuncoes.map((sub) => {
                      const isExpanded = expandedSubfunction === sub.codigo;
                      return (
                        <div
                          key={sub.codigo}
                          className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedSubfunction(isExpanded ? null : sub.codigo)
                            }
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                                {sub.codigo}
                              </span>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {sub.nome}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-semibold">
                                {sub.padroesDesempenho.length} padrões de desempenho
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                Padrões de Desempenho Reconhecidos pelo Comitê Técnico Setorial:
                              </span>
                              <div className="space-y-2">
                                {sub.padroesDesempenho.map((padrao, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{padrao}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meios: Máquinas, Instrumentos, Ferramentas e Softwares */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Máquinas & Equipamentos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Wrench className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Máquinas e Equipamentos de Usinagem
                </h4>
              </div>
              <ul className="space-y-2">
                {planData.perfilProfissional.meios.maquinasEquipamentos.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrumentos de Medição */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Compass className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Instrumentos de Controle Dimensional
                </h4>
              </div>
              <ul className="space-y-2">
                {planData.perfilProfissional.meios.instrumentos.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ferramentas e Softwares */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Cpu className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Ferramentas de Corte & Softwares
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Ferramentas de Corte:
                  </span>
                  <ul className="space-y-1.5">
                    {planData.perfilProfissional.meios.ferramentas.map((f, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Softwares Industriais:
                  </span>
                  <ul className="space-y-1.5">
                    {planData.perfilProfissional.meios.softwares.map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Condições de Trabalho, Segurança & Riscos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Segurança do Trabalho (NRs) & Riscos
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Equipamentos de Proteção (NR-06, NR-09, NR-12):
                  </span>
                  <ul className="space-y-1.5">
                    {planData.perfilProfissional.condicoesTrabalho.equipamentosSeguranca.map((eq, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{eq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Riscos Profissionais:
                  </span>
                  <ul className="space-y-1.5">
                    {planData.perfilProfissional.condicoesTrabalho.riscos.map((r, idx) => (
                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Competências Socioemocionais */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Target className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Competências Socioemocionais (MSEP)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {planData.perfilProfissional.competenciasSocioemocionais.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 leading-relaxed"
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    • {comp.split(":")[0]}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {comp.split(":")[1] || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REQUISITOS DE ACESSO */}
      {/* ========================================================================= */}
      {activeSubTab === "requisitos" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    II. Requisitos de Acesso ao Curso
                  </h2>
                  <p className="text-xs text-slate-500">
                    Critérios de idade, escolaridade mínima, seleção e diretrizes do CONAP / PcD
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Escolaridade */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Escolaridade Mínima
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={4}
                  value={planData.requisitosAcesso.escolaridade}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      requisitosAcesso: { ...prev.requisitosAcesso, escolaridade: val },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>

              {/* Idade */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Faixa Etária (14 a 24 Anos)
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={4}
                  value={planData.requisitosAcesso.idade}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      requisitosAcesso: { ...prev.requisitosAcesso, idade: val },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>

              {/* Processo Seletivo */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Processo Seletivo e Admissão
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={4}
                  value={planData.requisitosAcesso.processoSeletivo}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      requisitosAcesso: { ...prev.requisitosAcesso, processoSeletivo: val },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>

              {/* Observações CONAP */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Diretrizes do CONAP (Menores de 18 Anos)
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={4}
                  value={planData.requisitosAcesso.observacoesConap}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      requisitosAcesso: { ...prev.requisitosAcesso, observacoesConap: val },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>
            </div>

            {/* Acessibilidade PcD */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Condições de Acessibilidade e Inclusão (Lei nº 13.146/2015)
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={3}
                value={planData.requisitosAcesso.condicoesAcessibilidade}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    requisitosAcesso: { ...prev.requisitosAcesso, condicoesAcessibilidade: val },
                  }));
                }}
                className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DESENVOLVIMENTO & RECOMENDAÇÕES TECNOLÓGICAS */}
      {/* ========================================================================= */}
      {activeSubTab === "desenvolvimento" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Organização Curricular Modular */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    IV. Organização Curricular & Itinerário Formativo (800h)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Estrutura em Módulos Básico, Introdutório e Específico com unidades transversais
                  </p>
                </div>
              </div>
            </div>

            {/* Modular Cards Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planData.desenvolvimentoMetodologico.itinerarioFormativo.map((mod, mIdx) => (
                <div
                  key={mIdx}
                  className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {mod.cargaHoraria}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {mod.modulo}
                    </h3>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                    {mod.unidades.map((u, uIdx) => (
                      <li
                        key={uIdx}
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-start justify-between gap-2"
                      >
                        <span className="font-medium">• {u.nome}</span>
                        <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 shrink-0">
                          {u.cargaHoraria}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Metodologia de Ensino SENAI (MSEP) */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Desenvolvimento Metodológico do Curso & Prática em Oficina
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={6}
                value={planData.desenvolvimentoMetodologico.metodologiaTexto}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    desenvolvimentoMetodologico: {
                      ...prev.desenvolvimentoMetodologico,
                      metodologiaTexto: val,
                    },
                  }));
                }}
                className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
              />
            </div>

            {/* PPE e Instalações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Prática Profissional na Empresa (PPE)
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={5}
                  value={planData.desenvolvimentoMetodologico.praticaProfissionalEmpresa}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      desenvolvimentoMetodologico: {
                        ...prev.desenvolvimentoMetodologico,
                        praticaProfissionalEmpresa: val,
                      },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Instalações, Oficinas e Equipamentos (SGSET)
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={5}
                  value={planData.desenvolvimentoMetodologico.instalacoesEquipamentos}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      desenvolvimentoMetodologico: {
                        ...prev.desenvolvimentoMetodologico,
                        instalacoesEquipamentos: val,
                      },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>
            </div>

            {/* Perfil dos Docentes & Critérios de Avaliação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Perfil de Qualificação dos Professores e Instrutores
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={4}
                  value={planData.desenvolvimentoMetodologico.perfilDocentes}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      desenvolvimentoMetodologico: {
                        ...prev.desenvolvimentoMetodologico,
                        perfilDocentes: val,
                      },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Critérios de Avaliação por Competências (Regimento Comum)
                </label>
                <textarea
                  readOnly={!isAdmin}
                  rows={4}
                  value={planData.desenvolvimentoMetodologico.criteriosAvaliacao}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoursePlan((prev) => ({
                      ...prev,
                      desenvolvimentoMetodologico: {
                        ...prev.desenvolvimentoMetodologico,
                        criteriosAvaliacao: val,
                      },
                    }));
                  }}
                  className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PERSONA DO ALUNO / APRENDIZ */}
      {/* ========================================================================= */}
      {activeSubTab === "persona" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Persona & Arquétipo do Aprendiz SENAI
                  </h2>
                  <p className="text-xs text-slate-500">
                    Caracterização pedagógica do perfil dos estudantes do curso de Mecânico de Usinagem
                  </p>
                </div>
              </div>
            </div>

            {/* Persona Hero Card */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                    GS
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-blue-400 block">
                      Arquétipo do Aluno
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {planData.persona.nome}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {planData.persona.idade} • {planData.persona.escolaridade}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-bold self-start sm:self-auto">
                  Metalmecânica & Manufatura
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                {planData.persona.perfil}
              </p>
            </div>

            {/* Motivations & Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motivações */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    Principais Motivações & Objetivos
                  </h4>
                </div>
                <ul className="space-y-2">
                  {planData.persona.motivacoes.map((m, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Desafios */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    Desafios Pedagógicos & Comportamentais
                  </h4>
                </div>
                <ul className="space-y-2">
                  {planData.persona.desafios.map((d, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rotina do Aluno */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Rotina Prática Diária em Oficina (5S e Disciplina Técnica)
              </label>
              <textarea
                readOnly={!isAdmin}
                rows={3}
                value={planData.persona.rotina}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCoursePlan((prev) => ({
                    ...prev,
                    persona: { ...prev.persona, rotina: val },
                  }));
                }}
                className={`w-full p-4 border text-sm leading-relaxed ${inputStyle}`}
              />
            </div>

            {/* Trilha de Futuro */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  Trilha Formativa & Itinerário de Carreira Futura
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {planData.persona.trilhaFutura.map((etapa, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-2.5"
                  >
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {etapa}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
