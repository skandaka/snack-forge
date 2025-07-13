// src/components/layout/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Upload,
    Download,
    Share2,
    Settings,
    User,
    Heart,
    Zap,
    ChefHat,
    Search,
    Bell,
    HelpCircle,
    Menu,
    X,
    Plus,
    BookOpen,
    Award,
    TrendingUp,
    Sparkles,
    Coffee,
    Palette,
    Sun,
    Moon,
    Crown,
    Star,
    Camera
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Save Snack Modal
interface SaveSnackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, tags: string[]) => void;
}

const SaveSnackModal: React.FC<SaveSnackModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const popularTags = [
        'High Protein', 'Low Sugar', 'Gluten Free', 'Vegan', 'Keto',
        'Post Workout', 'Energy Boost', 'Antioxidant Rich', 'Heart Healthy',
        'Kid Friendly', 'Quick Prep', 'Superfood'
    ];

    const handleSave = async () => {
        if (name.trim()) {
            setIsLoading(true);
            await onSave(name.trim(), description.trim(), tags);
            setName('');
            setDescription('');
            setTags([]);
            setCurrentTag('');
            setIsLoading(false);
            onClose();
        }
    };

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag) && tags.length < 5) {
            setTags([...tags, tag]);
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Save className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Save Your Creation</h3>
                            <p className="text-sm text-gray-600">Give your snack a memorable name</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Snack Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Chocolate Protein Power Balls"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us what makes this snack special..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tags ({tags.length}/5)
                        </label>

                        {/* Current tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map((tag) => (
                                    <motion.span
                                        key={tag}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.span>
                                ))}
                            </div>
                        )}

                        {/* Add custom tag */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addTag(currentTag)}
                                placeholder="Add custom tag"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={tags.length >= 5}
                            />
                            <button
                                onClick={() => addTag(currentTag)}
                                disabled={!currentTag || tags.length >= 5}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Popular tags */}
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Popular tags:</p>
                            <div className="flex flex-wrap gap-1">
                                {popularTags.slice(0, 8).map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => addTag(tag)}
                                        disabled={tags.includes(tag) || tags.length >= 5}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || isLoading}
                        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Snack
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Enhanced Quick Actions Menu
interface QuickActionsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ isOpen, onClose }) => {
    const actions = [
        {
            icon: Save,
            label: 'Save Current Snack',
            shortcut: 'Ctrl+S',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            icon: Upload,
            label: 'Load Saved Snack',
            shortcut: 'Ctrl+O',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            icon: Download,
            label: 'Export Recipe',
            shortcut: 'Ctrl+E',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            icon: Share2,
            label: 'Share Creation',
            shortcut: 'Ctrl+Shift+S',
            color: 'text-pink-600',
            bgColor: 'bg-pink-50'
        },
        {
            icon: Heart,
            label: 'View Favorites',
            shortcut: 'Ctrl+F',
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        },
        {
            icon: Camera,
            label: 'Screenshot 3D View',
            shortcut: 'Ctrl+P',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        },
        {
            icon: BookOpen,
            label: 'Recipe Library',
            shortcut: 'Ctrl+L',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        },
        {
            icon: Settings,
            label: 'Preferences',
            shortcut: 'Ctrl+,',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
        }
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Quick Actions</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Keyboard shortcuts available</p>
            </div>

            {/* Actions */}
            <div className="py-2">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                        onClick={onClose}
                    >
                        <div className={`p-2 ${action.bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
                            <action.icon className={`w-4 h-4 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-gray-900">{action.label}</div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                            {action.shortcut}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <HelpCircle className="w-3 h-3" />
                    <span>Press <kbd className="bg-white px-1 rounded">?</kbd> for help</span>
                </div>
            </div>
        </motion.div>
    );
};

// Notification Toast Component
interface NotificationToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onDismiss }) => {
    const config = {
        success: {
            icon: Award,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
            emoji: '🎉'
        },
        error: {
            icon: X,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            emoji: '❌'
        },
        warning: {
            icon: Bell,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            emoji: '⚠️'
        },
        info: {
            icon: Sparkles,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            emoji: '💡'
        }
    };

