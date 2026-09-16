// src/domains/Combat/Action/index.ts

import { Combat as State } from '..'
import { POSITION_KEYS } from '../Unit'
import { type Judge, type Score, getRoll, judge, score } from './roll'
import { ACTION_KEYS, ACTION_LABELS, POSITION_LABELS, FULL_POWER_KEYS, FULL_POWER_OPTIONS, type ActionKey, type FullPower, type ActionOptions, type ActionRequest, type AttackResult, type DefenseResult, type DmgResult, type FeintResult, type SpellResult, type ActionResult } from './types'
import { CombatActionAvailability as Availability } from './Availability'
import { CombatActionEffects as Effects } from './Effects'
import { judgeAttack, judgeDefense, rollDmg, judgeFeint, judgeSpell, judgeEndurance } from './resolver'
import { SPELL_ELEMENTS, type SpellElement } from '../Spells'

export { type Judge, type Score, getRoll, judge, score, ACTION_KEYS, ACTION_LABELS, POSITION_LABELS, FULL_POWER_KEYS, FULL_POWER_OPTIONS, type ActionKey, type FullPower, type ActionOptions, type ActionRequest, type AttackResult, type DefenseResult, type DmgResult, type FeintResult, type SpellResult, type ActionResult, judgeAttack, judgeDefense, rollDmg, judgeFeint, judgeSpell, judgeEndurance }

// 行動の管理を司るクラス / Actionコンポーネントに対応
export class CombatAction {
  private state: State
  public round: number
  public unlocked: boolean // コマンドパレットのロック状態 → Actions にて検知
  public promise: Promise<void>
  public ready: Promise<void> // 開幕時の自動実行 (朦朧回復・立ち上がり) が完了したら解決
  private resolve!: () => void
  private readonly availabilityChecker: Availability
  private readonly effects: Effects

  constructor(state: State) {
    this.state = state
    this.round = state.round
    this.unlocked = true // コマンドパレットをアンロック
    this.availabilityChecker = new Availability(state)
    this.effects = new Effects(state)

    // ターン終了を Promise で State に伝え, 次のターンへ進む
    this.promise = new Promise(resolve => {
      this.resolve = resolve
    })

    if (this.actor.health.stunned) {
      // 朦朧状態の場合は「回復」を自動実行する
      this.ready = this.execute({ key: 'recovery', options: {} })
    } else if (!this.actor.health.stunned && this.actor.health.prone) {
      // 転倒状態の場合は「立ち上がり」を自動実行する
      this.ready = this.execute({ key: 'standup', options: {} })
    } else {
      this.ready = Promise.resolve()
    }
  }

  get actor() {
    return this.state.actor
  }

  // 実行可否
  get availability() {
    return {
      ready: this.availabilityChecker.canReady(),
      attack: this.availabilityChecker.canAttack(),
      fullPowerAttack: this.availabilityChecker.canFullPowerAttack(),
      doubleAttack: this.availabilityChecker.canDoubleAttack(),
      feint: this.availabilityChecker.canFeint(),
      cast: SPELL_ELEMENTS.reduce((acc, element) => {
        acc[element] = this.availabilityChecker.canCast(element)
        return acc
      }, {} as Record<SpellElement, boolean>),
      spell: SPELL_ELEMENTS.some(element => this.availabilityChecker.canSpell(element)),
      defense: this.availabilityChecker.canDefense(),
      move: POSITION_KEYS.reduce((acc, position) => {
        acc[position] = this.availabilityChecker.canMove(position)
        return acc
      }, {} as Record<typeof POSITION_KEYS[number], boolean>),
      wait: this.availabilityChecker.canWait()
    }
  }

  // ターゲット (Formation の配置情報を元に絞り込む)
  get target() {
    const formation = this.state.formation
    return {
      all: this.state.units,
      allies: formation?.getAllies() ?? [],
      enemies: formation?.getEnemies() ?? [],
      melee: formation?.getMeleeTargets() ?? []
    }
  }

  // 実行
  // ActionRequest のプロパティ (key, options, target) を引数に取って処理を進め,
  // ActionResult の配列を Log に渡し, 再生して次のターンへ移る
  async execute (action: ActionRequest) {
    // コマンドパレットをロック (アンロックはコンストラクタで行われる)
    this.unlocked = false

    // 行動実行
    let results: ActionResult[] = []

    switch (action.key) {
      case 'ready':
        results = this.effects.ready()
        break

      case 'attack':
        results = this.effects.attack(action.target, action.options.fullPower)
        break

      case 'feint':
        results = this.effects.feint(action.target)
        break

      case 'cast':
        this.effects.cast(action.options.element)
        break

      case 'spell':
        results = this.effects.spell(action.options.element, action.options.spellId)
        break

      case 'defense':
        this.effects.defense()
        break

      case 'move':
        this.effects.move(action.options.position)
        break

      case 'recovery':
        results = this.effects.recovery()
        break

      case 'standup':
        this.effects.standup()
        break

      default: // case 'wait':
        this.effects.wait()
    }

    // ログを更新
    const log = this.state.logs[0]
    log.receiveResults(action, results)

    // 行動終了分岐
    // 回復成功時・立ち上がりはターンを終えず, 同じ actor の行動を続ける
    let nextTurn = true
    const recoveryResult = results.find(result => result.type === 'recovery')
    if ((action.key === 'recovery' && recoveryResult?.judge.success)
      || action.key === 'standup'
      || action.key === 'spell'
    ) {
      this.unlocked = true
      nextTurn = false
    }

    // 行動終了
    await this.state.playLog() // ログの再生完了を待つ
    if (nextTurn) {
      this.resolve()
    }
  }
}
