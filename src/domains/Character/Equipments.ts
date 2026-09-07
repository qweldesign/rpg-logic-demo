// src/domains/Character/Equipments.ts

// 武器のキー
const WEAPON_KEYS = [
  '細剣', '長剣', '戦棍', '戦斧', '長槍', '大剣', '長杖', '鉾槍'
] as const

export type WeaponKey = typeof WEAPON_KEYS[number]

// 武器の定義
export type Weapon = {
  dmgBase: number // 性能値
  dmgType: 0 | 1 | 2 // 攻撃型 (0: 叩, 1: 切, 2: 刺)
  twoHanded: boolean // 両手が必要か
  ready: boolean // 準備が必要か
  requiredST: number // 必要筋力
}

const WEAPONS: Record<WeaponKey, Weapon> = {
  '細剣': { dmgBase: 4, dmgType: 2, twoHanded: false, ready: false, requiredST: 10 },
  '長剣': { dmgBase: 5, dmgType: 1, twoHanded: false, ready: false, requiredST: 10 },
  '戦棍': { dmgBase: 6, dmgType: 0, twoHanded: false, ready: false, requiredST: 10 },
  '戦斧': { dmgBase: 8, dmgType: 1, twoHanded: false, ready: true, requiredST: 12 },
  '長槍': { dmgBase: 5, dmgType: 2, twoHanded: true, ready: false, requiredST: 11 },
  '大剣': { dmgBase: 6, dmgType: 1, twoHanded: true, ready: false, requiredST: 11 },
  '長杖': { dmgBase: 8, dmgType: 0, twoHanded: true, ready: false, requiredST: 11 },
  '鉾槍': { dmgBase: 12, dmgType: 1, twoHanded: true, ready: true, requiredST: 13 }
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
  { name: '1d', dmgDice: 1, dmgMod: 0 }, // 4
  { name: '1d+1', dmgDice: 1, dmgMod: 1 }, // 5
  { name: '1d+2', dmgDice: 1, dmgMod: 2 }, // 6
  { name: '2d-1', dmgDice: 2, dmgMod: -1 }, // 7
  { name: '2d', dmgDice: 2, dmgMod: 0 }, // 8
  { name: '2d+1', dmgDice: 2, dmgMod: 1 }, // 9
  { name: '2d+2', dmgDice: 2, dmgMod: 2 }, // 10
  { name: '3d-1', dmgDice: 3, dmgMod: -1 }, // 11
  { name: '3d', dmgDice: 3, dmgMod: 0 }, // 12
  { name: '3d+1', dmgDice: 3, dmgMod: 1 }, // 13
  { name: '3d+2', dmgDice: 3, dmgMod: 2 }, // 14
  { name: '4d-1', dmgDice: 4, dmgMod: -1 }, // 15
  { name: '4d', dmgDice: 4, dmgMod: 0 } // 16
] as const

// 盾のキー
const SHIELD_KEYS = [
  '小盾', '大盾'
] as const

export type ShieldKey = typeof SHIELD_KEYS[number]

// 盾の定義
export type Shield = {
  isLarge: boolean // 大型盾か
  requiredST: number // 必要筋力
}

const SHIELDS: Record<ShieldKey, Shield> = {
  '小盾': { isLarge: false, requiredST: 10 },
  '大盾': { isLarge: true, requiredST: 12 }
} as const

// 服・鎧のキー
const ARMOR_KEYS = [
  '革服', '革鎧', 'チェインメイル', 'プレイトメイル'
] as const

export type ArmorKey = typeof ARMOR_KEYS[number]

// 服・鎧の定義
export type Armor = {
  dr: number // ダメージ抵抗
  isChain: boolean // 環状構造か
  requiredST: number // 必要筋力
}

const ARMORS: Record<ArmorKey, Armor> = {
  '革服': { dr: 1, isChain: false, requiredST: 10 },
  '革鎧': { dr: 2, isChain: false, requiredST: 11 },
  'チェインメイル': { dr: 3, isChain: true, requiredST: 12 },
  'プレイトメイル': { dr: 4, isChain: false, requiredST: 13 }
} as const

// 装備管理を司るクラス
export class Equipments {
  private _weapon: WeaponKey
  private _shield: ShieldKey | null
  private _armor: ArmorKey

  constructor(weapon: WeaponKey = '細剣', shield: ShieldKey | null = '小盾', armor: ArmorKey = '革服') {
    this._weapon = weapon
    this._shield = shield
    this._armor = armor
  }

  // 武器をセット
  set weapon(weapon: WeaponKey) {
    this._weapon = weapon
  }

  // 盾をセット
  set shield(shield: ShieldKey | null) {
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
  get shield(): Shield & { name: ShieldKey } | null {
    return this._shield ? { name: this._shield, ...SHIELDS[this._shield] } : null
  }

  // 服・鎧を取得
  get armor(): Armor & { name: ArmorKey } {
    return { name: this._armor, ...ARMORS[this._armor] }
  }

  // ダメージ修正を引数として受け取り, 武器のダメージオブジェクトを取得
  getDmg(mod: number): Dmg {
    const { dmgBase, dmgType } = this.weapon
    const totalDmg = dmgBase + mod
    const step = DMG_STEP[Math.max(0, Math.min(totalDmg - 4, DMG_STEP.length - 1))]
    return { ...step, dmgType }
  }

  // ダメージ修正を引数として受け取り, 武器のダメージ表記を取得
  getDmgName(mod: number): string {
    const { dmgDice, dmgMod } = this.getDmg(mod)
    const dmgTypeStr = ['叩', '切', '刺'][this.weapon.dmgType]
    return `${dmgDice}d${dmgMod === 0 ? '' : dmgMod > 0 ? '+' + dmgMod : dmgMod} (${dmgTypeStr})`
  }

  // 服・鎧のDR表記を取得
  getDRName(): string {
    const { dr, isChain } = this.armor
    return `${dr}${isChain ? ' (' + Math.floor(dr / 2) + ')' : ''}`
  }
}
