// src/domains/Combat/AI/base/blueSpell.ts

import { type Combat as State } from '../..'
import { type CombatUnit as Unit } from '../../Unit'
import { type ActionRequest } from '../../Action/types'
import { chance, pickByPriority, frontOrAll, createSpellActions } from '.'

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
  const element = 'blue'
  const skill = actor.spells.level[element]
  const turns = actor.spells.cast[element]
  const { cast, enemy } = createSpellActions(actor, state, element)

  // 1. 集中
  if (turns === 0) return cast()
    
  // 「ぼんやり」の対象選定
  const dazedTarget = pickByPriority(
    frontOrAll(state.action!.target.enemies),
    unit => unit.pre,
    unit => unit.position === 'center' ? 0 : 1
  )

  const dazed = (): ActionRequest => dazedTarget
    ? { key: 'spell', options: { element, spellId: 2 }, target: dazedTarget }
    : { key: 'cast', options: { element } }

  // 「水の鎧」の対象選定
  const protectTarget = pickByPriority(
    frontOrAll(state.action!.target.allies),
    unit => unit.defense.dr
  )

  const protect = (): ActionRequest => protectTarget
    ? { key: 'spell', options: { element, spellId: 3 }, target: protectTarget }
    : { key: 'cast', options: { element } }

  // 2. 集中時間が1ターン
  if (turns === 1) {
    if (skill >= 13 && chance(0.75)) return cast() // 集中継続
    return enemy(1) // 水弾
  }

  // 3. 集中時間が2ターン
  if (skill >= 14) return chance() ? dazed() : protect() // ぼんやり / 水の鎧
  return dazed() // ぼんやり
}
