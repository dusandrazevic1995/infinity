import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Ghost, 
  BookOpen, 
  Loader2,
  Sword,
  Shield,
  Eye,
  Search,
  Zap,
  Languages,
  Image as ImageIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateNextSegment, generateEndingImage } from './services/gemini';
import { GameState, StorySegment, Choice } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    history: [],
    currentSegment: null,
    status: 'start',
    maxSteps: 12,
    language: 'English',
    gender: 'male',
  });
  const [initialPrompt, setInitialPrompt] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);
  const [endingImage, setEndingImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const languages = [
    'English', 'Serbian', 'Spanish', 'French', 'German', 'Italian', 
    'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Korean', 'Arabic',
    'Dutch', 'Greek', 'Turkish', 'Hindi', 'Bengali', 'Vietnamese', 
    'Thai', 'Polish', 'Swedish', 'Danish', 'Finnish', 'Norwegian',
    'Hungarian', 'Czech', 'Slovak', 'Romanian', 'Bulgarian', 'Hebrew'
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    if (!scrollRef.current) return;

    autoScrollInterval.current = setInterval(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight < scrollHeight) {
          scrollRef.current.scrollTop += 1;
        } else {
          stopAutoScroll();
        }
      }
    }, 50); // Slow scroll
  };

  const MAX_STEPS = 12;

  const startGame = async (prompt?: string) => {
    setGameState(prev => ({ ...prev, status: 'loading', history: [], currentSegment: null }));
    setEndingImage(null);
    try {
      const segment = await generateNextSegment([], gameState.maxSteps, gameState.language, gameState.gender, prompt);
      setGameState(prev => ({
        ...prev,
        history: [],
        currentSegment: segment,
        status: 'playing',
      }));
    } catch (error) {
      setGameState(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (!gameState.currentSegment) return;
    setEndingImage(null);

    const newHistory = [
      ...gameState.history,
      { story: gameState.currentSegment.text, choice: choice.text },
    ];

    setGameState(prev => ({ ...prev, status: 'loading', history: newHistory }));

    try {
      const segment = await generateNextSegment(newHistory, gameState.maxSteps, gameState.language, gameState.gender);
      setGameState(prev => ({
        ...prev,
        history: newHistory,
        currentSegment: segment,
        status: 'playing',
      }));
    } catch (error) {
      setGameState(prev => ({ ...prev, status: 'error' }));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0 });
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [gameState.currentSegment]);

  const handleGenerateImage = async () => {
    if (!gameState.currentSegment) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateEndingImage(gameState.currentSegment.text);
      setEndingImage(imageUrl);
    } catch (error) {
      console.error("Failed to generate image", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const stepsLeft = Math.max(0, gameState.maxSteps - gameState.history.length);

  const getChoiceIcon = (type?: string) => {
    switch (type) {
      case 'aggressive': return <Sword className="w-4 h-4 text-red-400" />;
      case 'cautious': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'mystical': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'curious': return <Search className="w-4 h-4 text-emerald-400" />;
      default: return <Eye className="w-4 h-4 text-white/40" />;
    }
  };

  const getChoiceColor = (type?: string) => {
    switch (type) {
      case 'aggressive': return "hover:border-red-500/50 hover:bg-red-500/10";
      case 'cautious': return "hover:border-blue-500/50 hover:bg-blue-500/10";
      case 'mystical': return "hover:border-purple-500/50 hover:bg-purple-500/10";
      case 'curious': return "hover:border-emerald-500/50 hover:bg-emerald-500/10";
      default: return "hover:border-orange-500/50 hover:bg-white/10";
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
      <div className="atmosphere" />
      
      <AnimatePresence mode="wait">
        {gameState.status === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl w-full glass-panel p-8 md:p-12 text-center space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-block"
              >
                <Ghost className="w-16 h-16 text-orange-500 mx-auto" />
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-serif italic text-white tracking-tight">
                Infinite Echoes
              </h1>
              <p className="text-lg text-white/60 max-w-md mx-auto">
                Every choice ripples through eternity. Where will your echoes lead?
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, gender: 'male' }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all duration-300 text-sm font-medium",
                      gameState.gender === 'male'
                        ? "bg-orange-500/20 border-orange-500 text-orange-500"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, gender: 'female' }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all duration-300 text-sm font-medium",
                      gameState.gender === 'female'
                        ? "bg-orange-500/20 border-orange-500 text-orange-500"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    Female
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter a theme (e.g., A clockwork city, A forgotten forest...)"
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && startGame(initialPrompt)}
                  />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowLanguages(!showLanguages)}
                    className="h-full px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-white/60"
                  >
                    <Languages className="w-5 h-5" />
                    <span className="hidden md:inline text-sm">{gameState.language}</span>
                  </button>
                  
                  <AnimatePresence>
                    {showLanguages && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 bottom-full mb-2 w-48 bg-black border border-white/10 rounded-2xl z-50 p-2 grid grid-cols-1 gap-1 max-h-64 overflow-y-auto scrollbar-hide shadow-2xl"
                      >
                        {languages.map(lang => (
                          <button
                            key={lang}
                            onClick={() => {
                              setGameState(prev => ({ ...prev, language: lang }));
                              setShowLanguages(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                              gameState.language === lang 
                                ? "bg-orange-500/20 text-orange-500" 
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() => startGame(initialPrompt)}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Begin the Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {(gameState.status === 'playing' || gameState.status === 'loading') && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[85vh]"
          >
            {/* Story Area - Expanded to 10 columns */}
            <div className="lg:col-span-10 flex flex-col h-full glass-panel overflow-hidden">
              <div className="p-4 border-bottom border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setGameState({ ...gameState, status: 'start', history: [] })}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-medium">
                    <BookOpen className="w-4 h-4" />
                    Chapter {gameState.history.length + 1}
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  {gameState.currentSegment?.isEnding ? (
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="flex items-center gap-2 text-[10px] text-orange-500 hover:text-orange-400 uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Visualizing...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3" />
                          Visualize Ending
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-[10px] text-orange-500/60 uppercase tracking-widest font-bold">
                      {stepsLeft} choices remain
                    </div>
                  )}
                </div>
                {gameState.status === 'loading' && (
                  <div className="flex items-center gap-2 text-orange-500 text-xs uppercase tracking-widest font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Echoing...
                  </div>
                )}
              </div>
              
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 md:p-20 scrollbar-hide"
                onWheel={stopAutoScroll}
                onTouchStart={stopAutoScroll}
              >
                <AnimatePresence mode="wait">
                  {gameState.currentSegment && (
                    <motion.div
                      key={gameState.currentSegment.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="markdown-body max-w-4xl mx-auto"
                    >
                      <ReactMarkdown>{gameState.currentSegment.text}</ReactMarkdown>
                      
                      {endingImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                        >
                          <img 
                            src={endingImage} 
                            alt="Ending Scene" 
                            className="w-full h-auto"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {gameState.status === 'loading' && !gameState.currentSegment && (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-white/10 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Choices Area - Reduced to 2 columns */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1 px-2">
                CHOOSE your move
              </div>
              <div className="space-y-2">
                {gameState.currentSegment?.choices?.map((choice, idx) => (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    disabled={gameState.status === 'loading'}
                    onClick={() => handleChoice(choice)}
                    className={cn(
                      "choice-btn py-4 px-3 flex-col text-center justify-center gap-2",
                      getChoiceColor(choice.type),
                      gameState.status === 'loading' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {getChoiceIcon(choice.type)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{choice.text}</span>
                  </motion.button>
                ))}

                {gameState.currentSegment?.isEnding && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setGameState({ ...gameState, status: 'start', history: [], currentSegment: null })}
                    className="w-full p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-all flex flex-col items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Journey
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {gameState.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md w-full glass-panel p-8 text-center space-y-6"
          >
            <Ghost className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-serif italic text-white">The Echoes Faded</h2>
            <p className="text-white/60">Something went wrong in the weave of time. The story has been lost to the void.</p>
            <button
              onClick={() => setGameState({ ...gameState, status: 'start' })}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
