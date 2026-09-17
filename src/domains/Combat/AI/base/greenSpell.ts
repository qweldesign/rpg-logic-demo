// src/domains/Combat/AI/base/greenSpell.ts

import { type Combat as State } from '../..'
import { type CombatUnit as Unit } from '../../Unit'
import { type ActionRequest } from '../../Action/types'

/**
 * 緑の魔術師の行動パターン
 * 
 * 1. 集中
 * 技能値が12以上で, 集中時間が0ターンなら, 集中
 *
 * 2. 集中時間が1ターン
 * 技能値が13未満なら, 50% の確率分岐で「ヘイスト」か「茨の鞭」
 * 技能値が13以上なら, 75% の確率分岐で集中を継続するか, 前と同じ
 * 「ヘイスト」の対象: 味方前衛優先 (いなければ全員), 既に回避UPバフが掛かっている対象がいれば最優先, それ以外は defense.ev が低い対象を優先する
 *
 * 3. 集中時間が2ターン
 * 技能値が15未満なら,「風の刃」
 * 技能値が15以上なら, 75% の確率分岐で集中を継続するか,「風の刃」
 * その前に「盾」が発動する可能性有り
 *
 * 4. 集中時間が3ターン
 * 技能値が16未満なら, 「恐慌」
 * 技能値が16以上なら, 50% の確率分岐で「恐慌」か「竜巻」
 * 「恐慌」の対象: 敵前衛優先 (いなければ全員), 抵抗値 (pre) が低い対象を優先し, 同じなら中央 (position: center) を優先する
 * 
 */
export function greenSpell(actor: Unit, state: State): ActionRequest {

  //
  // ここに自動行動を実装する
  //
  
  console.log(actor, state)
  return { key: 'defense', options: {} }
}
