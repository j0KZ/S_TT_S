import { GoogleGenAI } from '@google/genai'; // HarmCategory, HarmBlockThreshold might not be needed now

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  // This check should ideally be done once when the app loads,
  // but keeping it here for service integrity.
  throw new Error("VITE_GEMINI_API_KEY is not set in .env.local");
}

const genAI = new GoogleGenAI(API_KEY); // Corrected class name
const ttsModel = genAI.getGenerativeModel({ 
  model: "models/gemini-2.5-flash-preview-tts" // Corrected model name
});

// PRESET_VOICES can remain as is, e.g., Kore, Zephyr,
// as voiceName is passed directly.
export const PRESET_VOICES = [
  { name: "Kore", value: "Kore" },
  { name: "Zephyr", value: "Zephyr" },
  // Add other known voices if available
];

export async function generateAudio(
  text: string,
  voiceName: string 
): Promise<string> {
  if (!text.trim()) {
    throw new Error("Input text cannot be empty.");
  }
  if (!voiceName || !voiceName.trim()) {
    // Fallback to a default if no voiceName is provided and if the API supports it,
    // or throw error if voiceName is strictly required.
    // For now, let's assume a voiceName is required.
    throw new Error("Voice name must be provided.");
  }

  try {
    console.log(`Requesting TTS for text: "${text}", voice: "${voiceName}" using new structure`);

    const requestPayload = {
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
            responseMimeType: "audio/wav",
        },
        tools: [{
            tool: "speech", // Literal key "tool" with string value "speech"
            config: {       // Literal key "config" with the speech configuration object
                speechConfig: {
                    voiceConfig: {
                        voiceName: voiceName, // Use the parameter here
                    },
                },
            },
        }]
    };
    
    const result = await ttsModel.generateContent(requestPayload as any); // 'as any' for the specific tools structure

    const base64 = result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) {
      console.error("No audio data returned from TTS API.", JSON.stringify(result.response, null, 2));
      throw new Error("No audio data returned from TTS API.");
    }

    // Convert base64 to Blob
    const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const audioBlob = new Blob([byteArray], { type: "audio/wav" }); // Match responseMimeType

    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;

  } catch (error) {
    console.error("Error generating audio with new structure:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate audio: ${errorMessage}`);
  }
}

export function getAvailableVoices() {
  return PRESET_VOICES;
}
