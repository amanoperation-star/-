import React, { useState } from 'react';
import { X, CheckCircle2, Zap } from 'lucide-react';
import { Issue } from '../types';

interface ResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  cannedResponses: string[];
  onConfirmResolve: (issueId: string, reason: string) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  isOpen,
  onClose,
  issue,
  cannedResponses,
  onConfirmResolve,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !issue) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('يرجى تحديد وكتابة سبب الحل والإجراء المتخذ لإغلاق التذكرة!');
      return;
    }
    onConfirmResolve(issue.id, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto">
        <div className="p-5 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                تأكيد حل وإغلاق التذكرة {issue.id}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{issue.client}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>اختر رداً سريعاً كسبب للحل أو اكتب السبب يدوياً:</span>
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) setReason(e.target.value);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
            >
              <option value="">⚡ اختر رداً جاهزاً ومعتمداً...</option>
              {cannedResponses.map((res, i) => (
                <option key={i} value={res}>
                  {res}
                </option>
              ))}
            </select>

            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب الإجراء الهندسي والتقني المعتمد الذي تم به حل البلاغ..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            ></textarea>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
            ✓ سيتم تحويل حالة التذكرة إلى <strong>تم الحل (Resolved 🟢)</strong> وإيقاف عداد الوقت وتوثيق الإجراء في السجل الزمني.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/30"
            >
              تأكيد الحل والإغلاق
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
