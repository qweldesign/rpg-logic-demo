// src/domains/Combat/Action/Effects.ts

import { Combat as State } from '../'
import { type Position, type CombatUnit as Unit } from '../Unit'
import { type ActionResult, judgeAttack, judgeDefense, rollDmg, judgeKnockedDown } from '.'

// 行動実行 (状態変更) を司るクラス / Action.execute から呼び出される
export class CombatActionEffects {
  private state: State

  constructor(state: State) {
    this.state = state
  }

  //「攻撃」実行 (判定結果に基づき, HPへのダメージ反映と朦朧・転倒・気絶までを処理する)
  attack(target: Unit): ActionResult[] {
    const results: ActionResult[] = []
    const actor = this.state.actor

    // 攻撃判定
    const attackJudge = judgeAttack(actor)
    results.push({ type: 'attack', judge: attackJudge })
    if (!attackJudge.success) return results // 攻撃失敗時はここで処理を止める

    // 防御判定 (攻撃判定がクリティカルであればスキップ)
    if (!attackJudge.critical) {
      const defenseJudge = judgeDefense(target)
      results.push({ type: 'defense', judge: defenseJudge })
      if (defenseJudge.success) return results // 防御成功時はここで処理を止める
    }

    // ダメージ判定
    const dmgJudge = rollDmg(actor, target)
    results.push({ type: 'dmg', judge: dmgJudge })

    if (!dmgJudge.success) return results // ダメージが通らなかった時はここで処理を止める

    // ダメージ効果
    target.health.injury += dmgJudge.roll

    // 朦朧状態・転倒判定
    // 朦朧状態への状態遷移は Health に委譲
    if (target.health.stunned) {
      const knockedDownJudge = judgeKnockedDown(target)
      results.push({ type: 'knockedDown', judge: knockedDownJudge })
      if (!knockedDownJudge.success) {
        target.health.prone = true // 転倒
      }
    }

    // 気絶
    // 気絶への状態遷移は Health に委譲
    if (target.health.unconscious) {
      results.push({ type: 'unconscious' })
    }

    return results
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
