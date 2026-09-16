// src/domains/Combat/Action/Effects.ts

import { Combat as State } from '..'
import { type Position, type CombatUnit as Unit } from '../Unit'
import { type FullPower, type DefenseResult, type DmgResult, type SpellEffectResult, type FlashResult, type ActionResult, judgeAttack, judgeDefense, judgeShootDefense, rollDmg, rollSpellDmg, judgeFeint, judgeSpell, judgeEndurance, judgeResist } from '.'
import { type CombatFormation as Formation } from '../Formation'
import { SPELL_ELEMENTS, type SpellElement, type SpellEffect, SPELL_LIST } from '../Spells'

// 行動実行 (状態変更) を司るクラス / Action.execute から呼び出される
export class CombatActionEffects {
  private state: State
  private formation: Formation

  constructor(state: State) {
    this.state = state
    this.formation = state.formation!
  }

  //「準備」実行
  ready(): ActionResult[] {
    this.state.actor.attack.ready = true
    return []
  }

  //「攻撃」「全力攻撃」実行
  attack(target: Unit, fullPower: FullPower): ActionResult[] {
    const actor = this.state.actor
    const results: ActionResult[] = []

    // 次のターンまで能動防御 (受け・止め・よけ) 不可
    if (fullPower !== 'none') actor.defense.isFullAttackTurn = true

    if (fullPower === 'feint') {
      // 「牽制即攻撃」: 牽制を即座に適用した上で, そのまま攻撃する
      results.push(...this.feint(target, true))
      results.push(...this.attackRoutine(target, fullPower))
    } else if (fullPower === 'double') {
      // 「2回攻撃」: 対象が気絶しなければ, 続けてもう1回攻撃する
      results.push(...this.attackRoutine(target, fullPower))
      if (!target.health.unconscious) {
        results.push(...this.attackRoutine(target, fullPower))
      }
    } else {
      // 通常攻撃, および全力攻撃オプション「ダメージ安定」「技能値+4」
      results.push(...this.attackRoutine(target, fullPower))
    }

    return results
  }

  // 攻撃1回分の判定・効果適用 (判定結果に基づき, HPへのダメージ反映と朦朧・転倒・気絶までを処理する)
  private attackRoutine(target: Unit, fullPower: FullPower): ActionResult[] {
    const results: ActionResult[] = []
    const actor = this.state.actor

    // 攻撃判定
    const attackJudge = judgeAttack(actor, fullPower)
    // 武器の準備状態を更新 (準備の要る武器の場合, 攻撃後は非準備状態になる)
    actor.attack.ready = !actor.attack.needsReady
    results.push({ type: 'attack', judge: { ...attackJudge, ready: actor.attack.ready } })
    if (!attackJudge.success) return results // 攻撃失敗時はここで処理を止める

    // 防御判定
    const canDefend = !attackJudge.critical && target.defense.canDefend
    const defenseResults = this.tryDefend(target, canDefend, () => judgeDefense(actor, target))
    for (const defenseResult of defenseResults) {
      results.push(defenseResult)
      if (defenseResult.type === 'defense' && defenseResult.judge.success) {
        return results // 防御に成功した場合はここで処理を止める
      }
    }

    // ダメージ判定
    const dmgJudge = rollDmg(actor, target, fullPower, attackJudge.critical)
    results.push(...this.resolveDmg(dmgJudge, target))

    return results
  }

  // 防御試行
  private tryDefend(target: Unit, canDefend: boolean, getDefenseJudges: () => Omit<DefenseResult, 'ready'>[]): ActionResult[] {
    const results: ActionResult[] = []
    const defenseJudges = getDefenseJudges()

    // 防御不能攻撃 (クリティカル) または対象が全力攻撃ターンの場合は空の結果を返す
    if (!canDefend) return results

    // 「受け」「止め」試行回数を加算
    for (const defenseJudge of defenseJudges) {
      if (defenseJudge.type === 'parry') {
        // 武器の準備状態を更新 (準備の要る武器の場合, 攻撃後は非準備状態になる)
        target.attack.ready = !target.attack.needsReady
        target.defense.parryCount++
      } else if (defenseJudge.type === 'block') {
        target.defense.blockCount++
      }

      // 判定結果をpush (ログ表示用に target も含めること)
      results.push({ type: 'defense', judge: { ...defenseJudge, ready: target.attack.ready, target } })

      // 防御に成功したら処理を抜ける
      if (defenseJudge.success) break
    }

    return results
  }

