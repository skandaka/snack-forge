// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    Settings,
    Save,
    Share2,
    Download,
    Maximize2,
    Minimize2,
    RotateCcw,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Layers,
    Grid3X3,
    Eye,
    Lightbulb,
    Zap
} from 'lucide-react';

import SnackCanvas from '../components/3d/SnackCanvas';
import IngredientLibrary from '../components/ui/IngredientLibrary';
import NutritionPanel from '../components/ui/NutritionPanel';
import AICoach from '../components/ui/AICoach';
import { useSnackStore } from '../stores/snackStore';

// Professional Header Component
const Header: React.FC = () => {
    const { currentSnack, saveSnack, ui } = useSnackStore();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const handleSave = () => {
        setShowSaveDialog(true);
    };

    const handleExport = () => {
        // Export functionality
        console.log('Exporting snack...');
    };

    const handleShare = () => {
        // Share functionality
        console.log('Sharing snack...');
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <header className="h-12 bg-[var(--bg-panel)] border-b border-[var(--border-color)] flex items-center justify-between px-4 relative z-50">
            {/* Left Section - Logo & File Menu */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-[var(--text-primary)] text-lg">SnackSmith</span>
                </div>

                <div className="flex items-center gap-1">
                    <button className="btn btn-ghost text-xs px-3 py-1">File</button>
                    <button className="btn btn-ghost text-xs px-3 py-1">Edit</button>
                    <button className="btn btn-ghost text-xs px-3 py-1">View</button>
                    <button className="btn btn-ghost text-xs px-3 py-1">Help</button>
                </div>
            </div>

            {/* Center Section - Current Snack Info */}
            <div className="flex items-center gap-4">
                {currentSnack.nutrition && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
                            <span className="text-sm text-[var(--text-secondary)]">Health Score:</span>
                            <span className="font-bold text-[var(--accent-green)]">
                {Math.round(currentSnack.nutrition.health_score)}
              </span>
                        </div>
                        <div className="w-px h-4 bg-[var(--border-color)]" />
                        <div className="text-sm text-[var(--text-secondary)]">
                            {currentSnack.ingredients.length} ingredients
                        </div>
                    </div>
                )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
                <button onClick={handleSave} className="btn btn-secondary text-xs">
                    <Save className="w-3 h-3" />
                    Save
                </button>
                <button onClick={handleExport} className="btn btn-secondary text-xs">
                    <Download className="w-3 h-3" />
                    Export
                </button>
                <button onClick={handleShare} className="btn btn-primary text-xs">
                    <Share2 className="w-3 h-3" />
                    Share
                </button>

                <div className="w-px h-6 bg-[var(--border-color)] mx-2" />

                <button onClick={toggleFullscreen} className="btn btn-ghost btn-icon">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button className="btn btn-ghost btn-icon">
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
};

// Professional Toolbar
const Toolbar: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    return (
        <div className="h-10 bg-[var(--bg-panel)] border-b border-[var(--border-color)] flex items-center justify-between px-4">
            {/* Left - Tool Selection */}
            <div className="flex items-center gap-1">
                <button className="btn btn-ghost btn-icon p-2">
                    <Menu className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-[var(--border-color)] mx-2" />
                <button className="btn btn-secondary btn-icon p-2">
                    <Grid3X3 className="w-4 h-4" />
                </button>
                <button className="btn btn-ghost btn-icon p-2">
                    <Layers className="w-4 h-4" />
                </button>
                <button className="btn btn-ghost btn-icon p-2">
                    <Eye className="w-4 h-4" />
                </button>
            </div>

            {/* Center - Playback Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="btn btn-secondary btn-icon p-2"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="btn btn-ghost btn-icon p-2">
                    <RotateCcw className="w-4 h-4" />
                </button>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                    Frame 1 / 120
                </div>
            </div>

            {/* Right - View Options */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="btn btn-ghost btn-icon p-2"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button className="btn btn-ghost btn-icon p-2">
                    <Lightbulb className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Status Bar
const StatusBar: React.FC = () => {
    const { ui, currentSnack } = useSnackStore();

    return (
        <div className="h-6 bg-[var(--bg-panel)] border-t border-[var(--border-color)] flex items-center justify-between px-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-4">
                <span>Ready</span>
                {ui.isLoading && (
                    <div className="flex items-center gap-2">
                        <div className="loading-spinner" />
                        <span>Processing...</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <span>Vertices: 1.2K</span>
                <span>Faces: 2.4K</span>
                <span>Objects: {currentSnack.ingredients.length + 1}</span>
                <span className="text-[var(--accent-blue)]">3D Viewport</span>
            </div>
        </div>
    );
};

// Panel Resizer Component
const PanelResizer: React.FC<{
    onResize: (delta: number) => void;
    orientation: 'horizontal' | 'vertical';
}> = ({ onResize, orientation }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        const startPos = orientation === 'horizontal' ? e.clientX : e.clientY;

        const handleMouseMove = (e: MouseEvent) => {
            const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
            const delta = currentPos - startPos;
            onResize(delta);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`group ${
                orientation === 'horizontal'
                    ? 'w-1 cursor-col-resize hover:bg-[var(--accent-blue)] transition-colors'
                    : 'h-1 cursor-row-resize hover:bg-[var(--accent-blue)] transition-colors'
            } ${isDragging ? 'bg-[var(--accent-blue)]' : 'bg-[var(--border-color)]'}`}
            onMouseDown={handleMouseDown}
        />
    );
};

// Main Application Component
export default function SnackSmithApp() {
    const { initializeApp, notifications, dismissNotification } = useSnackStore();

    // Panel sizes (in pixels)
    const [leftPanelWidth, setLeftPanelWidth] = useState(320);
    const [rightPanelWidth, setRightPanelWidth] = useState(360);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200);

    // Panel visibility
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [showBottomPanel, setShowBottomPanel] = useState(false);

    // Active tabs
    const [activeRightTab, setActiveRightTab] = useState<'nutrition' | 'ai'>('nutrition');
    const [activeBottomTab, setActiveBottomTab] = useState<'timeline' | 'properties'>('timeline');

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        setShowLeftPanel(!showLeftPanel);
                        break;
                    case '2':
                        e.preventDefault();
                        setShowRightPanel(!showRightPanel);
                        break;
                    case '3':
                        e.preventDefault();
                        setShowBottomPanel(!showBottomPanel);
                        break;
                    case 's':
                        e.preventDefault();
                        // Save functionality
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLeftPanel, showRightPanel, showBottomPanel]);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">
            {/* Header */}
            <Header />

            {/* Toolbar */}
            <Toolbar />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Ingredient Library */}
                <AnimatePresence>
                    {showLeftPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: leftPanelWidth, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="flex-shrink-0 bg-[var(--bg-panel)] border-r border-[var(--border-color)] overflow-hidden"
                        >
                            <div className="h-full flex flex-col">
                                <div className="panel-header">
                                    <Grid3X3 className="w-4 h-4 text-[var(--accent-blue)]" />
                                    Ingredient Library
                                    <button
                                        onClick={() => setShowLeftPanel(false)}
                                        className="ml-auto btn btn-ghost btn-icon p-1"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <IngredientLibrary />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Resizer */}
                {showLeftPanel && (
                    <PanelResizer
                        orientation="horizontal"
                        onResize={(delta) => {
                            const newWidth = Math.max(250, Math.min(500, leftPanelWidth + delta));
                            setLeftPanelWidth(newWidth);
                        }}
                    />
                )}

                {/* Center Area - 3D Viewport */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* 3D Canvas */}
                    <div className="flex-1 relative">
                        <SnackCanvas />

                        {/* Viewport Controls Overlay */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {!showLeftPanel && (
                                <button
                                    onClick={() => setShowLeftPanel(true)}
                                    className="btn btn-secondary btn-icon"
                                    title="Show Ingredient Library (Ctrl+1)"
                                >
                                    <Menu className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            {!showRightPanel && (
                                <button
                                    onClick={() => setShowRightPanel(true)}
                                    className="btn btn-secondary btn-icon"
                                    title="Show Side Panel (Ctrl+2)"
                                >
                                    <Layers className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="viewport-overlay">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                    <span className="text-sm text-[var(--text-secondary)]">
                      Drop ingredients here to build your snack
                    </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="btn btn-ghost text-xs">Reset View</button>
                                        <button className="btn btn-ghost text-xs">Focus</button>
                                        <button
                                            onClick={() => setShowBottomPanel(!showBottomPanel)}
                                            className="btn btn-secondary text-xs"
                                        >
                                            Timeline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Panel - Timeline/Properties */}
                    <AnimatePresence>
                        {showBottomPanel && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: bottomPanelHeight, opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="flex-shrink-0 bg-[var(--bg-panel)] border-t border-[var(--border-color)] overflow-hidden"
                            >
                                <div className="h-full flex flex-col">
                                    {/* Bottom Panel Tabs */}
                                    <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-color)]">
                                        <button
                                            onClick={() => setActiveBottomTab('timeline')}
                                            className={`btn text-xs ${
                                                activeBottomTab === 'timeline' ? 'btn-secondary' : 'btn-ghost'
                                            }`}
                                        >
                                            Timeline
                                        </button>
                                        <button
                                            onClick={() => setActiveBottomTab('properties')}
                                            className={`btn text-xs ${
                                                activeBottomTab === 'properties' ? 'btn-secondary' : 'btn-ghost'
                                            }`}
                                        >
                                            Properties
                                        </button>
                                        <div className="flex-1" />
                                        <button
                                            onClick={() => setShowBottomPanel(false)}
                                            className="btn btn-ghost btn-icon p-1"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Bottom Panel Content */}
                                    <div className="flex-1 p-4">
                                        {activeBottomTab === 'timeline' ? (
                                            <div className="text-sm text-[var(--text-muted)]">
                                                Timeline controls will appear here
                                            </div>
                                        ) : (
                                            <div className="text-sm text-[var(--text-muted)]">
                                                Selected object properties will appear here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Resizer */}
                    {showBottomPanel && (
                        <PanelResizer
                            orientation="vertical"
                            onResize={(delta) => {
                                const newHeight = Math.max(150, Math.min(400, bottomPanelHeight - delta));
                                setBottomPanelHeight(newHeight);
                            }}
                        />
                    )}
                </div>

                {/* Right Resizer */}
                {showRightPanel && (
                    <PanelResizer
                        orientation="horizontal"
                        onResize={(delta) => {
                            const newWidth = Math.max(300, Math.min(600, rightPanelWidth - delta));
                            setRightPanelWidth(newWidth);
                        }}
                    />
                )}

                {/* Right Panel - Nutrition & AI */}
                <AnimatePresence>
                    {showRightPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: rightPanelWidth, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="flex-shrink-0 bg-[var(--bg-panel)] border-l border-[var(--border-color)] overflow-hidden"
                        >
                            <div className="h-full flex flex-col">
                                {/* Right Panel Tabs */}
                                <div className="flex items-center gap-1 px-4 py-3 border-b border-[var(--border-color)]">
                                    <button
                                        onClick={() => setActiveRightTab('nutrition')}
                                        className={`btn text-xs ${
                                            activeRightTab === 'nutrition' ? 'btn-secondary' : 'btn-ghost'
                                        }`}
                                    >
                                        <Zap className="w-3 h-3" />
                                        Nutrition
                                    </button>
                                    <button
                                        onClick={() => setActiveRightTab('ai')}
                                        className={`btn text-xs ${
                                            activeRightTab === 'ai' ? 'btn-secondary' : 'btn-ghost'
                                        }`}
                                    >
                                        <Lightbulb className="w-3 h-3" />
                                        AI Coach
                                    </button>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => setShowRightPanel(false)}
                                        className="btn btn-ghost btn-icon p-1"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Right Panel Content */}
                                <div className="flex-1 overflow-hidden">
                                    {activeRightTab === 'nutrition' ? (
                                        <NutritionPanel />
                                    ) : (
                                        <AICoach />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Status Bar */}
            <StatusBar />

            {/* Notifications */}
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="fixed top-16 right-4 z-50 max-w-sm"
                    >
                        <div className={`panel p-4 border-l-4 ${
                            notification.type === 'success' ? 'border-l-[var(--accent-green)]' :
                                notification.type === 'error' ? 'border-l-[var(--accent-red)]' :
                                    notification.type === 'warning' ? 'border-l-[var(--accent-orange)]' :
                                        'border-l-[var(--accent-blue)]'
                        }`}>
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-[var(--text-primary)]">
                                    {notification.message}
                                </p>
                                <button
                                    onClick={() => dismissNotification(notification.id)}
                                    className="btn btn-ghost btn-icon p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Keyboard Shortcuts Help */}
            <div className="fixed bottom-4 left-4 text-xs text-[var(--text-muted)] opacity-50 hover:opacity-100 transition-opacity">
                <div className="panel p-2">
                    <div className="space-y-1">
                        <div><kbd className="bg-[var(--bg-hover)] px-1 rounded">Ctrl+1</kbd> Toggle Library</div>
                        <div><kbd className="bg-[var(--bg-hover)] px-1 rounded">Ctrl+2</kbd> Toggle Panel</div>
                        <div><kbd className="bg-[var(--bg-hover)] px-1 rounded">Ctrl+S</kbd> Save</div>
                    </div>
                </div>
            </div>
        </div>
    );
}