import React, { useState, useEffect } from "react";
import { Syllabus, ActiveTab, UserProfile } from "./types/syllabus";
import { initialSyllabi } from "./data/mockSyllabi";
import {
  loadSyllabiFromStorage,
  saveSyllabiToStorage,
  getActiveSyllabusId,
  setActiveSyllabusId,
  createEmptySyllabus,
  saveSyllabusToCloud,
  deleteSyllabusFromCloud,
  subscribeToCloudSyllabi,
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

export default function App() {
  const [syllabi, setSyllabi] = useState<Syllabus[]>(() => loadSyllabiFromStorage());
  const [activeId, setActiveId] = useState<string>(() => {
    const defaultFirst = syllabi[0]?.id || "senai-usinagem-800h-beretella";
    return getActiveSyllabusId(defaultFirst);
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // User Authentication Profile State (Prof. Ricardo Beretella vs Prof. Ricardo Gea)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "user-beretella",
    name: "Prof. Ricardo Beretella",
    email: "ricardo.beretella@sp.senai.br",
    role: "admin",
    unit: "Escola SENAI Roberto Mange - Campinas",
  });

  // Switch professor user and automatically focus their respective syllabus
  const handleChangeUser = (newUser: UserProfile) => {
    setCurrentUser(newUser);
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

  const handleUpdateActiveSyllabus = (updated: Syllabus) => {
    const withTimestamp = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setSyllabi((prev) => prev.map((s) => (s.id === withTimestamp.id ? withTimestamp : s)));
    // Save to Firebase Cloud Firestore immediately for this specific professor/syllabus
    saveSyllabusToCloud(withTimestamp);
  };

  const handleSelectSyllabus = (id: string) => {
    setActiveId(id);
    const selected = syllabi.find((s) => s.id === id);
    if (selected) {
      if (
        selected.professorName.toLowerCase().includes("gea") &&
        !currentUser.name.toLowerCase().includes("gea")
      ) {
        setCurrentUser({
          id: "user-gea",
          name: "Prof. Ricardo Gea",
          email: "ricardo.gea@sp.senai.br",
          role: currentUser.role || "admin",
          unit: "Departamento Regional SENAI - SP",
        });
      } else if (
        selected.professorName.toLowerCase().includes("beretella") &&
        !currentUser.name.toLowerCase().includes("beretella")
      ) {
        setCurrentUser({
          id: "user-beretella",
          name: "Prof. Ricardo Beretella",
          email: "ricardo.beretella@sp.senai.br",
          role: currentUser.role || "admin",
          unit: "Escola SENAI Roberto Mange - Campinas",
        });
      }
    }
  };

  const handleCreateNew = () => {
    if (currentUser.role !== "admin") {
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
  };

  const handleDeleteSyllabus = (id: string) => {
    if (currentUser.role !== "admin") {
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
    }
  };

  const handleSyllabusGeneratedWithAI = (newSyllabus: Syllabus) => {
    newSyllabus.professorName = currentUser.name;
    newSyllabus.professorEmail = currentUser.email;
    setSyllabi((prev) => [newSyllabus, ...prev]);
    setActiveId(newSyllabus.id);
    setActiveTab("unidades");
    saveSyllabusToCloud(newSyllabus);
  };

  const handleOpenRefineModal = (sectionName: string, content: any) => {
    if (currentUser.role !== "admin") {
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
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
              onSyncCloud={() => {
                saveSyllabiToStorage(syllabi);
                alert("Dados sincronizados com o banco em nuvem (Firebase Cloud)!");
              }}
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
