// src/domains/Combat/Action/Availability.ts

import { Combat as State } from '..'
import { type Position } from '../Unit'
import { type SpellElement } from '../Spells'

// 行動可否判定を司るクラス / Action.availability に対応
export class CombatActionAvailability {
  private state: State

  constructor(state: State) {
    this.state = state
  }

  //「準備」実行可否取得
  // 武器が非準備状態であること, かつ幻惑状態ではないこと
  canReady(): boolean {
    return !this.state.actor.attack.ready && !this.state.actor.debuff.dazed
  }

  //「攻撃」「全力攻撃」実行可否基本条件
  // 自身が前方に配置されていること, かつ幻惑状態ではないこと (武器の準備状態は含めない)
  canAttackBase(): boolean {
    return this.state.actor.position !== 'back' && !this.state.actor.debuff.dazed
  }

  //「攻撃」実行可否取得
  // 武器が準備状態, かつ狂戦士状態ではないこと (暫定)
  canAttack(): boolean {
    return this.canAttackBase() && this.state.actor.attack.ready && !this.state.actor.debuff.berserk
  }

  //「全力攻撃」実行可否取得
  canFullPowerAttack(): boolean {
    return this.canAttackBase()
  }
  
  // 「2回攻撃」実行可否取得
  // 攻撃毎に準備を要する武器でないこと
  canDoubleAttack(): boolean {
    return this.canFullPowerAttack() && !this.state.actor.attack.needsReady
  }

  //「牽制」実行可否取得
  // 「攻撃」と同条件
  canFeint(): boolean {
    return this.canAttack()
  }

  //「集中」実行可否取得
  // 該当する系譜の魔法の技能値が11以上であること, かつ幻惑・狂戦士状態ではないこと
  canCast(element: SpellElement): boolean {
    return this.state.actor.spells.level[element] > 10 && !this.state.actor.debuff.dazed && !this.state.actor.debuff.berserk
  }

  //「魔法」実行可否取得
  // 該当する系譜の魔法の集中時間が1以上であること, かつ幻惑・狂戦士状態ではないこと
  canSpell(element: SpellElement): boolean {
    return this.state.actor.spells.cast[element] > 0 && !this.state.actor.debuff.dazed && !this.state.actor.debuff.berserk
  }

  //「全力防御」実行可否取得
  // 狂戦士状態ではないこと
  canDefense(): boolean {
    return !this.state.actor.debuff.berserk
  }

  //「移動」実行可否取得
  // 後退: 自身が後方に配置されていないこと, かつ狂戦士状態ではないこと
  // 前進: そこへ既に他の味方ユニットが配置されていないこと
  canMove(position: Position): boolean {
    const actor = this.state.actor
    const formation = this.state.formation
    if (!formation) return false
    if (position === 'back') {
      if (actor.debuff.berserk) return false
      return formation[actor.side].back[actor.combatId] === null ? true : false
    } else {
      return formation[actor.side].front[position] === null ? true : false
    }
  }

  //「待機」実行可否取得
  canWait(): boolean {
    return false
  }
}
