// src/parts/Combat/Action.tsx

import { useState, useEffect } from 'react'
import { type Position, type CombatUnit as Unit } from '../../domains/Combat/Unit'
import { type ActionKey, POSITION_LABELS, type ActionOptions, type ActionRequest, CombatAction as Store } from '../../domains/Combat/Action'

type ActionPalette = 'main' | 'confirmAttack' | 'move' | 'target' | 'hidden'

type TargetPalette = 'attack' | 'all'

function Action({ store }: { store: Store }) {
  // 状態管理
  const [actionPalette, setActionPalette] = useState<ActionPalette>('hidden')
  const [targetPalette, setTargetPalette] = useState<TargetPalette>('all')
  const [actionKey, setActionKey] = useState<ActionKey>('wait')
  const [actionOptions, setActionOptions] = useState<ActionOptions>({})
  const [actionTarget, setActionTarget] = useState<Unit>(store.actor)
  const [isExecuted, setIsExecuted] = useState<boolean>(false)

  // 防御タイプ
  const defenseType = { parry: '受け', block: '止め', dodge: 'よけ' }

  // execute
  const execute = async () => {
    const request = { key: actionKey, options: actionOptions, target: actionTarget } as ActionRequest
    await store.execute(request)
  }

  // execute後, 変数を初期状態に戻す
  const reset = () => {
    setActionPalette('main')
    setActionKey('wait')
    setActionOptions({})
    setActionTarget(store.actor)
    setIsExecuted(false)
  }

  // ロック状態の切り替わりを検知し, パレットの表示状態を更新
  useEffect(() => {
    if (store.unlocked) {
      reset()
    } else {
      setActionPalette('hidden')
    }
  }, [store.unlocked])

  // isExecuted が true に変わるのを検知して実行
  useEffect(() => {
    if(isExecuted) execute()
  }, [isExecuted])

  return (
    <>
      <div className="absolute top-0 left-0 w-1/1 my-3 italic text-sm text-center">第 {store.round} ターン / {store.actor.name} の行動</div>

      {/* メイン */}
      <div className="actions" data-disable={actionPalette !== 'main'}>
        <button
          disabled={!store.availability.attack}
          onClick={() => { setActionPalette('target'); setTargetPalette('attack'); setActionKey('attack'); }} // ターゲットパレットへ進む
        >攻撃</button>
        <button
          disabled={!store.availability.move.back && !store.availability.move.left && !store.availability.move.center && !store.availability.move.right}
          onClick={() => { setActionPalette('move'); setActionKey('move'); }} // 移動オプションパレットへ進む
        >移動</button>
        <button
          disabled={!store.availability.wait}
          onClick={() => { setIsExecuted(true); }} // 実行
        >待機</button>
      </div>

      {/* 攻撃確認 */}
      <div className="actions confirm" data-disable={actionPalette !== 'confirmAttack'}>
        {actionTarget && (
          <div className="confirm__grid">
            <div>{store.actor.name}</div>
            <div>{actionTarget.name}</div>
            <div>{store.actor.attack.name}: {store.actor.attack.dmgName}</div>
            <div>{actionTarget.defense.name.armor}: {actionTarget.defense.drName}</div>
            <div>攻撃目標値: {store.actor.attack.getTarget()}</div>
            <div>防御目標値: {actionTarget.defense.getTarget().target} ({defenseType[actionTarget.defense.getTarget().type]})</div>
            <div>効果: </div>
            <div>ダメージ {store.actor.attack.getExpectedDmg(actionTarget.defense.dr, actionTarget.defense.isChain)} 点</div>
          </div>
        )}
        <button
          onClick={() => { setIsExecuted(true); }} // 実行
        >実行</button>
        <button
          onClick={() => { setActionPalette('target'); setActionTarget(store.actor); }} // ターゲットをリセットし, ターゲットパレットへ戻る
        >戻る</button>
      </div>

      {/* 移動 */}
      <div className="actions option" data-disable={actionPalette !== 'move'}>
        {Object.entries(POSITION_LABELS).map((arr) => (
          <button
            key={arr[0]}
            disabled={!store.availability.move[arr[0] as Position]}
            onClick={() => { setActionOptions({ position: arr[0] as Position }); setIsExecuted(true); }} // 実行
          >{arr[1]}</button>
        ))}
        <button
          onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
        >戻る</button>
      </div>

      {/* ターゲット */}
      <div className="actions target" data-disable={actionPalette !== 'target'}>
        {targetPalette === 'attack' && (
          <>
            {store.target.melee.map(target => (
              <button
                key={target.combatId}
                onClick={() => { setActionPalette('confirmAttack'); setActionTarget(target); }} // ターゲットをセットし, 攻撃確認パレットへ進む
              >{target.name}</button>
            ))}
            <button
              onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
            >戻る</button>
          </>
        )}
      </div>
    </>
  )
}

export default Action
