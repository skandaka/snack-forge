// src/components/ui/IngredientLibrary.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search,
    Filter,
    Star,
    Plus,
    Zap,
    Leaf,
    Heart,
    Clock,
    TrendingUp,
    ChevronDown,
    Grid3X3,
    List,
    X,
    Info,
    Sparkles,
    Target
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced ingredient data with visual properties
const INGREDIENT_VISUALS = {
    almonds: {
        emoji: '🌰',
        color: '#D2B48C',
        gradient: 'from-amber-100 to-amber-200',
        category: 'Nuts & Seeds',
        description: 'Rich, buttery nuts packed with vitamin E',
        benefits: ['Heart Healthy', 'High Protein', 'Good Fats'],
        popularity: 95,
        texture: 'Crunchy'
    },
    walnuts: {
        emoji: '🥜',
        color: '#8B4513',
        gradient: 'from-amber-200 to-orange-200',
        category: 'Nuts & Seeds',
        description: 'Brain-boosting nuts with omega-3s',
        benefits: ['Omega-3', 'Brain Health', 'Antioxidants'],
        popularity: 88,
        texture: 'Crunchy'
    },
    cashews: {
        emoji: '🥜',
        color: '#F5DEB3',
        gradient: 'from-yellow-100 to-amber-100',
        category: 'Nuts & Seeds',
        description: 'Creamy, mild nuts perfect for blending',
        benefits: ['Creamy Texture', 'Minerals', 'Heart Healthy'],
        popularity: 82,
        texture: 'Creamy'
    },
    dates: {
        emoji: '🌰',
        color: '#8B4513',
        gradient: 'from-orange-200 to-amber-300',
        category: 'Natural Sweeteners',
        description: 'Nature\'s candy with natural sweetness',
        benefits: ['Natural Sugar', 'Fiber', 'Energy Boost'],
        popularity: 92,
        texture: 'Chewy'
    },
    cranberries_dried: {
        emoji: '🔴',
        color: '#DC143C',
        gradient: 'from-red-200 to-pink-200',
        category: 'Dried Fruits',
        description: 'Tart berries loaded with antioxidants',
        benefits: ['Antioxidants', 'Vitamin C', 'Urinary Health'],
        popularity: 76,
        texture: 'Chewy'
    },
    blueberries_dried: {
        emoji: '🫐',
        color: '#4169E1',
        gradient: 'from-blue-200 to-purple-200',
        category: 'Dried Fruits',
        description: 'Superfruit berries with maximum antioxidants',
        benefits: ['Superfood', 'Brain Health', 'Anti-aging'],
        popularity: 89,
        texture: 'Chewy'
    },
    dark_chocolate_70: {
        emoji: '🍫',
        color: '#4A2C2A',
        gradient: 'from-amber-900 to-orange-900',
        category: 'Chocolate',
        description: 'Rich dark chocolate with flavonoids',
        benefits: ['Antioxidants', 'Mood Boost', 'Heart Health'],
        popularity: 94,
        texture: 'Smooth'
    },
    oats: {
        emoji: '🌾',
        color: '#F5DEB3',
        gradient: 'from-yellow-100 to-orange-100',
        category: 'Whole Grains',
        description: 'Heart-healthy whole grain with beta-glucan',
        benefits: ['Heart Health', 'Sustained Energy', 'Fiber'],
        popularity: 91,
        texture: 'Chewy'
    },
    quinoa: {
        emoji: '🌾',
        color: '#DDBF94',
        gradient: 'from-yellow-200 to-orange-200',
        category: 'Whole Grains',
        description: 'Complete protein superfood grain',
        benefits: ['Complete Protein', 'Gluten-Free', 'Superfood'],
        popularity: 78,
        texture: 'Fluffy'
    },
    protein_powder_plant: {
        emoji: '💪',
        color: '#E6E6FA',
        gradient: 'from-green-100 to-emerald-200',
        category: 'Protein',
        description: 'Plant-based protein for muscle building',
        benefits: ['High Protein', 'Plant-Based', 'Muscle Support'],
        popularity: 85,
        texture: 'Powdery'
    },
    protein_powder_whey: {
        emoji: '💪',
        color: '#E6E6FA',
        gradient: 'from-blue-100 to-cyan-200',
        category: 'Protein',
        description: 'Fast-absorbing whey protein',
        benefits: ['Fast Absorption', 'Complete Protein', 'Post-Workout'],
        popularity: 87,
        texture: 'Powdery'
    },
    chia_seeds: {
        emoji: '⚫',
        color: '#2F2F2F',
        gradient: 'from-gray-200 to-gray-300',
        category: 'Superfoods',
        description: 'Tiny seeds packed with omega-3s and fiber',
        benefits: ['Omega-3', 'High Fiber', 'Superfood'],
        popularity: 83,
        texture: 'Gel-like'
    },
    flax_seeds: {
        emoji: '🟤',
        color: '#8B4513',
        gradient: 'from-amber-200 to-orange-300',
        category: 'Superfoods',
        description: 'Lignans and omega-3 rich seeds',
        benefits: ['Lignans', 'Omega-3', 'Hormone Support'],
        popularity: 74,
        texture: 'Nutty'
    },
    honey: {
        emoji: '🍯',
        color: '#FFD700',
        gradient: 'from-yellow-200 to-amber-300',
        category: 'Natural Sweeteners',
        description: 'Pure liquid gold with enzymes',
        benefits: ['Natural Enzymes', 'Quick Energy', 'Antioxidants'],
        popularity: 90,
        texture: 'Liquid'
    },
    maple_syrup: {
        emoji: '🍁',
        color: '#DEB887',
        gradient: 'from-amber-200 to-orange-300',
        category: 'Natural Sweeteners',
        description: 'Pure maple tree sap with minerals',
        benefits: ['Natural Minerals', 'Antioxidants', 'Maple Flavor'],
        popularity: 79,
        texture: 'Syrup'
    },
    coconut_flakes: {
        emoji: '🥥',
        color: '#FFFFFF',
        gradient: 'from-white to-gray-100',
        category: 'Tropical',
        description: 'Tropical coconut with MCT oils',
        benefits: ['MCT Oils', 'Tropical Flavor', 'Quick Energy'],
        popularity: 81,
        texture: 'Flaky'
    },
    cinnamon: {
        emoji: '🌰',
        color: '#D2691E',
        gradient: 'from-orange-200 to-red-200',
        category: 'Spices',
        description: 'Warming spice that regulates blood sugar',
        benefits: ['Blood Sugar', 'Anti-inflammatory', 'Warming'],
        popularity: 86,
        texture: 'Powdery'
    },
    vanilla_extract: {
        emoji: '🌸',
        color: '#F5DEB3',
        gradient: 'from-purple-100 to-pink-100',
        category: 'Flavorings',
        description: 'Pure vanilla with complex floral notes',
        benefits: ['Natural Flavor', 'Aromatherapy', 'No Calories'],
        popularity: 88,
        texture: 'Liquid'
    }
};