    const { icon: Icon, color, bg, border, emoji } = config[type];

    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`flex items-center gap-3 p-4 ${bg} ${border} border rounded-xl shadow-lg max-w-sm`}
        >
            <div className="text-2xl">{emoji}</div>
            <div className="flex-1">
                <p className={`font-medium ${color} text-sm`}>{message}</p>
            </div>
            <button
                onClick={onDismiss}
                className={`p-1 hover:bg-white/50 rounded-lg transition-colors ${color}`}
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

// Health Score Indicator
const HealthScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    const getScoreConfig = () => {
        if (score >= 80) return {
            color: 'text-green-600',
            bg: 'bg-green-100',
            emoji: '🏆',
            label: 'Excellent'
        };
        if (score >= 60) return {
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            emoji: '👍',
            label: 'Good'
        };
        if (score >= 40) return {
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            emoji: '⚖️',
            label: 'Fair'
        };
        return {
            color: 'text-red-600',
            bg: 'bg-red-100',
            emoji: '🔧',
            label: 'Needs Work'
        };
    };

    const { color, bg, emoji, label } = getScoreConfig();

    return (
        <div className={`flex items-center gap-2 px-3 py-2 ${bg} rounded-xl`}>
            <span className="text-lg">{emoji}</span>
            <div>
                <div className={`font-bold text-lg ${color}`}>{Math.round(score)}</div>
                <div className="text-xs text-gray-600">{label}</div>
            </div>
        </div>
    );
};

