// src/domains/Combat/Action/types.ts

import { type DefenseType, type Position, type CombatUnit as Unit } from '../Unit'
import { type Judge, type Score } from '.'

export const ACTION_KEYS = ['attack', 'feint', 'defense', 'move', 'recovery', 'standup', 'wait'] as const

export const ACTION_LABELS: Record<ActionKey, string> = {
  attack: '攻撃',
  feint: '牽制',
  defense: '全力防御',
  move: '移動',
  recovery: '回復',
  standup: '立ち上がり',
  wait: '待機'
} as const

export const POSITION_LABELS: Record<Position, string> = {
  back: '後方',
  left: '左翼',
  center: '中央',
  right: '右翼'
} as const

// 行動キー
export type ActionKey = typeof ACTION_KEYS[number]

// 行動オプション
export type ActionOptions = {
  position?: Position
}

// 行動キーとオプションの組み合わせ
export type ActionRequest =
  | { key: 'attack', options: {}, targets: [Unit] }
  | { key: 'feint', options: {}, targets: [Unit] }
  | { key: 'defense', options: {}, targets: [] }
  | { key: 'move', options: { position: Position }, targets: [] }
  | { key: 'recovery', options: {}, targets: [] }
  | { key: 'standup', options: {}, targets: [] }
  | { key: 'wait', options: {}, targets: [] }

// 攻撃判定結果
export type AttackResult = Judge

// 防御判定結果
export type DefenseResult = Judge & {
  type: DefenseType
}

// ダメージ判定結果
export type DmgResult = Judge

// 牽制の判定結果
export type FeintResult = Score & {
  target: Unit
}

// 行動実行後の判定結果の定義
export type ActionResult =
  | { type: 'attack', judge: AttackResult }
  | { type: 'defense', judge: DefenseResult }
  | { type: 'dmg', judge: DmgResult }
  | { type: 'feint', judge: FeintResult }
  | { type: 'recovery', judge: Judge }
  | { type: 'knockedDown', judge: Judge }
  | { type: 'unconscious' }
