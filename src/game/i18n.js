// Lớp ngôn ngữ.
//
// Nguồn sự thật là biến ở tầng module, không phải React state - vì các hệ thống game
// (interiors, actions, navigation...) cũng cần dịch chuỗi mà chúng chạy ngoài React.
// Store zustand chỉ giữ một bản sao để component nào đang hiển thị chữ thì re-render.
//
// Prompt trong game được dựng lại mỗi frame bởi updatePrompt/updateInteriors, nên gọi
// t() ngay lúc ghi là đủ: đổi ngôn ngữ giữa ván thì prompt tự đúng lại ở frame sau.

import { STRINGS } from './strings.js'

export const LANGS = ['vi', 'en']
export const DEFAULT_LANG = 'vi'

const STORAGE_KEY = 'splashcity.lang'
const listeners = new Set()

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LANGS.includes(saved)) return saved
  } catch {
    // localStorage bị chặn (chế độ ẩn danh, iframe) - không sao, dùng mặc định.
  }
  return DEFAULT_LANG
}

let current = load()

export function getLang() {
  return current
}

export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return current
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Không lưu được thì chỉ mất việc ghi nhớ, ngôn ngữ vẫn đổi trong phiên này.
  }
  for (const fn of listeners) fn(lang)
  return current
}

export function nextLang() {
  return LANGS[(LANGS.indexOf(current) + 1) % LANGS.length]
}

export function onLangChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Dịch một khoá. `params` điền vào các chỗ {tên} trong câu.
 *
 * Thiếu khoá thì trả về chính khoá đó: chữ lạ hiện lên màn hình dễ phát hiện hơn nhiều
 * so với một khoảng trắng im lặng. Script kiểm tra trong repo cũng bắt được việc này.
 */
export function t(key, params) {
  const entry = STRINGS[key]
  if (!entry) return key

  let text = entry[current] ?? entry[DEFAULT_LANG] ?? key
  if (params) {
    for (const name of Object.keys(params)) {
      text = text.split(`{${name}}`).join(String(params[name]))
    }
  }
  return text
}
