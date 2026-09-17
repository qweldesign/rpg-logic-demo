// src/domains/Combat/AI/balanced.ts

import { Combat as State } from '..'
import { type Side } from '../Unit'
import { SPELL_ELEMENTS } from '../Spells'
import { type TacticHandler } from '.'
import { base } from './base'
import { supporter } from './supporter'

/**
 * Balanced
 * 基本的には魔法を使って戦うが, 前衛の味方が倒れたら前衛に出て戦う
 * 
 * 1. 前衛への恒久コミット
 * 前衛の味方が1人になった場合, attacker として振る舞う
 *
 * 2. それ以外
 * supporter として振る舞う
 * 
 */

export const balanced: TacticHandler = (actor, state, temperType) => {
  // 前衛への恒久コミットを判定
  const isCasting = SPELL_ELEMENTS.some(element => actor.spells.cast[element] > 0)
  const fromtAllyount = getFrontAllyCount(state, actor.side)
  if (state.round >= 2 && !isCasting && fromtAllyount === 1) {
    actor.aiFrontCommitted = true
  }

  // 1. 前衛への恒久コミットが成立している場合
  if (actor.aiFrontCommitted) {
    return base(actor, state, temperType, 'wing')
  }
  
  // 2. それ以外
  return supporter(actor, state, temperType)
}

// 陣営の前衛 (left/center/right) の人数を取得する
function getFrontAllyCount(state: State, side: Side): number {
  if (!state.formation) return 0
  const formation = state.formation[side]
  return Object.values(formation.front).filter(unit => unit !== null).length
}
