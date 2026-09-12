// src/parts/Setup/Edit/index.tsx

import { type ReactNode, type Reducer, useState, useReducer, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ParametersSetting from './ParametersSetting'
import EquipmentsSetting from './EquipmentsSetting'
import ProfileSetting from './ProfileSetting'
import Modal from '../Modal'
import { type ParameterKey, Parameters, type WeaponKey, type Weapon, WEAPONS, type ShieldKey, type Shield, SHIELDS, type ArmorKey, type Armor, ARMORS, Equipments, type CharacterModel as Model, Character } from '../../../domains/Character'
import { PC_LIST } from '../../../domains/Sample'
import { SaveData } from '../../../domains/SaveData'

export type State = {
  points: number // CP
  prevParams: Parameters // 元のパラメータ
  params: Parameters // 現在のパラメータ
  prevEquips: Equipments // 元の装備
  equips: Equipments // 現在の装備
  weaponList: [WeaponKey, Weapon][] // 装備可能な武器一覧
  shieldList: [ShieldKey, Shield][] // 装備可能な盾一覧
  armorList: [ArmorKey, Armor][] // 装備可能な服・鎧一覧
  isSetTwoHanded: boolean // 両手武器を装備したかどうか
  isSTChanged: boolean, // ST (筋力) を変更したかどうか
  gender: string, // 名前の自動決定の基準
  name: string // 名前設定
}

export type Action =
  | { type: 'INIT', payload: { prevModel: Model,  model: Model } }
  | { type: 'STEP_PARAM', payload: { prevParams: Parameters, name: ParameterKey, size: number } }
  | { type: 'SET_EQUIP', payload: { prevEquips: Equipments,  slot: 'weapon' | 'shield' | 'armor', name: string } }
  | { type: 'RESET_SHIELD' }
  | { type: 'RESET_EQUIPS' }
  | { type: 'SET_GENDER', payload: { gender: string } }
  | { type: 'SET_NAME', payload: { name: string } }
  | { type: 'AUTO_NAME' }
  | { type: 'CLEAR_TRANSITION' }

function Edit() {
  // navigate, uid を取得
  const navigate = useNavigate()
  let { uid = '00' } = useParams()

  // 新規作成かどうかを変数に格納
  const isNew: boolean = uid === '00' ? true : false

  // セーブデータの読み込み
  const saveData = new SaveData()
  const keys = saveData.loadKeys()

  // 状態初期値
  // → ほとんど最初の useEffect (dispatch({ type: 'INIT'}) で初期値を再代入
  const initialState: State = {
    points: 10,
    prevParams: new Parameters(),
    params: new Parameters(),
    prevEquips: new Equipments(),
    equips: new Equipments(),
    weaponList: Object.entries(WEAPONS) as [WeaponKey, Weapon][],
    shieldList: Object.entries(SHIELDS) as [ShieldKey, Shield][],
    armorList: Object.entries(ARMORS) as [ArmorKey, Armor][],
    isSetTwoHanded: false,
    isSTChanged: false,
    gender: '男性',
    name: '未設定'
  }

  // 状態更新 (設定内容)
  const reducer: Reducer<State, Action> = (state, action) => {
    // 装備一覧を更新する関数
    const updateEquipList = (st: number) => {
      const weaponList = Object.entries(WEAPONS).filter(
        ([, weapon]) => weapon.requiredST <= st && !weapon.enemyOnly
      ) as [WeaponKey, Weapon][]
      const shieldList = state.equips.weapon.twoHanded ? []
        :Object.entries(SHIELDS).filter(
          ([, shield]) => shield.requiredST <= st
        ) as [ShieldKey, Shield][]
      const armorList = Object.entries(ARMORS).filter(
        ([, armor]) => armor.requiredST <= st && !armor.enemyOnly
      ) as [ArmorKey, Armor][]

      return { weaponList, shieldList, armorList }
    }

    switch (action.type) {
      case 'INIT': {
        // 名前, CP を取得
        const name = action.payload.model.name // 一時保存データがあれば優先
        const points = saveData.loadPoints()

        // 元と現在のパラメータ, 装備を取得
        const prevParams = new Parameters(action.payload.prevModel.points)
        const params = new Parameters(action.payload.model.points)
        const prevEquips = action.payload.prevModel.equipments.length
          ? new Equipments(...action.payload.prevModel.equipments) : new Equipments()
        const equips = action.payload.model.equipments.length
          ? new Equipments(...action.payload.model.equipments) : new Equipments()
        
        // 装備一覧を更新
        const { weaponList, shieldList, armorList } = updateEquipList(params.getLevel('筋力'))

        return {
          ...state,
          name, points,
          prevParams, params,
          prevEquips, equips,
          weaponList, shieldList, armorList
        }
      }

      case 'STEP_PARAM': {
        const nextParams = new Parameters(state.params.model)
        nextParams.step(action.payload.name, action.payload.size)
        
        // 装備一覧を更新
        const { weaponList, shieldList, armorList } = updateEquipList(nextParams.getLevel('筋力'))

        // ST (筋力) を更新したかどうか
        const isSTChanged = action.payload.name === '筋力' && action.payload.size === -1

        return {
          ...state,
          params: nextParams,
          weaponList, shieldList, armorList,
          isSTChanged
        }
      }

      case 'SET_EQUIP': {
        const slot = action.payload.slot
        const key = action.payload.name
        let isSetTwoHanded = false
        if (slot === 'weapon') {
          state.equips.weapon = key as WeaponKey
          isSetTwoHanded = state.equips.weapon.twoHanded
        }
        if (slot === 'shield') {
          if (key === '') state.equips.shield = null
          else state.equips.shield = key as ShieldKey
        }
        if (slot === 'armor') {
          state.equips.armor = key as ArmorKey
        }

        const nextEquips = state.equips.model.length
          ? new Equipments(...state.equips.model) : new Equipments

        // 装備一覧を更新
        const { weaponList, shieldList, armorList } = updateEquipList(state.params.getLevel('筋力'))

        return {
          ...state,
          equips: nextEquips,
          weaponList, shieldList, armorList,
          isSetTwoHanded
        }
      }

      case 'RESET_SHIELD': {
        return {
          ...state,
          equips: new Equipments(state.equips.weapon.name, null, state.equips.armor.name)
        }
      }

      case 'RESET_EQUIPS': {
        const st = state.params.getLevel('筋力')
        const nextWeapon = state.equips.weapon.name
        const nextShield = state.equips.shield?.name ?? null
        const nextArmor = state.equips.armor.name

        let resetedWeapon = nextWeapon
        let resetedShield = nextShield
        let resetedArmor = nextArmor

        if (WEAPONS[nextWeapon].requiredST > st) {
          resetedWeapon = state.prevEquips.weapon.name
        }
        if (nextShield && SHIELDS[nextShield].requiredST > st) {
          resetedShield = state.prevEquips.shield?.name ?? null
        }
        if (ARMORS[nextArmor].requiredST > st) {
          resetedArmor = state.prevEquips.armor.name
        }

        return {
          ...state,
          equips: new Equipments(resetedWeapon, resetedShield, resetedArmor),
        }
      }
      
      case 'SET_GENDER': {
        return {
          ...state,
          gender: action.payload.gender
        }
      }
      
      case 'SET_NAME': {
        return {
          ...state,
          name: action.payload.name
        }
      }

      case 'AUTO_NAME': {
        const g = state.gender === '男性' ? 0 : 1
        const n = Math.floor((Math.random() + g) * PC_LIST.length / 2)
        
        return {
          ...state,
          name: PC_LIST[n]
        }
      }

      case 'CLEAR_TRANSITION': {
        return {
          ...state,
          isSTChanged: false
        }
      }

      default: {
        return state
      }
    }
  }

  // 状態管理 (設定内容)
  const [state, dispatch] = useReducer(reducer, initialState)

  // 状態管理 (Modal に渡すパラメータ)
  const [alertMessage, setAlertMessage] = useState<ReactNode>('Test Alert.')
  const [alertOpen, setAlertOpen] = useState(false)

  // INIT
  const onInit = () => {
    // LocalStorage からキャラクターデータを取得
    const prevModel: Model = saveData.loadModel(uid)
    // SessionStorage から編集途中のデータを取得
    const model: Model = saveData.loadModel(uid, true) ?? prevModel
    // 発火
    dispatch({ type: 'INIT', payload: { prevModel, model } })
  }

  // RESET_SHIELD
  const onResetShield = () => {
    // 発火
    dispatch({ type: 'RESET_SHIELD' }) 
  }

  // RESET_EQUIPS
  const onResetEquip = () => {
    // 発火
    dispatch({ type: 'RESET_EQUIPS' }) 
  }

  // CLEAR_TRANSITION
  const clearTransition = () => {
    // 発火
    dispatch({ type: 'CLEAR_TRANSITION' })
  }

  // 残りCPを計算 isMax: true で持ち点を返す
  const calcPoints = (state: State, isMax: boolean = false): number => {
    let points = state.points
    if (!isMax) points -= state.params.total
    return points
  }

  // 名前が設定されているか判定
  const checkName = (state: State): boolean => {
    return state.name !== '未設定' && state.name !== '' 
  }

  // 確認
  const confirm = () => {
    // 新規作成時で points を使い切ってない場合のアラート
    if (isNew && calcPoints(state)) {
      const message = (
        <p className="text-center">キャラクターポイントを使い切っていません。
          <br />ポイントを使い切ってください。</p>
      )
      setAlertMessage(message)
      setAlertOpen(true)
      return
    }

    // 新規作成時で名前が未設定の場合のアラート
    if (isNew && !checkName(state)) {
      const message = (
        <p className="text-center">名前を設定してください。</p>
      )
      setAlertMessage(message)
      setAlertOpen(true)
      return
    }

    // 確認用モデルの作成
    const { name, params, equips } = state
    const confirmModel: Model = {
      id: Number(uid),
      name,
      points: params.model,
      equipments: equips.model
    }
    
    // キャラクターデータの一時保存 (SessionStorage を使用)
    const unit = new Character(confirmModel)
    unit.save(true)

    // 確認画面へ進む
    if (!isNew) {
      navigate(`/setup/confirm/${uid}`)
    } else {
      navigate(`/setup/confirm/`)
    }
  }

  // 作成 (編集) 中断
  const back = () => navigate(keys.size ? '/setup/' : '/')

  // 最初に一度だけ実行
  useEffect(() => {    
    onInit() // 初期化
  }, [])

  // 両手武器の装着の監視
  useEffect(() => {
    if (state.isSetTwoHanded && state.equips.shield) {
      // 両手武器を装着したとき
      // アラート表示 & 盾解除
      const message = (
        <p className="text-center">両手武器が装着されました。
          <br />盾が解除されました。</p>
      )
      setAlertMessage(message)
      setAlertOpen(true)
      onResetShield()
    }
  }, [state.isSetTwoHanded])

  // ST (筋力) 変化の監視
  useEffect(() => {
    // 必要筋力による装備制限を確認する関数
    const checkEquipsByRequiredST = () => {
      const st = state.params.getLevel('筋力')
      const nextWeapon = state.equips.weapon.name
      const nextShield = state.equips.shield?.name ?? null
      const nextArmor = state.equips.armor.name
      return (WEAPONS[nextWeapon].requiredST > st
        || (nextShield && SHIELDS[nextShield].requiredST > st)
        || ARMORS[nextArmor].requiredST > st
      )
    }
    if (state.isSTChanged && checkEquipsByRequiredST()) {
      // ST (筋力) を減らしたとき
      // アラート表示 & 装備解除
      const message = (
        <p className="text-center">ST (筋力) が減り、装備可能な武器・防具が変わりました。
          <br />装備の選択をやり直してください。</p>
      )
      setAlertMessage(message)
      setAlertOpen(true)
      onResetEquip()
      clearTransition()
    }
  }, [state.isSTChanged])

  return (
    <div className="edit px-6">
      <div className="max-w-[48em] mx-auto">
        <h3>キャラクター{isNew ? '作成' : '編集'}</h3>
        <ParametersSetting isNew={isNew} state={state} dispatch={dispatch} calcPoints={calcPoints} />
        <EquipmentsSetting isNew={isNew} state={state} dispatch={dispatch} />
        {isNew && (
          <ProfileSetting state={state} dispatch={dispatch} />
        )}
        <section className="my-12 text-center">
          {isNew && (
            <p className="text-center">お疲れ様でした。もうすぐキャラクター作成は完了です。
              <br />この内容でよろしければ、確認へ進んでください。
            </p>
          )}
          <button className="w-48 h-12" onClick={confirm}>確認する</button>
          <button className="w-48 h-12" onClick={back}>{isNew ? '作成' : '編集'}中断</button>
        </section>
      </div>
      {alertOpen && (
        <Modal message={alertMessage} onClose={() => setAlertOpen(false)} onContinue={null} />
      )}
    </div>
  )
}

export default Edit
