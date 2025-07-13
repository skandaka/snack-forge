'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Upload, Download, Share2, Settings, User, Heart, Zap, ChefHat, Search, Bell, HelpCircle, Menu, X, Plus, BookOpen, Award, TrendingUp, Sparkles, Coffee, Palette, Sun, Moon, Crown, Star, Camera, FileText, FolderOpen, LucideProps } from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { NotificationState } from '../../types/snack';

const SaveSnackModal: React.FC<{
    onClose: () => void;
    onSave: (name: string, description: string) => void;
    currentSnackName: string;
}> = ({ onClose, onSave, currentSnackName }) => {
    const [name, setName] = useState(currentSnackName);
    const [description, setDescription] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-96" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4">Save Snack</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Snack Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input w-full mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input w-full mt-1" rows={3}></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={() => onSave(name, description)} className="btn btn-primary">Save</button>
                </div>
            </div>
        </div>
    );
};

const Header: React.FC = () => {
    const { currentSnack, saveSnack, showNotification, userPreferences, notifications, dismissNotification } = useSnackStore();
    const [showSaveModal, setShowSaveModal] = useState(false);

    const handleSaveSnack = async (name: string, description: string) => {
        await saveSnack(name, description);
        setShowSaveModal(false);
    };

    return (
        <>
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                            <Sparkles size={16} className="text-white"/>
                        </div>
                        <h1 className="text-xl font-bold">SnackSmith</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSaveModal(true)} className="btn btn-secondary hidden md:flex"><Save size={16}/>Save</button>
                    <button className="btn btn-primary hidden md:flex"><Share2 size={16}/>Share</button>
                    <button className="btn-icon"><Bell size={18} /></button>
                    <button className="btn-icon"><Settings size={18} /></button>
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={18} />
                    </div>
                </div>
            </header>
            <AnimatePresence>
                {showSaveModal && (
                    <SaveSnackModal
                        onClose={() => setShowSaveModal(false)}
                        onSave={handleSaveSnack}
                        currentSnackName={currentSnack.name}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;