// src/components/ui/IngredientLibrary.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Star,
    Plus,
    Grid3X3,
    List,
    ChevronDown,
    Heart,
    Zap,
    Leaf,
    Target,
    Sparkles,
    X,
    Info
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';

// Enhanced ingredient data with professional styling
const INGREDIENT_VISUALS = {
    almonds: {
        emoji: '🥜',
        gradient: 'from-amber-400 to-orange-500',
        category: 'Nuts & Seeds',
        description: 'Rich, buttery nuts packed with vitamin E',
        benefits: ['Heart Healthy', 'High Protein', 'Good Fats'],
        popularity: 95,
        color: '#D2B48C'
    },
    walnuts: {
        emoji: '🌰',
        gradient: 'from-amber-600 to-orange-600',
        category: 'Nuts & Seeds',
        description: 'Brain-boosting nuts with omega-3s',
        benefits: ['Omega-3', 'Brain Health', 'Antioxidants'],
        popularity: 88,
        color: '#8B4513'
    },
    cashews: {
        emoji: '🥜',
        gradient: 'from-yellow-300 to-amber-400',
        category: 'Nuts & Seeds',
        description: 'Creamy, mild nuts perfect for blending',
        benefits: ['Creamy Texture', 'Minerals', 'Heart Healthy'],
        popularity: 82,
        color: '#F5DEB3'
    },
    dates: {
        emoji: '🌰',
        gradient: 'from-orange-500 to-red-500',
        category: 'Natural Sweeteners',
        description: 'Nature\'s candy with natural sweetness',
        benefits: ['Natural Sugar', 'Fiber', 'Energy Boost'],
        popularity: 92,
        color: '#8B4513'
    },
    cranberries_dried: {
        emoji: '🔴',
        gradient: 'from-red-400 to-pink-500',
        category: 'Dried Fruits',
        description: 'Tart berries loaded with antioxidants',
        benefits: ['Antioxidants', 'Vitamin C', 'Urinary Health'],
        popularity: 76,
        color: '#DC143C'
    },
    blueberries_dried: {
        emoji: '🫐',
        gradient: 'from-blue-400 to-purple-500',
        category: 'Dried Fruits',
        description: 'Superfruit berries with maximum antioxidants',
        benefits: ['Superfood', 'Brain Health', 'Anti-aging'],
        popularity: 89,
        color: '#4169E1'
    },
    dark_chocolate_70: {
        emoji: '🍫',
        gradient: 'from-amber-900 to-red-900',
        category: 'Chocolate',
        description: 'Rich dark chocolate with flavonoids',
        benefits: ['Antioxidants', 'Mood Boost', 'Heart Health'],
        popularity: 94,
        color: '#4A2C2A'
    },
    oats: {
        emoji: '🌾',
        gradient: 'from-yellow-200 to-orange-300',
        category: 'Whole Grains',
        description: 'Heart-healthy whole grain with beta-glucan',
        benefits: ['Heart Health', 'Sustained Energy', 'Fiber'],
        popularity: 91,
        color: '#F5DEB3'
    },
    quinoa: {
        emoji: '🌾',
        gradient: 'from-yellow-300 to-orange-400',
        category: 'Whole Grains',
        description: 'Complete protein superfood grain',
        benefits: ['Complete Protein', 'Gluten-Free', 'Superfood'],
        popularity: 78,
        color: '#DDBF94'
    },
    protein_powder_plant: {
        emoji: '💪',
        gradient: 'from-green-400 to-emerald-500',
        category: 'Protein',
        description: 'Plant-based protein for muscle building',
        benefits: ['High Protein', 'Plant-Based', 'Muscle Support'],
        popularity: 85,
        color: '#E6E6FA'
    },
    protein_powder_whey: {
        emoji: '💪',
        gradient: 'from-blue-400 to-cyan-500',
        category: 'Protein',
        description: 'Fast-absorbing whey protein',
        benefits: ['Fast Absorption', 'Complete Protein', 'Post-Workout'],
        popularity: 87,
        color: '#E6E6FA'
    },
    chia_seeds: {
        emoji: '⚫',
        gradient: 'from-gray-400 to-gray-600',
        category: 'Superfoods',
        description: 'Tiny seeds packed with omega-3s and fiber',
        benefits: ['Omega-3', 'High Fiber', 'Superfood'],
        popularity: 83,
        color: '#2F2F2F'
    },
    flax_seeds: {
        emoji: '🟤',
        gradient: 'from-amber-500 to-orange-600',
        category: 'Superfoods',
        description: 'Lignans and omega-3 rich seeds',
        benefits: ['Lignans', 'Omega-3', 'Hormone Support'],
        popularity: 74,
        color: '#8B4513'
    },
    honey: {
        emoji: '🍯',
        gradient: 'from-yellow-400 to-amber-500',
        category: 'Natural Sweeteners',
        description: 'Pure liquid gold with enzymes',
        benefits: ['Natural Enzymes', 'Quick Energy', 'Antioxidants'],
        popularity: 90,
        color: '#FFD700'
    },
    maple_syrup: {
        emoji: '🍁',
        gradient: 'from-amber-400 to-orange-500',
        category: 'Natural Sweeteners',
        description: 'Pure maple tree sap with minerals',
        benefits: ['Natural Minerals', 'Antioxidants', 'Maple Flavor'],
        popularity: 79,
        color: '#DEB887'
    },
    coconut_flakes: {
        emoji: '🥥',
        gradient: 'from-white to-gray-200',
        category: 'Tropical',
        description: 'Tropical coconut with MCT oils',
        benefits: ['MCT Oils', 'Tropical Flavor', 'Quick Energy'],
        popularity: 81,
        color: '#FFFFFF'
    },
    cinnamon: {
        emoji: '🌰',
        gradient: 'from-orange-400 to-red-500',
        category: 'Spices',
        description: 'Warming spice that regulates blood sugar',
        benefits: ['Blood Sugar', 'Anti-inflammatory', 'Warming'],
        popularity: 86,
        color: '#D2691E'
    }
};

