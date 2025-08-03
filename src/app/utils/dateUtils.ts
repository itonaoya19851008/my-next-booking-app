// utils/dateUtils.ts

export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      // ★ この3つの条件が全て揃っているか確認してください
      date1.getFullYear() === date2.getFullYear() && // 年の比較
      date1.getMonth() === date2.getMonth() &&     // 月の比較
      date1.getDate() === date2.getDate()          // 日の比較
    );
  };
export const isToday = (date:Date):boolean =>{
    const today = new Date();
    return isSameDay(date,today);
};

export const addMonths = (date:Date, months:number): Date =>{
    const d = new Date(date);
    d.setMonth(d.getMonth()+months);
    return d;
};


export const formatDateForDisplay = (date:Date):string =>{
    return date.toLocaleDateString('ja-JP',{
        year:'numeric',
        month:'long',
        day:'numeric',
        weekday:'short'
    })
};

export const getDaysInMonth = (year:number,month:number)=>{
    const days: Date[] = [];
    const firstDayOfMonth  = new Date(year,month,1);
    const lastDayOfMonth = new Date(year,month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();

    const diff = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;
    
    const prevMonthLastDay = new Date(year,month,0);
    for(let i = diff ; i > 0; i--){
        const day = new Date(prevMonthLastDay);
        day.setDate(prevMonthLastDay.getDate()-i+1);
        days.push(day);
    };

    for(let i = 1; i <= lastDayOfMonth.getDate(); i++){
        days.push(new Date(year,month,i));
    };

    const remainingCells = 42 - days.length;
    if(remainingCells > 0){
        const newxtMonthFirstDay = new Date(year,month + 1,1);
        for(let i = 0; i < remainingCells; i++){
            const day = new Date(newxtMonthFirstDay);
            day.setDate(newxtMonthFirstDay.getDate()+ i);
            days.push(day);
        }
    };

    return days;

}

export const getSortedDaysOfWeek = ():string[]=>{
    return ['月','火','水','木','金','土','日'];
};

export const getWeekStart = (date:Date):Date =>{
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0) ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0,0,0,0);
    return d;
};

export const formatDateISO = (date:Date):string =>{
    return date.toISOString();
};

export const addWeeks = (date:Date,weeks:number):Date =>{
    const d = new Date(date);
    d.setDate(d.getDate()+(weeks*7));
    return d;
};

export const addYears = (date:Date,years:number):Date =>{
    const d = new Date(date);
    d.setFullYear(d.getFullYear()+years);
    return d;
};

export const toUtcDate = (localDate: Date): Date => {
    return new Date(localDate.toISOString());
  };
  
  /**
   * UTCのISO文字列またはDateオブジェクトから、
   * ローカル日時（例: JST）のDateオブジェクトを生成します。
   * @param utcDateStringOrObject - UTCのISO文字列またはDateオブジェクト
   * @returns ローカルタイムゾーンのDateオブジェクト
   */
  export const fromUtcToLocalDate = (utcDateStringOrObject: string | Date): Date => {
    return new Date(utcDateStringOrObject);
  };
  
  /**
   * 日付のコンポーネント（年、月、日、時、分）が等しいかUTC基準で比較します。
   * 内部で利用するため、JSTからUTCへの変換を意識しません。
   * @param date1 - 比較する最初のDateオブジェクト (UTC想定)
   * @param date2 - 比較する2番目のDateオブジェクト (UTC想定)
   * @returns 日付の構成要素が同じであればtrue
   */
  export const isSameUtcMinute = (date1: Date, date2: Date): boolean => {
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate() &&
      date1.getUTCHours() === date2.getUTCHours() &&
      date1.getUTCMinutes() === date2.getUTCMinutes()
    );
  };