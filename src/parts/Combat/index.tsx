// src/parts/Combat/index.tsx

import { useRef, useState, useEffect } from 'react'
import { SaveData } from '../../domains/SaveData'
import { Combat as State } from '../../domains/Combat'
import { playerSetup } from '../../domains/Combat/Formation/player'
import { enemySetup } from '../../domains/Combat/Formation/enemy'

function Combat() {
  // ターン管理
  const stateRef = useRef<State | null>(null)
  const [turnIndex, setTurnIndex] = useState(0)

  // ターン更新
  const nextTurn = () => {
    if (!stateRef.current) return
    stateRef.current.nextTurn()
    setTurnIndex(stateRef.current.turnIndex)
  }
  
  // 敵味方ユニットモデルをセットし, State を初期化する関数
  const setup = () => {
    const saveData = new SaveData()
    const players = playerSetup(saveData)
    const seed = Math.ceil(players.seed + Math.random() * 15) % 16
    const enemies = enemySetup(saveData, 'sample', seed)
    return new State(players.models.concat(enemies.models))
  }

  // 開幕
  useEffect(() => {
    if (!stateRef.current) {
      stateRef.current = setup()
      nextTurn()
    }
  }, [])
  
  // ターン毎にデバッグ
  useEffect(() => {
    if (!stateRef.current) return
    stateRef.current.debug()
  }, [turnIndex])

  return (
    <div className="p-6">
      <p>In development...</p>
    </div>
  )
}

export default Combat
