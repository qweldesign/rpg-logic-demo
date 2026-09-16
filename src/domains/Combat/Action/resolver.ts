// src/domains/Combat/Action/resolver.ts

import { type CombatUnit as Unit } from '../Unit'
import { type CombatFormation as Formation } from '../Formation'
import { type Judge, type Score, getRoll, judge, score, type FullPower, type AttackResult, type DefenseResult, type DmgResult, type FeintResult, type SpellResult } from '.'
import { SPELL_LIST, type SpellElement } from '../Spells'

// 攻撃の判定結果を返す
export function judgeAttack(actor: Unit, fullPower: FullPower): Omit<AttackResult, 'ready'> {
  const attackTarget = actor.attack.getTarget(fullPower)
  return judge(attackTarget)
}

// 防御の判定結果を配列で返す
// 可能な防御のうちで, 最も成功率の高い防御を自動選択する
// 全力防御選択中は, 最初の防御に失敗しても, 残り試行回数の範囲で別の防御を続けて試みる
// いずれかが成功すればそこで処理を終了する
export function judgeDefense(actor: Unit, target: Unit, isShoot: boolean = false, extraMod: number = 0): Omit<DefenseResult, 'ready'>[] {
  const defense = target.defense
  const maxAttempts = defense.isFullDefense ? 2 : 1
  const results = []

  if (defense.canBlock) {
    const blockResult = { ...judge(defense.getBlockTarget(actor, isShoot, extraMod)), type: 'block' as const }
    results.push(blockResult)
    if (blockResult.success) return results
  }

  if (!isShoot && defense.canParry && results.length < maxAttempts) {
    const parryResult = { ...judge(defense.getParryTarget(actor, isShoot, extraMod)), type: 'parry' as const }
    results.push(parryResult)
    if (parryResult.success) return results
  }

  if (results.length < maxAttempts) {
    const dodgeResult = { ...judge(defense.getDodgeTarget(actor, isShoot, extraMod)), type: 'dodge' as const }
    results.push(dodgeResult)
  }
  return results
}

// 射撃・範囲魔法 (kind: trip / dmg / dmgAll / flash) に対する防御判定を配列で返す
// 射撃に対する防御判定 (受け不可, 止め -2 , 牽制効果排除) を適用する
export function judgeShootDefense(actor: Unit, target: Unit, extraMod: number = 0): Array<Omit<DefenseResult, 'ready'>> {
  return judgeDefense(actor, target, true, extraMod)
}

// 魔法による防御判定結果
export function judgeSpellDefense(target: Unit): Judge {
  return judge(target.spells.level.green) // 緑の魔法「風の盾」
}

// ダメージの判定結果を返す
export function rollDmg(actor: Unit, target: Unit, fullPower: FullPower, isCritical: boolean = false): DmgResult {
  let { dr, isChain } = target.defense
  if (isCritical) dr = 0 // クリティカル時はダメージ貫通
  const { count, mod, rate } = actor.attack.getDmgParams(dr, isChain, fullPower)
  const roll = Math.max(0, Math.floor(getRoll(count, mod) * rate))
  return { roll, success: roll > 0, critical: roll >= 10 }
}

// 魔法によるダメージの判定結果を返す
export function rollSpellDmg(actor: Unit, count: number, dmgType: 0 | 1 | 2, target: Unit, metalPenalty: boolean = false): DmgResult {
  let { dr, isChain } = target.defense
  if (metalPenalty) dr = 0 // 電属性によるダメージ貫通
  const mod = actor.spells.getDmgMod(dmgType, dr, isChain)
  const rate = actor.spells.getDmgRate(dmgType)
  const roll = Math.max(0, Math.floor(getRoll(count, mod) * rate))
  return { roll, success: roll > 0, critical: roll >= 10 }
}

// 牽制の判定結果を返す (成功度がそのまま target の次の防御目標値へのペナルティになる)
export function judgeFeint(actor: Unit, target: Unit): FeintResult {
  return { target, ...score(actor.attack.target) }
}

// 魔法の判定結果を返す
export function judgeSpell(actor: Unit, element: SpellElement, spellId: number, formation: Formation, target: Unit): Omit<SpellResult, 'effectResults'> {
  const spell = SPELL_LIST[element][spellId].label
  return { spell, ...judge(actor.spells.getSpellTarget(element, spellId, formation, target)) }
}

// 生命力判定の結果を返す (転倒判定・回復判定・致死判定)
export function judgeEndurance(target: Unit): Judge {
  return judge(target.pre)
}

// 知力判定の結果を返す (魔法に対する抵抗判定)
// 魔法ごとに異なる修正値を引数として受け取る
export function judgeResist(target: Unit, mod: number = 0): Score {
  return score(target.mre + mod)
}

// 精神集中の維持判定の結果を返す
export function judgeMaintain(target: Unit): Judge {
  return judge(target.mre - 4)
}
