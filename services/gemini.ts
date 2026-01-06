
import { GoogleGenAI } from "@google/genai";
import { Patient, Session } from "../types";

export const getClinicalInsight = async (patient: Patient, sessions: Session[]) => {
  // Inicializamos a instância dentro da função para garantir que process.env.API_KEY esteja disponível
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const sessionHistory = sessions
    .filter(s => s.patientId === patient.id)
    .map(s => `- ${s.date} (${s.status}): ${s.notes || 'Sem notas'}`)
    .join('\n');

  const prompt = `
    Analise o seguinte histórico de sessões do paciente e forneça um insight clínico conciso (máximo 3 tópicos) para o psicólogo.
    Responda exclusivamente em Português (Brasil).
    Foque em padrões potenciais, alertas que exigem atenção ou áreas sugeridas de foco para a próxima sessão.

    Perfil do Paciente: ${patient.name}, Status: ${patient.status}
    Notas: ${patient.notes}

    Histórico de Sessões:
    ${sessionHistory}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
      }
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao comunicar com o assistente de IA. Verifique as configurações de API.";
  }
};
