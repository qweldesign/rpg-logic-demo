// src/parts/Sheets/List.tsx

import { useNavigate } from 'react-router-dom'
import { type Character } from '../../domains/Character/index'

function List({ units }: { units: Character[] }) {
  // navigate を取得
  const navigate = useNavigate()

  return (
    <div className="table-wrapper my-12">
      <table className="w-276">
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>ST (筋力)</th>
            <th>DX (敏捷力)</th>
            <th>IN (知力)</th>
            <th>HT (生命力)</th>
            <th>CP総計</th>
            <th>装備</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr className="cursor-pointer" key={unit.id} onClick={() => navigate(`./${String(unit.id).padStart(2, '0')}/`)}>
              <td>{unit.id}</td>
              <td>{unit.name}</td>
              <td>{`${unit.getLevel('筋力')} (${unit.get('筋力')}CP)`}</td>
              <td>{`${unit.getLevel('敏捷力')} (${unit.get('敏捷力')}CP)`}</td>
              <td>{`${unit.getLevel('知力')} (${unit.get('知力')}CP)`}</td>
              <td>{`${unit.getLevel('生命力')} (${unit.get('生命力')}CP)`}</td>
              <td>{unit.total}</td>
              <td>{`${unit.weapon.name}`} / {unit.shield?.name || ''}{unit.shield ? ' /' : ''} {unit.armor.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default List
