// src/domains/Combat/Unit/index.ts

import { Equipments } from '../../Character'
import { CombatAttack as Attack } from './Attack'
import { type DefenseType, type DefenseTarget, CombatDefense as Defense } from './Defense'
import { CombatHealth as Health } from './Health'
import { type CombatLog as Log } from '../Log'

export { type DefenseType, type DefenseTarget }

const combatIds: number[] = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const SIDE_KEYS = ['player', 'enemy'] as const

export const POSITION_KEYS = ['back', 'left', 'center', 'right'] as const

// 戦闘ユニットID
export type CombatId = typeof combatIds[number]

// 戦闘ユニットの所属
export type Side = typeof SIDE_KEYS[number]

// 戦闘ユニットの配置
export type Position = typeof POSITION_KEYS[number]

// 戦闘ユニットモデル
export type CombatUnitModel = {
  name: string
  maxHp: number
  level: number
  dmgMod: number
  ev: number
  pre: number
  mre: number
  equipments: Equipments
}

// 戦闘ユニットを司るクラス
export class CombatUnit {
  public combatId: CombatId
  public name: string
  public side: Side
  public position: Position
  public attack: Attack
  public defense: Defense
  public health: Health
  public history: Log | null // 直近の自ターンの行動ログ (Summary表示用)

  constructor(model: CombatUnitModel, combatId: CombatId) {
    const { name, maxHp } = model
    this.combatId = combatId
    this.name = name
    this.side = combatId <= 4 ? 'player' : 'enemy'
    this.position = 'back'
    this.attack = new Attack(model)
    this.defense = new Defense(this, model)
    this.health = new Health(maxHp)
    this.history = null
  }
}
