// src/domains/Sample/index.ts

import { type Point, type ParameterKey, type CharacterModel, Character, type WeaponKey } from '../Character'

/**
 * サンプル・キャラクタ生成アルゴリズム
 * 
 * 1. シード値 0～63 を生成
 * 
 * 2. 重戦士・軽戦士・魔術師・魔戦士に分岐
 *   最大能力値を, ST (筋力), DX (敏捷力), IN (知力) のうちで決定し, 3-1. へ進むか,
 *   最大能力値を決定せずに 3-2. へ進む
 * 
 * 3-1. 残りの能力値を以下のパターンで割り振る
 *   a. [0, 0, 1] (5)
 *   b. [0, 1, 0] (5)
 *   c. [1, 0, 0] (5)
 *   d. [0, 1, 1] (6)
 *   e. [1, 0, 1] (6)
 *   f. [1, 1, 0] (6)
 *   g. [0, 2, 1] (7)
 *   h. [2, 0, 1] (7)
 * 
 * 3-2. 魔戦士タイプの割り振りパターン (固定)
 *   a. [2, 0, 2, 1] (5)
 *   b. [2, 1, 2, 1] (6)
 *   c. [2, 1, 2, 1] (6)
 *   d. [2, 2, 2, 1] (7)
 *   e. [2, 0, 4, 0] (6)
 *   f. [2, 1, 4, 0] (7)
 *   g. [4, 0, 2, 0] (6)
 *   h. [4, 1, 2, 0] (7)
 * 
 * 4-1. HT (生命力) を +1 する/しない (男性イメージ)
 * 
 * 4-2. 4-1. をしなかった場合, 可能なら DX (敏捷力) を +1 する (女性イメージ)
 * 
 */

const DEFAULT_SIZE = 64 // シード値の範囲

const TABLE_1: Point[][] = [
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
  [0, 2, 1],
  [2, 0, 1]
]

const TABLE_2: Point[][] = [
  [2, 0, 2, 1],
  [2, 1, 2, 1],
  [2, 1, 2, 1],
  [2, 2, 2, 1],
  [2, 0, 4, 0],
  [2, 1, 4, 0],
  [4, 0, 2, 0],
  [4, 1, 2, 0]
]

function makeAbilityValues(r1: number, r2: number, g: number): Point[] {
  let result: Point[] = [0, 0, 0, 0]

  // 最大能力値を, ST (筋力), DX (敏捷力), IN (知力) のうちで決定する
  if (r1 < 3) {
    result[r1] = 4
    
    // 残りの能力値を割り振る
    const table = TABLE_1[r2]
    if (r1 === 0) {
      result[1] = table[0]
      result[2] = table[1]
      result[3] = table[2]
    } else if (r1 === 1) {
      result[0] = table[0]
      result[2] = table[1]
      result[3] = table[2]
    } else {
      result[0] = table[0]
      result[1] = table[1]
      result[3] = table[2]
    }
  } else {
    // 魔戦士タイプの割り振りパターン (固定)
    result = TABLE_2[r2].slice()
  }

  // HT (生命力) または DX (敏捷力) を +1 する/しない
  if (g === 0) {
    // HT (生命力) を +1 する
    result[3] += 1
  } else {
    // 可能なら DX (敏捷力) を +1 する
    if (result[1] < 2) result[1] += 1
  }
  return result
}

// 名前 (NPC用)
const NPC_LIST: string[] = [
  'アーロン', 'アイゼア', 'アンドリュー', 'イアン', 'エリック', 'オーウェン',
  'ギャレット', 'クーパー', 'ケヴィン', 'コール', 'サム',
  'ジェイデン', 'ジェレミア', 'ショーン', 'ジョセフ', 'スティーブン',
  'ダニエル', 'チェイス', 'ディビッド', 'ティモシー', 'トーマス', 'ドミニク',
  'ニコラス', 'ネイサン', 'パーカー', 'パトリック', 'ブライアン',
  'マシュー', 'メイソン', 'ライアン', 'リチャード', 'ルイス',
  'アシュリン', 'アビー', 'アリアナ', 'アリシア', 'イザベラ', 'エマ',
  'オードリー', 'オリビア', 'キャロライン', 'クレア', 'グレース',
  'ケイト', 'ジェシカ', 'シエラ', 'シドニー', 'シャーロット',
  'ステファニー', 'ゾーィ', 'ディスティニー', 'トリニティ', 'ナタリー', '二コール',
  'ブルック', 'ペイジ', 'マヤ', 'マリア', 'ミア',
  'ミッシェル', 'メリッサ', 'リア', 'リリー', 'レイチェル'
]

// サンプル・キャラクタ生成クラス
class Sample extends Character {
  constructor(id: number, seed: number, total: number = 10) {
    // シード値を分化して, 乱数を生成する
    const r1 = (seed + Math.floor(seed / 16)) % 4 // 4タイプによる大分類
    const r2 = Math.floor(seed / 4) % 8 // 8タイプによる小分類
    const g = Math.floor(seed / 32) % 2 // 性別相当

    // ID, 名前, 能力値を決定し, 初期化
    const model: CharacterModel = {
      id,
      name: NPC_LIST[seed],
      points: makeAbilityValues(r1, r2, g),
      equipments: []
    }
    super(model)

    // 技能をセット
    this.setSkills(r1, r2, total)

    // 装備をセット
    this.setEquips(r2)
  }

  // 可能なら技能値を step する
  stepSkill(name: ParameterKey, total: number = 10) {
    this.step(name)
    if (this.total > total) this.step(name, -1) // 総計を超えたら戻す
  }