const CATEGORIES = [
    { name: 'All', icon: Grid3X3, color: 'text-[var(--text-primary)]' },
    { name: 'Nuts & Seeds', icon: Zap, color: 'text-[var(--accent-orange)]' },
    { name: 'Dried Fruits', icon: Heart, color: 'text-[var(--accent-red)]' },
    { name: 'Protein', icon: Target, color: 'text-[var(--accent-blue)]' },
    { name: 'Whole Grains', icon: Leaf, color: 'text-[var(--accent-green)]' },
    { name: 'Natural Sweeteners', icon: Sparkles, color: 'text-[var(--accent-purple)]' },
    { name: 'Superfoods', icon: Star, color: 'text-[var(--accent-blue)]' },
    { name: 'Chocolate', icon: Heart, color: 'text-amber-500' },
    { name: 'Spices', icon: Leaf, color: 'text-orange-500' },
    { name: 'Tropical', icon: Heart, color: 'text-green-500' }
];

// Professional ingredient card component
const IngredientCard: React.FC<{
    ingredient: any;
    visual: any;
    isFavorite: boolean;
    onAdd: (amount: number) => void;
    onToggleFavorite: () => void;
}> = ({ ingredient, visual, isFavorite, onAdd, onToggleFavorite }) => {
    const [amount, setAmount] = useState(25);
    const [isHovered, setIsHovered] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const displayName = ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    const handleAdd = async () => {
        setIsAdding(true);
        await onAdd(amount);
        setTimeout(() => setIsAdding(false), 600);
    };

    const handleDragStart = (e: React.DragEvent) => {
        const dataToTransfer = {
            name: ingredient.name,
            amount_g: amount,
            nutrition: ingredient.nutrition,
            properties: ingredient.properties,
            category: ingredient.category
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dataToTransfer));
        e.dataTransfer.effectAllowed = 'move';
    };

    const nutritionScore = Math.round(
        (ingredient.nutrition.protein_g * 2 +
            ingredient.nutrition.fiber_g * 3 +
            (100 - ingredient.nutrition.sugars_g)) / 3
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group relative bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-[var(--border-light)] transition-all duration-200 overflow-hidden cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={handleDragStart}
        >
            {/* Popularity Badge */}
            {visual.popularity > 85 && (
                <div className="absolute top-2 left-2 z-10">
                    <div className="bg-[var(--accent-orange)] text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Popular
                    </div>
                </div>
            )}

            {/* Favorite Button */}
            <button
                onClick={onToggleFavorite}
                className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
                    isFavorite
                        ? 'bg-[var(--accent-red)] text-white'
                        : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]'
                }`}
            >
                <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-5`} />

            {/* Main Content */}
            <div className="relative p-4">
                {/* Icon & Name */}
                <div className="text-center mb-3">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                        {visual.emoji}
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">
                        {displayName}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">{visual.category}</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-[var(--bg-hover)] rounded-lg p-2 text-center">
                        <div className="font-bold text-[var(--text-primary)]">
                            {ingredient.nutrition.protein_g.toFixed(1)}g
                        </div>
                        <div className="text-[var(--text-muted)]">Protein</div>
                    </div>
                    <div className="bg-[var(--bg-hover)] rounded-lg p-2 text-center">
                        <div className="font-bold text-[var(--text-primary)]">
                            {Math.round(ingredient.nutrition.calories_per_100g)}
                        </div>
                        <div className="text-[var(--text-muted)]">Cal/100g</div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {visual.benefits.slice(0, 2).map((benefit: string) => (
                            <span
                                key={benefit}
                                className="text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full"
                            >
                {benefit}
              </span>
                        ))}
                    </div>
                </div>

                {/* Health Score Bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[var(--text-muted)]">Health Score</span>
                        <span className="font-bold">{nutritionScore}/100</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${nutritionScore}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`progress-fill ${
                                nutritionScore >= 80 ? 'bg-[var(--accent-green)]' :
                                    nutritionScore >= 60 ? 'bg-[var(--accent-orange)]' :
                                        'bg-[var(--accent-red)]'
                            }`}
                        />
                    </div>
                </div>

                {/* Amount Selector */}
                <div className="mb-3">
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Amount: {amount}g</label>
                    <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full h-2 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAdd}
                        disabled={isAdding}
                        className={`btn w-full text-xs ${
                            isAdding
                                ? 'btn-secondary bg-[var(--accent-green)] text-white'
                                : 'btn-primary'
                        }`}
                    >
                        {isAdding ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="loading-spinner" />
                                Added!
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Plus className="w-3 h-3" />
                                Add to Snack
                            </div>
                        )}
                    </motion.button>

                    <button className="btn btn-ghost w-full text-xs">
                        <Info className="w-3 h-3" />
                        Details
                    </button>
                </div>
            </div>

            {/* Hover Glow Effect */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--accent-blue)] opacity-5 pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Category filter button
