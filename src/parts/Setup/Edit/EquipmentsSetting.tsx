// src/parts/Setup/Edit/EquipmentsSetting.tsx

import { type Dispatch } from 'react'
import { type State, type Action } from '.'
import { WEAPON_KEYS, WEAPONS, SHIELD_KEYS, SHIELDS, ARMOR_KEYS, ARMORS } from '../../../domains/Character/Equipments'

function EquipmentsSetting(
  { isNew, state, dispatch, calcGold }:{
    isNew: boolean,
    state: State,
    dispatch: Dispatch<Action>,
    calcGold: (state: State, isMax: boolean) => number
  }) {
  // SET_EQUIP
  const onChangeEquip = (slot: 'weapon' | 'shield' | 'armor', name: string) => {
    // 発火
    dispatch({ type: 'SET_EQUIP', payload: { prevEquips: state.equips, slot, name } }) 
  }
  
  return (
    <section>
      {isNew && (
        <>
          <h4>2. 装備の選択</h4>
          <p>合計{calcGold(state, true)}金の所持金でキャラクターの装備を購入します。</p>
        </>
      )}
      <div>
      <h5>残り所持金: <span className={calcGold(state, false) < 0 ? 'text-red-600 font-bold' : 'font-bold'}>{calcGold(state, false)} 金</span></h5>
        <label className="inline-block w-24 sm:text-right">武器: </label>
        <select className="w-72 m-6 px-3 text-left" value={state.equips.weapon.name} onChange={(e) => onChangeEquip('weapon', e.target.value)}>
          {WEAPON_KEYS.map((key, i) => (
            <option key={i} value={key}>{key} | 性能:{key !== '装備無し' ? WEAPONS[key].dmgBase : 0}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="inline-block w-24 sm:text-right">盾: </label>
        <select className="w-72 m-6 px-3 text-left" value={state.equips.shield?.name ?? ''} onChange={(e) => onChangeEquip('shield', e.target.value)}>
          {SHIELD_KEYS.map((key, i) => (
            <option key={i} value={key}>{key} | 性能:{SHIELDS[key].size * 2}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="inline-block w-24 sm:text-right">服・鎧: </label>
        <select className="w-72 m-6 px-3 text-left" value={state.equips.armor.name} onChange={(e) => onChangeEquip('armor', e.target.value)}>
          {ARMOR_KEYS.map((key, i) => (
            <option key={i} value={key}>{key} | 性能:{key !== '服' ? ARMORS[key].dr : 0}</option>
          ))}
        </select>
      </div>
    </section>
  )
}

export default EquipmentsSetting
