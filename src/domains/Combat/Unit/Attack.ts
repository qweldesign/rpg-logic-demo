// src/domains/Combat/Unit/Attack.ts

import { type Dmg } from '../../Character'
import { type CombatUnitModel as UnitModel, type CombatUnit as Unit } from '.'

// 牽制の定義
export type Feint = {
  currentTurn: boolean // true: 牽制を行ったターン (まだ適用されない), false: 次ターン以降 (適用可能)
  target: Unit
  score: number
}

export class CombatAttack {
  // 設定値
  public name: string
  public level: number // 大盾による修正込み
  public dmg: Dmg
  public dmgName: string
  public needsReady: boolean
  // 状態値
  public feint: Feint | null
  public ready: boolean // 準備の可否

  constructor(model: UnitModel) {
    this.name = model.equipments.weapon.name
    this.level = model.level
    this.dmg = model.equipments.getDmg(model.dmgMod)
    this.dmgName = model.equipments.getDmgName(model.dmgMod)
    this.needsReady = model.equipments.weapon.ready
    this.feint = null
    this.ready = true
  }

  nextTurn() {
    if (this.feint && this.feint.currentTurn) {
      // 牽制を行ったターンが終わったので, 次ターンに適用可能な状態としてマークする
      this.feint.currentTurn = false
    } else if (this.feint) {
      // 適用されないまま次のターンを迎えたので, 牽制を破棄する
      this.feint = null
    }
  }

  // 攻撃 (命中判定) の目標値を取得
  // 各種状況による修正値 (バフ, デバフ, 全力攻撃オプションによる修正等) を含めない
  get target(): number {
    return Math.max(4, this.level)
  }

  // 攻撃 (命中判定) の目標値を取得
  // 各種状況による修正値 (バフ, デバフ, 全力攻撃オプションによる修正等) を含める
  getTarget(): number {
    return Math.max(4, this.target)
  }

  // 攻撃型によるダメージ倍率を取得
  getDmgRate(): number {
    return this.dmg.dmgType === 2 ? 2 : this.dmg.dmgType === 1 ? 1.5 : 1
  }

  // 攻撃 (ダメージ判定) の期待値を取得
  getExpectedDmg(dr: number = 0, isChain: boolean = false) {
    const count = this.dmg.dmgDice
    const mod = this.dmg.dmgMod - (isChain ? Math.floor(dr / 2) : dr)
    const rate = this.getDmgRate()
    return Math.max(0, Math.floor((count * 3.5 + mod) * rate))
  }
}
