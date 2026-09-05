// src/parts/Setup.tsx

import { useParams, Link } from 'react-router-dom'
import List from './Sheets/List'
import Detail from './Sheets/Detail'
import { SAMPLE_CHARACTERS as samples } from '../domains/Character/index'

function Setup() {
  // uid があれば1人のサンプルを探す
  const { uid } = useParams()
  const sample = samples.find(m => m.id === Number(uid))

  return (
    <div className="px-6">
      {!sample
        ? <List units={samples} />
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

export default Setup
