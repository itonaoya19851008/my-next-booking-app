// app/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
// ★ 必要なクラス定数をインポートします
import {
  LOADING_SPINNER_CLASSES,
  LOADING_SPINNER_TEXT_CONTAINER_CLASSES,
  PAGE_CENTER_CONTAINER_CLASSES,
  PAGE_TITLE_CLASSES,
} from "@/constants/tailwindClasses";

// ホームページコンポーネントを定義します
export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/auth");
      }
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace("/dashboard");
        } else {
          router.replace("/auth");
        }
      }
    );

    checkUserSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      // ★ PAGE_CENTER_CONTAINER_CLASSES を適用
      <div className={PAGE_CENTER_CONTAINER_CLASSES}>
        <div className={LOADING_SPINNER_TEXT_CONTAINER_CLASSES}>
          {/* LOADING_SPINNER_CLASSES でスピナーの見た目とアニメーション */}
          <div className={LOADING_SPINNER_CLASSES}></div>
          <p className="ml-4">ロード中...</p>{" "}
          {/* スピナーとテキストの間に少しマージン */}
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CENTER_CONTAINER_CLASSES}>
      <p className="text-xl font-semibold text-gray-700">リダイレクト中...</p>
    </div>
  );
}
