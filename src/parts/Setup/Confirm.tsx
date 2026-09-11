// src/parts/Setup/Confirm.tsx

import { useNavigate, useParams } from 'react-router-dom'
import Detail from '../Sheets/Detail'
import { Character } from '../../domains/Character'
import { SaveData } from '../../domains/SaveData'

function Confirm() {
  // navigate, uid を取得
  const navigate = useNavigate()
  const { uid = '00' } = useParams()
  
  // 新規作成かどうかを変数に格納
  const isNew = uid === '00' ? true : false

  // セーブデータの読み込み
  const saveData = new SaveData()
  const keys = saveData.loadKeys()

  // SessionStorage から編集途中のデータを取得
  const model = saveData.loadModel(uid, true)

  // 新規の場合, 新しい ID を発行
  if (isNew) model.id = keys.size + 1

  // Detail に渡すパラメータ
  const unit = new Character(model)

  // 保存
  const save = () => {
    if (isNew) {
      const uid = unit.id.toString().padStart(2, '0')
      saveData.addKey(uid) // 新規の場合, インデックス登録
    }
    unit.save() // キャラクター保存
    sessionStorage.clear() // SessionStorage をクリア
    navigate(`/setup/`) // 戻る
  }

  // 戻る
  const back = () => {
    sessionStorage.clear() // SessionStorage をクリア
    if (!isNew) {
      navigate(`/setup/edit/${uid}`)
    } else {
      navigate(`/setup/edit/`)
    }
  }

  return (
    <div className="px-6">
      <Detail unit={unit} />
      <section className="my-12 text-center">
        <p className="text-center">この内容で保存しますか？</p>
        <button className="w-48 h-12" onClick={save}>保存する</button>
        <button className="w-48 h-12" onClick={back}>作成画面へ戻る</button>
      </section>
    </div>
  )
}

export default Confirm
