
import React, { useState, useEffect } from 'react';
import { UserProfile, WeeklyPlan, ShoppingList, Recipe, AppSettings, RecipePreferences, GenerationRequestProfile, Ingredient, MealSlot, MealType } from './types';
import { DEFAULT_USER, DEFAULT_SETTINGS, DAYS_OF_WEEK } from './constants';
import { generateWeeklyPlan, generateShoppingList, generateAlternativeRecipes, generateICalString, importRecipeFromSource } from './services/aiService';

// Firebase Imports
import { db, auth } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

// Icons
import {
  Users, Calendar, ShoppingCart, ChefHat,
  Heart, Loader2, Home, Settings, Sparkles
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import PlanDetail from './components/PlanDetail';
import ShoppingListView from './components/ShoppingList';
import { UserList, UserEdit } from './components/UserViews';
import SettingsView from './components/Settings';
import Favorites from './components/Favorites';
import { RecipeFormModal, GenerationModal, RecipeDetailModal, ReplacementModal, FavoritePickerModal, ResetConfirmModal, RecipeImportModal, AddMealModal } from './components/Modals';
import { Auth } from './components/Auth';

// --- Helpers ---
const toLocalIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getStartOfWeek = (date: Date, startDayName: string) => {
    const targetIndex = DAYS_OF_WEEK.indexOf(startDayName);
    const currentDayIndex = (date.getDay() + 6) % 7;
    let daysToSubtract = 0;
    if (currentDayIndex >= targetIndex) {
        daysToSubtract = currentDayIndex - targetIndex;
    } else {
        daysToSubtract = 7 - (targetIndex - currentDayIndex);
    }
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - daysToSubtract);
    newDate.setHours(0,0,0,0);
    return newDate;
};

