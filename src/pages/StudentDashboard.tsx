import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Video, BookOpen, Trophy, Clock, ChevronRight, Star, Dumbbell, PlayCircle, FileText, GraduationCap, Globe, ExternalLink, Phone, Award, X, Megaphone, CheckCircle2, Activity, Lightbulb, MessageSquare, BookCheck, Sparkles, LogOut, ArrowRight, User, Lock } from 'lucide-react';

interface StudentDashboardProps {
  user: any;
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [courses, setCourses] = React.useState<any[]>([]);
  const [activeCourseId, setActiveCourseId] = React.useState<string | null>(null);
  const [quizzes, setQuizzes] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [liveClasses, setLiveClasses] = React.useState<any[]>([]);
  const [flashcardSets, setFlashcardSets] = React.useState<any[]>([]);
  const [exercises, setExercises] = React.useState<any[]>([]);
  const [knowledgeVideos, setKnowledgeVideos] = React.useState<any[]>([]);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [recordings, setRecordings] = React.useState<any[]>([]);
  const [progress, setProgress] = React.useState<any | null>(null);
  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [activeVideo, setActiveVideo] = React.useState<any | null>(null);
  const [isPipMinimized, setIsPipMinimized] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const [scores, setScores] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [feedbackRating, setFeedbackRating] = React.useState(5);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [feedbackCategory, setFeedbackCategory] = React.useState<'understanding' | 'teaching'>('understanding');
  const [showGuide, setShowGuide] = React.useState(() => {
    // Check if user has seen the guide before
    const seen = localStorage.getItem(`guide_seen_${user.uid}`);
    return !seen;
  });

  const dismissGuide = () => {
    localStorage.setItem(`guide_seen_${user.uid}`, 'true');
    setShowGuide(false);
  };

