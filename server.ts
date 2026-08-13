import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Lazy initialize GoogleGenAI client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A chave de API GEMINI_API_KEY não foi encontrada.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Syllabus & Schedule Generator endpoint
app.post("/api/generate-syllabus", async (req, res) => {
  try {
    const {
      topic,
      level = "Graduação",
      workloadHours = 60,
      weeksCount = 15,
      startDate = new Date().toISOString().split("T")[0],
      classDays = ["Terça-feira", "Quinta-feira"],
      additionalNotes = "",
    } = req.body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Informe o nome ou assunto da disciplina." });
    }

    const ai = getGeminiClient();

    const prompt = `Você é um especialista em pedagogia e planejamento acadêmico universitário/escolar.
Crie um Plano de Ensino e Cronograma acadêmico altamente detalhado, profissional, realista e pedagogicamente estruturado para a disciplina/curso a seguir:

- Nome/Assunto da Disciplina: "${topic.trim()}"
- Nível de Ensino: "${level}"
- Carga Horária Total: ${workloadHours} horas
- Duração em Semanas: ${weeksCount} semanas
- Data de Início das Aulas: ${startDate}
- Dias de Aula na Semana: ${Array.isArray(classDays) ? classDays.join(", ") : "Segunda-feira"}
${additionalNotes ? `- Observações/Foco Específico do Professor: "${additionalNotes}"` : ""}

Importante para o Cronograma:
- Gere aproximadamente de ${Math.min(weeksCount * (Array.isArray(classDays) ? classDays.length : 1), 40)} aulas distribuídas logicamente ao longo das ${weeksCount} semanas.
- Atribua datas reais sequenciais baseadas na data de início (${startDate}) e nos dias da semana fornecidos.
- Inclua pelo menos 1 a 2 aulas de avaliação (Provas/Exames/Projetos), aulas práticas/laboratório e revisão.
- Todos os campos de texto devem estar em Português (Brasil) perfeito, com linguagem acadêmica elegante.
- Forneça bibliografias reais ou altamente pertinentes em formato ABNT.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseTitle: { type: Type.STRING, description: "Nome formal da disciplina" },
            courseCode: { type: Type.STRING, description: "Código da disciplina (ex: INF-201)" },
            workload: { type: Type.STRING, description: "Carga horária formatada (ex: 60h)" },
            period: { type: Type.STRING, description: "Semestre/Período letivo (ex: 2026.1)" },
            department: { type: Type.STRING, description: "Departamento/Curso acadêmico" },
            level: { type: Type.STRING, description: "Nível acadêmico (ex: Graduação)" },
            summary: { type: Type.STRING, description: "Ementa completa e concisa da disciplina" },
            generalObjectives: { type: Type.STRING, description: "Objetivo geral do curso" },
            specificObjectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 a 5 objetivos específicos",
            },
            programmaticContent: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  unitTitle: { type: Type.STRING, description: "Nome da Unidade Didática" },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Tópicos abordados na unidade",
                  },
                },
                required: ["unitTitle", "topics"],
              },
            },
            methodology: { type: Type.STRING, description: "Metodologia de ensino e aprendizagem" },
            evaluationCriteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome da avaliação (ex: Prova 1, Projeto Prático)" },
                  weight: { type: Type.STRING, description: "Peso ou valor percentual (ex: 30%)" },
                  description: { type: Type.STRING, description: "Breve descrição do critério" },
                },
                required: ["name", "weight"],
              },
            },
            basicBibliography: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Referências bibliográficas básicas (ABNT)",
            },
            complementaryBibliography: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Referências bibliográficas complementares (ABNT)",
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  classNumber: { type: Type.INTEGER, description: "Número sequencial da aula" },
                  weekNumber: { type: Type.INTEGER, description: "Número da semana (1 a N)" },
                  date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
                  topic: { type: Type.STRING, description: "Título do tópico da aula" },
                  unit: { type: Type.STRING, description: "Unidade correspondente" },
                  type: {
                    type: Type.STRING,
                    description: "Tipo de aula: teorica, pratica, laboratorio, avaliacao, apresentacao, ou feriado",
                  },
                  activities: { type: Type.STRING, description: "Atividades/Leituras prévias ou entregas" },
                  notes: { type: Type.STRING, description: "Observações ou recursos necessários" },
                },
                required: ["classNumber", "weekNumber", "topic", "type"],
              },
            },
          },
          required: [
            "courseTitle",
            "workload",
            "summary",
            "generalObjectives",
            "specificObjectives",
            "programmaticContent",
            "methodology",
            "evaluationCriteria",
            "basicBibliography",
            "schedule",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("A IA não retornou resposta textual.");
    }

    const data = JSON.parse(text);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Erro ao gerar plano de ensino com IA:", err);
    return res.status(500).json({
      error: "Falha ao gerar o plano com IA. " + (err?.message || "Tente novamente."),
    });
  }
});

// AI Section Refinement Endpoint
app.post("/api/refine-section", async (req, res) => {
  try {
    const { sectionName, currentContent, instruction } = req.body;
    if (!sectionName || !instruction) {
      return res.status(400).json({ error: "Seção e instrução são obrigatórias." });
    }

    const ai = getGeminiClient();

    const prompt = `Você é um assistente pedagógico acadêmico.
Melhore/reescreva a seção "${sectionName}" de um plano de ensino de acordo com a solicitação do professor.

Conteúdo Atual:
${typeof currentContent === "string" ? currentContent : JSON.stringify(currentContent, null, 2)}

Solicitação de Mudança / Instrução do Professor:
"${instruction}"

Responda APENAS com o texto final reescrito ou ajustado, mantendo linguagem acadêmica formal em Português.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({ success: true, result: response.text?.trim() });
  } catch (err: any) {
    console.error("Erro ao refinar seção com IA:", err);
    return res.status(500).json({ error: "Erro ao processar refinamento com IA." });
  }
});

// Setup Vite Dev server or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Plano de Ensino Server] Rodando na porta ${PORT}`);
  });
}

startServer();
