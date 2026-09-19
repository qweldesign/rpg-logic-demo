// Combat/Enemy/Mob.ts

import { type EnemyParams, type EnemyEquips, type EnemyDef } from '.'

// ゴブリンの汎用的パラメータ
const GOBLIN_PARAMS: EnemyParams = {
  maxHp: 8,
  level: 14,
  dmgMod: 0,
  dmgBuff: 0,
  ev: 10,
  evBuff: 0,
  pre: 10,
  mre: 10
}

// ホブリンの汎用的パラメータ
const HOBLIN_PARAMS: EnemyParams = {
  maxHp: 12, // 最大Hp +4
  level: 13, // 技能値 -1
  dmgMod: 1, // ダメージ修正 +1
  dmgBuff: 0,
  ev: 10,
  evBuff: 0,
  pre: 10,
  mre: 10
}

// ゴブリンの装備 (武器種のみ指定)
const GOBLIN_EQUIPS_SETS: Record<string, EnemyEquips> = {
  '短剣': [ '短剣', '装備無し', '服' ],
  '小剣': [ '小剣', '装備無し', '服' ],
  '棍棒': [ '棍棒', '装備無し', '服' ],
  '長杖': [ '長杖', '装備無し', '服' ],
  '短剣/小盾': [ '短剣', '小盾', '革鎧' ],
  '小剣/小盾': [ '小剣', '小盾', '革鎧' ],
  '棍棒/小盾': [ '棍棒', '小盾', '革鎧' ],
  '長剣/小盾': [ '長剣', '小盾', '革鎧' ]
}

// ゴブリン後衛
const GOBLIN_BACK_UNITS: EnemyDef[] = [
  { name: 'ゴブリン:長杖', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['長杖'], elements: ['blue', 'green'], tacticType: 'supporter', temperType: 'reckless' }
]

// ゴブリン前衛
const GOBLIN_FRONT_UNITS: EnemyDef[] = [
  { name: 'ゴブリン:短剣', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['短剣'], tacticType: 'attacker', temperType: 'reckless' },
  { name: 'ゴブリン:小剣', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['小剣'], tacticType: 'attacker', temperType: 'reckless' },
  { name: 'ゴブリン:棍棒', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['棍棒'], tacticType: 'attacker', temperType: 'reckless' }
]

// ホブリン後衛
const HOBLIN_BACK_UNITS: EnemyDef[] = [
  { name: 'ホブリン:長剣', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['長剣/小盾'], elements: ['red'], tacticType: 'balanced' }
]

// ホブリン前衛
const HOBLIN_FRONT_UNITS: EnemyDef[] = [
  { name: 'ホブリン:短剣', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['短剣/小盾'], tacticType: 'defender' },
  { name: 'ホブリン:小剣', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['小剣/小盾'], tacticType: 'defender' },
  { name: 'ホブリン:棍棒', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['棍棒/小盾'], tacticType: 'defender' }
]

// シード値 0～3 を生成: ホブリンを1体選ぶ (後衛1/前衛3)
export function makeGoblinFormation(seed: number): EnemyDef[] {
  const members: EnemyDef[] = []

  // ホブリンが後衛
  if (seed === 0) {
    // ホブリン後衛を1体追加
    members.push(HOBLIN_BACK_UNITS[0])
    // ゴブリン前衛を3体追加
    GOBLIN_FRONT_UNITS.forEach((unit) => {
      members.push(unit)
    })
  }

  // ホブリンが前衛
  if (seed > 0) {
    // ゴブリン後衛を1体追加
    members.push(GOBLIN_BACK_UNITS[0])
    // ホブリン前衛を1体追加
    members.push(HOBLIN_FRONT_UNITS[seed - 1])
    // ゴブリン前衛を2体追加
    GOBLIN_FRONT_UNITS.forEach((unit, i) => {
      if (i !== seed - 1) members.push(unit)
    })
  }

  return members
}
