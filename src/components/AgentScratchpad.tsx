import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit3, ClipboardList, Sparkles, CheckSquare, Square } from 'lucide-react';
import { AppUser } from '../types';

interface AgentScratchpadProps {
  currentUser: AppUser;
  appSkin?: 'standard' | 'amethyst' | 'cyberpunk' | 'ocean';
}

interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const AgentScratchpad: React.FC<AgentScratchpadProps> = ({
  currentUser,
  appSkin = 'standard',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [todos, setTodos] = useState<ToDoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const STORAGE_NOTES_KEY = `AGENT_NOTES_${currentUser.id}`;
  const STORAGE_TODOS_KEY = `AGENT_TODOS_${currentUser.id}`;

  // Load notes and todos from localStorage when current user changes
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_NOTES_KEY);
      setNotes(savedNotes || '');

      const savedTodos = localStorage.getItem(STORAGE_TODOS_KEY);
      setTodos(savedTodos ? JSON.parse(savedTodos) : []);
    } catch (e) {
      console.error('Failed to load scratchpad data', e);
    }
  }, [currentUser.id]);

  // Save notes to localStorage with simple debounce/saving status
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, val);
      setTimeout(() => setSaveStatus('saved'), 500);
    } catch {}
  };

  // Add new todo
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newItem: ToDoItem = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
    };
    const updated = [newItem, ...todos];
    setTodos(updated);
    setNewTodoText('');
    try {
      localStorage.setItem(STORAGE_TODOS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Toggle todo completion
  const handleToggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    try {
      localStorage.setItem(STORAGE_TODOS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Delete todo
  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    try {
      localStorage.setItem(STORAGE_TODOS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Calculate completion percentage
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Define skin-specific styles
  const getSkinStyles = () => {
    switch (appSkin) {
      case 'amethyst':
        return {
          btnBg: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30 text-white',
          badgeBg: 'bg-purple-500',
          glowBorder: 'border-purple-400 dark:border-purple-900/50',
          glowText: 'text-purple-600 dark:text-purple-400',
          accentBg: 'bg-purple-600 hover:bg-purple-500',
          progressBar: 'bg-purple-600',
          headerBg: 'bg-purple-600/10 text-purple-900 dark:text-purple-300 border-purple-200/40',
        };
      case 'cyberpunk':
        return {
          btnBg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 text-white',
          badgeBg: 'bg-rose-500',
          glowBorder: 'border-rose-400 dark:border-rose-950/45',
          glowText: 'text-rose-600 dark:text-rose-400',
          accentBg: 'bg-rose-600 hover:bg-rose-500',
          progressBar: 'bg-rose-600',
          headerBg: 'bg-rose-600/10 text-rose-900 dark:text-rose-300 border-rose-200/40',
        };
      case 'ocean':
        return {
          btnBg: 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30 text-white',
          badgeBg: 'bg-sky-500',
          glowBorder: 'border-sky-400 dark:border-sky-950/30',
          glowText: 'text-sky-600 dark:text-sky-400',
          accentBg: 'bg-sky-500 hover:bg-sky-400',
          progressBar: 'bg-sky-500',
          headerBg: 'bg-sky-500/10 text-sky-900 dark:text-sky-300 border-sky-200/40',
        };
      case 'standard':
      default:
        return {
          btnBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 text-white',
          badgeBg: 'bg-indigo-500',
          glowBorder: 'border-slate-200 dark:border-slate-800',
          glowText: 'text-indigo-600 dark:text-indigo-400',
          accentBg: 'bg-indigo-600 hover:bg-indigo-500',
          progressBar: 'bg-indigo-600',
          headerBg: 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border-indigo-200/50',
        };
    }
  };

  const style = getSkinStyles();

  return (
    <>
      {/* Minimized Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-6 z-40 p-3.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer ${style.btnBg}`}
        title="حافظة الملاحظات والمهام السريعة للموظف 📝"
      >
        <FileText className="w-5 h-5 animate-pulse" />
        {totalCount > 0 && completedCount < totalCount && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
            {totalCount - completedCount}
          </span>
        )}
      </button>

      {/* Floating Sticky Drawer */}
      {isOpen && (
        <div className={`fixed bottom-40 right-6 z-50 w-80 sm:w-96 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border ${style.glowBorder} shadow-2xl p-4 sm:p-5 flex flex-col space-y-4 animate-scaleUp text-right`} dir="rtl">
          {/* Header */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${style.headerBg}`}>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <div>
                <h4 className="font-black text-xs">
                  📝 الحافظة الذكية والمهام الشخصية
                </h4>
                <p className="text-[9px] opacity-75">مخصصة لك وحفظها تلقائي في جهازك</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Interactive Notepad Area */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Edit3 className="w-3 h-3 text-slate-400" />
                <span>المسودة السريعة (ملاحظات العمل):</span>
              </span>
              <span className={`transition-all duration-300 ${saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                {saveStatus === 'saving' ? 'جاري الحفظ...' : '✓ تم الحفظ'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="اكتب ملاحظاتك السريعة، أرقام تذاكر للمتابعة، أو أي تفاصيل عمل مؤقتة هنا..."
              className="w-full h-24 p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Checklist Area */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                <span>قائمة المهام السريعة (To-Do Checklist):</span>
              </span>
              {totalCount > 0 && (
                <span className="text-[9px] font-black text-slate-400">
                  {completedCount} من {totalCount} مكتمل
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
              <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${style.progressBar}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Add Todo Form */}
            <form onSubmit={handleAddTodo} className="flex gap-1.5">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="إضافة مهمة جديدة..."
                className="flex-1 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer text-white ${style.accentBg}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Todo List Items */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 animate-fadeIn">
              {todos.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/30 dark:bg-slate-950/10 rounded-xl">
                  لا توجد مهام حالية. أضف مهمتك الأولى بالأعلى! 🎯
                </p>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    onClick={() => handleToggleTodo(todo.id)}
                    className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-900/60 rounded-xl cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900/50 transition group"
                  >
                    <div className="flex items-center gap-2 max-w-[80%]">
                      {todo.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-slate-600" />
                      )}
                      <span className={`text-[11px] font-semibold truncate ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {todo.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTodo(todo.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
