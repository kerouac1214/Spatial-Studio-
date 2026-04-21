import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPlacementOptimization(sceneData: any) {
  const prompt = `
    You are a professional film cinematographer and spatial layout expert. 
    Analyze the following scene setup and character positions:
    ${JSON.stringify(sceneData, null, 2)}

    Provide concise, actionable advice for optimizing character placement, lighting direction, and camera angle to create a balanced, realistic, and cinematic composition.
    Focus on:
    1. Character spatial relationships (e.g., overlapping, eye lines).
    2. Lighting consistency for integration.
    3. Focal length and perspective suggestions.
    
    Output in a structured format suitable for display in a UI.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI suggestion currently unavailable. Please check your spatial layout manually.";
  }
}

export async function generateSpatialMapPrompt(sceneData: any) {
  // This helps translate the 3D scene into a prompt for models like nano banana2 (gemini-3.1-flash-image-preview)
  const prompt = `
    Based on this 3D layout data:
    ${JSON.stringify(sceneData, null, 2)}
    
    Generate a highly descriptive prompt for an AI image generator (nano banana 2) that accurately describes the positions, depths, and lighting of the characters in the scene.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Error generating image prompt.";
  }
}