  /**
   * 技能修得アルゴリズム
   * 
   * 1. 主技能へ2CPずつ配分
   *   a. 重戦士: 武術
   *   b. 軽戦士: 剣術
   *   c. 魔術師: 魔法2系統
   *   d. 魔戦士: 魔法1系統 + 武術
   * 
   * 2. ST, DX が奇数の場合, 優先的に配分 (戦闘能力値が端数切捨のため)
   * 
   * 3. 主技能+副技能の配列をループ
   * 
   * 4. まだCPの余りが生じている場合は, 「鍛錬」「運動」「怪力」に配分
   * 
   */
  setSkills(r1: number, r2: number, total: number = 10) {
    // 修得すべき技能の配列を作成
    const skills: ParameterKey[] = []
    const spells = ['青の魔法', '赤の魔法', '緑の魔法'] as ParameterKey[]

    // 主技能を配列に追加
    if (r1 === 0) skills.push('武術')
    if (r1 === 1) skills.push('剣術')
    if (r1 === 2) {
      const selected = spells.filter((_, i) => i !== r2 % 3)
      skills.push(selected[1], selected[0],)
    }
    if (r1 === 3) {
      skills.push(spells[(r2 + 2) % 3], '武術') // PT内で異なる系譜の魔法が使えるように調整
    }

    // 主技能を2周 step
    for (let i = 0; i < 2; i++) {
      skills.map((skill) => this.stepSkill(skill, total))
    }

    // 「運動」が奇数なら, DX (敏捷力) または 「運動」の step を試みる
    if (this.getLevel('運動') % 2) {
      if (this.total < 10 && this.get('敏捷力') < 2) {
        // point 総計が10未満, かつ DX (敏捷力) への消費が 2 未満なら, DX を step
        this.step('敏捷力')
      } else {
        // そうでなければ, 「運動」を step
        this.stepSkill('運動', total)
      }
    }
    // 「怪力」が奇数なら, ST (筋力) または 「怪力」の step を試みる
    if (this.getLevel('怪力') % 2) {
      if (this.total < 10 && this.get('筋力') < 2) {
        // point 総計が10未満, かつ ST (筋力) への消費が 2 未満なら, ST を step
        this.step('筋力')
      } else {
        // そうでなければ, 「怪力」を step
        this.stepSkill('怪力', total)
      }
    }

    // 副技能を追加
    skills.push('鍛錬')
    if (r1 === 1) skills.push('運動')
    if (r1 === 0) skills.push('怪力')

    // 主技能+副技能の修得ループ
    let count = 0 // 安全装置
    while (this.total < total && count < 4) {
      skills.map((skill) => this.stepSkill(skill, total))

      // 2周ループしてもCPの余りが生じた場合
      if (count > 1) {
        (['鍛錬', '運動', '怪力'] as ParameterKey[]).map((skill) => this.stepSkill(skill, total))
      }
      count++
    }
  }

  /**
   * 装備選択アルゴリズム
   * 
   * 1. 必要筋力に応じて武器を選択 (ランダム)
   * 
   * 2. 武器に応じて盾をセット (大盾を扱える場合, 好みの問題が生じるのでランダムで分岐)
   * 
   * 3. 必要筋力に応じて服・鎧を選択 (STで固定)
   * 
   */
  setEquips(e: number) {
    // 筋力を取得
    const st = this.getLevel('筋力')
    
    // 筋力に応じた武器一覧 (配列の規則性を少しだけ乱す)
    const weapons10 = ['細剣', '長剣', '戦棍', '長剣']
    const weapons11 = ['長剣', '戦棍', '長剣', '長槍', '大剣', '長杖', '大剣', '細剣']
    const weapons12 = ['戦棍', '戦斧', '長槍', '大剣', '長杖', '戦斧', '細剣', '長剣']
    const weapons13 = ['戦斧', '長槍', '大剣', '長杖', '鉾槍', '細剣', '長剣', '戦棍']

    // 武器をセット
    if (st === 10) this.weapon = weapons10[e % weapons10.length] as WeaponKey
    if (st === 11) this.weapon = weapons11[e % weapons11.length] as WeaponKey
    if (st === 12) this.weapon = weapons12[e % weapons12.length] as WeaponKey
    if (st > 12) this.weapon = weapons13[e % weapons13.length] as WeaponKey

    // 盾をセット
    if (!this.weapon.twoHanded) {
      if (st >= 12 && e % 2 === 0) this.shield = '大盾'
      else this.shield = '小盾'
    } else {
      this.shield = null
    }

    // 服・鎧をセット
    if (st === 10) this.armor = '革服'
    if (st === 11) this.armor = '革鎧'
    if (st === 12) this.armor = 'チェインメイル'
    if (st > 12) this.armor = 'プレイトメイル' 
  }
}

// サンプル・キャラクタ群生成関数
// size: 生成数 (範囲内から等間隔にサンプリング)
// total: point 総計
export function createSamples(size: number = 4, total: number = 10) {
  const samples = []
  const step = DEFAULT_SIZE / size // 生成数に応じたステップ
  const mod = Math.random() * step // シード値の修正値 (4人PTなら, 0～15の範囲で適用)
  for (let n = 0; n < size; n++) {
    const id = n + 1 // 1からカウント
    const seed = Math.floor(n * step + mod) % DEFAULT_SIZE
    const sample = new Sample(id, seed, total)
    samples.push(sample)
  }
  return samples
}