type ViewState = 'dashboard' | 'user_list' | 'user_edit' | 'plan' | 'shopping' | 'favorites' | 'settings';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [plans, setPlans] = useState<Record<string, WeeklyPlan>>({});
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => getStartOfWeek(new Date(), DEFAULT_SETTINGS.weekStartDay));
  const currentViewDateIso = toLocalIso(currentViewDate);
  const activePlan = plans[currentViewDateIso];
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [activeTabDay, setActiveTabDay] = useState<string>('Montag');
  const [showGenModal, setShowGenModal] = useState(false);
  const [genModalInitialDate, setGenModalInitialDate] = useState<Date | undefined>(undefined);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showFavPicker, setShowFavPicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [replacementCandidates, setReplacementCandidates] = useState<Recipe[]>([]);
  const [replacementTarget, setReplacementTarget] = useState<{dayIndex: number, mealType: string, currentName: string} | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [addMealContext, setAddMealContext] = useState<{ dayIndex: number; mealType: string } | null>(null);
  const [isMealAddMode, setIsMealAddMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
      setCurrentViewDate(getStartOfWeek(new Date(), settings.weekStartDay));
  }, [settings.weekStartDay]);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'households', user.uid);
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profiles) setUsers(data.profiles);
            if (data.plans) setPlans(data.plans);
            if (data.shoppingList) setShoppingList(data.shoppingList);
            if (data.settings) setAppSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            if (data.savedRecipes) setSavedRecipes(data.savedRecipes);
        } else {
            const initialUsers = [DEFAULT_USER];
            setUsers(initialUsers);
            saveToFirebase(initialUsers, {}, null, DEFAULT_SETTINGS, [], user.uid);
        }
    }, (error) => {
        console.error("Firebase Read Error:", error);
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  const saveToFirebase = async (
      newUsers: UserProfile[],
      newPlans: Record<string, WeeklyPlan>,
      newList: ShoppingList | null,
      newSettings: AppSettings,
      newSavedRecipes: Recipe[],
      explicitId?: string
  ) => {
      const targetId = explicitId || (user ? user.uid : null);
      if (!targetId) return;
      try {
          await setDoc(doc(db, 'households', targetId), {
              profiles: newUsers,
              plans: newPlans,
              shoppingList: newList,
              settings: newSettings,
              savedRecipes: newSavedRecipes,
              updatedAt: new Date().toISOString()
          }, { merge: true });
      } catch (e: any) {
          console.error("Error saving to Firebase", e);
      }
  };

  const handleResetDatabase = async () => {
      if (!user) return;
      setLoading(true);
      setLoadingMessage('Datenbank wird zurückgesetzt...');
      try {
          setUsers([DEFAULT_USER]);
          setPlans({});
          setShoppingList(null);
          setSavedRecipes([]);
          setAppSettings(DEFAULT_SETTINGS);
          setShowResetConfirm(false);
          await saveToFirebase([DEFAULT_USER], {}, null, DEFAULT_SETTINGS, [], user.uid);
          alert('Datenbank wurde erfolgreich zurückgesetzt.');
          setView('dashboard');
      } catch (e) {
          console.error(e);
          alert('Fehler beim Zurücksetzen der Datenbank.');
      } finally {
          setLoading(false);
      }
  };

  const handleSignOut = async () => {
      try {
          await signOut(auth);
          setView('dashboard');
      } catch (e) {
          console.error("Logout Error", e);
      }
  };

  const handleGoToDashboard = () => {
      setView('dashboard');
      setCurrentViewDate(getStartOfWeek(new Date(), settings.weekStartDay));
  };

  const navigateToPlan = () => {
      if (!activePlan) {
          const orderedDays: string[] = [];
          let startIdx = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
          if (startIdx === -1) startIdx = 0;
          for (let i = 0; i < 7; i++) {
              const dayName = DAYS_OF_WEEK[(startIdx + i) % 7];
              if (!settings.includeWeekends && (dayName === 'Samstag' || dayName === 'Sonntag')) continue;
              orderedDays.push(dayName);
          }
          const emptyPlan: WeeklyPlan = {
              weekId: `manual_${currentViewDateIso}`,
              startDate: currentViewDateIso,
              days: orderedDays.map(day => ({ day, meals: [] })),
              generatedAt: new Date().toISOString(),
          };
          const updatedPlans = { ...plans, [currentViewDateIso]: emptyPlan };
          setPlans(updatedPlans);
          saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
      }
      setView('plan');
  };

  const toggleViewDate = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentViewDate);
      if (direction === 'prev') newDate.setDate(newDate.getDate() - 7);
      else newDate.setDate(newDate.getDate() + 7);
      setCurrentViewDate(newDate);
  };

  const toggleMealCompletion = (dayName: string, mealType: string) => {
      if (!activePlan) return;
      const updatedPlans = { ...plans };
      const planToUpdate = { ...activePlan } as WeeklyPlan;
      planToUpdate.days = planToUpdate.days.map(d => {
          if (d.day === dayName) {
              return {
                  ...d,
                  meals: d.meals.map(m => {
                      if (m.type === mealType) return { ...m, completed: !m.completed };
                      return m;
                  })
              };
          }
          return d;
      });
      updatedPlans[planToUpdate.startDate] = planToUpdate;
      setPlans(updatedPlans);
      saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
  };

  const updateRecipeInPlan = (recipeToUpdate: Recipe, newProps: Partial<Recipe>) => {
    if (!activePlan) return;
    const updatedPlans = { ...plans };
    const planToUpdate = { ...activePlan } as WeeklyPlan;
    planToUpdate.days = planToUpdate.days.map(d => ({
      ...d,
      meals: d.meals.map(m => {
        if ((m.recipe.id && m.recipe.id === recipeToUpdate.id) || m.recipe.name === recipeToUpdate.name) {
          return { ...m, recipe: { ...m.recipe, ...newProps }};
        }
        return m;
      })
    }));
    updatedPlans[planToUpdate.startDate] = planToUpdate;
    setPlans(updatedPlans);
    const recipeNameMatch = recipeToUpdate.name;
    const updatedSaved = savedRecipes.map(r => r.name === recipeNameMatch ? { ...r, ...newProps } : r);
    setSavedRecipes(updatedSaved);
    saveToFirebase(users, updatedPlans, shoppingList, settings, updatedSaved);
    if (selectedRecipe && selectedRecipe.name === recipeToUpdate.name) {
        setSelectedRecipe({ ...selectedRecipe, ...newProps });
    }
  };

  const getAllFavoritedRecipes = (): Recipe[] => {
    const favs = new Map<string, Recipe>();
    (savedRecipes || []).forEach(r => { if (r.isFavorite) favs.set(r.name, r); });
    (Object.values(plans) as WeeklyPlan[]).forEach((plan: WeeklyPlan) => {
      plan.days.forEach(day => {
        day.meals.forEach(meal => {
          if (meal.recipe.isFavorite) favs.set(meal.recipe.name, meal.recipe);
        });
      });
    });
    return Array.from(favs.values());
  };

  const handleConfirmGeneration = async (targetDate: Date, attendance: Record<string, any>) => {
    setShowGenModal(false);
    setLoading(true);
    setLoadingMessage('KI erstellt deinen Wochenplan...');
    const startDate = getStartOfWeek(targetDate, settings.weekStartDay);
    const isoDate = toLocalIso(startDate);
    const requestProfiles: GenerationRequestProfile[] = users.map(u => ({
        user: u,
        activeTimes: attendance[u.id] || u.homeTimes
    }));

    const favorites = new Set<string>();
    const highlyRated = new Set<string>();
    const disliked = new Set<string>();
    (savedRecipes || []).forEach(r => {
         if (r.isFavorite) favorites.add(r.name);
         if (r.rating && r.rating >= 4) highlyRated.add(r.name);
    });
    (Object.values(plans) as WeeklyPlan[]).forEach(plan => {
        plan.days.forEach(day => {
           day.meals.forEach(meal => {
               const r = meal.recipe;
               if (r.isFavorite) favorites.add(r.name);
               if (r.rating && r.rating >= 4) highlyRated.add(r.name);
               if (r.rating && r.rating <= 2) disliked.add(r.name);
           });
        });
    });

    const currentSavedRecipes = savedRecipes || [];
    const prefs: RecipePreferences = {
         favorites: Array.from(favorites),
         highlyRated: Array.from(highlyRated),
         disliked: Array.from(disliked),
         customRecipes: currentSavedRecipes
    };

    try {
      const newPlan = await generateWeeklyPlan(requestProfiles, isoDate, prefs, settings);
      newPlan.days.forEach(day => {
          day.meals.forEach(meal => {
              const matchingSaved = currentSavedRecipes.find(r => r.name.toLowerCase() === meal.recipe.name.toLowerCase());
              if (matchingSaved) meal.recipe = { ...matchingSaved };
          });
      });
      const updatedPlans = { ...plans, [isoDate]: newPlan };
      setPlans(updatedPlans);
      let updatedList = shoppingList;
      if (isoDate === currentViewDateIso) {
          updatedList = null;
          setShoppingList(null);
      }
      await saveToFirebase(users, updatedPlans, updatedList, settings, currentSavedRecipes);
      setCurrentViewDate(startDate);
      setView('plan');
    } catch (error: any) {
      console.error(error);
      alert(`Fehler beim Generieren des Plans: ${error.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!activePlan) return;
    setLoading(true);
    setLoadingMessage(`Einkaufsliste wird erstellt...`);
    try {
      const list = await generateShoppingList(activePlan, settings.preferredStore);
      setShoppingList(list);
      saveToFirebase(users, plans, list, settings, savedRecipes);
      setView('shopping');
    } catch (error: any) {
      alert(`Fehler bei der Einkaufsliste: ${error.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = (partial: Partial<Recipe>) => {
    setEditingRecipe({ ...partial, id: `import_${Date.now()}`, source: 'manual', isFavorite: true } as Recipe);
    setShowImportModal(false);
    setShowAddRecipeModal(true);
  };

  const handleDeleteMeal = (dayIndex: number, mealIndex: number) => {
    if (!activePlan) return;
    const planToUpdate = { ...activePlan } as WeeklyPlan;
    planToUpdate.days = planToUpdate.days.map(d => ({ ...d, meals: [...d.meals] }));
    planToUpdate.days[dayIndex].meals.splice(mealIndex, 1);
    const updatedPlans = { ...plans, [planToUpdate.startDate]: planToUpdate };
    setPlans(updatedPlans);
    saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
  };

  const handleAddMealClick = (dayIndex: number) => {
    setAddMealContext({ dayIndex, mealType: '' });
    setShowAddMealModal(true);
  };

  const handleAddMealSourceSelected = async (mealType: string, source: 'favorites' | 'ai' | 'auto') => {
    setShowAddMealModal(false);

    // Reste: automatically pull previous day's dinner
    if (source === 'auto' && mealType === 'Reste') {
      if (!activePlan || !addMealContext) return;
      const dayIdx = addMealContext.dayIndex;
      if (dayIdx <= 0) {
        alert('Kein vorheriger Tag im Plan vorhanden.');
        setAddMealContext(null);
        return;
      }
      const prevDay = activePlan.days[dayIdx - 1];
      const prevDinner = prevDay?.meals.find(m => m.type === MealType.Dinner);
      if (!prevDinner) {
        alert(`Am ${prevDay?.day || 'vorherigen Tag'} gibt es kein Abendessen.`);
        setAddMealContext(null);
        return;
      }
      const planToUpdate = { ...activePlan } as WeeklyPlan;
      planToUpdate.days = planToUpdate.days.map(d => ({ ...d, meals: [...d.meals] }));
      planToUpdate.days[dayIdx].meals.push({
        type: MealType.Lunch,
        recipe: prevDinner.recipe,
        eaters: users.map(u => u.id),
        completed: false,
        isLeftover: true,
      });
      const updatedPlans = { ...plans, [planToUpdate.startDate]: planToUpdate };
      setPlans(updatedPlans);
      saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
      setAddMealContext(null);
      setIsMealAddMode(false);
      return;
    }

    setAddMealContext(prev => ({ ...prev!, mealType }));
    setIsMealAddMode(true);
    if (source === 'favorites') {
      setShowFavPicker(true);
    } else {
      setLoading(true);
      setLoadingMessage('KI sucht Vorschläge…');
      try {
        const alts = await generateAlternativeRecipes(users, '', mealType);
        setReplacementCandidates(alts);
        setShowReplaceModal(true);
      } catch (e: any) { alert(e.message); }
      finally { setLoading(false); }
    }
  };

  const handleAddMeal = (recipe: Recipe, dayName?: string, mealType?: string) => {
    if (!activePlan || !addMealContext) return;
    const resolvedDay = dayName || activePlan.days[addMealContext.dayIndex]?.day || '';
    const resolvedType = mealType || addMealContext.mealType;
    const planToUpdate = { ...activePlan } as WeeklyPlan;
    planToUpdate.days = planToUpdate.days.map(d => ({ ...d, meals: [...d.meals] }));
    const dayIndex = planToUpdate.days.findIndex(d => d.day === resolvedDay);
    if (dayIndex === -1) return;
    const newSlot: MealSlot = {
      type: resolvedType as MealType,
      recipe,
      eaters: users.map(u => u.id),
      completed: false,
    };
    planToUpdate.days[dayIndex].meals.push(newSlot);
    const updatedPlans = { ...plans, [planToUpdate.startDate]: planToUpdate };
    setPlans(updatedPlans);
    saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
    // For favorites picker: close immediately. For AI modal: keep open (handled by modal's Fertig button).
    if (showFavPicker) {
      setShowFavPicker(false);
      setIsMealAddMode(false);
      setAddMealContext(null);
    }
  };

  const handleSaveRecipe = (updatedRecipe: Partial<Recipe>) => {
    let updatedSaved;
    const isExistingRecipe = editingRecipe && savedRecipes.some(r => r.id === editingRecipe.id);
    if (isExistingRecipe) {
        updatedSaved = savedRecipes.map(r => r.id === editingRecipe!.id ? { ...r, ...updatedRecipe } as Recipe : r);
        const updatedPlans = { ...plans };
        Object.keys(updatedPlans).forEach(key => {
            updatedPlans[key].days = updatedPlans[key].days.map(d => ({
                ...d,
                meals: d.meals.map(m => {
                    if (m.recipe.id === editingRecipe!.id) {
                        return { ...m, recipe: { ...m.recipe, ...updatedRecipe } as Recipe };
                    }
                    return m;
                })
            }));
        });
        setPlans(updatedPlans);
        setSavedRecipes(updatedSaved);
        saveToFirebase(users, updatedPlans, shoppingList, settings, updatedSaved);
    } else {
        const final: Recipe = { ...updatedRecipe, id: `manual_${Date.now()}`, source: 'manual', isFavorite: true } as Recipe;
        updatedSaved = [...(savedRecipes || []), final];
        setSavedRecipes(updatedSaved);
        saveToFirebase(users, plans, shoppingList, settings, updatedSaved);
    }
    setEditingRecipe(null);
    setShowAddRecipeModal(false);
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
              <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#b8fd4b', boxShadow: '0 12px 32px rgba(184,253,75,0.4)' }}>
                      <ChefHat className="h-7 w-7" style={{ color: '#3d5e00' }} />
                  </div>
                  <Loader2 className="h-5 w-5 animate-spin-slow" style={{ color: 'var(--c-primary)' }} />
              </div>
          </div>
      );
  }

  if (!user) return <Auth />;

  const desktopTextNavItems = [
    { target: 'dashboard' as ViewState, label: 'Übersicht', onClick: handleGoToDashboard },
    { target: 'user_list' as ViewState, label: 'Profile' },
    { target: 'plan' as ViewState, label: 'Plan', onClick: navigateToPlan },
    { target: 'shopping' as ViewState, label: 'Einkauf', disabled: !shoppingList },
  ];

  const desktopIconNavItems = [
    { target: 'favorites' as ViewState, icon: Heart, title: 'Favoriten' },
    { target: 'settings' as ViewState, icon: Settings, title: 'Einstellungen' },
  ];

  const mobileNavItems = [
    { target: 'dashboard' as ViewState, label: 'Übersicht', icon: Home, onClick: handleGoToDashboard },
    { target: 'user_list' as ViewState, label: 'Profile', icon: Users },
    { target: 'plan' as ViewState, label: 'Plan', icon: Calendar, onClick: navigateToPlan },
    { target: 'shopping' as ViewState, label: 'Einkauf', icon: ShoppingCart, disabled: !shoppingList },
    { target: 'favorites' as ViewState, label: 'Favoriten', icon: Heart },
  ];

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>

      {/* ── Desktop / Mobile Header ─────────────────────────── */}
      <header className="app-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleGoToDashboard}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#b8fd4b' }}>
              <ChefHat className="h-4 w-4" style={{ color: '#3d5e00' }} />
            </div>
            <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--c-text)', letterSpacing: '-0.02em' }}>
              MahlzeitPlanner
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopTextNavItems.map(item => (
              <button
                key={item.target}
                onClick={(item as any).onClick || (() => setView(item.target))}
                disabled={(item as any).disabled}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-150
                  ${(item as any).disabled ? 'opacity-35 cursor-not-allowed' : ''}
                `}
                style={view === item.target
                  ? { background: 'var(--c-accent)', color: 'var(--c-on-accent)' }
                  : { color: 'var(--c-text-mid)' }
                }
              >
                {item.label}
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--c-border)' }} />
            {desktopIconNavItems.map(item => {
              const Icon = item.icon;
              const isActive = view === item.target;
              return (
                <button
                  key={item.target}
                  onClick={() => setView(item.target)}
                  title={item.title}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150"
                  style={isActive
                    ? { background: 'var(--c-accent)', color: 'var(--c-on-accent)' }
                    : { color: 'var(--c-text-mid)' }
                  }
                >
                  <Icon size={18} className={isActive && item.target === 'favorites' ? 'fill-current' : ''} />
                </button>
              );
            })}
          </nav>

          {/* Mobile header right side */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => setView('settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'var(--c-surface-low)', color: 'var(--c-text-mid)' }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:pb-10">

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--c-overlay)' }}>
            <div className="card p-6 flex flex-col items-center gap-4 animate-scale-in">
              <div className="relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#b8fd4b' }}>
                  <Sparkles className="h-6 w-6" style={{ color: '#3d5e00' }} />
                </div>
                <div className="absolute -inset-1.5 rounded-full border-2 border-transparent animate-spin-slow" style={{ borderTopColor: 'var(--c-primary)' }} />
              </div>
              <p className="text-sm font-semibold text-center max-w-[200px]" style={{ color: 'var(--c-text-mid)' }}>{loadingMessage}</p>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
            <Dashboard
                activePlan={activePlan}
                currentViewDate={currentViewDate}
                currentViewDateIso={currentViewDateIso}
                toggleViewDate={toggleViewDate}
                goToCurrentWeek={() => setCurrentViewDate(getStartOfWeek(new Date(), settings.weekStartDay))}
                initiateGeneration={() => setShowGenModal(true)}
                setView={setView}
                setActiveTabDay={setActiveTabDay}
                getWeekRangeString={(iso) => {
                    const parts = iso.split('-').map(Number);
                    const start = new Date(parts[0], parts[1] - 1, parts[2]);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    return `${start.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'})} – ${end.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'})}`;
                }}
                onSelectRecipe={setSelectedRecipe}
                onToggleMealCompletion={toggleMealCompletion}
                onCreateManually={navigateToPlan}
                settings={settings}
            />
        )}

        {view === 'user_list' && (
            <UserList
                users={users}
                onAdd={() => {
                    setTempUser({ ...DEFAULT_USER, id: `user_${Date.now()}`, name: `Neu ${users.length + 1}` });
                    setEditingUserId(null);
                    setView('user_edit');
                }}
                onEdit={(u) => {
                    setTempUser({ ...u });
                    setEditingUserId(u.id);
                    setView('user_edit');
                }}
            />
        )}

        {view === 'user_edit' && tempUser && (
            <UserEdit
                tempUser={tempUser}
                editingUserId={editingUserId}
                setTempUser={setTempUser}
                onSave={() => {
                     let updatedUsers;
                     if (editingUserId) updatedUsers = users.map(u => u.id === editingUserId ? tempUser : u);
                     else updatedUsers = [...users, tempUser];
                     setUsers(updatedUsers);
                     saveToFirebase(updatedUsers, plans, shoppingList, settings, savedRecipes);
                     setView('user_list');
                     setTempUser(null);
                }}
                onCancel={() => { setView('user_list'); setTempUser(null); }}
                onDelete={(id) => {
                    if (confirm('Profil wirklich löschen?')) {
                        const updatedUsers = users.filter(u => u.id !== id);
                        setUsers(updatedUsers);
                        saveToFirebase(updatedUsers, plans, shoppingList, settings, savedRecipes);
                        setView('user_list');
                    }
                }}
            />
        )}

        {view === 'plan' && activePlan !== undefined && (
            <PlanDetail
                plan={activePlan}
                activeTabDay={activeTabDay}
                setActiveTabDay={setActiveTabDay}
                settings={settings}
                initiateGeneration={() => setShowGenModal(true)}
                handleGenerateShoppingList={handleGenerateShoppingList}
                handleExportICal={async () => {
                    setLoading(true);
                    setLoadingMessage('iCal wird erstellt...');
                    try {
                        const ics = await generateICalString(activePlan);
                        const blob = new Blob([ics], { type: 'text/calendar' });
                        const a = document.createElement('a');
                        a.href = window.URL.createObjectURL(blob);
                        a.download = `mahlzeit_plan_${activePlan.startDate}.ics`;
                        a.click();
                    } catch(e) { alert("Fehler beim Export"); }
                    finally { setLoading(false); setLoadingMessage(''); }
                }}
                openReplaceModal={async (d, t, n) => {
                    setReplacementTarget({ dayIndex: d, mealType: t, currentName: n });
                    setLoading(true);
                    setLoadingMessage('KI sucht Alternativen...');
                    try {
                        const alts = await generateAlternativeRecipes(users, n, t);
                        setReplacementCandidates(alts);
                        setShowReplaceModal(true);
                    } catch (e: any) { alert(e.message); }
                    finally { setLoading(false); }
                }}
                openFavoriteReplaceModal={(d, t, n) => {
                    setReplacementTarget({ dayIndex: d, mealType: t, currentName: n });
                    setShowFavPicker(true);
                }}
                setSelectedRecipe={setSelectedRecipe}
                onPlanUpdate={(updatedPlan) => {
                    const updatedPlans = { ...plans, [updatedPlan.startDate]: updatedPlan };
                    setPlans(updatedPlans);
                    saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
                }}
                onAddMealClick={handleAddMealClick}
                onDeleteMeal={handleDeleteMeal}
            />
        )}

        {view === 'shopping' && shoppingList && (
            <ShoppingListView
                shoppingList={shoppingList}
                settings={settings}
                setShoppingList={(newList) => {
                    setShoppingList(newList);
                    saveToFirebase(users, plans, newList, settings, savedRecipes);
                }}
            />
        )}

        {view === 'settings' && (
            <SettingsView
                settings={settings}
                onUpdateSettings={(s) => {
                    setAppSettings(s);
                    saveToFirebase(users, plans, shoppingList, s, savedRecipes);
                }}
                onRequestReset={() => setShowResetConfirm(true)}
                onSignOut={handleSignOut}
            />
        )}

        {view === 'favorites' && (
             <Favorites
                recipes={getAllFavoritedRecipes()}
                onSelectRecipe={setSelectedRecipe}
                onEditRecipe={(recipe) => {
                    setEditingRecipe(recipe);
                    setShowAddRecipeModal(true);
                }}
                onAddManual={() => {
                    setEditingRecipe(null);
                    setShowAddRecipeModal(true);
                }}
                onImportRecipe={() => setShowImportModal(true)}
             />
        )}
        {/* Spacer for mobile bottom nav */}
        <div className="md:hidden" style={{ height: 'calc(5.5rem + env(safe-area-inset-bottom))' }} />
      </main>

      {/* ── Mobile Bottom Tab Bar (floating pill) ───────────── */}
      <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-30 px-5"
           style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="bottom-nav-pill justify-around px-2">
          {mobileNavItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.target;
            return (
              <button
                key={item.target}
                onClick={item.onClick || (() => !item.disabled && setView(item.target))}
                disabled={item.disabled}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-200
                  ${item.disabled ? 'opacity-30' : ''}
                  ${isActive ? 'rounded-full px-4 py-2 scale-105' : 'px-3 py-2 rounded-full'}
                `}
                style={isActive
                  ? { background: 'var(--c-accent)', color: 'var(--c-on-accent)' }
                  : { color: 'var(--c-text-dim)' }
                }
              >
                <Icon size={20} className={isActive ? 'fill-current' : ''} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Modals ──────────────────────────────────────────── */}
      {selectedRecipe && (
          <RecipeDetailModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onUpdate={(updated) => updateRecipeInPlan(selectedRecipe, updated)}
          />
      )}
      {showAddRecipeModal && (
          <RecipeFormModal
            onClose={() => { setShowAddRecipeModal(false); setEditingRecipe(null); }}
            initialRecipe={editingRecipe || undefined}
            onSave={handleSaveRecipe}
          />
      )}
      {showGenModal && (
          <GenerationModal
             onClose={() => setShowGenModal(false)}
             users={users}
             onConfirm={(date, att) => { handleConfirmGeneration(date, att); }}
             initialDate={genModalInitialDate}
             settings={settings}
          />
      )}
      {showReplaceModal && (isMealAddMode || replacementTarget) && (
          <ReplacementModal
             candidates={replacementCandidates}
             targetName={isMealAddMode ? (addMealContext?.mealType || '') : replacementTarget!.currentName}
             onSelect={(newR) => {
                 if (!isMealAddMode) {
                     const updatedPlans = { ...plans };
                     const planToUpdate = { ...activePlan } as WeeklyPlan;
                     planToUpdate.days[replacementTarget!.dayIndex].meals = planToUpdate.days[replacementTarget!.dayIndex].meals.map(m =>
                         m.type === replacementTarget!.mealType ? { ...m, recipe: newR } : m
                     );
                     updatedPlans[planToUpdate.startDate] = planToUpdate;
                     setPlans(updatedPlans);
                     saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
                     setShowReplaceModal(false);
                 }
             }}
             isAddMode={isMealAddMode}
             planDays={activePlan?.days.map(d => d.day)}
             initialDayName={addMealContext ? activePlan?.days[addMealContext.dayIndex]?.day : undefined}
             onAdd={(recipe, dayName, mealType) => handleAddMeal(recipe, dayName, mealType)}
             onClose={() => { setShowReplaceModal(false); setIsMealAddMode(false); setAddMealContext(null); }}
          />
      )}
      {showFavPicker && (isMealAddMode || replacementTarget) && (
          <FavoritePickerModal
              favorites={getAllFavoritedRecipes()}
              targetName={isMealAddMode ? (addMealContext?.mealType || '') : replacementTarget!.currentName}
              onSelect={(newR) => {
                if (isMealAddMode) {
                    handleAddMeal(newR);
                } else {
                    const updatedPlans = { ...plans };
                    const planToUpdate = { ...activePlan } as WeeklyPlan;
                    planToUpdate.days[replacementTarget!.dayIndex].meals = planToUpdate.days[replacementTarget!.dayIndex].meals.map(m =>
                        m.type === replacementTarget!.mealType ? { ...m, recipe: newR } : m
                    );
                    updatedPlans[planToUpdate.startDate] = planToUpdate;
                    setPlans(updatedPlans);
                    saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
                    setShowFavPicker(false);
                }
              }}
              onClose={() => { setShowFavPicker(false); setIsMealAddMode(false); setAddMealContext(null); }}
          />
      )}
      {showResetConfirm && (
          <ResetConfirmModal
             onConfirm={handleResetDatabase}
             onCancel={() => setShowResetConfirm(false)}
          />
      )}
      {showImportModal && (
          <RecipeImportModal
              onImport={handleImportSuccess}
              onClose={() => setShowImportModal(false)}
          />
      )}
      {showAddMealModal && (
          <AddMealModal
              onSelectSource={handleAddMealSourceSelected}
              onClose={() => { setShowAddMealModal(false); setIsMealAddMode(false); setAddMealContext(null); }}
          />
      )}
    </div>
  );
}

export default App;
