// app/dashboard/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
// ★ 必要なクラス定数をインポートします
import {
  PAGE_CENTER_CONTAINER_CLASSES,
  CARD_CONTAINER_CLASSES,
  PAGE_TITLE_CLASSES,
  BUTTON_DANGER_CLASSES,
  LOADING_SPINNER_TEXT_CONTAINER_CLASSES,
  LOADING_SPINNER_CLASSES
} from '@/constants/tailwindClasses';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace('/auth');
        return;
      }
      setUserEmail(user.email || null); // nullを渡すように修正した部分
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace('/auth');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウト中にエラーが発生しました: ' + error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      // ★ PAGE_CENTER_CONTAINER_CLASSES を適用
      <div className={PAGE_CENTER_CONTAINER_CLASSES}>
        {/* LOADING_SPINNER_TEXT_CONTAINER_CLASSES でスピナーとテキストを横並び中央配置 */}
        <div className={LOADING_SPINNER_TEXT_CONTAINER_CLASSES}>
          {/* LOADING_SPINNER_CLASSES でスピナーの見た目とアニメーション */}
          <div className={LOADING_SPINNER_CLASSES}></div>
          <p className="ml-4">ロード中...</p> {/* スピナーとテキストの間に少しマージン */}
        </div>
      </div>
    );
  }

  return (
    // ★ PAGE_CENTER_CONTAINER_CLASSES を適用（flex-colを除く）
    <div className={`flex-col ${PAGE_CENTER_CONTAINER_CLASSES}`}>
      {/* ★ CARD_CONTAINER_CLASSES を適用。max-w-md w-full は個別に残します。 */}
      <div className={`max-w-md w-full ${CARD_CONTAINER_CLASSES}`}>
        {/* ★ PAGE_TITLE_CLASSES を適用 */}
        <h1 className={PAGE_TITLE_CLASSES}>ダッシュボード</h1>
        {userEmail ? (
          <p className="text-xl text-gray-700 mb-6">ようこそ、<span className="font-semibold text-blue-600">{userEmail}</span> さん！</p>
        ) : (
          <p className="text-xl text-gray-700 mb-6">ユーザー情報を取得できませんでした。</p>
        )}

        <p className="text-gray-600 mb-8">ここはログイン後にアクセスできるページです。</p>

        {/* ★ BUTTON_DANGER_CLASSES を適用 */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className={BUTTON_DANGER_CLASSES}
        >
          {loading ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;