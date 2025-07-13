'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Lightbulb, TrendingUp, Target, Sparkles, Send, Heart, Zap, RefreshCw, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackStore } from '../../stores/snackStore';
import { ChatMessage } from '../../types/snack';

interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, description, onClick, disabled = false }) => (
    <button
        className={`p-3 text-left rounded-lg border-2 transition-all duration-200 ${
            disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-blue-200 hover:border-blue-300 hover:shadow-md text-gray-700'
        }`}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex items-center gap-3 mb-1">{icon}<span className="font-semibold text-gray-800">{label}</span></div>
        <p className="text-sm text-gray-500">{description}</p>
    </button>
);

const SuggestionChip: React.FC<{ suggestion: string; onClick: (suggestion: string) => void; }> = ({ suggestion, onClick }) => (
    <button
        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
        onClick={() => onClick(suggestion)}
    >
        {suggestion}
    </button>
);

const ChatBubble: React.FC<{ message: ChatMessage; }> = ({ message }) => (
    <div className="space-y-4">
        <div className="flex justify-end">
            <div className="flex items-start gap-3 max-w-[80%]">
                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 rounded-br-none shadow-md"><p className="text-sm">{message.message}</p></div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-white" /></div>
            </div>
        </div>
        <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
                <div className="bg-white border rounded-lg px-4 py-2 rounded-bl-none shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.response}</p>
                    <div className="text-xs text-gray-400 mt-2 text-right">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        </div>
    </div>
);

export default function AICoach() {
    const {
        currentSnack,
        chatHistory,
        aiSuggestions,
        chatWithAI,
        improveCurrentSnack,
        getAIRecommendation,
        userPreferences,
    } = useSnackStore();
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'suggestions' | 'improve'>('suggestions');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const hasIngredients = currentSnack.ingredients.length > 0;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isLoading) return;
        setIsLoading(true);
        setInputMessage('');
        setActiveTab('chat');
        await chatWithAI(message);
        setIsLoading(false);
    };

    const handleQuickImprove = async (goal: string) => {
        if (!hasIngredients || isLoading) return;
        setIsLoading(true);
        setActiveTab('chat');
        await improveCurrentSnack([goal]);
        setIsLoading(false);
    };

    const handleGetRecommendation = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setActiveTab('chat');
        await getAIRecommendation();
        setIsLoading(false);
    };

    const quickSuggestions = [ "Make this snack healthier", "Suggest a protein boost", "How do I reduce the sugar?", "Make this keto-friendly" ];
    const tabs = [ { id: 'suggestions', label: 'Quick Help', icon: Lightbulb }, { id: 'improve', label: 'Improve', icon: TrendingUp }, { id: 'chat', label: 'Chat', icon: MessageCircle } ];

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            <div className="p-4 bg-white border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">AI Coach</h2>
                    <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-gray-200 p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`${activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:bg-gray-100'} flex items-center justify-center gap-2 rounded-md p-2 text-sm font-medium transition-all`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 space-y-4 h-full"
                    >
                        {activeTab === 'suggestions' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900">Ask a quick question...</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {quickSuggestions.map((suggestion) => (
                                            <SuggestionChip key={suggestion} suggestion={suggestion} onClick={handleSendMessage} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'improve' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">One-Click Improvements</h3>
                                <p className="text-sm text-gray-600">Let AI optimize your snack based on a specific goal. This will modify your current ingredient list.</p>
                                <div className="grid gap-3">
                                    <QuickAction icon={<Heart className="w-5 h-5 text-red-500" />} label="Maximize Health Score" description="Optimize for the best overall nutritional value." onClick={() => handleQuickImprove('maximize_health_score')} disabled={!hasIngredients || isLoading} />
                                    <QuickAction icon={<Zap className="w-5 h-5 text-blue-500" />} label="Boost Protein Content" description="Add or increase protein-rich ingredients." onClick={() => handleQuickImprove('increase_protein')} disabled={!hasIngredients || isLoading} />
                                    <QuickAction icon={<RefreshCw className="w-5 h-5 text-green-500" />} label="Increase Fiber" description="Focus on ingredients high in dietary fiber." onClick={() => handleQuickImprove('increase_fiber')} disabled={!hasIngredients || isLoading} />
                                    <QuickAction icon={<Sparkles className="w-5 h-5 text-yellow-500" />} label="Get a New Recommendation" description="Generate a completely new snack from scratch." onClick={handleGetRecommendation} disabled={isLoading} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
                                    {chatHistory.length > 0 ? (
                                        chatHistory.map((message) => <ChatBubble key={message.id} message={message} />)
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            <MessageCircle size={40} className="mx-auto opacity-50" />
                                            <p className="mt-2">Ask the AI Coach anything about your snack!</p>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            {activeTab === 'chat' && (
                <div className="p-4 bg-white border-t">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(inputMessage); }}
                            placeholder="Ask the AI Coach..."
                            className="w-full pr-12 pl-4 py-2 bg-gray-100 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSendMessage(inputMessage)}
                            disabled={!inputMessage.trim() || isLoading}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}