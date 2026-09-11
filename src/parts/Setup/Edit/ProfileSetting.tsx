// src/parts/Setup/Edit/ProfileSetting.tsx

import { type Dispatch } from 'react'
import { type State, type Action } from '.'

function ProfileSetting(
  { state, dispatch }: {
    state: State,
    dispatch: Dispatch<Action>
  }) {
  // SET_NAME
  const onSetName = (name: string) => {
    // 発火
    dispatch({ type: 'SET_NAME', payload: { name } })
  }

  return (
    <section>
      <h4>3. プロフィールの設定</h4>
      <div>
        <label className="inline-block w-24 sm:text-right">名前: </label>
        <input className="w-72 m-6 px-3 text-left" type="text" value={state.name} onChange={(e) => onSetName(e.target.value)} />
      </div>
    </section>
  )
}

export default ProfileSetting