const CATEGORIES = [
    { name: 'All', icon: Grid3X3, count: 0 },
    { name: 'Nuts & Seeds', icon: Zap, count: 0 },
    { name: 'Dried Fruits', icon: Heart, count: 0 },
    { name: 'Protein', icon: Target, count: 0 },
    { name: 'Whole Grains', icon: Leaf, count: 0 },
    { name: 'Natural Sweeteners', icon: Sparkles, count: 0 },
    { name: 'Superfoods', icon: Star, count: 0 },
    { name: 'Chocolate', icon: Heart, count: 0 },
    { name: 'Spices', icon: Leaf, count: 0 },
    { name: 'Tropical', icon: Heart, count: 0 }
];

interface IngredientCardProps {
    ingredient: {
        name: string;
        nutrition: any;
        properties: any;
        category: string;
    };
    visual: any;
    isFavorite: boolean;
    onAdd: (amount: number) => void;
    onToggleFavorite: () => void;
    onShowDetails: () => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
                                                           ingredient,
                                                           visual,
                                                           isFavorite,
                                                           onAdd,
                                                           onToggleFavorite,
                                                           onShowDetails
                                                       }) => {
    const [amount, setAmount] = useState(25);
    const [isHovered, setIsHovered] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const displayName = ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const handleAdd = async () => {
        setIsAdding(true);
        await onAdd(amount);
        setTimeout(() => setIsAdding(false), 500);
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
            whileHover={{ scale: 1.02, y: -2 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative bg-gradient-to-br ${visual.gradient} rounded-xl border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            </div>

            {/* Popularity Badge */}
            {visual.popularity > 85 && (
                <div className="absolute top-2 left-2 z-10">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Popular
                    </div>
                </div>
            )}

            {/* Favorite Button */}
            <button
                onClick={onToggleFavorite}
                className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
                    isFavorite
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
            >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Main Content */}
            <div className="relative p-4">
                {/* Ingredient Visual */}
                <div className="text-center mb-3">
                    <div className="text-4xl mb-2 transform transition-transform duration-300 group-hover:scale-110">
                        {visual.emoji}
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                        {displayName}
                    </h3>

                    {/* Category */}
                    <p className="text-xs text-gray-600 font-medium">
                        {visual.category}
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-white/60 rounded-lg p-2 text-center">
                        <div className="font-bold text-gray-900">
                            {ingredient.nutrition.protein_g.toFixed(1)}g
                        </div>
                        <div className="text-gray-600">Protein</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2 text-center">
                        <div className="font-bold text-gray-900">
                            {Math.round(ingredient.nutrition.calories_per_100g)}
                        </div>
                        <div className="text-gray-600">Calories</div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {visual.benefits.slice(0, 2).map((benefit: string) => (
                            <span
                                key={benefit}
                                className="text-xs bg-white/70 text-gray-700 px-2 py-0.5 rounded-full font-medium"
                            >
                                {benefit}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Nutrition Score */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">Health Score</span>
                        <span className="font-bold text-gray-900">{nutritionScore}/100</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                nutritionScore >= 80 ? 'bg-green-500' :
                                    nutritionScore >= 60 ? 'bg-yellow-500' :
                                        nutritionScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${nutritionScore}%` }}
                        />
                    </div>
                </div>

                {/* Amount Selector */}
                <div className="mb-3">
                    <label className="text-xs text-gray-600 font-medium mb-1 block">Amount</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="5"
                            max="100"
                            step="5"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(amount / 100) * 100}%, #E5E7EB ${(amount / 100) * 100}%, #E5E7EB 100%)`
                            }}
                        />
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">
                            {amount}g
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAdd}
                        disabled={isAdding}
                        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            isAdding
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isAdding ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                    Added!
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add to Snack
                                </>
                            )}
                        </div>
                    </motion.button>

                    <button
                        onClick={onShowDetails}
                        className="w-full py-2 bg-white/70 hover:bg-white text-gray-700 font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Info className="w-4 h-4" />
                        Details
                    </button>
                </div>
            </div>

            {/* Hover Overlay */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/5 pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const FilterButton: React.FC<{
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                isActive
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{category.name}</span>
            {count > 0 && (
                <span className={`ml-auto text-sm font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                    {count}
                </span>
            )}
        </motion.button>
    );
};

export default function IngredientLibrary() {
    const {
        availableIngredients,
        userPreferences,
        addIngredient,
        addToFavoriteIngredients,
        removeFromFavoriteIngredients,
        showNotification,
        loadAvailableIngredients
    } = useSnackStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'protein' | 'health'>('popularity');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

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
                color: '#CD853F',
                gradient: 'from-gray-200 to-gray-300',
                category: 'Other',
                description: 'Healthy ingredient for your snack',
                benefits: ['Nutritious', 'Natural', 'Healthy'],
                popularity: 50,
                texture: 'Mixed'
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

    // Update category counts
    const categoriesWithCounts = useMemo(() => {
        return CATEGORIES.map(category => ({
            ...category,
            count: category.name === 'All'
                ? enhancedIngredients.length
                : enhancedIngredients.filter(ing => ing.visual.category === category.name).length
        }));
    }, [enhancedIngredients]);

    const handleAddIngredient = async (ingredient: any, amount: number) => {
        try {
            await addIngredient({
                name: ingredient.name,
                amount_g: amount,
                nutrition: ingredient.nutrition,
                properties: ingredient.properties,
                category: ingredient.category
            });
        } catch (error) {
            showNotification({
                type: 'error',
                message: 'Failed to add ingredient'
            });
        }
    };

    const handleToggleFavorite = (ingredientName: string) => {
        const isFavorite = userPreferences.favorite_ingredients.includes(ingredientName);

        if (isFavorite) {
            removeFromFavoriteIngredients(ingredientName);
        } else {
            addToFavoriteIngredients(ingredientName);
        }
    };

    const handleShowDetails = (ingredient: any) => {
        setSelectedIngredient(ingredient.name);
        // Could open a modal with detailed ingredient information
        showNotification({
            type: 'info',
            message: `${ingredient.visual.description} - Click to learn more!`
        });
    };

    if (!enhancedIngredients.length) {
        return (
            <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 font-medium">Loading delicious ingredients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Ingredient Library</h2>
                        <p className="text-gray-600">Drag ingredients to your snack canvas</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search ingredients, categories, or benefits..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                    {[
                        { value: 'popularity', label: 'Popularity' },
                        { value: 'name', label: 'Name' },
                        { value: 'protein', label: 'Protein' },
                        { value: 'health', label: 'Health Score' }
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSortBy(option.value as any)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                sortBy === option.value
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Categories Sidebar */}
                <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                    showFilters ? 'w-64' : 'w-0'
                } overflow-hidden`}>
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                        <div className="space-y-2">
                            {categoriesWithCounts.map((category) => (
                                <FilterButton
                                    key={category.name}
                                    category={category}
                                    isActive={selectedCategory === category.name}
                                    count={category.count}
                                    onClick={() => setSelectedCategory(category.name)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ingredients Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredIngredients.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No ingredients found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className={`grid gap-4 ${
                                viewMode === 'grid'
                                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                    : 'grid-cols-1'
                            }`}
                        >
                            {filteredIngredients.map((ingredient, index) => (
                                <IngredientCard
                                    key={ingredient.name}
                                    ingredient={ingredient}
                                    visual={ingredient.visual}
                                    isFavorite={userPreferences.favorite_ingredients.includes(ingredient.name)}
                                    onAdd={(amount) => handleAddIngredient(ingredient, amount)}
                                    onToggleFavorite={() => handleToggleFavorite(ingredient.name)}
                                    onShowDetails={() => handleShowDetails(ingredient)}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Results Summary */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Showing {filteredIngredients.length} of {enhancedIngredients.length} ingredients
                        {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                    </div>
                </div>
            </div>

            {/* Custom Styles for Slider */}
            <style jsx global>{`
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #3B82F6;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                }

                input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #3B82F6;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    border: none;
                }

                input[type="range"]::-moz-range-track {
                    background: transparent;
                    border: none;
                }

                input[type="range"]:focus {
                    outline: none;
                }
            `}</style>
        </div>
    );
}