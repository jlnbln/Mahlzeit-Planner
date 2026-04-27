
import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyPlan, ShoppingList, Recipe, GenerationRequestProfile, RecipePreferences, AppSettings, UserProfile } from "../types";
import { SYSTEM_PROMPT_CORE, SHOPPING_CATEGORIES, DAYS_OF_WEEK } from "../constants";

// --- Helpers for API Client ---

const getApiKey = () => {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error('VITE_GEMINI_API_KEY is not set in .env.local');
    return key;
};

const getClient = () => {
    const apiKey = getApiKey();
    return new GoogleGenAI({ apiKey });
};

// --- Schemas ---
const IngredientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    unit: { type: Type.STRING },
  },
  required: ["name", "amount", "unit"],
};

const RecipeSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: IngredientSchema },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    calories: { type: Type.NUMBER },
    cookingTime: { type: Type.NUMBER, description: "Preparation and cooking time in minutes" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["name", "ingredients", "instructions", "calories", "cookingTime", "tags"],
};

const MealSlotSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING },
    recipe: RecipeSchema,
    eaters: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of User IDs" },
  },
  required: ["type", "recipe", "eaters"],
};

const DayPlanSchema = {
  type: Type.OBJECT,
  properties: {
    day: { type: Type.STRING },
    meals: { type: Type.ARRAY, items: MealSlotSchema },
  },
  required: ["day", "meals"],
};

const WeeklyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    weekId: { type: Type.STRING },
    days: { type: Type.ARRAY, items: DayPlanSchema },
    generatedAt: { type: Type.STRING },
  },
  required: ["days"],
};

const ShoppingItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    unit: { type: Type.STRING },
    category: { type: Type.STRING },
  },
  required: ["name", "amount", "unit", "category"],
};

const ShoppingListResponseSchema = {
  type: Type.OBJECT,
  properties: {
    items: { type: Type.ARRAY, items: ShoppingItemSchema },
    estimatedTotal: { type: Type.NUMBER },
  },
  required: ["items", "estimatedTotal"],
};

const AlternativeRecipesResponseSchema = {
    type: Type.OBJECT,
    properties: {
        alternatives: { type: Type.ARRAY, items: RecipeSchema }
    },
    required: ["alternatives"]
};

// --- Helper for JSON parsing ---
const cleanAndParseJSON = (text: string) => {
    const cleaned = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
};

// --- Functions ---

