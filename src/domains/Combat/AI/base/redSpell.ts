// src/domains/Combat/AI/base/redSpell.ts

import { type Combat as State } from '../..'
import { type CombatUnit as Unit } from '../../Unit'
import { type ActionRequest } from '../../Action/types'

/**
 * 赤の魔術師の行動パターン
 * 
 * 1. 集中
 * 技能値が12以上で, 集中時間が0ターンなら, 集中
 *
 * 2. 集中時間が1ターン
 * 技能値が13未満なら, 50% の確率分岐で「ヒロイズム」か「閃光」
 * 技能値が13以上なら, 75% の確率分岐で集中を継続するか, 前と同じ
 * 「ヒロイズム」の対象: 味方前衛優先 (いなければ全員), attack.level が低い対象を優先する
 *
 * 3. 集中時間が2ターン
 * 技能値が14未満なら,「火球」
 * 技能値が14なら,「炎の嵐」
 * 技能値が15以上なら, 75% の確率分岐で集中を継続するか,「炎の嵐」
 *
 * 4. 集中時間が3ターン
 * 技能値が16未満なら,「聖戦」
 * 技能値が16以上なら, 50% の確率分岐で「聖戦」か「召雷」
 * 
 */
export function redSpell(actor: Unit, state: State): ActionRequest {

  //
  // ここに自動行動を実装する
  //
  
  console.log(actor, state)
  return { key: 'defense', options: {} }
}
