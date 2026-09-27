import React, { useState } from 'react';
import { 
  Paperclip, 
  Search, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Calendar, 
  User, 
  Tag, 
  Filter,
  Eye,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { Issue } from '../types';
import { formatArabicDate } from '../utils/sla';

interface AttachmentCenterTabProps {
  issues: Issue[];
  onSelectTicket?: (ticketId: string) => void;
}

interface CollectedAttachment {
  id: string;
  ticketId: string;
  client: string;
  name: string;
  url: string;
  size?: string;
  sourceType: 'main' | 'comment';
  sourceId: string;
  time: string;
}

export const AttachmentCenterTab: React.FC<AttachmentCenterTabProps> = ({
  issues,
  onSelectTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'doc'>('all');
  const [previewFile, setPreviewFile] = useState<CollectedAttachment | null>(null);

  // Collect all attachments from issues and comments
  const allAttachments: CollectedAttachment[] = [];

  issues.forEach((issue) => {
    // 1. Main issue attachment
    if (issue.attachment && issue.attachment.url) {
      allAttachments.push({
        id: `${issue.id}-main`,
        ticketId: issue.id,
        client: issue.client,
        name: issue.attachment.name || 'مرفق تذكرة',
        url: issue.attachment.url,
        size: issue.attachment.size,
        sourceType: 'main',
        sourceId: issue.id,
        time: issue.createdAt,
      });
    }

    // 2. Comment attachments
    if (issue.comments && issue.comments.length > 0) {
      issue.comments.forEach((comm) => {
        if (comm.attachment && comm.attachment.url) {
          allAttachments.push({
            id: `${issue.id}-comm-${comm.id}`,
            ticketId: issue.id,
            client: issue.client,
            name: comm.attachment.name || 'مرفق تعليق',
            url: comm.attachment.url,
            size: comm.attachment.size,
            sourceType: 'comment',
            sourceId: comm.id,
            time: comm.time,
          });
        }
      });
    }
  });

  const filteredAttachments = allAttachments.filter((att) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = att.name.toLowerCase().includes(term);
      const matchTicket = att.ticketId.toLowerCase().includes(term);
      const matchClient = att.client.toLowerCase().includes(term);
      if (!matchName && !matchTicket && !matchClient) return false;
    }

    if (fileTypeFilter === 'image') {
      const isImg = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.name) || att.url.startsWith('data:image/');
      if (!isImg) return false;
    } else if (fileTypeFilter === 'doc') {
      const isImg = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.name) || att.url.startsWith('data:image/');
      if (isImg) return false;
    }

    return true;
  });

  const isImageFile = (url: string, name: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name) || url.startsWith('data:image/');
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
            <Paperclip className="w-3.5 h-3.5" />
            <span>مركز الملفات والمرفقات المركزية (Attachment Center)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">إدارة واستعراض كافة الملفات والمرفقات عبر المنظومة</h2>
          <p className="text-xs sm:text-sm text-indigo-200/80">
            إجمالي الملفات والمرفقات المرفوعة: <span className="font-bold text-white">{allAttachments.length} ملف</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-xs text-indigo-200 block">الملفات المعروضة</span>
            <span className="font-mono font-bold text-lg text-white">{filteredAttachments.length}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الملف، رقم التذكرة (مثل INC-1001)، أو اسم العميل..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pr-11 pl-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {[
              { id: 'all', label: 'كل الملفات' },
              { id: 'image', label: 'الصور فقط 🖼️' },
              { id: 'doc', label: 'المستندات والملفات 📄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFileTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  fileTypeFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attachments Grid */}
      {filteredAttachments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">لا توجد مرفقات مطابقة للبحث</p>
          <p className="text-xs text-slate-500">جرب البحث بكلمة مختلفة أو تغيير فئة الفلترة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAttachments.map((att) => {
            const isImg = isImageFile(att.url, att.name);
            return (
              <div
                key={att.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:border-indigo-400 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                      {att.ticketId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      {att.sourceType === 'main' ? 'مرفق تذكرة' : 'مرفق تعليق'}
                    </span>
                  </div>

                  {/* Thumbnail / Icon preview */}
                  <div 
                    onClick={() => setPreviewFile(att)}
                    className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                  >
                    {isImg ? (
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <FileText className="w-10 h-10 text-indigo-500" />
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-150 transition flex items-center justify-center text-white gap-1 text-xs font-bold">
                      <Eye className="w-4 h-4" />
                      <span>معاينة</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1" title={att.name}>
                      {att.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>العميل: {att.client}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {formatArabicDate(att.time)}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {onSelectTicket && (
                      <button
                        type="button"
                        onClick={() => onSelectTicket(att.ticketId)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="انتقل للتذكرة"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <a
                      href={att.url}
                      download={att.name}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 transition cursor-pointer"
                      title="تحميل الملف"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                  {previewFile.ticketId}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{previewFile.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto flex items-center justify-center bg-slate-950/20 rounded-2xl p-4">
              {isImageFile(previewFile.url, previewFile.name) ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-h-[50vh] object-contain rounded-xl shadow-lg" />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FileText className="w-16 h-16 text-indigo-500 mx-auto" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{previewFile.name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">العميل: {previewFile.client}</span>
              <div className="flex gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
