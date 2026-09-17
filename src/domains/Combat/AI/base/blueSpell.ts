// src/domains/Combat/AI/base/blueSpell.ts

import { type Combat as State } from '../..'
import { type CombatUnit as Unit } from '../../Unit'
import { type ActionRequest } from '../../Action/types'

/**
 * 青の魔術師の行動パターン
 * 
 * 1. 集中
 * 技能値が12以上で, かつ集中時間が0ターンなら, 集中
 *
 * 2. 集中時間が1ターン
 * 技能値が13未満なら,「水弾」
 * 技能値が13以上なら, 75% の確率分岐で集中を継続するか,「水弾」
 * 「生命の雫」は NPC は使わない
 * 「ぼんやり」の対象: 敵前衛優先 (いなければ全員), 抵抗値 (pre) が低い対象を優先し, 同じなら中央 (position: center) を優先する
 *
 * 3. 集中時間が2ターン
 * 技能値が14未満なら, 「ぼんやり」
 * 技能値が14以上なら, 50% の確率分岐で「ぼんやり」か「水の鎧」
 * 「水の鎧」の対象: 味方前衛優先 (いなければ全員), defense.dr が低い対象を優先する
 * 
 * 「魔法障壁」「浄化の雨」は NPC は使わない
 * 
 */
export function blueSpell(actor: Unit, state: State): ActionRequest {

  //
  // ここに自動行動を実装する
  //
  
  console.log(actor, state)
  return { key: 'defense', options: {} }
}
