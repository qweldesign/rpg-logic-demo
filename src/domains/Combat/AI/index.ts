// src/domains/Combat/AI/index.ts

import { type Combat as State } from '..'
import { type CombatUnit as Unit } from '../Unit'
import { type ActionRequest } from '../Action/types'
import { defender } from './defender'
import { attacker } from './attacker'
import { supporter } from './supporter'
import { balanced } from './balanced'

// 自動行動タイプの分類
const TACTIC_TYPE_KEYS = [
  'defender', // 防御優先 (重戦士)
  'attacker', // 攻撃優先 (軽戦士)
  'supporter', // 支援優先 (魔術師)
  'balanced' // バランス (魔戦士)
] as const

export type TacticTypeKey = typeof TACTIC_TYPE_KEYS[number]

// 気性タイプの分類
const TEMPER_TYPE_KEYS = [
  'cautious', // 慎重: 防御優先
  'steady', // 堅実: バランス
  'bold', // 大胆: 攻撃優先
  'reckless' // 無謀: 攻撃専心
]

export type TemperTypeKey = typeof TEMPER_TYPE_KEYS[number]

// actor (自身) と state (戦況状態) を受け取り, 今ターンの行動 (ActionRequest) を返す
export type TacticHandler = (actor: Unit, state: State, temperType: TemperTypeKey) => ActionRequest

const TACTIC_HANDLERS: Record<TacticTypeKey, TacticHandler> = {
  defender,
  attacker,
  supporter,
  balanced
}

// Combat から呼び出され, 敵 (NPC) の行動を決定する関数
export function decideAction(actor: Unit, state: State): ActionRequest {
  const tacticType = actor.tacticType ?? 'balanced'
  const temperType = actor.temperType ?? 'bold'
  const handler = TACTIC_HANDLERS[tacticType]
  return handler(actor, state, temperType)
}
