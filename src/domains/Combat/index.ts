// src/domains/Combat/index.ts

import { type Side, type CombatUnitModel as UnitModel, CombatUnit as Unit } from './Unit'
import { CombatFormation as Formation } from './Formation'
import { CombatAction as Action } from './Action'
import { CombatLog as Log } from './Log'
import { decideAction } from './AI'

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
  public rewardGold: number // 報酬金
  public rewardGranted: boolean // 報酬付与の二重処理防止
  public deadExpelled: boolean // 死亡ユニット除名の二重処理防止

  constructor(models: UnitModel[], playLog: () => Promise<void>, usedRoster: boolean, rewardCp: number, rewardGold: number) {
    this.round = 1 // 1からカウント
    this.turnIndex = 0 // 開幕前は 0, 開幕と同時に 1 になる
    this.units = models.map((model, i) => {
      return new Unit(model, i + 1) // combatId は 1 からカウント
    })
    this.formation = null
    this.action = null
    this.logs = []
    this.playLog = playLog
    this.result = null
    this.usedRoster = usedRoster
    this.rewardCp = rewardCp
    this.rewardGold = rewardGold
    this.rewardGranted = false
    this.deadExpelled = false
  }

  get actor() {
    return this.units[this.turnIndex - 1]
  }

  // 次のターンへ進む
  async nextTurn() {
    if (this.checkResult()) {
      await this.playLog()
      return
    }
    this.advanceTurn()
    await this.startTurn()
    await this.runOpeningActions()
    await this.runEnemyTurn()
    await this.waitForCommand()
  }

  // 勝敗判定
  // 決着していれば result, log へ反映して true を返す
  private checkResult(): boolean {
    if (this.round <= 1) return false
    const result = this.judgeResult()
    if (!result) return false
    this.result = result
    this.logs[0]?.receiveResult(result)
    return true
  }

  // turnIndex / round を進める
  // 倒れているユニットのターンをパス 
  private advanceTurn(): void {
    let isAlive = false
    while (!isAlive) {
      this.turnIndex++
      if (this.turnIndex > this.units.length) {
        this.round++
        this.turnIndex -= this.units.length
      }
      isAlive = !this.actor.health.unconscious
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

  // 開幕時の自動実行
  // 朦朧回復・立ち上がりの完了を待つ
  private async runOpeningActions(): Promise<void> {
    await this.action!.ready
  }

  // 敵 (NPC) の自動行動ループ
  private async runEnemyTurn(): Promise<void> {
    while (this.action!.unlocked && this.actor.side === 'enemy') {
      const request = decideAction(this.actor, this)
      await this.action!.execute(request)
    }
  }

  // コマンド入力待機 → 状態更新 → 次のターンへ再帰
  private async waitForCommand(): Promise<void> {
    await this.action!.promise.then(() => {
      this.actor.nextTurn()
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
