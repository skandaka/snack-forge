'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, Settings, Save, Share2, Download, Maximize2, Minimize2, RotateCcw,
    Play, Pause, Volume2, VolumeX, Layers, Grid3X3, Eye, Lightbulb, Zap,
    FileText, FolderOpen, Undo, Redo, Check
} from 'lucide-react';
import SnackCanvas from '../components/3d/SnackCanvas';
import IngredientLibrary from '../components/ui/IngredientLibrary';
import NutritionPanel from '../components/ui/NutritionPanel';
import AICoach from '../components/ui/AICoach';
import { useSnackStore } from '../stores/snackStore';

// Menu Components
const FileMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { clearSnack, saveSnack } = useSnackStore();
    const items = [
        { label: 'New Snack', action: clearSnack, icon: FileText },
        { label: 'Save Snack', action: () => saveSnack('My Awesome Snack'), icon: Save },
    ];
    return (
        <MenuBase items={items} onClose={onClose} positionClasses="top-12 left-4" />
    );
};

const EditMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const items = [
        { label: 'Undo', action: () => console.log('Undo'), icon: Undo },
        { label: 'Redo', action: () => console.log('Redo'), icon: Redo },
    ];
    return (
        <MenuBase items={items} onClose={onClose} positionClasses="top-12 left-20" />
    );
};

const ViewMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ui, togglePanel } = useSnackStore();
    const items = [
        { label: 'Ingredients', action: () => togglePanel('showIngredientLibrary'), icon: Grid3X3, checked: ui.showIngredientLibrary },
        { label: 'Nutrition', action: () => togglePanel('showNutritionPanel'), icon: Zap, checked: ui.showNutritionPanel },
        { label: 'AI Coach', action: () => togglePanel('showAICoach'), icon: Lightbulb, checked: ui.showAICoach },
    ];
    return (
        <MenuBase items={items} onClose={onClose} positionClasses="top-12 left-36" />
    );
};

const MenuBase: React.FC<{ items: any[], onClose: () => void, positionClasses: string }> = ({ items, onClose, positionClasses }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`absolute bg-[var(--bg-panel)] rounded-lg shadow-2xl border border-[var(--border-color)] py-2 min-w-[200px] z-50 ${positionClasses}`}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => {
                const Icon = item.icon;
                return (
                    <button
                        key={index}
                        onClick={() => { item.action(); if (item.checked === undefined) onClose(); }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Icon size={16} className="text-[var(--text-muted)]" />
                            <span>{item.label}</span>
                        </div>
                        {item.checked !== undefined && item.checked && <Check size={16} className="text-[var(--accent-blue)]" />}
                    </button>
                );
            })}
        </motion.div>
    );
};

// Main Header Component
const Header: React.FC = () => {
    const { currentSnack } = useSnackStore();
    const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | null>(null);

    const toggleMenu = (menu: 'file' | 'edit' | 'view') => {
        setActiveMenu(activeMenu === menu ? null : menu);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        if (activeMenu) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [activeMenu]);

    return (
        <>
            <header className="h-12 bg-[var(--bg-panel)] border-b border-[var(--border-color)] flex items-center justify-between px-4 relative z-40">
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-[var(--text-primary)] text-lg">SnackSmith</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1">
                        <button className="btn btn-ghost text-sm px-3 py-1" onClick={() => toggleMenu('file')}>File</button>
                        <button className="btn btn-ghost text-sm px-3 py-1" onClick={() => toggleMenu('edit')}>Edit</button>
                        <button className="btn btn-ghost text-sm px-3 py-1" onClick={() => toggleMenu('view')}>View</button>
                    </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {currentSnack.nutrition && (
                        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-[var(--text-muted)]">Health Score:</span>
                            <span className="font-bold text-white">{Math.round(currentSnack.nutrition.health_score)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button className="btn btn-primary text-xs hidden sm:flex"><Share2 className="w-3 h-3" />Share</button>
                    <button className="btn btn-ghost btn-icon"><Settings size={16} /></button>
                </div>
            </header>

            <AnimatePresence>
                {activeMenu === 'file' && <FileMenu onClose={() => setActiveMenu(null)} />}
                {activeMenu === 'edit' && <EditMenu onClose={() => setActiveMenu(null)} />}
                {activeMenu === 'view' && <ViewMenu onClose={() => setActiveMenu(null)} />}
            </AnimatePresence>
        </>
    );
};

export default function SnackSmithApp() {
    const { initializeApp, ui, currentSnack } = useSnackStore();

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                <AnimatePresence>
                    {ui.showIngredientLibrary && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 350, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex-shrink-0 bg-[var(--bg-panel)] border-r border-[var(--border-color)]"
                        >
                            <IngredientLibrary />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 relative">
                        <SnackCanvas ingredients={currentSnack.ingredients} />
                    </div>
                </div>

                <AnimatePresence>
                    {(ui.showNutritionPanel || ui.showAICoach) && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 360, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex-shrink-0 bg-gray-50 border-l border-[var(--border-color)] overflow-hidden"
                        >
                            {ui.showNutritionPanel && <NutritionPanel />}
                            {ui.showAICoach && <AICoach />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}