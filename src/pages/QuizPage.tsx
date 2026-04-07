import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, ChevronLeft, Trophy, CheckCircle2, XCircle, Clock, AlertCircle, Dumbbell, ArrowLeft } from 'lucide-react';

interface QuizPageProps {
  user: any;
}

export default function QuizPage({ user }: QuizPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = React.useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    const fetchQuiz = async () => {
      if (!id || !user) return;
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', id));
        if (quizDoc.exists()) {
          const data = { id: quizDoc.id, ...quizDoc.data() } as any;
          
          // Security check: Is this quiz published and assigned to this student?
          // (Admins can bypass)
          const isAdmin = user.email === "drnikhildesale@gmail.com";
          if (!isAdmin && (data.status !== 'published' || !data.assignedTo?.includes(user.uid))) {
            navigate('/dashboard');
            return;
          }
          
          setQuiz(data);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `quizzes/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] ?? null);
      setShowExplanation(answers[currentQuestion + 1] !== undefined);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setShowExplanation(true);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    const correctCount = answers.reduce((acc, ans, idx) => {
      return acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0);
    }, 0);
    
    const score = correctCount * (quiz.pointsPerQuestion || 1);
    const totalPossible = quiz.questions.length * (quiz.pointsPerQuestion || 1);

    try {
      await addDoc(collection(db, 'scores'), {
        studentId: user.uid,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score,
        totalQuestions: quiz.questions.length,
        totalPossible,
        completedAt: serverTimestamp()
      });
      setFinished(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Preparing Quiz</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const correctCount = answers.reduce((acc, ans, idx) => acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0), 0);
    const score = correctCount * (quiz.pointsPerQuestion || 1);
    const totalPossible = quiz.questions.length * (quiz.pointsPerQuestion || 1);
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-blue-500/5 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-red-600"></div>
          
          <div className="bg-blue-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Trophy className="h-12 w-12 text-blue-600" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Quiz Completed!</h1>
          <p className="text-slate-500 font-medium mb-10">Excellent work on completing the {quiz.title} challenge.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="text-4xl font-black text-slate-900 mb-1">{correctCount}/{quiz.questions.length}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Correct Answers</div>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="text-4xl font-black text-blue-600 mb-1">{score}/{totalPossible}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Points ({percentage}%)</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-grow bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-grow bg-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Quiz Header */}
      <div className="mb-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-xs transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Exit Quiz
        </button>
        <div className="flex items-center space-x-4">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </div>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-[5rem] -z-0 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 shadow-inner">
            <Dumbbell className="h-8 w-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-12 leading-tight tracking-tight">
            {question.question}
          </h2>

          <div className="space-y-4 mb-12">
            {question.options.map((option: string, idx: number) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === question.correctAnswer;
              
              let buttonClass = "w-full p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group ";
              
              if (showExplanation) {
                if (isCorrectOption) {
                  buttonClass += "bg-green-50 border-green-200 text-green-700";
                } else if (isSelected) {
                  buttonClass += "bg-red-50 border-red-200 text-red-700";
                } else {
                  buttonClass += "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                }
              } else {
                buttonClass += "bg-slate-50 border-slate-100 text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={showExplanation}
                  className={buttonClass}
                >
                  <span className="flex-grow">{option}</span>
                  {showExplanation && isCorrectOption && <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />}
                  {showExplanation && isSelected && !isCorrectOption && <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className={`p-8 rounded-[2rem] mb-12 animate-in fade-in slide-in-from-top-4 duration-500 ${
              isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                {isCorrect ? (
                  <div className="bg-green-100 p-2 rounded-lg text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
                ) : (
                  <div className="bg-red-100 p-2 rounded-lg text-red-600"><AlertCircle className="h-5 w-5" /></div>
                )}
                <h4 className={`font-black uppercase tracking-widest text-xs ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                </h4>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
                <ReactMarkdown>{question.explanation}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-10 border-t border-slate-50">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!showExplanation || submitting}
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center group"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {currentQuestion === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
