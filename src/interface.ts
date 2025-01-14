import type { QueryError } from './errors';
import { Tokenizer } from './tokenizer';

export interface Anchor {
  container: ContainerType;
  offset: number;
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
  | 'softline' // like home/end in vscode wrap mode
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

export interface NeighborPayload {
  anchor: Anchor;
  step: Step;
}

export interface NeighborResult {
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

// edit html content = hello world
export const register = (html: HTMLElement) => {
  html.innerHTML = 'hello world';
};

/**
 * AnchorQueryInterface is a unstateful class, it is a query interface for a specific node.
 */
export interface AnchorQueryInterface {
  tokenizer: Tokenizer;
  shouldIgnore(node: Node): boolean;
  getTokenOffset(node: Node): number;
  getAnchorByOffset(offset: number, base?: Anchor): Anchor;
  getOffsetByAnchor(anchor: Anchor): number;
  getHorizontalAnchor(neighborPayload: NeighborPayload): NeighborResult;
  getVerticalAnchor(neighborPayload: NeighborPayload): NeighborResult;
}

export interface QueryCallback {
  onUpdate(operation: UpdateOperation): void;
}

/**
 * StatefulAnchorEditorInterface is a stateful class,
 * which is a manager for multiple AnchorQueryInterface.
 */
export interface StatefulAnchorEditorInterface {
  // Anchor
  resetAnchor(anchor: Anchor): Anchor | null;
  setAnchor(anchor: Anchor, payload: MoveAnchorPayload): Anchor | null;
  resetEndAnchor(anchor: Anchor): Anchor | null;
  // Range
  resetRange(start: Anchor, end: Anchor): boolean;

  // step
  moveRangeTo(step: Step): NeighborResult;
  // moveEndAnchorTo(step: Step): NeighborResult;
}
