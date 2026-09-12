// src/domains/Combat/Action/Effects.ts

import { Combat as State } from '../'
import { type Position } from '../Unit'

// 行動実行 (状態変更) を司るクラス / Action.execute から呼び出される
export class CombatActionEffects {
  private state: State

  constructor(state: State) {
    this.state = state
  }

  //「移動」実行
  move(position: Position) {
    this.state.actor.position = position
  }

  //「待機」実行
  wait() {
    // 状態変更なし
  }
}
