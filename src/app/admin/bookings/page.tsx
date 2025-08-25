"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

import {
  PAGE_CENTER_CONTAINER_CLASSES,
  CARD_CONTAINER_CLASSES,
  PAGE_TITLE_CLASSES,
  DESCRIPTION_TEXT_CLASSES,
  LOADING_SPINNER_CLASSES,
  LOADING_SPINNER_TEXT_CONTAINER_CLASSES,
  CALENDAR_HEADER_CLASSES,
  CALENDAR_GRID_CLASSES,
  CALENDER_DAY_CLASSES,
  CALENDER_DAY_CURRENT_MONTH_CLASSES,
  CALENDAR_DAY_SELECTED_CLASSES,
  BUTTON_SECONDARY_CLASSES,
  CALENDER_DAY_OTHER_MONTH_CLASSES,
  BUTTON_PRIMARY_CLASSES,
  INPUT_FIELD_CLASSES,
  LABEL_CLASSES,
} from "@/constants/tailwindClasses";

import {
  formatDateForDisplay,
  fromUtcToLocalDate,
  toUtcDate,
  getDaysInMonth,
  getSortedDaysOfWeek,
  isSameDay,
  isToday,
  addMonths,
  isSameUtcMinute,
} from "@/app/utils/dateUtils";
import { time } from "console";

interface AdminAppointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_time: string;
  is_first_visit: boolean;
  created_at: string;
  userEmail?: string;
  patient_name: string;
  patient_phone: string | null;
  status: string;
}

