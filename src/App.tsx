import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { Syllabus, ActiveTab, UserProfile } from "./types/syllabus";
import { initialSyllabi } from "./data/mockSyllabi";
import {
  loadSyllabiFromStorage,
  saveSyllabiToStorage,
  getActiveSyllabusId,
  setActiveSyllabusId,
  createEmptySyllabus,
  saveSyllabusToCloud,
  saveAllSyllabiToCloud,
  deleteSyllabusFromCloud,
  subscribeToCloudSyllabi,
  sanitizeSyllabi,
} from "./utils/storage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { SyllabusEditor } from "./components/SyllabusEditor";
import { UnidadesCurricularesView } from "./components/UnidadesCurricularesView";
import { ScheduleView } from "./components/ScheduleView";
import { AIGeneratorModal } from "./components/AIGeneratorModal";
import { StudentView } from "./components/StudentView";
import { RefineSectionModal } from "./components/RefineSectionModal";
import { LoginModal } from "./components/LoginModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { triggerPrintSyllabus } from "./utils/exportUtils";

interface ToastNotification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [syllabi, setSyllabi] = useState<Syllabus[]>(() => loadSyllabiFromStorage());
  const [activeId, setActiveId] = useState<string>(() => {
    const defaultFirst = syllabi[0]?.id || "senai-usinagem-800h-beretella";
    return getActiveSyllabusId(defaultFirst);
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authentication State: null by default (requires password on initial app load)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem("senai_authenticated_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    try {
      const saved = sessionStorage.getItem("senai_authenticated_user");
      return !saved;
    } catch {
      return true;
    }
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setToast({ id, message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Switch professor user and automatically focus their respective syllabus
  const handleChangeUser = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    try {
      sessionStorage.setItem("senai_authenticated_user", JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }
    const isGea = newUser.name.toLowerCase().includes("gea");
    const isBeretella = newUser.name.toLowerCase().includes("beretella");

    if (isGea) {
      const geaSyllabus = syllabi.find(
        (s) =>
          s.id === "senai-usinagem-800h-gea" ||
          (s.professorName && s.professorName.toLowerCase().includes("gea"))
      );
      if (geaSyllabus) {
        setActiveId(geaSyllabus.id);
      }
    } else if (isBeretella) {
      const beretellaSyllabus = syllabi.find(
        (s) =>
          s.id === "senai-usinagem-800h-beretella" ||
          (s.professorName && s.professorName.toLowerCase().includes("beretella"))
      );
      if (beretellaSyllabus) {
        setActiveId(beretellaSyllabus.id);
      }
    }
  };

  // Refine Modal State
  const [refineModal, setRefineModal] = useState<{
    isOpen: boolean;
    sectionName: string;
    content: any;
  }>({
    isOpen: false,
    sectionName: "",
    content: "",
  });

  // Subscribe to real-time Cloud Firestore updates across all devices
  useEffect(() => {
    const unsubscribe = subscribeToCloudSyllabi((cloudSyllabi) => {
      if (cloudSyllabi && cloudSyllabi.length > 0) {
        setSyllabi(cloudSyllabi);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save changes to local storage whenever syllabi changes
  useEffect(() => {
    if (syllabi.length > 0) {
      saveSyllabiToStorage(syllabi);
    }
  }, [syllabi]);

  // Keep active syllabus ID persisted
  useEffect(() => {
    if (activeId) {
      setActiveSyllabusId(activeId);
    }
  }, [activeId]);

  // Ensure active syllabus exists
  const activeSyllabus =
    syllabi.find((s) => s.id === activeId) || syllabi[0] || createEmptySyllabus();

  const handleUpdateActiveSyllabus = async (updated: Syllabus) => {
    const withTimestamp = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setSyllabi((prev) => prev.map((s) => (s.id === withTimestamp.id ? withTimestamp : s)));
    // Save to Firebase Cloud Firestore immediately for this specific professor/syllabus
    const success = await saveSyllabusToCloud(withTimestamp);
    if (success) {
      const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      showToast(`Alterações salvas no Firebase Firestore com sucesso! (${timeStr})`, "success");
    }
  };

  const handleManualSyncCloud = async () => {
    setIsSyncing(true);
    saveSyllabiToStorage(syllabi);
    const ok = await saveAllSyllabiToCloud(syllabi);
    setIsSyncing(false);
    if (ok) {
      const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      showToast(`Todos os Planos de Curso foram salvos na Nuvem Firebase! (${timeStr})`, "success");
    } else {
      showToast("Aviso: Houve uma instabilidade na conexão com a nuvem, mas seus dados estão protegidos localmente.", "info");
    }
  };

  // Export full backup to a JSON file download
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(syllabi, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `senai-plano-ensino-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Backup baixado com sucesso no seu computador!", "success");
    } catch (err) {
      console.error("Erro ao exportar backup", err);
      showToast("Erro ao gerar arquivo de backup.", "error");
    }
  };

  // Import backup from JSON file
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeSyllabi(parsed);
          setSyllabi(sanitized);
          saveSyllabiToStorage(sanitized);
          await saveAllSyllabiToCloud(sanitized);
          showToast("Backup restaurado e sincronizado com o Firebase com sucesso!", "success");
        } else {
          showToast("Arquivo de backup inválido.", "error");
        }
      } catch (err) {
        console.error("Erro ao importar backup", err);
        showToast("Erro ao ler arquivo de backup JSON.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleSelectSyllabus = (id: string) => {
    setActiveId(id);
    const selected = syllabi.find((s) => s.id === id);
    if (selected) {
      if (
        selected.professorName.toLowerCase().includes("gea") &&
        !currentUser?.name.toLowerCase().includes("gea")
      ) {
        setCurrentUser({
          id: "user-gea",
          name: "Prof. Ricardo Gea",
          email: "ricardo.gea@sp.senai.br",
          role: currentUser?.role || "admin",
          unit: "Departamento Regional SENAI - SP",
        });
      } else if (
        selected.professorName.toLowerCase().includes("beretella") &&
        !currentUser?.name.toLowerCase().includes("beretella")
      ) {
        setCurrentUser({
          id: "user-beretella",
          name: "Prof. Ricardo Beretella",
          email: "ricardo.beretella@sp.senai.br",
          role: currentUser?.role || "admin",
          unit: "Escola SENAI Roberto Mange - Campinas",
        });
      }
    }
  };

  const handleCreateNew = () => {
    if (currentUser?.role !== "admin") {
      setIsLoginModalOpen(true);
      return;
    }
    const newSyllabus = createEmptySyllabus();
    newSyllabus.professorName = currentUser.name;
    newSyllabus.professorEmail = currentUser.email;
    setSyllabi((prev) => [newSyllabus, ...prev]);
    setActiveId(newSyllabus.id);
    setActiveTab("unidades");
    saveSyllabusToCloud(newSyllabus);
    showToast("Novo Plano de Curso criado e salvo!", "success");
  };

  const handleDeleteSyllabus = (id: string) => {
    if (currentUser?.role !== "admin") {
      setIsLoginModalOpen(true);
      return;
    }
    if (syllabi.length <= 1) return;
    const target = syllabi.find((s) => s.id === id);
    if (confirm(`Excluir o Plano de Curso "${target?.courseTitle || id}"?`)) {
      const remaining = syllabi.filter((s) => s.id !== id);
      setSyllabi(remaining);
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      deleteSyllabusFromCloud(id);
      showToast("Plano de Curso excluído.", "info");
    }
  };

  const handleSyllabusGeneratedWithAI = (newSyllabus: Syllabus) => {
    if (currentUser) {
      newSyllabus.professorName = currentUser.name;
      newSyllabus.professorEmail = currentUser.email;
    }
    setSyllabi((prev) => [newSyllabus, ...prev]);
    setActiveId(newSyllabus.id);
    setActiveTab("unidades");
    saveSyllabusToCloud(newSyllabus);
    showToast("Plano de Curso gerado por IA salvo na nuvem!", "success");
  };

  const handleOpenRefineModal = (sectionName: string, content: any) => {
    if (currentUser?.role !== "admin") {
      setIsLoginModalOpen(true);
      return;
    }
    setRefineModal({
      isOpen: true,
      sectionName,
      content,
    });
  };

  const handleApplyRefinement = (newContentText: string) => {
    if (refineModal.sectionName === "Ementa") {
      handleUpdateActiveSyllabus({
        ...activeSyllabus,
        summary: newContentText,
        updatedAt: new Date().toISOString(),
      });
    } else if (refineModal.sectionName === "Objetivos de Aprendizagem") {
      handleUpdateActiveSyllabus({
        ...activeSyllabus,
        generalObjectives: newContentText,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          currentUser={null}
          onLoginSuccess={(user) => {
            handleChangeUser(user);
            setIsLoginModalOpen(false);
          }}
          onClose={undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-900/95 text-emerald-100 border-emerald-700 shadow-emerald-950/40"
              : toast.type === "error"
              ? "bg-red-900/95 text-red-100 border-red-700 shadow-red-950/40"
              : "bg-blue-900/95 text-blue-100 border-blue-700 shadow-blue-950/40"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {toast.type === "info" && <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />}
          <span className="text-xs font-bold leading-snug">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onChangeUser={handleChangeUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Workspace */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Header
          syllabi={syllabi}
          activeSyllabus={activeSyllabus}
          activeTab={activeTab}
          currentUser={currentUser}
          onSelectSyllabus={handleSelectSyllabus}
          onChangeUser={handleChangeUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Main Content View Switcher */}
        <main className="flex-1 pb-16">
          {activeTab === "menu" && (
            <DashboardView
              syllabi={syllabi}
              activeSyllabus={activeSyllabus}
              currentUser={currentUser}
              onSelectSyllabus={handleSelectSyllabus}
              onGoToTab={(tab) => setActiveTab(tab)}
              onCreateNew={handleCreateNew}
              onDeleteSyllabus={handleDeleteSyllabus}
              onSyncCloud={handleManualSyncCloud}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === "unidades" && (
            <ErrorBoundary fallbackTitle="Erro na Visualização de Unidades Curriculares">
              <UnidadesCurricularesView
                syllabus={activeSyllabus}
                currentUser={currentUser}
                onUpdateSyllabus={handleUpdateActiveSyllabus}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onPrint={triggerPrintSyllabus}
              />
            </ErrorBoundary>
          )}

          {activeTab === "plano" && (
            <SyllabusEditor
              syllabus={activeSyllabus}
              currentUser={currentUser}
              onChange={handleUpdateActiveSyllabus}
              onOpenRefineModal={handleOpenRefineModal}
            />
          )}

          {activeTab === "cronograma" && (
            <ScheduleView
              syllabus={activeSyllabus}
              currentUser={currentUser}
              onChangeSchedule={(newSchedule) =>
                handleUpdateActiveSyllabus({
                  ...activeSyllabus,
                  schedule: newSchedule,
                  updatedAt: new Date().toISOString(),
                })
              }
              onOpenAIGenerator={() => setActiveTab("gerar_ia")}
            />
          )}

          {activeTab === "gerar_ia" && (
            <AIGeneratorModal onSyllabusGenerated={handleSyllabusGeneratedWithAI} />
          )}

          {activeTab === "visao_aluno" && (
            <StudentView syllabus={activeSyllabus} onPrint={triggerPrintSyllabus} />
          )}
        </main>

        {/* Footer SENAI Standard */}
        <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500">
          <p className="font-medium">
            Plano de Ensino & Cronograma de Aulas •{" "}
            <strong>SENAI Serviço Nacional de Aprendizagem Industrial</strong> • MSEP Gestão Pedagógica
          </p>
        </footer>
      </div>

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          handleChangeUser(user);
          setIsLoginModalOpen(false);
        }}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Refine Section Modal */}
      <RefineSectionModal
        isOpen={refineModal.isOpen}
        sectionName={refineModal.sectionName}
        currentContent={refineModal.content}
        onApplyRefinement={handleApplyRefinement}
        onClose={() => setRefineModal({ ...refineModal, isOpen: false })}
      />
    </div>
  );
}
