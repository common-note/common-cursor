import type { QueryError } from './errors';
import { Tokenizer } from './tokenizer';

export interface Anchor {
  container: ContainerType;
  offset: number;
}

export interface AnchorRange {
  start: Anchor;
  end: Anchor;
  collapsed?: boolean;
}

export type Direction = 'left' | 'right' | 'up' | 'down';
export type RangeDirection = 'start' | 'end' | 'both';
export type CollapsedType = 'start' | 'end' | 'none';

export interface MoveAnchorPayload {
  rangeDirection: RangeDirection;
  collapsed?: CollapsedType;
}

export type Stride =
  // keep in position
  | 'none'
  // strides that handled in AnchorQuery (node level)
  | 'char' // like left/right
  | 'word' // like ctrl + left/right(in windows) or option + left/right(in mac)
  | 'softline' // like home/end in vscode wrap mode, but make each softline as a unit
  | 'softline-boundary' // like home/end in vscode wrap mode
  | 'pair' // live `t` in vim
  | 'paragraph' // like double home/end in vscode
  // strides that handled in higher level (multiple-node level)
  | 'screen' // like pageup/pagedown
  | 'document'; // like ctrl + home/end

export type ContainerType = Element | Text | Node;

export interface Step {
  direction: Direction;
  stride: Stride;
  pair?: string;
  shift?: boolean;
}

export interface MovePayload {
  anchor: Anchor;
  step: Step;
}

export interface MoveResult {
  prev: Anchor;
  next: Anchor | null;
  step: Step;
  nodeChanged: boolean | null;
  imp: AnchorQueryInterface;
  error?: QueryError;
}

export interface UpdateOperation {
  type: "insert" | "delete" | "replace";
  anchor: Anchor;
}

export interface EditorRange {
  start: Anchor;
  end: Anchor;
  collapsed: boolean;
}

/**
 * AnchorQueryInterface is a unstateful class, it is a query interface for a specific node.
 */
export interface AnchorQueryInterface {
  tokenizer: Tokenizer;
  shouldIgnore(node: Node): boolean;
  getTokenOffset(node: Node): number;
  getAnchorByOffset(offset: number, base?: Anchor): Anchor;
  getOffsetByAnchor(anchor: Anchor): number;
  getHorizontalAnchor(neighborPayload: MovePayload): MoveResult;
  getVerticalAnchor(neighborPayload: MovePayload): MoveResult;
}

export interface QueryCallback {
  onUpdate(operation: UpdateOperation): void;
}

/**
 * StatefulRangeEditorInterface is a stateful class,
 * which is a manager for multiple AnchorQueryInterface.
 */
export interface StatefulRangeEditorInterface {
  // Anchor
  setAnchor(anchor: Anchor, payload: MoveAnchorPayload): Anchor | null;
  // Range

  // step
  moveRangeTo(step: Step): MoveResult;
  // moveEndAnchorTo(step: Step): NeighborResult;
}