const CategoryButton: React.FC<{
    category: any;
    isActive: boolean;
    count: number;
    onClick: () => void;
}> = ({ category, isActive, count, onClick }) => {
    const Icon = category.icon;

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 w-full ${
                isActive
                    ? 'bg-[var(--accent-blue)] text-white shadow-lg'
                    : 'bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)]'
            }`}
        >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : category.color}`} />
            <span className="font-medium text-sm">{category.name}</span>
            {count > 0 && (
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'
                }`}>
          {count}
        </span>
            )}
        </motion.button>
    );
};

// Main component
export default function IngredientLibrary() {
    const {
        availableIngredients,
        userPreferences,
        addIngredient,
        addToFavoriteIngredients,
        removeFromFavoriteIngredients,
        loadAvailableIngredients
    } = useSnackStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'protein' | 'health'>('popularity');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(true);

    // Load ingredients on mount
    useEffect(() => {
        if (availableIngredients.length === 0) {
            loadAvailableIngredients();
        }
    }, [availableIngredients.length, loadAvailableIngredients]);

    // Enhanced ingredients with visual data
    const enhancedIngredients = useMemo(() => {
        return availableIngredients.map(ingredient => ({
            ...ingredient,
            visual: INGREDIENT_VISUALS[ingredient.name as keyof typeof INGREDIENT_VISUALS] || {
                emoji: '🥗',
                gradient: 'from-gray-400 to-gray-600',
                category: 'Other',
                description: 'Healthy ingredient for your snack',
                benefits: ['Nutritious', 'Natural', 'Healthy'],
                popularity: 50,
                color: '#CD853F'
            }
        }));
    }, [availableIngredients]);

    // Filter and sort ingredients
    const filteredIngredients = useMemo(() => {
        let filtered = enhancedIngredients.filter(ingredient => {
            const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ingredient.visual.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ingredient.visual.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'All' || ingredient.visual.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        // Sort ingredients
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'popularity':
                    return b.visual.popularity - a.visual.popularity;
                case 'protein':
                    return b.nutrition.protein_g - a.nutrition.protein_g;
                case 'health':
                    const scoreA = Math.round((a.nutrition.protein_g * 2 + a.nutrition.fiber_g * 3 + (100 - a.nutrition.sugars_g)) / 3);
                    const scoreB = Math.round((b.nutrition.protein_g * 2 + b.nutrition.fiber_g * 3 + (100 - b.nutrition.sugars_g)) / 3);
                    return scoreB - scoreA;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [enhancedIngredients, searchQuery, selectedCategory, sortBy]);

    // Category counts
    const categoriesWithCounts = useMemo(() => {
        return CATEGORIES.map(category => ({
            ...category,
            count: category.name === 'All'
                ? enhancedIngredients.length
                : enhancedIngredients.filter(ing => ing.visual.category === category.name).length
        }));
    }, [enhancedIngredients]);

    const handleAddIngredient = async (ingredient: any, amount: number) => {
        await addIngredient({
            name: ingredient.name,
            amount_g: amount,
            nutrition: ingredient.nutrition,
            properties: ingredient.properties,
            category: ingredient.category
        });
    };

    const handleToggleFavorite = (ingredientName: string) => {
        const isFavorite = userPreferences.favorite_ingredients.includes(ingredientName);
        if (isFavorite) {
            removeFromFavoriteIngredients(ingredientName);
        } else {
            addToFavoriteIngredients(ingredientName);
        }
    };

    if (!enhancedIngredients.length) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner mb-4" />
                    <p className="text-[var(--text-muted)]">Loading ingredients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Categories Sidebar */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 200, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-panel)]"
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-[var(--text-primary)]">Categories</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="btn btn-ghost btn-icon p-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {categoriesWithCounts.map((category) => (
                                    <CategoryButton
                                        key={category.name}
                                        category={category}
                                        isActive={selectedCategory === category.name}
                                        count={category.count}
                                        onClick={() => setSelectedCategory(category.name)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-color)]">
                    {/* Search */}
                    <div className="search-input mb-4">
                        <Search className="search-icon w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {!showFilters && (
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="btn btn-secondary text-xs"
                                >
                                    <Filter className="w-3 h-3" />
                                    Filters
                                </button>
                            )}

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="input text-xs py-1 px-2"
                            >
                                <option value="popularity">Popular</option>
                                <option value="name">Name</option>
                                <option value="protein">Protein</option>
                                <option value="health">Health Score</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`btn btn-icon p-2 ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
                            >
                                <Grid3X3 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`btn btn-icon p-2 ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
                            >
                                <List className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ingredients Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredIngredients.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">No ingredients found</h3>
                            <p className="text-[var(--text-muted)]">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className={`grid gap-4 ${
                                viewMode === 'grid'
                                    ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                                    : 'grid-cols-1'
                            }`}
                        >
                            {filteredIngredients.map((ingredient) => (
                                <IngredientCard
                                    key={ingredient.name}
                                    ingredient={ingredient}
                                    visual={ingredient.visual}
                                    isFavorite={userPreferences.favorite_ingredients.includes(ingredient.name)}
                                    onAdd={(amount) => handleAddIngredient(ingredient, amount)}
                                    onToggleFavorite={() => handleToggleFavorite(ingredient.name)}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Results Summary */}
                    <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
                        Showing {filteredIngredients.length} of {enhancedIngredients.length} ingredients
                        {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                    </div>
                </div>
            </div>

            {/* Custom Slider Styles */}
            <style jsx global>{`
        .slider {
          background: var(--bg-hover);
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--accent-blue);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--accent-blue);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: none;
        }

        .slider::-moz-range-track {
          background: var(--bg-hover);
          border: none;
          border-radius: 4px;
        }

        .slider:focus {
          outline: none;
        }
      `}</style>
        </div>
    );
}