"use client";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  BUTTON_PRIMARY_CLASSES,
  BUTTON_SECONDARY_CLASSES,
  CALENDAR_DAY_DISABLED_CLASSES,
  CALENDAR_DAY_SELECTED_CLASSES,
  CALENDAR_DAY_TODAY_CLASSES,
  CALENDAR_GRID_CLASSES,
  CALENDAR_GRID_CONTAINER_CLASSES,
  CALENDAR_HEADER_CELL_CLASSES,
  CALENDAR_HEADER_CLASSES,
  CALENDER_DAY_CLASSES,
  CALENDER_DAY_CURRENT_MONTH_CLASSES,
  CALENDER_DAY_OTHER_MONTH_CLASSES,
  CARD_CONTAINER_CLASSES,
  DESCRIPTION_TEXT_CLASSES,
  INPUT_FIELD_CLASSES,
  LABEL_CLASSES,
  PAGE_CENTER_CONTAINER_CLASSES,
  PAGE_TITLE_CLASSES,
} from "@/constants/tailwindClasses";
import {
  addMonths,
  formatDateForDisplay,
  getDaysInMonth,
  getSortedDaysOfWeek,
  isSameDay,
  isToday,
  toUtcDate,
} from "../utils/dateUtils";

interface TimeSlot {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  max_first_visits: number;
  max_re_visits: number;
}

interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_time: string;
  is_first_vist: boolean;
  patient_name:string;
  patient_phone:string | null;
}
const BookingPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fetchedTimeSlots, setFetchedTimeSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);

  const [patientName,setPatientName] = useState<string>('');
  const [patientPhone,setPatientPhone] = useState<string>('');

  const [userId,setUserId] = useState<string|null>(null);
  const [userActiveBookings,setUserActiveBookings] = useState<Appointment[]>([]);
  // 管理者側と同じ固定の時間帯
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
  const days = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );
  const daysOfWeek = getSortedDaysOfWeek();

  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, -1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateClick = (date: Date) => {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate()+2);
    twoDaysLater.setHours(0,0,0,0);
    if (date.getTime() < twoDaysLater.getTime()) {
      setError("予約は明後日以降の日付から可能です。")
      return;
    }
    setSelectedDate(date);
    setSelectedTime(null);
    setError(null);
  };

  useEffect(()=>{
    const fetchUserData = async ()=>{
      const {data:{user}} = await supabase.auth.getUser();
      if(user){
        setUserId(user.id);

        const {data:activeBookings,error} = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id',user.id)
        .eq('status','active');

        if(error){
          console.error('既存の予約取得エラー',error);
          setError('既存の予約情報の取得に失敗しました。');
          return;
        }
        setUserActiveBookings(activeBookings||[]);
      }
    }
    fetchUserData();
  },[])
  const fetchTimeSlotsForSelectedDate = useCallback(async () => {
    if (!selectedDate) {
      setFetchedTimeSlots([]);
      setExistingAppointments([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const dateStartLocal = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      dateStartLocal.setHours(0, 0, 0, 0);
      const dateStartUTC = new Date(
        Date.UTC(
          dateStartLocal.getFullYear(),
          dateStartLocal.getMonth(),
          dateStartLocal.getDate(),
          0,
          0,
          0,
          0
        )
      );
      const dateEndUTC = new Date(dateStartUTC);
      dateEndUTC.setDate(dateStartUTC.getDate() + 1);

      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63";

      const { data: timeslotsData, error: timeslotsError } = await supabase
        .from("timeslots")
        .select("*")
        .eq("doctor_id", DOCTOR_ID)
        .gte("start_time", dateStartUTC.toISOString())
        .lt("start_time", dateEndUTC.toDateString());

      if (timeslotsError) throw timeslotsError;

      setFetchedTimeSlots(timeslotsData as TimeSlot[]);

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select("*")
          .eq("doctor_id", DOCTOR_ID)
          .gte("appointment_time", dateStartUTC.toISOString())
          .lt("appointment_time", dateEndUTC.toISOString());

      if (appointmentsError) throw appointmentsError;
      setExistingAppointments(appointmentsData as Appointment[]);
      console.log("予約枠設定データ:", timeslotsData);
      console.log("既存の予約データ:", appointmentsData);
    } catch (err: any) {
      setError("予約枠の取得中にエラーが発生しました" + err.message);
      console.error("予約枠フェッチエラー:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);
  useEffect(() => {
    fetchTimeSlotsForSelectedDate();
  }, [fetchTimeSlotsForSelectedDate]);
  const isSlotAvailable = (
    time: string,
    isFirstVisitType: boolean
  ): boolean => {
    if (!selectedDate) return false;

    const selectedLocalDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      parseInt(time.split(':')[0]),
      parseInt(time.split(':')[1]),
      0,0
    )
    const selectedSlotTimeUTC = new Date(selectedLocalDateTime.toISOString());

    const configuredSlot = fetchedTimeSlots.find((slot) => {
      const slotStartTimeUTC = new Date(slot.start_time);
      return slotStartTimeUTC.getTime() === selectedSlotTimeUTC.getTime();
    });

    if (!configuredSlot) return false;

    const currentFirstVisitBookings = existingAppointments.filter(
      (app) =>
        new Date(app.appointment_time).getTime() ===
          selectedSlotTimeUTC.getTime() && app.is_first_vist
    ).length;

    const currentRevisitBookings = existingAppointments.filter(
      (app) =>
        new Date(app.appointment_time).getTime() ===
          selectedSlotTimeUTC.getTime() && !app.is_first_vist
    ).length;

    if (isFirstVisitType) {
      return currentFirstVisitBookings < configuredSlot.max_first_visits;
    } else {
      return currentRevisitBookings < configuredSlot.max_re_visits;
    }
  };

  const handleBooking = async() => {
    if (!selectedDate || !selectedTime) {
      setError("日付と時間を選択してください。");
      return;
    }
    if(userActiveBookings.length>0){
      setError('すでに進行中の予約があります。新しい予約は作成できません。');
      return;
    }
    if(!isSlotAvailable(selectedTime,isFirstVisit)){
      setError('選択された時間帯は、ご希望の種別では予約できません。');
      return;
    }
    if(!patientName.trim()){
      setError('お名前を入力してください。');
      return;
    }
    setLoading(true);
    setError(null);

    try{
      const appointmentDateTimeLocal = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(selectedTime.split(':')[0]),
        parseInt(selectedTime.split(':')[1]),
        0,0
      );
      const appointmentDateTimeUTC = toUtcDate(appointmentDateTimeLocal);

      const {data:{user}} = await supabase.auth.getUser();

      if(!user){
        setError('予約にはログインが必要です。');
        setLoading(false);
        return;
      }
      const DOCTOR_ID = "b4fc70ce-7a61-4b52-b7aa-0b93bb6e2e63"; 

 

      const {data:existingBookings,error:existingBookingsError} = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id',user.id)
      .eq('doctor_id',DOCTOR_ID)
      .eq('appointment_time',appointmentDateTimeUTC.toISOString())
      .eq('is_first_visit',isFirstVisit);
      if(existingBookingsError) throw existingBookingsError;

      if(existingBookings && existingBookings.length > 0){
        setError('この日時と種別は、すでに予約済みです。');
        setLoading(false);
        return;
      }
      const {data,error} = await supabase
      .from('appointments')
      .insert({
        user_id:user.id,
        doctor_id:DOCTOR_ID,
        appointment_time:appointmentDateTimeUTC.toISOString(),
        is_first_visit:isFirstVisit,
        created_at:new Date().toISOString(),
        patient_name:patientName,
        patient_phone:patientPhone.trim() === '' ? null : patientPhone.trim(),
        status:'active'
      }).select();

      if(error) throw error;
      console.log('予約成功',data);
      setError(null);
      setLoading(false);

      alert('予約が完了しました!\n'+ formatDateForDisplay(selectedDate)+ " " + selectedTime + "\n種別:"+ (isFirstVisit ? "初診" : "再診"));

      fetchTimeSlotsForSelectedDate();

      setSelectedDate(null);
      setSelectedTime(null);
      setPatientName('');
      setPatientPhone('');

      const DOCTOR_NAME = "山田太郎";
      // const PATIENT_NAME = user.email?.split('@')[0];


      const edgeFunctionPayload = {
        patientEmail:user.email,
        patientName:patientName,
        patientPhone:patientPhone,
        appointmentDate:formatDateForDisplay(appointmentDateTimeLocal),
        appointmentTime:selectedTime,
        isFirstVisit:isFirstVisit,
        doctorName:DOCTOR_NAME
      };

      const EDGE_FUNCTION_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1]}/functions/v1/send-booking-confirmation-email`;

    // Edge Functionを呼び出す
    const edgeFunctionResponse = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 必要に応じて認証ヘッダーを追加できますが、
        // Edge Function側で --no-verify-jwt を指定しているので不要
      },
      body: JSON.stringify(edgeFunctionPayload),
    });

    if (!edgeFunctionResponse.ok) {
      const errorData = await edgeFunctionResponse.json();
      console.error('Edge Function呼び出しエラー:', errorData);
      // エッジファンクションのエラーはユーザーに直接表示せず、コンソールにログするだけにすることも多い
      // ここではユーザーにメッセージを出すが、主要な予約は完了しているためalertは出さない
      alert("予約確認メールの送信に失敗しました。時間をおいてご確認ください。");
    } else {
      console.log('Edge Function呼び出し成功:', await edgeFunctionResponse.json());
      // メール送信成功のアラートは出さず、予約完了アラートのみで十分
    }
    // ★★★ Edge Function呼び出しのロジック終了 ★★★
    }catch(err:any){
      setLoading(false);
      setError(`予約中にエラーが発生しました:${err.message}`);
      console.error('予約エラー:',err);
    }
  };
  return (
    <div className={`flex-col ${PAGE_CENTER_CONTAINER_CLASSES}`}>
      <div className={`max-w-4l w-full text-center ${CARD_CONTAINER_CLASSES}`}>
        <h1 className={PAGE_TITLE_CLASSES}>オンライン予約</h1>
        <p className={DESCRIPTION_TEXT_CLASSES}>
          ご希望の日時を選択してご予約ください。初診・再診の種別も選択いただけます。
        </p>
        <div className={`${CALENDAR_HEADER_CLASSES} mb-4`}>
          <button
            onClick={goToPreviousMonth}
            className={BUTTON_SECONDARY_CLASSES}
          >
            &lt;
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </h2>
          <button onClick={goToNextMonth} className={BUTTON_SECONDARY_CLASSES}>
            &gt;
          </button>
        </div>
        <div className={`${CALENDAR_GRID_CLASSES} mb-2`}>
          {daysOfWeek.map((dayName, index) => (
            <div
              key={index}
              className="text-center font-seminbold text-gray-600 py-2"
            >
              {dayName}
            </div>
          ))}
        </div>
        <div className={`${CALENDAR_GRID_CLASSES}`}>
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
            const twoDaysLater = new Date();
            twoDaysLater.setDate(twoDaysLater.getDate()+2);
            twoDaysLater.setHours(0,0,0,0);

            const isDisabled = day.getTime() < twoDaysLater.getTime();
            const isSelected =
              selectedDate && isSameDay(day, selectedDate) && isCurrentMonth;
            const isTodayDate = isToday(day);

            let dayClasses = CALENDER_DAY_CLASSES;

            if (isCurrentMonth) {
              dayClasses += `${CALENDER_DAY_CURRENT_MONTH_CLASSES}`;
            } else {
              dayClasses += `${CALENDER_DAY_OTHER_MONTH_CLASSES}`;
            }
            if (isTodayDate) {
              dayClasses += `${CALENDAR_DAY_TODAY_CLASSES}`;
            }
            if (isSelected) {
              dayClasses += `${CALENDAR_DAY_SELECTED_CLASSES}`;
            }
            if (isDisabled) {
              dayClasses += `${CALENDAR_DAY_DISABLED_CLASSES}`;
            } else {
              dayClasses += `hover:bg-blue-100 cursor-pointer`;
            }
            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`${dayClasses}`}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>
      {selectedDate && (

        <div className="mt-8 p-4 border border-blue-200 rounded-lg bg-blue-50 text-left">
          <p className="text-lg font-semibold text-blue-800 mb-4">
            選択された日付:{formatDateForDisplay(selectedDate)}
          </p>
          <div className="mb-4">
            <label htmlFor="patientName" className={`${LABEL_CLASSES.replace("mb-2","mb-1")} font-semibold`}>お名前: <span className="text-red-500">*</span></label>
            <input 
            type="text"
            id="patientName" 
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="例: 山田 太郎"
            required
            className={`mt-1 text-base ${INPUT_FIELD_CLASSES}`}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="patientPhone" className={`${LABEL_CLASSES.replace("mb-2","mb-1")} font-semibold`}>電話番号:（任意）</label>
            <input 
            type="tel"
            id="patientPhone" 
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="例: 090-1234-5678"
            required
            className={`mt-1 text-base ${INPUT_FIELD_CLASSES}`}
            />
          </div>
          <div className="mb-4">
            <span className="block text-gray-700 font-semibold mb-2">
              種別選択:
            </span>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="visitType"
                  value="first"
                  checked={isFirstVisit === true}
                  onChange={() => setIsFirstVisit(true)}
                  className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-gray-900">初診</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="visitType"
                  value="followup"
                  checked={isFirstVisit === false}
                  onChange={() => setIsFirstVisit(false)}
                  className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-gray-900">再診</span>
              </label>
            </div>
          </div>
          <div className="mb-6">
            <span className="block text-gray-700 font-semibold mb-2">
              時間帯選択:
            </span>
            {loading ? (
              <p className="text-gray-600">予約可能な時間帯を読み込み中...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {ALL_POSSIBLE_TIME_SLOTS.map((time) => {
                  const isAvailable = isSlotAvailable(time, isFirstVisit);
                  const isSelectedTime = selectedTime === time;
                  return (
                    <button
                      onClick={() => isAvailable && setSelectedTime(time)}
                      disabled={!isAvailable}
                      key={time}
                      className={`
                          px-4 py-2 rounded-md text-sm
                            ${
                              selectedTime === time
                                ? "bg-blue-600 text-white"
                                : isAvailable
                                ? " bg-gray-200 hover:bg-gray-300 text-gray-800"
                                : "bg-gray-100 text-gray-500 cursor-not-allowed opacity-60"
                            } 
                              transition duration-150 
                              ${
                                isAvailable
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed"
                              }
                              
                            `}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={handleBooking}
            disabled={!selectedTime}
            className={`w-full py-3 px-6 ${BUTTON_PRIMARY_CLASSES} 
            ${
              !selectedTime|| !isSlotAvailable(selectedTime,isFirstVisit) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loading ? "予約中..." : "この日時で予約する"}
          </button>
        </div>
      )}

    </div>
  );
};

export default BookingPage;
