// src/domains/Combat/AI/base/index.ts

import { Combat as State } from '../..'
import { type Position, CombatUnit as Unit } from '../../Unit'
import { type FullPower, type ActionRequest } from '../../Action'
import { type SpellElement } from '../../Spells'
import { type TemperTypeKey } from '..'

// 移動先優先順位
type MovePriority = 'center' | 'wing'

// 行動パラメータ
type ActionParams = {
  quickAttack: number // 攻撃選択時に指定確率で全力攻撃を実行
  attackMax: number // 自身の防御目標値がこの値以下なら全力攻撃
  defenseValues: number[] // 自身の防御目標値がこれらの値なら全力防御
  coinflipValues: number[] // 自身の防御目標値がこれらの値なら 50% の確率分岐で全力攻撃/全力防御
}

const ACTION_PARAMS: Record<TemperTypeKey, ActionParams> = {
  'cautious': { // 慎重: 防御優先
    quickAttack: 0,
    attackMax: 7,
    defenseValues: [9, 10],
    coinflipValues: [8]
  },
  'steady': { // 堅実: バランス
    quickAttack: 1 / 8,
    attackMax: 8,
    defenseValues: [10],
    coinflipValues: [9]
  },
  'bold': { // 大胆: 攻撃優先
    quickAttack: 1 / 4,
    attackMax: 9,
    defenseValues: [],
    coinflipValues: [10]
  },
  'reckless': { // 無謀: 攻撃専心
    quickAttack: 1 / 2,
    attackMax: 10,
    defenseValues: [],
    coinflipValues: []
  }
}

/**
 * 基本形の行動パターン
 *
 * 1. 移動
 * 後衛にいれば前衛に移動 (優先順位は MovePriority を参照する)
 * 前衛にいて, かつ攻撃対象がいれば 2. へ
 *
 * 2. 全力攻撃
 * 自身が狂戦士状態か, もしくは自身を攻撃可能な敵全員が朦朧・幻惑・恐慌状態なら全力攻撃
 * それ以外なら 3. へ
 *
 * 3. 行動分岐
 * 自身の牽制による修正込みの敵の防御目標値によって分岐
 * 敵の防御目標値が8以下なら 4. へ, 10以上なら 5. へ,
 * その間(9)なら 50% の確率分岐で 4. か 5. へ
 *
 * 4. 全力攻撃/攻撃
 * 自身を攻撃可能な敵が1人なら全力攻撃, 2人以上なら攻撃
 *
 * 5. 全力攻撃/全力防御/準備/攻撃/牽制
 * 敵の牽制による修正 (複数なら最大の修正を適用) 込みの自身の防御目標値によって行動分岐 (閾値は params で指定)
 * 自身の防御目標値が params.attackMax 以下なら全力攻撃, params.defenseValues に含まれるなら全力防御,
 * params.coinflipValues に含まれるなら 50% の確率分岐で 全力攻撃 か 全力防御 へ
 * それ以外なら 6. へ
 *
 * 6. 準備/攻撃/牽制
 * 準備が必要な場合は準備
 * 自身の牽制による修正込みの敵の防御目標値と, 自身の武器が引き戻しが必要な武器かによって分岐
 * 敵の防御目標値が11以下なら攻撃
 * 自身の武器が引き戻し不要で, かつ敵の防御目標値が12なら攻撃
 * それ以外なら 7. へ
 *
 * 7. 攻撃/牽制
 * 自身の攻撃目標値が11未満なら攻撃
 * 自身の攻撃目標値が11なら 75% の確率で攻撃か 25% の確率で牽制
 * 自身の攻撃目標値が12なら 50% の確率で攻撃か 50% の確率で牽制
 * 自身の攻撃目標値が13なら 25% の確率で攻撃か 75% の確率で牽制
 * 自身の攻撃目標値が14なら牽制
 *
 * * 全力攻撃オプションについて
 * 準備が必要なら, 準備即攻撃
 * ダメージ期待値が0点なら, ダメージ安定
 * 攻撃目標値が10以下なら, 技能値+4
 * 敵の防御目標値が11以上なら, 牽制即攻撃
 * それ以外なら, 2回攻撃
 *
 * * 攻撃対象
 * 近接対象の中から自身の牽制による修正込みの防御目標値が最も低い相手を選ぶ
 * 
 */
