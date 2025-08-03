// supabase/functions/_shared/cors.ts
// 共通のCORSヘッダーを定義します
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // すべてのオリジンからのアクセスを許可
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // 許可するヘッダー
};