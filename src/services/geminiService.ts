export async function generateRecipe(ageGroup: string, ingredients: string, allergies: string, equipment: string, duration: string) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ageGroup, ingredients, allergies, equipment, duration }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate recipe. Please ensure your GEMINI_API_KEY is set in Vercel.");
    }

    const data = await response.json();
    return data.recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
}