export function base(actor: Unit, state: State, temperType: TemperTypeKey, movePriority: MovePriority): ActionRequest {
  const { availability, target } = state.action!
  const params = ACTION_PARAMS[temperType]
  const movePriorityArr: Position[] = movePriority === 'center'
    ? ['center', 'right', 'left'] : ['left', 'center', 'right']

  // 1. 移動
  // 後衛にいれば, 前進する
  if (actor.position === 'back') {
    const position = movePriorityArr.find(pos => availability.move[pos])
    if (position) return { key: 'move', options: { position } }
    return { key: 'defense', options: {} }
  }

  // 前衛にいるが現在位置からは攻撃対象が見つからない場合, 移動すれば対象に届く位置があればそこへ移動する
  const movePosition = pickMoveToReachMeleeTarget(actor, state)
  if (movePosition) return { key: 'move', options: { position: movePosition } }

  // 攻撃対象候補から, 攻撃対象を絞り込む
  const melee = target.melee
  if (melee.length === 0) return { key: 'defense', options: {} }
  const primaryTarget = pickLowestDefenseTarget(actor, melee)!

  // 2. 全力攻撃
  // 自身が狂戦士状態か, もしくは自身を攻撃可能な敵全員が朦朧・幻惑・恐慌状態
  if (actor.debuff.berserk || melee.every(isIncapacitated)) {
    return fullAttackRequest(actor, primaryTarget)
  }

  // 3. 行動分岐
  const targetDefense = primaryTarget.defense.getTarget(actor).target
  const toAggressiveBranch = targetDefense <= 8 || (targetDefense === 9 && chance())

  // 4. 全力攻撃/攻撃 (積極的攻撃)
  if (toAggressiveBranch) {
    if (melee.length === 1) { // 自身が攻撃され得る対象が1体なら, 全力攻撃
      return fullAttackRequest(actor, primaryTarget)
    }
    if (actor.attack.ready) { // 武器が準備状態なら, 攻撃
      return attackRequest(actor, primaryTarget, params.quickAttack)
    }
  }

  // 5. 全力攻撃/全力防御 (窮地の選択)
  // 自身の防御目標値が低い場合は, 全力攻撃か全力防御を選択する
  const selfDefense = worstOwnDefenseTarget(actor, melee)
  if (selfDefense <= params.attackMax) { // 防御放棄
    return fullAttackRequest(actor, primaryTarget)
  }
  if (params.defenseValues.includes(selfDefense)) { // 防御専心
    return { key: 'defense', options: {} }
  }
  if (params.coinflipValues.includes(selfDefense)) { // どちらか確率分岐
    return chance()
      ? fullAttackRequest(actor, primaryTarget)
      : { key: 'defense', options: {} }
  }

  // 6. 準備/攻撃
  if (!actor.attack.ready) { // 武器が準備状態なら, 攻撃
    return { key: 'ready', options: {} }
  }
  if (targetDefense <= 11 || (!actor.attack.needsReady && targetDefense === 12)) {
    // 攻撃目標の防御目標値が低い (命中の可能性が高い) なら, 攻撃
    return attackRequest(actor, primaryTarget, params.quickAttack)
  }

  // 7. 攻撃/牽制
  const attackTarget = actor.attack.getTarget('none')
  const attackProbability = Math.min(Math.max((14 - attackTarget) * 0.25, 0), 1)
  if (chance(attackProbability)) {
    // 自身の技能値が低い場合, 牽制の効果が得られにくいため, 攻撃を実行する確率を高めにする
    return attackRequest(actor, primaryTarget, params.quickAttack)
  }
  return { key: 'feint', options: {}, target: primaryTarget } // 牽制
}

// 確率分岐 (デフォルト: 50%)
export function chance(probability: number = 0.5): boolean {
  return Math.random() < probability
}

// 攻撃をリクエストする関数
// params.quickAttack によって, 一定確率で速攻(全力攻撃)を実行
function attackRequest(actor: Unit, target: Unit, quickAttack: number): ActionRequest {
  if (chance(quickAttack)) {
    return { key: 'attack', options: { fullPower: pickFullPowerOption(actor, target) }, target: target }
  } else {
    return { key: 'attack', options: { fullPower: 'none' }, target: target }
  }
}

// 全力攻撃をリクエストする関数
function fullAttackRequest(actor: Unit, target: Unit): ActionRequest {
  return { key: 'attack', options: { fullPower: pickFullPowerOption(actor, target) }, target: target }
}

