// src/domains/SaveData/index.ts

/**
 * SaveData の仕様
 * 
 * 1. savedata (keys, cp を保存)
 *   keys: 保存したモデルのIDの配列を Set() で管理
 * 　cp: PT共有のCP総計を管理 (撃破数に応じて伸び, PT共有とする)
 * 
 * 2. savedata:index (モデルの保存)
 *   キャラクタ・モデルを各キーにて管理 (保存は class Character 側で定義)
 *   キャラクタの新規作成・除名時はキー操作を伴う
 *   除名時にはキーを詰め直す必要がある
 *   編集途中のデータは isTemporary: true によって SessionStorage を利用
 * 
 */

export const STORAGE_KEY = 'savedata';

const DEFAULT_POINTS = 10

const DEFAULT_MODEL = {
  id: 0,
  name: '未設定',
  points: [],
  equipments: []
}

// セーブデータ管理を司るクラス
export class SaveData {
  private storageKey: string
  private data: {
    keys?: string[]
    cp?: number
  }

  constructor() {
    // インデックスの読み込み
    this.storageKey = `${STORAGE_KEY}:index`
    const raw = localStorage.getItem(this.storageKey) ?? '{}'
    this.data = JSON.parse(raw)
  }

  // 全てのデータを保存
  private save() {
    const raw = JSON.stringify(this.data)
    localStorage.setItem(this.storageKey, raw)
  }

  // キーを保存 (更新)
  saveKeys(keys: Set<string>) {
    this.data = { ...this.data, keys: [...keys].sort() }
    this.save()
  }

  // キーを読み込み
  loadKeys() {
    return new Set(this.data.keys ?? [])
  }

  // キーを追加
  addKey(uid: string) {
    const keys = new Set<string>(this.data.keys ?? [])
    keys.add(uid)
    this.saveKeys(keys)
  }

  // キーを削除
  removeKey(uid: string) {
    const keys = new Set<string>(this.data.keys ?? [])
    keys.delete(uid)
    this.saveKeys(keys)
  }

  // CPを保存 (更新)
  savePoints(cp: number) {
    this.data = { ...this.data, cp }
    this.save()
  }

  // CPを読み込み
  loadPoints() {
    return this.data.cp ?? DEFAULT_POINTS
  }

  // uid を指定してモデルを読み込み
  // インデックスに uid が無ければ空のモデルを返す
  // isTemporary: true で SessionStorage から編集途中のデータを読み込み
  loadModel(uid: string, isTemporary: boolean = false) {
    const storage = isTemporary ? sessionStorage : localStorage
    const storageKey = `${STORAGE_KEY}:${uid}`
    const raw = storage.getItem(storageKey) ?? 'null'
    const model = JSON.parse(raw) ?? DEFAULT_MODEL
    return model
  }

  // 全てのモデルを読み込み
  loadModels() {
    if (this.data.keys) {
      return this.data.keys.map(uid => {
        return this.loadModel(uid)
      })
    } else {
      return []
    }
  }

  // uid を指定してモデルを削除
  removeModel(uid: string) {
    const keys = this.data.keys
    if (!keys) return
    const order = keys.indexOf(uid)
    if (order === -1) return
    // 配列を詰める
    keys.forEach((uid, i) => {
      if (i > order) {
        // 旧キーからデータを取り出す
        const model = this.loadModel(uid)
        model.id--
        const newUid = String(model.id).padStart(2, '0') // ID を更新
        const newStorageKey = `${STORAGE_KEY}:${newUid}` // キーを更新
        const raw = JSON.stringify(model)
        localStorage.setItem(newStorageKey, raw) // 新キーへデータを格納
        sessionStorage.setItem(newStorageKey, raw)
      }
    })
    // 末尾を削除
    const oldUid = keys[keys.length - 1]
    const oldStorageKey = `${STORAGE_KEY}:${oldUid}`
    this.removeKey(oldUid)
    localStorage.removeItem(oldStorageKey)
    sessionStorage.removeItem(oldStorageKey)
  }

  // Storage をクリア
  clear() {
    localStorage.clear()
    sessionStorage.clear()
  }
}
