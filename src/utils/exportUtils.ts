import {
  Syllabus,
  ProgrammaticUnit,
  UnitStage,
  SituationProblem,
  RubricItem,
  LessonPlanItem,
} from "../types/syllabus";
import { formatDateBR } from "./dateUtils";

export function generateSyllabusMarkdown(syllabus: Syllabus): string {
  let md = `# ${syllabus.courseTitle} (${syllabus.courseCode})\n\n`;
  md += `**Professor(a):** ${syllabus.professorName || "Não informado"} ${syllabus.professorEmail ? `(${syllabus.professorEmail})` : ""}\n`;
  md += `**Carga Horária:** ${syllabus.workload} | **Período:** ${syllabus.period}\n`;
  md += `**Departamento:** ${syllabus.department} | **Nível:** ${syllabus.level}\n\n`;
  
  md += `--- \n\n`;
  
  md += `## 1. Ementa\n\n${syllabus.summary}\n\n`;
  
  md += `## 2. Objetivos\n\n`;
  md += `### Objetivo Geral\n${syllabus.generalObjectives}\n\n`;
  md += `### Objetivos Específicos\n`;
  syllabus.specificObjectives.forEach((obj, idx) => {
    md += `${idx + 1}. ${obj}\n`;
  });
  md += `\n`;

  md += `## 3. Conteúdo Programático\n\n`;
  syllabus.programmaticContent.forEach((unit) => {
    md += `### ${unit.unitTitle}\n`;
    unit.topics.forEach((topic) => {
      md += `- ${topic}\n`;
    });
    md += `\n`;
  });

  md += `## 4. Metodologia de Ensino\n\n${syllabus.methodology}\n\n`;

  md += `## 5. Critérios de Avaliação\n\n`;
  syllabus.evaluationCriteria.forEach((item) => {
    md += `- **${item.name}** (Peso: ${item.weight}): ${item.description || "Sem observações"}\n`;
  });
  md += `\n`;

  md += `## 6. Bibliografia\n\n`;
  md += `### Básica\n`;
  syllabus.basicBibliography.forEach((b) => md += `- ${b}\n`);
  md += `\n### Complementar\n`;
  syllabus.complementaryBibliography.forEach((c) => md += `- ${c}\n`);
  md += `\n`;

  md += `## 7. Cronograma de Aulas\n\n`;
  md += `| Aula | Sem. | Data | Tópico | Tipo | Atividades |\n`;
  md += `| :---: | :---: | :--- | :--- | :---: | :--- |\n`;
  syllabus.schedule.forEach((cls) => {
    md += `| ${cls.classNumber} | ${cls.weekNumber} | ${formatDateBR(cls.date)} | ${cls.topic} | ${cls.type} | ${cls.activities || "-"} |\n`;
  });

  return md;
}

