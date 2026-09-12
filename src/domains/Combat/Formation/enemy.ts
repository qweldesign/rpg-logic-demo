// src/domains/Combat/Formation/enemy.ts

import { createSamples } from '../../Sample'
import { SaveData } from '../../SaveData'
import { type CombatUnitModel as UnitModel } from '../Unit'
import { makeCombatEnemyModel, makeParamsByRank, makeGoblinFormation } from '../Enemy'

// Rank算出
export function getRankFromCp(cp: number): number {
  if (cp < 12) return 0
  else if (cp < 16) return 1
  else if (cp < 20) return 2
  else return 3
}

export function enemySetup(saveData: SaveData, enemy: string = 'sample', seed: number = 0): { models: UnitModel[], rewardCp: number } {
  // セーブデータの読み込み
  const cp = saveData.loadPoints()
  
  // ゴブリン編成
  if (enemy === 'goblin') {
    const formation = makeGoblinFormation()
    const rank = getRankFromCp(cp)
    const models = formation.members.map((member) => {
      const params = makeParamsByRank(member.params, rank)
      const { name, equips } = member
      return makeCombatEnemyModel(name, params, equips)
    })

    const { rewardCp } = formation

    return { models, rewardCp: rewardCp }
  }

  // サンプル編成
  const models = createSamples(4, cp, 4, seed).units
    .map(unit => unit.combatUnitModel)
  
  return { models, rewardCp: 2 }
}
