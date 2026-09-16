// src/domains/Character/Equipments.ts

// 武器のキー
export const WEAPON_KEYS = [
  '装備無し', '短剣', '小剣', '長剣', '大剣', '棍棒', '戦棍', '戦斧', '長杖', '長槍', '鉾槍'
] as const

export type WeaponKey = typeof WEAPON_KEYS[number]

// 武器の定義
export type Weapon = {
  dmgBase: number // 性能値
  dmgType: 0 | 1 | 2 // 攻撃型 (0: 叩, 1: 切, 2: 刺)
  twoHanded: boolean // 両手が必要か
  ready: boolean // 準備が必要か
  requiredST?: number // 必要筋力
  gold: number // 金額
}

export const WEAPONS: Record<WeaponKey, Weapon> = {
  '装備無し': { dmgBase: 2, dmgType: 0, twoHanded: false, ready: false, gold: 0 },
  '短剣': { dmgBase: 2, dmgType: 1, twoHanded: false, ready: false, gold: 10 },
  '小剣': { dmgBase: 2, dmgType: 2, twoHanded: false, ready: false, gold: 20 },
  '長剣': { dmgBase: 3, dmgType: 1, twoHanded: false, ready: false, requiredST: 11, gold: 40 },
  '大剣': { dmgBase: 4, dmgType: 1, twoHanded: true, ready: false, requiredST: 13, gold: 80 },
  '棍棒': { dmgBase: 5, dmgType: 0, twoHanded: false, ready: true, gold: 10 },
  '戦棍': { dmgBase: 6, dmgType: 0, twoHanded: false, ready: true, requiredST: 11, gold: 20 },
  '戦斧': { dmgBase: 5, dmgType: 1, twoHanded: false, ready: true, requiredST: 13, gold: 40 },
  '長杖': { dmgBase: 4, dmgType: 0, twoHanded: true, ready: false, gold: 10 },
  '長槍': { dmgBase: 3, dmgType: 2, twoHanded: true, ready: false, requiredST: 11, gold: 20 },
  '鉾槍': { dmgBase: 7, dmgType: 1, twoHanded: true, ready: true, requiredST: 13, gold: 40 }
} as const

// ダメージの定義
export type Dmg = {
  name: string // ダメージ表記
  dmgDice: number // ダメージダイスの数
  dmgMod: number // ダメージ修正値
  dmgType: 0 | 1 | 2 // 攻撃型 (0: 叩, 1: 切, 2: 刺)
}

// ダメージステップ
const DMG_STEP: Omit<Dmg, 'dmgType'>[] = [
  { name: '1d-2', dmgDice: 1, dmgMod: -2 }, // 0
  { name: '1d-1', dmgDice: 1, dmgMod: -1 }, // 1
  { name: '1d', dmgDice: 1, dmgMod: 0 }, // 2
  { name: '1d+1', dmgDice: 1, dmgMod: 1 }, // 3
  { name: '1d+2', dmgDice: 1, dmgMod: 2 }, // 4
  { name: '2d-1', dmgDice: 2, dmgMod: -1 }, // 5
  { name: '2d', dmgDice: 2, dmgMod: 0 }, // 6
  { name: '2d+1', dmgDice: 2, dmgMod: 1 }, // 7
  { name: '2d+2', dmgDice: 2, dmgMod: 2 }, // 8
  { name: '3d-1', dmgDice: 3, dmgMod: -1 }, // 9
  { name: '3d', dmgDice: 3, dmgMod: 0 }, // 10
  { name: '3d+1', dmgDice: 3, dmgMod: 1 }, // 11
  { name: '3d+2', dmgDice: 3, dmgMod: 2 } // 12
] as const

// 攻撃型
const DMG_TYPE_LABELS = ['叩', '切', '刺']

// 盾のキー
export const SHIELD_KEYS = [
  '装備無し', '小盾', '大盾'
] as const

export type ShieldKey = typeof SHIELD_KEYS[number]

// 盾の定義
export type Shield = {
  size: number // 大きさ
  requiredST?: number // 必要筋力
  gold: number // 金額
}

export const SHIELDS: Record<ShieldKey, Shield> = {
  '装備無し': { size: 0, gold: 0 },
  '小盾': { size: 1, gold: 10 },
  '大盾': { size: 2, requiredST: 13, gold: 40 }
} as const

// 服・鎧のキー
export const ARMOR_KEYS = [
  '服', '革服', '革鎧', 'チェインメイル', 'プレイトメイル'
] as const

export type ArmorKey = typeof ARMOR_KEYS[number]

// 服・鎧の定義
export type Armor = {
  dr: number // ダメージ抵抗
  isChain: boolean // 環状構造か
  requiredST?: number // 必要筋力
  gold: number // 金額
}

export const ARMORS: Record<ArmorKey, Armor> = {
  '服': { dr: 1, isChain: true, gold: 0 },
  '革服': { dr: 1, isChain: false, gold: 20 },
  '革鎧': { dr: 2, isChain: false, requiredST: 11, gold: 40 },
  'チェインメイル': { dr: 3, isChain: true, requiredST: 12, gold: 80 },
  'プレイトメイル': { dr: 4, isChain: false, requiredST: 13, gold: 160 }
} as const

// 装備管理を司るクラス
export class Equipments {
  private _weapon: WeaponKey
  private _shield: ShieldKey
  private _armor: ArmorKey

  constructor(weapon: WeaponKey = '装備無し', shield: ShieldKey = '装備無し', armor: ArmorKey = '服') {
    this._weapon = weapon
    this._shield = shield
    this._armor = armor
  }

  // 武器をセット
  set weapon(weapon: WeaponKey) {
    this._weapon = weapon
  }

  // 盾をセット
  set shield(shield: ShieldKey) {
    this._shield = shield
  }

  // 服・鎧をセット
  set armor(armor: ArmorKey) {
    this._armor = armor
  }

  // 武器を取得
  get weapon(): Weapon & { name: WeaponKey } {
    return { name: this._weapon, ...WEAPONS[this._weapon] }
  }

  // 盾を取得
  get shield(): Shield & { name: ShieldKey } {
    return { name: this._shield, ...SHIELDS[this._shield] }
  }

  // 服・鎧を取得
  get armor(): Armor & { name: ArmorKey } {
    return { name: this._armor, ...ARMORS[this._armor] }
  }

  // Gold 総額を算出
  get gold(): number {
    let total = this.weapon.gold
    total += this.shield.gold
    total += this.armor.gold
    return total
  }

  // ダメージ修正を引数として受け取り, 武器のダメージオブジェクトを取得
  getDmg(mod: number): Dmg {
    const { dmgBase, dmgType } = this.weapon
    const totalDmg = dmgBase + mod
    const step = DMG_STEP[Math.max(0, Math.min(totalDmg, DMG_STEP.length - 1))]
    return { ...step, dmgType }
  }

  // ダメージ修正を引数として受け取り, 武器のダメージ表記を取得
  getDmgName(mod: number): string {
    const { dmgDice, dmgMod } = this.getDmg(mod)
    const dmgTypeStr = DMG_TYPE_LABELS[this.weapon.dmgType]
    return `${dmgDice}d${dmgMod === 0 ? '' : dmgMod > 0 ? '+' + dmgMod : dmgMod} (${dmgTypeStr})`
  }

  // 服・鎧のDR表記を取得
  getDRName(): string {
    const { dr, isChain } = this.armor
    return `${dr}${isChain ? ' (' + Math.floor(dr / 2) + ')' : ''}`
  }
}
