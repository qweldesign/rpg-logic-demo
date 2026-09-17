// src/domains/Combat/AI/defender.ts

import { type TacticHandler } from '.'
import { base } from './base'

/**
 * Defender
 * 積極的に中央に移動して, 前衛で戦う
 * 
 * 基本形の行動パターンを参照
 * 
 */
export const defender: TacticHandler = (actor, state, temperType) => base(actor, state, temperType, 'center')
