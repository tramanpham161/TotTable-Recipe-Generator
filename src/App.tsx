/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  Eraser, 
  Loader2, 
  ChevronLeft,
  ChefHat,
  UtensilsCrossed,
  Heart,
  Info,
  ChevronDown,
  ChevronUp,
  Flame,
  Wind,
  Microwave,
  Timer,
  Share2,
  Clock
} from 'lucide-react';
import { generateRecipe } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

type Step = 'setup' | 'generating' | 'recipe';

const AGES = [
  { id: '6–12 months', label: '6–12m', full: '6–12 months' },
  { id: '12–24 months', label: '12–24m', full: '12–24 months' },
  { id: '2-3 years', label: '2–3y', full: '2–3 years' },
];

const PRESET_INGREDIENTS = [
  'Eggs', 'Banana', 'Oats', 'Spinach', 'Bread', 'Yogurt', 'Cheese', 'Pasta', 'Chicken', 'Broccoli', 'Apple', 'Sweet Potato'
];

const DURATIONS = [
  { id: 'Less than 15 minutes', label: '< 15m' },
  { id: 'Less than 30 minutes', label: '< 30m' },
  { id: 'Less than 1 hour', label: '< 1h' },
];

const ALLERGIES = ['Dairy', 'Eggs', 'Nuts', 'Wheat', 'Soy', 'Fish'];

const EQUIPMENT = [
  { id: 'stove', label: 'Stove', icon: Flame },
  { id: 'oven', label: 'Oven', icon: Timer },
  { id: 'airfryer', label: 'Air Fryer', icon: Wind },
  { id: 'microwave', label: 'Microwave', icon: Microwave },
];

