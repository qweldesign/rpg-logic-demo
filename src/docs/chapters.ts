// src/docs/chapters.ts

export const chapters = [
  {
    order: '01',
    heading: 'キャラクター',
    sections: [
      {
        order: '01',
        heading: '判定'
      },
      {
        order: '02',
        heading: 'CPと能力値'
      },
      {
        order: '03',
        heading: '技能'
      },
      {
        order: '04',
        heading: '装備'
      }
    ]
  },
  {
    order: '02',
    heading: '戦闘',
    sections: [
      {
        order: '01',
        heading: '戦闘の流れ'
      },
      {
        order: '02',
        heading: '行動の解決'
      },
      {
        order: '03',
        heading: 'ダメージ効果'
      },
      {
        order: '04',
        heading: '状態異状'
      }
    ]
  },
  {
    order: '03',
    heading: '術法',
    sections: [
      {
        order: '01',
        heading: '概要'
      },
      {
        order: '02',
        heading: '効果一覧'
      }
    ]
  }
] as const