// 全力攻撃オプションを選定する関数
function pickFullPowerOption(actor: Unit, target: Unit): FullPower {
  // 準備即攻撃
  if (!actor.attack.ready) return 'ready'
  
  // ダメージ安定
  const { dr, isChain } = target.defense
  const expectedDmg = actor.attack.getExpectedDmg(dr, isChain, 'none')
  if (expectedDmg === 0) return 'dmg'

  // 技能値+4
  const level = actor.attack.getTarget('none')
  if (level <= 10) return 'level'

  // 牽制即攻撃
  const ev = target.defense.getTarget(actor).target
  if (ev >= 11) return 'feint'

  // 2回攻撃
  return 'double'
}

// 現在位置から攻撃対象が見つからない場合, 移動すれば対象に届く移動先を返す関数
// 実際には, 自身が左翼か右翼にいる場合に, その反対側へ移動を実行する
function pickMoveToReachMeleeTarget(actor: Unit, state: State): Position | null {
  const action = state.action!

  // 移動しても攻撃対象が増え得ない場合
  // 既に攻撃対象が見つかり得る場合は null を返す
  if (action.target.melee.length > 0 || actor.position === 'center') return null
  // 攻撃対象が見つかり得ない場合は null を返す
  if (actor.position === 'back' || action.target.enemies.every(enemy => enemy.position === 'back')) return null

  // 攻撃対象が増え得る場合
  // 現在位置の反対側か, 中央へ移動できれば移動する
  const opposite: Position = actor.position === 'left' ? 'right' : 'left'
  const candidates: Position[] = [opposite, 'center']
  return candidates.find(position => action.availability.move[position]) ?? null
}

// 行動不能 (朦朧・幻惑・恐慌状態のいずれか) に該当すれば true を返す関数
function isIncapacitated(unit: Unit): boolean {
  return unit.health.stunned || unit.debuff.dazed || unit.debuff.fear
}

// 攻撃対象のうちから防御目標値が最も低い対象を返す関数
// excludeFeint: false で, 牽制による修正込み
function pickLowestDefenseTarget(actor: Unit, candidates: Unit[], excludeFeint: boolean = false): Unit | null {
  if (excludeFeint) {
    return pickByPriority(candidates, unit => unit.defense.target.target)
  }
  return pickByPriority(candidates, unit => unit.defense.getTarget(actor).target)
}

// 複数の優先条件を順に適用し, 対象候補を1体に絞り込む関数
// 各条件 (keyFns) は数値が低いほど優先する
export function pickByPriority<T>(candidates: T[], ...keyFns: Array<(unit: T) => number>): T | null {
  let pool = candidates
  for (const keyFn of keyFns) {
    if (pool.length <= 1) break
    const minValue = Math.min(...pool.map(keyFn))
    pool = pool.filter(unit => keyFn(unit) === minValue)
  }
  return pool[0] ?? null
}

// 敵前衛がいれば敵前衛を候補とし, いなければ敵全員を候補とする関数
export function frontOrAll(candidates: Unit[]): Unit[] {
  const front = candidates.filter(unit => unit.position !== 'back')
  return front.length > 0 ? front : candidates
}

// 自身が攻撃者候補全員から受ける防御目標値のうち,
// 最も不利な値 (=牽制修正が最大にかかった値) を取得する関数
// (取得した防御目標値を, 全力攻撃/全力防御を選択する判断基準とする)
function worstOwnDefenseTarget(actor: Unit, attackers: Unit[]): number {
  if (attackers.length === 0) return actor.defense.target.target
  return Math.min(...attackers.map(attacker => actor.defense.getTarget(attacker).target))
}

// 魔法の基本詠唱パターン (AI/base/*Spell.ts) で共通利用する, 系譜ごとのアクション生成ヘルパー
export function createSpellActions(actor: Unit, state: State, element: SpellElement) {
  // cast: 集中を1ターン進める
  const cast = (): ActionRequest => ({ key: 'cast', options: { element } })
  
  // self: 対象を持たない術を発動する
  const self = (spellId: number): ActionRequest => ({ key: 'spell', options: { element, spellId }, target: actor })
  
  // enemy: 敵陣営から防御目標値が最も低い相手を選び, その術を発動する
  const primaryTarget = pickLowestDefenseTarget(actor, state.action!.target.enemies, true)
  const enemy = (spellId: number): ActionRequest => primaryTarget
    ? { key: 'spell', options: { element, spellId }, target: primaryTarget }
    : { key: 'cast', options: { element } }

  return { cast, self, enemy, primaryTarget }
}
