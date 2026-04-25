
import { InventoryItem, Inventory, Recipe, UserProfile } from '../types';
import { SYSTEM_PROMPT_CORE, INVENTORY_CATEGORIES } from '../constants';

const BASE_URL = 'https://openrouter.ai/api/v1';
const IMPORT_MODEL = 'google/gemini-2.5-flash-lite';
const RECIPE_MODEL = 'anthropic/claude-sonnet-4-6';

const getApiKey = () => {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) throw new Error('VITE_OPENROUTER_API_KEY is not set in .env.local');
    return key;
};

const CATEGORY_LIST = INVENTORY_CATEGORIES.join(', ');

export const importInventoryFromReceipt = async (
    type: 'image' | 'pdf',
    content: string,
    mimeType: string
): Promise<InventoryItem[]> => {
    const prompt = `Extrahiere alle Lebensmittel von dieser Rechnung oder Quittung. Ignoriere Pfand, Rabatte, Kassenbon-Nummern, Zwischensummen und Nicht-Lebensmittel.
Für jeden erkennbaren Lebensmittel-Posten:
- name: Produktname auf Deutsch, sauber und kurz (ohne Markennamen wenn möglich)
- amount: numerische Menge (falls nicht erkennbar: 1)
- unit: Einheit wie g, kg, ml, l, Stück, Packung, Dose usw. (falls nicht erkennbar: "Stück")
- category: GENAU eine der folgenden Kategorien: ${CATEGORY_LIST}

Gib JSON zurück mit dieser Struktur:
{"items": [{"name": string, "amount": number, "unit": string, "category": string}]}`;

    const fileContent = type === 'pdf'
        ? { type: 'file', file: { filename: 'receipt.pdf', file_data: `data:${mimeType};base64,${content}` } }
        : { type: 'image_url', image_url: { url: `data:${mimeType};base64,${content}` } };

    const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }, fileContent] }];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: IMPORT_MODEL,
            messages,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Importieren (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const raw: string | null | undefined = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Keine Antwort vom Modell erhalten. Bitte erneut versuchen.');

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
        throw new Error('Ungültige Antwort vom Modell. Bitte erneut versuchen.');
    }

    const now = new Date().toISOString();
    return (parsed.items as any[]).map((item, i): InventoryItem => ({
        id: `receipt_${Date.now()}_${i}`,
        name: String(item.name || '').trim() || 'Unbekannt',
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 1,
        unit: String(item.unit || 'Stück').trim(),
        category: INVENTORY_CATEGORIES.includes(item.category) ? item.category : 'Sonstiges',
        addedAt: now,
    })).filter(item => item.name !== 'Unbekannt' || true); // keep all, even unknowns
};

export const generateRecipesFromInventory = async (
    inventory: Inventory,
    users: UserProfile[]
): Promise<Recipe[]> => {
    if (inventory.items.length === 0) {
        throw new Error('Das Inventar ist leer. Füge zuerst Zutaten hinzu.');
    }

    const inventoryList = inventory.items
        .map(i => `- ${i.name}: ${i.amount} ${i.unit}`)
        .join('\n');

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
        ? `\nDiätanforderungen des Haushalts (MÜSSEN eingehalten werden):\n${dietaryConstraints.join('\n')}\n`
        : '';

    const schemaDescription = `
Gib JSON zurück mit exakt dieser Struktur:
{
  "recipes": [
    {
      "id": string (z.B. "inv_recipe_1"),
      "name": string,
      "ingredients": [{ "name": string, "amount": number, "unit": string }],
      "instructions": string[],
      "calories": number,
      "cookingTime": number,
      "tags": string[]
    }
  ]
}`;

    const prompt = `Erstelle genau 3 verschiedene, vollständige Rezepte, die AUSSCHLIESSLICH die folgenden Zutaten aus dem Inventar verwenden.
Verwende KEINE Zutaten, die nicht im Inventar stehen — also auch nicht Salz, Öl, Wasser oder andere Grundzutaten, es sei denn sie stehen ausdrücklich unten.
${constraintsBlock}
Aktuelles Inventar:
${inventoryList}

Regeln:
- Jedes Rezept muss sich auf mindestens 3 Inventarzutaten stützen
- Die 3 Rezepte sollen unterschiedlich sein (verschiedene Hauptzutaten oder Zubereitungsarten)
- Realistische Mengen verwenden (nicht das gesamte Inventar aufbrauchen)
- Auf Deutsch

${schemaDescription}`;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: RECIPE_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_CORE },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Generieren (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const raw: string | null | undefined = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Keine Antwort vom Modell erhalten.');

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed?.recipes || !Array.isArray(parsed.recipes)) {
        throw new Error('Ungültige Antwort vom Modell.');
    }

    return parsed.recipes.map((r: any): Recipe => ({
        id: r.id || `inv_recipe_${Date.now()}_${Math.random()}`,
        name: String(r.name || 'Rezept'),
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: Array.isArray(r.instructions) ? r.instructions : [],
        calories: typeof r.calories === 'number' ? r.calories : 0,
        cookingTime: typeof r.cookingTime === 'number' ? r.cookingTime : 30,
        tags: Array.isArray(r.tags) ? r.tags : [],
        source: 'ai',
    }));
};
