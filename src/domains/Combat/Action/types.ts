// src/domains/Combat/Action/types.ts

import { type DefenseType, type Position, type CombatUnit as Unit } from '../Unit'
import { type Judge, type Score } from '.'
import { type SpellElement, type SpellBuffTarget, type SpellDebuffTarget } from '../Spells'

export const ACTION_KEYS = ['ready', 'attack', 'feint', 'cast', 'spell', 'defense', 'move', 'recovery', 'standup', 'wait'] as const

export const ACTION_LABELS: Record<ActionKey, string> = {
  ready: '準備',
  attack: '攻撃',
  feint: '牽制',
  cast: '集中',
  spell: '魔法',
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

export const FULL_POWER_KEYS = ['none', 'dmg', 'level', 'feint', 'double', 'ready'] as const

export const FULL_POWER_OPTIONS: Record<FullPower, { label: string }> = {
  none: { label: '通常攻撃' },
  dmg: { label: 'ダメージ安定' },
  level: { label: '技能値+4' },
  feint: { label: '牽制即攻撃' },
  double: { label: '2回攻撃' },
  ready: { label: '準備即攻撃' }
} as const

// 行動キー
export type ActionKey = typeof ACTION_KEYS[number]

// 全力攻撃オプション
export type FullPower = typeof FULL_POWER_KEYS[number]

// 行動オプション
export type ActionOptions = {
  position?: Position
  fullPower?: FullPower
  status?: 'berserk' | 'fear'
  element?: SpellElement
  spellId?: number
}

// 行動キーとオプションの組み合わせ
export type ActionRequest =
  | { key: 'ready', options: {} }
  | { key: 'attack', options: { fullPower: FullPower }, target: Unit }
  | { key: 'feint', options: {}, target: Unit }
  | { key: 'cast', options: { element: SpellElement } }
  | { key: 'spell', options: { element: SpellElement, spellId: number }, target: Unit }
  | { key: 'defense', options: {} }
  | { key: 'move', options: { position: Position } }
  | { key: 'recovery', options: {} }
  | { key: 'standup', options: {} }
  | { key: 'wait', options: { status: 'berserk' | 'fear' } }

// 攻撃判定結果
export type AttackResult = Judge & {
  ready: boolean // 攻撃後の武器の準備状態
}

// 防御判定結果
export type DefenseResult = Judge & {
  type: DefenseType
  ready: boolean // 防御後の武器の準備状態
}

// ダメージ判定結果
export type DmgResult = Judge

// 牽制の判定結果
export type FeintResult = Score & {
  target: Unit
}

// 魔法の効果適用結果
export type SpellEffectResult =
  | { kind: 'buff', target: SpellBuffTarget }
  | { kind: 'debuff', target: SpellDebuffTarget, applied: boolean }

// 魔法の判定結果 (暫定: 発動した魔法の名称をログ出力)
export type SpellResult = Judge & {
  spell: string
  effectResults: SpellEffectResult[]
}

// kind: debuffAll
export type DebuffAllResult = Score & {
  target: Unit
  statusTarget: SpellDebuffTarget
}

// 行動実行後の判定結果の定義
export type ActionResult =
  | { type: 'attack', judge: AttackResult }
  | { type: 'defense', judge: DefenseResult }
  | { type: 'dmg', judge: DmgResult }
  | { type: 'feint', judge: FeintResult }
  | { type: 'spell', judge: SpellResult }
  | { type: 'debuffAll', judge: DebuffAllResult }
  | { type: 'recovery', judge: Judge }
  | { type: 'knockedDown', judge: Judge }
  | { type: 'fatal', judge: Judge }
