import { Issue } from '../types';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  description: string;
  generateText: (issue: Issue, agentName: string, companyName: string) => string;
}

/**
 * Cleans and sanitizes phone numbers for WhatsApp API.
 * Handles GCC (Saudi, UAE, Kuwait, etc.), Egyptian, and international formats.
 */
export const cleanPhoneForWhatsApp = (rawPhone?: string): string => {
  if (!rawPhone) return '';
  
  // Remove all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');
  
  // Remove leading 00 (e.g. 00966 -> 966)
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }
  
  // Saudi local number starting with 05 (10 digits) -> 9665XXXXXXXX
  if (digits.startsWith('05') && digits.length === 10) {
    digits = '966' + digits.substring(1);
  }
  // Egyptian local number starting with 01 (11 digits) -> 201XXXXXXXXX
  else if (digits.startsWith('01') && digits.length === 11) {
    digits = '20' + digits.substring(1);
  }
  // Generic GCC number starting with single 0 (10 digits) -> assume Saudi default
  else if (digits.startsWith('0') && digits.length === 10) {
    digits = '966' + digits.substring(1);
  }

  return digits;
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'followup',
    title: 'متابعة البلاغ وتأكيد الاستلام 🚀',
    description: 'إشعار العميل ببدء العمل على التذكرة ومتابعة الإجراءات',
    generateText: (issue, agentName, companyName) =>
      `مرحباً بك أستاذ/ة ${issue.client || ''} 🌸\nمعك ${agentName || 'فريق الدعم'} من ${companyName || 'خدمة العملاء'}.\nبخصوص بلاغكم رقم #${issue.id} (${issue.type}):\nنود إفادتكم بأن البلاغ قيد المعالجة والمتابعة حالياً من قبل الفريق المختص، وسنوافيكم بكل جديد أولاً بأول.`,
  },
  {
    id: 'need_info',
    title: 'طلب بيانات أو توضيح إضافي ❓',
    description: 'طلب صور أو تفاصيل إضافية من العميل لحل المشكلة',
    generateText: (issue, agentName, companyName) =>
      `مرحباً بك أستاذ/ة ${issue.client || ''} 🌿\nمعك ${agentName || 'فريق الدعم'} من ${companyName || 'خدمة العملاء'} بخصوص البلاغ رقم #${issue.id}.\nنرجو من سيادتكم تزويدنا بتفاصيل أو صور إضافية للمشكلة لنتمكن من مساعدتكم وإنجاز الحل في أسرع وقت ممكن. شكراً لتعاونكم!`,
  },
  {
    id: 'resolved',
    title: 'إشعار بالحل واكتمال البلاغ ✅',
    description: 'إعلام العميل بإغلاق التذكرة والاطمئنان على رضاه',
    generateText: (issue, agentName, companyName) =>
      `مرحباً بك أستاذ/ة ${issue.client || ''} 🎉\nيسعدنا إبلاغكم بأنه تم حل وإنجاز البلاغ رقم #${issue.id} بنجاح.\nنتمنى أن نكون قد قدمنا لكم الخدمة بالشكل المطلوب، ويسعدنا دائماً استقبال ملاحظاتكم وتقييمكم. شكراً لثقتكم بنا!`,
  },
  {
    id: 'quick',
    title: 'محادثة سريعة مباشرة ⚡',
    description: 'رسالة ترحيبية موجزة مع رمز البلاغ',
    generateText: (issue, agentName, companyName) =>
      `السلام عليكم ورحمة الله، أستاذ/ة ${issue.client || ''}.\nمعك ${agentName || 'الدعم الفني'} (${companyName || ''}) بخصوص التذكرة رقم #${issue.id}. كيف يمكنني مساعدتك؟`,
  },
];

export const getWhatsAppUrl = (phone: string, text: string): string => {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanPhone) return '';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};
