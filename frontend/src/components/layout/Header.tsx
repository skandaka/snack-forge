// src/components/layout/Header.tsx
import React, { useState } from 'react';
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
    X
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';

// Save Snack Modal Component
interface SaveSnackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
}

const SaveSnackModal: React.FC<SaveSnackModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), description.trim());
            setName('');
            setDescription('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Save Your Snack</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Snack Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Protein Power Balls"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us about your creation..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Snack
                    </button>
                </div>
            </div>
        </div>
    );
};

// Quick Actions Menu Component
interface QuickActionsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Quick Actions
            </div>

            {[
                { icon: Save, label: 'Save Current Snack', shortcut: 'Ctrl+S' },
                { icon: Upload, label: 'Load Saved Snack', shortcut: 'Ctrl+O' },
                { icon: Download, label: 'Export Recipe', shortcut: 'Ctrl+E' },
                { icon: Share2, label: 'Share Creation', shortcut: 'Ctrl+Shift+S' },
                { icon: Heart, label: 'View Favorites', shortcut: 'Ctrl+F' },
                { icon: Settings, label: 'Preferences', shortcut: 'Ctrl+,' }
            ].map((action) => (
                <button
                    key={action.label}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={onClose}
                >
                    <div className="flex items-center gap-3">
                        <action.icon className="w-4 h-4" />
                        <span>{action.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{action.shortcut}</span>
                </button>
            ))}
        </div>
    );
};

// Main Header Component
export default function Header() {
    const {
        currentSnack,
        saveSnack,
        showNotification,
        userPreferences
    } = useSnackStore();

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const hasIngredients = currentSnack.ingredients.length > 0;
    const healthScore = currentSnack.nutrition?.health_score || 0;

    const handleSaveSnack = async (name: string, description: string) => {
        try {
            await saveSnack(name, description);
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

        // Create downloadable recipe file
        const recipeData = {
            name: currentSnack.name,
            ingredients: currentSnack.ingredients,
            nutrition: currentSnack.nutrition,
            created: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(recipeData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSnack.name || 'custom-snack'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification({
            type: 'success',
            message: 'Recipe exported successfully!'
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

        // Create shareable text
        const shareText = `Check out my healthy snack creation on SnackSmith!\n\n${currentSnack.name || 'Custom Snack'}\nIngredients: ${currentSnack.ingredients.map(ing => ing.name).join(', ')}\nHealth Score: ${Math.round(healthScore)}/100`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My SnackSmith Creation',
                    text: shareText,
                    url: window.location.href
                });
            } catch (error) {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareText);
                showNotification({
                    type: 'success',
                    message: 'Recipe copied to clipboard!'
                });
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText);
            showNotification({
                type: 'success',
                message: 'Recipe copied to clipboard!'
            });
        }
    };

    return (
        <>
            <header className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo and Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">SnackSmith</h1>
                                <p className="text-xs text-gray-500 hidden sm:block">AI-Powered 3D Snack Designer</p>
                            </div>
                        </div>

                        {/* Current Snack Info */}
                        {hasIngredients && (
                            <div className="hidden md:flex items-center gap-4 ml-6 pl-6 border-l border-gray-200">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {currentSnack.name || 'Custom Snack'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {currentSnack.ingredients.length} ingredients
                                    </div>
                                </div>

                                {currentSnack.nutrition && (
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm font-medium text-gray-700">
                      {Math.round(healthScore)}/100
                    </span>
                                        <div className={`w-2 h-2 rounded-full ${
                                            healthScore >= 80 ? 'bg-green-500' :
                                                healthScore >= 60 ? 'bg-yellow-500' :
                                                    healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                        }`} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Save Button */}
                            <button
                                onClick={() => setShowSaveModal(true)}
                                disabled={!hasIngredients}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save current snack (Ctrl+S)"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save</span>
                            </button>

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                disabled={!hasIngredients}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export recipe (Ctrl+E)"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                disabled={!hasIngredients}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Share creation (Ctrl+Shift+S)"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                            </button>
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowQuickActions(!showQuickActions)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                <span className="hidden sm:inline">Menu</span>
                            </button>

                            <QuickActionsMenu
                                isOpen={showQuickActions}
                                onClose={() => setShowQuickActions(false)}
                            />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        >
                            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setShowSaveModal(true);
                                    setShowMobileMenu(false);
                                }}
                                disabled={!hasIngredients}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
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
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>

                            <button
                                onClick={() => {
                                    handleShare();
                                    setShowMobileMenu(false);
                                }}
                                disabled={!hasIngredients}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 col-span-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share Creation
                            </button>
                        </div>

                        {/* Mobile Snack Info */}
                        {hasIngredients && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                    {currentSnack.name || 'Custom Snack'}
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>{currentSnack.ingredients.length} ingredients</span>
                                    {currentSnack.nutrition && (
                                        <span>Health Score: {Math.round(healthScore)}/100</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Save Snack Modal */}
            <SaveSnackModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleSaveSnack}
            />

            {/* Click outside to close menus */}
            {(showQuickActions || showMobileMenu) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setShowQuickActions(false);
                        setShowMobileMenu(false);
                    }}
                />
            )}
        </>
    );
}