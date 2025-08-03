// app/admin/timeslots/page.tsx

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient"; // 後ほど使います
// ★ 必要なクラス定数をインポートします
import {
  PAGE_CENTER_CONTAINER_CLASSES,
  CARD_CONTAINER_CLASSES,
  PAGE_TITLE_CLASSES,
  DESCRIPTION_TEXT_CLASSES,
  CALENDAR_HEADER_CELL_CLASSES,
  CALENDAR_TIME_LABEL_CLASSES,
  CALENDAR_GRID_CONTAINER_CLASSES,
  TIMESLOT_CELL_CLASSES,
  LABEL_CLASSES,
  INPUT_FIELD_CLASSES,
  MESSAGE_TEXT_CLASSES,
  LOADING_SPINNER_TEXT_CONTAINER_CLASSES,
  LOADING_SPINNER_CLASSES,
} from "@/constants/tailwindClasses";
import { useRouter } from "next/navigation";

interface TimeSlot {
  id: string;
  created_at: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  max_first_visits: number;
  max_re_visits: number;
}
const AdminTimeslotsPage: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [message, setMessage] = useState<string>("");

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date;
    time: string;
  } | null>(null);

  const [initialSlots, setInitialSlots] = useState<number>(0);
  const [followUpSlots, setFollowUpSlots] = useState<number>(0);

  const [saving, setSaving] = useState<boolean>(false);
  const [timeSlots, setTimeslots] = useState<TimeSlot[]>([]);
  const [loadingTimeslots, setLoadingTimeslots] = useState<boolean>(true);

  const router = useRouter();
  const [isAdmin,setIsAdmin] = useState<boolean>(false);
  const [isAdminCheckLoading,setIsAdminCheckLoading] = useState<boolean>(true);

  useEffect(()=>{
    const checkAdminStatus = async() =>{
      const {data:{user}} = await supabase.auth.getUser();
      if(!user){
        router.replace('/auth');
        return;
      }

      const {data:profile,error:profileError} = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id',user.id)
      .single();

      if(profileError || !profile || !profile.is_admin){
        console.error("管理者アクセスエラー:",profileError?.message || "管理者ではありません");
        router.replace('/dashboard');
        return;
      }

      setIsAdmin(true);
      setIsAdminCheckLoading(false);
    }
    checkAdminStatus();

  },[router])

  const TIME_SLOTS = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const generateWeekDays = (startOfWeek: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDayHeader = (date: Date): string => {
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${dayOfWeek} ${month}/${day}`;
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + 7);
      return newDate;
    });
  };



  const handleCellClick = (date: Date, time: string) => {
    setSelectedDateTime({ date, time });
    setIsPopupOpen(true);
    setMessage("");

    const clickedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    clickedDateTime.setHours(
      parseInt(time.split(":")[0]),
      parseInt(time.split(":")[1]),
      0,
      0
    );

    const existingSlot = timeSlots.find((slot) => {
      const slotStartTime = new Date(slot.start_time);
      return (
        slotStartTime.getFullYear() === clickedDateTime.getFullYear() &&
        slotStartTime.getMonth() === clickedDateTime.getMonth() &&
        slotStartTime.getDate() === clickedDateTime.getDate() &&
        slotStartTime.getHours() === clickedDateTime.getHours() &&
        slotStartTime.getMinutes() === clickedDateTime.getMinutes()
      );
    });
    if (existingSlot) {
      setInitialSlots(existingSlot.max_first_visits);
      setFollowUpSlots(existingSlot.max_re_visits);
    } else {
      setInitialSlots(0);
      setFollowUpSlots(0);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedDateTime(null);
    setMessage("");
  };

  const handleInitialSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setInitialSlots(isNaN(value) ? 0 : value);
  };

  const handleFollowUpSlotsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10);
    setFollowUpSlots(isNaN(value) ? 0 : value);
  };

  const handleSaveSlots = async () => {
    if (!selectedDateTime) {
      setMessage("エラー:日付が選択されていません。");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const slotStart = new Date(selectedDateTime.date);
      slotStart.setHours(
        parseInt(selectedDateTime.time.split(":")[0]),
        parseInt(selectedDateTime.time.split(":")[1]),
        0,
        0
      );
      const slotEnd = new Date(selectedDateTime.date);
      const [hour, minute] = selectedDateTime.time.split(":").map(Number);
      slotEnd.setHours(hour, minute + 30, 0, 0); // ここでslotEndの時刻を設定
      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63";
      const { data, error } = await supabase
        .from("timeslots")
        .upsert(
          {
            doctor_id: DOCTOR_ID,
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            max_first_visits: initialSlots,
            max_re_visits: followUpSlots,
          },
          {
            onConflict: "doctor_id,start_time",
          }
        )
        .select(); // ★ この.select()を追加します
      if (error) throw error;

      setMessage("予約が正常に保存されました！");
      console.log("予約保存成功:", data);
      handleClosePopup();
      fetchTimeslots();
    } catch (error: any) {
      setMessage(`予約枠の保存中にエラーが発生しました:${error.message}`);
      // ★ ここを修正します
      console.error("予約枠保存エラーの詳細:", error);
      // もしerrorオブジェクトにresponseやdataプロパティがあれば、それらも出力してみます
      if (error.response) {
        console.error("エラーレスポンス:", error.response);
      }
    } finally {
      setSaving(false);
    }
  };
  const fetchTimeslots = useCallback(async () => {
    setLoadingTimeslots(true);
    setMessage("");
    try {
      // getWeekStartはローカルタイムゾーンの月曜0時0分を返します。
      // これをUTCの月曜0時0分に変換してクエリの基準とします。
      const weekStartLocal = getWeekStart(currentWeekStart);
    
      // ★ 修正ここから：weekStartとweekEndをUTC基準で正確に定義する ★
      // weekStartを、その日のUTCの00:00:00に設定し直す
      const weekStartUTC = new Date(Date.UTC(
          weekStartLocal.getFullYear(),
          weekStartLocal.getMonth(),
          weekStartLocal.getDate(),
          0, 0, 0, 0
      ));
    
      // weekEndも同様に、週の終わり（次の週の月曜日）のUTCの00:00:00に設定
      const weekEndUTC = new Date(weekStartUTC);
      weekEndUTC.setDate(weekStartUTC.getDate() + 7);
      // ★ 修正ここまで ★
    
    
      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63";
    
      const { data, error } = await supabase
        .from("timeslots")
        .select("*")
        .eq("doctor_id", DOCTOR_ID)
        .gte("start_time", weekStartUTC.toISOString()) // UTCの開始日時以降
        .lt("start_time", weekEndUTC.toISOString());   // UTCの終了日時より前
    
      if (error) throw error;
    
      setTimeslots(data as TimeSlot[]);
      console.log("予約枠データフェッチ成功", data);
    } catch (error: any) {
      setMessage(
        `予約枠データの読み込み中にエラーが発生しました:${error.message}`
      );
      console.error("予約枠データ読み込みエラー:", error);
    } finally {
      setLoadingTimeslots(false);
    }
  }, [currentWeekStart]);
  useEffect(() => {
    fetchTimeslots();
  }, [fetchTimeslots]);
  const weekStart = getWeekStart(currentWeekStart);
  const weekDays = generateWeekDays(weekStart);
    if(isAdminCheckLoading){
      return(
        <div className={PAGE_CENTER_CONTAINER_CLASSES}>
          <div className={LOADING_SPINNER_TEXT_CONTAINER_CLASSES}>
            <div className={LOADING_SPINNER_CLASSES}></div>
            <p className="ml-4">管理者ステータスを確認中...</p>
          </div>
        </div>
      )
     }
  return (
    // ★ PAGE_CENTER_CONTAINER_CLASSES を適用（flex-colを除く）
    <div className={`flex-col ${PAGE_CENTER_CONTAINER_CLASSES}`}>
      {/* ★ CARD_CONTAINER_CLASSES を適用。max-w-6xl w-full は個別に残します。 */}
      <div className={`max-w-6xl w-full ${CARD_CONTAINER_CLASSES} text-center`}>
        {/* ★ PAGE_TITLE_CLASSES を適用 */}
        <h1 className={PAGE_TITLE_CLASSES}>予約枠設定（管理者）</h1>
        {/* ★ DESCRIPTION_TEXT_CLASSES を適用 */}
        <p className={DESCRIPTION_TEXT_CLASSES}>
          ここでは、予約可能な時間帯と、初診・再診の枠数を設定します。
        </p>

        <div className="schedule-calendar-container mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevWeek}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {"<"}
            </button>
            <h2 className="text-2xl font-bold">
              {weekDays[0].getMonth() + 1}/{weekDays[0].getDate()}
              {" - "}
              {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}/
              {weekDays[6].getFullYear()}
            </h2>
            <button
              onClick={handleNextWeek}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {">"}
            </button>
          </div>

          {/* ★ CALENDAR_GRID_CONTAINER_CLASSES を適用 */}
          <div
            className={`grid grid-cols-8 ${CALENDAR_GRID_CONTAINER_CLASSES}`}
          >
            {/* ★ CALENDAR_HEADER_CELL_CLASSES を適用（border-rは個別に残す） */}
            <div className={`${CALENDAR_HEADER_CELL_CLASSES} border-r`}>
              時間
            </div>

            {weekDays.map((date) => (
              // ★ CALENDAR_HEADER_CELL_CLASSES を適用
              <div
                key={date.toISOString()}
                className={CALENDAR_HEADER_CELL_CLASSES}
              >
                {formatDayHeader(date)}
              </div>
            ))}

            {TIME_SLOTS.map((time) => (
              <React.Fragment key={time}>
                {/* ★ CALENDAR_TIME_LABEL_CLASSES を適用 */}
                <div className={CALENDAR_TIME_LABEL_CLASSES}>{time}</div>

                {weekDays.map((date) => {
                  const currentCellDateTime = new Date(date);
                  currentCellDateTime.setHours(
                    parseInt(time.split(":")[0]),
                    parseInt(time.split(":")[1]),
                    0,
                    0
                  );
                  const foundSlot = timeSlots.find((slot) => {
                    const slotStartTime = new Date(slot.start_time);
                    return (
                      slotStartTime.getFullYear() ===
                        currentCellDateTime.getFullYear() &&
                      slotStartTime.getMonth() ===
                        currentCellDateTime.getMonth() &&
                      slotStartTime.getDate() ===
                        currentCellDateTime.getDate() &&
                      slotStartTime.getHours() ===
                        currentCellDateTime.getHours() &&
                      slotStartTime.getMinutes() ===
                        currentCellDateTime.getMinutes()
                    );
                  });
                  return (
                    // ★ TIMESLOT_CELL_CLASSES を適用
                    <div
                      key={`${date.toISOString()}-${time}`}
                      onClick={() => handleCellClick(date, time)}
                      className={TIMESLOT_CELL_CLASSES}
                    >
                      {foundSlot ? (
                        <div className="text-xs">
                          <p className="text-blue-600 font-bold">
                            初診: {foundSlot.max_first_visits}
                          </p>
                          <p className="text-green-600 font-bold">
                            再診: {foundSlot.max_re_visits}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">空き</span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ★ MESSAGE_TEXT_CLASSES を適用（mt-4 text-sm は個別に残す） */}
        {message && (
          <p className={`mt-4 text-sm ${MESSAGE_TEXT_CLASSES}`}>{message}</p>
        )}
      </div>

      {/* ポップアップ（モーダル）のJSX */}
      {isPopupOpen && selectedDateTime && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* ポップアップのコンテナ。max-w-md w-full は個別に残す */}
          <div
            className={`max-w-md w-full ${CARD_CONTAINER_CLASSES} text-left`}
          >
            <h3 className="text-xl font-bold mb-4">予約枠設定</h3>
            <p className="mb-4">
              選択された日時:{" "}
              {selectedDateTime.date.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}{" "}
              {selectedDateTime.time}
            </p>

            {/* 予約枠設定フォーム */}
            <div className="space-y-4">
              <div>
                {/* ★ LABEL_CLASSES を適用 */}
                <label
                  htmlFor="initialSlots"
                  className={LABEL_CLASSES.replace("mb-2", "mb-1").replace(
                    "font-bold",
                    "font-medium"
                  )}
                >
                  初診枠数:
                </label>
                {/* ★ INPUT_FIELD_CLASSES を適用（mt-1 sm:text-sm は個別に残す） */}
                <input
                  type="number"
                  id="initialSlots"
                  value={initialSlots}
                  onChange={handleInitialSlotsChange}
                  min="0"
                  className={`mt-1 sm:text-sm ${INPUT_FIELD_CLASSES}`}
                />
              </div>
              <div>
                {/* ★ LABEL_CLASSES を適用 */}
                <label
                  htmlFor="followUpSlots"
                  className={LABEL_CLASSES.replace("mb-2", "mb-1").replace(
                    "font-bold",
                    "font-medium"
                  )}
                >
                  再診枠数:
                </label>
                {/* ★ INPUT_FIELD_CLASSES を適用（mt-1 sm:text-sm は個別に残す） */}
                <input
                  type="number"
                  id="followUpSlots"
                  value={followUpSlots}
                  onChange={handleFollowUpSlotsChange}
                  min="0"
                  className={`mt-1 sm:text-sm ${INPUT_FIELD_CLASSES}`}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                disabled={saving}
                onClick={handleSaveSlots}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
              >
                保存
              </button>
              <button
                disabled={saving}
                onClick={handleClosePopup}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimeslotsPage;