  // ダメージ効果
  private resolveDmg(dmgJudge: DmgResult, target: Unit): ActionResult[] {
    const results: ActionResult[] = []

    // 判定結果をpush (ログ表示用に target も含めること)
    results.push({ type: 'dmg', judge: { ...dmgJudge, target } })

    if (!dmgJudge.success) return results // ダメージが通らなかった時はここで処理を止める

    // ダメージ効果
    target.health.injury += dmgJudge.roll

    // 気絶・致死判定
    // 気絶への状態遷移は Health に委譲
    if (target.health.unconscious) {
      const fatalJudge = judgeEndurance(target)
      results.push({ type: 'fatal', judge: fatalJudge })
      if (!fatalJudge.success) {
        target.health.dead = true // 死亡
      }
      return results // 以降のログ出力を止める
    }

    // 朦朧状態・転倒判定
    // 朦朧状態への状態遷移は Health に委譲
    if (target.health.stunned) {
      const knockedDownJudge = judgeEndurance(target)
      results.push({ type: 'knockedDown', judge: knockedDownJudge })
      if (!knockedDownJudge.success) {
        target.health.prone = true // 転倒
      }
    }

    return results
  }

  //「牽制」実行
  feint(target: Unit, isImmediate: boolean = false): ActionResult[] {
    const actor = this.state.actor
    const feintJudge = judgeFeint(actor, target)
    if (isImmediate && actor.attack.feint && feintJudge.success) {
      // 全力攻撃の牽制で, かつ前ターンに牽制を実行していた場合は, 効果の高い方を適用
      const prevScore = actor.attack.feint.score
      actor.attack.feint = { currentTurn: !isImmediate, target, score: Math.max(prevScore, feintJudge.score) }
    } else if (feintJudge.success) {
      actor.attack.feint = { currentTurn: !isImmediate, target, score: feintJudge.score }
    }
    return [{ type: 'feint', judge: feintJudge }]
  }

  //「集中」実行
  cast(element: SpellElement) {
    const actor = this.state.actor
    actor.spells.cast[element] = Math.min(actor.spells.cast[element] + 1, 3)
    SPELL_ELEMENTS.forEach(spellElement => {
      if (spellElement !== element) actor.spells.cast[spellElement] = 0
    })
  }

  //「魔法」実行
  spell(element: SpellElement, spellId: number, target: Unit): ActionResult[] {
    const actor = this.state.actor
    SPELL_ELEMENTS.forEach(spellElement => { actor.spells.cast[spellElement] = 0 })
    const spellJudge = judgeSpell(actor, element, spellId, this.formation, target)
    const effectResults: SpellEffectResult[] = []
    const extraResults: ActionResult[] = []

    if (spellJudge.success) {
      SPELL_LIST[element][spellId].effects?.forEach(effect => {
        // 効果種別 (effect.kind) ごとに処理
        let effectResult = {}

        if (effect.kind === 'buff' || effect.kind === 'debuff') {
          // バフ・デバフ
          effectResult = this.applySpellEffect(target, effect)
        } else if (effect.kind === 'debuffAll') {
          // 全体デバフ
          const allies = this.formation.getAllies().filter(unit => unit !== actor)
          const enemies = this.formation.getEnemies()
          const targets = [...allies, ...enemies]
          targets.forEach(target => extraResults.push(...this.spellDebuffAllRoutine(target, actor, effect)))
        } else if (effect.kind === 'trip') {
          // 転倒
          const { results: defenseResults, applied } = this.spellTripRoutine(target)
          extraResults.push(...defenseResults)
          extraResults.push({ type: 'trip', judge: { roll: 0, success: applied, critical: false } })
        } else if (effect.kind === 'dmg') {
          // 直接ダメージ
          target = effect.randomTarget // ランダムターゲット
            ? this.formation.getEnemies()[Math.floor(Math.random() * this.formation.getEnemies().length)]
            : target
          extraResults.push(...this.spellDmgRoutine(target, effect))
        } else if (effect.kind === 'dmgAll') {
          // 全体ダメージ
          const targets = this.formation.getEnemies()
          targets.forEach(target => extraResults.push(...this.spellDmgRoutine(target, effect)))
        } else if (effect.kind === 'flash') {
          // 閃光
          const targets = this.formation.getEnemies()
          targets.forEach(target => extraResults.push(...this.spellFlashRoutine(target)))
        }
      
        if (Object.keys(effectResult).length > 0) effectResults.push(effectResult as SpellEffectResult)
      })
    }
    return [{ type: 'spell', judge: { ...spellJudge, effectResults } }, ...extraResults]
  }

