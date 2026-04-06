
import { WeeklyPlan, ShoppingList, Recipe, GenerationRequestProfile, RecipePreferences, AppSettings, UserProfile } from "../types";
import { SYSTEM_PROMPT_CORE, DAYS_OF_WEEK } from "../constants";

const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'anthropic/claude-sonnet-4-6';

const getApiKey = () => {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) throw new Error('VITE_OPENROUTER_API_KEY is not set in .env.local');
    return key;
};

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content: string = data.choices[0].message.content;
    // Strip markdown code fences if the model wraps the JSON in ```json ... ```
    return content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

async function callOpenRouterRaw(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

export const generateWeeklyPlan = async (
    profiles: GenerationRequestProfile[],
    startDate: string,
    preferences: RecipePreferences,
    settings: AppSettings
): Promise<WeeklyPlan> => {
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
    for (let i = 0; i < 7; i++) {
        const dayName = DAYS_OF_WEEK[(startIndex + i) % 7];
        if (!settings.includeWeekends && (dayName === 'Samstag' || dayName === 'Sonntag')) continue;
        orderedDays.push(dayName);
    }

    const schemaDescription = `
Return a JSON object with this exact structure:
{
  "weekId": string,
  "generatedAt": string (ISO timestamp),
  "days": [
    {
      "day": string (German day name),
      "meals": [
        {
          "type": string (e.g. "Frühstück", "Mittagessen", "Abendessen"),
          "eaters": string[] (list of user IDs),
          "recipe": {
            "id": string (unique, e.g. "recipe_1"),
            "name": string,
            "ingredients": [{ "name": string, "amount": number, "unit": string }],
            "instructions": string[],
            "calories": number,
            "cookingTime": number (minutes),
            "tags": string[]
          }
        }
      ]
    }
  ]
}`;

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
- USER'S CUSTOM RECIPE LIBRARY: ${customRecipeContext}
- You are STRONGLY ENCOURAGED to reuse recipes from the CUSTOM RECIPE LIBRARY provided above.
- If you choose a recipe from the library, you MUST use the EXACT NAME provided in quotes.
- FAVORITES: ${preferences.favorites.join(', ')}
- HIGHLY RATED: ${preferences.highlyRated.join(', ')}
- DISLIKED: ${preferences.disliked.join(', ')}
- ${thermomixContext}
- ${leftoversContext}

Users Context:
${JSON.stringify(contextData, null, 2)}

${schemaDescription}`;

    try {
        const text = await callOpenRouter(SYSTEM_PROMPT_CORE, prompt);
        const plan = JSON.parse(text) as WeeklyPlan;
        plan.startDate = startDate;
        return plan;
    } catch (error: any) {
        console.error("OpenRouter: Error generating plan:", error);
        throw error;
    }
};

export const generateShoppingList = async (plan: WeeklyPlan, storeName: string): Promise<ShoppingList> => {
    const schemaDescription = `
Return a JSON object with this exact structure:
{
  "items": [
    {
      "name": string,
      "amount": number,
      "unit": string,
      "category": string (German grocery category)
    }
  ],
  "estimatedTotal": number (total price in Euro)
}`;

    const prompt = `
Based on the following weekly meal plan, generate a consolidated shopping list.
Merge identical ingredients.
Categorize them strictly into German grocery categories using EXACTLY these category names in this order (the order of a typical German supermarket layout):
1. "Obst & Gemüse"
2. "Backwaren & Brot"
3. "Molkereiprodukte & Kühlregal"
4. "Fleisch, Wurst & Fisch"
5. "Trockensortiment & Vorrat"
6. "Getränke & Snacks"
7. "Drogerie & Haushalt"
8. "Tiefkühlkost"

CRITICAL: The "items" array in the response MUST be sorted so that all items of category 1 come first, then all items of category 2, and so on — matching the supermarket aisle order listed above.
Estimate the total price in Euro based on prices at ${storeName} in Germany.

Plan JSON:
${JSON.stringify(plan)}

${schemaDescription}`;

    try {
        const text = await callOpenRouter(SYSTEM_PROMPT_CORE, prompt);
        const data = JSON.parse(text);
        return {
            items: data.items.map((i: any) => ({ ...i, checked: false })),
            estimatedTotal: data.estimatedTotal
        };
    } catch (error: any) {
        console.error("OpenRouter: Error generating shopping list:", error);
        throw error;
    }
};

export const generateAlternativeRecipes = async (users: UserProfile[], currentRecipeName: string, mealType: string): Promise<Recipe[]> => {
    const schemaDescription = `
Return a JSON object with this exact structure:
{
  "alternatives": [
    {
      "id": string (unique, e.g. "alt_1"),
      "name": string,
      "ingredients": [{ "name": string, "amount": number, "unit": string }],
      "instructions": string[],
      "calories": number,
      "cookingTime": number (minutes),
      "tags": string[]
    }
  ]
}`;

    const prompt = `
The user wants to replace the recipe "${currentRecipeName}" for ${mealType}.
Generate 5 DISTINCT, HEALTHY alternative recipes.

${schemaDescription}`;

    try {
        const text = await callOpenRouter(SYSTEM_PROMPT_CORE, prompt);
        const data = JSON.parse(text);
        return data.alternatives;
    } catch (error: any) {
        console.error("OpenRouter: Error generating alternatives:", error);
        throw error;
    }
};

export const generateICalString = async (plan: WeeklyPlan): Promise<string> => {
    const prompt = `
Convert the following weekly meal plan into a standard valid iCalendar (.ics) format string.
The plan starts on ${plan.startDate}.

Plan Data:
${JSON.stringify(plan)}`;

    try {
        return await callOpenRouterRaw(
            "You are a data conversion bot. Output only the raw ICS file content. No markdown formatting, no explanations, just the ICS content starting with BEGIN:VCALENDAR.",
            prompt
        );
    } catch (error: any) {
        console.error("OpenRouter: Error generating ICS:", error);
        throw error;
    }
};
