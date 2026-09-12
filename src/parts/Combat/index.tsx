// src/parts/Combat/index.tsx

import { useRef, useState, useEffect } from 'react'
import Formation from './Formation'
import Action from './Action'
import Summary from './Summary'
import Timeline from './Timeline'
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
      <div className="table-wrapper">
        {stateRef.current && (
          <div className="row justify-center min-w-lg lg:min-w-5xl">
            <div id="formation" className="relative order-1 w-lg h-48 p-3 bg-white/15">
              <h3 className="m-0 border-0 font-serif text-sm">Formation</h3>
              <Formation />
            </div>
            <div id="summary" className="relative order-2 lg:order-3 w-lg h-96 p-3 bg-white/30">
              <h3 className="m-0 border-0 font-serif text-sm">Summary</h3>
              <Summary />
            </div>
            <div id="action" className="relative order-3 lg:order-2 w-lg h-48 p-3 bg-white/15 lg:bg-white/30">
              <h3 className="m-0 border-0 font-serif text-sm">Action</h3>
              <Action />
            </div>
            <div id="log" className="relative order-4 w-lg h-96 bg-white/30 p-3 lg:bg-white/15">
              <h3 className="m-0 border-0 font-serif text-sm">Log</h3>
              <Timeline />
            </div>
          </div> 
        )}
      </div>
    </div>
  )
}

export default Combat
