// src/domains/Combat/Spells/index.ts

import { type ParameterKey } from '../../Character'

export const SPELL_ELEMENTS = ['blue', 'red', 'green'] as const

export type SpellElement = typeof SPELL_ELEMENTS[number]

export const SPELL_ELEMENT_LABELS: Record<SpellElement, ParameterKey> = {
  blue: '青の魔法', red: '赤の魔法', green: '緑の魔法'
} as const

// バフ効果の対象
export type SpellBuffTarget = 'level' | 'dmg' | 'ev' | 'dr'

// バフ効果のログ表示用ラベル
export const SPELL_BUFF_LABELS: Record<SpellBuffTarget, string> = {
  level: '命中', dmg: '攻撃', ev: '回避', dr: '防御'
} as const

// デバフ効果の対象
export type SpellDebuffTarget = 'dazed' | 'berserk' | 'fear'

// デバフ効果のログ表示用ラベル
export const SPELL_DEBUFF_LABELS: Record<SpellDebuffTarget, string> = {
  berserk: '狂戦士', dazed: '幻惑', fear: '恐慌'
} as const

/**
 * 魔法の機械的効果
 * 
 * buff (バフ系)
 * debuff: (デバフ系): duration (魔法の継続時間), resistMod (抵抗判定へ課す修正)
 * debuffAll (全体デバフ系): duration (魔法の継続時間), resistMod (抵抗判定へ課す修正, 敵/味方それぞれ)
 * trip (転倒系): 回避判定を伴う
 * dmg (直接ダメージ系): dice (ダメージダイスの数), dmgType (攻撃型), 回避判定を伴う
 *   metalPenalty (回避判定-4, DR貫通)
 *   randomTarget (対象をランダムに選出)
 * dmgAll (全体ダメージ系): dice (ダメージダイスの数), dmgType (攻撃型), 回避判定を伴う
 * flash (閃光系): 敵全体が対象, 回避判定を伴う (ただし精神集中中は回避を試みない)
 * heal (回復系): fraction (最大Hpに比例する回復幅)
 * cleanse (状態異常解除): 特殊 (味方全体の状態異常を解除する)
 * barrier (魔法障壁): 特殊 (自営陣への距離による修正を倍にする)
 * 
 */
export type SpellEffect =
  | { kind: 'buff', target: SpellBuffTarget }
  | { kind: 'debuff', target: SpellDebuffTarget, duration: number | 'margin', resistMod: number }
  | { kind: 'debuffAll', target: SpellDebuffTarget, duration: number | 'margin', enemyResistMod: number, allyResistMod: number }
  | { kind: 'trip' }
  | { kind: 'dmg', dice: number, dmgType: 0 | 1 | 2, metalPenalty?: boolean, randomTarget?: boolean }
  | { kind: 'dmgAll', dice: number, dmgType: 0 | 1 | 2 }
  | { kind: 'flash' }
  | { kind: 'heal', fraction: number }
  | { kind: 'cleanse' }
  | { kind: 'barrier' }

// 対象範囲
type SpellTargetScope = 'ally' | 'enemy' | 'all'

// 魔法の定義
type Spell = {
  id: number
  label: string
  cast: number
  effects?: SpellEffect[]
  targetScope?: SpellTargetScope
}

const BLUE_SPELL: Spell[] = [
  { id: 0, label: '癒しの雫', cast: 1, effects: [{ kind: 'heal', fraction: 1 / 3 }], targetScope: 'ally' },
  { id: 1, label: '水弾', cast: 1, effects: [{ kind: 'trip' }], targetScope: 'enemy' },
  { id: 2, label: 'ぼんやり', cast: 2, effects: [{ kind: 'debuff', target: 'dazed', duration: 'margin', resistMod: -2 }], targetScope: 'enemy' },
  { id: 3, label: '水の鎧', cast: 2, effects: [{ kind: 'buff', target: 'dr' }], targetScope: 'ally' },
  { id: 4, label: '魔法障壁', cast: 3, effects: [{ kind: 'barrier' }] },
  { id: 5, label: '浄化の雨', cast: 3, effects: [{ kind: 'cleanse' }] },
] as const

const RED_SPELL: Spell[] = [
  { id: 0, label: 'ヒロイズム', cast: 1, effects: [{ kind: 'buff', target: 'level' }], targetScope: 'ally' },
  { id: 1, label: '閃光', cast: 1, effects: [{ kind: 'flash' }] },
  { id: 2, label: '火球', cast: 2, effects: [{ kind: 'dmg', dice: 2, dmgType: 0 }], targetScope: 'enemy' },
  { id: 3, label: '炎の嵐', cast: 2, effects: [{ kind: 'dmgAll', dice: 2, dmgType: 0 }] },
  { id: 4, label: '聖戦', cast: 3, effects: [{ kind: 'debuffAll', target: 'berserk', duration: 'margin', enemyResistMod: -2, allyResistMod: 0 }] },
  { id: 5, label: '召雷', cast: 3, effects: [{ kind: 'dmg', dice: 3, dmgType: 0, metalPenalty: true }], targetScope: 'enemy' }
] as const

const GREEN_SPELL: Spell[] = [
  { id: 0, label: 'ヘイスト', cast: 1, effects: [{ kind: 'buff', target: 'ev' }], targetScope: 'ally' },
  { id: 1, label: '茨の鞭', cast: 1, effects: [{ kind: 'dmg', dice: 1, dmgType: 2 }], targetScope: 'enemy' },
  { id: 2, label: '風の刃', cast: 2, effects: [{ kind: 'dmg', dice: 2, dmgType: 1 }], targetScope: 'enemy' },
  { id: 3, label: '風の盾', cast: 2 }, // 防御魔法
  { id: 4, label: '恐慌', cast: 3, effects: [{ kind: 'debuff', target: 'fear', duration: 'margin', resistMod: -2 }], targetScope: 'enemy' },
  { id: 5, label: '竜巻', cast: 3, effects: [
    { kind: 'dmg', dice: 2, dmgType: 0, randomTarget: true },
    { kind: 'dmg', dice: 2, dmgType: 1, randomTarget: true },
    { kind: 'dmg', dice: 2, dmgType: 2, randomTarget: true }
  ]}
] as const

export const SPELL_LIST: Record<SpellElement, Spell[]> = {
  blue: BLUE_SPELL,
  red: RED_SPELL,
  green: GREEN_SPELL
}

export type Elements = Record<SpellElement, number>

// ユニットの使用できる魔法, 精神集中を管理するクラス
export class CombatSpells {
  public level: Elements
  public cast: Elements

  constructor(spells: Elements) {
    this.level = spells
    this.cast = SPELL_ELEMENTS.reduce((acc, element) => {
      acc[element] = 0
      return acc
    }, {} as Elements)
  }
}
