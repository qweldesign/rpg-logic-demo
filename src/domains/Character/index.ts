// src/domains/Character/index.ts

import { type Point, type ParameterKey, type Parameter, Parameters } from './Parameters'
import { type WeaponKey, type Weapon, type Dmg, type ShieldKey, type Shield, type ArmorKey, type Armor, Equipments } from './Equipments'

export { type Point, type ParameterKey, type Parameter, Parameters, type WeaponKey, type Weapon, type Dmg, type ShieldKey, type Shield, type ArmorKey, type Armor, Equipments }

// キャラクタ・モデル
export type CharacterModel = {
  id: number
  name: string
  points: Point[]
  equipments: [WeaponKey, ShieldKey | null, ArmorKey] | []
}

// キャラクタ管理を司るクラス
export class Character {
  public id: number
  public name: string
  private parameters: Parameters
  private equipments: Equipments

  constructor(model: CharacterModel) {
    this.id = model.id
    this.name = model.name
    this.parameters = new Parameters(model.points)
    this.equipments = model.equipments.length ? new Equipments(...model.equipments) : new Equipments()
  }

  // name と size を指定し, POINT_STEP に則りパラメータを増減
  // Map に無ければ追加し, 最小値(0)になれば削除する
  step(name: ParameterKey, size: number = 1) {
    this.parameters.step(name, size)
  }

  // name を指定し, point (CP) を取得
  get(name: ParameterKey): Point {
    return this.parameters.get(name)
  }

  // name を指定し, level (能力値・技能値) を算出
  getLevel(name: ParameterKey): number {
    return this.parameters.getLevel(name)
  }

  // point 総計を算出
  get total(): number {
    return this.parameters.total
  }

  // 最大Hpを取得
  get maxHp() {
    return this.parameters.maxHp
  }

  // ダメージ修正を取得
  get dmgMod() {
    return this.parameters.dmgMod
  }

  //「よけ」を取得
  get ev() {
    return this.parameters.ev
  }

  // name を指定し, その全ての属性を, オブジェクトに変換して取得
  getParam(name: ParameterKey): Parameter {
    return this.parameters.getParam(name)
  }

  // 全てのパラメータとその全ての属性を, オブジェクトの配列に変換して取得 (ソート込み)
  get params() {
    return this.parameters.params
  }

  // 全ての技能とその全ての属性を, オブジェクトの配列に変換して取得 (ソート込み)
  get skills() {
    return this.parameters.skills
  }

  // 「武術」か「剣術」のうち高い方を返す
  // 大盾を装備していると, level - 2
  get combatSkill(): Parameter {
    const warrior = this.getParam('武術')
    const fencer = this.getParam('剣術')
    const result = warrior.level >= fencer.level ? warrior : fencer
    const hasLargeShield = this.shield?.name === '大盾' ? 2 : 0
    return { ...result, level: result.level - hasLargeShield}
  }

  // 主技能 (level が最も高いか Point 消費が最も多い技能) を取得
  // 無ければ「武術」を返す
  get mainSkill(): Parameter {
    if (this.skills.length) {
      const sorted = this.skills.sort((a, b) => {
        return b.level === a.level ? b.point - a.point : b.level - a.level
      })
      return sorted[0]
    } else {
      return {
        name: '武術', base: '筋力', point: 0, level: this.getLevel('筋力')
      }
    }
  }

  // 武器をセット
  set weapon(weaponKey: WeaponKey) {
    this.equipments.weapon = weaponKey
  }

  // 盾をセット
  set shield(shieldKey: ShieldKey | null) {
    this.equipments.shield = shieldKey
  }

  // 防具をセット
  set armor(armorKey: ArmorKey) {
    this.equipments.armor = armorKey
  }

  // 武器を取得
  get weapon(): Weapon & { name: WeaponKey } {
    return this.equipments.weapon
  }

  // 盾を取得
  get shield(): Shield & { name: ShieldKey } | null {
    return this.equipments.shield
  }

  // 胴防具を取得
  get armor(): Armor & { name: ArmorKey } {
    return this.equipments.armor
  }

  // 武器のダメージオブジェクトを取得
  getDmg(): Dmg {
    return this.equipments.getDmg(this.dmgMod)
  }

  // 武器のダメージ表記を取得
  getDmgName(): string {
    return this.equipments.getDmgName(this.dmgMod)
  }

  // 服・鎧のDR表記を取得
  getDRName(): string {
    return this.equipments.getDRName()
  }

  // 「よけ」: Ev - 服・鎧の重量 (DR)
  get dev(): number {
    return this.ev - this.armor.dr
  }

  // 「受け」: Ev + 武器の防御補正 (片手持ち: +1, 両手持ち: +3)
  get pev(): number {
    return this.ev + (this.weapon.twoHanded ? 3 : 1)
  }

  // 「止め」: Ev + 盾の防御補正 (小盾: +2, 大盾: +4)
  get bev(): number {
    if (!this.shield) return 0
    return this.ev + (this.shield.isLarge ? 4 : 2)
  }

  // Model用データに変換
  get model(): CharacterModel {
    return {
      id: this.id,
      name: this.name,
      points: this.parameters.model,
      equipments: this.equipments.model
    }
  }
}
