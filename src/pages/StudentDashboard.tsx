import React from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Video, BookOpen, Trophy, Clock, ChevronRight, Star, Dumbbell, PlayCircle, FileText, GraduationCap } from 'lucide-react';

interface StudentDashboardProps {
  user: any;
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [quizzes, setQuizzes] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [liveClasses, setLiveClasses] = React.useState<any[]>([]);
  const [scores, setScores] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.uid) return;

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

    const scoresQuery = query(
      collection(db, 'scores'), 
      where('studentId', '==', user.uid),
      orderBy('completedAt', 'desc')
    );
    const unsubscribeScores = onSnapshot(scoresQuery, (snapshot) => {
      setScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'scores'));

    return () => {
      unsubscribeQuizzes();
      unsubscribeMaterials();
      unsubscribeLiveClasses();
      unsubscribeScores();
    };
  }, [user.uid]);

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

  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((acc, s) => acc + (s.score / s.totalQuestions), 0) / scores.length * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Student Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {user.displayName}! Ready to master ACE-CPT?</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{averageScore}%</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Score</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="bg-red-50 p-3 rounded-xl text-red-600">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{scores.length}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quizzes Taken</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Quizzes Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Signature Academy Quizzes</h2>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-wider">
              {quizzes.length} Available
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.length > 0 ? quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/quiz/${quiz.id}`}
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[3rem] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                
                <div className="relative z-10">
                  <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Dumbbell className="h-7 w-7 text-blue-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{quiz.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{quiz.description || "Master the concepts from this chapter with our custom signature quizzes."}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <Clock className="h-4 w-4 mr-2" />
                      {quiz.questions.length} Questions
                    </div>
                    <div className="text-blue-600 font-black flex items-center text-sm uppercase tracking-widest">
                      Start <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full p-12 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Quizzes Available</h3>
                <p className="text-slate-500">Check back soon for new signature academy quizzes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Study Materials & Recent Activity */}
        <div className="space-y-10">
          {/* Live Classes */}
          {liveClasses.length > 0 && (
            <div className="bg-red-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-red-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <h2 className="text-xl font-bold mb-8 flex items-center tracking-tight">
                <Video className="h-6 w-6 mr-3 text-white" />
                Live Classes
              </h2>
              <div className="space-y-4">
                {liveClasses.map((item) => (
                  <a 
                    key={item.id} 
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
                    <ChevronRight className="h-4 w-4 text-white/60 group-hover:text-white transition-all" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Study Materials */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h2 className="text-xl font-bold mb-8 flex items-center tracking-tight">
              <BookOpen className="h-6 w-6 mr-3 text-blue-500" />
              Study Materials
            </h2>
            <div className="space-y-4">
              {materials.length > 0 ? materials.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    const win = window.open();
                    if (win) {
                      win.document.write(`<iframe src="${item.fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/10 p-2.5 rounded-xl text-blue-400 group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chapter {item.chapter} • PDF</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-all" />
                </div>
              )) : (
                <p className="text-slate-500 text-sm italic text-center py-4">No materials assigned yet.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center tracking-tight">
              <Clock className="h-6 w-6 mr-3 text-red-600" />
              Recent Performance
            </h2>
            <div className="space-y-6">
              {scores.length > 0 ? scores.slice(0, 5).map((score) => (
                <div key={score.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                      (score.score / score.totalQuestions) >= 0.8 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {Math.round((score.score / score.totalQuestions) * 100)}%
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{score.quizTitle}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(score.completedAt.toDate()).toLocaleDateString()}
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
    </div>
  );
}
