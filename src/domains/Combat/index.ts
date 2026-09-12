// src/domains/Combat/index.ts

import { type CombatUnitModel as UnitModel, CombatUnit as Unit } from './Unit'
import { CombatFormation as Formation } from './Formation'
import { CombatAction as Action } from './Action'
import { CombatLog as Log } from './Log'

// 全ての情報を集約・管理するクラス
export class Combat {
  public round: number // 経過時間
  public turnIndex: number // 行動順
  public units: Unit[]
  public formation: Formation | null
  public action: Action | null
  public logs: Log[]
  public playLog: () => Promise<void> // Combat 本体から受け取り, ActionStore から呼び出す

  constructor(models: UnitModel[], playLog: () => Promise<void>) {
    this.round = 1 // 1からカウント
    this.turnIndex = 0 // 開幕前は 0, 開幕と同時に 1 になる
    this.units = models.map((model, i) => {
      return new Unit(model, i + 1) // combatId は 1 からカウント
    })
    this.formation = null
    this.action = null
    this.logs = []
    this.playLog = playLog
  }

  get actor() {
    return this.units[this.turnIndex - 1]
  }

  // 次のターンへ進む
  async nextTurn() {
    this.advanceTurn()
    await this.startTurn()
    await this.waitForCommand()
  }

  // turnIndex / round を進める
  private advanceTurn(): void {
    this.turnIndex++
    if (this.turnIndex > this.units.length) {
      this.round++
      this.turnIndex -= this.units.length
    }
  }

  // 新しいターンの開始処理
  // formation, log, action 初期化
  private async startTurn(): Promise<void> {
    this.formation = new Formation(this.actor, this.units)
    // 前ターンのログを, その行動者の履歴として保持 (Summaryの行動ラベル表示用)
    if (this.logs[0]) this.logs[0].actor.history = this.logs[0]
    this.logs.unshift(new Log(this.actor))
    await this.playLog()
    this.action = new Action(this)
  }

  // コマンド入力待機 → 状態更新 → 次のターンへ再帰
  private async waitForCommand(): Promise<void> {
    await this.action!.promise.then(() => {
      this.debug()
      this.nextTurn()
    })
  }

  debug() {
    const { round, turnIndex, units } = this
    console.log({ round, turnIndex, units })
  }
}
