import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, PresentationData } from "../types";

const initGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePresentationContent = async (
  text: string, 
  config: GenerationConfig
): Promise<PresentationData> => {
  const ai = initGenAI();
  
  // Use gemini-2.5-flash for speed and efficiency with large context
  const modelId = "gemini-2.5-flash";

  const prompt = `
    Analyze the following academic/research text and structure it into a PowerPoint presentation.
    
    Target Audience: ${config.audience}
    Detail Level: ${config.detailLevel}
    Approximate Number of Slides: ${config.numSlides}
    
    Requirements:
    1. Create a compelling Title Slide.
    2. Break down the paper into logical sections (Introduction, Methodology, Results, Discussion, Conclusion).
    3. For each slide, provide a clear Title, 3-5 concise Bullet Points, and detailed Speaker Notes explaining the points.
    
    Input Text:
    ${text.substring(0, 30000)} // Truncate to avoid hard limits, though Flash handles large context well.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert academic researcher and presentation designer. Your goal is to synthesize complex research into clear, structured, and visually logical presentation content.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Main title of the presentation" },
            subtitle: { type: Type.STRING, description: "Subtitle or author names" },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  bulletPoints: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "3-5 key points for the slide"
                  },
                  speakerNotes: { type: Type.STRING, description: "Script for the presenter" }
                },
                required: ["title", "bulletPoints", "speakerNotes"]
              }
            }
          },
          required: ["title", "slides"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");
    
    const result = JSON.parse(jsonText);
    
    // Ensure strict type matching
    return {
        title: result.title,
        subtitle: result.subtitle,
        slides: result.slides,
        // Template and titleImage are undefined here, will be merged in App.tsx
    } as PresentationData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};