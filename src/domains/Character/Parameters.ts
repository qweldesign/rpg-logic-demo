// src/domains/Character/Parameters.ts

// CP
const POINT_STEP = [0, 1, 2, 4, 8] as const

export type Point = typeof POINT_STEP[number]

// パラメータのキー
const PARAMETER_KEYS = [
  '筋力', '敏捷力', '知力', '生命力', // 能力値
  '武術', '怪力', '剣術', '運動', '青の魔法', '赤の魔法', '緑の魔法', '鍛錬' // 技能
] as const

export type ParameterKey = typeof PARAMETER_KEYS[number]

// パラメータの定義
export type Parameter = {
  name: ParameterKey
  base: ParameterKey | null
  point: Point
  level: number
}

const PARAMETERS: Record<ParameterKey, { base: ParameterKey | null }> = {
  '筋力': { base: null },
  '敏捷力': { base: null },
  '知力': { base: null },
  '生命力': { base: null },
  '武術': { base: '筋力' },
  '怪力': { base: '筋力' },
  '剣術': { base: '敏捷力' },
  '運動': { base: '敏捷力' },
  '青の魔法': { base: '知力' },
  '赤の魔法': { base: '知力' },
  '緑の魔法': { base: '知力' },
  '鍛錬': { base: '生命力' }
} as const

// パラメータ管理を司るクラス
export class Parameters {
  private points: Map<ParameterKey, Point>

  // CPの配列を Point の Map に変換
  constructor(points: Point[]) {
    this.points = new Map()
    points.forEach((p, i) => this.set(PARAMETER_KEYS[i], p))
  }

  // name と point を指定し, パラメータをセット
  // point: 0 を指定した場合は, パラメータを削除
  set(name: ParameterKey, point: Point) {
    if (point > 0) {
      this.points.set(name, point)
    } else {
      this.unset(name)
    }
  }

  // name を指定し, パラメータを削除
  private unset(name: ParameterKey) {
    this.points.delete(name)
  }

  // name を指定し, POINT_STEP に則りパラメータを減らす
  private decrease(name: ParameterKey, size: number = 1) {
    for (let i = 0; i < size; i++) {
      const point = this.get(name)
      if (!point) return // Map に無ければ無視
      const index = POINT_STEP.indexOf(point as Point)
      const result = index > 0 ? POINT_STEP[index - 1] : 0 // 最小値(0)であれば削除
      this.set(name, result)
    }
  }

  // name を指定し, POINT_STEP に則りパラメータを増やす
  private increase(name: ParameterKey, size: number = 1) {
    for (let i = 0; i < size; i++) {
      const point = this.get(name)
      const index = POINT_STEP.indexOf(point as Point)
      const result = index < POINT_STEP.length - 1 ? POINT_STEP[index + 1] : point // 最大値であれば無視
      this.set(name, result)
    }
  }

  // name と size を指定し, POINT_STEP に則りパラメータを増減
  // Map に無ければ追加し, 最小値(0)になれば削除する
  step(name: ParameterKey, size: number = 1) {
    if (size > 0) {
      this.increase(name, Math.abs(size))
    } else {
      this.decrease(name, Math.abs(size))
    }
  }

  // name を指定し, point (CP) を取得
  get(name: ParameterKey): Point {
    return this.points.get(name) ?? 0
  }

  // name を指定し, level (能力値・技能値) を算出
  getLevel(name: ParameterKey): number {
    const base = PARAMETERS[name].base
    const baseValue = base !== null ? this.getLevel(base) : 10
    const point = this.get(name)
    return baseValue + POINT_STEP.indexOf(point)
  }

  // point 総計を算出
  get total(): number {
    let total = 0
    for (const p of this.points.values()) total += p ?? 0
    return total
  }

  // 最大Hpを取得
  get maxHp() {
    return this.getLevel('鍛錬') * 2 - 10
  }

  // ダメージ修正を取得
  get dmgMod() {
    return Math.floor(this.getLevel('怪力') / 2) - 5
  }

  //「よけ」を取得
  get ev() {
    return Math.floor(this.getLevel('運動') / 2) + 5
  }

  // name を指定し, その全ての属性を, オブジェクトに変換して取得
  getParam(name: ParameterKey): Parameter {
    return {
      name, point: this.get(name), level: this.getLevel(name), ...PARAMETERS[name]
    }
  }
  
  // 全てのパラメータとその全ての属性を, オブジェクトの配列に変換して取得 (ソート込み)
  get params(): Parameter[] {
    return [...this.points]
      .map(([name]) => this.getParam(name))
      .sort((a, b) => PARAMETER_KEYS.indexOf(a.name) - PARAMETER_KEYS.indexOf(b.name))
  }

  // 全ての技能とその全ての属性を, オブジェクトの配列に変換して取得 (ソート込み)
  get skills(): Parameter[] {
    return this.params
      .filter(p => p.base !== null)
  }
}