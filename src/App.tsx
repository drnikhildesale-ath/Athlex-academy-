import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizPage from './pages/QuizPage';
import FlashcardsPage from './pages/FlashcardsPage';

const logoImg = "https://lh3.googleusercontent.com/d/12cn4hbiM2s-AlyGxSAT2kjTXVrRcHHOl";

export default function App() {
  console.log("App component rendering...");
  const [user, setUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    
    try {
      console.log("App useEffect running...");
      
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        // Clean up previous user snapshot if it exists
        if (unsubscribeUser) {
          unsubscribeUser();
          unsubscribeUser = null;
        }

        try {
          if (firebaseUser) {
            console.log("Firebase user detected:", firebaseUser.uid);
            // Listen for user profile changes
            const userRef = doc(db, 'users', firebaseUser.uid);
            
            // Throttle last login updates to once per hour per device
            const lastUpdateKey = `last_login_${firebaseUser.uid}`;
            const lastUpdate = localStorage.getItem(lastUpdateKey);
            const now = Date.now();
            
            if (!lastUpdate || now - parseInt(lastUpdate) > 3600000) {
              updateDoc(userRef, { lastLogin: serverTimestamp() }).catch(() => {});
              localStorage.setItem(lastUpdateKey, now.toString());
            }

            // Fetch user profile once instead of onSnapshot
            const fetchUserProfile = async () => {
              try {
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                  console.log("User doc doesn't exist, creating...");
                  const newUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
                    photoURL: firebaseUser.photoURL || '',
                    role: ['drnikhildesale@gmail.com', 'athlexacademy@gmail.com'].includes(firebaseUser.email || '') ? 'admin' : 'student',
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                  };
                  
                  await setDoc(userRef, newUser);
                  
                  if (newUser.role === 'student') {
                    await addDoc(collection(db, 'notifications'), {
                      type: 'new_student',
                      studentId: firebaseUser.uid,
                      studentName: newUser.displayName,
                      studentEmail: newUser.email,
                      createdAt: serverTimestamp(),
                      read: false
                    });
                  }
                  setUser(newUser);
                  setIsAdmin(newUser.role === 'admin');
                } else {
                  const userData = userSnap.data();
                  console.log("User data loaded:", userData.role);
                  const adminEmails = ['drnikhildesale@gmail.com', 'athlexacademy@gmail.com'];
                  const isAdminEmail = adminEmails.includes(firebaseUser.email || '');
                  
                  if (isAdminEmail && userData.role !== 'admin') {
                    await updateDoc(userRef, { role: 'admin' });
                    userData.role = 'admin';
                  }
                  
                  setUser({ ...userData, uid: firebaseUser.uid });
                  setIsAdmin(userData.role === 'admin' || isAdminEmail);
                }
              } catch (err) {
                console.error("Error fetching user profile:", err);
                const adminEmails = ['drnikhildesale@gmail.com', 'athlexacademy@gmail.com'];
                const isAdminEmail = adminEmails.includes(firebaseUser.email || '');
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  role: isAdminEmail ? 'admin' : 'student',
                  isFallback: true
                });
                setIsAdmin(isAdminEmail);
              } finally {
                setLoading(false);
              }
            };

            fetchUserProfile();
          } else {
            console.log("No firebase user.");
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (authCallbackError) {
          console.error("Auth callback error:", authCallbackError);
          setLoading(false);
        }
      });

      return () => unsubscribeAuth();
    } catch (e) {
      console.error("App useEffect setup crashed:", e);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={logoImg} 
                alt="Logo" 
                className="h-12 w-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <p className="text-slate-400 font-black tracking-widest text-xs animate-pulse uppercase">Athlex Academy of Sports Science and Performance</p>
        </div>
      </div>
    );
  }

  try {
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
              <Route 
                path="/flashcards/:setId" 
                element={user ? <FlashcardsPage /> : <Navigate to="/auth" />} 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </Router>
      </ErrorBoundary>
    );
  } catch (err) {
    console.error("App Render Error:", err);
    return (
      <div className="p-10 text-red-600">
        <h1>Critical Render Error</h1>
        <pre>{err instanceof Error ? err.message : String(err)}</pre>
      </div>
    );
  }
}
