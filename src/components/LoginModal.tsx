import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { UserProfile } from "../types/syllabus";
import { SenaiLogo } from "./SenaiLogo";

interface LoginModalProps {
  currentUser?: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onClose,
  isOpen,
}) => {
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanPass = passwordInput.trim().toLowerCase();

    // 1. Senha de Visualizador (Somente Leitura - Não edita nada)
    if (cleanPass === "ianes662" || cleanPass === "ianes 662") {
      onLoginSuccess({
        id: "user-viewer",
        name: "Visualizador (Leitura)",
        email: "visualizador@sp.senai.br",
        role: "viewer",
        unit: "SENAI São Paulo",
      });
      setPasswordInput("");
      if (onClose) onClose();
      return;
    }

    // 2. Senha de Administrador (Edição Completa)
    if (cleanPass === "bere662" || cleanPass === "bere 662") {
      onLoginSuccess({
        id: "user-beretella",
        name: "Prof. Ricardo Beretella",
        email: "ricardo.beretella@sp.senai.br",
        role: "admin",
        unit: "Escola SENAI Roberto Mange - Campinas",
      });
      setPasswordInput("");
      if (onClose) onClose();
      return;
    }

    setErrorMessage("Senha de acesso incorreta.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-sm w-full overflow-hidden relative border border-slate-100">
        {/* Top Dark Red Curved Header Accent */}
        <div className="h-3.5 bg-[#C8102E] w-full rounded-t-[28px]" />

        {/* Modal Card Content */}
        <div className="px-8 pt-8 pb-10 text-center space-y-6">
          {/* Main Titles */}
          <div className="space-y-3 flex flex-col items-center">
            {/* Red Official SENAI Logo */}
            <SenaiLogo size="lg" showSubtitle={false} />

            {/* Course Title */}
            <h2 className="text-base font-black text-[#0A2540] leading-tight uppercase px-2 pt-1">
              MECÂNICO DE USINAGEM CONVENCIONAL
            </h2>

            {/* Subtitle */}
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase pt-1">
              PLANO DE ENSINO E CRONOGRAMA
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5 pt-1">
            <div className="text-left space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                SENHA DE ACESSO
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="• • • •"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-slate-200/80 rounded-2xl text-center text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white transition-all"
              />
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#C8102E] hover:bg-[#A60D25] text-white font-extrabold text-sm tracking-wider uppercase rounded-2xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              ENTRAR
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
