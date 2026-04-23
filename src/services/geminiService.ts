import { GoogleGenAI } from "@google/genai";

export async function generateRecipe(ageGroup: string, ingredients: string, allergies: string, equipment: string, duration: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY. Please ensure it is set in your environment.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      USER CONTEXT:
      - Age Group: ${ageGroup}
      - Ingredients: ${ingredients}
      - Allergies: ${allergies}
      - Equipment: ${equipment || 'Any available'}
      - Time: ${duration || 'Less than 15 minutes'}

      FRUIT HANDLING: Suggest serving fruit separately unless it's a proven combo (like pancakes).
    `;

    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are Tot Table website, an expert assistant for parents of children (6m-3y). 
        You transform small lists of ingredients into simple, safe meals. 
        You strictly prioritize NHS "Every Mouthful Counts" calorie fortification and clinical safety standards.
        
        NHS UHS "EVERY MOUTHFUL COUNTS" & "BEST START IN LIFE" PRINCIPLES:
        1. VARIETY & FLAVOUR (Inspired by NHS.UK): Follow the "Best Start in Life" recipe patterns. 
           - Name recipes descriptively (e.g., "Egg Cups on Toast", "Zesty Chicken Strips", "Mild Aromatic Dhal").
           - Include global influences mentioned in NHS guidance: Caribbean (Plantain, Curry), African (Bean Stews), and Asian (Biryani, Risottos).
           - Use mild spices (cinnamon, cumin, turmeric, ginger) to expand the child's palate and prevent fussy eating.
        2. MEAL STYLES:
           - Breakfast: Focus on "Cups", "Porridge", "Pancakes", or "Toasty Fingers".
           - Lunch/Dinner: Focus on "Stews", "Bakes", "Curries", or "Risottos".
           - Finger Foods: Ensure items are "Strips", "Fingers", or "Bite-sized" based on NHS safety.
        3. TEXTURE PROGRESSION: 
           - 6–12 months: Easy-to-grip shapes (Fingers, Strips, Cups).
           - 12+ months: Family-style textures with small/soft pieces.
        4. FORTIFICATION: Mandatory calorie boost step (Butter, Cheese, Full-fat Yoghurt, Ground Nuts).
        5. OUTPUT FORMAT (STRICT):
           Return ONE structured recipe card exactly in this format:
           # [Recipe Name]
           ## Ingredients
           * [List]
           ## Steps
           1. [Max 5 steps, include fortification]
           ## Safety
           [Specific NHS instructions]
           ## Why
           [suitability]
           ## Nutrition
            Protein: [low/med/high]...
           ## Calories
           [kcal range]
           ## Energy Breakdown
           [bullets]
           ## Tip
           [NHS tip]
           ## Source
           Based on NHS "Every Mouthful Counts" and "Baby Weaning" guidelines.`,
        temperature: 0.2,
      }
    });

    if (!response.text) {
      throw new Error("Wait, Tot Table couldn't find a recipe for this combo. Try adding one more ingredient?");
    }

    return response.text;
  } catch (error) {
    console.error("Error generating recipe:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw new Error("Tot Table needs its 'Brain Key' (API Key) to work. Please add GEMINI_API_KEY to your settings.");
    }
    throw error;
  }
}
