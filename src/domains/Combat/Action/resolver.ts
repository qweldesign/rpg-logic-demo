// src/domains/Combat/Action/resolver.ts

import { type CombatUnit as Unit } from '../Unit'
import { type Judge, getRoll, judge, type AttackResult, type DefenseResult, type DmgResult } from '.'

// 攻撃の判定結果を返す
export function judgeAttack(actor: Unit): AttackResult {
  const attackTarget = actor.attack.getTarget()
  return judge(attackTarget)
}

// 防御の判定結果を配列で返す
// 可能な防御のうちで, 最も成功率の高い防御を自動選択する
// 全力防御選択中は, 最初の防御に失敗しても, 残り試行回数の範囲で別の防御を続けて試みる
// いずれかが成功すればそこで処理を終了する
export function judgeDefense(target: Unit): DefenseResult[] {
  const defense = target.defense
  const maxAttempts = defense.isFullDefense ? 2 : 1
  const results: DefenseResult[] = []

  if (defense.canBlock) {
    const blockResult = { ...judge(defense.getBlockTarget()), type: 'block' as const }
    results.push(blockResult)
    if (blockResult.success) return results
  }

  if (defense.canParry && results.length < maxAttempts) {
    const parryResult = { ...judge(defense.getParryTarget()), type: 'parry' as const }
    results.push(parryResult)
    if (parryResult.success) return results
  }

  if (results.length < maxAttempts) {
    const dodgeResult = { ...judge(defense.getDodgeTarget()), type: 'dodge' as const }
    results.push(dodgeResult)
  }
  return results
}

// ダメージの判定結果を返す
export function rollDmg(actor: Unit, target: Unit): DmgResult {
  const dmg = actor.attack.dmg
  const dr = target.defense.dr
  const count = dmg.dmgDice
  const mod = dmg.dmgMod - dr
  const rate = actor.attack.getDmgRate()
  const roll = Math.floor(getRoll(count, mod) * rate)
  return { roll, success: roll > 0, critical: roll >= 10 }
}

// 転倒判定の結果を返す (成功: 朦朧状態, 失敗: 転倒)
export function judgeKnockedDown(target: Unit): Judge {
  return judge(target.pre)
}
