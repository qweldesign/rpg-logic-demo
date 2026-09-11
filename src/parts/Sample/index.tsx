// src/parts/Sample/index.tsx

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import List from '../Sheets/List'
import Detail from '../Sheets/Detail'
import { createSamples } from '../../domains/Sample/index'

function Sample() {
  // 状態管理
  const [total, setTotal] = useState(10)

  // 状態更新
  const updateTotal = (value: string) => setTotal(Number(value))
  
  // uid があれば1人のサンプルを探す
  const { uid } = useParams()

  // サンプル生成
  const samples = createSamples(64, total).units
  const sample = samples.find(m => m.id === Number(uid))

  return (
    <div className="px-6">
      <label>CP: </label>
      <select className="w-48 h-9 mt-12 mb-6 mx-6 ps-3" onChange={(e) => updateTotal(e.target.value)}>
        <option value="10">{'10CP'}</option>
        <option value="12">{'12CP'}</option>
        <option value="16">{'16CP'}</option>
        <option value="24">{'24CP'}</option>
      </select>
      {!sample
        ? <List units={samples} total={total} />
        : (
          <>
            <Detail unit={sample} />
            <Link className="ms-12 italic" to="/setup/">&lt; Back to list</Link>
          </>
        )
      }
    </div>
  )
}

export default Sample