export function generateICalendarFile(syllabus: Syllabus): string {
  let ics = "BEGIN:VCALENDAR\r\n";
  ics += "VERSION:2.0\r\n";
  ics += "PRODID:-//Plano de Ensino e Cronograma Academic//PT-BR\r\n";
  ics += `X-WR-CALNAME:Cronograma - ${syllabus.courseTitle}\r\n`;

  syllabus.schedule.forEach((item) => {
    if (!item.date) return;
    const cleanDate = item.date.replace(/-/g, "");
    
    ics += "BEGIN:VEVENT\r\n";
    ics += `UID:class-${item.id}@planodeensino.app\r\n`;
    ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\r\n`;
    ics += `DTSTART;VALUE=DATE:${cleanDate}\r\n`;
    ics += `DTEND;VALUE=DATE:${cleanDate}\r\n`;
    ics += `SUMMARY:[${syllabus.courseCode}] Aula ${item.classNumber}: ${item.topic.replace(/,/g, "\\,")}\r\n`;
    
    let desc = `Disciplina: ${syllabus.courseTitle}\\n`;
    desc += `Tipo: ${item.type.toUpperCase()}\\n`;
    if (item.unit) desc += `Unidade: ${item.unit}\\n`;
    if (item.activities) desc += `Atividades: ${item.activities.replace(/\n/g, "\\n")}\\n`;
    if (item.notes) desc += `Notas: ${item.notes.replace(/\n/g, "\\n")}\\n`;

    ics += `DESCRIPTION:${desc}\r\n`;
    ics += "END:VEVENT\r\n";
  });

  ics += "END:VCALENDAR\r\n";
  return ics;
}

export function downloadTextFile(filename: string, content: string, contentType: string = "text/plain") {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerPrintSyllabus() {
  window.print();
}

/**
 * Helper to escape HTML characters safely
 */
function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface PrintUnitOptions {
  activeStage?: UnitStage | null;
  printAllStages?: boolean;
  professorName?: string;
  courseTitle?: string;
  department?: string;
}

/**
 * Sends HTML to a hidden iframe and triggers window.print() reliably across all browsers and iframes.
 */
export function printHtmlViaHiddenIframe(htmlContent: string) {
  try {
    let iframe = document.getElementById("senai-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "senai-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          if (iframe.contentWindow?.document) {
            iframe.contentWindow.document.title = "";
          }
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn("Iframe print call failed, attempting fallback:", err);
          window.print();
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn("Hidden iframe creation failed, trying window.open:", err);
  }

  // Fallback to window.open
  try {
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      if (printWin.document) {
        printWin.document.title = "";
      }
      return;
    }
  } catch (err) {
    console.warn("Window.open blocked, falling back to window.print():", err);
  }

  window.print();
}

/**
 * Helper to render a complete Stage or Unit block in the printable PDF
 */
function renderStageOrUnitHtml(
  title: string,
  subtitle: string,
  basicCaps: string[],
  techCaps: string[],
  socioCaps: string[],
  topics: string[],
  situation: SituationProblem | undefined | null,
  rubrics: RubricItem[],
  lessonPlan: LessonPlanItem[],
  isMultiStageBlock: boolean = false
): string {
  const totalHours = lessonPlan.reduce((sum, lp) => {
    const match = lp?.hours?.toString().match(/\d+/);
    return sum + (match ? parseInt(match[0], 10) : 4);
  }, 0);

  return `
    <div class="stage-section ${isMultiStageBlock ? 'multi-stage-divider' : ''}">
      ${isMultiStageBlock ? `
        <div class="stage-banner">
          <div class="stage-title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="stage-subtitle">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      ` : ''}

      <!-- 1. Capacidades e Competências -->
      <div class="section-block">
        <div class="section-title">
          <span>PERFIL DE CAPACIDADES E COMPETÊNCIAS</span>
        </div>
        
        <div class="capacities-grid">
          ${basicCaps && basicCaps.length > 0 ? `
            <div class="capacity-column">
              <div class="sub-heading sub-basic">Capacidades Básicas</div>
              <ul class="clean-list">
                ${basicCaps.map(c => `<li>${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>
          ` : ''}

          ${techCaps && techCaps.length > 0 ? `
            <div class="capacity-column">
              <div class="sub-heading sub-tech">Capacidades Técnicas</div>
              <ul class="clean-list">
                ${techCaps.map(c => `<li>${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>
          ` : ''}
        </div>

        ${socioCaps && socioCaps.length > 0 ? `
          <div style="margin-top: 10px;">
            <div class="sub-heading sub-socio">Capacidades Socioemocionais</div>
            <ul class="clean-list">
              ${socioCaps.map(c => `<li>${escapeHtml(c)}</li>`).join("")}
            </ul>
          </div>
        ` : ''}
      </div>

      <!-- 2. Conhecimentos & Tópicos Programáticos -->
      ${topics && topics.length > 0 ? `
        <div class="section-block">
          <div class="section-title">
            <span>CONHECIMENTOS &amp; TÓPICOS PROGRAMÁTICOS</span>
          </div>
          <div class="topics-grid">
            ${topics.map((t, idx) => {
              const match = t.match(/^(\d+)\.\s*(.*)$/);
              const num = match ? match[1] : `${idx + 1}`;
              const text = match ? match[2] : t;
              return `
                <div class="topic-pill">
                  <strong>${num}.</strong> ${escapeHtml(text)}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : ''}

      <!-- 3. Situação de Aprendizagem (S.A.) -->
      ${situation ? `
        <div class="section-block">
          <div class="section-title">
            <span>SITUAÇÃO DE APRENDIZAGEM (S.A.) SENAI</span>
          </div>
          <div class="sa-card">
            <div class="sa-header">
              <div class="sa-badge">METODOLOGIA SENAI POR COMPETÊNCIAS</div>
              <div class="sa-title">${escapeHtml(situation.title || "Situação-Problema de Aprendizagem")}</div>
            </div>
            
            <div class="sa-context">
              <span class="label-tag">Contextualização da Empresa:</span>
              <p>${escapeHtml(situation.contextualization)}</p>
            </div>

            ${Array.isArray(situation.challenge) && situation.challenge.length > 0 ? `
              <div class="sa-challenges">
                <span class="label-tag">Desafios Práticos &amp; Etapas de Execução:</span>
                <ol class="challenge-list">
                  ${situation.challenge.map(ch => `<li>${escapeHtml(ch)}</li>`).join("")}
                </ol>
              </div>
            ` : ''}

            ${Array.isArray(situation.expectedResults) && situation.expectedResults.length > 0 ? `
              <div class="sa-results">
                <span class="label-tag">Entregáveis &amp; Resultados Esperados:</span>
                <ul class="results-list">
                  ${situation.expectedResults.map(res => `<li>${escapeHtml(res)}</li>`).join("")}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- 4. Matriz de Rubricas de Avaliação MSEP SENAI -->
      ${rubrics && rubrics.length > 0 ? `
        <div class="section-block page-break-inside-avoid">
          <div class="section-title">
            <span>MATRIZ DE RUBRICAS DE AVALIAÇÃO DE DESEMPENHO (MSEP SENAI)</span>
          </div>
          <table class="rubric-table">
            <thead>
              <tr>
                <th style="width: 28%;">Capacidade Avaliada</th>
                <th style="width: 18%;" class="th-nsa">NSA (Não Satisfez)</th>
                <th style="width: 18%;" class="th-apo">APO (Com Orientação)</th>
                <th style="width: 18%;" class="th-par">PAR (Parcial. Autônomo)</th>
                <th style="width: 18%;" class="th-aut">AUT (Autônomo)</th>
              </tr>
            </thead>
            <tbody>
              ${rubrics.map((r) => `
                <tr>
                  <td class="td-cap"><strong>${escapeHtml(r.capacity)}</strong></td>
                  <td class="td-nsa">${escapeHtml(r.nsa)}</td>
                  <td class="td-apo">${escapeHtml(r.apo)}</td>
                  <td class="td-par">${escapeHtml(r.par)}</td>
                  <td class="td-aut">${escapeHtml(r.aut)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- 5. Plano de Aula & Cronograma -->
      <div class="section-block">
        <div class="section-title">
          <span>PLANO DE AULA &amp; CRONOGRAMA PEDAGÓGICO (${lessonPlan.length} AULAS • ${totalHours}h)</span>
        </div>
        ${lessonPlan && lessonPlan.length > 0 ? `
          <table class="lesson-table">
            <thead>
              <tr>
                <th style="width: 13%;">Aula / Data</th>
                <th style="width: 22%;">Capacidades Desenvolvidas</th>
                <th style="width: 25%;">Conhecimentos / Conteúdo</th>
                <th style="width: 20%;">Estratégias Pedagógicas</th>
                <th style="width: 20%;">Recursos &amp; Ambientes</th>
              </tr>
            </thead>
            <tbody>
              ${lessonPlan.map((lp, idx) => `
                <tr>
                  <td class="td-date-cell">
                    <div class="aula-num">Aula ${idx + 1}</div>
                    <div class="aula-date">${escapeHtml(lp.date)}</div>
                    <div class="aula-hours">${escapeHtml(lp.hours || "4h")}</div>
                  </td>
                  <td class="td-content">${escapeHtml(lp.capacities || "Demonstrar capacidades técnicas e socioemocionais.")}</td>
                  <td class="td-content">${escapeHtml(lp.conhecimentos || "")}</td>
                  <td class="td-content">${escapeHtml(lp.estrategias || "")}</td>
                  <td class="td-content">${escapeHtml(lp.recursos || "")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `
          <div class="empty-state-box">
            Nenhum encontro agendado para esta unidade ou etapa.
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Generates a clean, printable HTML document for a specific Unidade Curricular / Plano de Ensino
 * and opens the browser print dialog with 100% data fidelity.
 */
export function printUnidadeCurricularPDF(
  unit: ProgrammaticUnit,
  syllabus: Syllabus,
  optionsOrProfessorName?: string | PrintUnitOptions,
  activeStageParam?: UnitStage | null
) {
  let professorName = "Prof. Ricardo Beretella";
  let activeStage: UnitStage | null = null;
  let printAllStages = false;

  if (typeof optionsOrProfessorName === "string") {
    professorName = optionsOrProfessorName;
    activeStage = activeStageParam || null;
  } else if (optionsOrProfessorName && typeof optionsOrProfessorName === "object") {
    professorName = optionsOrProfessorName.professorName || syllabus.professorName || "Prof. Ricardo Beretella";
    activeStage = optionsOrProfessorName.activeStage !== undefined ? optionsOrProfessorName.activeStage : (activeStageParam || null);
    printAllStages = !!optionsOrProfessorName.printAllStages;
  }

  const formattedProfName = professorName.startsWith("Prof. ") ? professorName : `Prof. ${professorName}`;
  const hasStages = Array.isArray(unit.stages) && unit.stages.length > 0;

  // Header Subtitle
  let headerStageSubtitle = "";
  if (hasStages && !printAllStages && activeStage) {
    headerStageSubtitle = `${activeStage.turma ? activeStage.turma + ' • ' : ''}${activeStage.title}`;
  } else if (hasStages && printAllStages) {
    headerStageSubtitle = `Documento Consolidado • Todas as ${unit.stages!.length} Etapas & Rotações`;
  }

  let bodyContent = "";

  if (hasStages && printAllStages) {
    // Render all stages sequentially with page breaks
    bodyContent = unit.stages!.map((st, sIdx) => {
      const stageBasicCaps = st.basicCapacities || [];
      const stageTechCaps = st.technicalCapacities || [];
      const stageSocioCaps = st.socioemotionalCapacities || unit.socioemotionalCapacities || [];
      const stageTopics = st.topics && st.topics.length > 0 ? st.topics : unit.topics || [];
      const stageSituation = st.situationProblem || unit.situationProblem;
      const stageRubrics = st.rubrics && st.rubrics.length > 0 ? st.rubrics : unit.rubrics || [];
      const stageLessons = st.lessonPlan && st.lessonPlan.length > 0 ? st.lessonPlan : [];

      return renderStageOrUnitHtml(
        `Etapa ${sIdx + 1}: ${st.title}`,
        st.turma ? `Oficina / Rotação: ${st.turma}` : "",
        stageBasicCaps,
        stageTechCaps,
        stageSocioCaps,
        stageTopics,
        stageSituation,
        stageRubrics,
        stageLessons,
        true
      );
    }).join("");
  } else if (hasStages && activeStage) {
    // Render the specific active stage
    const stageBasicCaps = activeStage.basicCapacities || [];
    const stageTechCaps = activeStage.technicalCapacities || [];
    const stageSocioCaps = activeStage.socioemotionalCapacities || unit.socioemotionalCapacities || [];
    const stageTopics = activeStage.topics && activeStage.topics.length > 0 ? activeStage.topics : unit.topics || [];
    const stageSituation = activeStage.situationProblem || unit.situationProblem;
    const stageRubrics = activeStage.rubrics && activeStage.rubrics.length > 0 ? activeStage.rubrics : unit.rubrics || [];
    const stageLessons = activeStage.lessonPlan && activeStage.lessonPlan.length > 0 ? activeStage.lessonPlan : [];

    bodyContent = renderStageOrUnitHtml(
      activeStage.title,
      activeStage.turma ? `Turma / Rotação: ${activeStage.turma}` : "",
      stageBasicCaps,
      stageTechCaps,
      stageSocioCaps,
      stageTopics,
      stageSituation,
      stageRubrics,
      stageLessons,
      false
    );
  } else {
    // Single unit without multiple stages (e.g. LIDT, CIEMA, CRD, MAP, MINDU, etc.)
    const basicCaps = unit.basicCapacities || [];
    const techCaps = unit.technicalCapacities || [];
    const socioCaps = unit.socioemotionalCapacities || [];
    const topics = unit.topics || [];
    const situation = unit.situationProblem;
    const rubrics = unit.rubrics || [];
    const lessonPlan = unit.lessonPlan || [];

    bodyContent = renderStageOrUnitHtml(
      unit.unitTitle,
      "",
      basicCaps,
      techCaps,
      socioCaps,
      topics,
      situation,
      rubrics,
      lessonPlan,
      false
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title></title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media print {
          @page {
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .multi-stage-divider {
            break-before: page;
            page-break-before: always;
          }
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 9pt;
          line-height: 1.4;
        }
        
        /* Top Header */
        .header-box {
          border-bottom: 2.5px solid #005594;
          padding-bottom: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-title-area h1 {
          margin: 0;
          font-size: 13pt;
          text-transform: uppercase;
          color: #005594;
          font-weight: 900;
          letter-spacing: -0.2px;
        }
        .header-title-area h2 {
          margin: 2px 0 0 0;
          font-size: 10pt;
          color: #334155;
          font-weight: 700;
          text-transform: uppercase;
        }
        .header-title-area h3 {
          margin: 2px 0 0 0;
          font-size: 8.5pt;
          color: #64748b;
          font-weight: 600;
        }
        .header-badges {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }
        .badge-main {
          background: #005594;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 900;
          letter-spacing: 0.5px;
        }
        .badge-sub {
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: 700;
        }

        /* Metadata Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 14px;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 12px;
          font-size: 8.5pt;
        }
        .info-item strong {
          color: #334155;
          font-weight: 700;
        }

        /* Objective Box */
        .objective-card {
          background: #f0f9ff;
          border-left: 3.5px solid #0284c7;
          padding: 8px 12px;
          border-radius: 0 6px 6px 0;
          margin-bottom: 12px;
          font-size: 8.5pt;
          line-height: 1.45;
          color: #0c4a6e;
          text-align: justify;
        }
        .objective-card strong {
          color: #0369a1;
          display: block;
          margin-bottom: 2px;
          font-size: 8.5pt;
          text-transform: uppercase;
        }

        /* Section Headings */
        .section-block {
          margin-bottom: 14px;
        }
        .section-title {
          font-size: 9.5pt;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 3px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Multi-Stage Banner */
        .stage-banner {
          background: #0f172a;
          color: #ffffff;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .stage-title {
          font-size: 11pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.2px;
          color: #f8fafc;
        }
        .stage-subtitle {
          font-size: 8.5pt;
          font-weight: 700;
          color: #93c5fd;
          margin-top: 1px;
        }

        /* Capacities Layout */
        .capacities-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .capacity-column {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
        }
        .sub-heading {
          font-size: 8.5pt;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 6px;
          padding-bottom: 3px;
          border-bottom: 1px solid #e2e8f0;
        }
        .sub-basic { color: #0284c7; }
        .sub-tech { color: #2563eb; }
        .sub-socio { color: #7c3aed; }
        .clean-list {
          margin: 0;
          padding-left: 16px;
          font-size: 8pt;
          line-height: 1.4;
        }
        .clean-list li {
          margin-bottom: 3px;
        }

        /* Topics Grid */
        .topics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          border-radius: 6px;
        }
        .topic-pill {
          font-size: 7.5pt;
          color: #334155;
          line-height: 1.35;
        }
        .topic-pill strong {
          color: #0284c7;
        }

        /* Situation-Problem SENAI Card */
        .sa-card {
          background: #fdfefe;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }
        .sa-header {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .sa-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          font-size: 7pt;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .sa-title {
          font-size: 9.5pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }
        .sa-context {
          font-size: 8pt;
          line-height: 1.45;
          margin-bottom: 8px;
          text-align: justify;
        }
        .sa-context p {
          margin: 2px 0 0 0;
          color: #334155;
        }
        .label-tag {
          font-weight: 800;
          font-size: 8pt;
          text-transform: uppercase;
          color: #0f172a;
          display: block;
        }
        .challenge-list, .results-list {
          margin: 3px 0 6px 0;
          padding-left: 16px;
          font-size: 8pt;
          line-height: 1.4;
          color: #334155;
        }
        .challenge-list li, .results-list li {
          margin-bottom: 3px;
        }

        /* Tables (Rubrics and Lessons) */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
          font-size: 7.5pt;
          line-height: 1.35;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 5px 6px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          font-size: 7pt;
          letter-spacing: 0.2px;
        }
        .th-nsa { background-color: #fee2e2; color: #991b1b; }
        .th-apo { background-color: #fef3c7; color: #92400e; }
        .th-par { background-color: #e0f2fe; color: #075985; }
        .th-aut { background-color: #dcfce7; color: #166534; }
        
        .td-cap { font-size: 7.5pt; color: #0f172a; }
        .td-nsa { background-color: #fffafa; }
        .td-apo { background-color: #fffdf5; }
        .td-par { background-color: #f7fbff; }
        .td-aut { background-color: #f6fef9; }

        .lesson-table th {
          background-color: #005594;
          color: #ffffff;
        }
        .lesson-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .td-date-cell {
          white-space: nowrap;
          text-align: center;
        }
        .aula-num {
          font-weight: 800;
          color: #005594;
          font-size: 7.5pt;
        }
        .aula-date {
          font-weight: 700;
          color: #0f172a;
          font-size: 8pt;
        }
        .aula-hours {
          color: #64748b;
          font-size: 7pt;
          font-weight: 600;
        }
        .td-content {
          font-size: 7.5pt;
          color: #1e293b;
        }

        .empty-state-box {
          padding: 10px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 4px;
          text-align: center;
          color: #64748b;
          font-style: italic;
          font-size: 8pt;
        }

        /* Signatures and Footer */
        .signatures-area {
          margin-top: 25px;
          padding-top: 10px;
          display: flex;
          justify-content: space-around;
          text-align: center;
          font-size: 8pt;
          break-inside: avoid;
        }
        .sig-block {
          width: 220px;
        }
        .sig-line {
          border-top: 1px solid #475569;
          margin-bottom: 4px;
        }
        .sig-name {
          font-weight: 700;
          color: #0f172a;
        }
        .sig-role {
          color: #64748b;
          font-size: 7.5pt;
        }

        .doc-footer {
          margin-top: 15px;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 7pt;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <!-- Header Box -->
      <div class="header-box">
        <div class="header-title-area">
          <h1>SENAI-SP • PLANO DE ENSINO E CRONOGRAMA</h1>
          <h2>${escapeHtml(syllabus.courseTitle || "Mecânico de Usinagem Convencional")}</h2>
          ${syllabus.department ? `<h3>${escapeHtml(syllabus.department)}</h3>` : ''}
        </div>
        <div class="header-badges">
          <div class="badge-main">${escapeHtml(unit.acronym || "UC")}</div>
          <div class="badge-sub">${escapeHtml(unit.workload || "60h")} • ${escapeHtml(unit.semester || "1º SEMESTRE")}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-item"><strong>Unidade Curricular:</strong> ${escapeHtml(unit.unitTitle)}</div>
        <div class="info-item"><strong>Docente Responsável:</strong> ${escapeHtml(formattedProfName)}</div>
        <div class="info-item"><strong>Módulo / Área:</strong> ${escapeHtml(unit.module || "Módulo Específico")} • Metalmecânica</div>
        <div class="info-item"><strong>Carga Horária Total:</strong> ${escapeHtml(unit.workload || "60h")}</div>
        ${syllabus.department ? `
          <div class="info-item" style="grid-column: span 2;">
            <strong>Unidade Escolar:</strong> ${escapeHtml(syllabus.department)}
          </div>
        ` : ''}
        ${headerStageSubtitle ? `
          <div class="info-item" style="grid-column: span 2;">
            <strong>Etapa / Rotação:</strong> ${escapeHtml(headerStageSubtitle)}
          </div>
        ` : ''}
      </div>

      <!-- Objective -->
      ${unit.objective ? `
        <div class="objective-card">
          <strong>Objetivo da Unidade Curricular:</strong>
          ${escapeHtml(unit.objective)}
        </div>
      ` : ''}

      <!-- Main Body Content (Stage or Unit) -->
      ${bodyContent}

      <!-- Signatures -->
      <div class="signatures-area page-break-inside-avoid">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${escapeHtml(formattedProfName)}</div>
          <div class="sig-role">Docente Responsável</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">Coordenação Pedagógica</div>
          <div class="sig-role">SENAI-SP</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="doc-footer">
        <div>Documento Oficial emitido pelo Sistema Integrado de Planos de Ensino SENAI-SP</div>
      </div>
    </body>
    </html>
  `;

  printHtmlViaHiddenIframe(htmlContent);
}

