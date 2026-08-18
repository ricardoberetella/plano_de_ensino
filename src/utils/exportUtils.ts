import { Syllabus, ProgrammaticUnit } from "../types/syllabus";
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
 * Generates a clean, printable HTML document for a specific Unidade Curricular / Plano de Ensino
 * and opens the browser print dialog. Fallbacks to window.print() if popups are blocked.
 */
export function printUnidadeCurricularPDF(
  unit: ProgrammaticUnit,
  syllabus: Syllabus,
  professorName: string = "Ricardo Beretella"
) {
  const formattedProfName = professorName.startsWith("Prof. ") ? professorName : `Prof. ${professorName}`;
  const targetProf = formattedProfName.toLowerCase();
  const isGea = targetProf.includes("gea");
  const isBeretella = targetProf.includes("beretella");

  // Strictly filter lessons for the specific professor to avoid duplication or mixed schedules
  const rawLessons = unit.lessonPlan || [];
  const lessonPlan = rawLessons.filter((lp) => {
    if (!lp) return false;
    if (lp.professor) {
      const p = lp.professor.toLowerCase();
      if (isGea) return p.includes("gea");
      if (isBeretella) return p.includes("beretella");
      return true;
    }
    if (isGea && lp.id?.includes("gea")) return true;
    if (isBeretella && !lp.id?.includes("gea")) return true;
    return true;
  });

  const techCaps = unit.technicalCapacities || unit.basicCapacities || [];
  const socioCaps = unit.socioemotionalCapacities || [];
  const rubrics = unit.rubrics || [];
  const situation = unit.situationProblem;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Plano de Ensino - ${unit.unitTitle}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 10pt;
          line-height: 1.4;
        }
        .header {
          border-bottom: 2px solid #0284c7;
          padding-bottom: 10px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title h1 {
          margin: 0;
          font-size: 16pt;
          text-transform: uppercase;
          color: #0369a1;
          font-weight: 900;
        }
        .header-title h2 {
          margin: 2px 0 0 0;
          font-size: 11pt;
          color: #475569;
          font-weight: 700;
        }
        .badge {
          background: #e0f2fe;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: bold;
        }
        .info-grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 10px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 15px;
          font-size: 9.5pt;
        }
        .section-title {
          font-size: 11pt;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 4px;
          margin-top: 15px;
          margin-bottom: 8px;
        }
        ul {
          margin: 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 8.5pt;
        }
        th, td {
          border: 1px solid #94a3b8;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
          text-transform: uppercase;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          color: #64748b;
        }
        .signature-box {
          margin-top: 40px;
          display: flex;
          justify-content: space-around;
          text-align: center;
          font-size: 9pt;
        }
        .signature-line {
          border-top: 1px solid #475569;
          width: 200px;
          padding-top: 4px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">
          <h1>SENAI - PLANO DE ENSINO</h1>
          <h2>${syllabus.courseTitle || "Curso Técnico em Usinagem"}</h2>
        </div>
        <div class="badge">${unit.workload || "40h"} | ${unit.semester || "1º SEMESTRE"}</div>
      </div>

      <div class="info-grid">
        <div><strong>Unidade Curricular:</strong> ${unit.unitTitle}</div>
        <div><strong>Docente Responsável:</strong> ${formattedProfName}</div>
        <div><strong>Código / Sigla:</strong> ${unit.acronym || "UC"}</div>
        <div><strong>Unidade Escolar:</strong> ${syllabus.department || "Escola SENAI Roberto Mange"}</div>
      </div>

      ${unit.objective ? `
        <div class="section-title">Objetivo da Unidade Curricular</div>
        <p style="margin-top: 4px; font-size: 9.5pt; text-align: justify;">${unit.objective}</p>
      ` : ''}

      ${techCaps.length > 0 ? `
        <div class="section-title">Capacidades Técnicas e Básicas</div>
        <ul>
          ${techCaps.map((c) => `<li>${c}</li>`).join("")}
        </ul>
      ` : ''}

      ${socioCaps.length > 0 ? `
        <div class="section-title">Capacidades Socioemocionais</div>
        <ul>
          ${socioCaps.map((c) => `<li>${c}</li>`).join("")}
        </ul>
      ` : ''}

      ${situation ? `
        <div class="section-title">Situação-Problema de Aprendizagem</div>
        <p><strong>${situation.title}</strong></p>
        <p style="text-align: justify; font-size: 9pt;">${situation.contextualization}</p>
      ` : ''}

      ${rubrics.length > 0 ? `
        <div class="section-title">Matriz de Rubricas de Avaliação (MSEP SENAI)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Capacidade</th>
              <th style="width: 17.5%;">NSA (Não Satisfez)</th>
              <th style="width: 17.5%;">APO (Com Orientação)</th>
              <th style="width: 17.5%;">PAR (Parcial Autônomo)</th>
              <th style="width: 17.5%;">AUT (Autônomo)</th>
            </tr>
          </thead>
          <tbody>
            ${rubrics.map((r) => `
              <tr>
                <td><strong>${r.capacity}</strong></td>
                <td>${r.nsa}</td>
                <td>${r.apo}</td>
                <td>${r.par}</td>
                <td>${r.aut}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : ''}

      <div class="section-title" style="page-break-before: auto;">Plano de Ensino Sequencial (${lessonPlan.length} Encontros)</div>
      ${lessonPlan.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Data</th>
              <th style="width: 8%;">Carga</th>
              <th style="width: 35%;">Conhecimentos / Tópicos</th>
              <th style="width: 25%;">Estratégia Didática</th>
              <th style="width: 20%;">Recursos / Ambientes</th>
            </tr>
          </thead>
          <tbody>
            ${lessonPlan.map((lp) => `
              <tr>
                <td><strong>${lp.date}</strong></td>
                <td>${lp.hours}</td>
                <td>${lp.conhecimentos}</td>
                <td>${lp.estrategias}</td>
                <td>${lp.recursos}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : '<p>Nenhum encontro agendado.</p>'}

      <div class="signature-box">
        <div>
          <div class="signature-line">Docente Responsável</div>
          <div>${formattedProfName}</div>
        </div>
        <div>
          <div class="signature-line">Coordenação Pedagógica SENAI</div>
          <div>SENAI - SP</div>
        </div>
      </div>

      <div class="footer">
        <div>Documento gerado pelo Sistema Integrado SENAI - Plano de Ensino</div>
        <div>Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  try {
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      return;
    }
  } catch (err) {
    console.warn("Popup blocked or failed, falling back to window.print()", err);
  }

  // Fallback to directly printing current window if popup blocked
  window.print();
}

