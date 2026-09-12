// src/domains/Combat/Action/types.ts

import { type DefenseType, type Position, type CombatUnit as Unit } from '../Unit'
import { type Judge } from '.'

export const ACTION_KEYS = ['attack', 'move', 'wait'] as const

export const ACTION_LABELS: Record<ActionKey, string> = {
  attack: '攻撃',
  move: '移動',
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
  | { key: 'move', options: { position: Position }, targets: [] }
  | { key: 'wait', options: {}, targets: [] }

// 攻撃判定結果
export type AttackResult = Judge

// 防御判定結果
export type DefenseResult = Judge & {
  type: DefenseType
}

// ダメージ判定結果
export type DmgResult = Judge

// 行動実行後の判定結果の定義
export type ActionResult =
  | { type: 'attack', judge: AttackResult }
  | { type: 'defense', judge: DefenseResult }
  | { type: 'dmg', judge: DmgResult }
  | { type: 'knockedDown', judge: Judge }
  | { type: 'unconscious' }
