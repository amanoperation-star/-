import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  LogIn, 
  LogOut, 
  Search, 
  Download, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  UserCheck, 
  Activity, 
  CheckCircle2, 
  KeyRound, 
  FileSpreadsheet, 
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { AppUser, AuditLog } from '../types';
import { ActiveUserPresence } from '../utils/realtimeSync';
import { exportCustomObjectsToCSV } from '../utils/export';

interface EmployeeLoginHistoryTabProps {
  users: AppUser[];
  auditLogs: AuditLog[];
  onlineUsers?: ActiveUserPresence[];
  initialSelectedUserId?: string;
  onSelectUserToEdit?: (user: AppUser) => void;
}

export const EmployeeLoginHistoryTab: React.FC<EmployeeLoginHistoryTabProps> = ({
  users,
  auditLogs,
  onlineUsers = [],
  initialSelectedUserId,
  onSelectUserToEdit,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(initialSelectedUserId || 'ALL');
  const [filterAction, setFilterAction] = useState<'all' | 'login' | 'logout' | 'switch'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Selected single user object if not 'ALL'
  const selectedUser = useMemo(() => {
    if (selectedUserId === 'ALL') return null;
    return users.find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // Check online status helper
  const checkUserOnline = (u: AppUser) => {
    return onlineUsers.some(
      (online) =>
        online.name.toLowerCase().includes(u.name.toLowerCase()) ||
        u.name.toLowerCase().includes(online.name.toLowerCase())
    );
  };

  // Filter audit logs related to authentication (login, logout, switch, password)
  const sessionLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const isAuthAction = 
        log.action.includes('دخول') || 
        log.action.includes('خروج') || 
        log.action.includes('تبديل') || 
        log.action.includes('كلمة المرور');

      if (!isAuthAction) return false;

      // Filter by selected user if specific user is chosen
      if (selectedUser) {
        const matchesUser = 
          log.user.toLowerCase().includes(selectedUser.name.toLowerCase()) || 
          log.details.toLowerCase().includes(selectedUser.name.toLowerCase()) ||
          (selectedUser.username && log.details.toLowerCase().includes(selectedUser.username.toLowerCase()));
        return matchesUser;
      }

      return true;
    });
  }, [auditLogs, selectedUser]);

  // Process session logs with duration estimations
  const processedSessions = useMemo(() => {
    const sorted = [...sessionLogs].sort((a, b) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return sorted.map((log, index) => {
      const isLogin = log.action.includes('دخول');
      const isLogout = log.action.includes('خروج');
      const isSwitch = log.action.includes('تبديل');

      // Associate with user
      const matchedUser = users.find(
        (u) =>
          u.name.toLowerCase() === log.user.toLowerCase() ||
          log.details.toLowerCase().includes(u.name.toLowerCase()) ||
          (u.username && log.details.toLowerCase().includes(u.username.toLowerCase()))
      );

      // Estimate session duration if we have a consecutive login and logout event for the same user
      let durationText = '—';
      if (isLogin && index > 0) {
        const previousEvent = sorted[index - 1]; // newer event
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
        userName: matchedUser ? matchedUser.name : log.user,
        userUsername: matchedUser ? matchedUser.username : '',
        userDept: matchedUser ? matchedUser.department : 'فريق العمل',
        userRole: matchedUser ? matchedUser.role : 'موظف',
        userAvatar: matchedUser ? matchedUser.avatar : log.user.charAt(0),
        isOnline: matchedUser ? checkUserOnline(matchedUser) : false,
        isLogin,
        isLogout,
        isSwitch,
        durationText,
      };
    });
  }, [sessionLogs, users, onlineUsers]);

  // Filtered sessions based on active filters
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
        const matchesUser = session.userName.toLowerCase().includes(q);
        if (!matchesDetail && !matchesTime && !matchesAction && !matchesUser) return false;
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

  // General KPIs
  const totalLogins = processedSessions.filter((s) => s.isLogin).length;
  const totalLogouts = processedSessions.filter((s) => s.isLogout).length;
  const activeOnlineCount = users.filter(checkUserOnline).length;
  const latestLoginSession = processedSessions.find((s) => s.isLogin);

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredSessions.map((s) => ({
      'اسم الموظف': s.userName,
      'اسم المستخدم': s.userUsername ? `@${s.userUsername}` : '',
      'القسم': s.userDept,
      'الدور': s.userRole,
      'نوع الحركة': s.action,
      'التاريخ والوقت': s.rawTime,
      'تفاصيل الجلسة والعملية': s.details,
      'مدة الجلسة التقديرية': s.durationText,
      'حالة الاتصال المباشر': s.isOnline ? 'متصل الآن' : 'غير متصل',
    }));

    const filename = selectedUser
      ? `Employee_Login_History_${selectedUser.username}_${new Date().toISOString().slice(0, 10)}.csv`
      : `Team_All_Login_History_${new Date().toISOString().slice(0, 10)}.csv`;

    exportCustomObjectsToCSV(exportData, filename);
  };

  return (
    <div className="space-y-6 font-['Cairo',sans-serif]">
      {/* Top Main Banner & Header */}
      <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>سجل دخول وحضور الموظفين (سجل الرقابة الإدارية)</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  مراقبة حية ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                استعراض سجلات وأوقات تسجيل الدخول والخروج لكل موظف على حدة، احتساب مدد الجلسات، ورصد حضور فريق العمل لتعزيز الانضباط والرقابة الإدارية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              title="تصدير السجل إلى Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير تقرير الحضور (CSV)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
              الموظفون المتصلون حالياً
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {activeOnlineCount}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                من {users.length} موظف
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
              إجمالي عمليات الدخول
            </span>
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {totalLogins}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">جلسة مسجلة</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
              عمليات الخروج والإنهاء
            </span>
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {totalLogouts}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">إغلاق جلسة</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
              آخر حركة تسجيل دخول
            </span>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate font-mono">
              {latestLoginSession ? (
                <span>{latestLoginSession.userName} • {latestLoginSession.rawTime.slice(11, 16)}</span>
              ) : (
                'لا توجد حركات حديثة'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selector Bar */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>اختر الموظف لاستعراض سجله بشكل فردي:</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {selectedUser ? `يتم الآن عرض سجل: ${selectedUser.name}` : 'عرض سجلات كافة الموظفين'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {/* Option All */}
          <button
            type="button"
            onClick={() => setSelectedUserId('ALL')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              selectedUserId === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>كافة أعضاء الفريق ({users.length})</span>
          </button>

          {/* Individual User Buttons */}
          {users.map((u) => {
            const isOnline = checkUserOnline(u);
            const isSelected = selectedUserId === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <span className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center ${
                  isSelected ? 'bg-white text-emerald-800' : 'bg-indigo-600 text-white'
                }`}>
                  {u.avatar || u.name.charAt(0)}
                </span>
                <span>{u.name}</span>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} title={isOnline ? 'متصل الآن' : 'غير متصل'}></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Employee Focused Card (if an individual user is selected) */}
      {selectedUser && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-900/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-4 ring-white/10">
              {selectedUser.avatar || selectedUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black">{selectedUser.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-indigo-200 border border-white/10">
                  @{selectedUser.username}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                  checkUserOnline(selectedUser)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${checkUserOnline(selectedUser) ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                  <span>{checkUserOnline(selectedUser) ? 'متصل الآن 🟢' : 'غير متصل ⚪'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                القسم: <strong className="text-white">{selectedUser.department}</strong> • الدور:{' '}
                <strong className="text-indigo-300">{selectedUser.role}</strong> • البريد: {selectedUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedUserId('ALL')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء التحديد وعرض الجميع</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Action Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFilterAction('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterAction === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            كافة الحركات ({sessionLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterAction('login')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterAction === 'login'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل دخول فقط</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterAction('logout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterAction === 'logout'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل خروج فقط</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterAction('switch')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterAction === 'switch'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-cyan-500'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تبديل جلسة</span>
          </button>
        </div>

        {/* Date Range & Search Input */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md justify-end">
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">كل الأوقات</option>
            <option value="today">اليوم فقط</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">الشهر الحالي</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالموظف، التاريخ أو العملية..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Sessions Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            <tr>
              <th className="p-3.5">الموظف / صاحب الحساب</th>
              <th className="p-3.5">القسم والدور</th>
              <th className="p-3.5">نوع الحركة</th>
              <th className="p-3.5">التاريخ والتوقيت</th>
              <th className="p-3.5">مدة الجلسة التقديرية</th>
              <th className="p-3.5">تفاصيل العملية</th>
              <th className="p-3.5 text-center">حالة الحضور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                        {session.userAvatar}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {session.userName}
                        </span>
                        {session.userUsername && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            @{session.userUsername}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="block font-semibold">{session.userDept}</span>
                      <span className="text-[10px] text-indigo-500 font-bold">{session.userRole}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    {session.isLogin && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit">
                        <LogIn className="w-3 h-3 text-emerald-500" />
                        <span>تسجيل دخول 🟢</span>
                      </span>
                    )}
                    {session.isLogout && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 w-fit">
                        <LogOut className="w-3 h-3 text-rose-500" />
                        <span>تسجيل خروج 🔴</span>
                      </span>
                    )}
                    {session.isSwitch && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 flex items-center gap-1 w-fit">
                        <RotateCcw className="w-3 h-3 text-cyan-500" />
                        <span>تبديل جلسة 🔄</span>
                      </span>
                    )}
                    {!session.isLogin && !session.isLogout && !session.isSwitch && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1 w-fit">
                        <KeyRound className="w-3 h-3 text-amber-500" />
                        <span>{session.action}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{session.rawTime}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                      {session.durationText}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={session.details}>
                    {session.details}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      session.isOnline
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${session.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      <span>{session.isOnline ? 'متصل الآن' : 'غير متصل'}</span>
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                    لا توجد سجلات دخول أو خروج مطابقة للخيارات المحددة
                  </p>
                  <p className="text-xs text-slate-400">
                    حاول تغيير فلتر البحث أو اختيار "كافة أعضاء الفريق"
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId('ALL');
                      setFilterAction('all');
                      setSearchQuery('');
                      setDateRangeFilter('all');
                    }}
                    className="mt-3 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition hover:bg-indigo-100 cursor-pointer"
                  >
                    إعادة ضبط الفلاتر 🔄
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
