import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { MCQ } from '../services/gemini';

interface QuizCardProps {
  question: MCQ;
  selectedOption: number | null;
  onSelect: (index: number) => void;
  showResult: boolean;
}

export default function QuizCard({ question, selectedOption, onSelect, showResult }: QuizCardProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-10">
          {question.question}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = question.correctAnswer === idx;
            
            let borderColor = "border-slate-100";
            let bgColor = "bg-slate-50";
            let textColor = "text-slate-700";
            let icon = null;

            if (showResult) {
              if (isCorrect) {
                borderColor = "border-green-500";
                bgColor = "bg-green-50";
                textColor = "text-green-700";
                icon = <CheckCircle2 className="h-6 w-6 text-green-500" />;
              } else if (isSelected && !isCorrect) {
                borderColor = "border-red-500";
                bgColor = "bg-red-50";
                textColor = "text-red-700";
                icon = <XCircle className="h-6 w-6 text-red-500" />;
              }
            } else if (isSelected) {
              borderColor = "border-blue-500";
              bgColor = "bg-blue-50";
              textColor = "text-blue-700";
            }

            return (
              <motion.button
                key={idx}
                whileHover={!showResult ? { x: 10 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                onClick={() => !showResult && onSelect(idx)}
                disabled={showResult}
                className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left font-bold text-lg ${borderColor} ${bgColor} ${textColor} ${!showResult ? 'hover:border-blue-300 hover:bg-blue-50/50' : 'cursor-default'}`}
              >
                <div className="flex items-center pr-4">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-sm font-black border-2 ${
                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </div>
                {icon}
              </motion.button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100"
        >
          <div className="flex items-start">
            <div className="bg-white p-3 rounded-2xl mr-4 shadow-sm">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-black text-blue-900 mb-2 uppercase tracking-wider">Explanation</h4>
              <p className="text-blue-800 leading-relaxed font-medium">{question.explanation}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
