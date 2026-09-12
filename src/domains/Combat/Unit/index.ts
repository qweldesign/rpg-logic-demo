// src/domains/Combat/Unit/index.ts

import { Equipments } from '../../Character'
import { CombatAttack as Attack } from './Attack'
import { type DefenseType, type DefenseTarget, CombatDefense as Defense } from './Defense'

export { type DefenseType, type DefenseTarget }

const combatIds: number[] = [1, 2, 3, 4, 5, 6, 7, 8] as const

// 戦闘ユニットID
export type CombatId = typeof combatIds[number]

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
  public attack: Attack
  public defense: Defense

  constructor(model: CombatUnitModel, combatId: CombatId) {
    const { name } = model
    this.combatId = combatId
    this.name = name
    this.attack = new Attack(model)
    this.defense = new Defense(this, model)
  }
}
