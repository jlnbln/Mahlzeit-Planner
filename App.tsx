
import React, { useState, useEffect } from 'react';
import { UserProfile, WeeklyPlan, ShoppingList, Recipe, AppSettings, RecipePreferences, GenerationRequestProfile, Ingredient } from './types';
import { DEFAULT_USER, DEFAULT_SETTINGS, DAYS_OF_WEEK } from './constants';
import { generateWeeklyPlan, generateShoppingList, generateAlternativeRecipes, generateICalString } from './services/geminiService';

// Firebase Imports
import { db, auth } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

// Icons
import { 
  Users, Calendar, ShoppingCart, ChefHat, 
  Heart, Loader2, Home, Settings
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import PlanDetail from './components/PlanDetail';
import ShoppingListView from './components/ShoppingList';
import { UserList, UserEdit } from './components/UserViews';
import SettingsView from './components/Settings';
import Favorites from './components/Favorites';
import { RecipeFormModal, GenerationModal, RecipeDetailModal, ReplacementModal, FavoritePickerModal, ResetConfirmModal } from './components/Modals';
import { Auth } from './components/Auth';

// --- Helpers ---
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
}

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
  const currentViewDateIso = currentViewDate.toISOString().split('T')[0];
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
      setCurrentViewDate(prev => getStartOfWeek(prev, settings.weekStartDay));
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
  }

  const handleGoToDashboard = () => {
      setView('dashboard');
      setCurrentViewDate(getStartOfWeek(new Date(), settings.weekStartDay));
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
                      if (m.type === mealType) {
                          return { ...m, completed: !m.completed };
                      }
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
    setLoadingMessage('Generiere maßgeschneiderten Wochenplan...');
    const startDate = getStartOfWeek(targetDate, settings.weekStartDay);
    const isoDate = startDate.toISOString().split('T')[0];
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
              if (matchingSaved) {
                  meal.recipe = { ...matchingSaved };
              }
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
    setLoadingMessage(`Erstelle Einkaufsliste für ${settings.preferredStore}...`);
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

  const handleSaveRecipe = (updatedRecipe: Partial<Recipe>) => {
    let updatedSaved;
    if (editingRecipe) {
        updatedSaved = savedRecipes.map(r => r.id === editingRecipe.id ? { ...r, ...updatedRecipe } as Recipe : r);
        
        const updatedPlans = { ...plans };
        Object.keys(updatedPlans).forEach(key => {
            updatedPlans[key].days = updatedPlans[key].days.map(d => ({
                ...d,
                meals: d.meals.map(m => {
                    if (m.recipe.id === editingRecipe.id) {
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
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
      );
  }

  if (!user) {
      return <Auth />;
  }

  const NavButton = ({ target, onClick, label, disabled = false }: any) => (
      <button 
        onClick={onClick || (() => setView(target))} 
        disabled={disabled}
        className={`px-3 py-2 rounded-lg transition flex items-center ${view === target ? 'bg-emerald-700 dark:bg-emerald-900' : 'hover:bg-emerald-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {label}
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-10 transition-colors duration-200">
      <header className="bg-emerald-600 dark:bg-emerald-800 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoToDashboard}>
            <ChefHat className="h-7 w-7" />
            <h1 className="text-lg md:text-xl font-bold hidden sm:block">MahlzeitPlanner DE</h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <nav className="hidden md:flex space-x-2">
                <NavButton target="dashboard" onClick={handleGoToDashboard} label="Übersicht" />
                <NavButton target="user_list" label="Profile" />
                <NavButton target="plan" label="Wochenplan" disabled={!activePlan} />
                <NavButton target="shopping" label="Einkauf" disabled={!shoppingList} />
                <div className="w-px h-6 bg-emerald-500 mx-2"></div>
                <button onClick={() => setView('favorites')} className={`p-2 rounded-lg transition ${view === 'favorites' ? 'bg-emerald-700 dark:bg-emerald-900' : 'hover:bg-emerald-500'}`} title="Favoriten"><Heart size={20} className={view === 'favorites' ? 'fill-white' : ''} /></button>
                <button onClick={() => setView('settings')} className={`p-2 rounded-lg transition ${view === 'settings' ? 'bg-emerald-700 dark:bg-emerald-900' : 'hover:bg-emerald-500'}`} title="Einstellungen"><Settings size={20} /></button>
            </nav>
            <div className="md:hidden flex space-x-2">
                <button onClick={() => setView('favorites')} className="p-2"><Heart size={20} /></button>
                <button onClick={() => setView('settings')} className="p-2"><Settings size={20} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 mt-2">
        {loading && (
          <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{loadingMessage}</p>
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
                    return `${start.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'})} - ${end.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'})}`;
                }}
                onSelectRecipe={setSelectedRecipe}
                onToggleMealCompletion={toggleMealCompletion}
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
                    if (confirm('Benutzer wirklich löschen?')) {
                        const updatedUsers = users.filter(u => u.id !== id);
                        setUsers(updatedUsers);
                        saveToFirebase(updatedUsers, plans, shoppingList, settings, savedRecipes);
                        setView('user_list');
                    }
                }}
            />
        )}

        {view === 'plan' && activePlan && (
            <PlanDetail 
                plan={activePlan}
                activeTabDay={activeTabDay}
                setActiveTabDay={setActiveTabDay}
                settings={settings}
                initiateGeneration={() => setShowGenModal(true)}
                handleGenerateShoppingList={handleGenerateShoppingList}
                handleExportICal={async () => {
                    try {
                        const ics = await generateICalString(activePlan);
                        const blob = new Blob([ics], { type: 'text/calendar' });
                        const a = document.createElement('a');
                        a.href = window.URL.createObjectURL(blob);
                        a.download = `mahlzeit_plan_${activePlan.startDate}.ics`;
                        a.click();
                    } catch(e) { alert("Fehler beim Export"); }
                }}
                openReplaceModal={async (d, t, n) => {
                    setReplacementTarget({ dayIndex: d, mealType: t, currentName: n });
                    setLoading(true);
                    setLoadingMessage('Generiere Alternativen...');
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
             />
        )}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-20 pb-safe">
        {['dashboard', 'user_list', 'plan', 'shopping'].map((v: any) => (
            <button 
                key={v}
                onClick={v === 'dashboard' ? handleGoToDashboard : () => setView(v)} 
                disabled={(v === 'plan' && !activePlan) || (v === 'shopping' && !shoppingList)}
                className={`flex flex-col items-center p-2 rounded-lg ${view === v ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} ${((v === 'plan' && !activePlan) || (v === 'shopping' && !shoppingList)) ? 'opacity-30' : ''}`}
            >
                {v === 'dashboard' && <Home size={24} />}
                {v === 'user_list' && <Users size={24} />}
                {v === 'plan' && <Calendar size={24} />}
                {v === 'shopping' && <ShoppingCart size={24} />}
            </button>
        ))}
      </div>

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

      {showReplaceModal && replacementTarget && (
          <ReplacementModal 
             candidates={replacementCandidates}
             targetName={replacementTarget.currentName}
             onSelect={(newR) => {
                 const updatedPlans = { ...plans };
                 const planToUpdate = { ...activePlan } as WeeklyPlan;
                 planToUpdate.days[replacementTarget.dayIndex].meals = planToUpdate.days[replacementTarget.dayIndex].meals.map(m => 
                     m.type === replacementTarget.mealType ? { ...m, recipe: newR } : m
                 );
                 updatedPlans[planToUpdate.startDate] = planToUpdate;
                 setPlans(updatedPlans);
                 saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
                 setShowReplaceModal(false);
             }}
             onClose={() => setShowReplaceModal(false)}
          />
      )}

      {showFavPicker && replacementTarget && (
          <FavoritePickerModal 
              favorites={getAllFavoritedRecipes()}
              targetName={replacementTarget.currentName}
              onSelect={(newR) => {
                const updatedPlans = { ...plans };
                const planToUpdate = { ...activePlan } as WeeklyPlan;
                planToUpdate.days[replacementTarget.dayIndex].meals = planToUpdate.days[replacementTarget.dayIndex].meals.map(m => 
                    m.type === replacementTarget.mealType ? { ...m, recipe: newR } : m
                );
                updatedPlans[planToUpdate.startDate] = planToUpdate;
                setPlans(updatedPlans);
                saveToFirebase(users, updatedPlans, shoppingList, settings, savedRecipes);
                setShowFavPicker(false);
              }}
              onClose={() => setShowFavPicker(false)}
          />
      )}

      {showResetConfirm && (
          <ResetConfirmModal 
             onConfirm={handleResetDatabase}
             onCancel={() => setShowResetConfirm(false)}
          />
      )}
    </div>
  );
}

export default App;
