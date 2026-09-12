// src/domains/Combat/Formation/enemy.ts

import { createSamples } from '../../Sample'
import { SaveData } from '../../SaveData'
import { type CombatUnitModel as UnitModel } from '../Unit'

export function enemySetup(saveData: SaveData, seed: number = 0): { models: UnitModel[], rewardCp: number, rewardGold: number } {
  // セーブデータの読み込み
  const cp = saveData.loadPoints()
  // サンプル編成
  const models = createSamples(4, cp, 4, seed).units
    .map(unit => unit.combatUnitModel)
  
  return { models, rewardCp: 2, rewardGold: 100 }
}