export default function App() {
  const [step, setStep] = useState<Step>('setup');
  const [ageGroup, setAgeGroup] = useState('6–12 months');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredients, setCustomIngredients] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('Less than 15 minutes');
  const [recipe, setRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const toggleAllergy = (all: string) => {
    setSelectedAllergies(prev => 
      prev.includes(all) ? prev.filter(i => i !== all) : [...prev, all]
    );
  };

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment(prev => 
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const allIngredients = [
    ...selectedIngredients,
    ...customIngredients.split(',').map(i => i.trim()).filter(i => i !== '')
  ].join(', ');

  const allEquipment = [
    ...selectedEquipment,
    ...customEquipment.split(',').map(e => e.trim()).filter(e => e !== '')
  ].join(', ');

  const handleGenerate = async () => {
    if (!allIngredients) {
      setError('Please add at least one ingredient.');
      return;
    }
    setStep('generating');
    setError(null);
    try {
      const result = await generateRecipe(
        ageGroup, 
        allIngredients, 
        selectedAllergies.join(', ') || 'none',
        allEquipment || 'Any available',
        selectedDuration
      );
      setRecipe(result || 'Sorry, I couldn\'t generate a recipe.');
      setStep('recipe');
    } catch (err) {
      setError('Something went wrong. Please check your connection.');
      setStep('setup');
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    const recipeName = recipe.match(/# (.*)/)?.[1] || 'My Tot Table Recipe';
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeName,
          text: `Check out this recipe from Tot Table: ${recipeName}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`Recipe from Tot Table: ${recipeName}\n\n${recipe}`);
      alert('Recipe copied to clipboard!');
    }
  };

  const reset = () => {
    setAgeGroup('6–12 months');
    setSelectedIngredients([]);
    setCustomIngredients('');
    setSelectedAllergies([]);
    setSelectedEquipment([]);
    setCustomEquipment('');
    setSelectedDuration('Less than 15 minutes');
    setRecipe(null);
    setError(null);
    setStep('setup');
  };

  const renderRecipeContent = () => {
    if (!recipe) return null;
    return (
      <div className="space-y-6">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-display font-extrabold tracking-tight text-brand-charcoal border-b border-stone-100 pb-6 mb-8">
                {children}
              </h1>
            ),
            h2: ({ children }) => {
              const title = String(children).toUpperCase();
              if (['WHY', 'SAFETY', 'NUTRITION', 'STEPS', 'INGREDIENTS', 'CALORIES', 'TIP', 'ENERGY BREAKDOWN', 'SOURCE'].includes(title)) return null;
              return (
                <div className="flex items-center gap-2 mt-8 mb-4">
                  <span className="w-1.5 h-1.5 bg-brand-sage rounded-full" />
                  <h2 className="text-xs font-bold tracking-wide text-stone-400">
                    {children}
                  </h2>
                </div>
              );
            },
            ul: ({ children }) => (
              <ul className="flex flex-wrap gap-2 mb-8">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-4 mb-10 [counter-reset:recipe-step]">
                {children}
              </ol>
            ),
            li: ({ children, ...props }: any) => {
              if (props.ordered) {
                return (
                  <li className="flex items-start gap-4 [counter-increment:recipe-step] py-5 border-b border-stone-100 last:border-0">
                    <div className="flex-none flex flex-col items-center pt-1.5">
                      <div className="w-8 h-8 rounded-full border-2 border-brand-sage flex items-center justify-center text-brand-sage text-base font-display font-black">
                        <span className="after:[content:counter(recipe-step)]" />
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-[17px] text-brand-charcoal leading-relaxed font-bold">
                        {children}
                      </p>
                    </div>
                  </li>
                );
              }
              return (
                <li className="text-[11px] text-brand-sage px-2 py-1 rounded-md font-extrabold tracking-wide border border-brand-sage/30">
                  {children}
                </li>
              );
            },
          }}
        >
          {recipe.split(/## (Safety|Why|Nutrition|Calories|Tip|Energy Breakdown)/i)[0]}
        </ReactMarkdown>

        {(recipe.includes('## Calories') || recipe.includes('## CALORIES')) && (
          <div className="py-4 border-y border-stone-100 my-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-400 font-display">
                <Clock size={12} className="text-brand-sage" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Estimated Energy</span>
              </div>
              <span className="text-sm font-display font-black text-brand-charcoal">
                {recipe.match(/## CALORIES\s*\n*(.*)/i)?.[1].trim()}
              </span>
            </div>
            
            {(recipe.includes('## Energy Breakdown') || recipe.includes('## ENERGY BREAKDOWN')) && (
              <div className="bg-stone-50/50 rounded-xl p-3 border border-stone-100/50">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 block mb-2 italic">Breakdown:</span>
                <div className="text-[10px] text-stone-500 space-y-1 prose-compact leading-tight">
                  <ReactMarkdown>
                    {recipe.includes('## Energy Breakdown') ? recipe.split('## Energy Breakdown')[1].split('## ')[0].trim() : recipe.split('## ENERGY BREAKDOWN')[1].split('## ')[0].trim()}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {(recipe.includes('## Tip') || recipe.includes('## TIP')) && (
          <div className="bg-brand-cream border border-brand-sage/10 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white border border-brand-sage/20 flex items-center justify-center text-brand-sage shrink-0">
              <Info size={18} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-sage/60">Quick Tip</span>
              <p className="text-[13px] text-brand-charcoal leading-tight font-medium">
                {recipe.includes('## Tip') ? recipe.split('## Tip')[1].split('## ')[0].trim() : recipe.split('## TIP')[1].split('## ')[0].trim()}
              </p>
            </div>
          </div>
        )}

        {(recipe.includes('## Safety') || recipe.includes('## SAFETY')) && (
          <div className="bg-orange-50 border border-brand-accent/20 rounded-2xl p-6 my-8">
            <div className="flex items-center gap-2 text-brand-accent mb-3">
              <AlertCircle size={16} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Safety Guard</span>
            </div>
            <div className="text-[13px] text-brand-charcoal leading-relaxed font-medium">
              <ReactMarkdown>
                {recipe.includes('## Safety') ? recipe.split('## Safety')[1].split('## ')[0] : recipe.split('## SAFETY')[1].split('## ')[0]}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {(recipe.includes('## Nutrition') || recipe.includes('## NUTRITION')) && (
          <div className="grid grid-cols-3 gap-4 border-t border-stone-100 pt-8">
            {(recipe.includes('## Nutrition') ? recipe.split('## Nutrition')[1] : recipe.split('## NUTRITION')[1]).split('## ')[0].split('\n').filter(l => l.includes(':')).map((line, i) => {
              const [key, val] = line.split(':');
              return (
                <div key={i} className="flex flex-col gap-1.5 p-3 bg-stone-50 rounded-xl border border-stone-100/50">
                  <span className="text-[9px] uppercase font-black text-stone-300 tracking-[0.15em]">{key.trim()}</span>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-md text-center tracking-wider border transition-all",
                    (val.includes('high') || val.includes('yes')) 
                      ? "bg-brand-sage border-brand-sage text-white" 
                      : "bg-white border-stone-200 text-stone-500"
                  )}>
                    {val.trim().toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {(recipe.includes('## Why') || recipe.includes('## WHY')) && (
          <div className="mt-10 pt-4 border-t border-stone-100">
            <button 
              onClick={() => setIsWhyExpanded(!isWhyExpanded)}
              className="flex items-center justify-between w-full text-stone-400 hover:text-stone-600 transition-colors py-2"
            >
              <div className="flex items-center gap-2">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Why this works?</span>
              </div>
              {isWhyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {isWhyExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="pt-2 text-[13px] text-stone-500 leading-relaxed font-medium">
                    <ReactMarkdown>
                      {recipe.includes('## Why') ? recipe.split('## Why')[1].split('## ')[0] : recipe.split('## WHY')[1].split('## ')[0]}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {(recipe.includes('## Source') || recipe.includes('## SOURCE')) && (
          <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-center">
            <p className="text-[9px] text-stone-300 font-medium uppercase tracking-widest italic">
              {recipe.includes('## Source') ? recipe.split('## Source')[1].split('## ')[0].trim() : recipe.split('## SOURCE')[1].split('## ')[0].trim()}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-cream/50">
      {/* NHS/System style minimal header */}
      <header className="h-16 border-b border-stone-100 px-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
          <div className="w-8 h-8 bg-brand-sage rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-sage/20">
            <UtensilsCrossed size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-sm font-display font-black uppercase tracking-[0.2em] text-brand-charcoal">Tot Table</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-brand-sage rounded-full animate-pulse" />
            <span className="text-[12px] leading-tight font-medium text-stone-500 italic max-w-xs text-right">
              Turn what’s in your fridge into fast, simple meals for your toddler.
            </span>
          </div>
          <button onClick={reset} className="text-stone-300 hover:text-stone-800 transition-all">
            <Eraser size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* Left Column: Input Panel (1/3) */}
        <aside className="w-full lg:w-1/3 border-r border-stone-100 bg-white p-6 space-y-10 overflow-y-auto">
          {/* Section: Age */}
          <div className="space-y-4">
            <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-stone-400">Child's age</label>
            <div className="grid grid-cols-3 gap-2">
              {AGES.map(age => (
                <button
                  key={age.id}
                  onClick={() => setAgeGroup(age.id)}
                  className={cn(
                    "py-3 px-1 text-[10px] font-black rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                    ageGroup === age.id 
                      ? "bg-brand-cream border-brand-sage text-brand-sage shadow-sm" 
                      : "bg-transparent border-stone-50 text-stone-400 hover:border-stone-100"
                  )}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Ingredients */}
          <div className="space-y-4">
            <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-stone-400">Ingredients in fridge</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_INGREDIENTS.map(ing => (
                <button
                  key={ing}
                  onClick={() => toggleIngredient(ing)}
                  className={cn(
                    "py-2.5 px-1 text-[10px] font-bold rounded-xl border transition-all",
                    selectedIngredients.includes(ing)
                      ? "bg-brand-sage border-brand-sage text-white"
                      : "bg-stone-50 border-stone-100 text-stone-500 hover:border-brand-sage/30"
                  )}
                >
                  {ing}
                </button>
              ))}
            </div>
            <textarea
              value={customIngredients}
              onChange={(e) => setCustomIngredients(e.target.value)}
              placeholder="+ Add custom ingredients (comma separated)"
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-sage/20 focus:border-brand-sage transition-all outline-none resize-none h-20 placeholder:text-stone-300 font-medium"
            />
          </div>

          {/* Section: Duration */}
          <div className="space-y-4">
            <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
              <Clock size={12} /> Cooking Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(dur => (
                <button
                  key={dur.id}
                  onClick={() => setSelectedDuration(dur.id)}
                  className={cn(
                    "py-3 px-1 text-[10px] font-black rounded-xl border-2 transition-all",
                    selectedDuration === dur.id
                      ? "bg-brand-cream border-brand-sage text-brand-sage"
                      : "bg-transparent border-stone-50 text-stone-400 hover:border-stone-100"
                  )}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Allergies */}
          <div className="space-y-4">
            <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-stone-400">Allergies to avoid</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGIES.map(all => (
                <button
                  key={all}
                  onClick={() => toggleAllergy(all)}
                  className={cn(
                    "py-2 px-3 text-[10px] font-bold rounded-lg border transition-all",
                    selectedAllergies.includes(all)
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-stone-50 border-stone-100 text-stone-400 hover:border-red-100"
                  )}
                >
                  {all}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Equipment */}
          <div className="space-y-4">
            <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-stone-400">Cooking Equipment</label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT.map(eq => {
                const Icon = eq.icon;
                const isSelected = selectedEquipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      isSelected
                        ? "bg-brand-sage border-brand-charcoal text-white shadow-md shadow-brand-sage/20"
                        : "bg-stone-50 border-stone-100 text-stone-400 hover:border-brand-sage/20"
                    )}
                  >
                    <Icon size={18} strokeWidth={isSelected ? 3 : 2} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{eq.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl border border-dashed border-stone-200">
               <span className="text-[10px] font-black text-stone-300 uppercase">Other</span>
               <input 
                 type="text" 
                 placeholder="Slow cooker, blender..." 
                 value={customEquipment}
                 onChange={(e) => setCustomEquipment(e.target.value)}
                 className="flex-1 bg-transparent border-none text-xs focus:ring-0 placeholder:text-stone-300 font-medium"
               />
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleGenerate}
              className="w-full py-5 bg-brand-charcoal text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-brand-charcoal/10 flex items-center justify-center gap-3"
            >
              <ChefHat size={18} />
              Generate Recipe
            </button>
            {error && <p className="text-xs text-red-500 font-bold mt-4 animate-shake">{error}</p>}
          </div>
        </aside>

        {/* Right Column: Recipe View (2/3) */}
        <main className="flex-1 bg-brand-cream/10 p-6 lg:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="p-8 bg-white border border-stone-100 rounded-3xl shadow-xl shadow-stone-200/50 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-sage">
                    <UtensilsCrossed size={40} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-black text-brand-charcoal uppercase tracking-widest">Ready to assist.</h2>
                    <p className="text-stone-400 text-sm max-w-xs leading-relaxed">Select your age group, ingredients, and duration on the left to create a meal card.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'generating' && (
              <motion.div
                key="generating-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-sage rounded-full blur-3xl opacity-20 animate-pulse" />
                  <Loader2 className="w-16 h-16 text-brand-sage animate-spin relative z-10" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-display font-black text-brand-charcoal uppercase tracking-[0.2em]">Building Recipe</h2>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-100 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Applying {selectedDuration} Safety Rules</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'recipe' && recipe && (
              <motion.div
                key="recipe-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto mb-10"
              >
                <div className="bg-white border border-brand-sage/10 rounded-[3rem] p-12 shadow-2xl shadow-brand-sage/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-brand-sage" />
                  {renderRecipeContent()}
                </div>

                {/* Action Footer */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={reset}
                    className="p-5 bg-white border border-stone-100 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-50 hover:text-stone-600 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                    Change
                  </button>
                  <button 
                    className="p-5 bg-brand-charcoal text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-brand-charcoal/10"
                    onClick={handleShare}
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4 py-8 border-t border-stone-100">
                  <div className="flex items-center gap-2 opacity-30">
                    <div className="w-1 h-1 bg-brand-charcoal rounded-full" />
                    <div className="w-1 h-1 bg-brand-charcoal rounded-full" />
                    <div className="w-1 h-1 bg-brand-charcoal rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


