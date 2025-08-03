// supabase/functions/send-booking-confirmation-email/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// SendGrid APIキーを環境変数から取得
// @ts-ignore
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const SENDER_EMAIL = "itonaoya1985@gmail.com";

const ADMIN_EMAIL = "itonaoya1985@gmail.com";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API Key is not set in environment variables.");
    }
    if (!SENDER_EMAIL || !ADMIN_EMAIL) {
      throw new Error("Sender or Admin email addresses are not configured.");
    }

    const {
      patientEmail,
      patientName,
      patientPhone, // 電話番号も取得
      appointmentDate, // フォーマット済み文字列
      appointmentTime, // フォーマット済み文字列
      isFirstVisit, // boolean
      doctorName, // 医師名
    } = await req.json();

    // 必須フィールドの簡易チェック
    if (
      !patientEmail ||
      !patientName ||
      !appointmentDate ||
      !appointmentTime ||
      isFirstVisit === undefined ||
      !doctorName
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields in request payload" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const patientBody = `
      <p><strong>${patientName}様</strong></p>
      <p>この度は、${doctorName}病院の予約が完了いたしました。</p>
      <p>以下の内容で予約を承りました。</p>
      <ul>
        <li><strong>予約日時:</strong> ${appointmentDate} ${appointmentTime}</li>
        <li><strong>担当医師:</strong> ${doctorName}</li>
        <li><strong>種別:</strong> ${isFirstVisit ? '初診' : '再診' }</li>
        <li><strong>電話番号:</strong> ${patientPhone }</li>
      </ul>
      <p>ご来院をお待ちしております。</p>
      <p>---</p>
      <p>病院予約システム</p>
    `;

    const adminBody = `
          <p><strong>新規予約が入りました。</strong></p>
      <p>以下の内容で予約が作成されました。</p>
      <ul>
        <li><strong>患者氏名:</strong> ${patientName}</li>
        <li><strong>患者メール:</strong> ${patientEmail}</li>
        <li><strong>予約日時:</strong> ${appointmentDate} ${appointmentTime}</li>
        <li><strong>担当医師:</strong> ${doctorName}</li>
        <li><strong>種別:</strong> ${isFirstVisit ? '初診' : '再診' }</li>
        <li><strong>電話番号:</strong> ${patientPhone }</li>
      </ul>
      <p>管理画面で詳細をご確認ください。</p>
      <p>http://localhost:3000/admin/bookings</p>
      <p>病院予約システム</p>
   
    `;

    const patientEmailResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: patientEmail }],
              subject: `【病院予約システム】予約完了のお知らせ - ${appointmentDate}${appointmentTime}`,
            },
          ],
          from: { email: SENDER_EMAIL, name: "病院予約システム" },
          content: [{ type: "text/html", value: patientBody }],
        }),
      }
    );

    if (!patientEmailResponse.ok) {
      const errorText = await patientEmailResponse.text();
      throw new Error(
        `Failed to send patient email: ${patientEmailResponse.status} - ${errorText}`
      );
    }
    console.log("Patient email sent successfully.");

    // 管理者へのメール送信
    const adminEmailResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: ADMIN_EMAIL }],
              subject: `【管理者通知】新規予約が入りました: ${patientName}様`,
            },
          ],
          from: { email: SENDER_EMAIL, name: "病院予約システム" },
          content: [{ type: "text/html", value: adminBody }],
        }),
      }
    );

    if (!adminEmailResponse.ok) {
      const errorText = await adminEmailResponse.text();
      throw new Error(
        `Failed to send admin email: ${adminEmailResponse.status} - ${errorText}`
      );
    }
    console.log("Admin email sent successfully.");

    return new Response(
      JSON.stringify({ message: "Emails sent successfully!" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
