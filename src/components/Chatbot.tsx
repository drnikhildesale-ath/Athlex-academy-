import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChatResponse, ChatMessage } from '../services/gemini';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hi! I'm your Athlex Academy assistant. How can I help you with our courses or your fitness studies today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Show nudge after 200 seconds (as requested)
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowNudge(true);
      }
    }, 200000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await getChatResponse(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom left' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">Athlex AI Expert</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Online & Ready</div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`mt-1 p-1.5 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border border-blue-50'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                        : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
                    }`}>
                      <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${
                        msg.role === 'user' ? 'prose-invert' : ''
                      }`}>
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && showNudge && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            className="absolute bottom-20 left-0 mb-2 ml-2 bg-white px-4 py-2 rounded-2xl shadow-xl border border-blue-100 text-sm font-bold text-blue-600 whitespace-nowrap"
          >
            Ask me your doubts!
            <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-white border-l border-b border-blue-100"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNudge(false);
        }}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center relative group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute left-full ml-4 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Ask me your doubts
          </span>
        )}
      </motion.button>
    </div>
  );
};
