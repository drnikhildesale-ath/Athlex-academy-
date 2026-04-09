import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogOut, User, Menu, X, Dumbbell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  isAdmin: boolean;
}

export default function Layout({ children, user, isAdmin }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="https://photos.fife.usercontent.google.com/pw/AP1GczPiIMxbi35Ibe9nkZZO1UdiXA5hb_VJWq6I63t--QAwn7gHzuGOOvB2=w928-h928-s-no-gm?authuser=0" 
                  alt="Athlex Academy Logo" 
                  className="h-12 w-auto"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Home</Link>
              {user && (
                <>
                  <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Dashboard</Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Admin</Link>
                  )}
                </>
              )}
              {user ? (
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                  <div className="flex items-center space-x-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName} 
                        className="h-8 w-8 rounded-full border border-slate-200 shadow-sm" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-slate-700">{user.displayName?.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-in slide-in-from-top duration-200">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link to="/" className="block px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Home</Link>
              {user && (
                <>
                  <Link to="/dashboard" className="block px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Dashboard</Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Admin</Link>
                  )}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between px-4">
                    <div className="flex items-center space-x-3">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName} 
                          className="h-10 w-10 rounded-full border border-slate-200 shadow-sm" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-slate-900">{user.displayName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="h-6 w-6" />
                    </button>
                  </div>
                </>
              )}
              {!user && (
                <Link
                  to="/auth"
                  className="block w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-center shadow-lg shadow-blue-500/20"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img 
                src="https://photos.fife.usercontent.google.com/pw/AP1GczPiIMxbi35Ibe9nkZZO1UdiXA5hb_VJWq6I63t--QAwn7gHzuGOOvB2=w928-h928-s-no-gm?authuser=0" 
                alt="Athlex Academy Logo" 
                className="h-10 w-auto brightness-0 invert"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-sm">© 2026 Athlex Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
