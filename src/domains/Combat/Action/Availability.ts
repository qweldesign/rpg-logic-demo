// src/domains/Combat/Action/Availability.ts

import { Combat as State } from '..'
import { type Position } from '../Unit'

// 行動可否判定を司るクラス / Action.availability に対応
export class CombatActionAvailability {
  private state: State

  constructor(state: State) {
    this.state = state
  }

  //「攻撃」実行可否取得
  // 自身が前方に配置されていること (暫定)
  canAttack(): boolean {
    return this.state.actor.position !== 'back'
  }

  //「全力防御」実行可否取得
  // いつでも (暫定)
  canDefense(): boolean {
    return true
  }

  //「移動」実行可否取得
  // 後退: 自身が後方に配置されていないこと
  // 前進: そこへ既に他の味方ユニットが配置されていないこと
  canMove(position: Position): boolean {
    const actor = this.state.actor
    if (!this.state.formation) return false
    if (position === 'back') {
      return this.state.formation[actor.side].back[actor.combatId] === null ? true : false
    } else {
      return this.state.formation[actor.side].front[position] === null ? true : false
    }
  }

  //「待機」実行可否取得
  canWait(): boolean {
    return true
  }
}
