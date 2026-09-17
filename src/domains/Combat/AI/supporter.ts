// src/domains/Combat/AI/supporter.ts

import { type TacticHandler } from '.'
import { base } from './base'
import { blueSpell } from './base/blueSpell'
import { redSpell } from './base/redSpell'
import { greenSpell } from './base/greenSpell'
import { SPELL_ELEMENTS } from '../Spells'

/**
 * Supporter
 * 基本的に後衛から動かず, 魔法を使って戦う
 *
 * 1. 狂戦士状態
 * attacker として振る舞う
 *
 * 2. 移動 (狂戦士状態の解除後)
 * 前衛に出たままなら, 後衛へ戻る
 *
 * 3. 集中中の系譜への委譲
 * 集中時間が0ターンなら, 均等な確率分岐で, いずれかの保有している系譜の魔法の精神集中を開始する
 * 各系譜の魔術師の行動パターンを参照
 * 
 */

export const supporter: TacticHandler = (actor, state, temperType) => {
  // 1. 狂戦士状態
  if (actor.debuff.berserk) {
    return base(actor, state, temperType, 'wing')
  }

  // 2. 移動 (狂戦士状態の解除後)
  if (actor.position !== 'back') {
    return { key: 'move', options: { position: 'back' }, targets: [] }
  }

  // 3. 集中中の系譜への委譲
  if (actor.spells.cast.blue > 0) return blueSpell(actor, state)
  if (actor.spells.cast.red > 0) return redSpell(actor, state)
  if (actor.spells.cast.green > 0) return greenSpell(actor, state)

  const elements = SPELL_ELEMENTS.filter(element => actor.spells.level[element] >= 12 ? true : false)
  const r = Math.floor(Math.random() * elements.length)
  const selected = elements[r]

  if (selected === 'blue') return blueSpell(actor, state)
  if (selected === 'red') return redSpell(actor, state)
  if (selected === 'green') return greenSpell(actor, state)

  // 安全装置
  return base(actor, state, temperType, 'wing')
}
