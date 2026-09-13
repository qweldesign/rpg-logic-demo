// src/domains/Combat/index.ts

import { type Side, type CombatUnitModel as UnitModel, CombatUnit as Unit } from './Unit'
import { CombatFormation as Formation } from './Formation'
import { CombatAction as Action } from './Action'
import { CombatLog as Log } from './Log'

// 勝敗結果 (未決着は null)
export type CombatResult = 'win' | 'lose' | null

// 全ての情報を集約・管理するクラス
export class Combat {
  public round: number // 経過時間
  public turnIndex: number // 行動順
  public units: Unit[]
  public formation: Formation | null
  public action: Action | null
  public logs: Log[]
  public playLog: () => Promise<void> // Combat 本体から受け取り, ActionStore から呼び出す
  public result: CombatResult // 勝敗結果
  public usedRoster: boolean // 報酬有無
  public rewardCp: number // 報酬Cp
  public rewardGranted: boolean // 報酬付与の二重処理防止

  constructor(models: UnitModel[], playLog: () => Promise<void>, usedRoster: boolean, rewardCp: number) {
    this.round = 1 // 1からカウント
    this.turnIndex = 0 // 開幕前は 0, 開幕と同時に 1 になる
    this.units = models.map((model, i) => {
      return new Unit(model, i + 1) // combatIdは1からカウント
    })
    this.formation = null
    this.action = null
    this.logs = []
    this.playLog = playLog
    this.result = null
    this.usedRoster = usedRoster
    this.rewardCp = rewardCp
    this.rewardGranted = false
  }

  get actor() {
    return this.units[this.turnIndex - 1]
  }

  // 次のターンへ進む
  async nextTurn() {
    // 勝敗判定
    if (this.round > 1) {
      const result = this.judgeResult()
      if (result) {
        this.result = result
        this.logs[0]?.receiveResult(result)
        await this.playLog()
        return
      }
    }
    // 倒れているユニットのターンをパス
    let isAlive = false
    while (!isAlive) {
      this.turnIndex++
      if (this.turnIndex > this.units.length) {
        this.round++
        this.turnIndex -= this.units.length
      }
      isAlive = !this.actor.health.unconscious
    }
    this.formation = new Formation(this.actor, this.units)
    // 前ターンのログを, その行動者の履歴として保持 (Summaryの行動ラベル表示用)
    if (this.logs[0]) this.logs[0].actor.history = this.logs[0]
    // 新しいログを追加
    const newLog = new Log(this.actor)
    this.logs.unshift(newLog)
    // ターン開始ログを表示
    await this.playLog()
    // コマンドパレット初期化
    this.action = new Action(this)
    //　コマンド入力待機
    await this.action.promise.then(() => {
      // 各種状態を更新
      this.actor.defense.nextTurn()
      this.actor.health.nextTurn()
      // 自身を呼び出し, また次のターンへ進む
      this.debug()
      this.nextTurn()
    })
  }

  // 勝敗判定
  // 前衛に生存者 (気絶していない者) が1人もいない陣営があれば, その陣営の敗北とする
  // 開幕直後 (round === 1, 全員が最初の1巡を終えるまで) は判定対象外
  private judgeResult(): CombatResult {
    const hasFrontAlive = (side: Side) => this.units.some(unit => (
      unit.side === side && unit.position !== 'back' && !unit.health.unconscious
    ))
    if (!hasFrontAlive('player')) return 'lose'
    if (!hasFrontAlive('enemy')) return 'win'
    return null
  }

  debug() {
    const { round, turnIndex, units } = this
    console.log({ round, turnIndex, units })
  }
}
