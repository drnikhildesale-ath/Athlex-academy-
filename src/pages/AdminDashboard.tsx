import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, where, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateQuizFromNotes, summarizeNotes, MCQ, generateFlashcardsFromNotes, Flashcard } from '../services/gemini';
import { extractTextFromPDF } from '../lib/pdf-utils';
import { Plus, Trash2, FileText, Sparkles, Loader2, Calendar, Clock, ChevronRight, Dumbbell, AlertCircle, CheckCircle2, Trophy, Users, Upload, FileUp, Video, Globe, Mail, Phone, PlayCircle, BookCheck, Activity, Lightbulb, Megaphone, MessageSquare, Send, X, Award } from 'lucide-react';

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
  const [flashcardSets, setFlashcardSets] = React.useState<any[]>([]);
  const [exercises, setExercises] = React.useState<any[]>([]);
  const [knowledgeVideos, setKnowledgeVideos] = React.useState<any[]>([]);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [recordings, setRecordings] = React.useState<any[]>([]);
  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [courses, setCourses] = React.useState<any[]>([]);
  const [activeCourseId, setActiveCourseId] = React.useState<string>('');
  const [courseTitle, setCourseTitle] = React.useState('');
  const [courseDescription, setCourseDescription] = React.useState('');
  const [selectedStudentForChat, setSelectedStudentForChat] = React.useState<any>(null);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'quizzes' | 'materials' | 'liveClasses' | 'inquiries' | 'stories' | 'flashcards' | 'exercises' | 'knowledge' | 'announcements' | 'chats' | 'results' | 'courses' | 'students' | 'recordings'>('quizzes');

  // Manual Result Form
  const [selectedStudentId, setSelectedStudentId] = React.useState('');
  const [resultChapter, setResultChapter] = React.useState('1');
  const [resultScore, setResultScore] = React.useState(0);
  const [resultTotal, setResultTotal] = React.useState(100);
  const [resultTitle, setResultTitle] = React.useState('Chapter Performance');

  // New Content Forms
  const [exerciseName, setExerciseName] = React.useState('');
  const [exerciseCategory, setExerciseCategory] = React.useState('Lower Body');
  const [exerciseVideoUrl, setExerciseVideoUrl] = React.useState('');
  const [exerciseDescription, setExerciseDescription] = React.useState('');

  const [knowledgeTitle, setKnowledgeTitle] = React.useState('');
  const [knowledgeCategory, setKnowledgeCategory] = React.useState('Fitness');
  const [knowledgeVideoUrl, setKnowledgeVideoUrl] = React.useState('');
  const [knowledgeDescription, setKnowledgeDescription] = React.useState('');

  const [announcementTitle, setAnnouncementTitle] = React.useState('');
  const [announcementContent, setAnnouncementContent] = React.useState('');
  const [announcementType, setAnnouncementType] = React.useState<'info' | 'task' | 'urgent'>('info');
  const [announcementCourseId, setAnnouncementCourseId] = React.useState('');
  const [announcementBatch, setAnnouncementBatch] = React.useState('');

  const [newMessage, setNewMessage] = React.useState('');

  // Flashcard Form
  const [flashcardTitle, setFlashcardTitle] = React.useState('');
  const [flashcardChapter, setFlashcardChapter] = React.useState('1');
  const [numFlashcards, setNumFlashcards] = React.useState(10);
  const [flashcardNotes, setFlashcardNotes] = React.useState('');
  const [draftFlashcards, setDraftFlashcards] = React.useState<Flashcard[] | null>(null);
  const [showFlashcardReview, setShowFlashcardReview] = React.useState(false);

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
  
  // Recording Form
  const [recordingTitle, setRecordingTitle] = React.useState('');
  const [recordingDescription, setRecordingDescription] = React.useState('');
  const [recordingChapter, setRecordingChapter] = React.useState('1');
  const [recordingVideoUrl, setRecordingVideoUrl] = React.useState('');
  
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

    const unsubscribeFlashcards = onSnapshot(query(collection(db, 'flashcards'), orderBy('createdAt', 'desc')), (snapshot) => {
      setFlashcardSets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'flashcards'));

    const unsubscribeExercises = onSnapshot(query(collection(db, 'exercises'), orderBy('createdAt', 'desc')), (snapshot) => {
      setExercises(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exercises'));

    const unsubscribeKnowledge = onSnapshot(query(collection(db, 'knowledgeVideos'), orderBy('createdAt', 'desc')), (snapshot) => {
      setKnowledgeVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'knowledgeVideos'));

    const unsubscribeRecordings = onSnapshot(query(collection(db, 'classRecordings'), orderBy('createdAt', 'desc')), (snapshot) => {
      setRecordings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'classRecordings'));

    const unsubscribeAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    const unsubscribeChats = onSnapshot(query(collection(db, 'chatMessages'), orderBy('createdAt', 'asc')), (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chatMessages'));

    const unsubscribeCourses = onSnapshot(query(collection(db, 'courses'), orderBy('createdAt', 'desc')), (snapshot) => {
      const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(fetchedCourses);
      if (fetchedCourses.length > 0 && !activeCourseId) {
        setActiveCourseId(fetchedCourses[0].id);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'courses'));

    return () => {
      unsubscribeQuizzes();
      unsubscribeStudents();
      unsubscribeMaterials();
      unsubscribeLiveClasses();
      unsubscribeRecordings();
      unsubscribeInquiries();
      unsubscribeStories();
      unsubscribeFlashcards();
      unsubscribeExercises();
      unsubscribeKnowledge();
      unsubscribeAnnouncements();
      unsubscribeChats();
      unsubscribeCourses();
    };
  }, [activeCourseId]);

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
    if (!quizTitle || !activeCourseId) {
      if (!activeCourseId) setStatus({ type: 'error', message: "Please select/create a course first." });
      return;
    }
    if (quizType === 'ai' && !draftQuiz) return;
    if (quizType === 'google_form' && !googleFormUrl) return;

    try {
      const quizData: any = {
        title: quizTitle,
        chapter: chapter,
        courseId: activeCourseId,
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
    if (!materialTitle || !activeCourseId) return;
    if (materialType === 'pdf' && !materialFile) return;
    if (materialType === 'drive' && !driveUrl) return;

    try {
      await addDoc(collection(db, 'materials'), {
        title: materialTitle,
        chapter: materialChapter,
        courseId: activeCourseId,
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
    if (!liveClassTitle || !liveClassLink || !activeCourseId) return;

    try {
      await addDoc(collection(db, 'liveClasses'), {
        title: liveClassTitle,
        courseId: activeCourseId,
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

  const handleAssignRecording = async (recordingId: string, studentIds: string[]) => {
    try {
      await setDoc(doc(db, 'classRecordings', recordingId), { assignedTo: studentIds }, { merge: true });
      setStatus({ type: 'success', message: "Recording access updated!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classRecordings/${recordingId}`);
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

  const handleGenerateFlashcardDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardNotes || !flashcardTitle) return;

    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setGenerating(true);
    setStatus(null);
    try {
      const generatedCards = await generateFlashcardsFromNotes(flashcardNotes, numFlashcards);
      setDraftFlashcards(generatedCards);
      setShowFlashcardReview(true);
    } catch (err: any) {
      console.error("Flashcard Generation Error:", err);
      setStatus({ type: 'error', message: err.message || "Failed to generate flashcards." });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (!flashcardTitle || !draftFlashcards || !activeCourseId) return;

    try {
      await addDoc(collection(db, 'flashcards'), {
        title: flashcardTitle,
        chapter: flashcardChapter,
        courseId: activeCourseId,
        cards: draftFlashcards,
        assignedTo: [],
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      setFlashcardNotes('');
      setFlashcardTitle('');
      setDraftFlashcards(null);
      setShowFlashcardReview(false);
      setStatus({ type: 'success', message: "Flashcard set published successfully!" });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'flashcards');
    }
  };

  const handleAssignFlashcards = async (setId: string, studentIds: string[]) => {
    try {
      await setDoc(doc(db, 'flashcards', setId), { assignedTo: studentIds }, { merge: true });
      setStatus({ type: 'success', message: "Flashcard assignments updated!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `flashcards/${setId}`);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName || !exerciseVideoUrl) return;

    try {
      await addDoc(collection(db, 'exercises'), {
        name: exerciseName,
        category: exerciseCategory,
        videoUrl: exerciseVideoUrl,
        description: exerciseDescription,
        createdAt: serverTimestamp()
      });
      setExerciseName('');
      setExerciseVideoUrl('');
      setExerciseDescription('');
      setStatus({ type: 'success', message: "Exercise added to library!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'exercises');
    }
  };

  const handleCreateKnowledgeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeTitle || !knowledgeVideoUrl) return;

    try {
      await addDoc(collection(db, 'knowledgeVideos'), {
        title: knowledgeTitle,
        category: knowledgeCategory,
        videoUrl: knowledgeVideoUrl,
        description: knowledgeDescription,
        createdAt: serverTimestamp()
      });
      setKnowledgeTitle('');
      setKnowledgeVideoUrl('');
      setKnowledgeDescription('');
      setStatus({ type: 'success', message: "Knowledge sharing video added!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'knowledgeVideos');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;

    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcementTitle,
        content: announcementContent,
        type: announcementType,
        courseId: announcementCourseId || null,
        batch: announcementBatch || null,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementCourseId('');
      setAnnouncementBatch('');
      setStatus({ type: 'success', message: "Announcement published successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    }
  };

  const [allScores, setAllScores] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const scoresQuery = query(collection(db, 'scores'), orderBy('completedAt', 'desc'));
    const unsubscribeScores = onSnapshot(scoresQuery, (snapshot) => {
      setAllScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'scores'));
    return () => unsubscribeScores();
  }, [user]);

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !resultChapter) return;

    const student = students.find(s => s.id === selectedStudentId);

    try {
      await addDoc(collection(db, 'scores'), {
        studentId: selectedStudentId,
        studentEmail: student?.email || 'Unknown',
        quizTitle: resultTitle || `Chapter ${resultChapter} Performance`,
        chapter: resultChapter,
        courseId: activeCourseId,
        score: resultScore,
        totalQuestions: resultTotal,
        completedAt: serverTimestamp(),
        manualEntry: true
      });
      
      setResultChapter(String(parseInt(resultChapter) + 1));
      setResultScore(0);
      setStatus({ type: 'success', message: "Student results recorded successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'scores');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage || !selectedStudentForChat) return;

    try {
      await addDoc(collection(db, 'chatMessages'), {
        studentId: selectedStudentForChat.id,
        senderId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chatMessages');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (window.confirm("Delete this exercise?")) {
      try {
        await deleteDoc(doc(db, 'exercises', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `exercises/${id}`);
      }
    }
  };

  const handleDeleteKnowledgeVideo = async (id: string) => {
    if (window.confirm("Delete this video?")) {
      try {
        await deleteDoc(doc(db, 'knowledgeVideos', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `knowledgeVideos/${id}`);
      }
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
      }
    }
  };

  const handleDeleteFlashcards = async (id: string) => {
    if (window.confirm("Delete this flashcard set?")) {
      try {
        await deleteDoc(doc(db, 'flashcards', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `flashcards/${id}`);
      }
    }
  };

  const handleUpdateStudentBatch = async (studentId: string, batch: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), {
        batch
      });
      setStatus({ type: 'success', message: "Student batch updated!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };
  
  const handleCreateRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingTitle || !recordingVideoUrl || !activeCourseId) {
      setStatus({ type: 'error', message: "Title, Video URL, and Active Course are required." });
      return;
    }

    try {
      await addDoc(collection(db, 'classRecordings'), {
        title: recordingTitle,
        description: recordingDescription,
        chapter: recordingChapter,
        courseId: activeCourseId,
        videoUrl: recordingVideoUrl,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setRecordingTitle('');
      setRecordingDescription('');
      setRecordingVideoUrl('');
      setStatus({ type: 'success', message: "Recording added to the course library!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'classRecordings');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle) return;
    try {
      await addDoc(collection(db, 'courses'), {
        title: courseTitle,
        description: courseDescription,
        createdAt: serverTimestamp()
      });
      setCourseTitle('');
      setCourseDescription('');
      setStatus({ type: 'success', message: "Course created successfully!" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'courses');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("Delete this course and all associated materials? (Materials will effectively be orphaned or invisible to students in this course)")) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        if (activeCourseId === id) setActiveCourseId('');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-80 bg-slate-900 lg:sticky lg:top-0 h-auto lg:h-screen overflow-y-auto p-8 flex flex-col shadow-2xl relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center space-x-3 mb-12 relative z-10">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
            <Trophy className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black font-serif text-white leading-tight italic">Athlex Admin</h1>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Premium Portal</p>
          </div>
        </div>

        <nav className="space-y-1 relative z-10">
          {[
            { id: 'courses', label: 'Curriculum', icon: <BookCheck className="h-5 w-5" /> },
            { id: 'quizzes', label: 'Assessments', icon: <Sparkles className="h-5 w-5" /> },
            { id: 'materials', label: 'Library', icon: <FileText className="h-5 w-5" /> },
            { id: 'liveClasses', label: 'Live Events', icon: <Video className="h-5 w-5" /> },
            { id: 'recordings', label: 'Recordings', icon: <PlayCircle className="h-5 w-5" /> },
            { id: 'students', label: 'Students', icon: <Users className="h-5 w-5" /> },
            { id: 'chats', label: 'Support', icon: <MessageSquare className="h-5 w-5" /> },
            { id: 'results', label: 'Results', icon: <Activity className="h-5 w-5" /> },
            { id: 'exercises', label: 'Exercises', icon: <Dumbbell className="h-5 w-5" /> },
            { id: 'knowledge', label: 'Insights', icon: <Lightbulb className="h-5 w-5" /> },
            { id: 'announcements', label: 'Notices', icon: <Megaphone className="h-5 w-5" /> },
            { id: 'stories', label: 'Hall of Fame', icon: <Award className="h-5 w-5" /> },
            { id: 'inquiries', label: 'Inquiries', icon: <Mail className="h-5 w-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setStatus(null);
              }}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all group ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-2' 
                  : 'text-slate-400 hover:bg-white/5 active:scale-95'
              }`}
            >
              <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {tab.icon}
              </span>
              <span className="font-serif italic text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-12 relative z-10">
          <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Active Context</div>
            <div className="text-sm font-bold text-white truncate mb-4">
              {courses.find(c => c.id === activeCourseId)?.title || "General Portal"}
            </div>
            <select 
              value={activeCourseId}
              onChange={(e) => setActiveCourseId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Global View</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <header className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black font-serif text-slate-900 tracking-tight italic mb-3">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
              </h1>
              <p className="text-slate-500 font-medium italic">Academy command suite and content management.</p>
            </div>
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-3xl font-bold text-sm ${
                    status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <span>{status.message}</span>
                  <button onClick={() => setStatus(null)} className="ml-2 hover:scale-125 transition-transform"><X className="h-4 w-4" /></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

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
      ) : showFlashcardReview && draftFlashcards ? (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl mb-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Review Generated Flashcards: {flashcardTitle}</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowFlashcardReview(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSaveFlashcards}
                className="px-10 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Publish Flashcard Set
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {draftFlashcards.map((card, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col h-full">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Card {idx + 1}</div>
                <div className="font-bold text-slate-900 mb-4 pb-4 border-b border-white/50">{card.front}</div>
                <div className="text-slate-600 text-sm font-medium">{card.back}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Generator Form Column */}
          <div className="lg:col-span-1">
            {activeTab === 'courses' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-indigo-50 p-3 rounded-2xl">
                    <Globe className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Course</h2>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Course Title</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. ACE Certified Personal Trainer"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Course Description</label>
                    <textarea
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      placeholder="Describe the course curriculum..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium h-32 resize-none"
                    />
                  </div>

                  {status && activeTab === 'courses' && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                      <span>{status.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Initialize Course
                  </button>
                </form>
              </div>
            )}

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

            {activeTab === 'exercises' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add Exercise Library Video</h2>
                </div>

                <form onSubmit={handleCreateExercise} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Exercise Name</label>
                    <input
                      type="text"
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      placeholder="e.g. Barbell Back Squat"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Category</label>
                    <select
                      value={exerciseCategory}
                      onChange={(e) => setExerciseCategory(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                    >
                      {['Lower Body', 'Upper Body', 'Core', 'Warm-up', 'Biomechanics'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">YouTube URL</label>
                    <input
                      type="url"
                      value={exerciseVideoUrl}
                      onChange={(e) => setExerciseVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description/Biomechanics Notes</label>
                    <textarea
                      value={exerciseDescription}
                      onChange={(e) => setExerciseDescription(e.target.value)}
                      placeholder="Key cues and biomechanical analysis..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium h-32 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                  >
                    Add to Library
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-amber-50 p-3 rounded-2xl">
                    <Lightbulb className="h-6 w-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Share Knowledge Video</h2>
                </div>

                <form onSubmit={handleCreateKnowledgeVideo} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Video Title</label>
                    <input
                      type="text"
                      value={knowledgeTitle}
                      onChange={(e) => setKnowledgeTitle(e.target.value)}
                      placeholder="e.g. Understanding Macronutrients"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Topic Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Fitness', 'Sports', 'Health', 'Nutrition'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setKnowledgeCategory(cat)}
                          className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${knowledgeCategory === cat ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Video URL</label>
                    <input
                      type="url"
                      value={knowledgeVideoUrl}
                      onChange={(e) => setKnowledgeVideoUrl(e.target.value)}
                      placeholder="Youtube/Vimeo link"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Summary</label>
                    <textarea
                      value={knowledgeDescription}
                      onChange={(e) => setKnowledgeDescription(e.target.value)}
                      placeholder="Key takeaways from this video..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all font-medium h-32 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-700 transition-all shadow-xl shadow-amber-500/20"
                  >
                    Post Video
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'recordings' && (
              <div className="animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-indigo-600 p-3 rounded-2xl">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Upload Session Recording</h2>
                    <p className="text-sm text-slate-500">Add past class recordings to the course library</p>
                  </div>
                </div>
                <form onSubmit={handleCreateRecording} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recording Title</label>
                    <input
                      type="text"
                      value={recordingTitle}
                      onChange={(e) => setRecordingTitle(e.target.value)}
                      placeholder="e.g. Chapter 4 Live Session - Part 1"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Chapter</label>
                      <input
                        type="text"
                        value={recordingChapter}
                        onChange={(e) => setRecordingChapter(e.target.value)}
                        placeholder="e.g. 4"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Course Link</label>
                      <select 
                        value={activeCourseId}
                        onChange={(e) => setActiveCourseId(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm"
                        required
                      >
                        <option value="">Select Course...</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Video URL (Youtube/Vimeo/Drive)</label>
                    <input
                      type="url"
                      value={recordingVideoUrl}
                      onChange={(e) => setRecordingVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description (Optional)</label>
                    <textarea
                      value={recordingDescription}
                      onChange={(e) => setRecordingDescription(e.target.value)}
                      placeholder="Brief summary of what was covered..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium h-32 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Save to Library
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-red-50 p-3 rounded-2xl">
                    <Megaphone className="h-6 w-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Announcement</h2>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Topic/Title</label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="e.g. Final Exam Date Announced"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Priority Level</label>
                    <div className="flex space-x-2">
                      {['info', 'task', 'urgent'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAnnouncementType(type as any)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${announcementType === type ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-500'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Message Content</label>
                    <textarea
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Describe the task or news for students..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all font-medium h-48 resize-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Course (Optional)</label>
                      <select
                        value={announcementCourseId}
                        onChange={(e) => setAnnouncementCourseId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium"
                      >
                        <option value="">All Courses</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Batch (Optional)</label>
                      <input
                        type="text"
                        value={announcementBatch}
                        onChange={(e) => setAnnouncementBatch(e.target.value)}
                        placeholder="e.g. Morning-Jan"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                  >
                    Publish to Targeting
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-green-50 p-3 rounded-2xl">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Record Result</h2>
                </div>

                <form onSubmit={handleRecordResult} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all font-medium"
                      required
                    >
                      <option value="">Select Student...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.displayName || s.email}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Chapter</label>
                      <input
                        type="text"
                        value={resultChapter}
                        onChange={(e) => setResultChapter(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Score</label>
                      <input
                        type="number"
                        value={resultScore}
                        onChange={(e) => setResultScore(parseInt(e.target.value))}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {status && activeTab === 'results' && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                      <span>{status.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all shadow-xl shadow-green-500/20"
                  >
                    Post Result
                  </button>

                  {selectedStudentId && activeCourseId && (
                    <div className="pt-6 border-t border-slate-50 mt-6 animate-in fade-in slide-in-from-bottom-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Progress Preview</label>
                       {(() => {
                         const studentScores = allScores.filter(s => s.studentId === selectedStudentId && s.courseId === activeCourseId);
                         const progress = Math.min(Math.round((Array.from(new Set(studentScores.map(s => s.chapter))).filter(Boolean).length / 20) * 100), 100);
                         return (
                           <div className="space-y-3">
                             <div className="flex justify-between items-end">
                               <span className="text-xs font-bold text-slate-900">Roadmap Completion</span>
                               <span className="text-xl font-black text-green-600">{progress}%</span>
                             </div>
                             <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                                 style={{ width: `${progress}%` }}
                               ></div>
                             </div>
                             <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                               The student's pointer will move to this position
                             </p>
                           </div>
                         );
                       })()}
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'chats' && (
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-[600px] overflow-hidden sticky top-24">
                {selectedStudentForChat ? (
                  <>
                    <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-indigo-100" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{selectedStudentForChat.displayName || selectedStudentForChat.email}</h3>
                          <p className="text-[10px] text-indigo-100 font-black uppercase tracking-widest">Active Thread</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedStudentForChat(null)} className="text-indigo-100 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                      {chatMessages
                        .filter(m => m.studentId === selectedStudentForChat.id)
                        .map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] p-5 rounded-3xl text-sm ${
                              msg.sender === 'admin' 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                            }`}>
                              {msg.text}
                              <div className={`text-[8px] mt-2 font-black uppercase tracking-widest ${
                                msg.sender === 'admin' ? 'text-indigo-200' : 'text-slate-400'
                              }`}>
                                {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleString() : 'Just now'}
                              </div>
                            </div>
                          </div>
                      ))}
                      {chatMessages.filter(m => m.studentId === selectedStudentForChat.id).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                          <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Start the conversation</p>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Send instructions or feedback..."
                          className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-indigo-50 p-6 rounded-[2.5rem] mb-6">
                      <MessageSquare className="h-12 w-12 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Student Chats</h3>
                    <p className="text-slate-500 font-medium max-w-sm">
                      Select a student from the right column to view history and send 2-way messages or announcements.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Flashcard Generator</h2>
                </div>

                <form onSubmit={handleGenerateFlashcardDraft} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Set Title</label>
                    <input
                      type="text"
                      value={flashcardTitle}
                      onChange={(e) => setFlashcardTitle(e.target.value)}
                      placeholder="e.g. Chapter 4 Key Terms"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Chapter</label>
                    <input
                      type="text"
                      value={flashcardChapter}
                      onChange={(e) => setFlashcardChapter(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Number of Cards</label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={numFlashcards}
                      onChange={(e) => setNumFlashcards(parseInt(e.target.value))}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Chapter Notes</label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                      >
                        Upload PDF
                      </button>
                    </div>
                    <textarea
                      value={flashcardNotes}
                      onChange={(e) => setFlashcardNotes(e.target.value)}
                      placeholder="Paste notes for the card content..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium h-48 resize-none"
                      required
                    />
                  </div>

                  {status && activeTab === 'flashcards' && (
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
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center"
                  >
                    {generating ? (
                      <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    ) : (
                      <Sparkles className="h-5 w-5 mr-3" />
                    )}
                    {generating ? 'Generating...' : 'Generate Flashcards'}
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
            {activeTab === 'courses' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Available Courses</h2>
                  <div className="flex space-x-2">
                    <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                      {courses.length} Active System-wide
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className={`bg-white p-8 rounded-[2.5rem] border transition-all ${
                        activeCourseId === course.id ? 'border-indigo-200 ring-2 ring-indigo-500/10 shadow-xl' : 'border-slate-100 shadow-sm opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-indigo-50 p-3 rounded-2xl">
                          <Globe className="h-6 w-6 text-indigo-600" />
                        </div>
                        <button onClick={() => handleDeleteCourse(course.id)} className="text-slate-300 hover:text-red-600">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{course.title}</h3>
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6">{course.description || "No description provided."}</p>
                      <button 
                        onClick={() => setActiveCourseId(course.id)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                          activeCourseId === course.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {activeCourseId === course.id ? 'Currently Editing Content' : 'Select to Manage Content'}
                      </button>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                      <Globe className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium italic">No courses found. Create your first course on the left.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Course Quizzes</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {quizzes.filter(q => !activeCourseId || q.courseId === activeCourseId).length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {quizzes.filter(q => !activeCourseId || q.courseId === activeCourseId).length > 0 ? quizzes.filter(q => !activeCourseId || q.courseId === activeCourseId).map((quiz) => (
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

            {activeTab === 'exercises' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Exercise Library</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {exercises.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                      <div className="aspect-video relative bg-slate-100">
                        <img 
                          src={`https://img.youtube.com/vi/${exercise.videoUrl.split('v=')[1]?.split('&')[0] || exercise.videoUrl.split('/').pop()}/maxresdefault.jpg`} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'; }}
                        />
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="h-12 w-12 text-white" />
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            {exercise.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-slate-900 leading-tight">{exercise.name}</h3>
                          <button onClick={() => handleDeleteExercise(exercise.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{exercise.description}</p>
                        <a 
                          href={exercise.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center hover:underline"
                        >
                          <Globe className="h-3 w-3 mr-1" /> View on YouTube
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'knowledge' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Shared Knowledge Hub</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {knowledgeVideos.length} Total
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {knowledgeVideos.map((video) => (
                    <div key={video.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6">
                      <div className="w-48 aspect-video rounded-2xl overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={`https://img.youtube.com/vi/${video.videoUrl.split('v=')[1]?.split('&')[0] || video.videoUrl.split('/').pop()}/mqdefault.jpg`} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <PlayCircle className="h-8 w-8 text-white opacity-80" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            video.category === 'Nutrition' ? 'bg-green-50 text-green-600' :
                            video.category === 'Fitness' ? 'bg-blue-50 text-blue-600' :
                            video.category === 'Health' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {video.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{video.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-4">{video.description}</p>
                        <div className="flex items-center justify-between">
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-bold hover:underline">Watch Tutorial</a>
                          <button onClick={() => handleDeleteKnowledgeVideo(video.id)} className="text-slate-300 hover:text-red-500">
                             <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'announcements' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Announcements</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {announcements.filter(a => !activeCourseId || a.courseId === activeCourseId).length} Total
                  </span>
                </div>
                <div className="space-y-4">
                  {announcements.filter(a => !activeCourseId || a.courseId === activeCourseId).map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-red-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-2xl ${
                            item.type === 'urgent' ? 'bg-red-50 text-red-600' :
                            item.type === 'task' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                          }`}>
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-slate-900">{item.title}</h3>
                              {item.batch && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                  Batch: {item.batch}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.createdAt?.toDate()).toLocaleString()}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-4 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </div>
                    </div>
                  ))}
                  {announcements.filter(a => !activeCourseId || a.courseId === activeCourseId).length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                      <Megaphone className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium italic">No announcements found for this course criteria.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'students' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Students & Batch Management</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {students.length} Registered Students
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {students.map((student) => (
                    <div key={student.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-6">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                          {student.photoURL ? (
                            <img src={student.photoURL} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <Users className="h-6 w-6 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{student.displayName || student.email}</h3>
                          <p className="text-xs text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Assignment</label>
                          <input 
                            type="text"
                            defaultValue={student.batch || ""}
                            onBlur={(e) => handleUpdateStudentBatch(student.id, e.target.value)}
                            placeholder="Assign to Batch..."
                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className={`p-2 rounded-xl ${student.batch ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                          <Users className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Certification Result Sheet</h2>
                  <div className="flex space-x-2">
                     <span className="text-xs font-bold text-green-600 bg-green-50 px-4 py-1.5 rounded-full uppercase tracking-widest">
                       {allScores.filter(s => s.courseId === activeCourseId).length} Records
                     </span>
                  </div>
                </div>
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-slate-50">
                         <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                         <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Chapter</th>
                         <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Score</th>
                         <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                         <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {allScores.filter(s => s.courseId === activeCourseId).map((score) => (
                          <tr key={score.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="font-bold text-slate-900">{score.studentEmail}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{score.quizTitle}</div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs">CH {score.chapter}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${(score.score/score.totalQuestions) >= 0.8 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                <span className="font-black text-slate-900">{score.score}/{score.totalQuestions}</span>
                                <span className="text-[10px] font-bold text-slate-400">({Math.round(score.score/score.totalQuestions*100)}%)</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-xs font-bold text-slate-400">
                              {score.completedAt?.toDate ? new Date(score.completedAt.toDate()).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button 
                                onClick={() => deleteDoc(doc(db, 'scores', score.id))}
                                className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                   {allScores.filter(s => s.courseId === activeCourseId).length === 0 && (
                     <div className="py-20 text-center">
                        <Trophy className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium italic">No results recorded for this course yet. Start by entering marks on the left.</p>
                     </div>
                   )}
                </div>
              </>
            )}

            {activeTab === 'chats' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Chats</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStudentForChat(st)}
                      className={`p-6 rounded-3xl border transition-all text-left flex items-center space-x-4 ${
                        selectedStudentForChat?.id === st.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{st.displayName || st.email}</div>
                        <div className={`text-xs truncate ${selectedStudentForChat?.id === st.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {st.email}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'recordings' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Session Recording Library</h2>
                    <p className="text-sm text-slate-500 font-medium">Video recordings of all past class sessions</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {recordings.filter(r => !activeCourseId || r.courseId === activeCourseId).length} Sessions
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {recordings.filter(r => !activeCourseId || r.courseId === activeCourseId).length > 0 ? recordings.filter(r => !activeCourseId || r.courseId === activeCourseId).map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-200/50 transition-all flex flex-col"
                    >
                      <div className="aspect-video bg-slate-900 rounded-2xl mb-6 relative overflow-hidden group">
                        {/* Placeholder/Thumbnail for video */}
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-all">
                          <PlayCircle className="h-16 w-16 text-indigo-600 opacity-80 group-hover:opacity-100 transition-all" />
                        </div>
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            onClick={() => deleteDoc(doc(db, 'classRecordings', rec.id))}
                            className="p-3 bg-white/90 backdrop-blur-md text-red-600 hover:bg-red-600 hover:text-white rounded-xl shadow-lg transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black uppercase tracking-widest leading-none">
                            Chapter {rec.chapter}
                          </span>
                          {courses.find(c => c.id === rec.courseId) && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black uppercase tracking-widest leading-none">
                              {courses.find(c => c.id === rec.courseId)?.title}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{rec.title}</h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">
                          {rec.description || 'No description provided for this session.'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          Added {new Date(rec.createdAt?.toDate()).toLocaleDateString()}
                        </div>
                        <a 
                          href={rec.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-1"
                        >
                          <span>Open Video</span>
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assign Recording Access</label>
                        <div className="flex flex-wrap gap-3">
                          {students.map((student) => {
                            const isAssigned = rec.assignedTo?.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  const newAssigned = isAssigned
                                    ? (rec.assignedTo || []).filter((id: string) => id !== student.id)
                                    : [...(rec.assignedTo || []), student.id];
                                  handleAssignRecording(rec.id, newAssigned);
                                }}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                                  isAssigned 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'
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
                    <div className="lg:col-span-2 py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                      <Video className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium italic text-lg">No recordings found for this course criteria.</p>
                      <p className="text-slate-300 text-sm">Use the form on the left to add your first session recording.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'materials' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Course Materials</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {materials.filter(m => !activeCourseId || m.courseId === activeCourseId).length} Units
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {materials.filter(m => !activeCourseId || m.courseId === activeCourseId).length > 0 ? materials.filter(m => !activeCourseId || m.courseId === activeCourseId).map((material) => (
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
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Live Schedule</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {liveClasses.filter(c => !activeCourseId || c.courseId === activeCourseId).length} Units
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {liveClasses.filter(c => !activeCourseId || c.courseId === activeCourseId).length > 0 ? liveClasses.filter(c => !activeCourseId || c.courseId === activeCourseId).map((liveClass) => (
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

            {activeTab === 'flashcards' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Course Flashcards</h2>
                  <span className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {flashcardSets.filter(s => !activeCourseId || s.courseId === activeCourseId).length} Sets
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {flashcardSets.filter(s => !activeCourseId || s.courseId === activeCourseId).length > 0 ? flashcardSets.filter(s => !activeCourseId || s.courseId === activeCourseId).map((set) => (
                    <div
                      key={set.id}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                            <BookCheck className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{set.title}</h3>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Chapter {set.chapter} • {set.cards?.length || 0} Cards • Published {new Date(set.createdAt?.toDate()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFlashcards(set.id)}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="pt-6 border-t border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assign Student Access</label>
                        <div className="flex flex-wrap gap-3">
                          {students.map((student) => {
                            const isAssigned = set.assignedTo?.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  const newAssigned = isAssigned
                                    ? set.assignedTo.filter((id: string) => id !== student.id)
                                    : [...(set.assignedTo || []), student.id];
                                  handleAssignFlashcards(set.id, newAssigned);
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
                        <BookCheck className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Flashcards Found</h3>
                      <p className="text-slate-500 text-sm">Create your first flashcard set using the AI generator.</p>
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
    </main>
  </div>
);
}
