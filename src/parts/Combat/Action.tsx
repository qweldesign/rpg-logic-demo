// src/parts/Combat/Action.tsx

import { useState, useEffect } from 'react'
import { type Position, type CombatUnit as Unit } from '../../domains/Combat/Unit'
import { type ActionKey, POSITION_LABELS, FULL_POWER_KEYS, FULL_POWER_OPTIONS, type ActionOptions, type ActionRequest, CombatAction as Store } from '../../domains/Combat/Action'
import { SPELL_ELEMENTS, SPELL_ELEMENT_LABELS, SPELL_LIST, type SpellElement } from '../../domains/Combat/Spells'

type ActionPalette = 'main' | 'confirmReady' | 'confirmAttack' | 'attackOption' | 'confirmFeint' | 'confirmSpell' | 'elements' | 'spell' | 'confirmDefense' | 'move' | 'target' | 'hidden'

type TargetPalette = 'attack' | 'feint' | 'spell' | 'all'

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

  // 魔法の対象選択パレット用の対象プール
  const spellTargetPool = actionOptions.element !== undefined && actionOptions.spellId !== undefined
    ? (() => {
        const scope = SPELL_LIST[actionOptions.element][actionOptions.spellId].targetScope
        return scope === 'all' ? store.target.all
          : scope === 'enemy' ? store.target.enemies
          : store.target.allies
      })()
    : []

  // execute
  const execute = async () => {
    const request = { key: actionKey, options: actionOptions, target: actionTarget } as ActionRequest
    await store.execute(request)
    if (store.unlocked) reset() // 魔法の発動等ターンを終えない行動時にもパレットの表示状態を更新する
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
          disabled={!store.availability.ready}
          onClick={() => { setActionPalette('confirmReady'); setActionKey('ready'); }} // 準備確認パレットへ進む
        >準備</button>
        <button
          disabled={!store.availability.attack}
          onClick={() => { setActionPalette('target'); setTargetPalette('attack'); setActionKey('attack');  setActionOptions({ fullPower: 'none' });}} // デフォルトオプションをセットし, ターゲットパレットへ進む
        >攻撃</button>
        <button
          disabled={!store.availability.fullPowerAttack}
          onClick={() => { setActionPalette('attackOption'); setTargetPalette('attack'); setActionKey('attack'); setActionOptions({ fullPower: 'none' }); }} // デフォルトオプションをセットし, 攻撃オプションパレットへ進む
        >全力攻撃</button>
        <button
          disabled={!store.availability.feint}
          onClick={() => { setActionPalette('target'); setTargetPalette('feint'); setActionKey('feint'); }} // ターゲットパレットへ進む
        >牽制</button>
        <button
          disabled={SPELL_ELEMENTS.every(element => !store.availability.cast[element])}
          onClick={() => { setActionPalette('elements'); setActionKey('cast'); }} // 系譜選択パレットへ進む
        >集中</button>
        <button
          disabled={!store.availability.spell}
          onClick={() => { setActionPalette('spell'); setActionKey('spell'); }} // 魔法選択パレットへ進む
        >魔法</button>
        <button
          disabled={!store.availability.defense}
          onClick={() => { setActionPalette('confirmDefense'); setActionKey('defense'); }} // 防御確認パレットへ進む
        >全力防御</button>
        <button
          disabled={!store.availability.move.back && !store.availability.move.left && !store.availability.move.center && !store.availability.move.right}
          onClick={() => { setActionPalette('move'); setActionKey('move'); }} // 移動オプションパレットへ進む
        >移動</button>
        <button
          disabled={!store.availability.wait}
          onClick={() => { setIsExecuted(true); }} // 実行
        >待機</button>
      </div>

      {/* 準備確認 */}
      <div className="actions confirm" data-disable={actionPalette !== 'confirmReady'}>
        <div className="confirm__grid">
          <div>{store.actor.name}</div>
          <div className="text-left">{store.actor.attack.name} を構える</div>
        </div>
        <button
          onClick={() => { setIsExecuted(true); }} // 実行
        >実行</button>
        <button
          onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
        >戻る</button>
      </div>

      {/* 攻撃確認 */}
      <div className="actions confirm" data-disable={actionPalette !== 'confirmAttack'}>
        {actionTarget && (
          <div className="confirm__grid">
            <div>{store.actor.name}</div>
            <div>{actionTarget.name}</div>
            <div>{store.actor.attack.name}: {store.actor.attack.dmgName}</div>
            <div>{actionTarget.defense.name.armor}: {actionTarget.defense.drName}</div>
            <div>攻撃目標値: {store.actor.attack.getTarget(actionOptions.fullPower!)}</div>
            <div className={actionTarget === store.actor.attack.feint?.target ? 'is-targeted' : ''}>防御目標値: {actionTarget.defense.getTarget(store.actor).target} ({defenseType[actionTarget.defense.getTarget(store.actor).type]})</div>
            <div>効果: </div>
            <div>ダメージ {store.actor.attack.getExpectedDmg(actionTarget.defense.dr, actionTarget.defense.isChain, actionOptions.fullPower!)} 点</div>
          </div>
        )}
        <button
          onClick={() => { setIsExecuted(true); }} // 実行
        >実行</button>
        <button
          onClick={() => { setActionPalette('target'); setActionTarget(store.actor); }} // ターゲットをリセットし, ターゲットパレットへ戻る
        >戻る</button>
      </div>

      {/* 全力攻撃 */}
      <div className="actions option" data-disable={actionPalette !== 'attackOption'}>
        {FULL_POWER_KEYS.map(key => key !== 'none'  && key !== 'ready' && (key !== 'double' || store.availability.doubleAttack) && (
          <button
            className="is-large"
            key={key}
            onClick={() => { setActionPalette('target'); setActionOptions({ fullPower: key }); }} // 攻撃オプションをセットし, ターゲットパレットへ進む
          >{FULL_POWER_OPTIONS[key].label}</button>
        ))}
        {store.availability.ready && (
          <button
            className="is-large"
            onClick={() => { setActionPalette('target'); setActionOptions({ fullPower: 'ready' }); }} // 攻撃オプションをセットし, ターゲットパレットへ進む
          >{FULL_POWER_OPTIONS.ready.label}</button>
        )}
        <button
          onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
        >戻る</button>
      </div>

      {/* 牽制確認 */}
      <div className="actions confirm" data-disable={actionPalette !== 'confirmFeint'}>
        {actionTarget && (
          <div className="confirm__grid">
            <div>{store.actor.name}</div>
            <div>{actionTarget.name}</div>
            <div>牽制目標値: {store.actor.attack.target}</div>
            <div>防御目標値: {actionTarget.defense.target.target} ({defenseType[actionTarget.defense.target.type]})</div>
            <div>効果: </div>
            <div>防御目標値の低下</div>
          </div>
        )}
        <button
          onClick={() => { setIsExecuted(true); }} // 実行
        >実行</button>
        <button
          onClick={() => { setActionPalette('target'); setActionTarget(store.actor); }} // ターゲットをリセットし, ターゲットパレットへ戻る
        >戻る</button>
      </div>

      {/* 魔法確認 */}
      <div className="actions confirm" data-disable={actionPalette !== 'confirmSpell'}>
        {actionOptions.element !== undefined && actionOptions.spellId !== undefined && (
          <div className="confirm__grid">
            <div>{store.actor.name}</div>
            <div className="text-left">{SPELL_ELEMENT_LABELS[actionOptions.element]}: {SPELL_LIST[actionOptions.element][actionOptions.spellId].label}</div>
            <div>発動目標値: {store.actor.spells.getSpellTarget(actionOptions.element, actionOptions.spellId, store.formation, actionTarget)}</div>
          </div>
        )}
        <button
          onClick={() => { setIsExecuted(true); }} // 実行
        >実行</button>
        <button
          onClick={() => { setActionPalette('spell'); setActionOptions({}); }} // オプションをリセットし, 魔法選択パレットへ戻る
        >戻る</button>
      </div>

      {/* 系譜選択 */}
      <div className="actions option" data-disable={actionPalette !== 'elements'}>
        {Object.entries(SPELL_ELEMENT_LABELS).map(([element, label]) => (
          <button
            key={element}
            disabled={!store.availability.cast[element as SpellElement]}
            onClick={() => { setActionOptions({ element: element as SpellElement }); setIsExecuted(true); }} // 実行
          >{label}</button>
        ))}
        <button
          onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
        >戻る</button>
      </div>

      {/* 魔法選択 */}
      <div className="actions option" data-disable={actionPalette !== 'spell'}>
        {SPELL_ELEMENTS.map(element => SPELL_LIST[element].map(spell => {
          if (spell.id >= store.actor.spells.level[element] - 10 || store.actor.spells.cast[element] < 1) return null
          const isReady = store.actor.spells.cast[element] >= spell.cast
          const isSelectable = isReady && spell.effects && spell.effects.length > 0
          return (
            <button
              className={`is-small ${isSelectable ? '' : 'is-pending'}`}
              key={`${element}:${spell.id}`}
              onClick={() => {
                if (!isSelectable) return
                setActionOptions({ element, spellId: spell.id })
                if (spell.targetScope) {
                  // 対象範囲が指定された魔法は対象選択を要するため, ターゲットパレットへ進む
                  setActionPalette('target')
                  setTargetPalette('spell')
                } else {
                  // 対象を要さない魔法は暫定的に自身を対象とし, 確認パレットへ進む
                  setActionTarget(store.actor)
                  setActionPalette('confirmSpell')
                }
              }}
            >{spell.label}</button>
          )
        }))}
        <button
          onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
        >戻る</button>
      </div>

      {/* 全力防御 */}
      <div className="actions confirm" data-disable={actionPalette !== 'confirmDefense'}>
        <div className="confirm__grid">
          <div>{store.actor.name}</div>
          <div className="text-left">全力防御</div>
        </div>
        <button
          onClick={() => { setIsExecuted(true); }} // 実行
        >実行</button>
        <button
          onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
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

        {/* 攻撃 */}
        {targetPalette === 'attack' && (
          <>
            {store.target.melee.map(target => (
              <button
                key={target.combatId}
                onClick={() => { setActionPalette('confirmAttack'); setActionTarget(target); }} // ターゲットをセットし, 攻撃確認パレットへ進む
              >{target.name}</button>
            ))}
            {actionOptions.fullPower === 'none' && ( // 通常攻撃時
              <button
                onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
              >戻る</button>
            )}
            {actionOptions.fullPower !== 'none' && ( // 全力攻撃時
              <button
                onClick={() => { setActionPalette('attackOption'); setActionOptions({ fullPower: 'none' }); }} // 攻撃オプションをリセットし, 攻撃オプションパレットへ戻る
              >戻る</button>
            )}
          </>
        )}

        {/* 牽制 */}
        {targetPalette === 'feint' && (
          <>
            {store.target.melee.map(target => (
              <button
                key={target.combatId}
                onClick={() => { setActionPalette('confirmFeint'); setActionTarget(target); }} // ターゲットをセットし, 牽制確認パレットへ進む
              >{target.name}</button>
            ))}
            <button
              onClick={() => { reset(); }} // 全てリセットし, メインパレットへ戻る
            >戻る</button>
          </>
        )}

        {/* 魔法 */}
        {targetPalette === 'spell' && (
          <>
            {spellTargetPool.map(target => ( // 魔法の targetScope に応じたプール (ally/enemy/all) から選択する
              <button
                key={target.combatId}
                onClick={() => { setActionPalette('confirmSpell'); setActionTarget(target); }} // ターゲットをセットし, 魔法確認パレットへ進む
              >{target.name}</button>
            ))}
            <button
              onClick={() => { setActionPalette('spell'); setActionOptions({}); }} // オプションをリセットし, 魔法選択パレットへ戻る
            >戻る</button>
          </>
        )}
      </div>
    </>
  )
}

export default Action
