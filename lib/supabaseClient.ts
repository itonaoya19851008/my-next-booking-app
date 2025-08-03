import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が正しく設定されているかを確認します。
// もし設定されていなければ、エラーを投げてアプリケーションの起動を停止します。
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URLまたはAnon Keyの環境変数が設定されていません。');
}

// Supabaseクライアントを初期化し、エクスポートします。
// この `supabase` オブジェクトを使って、アプリケーションからSupabaseの機能にアクセスします。
export const supabase = createClient(supabaseUrl, supabaseAnonKey);