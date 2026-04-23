export async function generateRecipe(ageGroup: string, ingredients: string, allergies: string, equipment: string, duration: string) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ageGroup, ingredients, allergies, equipment, duration }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate recipe on server");
    }

    const data = await response.json();
    return data.recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
}
