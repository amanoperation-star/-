import React, { useState, useMemo } from 'react';
import { 
  User, 
  Clock, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Calendar, 
  Search, 
  Download, 
  Filter, 
  X, 
  Activity, 
  CheckCircle2, 
  KeyRound, 
  Users, 
  Radio,
  FileSpreadsheet,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AppUser, AuditLog } from '../types';
import { ActiveUserPresence } from '../utils/realtimeSync';
import { exportCustomObjectsToCSV } from '../utils/export';

interface UserLoginHistoryModalProps {
  user: AppUser | null;
  auditLogs: AuditLog[];
  onlineUsers?: ActiveUserPresence[];
  onClose: () => void;
}

export const UserLoginHistoryModal: React.FC<UserLoginHistoryModalProps> = ({
  user,
  auditLogs,
  onlineUsers = [],
  onClose,
}) => {
  const [filterAction, setFilterAction] = useState<'all' | 'login' | 'logout' | 'switch'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  if (!user) return null;

  // Check if user is currently online in realtime presence
  const isUserOnline = onlineUsers.some(
    (u) => u.name.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(u.name.toLowerCase())
  );

  // Extract logs specific to this user (login, logout, switch user, password change)
  const userLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const isLoginOrLogout = 
        log.action.includes('دخول') || 
        log.action.includes('خروج') || 
        log.action.includes('تبديل') || 
        log.action.includes('كلمة المرور');

      const matchesUser = 
        log.user.toLowerCase().includes(user.name.toLowerCase()) || 
        log.details.toLowerCase().includes(user.name.toLowerCase()) ||
        (user.username && log.details.toLowerCase().includes(user.username.toLowerCase()));

      return isLoginOrLogout && matchesUser;
    });
  }, [auditLogs, user]);

  // Process logs into structured session events with duration calculation
  const processedSessions = useMemo(() => {
    const sorted = [...userLogs].sort((a, b) => {
      // Sort newest first
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return sorted.map((log, index) => {
      const isLogin = log.action.includes('دخول');
      const isLogout = log.action.includes('خروج');
      const isSwitch = log.action.includes('تبديل');

      // Estimate session duration if we have consecutive login & logout events
      let durationText = '—';
      if (isLogin && index > 0) {
        const previousEvent = sorted[index - 1]; // Newer event
        if (previousEvent && previousEvent.action.includes('خروج')) {
          const startTime = new Date(log.time).getTime();
          const endTime = new Date(previousEvent.time).getTime();
          if (!isNaN(startTime) && !isNaN(endTime) && endTime > startTime) {
            const diffMinutes = Math.round((endTime - startTime) / (1000 * 60));
            if (diffMinutes < 60) {
              durationText = `${diffMinutes} دقيقة`;
            } else {
              const hours = Math.floor(diffMinutes / 60);
              const mins = diffMinutes % 60;
              durationText = `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
            }
          }
        }
      }

      return {
        id: log.id || `log-${index}`,
        rawTime: log.time,
        action: log.action,
        details: log.details,
        user: log.user,
        isLogin,
        isLogout,
        isSwitch,
        durationText,
      };
    });
  }, [userLogs]);

  // Filtered session records based on user filter selections
  const filteredSessions = useMemo(() => {
    return processedSessions.filter((session) => {
      // Action Filter
      if (filterAction === 'login' && !session.isLogin) return false;
      if (filterAction === 'logout' && !session.isLogout) return false;
      if (filterAction === 'switch' && !session.isSwitch) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDetail = session.details.toLowerCase().includes(q);
        const matchesTime = session.rawTime.toLowerCase().includes(q);
        const matchesAction = session.action.toLowerCase().includes(q);
        if (!matchesDetail && !matchesTime && !matchesAction) return false;
      }

      // Date Range Filter
      if (dateRangeFilter !== 'all') {
        const sessionDate = new Date(session.rawTime);
        if (!isNaN(sessionDate.getTime())) {
          const now = new Date();
          if (dateRangeFilter === 'today') {
            const isToday = sessionDate.toDateString() === now.toDateString();
            if (!isToday) return false;
          } else if (dateRangeFilter === 'week') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            if (sessionDate < sevenDaysAgo) return false;
          } else if (dateRangeFilter === 'month') {
            const isThisMonth = sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
            if (!isThisMonth) return false;
          }
        }
      }

      return true;
    });
  }, [processedSessions, filterAction, searchQuery, dateRangeFilter]);

  // Calculated Stats
  const totalLogins = processedSessions.filter((s) => s.isLogin).length;
  const totalLogouts = processedSessions.filter((s) => s.isLogout).length;
  const lastLoginRecord = processedSessions.find((s) => s.isLogin);
  const lastLogoutRecord = processedSessions.find((s) => s.isLogout);

  // Export User Login History to CSV
  const handleExportUserHistoryCSV = () => {
    const exportData = filteredSessions.map((s) => ({
      'اسم الموظف': user.name,
      'اسم المستخدم': `@${user.username}`,
      'القسم والفرع': user.department,
      'نوع الحركة': s.action,
      'التاريخ والوقت': s.rawTime,
      'تفاصيل الجلسة والعملية': s.details,
      'مدة الجلسة التقديرية': s.durationText,
    }));

    exportCustomObjectsToCSV(
      exportData,
      `User_Login_History_${user.username}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn font-['Cairo',sans-serif]">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right" dir="rtl">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white font-black flex items-center justify-center text-base shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/30">
              {user.avatar || user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{user.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono">
                  @{user.username}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  isUserOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isUserOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                  <span>{isUserOnline ? 'متصل الآن 🟢' : 'غير متصل ⚪'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل حركة الدخول والخروج والرقابة الإدارية • <strong className="text-slate-200">{user.department}</strong> ({user.role})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Activity Summary Cards */}
        <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي مرات الدخول</span>
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-black text-white font-mono">{totalLogins}</span>
              <span className="text-[10px] text-emerald-400 font-bold">جلسات</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي الخروج والإنهاء</span>
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="text-lg font-black text-white font-mono">{totalLogouts}</span>
              <span className="text-[10px] text-rose-400 font-bold">إغلاق</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">آخر تسجيل دخول</span>
            <div className="text-xs font-bold text-slate-200 truncate font-mono">
              {lastLoginRecord ? lastLoginRecord.rawTime : 'لا يوجد سجل حديث'}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">آخر تسجيل خروج</span>
            <div className="text-xs font-bold text-slate-200 truncate font-mono">
              {isUserOnline ? 'نشط الآن ⚡' : lastLogoutRecord ? lastLogoutRecord.rawTime : 'جلسة قائمة'}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterAction('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterAction === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({userLogs.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterAction('login')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterAction === 'login'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <LogIn className="w-3 h-3" />
              <span>دخول فقط</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterAction('logout')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterAction === 'logout'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <LogOut className="w-3 h-3" />
              <span>خروج فقط</span>
            </button>
          </div>

          {/* Search Box & Range Selector */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative flex-1 min-w-[160px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالتاريخ أو التفاصيل..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">📅 كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
            </select>

            <button
              type="button"
              onClick={handleExportUserHistoryCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              title="تصدير سجل الموظف إلى ملف Excel CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* History Table Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500">
                <Clock className="w-7 h-7" />
              </div>
              <p className="text-slate-300 font-bold text-sm">لا يوجد سجل دخول/خروج مسجل بهذا الفلتر للموظف</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                يتم تسجيل أوقات الدخول والخروج والتبديل تلقائياً فور قيام الموظف بتسجيل دخوله للمنظومة.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">التاريخ والوقت الدقيق</th>
                    <th className="p-3">تفاصيل الجلسة والعملية</th>
                    <th className="p-3 text-center">مدة الجلسة التقديرية</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            s.isLogin
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : s.isLogout
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : s.isSwitch
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {s.isLogin && <LogIn className="w-3.5 h-3.5" />}
                          {s.isLogout && <LogOut className="w-3.5 h-3.5" />}
                          {s.isSwitch && <Users className="w-3.5 h-3.5" />}
                          <span>{s.action}</span>
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-200 dir-ltr text-right">
                        {s.rawTime}
                      </td>
                      <td className="p-3 text-slate-300 leading-relaxed">
                        {s.details}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-300">
                        {s.durationText}
                      </td>
                      <td className="p-3 text-center">
                        {s.isLogin ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                            دخول ناجح ⚡
                          </span>
                        ) : s.isLogout ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                            إنهاء الجلسة 🏁
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded-full">
                            محدث 🔄
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>نظام الحماية والرقابة الإدارية المحمية بالسجل الزمني المؤرخ</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
