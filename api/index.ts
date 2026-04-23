import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const router = express.Router();

// Health check for testing
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Route for Recipe Generation
router.post("/generate", async (req, res) => {
  try {
    const { ageGroup, ingredients, allergies, equipment, duration } = req.body;
    
    // 1. Backend Validation
    if (!ingredients || ingredients.trim().length < 3) {
      return res.status(400).json({ error: "Please add a few more ingredients to help Tot Table think!" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in server environment");
      return res.status(500).json({ error: "Tot Table needs its 'Brain Key' (API Key) to work. Please add GEMINI_API_KEY to your settings." });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 2. Stable Generation with System Instructions
    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents: `
      USER CONTEXT:
      - Age Group: ${ageGroup}
      - Ingredients: ${ingredients}
      - Allergies: ${allergies}
      - Equipment: ${equipment || 'Any available'}
      - Time: ${duration || 'Less than 15 minutes'}

      FRUIT HANDLING: Suggest serving fruit separately unless it's a proven combo (like pancakes).
      `,
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

    res.json({ recipe: response.text });

  } catch (err) {
    console.error("Recipe generation error:", err);
    res.status(500).json({ error: "The Tot Table kitchen is a bit busy. Please try again!" });
  }
});

app.use("/api", router);

export default app;
