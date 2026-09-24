import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  Headset,
  Briefcase,
  Cpu,
  LifeBuoy,
  Sparkles,
  Users
} from 'lucide-react';
import { AppUser, GeneralSettings } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  generalSettings: GeneralSettings;
  onLogin: (user: AppUser) => void;
}

const BRAND_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Headset,
  ShieldCheck,
  Briefcase,
  Cpu,
  LifeBuoy,
  Sparkles,
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  generalSettings,
  onLogin,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const LogoIcon = BRAND_ICONS[generalSettings.appLogoIcon] || Headset;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setErrorMessage('يرجى إدخال اسم المستخدم أو البريد الإلكتروني.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by username or email
      const matchedUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanIdentifier ||
          u.email.toLowerCase() === cleanIdentifier
      );

      if (!matchedUser) {
        setErrorMessage('اسم المستخدم أو البريد الإلكتروني غير مسجل بالمنظومة.');
        setIsLoading(false);
        return;
      }

      // Check password (default to '123' if not yet defined on older accounts)
      const userPassword = matchedUser.password || (matchedUser.role === 'Admin' ? 'admin' : '123');

      if (userPassword !== cleanPassword) {
        setErrorMessage('كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة.');
        setIsLoading(false);
        return;
      }

      // Successful login
      setIsLoading(false);
      onLogin(matchedUser);
    }, 300);
  };

  const handleSelectQuickUser = (u: AppUser) => {
    setIdentifier(u.username);
    setPassword(u.password || (u.role === 'Admin' ? 'admin' : '123'));
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden font-['Cairo',sans-serif]">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-xl shadow-indigo-600/25 ring-4 ring-indigo-500/20 mb-2">
            <LogoIcon className="w-9 h-9" />
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              {generalSettings.appName || 'منظومة تتبع وإدارة المشاكل'}
            </h1>
            {generalSettings.showBadge && generalSettings.appBadge && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                {generalSettings.appBadge}
              </span>
            )}
          </div>

          {generalSettings.showSubtitle && (
            <p className="text-xs text-slate-400 font-medium">
              {generalSettings.appSubtitle || 'تسجيل الدخول للموظفين وفرق الدعم الفني'}
            </p>
          )}
        </div>

        {/* Login Box */}
        <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border border-white/10 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-right">
          <div className="border-b border-white/10 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              <span>تسجيل الدخول إلى النظام 🔐</span>
              <span className="text-[11px] font-normal text-slate-400">بوابة الموظفين</span>
            </h2>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin أو user@company.com"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-2xl px-4 py-3 pl-10 text-white font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-400">المحددة بواسطة المشرف</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-2xl px-4 py-3 pl-10 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl transition duration-150 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'جارِ التحقق...' : 'دخول المنظومة'}</span>
            </button>
          </form>

          {/* Quick-fill selection for registered team members */}
          <div className="pt-2 border-t border-white/10 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>اختر حساب موظف للملء السريع:</span>
              </span>
              <span className="text-[10px] text-indigo-400">للتجربة السريعة</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {users.map((u) => {
                const uPass = u.password || (u.role === 'Admin' ? 'admin' : '123');
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickUser(u)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-right transition flex items-center gap-2 text-[11px] group cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      {u.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-200 truncate group-hover:text-indigo-300">{u.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">كلمة السر: {uPass}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Note */}
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200/90 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>ملاحظة الإدارة والأمان:</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-300">
              يمكن للمسؤول تحديد أو تغيير كلمة مرور أي موظف عند إضافته أو من خلال تبويب إدارة الحسابات في لوحة الإدارة.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500">
          {generalSettings.companyName || 'منظومة إدارة التذاكر المؤسسية'} • نظام صلاحيات محمي بكلمة مرور
        </div>
      </div>
    </div>
  );
};
