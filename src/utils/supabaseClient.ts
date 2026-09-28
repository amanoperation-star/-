import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'ENTERPRISE_ISSUE_TRACKER_PRO_V9';
export const DEFAULT_SUPABASE_PROJECT_URL = 'https://jdwgkaxhmuywetnpdhqt.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5WAZhnB_h-tAZrzT56rhgQ_WeANxqJD';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_PROJECT_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

try {
  const saved = localStorage.getItem(STORAGE_KEY + '_SUPABASE');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.url && parsed.url.includes('supabase.co') && parsed.key) {
      supabaseUrl = parsed.url;
      supabaseAnonKey = parsed.key;
    }
  }
} catch (e) {
  console.warn('[SupabaseClient] Error reading config from localStorage:', e);
}

export const supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());

export const testSupabaseConnection = async (
  url: string,
  key: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('issues').select('id').limit(1);
    
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' ||
        error.code === 'PGRST204' ||
        error.message?.toLowerCase().includes('does not exist') ||
        error.message?.includes('relation "issues" does not exist')
      ) {
        return {
          success: true,
          message: 'تم التحقق من الـ Publishable API Key وحفظه مركزياً بنجاح! 🟢 (ملاحظة: الجداول السحابية لم تُنشأ بعد، يرجى نسخ كود SQL الشامل من الزر بالأسفل وتشغيله في Supabase SQL Editor لحفظ التذاكر واليوزرات والإعدادات).',
        };
      }

      return {
        success: false,
        message: `فشل التحقق من المفتاح: ${error.message} (رمز الخطأ: ${error.code || 'عام'})`,
      };
    }

    return {
      success: true,
      message: 'الاتصال سليم 100%! تم التحقق من مشروع Supabase وحفظ بيانات الربط مركزياً لكافة المتصفحات والأجهزة 🟢',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `تعذر الاتصال بـ Supabase: ${err?.message || 'تأكد من صحة الرابط ومفتاح الـ API'}`
    };
  }
};
