'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Plus, Grid3X3, List, Zap, Leaf, Target, Sparkles, X, Info, GripVertical, ChevronDown, Check } from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { Ingredient } from '../../types/snack';

const INGREDIENT_VISUALS: Record<string, any> = {
    almonds: { emoji: '🥜', category: 'Nuts & Seeds' },
    walnuts: { emoji: '🌰', category: 'Nuts & Seeds' },
    cashews: { emoji: '🥜', category: 'Nuts & Seeds' },
    dates: { emoji: '🟤', category: 'Dried Fruits' },
    cranberries_dried: { emoji: '🔴', category: 'Dried Fruits' },
    blueberries_dried: { emoji: '🫐', category: 'Dried Fruits' },
    dark_chocolate_70: { emoji: '🍫', category: 'Chocolate' },
    oats: { emoji: '🌾', category: 'Whole Grains' },
    quinoa: { emoji: '🌾', category: 'Whole Grains' },
    protein_powder_plant: { emoji: '💪', category: 'Protein' },
    protein_powder_whey: { emoji: '💪', category: 'Protein' },
    chia_seeds: { emoji: '⚫', category: 'Superfoods' },
    flax_seeds: { emoji: '🟤', category: 'Superfoods' },
    honey: { emoji: '🍯', category: 'Natural Sweeteners' },
    maple_syrup: { emoji: '🍁', category: 'Natural Sweeteners' },
    coconut_flakes: { emoji: '🥥', category: 'Tropical' },
    cinnamon: { emoji: '🌿', category: 'Spices' },
};

const CATEGORIES = [
    { name: 'All', icon: Grid3X3 }, { name: 'Nuts & Seeds', icon: Zap }, { name: 'Dried Fruits', icon: Sparkles },
    { name: 'Protein', icon: Target }, { name: 'Whole Grains', icon: Leaf }, { name: 'Chocolate', icon: Zap },
    { name: 'Spices', icon: Leaf }, { name: 'Superfoods', icon: Star }, { name: 'Natural Sweeteners', icon: Zap }, { name: 'Tropical', icon: Leaf }
];

const IngredientCard: React.FC<{
    ingredient: Ingredient;
    visual: any;
    onAdd: (amount: number) => void;
}> = ({ ingredient, visual, onAdd }) => {
    const [amount, setAmount] = useState(25);
    const displayName = ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ ...ingredient, amount_g: amount }));
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            draggable
            onDragStart={handleDragStart}
            className="group relative bg-gray-100 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all duration-200 cursor-grab"
        >
            <div className="flex items-center gap-3">
                <div className="text-3xl">{visual?.emoji || '🥣'}</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-800">{displayName}</h3>
                    <p className="text-xs text-gray-500">{visual?.category || 'Ingredient'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-600">{amount}g</span>
                    <button
                        onClick={() => onAdd(amount)}
                        className="p-2 bg-blue-500 rounded-md hover:bg-blue-600 text-white transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const CategoryDropdown: React.FC<{ selected: string; setSelected: (category: string) => void; }> = ({ selected, setSelected }) => {
    const [isOpen, setIsOpen] = useState(false);
    const SelectedIcon = (CATEGORIES.find(c => c.name === selected) || CATEGORIES[0]).icon;

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm border">
                <div className="flex items-center gap-2"><SelectedIcon size={16} />{selected}</div>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-xl z-10 p-2">
                        {CATEGORIES.map(cat => (
                            <button key={cat.name} onClick={() => { setSelected(cat.name); setIsOpen(false); }} className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 text-left">
                                <div className="flex items-center gap-2"><cat.icon size={16} /> {cat.name}</div>
                                {selected === cat.name && <Check size={16} className="text-blue-500" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BaseSelector: React.FC = () => {
    const { snackBase, setSnackBase } = useSnackStore();
    const bases = [{ id: 'bar', label: 'Bar' }, { id: 'ball', label: 'Ball' }, { id: 'bowl', label: 'Bowl' }] as const;

    return (
        <div>
            <h3 className="text-xs uppercase text-gray-500 font-bold mb-2 px-1">Base Shape</h3>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-200 p-1">
                {bases.map(base => (
                    <button key={base.id} onClick={() => setSnackBase(base.id)} className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${snackBase === base.id ? 'text-black' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {snackBase === base.id && <motion.div layoutId="base-selector-active" className="absolute inset-0 bg-white rounded-md shadow-sm" />}
                        <span className="relative z-10">{base.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function IngredientLibrary() {
    const { availableIngredients, addIngredient } = useSnackStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredIngredients = useMemo(() => {
        if (!availableIngredients) return [];
        return availableIngredients.filter((ingredient: Ingredient) => {
            const visual = INGREDIENT_VISUALS[ingredient.name];
            const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || (visual && visual.category === selectedCategory);
            return matchesSearch && matchesCategory;
        });
    }, [availableIngredients, searchQuery, selectedCategory]);

    return (
        <div className="h-full flex flex-col bg-gray-50 p-4 gap-4">
            <BaseSelector />
            <CategoryDropdown selected={selectedCategory} setSelected={setSelectedCategory} />
            <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Search ingredients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10 w-full" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
                <AnimatePresence>
                    {filteredIngredients.map((ingredient: Ingredient) => (
                        <IngredientCard
                            key={ingredient.name}
                            ingredient={ingredient}
                            visual={INGREDIENT_VISUALS[ingredient.name]}
                            onAdd={(amount) => addIngredient({ ...ingredient, amount_g: amount })}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}