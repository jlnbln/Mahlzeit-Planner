
import * as gemini from './geminiService';
import * as openrouter from './openrouterService';

// Set VITE_AI_PROVIDER=gemini in .env.local to use Gemini instead of OpenRouter
const provider = import.meta.env.VITE_AI_PROVIDER || 'openrouter';

const service = provider === 'gemini' ? gemini : openrouter;

export const generateWeeklyPlan = service.generateWeeklyPlan;
export const generateShoppingList = service.generateShoppingList;
export const generateAlternativeRecipes = service.generateAlternativeRecipes;
export const generateICalString = service.generateICalString;