export const generateWeeklyPlan = async (
    profiles: GenerationRequestProfile[], 
    startDate: string,
    preferences: RecipePreferences,
    settings: AppSettings
): Promise<WeeklyPlan> => {
  const ai = getClient();
  
  const contextData = profiles.map(p => ({
      id: p.user.id,
      name: p.user.name,
      diet: p.user.diet,
      allergies: p.user.allergies,
      dislikes: p.user.dislikes,
      calories: p.user.calories,
      favoriteCuisine: p.user.favoriteCuisine || 'Keine Präferenz',
      activeTimes: p.activeTimes
  }));

  const customRecipeContext = preferences.customRecipes.map(r => 
    `Name: "${r.name}", Tags: ${r.tags.join(', ')}, Calories: ${r.calories}, Time: ${r.cookingTime || 30}min`
  ).join('; ');

  const thermomixContext = settings.useThermomix 
        ? "KITCHEN EQUIPMENT: The user has a Thermomix. You SHOULD include some recipes that specifically use the Thermomix. RULES FOR THERMOMIX RECIPES: 1) Must include the tag 'Thermomix'. 2) Do NOT include the word 'Thermomix' in the recipe name."
        : "";

  const leftoversContext = settings.useLeftovers
        ? "LEFTOVERS STRATEGY ENABLED: You may schedule 'Reste vom Vortag' (Leftovers) for LUNCH slots. If you do this: 1) The Dinner of the PREVIOUS day must be a large portion suitable for reheating. 2) The Leftover entry for lunch should have the name 'Reste: [Name of yesterday's dinner]', ingredients should be empty [] (to avoid duplicate shopping items), and cookingTime: 5."
        : "";

  const orderedDays = [];
  let startIndex = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
  if (startIndex === -1) startIndex = 0;
  
  for(let i=0; i<7; i++) {
      const dayName = DAYS_OF_WEEK[(startIndex + i) % 7];
      if (!settings.includeWeekends && (dayName === 'Samstag' || dayName === 'Sonntag')) continue;
      orderedDays.push(dayName);
  }

  const prompt = `
    Generate a meal plan for a household.
    
    PLANNING SCHEDULE:
    The plan starts on ${settings.weekStartDay} (${startDate}).
    You MUST generate entries ONLY for the following days: ${orderedDays.join(', ')}.

    HOUSEHOLD LOGIC (CRITICAL):
    - Create EXACTLY ONE recipe per meal slot (Breakfast, Lunch, Dinner).
    - The recipe must be suitable for ALL users present at that meal.
    - If no users are active for a specific slot, do not generate a meal for that slot.

    LEARNING & PREFERENCES (CRITICAL):
    - USER'S CUSTOM RECIPE LIBRARY (use for inspiration only): ${customRecipeContext}
    - You MAY include recipes from the CUSTOM RECIPE LIBRARY, but AT MOST 2 recipes from the entire library across the whole week plan. The majority of the plan MUST be freshly invented recipes.
    - If you choose a recipe from the library, you MUST use the EXACT NAME provided in quotes.
    - FAVORITES (max 2 total across the week): ${preferences.favorites.join(', ')}
    - HIGHLY RATED (use sparingly for inspiration): ${preferences.highlyRated.join(', ')}
    - DISLIKED (never include): ${preferences.disliked.join(', ')}

    VARIETY RULES (STRICT — violations will make the plan unusable):
    - No single main ingredient (pasta, chicken, potatoes, rice, etc.) may appear more than TWICE across the entire week.
    - Maximum ONE pasta dish for the entire week.
    - Use at least 3 different protein sources across dinners (e.g. fish, legumes, beef, eggs).
    - Vary the cuisine/cooking style — do not default to Italian. Mix German, Asian, Mediterranean, etc.
    - ${thermomixContext}
    - ${leftoversContext}

    Users Context:
    ${JSON.stringify(contextData, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT_CORE,
        responseMimeType: "application/json",
        responseSchema: WeeklyPlanSchema,
        temperature: 0.7,
      },
    });

    const plan = cleanAndParseJSON(response.text) as WeeklyPlan;
    plan.startDate = startDate;
    return plan;
  } catch (error: any) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

export const generateShoppingList = async (plan: WeeklyPlan, storeName: string): Promise<ShoppingList> => {
  const ai = getClient();
  
  const prompt = `
    Based on the following weekly meal plan, generate a consolidated shopping list.
    Merge identical ingredients.
    Categorize them strictly into German grocery categories.
    Estimate the total price in Euro based on prices at ${storeName} in Germany.

    Plan JSON:
    ${JSON.stringify(plan)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT_CORE,
        responseMimeType: "application/json",
        responseSchema: ShoppingListResponseSchema,
      },
    });

    const data = cleanAndParseJSON(response.text);
    return {
      items: data.items.map((i: any) => ({ ...i, checked: false })),
      estimatedTotal: data.estimatedTotal
    };

  } catch (error: any) {
    console.error("Error generating shopping list:", error);
    throw error;
  }
};

export const generateAlternativeRecipes = async (users: UserProfile[], currentRecipeName: string, mealType: string, weekRecipes: string[] = []): Promise<Recipe[]> => {
    const ai = getClient();

    // Build dietary constraints from all household members
    const dietaryConstraints = users
        .map(u => {
            const parts: string[] = [];
            if (u.diet && u.diet !== 'Keine Einschränkung') parts.push(u.diet);
            if (u.allergies) parts.push(`Allergien: ${u.allergies}`);
            if (u.dislikes) parts.push(`mag nicht: ${u.dislikes}`);
            return parts.length ? `${u.name}: ${parts.join(', ')}` : null;
        })
        .filter(Boolean);

    const constraintsBlock = dietaryConstraints.length
        ? `\nHousehold dietary requirements (MUST be respected for all recipes):\n${dietaryConstraints.join('\n')}\n`
        : '';

    const weekContext = weekRecipes.length
        ? `\nRECIPES ALREADY IN THIS WEEK'S PLAN (do NOT repeat or closely resemble any of these):\n${weekRecipes.map(r => `- ${r}`).join('\n')}\n`
        : '';

    const prompt = `
      The user wants to ${currentRecipeName ? `replace the recipe "${currentRecipeName}" for` : 'add a new recipe for'} ${mealType}.
      Generate 5 DISTINCT, HEALTHY alternative recipes.
      ${constraintsBlock}${weekContext}
      The alternatives must fill a nutritional gap in the existing week plan — consider what proteins, vegetables, and cuisines are already represented and choose something that complements the week.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT_CORE,
                responseMimeType: "application/json",
                responseSchema: AlternativeRecipesResponseSchema
            }
        });
         const data = cleanAndParseJSON(response.text);
         return data.alternatives;
    } catch (e) {
        console.error("Error generating alternatives", e);
        throw e;
    }
}

export const generateICalString = async (plan: WeeklyPlan): Promise<string> => {
    const ai = getClient();
    
    const prompt = `
      Convert the following weekly meal plan into a standard valid iCalendar (.ics) format string.
      The plan starts on ${plan.startDate}.
      
      Plan Data:
      ${JSON.stringify(plan)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: "You are a data conversion bot. Output only the raw ICS file content. No markdown formatting.",
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Error generating ICS", e);
        throw e;
    }
}
