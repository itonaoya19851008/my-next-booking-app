// constants/tailwindClasses.ts

// ===========================================
// UIコンテナ関連
// ===========================================
// 汎用的なカードスタイル (認証ページやダッシュボードのメインコンテナなど)
export const CARD_CONTAINER_CLASSES = `
  p-8 rounded-lg shadow-lg bg-white
`

// ページ全体の中央配置コンテナ (認証ページやダッシュボードの親div)
export const PAGE_CENTER_CONTAINER_CLASSES = `
  min-h-screen flex items-center justify-center bg-gray-100 p-4
`

// ===========================================
// ボタン関連
// ===========================================
// ボタンの基本スタイル
export const BUTTON_BASE_CLASSES = `
  py-3 px-6 text-white font-semibold rounded-md
  transition duration-300
  disabled:opacity-50 disabled:cursor-not-allowed
  cursor-pointer 
`

// プライマリボタン (ログインボタンなど)
export const BUTTON_PRIMARY_CLASSES = `${BUTTON_BASE_CLASSES} bg-gray-800 hover:bg-gray-900`;

// セカンダリボタン (新規登録ボタンなど)
export const BUTTON_SECONDARY_CLASSES = `${BUTTON_BASE_CLASSES} bg-gray-600 hover:bg-gray-700`;

// デンジャーボタン (ログアウトボタンなど)
export const BUTTON_DANGER_CLASSES = `${BUTTON_BASE_CLASSES} bg-red-600 hover:bg-red-700`;

// ===========================================
// フォーム入力関連
// ===========================================
// 汎用的な入力フィールドのスタイル
export const INPUT_FIELD_CLASSES = `
  w-full p-3 border border-gray-300 rounded-md
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`

// ラベルのスタイル
export const LABEL_CLASSES = `
  block mb-2 font-medium text-gray-700
`

// ===========================================
// テキスト/タイトル関連
// ===========================================
// ページのメインタイトル
export const PAGE_TITLE_CLASSES = `
  text-3xl font-bold text-center mb-6 text-gray-800
`

// 説明テキスト
export const DESCRIPTION_TEXT_CLASSES = `
  text-center mb-8 text-gray-600
`

// メッセージ表示テキスト
export const MESSAGE_TEXT_CLASSES = `
  mt-6 text-center text-lg text-gray-700
`

// ===========================================
// カレンダー関連 (AdminTimeslotsPage用)
// ===========================================
// カレンダーグリッドのセル（時間帯）
export const TIMESLOT_CELL_CLASSES = `
  p-2 bg-blue-50 hover:bg-blue-100 cursor-pointer
  border-b border-r border-gray-200 last:border-r-0
`

// カレンダーのヘッダーセル（曜日/日付、時間）
export const CALENDAR_HEADER_CELL_CLASSES = `
  p-2 bg-gray-200 text-center font-bold border-b border-gray-300
`

// カレンダーの時間帯ラベルセル（左端）
export const CALENDAR_TIME_LABEL_CLASSES = `
  p-2 bg-gray-200 text-right font-semibold border-r border-gray-300
`
// カレンダーヘッダー（年月表示と、月移動ボタン）
export const CALENDAR_HEADER_CLASSES = `
  flex justify-between items-center
`
// カレンダーコンテナのボーダー
export const CALENDAR_GRID_CONTAINER_CLASSES = `
  grid gap-1 border border-gray-300 rounded-lg overflow-hidden
`

export const CALENDAR_GRID_CLASSES = `
  grid grid-cols-7 gap-2
`

export const CALENDER_DAY_CLASSES = `
  p-2 border border-gray-200 rounded text-center cursor-pointer
`

export const CALENDER_DAY_CURRENT_MONTH_CLASSES = `
  bg-white text-gray-800
`

export const CALENDER_DAY_OTHER_MONTH_CLASSES = `
  bg-gray-50 text-gray-400
`

export const CALENDAR_DAY_SELECTED_CLASSES = `
  !bg-blue-500 !text-white font-bold ring-2 ring-blue-500
`

// 今日の日のスタイル
export const CALENDAR_DAY_TODAY_CLASSES = `
  border-blue-500 ring-2 ring-blue-500
`

// 無効な日（過去の日付など）のスタイル
export const CALENDAR_DAY_DISABLED_CLASSES = `
  bg-gray-100 text-gray-400 cursor-not-allowed opacity-60
`
// ===========================================
// ローディングスピナー関連
// ===========================================
// ロード中のスピナー付きテキストのコンテナ
export const LOADING_SPINNER_TEXT_CONTAINER_CLASSES = `
  flex items-center justify-center
  text-xl font-semibold text-gray-700
`

// ロード中のスピナー要素
export const LOADING_SPINNER_CLASSES = `
  w-6 h-6 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin
`