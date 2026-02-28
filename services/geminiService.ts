
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Genre, LoreData, SegmentLength, SegmentType, StorySegment } from "../types";

/**
 * Generates a creative random title based on a genre.
 */
export const generateRandomTitle = async (genre: Genre): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  const prompt = `Gere um título criativo, único e impactante para uma história do gênero "${genre}". Retorne apenas o título, sem aspas ou explicações adicionais. O título deve estar em português.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "Título Sem Nome";
  } catch (error) {
    console.error("Erro ao gerar título:", error);
    return "O Mistério do Vazio";
  }
};

export const analyzeReferenceDocument = async (
  documentText: string,
  title: string,
  genre: Genre
): Promise<LoreData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analise o texto e extraia a bíblia da história: "${title}" (${genre}).
    TEXTO: ${documentText.substring(0, 15000)}
    Retorne estritamente um JSON com "characters", "world", "extraInfo" no mesmo idioma do texto original.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error("Falha ao extrair lore.");
  }
};

export const generateLoreDetails = async (
  title: string,
  genre: Genre,
  existingLore: Partial<LoreData>
): Promise<LoreData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  const prompt = `
    Expanda esta bíblia: "${title}" (${genre}).
    LORE ATUAL: ${JSON.stringify(existingLore)}
    Retorne JSON com "characters", "world", "extraInfo". 
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Lore extension error:", error);
    throw new Error("Falha ao gerar lore.");
  }
};

export const writeStorySegment = async (
  title: string,
  genre: Genre,
  lore: LoreData,
  previousSegments: StorySegment[],
  constraints: {
    startWith: string;
    endWith: string;
    type: SegmentType;
    length: SegmentLength;
  }
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  let wordCount = 500;
  if (constraints.length === SegmentLength.SHORT) wordCount = 200;
  if (constraints.length === SegmentLength.LONG) wordCount = 1000;
  if (constraints.length === SegmentLength.GIGANTIC) wordCount = 5000;

  const previousText = previousSegments.map(s => s.text).join("\n\n").slice(-8000);
  
  const prompt = `
    Você é um escritor fantasma profissional especializado no estilo "${genre}".
    Título da Obra: "${title}"
    
    BÍBLIA DO MUNDO:
    Personagens: ${lore.characters}
    Cenário: ${lore.world}
    Notas Adicionais: ${lore.extraInfo}

    HISTÓRIA ATÉ AGORA:
    ${previousText || "(Início da história)"}

    TAREFA: Escreva o próximo segmento da história (${constraints.type}).
    META: Aproximadamente ${wordCount} palavras.
    
    REGRAS CRÍTICAS:
    1. Escreva APENAS a prosa da história. 
    2. PROIBIDO incluir títulos de capítulos, números, metadados ou mensagens para o usuário.
    3. Se houver uma frase de início, ela DEVE ser a primeira frase.
    4. Se houver uma frase de fim, ela DEVE ser a última frase.
    
    FRASE DE INÍCIO OBRIGATÓRIA: "${constraints.startWith || "Nenhuma"}"
    FRASE DE FIM OBRIGATÓRIA: "${constraints.endWith || "Nenhuma"}"
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: constraints.length === SegmentLength.GIGANTIC ? { thinkingBudget: 4096 } : undefined,
      }
    });

    let text = response.text || "";
    text = text.trim();
    text = text.replace(/^(Aqui está o próximo segmento|Claro, aqui está|Segmento \d+|Capítulo \d+):?\s*/i, "");

    if (constraints.startWith && !text.toLowerCase().startsWith(constraints.startWith.toLowerCase().trim())) {
      text = constraints.startWith.trim() + " " + text;
    }
    
    if (constraints.endWith && !text.toLowerCase().endsWith(constraints.endWith.toLowerCase().trim())) {
      text = text + " " + constraints.endWith.trim();
    }

    return text.trim();
  } catch (error) {
    console.error("Writing error:", error);
    throw new Error("Erro na geração de texto.");
  }
};
