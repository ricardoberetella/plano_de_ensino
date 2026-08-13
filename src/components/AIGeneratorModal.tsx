import React, { useState } from "react";
import { Sparkles, Loader2, CheckCircle, ArrowRight, Lightbulb, Calendar, BookOpen } from "lucide-react";
import { Syllabus } from "../types/syllabus";

interface AIGeneratorModalProps {
  onSyllabusGenerated: (newSyllabus: Syllabus) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ onSyllabusGenerated }) => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Graduação");
  const [workloadHours, setWorkloadHours] = useState(60);
  const [weeksCount, setWeeksCount] = useState(15);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [classDays, setClassDays] = useState<string[]>(["Terça-feira", "Quinta-feira"]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularTopics = [
    "Inteligência Artificial & Machine Learning",
    "Direito Digital e Proteção de Dados (LGPD)",
    "Cálculo Diferencial e Integral I",
    "Análise de Dados com Python & Pandas",
    "Anatomia Humana e Fisiologia",
    "Marketing Digital e Estratégia de Conteúdo",
    "Engenharia de Software e Arquitetura Limpa",
    "Psicologia Organizacional e Liderança",
  ];

  const daysOptions = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const toggleDay = (day: string) => {
    if (classDays.includes(day)) {
      if (classDays.length > 1) {
        setClassDays(classDays.filter((d) => d !== day));
      }
    } else {
      setClassDays([...classDays, day]);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setError("Por favor, informe o assunto ou nome da disciplina.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          level,
          workloadHours,
          weeksCount,
          startDate,
          classDays,
          additionalNotes,
        }),
      });

      const result = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Ocorreu um erro ao gerar com a IA.");
      }

      const generatedData = result.data;

      // Transform AI result into our app's Syllabus type with IDs
      const formattedSyllabus: Syllabus = {
        id: "ai-generated-" + Date.now(),
        courseTitle: generatedData.courseTitle || topic,
        courseCode: generatedData.courseCode || "DISC-" + Math.floor(100 + Math.random() * 900),
        workload: generatedData.workload || `${workloadHours}h`,
        period: generatedData.period || `${new Date().getFullYear()}.1`,
        department: generatedData.department || "Departamento Acadêmico",
        level: generatedData.level || level,
        professorName: "Nome do Docente",
        professorEmail: "docente@universidade.edu.br",
        summary: generatedData.summary || "",
        generalObjectives: generatedData.generalObjectives || "",
        specificObjectives: generatedData.specificObjectives || [],
        programmaticContent: (generatedData.programmaticContent || []).map((u: any, idx: number) => ({
          id: `unit-${idx + 1}-${Date.now()}`,
          unitTitle: u.unitTitle || `Unidade ${idx + 1}`,
          topics: u.topics || [],
        })),
        methodology: generatedData.methodology || "",
        evaluationCriteria: (generatedData.evaluationCriteria || []).map((ev: any, idx: number) => ({
          id: `eval-${idx + 1}-${Date.now()}`,
          name: ev.name || `Avaliação ${idx + 1}`,
          weight: ev.weight || "30%",
          description: ev.description || "",
        })),
        basicBibliography: generatedData.basicBibliography || [],
        complementaryBibliography: generatedData.complementaryBibliography || [],
        schedule: (generatedData.schedule || []).map((cls: any, idx: number) => ({
          id: `class-${idx + 1}-${Date.now()}`,
          classNumber: cls.classNumber || idx + 1,
          weekNumber: cls.weekNumber || Math.floor(idx / classDays.length) + 1,
          date: cls.date || startDate,
          topic: cls.topic || `Tópico da Aula ${idx + 1}`,
          unit: cls.unit || "",
          type: cls.type || "teorica",
          status: "planejada",
          activities: cls.activities || "",
          notes: cls.notes || "",
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSyllabusGenerated(formattedSyllabus);
    } catch (err: any) {
      setError(err?.message || "Falha ao conectar com o serviço de IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <Sparkles className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-3 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerador Inteligente com Gemini IA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Crie um Plano de Ensino e Cronograma Completo em Segundos
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
            Informe a disciplina e as preferências do seu curso. A inteligência artificial irá formular a ementa, objetivos, unidades didáticas, critérios de avaliação com pesos, bibliografia ABNT e o cronograma semana a semana com datas!
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Topic Input */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
            Nome ou Tema da Disciplina / Curso <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Inteligência Artificial Aplicada, Gestão de Riscos Financeiros, Programação Web..."
            className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
          />

          {/* Quick suggestions */}
          <div className="mt-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Sugestões Populares:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularTopics.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(item)}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Nível Acadêmico
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
            >
              <option value="Graduação">Graduação</option>
              <option value="Pós-Graduação / Especialização">Pós-Graduação / Especialização</option>
              <option value="Mestrado / Doutorado">Mestrado / Doutorado</option>
              <option value="Ensino Técnico / Profissionalizante">Ensino Técnico</option>
              <option value="Ensino Médio">Ensino Médio</option>
              <option value="Curso Livre / Extensão">Curso Livre / Extensão</option>
            </select>
          </div>

          {/* Workload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Carga Horária Total
            </label>
            <select
              value={workloadHours}
              onChange={(e) => setWorkloadHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
            >
              <option value={30}>30 horas</option>
              <option value={40}>40 horas</option>
              <option value={60}>60 horas (Padrão)</option>
              <option value={80}>80 horas</option>
              <option value={120}>120 horas</option>
            </select>
          </div>

          {/* Weeks Count */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Duração em Semanas
            </label>
            <select
              value={weeksCount}
              onChange={(e) => setWeeksCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
            >
              <option value={8}>8 Semanas (Intensivo)</option>
              <option value={12}>12 Semanas</option>
              <option value={15}>15 Semanas (Semestral Padrão)</option>
              <option value={18}>18 Semanas</option>
            </select>
          </div>
        </div>

        {/* Calendar Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Data do Início do Semestre
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Dias de Aula na Semana
            </label>
            <div className="flex flex-wrap gap-1.5">
              {daysOptions.map((day) => {
                const isSelected = classDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day.split("-")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            Foco Específico ou Requisitos do Professor (Opcional)
          </label>
          <input
            type="text"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Ex: Inclua 2 aulas de laboratório prático, foco em ética, prova P1 na semana 6..."
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl text-sm border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Gerando Plano e Cronograma com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Gerar Plano de Ensino Completo</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
