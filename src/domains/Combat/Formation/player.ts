// src/domains/Combat/Formation/player.ts

import { Character } from '../../Character'
import { createSamples } from '../../Sample'
import { SaveData } from '../../SaveData'
import { type CombatUnitModel as UnitModel } from '../Unit'

export function playerSetup(saveData: SaveData): { models: UnitModel[], seed: number, usedRoster: boolean } {
  // セーブデータの読み込み
  const keys = saveData.loadKeys()
  const cp = saveData.loadPoints()
  const ids = saveData.loadFormation()

  // 出撃スロットが満たされている場合, 編成したPTで戦闘へ臨む
  if (keys.size >= 4 && ids.length === 4 && !ids.some(id => id === null)) {
    const units = ids.map(id => new Character(saveData.loadModel(String(id).padStart(2, '0'))))
    return {
      models: units.map(unit => unit.combatUnitModel),
      seed: saveData.loadSeed(),
      usedRoster: true
    }
  }

  // フォールバック: ランダムサンプル
  const samples = createSamples(4, cp, 0)
  return {
    models: samples.units.map(unit => unit.combatUnitModel),
    seed: samples.seed,
    usedRoster: false
  }
}