const AdminBookingPage: React.FC = () => {
  const router = useRouter();
  const [allAppointments, setAllAppointments] = useState<AdminAppointment[]>(
    []
  );
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [isAdminCheckLoading, setIsAdminCheckLoading] = useState<boolean>(true);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [isFormPopupOpen, setIsFormPopupOpen] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AdminAppointment | null>(null);
  const [formPatientName, setFormPatientName] = useState<string>("");
  const [formPatientPhone, setFormPatientPhone] = useState<string>("");
  const [formPatientEmail, setFormPatientEmail] = useState<string>("");
  const [formAppointmentTime, setFormAppointmentTime] = useState<string>("");
  const [formIsFirstVisit, setFormIsFirstVisit] = useState<boolean>(true);
  const [formStatus, setFormStatus] = useState<"active" | "canceled">("active");

  const days = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );
  const daysOfWeek = getSortedDaysOfWeek();

  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, -1));
  };

  const gotoNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setError(null);
  };

  const fetchAppointments = useCallback(async () => {
    setLoadingPage(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || !profile.is_admin) {
        console.error(
          "管理者アクセスエラー",
          profileError?.message || "管理者ではありません"
        );
        router.replace("/dashboard");
        return;
      }
      setIsAdmin(true);
      setIsAdminCheckLoading(false);
      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63";
      const currentDayStartLocal = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      currentDayStartLocal.setHours(0, 0, 0, 0);

      const currentDayStartUTC = toUtcDate(currentDayStartLocal);
      const nextDayStartUTC = new Date(currentDayStartUTC);
      nextDayStartUTC.setDate(currentDayStartUTC.getDate() + 1);

      const { data: fetchedAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", DOCTOR_ID)
        .gte("appointment_time", currentDayStartUTC.toISOString())
        .lt("appointment_time", nextDayStartUTC.toISOString())
        .order("appointment_time", { ascending: true });

      if (fetchError) throw fetchError;

      const uniqueUserIds = Array.from(
        new Set(fetchedAppointments.map((app) => app.user_id))
      );

      let usersWithEmails: { id: string; email: string }[] = [];
      if (uniqueUserIds.length > 0) {
        const EDGE_FUNCTION_URL = `https://${
          process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1]
        }/functions/v1/fetch-user-emails`;

        const emailFetchResponse = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!emailFetchResponse.ok) {
          const errorData = await emailFetchResponse.json();
          console.error(
            "Edge Function(fetch-user-emails)呼び出しエラー:",
            errorData
          );
          setError("ユーザーメールアドレスの取得に失敗しました。");
        } else {
          usersWithEmails = await emailFetchResponse.json();
        }
      }

      const appointmentsWithEmails: AdminAppointment[] =
        fetchedAppointments.map((app) => {
          const userEmail = usersWithEmails.find(
            (u) => u.id === app.user_id
          )?.email;
          return { ...app, userEmail };
        });

      setAllAppointments(appointmentsWithEmails);
    } catch (err: any) {
      setError(`データの読み込み中にエラーが発生しました:${err.message}`);
      console.error("管理者予約履歴フェッチエラー:", err);
    } finally {
      setLoadingPage(false);
      setIsAdminCheckLoading(false);
    }
  }, [router, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  const handleCancelBooking = async (
    appointmentId: string,
    appoinmentTime: string
  ) => {
    if (
      !window.confirm(
        `予約日時:${formatDateForDisplay(
          fromUtcToLocalDate(appoinmentTime)
        )}${fromUtcToLocalDate(appoinmentTime).toLocaleDateString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })}の予約を本当にキャンセルしますか？`
      )
    ) {
      return;
    }
    setError(null);
    setLoadingPage(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "canceled" })
        .eq("id", appointmentId);

      if (error) throw error;
      alert("予約が正常にキャンセルされました！");
      fetchAppointments();
    } catch (err: any) {
      setError(`予約のキャンセル中にエラーが発生しました:${err.message}`);
      console.error("予約キャンセルエラー", err);
      setLoadingPage(false);
    }
  };

  const ALL_POSSIBLE_TIME_SLOTS = [
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

  const handeleAddBookingClick = () => {
    setEditingAppointment(null);
    setFormPatientName("");
    setFormPatientEmail("");
    setFormPatientPhone("");
    setFormAppointmentTime("09:00");
    setFormIsFirstVisit(true);
    setIsFormPopupOpen(true);
    setError(null);
  };

  const handleCloseFormPopup = () => {
    setIsFormPopupOpen(false);
    setEditingAppointment(null);
    setFormPatientName("");
    setFormPatientEmail("");
    setFormPatientPhone("");
    setFormAppointmentTime("09:00");
    setFormStatus('active'); // デフォルト値に戻す
    setFormIsFirstVisit(true);
  };

  const handleEditBookingClick = (appointment: AdminAppointment) => {
    setEditingAppointment(appointment);
    setFormPatientName(appointment.patient_name);
    setFormPatientEmail(appointment.userEmail || "");
    setFormPatientPhone(appointment.patient_phone || "");
    const apptLocalTime = fromUtcToLocalDate(appointment.appointment_time);
    const hours = String(apptLocalTime.getHours()).padStart(2, "0");
    const minutes = String(apptLocalTime.getMinutes()).padStart(2, "0");
    setFormAppointmentTime(`${hours}:${minutes}`);
    setFormIsFirstVisit(appointment.is_first_visit);
    setFormStatus(appointment.status as 'active' | 'canceled');
    setIsFormPopupOpen(true);
    setError(null);
  };
  const handleSaveFormBooking = async () => {
    if (!formPatientName.trim()) {
      setError("お名前を入力してください。");
      return;
    }
    if (!formPatientEmail.trim() || !formPatientEmail.includes("@")) {
      setError("有効なメールアドレスを入力してください。");
      return;
    }
    if (!formAppointmentTime.trim()) {
      setError("時間帯を選択してください。");
      return;
    }

    setLoadingPage(true);
    setError(null);

    try {
      const appointmentDateTimeLocal = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(formAppointmentTime.split(":")[0]),
        parseInt(formAppointmentTime.split(":")[1]),
        0,
        0
      );

      const appointmentDateTimeUTC = toUtcDate(appointmentDateTimeLocal);

      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63";

      let userIdForBooking: string;

      const { data: conflictingAppointments, error: conflictError } =
        await supabase
          .from("appointments")
          .select("id")
          .eq("doctor_id", DOCTOR_ID)
          .eq("appointment_time", appointmentDateTimeUTC.toISOString())
          .eq("status", "active");

      if (conflictError) throw conflictError;

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        if (editingAppointment) {
          const isConflictingWithSelf = conflictingAppointments.some(
            (appt) => appt.id === editingAppointment.id
          );
          if (!isConflictingWithSelf) {
            setError("この時間帯にはすでに別の予約が存在します。");
            setLoadingPage(false);
            handleCloseFormPopup();
            return;
          }
        } else {
          setError("この時間帯にはすでに別の予約が存在します。");
          setLoadingPage(false);
          handleCloseFormPopup();
          return;
        }
      }

      const {data:configuredTimeSlots,error:timeSlotsError} = await supabase
      .from('timeslots')
      .select('*')
      .eq('doctor_id',DOCTOR_ID)
      .eq('start_time',appointmentDateTimeUTC.toISOString())
      .single();

      if(timeSlotsError && timeSlotsError.code === 'PGRST116'){
        setError('この時間帯には予約枠が設定されていません。管理者は予約設定ページで枠を作成してください。');
        setLoadingPage(false);
        handleCloseFormPopup();
        return
      }else if(timeSlotsError){
        throw timeSlotsError;
      }

      const maxFirstVisits = configuredTimeSlots.max_first_visits;
      const maxReVisits = configuredTimeSlots.max_re_visits;

      const existingBookingForSlot = allAppointments.filter(app =>{
        const apptTimeUTC = toUtcDate(fromUtcToLocalDate(app.appointment_time));
        return isSameUtcMinute(apptTimeUTC,appointmentDateTimeUTC) &&
        app.status === 'active' &&
        (!editingAppointment || app.id !== editingAppointment.id);
      });

      const currentFirstVisitBookings = existingBookingForSlot.filter(
        app => app.is_first_visit
      ).length;

      const currentRevisitBookingss = existingBookingForSlot.filter(
        app=> !app.is_first_visit
      ).length;

      const isFirstVisitDesired = formIsFirstVisit;

      let isAbailableForDesiredType = false;

      if(isFirstVisitDesired){
        isAbailableForDesiredType = currentFirstVisitBookings < maxFirstVisits
      }else{
        isAbailableForDesiredType = currentRevisitBookingss < maxReVisits
      };

      if(!isAbailableForDesiredType){
        const typeText = isFirstVisitDesired ? '初診' : '再診';
        setError(`この時間帯の${typeText}枠は不足しています。`);
        setLoadingPage(false);
        handleCloseFormPopup();
        return;
      }

      const MANAGE_USER_FUNCTION_URL = `https://${
        process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1]
      }/functions/v1/manage-user-by-email`;

      const userManagementResponse = await fetch(MANAGE_USER_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formPatientEmail }),
      });

      if (!userManagementResponse.ok) {
        const errorData = userManagementResponse.json();
        console.error(
          "Edge Function(manage-user-by-email)呼び出しエラー:",
          errorData
        );
        throw new Error(
          `ユーザーの取得/作成に失敗しました:${errorData || "不明なエラー"}`
        );
      }

      const userManagementResult = await userManagementResponse.json();
      userIdForBooking = userManagementResult.userId;

      if (editingAppointment) {
        const { error: updateError } = await supabase
          .from("appointments")
          .update({
            appointment_time: appointmentDateTimeUTC.toISOString(),
            is_first_visit: formIsFirstVisit,
            patient_name: formPatientName,
            patient_phone:
              formPatientPhone.trim() === "" ? null : formPatientPhone.trim(),
            user_id: userIdForBooking,
            status:formStatus
          })
          .eq("id", editingAppointment.id);

        if (updateError) throw updateError;
        alert("予約が正常に更新されました!");
        handleCloseFormPopup();
        fetchAppointments();
      } else {
        const { error: insertError } = await supabase
          .from("appointments")
          .insert({
            user_id: userIdForBooking,
            doctor_id: DOCTOR_ID,
            appointment_time: appointmentDateTimeUTC.toISOString(),
            is_first_visit: formIsFirstVisit,
            created_at: new Date().toISOString(),
            patient_name: formPatientName,
            patient_phone:
              formPatientPhone.trim() === "" ? null : formPatientPhone.trim(),
              status:formStatus
          });

        if (insertError) throw insertError;

        handleCloseFormPopup();
        fetchAppointments();
      }
    } catch (err: any) {
      setError(`予約の保存中にエラーが発生しました:${err.message}`);
      console.error("管理者予約保存エラー:", err);
    } finally {
      setLoadingPage(false);
    }
  };

  if (loadingPage || isAdminCheckLoading) {
    return (
      <div className={PAGE_CENTER_CONTAINER_CLASSES}>
        <div className={LOADING_SPINNER_TEXT_CONTAINER_CLASSES}>
          <div className={LOADING_SPINNER_CLASSES}></div>
          <p className="ml-4">予約データを読み込み中...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin && !loadingPage) {
    return (
      <div className={PAGE_CENTER_CONTAINER_CLASSES}>
        <p className="text-red-500">アクセス権がありません。</p>
      </div>
    );
  }
  return (
    <div className={`flex-col ${PAGE_CENTER_CONTAINER_CLASSES}`}>
      <div className={`max-w-4xl w-full ${CARD_CONTAINER_CLASSES} text-center`}>
        <h1 className={PAGE_TITLE_CLASSES}>全予約者リスト（管理者）</h1>
        <p className={DESCRIPTION_TEXT_CLASSES}>
          選択された日付の予約一覧を表示します。
        </p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="calender-container mb-8">
          <div className={`${CALENDAR_HEADER_CLASSES} mb-4`}>
            <button
              onClick={goToPreviousMonth}
              className={BUTTON_SECONDARY_CLASSES}
            >
              &lt; 前の月
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </h2>
            <button
              onClick={gotoNextMonth}
              className={BUTTON_SECONDARY_CLASSES}
            >
              次の月 &gt;
            </button>
          </div>
          <div className={`${CALENDAR_HEADER_CLASSES} mb-2`}>
            {daysOfWeek.map((dayName, index) => (
              <div
                key={index}
                className="text-center font-semibold text-gray-600 py-2"
              >
                {dayName}
              </div>
            ))}
          </div>
          <div className={`${CALENDAR_GRID_CLASSES}`}>
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = selectedDate
                ? isSameDay(day, selectedDate)
                : false;
              const isTodayDate = isToday(day);

              let dayClasses = CALENDER_DAY_CLASSES;
              if (isCurrentMonth) {
                dayClasses += `${CALENDER_DAY_CURRENT_MONTH_CLASSES}`;
              } else {
                dayClasses += `${CALENDER_DAY_OTHER_MONTH_CLASSES}`;
              }
              if (isSelected) {
                dayClasses += `${CALENDAR_DAY_SELECTED_CLASSES}`;
              }
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={dayClasses}
                >
                  {day.getDate()}
                </div>
              );
            })}
          </div>
          <button
            onClick={handeleAddBookingClick}
            className={`${BUTTON_PRIMARY_CLASSES} px-6 py-2 mt-4 test-sm`}
          >
            + 新しい予約を追加
          </button>
          {allAppointments.length === 0 ? (
            <p className="text-gray-600 font-semibold text-lg py-10">
              {selectedDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              の予約はありません。
            </p>
          ) : (
            <div className="text-left mt-8 space-y-4">
              {allAppointments.map((appointment) => {
                const isCanceled = appointment.status === "canceled";
                let appointmentClasses =
                  "border border-gray-200 p-4 rounded-md shadow-sm flex items-center justify-between";
                if (isCanceled) {
                  appointmentClasses += " bg-red-50 opacity-70";
                }
                return (
                  <div key={appointment.id} className={`${appointmentClasses}`}>
                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        予約時間:
                        {fromUtcToLocalDate(
                          appointment.appointment_time
                        ).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                      <p className="text-gray-600">
                        患者メール:{appointment.userEmail}
                      </p>
                      <p className="text-gary-500 text-sm">
                        予約ID:{appointment.id.substring(0, 8)}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleEditBookingClick(appointment)}
                        className={`${BUTTON_SECONDARY_CLASSES} px-4 py-2 text-sm`}
                        disabled={loadingPage}
                      >
                        編集
                      </button>
                      {isCanceled && (
                        <div className="text-gray-500  px-4 py-2 ">
                          キャンセル済み
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {isFormPopupOpen && selectedDate && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items center justify-center z-50">
            <div
              className={`max-w-md w-full ${CARD_CONTAINER_CLASSES} text-left`}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingAppointment ? "予約の修正" : "新しい予約を追加"}
              </h3>
              <p className="mb-4">
                選択された日付: {formatDateForDisplay(selectedDate)}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveFormBooking();
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="formPatientName" className={LABEL_CLASSES}>
                    お名前: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="formPatientName"
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    placeholder="例: 山田 太郎"
                    required
                    className={INPUT_FIELD_CLASSES}
                  />
                </div>
                <div>
                  <label htmlFor="formPatientEmail" className={LABEL_CLASSES}>
                    メールアドレス: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="formPatientEmail"
                    value={formPatientEmail}
                    onChange={(e) => setFormPatientEmail(e.target.value)}
                    placeholder="例: your.email@example.com"
                    className={INPUT_FIELD_CLASSES}
                  />
                </div>
                <div>
                  <label htmlFor="formPatientPhone" className={LABEL_CLASSES}>
                    電話番号:（任意）
                  </label>
                  <input
                    type="tel"
                    id="formPatientPhone"
                    value={formPatientPhone}
                    onChange={(e) => setFormPatientPhone(e.target.value)}
                    placeholder="例: 090-0000-0000"
                    className={INPUT_FIELD_CLASSES}
                  />
                </div>
                <div>
                  <label
                    htmlFor="formAppointmentTime"
                    className={LABEL_CLASSES}
                  >
                    時間帯: <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="formAppointmentTime"
                    onChange={(e) => setFormAppointmentTime(e.target.value)}
                    required
                    className={`${INPUT_FIELD_CLASSES} py-3`}
                  >
                    <option value="">時間帯を選択して選択してください</option>
                    {ALL_POSSIBLE_TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className={LABEL_CLASSES}>種別選択:</span>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formVisitType"
                        value="first"
                        checked={formIsFirstVisit === true}
                        onChange={() => setFormIsFirstVisit(true)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-900">初診</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formVisitType"
                        value="followup"
                        checked={formIsFirstVisit === false}
                        onChange={() => setFormIsFirstVisit(false)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-900">再診</span>
                    </label>
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="status"
                  className={LABEL_CLASSES}
                  >ステータス</label>
                  <select id="status"
                  className={`${INPUT_FIELD_CLASSES} py-3`}
                  value={formStatus}
                  onChange={(e)=>setFormStatus(e.target.value as 'active' | 'canceled')}
                  >
                    <option value="active">アクティブ</option>
                    <option value="canceled">キャンセル</option>
                  </select>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="submit"
                    disabled={loadingPage}
                    className={`${BUTTON_PRIMARY_CLASSES} px-6 py-3 text-sm`}
                  >
                    {editingAppointment ? "修正を保存" : "追加"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseFormPopup}
                    disabled={loadingPage}
                    className={`${BUTTON_SECONDARY_CLASSES} px-6 py-3 text-sm`}
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingPage;
