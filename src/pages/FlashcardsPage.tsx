import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Card {
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [setData, setSetData] = React.useState<any>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [direction, setDirection] = React.useState(0);

  React.useEffect(() => {
    async function fetchSet() {
      if (!setId) return;
      try {
        const docRef = doc(db, 'flashcards', setId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSetData(docSnap.data());
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `flashcards/${setId}`);
      } finally {
        setLoading(false);
      }
    }
    fetchSet();
  }, [setId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Loading Strategy Deck</p>
        </div>
      </div>
    );
  }

  if (!setData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Deck Not Found</h2>
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 font-bold hover:underline">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentCard = setData.cards[currentIndex];
  const progress = ((currentIndex + 1) / setData.cards.length) * 100;

  const nextCard = () => {
    if (currentIndex < setData.cards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 50);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 50);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-12 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-4">
              <BookOpen className="h-3 w-3" />
              <span>Chapter {setData.chapter} Flashcards</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{setData.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-slate-900 mb-2">
              {currentIndex + 1} <span className="text-slate-400">/ {setData.cards.length}</span>
            </div>
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden ml-auto">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative h-[450px] w-full perspective-1000 mb-12">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ x: direction * 100, opacity: 0, rotateY: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-full h-full cursor-pointer touch-none"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-center p-12 text-center border border-slate-100">
                  <div className="absolute top-10 left-10 text-[10px] font-black text-blue-600 uppercase tracking-widest">Question</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSpeak(currentCard.front); }}
                    className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-300 hover:text-blue-600"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    {currentCard.front}
                  </h3>
                  <div className="absolute bottom-10 text-xs font-bold text-slate-300 uppercase tracking-widest">Click to reveal answer</div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-600 rounded-[3rem] shadow-2xl shadow-blue-500/20 flex flex-col items-center justify-center p-12 text-center text-white">
                  <div className="absolute top-10 left-10 text-[10px] font-black text-white/50 uppercase tracking-widest">Answer</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSpeak(currentCard.back); }}
                    className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-2xl transition-colors text-white/50 hover:text-white"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                  <div className="text-xl md:text-2xl font-medium leading-relaxed">
                    {currentCard.back}
                  </div>
                  <div className="absolute bottom-10 text-xs font-bold text-white/50 uppercase tracking-widest">Click to see question</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="p-6 rounded-full bg-white border border-slate-100 shadow-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all hover:-translate-x-1"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            onClick={() => { setIsFlipped(false); setCurrentIndex(0); setDirection(-1); }}
            className="p-6 rounded-full bg-white border border-slate-100 shadow-lg text-slate-600 hover:bg-slate-50 transition-all active:rotate-180"
          >
            <RotateCcw className="h-8 w-8" />
          </button>

          <button
            onClick={nextCard}
            disabled={currentIndex === setData.cards.length - 1}
            className="p-6 rounded-full bg-blue-600 shadow-xl shadow-blue-500/30 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition-all hover:translate-x-1"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
        
        {currentIndex === setData.cards.length - 1 && isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center space-x-3 bg-green-50 text-green-600 px-8 py-4 rounded-3xl font-bold">
              <CheckCircle2 className="h-6 w-6" />
              <span>Congratulations! You've completed this deck.</span>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
