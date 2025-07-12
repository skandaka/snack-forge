// src/components/ui/AICoach.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    MessageCircle,
    Send,
    Bot,
    User,
    Lightbulb,
    TrendingUp,
    Target,
    Sparkles,
    RefreshCw,
    Heart,
    Zap
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { ChatMessage } from '../../types/snack';

interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({
                                                     icon,
                                                     label,
                                                     description,
                                                     onClick,
                                                     disabled = false
                                                 }) => (
    <button
        className={`p-3 text-left rounded-lg border-2 transition-all duration-200 ${
            disabled
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-blue-200 hover:border-blue-300 hover:shadow-md text-gray-700'
        }`}
        onClick={onClick}
        disabled={disabled}
    >
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <span className="font-semibold">{label}</span>
        </div>
        <p className="text-sm opacity-75">{description}</p>
    </button>
);

interface SuggestionChipProps {
    suggestion: string;
    onClick: () => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ suggestion, onClick }) => (
    <button
        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
        onClick={onClick}
    >
        {suggestion}
    </button>
);

interface ChatBubbleProps {
    message: ChatMessage;
    isLatest?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isLatest = false }) => (
    <div className="space-y-4">
        {/* User Message */}
        <div className="flex justify-end">
            <div className="flex items-start gap-2 max-w-[80%]">
                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 rounded-br-sm">
                    <p className="text-sm">{message.message}</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                </div>
            </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[80%]">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border rounded-lg px-4 py-2 rounded-bl-sm shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.response}</p>
                    <div className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
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
        ui
    } = useSnackStore();

    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'suggestions' | 'improve'>('suggestions');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const hasIngredients = currentSnack.ingredients.length > 0;
    const hasNutrition = currentSnack.nutrition !== undefined;

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await chatWithAI(inputMessage);
            setInputMessage('');
        } catch (error) {
            console.error('Chat failed:', error);
        }
        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickImprove = async (goal: string) => {
        if (!hasIngredients) return;

        setIsLoading(true);
        try {
            await improveCurrentSnack([goal]);
        } catch (error) {
            console.error('Quick improve failed:', error);
        }
        setIsLoading(false);
    };

    const handleGetRecommendation = async () => {
        setIsLoading(true);
        try {
            await getAIRecommendation(userPreferences, userPreferences.health_goals);
        } catch (error) {
            console.error('Get recommendation failed:', error);
        }
        setIsLoading(false);
    };

    const quickSuggestions = [
        "How can I make this snack healthier?",
        "What ingredients work well together?",
        "Can you suggest a protein boost?",
        "How do I reduce the sugar content?",
        "What's the best ratio for energy bars?",
        "Make this snack keto-friendly"
    ];

    const tabs = [
        { id: 'suggestions', label: 'Quick Help', icon: Lightbulb },
        { id: 'improve', label: 'Improve', icon: TrendingUp },
        { id: 'chat', label: 'Chat', icon: MessageCircle }
    ];

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white border-b">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">AI Nutrition Coach</h2>
                        <p className="text-sm text-gray-600">Your personal snack optimization assistant</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-white text-purple-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                onClick={() => setActiveTab(tab.id as any)}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'suggestions' && (
                    <div className="h-full overflow-y-auto p-4 space-y-4">
                        {/* Status Card */}
                        {hasNutrition && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    <span className="font-semibold text-purple-800">Snack Analysis</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-purple-700">Health Score:</span>
                                        <span className="font-bold ml-2">{Math.round(currentSnack.nutrition!.health_score)}/100</span>
                                    </div>
                                    <div>
                                        <span className="text-purple-700">Ingredients:</span>
                                        <span className="font-bold ml-2">{currentSnack.ingredients.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current AI Suggestions */}
                        {aiSuggestions.length > 0 && (
                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Target className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-gray-900">Smart Suggestions</span>
                                </div>
                                <div className="space-y-2">
                                    {aiSuggestions.map((suggestion, index) => (
                                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded border border-green-200">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                            <span className="text-sm text-green-800">{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Quick Actions</h3>

                            <div className="grid gap-3">
                                <QuickAction
                                    icon={<Heart className="w-5 h-5 text-red-500" />}
                                    label="Get New Recommendation"
                                    description="AI will suggest a complete snack based on your preferences"
                                    onClick={handleGetRecommendation}
                                    disabled={isLoading}
                                />

                                <QuickAction
                                    icon={<Zap className="w-5 h-5 text-blue-500" />}
                                    label="Boost Protein"
                                    description="Add protein-rich ingredients to your current snack"
                                    onClick={() => handleQuickImprove('increase_protein')}
                                    disabled={!hasIngredients || isLoading}
                                />

                                <QuickAction
                                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                                    label="Add Fiber"
                                    description="Improve digestive health with high-fiber ingredients"
                                    onClick={() => handleQuickImprove('increase_fiber')}
                                    disabled={!hasIngredients || isLoading}
                                />

                                <QuickAction
                                    icon={<RefreshCw className="w-5 h-5 text-purple-500" />}
                                    label="Reduce Sugar"
                                    description="Lower sugar content while maintaining taste"
                                    onClick={() => handleQuickImprove('reduce_sugar')}
                                    disabled={!hasIngredients || isLoading}
                                />
                            </div>
                        </div>

                        {/* Quick Questions */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Ask About...</h3>
                            <div className="flex flex-wrap gap-2">
                                {quickSuggestions.map((suggestion, index) => (
                                    <SuggestionChip
                                        key={index}
                                        suggestion={suggestion}
                                        onClick={() => {
                                            setActiveTab('chat');
                                            setInputMessage(suggestion);
                                            setTimeout(() => inputRef.current?.focus(), 100);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'improve' && (
                    <div className="h-full overflow-y-auto p-4 space-y-4">
                        {!hasIngredients ? (
                            <div className="text-center py-8">
                                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">No snack to improve</h3>
                                <p className="text-gray-500">Add some ingredients first, then I can help you optimize!</p>
                            </div>
                        ) : (
                            <>
                                {/* Current Snack Summary */}
                                {hasNutrition && (
                                    <div className="bg-white border rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Current Snack Analysis</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Health Score:</span>
                                                <span className="font-bold ml-2 text-lg">
                          {Math.round(currentSnack.nutrition!.health_score)}/100
                        </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Protein:</span>
                                                <span className="font-bold ml-2">
                          {currentSnack.nutrition!.nutrition_per_100g.protein_g.toFixed(1)}g
                        </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Fiber:</span>
                                                <span className="font-bold ml-2">
                          {currentSnack.nutrition!.nutrition_per_100g.fiber_g.toFixed(1)}g
                        </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Sugar:</span>
                                                <span className="font-bold ml-2">
                          {currentSnack.nutrition!.nutrition_per_100g.sugars_g.toFixed(1)}g
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Improvement Goals */}
                                <div className="bg-white border rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Choose Improvement Goal</h3>

                                    <div className="grid gap-3">
                                        {[
                                            { goal: 'increase_protein', label: 'Boost Protein', icon: '💪', desc: 'Add protein for muscle support' },
                                            { goal: 'increase_fiber', label: 'Add Fiber', icon: '🌾', desc: 'Improve digestive health' },
                                            { goal: 'reduce_sugar', label: 'Lower Sugar', icon: '🍯', desc: 'Reduce sugar content naturally' },
                                            { goal: 'keto_friendly', label: 'Make Keto', icon: '🥑', desc: 'Low-carb, high-fat adaptation' },
                                            { goal: 'increase_antioxidants', label: 'Antioxidant Boost', icon: '🫐', desc: 'Add superfoods and berries' },
                                            { goal: 'post_workout', label: 'Post-Workout', icon: '🏋️', desc: 'Optimize for recovery' }
                                        ].map((item) => (
                                            <button
                                                key={item.goal}
                                                className="p-3 text-left rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                                onClick={() => handleQuickImprove(item.goal)}
                                                disabled={isLoading}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{item.icon}</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{item.label}</div>
                                                        <div className="text-sm text-gray-600">{item.desc}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Loading State */}
                                {isLoading && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            <span className="text-blue-700">AI is analyzing your snack and generating improvements...</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {chatHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Start a conversation</h3>
                                    <p className="text-gray-500 mb-4">Ask me anything about nutrition, ingredients, or snack optimization!</p>

                                    {/* Suggested starters */}
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                                            <SuggestionChip
                                                key={index}
                                                suggestion={suggestion}
                                                onClick={() => {
                                                    setInputMessage(suggestion);
                                                    setTimeout(() => inputRef.current?.focus(), 100);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chatHistory.map((message, index) => (
                                        <ChatBubble
                                            key={message.id}
                                            message={message}
                                            isLatest={index === chatHistory.length - 1}
                                        />
                                    ))}

                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex items-start gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-white border rounded-lg px-4 py-2 rounded-bl-sm shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                                        <span className="text-sm text-gray-600">Thinking...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Ask your nutrition coach anything..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isLoading}
                                />
                                <button
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isLoading}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Quick suggestions for empty input */}
                            {!inputMessage && chatHistory.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {quickSuggestions.slice(0, 4).map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                            onClick={() => setInputMessage(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}