  // 魔法の効果適用
  private applySpellEffect(target: Unit, effect?: SpellEffect): SpellEffectResult | {} {
    if (!effect) return {}
    if (effect.kind === 'buff') {
      if (effect.target === 'level') target.buff.addLevelBuff()
      else if (effect.target === 'dmg') target.buff.addDmgBuff()
      else if (effect.target === 'ev') target.buff.addEvBuff()
      else if (effect.target === 'dr') target.buff.addDrBuff()
      return { kind: 'buff', target: effect.target }
    }
    if (effect.kind === 'debuff') {
      const resistJudge = judgeResist(target, effect.resistMod)
      const applied = !resistJudge.success
      if (applied) {
        const duration = effect.duration === 'margin' ? -resistJudge.score : effect.duration
        target.debuff[effect.target] = duration
      }
      return { kind: 'debuff', target: effect.target, applied }
    }
    return {}
  }

  // kind: debuffAll
  private spellDebuffAllRoutine(target: Unit, actor: Unit, effect: Extract<SpellEffect, { kind: 'debuffAll' }>): ActionResult[] {
    const isAlly = target.side === actor.side
    const mod = isAlly ? effect.allyResistMod : effect.enemyResistMod
    const resistJudge = judgeResist(target, mod)
    if (resistJudge.success) return [] // 抵抗に成功したログは出力しない

    const duration = effect.duration === 'margin' ? -resistJudge.score : effect.duration
    target.debuff[effect.target] = duration

    const debuffResult = { ...resistJudge, target, statusTarget: effect.target }
    return [{ type: 'debuffAll', judge: debuffResult }]
  }

  // kind: trip
  private spellTripRoutine(target: Unit): { results: ActionResult[], applied: boolean} {
    const results: ActionResult[] = []

    const canDefend = target.defense.canDefend
    const defenseResults = this.tryDefend(target, canDefend, () => judgeShootDefense(this.state.actor, target))

    for (const defenseResult of defenseResults) {
      results.push(defenseResult)
      if (defenseResult.type === 'defense' && defenseResult.judge.success) {
        return { results, applied: false } // 防御に成功した場合はここで処理を止める
      }
    }

    target.health.prone = true // 転倒

    return { results, applied: true }
  }

  // kind: dmg, dmgAll
  spellDmgRoutine(target: Unit, effect: Extract<SpellEffect, { kind: 'dmg' }> | Extract<SpellEffect, { kind: 'dmgAll' }>): ActionResult[] {
    const results: ActionResult[] = []
    
    const metalPenalty = effect.kind === 'dmg' && effect.metalPenalty
    const extraMod = metalPenalty ? -4 : 0 // 電属性による回避判定へ課される修正

    const canDefend = target.defense.canDefend
    const defenseResults = this.tryDefend(target, canDefend, () => judgeShootDefense(this.state.actor, target, extraMod))

    for (const defenseResult of defenseResults) {
      results.push(defenseResult)
      if (defenseResult.type === 'defense' && defenseResult.judge.success) {
        return results // 防御に成功した場合はここで処理を止める
      }
    }

    const dmgJudge = rollSpellDmg(this.state.actor, effect.dice, effect.dmgType, target, metalPenalty)
    results.push(...this.resolveDmg(dmgJudge, target)) // ダメージ適用

    return results
  }

  // kind: flash
  private spellFlashRoutine(target: Unit): ActionResult[] {
    const results: ActionResult[] = []

    // 精神集中中の対象は, 目を閉じているため自動的に対象外とする
    // (維持判定を行うことになると, かなり強力な魔法になってしまう)
    const isCasting = SPELL_ELEMENTS.some(element => target.spells.cast[element] > 0)
    if (isCasting) return results
    
    const canDefend = target.defense.canDefend
    const defenseResults = this.tryDefend(target, canDefend, () => judgeShootDefense(this.state.actor, target))

    for (const defenseResult of defenseResults) {
      results.push(defenseResult)
      if (defenseResult.type === 'defense' && defenseResult.judge.success) {
        return results // 防御に成功した場合はここで処理を止める
      }
    }

    target.debuff.flashed = 1 // 目くらみ
    const flashResult: FlashResult = { roll: 0, success: false, critical: false, target }
    results.push({ type: 'flash', judge: flashResult }) // 成否を問わない結果をpush (ログ表示用)

    return results
  }

  //「全力防御」実行
  defense() {
    this.state.actor.defense.isFullDefenseTurn = true
  }

  //「移動」実行
  move(position: Position) {
    this.state.actor.position = position
  }

  // 朦朧状態からの「回復」実行 (自動実行)
  recovery(): ActionResult[] {
    const recoveryJudge = judgeEndurance(this.state.actor)
    if (recoveryJudge.success) {
      this.state.actor.health.stunned = false // 回復
    }
    return [{ type: 'recovery', judge: recoveryJudge }]
  }

  // 転倒状態からの「立ち上がり」実行 (自動実行)
  standup() {
    this.state.actor.health.standupTurn = true // 立ち上がり
  }

  //「待機」実行
  wait() {
    // 状態変更なし
  }
}
