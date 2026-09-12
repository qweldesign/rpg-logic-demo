// src/domains/Combat/Unit/Health.ts

import { CombatUnit as Unit } from '../Unit'

export class CombatHealth {
  private self: Unit
  public maxHp: number
  private _injury: number // 負傷 (HPの減少)
  public stunned: boolean // 朦朧状態
  public standupTurn: boolean // 立ち上がったターン
  public prone: boolean // 転倒
  public unconscious: boolean // 気絶

  constructor(self: Unit, maxHp: number) {
    this.self = self
    this.maxHp = maxHp
    this._injury = 0
    this.stunned = false
    this.standupTurn = false
    this.prone = false
    this.unconscious = false
  }

  // 次のターンに進む際に, 「立ち上がり」を完了する
  nextTurn() {
    if (this.standupTurn) this.prone = false
    this.standupTurn = false
  }

  // ダメージ効果 (判定不要の処理はここで解決する)
  set injury(newInjury: number) {
    const dmg = newInjury - this._injury
    // 一撃のダメージが最大HPの半分以上の場合, 自動的に朦朧状態に陥る
    if (dmg >= this.maxHp / 2) {
      this.stunned = true
    }

    // 負傷が最大HPに達した場合, 自動的に気絶する
    if (newInjury >= this.maxHp) {
      this.prone = true
      this.unconscious = true
      this.self.position = 'back' // 戦線から外す
    }

    this._injury = newInjury
  }

  // 負傷
  get injury() {
    return this._injury
  }

  // Hp
  get Hp() {
    return Math.max(this.maxHp - this._injury, 0)
  }

  // 状態: 残HP比率によるUI表示用の段階 (stunned/unconscious とは別の判定軸)
  get condition() {
    const ratio = this.Hp / this.maxHp
    if (ratio === 0) return 'unconscious'
    else if (ratio < 1 / 3) return 'stunned'
    else if (ratio < 2 / 3) return 'injured'
    else return 'normal'
  }

  // Summary 表示用ラベル取得 (深刻度が高い状態を優先して1つ返す)
  get label(): string {
    if (this.unconscious) return '気絶'
    if (this.prone) return '転倒'
    if (this.stunned) return '朦朧状態'
    return ''
  }
}
