// src/domains/Combat/AI/index.ts

// 自動行動タイプの分類
const TACTIC_TYPE_KEYS = [
  'defender', // 防御優先 (重戦士)
  'attacker', // 攻撃優先 (軽戦士)
  'supporter', // 支援優先 (魔術師)
  'balanced' // バランス (魔戦士)
] as const

export type TacticTypeKey = typeof TACTIC_TYPE_KEYS[number]
