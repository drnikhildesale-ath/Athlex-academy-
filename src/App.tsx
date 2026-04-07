import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizPage from './pages/QuizPage';

export default function App() {
  console.log("App component rendering...");
  const [user, setUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log("App useEffect running...");
    // Safety timeout: force loading to false after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth state taking too long, forcing load...");
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimeout);
      try {
        if (firebaseUser) {
          // Check if user exists in Firestore, if not create profile
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: firebaseUser.email === 'drnikhildesale@gmail.com' ? 'admin' : 'student',
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
            setIsAdmin(newUser.role === 'admin');
          } else {
            const userData = userSnap.data();
            const isAdminEmail = firebaseUser.email === 'drnikhildesale@gmail.com';
            
            // Auto-fix: If user has admin email but is marked as student, update Firestore
            if (isAdminEmail && userData.role !== 'admin') {
              await setDoc(userRef, { role: 'admin' }, { merge: true });
              userData.role = 'admin';
            }
            
            setUser(userData);
            setIsAdmin(userData.role === 'admin' || isAdminEmail);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth State Error:", error);
        // Fallback: allow app to load even if Firestore check fails
        setUser(firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null);
        setIsAdmin(firebaseUser?.email === 'drnikhildesale@gmail.com');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">ATHLEX ACADEMY</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Layout user={user} isAdmin={isAdmin}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/dashboard" /> : <AuthPage />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <StudentDashboard user={user} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/admin" 
              element={isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/quiz/:id" 
              element={user ? <QuizPage user={user} /> : <Navigate to="/auth" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}
