// src/parts/Sheets/Detail.tsx

import { type Character } from '../../domains/Character/index'

function Detail({ unit }: { unit: Character }) {
  return (
    <div className="row justify-around">
      <div className="w-1/1 max-w-sm">
        <h4 className="mt-12 mb-6 font-serif italic text-lg before:content-['-'] before:pe-3">Profile</h4>
        <div className="table-wrapper">
          <div className="grid grid-cols-[45%_55%] w-sm my-6 border-t border-white">
            <div className="cell">{'Name (名前)'}</div><div className="cell">{unit.name}</div>
          </div>
        </div>
        <h4 className="mt-12 mb-6 font-serif italic text-lg before:content-['-'] before:pe-3">Abilities</h4>
        <div className="table-wrapper">
          <div className="grid grid-cols-[45%_10%_45%] w-sm my-6 border-t border-white">
            <div className="cell">{'ST (筋力)'}</div><div className="cell">{unit.getLevel('筋力')}</div><div className="cell">{unit.get('筋力')}CP</div>
            <div className="cell">{'DX (敏捷力)'}</div><div className="cell">{unit.getLevel('敏捷力')}</div><div className="cell">{unit.get('敏捷力')}CP</div>
            <div className="cell">{'IN (知力)'}</div><div className="cell">{unit.getLevel('知力')}</div><div className="cell">{unit.get('知力')}CP</div>
            <div className="cell">{'HT (生命力)'}</div><div className="cell">{unit.getLevel('生命力')}</div><div className="cell">{unit.get('生命力')}CP</div>
          </div>
        </div>
        <h4 className="mt-12 mb-6 font-serif italic text-lg before:content-['-'] before:pe-3">Battle Abilities</h4>
        <div className="table-wrapper">
          <div className="grid grid-cols-[45%_10%_45%] w-sm my-6 border-t border-white">
            <div className="cell">{'Dmg (ダメージ)'}</div><div className="cell">{unit.dmgMod}</div><div className="cell">{'「怪力」 / 2 - 5'}</div>
            <div className="cell">{'Ev (よけ)'}</div><div className="cell">{unit.ev}</div><div className="cell">{'「運動」 / 2 + 5'}</div>
            <div className="cell">{'Hp (耐久値)'}</div><div className="cell">{unit.maxHp}</div><div className="cell">{'「鍛錬」 * 2 - 10 '}</div>
          </div>
        </div>
      </div>
      <div className="w-1/1 max-w-2xl">
        <h4 className="mt-12 mb-6 font-serif italic text-lg before:content-['-'] before:pe-3">Skills</h4>
        <div className="table-wrapper">
          <div className="grid grid-cols-[50%_50%] w-2xl my-6 border-t border-white">
            {unit.skills.map((skill, i) => (
              <div className="grid grid-cols-[32%_16%_32%_20%]" key={i}>
                <div className="cell">{skill.name}</div><div className="cell">{skill.level}</div><div className="cell">{skill.point}CP</div><div className="cell">&nbsp;</div>
              </div>
            ))}
            {unit.skills.length % 2 === 1 && (
              <div className="grid grid-cols-4">
                <div className="cell">&nbsp;</div><div className="cell">&nbsp;</div><div className="cell">&nbsp;</div><div className="cell">&nbsp;</div>
              </div>
            )}
          </div>
        </div>
        <h4 className="mt-12 mb-6 font-serif italic text-lg before:content-['-'] before:pe-3">Equipments</h4>
        <div className="table-wrapper">
          <div className="grid grid-cols-[25%_20%_20%_35%] w-2xl my-6 border-t border-white">
            <div className="cell">{unit.weapon.name}</div>
            <div className="cell">{`Lv: ${unit.combatSkill.level}`}</div>
            <div className="cell">{`P-Ev: ${unit.pev}`}</div>
            <div className="cell">{`Dmg: ${unit.getDmgName()}`}</div>
            {unit.shield && (
              <>
                <div className="cell">{unit.shield.name}</div>
                <div className="cell">&nbsp;</div>
                <div className="cell">{`B-Ev: ${unit.bev}`}</div>
                <div className="cell">&nbsp;</div>
              </>
            )}
            <div className="cell">{unit.armor.name}</div>
                <div className="cell">&nbsp;</div>
                <div className="cell">{`D-Ev: ${unit.dev}`}</div>
            <div className="cell">{`DR: ${unit.getDRName()}`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Detail
