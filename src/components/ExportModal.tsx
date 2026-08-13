import React, { useState } from "react";
import {
  Download,
  Calendar,
  FileText,
  FileJson,
  Upload,
  Printer,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { Syllabus } from "../types/syllabus";
import {
  generateSyllabusMarkdown,
  generateICalendarFile,
  downloadTextFile,
  triggerPrintSyllabus,
} from "../utils/exportUtils";

interface ExportModalProps {
  syllabus: Syllabus;
  onImportSyllabus: (imported: Syllabus) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  syllabus,
  onImportSyllabus,
  onResetDefaults,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleDownloadMarkdown = () => {
    const md = generateSyllabusMarkdown(syllabus);
    const fileName = `Plano_de_Ensino_${syllabus.courseCode || "Disciplina"}.md`;
    downloadTextFile(fileName, md, "text/markdown");
  };

  const handleDownloadICal = () => {
    const ics = generateICalendarFile(syllabus);
    const fileName = `Cronograma_${syllabus.courseCode || "Disciplina"}.ics`;
    downloadTextFile(fileName, ics, "text/calendar");
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(syllabus, null, 2);
    const fileName = `Backup_${syllabus.courseCode || "Disciplina"}.json`;
    downloadTextFile(fileName, jsonStr, "application/json");
  };

  const handleCopyMarkdown = () => {
    const md = generateSyllabusMarkdown(syllabus);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.courseTitle && Array.isArray(parsed.schedule)) {
          onImportSyllabus(parsed);
          onClose();
        } else {
          alert("Arquivo JSON inválido. Certifique-se de ser um backup válido de Plano de Ensino.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl max-w-xl w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Exportar & Gerenciar Arquivos
            </h3>
            <p className="text-xs text-slate-500">
              {syllabus.courseTitle} ({syllabus.courseCode})
            </p>
          </div>
        </div>

        {/* Export Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          
          {/* iCal Download */}
          <button
            onClick={handleDownloadICal}
            className="p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">Calendário (.ics)</span>
            </div>
            <p className="text-xs text-slate-500">
              Sincronize as aulas no Google Agenda, Apple Calendar ou Outlook.
            </p>
          </button>

          {/* PDF / Print */}
          <button
            onClick={() => {
              onClose();
              triggerPrintSyllabus();
            }}
            className="p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <Printer className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">PDF / Impressão</span>
            </div>
            <p className="text-xs text-slate-500">
              Gere a versão impressa ou em PDF formatada oficialmente.
            </p>
          </button>

          {/* Markdown Download */}
          <button
            onClick={handleDownloadMarkdown}
            className="p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">Markdown (.md)</span>
            </div>
            <p className="text-xs text-slate-500">
              Baixe para colar no Notion, Obsidian ou portais acadêmicos.
            </p>
          </button>

          {/* Backup JSON Download */}
          <button
            onClick={handleDownloadJSON}
            className="p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileJson className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">Backup JSON (.json)</span>
            </div>
            <p className="text-xs text-slate-500">
              Guarde os dados brutos para restaurar ou transferir futuramente.
            </p>
          </button>

        </div>

        {/* Copy Markdown / Import / Restore */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4" />}
              <span>{copied ? "Copiado!" : "Copiar Texto em Markdown"}</span>
            </button>

            {/* Import File Button */}
            <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Importar Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                if (confirm("Deseja restaurar as disciplinas de exemplo padrão?")) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mx-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Disciplinas de Exemplo Padrão</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
