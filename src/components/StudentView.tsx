import React, { useState } from "react";
import { Printer, CheckSquare, Square, Download, BookOpen, Clock, Calendar } from "lucide-react";
import { Syllabus } from "../types/syllabus";
import { formatDateBR, getClassTypeBadgeColor } from "../utils/dateUtils";

interface StudentViewProps {
  syllabus: Syllabus;
  onPrint: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ syllabus, onPrint }) => {
  const [completedStudentChecklist, setCompletedStudentChecklist] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCompletedStudentChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Student View Banner Control */}
      <div className="no-print bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Modo de Visualização do Estudante
          </h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            Esta é a visualização oficial formatada para alunos. Você também pode usá-la como checklist de estudo.
          </p>
        </div>

        <button
          onClick={onPrint}
          className="px-4 py-2 bg-[#e30613] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir (PDF)</span>
        </button>
      </div>

      {/* Official Academic Paper Layout */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
            PLANO DE ENSINO E CRONOGRAMA ACADÊMICO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {syllabus.courseTitle}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
            <span><strong>Código:</strong> {syllabus.courseCode}</span>
            <span>•</span>
            <span><strong>Carga Horária:</strong> {syllabus.workload}</span>
            <span>•</span>
            <span><strong>Semestre:</strong> {syllabus.period}</span>
            <span>•</span>
            <span><strong>Nível:</strong> {syllabus.level}</span>
          </div>
        </div>

        {/* Professor & Department Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
          <div>
            <span className="font-bold text-slate-500 uppercase block mb-0.5">Docente Responsável</span>
            <p className="font-semibold text-slate-900 dark:text-white">{syllabus.professorName || "Não informado"}</p>
            {syllabus.professorEmail && <p className="text-slate-500">{syllabus.professorEmail}</p>}
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase block mb-0.5">Departamento / Unidade</span>
            <p className="font-semibold text-slate-900 dark:text-white">{syllabus.department}</p>
          </div>
        </div>

        {/* 1. Ementa */}
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
            1. Ementa
          </h2>
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
            {syllabus.summary}
          </p>
        </div>

        {/* 2. Objetivos */}
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
            2. Objetivos
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-xs font-bold uppercase text-slate-500 block mb-1">Objetivo Geral</strong>
              <p className="text-slate-800 dark:text-slate-200">{syllabus.generalObjectives}</p>
            </div>

            {syllabus.specificObjectives.length > 0 && (
              <div>
                <strong className="text-xs font-bold uppercase text-slate-500 block mb-1">Objetivos Específicos</strong>
                <ul className="list-disc pl-5 space-y-1 text-slate-800 dark:text-slate-200">
                  {syllabus.specificObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 3. Conteúdo Programático */}
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">
            3. Conteúdo Programático
          </h2>
          <div className="space-y-4">
            {syllabus.programmaticContent.map((unit, idx) => (
              <div key={idx} className="border-l-2 border-indigo-500 pl-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {unit.unitTitle}
                </h3>
                <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                  {unit.topics.map((t, ti) => (
                    <li key={ti}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Metodologia e Avaliação */}
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">
            4. Avaliação do Aprendizado
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">
            {syllabus.methodology}
          </p>

          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase">
              <tr>
                <th className="p-2.5">Avaliação</th>
                <th className="p-2.5 text-center">Peso</th>
                <th className="p-2.5">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {syllabus.evaluationCriteria.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                  <td className="p-2.5 font-extrabold text-indigo-600 dark:text-indigo-400 text-center">{item.weight}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Bibliografia */}
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">
            5. Bibliografia
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <strong className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Básica:</strong>
              <ul className="space-y-1 list-disc pl-5 text-slate-700 dark:text-slate-300">
                {syllabus.basicBibliography.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Complementar:</strong>
              <ul className="space-y-1 list-disc pl-5 text-slate-700 dark:text-slate-300">
                {syllabus.complementaryBibliography.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 6. Cronograma de Aulas */}
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">
            6. Cronograma de Aulas e Atividades
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase">
                <tr>
                  <th className="p-2.5 w-8 text-center no-print">Estudo</th>
                  <th className="p-2.5 w-12 text-center">Aula</th>
                  <th className="p-2.5 w-28">Data</th>
                  <th className="p-2.5">Tópico Abordado</th>
                  <th className="p-2.5 w-24">Tipo</th>
                  <th className="p-2.5">Atividades / Leituras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {syllabus.schedule.map((item) => {
                  const isChecked = !!completedStudentChecklist[item.id];
                  const badge = getClassTypeBadgeColor(item.type);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        isChecked ? "bg-emerald-50/40 dark:bg-emerald-950/20 line-through opacity-70" : ""
                      }`}
                    >
                      <td className="p-2.5 text-center no-print cursor-pointer" onClick={() => toggleCheck(item.id)}>
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">{item.classNumber}</td>
                      <td className="p-2.5 font-medium whitespace-nowrap">{formatDateBR(item.date)}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.topic}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.activities || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
