import type { QueryError } from './errors';

export interface Anchor {
  container: ContainerType;
  offset: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';
export type Stride =
  | 'char' // like left/right
  | 'word' // like alt + left/right
  | 'segment' // like ctrl + left/right
  | 'softline' // like home/end in vscode wrap mode
  | 'paragraph' // like double home/end in vscode
  | 'screen' // like pageup/pagedown
  | 'document'; // like ctrl + home/end

export type ContainerType = Element | Text | Node;
export interface Step {
  direction: Direction;
  stride: Stride;
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
  isTextSegment(anchor: Anchor, offset: number): boolean;
  shouldIgnore(node: Node): boolean;
  nodeTokensize(node: Node): number;
  getAnchorByOffset(offset: number, base?: Anchor): Anchor;
  getOffsetByAnchor(anchor: Anchor): number;
  getHorizontalAnchor(neighborPayload: NeighborPayload): NeighborResult;
  getVerticalAnchor(neighborPayload: NeighborPayload): NeighborResult;
}

/**
 * StatefulAnchorEditorInterface is a stateful class,
 * which is a manager for multiple AnchorQueryInterface.
 */
export interface StatefulAnchorEditorInterface {
  // Anchor
  resetAnchor(anchor: Anchor): Anchor | null;
  resetStartAnchor(anchor: Anchor): Anchor | null;
  resetEndAnchor(anchor: Anchor): Anchor | null;
  // Range
  resetRange(start: Anchor, end: Anchor): boolean;

  // step
  moveStartAnchorTo(step: Step): NeighborResult;
  moveEndAnchorTo(step: Step): NeighborResult;
}
