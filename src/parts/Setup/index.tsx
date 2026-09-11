// src/parts/Setup/index.tsx

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import List from '../Sheets/List'
import Detail from '../Sheets/Detail'
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

  // セーブデータの読み込み
  const saveData = useMemo(() => new SaveData(), [])
  const [points, setPoints] = useState(10)

  // ゲーム初期化
  const reset = () => {
    saveData.clear()
    navigate('/')
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

    // メンバーが1名の場合, 初期メンバーを生成
    if (keys.size === 1) {
      const units = createSamples(5 - keys.size, saveData.loadPoints(), keys.size)
      units.forEach(unit => {
        const key = String(unit.id).padStart(2, '0')
        saveData.addKey(key) // インデックス登録
        unit.save() // キャラクター保存
      })
    }

    // モデル読み込みとユニット生成
    const models = saveData.loadModels()
    setUnits(models.map(model => new Character(model)))

    // uid があれば1人のサンプルを探す
    const model = uid ? models.find(m => m.id === Number(uid)) : null
    setUnit(model ? new Character(model) : null)
  }, [uid])

  return (
    <div className="px-6">
      <div className="mt-12 mb-6 text-right">CP: {points}</div>
      {!unit
        ? 
          <>
            <List units={units} total={points}/>
            <div className="text-center">
              <button className="w-48 h-12" onClick={() => navigate('/setup/edit/')} >新規作成</button>
              <button className="w-48 h-12" onClick={reset}>リセット</button>
            </div>
          </>
        :
          <>
            <Detail unit={unit} />
            <div className="text-center">
              <button className="w-48 h-12" onClick={() => navigate('/setup/')}>一覧へ戻る</button>
              <button className="w-48 h-12" onClick={() => navigate(`/setup/edit/${uid}`)}>編集</button>
            </div>
          </>
      }
    </div>
  )
}

export default Setup
