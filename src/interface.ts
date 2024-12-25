
export interface Anchor {
    container: ContainerType;
    offset: number;
}

export type Direction = "left" | "right" | "up" | "down";
export type ContainerType = Element | Text | Node;

export interface NeighborPayload {
    anchor: Anchor;
    direction: Direction
}

export interface BoundaryPayload {
    container: ContainerType;
    direction: Direction;
}

export interface EditorRange {
    start: Anchor;
    end: Anchor;
    collapsed: boolean;
}

// edit html content = hello world
export const register = (html: HTMLElement) => {
    html.innerHTML = "hello world"
}


export interface AnchorQueryInterface {
    parentQueryer: AnchorQueryInterface | null;
    subQueryer: AnchorQueryInterface | null;
    
    isTextSegment(anchor: Anchor, offset: number): boolean;
    shouldIgnore(node: Node): boolean;
    nodeTokensize(node: Node): number;
    getAnchorByOffset(offset: number, base?: Anchor): Anchor;
    getOffsetByAnchor(anchor: Anchor): number;
    getHorizontalAnchor(neighborPayload: NeighborPayload): Anchor | null;
    getVerticalAnchor(neighborPayload: NeighborPayload): Anchor | null;
    moveQueryer(imp: AnchorQueryInterface): void;
}

export interface AnchorEditorInterface {
    setAnchor(anchor: Anchor): boolean;
    setStartAnchor(anchor: Anchor): boolean;
    setEndAnchor(anchor: Anchor): boolean;
    setRange(start: Anchor, end: Anchor): boolean;
    setStartAnchorTo(direction: Direction): boolean;
    setEndAnchorTo(direction: Direction): boolean;
}