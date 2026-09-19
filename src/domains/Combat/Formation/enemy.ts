// src/domains/Combat/Formation/enemy.ts

import { createSamples } from '../../Sample'
import { SaveData } from '../../SaveData'
import { type CombatUnitModel as UnitModel } from '../Unit'
import { makeCombatEnemyModel, makeParamsByRank, makeGoblinFormation } from '../Mob'

// Rank算出
export function getRankFromCp(cp: number): number {
  if (cp < 12) return 0
  else if (cp < 16) return 1
  else if (cp < 20) return 2
  else return 3
}

// シード値 0～15 を生成 (ただし, player側と同じシード値は取らない)
export function enemySetup(saveData: SaveData, seed: number = 0): { models: UnitModel[], rewardCp: number, rewardGold: number } {
  // セーブデータの読み込み
  const cp = saveData.loadPoints()

  // ゴブリン編成とエンカウントする確率
  // cp: 10 --> 100%
  // cp: 11 --> 66.6%
  // cp: 12 --> 33.3% (以降固定)
  const rate = 1 - (Math.min(cp, 12) - 10) / 3
  
  // ゴブリン編成
  if (Math.random() < rate) {
    seed %= 4
    const formation = makeGoblinFormation(seed)
    console.log(formation)
    const rank = getRankFromCp(cp)
    const models = formation.map(member => {
      const params = makeParamsByRank(member.params, rank)
      const { name, equips } = member
      return makeCombatEnemyModel(name, params, equips)
    })

    return { models, rewardCp: 1, rewardGold: 50 }
  }

  // サンプル編成
  const models = createSamples(4, cp, 4, seed).units
    .map(unit => unit.combatUnitModel)
  
  return { models, rewardCp: 2, rewardGold: 100 }
}
