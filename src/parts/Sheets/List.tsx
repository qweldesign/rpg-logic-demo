// src/parts/Sheets/List.tsx

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Character } from '../../domains/Character'

type SortKey = 'id'| '筋力' | '敏捷力' | '知力' | '生命力' | 'skill' | 'equip' 

function List({ units, total }: { units: Character[], total: number }) {
  // 状態管理
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState({
    id: false, // false: asc▲, true:desc▼
    '筋力': false,
    '敏捷力': false,
    '知力': false,
    '生命力': false,
    skill: false,
    equip: false
  })

  // 状態更新
  const handleSort = (key: SortKey) => {
    setSortKey(key)
    setSortDir(prev => ({
      ...prev,
      [key]: !sortDir[key]
    }))
  }

  // 状態が更新されたらソートを行う
  const sorted = useMemo((): Character[] => {
    if (sortKey === 'id') {
      return units.sort((a, b) => {
        return (a.id - b.id) * (sortDir.id ? -1 : 1)
      })
    } else if (sortKey === 'skill') {
      const skills = ['武術', '剣術', '青の魔法', '赤の魔法', '緑の魔法']
      return units.sort((a, b) => {
        const skillA = skills.indexOf(a.mainSkill.name)
        const skillB = skills.indexOf(b.mainSkill.name)
        return (skillA - skillB) * (sortDir.skill ?  -1 : 1)
      })
    } else if (sortKey === 'equip') {
      const equips = ['細剣', '長剣', '戦棍', '戦斧', '長槍', '大剣', '長杖', '鉾槍']
      return units.sort((a, b) => {
        const equipA = equips.indexOf(a.weapon.name)
        const equipB = equips.indexOf(b.weapon.name)
        return (equipA - equipB) * (sortDir.equip ?  -1 : 1)
      })
    } else {
      return units.sort((a, b) => {
        return (a.get(sortKey) - b.get(sortKey)) * (sortDir[sortKey] ?  -1 : 1)
      })
    }
  }, [units, sortKey, sortDir])

  // navigate を取得
  const navigate = useNavigate()

  return (
    <div className="table-wrapper">
      <table className="w-276">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')}>ID <span className="text-xs cursor-pointer">{sortDir.id ? '▼' : '▲'}</span></th>
            <th>名前</th>
            <th onClick={() => handleSort('筋力')}>筋力 <span className="text-xs cursor-pointer">{sortDir['筋力'] ? '▼' : '▲'}</span></th>
            <th onClick={() => handleSort('敏捷力')}>敏捷力 <span className="text-xs cursor-pointer">{sortDir['敏捷力'] ? '▼' : '▲'}</span></th>
            <th onClick={() => handleSort('知力')}>知力 <span className="text-xs cursor-pointer">{sortDir['知力'] ? '▼' : '▲'}</span></th>
            <th onClick={() => handleSort('生命力')}>生命力 <span className="text-xs cursor-pointer">{sortDir['生命力'] ? '▼' : '▲'}</span></th>
            <th onClick={() => handleSort('skill')}>技能 <span className="text-xs cursor-pointer">{sortDir.skill ? '▼' : '▲'}</span></th>
            <th onClick={() => handleSort('equip')}>装備 <span className="text-xs cursor-pointer">{sortDir.equip ? '▼' : '▲'}</span></th>
            <th>CP総計</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((unit) => (
            <tr className="cursor-pointer" key={unit.id} onClick={() => navigate(`./${String(unit.id).padStart(2, '0')}/`)}>
              <td>{unit.id}</td>
              <td>{unit.name}</td>
              <td>{unit.getLevel('筋力')} ({unit.get('筋力')}CP)</td>
              <td>{unit.getLevel('敏捷力')} ({unit.get('敏捷力')}CP)</td>
              <td>{unit.getLevel('知力')} ({unit.get('知力')}CP)</td>
              <td>{unit.getLevel('生命力')} ({unit.get('生命力')}CP)</td>
              <td>{unit.mainSkill.name}: {unit.mainSkill.level}</td>
              <td>{unit.weapon.name} / {unit.shield?.name || ''}{unit.shield ? ' /' : ''} {unit.armor.name}</td>
              <td>{unit.total} / {total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default List
