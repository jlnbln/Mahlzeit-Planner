
import { Diet, Goal, UserProfile, AppSettings } from "./types";

export const CUISINES = [
  'Keine Präferenz', 
  'Deutsch (Gutbürgerlich)', 
  'Italienisch', 
  'Asiatisch', 
  'Mexikanisch', 
  'Griechisch', 
  'Indisch', 
  'Französisch', 
  'Amerikanisch', 
  'Orientalisch', 
  'Mediterran',
  'Skandinavisch',
  'Spanisch',
  'Türkisch'
];

export const DEFAULT_USER: UserProfile = {
  id: 'user_1',
  name: 'Benutzer 1',
  diet: Diet.None,
  calories: 2200,
  goal: Goal.Maintain,
  allergies: '',
  dislikes: '',
  favoriteCuisine: 'Keine Präferenz',
  budget: 100,
  homeTimes: {
    'Montag_Frühstück': true, 'Montag_Mittagessen': true, 'Montag_Abendessen': true,
    'Dienstag_Frühstück': true, 'Dienstag_Mittagessen': true, 'Dienstag_Abendessen': true,
    'Mittwoch_Frühstück': true, 'Mittwoch_Mittagessen': true, 'Mittwoch_Abendessen': true,
    'Donnerstag_Frühstück': true, 'Donnerstag_Mittagessen': true, 'Donnerstag_Abendessen': true,
    'Freitag_Frühstück': true, 'Freitag_Mittagessen': true, 'Freitag_Abendessen': true,
    'Samstag_Frühstück': true, 'Samstag_Mittagessen': true, 'Samstag_Abendessen': true,
    'Sonntag_Frühstück': true, 'Sonntag_Mittagessen': true, 'Sonntag_Abendessen': true,
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  preferredStore: 'Rewe',
  theme: 'light',
  useThermomix: false,
  useLeftovers: false,
  weekStartDay: 'Montag',
  includeWeekends: true
};

export const DAYS_OF_WEEK = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export const SYSTEM_PROMPT_CORE = `
You are the intelligent planning engine for a German household food-planning app. Your job is to generate weekly meal plans, revise them, and create shopping lists.

**GERMAN LOCALIZATION REQUIREMENTS**
Everything must be:
- In German
- Using German ingredients (e.g., Quark, Frischkäse, Haferflocken)
- Using German measurements (g, ml, TL, EL)
- Using German meal names
- Recipes should be culturally and practically suitable for Germany (Rewe-available ingredients).

**WEEKLY MEAL PLAN GENERATION LOGIC**
1. Consider ALL user profiles provided.
2. Ensure meals align with dietary needs, allergies, dislikes, calorie targets.
3. VARIETY IS MANDATORY: No main ingredient (e.g. pasta, chicken, potatoes) may appear more than TWICE across the entire week. No cuisine type may dominate — spread across at least 3–4 different cuisines or cooking styles.
4. PASTA LIMIT: At most ONE pasta dish per week across all meal types.
5. Ensure meals are healthy, balanced, and realistic. Aim for varied protein sources (fish, legumes, eggs, meat, dairy) across the week.
6. Generate Frühstück, Mittagessen, Abendessen only if users are home.
7. Fit within the combined weekly budget.

**OUTPUT FORMAT**
You must return valid JSON strictly matching the schema requested.
`;

export const INVENTORY_CATEGORIES = [
  'Obst & Gemüse',
  'Molkereiprodukte & Kühlregal',
  'Fleisch, Wurst & Fisch',
  'Backwaren & Brot',
  'Trockensortiment & Vorrat',
  'Getränke',
  'Tiefkühlkost',
  'Gewürze & Grundzutaten',
  'Sonstiges',
];

export const SHOPPING_CATEGORIES = [
  'Obst & Gemüse',
  'Kühlprodukte',
  'Milchprodukte',
  'Fleisch/Alternativen',
  'Trockene Lebensmittel',
  'Gewürze & Grundzutaten',
  'Getränke',
  'Tiefkühlware',
  'Sonstiges'
];