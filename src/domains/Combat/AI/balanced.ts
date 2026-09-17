// src/domains/Combat/AI/balanced.ts

import { type TacticHandler } from '.'
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

export const balanced: TacticHandler = (actor, state) => {

  //
  // ここに自動行動を実装する
  //
  
  return supporter(actor, state)
}
