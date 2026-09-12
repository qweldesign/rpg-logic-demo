// src/domains/Combat/Enemy/index.ts

import { type WeaponKey, type ShieldKey, type ArmorKey, Equipments } from '../../Character'
import { type CombatUnitModel as UnitModel } from '../Unit'
import { makeGoblinFormation } from './Goblin'

// 敵生成時の基本パラメータ
export type EnemyParams = {
  maxHp: number // 最大Hp
  level: number // 技能値
  dmgMod: number // ダメージ修正
  ev: number // 回避値「よけ」
  pre: number // 身体的な抵抗値
  mre: number // 精神的な抵抗値
}

// 敵生成時の装備
export type EnemyEquips = [
  weapon: WeaponKey, // 武器
  shield: ShieldKey | null, // 盾
  armor: ArmorKey, // 服・鎧
]

export type EnemyDef = {
  name: string
  params: EnemyParams
  equips: EnemyEquips
}

export type EnemyFormationDef = {
  members: EnemyDef[]
  rewardCp: number
}

// ID, 名前, 基本パラメータ, 装備, 法術技能, 自動行動タイプを引数に取って, 敵を生成
export function makeCombatEnemyModel(name: string, params: EnemyParams, equips: EnemyEquips): UnitModel {
  return {
    name,
    maxHp: params.maxHp,
    level: params.level,
    dmgMod: params.dmgMod,
    ev: params.ev,
    pre: params.pre,
    mre: params.mre,
    equipments: new Equipments(...equips)
  }
}

// ランク (0～3) に応じたパラメータバフ
// パラメータは乱数で少しの程度幅を持たせる
export function makeParamsByRank(params: EnemyParams, rank: number): EnemyParams {
  const r1 = Math.floor(Math.random() * 2) // Hp, pre
  const r2 = Math.floor(Math.random() * 2) // level, ev
  const r3 = Math.floor(Math.random() * 2) // dmgMod

  return {
    maxHp: params.maxHp + (rank + r1) * 2,
    level: params.level + (rank + r2),
    dmgMod: params.dmgMod + Math.floor((rank + r3) / 2),
    ev: params.ev + Math.floor((rank + r2) / 2),
    pre: params.pre + Math.floor((rank + r1) / 2),
    mre: params.mre + Math.floor(rank / 2)
  }
}

export { makeGoblinFormation }
