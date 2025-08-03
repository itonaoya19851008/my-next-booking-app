// supabase/functions/manage-user-by-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json(); // フロントエンドからメールアドレスを受け取る

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error("Invalid or missing 'email' in request body.");
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase URL or Service Role Key is not set in environment variables."
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);


    let userId: string;

    // ★★★ 修正箇所：ユーザー検索と作成のロジックを大幅に改善 ★★★

    // 1. 全てのユーザーを取得 (Admin APIのlistUsersを使用)
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      throw listUsersError;
    }

    // 2. 取得したユーザーリストから、フォームのメールアドレスと一致するユーザーを探す
    const existingUser = usersData.users.find(
        (user: any) => user.email === email // ★ ここでメールアドレスが一致するユーザーを探す
    );

    if (existingUser) {
        userId = existingUser.id; // 既存ユーザーのID
    } else {
        // ユーザーが存在しない場合、新規ユーザーとして登録
        const randomPassword = Math.random().toString(36).substring(2, 10);
        const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: randomPassword,
            email_confirm: true, // メール認証を必須にする
        });
        if (createUserError) {
          console.error("Error creating user in Edge Function:", createUserError);
          throw createUserError;
        }
        userId = newUserData.user!.id; // newUserData.user は null ではないと想定
    }

    // 取得または作成したユーザーのIDを返す
    return new Response(JSON.stringify({ userId: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in manage-user-by-email Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
