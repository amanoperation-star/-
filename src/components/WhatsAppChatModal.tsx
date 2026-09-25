import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Phone, 
  Check, 
  Copy, 
  Sparkles, 
  ExternalLink,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { Issue, AppUser } from '../types';
import { 
  cleanPhoneForWhatsApp, 
  WHATSAPP_TEMPLATES, 
  getWhatsAppUrl 
} from '../utils/whatsapp';

interface WhatsAppChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  currentUser: AppUser;
  companyName?: string;
  onUpdatePhone?: (issueId: string, newPhone: string) => void;
}

export const WhatsAppChatModal: React.FC<WhatsAppChatModalProps> = ({
  isOpen,
  onClose,
  issue,
  currentUser,
  companyName = 'منظومة الدعم الفني',
  onUpdatePhone,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('followup');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [phoneSavedNotice, setPhoneSavedNotice] = useState(false);

  // Sync state when issue changes or modal opens
  useEffect(() => {
    if (issue) {
      setPhoneInput(issue.clientPhone || '');
      const defaultTemplate = WHATSAPP_TEMPLATES.find((t) => t.id === 'followup');
      if (defaultTemplate) {
        setCustomMessage(defaultTemplate.generateText(issue, currentUser.name, companyName));
      }
    }
  }, [issue, currentUser.name, companyName, isOpen]);

  // Update text when template changes
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!issue) return;
    const template = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setCustomMessage(template.generateText(issue, currentUser.name, companyName));
    }
  };

  const cleanPhone = useMemo(() => cleanPhoneForWhatsApp(phoneInput), [phoneInput]);
  const waUrl = useMemo(() => getWhatsAppUrl(phoneInput, customMessage), [phoneInput, customMessage]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSavePhone = () => {
    if (issue && onUpdatePhone && phoneInput.trim()) {
      onUpdatePhone(issue.id, phoneInput.trim());
      setPhoneSavedNotice(true);
      setTimeout(() => setPhoneSavedNotice(false), 2000);
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <MessageSquare className="w-5 h-5 fill-white/20 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black leading-tight">مراسلة العميل عبر واتساب (WhatsApp)</h3>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  1-Click Direct Chat
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                تواصل مباشر وفوري مع العميل: <span className="font-bold underline">{issue.client}</span> ({issue.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Phone Number Input & Validation */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>رقم هاتف العميل (مع كود الدولة):</span>
              </label>
              {cleanPhone ? (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  جاهز للواتساب: +{cleanPhone}
                </span>
              ) : (
                <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>مطلوب إدخال رقم الهاتف</span>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="مثال: +966 50 123 4567 أو 0501234567"
                dir="ltr"
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {phoneInput !== (issue.clientPhone || '') && (
                <button
                  type="button"
                  onClick={handleSavePhone}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shrink-0 flex items-center gap-1 shadow-xs"
                  title="حفظ هذا الرقم في بيانات التذكرة للمستقبل"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{phoneSavedNotice ? 'تم الحفظ ✅' : 'حفظ بالتذكرة'}</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              * يدعم النظام أرقام السعودية والخليج ومصر والدولية تلقائياً ويقوم بتنسيقها لفتح تطبيق واتساب مباشرة.
            </p>
          </div>

          {/* Preset Templates Tabs */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>اختر قالب الرسالة السريعة:</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {WHATSAPP_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                  }`}
                >
                  <span className="font-bold text-xs">{tmpl.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                    {tmpl.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Live Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                محتوى الرسالة (يمكنك تعديلها بحرية قبل الإرسال):
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition"
          >
            إلغاء
          </button>

          {cleanPhone ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Auto close after triggering chat
                setTimeout(onClose, 500);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال وفتح المحادثة في واتساب 💬</span>
              <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>
          ) : (
            <button
              disabled
              className="px-6 py-2.5 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs cursor-not-allowed flex items-center gap-2"
            >
              <span>يرجى كتابة رقم الهاتف أولاً</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
