"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

import {
  PAGE_CENTER_CONTAINER_CLASSES,
  CARD_CONTAINER_CLASSES,
  PAGE_TITLE_CLASSES,
  DESCRIPTION_TEXT_CLASSES,
  LOADING_SPINNER_CLASSES,
  LOADING_SPINNER_TEXT_CONTAINER_CLASSES,
  BUTTON_SECONDARY_CLASSES,
  BUTTON_DANGER_CLASSES,
} from "@/constants/tailwindClasses";

import {
  formatDateForDisplay,
  fromUtcToLocalDate,
  toUtcDate,
} from "../utils/dateUtils";
interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_time: string;
  is_first_visit: boolean;
  created_at: string;
  patient_name: string | null;
  patient_phone: string | null;
  status: string;
}

const MyBookingPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const fecthMyAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.replace("/auth");
        return;
      }
      setUser(sessionUser);
      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63";

      const { data: fetchedAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", sessionUser.id)
        .eq("doctor_id", DOCTOR_ID)
        .order("appointment_time", { ascending: true });
      if (fetchError) throw fetchError;

      setAppointments(fetchedAppointments as Appointment[]);
      console.log("ユーザーの予約履歴:", fetchedAppointments);
    } catch (err: any) {
      setError(`予約履歴の読み込み中にエラーが発生しました:${err.message}`);
      console.error("予約履歴フェッチエラー", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fecthMyAppointments();
  }, [fecthMyAppointments]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/auth");
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);
  const handleCancelBooking = async (
    appointmentId: string,
    appointmentTime: string
  ) => {
    if (!user.id) {
      setError("ユーザー情報が取得できませんでした。");
      return;
    }

    if (
      !window.confirm(
        `予約日時:${formatDateForDisplay(
          fromUtcToLocalDate(appointmentTime)
        )}${fromUtcToLocalDate(appointmentTime).toLocaleDateString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })}の予約を本当にキャンセルしますか？`
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const bookingDateTime = new Date(appointmentTime);
      const nowUTC = toUtcDate(new Date());
      const tewentyFourHoursBeforeBooking = new Date(
        bookingDateTime.getTime() - 24 * 60 * 60 * 1000
      );

      if (nowUTC.getTime() > tewentyFourHoursBeforeBooking.getTime()) {
        alert(
          "この予約はキャンセル期限（予約時間の24時間前）を過ぎているため、Webからはキャンセルできません。病院に直接お問い合わせください。"
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("appointments")
        .update({ status: "canceled" })
        .eq("id", appointmentId)
        .eq("user_id", user.id);

      if (error) throw error;

      alert("予約が正常にキャンセルされました!");
      fecthMyAppointments();
    } catch (err: any) {
      setError(`予約のキャンセル中にエラーが発生しました:${err.message}`);
      console.error("予約キャンセルエラー", err);
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className={PAGE_CENTER_CONTAINER_CLASSES}>
        <div className={LOADING_SPINNER_TEXT_CONTAINER_CLASSES}>
          <div className={LOADING_SPINNER_CLASSES}></div>
          <p className="ml-4">予約履歴を読み込み中...</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex-col ${PAGE_CENTER_CONTAINER_CLASSES}`}>
      <div className={`max-w-4xl w-full text-center ${CARD_CONTAINER_CLASSES}`}>
        <h1 className={`${PAGE_TITLE_CLASSES}`}>あなたの予約履歴</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {appointments.length === 0 ? (
          <p className={DESCRIPTION_TEXT_CLASSES}>現在、予約はありません。</p>
        ) : (
          <div className="text-left mt-8 space-y-4">
            {appointments.map((appointment) => {
                const isCanceled = appointment.status === 'canceled';
                let appointmentClasses = "border border-gray-200 p-4 rounded-md shadow-sm flex justify-between items-center";
                if(isCanceled){
                    appointmentClasses += "bg-red-50 opacity-70";
                }
              return (
                <div
                  key={appointment.id}
                  className={appointmentClasses}
                >
                  <div>
                      <p className="font-semibold text-lg text-gray-800">
                        予約日時:
                        {formatDateForDisplay(
                          fromUtcToLocalDate(appointment.appointment_time)
                        )}{" "}
                        {fromUtcToLocalDate(
                          appointment.appointment_time
                        ).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isCanceled && <span className="ml-2 px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full ">キャンセル済み</span>}
                      </p>
                      <p className="text-gray-600">
                        種別:{appointment.is_first_visit ? "初診" : "再診"}
                      </p>
                      <p className="text-gray-600">
                        お名前:{appointment.patient_name}
                      </p>
                      {appointment.patient_phone && (
                        <p className="text-gray-600">
                          電話番号:{appointment.patient_phone}
                        </p>
                      )}
                      <p className="text-gray-600">メール: {user?.email}</p>
                      <p className="text-gray-500 text-sm">
                        予約ID:{appointment.id.substring(0, 8)}
                      </p>
                  </div>
                  {!isCanceled && (
                    <button
                    onClick={()=>handleCancelBooking(appointment.id,appointment.appointment_time)}
                    className={`${BUTTON_DANGER_CLASSES} px-4 py-2 text-sm`}
                    disabled={loading}
                    >
                        キャンセル
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingPage;
