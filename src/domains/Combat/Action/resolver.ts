// src/domains/Combat/Action/resolver.ts

import { type CombatUnit as Unit } from '../Unit'
import { type Judge, getRoll, judge, type AttackResult, type DefenseResult, type DmgResult } from '.'

// 攻撃の判定結果を返す
export function judgeAttack(actor: Unit): AttackResult {
  const attackTarget = actor.attack.getTarget()
  return judge(attackTarget)
}

// 防御の判定結果を返す
// 可能な防御のうちで, 最も成功率の高い防御を自動選択する
export function judgeDefense(target: Unit): DefenseResult {
  const defenseTarget = target.defense.getTarget()
  return {
    ...judge(defenseTarget.target),
    type: defenseTarget.type
  }
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
