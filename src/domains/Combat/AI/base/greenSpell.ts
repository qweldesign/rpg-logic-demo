// src/domains/Combat/AI/base/greenSpell.ts

import { type Combat as State } from '../..'
import { type CombatUnit as Unit } from '../../Unit'
import { type ActionRequest } from '../../Action/types'
import { chance, pickByPriority, frontOrAll, createSpellActions } from '.'

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
  const element = 'red'
  const skill = actor.spells.level[element]
  const turns = actor.spells.cast[element]
  const { cast, self, enemy } = createSpellActions(actor, state, element)

  // 1. 集中
  if (turns === 0) return cast()

  // 「ヘイスト」の対象選定
  const hasteTarget = pickByPriority(
    frontOrAll(state.action!.target.allies),
    unit => unit.buff.ev === 1 ? 0 : 1,
    unit => unit.defense.dodgeTarget
  )

  const haste = (): ActionRequest => hasteTarget
    ? { key: 'spell', options: { element, spellId: 0 }, target: hasteTarget }
    : { key: 'cast', options: { element } }

  const fearTarget = pickByPriority(
    frontOrAll(state.action!.target.enemies),
    unit => unit.pre,
    unit => unit.position === 'center' ? 0 : 1
  )

  const fear = (): ActionRequest => fearTarget
    ? { key: 'spell', options: { element, spellId: 4 }, target: fearTarget }
    : { key: 'cast', options: { element } }

  // 2. 集中時間が1ターン
  if (turns === 1) {
    if (skill >= 13 && chance(0.75) && !actor.aiFrontCommitted) return cast() // 集中継続
    return chance() ? haste() : enemy(1) // ヘイスト / 茨の鞭
  }

  // 3. 集中時間が2ターン
  if (turns === 2) {
    if (skill >= 15 && chance(0.75) && !actor.aiFrontCommitted) return cast() // 集中継続
    return enemy(2) // 風の刃
  }

  // 4. 集中時間が3ターン
  if (skill >= 16 && chance()) return self(5) // 竜巻
  return fear() // 恐慌
}
