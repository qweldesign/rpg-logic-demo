// src/domains/Combat/Action/index.ts

import { Combat as State } from '../'
import { POSITION_KEYS } from '../Unit'
import { ACTION_KEYS, ACTION_LABELS, POSITION_LABELS, type ActionKey, type ActionOptions, type ActionRequest } from './types'
import { CombatActionAvailability as Availability } from './Availability'
import { CombatActionEffects as Effects } from './Effects'

export { ACTION_KEYS, ACTION_LABELS, POSITION_LABELS, type ActionKey, type ActionOptions, type ActionRequest }

// 行動の管理を司るクラス / Actionコンポーネントに対応
export class CombatAction {
  private state: State
  public round: number
  public unlocked: boolean // コマンドパレットのロック状態 → Actions にて検知
  public promise: Promise<void>
  private resolve!: () => void
  private readonly availabilityChecker: Availability
  private readonly effects: Effects

  constructor(state: State) {
    this.state = state
    this.round = state.round
    this.unlocked = true // コマンドパレットをアンロック
    this.availabilityChecker = new Availability(state)
    this.effects = new Effects(state)

    // ターン終了を Promise で State に伝え, 次のターンへ進む
    this.promise = new Promise(resolve => {
      this.resolve = resolve
    })
  }

  get actor() {
    return this.state.actor
  }

  // 実行可否
  get availability() {
    return {
      move: POSITION_KEYS.reduce((acc, position) => {
        acc[position] = this.availabilityChecker.canMove(position)
        return acc
      }, {} as Record<typeof POSITION_KEYS[number], boolean>),
      wait: this.availabilityChecker.canWait()
    }
  }

  // 実行
  // ActionRequest のプロパティ (key, options) を引数に取って処理を進め,
  // ActionResult の配列を Log に渡し, 再生して次のターンへ移る
  async execute (action: ActionRequest) {
    // コマンドパレットをロック (アンロックはコンストラクタで行われる)
    this.unlocked = false

    // 行動実行
    switch (action.key) {
      case 'move':
        this.effects.move(action.options.position)
        break

      default: // case 'wait':
        this.effects.wait()
    }

    // ログを更新
    const log = this.state.logs[0]
    log.receiveResults(action)

    // 行動終了
    await this.state.playLog() // ログの再生完了を待つ
    this.resolve()
  }
}
