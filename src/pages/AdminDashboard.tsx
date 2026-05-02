import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, where, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateQuizFromNotes, summarizeNotes, MCQ } from '../services/gemini';
import { extractTextFromPDF } from '../lib/pdf-utils';
import { Plus, Trash2, FileText, Sparkles, Loader2, Calendar, Clock, ChevronRight, Dumbbell, AlertCircle, CheckCircle2, Trophy, Users, Upload, FileUp, Video, Globe, Mail, Phone, PlayCircle } from 'lucide-react';

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
  const [quizType, setQuizType] = React.useState<'ai' | 'google_form'>('ai');
  const [googleFormUrl, setGoogleFormUrl] = React.useState('');
  const [numQuestions, setNumQuestions] = React.useState(10);
  const [pointsPerQuestion, setPointsPerQuestion] = React.useState(1);
  const [difficulty, setDifficulty] = React.useState('Medium');
  const [generating, setGenerating] = React.useState(false);
  const [summarizing, setSummarizing] = React.useState(false);
  const [quizzes, setQuizzes] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [liveClasses, setLiveClasses] = React.useState<any[]>([]);
  const [inquiries, setInquiries] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [successStories, setSuccessStories] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'quizzes' | 'materials' | 'liveClasses' | 'inquiries' | 'stories'>('quizzes');

  // New Content Forms
  const [materialTitle, setMaterialTitle] = React.useState('');
  const [materialChapter, setMaterialChapter] = React.useState('1');
  const [materialType, setMaterialType] = React.useState<'pdf' | 'drive'>('pdf');
  const [materialFile, setMaterialFile] = React.useState<string | null>(null);
  const [driveUrl, setDriveUrl] = React.useState('');
  const [liveClassTitle, setLiveClassTitle] = React.useState('');
  const [liveClassLink, setLiveClassLink] = React.useState('');
  const [liveClassRecordingLink, setLiveClassRecordingLink] = React.useState('');
  const [liveClassDate, setLiveClassDate] = React.useState('');
  
  // Success Story Form
  const [storyTitle, setStoryTitle] = React.useState('');
  const [storyStudent, setStoryStudent] = React.useState('');
  const [storyThumbnail, setStoryThumbnail] = React.useState('');
  const [storyVideoUrl, setStoryVideoUrl] = React.useState('');
  const [storyOrder, setStoryOrder] = React.useState(0);
  
  // Review state
  const [draftQuiz, setDraftQuiz] = React.useState<MCQ[] | null>(null);
  const [showReview, setShowReview] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!user) return;

    // Fetch all quizzes for admin to manage
    const quizzesQuery = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
    const unsubscribeQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
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

    const unsubscribeInquiries = onSnapshot(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')), (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inquiries'));

    const unsubscribeStories = onSnapshot(query(collection(db, 'successStories'), orderBy('order', 'asc')), (snapshot) => {
      setSuccessStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'successStories'));

    return () => {
      unsubscribeQuizzes();
      unsubscribeStudents();
      unsubscribeMaterials();
      unsubscribeLiveClasses();
      unsubscribeInquiries();
      unsubscribeStories();
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
    if (!quizTitle) return;
    if (quizType === 'ai' && !draftQuiz) return;
    if (quizType === 'google_form' && !googleFormUrl) return;

    try {
      const quizData: any = {
        title: quizTitle,
        chapter: chapter,
        status: isDraft ? 'draft' : 'published',
        type: quizType,
        assignedTo: [],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };

      if (quizType === 'ai') {
        quizData.difficulty = difficulty;
        quizData.pointsPerQuestion = pointsPerQuestion;
        quizData.questions = draftQuiz;
      } else {
        quizData.googleFormUrl = googleFormUrl;
      }

      await addDoc(collection(db, 'quizzes'), quizData);

      setNotes('');
      setQuizTitle('');
      setGoogleFormUrl('');
      setDraftQuiz(null);
      setShowReview(false);
      setStatus({ type: 'success', message: `Successfully ${isDraft ? 'saved' : 'published'} "${quizTitle}"!` });
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
    if (!materialTitle) return;
    if (materialType === 'pdf' && !materialFile) return;
    if (materialType === 'drive' && !driveUrl) return;

    try {
      await addDoc(collection(db, 'materials'), {
        title: materialTitle,
        chapter: materialChapter,
        type: materialType,
        fileUrl: materialType === 'pdf' ? materialFile : null,
        driveUrl: materialType === 'drive' ? driveUrl : null,
        assignedTo: [],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setMaterialTitle('');
      setMaterialFile(null);
      setDriveUrl('');
      setStatus({ type: 'success', message: "Study material added successfully!" });
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
        recordingLink: liveClassRecordingLink || null,
        scheduledAt: liveClassDate ? new Date(liveClassDate) : serverTimestamp(),
        assignedTo: [],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setLiveClassTitle('');
      setLiveClassLink('');
      setLiveClassRecordingLink('');
      setLiveClassDate('');
      setStatus({ type: 'success', message: "Live class link added successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'liveClasses');
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle || !storyStudent || !storyThumbnail || !storyVideoUrl) return;

    try {
      await addDoc(collection(db, 'successStories'), {
        title: storyTitle,
        student: storyStudent,
        thumbnail: storyThumbnail,
        videoUrl: storyVideoUrl,
        order: storyOrder,
        createdAt: serverTimestamp()
      });
      setStoryTitle('');
      setStoryStudent('');
      setStoryThumbnail('');
      setStoryVideoUrl('');
      setStoryOrder(0);
      setStatus({ type: 'success', message: "Success story added successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'successStories');
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

  const handleDeleteInquiry = async (id: string) => {
    if (window.confirm("Delete this inquiry?")) {
      try {
        await deleteDoc(doc(db, 'inquiries', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `inquiries/${id}`);
      }
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (window.confirm("Delete this success story?")) {
      try {
        await deleteDoc(doc(db, 'successStories', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `successStories/${id}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Admin Command Center</h1>
        <p className="text-slate-500 font-medium">Manage signature academy quizzes and content for your students.</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-12 bg-slate-100 p-2 rounded-2xl w-fit">
        {[
          { id: 'quizzes', label: 'Quizzes', icon: <Dumbbell className="h-4 w-4" /> },
          { id: 'materials', label: 'Study Materials', icon: <FileText className="h-4 w-4" /> },
          { id: 'liveClasses', label: 'Live Classes', icon: <Video className="h-4 w-4" /> },
          { id: 'inquiries', label: 'Inquiries', icon: <Mail className="h-4 w-4" /> },
          { id: 'stories', label: 'Success Stories', icon: <Trophy className="h-4 w-4" /> }
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

                <form onSubmit={quizType === 'ai' ? handleGenerateDraft : (e) => { e.preventDefault(); handlePublishQuiz(false); }} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quiz Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizType('ai')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${quizType === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                      >
                        AI Generated
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizType('google_form')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${quizType === 'google_form' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                      >
                        Google Form
                      </button>
                    </div>
                  </div>

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

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ACE Chapter(s)</label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g. 1 or 1-5"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  {quizType === 'ai' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
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
                          placeholder="Paste notes or upload PDF..."
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium h-32 resize-none"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Google Form URL</label>
                      <input
                        type="url"
                        value={googleFormUrl}
                        onChange={(e) => setGoogleFormUrl(e.target.value)}
                        placeholder="https://docs.google.com/forms/..."
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  )}

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
                        {quizType === 'ai' ? 'Generate Draft' : 'Publish Quiz'}
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
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Material Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMaterialType('pdf')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${materialType === 'pdf' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                      >
                        PDF Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType('drive')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${materialType === 'drive' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                      >
                        Google Drive
                      </button>
                    </div>
                  </div>

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
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ACE Chapter(s)</label>
                    <input
                      type="text"
                      value={materialChapter}
                      onChange={(e) => setMaterialChapter(e.target.value)}
                      placeholder="e.g. 1 or 1-5"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  {materialType === 'pdf' ? (
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
                  ) : (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Google Drive Link</label>
                      <input
                        type="url"
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/drive/..."
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  )}

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
                    className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20"
                  >
                    {materialType === 'pdf' ? 'Upload PDF' : 'Add Drive Link'}
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
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recording Link (Optional)</label>
                    <input
                      type="url"
                      value={liveClassRecordingLink}
                      onChange={(e) => setLiveClassRecordingLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
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

            {activeTab === 'inquiries' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Course Inquiries</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {inquiries.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-50 p-3 rounded-2xl">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{inquiry.studentEmail}</div>
                          <div className="text-xs text-slate-500 font-medium flex items-center space-x-3">
                            <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {inquiry.studentMobile}</span>
                            <span className="flex items-center"><Dumbbell className="h-3 w-3 mr-1" /> {inquiry.courseName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInquiry(inquiry.id)}
                        className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {inquiries.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">No inquiries yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Success Stories</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {successStories.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {successStories.map((story) => (
                    <div key={story.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                      <div className="aspect-video relative">
                        <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 mb-1">{story.title}</h3>
                            <p className="text-sm text-slate-500 font-medium">{story.student}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {successStories.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">No success stories added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stories' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-yellow-50 p-3 rounded-2xl">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add Success Story</h2>
                </div>

                <form onSubmit={handleCreateStory} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Story Title</label>
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="e.g. Transformation Journey"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Student Name</label>
                    <input
                      type="text"
                      value={storyStudent}
                      onChange={(e) => setStoryStudent(e.target.value)}
                      placeholder="e.g. Akanksha Sabharwal"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Thumbnail URL</label>
                    <input
                      type="url"
                      value={storyThumbnail}
                      onChange={(e) => setStoryThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Video Preview URL (Drive/YouTube)</label>
                    <input
                      type="url"
                      value={storyVideoUrl}
                      onChange={(e) => setStoryVideoUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../preview"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Display Order</label>
                    <input
                      type="number"
                      value={storyOrder}
                      onChange={(e) => setStoryOrder(parseInt(e.target.value))}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {status && activeTab === 'stories' && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                      <span>{status.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-yellow-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-yellow-700 transition-all shadow-xl shadow-yellow-500/20"
                  >
                    Add Success Story
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
                              {quiz.type === 'ai' ? (
                                <>
                                  <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {quiz.questions?.length || 0} Qs</span>
                                  <span className="flex items-center"><Sparkles className="h-3 w-3 mr-1" /> {quiz.difficulty}</span>
                                  <span className="flex items-center"><Trophy className="h-3 w-3 mr-1" /> {quiz.pointsPerQuestion} Pts/Q</span>
                                </>
                              ) : (
                                <span className="flex items-center text-blue-600"><Globe className="h-3 w-3 mr-1" /> Google Form</span>
                              )}
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
                              Chapter {material.chapter} • {material.type === 'pdf' ? 'PDF' : 'Drive Link'} • Added {new Date(material.createdAt?.toDate()).toLocaleDateString()}
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
                            <div className="flex flex-col space-y-1">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {liveClass.scheduledAt ? new Date(liveClass.scheduledAt.toDate()).toLocaleString() : 'Not scheduled'}
                              </div>
                              {liveClass.recordingLink && (
                                <div className="flex items-center text-xs font-bold text-red-600 uppercase tracking-widest">
                                  <PlayCircle className="h-3 w-3 mr-1" /> Recording Available
                                </div>
                              )}
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
            {activeTab === 'inquiries' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Course Inquiries</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {inquiries.length} New
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {inquiries.length > 0 ? inquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                            <Mail className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{inquiry.courseName}</h3>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center text-sm font-medium text-slate-600">
                                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                                {inquiry.studentEmail}
                              </div>
                              <div className="flex items-center text-sm font-medium text-slate-600">
                                <Phone className="h-4 w-4 mr-2 text-slate-400" />
                                {inquiry.studentMobile}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(inquiry.createdAt?.toDate()).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteInquiry(inquiry.id)}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Mail className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Inquiries Yet</h3>
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
