import React, { useState } from "react";
import { Sparkles, X, Loader2, Check } from "lucide-react";

interface RefineSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  currentContent: string | any;
  onApplyRefinement: (newContent: string) => void;
}

export const RefineSectionModal: React.FC<RefineSectionModalProps> = ({
  isOpen,
  onClose,
  sectionName,
  currentContent,
  onApplyRefinement,
}) => {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    "Tornar linguagem mais acadêmica e formal",
    "Focar em desenvolvimento prático e projetos",
    "Simplificar e deixar mais conciso",
    "Adicionar referências e metodologias ativas",
  ];

  const handleRefine = async (customInst?: string) => {
    const instToUse = customInst || instruction;
    if (!instToUse.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/refine-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName,
          currentContent,
          instruction: instToUse,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.result) {
        throw new Error(data.error || "Erro ao processar refinamento.");
      }

      setPreview(data.result);
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro na IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (preview) {
      onApplyRefinement(preview);
      onClose();
      setPreview(null);
      setInstruction("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Refinar com IA: {sectionName}
          </h3>
        </div>

        {/* Quick Instructions */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            Sugestões Rápidas
          </label>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInstruction(prompt);
                  handleRefine(prompt);
                }}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instruction Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Como você gostaria de ajustar esta seção?
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex: Adicione 2 objetivos específicos focados em ética profissional e segurança..."
            rows={3}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* AI Result Preview */}
        {preview && (
          <div className="mb-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
              Resultado Sugerido pela IA:
            </span>
            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {preview}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancelar
          </button>

          {!preview ? (
            <button
              onClick={() => handleRefine()}
              disabled={loading || !instruction.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gerar Ajuste</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Alteração</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
