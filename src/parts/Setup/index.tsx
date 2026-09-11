// src/parts/Setup/index.tsx

import { type ReactNode, useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import List from '../Sheets/List'
import Detail from '../Sheets/Detail'
import Formation from '../Setup/Formation'
import Modal from '../Setup/Modal'
import { Character } from '../../domains/Character'
import { createSamples } from '../../domains/Sample'
import { SaveData } from '../../domains/SaveData'

function Setup() {
  // navigate, uid を取得
  const navigate = useNavigate()
  const { uid } = useParams()

  // List, Detail に渡すパラメータ
  const [units, setUnits] = useState<Character[]>([])
  const [unit, setUnit] = useState<Character | null>(null)

  // Formation に渡すパラメータ
  const [slots, setSlots] = useState<(number | null)[]>(Array(4).fill(null))

  // Modal に渡すパラメータ
  const [alertMessage, setAlertMessage] = useState<ReactNode>('Test Alert.')
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertAction, setAlertAction] = useState<() => void>(() => () => {})

  // セーブデータの読み込み
  const saveData = useMemo(() => new SaveData(), [])
  const [points, setPoints] = useState(10)

  // ゲーム初期化の確認
  const confirmReset = () => {
    setAlertMessage(
      <p>本当にセーブデータを初期化しますか？</p>
    )
    setAlertOpen(true)
    setAlertAction(() => reset)
  }

  // ゲーム初期化
  const reset = () => {
    setAlertOpen(false)
    saveData.clear()
    navigate('/')
  }

  // 除名の確認
  const confirmRemove = () => {
    if (!unit) return
    setAlertMessage(
      <p>本当に {unit.name} を除名しますか？</p>
    )
    setAlertOpen(true)
    setAlertAction(() => remove)
  }

  // 除名
  const remove = () => {
    if (!uid) return
    setAlertOpen(false)
    saveData.removeModel(uid)
    navigate('/setup/')
  }

  // 出撃スロットの選択を更新
  const onChangeSlot = (index: number, value: string) => {
    const id = value === '' ? null : Number(value)
    setSlots(prev => {
      const next = prev.map((v, i) => (i === index ? id : v))
      saveData.saveFormation(next) // 保存
      return next
    })
  }

  // 最初に1回だけ実行
  useEffect(() => {
    // セーブデータの内容読み込み
    setPoints(saveData.loadPoints())
    const keys = saveData.loadKeys()

    // セーブデータが空の場合, 新規作成画面へ
    if (!keys || !keys.size) {
      navigate('/setup/edit/')
      return
    }

    // メンバが1名の場合, 初期メンバを生成
    if (keys.size === 1) {
      const { units, seed } = createSamples(5 - keys.size, saveData.loadPoints(), keys.size)
      units.forEach(unit => {
        const key = String(unit.id).padStart(2, '0')
        saveData.addKey(key) // インデックス登録
        unit.save() // キャラクター保存
      })
      saveData.saveSeed(seed)
    }

    // モデル読み込みとユニット生成
    const models = saveData.loadModels()
    setUnits(models.map(model => new Character(model)))

    // uid があれば1人のサンプルを探す
    const model = uid ? models.find(m => m.id === Number(uid)) : null
    setUnit(model ? new Character(model) : null)

    // 出撃スロットの初期化
    const saved = saveData.loadFormation()
      .map(id => (id !== null && models.some(m => m.id === id)) ? id : null)
    setSlots(Array.from({ length: 4 }, (_, i) => saved[i] ?? null))
  }, [uid])

  return (
    <div className="px-6">
      <div className="mt-12 mb-6 text-right">CP: {points}</div>
      {!unit
        ? 
          <>
            {units.length >= 4 && <Formation units={units} slots={slots} onChangeSlot={onChangeSlot} />}
            <List units={units} total={points}/>
            <div className="text-center">
              <button className="w-48 h-12" onClick={() => navigate('/setup/edit/')} >新規作成</button>
              <button className="w-48 h-12" onClick={confirmReset}>リセット</button>
            </div>
          </>
        :
          <>
            <Detail unit={unit} />
            <div className="text-center">
              <button className="w-48 h-12" onClick={() => navigate('/setup/')}>一覧へ戻る</button>
              <button className="w-48 h-12" onClick={() => navigate(`/setup/edit/${uid}`)}>編集</button>
              <button className="w-48 h-12" onClick={confirmRemove}>除名</button>
            </div>
          </>
      }
      {alertOpen && (
        <Modal message={alertMessage} onClose={() => setAlertOpen(false)} onContinue={alertAction} />
      )}
    </div>
  )
}

export default Setup
