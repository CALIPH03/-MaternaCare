import { GoogleGenAI, Type } from "@google/genai";
import { PartographEntry, Patient, Admission } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface ClinicalInsight {
  status: 'normal' | 'warning' | 'critical';
  summary: string;
  recommendations: string[];
  reasoning: string;
}

export async function analyzeLabourProgress(
  patient: Patient,
  admission: Admission,
  entries: PartographEntry[]
): Promise<ClinicalInsight> {
  // Sort entries by time
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const prompt = `
    Analyze the following labour progress data for a patient and provide a clinical advisory based on WHO 2024 Labour Care Guidelines.
    
    Patient: ${patient.fullName}, ${patient.age} years old.
    Obstetric History: Gravida ${admission.gravida}, Para ${admission.para}.
    Admitted at: ${admission.admittedAt}
    
    Observation History (JSON):
    ${JSON.stringify(sortedEntries)}
    
    Focus on:
    1. Cervical dilation progression (rate of change).
    2. Fetal heart rate trends (bradycardia or tachycardia).
    3. Maternal vital signs (BP, Temp).
    4. Liquor status (Meconium stained?).
    
    Return a structured clinical insight.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              enum: ['normal', 'warning', 'critical'],
              description: "Overall clinical status assessment."
            },
            summary: { 
              type: Type.STRING,
              description: "One sentence executive summary."
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of actionable clinical steps."
            },
            reasoning: { 
              type: Type.STRING,
              description: "Clinical justification based on guidelines."
            }
          },
          required: ["status", "summary", "recommendations", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      status: 'normal',
      summary: "Clinical analysis currently unavailable.",
      recommendations: ["Continue standard monitoring as per facility protocol."],
      reasoning: "The automated advisor encountered an error. Rely on standard clinical judgment."
    };
  }
}
