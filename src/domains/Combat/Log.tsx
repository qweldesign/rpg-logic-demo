// src/domains/Combat/Log.tsx

import { type ReactNode } from 'react'
import { CombatUnit as Unit } from './Unit'
import { type Judge, ACTION_LABELS, POSITION_LABELS, type ActionRequest, type SpellResult, type DebuffAllResult, type HealResult, type CleanseResult, type ActionResult } from './Action'
import { SPELL_ELEMENT_LABELS, SPELL_BUFF_LABELS, SPELL_DEBUFF_LABELS } from './Spells'

let count = 0

// タイムラインへのログ表示を司るクラス / Timelineコンポーネントに対応
export class CombatLog {
  public id: number
  public actor: Unit
  public messages: ReactNode[][]
  public label?: string

  // インスタンス生成時は「XXXXの行動順」を表示する
  constructor(actor: Unit) {
    this.id = count++
    this.actor = actor
    const firstMessage = (<span className="font-bold">{actor.name} の行動順</span>)
    this.messages = [[firstMessage]]
  }

  // Action コンポーネントで ActionRequest と ActionResult[] を受け取り, ラベルと結果ログを生成する
  receiveResults(request: ActionRequest, results: ActionResult[] = []) {
    this.label = this.createLabel(request, results)
    this.messages.push(this.createMessages(request, results))
  }

  // ラベル生成 (Summary履歴用)
  private createLabel(request: ActionRequest, results: ActionResult[]): string {
    switch (request.key) {
      case 'attack':
        const attackLabel = request.options.fullPower !== 'none' ? '全力攻撃' : ACTION_LABELS[request.key]
        return `${attackLabel}:${this.createAttackResultLabel(request, results)}`

      case 'feint':
        return `${ACTION_LABELS[request.key]}:${this.createFeintResultLabel(results)}`

      case 'cast':
        return `${ACTION_LABELS[request.key]}:${SPELL_ELEMENT_LABELS[request.options.element].slice(0, 1)}(${this.actor.spells.cast[request.options.element]})`

      case 'spell':
        const spellJudge = results[0].judge as SpellResult
        return spellJudge.success ? spellJudge.spell : `${spellJudge.spell}(不発)`

      case 'move':
        return `${ACTION_LABELS[request.key]}:${POSITION_LABELS[request.options.position]}`

      default: // case 'ready': case 'defense': case 'recovery': case: 'standup': case 'wait':
        return ACTION_LABELS[request.key]
    }
  }

  // 攻撃の成否ラベルを生成
  // 攻撃(成功) → 防御(失敗) → ダメージ(貫通) の場合のみ「成功」を返す
  private createAttackResultLabel(request: ActionRequest, results: ActionResult[]): string {
    if (request.key !== 'attack') return ''
    let success = false
    results.forEach(result => {
      switch (result.type) {
        case 'attack':
          success = result.judge.success
          break
        case 'spellDefense':
          success = !result.judge.success
          break
        case 'defense':
          success = !result.judge.success
          break
        case 'dmg':
          success = result.judge.success
          break
      }
    })
    return success ? '成功' : '失敗'
  }

  // 牽制の成否ラベルを生成 (成功時は成功度も表示)
  private createFeintResultLabel(results: ActionResult[]): string {
    let success = false
    let score = 0
    results.forEach(result => {
      if (result.type === 'feint') {
        success = result.judge.success
        score = result.judge.score
      }
    })
    return success ? `成功(${score})` : '失敗'
  }

