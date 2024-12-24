
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


export interface LocConfig {
    shouldIgnore?: (node: Node) => boolean;
    isTextSegment?: (anchor: Anchor, offset: number) => boolean;
    isRoot?: (node: Node) => boolean;
    onLeaveNode?: (anchor: Anchor) => void;
    onEnterNode?: (anchor: Anchor) => void;
    cachedTokensize?: boolean;
}

/**
 * 
 * case1: caret in text node and not reach the boundary (getHorizontalNeighborCase1)
 *      hello | world     (right || left) => neighborOffset
 * 
 * case2: caret in text node and reach the boundary (getHorizontalNeighborCase2)
 *              container(Text)
 *                  ↓
 *      hello world | ... (right)
 *      ... | hello world (left) 
 * 
 * case2.1: caret in text node and reach the boundary and the boundary is a text node
 *      hello world | hello world         (right || left)
 *          => next.firstAnchor 
 *          => prev.lastAnchor 
 *      <text segment>|<text segment>
 * 
 * case2.2: caret in text node and reach the boundary and the boundary is a html element
 *      hello world |<p>hello world</p>   (right)
 *              => next.firstAnchor
 *      <p>hello world</p>|hello world    (left)
 *              => prev.lastAnchor
 * 
 * case2.3: caret in text node and reach the boundary and the node is at boundary
 *      <p>hello world|</p>   (right)
 *              => {container.parent, parent(p).parentElementOffset + 1}
 *      <p>|hello world</p>   (left)
 *              => {container.parent, parent(p).parentElementOffset}
 * 
 * case3: caret in html element (getHorizontalCase3)
 * 
 * case3.1: caret in html element and the html element is at boundary
 *        container(p)
 *            ↓
 *      <div><p>...<b>hello</b>|</p>...</div>   (right)
 *                             ↑
 *                    offset(childNodes.length-1)
 *              => {container.parent, container.parentElementOffset + 1}
 * 
 *            container(p)
 *                ↓
 *      <div>...<p>|<b>hello</b>...</p></div>   (left)
 *                 ↑
 *             offset(0)
 *              => {container.parent, container.parentElementOffset}
 * 
 * case3.2: caret in html element and the html element is not at boundary
 *      <p>hello</p>|<p>world</p>  (left || right)
 *              => next.firstAnchor
 *              => prev.firstAnchor
 * 
 * case3.3: caret in html element and the neighbor element is a text node
 *      (n.case1) => refunction
 * 
 * normalize: make anchor container change from html to text but keep cursor fixed in vision.
 * 
 * n.case1: 
 *      caret in html element but child[offset] or child[offset - 1] is a text node
 *  
 * n.case2:
 *      caret in html element but child[offset] and child[offset - 1] are both element node
 * 
 * get boundary Anchor
 * 
 * 
 * <prev|next>.case1: <prev|next> exists
 * <prev|next>.case2: <prev|next> not exists
 *      anchor = parent.boundaryOffset
 * 
 * parent.<prev|next>.case1: <prev|next> exists
 * parent.<prev|next>.case2: <prev|next> not exists
 *      anchor = parent.parentElementOffset
 * 
 */
export interface AnchorInterface {
    getLocation(): EditorRange;
    /**
     * 
     * case1: caret in text node and not reach the boundary (getHorizontalNeighborCase1)
     *      hello | world     (right || left)
     * 
     * @param neighborPayload 
     * @returns 
     */
    _getHorizontalNeighborCase1(neighborPayload: NeighborPayload): Anchor | null;
    /**
     * 
     * case2.1: caret in text node and reach the boundary and the boundary is a text node
     *      hello world | hello world         (right || left)
     *      <text segment>|<text segment>
     * 
     * case2.2: caret in text node and reach the boundary and the boundary is a html element
     *      hello world |<p>hello world</p>   (right)
     *      <p>hello world</p>|hello world    (left)
     * 
     * case2.3: caret in text node and reach the boundary and the node is at boundary
     *      <p>hello world|</p>   (right)
     *      <p>|hello world</p>   (left)
     * 
     * @param neighborPayload 
     * @returns 
     */
    _getHorizontalNeighborCase2(neighborPayload: NeighborPayload): Anchor | null;
    /**
     * 
     * case3: caret in html element
     *  
     * case3.1: caret in html element and the html element is at boundary
     *      <div><p>...<b>hello</b>|<p>...</div>   (right)
     *      <div>...<p>|<b>hello</b></p></div>   (left)
     * 
     * case3.2: caret in html element and the html element is not at boundary
     *      <p>hello</p>|<p>world</p>  (left || right)
     * 
     * case3.3: caret in html element and the neighbor element is a text node
     *      (normalize case1)
     * 
     * @param neighborPayload 
     * @returns 
     */
    _getHorizontalNeighborCase3(neighborPayload: NeighborPayload): Anchor | null;

    getHorizontalAnchor(neighborPayload: NeighborPayload): Anchor | null;
    getVerticalAnchor(neighborPayload: NeighborPayload): Anchor | null;
}