// Main Header Component
export default function Header() {
    const {
        currentSnack,
        saveSnack,
        showNotification,
        userPreferences,
        notifications,
        dismissNotification
    } = useSnackStore();

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const hasIngredients = currentSnack.ingredients.length > 0;
    const healthScore = currentSnack.nutrition?.health_score || 0;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey)) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        if (hasIngredients) setShowSaveModal(true);
                        break;
                    case 'o':
                        e.preventDefault();
                        // Load snack logic
                        break;
                    case 'e':
                        e.preventDefault();
                        if (hasIngredients) handleExport();
                        break;
                    case ',':
                        e.preventDefault();
                        setShowQuickActions(true);
                        break;
                }

                if (e.shiftKey && e.key === 'S') {
                    e.preventDefault();
                    if (hasIngredients) handleShare();
                }
            }

            if (e.key === '?') {
                e.preventDefault();
                setShowQuickActions(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasIngredients]);

    const handleSaveSnack = async (name: string, description: string, tags: string[]) => {
        try {
            await saveSnack(name, description);
            showNotification({
                type: 'success',
                message: `🎉 "${name}" saved successfully!`
            });
        } catch (error) {
            showNotification({
                type: 'error',
                message: 'Failed to save snack. Please try again.'
            });
        }
    };

    const handleExport = () => {
        if (!hasIngredients) {
            showNotification({
                type: 'warning',
                message: 'Add some ingredients first!'
            });
            return;
        }

        const recipeData = {
            name: currentSnack.name,
            ingredients: currentSnack.ingredients,
            nutrition: currentSnack.nutrition,
            created: new Date().toISOString(),
            healthScore: healthScore
        };

        const blob = new Blob([JSON.stringify(recipeData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSnack.name || 'snacksmith-recipe'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification({
            type: 'success',
            message: '📁 Recipe exported successfully!'
        });
    };

    const handleShare = async () => {
        if (!hasIngredients) {
            showNotification({
                type: 'warning',
                message: 'Add some ingredients first!'
            });
            return;
        }

        const shareText = `🍫 Check out my healthy snack creation on SnackSmith!\n\n"${currentSnack.name || 'Custom Snack'}"\n📋 Ingredients: ${currentSnack.ingredients.map(ing => ing.name.replace(/_/g, ' ')).join(', ')}\n🏆 Health Score: ${Math.round(healthScore)}/100\n\nCreate yours at SnackSmith! 🚀`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: '🍫 My SnackSmith Creation',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                showNotification({
                    type: 'success',
                    message: '📋 Recipe copied to clipboard!'
                });
            }
        } catch (error) {
            showNotification({
                type: 'error',
                message: 'Failed to share recipe'
            });
        }
    };

    const handleTakeScreenshot = () => {
        // Screenshot functionality for 3D canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `${currentSnack.name || 'snacksmith-creation'}.png`;
            link.href = canvas.toDataURL();
            link.click();

            showNotification({
                type: 'success',
                message: '📸 Screenshot saved!'
            });
        }
    };

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40"
            >
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo and Brand */}
                        <motion.div
                            className="flex items-center gap-4"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <ChefHat className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        SnackSmith
                                    </h1>
                                    <p className="text-xs text-gray-500 font-medium hidden sm:block">
                                        AI-Powered 3D Snack Designer
                                    </p>
                                </div>
                            </div>

                            {/* Current Snack Info */}
                            {hasIngredients && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="hidden lg:flex items-center gap-4 ml-6 pl-6 border-l border-gray-200"
                                >
                                    <div>
                                        <div className="font-bold text-gray-900">
                                            {currentSnack.name || 'Custom Snack'}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>{currentSnack.ingredients.length} ingredients</span>
                                            <span>•</span>
                                            <span className="capitalize">
                                                {currentSnack.base.type.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {currentSnack.nutrition && (
                                        <HealthScoreIndicator score={healthScore} />
                                    )}
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={!hasIngredients}
                                    className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Save current snack (Ctrl+S)"
                                >
                                    <Save className="w-4 h-4" />
                                    <span className="hidden lg:inline">Save</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleExport}
                                    disabled={!hasIngredients}
                                    className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Export recipe (Ctrl+E)"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden lg:inline">Export</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleTakeScreenshot}
                                    disabled={!hasIngredients}
                                    className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Screenshot 3D view (Ctrl+P)"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span className="hidden lg:inline">Screenshot</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleShare}
                                    disabled={!hasIngredients}
                                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Share creation (Ctrl+Shift+S)"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span className="hidden lg:inline">Share</span>
                                </motion.button>
                            </div>

                            {/* Theme Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                title="Toggle theme"
                            >
                                {isDarkMode ? (
                                    <Sun className="w-5 h-5 text-yellow-500" />
                                ) : (
                                    <Moon className="w-5 h-5 text-gray-600" />
                                )}
                            </motion.button>

                            {/* User Menu */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowQuickActions(!showQuickActions)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all font-medium text-gray-700"
                                >
                                    <div className="relative">
                                        <User className="w-5 h-5" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                    </div>
                                    <span className="hidden sm:inline">Menu</span>
                                </motion.button>

                                <AnimatePresence>
                                    {showQuickActions && (
                                        <QuickActionsMenu
                                            isOpen={showQuickActions}
                                            onClose={() => setShowQuickActions(false)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile Menu Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                {showMobileMenu ? (
                                    <X className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <Menu className="w-5 h-5 text-gray-600" />
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {showMobileMenu && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:hidden mt-4 pt-4 border-t border-gray-200"
                            >
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        onClick={() => {
                                            setShowSaveModal(true);
                                            setShowMobileMenu(false);
                                        }}
                                        disabled={!hasIngredients}
                                        className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleExport();
                                            setShowMobileMenu(false);
                                        }}
                                        disabled={!hasIngredients}
                                        className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleTakeScreenshot();
                                            setShowMobileMenu(false);
                                        }}
                                        disabled={!hasIngredients}
                                        className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Screenshot
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleShare();
                                            setShowMobileMenu(false);
                                        }}
                                        disabled={!hasIngredients}
                                        className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                </div>

                                {/* Mobile Snack Info */}
                                {hasIngredients && (
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-bold text-gray-900">
                                                {currentSnack.name || 'Custom Snack'}
                                            </div>
                                            {currentSnack.nutrition && (
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-orange-500" />
                                                    <span className="font-bold text-orange-600">
                                                        {Math.round(healthScore)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {currentSnack.ingredients.length} ingredients • {currentSnack.base.type.replace('-', ' ')}
                                        </div>
                                        {currentSnack.nutrition && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                {Math.round(currentSnack.nutrition.nutrition_per_serving.calories_per_100g)} calories • {currentSnack.nutrition.nutrition_per_100g.protein_g.toFixed(1)}g protein
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.header>

            {/* Modals and Overlays */}
            <AnimatePresence>
                {showSaveModal && (
                    <SaveSnackModal
                        isOpen={showSaveModal}
                        onClose={() => setShowSaveModal(false)}
                        onSave={handleSaveSnack}
                    />
                )}
            </AnimatePresence>

            {/* Click outside to close menus */}
            {(showQuickActions || showMobileMenu) && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                        setShowQuickActions(false);
                        setShowMobileMenu(false);
                    }}
                />
            )}

            {/* Notifications */}
            <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <NotificationToast
                            key={notification.id}
                            message={notification.message}
                            type={notification.type}
                            onDismiss={() => dismissNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}