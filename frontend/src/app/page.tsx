// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSnackStore } from '../stores/snackStore';
import IngredientLibrary from '../components/ui/IngredientLibrary';
import NutritionPanel from '../components/ui/NutritionPanel';
import AICoach from '../components/ui/AICoach';
import SnackCanvas from '../components/3d/SnackCanvas';
import Header from '../components/layout/Header';
import {
    PanelLeftOpen,
    PanelLeftClose,
    PanelRightOpen,
    PanelRightClose,
    Activity,
    Bot,
    Library,
    AlertCircle,
    CheckCircle,
    Info,
    X
} from 'lucide-react';

// Notification Component
interface NotificationProps {
    notification: {
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
    onDismiss: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            case 'warning': return <AlertCircle className="w-5 h-5" />;
            case 'info': return <Info className="w-5 h-5" />;
        }
    };

    const getColors = () => {
        switch (notification.type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div className={`flex items-center gap-3 p-4 border rounded-lg shadow-sm ${getColors()}`}>
            {getIcon()}
            <span className="flex-1 text-sm font-medium">{notification.message}</span>
            <button
                onClick={() => onDismiss(notification.id)}
                className="opacity-70 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Panel Toggle Button Component
interface PanelToggleProps {
    isOpen: boolean;
    onToggle: () => void;
    side: 'left' | 'right';
    icon: React.ReactNode;
    label: string;
}

const PanelToggle: React.FC<PanelToggleProps> = ({ isOpen, onToggle, side, icon, label }) => {
    const OpenIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen;
    const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose;
    const Icon = isOpen ? CloseIcon : OpenIcon;

    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 ${
                side === 'left' ? 'flex-row' : 'flex-row-reverse'
            }`}
            title={`${isOpen ? 'Hide' : 'Show'} ${label}`}
        >
            {icon}
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <Icon className="w-4 h-4 text-gray-500" />
        </button>
    );
};

// Loading Overlay Component
const LoadingOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-600 text-sm">Processing...</p>
        </div>
    </div>
);

// Tutorial Overlay Component
const TutorialOverlay: React.FC = () => {
    const [showTutorial, setShowTutorial] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has seen tutorial
        const hasSeenTutorial = localStorage.getItem('snacksmith_tutorial_completed');
        if (!hasSeenTutorial) {
            // Small delay to let the app load first
            setTimeout(() => setShowTutorial(true), 1000);
        }
    }, []);

    const tutorialSteps = [
        {
            title: "Welcome to SnackSmith!",
            content: "Create healthy snacks in 3D with AI-powered nutrition analysis. Let's take a quick tour.",
            position: "center"
        },
        {
            title: "Ingredient Library",
            content: "Browse and drag ingredients from this panel to build your snack. Use search and filters to find what you need.",
            position: "left",
            highlight: ".ingredient-library"
        },
        {
            title: "3D Canvas",
            content: "Your snack appears here in 3D! Drag ingredients onto the canvas and watch your creation come to life.",
            position: "center",
            highlight: ".snack-canvas"
        },
        {
            title: "Nutrition Analysis",
            content: "Get real-time nutrition facts, health scores, and detailed breakdowns as you build.",
            position: "right",
            highlight: ".nutrition-panel"
        },
        {
            title: "AI Coach",
            content: "Your personal nutrition assistant provides suggestions, improvements, and answers your questions.",
            position: "right",
            highlight: ".ai-coach"
        },
        {
            title: "Ready to Start!",
            content: "You're all set! Start by dragging an ingredient like almonds or oats onto the canvas.",
            position: "center"
        }
    ];

    const currentStepData = tutorialSteps[currentStep];

    const nextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTutorial();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeTutorial = () => {
        localStorage.setItem('snacksmith_tutorial_completed', 'true');
        setShowTutorial(false);
    };

    const skipTutorial = () => {
        localStorage.setItem('snacksmith_tutorial_completed', 'true');
        setShowTutorial(false);
    };

    if (!showTutorial) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            {/* Tutorial Modal */}
            <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
                        <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {currentStepData.title}
                    </h3>
                    <p className="text-gray-600">
                        {currentStepData.content}
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={skipTutorial}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                        Skip Tour
                    </button>

                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={prevStep}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Previous
                            </button>
                        )}

                        <button
                            onClick={nextStep}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            {currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Highlight Overlay */}
            {currentStepData.highlight && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* This would highlight specific elements */}
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg animate-pulse" />
                </div>
            )}
        </div>
    );
};

// Main App Component
export default function SnackSmithApp() {
    const {
        ui,
        notifications,
        currentSnack,
        dismissNotification,
        initializeApp
    } = useSnackStore();

    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [activeRightPanel, setActiveRightPanel] = useState<'nutrition' | 'ai'>('nutrition');

    // Initialize app on mount
    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + 1: Toggle ingredient library
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                setLeftPanelOpen(!leftPanelOpen);
            }
            // Ctrl/Cmd + 2: Toggle nutrition panel
            if ((e.ctrlKey || e.metaKey) && e.key === '2') {
                e.preventDefault();
                setRightPanelOpen(!rightPanelOpen);
                setActiveRightPanel('nutrition');
            }
            // Ctrl/Cmd + 3: Toggle AI coach
            if ((e.ctrlKey || e.metaKey) && e.key === '3') {
                e.preventDefault();
                setRightPanelOpen(!rightPanelOpen);
                setActiveRightPanel('ai');
            }
            // Escape: Close all panels
            if (e.key === 'Escape') {
                setLeftPanelOpen(false);
                setRightPanelOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [leftPanelOpen, rightPanelOpen]);

    // Responsive panel behavior
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                // On smaller screens, show only one panel at a time
                if (leftPanelOpen && rightPanelOpen) {
                    setRightPanelOpen(false);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Check on mount

        return () => window.removeEventListener('resize', handleResize);
    }, [leftPanelOpen, rightPanelOpen]);

    // Panel widths and responsive behavior
    const leftPanelWidth = leftPanelOpen ? 'w-80' : 'w-0';
    const rightPanelWidth = rightPanelOpen ? 'w-80' : 'w-0';

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
            {/* Header */}
            <Header />

            {/* Main Content Area */}
            <div className="flex-1 flex relative">
                {/* Left Panel - Ingredient Library */}
                <div className={`${leftPanelWidth} transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200 bg-white flex-shrink-0`}>
                    {leftPanelOpen && (
                        <div className="h-full ingredient-library">
                            <IngredientLibrary />
                        </div>
                    )}
                </div>

                {/* Center Panel - 3D Canvas */}
                <div className="flex-1 relative min-w-0">
                    {ui.isLoading && <LoadingOverlay />}

                    {/* 3D Canvas */}
                    <div className="h-full snack-canvas">
                        <SnackCanvas />
                    </div>

                    {/* Panel Toggle Controls */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <PanelToggle
                            isOpen={leftPanelOpen}
                            onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
                            side="left"
                            icon={<Library className="w-4 h-4" />}
                            label="Ingredients"
                        />
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <PanelToggle
                            isOpen={rightPanelOpen && activeRightPanel === 'nutrition'}
                            onToggle={() => {
                                if (rightPanelOpen && activeRightPanel === 'nutrition') {
                                    setRightPanelOpen(false);
                                } else {
                                    setRightPanelOpen(true);
                                    setActiveRightPanel('nutrition');
                                }
                            }}
                            side="right"
                            icon={<Activity className="w-4 h-4" />}
                            label="Nutrition"
                        />

                        <PanelToggle
                            isOpen={rightPanelOpen && activeRightPanel === 'ai'}
                            onToggle={() => {
                                if (rightPanelOpen && activeRightPanel === 'ai') {
                                    setRightPanelOpen(false);
                                } else {
                                    setRightPanelOpen(true);
                                    setActiveRightPanel('ai');
                                }
                            }}
                            side="right"
                            icon={<Bot className="w-4 h-4" />}
                            label="AI Coach"
                        />
                    </div>

                    {/* Quick Stats Overlay */}
                    {currentSnack.nutrition && (
                        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">Quick Stats</div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-gray-500">Health Score</span>
                                    <div className="font-bold text-lg">
                                        {Math.round(currentSnack.nutrition.health_score)}/100
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Calories</span>
                                    <div className="font-bold text-lg">
                                        {Math.round(currentSnack.nutrition.nutrition_per_serving.calories_per_100g)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Protein</span>
                                    <div className="font-bold">
                                        {currentSnack.nutrition.nutrition_per_100g.protein_g.toFixed(1)}g
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Fiber</span>
                                    <div className="font-bold">
                                        {currentSnack.nutrition.nutrition_per_100g.fiber_g.toFixed(1)}g
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Keyboard Shortcuts Help */}
                    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="text-xs font-medium text-gray-700 mb-2">Shortcuts</div>
                        <div className="space-y-1 text-xs text-gray-600">
                            <div><kbd className="bg-gray-100 px-1 rounded text-xs">Ctrl+1</kbd> Ingredients</div>
                            <div><kbd className="bg-gray-100 px-1 rounded text-xs">Ctrl+2</kbd> Nutrition</div>
                            <div><kbd className="bg-gray-100 px-1 rounded text-xs">Ctrl+3</kbd> AI Coach</div>
                            <div><kbd className="bg-gray-100 px-1 rounded text-xs">Esc</kbd> Close all</div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {ui.error && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                            <div className="flex items-center gap-2 text-red-800">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">Error</span>
                            </div>
                            <p className="text-red-700 text-sm mt-1">{ui.error}</p>
                        </div>
                    )}
                </div>

                {/* Right Panel - Nutrition/AI */}
                <div className={`${rightPanelWidth} transition-all duration-300 ease-in-out overflow-hidden border-l border-gray-200 bg-white flex-shrink-0`}>
                    {rightPanelOpen && (
                        <div className="h-full flex flex-col">
                            {/* Panel Tabs */}
                            <div className="flex border-b border-gray-200 bg-gray-50">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeRightPanel === 'nutrition'
                                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    onClick={() => setActiveRightPanel('nutrition')}
                                >
                                    <Activity className="w-4 h-4" />
                                    Nutrition
                                </button>

                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeRightPanel === 'ai'
                                            ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    onClick={() => setActiveRightPanel('ai')}
                                >
                                    <Bot className="w-4 h-4" />
                                    AI Coach
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-hidden">
                                {activeRightPanel === 'nutrition' ? (
                                    <div className="nutrition-panel h-full">
                                        <NutritionPanel />
                                    </div>
                                ) : (
                                    <div className="ai-coach h-full">
                                        <AICoach />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="absolute top-20 right-4 z-50 space-y-2 max-w-sm">
                    {notifications.map((notification) => (
                        <Notification
                            key={notification.id}
                            notification={notification}
                            onDismiss={dismissNotification}
                        />
                    ))}
                </div>
            )}

            {/* Mobile Warning */}
            <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 m-4 max-w-sm text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Desktop Experience Required</h3>
                    <p className="text-gray-600 text-sm">
                        SnackSmith is optimized for desktop and tablet devices. Please use a larger screen for the best 3D experience.
                    </p>
                </div>
            </div>

            {/* Tutorial Overlay */}
            <TutorialOverlay />
        </div>
    );
}