  React.useEffect(() => {
    if (!user?.uid) return;

    // Fetch all available courses
    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter by approved course IDs from user profile
      const approvedCourses = fetchedCourses.filter(c => user.approvedCourseIds?.includes(c.id));
      setCourses(approvedCourses);
      
      // Auto-select first course if none selected OR if current selected is not in approved list
      if (approvedCourses.length > 0) {
        if (!activeCourseId || !user.approvedCourseIds?.includes(activeCourseId)) {
          setActiveCourseId(approvedCourses[0].id);
        }
      } else {
        setActiveCourseId(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'courses'));

    // Check for feedback trigger (all materials + quiz for a chapter done)
    const checkFeedbackStatus = async () => {
      if (!activeCourseId || !user?.uid) return;
      
      // Basic logic: if student has a score for a chapter and has viewed materials
      // For now, we'll check if they completed a quiz in the active course
      const lastQuizScore = scores.find(s => s.courseId === activeCourseId);
      if (lastQuizScore) {
        // Only show if not already submitted for this course/chapter
        const feedbackQuery = query(
          collection(db, 'feedbacks'),
          where('studentId', '==', user.uid),
          where('courseId', '==', activeCourseId)
        );
        const feedbackSnap = await getDocs(feedbackQuery);
        if (feedbackSnap.empty) {
          setShowFeedbackModal(true);
        }
      }
    };

    if (scores.length > 0) {
      checkFeedbackStatus();
    }

    // Only show published quizzes assigned to this student
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('status', '==', 'published'),
      where('assignedTo', 'array-contains', user.uid)
    );
    
    const unsubscribeQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quizzes'));

    // Fetch assigned materials
    const materialsQuery = query(
      collection(db, 'materials'),
      where('assignedTo', 'array-contains', user.uid)
    );
    const unsubscribeMaterials = onSnapshot(materialsQuery, (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'materials'));

    // Fetch assigned live classes
    const liveClassesQuery = query(
      collection(db, 'liveClasses'),
      where('assignedTo', 'array-contains', user.uid)
    );
    const unsubscribeLiveClasses = onSnapshot(liveClassesQuery, (snapshot) => {
      setLiveClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'liveClasses'));

    // Fetch assigned recordings
    const recordingsQuery = query(
      collection(db, 'classRecordings'),
      where('assignedTo', 'array-contains', user.uid)
    );
    const unsubscribeRecordings = onSnapshot(recordingsQuery, (snapshot) => {
      setRecordings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'classRecordings'));

    // Fetch assigned flashcard sets
    const flashcardsQuery = query(
      collection(db, 'flashcards'),
      where('assignedTo', 'array-contains', user.uid)
    );
    const unsubscribeFlashcards = onSnapshot(flashcardsQuery, (snapshot) => {
      setFlashcardSets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'flashcards'));

    // Fetch Exercises
    const exercisesQuery = query(collection(db, 'exercises'), orderBy('createdAt', 'desc'));
    const unsubscribeExercises = onSnapshot(exercisesQuery, (snapshot) => {
      setExercises(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exercises'));

    // Fetch Knowledge Videos
    const knowledgeQuery = query(collection(db, 'knowledgeVideos'), orderBy('createdAt', 'desc'));
    const unsubscribeKnowledge = onSnapshot(knowledgeQuery, (snapshot) => {
      setKnowledgeVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'knowledgeVideos'));

    // Fetch Announcements
    const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    // Fetch Chat Messages
    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('studentId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chatMessages'));

    const scoresQuery = query(
      collection(db, 'scores'), 
      where('studentId', '==', user.uid),
      orderBy('completedAt', 'desc')
    );
    const unsubscribeScores = onSnapshot(scoresQuery, (snapshot) => {
      setScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'scores'));

    // Fetch progress
    let unsubscribeProgress = () => {};
    if (activeCourseId) {
      const progressQuery = query(
        collection(db, 'userProgress'),
        where('uid', '==', user.uid),
        where('courseId', '==', activeCourseId)
      );
      unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
        if (!snapshot.empty) {
          setProgress({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setProgress(null);
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'userProgress'));
    }

    return () => {
      unsubscribeCourses();
      unsubscribeQuizzes();
      unsubscribeMaterials();
      unsubscribeLiveClasses();
      unsubscribeRecordings();
      unsubscribeFlashcards();
      unsubscribeExercises();
      unsubscribeKnowledge();
      unsubscribeAnnouncements();
      unsubscribeChat();
      unsubscribeScores();
      unsubscribeProgress();
    };
  }, [user.uid, activeCourseId, scores.length]);

  const handleSendFeedback = async () => {
    if (!user?.uid || !activeCourseId) return;

    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'feedbacks'), {
        studentId: user.uid,
        studentName: user.displayName || user.email,
        courseId: activeCourseId,
        courseTitle: courses.find(c => c.id === activeCourseId)?.title || 'Unknown Course',
        rating: feedbackRating,
        comment: feedbackText,
        category: feedbackCategory,
        createdAt: serverTimestamp()
      });
      setShowFeedbackModal(false);
      setFeedbackText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'feedbacks');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid) return;

    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'chatMessages'), {
        studentId: user.uid,
        studentEmail: user.email,
        text: newMessage,
        sender: 'student',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chatMessages');
    }
  };

  const toggleItemCompletion = async (itemId: string) => {
    if (!user?.uid || !activeCourseId) return;

    try {
      const { setDoc, doc, collection, serverTimestamp } = await import('firebase/firestore');
      const completedItems = progress?.completedItems || [];
      const newCompletedItems = completedItems.includes(itemId)
        ? completedItems.filter((id: string) => id !== itemId)
        : [...completedItems, itemId];

      const progressId = progress?.id || `${user.uid}_${activeCourseId}`;
      await setDoc(doc(db, 'userProgress', progressId), {
        uid: user.uid,
        courseId: activeCourseId,
        completedItems: newCompletedItems,
        lastAccessedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `userProgress/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  // Handle case with no courses
  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center border border-slate-100 shadow-2xl shadow-blue-500/10">
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
            <Lock className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black font-serif italic text-slate-900 mb-4 italic">Academy Access Pending</h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-10 italic">
            Welcome to <span className="text-slate-900 font-bold">Athlex Academy</span>. You don't have any assigned courses yet. Please wait for the admin to approve your enrollment.
          </p>
          <div className="space-y-4">
            <a 
              href="https://chat.whatsapp.com/CDwia073NgaK3WsQOxME7b" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Contact Support
            </a>
            <Link 
              to="/"
              className="block w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

    const courseScores = scores.filter(s => !activeCourseId || s.courseId === activeCourseId);
    const averageScore = courseScores.length > 0 
    ? Math.round(courseScores.reduce((acc, s) => acc + (s.totalQuestions > 0 ? s.score / s.totalQuestions : 0), 0) / courseScores.length * 100)
    : 0;

  // Track progress based on completed items + quiz scores
  const completedItems = progress?.completedItems || [];
  const activeCourseItems = {
    recordings: recordings.filter(r => r.courseId === activeCourseId),
    materials: materials.filter(m => m.courseId === activeCourseId),
    quizzes: quizzes.filter(q => q.courseId === activeCourseId),
    flashcards: flashcardSets.filter(s => s.courseId === activeCourseId)
  };

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const totalQuizzesForProgress = activeCourse?.totalQuizzes || 16;
  const uniqueQuizzesSolved = new Set(courseScores.map(s => s.quizId)).size;
  
  const roadmapProgress = totalQuizzesForProgress > 0 
    ? Math.min(Math.round((uniqueQuizzesSolved / totalQuizzesForProgress) * 100), 100)
    : 0;

  const isApprovedForActiveCourse = user.approvedCourseIds?.includes(activeCourseId);

  const TOTAL_CHAPTERS = 20;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-white lg:sticky lg:top-0 h-auto lg:h-screen border-r border-slate-100 flex flex-col p-6 shadow-sm overflow-y-auto">
        <Link to="/" className="flex items-center space-x-3 mb-10 p-2 hover:bg-slate-50 rounded-2xl transition-all">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black font-serif italic text-slate-900 leading-tight">Athlex Academy</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Back to Website</p>
          </div>
        </Link>

        <nav className="space-y-1 mb-12 text-sm font-bold">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-4">MAIN PERSPECTIVE</div>
          <button 
            onClick={() => {
              setActiveVideo(null);
            }} 
            className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all ${!activeVideo ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <GraduationCap className="h-5 w-5" />
            <span>My Academy</span>
          </button>
          <button onClick={() => setIsChatOpen(true)} className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <MessageSquare className="h-5 w-5" />
            <span>Support Chat</span>
          </button>
          <a href="https://chat.whatsapp.com/CDwia073NgaK3WsQOxME7b" target="_blank" rel="noopener noreferrer" className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <Phone className="h-5 w-5" />
            <span>Mentor Support</span>
          </a>
          
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-4 px-4">RESOURCES</div>
          <button className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <Lightbulb className="h-5 w-5" />
            <span>Knowledge Hub</span>
          </button>
          <button className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <BookOpen className="h-5 w-5" />
            <span>Academy Blogs</span>
          </button>
          <button className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <Award className="h-5 w-5" />
            <span>Hall of Fame</span>
          </button>
        </nav>

        <div className="mt-auto p-6 bg-slate-50 rounded-3xl border border-slate-100">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CURRENT COURSE</div>
           <select 
             value={activeCourseId || ''}
             onChange={(e) => setActiveCourseId(e.target.value)}
             className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
           >
             {courses.map(course => (
               <option key={course.id} value={course.id}>{course.title}</option>
             ))}
           </select>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto relative px-0"
        >
          {/* Welcome & Context Header */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-4">
                  <Sparkles className="h-3 w-3" />
                  <span>Enrolled Academy Student</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black font-serif text-slate-900 tracking-tight italic mb-3 flex items-center gap-4">
                  Hello, <span className="text-blue-600 underline decoration-blue-200">{user.displayName?.split(' ')[0]}!</span>
                  {user.batch && (
                    <span className="inline-block text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest not-italic">
                      {user.batch}
                    </span>
                  )}
                </h1>
                <p className="text-slate-500 font-medium italic">Welcome to <span className="text-slate-900 font-bold">Athlex Academy</span>. Your performance journey continues here.</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Progress</div>
                  <div className="text-sm font-bold text-slate-900">{roadmapProgress}% Completed</div>
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-3 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {!isApprovedForActiveCourse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-amber-500/10 mb-10"
              >
                <div className="w-16 h-16 bg-amber-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Lock className="h-8 w-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Access Pending for {courses.find(c => c.id === activeCourseId)?.title}</h3>
                  <p className="text-amber-700 font-medium text-sm leading-relaxed">
                    You are currently viewing the course curriculum. Access to quizzes, materials, and live recordings will be granted once the admin approves your enrollment for this specific course. Join our WhatsApp community for instant approval.
                  </p>
                </div>
                <a 
                  href="https://chat.whatsapp.com/CDwia073NgaK3WsQOxME7b" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/20"
                >
                  Get Approved
                </a>
              </motion.div>
            )}
          </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="mb-12"
          >
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-[3rem] p-8 md:p-12 text-white relative shadow-2xl shadow-blue-500/30 overflow-hidden group">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
              
              <button 
                onClick={dismissGuide}
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:rotate-90 z-20"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-[2.5rem] border border-white/20 backdrop-blur-xl flex items-center justify-center flex-shrink-0 animate-bounce-slow">
                  <GraduationCap className="h-12 w-12 md:h-16 md:w-16 text-white" />
                </div>
                
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                    Welcome to your <span className="text-blue-200">Signature Academy.</span>
                  </h2>
                  <p className="text-lg md:text-xl text-blue-100 font-medium mb-10 max-w-2xl">
                    Everything you need to master your ACE-CPT certification is right here. Let's explore your dashboard.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: <Dumbbell className="h-5 w-5" />, title: "Quizzes", desc: "Signature chapter-wise tests" },
                      { icon: <BookOpen className="h-5 w-5" />, title: "Materials", desc: "PDFs & Cloud Resources" },
                      { icon: <Video className="h-5 w-5" />, title: "Live Classes", desc: "Interact with mentors live" },
                      { icon: <Phone className="h-5 w-5" />, title: "Community", desc: "24/7 WhatsApp Support" }
                    ].map((step, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        key={i} 
                        className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                      >
                        <div className="text-blue-200 mb-3">{step.icon}</div>
                        <div className="text-white font-bold text-sm mb-1">{step.title}</div>
                        <div className="text-blue-100/70 text-xs">{step.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Context Picker */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex space-x-2">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setActiveCourseId(course.id)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all flex items-center space-x-2 ${
                activeCourseId === course.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>{course.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Announcements */}
      {announcements.filter(a => {
        const isSystemWide = !a.courseId && !a.batch;
        const matchesCourse = !a.courseId || user.approvedCourseIds?.includes(a.courseId);
        const matchesBatch = !a.batch || a.batch.toLowerCase().trim() === user.batch?.toLowerCase().trim();
        return isSystemWide || (matchesCourse && matchesBatch);
      }).length > 0 && (
        <div className="mb-12 space-y-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-red-50 p-2 rounded-lg">
              <Megaphone className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Announcements & Tasks</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {announcements.filter(a => {
              const isSystemWide = !a.courseId && !a.batch;
              const matchesCourse = !a.courseId || user.approvedCourseIds?.includes(a.courseId);
              const matchesBatch = !a.batch || a.batch.toLowerCase().trim() === user.batch?.toLowerCase().trim();
              return isSystemWide || (matchesCourse && matchesBatch);
            }).map((ann) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-6 rounded-3xl border-l-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  ann.type === 'urgent' ? 'bg-red-50 border-red-500' : 
                  ann.type === 'task' ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{ann.title}</h3>
                      {ann.courseId && (
                        <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                          {courses.find(c => c.id === ann.courseId)?.title || 'Course'}
                        </span>
                      )}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      ann.type === 'urgent' ? 'bg-red-600 text-white animate-pulse' :
                      ann.type === 'task' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {ann.type}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                  {new Date(ann.createdAt?.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Certification Roadmap: Success Pointer */}
      <div className="mb-12">
        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight mb-2 italic">Certification Roadmap</h2>
              <p className="text-slate-500 font-medium italic text-sm">Your visual journey through the Athlex Academy curriculum</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Mastery Progress</div>
                <div className="text-2xl font-black text-blue-600">{roadmapProgress}%</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-3xl">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Roadmap Track */}
          <div className="relative pt-12 pb-8 px-4 md:px-12">
            <div className="h-4 w-full bg-slate-100 rounded-full relative overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${roadmapProgress}%` }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              />
            </div>

            {/* Scale Markers */}
            <div className="absolute top-12 left-0 w-full h-4 flex justify-between px-4 md:px-12 pointer-events-none">
              {[0, 25, 50, 75, 100].map((marker) => (
                <div key={marker} className="flex flex-col items-center">
                  <div className="h-4 w-1 bg-white/50 backdrop-blur rounded-full"></div>
                  <div className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{marker}%</div>
                </div>
              ))}
            </div>

            {/* Moving Pointer */}
            <motion.div
              initial={{ left: '0%' }}
              animate={{ left: `${roadmapProgress}%` }}
              className="absolute top-3 -translate-x-1/2 z-20 flex flex-col items-center group cursor-default"
            >
              <div className="bg-white p-3 rounded-[1.25rem] shadow-2xl border border-blue-100 flex items-center justify-center -translate-y-4 group-hover:-translate-y-6 transition-transform duration-300">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-blue-100 rotate-45"></div>
              </div>
              <div className="mt-14 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg shadow-blue-500/30">
                You are here
              </div>
            </motion.div>

            {/* Milestones */}
            <div className="grid grid-cols-4 gap-4 mt-16 pt-8 border-t border-slate-50">
               {[
                 { p: 25, label: "Foundation", icon: <Star className="h-4 w-4" /> },
                 { p: 50, label: "Intermediate", icon: <CheckCircle2 className="h-4 w-4" /> },
                 { p: 75, label: "Advanced", icon: <Trophy className="h-4 w-4" /> },
                 { p: 100, label: "Certified", icon: <Award className="h-4 w-4" /> }
               ].map((m, i) => (
                 <div key={i} className={`flex flex-col items-center ${roadmapProgress >= m.p ? 'text-blue-600' : 'text-slate-300'}`}>
                   <div className={`p-2 rounded-xl mb-2 transition-colors ${roadmapProgress >= m.p ? 'bg-blue-50' : 'bg-slate-50'}`}>
                     {m.icon}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Roadmap Area */}
      <div className="mb-12">
        {/* Certification Roadmap: Success Pointer Block ... */}
        {/* (Assuming it stays as is based on previous edit attempts) */}
      </div>

      {isApprovedForActiveCourse ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Quizzes Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-8"
          >
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight italic">Academy Quizzes</h2>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-wider">
              {quizzes.filter(q => q.courseId === activeCourseId).length} Available
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.filter(q => q.courseId === activeCourseId).length > 0 ? quizzes.filter(q => q.courseId === activeCourseId).map((quiz, idx) => {
              const isGoogleForm = quiz.type === 'google_form';
              const bestScore = courseScores.find(s => s.quizId === quiz.id);
              const isCompleted = !!bestScore;
              
              const CardContent = (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group premium-card p-8 hover:-translate-y-2 transition-all relative overflow-hidden h-full ${isCompleted ? 'bg-indigo-50/20' : 'bg-white'}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[3rem] -z-0 opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${isCompleted ? 'bg-green-100 text-green-600' : isGoogleForm ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                        {isCompleted ? <CheckCircle2 className="h-7 w-7" /> : isGoogleForm ? <Globe className="h-7 w-7" /> : <BookCheck className="h-7 w-7" />}
                      </div>
                      {isCompleted && (
                        <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-green-500/20">
                          {Math.round((bestScore.score / bestScore.totalQuestions) * 100)}% Result
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold font-serif text-slate-900 group-hover:text-blue-600 transition-colors italic">{quiz.title}</h3>
                      {isGoogleForm && <ExternalLink className="h-4 w-4 text-slate-300" />}
                    </div>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {isGoogleForm ? "External Google Form Quiz. Master the concepts via signature assessment." : (quiz.description || "Master the core principles with our signature chapter-wise assessment.")}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        {isGoogleForm ? (
                          <span className="flex items-center"><Globe className="h-4 w-4 mr-2" /> Global Form</span>
                        ) : (
                          <>
                            <Trophy className="h-4 w-4 mr-2" />
                            {quiz.questions?.length || 0} Questions
                          </>
                        )}
                      </div>
                      <div className="text-blue-600 font-black flex items-center text-sm uppercase tracking-widest">
                        {isCompleted ? 'Review' : isGoogleForm ? 'Open' : 'Start'} <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

              return isGoogleForm ? (
                <a key={quiz.id} href={quiz.googleFormUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {CardContent}
                </a>
              ) : (
                <Link key={quiz.id} to={`/quiz/${quiz.id}`} className="block">
                  {CardContent}
                </Link>
              );
            }) : (
              <div className="col-span-full p-12 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Quizzes Available</h3>
                <p className="text-slate-500">Check back soon for new signature academy quizzes.</p>
              </div>
            )}
          </div>

          <div className="pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight italic">Class Sessions</h2>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-wider">
                {recordings.filter(r => r.courseId === activeCourseId).length} Recordings
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recordings.filter(r => r.courseId === activeCourseId).length > 0 ? recordings.filter(r => r.courseId === activeCourseId).map((rec, idx) => {
                const isCompleted = completedItems.includes(rec.id);
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group premium-card p-6 cursor-pointer overflow-hidden relative ${isCompleted ? 'bg-indigo-50/30' : 'bg-white'}`}
                  >
                    {isCompleted && (
                      <div className="absolute top-4 left-4 z-20">
                        <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    <div 
                      onClick={() => {
                        setActiveVideo(rec);
                        setIsPipMinimized(false);
                      }}
                      className="aspect-video bg-slate-900 rounded-[1.5rem] mb-6 relative overflow-hidden shadow-lg group-hover:shadow-indigo-500/20 transition-all"
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${rec.videoUrl.split('v=')[1]?.split('&')[0] || rec.videoUrl.split('/').pop()}/mqdefault.jpg`} 
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isCompleted ? 'opacity-40' : 'opacity-60 group-hover:opacity-80'}`}
                        alt=""
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full group-hover:scale-110 transition-transform">
                          <PlayCircle className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-slate-900/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">CH {rec.chapter}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-xl font-bold font-serif text-slate-900 truncate group-hover:text-indigo-600 transition-colors italic">{rec.title}</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemCompletion(rec.id);
                        }}
                        className={`p-2 rounded-xl transition-all ${isCompleted ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <span>{new Date(rec.createdAt?.toDate()).toLocaleDateString()}</span>
                      <span className="flex items-center text-indigo-600 font-black">Play Session <ArrowRight className="h-3 w-3 ml-1" /></span>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="col-span-full p-12 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Recordings Yet</h3>
                  <p className="text-slate-500">Check back later for recordings of past live sessions.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Flashcards</h2>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-wider">
                {flashcardSets.filter(s => s.courseId === activeCourseId).length} Sets
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flashcardSets.filter(s => s.courseId === activeCourseId).length > 0 ? flashcardSets.filter(s => s.courseId === activeCourseId).map((set, idx) => (
                <Link key={set.id} to={`/flashcards/${set.id}`} className="block">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all relative overflow-hidden h-full"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[3rem] -z-0 opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                        <Trophy className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{set.title}</h3>
                      <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                        Master {set.cards?.length || 0} key terms from Chapter {set.chapter} using our interactive flashcard system.
                      </p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                          <BookOpen className="h-4 w-4 mr-2" /> {set.cards?.length || 0} Cards
                        </div>
                        <div className="text-blue-600 font-black flex items-center text-sm uppercase tracking-widest">
                          Study Now <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )) : (
                <div className="col-span-full p-12 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Flashcards Assigned</h3>
                  <p className="text-slate-500">Focus on your quizzes and study materials for now.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sidebar: Study Materials & Recent Activity */}
        <div className="space-y-10">
          {/* Exercise Library */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center tracking-tight">
                <Activity className="h-6 w-6 mr-3 text-blue-600" />
                Exercise Library
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                {exercises.length} Videos
              </span>
            </div>
            <div className="overflow-y-auto max-h-[600px] pr-2 space-y-6">
              {exercises.map((ex) => (
                <div key={ex.id} className="group cursor-pointer">
                  <div className="aspect-video relative rounded-2xl overflow-hidden mb-3">
                    <img 
                      src={`https://img.youtube.com/vi/${ex.videoUrl.split('v=')[1]?.split('&')[0] || ex.videoUrl.split('/').pop()}/mqdefault.jpg`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={ex.name}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-all">
                      <PlayCircle className="h-10 w-10 text-white shadow-xl" />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="bg-blue-600/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur">
                        {ex.category}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{ex.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Biomechanics Tutorial</p>
                </div>
              ))}
              {exercises.length > 3 && (
                 <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all">
                   View Entire Library
                 </button>
              )}
              {exercises.length === 0 && (
                <p className="text-slate-400 text-sm italic text-center py-4">Tutorials coming soon.</p>
              )}
            </div>
          </div>

          {/* Knowledge Sharing Hub */}
          <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center tracking-tight">
              <Lightbulb className="h-6 w-6 mr-3 text-amber-600" />
              Knowledge Hub
            </h2>
            <div className="space-y-4">
              {knowledgeVideos.map((video) => (
                <a 
                  key={video.id}
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 transition-all group"
                >
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all overflow-hidden relative">
                    <PlayCircle className="h-5 w-5 relative z-10" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate group-hover:text-amber-600 transition-colors">{video.title}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {video.category} • {new Date(video.createdAt?.toDate()).toLocaleDateString()}
                    </div>
                  </div>
                </a>
              ))}
              {knowledgeVideos.length === 0 && (
                <p className="text-slate-400 text-sm italic text-center py-4">No videos shared yet.</p>
              )}
            </div>
          </div>

          {/* Live Classes */}
          {liveClasses.length > 0 && (
            <div className="bg-red-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-red-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <h2 className="text-xl font-bold mb-8 flex items-center tracking-tight">
                <Video className="h-6 w-6 mr-3 text-white" />
                Live Classes
              </h2>
              <div className="space-y-4">
                {liveClasses.filter(c => c.courseId === activeCourseId).map((item) => (
                  <div key={item.id} className="space-y-2">
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/10 p-2.5 rounded-xl text-white">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{item.title}</div>
                          <div className="text-[10px] text-red-100 font-bold uppercase tracking-widest">
                            {item.scheduledAt ? new Date(item.scheduledAt.toDate()).toLocaleString() : 'Join Now'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Live Class</span>
                        <ChevronRight className="h-4 w-4 text-white/60 group-hover:text-white transition-all" />
                      </div>
                    </a>
                    {item.recordingLink && (
                      <a 
                        href={item.recordingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-red-500/20 rounded-2xl border border-white/5 hover:bg-red-500/30 transition-all cursor-pointer group ml-4"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-white/10 p-2 rounded-lg text-white">
                            <Video className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">Watch Recording</div>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-white/60 group-hover:text-white transition-all" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Materials */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h2 className="text-xl font-bold mb-8 flex items-center tracking-tight font-serif italic text-blue-400">
              <BookOpen className="h-6 w-6 mr-3 text-blue-500" />
              Library
            </h2>
            <div className="space-y-4">
              {materials.filter(m => m.courseId === activeCourseId).length > 0 ? materials.filter(m => m.courseId === activeCourseId).map((item) => {
                const isCompleted = completedItems.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div 
                      onClick={() => {
                        if (item.type === 'drive') {
                          window.open(item.driveUrl, '_blank');
                        } else {
                          const win = window.open();
                          if (win) {
                            win.document.write(`<iframe src="${item.fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                          }
                        }
                      }}
                      className="flex items-center space-x-4 flex-1 min-w-0"
                    >
                      <div className={`p-2.5 rounded-xl transition-colors ${isCompleted ? 'bg-green-500 text-white' : item.type === 'drive' ? 'bg-blue-500/20 text-blue-400 group-hover:text-white' : 'bg-white/10 text-blue-400 group-hover:text-white'}`}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : item.type === 'drive' ? <Globe className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-bold truncate ${isCompleted ? 'text-green-400' : 'text-white'}`}>{item.title}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Chapter {item.chapter} • {item.type === 'drive' ? 'Drive' : 'PDF'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemCompletion(item.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${isCompleted ? 'text-green-400 hover:text-white' : 'text-slate-600 hover:text-white'}`}
                        title={isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-all" />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-sm italic text-center py-4">No materials assigned yet.</p>
              )}
            </div>
          </div>

          {/* Quick Links / Community */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center tracking-tight">
              <Globe className="h-6 w-6 mr-3 text-blue-600" />
              Quick Resources
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <a 
                href="https://chat.whatsapp.com/CDwia073NgaK3WsQOxME7b" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-4 p-4 rounded-2xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors group"
              >
                <div className="bg-green-600 text-white p-2.5 rounded-xl">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Student Community</div>
                  <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Join WhatsApp Group</div>
                </div>
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group"
              >
                <div className="bg-blue-600 text-white p-2.5 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">ACE-CPT Syllabus</div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Download PDF</div>
                </div>
              </a>
            </div>
          </div>

          {/* Hall of Fame / Success Stories */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h2 className="text-xl font-bold mb-8 flex items-center tracking-tight">
              <Trophy className="h-6 w-6 mr-3 text-blue-500" />
              Hall of Fame
            </h2>
            <div className="space-y-4">
              {[
                { name: "Akanksha Sabharwal", result: "Passed ACE-CPT", icon: <Star className="h-4 w-4" /> },
                { name: "Farman", result: "Certified Coach", icon: <Trophy className="h-4 w-4" /> },
                { name: "Snehal Naryankar", result: "Top Scorer", icon: <Award className="h-4 w-4" /> },
                { name: "Sanil", result: "Performance Specialist", icon: <Star className="h-4 w-4" /> }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600/20 p-2.5 rounded-xl text-blue-400">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.result}</div>
                    </div>
                  </div>
                </div>
              ))}
              <a 
                href="https://drive.google.com/drive/folders/1-HwLpd9s6jzaSnk4zviovrTi4vZTvXh6?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-center py-3 text-xs font-black text-blue-400 uppercase tracking-[0.2em] hover:text-blue-300 transition-colors"
              >
                Watch All Stories
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center tracking-tight">
              <Clock className="h-6 w-6 mr-3 text-red-600" />
              Recent Performance
            </h2>
            <div className="space-y-6">
              {scores.filter(s => !activeCourseId || s.courseId === activeCourseId).length > 0 ? scores.filter(s => !activeCourseId || s.courseId === activeCourseId).slice(0, 10).map((score) => (
                <div key={score.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                      (score.score / score.totalQuestions) >= 0.8 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {Math.round((score.score / score.totalQuestions) * 100)}%
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{score.quizTitle}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{score.score}/{score.totalQuestions} Marks</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {score.completedAt?.toDate ? new Date(score.completedAt.toDate()).toLocaleDateString() : 'Manual Record'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-slate-400 text-sm italic text-center py-4">No recent activity found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="max-w-3xl mx-auto py-20 text-center">
           <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-10">
              <Lock className="h-12 w-12 text-slate-200" />
           </div>
           <h2 className="text-3xl font-serif font-black text-slate-900 italic mb-6">Course Content is Locked</h2>
           <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10 italic">
              The curriculum for <span className="text-slate-900 font-bold">{courses.find(c => c.id === activeCourseId)?.title}</span> is available to browse. 
              Full access to assessments, library, and recordings will be granted once your enrollment is approved by the Athlex Academy administration.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://chat.whatsapp.com/CDwia073NgaK3WsQOxME7b" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Request Access
            </a>
            <button onClick={() => setIsChatOpen(true)} className="px-10 py-5 bg-white border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              Inquire via Chat
            </button>
           </div>
        </div>
      )}

      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
              
              <div className="relative z-10 text-center mb-8">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Megaphone className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">We Value Your Voice!</h2>
                <p className="text-slate-500 font-medium">How was your learning experience with this chapter?</p>
              </div>

              <div className="space-y-8 relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Your Rating</label>
                  <div className="flex justify-center space-x-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`p-3 rounded-2xl transition-all ${feedbackRating >= star ? 'text-yellow-400 bg-yellow-50 scale-110' : 'text-slate-200 bg-slate-50'}`}
                      >
                        <Star className={`h-8 w-8 ${feedbackRating >= star ? 'fill-yellow-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFeedbackCategory('understanding')}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border ${feedbackCategory === 'understanding' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                  >
                    Course Clarity
                  </button>
                  <button
                    onClick={() => setFeedbackCategory('teaching')}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border ${feedbackCategory === 'teaching' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                  >
                    Teaching Quality
                  </button>
                </div>

                <div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us more about your experience..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium h-32 resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleSendFeedback}
                    className="flex-[2] py-4 px-6 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Help & Chat Button */}
      <div className="fixed bottom-8 right-36 z-40 flex flex-col items-end space-y-4">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white w-[350px] sm:w-[400px] h-[500px] rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 border border-slate-100 flex flex-col overflow-hidden mb-4"
            >
              {/* Chat Header */}
              <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">Academy Support</div>
                    <div className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Admin Online
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:rotate-90 transition-transform">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {chatMessages.length > 0 ? chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.sender === 'student' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.text}
                      <div className={`text-[8px] mt-1 font-bold uppercase tracking-widest ${
                        msg.sender === 'student' ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <MessageSquare className="h-8 w-8 text-indigo-200" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Hello! Ask us anything about your course or tasks.</p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* In-App Picture-in-Picture Video Player */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                width: isPipMinimized ? 300 : '100%',
                maxWidth: isPipMinimized ? 300 : 800,
                height: isPipMinimized ? 180 : 'auto',
                bottom: 24,
                right: 24,
                left: isPipMinimized ? 'auto' : '50%',
                x: isPipMinimized ? 0 : '-50%',
                position: 'fixed'
              }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className={`z-[100] bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col`}
            >
              <div className="flex items-center justify-between p-4 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <PlayCircle className="h-5 w-5 text-blue-400 shrink-0" />
                  <span className="text-white text-xs font-bold truncate tracking-tight">{activeVideo.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsPipMinimized(!isPipMinimized)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    {isPipMinimized ? <ArrowRight className="h-4 w-4" /> : <X className="h-4 w-4 rotate-45" />}
                  </button>
                  <button 
                    onClick={() => setActiveVideo(null)}
                    className="p-1.5 hover:bg-red-600 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className={`aspect-video w-full relative group ${isPipMinimized ? 'h-full' : ''}`}>
                <iframe
                  src={activeVideo.videoUrl.includes('youtube.com/watch?v=') 
                    ? `https://www.youtube.com/embed/${activeVideo.videoUrl.split('v=')[1]?.split('&')[0]}?autoplay=1` 
                    : activeVideo.videoUrl}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                {isPipMinimized && (
                  <div 
                    onClick={() => setIsPipMinimized(false)}
                    className="absolute inset-0 bg-transparent cursor-pointer z-10" 
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex space-x-3">
          <a 
            href="https://chat.whatsapp.com/CDwia073NgaK3WsQOxME7b" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl shadow-green-600/40 hover:bg-green-700 transition-all hover:scale-105 group"
          >
            <Phone className="h-5 w-5" />
            <span className="font-bold text-sm hidden md:block">Need Help?</span>
          </a>
          
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all hover:scale-105 relative"
          >
            <MessageSquare className="h-6 w-6" />
            {!isChatOpen && chatMessages.some(m => m.sender === 'admin' && !m.read) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  </main>
</div>
  );
}
