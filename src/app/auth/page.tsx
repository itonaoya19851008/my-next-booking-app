"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { BUTTON_PRIMARY_CLASSES, BUTTON_SECONDARY_CLASSES, CARD_CONTAINER_CLASSES, DESCRIPTION_TEXT_CLASSES, INPUT_FIELD_CLASSES, LABEL_CLASSES, MESSAGE_TEXT_CLASSES, PAGE_TITLE_CLASSES } from "@/constants/tailwindClasses";
import { useRouter } from "next/navigation";


const AuthPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  useEffect(()=>{
    const checkUserSession = async ()=>{
      const {data:{session}} = await supabase.auth.getSession();
      if(session){
        router.replace('/dashboard');
      }else{
        setLoading(false);
      }
    };
    checkUserSession();

    const {data:authListener} = supabase.auth.onAuthStateChange(
      (_event,session) =>{
        if(session){
          router.replace('/dashboard');
        }else{
          setLoading(false);
        }
      }
    );

    return ()=>{
      authListener.subscription.unsubscribe();
    }
  },[router]);
  const handleSignUp = async(e:React.FormEvent)=>{
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try{
        const {data,error} = await supabase.auth.signUp({
            email,
            password
        });

        if(error) throw error;
        if(data.user && !data.user.confirmed_at){
            setMessage('登録が完了しました！入力したメールアドレスを確認し、認証リンクをクリックしてください。')
        }else{
            setMessage('新規登録に成功しました！')
        }
        console.log('新規登録成功データ:',data);
    }catch(error:any){
        setMessage(`新規登録中にエラーが発生しました:${error.message}`);
    }finally{
        setLoading(false);
    }
  };

  const handleSignIn = async(e:React.FormEvent)=>{
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try{
      const {data,error} = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      setMessage('ログインに成功しました！');
      console.log('ログイン成功データ',data);
      router.replace('/dashboard');
      
    }catch(error:any){
      if(error.message.includes('Invalid login credentials')){
        setMessage('ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。');
      }else{
        setMessage(`ログイン中にエラーが発生しました:${error.message}`);
      }
      console.error('ログインエラー:',error);
    }finally{
      setLoading(false);
    }
  }
  return (
    <div className={`max-w-md mx-auto my-12 ${CARD_CONTAINER_CLASSES}`}>
      <h1 className={`${PAGE_TITLE_CLASSES}`}>
        認証ページ
      </h1>
      <p className={`${DESCRIPTION_TEXT_CLASSES}`}>
        このページでログインまたは新規登録を行います。
      </p>
      <form className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className={`${LABEL_CLASSES}`}
          >
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="あなたのメールアドレス"
            required
            className={`${INPUT_FIELD_CLASSES}`}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className={`${LABEL_CLASSES}`}
          >
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="あなたのパスワード"
            required
            className={`${INPUT_FIELD_CLASSES}`}
          />
        </div>
        <div className="flex gap-4 mt-4">
          <button 
          type="submit"
          disabled={loading}
          onClick={handleSignIn}
          className={`${BUTTON_PRIMARY_CLASSES} flex-1`}
          >
            {loading ? '処理中' : 'ログイン'}
          </button>
          <button 
          type="button"
          disabled={loading}
          onClick={handleSignUp}
          className={`${BUTTON_SECONDARY_CLASSES} flex-1`}
          >
            {loading ? '処理中' : '新規登録'}
          </button>
        </div>
      </form>
      {message && <p 
      className={MESSAGE_TEXT_CLASSES}
      >{message}</p>}
    </div>
  );
};

export default AuthPage;
