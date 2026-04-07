import React from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, where, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateQuizFromNotes, summarizeNotes, MCQ } from '../services/gemini';
import { extractTextFromPDF } from '../lib/pdf-utils';
import { Plus, Trash2, FileText, Sparkles, Loader2, Calendar, Clock, ChevronRight, Dumbbell, AlertCircle, CheckCircle2, Trophy, Users, Upload, FileUp, Video } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface AdminDashboardProps {
  user: any;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [notes, setNotes] = React.useState('');
  const [quizTitle, setQuizTitle] = React.useState('');
  const [chapter, setChapter] = React.useState('1');
  const [numQuestions, setNumQuestions] = React.useState(10);
  const [pointsPerQuestion, setPointsPerQuestion] = React.useState(1);
  const [difficulty, setDifficulty] = React.useState('Medium');
  const [generating, setGenerating] = React.useState(false);
  const [summarizing, setSummarizing] = React.useState(false);
  const [quizzes, setQuizzes] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [liveClasses, setLiveClasses] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'quizzes' | 'materials' | 'liveClasses'>('quizzes');

  // New Content Forms
  const [materialTitle, setMaterialTitle] = React.useState('');
  const [materialChapter, setMaterialChapter] = React.useState('1');
  const [materialFile, setMaterialFile] = React.useState<string | null>(null);
  const [liveClassTitle, setLiveClassTitle] = React.useState('');
  const [liveClassLink, setLiveClassLink] = React.useState('');
  const [liveClassDate, setLiveClassDate] = React.useState('');
  
  // Review state
  const [draftQuiz, setDraftQuiz] = React.useState<MCQ[] | null>(null);
  const [showReview, setShowReview] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!user) return;

    // Only show published quizzes assigned to this student
    const q = query(
      collection(db, 'quizzes'),
      where('status', '==', 'published'),
      where('assignedTo', 'array-contains', user.uid)
    );
    
    const unsubscribeQuizzes = onSnapshot(q, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quizzes'));

    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubscribeMaterials = onSnapshot(query(collection(db, 'materials'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'materials'));

    const unsubscribeLiveClasses = onSnapshot(query(collection(db, 'liveClasses'), orderBy('createdAt', 'desc')), (snapshot) => {
      setLiveClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'liveClasses'));

    return () => {
      unsubscribeQuizzes();
      unsubscribeStudents();
      unsubscribeMaterials();
      unsubscribeLiveClasses();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setStatus({ type: 'error', message: 'Please upload a PDF file.' });
      return;
    }

    setSummarizing(true);
    setStatus(null);
    try {
      const text = await extractTextFromPDF(file);
      setNotes(text);
      setStatus({ type: 'success', message: 'PDF text extracted successfully!' });
    } catch (err: any) {
      console.error("PDF Extraction Error:", err);
      setStatus({ type: 'error', message: 'Failed to extract text from PDF.' });
    } finally {
      setSummarizing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSummarize = async () => {
    if (!notes) return;

    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setSummarizing(true);
    setStatus(null);
    try {
      const summary = await summarizeNotes(notes);
      setNotes(summary);
      setStatus({ type: 'success', message: 'Notes summarized into key bullet points!' });
    } catch (err: any) {
      console.error("Summarization Error:", err);
      setStatus({ type: 'error', message: 'Failed to summarize notes.' });
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes || !quizTitle) return;

    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setGenerating(true);
    setStatus(null);
    try {
      const generatedQuestions = await generateQuizFromNotes(notes, numQuestions, difficulty);
      
      if (generatedQuestions.length === 0) {
        throw new Error("No questions were generated. Please try again with more detailed notes.");
      }

      setDraftQuiz(generatedQuestions);
      setShowReview(true);
    } catch (err: any) {
      console.error("Quiz Generation Error:", err);
      if (err.message?.includes("Requested entity was not found") && window.aistudio) {
        setStatus({ type: 'error', message: "Model not found. Please select a valid API key from a paid project." });
        await window.aistudio.openSelectKey();
      } else {
        setStatus({ type: 'error', message: err.message || "Failed to generate quiz. Please check your notes and try again." });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishQuiz = async (isDraft: boolean = false) => {
    if (!draftQuiz || !quizTitle) return;

    try {
      await addDoc(collection(db, 'quizzes'), {
        title: quizTitle,
        chapter: parseInt(chapter),
        difficulty,
        pointsPerQuestion,
        status: isDraft ? 'draft' : 'published',
        assignedTo: [], // Initially assigned to nobody
        questions: draftQuiz,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      setNotes('');
      setQuizTitle('');
      setDraftQuiz(null);
      setShowReview(false);
      setStatus({ type: 'success', message: `Successfully ${isDraft ? 'saved draft' : 'published'} "${quizTitle}"!` });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'quizzes');
    }
  };

  const handleAssignQuiz = async (quizId: string, studentIds: string[]) => {
    try {
      await setDoc(doc(db, 'quizzes', quizId), { assignedTo: studentIds }, { merge: true });
      setStatus({ type: 'success', message: "Assignments updated successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `quizzes/${quizId}`);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle || !materialFile) return;

    try {
      await addDoc(collection(db, 'materials'), {
        title: materialTitle,
        chapter: parseInt(materialChapter),
        fileUrl: materialFile,
        assignedTo: [],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setMaterialTitle('');
      setMaterialFile(null);
      setStatus({ type: 'success', message: "Study material uploaded successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'materials');
    }
  };

  const handleCreateLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveClassTitle || !liveClassLink) return;

    try {
      await addDoc(collection(db, 'liveClasses'), {
        title: liveClassTitle,
        link: liveClassLink,
        scheduledAt: liveClassDate ? new Date(liveClassDate) : serverTimestamp(),
        assignedTo: [],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setLiveClassTitle('');
      setLiveClassLink('');
      setLiveClassDate('');
      setStatus({ type: 'success', message: "Live class link added successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'liveClasses');
    }
  };

  const handleAssignMaterial = async (materialId: string, studentIds: string[]) => {
    try {
      await setDoc(doc(db, 'materials', materialId), { assignedTo: studentIds }, { merge: true });
      setStatus({ type: 'success', message: "Material access updated!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `materials/${materialId}`);
    }
  };

  const handleAssignLiveClass = async (classId: string, studentIds: string[]) => {
    try {
      await setDoc(doc(db, 'liveClasses', classId), { assignedTo: studentIds }, { merge: true });
      setStatus({ type: 'success', message: "Live class access updated!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `liveClasses/${classId}`);
    }
  };

  const handleMaterialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // ~800KB limit for base64 in Firestore
      setStatus({ type: 'error', message: 'PDF is too large. Please use a file under 800KB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMaterialFile(reader.result as string);
      setStatus({ type: 'success', message: 'PDF ready for upload!' });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteQuiz = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `quizzes/${id}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Admin Command Center</h1>
        <p className="text-slate-500 font-medium">Manage signature academy quizzes and content for your students.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-12 bg-slate-100 p-2 rounded-2xl w-fit">
        {[
          { id: 'quizzes', label: 'Quizzes', icon: <Dumbbell className="h-4 w-4" /> },
          { id: 'materials', label: 'Study Materials', icon: <FileText className="h-4 w-4" /> },
          { id: 'liveClasses', label: 'Live Classes', icon: <Video className="h-4 w-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setStatus(null);
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {showReview && draftQuiz ? (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl mb-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Review Generated Quiz: {quizTitle}</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowReview(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Back to Edit
              </button>
              <button
                onClick={() => handlePublishQuiz(true)}
                className="px-6 py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handlePublishQuiz(false)}
                className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Publish Now
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {draftQuiz.map((q, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900 mb-4">Q{idx + 1}: {q.question}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`p-3 rounded-xl border ${oIdx === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-100 text-slate-600'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-500 italic">Explanation: {q.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Generator Form Column */}
          <div className="lg:col-span-1">
            {activeTab === 'quizzes' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Signature Quiz</h2>
                </div>

                <form onSubmit={handleGenerateDraft} className="space-y-6">
                  {/* ... existing quiz form fields ... */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quiz Title</label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. Chapter 5: Health Screening"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ACE Chapter</label>
                      <select
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      >
                        {Array.from({ length: 16 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Questions</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Points/Q</label>
                      <input
                        type="number"
                        min="1"
                        value={pointsPerQuestion}
                        onChange={(e) => setPointsPerQuestion(parseInt(e.target.value))}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Study Notes (Context)</label>
                      <div className="flex space-x-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".pdf"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={summarizing}
                          className="flex items-center space-x-1 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors disabled:opacity-50"
                        >
                          <FileUp className="h-3 w-3" />
                          <span>Upload PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSummarize}
                          disabled={!notes || summarizing}
                          className="flex items-center space-x-1 text-[10px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Summarize</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Paste chapter notes, key concepts, or upload a PDF. Athlex Academy's custom engine will curate the best MCQs for your students."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium h-48 resize-none"
                      required
                    />
                    {summarizing && (
                      <div className="mt-2 flex items-center space-x-2 text-[10px] font-bold text-slate-400 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing content...</span>
                      </div>
                    )}
                  </div>

                  {status && activeTab === 'quizzes' && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                      <span>{status.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                        Curating Quiz...
                      </>
                    ) : (
                      <>
                        <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform" />
                        Generate Draft
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-purple-50 p-3 rounded-2xl">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Study Notes</h2>
                </div>

                <form onSubmit={handleCreateMaterial} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Material Title</label>
                    <input
                      type="text"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder="e.g. Chapter 5 Study Guide"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ACE Chapter</label>
                    <select
                      value={materialChapter}
                      onChange={(e) => setMaterialChapter(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                    >
                      {Array.from({ length: 16 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">PDF File</label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleMaterialFileUpload}
                        accept=".pdf"
                        className="hidden"
                        id="material-file"
                      />
                      <label
                        htmlFor="material-file"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                          materialFile ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <Upload className={`h-8 w-8 mb-2 ${materialFile ? 'text-green-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-500">
                          {materialFile ? 'PDF Ready' : 'Click to select PDF'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {status && activeTab === 'materials' && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                      <span>{status.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!materialFile}
                    className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50"
                  >
                    Upload Material
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'liveClasses' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-red-50 p-3 rounded-2xl">
                    <Video className="h-6 w-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add Live Class Link</h2>
                </div>

                <form onSubmit={handleCreateLiveClass} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Class Title</label>
                    <input
                      type="text"
                      value={liveClassTitle}
                      onChange={(e) => setLiveClassTitle(e.target.value)}
                      placeholder="e.g. Weekly Q&A Session"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Meeting Link (Zoom/Meet)</label>
                    <input
                      type="url"
                      value={liveClassLink}
                      onChange={(e) => setLiveClassLink(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Scheduled Date/Time</label>
                    <input
                      type="datetime-local"
                      value={liveClassDate}
                      onChange={(e) => setLiveClassDate(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {status && activeTab === 'liveClasses' && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                      <span>{status.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                  >
                    Add Class Link
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Content List Column */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'quizzes' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Quizzes & Assignments</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {quizzes.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {quizzes.length > 0 ? quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center space-x-6">
                          <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                            <Dumbbell className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-xl font-bold text-slate-900">{quiz.title}</h3>
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                                quiz.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                                {quiz.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {quiz.questions.length} Qs</span>
                              <span className="flex items-center"><Sparkles className="h-3 w-3 mr-1" /> {quiz.difficulty}</span>
                              <span className="flex items-center"><Trophy className="h-3 w-3 mr-1" /> {quiz.pointsPerQuestion} Pts/Q</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {quiz.status === 'draft' && (
                            <button
                              onClick={() => setDoc(doc(db, 'quizzes', quiz.id), { status: 'published' }, { merge: true })}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assign Quiz Access</label>
                        <div className="flex flex-wrap gap-3">
                          {students.map((student) => {
                            const isAssigned = quiz.assignedTo?.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  const newAssigned = isAssigned
                                    ? quiz.assignedTo.filter((id: string) => id !== student.id)
                                    : [...(quiz.assignedTo || []), student.id];
                                  handleAssignQuiz(quiz.id, newAssigned);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  isAssigned 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200'
                                }`}
                              >
                                {student.photoURL ? (
                                  <img src={student.photoURL} className="w-4 h-4 rounded-full" alt="" referrerPolicy="no-referrer" />
                                ) : (
                                  <Users className="w-3 h-3" />
                                )}
                                <span>{student.displayName || student.email}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <FileText className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Quizzes Found</h3>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'materials' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Study Materials</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {materials.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {materials.length > 0 ? materials.map((material) => (
                    <div
                      key={material.id}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                            <FileText className="h-8 w-8 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{material.title}</h3>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Chapter {material.chapter} • Added {new Date(material.createdAt?.toDate()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteDoc(doc(db, 'materials', material.id))}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="pt-6 border-t border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assign Material Access</label>
                        <div className="flex flex-wrap gap-3">
                          {students.map((student) => {
                            const isAssigned = material.assignedTo?.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  const newAssigned = isAssigned
                                    ? material.assignedTo.filter((id: string) => id !== student.id)
                                    : [...(material.assignedTo || []), student.id];
                                  handleAssignMaterial(material.id, newAssigned);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  isAssigned 
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20' 
                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-purple-200'
                                }`}
                              >
                                {student.photoURL ? (
                                  <img src={student.photoURL} className="w-4 h-4 rounded-full" alt="" referrerPolicy="no-referrer" />
                                ) : (
                                  <Users className="w-3 h-3" />
                                )}
                                <span>{student.displayName || student.email}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <FileText className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Materials Uploaded</h3>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'liveClasses' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Live Classes</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {liveClasses.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {liveClasses.length > 0 ? liveClasses.map((liveClass) => (
                    <div
                      key={liveClass.id}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                            <Video className="h-8 w-8 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{liveClass.title}</h3>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {liveClass.scheduledAt ? new Date(liveClass.scheduledAt.toDate()).toLocaleString() : 'Not scheduled'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteDoc(doc(db, 'liveClasses', liveClass.id))}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="pt-6 border-t border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assign Class Access</label>
                        <div className="flex flex-wrap gap-3">
                          {students.map((student) => {
                            const isAssigned = liveClass.assignedTo?.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  const newAssigned = isAssigned
                                    ? liveClass.assignedTo.filter((id: string) => id !== student.id)
                                    : [...(liveClass.assignedTo || []), student.id];
                                  handleAssignLiveClass(liveClass.id, newAssigned);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  isAssigned 
                                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20' 
                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-red-200'
                                }`}
                              >
                                {student.photoURL ? (
                                  <img src={student.photoURL} className="w-4 h-4 rounded-full" alt="" referrerPolicy="no-referrer" />
                                ) : (
                                  <Users className="w-3 h-3" />
                                )}
                                <span>{student.displayName || student.email}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Video className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Live Classes Added</h3>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
