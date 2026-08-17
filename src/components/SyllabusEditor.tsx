import React, { useState } from "react";
import {
  BookOpen,
  User,
  Clock,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  ListChecks,
  Award,
  Layers,
  BookMarked,
  Save,
  Check,
  Lock,
} from "lucide-react";
import { Syllabus, ProgrammaticUnit, EvaluationItem, UserProfile } from "../types/syllabus";

interface SyllabusEditorProps {
  syllabus: Syllabus;
  currentUser?: UserProfile | null;
  onChange: (updated: Syllabus) => void;
  onOpenRefineModal: (sectionName: string, content: string | any) => void;
}

export const SyllabusEditor: React.FC<SyllabusEditorProps> = ({
  syllabus,
  currentUser,
  onChange,
  onOpenRefineModal,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isAdmin = currentUser?.role === "admin";

  const updateField = <K extends keyof Syllabus>(field: K, value: Syllabus[K]) => {
    if (!isAdmin) return;
    onChange({
      ...syllabus,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Specific Objectives Handlers
  const addSpecificObjective = () => {
    if (!isAdmin) return;
    updateField("specificObjectives", [...syllabus.specificObjectives, "Novo objetivo específico..."]);
  };

  const updateSpecificObjective = (index: number, value: string) => {
    if (!isAdmin) return;
    const list = [...syllabus.specificObjectives];
    list[index] = value;
    updateField("specificObjectives", list);
  };

  const removeSpecificObjective = (index: number) => {
    if (!isAdmin) return;
    updateField(
      "specificObjectives",
      syllabus.specificObjectives.filter((_, i) => i !== index)
    );
  };

  // Programmatic Content Handlers
  const addUnit = () => {
    if (!isAdmin) return;
    const newUnit: ProgrammaticUnit = {
      id: "unit-" + Date.now(),
      unitTitle: `Unidade ${syllabus.programmaticContent.length + 1}: Título da Unidade`,
      topics: ["Tópico 1"],
    };
    updateField("programmaticContent", [...syllabus.programmaticContent, newUnit]);
  };

  const updateUnitTitle = (unitIndex: number, title: string) => {
    if (!isAdmin) return;
    const content = [...syllabus.programmaticContent];
    content[unitIndex].unitTitle = title;
    updateField("programmaticContent", content);
  };

  const addTopicToUnit = (unitIndex: number) => {
    if (!isAdmin) return;
    const content = [...syllabus.programmaticContent];
    content[unitIndex].topics.push("Novo Tópico");
    updateField("programmaticContent", content);
  };

  const updateTopic = (unitIndex: number, topicIndex: number, value: string) => {
    if (!isAdmin) return;
    const content = [...syllabus.programmaticContent];
    content[unitIndex].topics[topicIndex] = value;
    updateField("programmaticContent", content);
  };

  const removeTopic = (unitIndex: number, topicIndex: number) => {
    if (!isAdmin) return;
    const content = [...syllabus.programmaticContent];
    content[unitIndex].topics.splice(topicIndex, 1);
    updateField("programmaticContent", content);
  };

  const removeUnit = (unitIndex: number) => {
    if (!isAdmin) return;
    updateField(
      "programmaticContent",
      syllabus.programmaticContent.filter((_, i) => i !== unitIndex)
    );
  };

  // Evaluation Criteria Handlers
  const addEvaluation = () => {
    if (!isAdmin) return;
    const newEval: EvaluationItem = {
      id: "eval-" + Date.now(),
      name: "Nova Avaliação",
      weight: "20%",
      description: "Descrição do instrumento de avaliação",
    };
    updateField("evaluationCriteria", [...syllabus.evaluationCriteria, newEval]);
  };

  const updateEvaluation = (index: number, field: keyof EvaluationItem, value: string) => {
    if (!isAdmin) return;
    const evals = [...syllabus.evaluationCriteria];
    evals[index] = { ...evals[index], [field]: value };
    updateField("evaluationCriteria", evals);
  };

  const removeEvaluation = (index: number) => {
    if (!isAdmin) return;
    updateField(
      "evaluationCriteria",
      syllabus.evaluationCriteria.filter((_, i) => i !== index)
    );
  };

  // Bibliography Handlers
  const addBibliography = (type: "basic" | "complementary") => {
    if (!isAdmin) return;
    if (type === "basic") {
      updateField("basicBibliography", [
        ...syllabus.basicBibliography,
        "AUTOR, Nome. Título do Livro. Cidade: Editora, Ano.",
      ]);
    } else {
      updateField("complementaryBibliography", [
        ...syllabus.complementaryBibliography,
        "AUTOR, Nome. Título da Referência Complementar. Cidade: Editora, Ano.",
      ]);
    }
  };

  const updateBibliographyItem = (type: "basic" | "complementary", index: number, value: string) => {
    if (!isAdmin) return;
    if (type === "basic") {
      const list = [...syllabus.basicBibliography];
      list[index] = value;
      updateField("basicBibliography", list);
    } else {
      const list = [...syllabus.complementaryBibliography];
      list[index] = value;
      updateField("complementaryBibliography", list);
    }
  };

  const removeBibliographyItem = (type: "basic" | "complementary", index: number) => {
    if (!isAdmin) return;
    if (type === "basic") {
      updateField(
        "basicBibliography",
        syllabus.basicBibliography.filter((_, i) => i !== index)
      );
    } else {
      updateField(
        "complementaryBibliography",
        syllabus.complementaryBibliography.filter((_, i) => i !== index)
      );
    }
  };

  const inputStyle = isAdmin
    ? "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-default";

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Save Notification / Status */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>
            {isAdmin ? "Editando Plano de Curso:" : "Visualizando Plano de Curso (Somente Leitura):"}{" "}
            <strong>{syllabus.courseTitle}</strong>
          </span>
        </div>

        {isAdmin ? (
          saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
              <Check className="w-3.5 h-3.5" /> Salvo no navegador
            </span>
          )
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" /> Modo Visualizador
          </span>
        )}
      </div>

      {/* SECTION 1: Informações Gerais & Cabeçalho */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Identificação da Disciplina & Docente
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nome da Disciplina
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.courseTitle}
              onChange={(e) => updateField("courseTitle", e.target.value)}
              className={`w-full px-3.5 py-2 border rounded-xl font-bold text-base ${inputStyle}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Código da Disciplina
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.courseCode}
              onChange={(e) => updateField("courseCode", e.target.value)}
              className={`w-full px-3.5 py-2 border rounded-xl font-semibold text-sm ${inputStyle}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Carga Horária Total
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.workload}
              onChange={(e) => updateField("workload", e.target.value)}
              placeholder="Ex: 60h (40h T / 20h P)"
              className={`w-full px-3.5 py-2 border rounded-xl text-sm ${inputStyle}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Período Letivo / Semestre
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.period}
              onChange={(e) => updateField("period", e.target.value)}
              placeholder="Ex: 2026.1"
              className={`w-full px-3.5 py-2 border rounded-xl text-sm ${inputStyle}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nível / Curso
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.level}
              onChange={(e) => updateField("level", e.target.value)}
              placeholder="Ex: Graduação, Pós"
              className={`w-full px-3.5 py-2 border rounded-xl text-sm ${inputStyle}`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Departamento / Centro Acadêmico
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.department}
              onChange={(e) => updateField("department", e.target.value)}
              className={`w-full px-3.5 py-2 border rounded-xl text-sm ${inputStyle}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Professor(a) Responsável
            </label>
            <input
              type="text"
              readOnly={!isAdmin}
              value={syllabus.professorName}
              onChange={(e) => updateField("professorName", e.target.value)}
              placeholder="Nome do docente"
              className={`w-full px-3.5 py-2 border rounded-xl text-sm ${inputStyle}`}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Ementa */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. Ementa da Disciplina</h3>
          </div>

          {isAdmin && (
            <button
              onClick={() => onOpenRefineModal("Ementa", syllabus.summary)}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Refinar com IA</span>
            </button>
          )}
        </div>

        <textarea
          readOnly={!isAdmin}
          value={syllabus.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          rows={4}
          placeholder="Apresente os conceitos fundamentais, teorias e abrangência da disciplina..."
          className={`w-full px-4 py-3 border rounded-xl text-sm leading-relaxed ${inputStyle}`}
        />
      </section>

      {/* SECTION 3: Objetivos */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <ListChecks className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. Objetivos de Aprendizagem</h3>
          </div>

          {isAdmin && (
            <button
              onClick={() =>
                onOpenRefineModal("Objetivos de Aprendizagem", {
                  general: syllabus.generalObjectives,
                  specific: syllabus.specificObjectives,
                })
              }
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Refinar com IA</span>
            </button>
          )}
        </div>

        {/* General Objective */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Objetivo Geral
          </label>
          <textarea
            readOnly={!isAdmin}
            value={syllabus.generalObjectives}
            onChange={(e) => updateField("generalObjectives", e.target.value)}
            rows={2}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm ${inputStyle}`}
          />
        </div>

        {/* Specific Objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Objetivos Específicos ({syllabus.specificObjectives.length})
            </label>
            {isAdmin && (
              <button
                onClick={addSpecificObjective}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Objetivo
              </button>
            )}
          </div>

          <div className="space-y-2">
            {syllabus.specificObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}.</span>
                <input
                  type="text"
                  readOnly={!isAdmin}
                  value={obj}
                  onChange={(e) => updateSpecificObjective(idx, e.target.value)}
                  className={`flex-1 px-3.5 py-2 border rounded-xl text-sm ${inputStyle}`}
                />
                {isAdmin && (
                  <button
                    onClick={() => removeSpecificObjective(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Conteúdo Programático */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Conteúdo Programático ({syllabus.programmaticContent.length} Unidades)
            </h3>
          </div>

          {isAdmin && (
            <button
              onClick={addUnit}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nova Unidade
            </button>
          )}
        </div>

        <div className="space-y-6">
          {syllabus.programmaticContent.map((unit, unitIdx) => (
            <div
              key={unit.id || unitIdx}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  readOnly={!isAdmin}
                  value={unit.unitTitle}
                  onChange={(e) => updateUnitTitle(unitIdx, e.target.value)}
                  className={`w-full px-3 py-1.5 border rounded-xl font-bold text-sm ${inputStyle}`}
                />
                {isAdmin && (
                  <button
                    onClick={() => removeUnit(unitIdx)}
                    title="Excluir Unidade"
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Topics */}
              <div className="pl-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tópicos / Assuntos
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => addTopicToUnit(unitIdx)}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tópico
                    </button>
                  )}
                </div>

                {unit.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">•</span>
                    <input
                      type="text"
                      readOnly={!isAdmin}
                      value={topic}
                      onChange={(e) => updateTopic(unitIdx, topicIdx, e.target.value)}
                      className={`flex-1 px-3 py-1.5 border rounded-lg text-xs ${inputStyle}`}
                    />
                    {isAdmin && (
                      <button
                        onClick={() => removeTopic(unitIdx, topicIdx)}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Metodologia e Critérios de Avaliação */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Metodologia & Critérios de Avaliação
            </h3>
          </div>
        </div>

        {/* Methodology */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Metodologia de Ensino
          </label>
          <textarea
            readOnly={!isAdmin}
            value={syllabus.methodology}
            onChange={(e) => updateField("methodology", e.target.value)}
            rows={3}
            placeholder="Descreva as técnicas, ferramentas e recursos didáticos utilizados..."
            className={`w-full px-4 py-3 border rounded-xl text-sm ${inputStyle}`}
          />
        </div>

        {/* Evaluation Criteria Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Sistema e Pesos de Avaliação
            </label>
            {isAdmin && (
              <button
                onClick={addEvaluation}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Avaliação
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 rounded-l-xl">Avaliação / Prova</th>
                  <th className="p-2.5 w-24">Peso / Valor</th>
                  <th className="p-2.5">Descrição / Instrumento</th>
                  {isAdmin && <th className="p-2.5 w-10 rounded-r-xl"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {syllabus.evaluationCriteria.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2">
                      <input
                        type="text"
                        readOnly={!isAdmin}
                        value={item.name}
                        onChange={(e) => updateEvaluation(idx, "name", e.target.value)}
                        className={`w-full px-2.5 py-1.5 border rounded-lg font-semibold ${inputStyle}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        readOnly={!isAdmin}
                        value={item.weight}
                        onChange={(e) => updateEvaluation(idx, "weight", e.target.value)}
                        placeholder="ex: 30%"
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-center font-bold text-indigo-600 dark:text-indigo-400 ${inputStyle}`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        readOnly={!isAdmin}
                        value={item.description || ""}
                        onChange={(e) => updateEvaluation(idx, "description", e.target.value)}
                        className={`w-full px-2.5 py-1.5 border rounded-lg ${inputStyle}`}
                      />
                    </td>
                    {isAdmin && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeEvaluation(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 6: Bibliografia */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-xl">
              <BookMarked className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">6. Referências Bibliográficas (ABNT)</h3>
          </div>
        </div>

        {/* Basic Bibliography */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Bibliografia Básica ({syllabus.basicBibliography.length})
            </label>
            {isAdmin && (
              <button
                onClick={() => addBibliography("basic")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Livro
              </button>
            )}
          </div>

          <div className="space-y-2">
            {syllabus.basicBibliography.map((book, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly={!isAdmin}
                  value={book}
                  onChange={(e) => updateBibliographyItem("basic", idx, e.target.value)}
                  className={`flex-1 px-3.5 py-2 border rounded-xl text-xs ${inputStyle}`}
                />
                {isAdmin && (
                  <button
                    onClick={() => removeBibliographyItem("basic", idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Complementary Bibliography */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Bibliografia Complementar ({syllabus.complementaryBibliography.length})
            </label>
            {isAdmin && (
              <button
                onClick={() => addBibliography("complementary")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Referência
              </button>
            )}
          </div>

          <div className="space-y-2">
            {syllabus.complementaryBibliography.map((book, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly={!isAdmin}
                  value={book}
                  onChange={(e) => updateBibliographyItem("complementary", idx, e.target.value)}
                  className={`flex-1 px-3.5 py-2 border rounded-xl text-xs ${inputStyle}`}
                />
                {isAdmin && (
                  <button
                    onClick={() => removeBibliographyItem("complementary", idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