  // 結果ログ生成
  private createMessages(request: ActionRequest, results: ActionResult[]): ReactNode[] {
    const actor = this.actor.name
    const messages: ReactNode[] = []
    switch (request.key) {
      case 'ready': {
        messages.push(<>{`${actor} は ${this.actor.attack.name} を構えた`}</>)
        break
      }
      case 'attack': case 'feint': {
        const target = request.target
        results.forEach(result => {
          switch (result.type) {
            case 'attack':
              messages.push(<>{`${actor} の ${this.actor.attack.name} による攻撃!`}</>)
              messages.push(<>{`出目は ${result.judge.roll}、${this.getResultLabel(result.judge)}`}</>)
              if (!result.judge.success && !result.judge.ready) {
                // 攻撃失敗時のみ非準備状態への変化をログに表示
                messages.push(<>{`${actor} の ${this.actor.attack.name} は非準備状態になった`}</>)
              }
              break

            case 'feint':
              messages.push(<>{`${actor} は ${target.name} に対して牽制を仕掛けた!`}</>)
              if (result.judge.success) {
                messages.push(<>{`出目は ${result.judge.roll}、牽制は成功した!`}</>)
                messages.push(<>{`次のターン, ${target.name} は防御判定に -${result.judge.score} の修正が課せられる!`}</>)
              } else {
                messages.push(<>{`出目は ${result.judge.roll}、牽制は失敗した...`}</>)
              }
              break

            default: // case 'defense': case 'dmg': case 'trip': case 'knockedDown': case 'fatal':
              this.pushDmgResolutionMessage(messages, request.target, result)
              break
          }
        })
        break
      }

      case 'cast': {
        messages.push(<>{`${actor} は ${SPELL_ELEMENT_LABELS[request.options.element]} の呪文に集中している`}</>)
        break
      }

      case 'spell': {
        const spellJudge = (results[0].judge as SpellResult)
        let target = request.target
        if (!spellJudge.success) {
          messages.push(<>{`${actor} の ${spellJudge.spell} は不発に終わった...`}</>)
          break
        }
        messages.push(<>{`${actor} の ${spellJudge.spell} 発動!!`}</>)
        spellJudge.effectResults.forEach(result => {
          if (result.kind === 'buff') {
            messages.push(<>{`${target.name} の ${SPELL_BUFF_LABELS[result.target]} が上昇した!`}</>)
          } else if (result.kind === 'debuff' && result.applied) {
            messages.push(<>{`${target.name} は ${SPELL_DEBUFF_LABELS[result.target]} 状態になった!`}</>)
          } else if (result.kind === 'debuff') {
            messages.push(<>{`${target.name} は抵抗した!`}</>)
          }
        })
        results.forEach(result => {
          switch (result.type) {
            case 'defense': case 'dmg':
              // default: での処理においてもこの target を引き継いで使用する
              target = result.judge.target ?? target
              this.pushDmgResolutionMessage(messages, target, result)
              break
            case 'debuffAll':
              this.pushDebuffAllMessage(messages, result.judge)
              break
            case 'heal':
              this.pushHealMessage(messages, result.judge)
              break
            case 'cleanse':
              this.pushCleanseMessage(messages, result.judge)
              break
            case 'barrier':
              messages.push(<>{`魔法障壁に包まれ、魔法を発動させにくくなった!`}</>)
              break
            default: // case 'trip': case 'knockedDown': case 'fatal':
              this.pushDmgResolutionMessage(messages, target, result)
          }
        })
        break
      }
      case 'defense': {
        messages.push(<>{`${actor} は 防御に専念!`}</>)
        break
      }
      case 'move': {
        messages.push(<>{`${actor} は ${POSITION_LABELS[request.options.position]} へ移動した`}</>)
        break
      }
      case 'recovery': {
        results.forEach(result => {
          if (result.type === 'recovery') {
            if (result.judge.success) messages.push(<>{`${actor} は 朦朧状態から回復した!`}</>)
            else messages.push(<>{`${actor} は 朦朧としていて何も行動できない...`}</>)
          }
        })
        break
      }
      case 'standup': {
        messages.push(<>{`${actor} は 転倒状態から立ち上がろうとしている`}</>)
        break
      }
      default: { // case 'wait': (狂戦士・恐慌状態のみ)
        if (request.options.status === 'berserk') {
          messages.push(<>{`${actor} は 何もできない...`}</>)
        } else {
          messages.push(<>{`${actor} は 恐慌状態で立ち尽くしている...`}</>)
        }
        break
      }
    }
    messages.push(<>&nbsp;</>)
    return messages
  }

