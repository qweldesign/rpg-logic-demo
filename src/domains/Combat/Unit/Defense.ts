// src/domains/Combat/Unit/Defense.ts

import { type CombatUnitModel as UnitModel, type CombatUnit as Unit } from '.'

export type DefenseType = 'parry' | 'block' | 'dodge'

export type DefenseTarget = {
  type: DefenseType
  target: number
}

export class CombatDefense {
  // 設定値
  private self: Unit
  public name: {shield: string | null, armor: string}
  private ev: { self: number, weapon: number, shield: number, wt: number }
  public dr: number
  public isChain : boolean
  public drName: string
  // 状態値
  public parryCount: number //「受け」試行回数
  public blockCount: number //「止め」試行回数
  public isFullDefenseTurn: boolean //「全力防御」実行ターン
  public isFullDefense: boolean //「全力防御」可否

  constructor(self: Unit, model: UnitModel) {
    this.self = self
    this.name = { shield: model.equipments.shield?.name ?? null, armor: model.equipments.armor.name }
    this.ev = {
      self: model.ev,
      weapon: model.equipments.weapon.twoHanded ? 3 : 1,
      shield: model.equipments.shield ? (model.equipments.shield.isLarge ? 4 : 2) : 0,
      wt: model.equipments.armor.dr
    }
    this.dr = model.equipments.armor.dr
    this.isChain = model.equipments.armor.isChain
    this.drName = model.equipments.getDRName()
    this.parryCount = 0
    this.blockCount = 0
    this.isFullDefenseTurn = false
    this.isFullDefense = false
  }

  // 次のターンに進む際に, 「受け」「止め」試行回数と「全力防御」をリセットする
  nextTurn() {
    this.parryCount = 0
    this.blockCount = 0
    this.isFullDefense =  this.isFullDefenseTurn
    this.isFullDefenseTurn = false
  }

  // 各種防御 (回避判定) の可否状況を取得
  // 「受け」
  get canParry() {
    return (this.ev.weapon > 0
      && this.self.attack.ready
      && this.parryCount < (this.isFullDefense ? 2 : 1)
    )
  }

  // 「止め」
  get canBlock() {
    return (this.ev.shield > 0
      && this.blockCount < (this.isFullDefense ? 2 : 1)
    )
  }

  // 防御 (回避判定) の目標値を取得
  // 各種自身の状況による修正値 (バフ, デバフ, 朦朧状態, 転倒) を含める
  // 各種戦闘の状況による修正値 (牽制のターゲットによる修正) を含めない
  // 「受け」
  get parryTarget() {
    let mod = 0
    if (this.self.health.stunned) mod -= 4
    else if (this.self.health.prone) mod -= 2
    return Math.max(4, this.ev.self + this.ev.weapon + mod)
  }

  // 「止め」
  get blockTarget() {
    let mod = 0
    if (this.self.health.stunned) mod -= 4
    else if (this.self.health.prone) mod -= 2
    return Math.max(4, this.ev.self + this.ev.shield + mod)
  }
  
  // 「よけ」
  get dodgeTarget() {
    let mod = 0
    if (this.self.health.stunned) mod -= 4
    else if (this.self.health.prone) mod -= 2
    return Math.max(4, this.ev.self - this.ev.wt + mod)
  }

  // 可能な防御のうちで, 最も成功率の高い防御の目標値を取得
  get target(): DefenseTarget {
    let type, target
    if (this.canBlock) {
      type = 'block' as const
      target = this.blockTarget
    } else if (this.canParry) {
      type = 'parry' as const
      target = this.parryTarget
    } else {
      type = 'dodge' as const
      target = this.dodgeTarget
    }
    return { type, target }
  }

  // 防御 (回避判定) の目標値を取得
  // 各種状況による修正値 (バフ, デバフ, 朦朧状態, 転倒, 牽制のターゲットによる修正) を含める
  // 「受け」
  getParryTarget() {
    return Math.max(4, this.parryTarget)
  }

  // 「止め」
  getBlockTarget() {
    return Math.max(4, this.blockTarget)
  }

  // 「よけ」
  getDodgeTarget() {
    return Math.max(4, this.dodgeTarget)
  }

  // 可能な防御のうちで, 最も成功率の高い防御の目標値を取得
  getTarget(): DefenseTarget {
    let type, target
    if (this.canBlock) {
      type = 'block' as const
      target = this.getBlockTarget()
    } else if (this.canParry) {
      type = 'parry' as const
      target = this.getParryTarget()
    } else {
      type = 'dodge' as const
      target = this.getDodgeTarget()
    }
    return { type, target }
  }
}
