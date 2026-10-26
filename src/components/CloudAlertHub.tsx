import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  Radio, 
  Wifi, 
  Zap, 
  Send, 
  RefreshCw, 
  Volume2, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Activity, 
  Clock, 
  ArrowLeft,
  X,
  Sparkles,
  ShieldCheck,
  Server
} from 'lucide-react';
import { SyncConnectionStatus, ActiveUserPresence } from '../utils/realtimeSync';
import { playNotificationChime } from '../utils/audioChime';

export interface LiveEventPacket {
  id: string;
  type: string;
  title: string;
  desc: string;
  actor: string;
  timestamp: number;
}

interface CloudAlertHubProps {
  status: SyncConnectionStatus;
  latencyMs: number;
  totalConnections: number;
  onlineUsers?: ActiveUserPresence[];
  recentPackets: LiveEventPacket[];
  hasRecentArrival: boolean;
  onSendTeamAlert: (alert: { title: string; desc: string; type?: 'info' | 'warning' | 'danger' | 'success'; ticketId?: string }) => void;
  onForceResync: () => void;
  onSelectTicket?: (ticketId: string) => void;
  volume?: number;
  customChimeUrl?: string;
  isMuted?: boolean;
}

export const CloudAlertHub: React.FC<CloudAlertHubProps> = ({
  status,
  latencyMs,
  totalConnections,
  onlineUsers = [],
  recentPackets,
  hasRecentArrival,
  onSendTeamAlert,
  onForceResync,
  onSelectTicket,
  volume = 0.8,
  customChimeUrl,
  isMuted = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'emergency' | 'maintenance' | 'broadcast' | 'custom'>('emergency');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [soundTestSuccess, setSoundTestSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const PRESETS = [
    {
      id: 'emergency',
      label: '🚨 بلاغ طوارئ فوري',
      title: 'بلاغ طوارئ جديد وارد الآن 🚨',
      desc: 'تم تسجيل بلاغ عالي الأهمية يتطلب التدخل الفوري من المهندس المناوب.',
      type: 'danger' as const,
    },
    {
      id: 'maintenance',
      label: '⚡ تنبيه صيانة سحابي',
      title: 'بدء نافذة صيانة ومزامنة سحابية ⚡',
      desc: 'جاري تحديث السيرفرات وإعادة مزامنة سجلات التذاكر عبر السحابة.',
      type: 'warning' as const,
    },
    {
      id: 'broadcast',
      label: '📢 تعميم إداري للتيم',
      title: 'إشعار فوري لجميع أعضاء الفريق 📢',
      desc: 'يرجى مراجعة التذاكر العالقة وتحديث حالات العمل وفق اتفاقية الـ SLA.',
      type: 'info' as const,
    },
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset.id as any);
    setCustomTitle(preset.title);
    setCustomDesc(preset.desc);
  };

  const handleSendAlert = () => {
    const title = customTitle.trim() || 'تنبيه سحابي فوري ⚡';
    const desc = customDesc.trim() || 'إشعار فوري موجه لجميع أعضاء الفريق المتصلين الآن.';
    
    setIsSending(true);
    onSendTeamAlert({
      title,
      desc,
      type: selectedPreset === 'emergency' ? 'danger' : selectedPreset === 'maintenance' ? 'warning' : 'info',
    });

    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    }, 200);
  };

  const handleTriggerResync = () => {
    setIsResyncing(true);
    onForceResync();
    setTimeout(() => {
      setIsResyncing(false);
    }, 800);
  };

  const handleTestChime = () => {
    playNotificationChime(volume, customChimeUrl);
    setSoundTestSuccess(true);
    setTimeout(() => setSoundTestSuccess(false), 2000);
  };

  const isConnected = status === 'connected';

  return (
    <div className="relative" ref={containerRef}>
      {/* TRIGGER BUTTON IN HEADER */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
          hasRecentArrival
            ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.5)] animate-pulse'
            : isConnected
            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 shadow-xs'
            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}
        title="أيقونة التنبيه السحابي الفوري ومراقبة البث المباشر (انقر لفتح المركز)"
      >
        {/* Animated Radar Pulse Effect */}
        <span className="relative flex h-2.5 w-2.5">
          {isConnected && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasRecentArrival ? 'bg-cyan-400' : 'bg-emerald-400'}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasRecentArrival ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
        </span>

        {/* Cloud Lightning Icon */}
        <div className="flex items-center gap-1">
          <i className={`fa-solid fa-cloud-bolt text-xs transition-transform duration-300 ${hasRecentArrival ? 'scale-125 text-cyan-300' : isConnected ? 'text-emerald-400' : 'text-rose-400'}`}></i>
          <span className="text-[11px] font-black tracking-wide hidden lg:inline">
            تنبيه سحابي فوري
          </span>
        </div>

        {/* Live Latency Badge */}
        <div className="flex items-center gap-1 bg-slate-950/60 px-1.5 py-0.5 rounded-md border border-slate-800 text-[10px] font-mono font-bold">
          <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
            {isConnected ? `${latencyMs}ms` : 'منقطع'}
          </span>
          <i className="fa-solid fa-bolt text-[9px] text-amber-400"></i>
        </div>

        {/* Temporary arrival flash badge */}
        {hasRecentArrival && (
          <span className="absolute -top-2 -right-1 bg-cyan-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
            وارد ⚡
          </span>
        )}
      </button>

      {/* POPOVER / DROPDOWN CENTER */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-84 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900/98 border border-slate-800 rounded-2xl shadow-2xl p-3.5 z-50 text-xs space-y-3 backdrop-blur-2xl animate-scaleUp">
          {/* Top Bar */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
                <i className="fa-solid fa-cloud-bolt text-xs text-white"></i>
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>الرادار السحابي المباشر 🌐</span>
                </h4>
                <p className="text-[10px] text-slate-400">بث لحظي وتنبيهات فورية لجميع الأجهزة</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>

          {/* Real-Time Connectivity Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-signal text-xs"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400">حالة السحابة</div>
                <div className="font-bold text-xs text-emerald-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isConnected ? 'متصل ومزامَن' : 'غير متصل'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bolt text-xs"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400">سرعة الاستجابة</div>
                <div className="font-mono font-extrabold text-xs text-cyan-300">
                  {latencyMs} ms <span className="text-[9px] text-slate-400 font-sans">(ممتاز)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-network-wired text-xs"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400">الأجهزة المتصلة</div>
                <div className="font-extrabold text-xs text-indigo-300">
                  {totalConnections || 1} {totalConnections > 1 ? 'أجهزة نشطة' : 'جهاز نشط'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-shield-halved text-xs"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400">قنوات البث</div>
                <div className="font-bold text-[11px] text-amber-300 truncate">
                  WS + Cloud Hub
                </div>
              </div>
            </div>
          </div>

          {/* QUICK BROADCAST ACTION BOX */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                <i className="fa-solid fa-paper-plane text-cyan-400"></i>
                <span>بث تنبيه سحابي فوري تجريبي</span>
              </span>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                0ms مزامنة
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition text-center truncate cursor-pointer ${
                    selectedPreset === p.id
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="عنوان التنبيه السحابي..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="نص التنبيه والملاحظة لجميع الموظفين..."
                rows={2}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              disabled={isSending}
              onClick={handleSendAlert}
              className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98 ${
                sendSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/25'
              }`}
            >
              {sendSuccess ? (
                <>
                  <i className="fa-solid fa-check text-sm"></i>
                  <span>تم بث التنبيه السحابي لجميع الأجهزة والشاشات! 🚀</span>
                </>
              ) : isSending ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                  <span>جاري البث السحابي اللحظي...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt text-xs"></i>
                  <span>إرسال تنبيه سحابي فوري الآن لجميع المتصلين ⚡</span>
                </>
              )}
            </button>
          </div>

          {/* LIVE ACTIVITY STREAM */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-wave-square text-emerald-400"></i>
                <span>شريط حركة الأحداث السحابية الحية ({recentPackets.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">لحظي</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {recentPackets.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-[11px] bg-slate-950/40 rounded-xl border border-slate-800/60">
                  في انتظار وصول أحداث حية من الشبكة السحابية...
                </div>
              ) : (
                recentPackets.map((pkt) => {
                  const ticketMatch = pkt.title.match(/(INC-\d+)/i)?.[1] || pkt.desc.match(/(INC-\d+)/i)?.[1];
                  return (
                    <div
                      key={pkt.id}
                      onClick={() => {
                        if (ticketMatch && onSelectTicket) {
                          onSelectTicket(ticketMatch);
                          setIsOpen(false);
                        }
                      }}
                      className={`p-2 rounded-lg border bg-slate-950/80 border-slate-800/80 flex items-start justify-between gap-2 transition ${
                        ticketMatch ? 'cursor-pointer hover:border-cyan-500/60 hover:bg-slate-900' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-200 text-[11px] truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                          <span>{pkt.title}</span>
                        </div>
                        {pkt.desc && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {pkt.desc}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>بواسطة: {pkt.actor}</span>
                          {ticketMatch && (
                            <span className="text-cyan-400 font-bold underline">عرض {ticketMatch}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono shrink-0 bg-slate-900 px-1 py-0.5 rounded">
                        {new Date(pkt.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BOTTOM QUICK CONTROLS */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isResyncing}
              onClick={handleTriggerResync}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="إعادة جلب ومزامنة الحالة الكاملة من الخادم وقاعدة البيانات"
            >
              <i className={`fa-solid fa-rotate text-xs ${isResyncing ? 'fa-spin text-cyan-400' : ''}`}></i>
              <span>{isResyncing ? 'جاري المزامنة...' : 'مزامنة فورية الآن 🔄'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestChime}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="فحص صوت التنبيه Chime"
            >
              <i className={`fa-solid fa-volume-high text-xs ${soundTestSuccess ? 'text-emerald-400' : ''}`}></i>
              <span>{soundTestSuccess ? 'رن الصوت ✅' : 'فحص الصوت 🔊'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
