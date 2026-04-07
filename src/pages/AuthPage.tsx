import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Chrome, Dumbbell, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-red-600"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Dumbbell className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mb-10 font-medium">
            Join the elite circle of fitness professionals at Athlex Academy.
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-4 bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <Chrome className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <p className="mt-10 text-xs text-slate-400 leading-relaxed">
            By continuing, you agree to Athlex Academy's <br />
            <span className="text-slate-600 font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-slate-600 font-bold hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
