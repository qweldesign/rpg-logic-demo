// src/domains/Character/index.ts

import { type Point, type ParameterKey, Parameters } from './Parameters'
import { type WeaponKey, type ShieldKey, type ArmorKey, Equipments } from './Equipments'

// キャラクタ・モデル
type CharacterModel = {
  id: number
  name: string
  abilities: Point[]
  skills: [ParameterKey, Point][]
  equipments: [WeaponKey, ShieldKey | null, ArmorKey] | []
}

// サンプル・モデル
const SAMPLE_MODELS: CharacterModel[] = [
  {
    id: 1,
    name: 'アーロン',
    abilities: [4, 0, 0, 2], // 筋力, 生命力高めの重戦士タイプ
    skills: [['武術', 2], ['怪力', 1], ['鍛錬', 1]],
    equipments: ['戦斧', '大盾', 'プレイトメイル']
  },
  {
    id: 2,
    name: 'ダニエル',
    abilities: [1, 4, 0, 2], // 敏捷力, 生命力高めの軽戦士タイプ
    skills: [['剣術', 2], ['運動', 1]],
    equipments: ['大剣', null, '革鎧']
  },
  {
    id: 3,
    name: 'アシュリン',
    abilities: [0, 1, 4, 1], // 知力高めの魔術師タイプ
    skills: [['赤の魔法', 2], ['緑の魔法', 2]],
    equipments: ['細剣', '小盾', '革服']
  },
  {
    id: 4,
    name: 'ステファニー',
    abilities: [2, 1, 4, 0], // 筋力, 知力高めの魔法戦士タイプ
    skills: [['武術', 1], ['青の魔法', 2]],
    equipments: ['長杖', null, 'チェインメイル']
  }
]

// キャラクタ管理を司るクラス
export class Character {
  public id: number
  public name: string
  public parameters: Parameters
  public equipments: Equipments

  constructor(model: CharacterModel) {
    this.id = model.id
    this.name = model.name
    this.parameters = new Parameters(model.abilities)
    model.skills.forEach(([name, point]) => this.parameters.set(name, point))
    this.equipments = model.equipments.length ? new Equipments(...model.equipments) : new Equipments()
  }
}

export const SAMPLE_CHARACTERS = SAMPLE_MODELS.map((model) => new Character(model))
