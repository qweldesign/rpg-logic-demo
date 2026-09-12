// Combat/Enemy/Goblin.ts

import { type EnemyParams, type EnemyEquips, type EnemyDef, type EnemyFormationDef } from '.'

// ゴブリンの汎用的パラメータ
const GOBLIN_PARAMS: EnemyParams = {
  maxHp: 8,
  dmgMod: 0,
  level: 14,
  ev: 10,
  pre: 10,
  mre: 10
}

// ホブリンの汎用的パラメータ
const HOBLIN_PARAMS: EnemyParams = {
  maxHp: 12, // 最大Hp +4
  dmgMod: 1, // ダメージ修正 +1
  level: 13, // 技能値 -1
  ev: 10,
  pre: 10,
  mre: 10
}

// ゴブリンの装備 (武器種のみ指定)
const GOBLIN_EQUIPS_SETS: Record<string, EnemyEquips> = {
  '短剣': [ '短剣', null, '服' ],
  '小剣': [ '小剣', null, '服' ],
  '棍棒': [ '棍棒', null, '服' ],
  '長杖': [ '長杖', null, '服' ],
  '短剣/小盾': [ '短剣', '小盾', '革鎧' ],
  '小剣/小盾': [ '小剣', '小盾', '革鎧' ],
  '棍棒/小盾': [ '棍棒', '小盾', '革鎧' ],
  '長剣/小盾': [ '長剣', '小盾', '革鎧' ]
}

// ゴブリン後衛
const GOBLIN_BACK_UNITS: EnemyDef[] = [
  { name: 'ゴブリン:長杖', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['長杖'] }
]

// ゴブリン前衛
const GOBLIN_FRONT_UNITS: EnemyDef[] = [
  { name: 'ゴブリン:短剣', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['短剣'] },
  { name: 'ゴブリン:小剣', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['小剣'] },
  { name: 'ゴブリン:棍棒', params: GOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['棍棒'] }
]

// ホブリン後衛
const HOBLIN_BACK_UNITS: EnemyDef[] = [
  { name: 'ホブリン:長剣', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['長剣/小盾'] }
]

// ホブリン前衛
const HOBLIN_FRONT_UNITS: EnemyDef[] = [
  { name: 'ホブリン:短剣', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['短剣/小盾'] },
  { name: 'ホブリン:小剣', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['小剣/小盾'] },
  { name: 'ホブリン:棍棒', params: HOBLIN_PARAMS, equips: GOBLIN_EQUIPS_SETS['棍棒/小盾'] }
]

export function makeGoblinFormation(): EnemyFormationDef {
  const members: EnemyDef[] = []
  let rewardCp = 0

  // ホブリンを1体選ぶ
  const h = Math.floor(Math.random() * (HOBLIN_BACK_UNITS.length + HOBLIN_FRONT_UNITS.length))

  // ホブリンが後衛
  if (h === 0) {
    // ホブリン:長剣 を追加
    members.push(HOBLIN_BACK_UNITS[0])

    // ゴブリン前衛を3体追加
    GOBLIN_FRONT_UNITS.forEach((unit) => {
      members.push(unit)
    })

    // 報酬を設定
    rewardCp = 1
  }

  // ホブリンが前衛
  if (h > 0) {
    // 前衛3/後衛1
    // ゴブリン後衛を1体追加
    members.push(GOBLIN_BACK_UNITS[0])
    // ホブリン前衛を1体追加
    members.push(HOBLIN_FRONT_UNITS[h - 1])
    // ゴブリン前衛を2体追加
    GOBLIN_FRONT_UNITS.forEach((unit, i) => {
      if (i !== h - 1) members.push(unit)
    })

    // 報酬を設定
    rewardCp = 1
  }

  return {
    members, rewardCp
  }
}