  private getResultLabel(judge: Judge): string {
    return judge.success && judge.critical ? 'クリティカル!!'
      : judge.success && !judge.critical ? '成功!' : '失敗!'
  }

  // 攻撃・射撃に共通する, 防御判定以降の結果ログを追加
  private pushDmgResolutionMessage(messages: ReactNode[], target: Unit, result: ActionResult) {
    switch (result.type) {
      case 'defense':
        const defenseTypeLabel = result.judge.type === 'parry' ? '武器による受け流し'
          : result.judge.type === 'block' ? '盾による受け止め' : '回避'
        messages.push(<>{`${target.name} は ${defenseTypeLabel} を試みた!`}</>)
        messages.push(<>{`出目は ${result.judge.roll}、${this.getResultLabel(result.judge)}`}</>)
        if (result.judge.success && !result.judge.ready) {
          // 受け成功時のみ非準備状態への変化をログに表示
          messages.push(<>{`${target.name} の ${target.attack.name} は非準備状態になった`}</>)
        }
        break

      case 'spellDefense':
        messages.push(<>{`${target.name} は「風の盾」を発動した!`}</>)
        messages.push(<>{`出目は ${result.judge.roll}、${this.getResultLabel(result.judge)}`}</>)
        break

      case 'dmg':
        if (result.judge.roll < 1) messages.push(<>{`ダメージは ${target.name} の鎧によって完全に止められた...`}</>)
        else if (!result.judge.critical) messages.push(<>{`${target.name} は ${result.judge.roll} 点のダメージを受けた!!`}</>)
        else messages.push(<>{`${target.name} は ${result.judge.roll} 点のダメージを受けた!!!`}</>)
        break

      case 'trip':
        messages.push(<>{`${target.name} は 転倒した!!`}</>)
        break

      case 'knockedDown':
        if (result.judge.success) messages.push(<>{`${target.name} は 朦朧状態に陥った!`}</>)
        else messages.push(<>{`${target.name} は 転倒した!!`}</>)
        break

      case 'fatal':
        if (result.judge.success) messages.push(<>{`${target.name} は 気絶した...`}</>)
        else messages.push(<>{`${target.name} は 死亡した...`}</>)
        break
    }
  }

  // kind: debuffAll
  private pushDebuffAllMessage(messages: ReactNode[], judge: DebuffAllResult) {
    const targetName = judge.target.name
    messages.push(<>{`${targetName} は ${SPELL_DEBUFF_LABELS[judge.statusTarget]} 状態になった!`}</>)
  }

  // kind: heal
  private pushHealMessage(messages: ReactNode[], judge: HealResult) {
    const targetName = judge.target.name
   if (judge.healedAmount > 0) messages.push(<>{`${targetName} の傷が, ${judge.healedAmount} 点回復した!`}</>)
    if (judge.curedStun) messages.push(<>{`${targetName} は朦朧状態から回復した!`}</>)
  }

  // kind: cleanse
  private pushCleanseMessage(messages: ReactNode[], judge: CleanseResult) {
    const targetName = judge.target.name
    const cured: string[] = []
    if (judge.curedStun) cured.push('朦朧状態')
    if (judge.curedBerserk) cured.push('狂戦士状態')
    if (judge.curedDazed) cured.push('幻惑状態')
    if (judge.curedFear) cured.push('恐慌状態')
    messages.push(<>{`${targetName} の ${cured.join('・')} が解除された`}</>)
  }
  
  // 勝利/敗北時ログ
  receiveResult(result: 'win' | 'lose') {
    const messages: ReactNode[] = []
    if (result === 'win') {
      messages.push(<span className="font-bold">{'敵陣営の前衛が崩れた!! 勝利!!'}</span>)
    } else {
      messages.push(<span className="font-bold">{'味方陣営の前衛が崩れた... 敗北...'}</span>)
    }
    this.messages.push(messages)
  }
}
