// src/parts/Setup/Edit/EquipmentsSetting.tsx

import { type Dispatch } from 'react'
import { type State, type Action } from '.'
import { WEAPON_KEYS, WEAPONS, SHIELD_KEYS, SHIELDS, ARMOR_KEYS, ARMORS } from '../../../domains/Character/Equipments'

function EquipmentsSetting(
  { isNew, state, dispatch }:{
    isNew: boolean,
    state: State,
    dispatch: Dispatch<Action>
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
        </>
      )}
      <div>
        <label className="inline-block w-24 sm:text-right">武器: </label>
        <select className="w-72 m-6 px-3 text-left" value={state.equips.weapon.name} onChange={(e) => onChangeEquip('weapon', e.target.value)}>
          {WEAPON_KEYS.map((key, i) => (
            <option key={i} value={key}>{key} | 性能:{WEAPONS[key].dmgBase}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="inline-block w-24 sm:text-right">盾: </label>
        <select className="w-72 m-6 px-3 text-left" value={state.equips.shield?.name ?? ''} onChange={(e) => onChangeEquip('shield', e.target.value)}>
          <option value="">装備無し</option>
          {SHIELD_KEYS.map((key, i) => (
            <option key={i} value={key}>{key} | 性能:{SHIELDS[key].isLarge ? 4 : 2}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="inline-block w-24 sm:text-right">服・鎧: </label>
        <select className="w-72 m-6 px-3 text-left" value={state.equips.armor.name} onChange={(e) => onChangeEquip('armor', e.target.value)}>
          {ARMOR_KEYS.map((key, i) => (
            <option key={i} value={key}>{key} | 性能:{ARMORS[key].dr}</option>
          ))}
        </select>
      </div>
    </section>
  )
}

export default EquipmentsSetting
