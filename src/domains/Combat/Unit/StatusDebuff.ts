// src/domains/Combat/Unit/StatusDebuff.ts

export class CombatStatusDebuff {
  private _berserk: number // 狂戦士
  private _dazed: number // 幻惑
  private _fear: number // 恐慌
  public flashed: number // 目くらみ

  constructor() {
    this._berserk = 0
    this._dazed = 0
    this._fear = 0
    this.flashed = 0
  }

  // 毎ターン残存時間をデクリメント
  nextTurn() {
    this._berserk = Math.max(this._berserk - 1, 0)
    this._dazed = Math.max(this._dazed - 1, 0)
    this._fear = Math.max(this._fear - 1, 0)
    this.flashed = Math.max(this.flashed - 1, 0)
  }

  set berserk(duration: number) {
    this._berserk = duration
  }

  set dazed(duration: number) {
    this._dazed = duration
  }

  set fear(duration: number) {
    this._fear = duration
  }

  // 精神異常 (狂戦士・幻惑・恐慌) が競合した場合の優先順位: 狂戦士 < 幻惑 < 恐慌
  get berserk(): boolean {
    return this._berserk > 0 && !this.dazed && !this.fear
  }

  get dazed(): boolean {
    return this._dazed > 0 && !this.fear
  }

  get fear(): boolean {
    return this._fear > 0
  }

  // Summary 表示用ラベル取得 (該当するデバフを1つ返す)
  get label(): string {
    if (this.berserk) return `狂戦士(${this._berserk})`
    if (this.dazed) return `幻惑(${this._dazed})`
    if (this.fear) return `恐慌(${this._fear})`
    if (this.flashed) return '目くらみ'
    return ''
  }
}
