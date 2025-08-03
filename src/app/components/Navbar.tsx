"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

import {
  BUTTON_DANGER_CLASSES,
  LOADING_SPINNER_CLASSES,
} from "@/constants/tailwindClasses";
import Link from "next/link";

const Navbar: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      setUser(sessionUser);
      if (sessionUser) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", sessionUser.id)
          .single();
        if (!error && profile) {
          setIsAdmin(profile.is_admin);
        } else {
          console.error("プロフィール取得エラー:", error?.message);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile, error }) => {
              if (!error && profile) setIsAdmin(profile.is_admin);
              else setIsAdmin(false);
            });
        } else {
          setIsAdmin(false);
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  const toggleHamburger = () => {
    setIsMenuOpen((prev) => !prev);
  };
  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("ログアウトエラー:", error);
      alert("ログアウト中にエラーが発生しました。");
    }
    setLoggingOut(false);
    router.replace("/auth");
    setIsMenuOpen(false);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-16 bg-gray-800 text-white">
        <div className={LOADING_SPINNER_CLASSES}></div>
        <p className="ml-2 text-sm">ロード中...</p>
      </div>
    );
  }
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="hover:text-gray-300">
          予約システム
        </Link>
        <div className="md:hidden">
          <button
            className="text-white focus:outline-none cursor-pointer"
            onClick={toggleHamburger}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>
        </div>
        <div className="hidden  md:flex items-center space-x-4 nav-menu">
          {user ? (
            <>
              <Link href="/booking" className="hover:text-gray-300">
                予約する
              </Link>
              <Link href="/my-bookings" className="hover:text-gray-300">
                予約履歴
              </Link>
              {isAdmin && (
                <>
                  <Link href="/admin/timeslots" className="hover:text-gray-300">
                    管理者設定
                  </Link>
                  <Link href="/admin/bookings" className="hover:text-gray-300">
                    予約一覧
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={`${BUTTON_DANGER_CLASSES} px-4 py-2 text-sm ${
                  loggingOut
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {loggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="hover:text-gray-300">
                ログイン/新規登録
              </Link>
            </>
          )}
        </div>
      </nav>
      {isMenuOpen && (
        <div className="med:hidden bg-gray-700 pb-4 pt-1 ">
          <div className="flex flex-col items-center space-y-3 mt-4">
            {user ? (
              <>
                <Link
                  href="/booking"
                  className="block w-full text-center py-2 hover:bg-gray-600 rounded"
                  onClick={toggleHamburger}
                >
                  予約する
                </Link>
                <Link
                  href="/my-bookings"
                  className="block w-full text-center py-2 hover:bg-gray-600 rounded"
                  onClick={toggleHamburger}
                >
                  予約履歴
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/timeslots"
                      className="block w-full text-center py-2 hover:bg-gray-600 rounded"
                      onClick={toggleHamburger}
                    >
                      管理者設定
                    </Link>
                    <Link
                      href="/admin/bookings"
                      className="block w-full text-center py-2 hover:bg-gray-600 rounded"
                      onClick={toggleHamburger}
                    >
                      予約一覧
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`${BUTTON_DANGER_CLASSES} w-full py-2 text-sm ${
                    loggingOut
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {loggingOut ? "ログアウト中..." : "ログアウト"}
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="block w-full text-center py-2 hover:bg-gray-600 rounded"
                onClick={toggleHamburger}
              >
                ログイン/新規登録
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
