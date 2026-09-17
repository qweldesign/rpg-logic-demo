// src/domains/Combat/AI/attacker.ts

import { type TacticHandler } from '.'
import { base } from './base'

/**
 * Attacker
 * 左翼・右翼に移動して, 前衛で戦う
 * 
 * 基本形の行動パターンを参照
 * 
 */
export const attacker: TacticHandler = (actor, state, temperType) => base(actor, state, temperType, 'wing')
