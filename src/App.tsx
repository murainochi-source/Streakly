import { useState, useEffect } from 'react';
import { Plus, Trash2, Flame, LogOut, Eye, EyeOff, Check, Circle, Filter } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Habit {
  id: string;
  name: string;
  streak: number;
  last_completed_date: string | null;
  completedToday: boolean;
  category: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'slate' },
  { value: 'study', label: 'Study', color: 'blue' },
  { value: 'exercise', label: 'Exercise', color: 'orange' },
  { value: 'health', label: 'Health', color: 'green' },
  { value: 'work', label: 'Work', color: 'violet' },
  { value: 'personal', label: 'Personal', color: 'rose' },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('general');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [shakeForm, setShakeForm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'slate';
  };

  const getCategoryClasses = (category: string) => {
    const colorMap: Record<string, string> = {
      'general': 'bg-slate-100 text-slate-700',
      'study': 'bg-blue-100 text-blue-700',
      'exercise': 'bg-orange-100 text-orange-700',
      'health': 'bg-green-100 text-green-700',
      'work': 'bg-violet-100 text-violet-700',
      'personal': 'bg-rose-100 text-rose-700',
    };
    return colorMap[category] || 'bg-slate-100 text-slate-700';
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  const loadHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading habits:', error);
      return;
    }

    const today = getTodayString();
    const habitsWithCompletion = (data || []).map(habit => ({
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
      last_completed_date: habit.last_completed_date,
      completedToday: habit.last_completed_date === today,
      category: habit.category || 'general'
    }));

    setHabits(habitsWithCompletion);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
    } else {
      setSuccessMessage('Account created successfully! You can now sign in.');
      setEmail('');
      setPassword('');
      setAuthMode('signin');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setShakeForm(false);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setAuthLoading(false);

    if (error) {
      setAuthError('Invalid email or password. Please try again.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } else {
      setSuccessMessage('Welcome back!');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!resetEmail || !emailRegex.test(resetEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin,
    });

    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
    } else {
      setSuccessMessage('Password reset link sent to your email.');
      setResetEmail('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const addHabit = async () => {
    if (!user || habitName.trim() === '') return;

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: habitName.trim(),
        streak: 0,
        last_completed_date: null,
        category: habitCategory,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding habit:', error);
      return;
    }

    setHabits([...habits, {
      id: data.id,
      name: data.name,
      streak: data.streak,
      last_completed_date: data.last_completed_date,
      completedToday: false,
      category: data.category || 'general'
    }]);
    setHabitName('');
    setHabitCategory('general');
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.completedToday) return;

    const today = getTodayString();
    const newStreak = habit.streak + 1;

    const { error } = await supabase
      .from('habits')
      .update({
        streak: newStreak,
        last_completed_date: today,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating habit:', error);
      return;
    }

    setHabits(habits.map(h => {
      if (h.id === id) {
        return {
          ...h,
          streak: newStreak,
          last_completed_date: today,
          completedToday: true
        };
      }
      return h;
    }));
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting habit:', error);
      return;
    }

    setHabits(habits.filter(habit => habit.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-16 px-6">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
            20%, 40%, 60%, 80% { transform: translateX(8px); }
          }
          .shake {
            animation: shake 0.5s;
          }
        `}</style>
        <div className={`bg-white rounded-2xl shadow-xl p-8 w-full max-w-md ${shakeForm ? 'shake' : ''}`}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center tracking-tight">
              Streakly
            </h1>
            <p className="text-center text-slate-500 text-sm">
              Build habits. Keep your streak.
            </p>
          </div>

          {!forgotPasswordMode ? (
            <>
              <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setEmailError('');
                    setPasswordError('');
                    setAuthError('');
                    setSuccessMessage('');
                    setShowPassword(false);
                  }}
                  className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                    authMode === 'signin'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setEmailError('');
                    setPasswordError('');
                    setAuthError('');
                    setSuccessMessage('');
                    setShowPassword(false);
                  }}
                  className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                    authMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {successMessage}
                </div>
              )}

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {authError}
                </div>
              )}

              <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                      setAuthError('');
                    }}
                    placeholder="Email address"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      emailError || (authError && authMode === 'signin')
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
                    }`}
                  />
                  {emailError && (
                    <p className="text-red-600 text-xs mt-1.5 ml-1">{emailError}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                        setAuthError('');
                      }}
                      placeholder="Password (min 6 characters)"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        passwordError || (authError && authMode === 'signin')
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-600 text-xs mt-1.5 ml-1">{passwordError}</p>
                  )}
                </div>

                {authMode === 'signin' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-400 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer">
                      Remember me
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-6 py-3.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 active:scale-[0.98] transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                {authMode === 'signin' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordMode(true);
                        setAuthError('');
                        setSuccessMessage('');
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setForgotPasswordMode(false);
                  setAuthError('');
                  setSuccessMessage('');
                  setResetEmail('');
                }}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6 flex items-center gap-1"
              >
                ← Back to Sign In
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
              <p className="text-slate-600 text-sm mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {successMessage}
                </div>
              )}

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {authError}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Email address"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-slate-400 focus:ring-slate-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-6 py-3.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 active:scale-[0.98] transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {authLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  const completedCount = habits.filter(habit => habit.completedToday).length;
  const totalCount = habits.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredHabits = selectedFilter === 'all'
    ? habits
    : habits.filter(habit => habit.category === selectedFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1"></div>
              <h1 className="text-4xl font-bold text-slate-900 text-center tracking-tight flex-1">
                Streakly
              </h1>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
            <p className="text-center text-slate-500 text-sm">
              Build habits. Keep your streak.
            </p>
          </div>

          {totalCount > 0 && (
            <div className="mb-6">
              <div className="bg-slate-50 rounded-lg px-5 py-4 border border-slate-200">
                <p className="text-center text-slate-700 font-medium text-sm mb-3">
                  Completed today: <span className="text-slate-900 font-semibold">{completedCount}</span> / <span className="text-slate-900 font-semibold">{totalCount}</span> habits
                </p>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Enter a new habit..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all shadow-sm"
              />
              <select
                value={habitCategory}
                onChange={(e) => setHabitCategory(e.target.value)}
                className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all shadow-sm bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <button
                onClick={addHabit}
                className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center gap-2 font-semibold shadow-md"
              >
                <Plus size={20} />
                Add
              </button>
            </div>

            {totalCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={16} className="text-slate-400" />
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    selectedFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedFilter(cat.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      selectedFilter === cat.value
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">
                No habits yet. Start building your routine!
              </p>
            </div>
          ) : filteredHabits.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">
                No habits in this category yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHabits.map((habit) => {
                const categoryLabel = CATEGORIES.find(c => c.value === habit.category)?.label || 'General';
                const categoryClasses = getCategoryClasses(habit.category);

                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all shadow-md hover:shadow-lg ${
                      habit.completedToday
                        ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {habit.completedToday ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
                        >
                          <Circle size={12} className="text-slate-300" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base ${
                        habit.completedToday ? 'text-green-800 line-through' : 'text-slate-900'
                      }`}>
                        {habit.name}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${categoryClasses}`}>
                        {categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border border-orange-200/60 shadow-sm">
                      <Flame size={18} className="text-orange-500" />
                      <span className="font-bold text-orange-700 text-lg">
                        {habit.streak}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
