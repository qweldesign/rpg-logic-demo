// src/domains/Combat/Unit/index.ts

import { Equipments } from '../../Character'

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

  constructor(model: CombatUnitModel, combatId: CombatId) {
    const { name } = model
    this.combatId = combatId
    this.name = name
  }
}
