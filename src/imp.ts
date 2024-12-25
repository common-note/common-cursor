import { InvalidAnchorError, InvalidBoundaryDirectionError } from "./errors";
import type { AnchorQueryInterface, EditorRange, Anchor, NeighborPayload, BoundaryPayload, AnchorEditorInterface } from "./interface";

export interface LocConfig {
    shouldIgnore?: (node: Node) => boolean;
    isTextSegment?: (anchor: Anchor, offset: number) => boolean;
    isRoot?: (node: Node) => boolean;
    onLeaveNode?: (anchor: Anchor) => void;
    onEnterNode?: (anchor: Anchor) => void;
    cachedTokensize?: boolean;
    parentQueryer?: AnchorQueryInterface;
}


export function editableRange(range: Range): EditorRange {
    return {
        start: {
            container: range.startContainer,
            offset: range.startOffset,
        },
        end: {
            container: range.endContainer,
            offset: range.endOffset,
        },
        collapsed: range.collapsed,
    }
}

const singleClosingElems = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

function isSingleClosing(elem: HTMLElement) {
    return singleClosingElems.indexOf(elem.tagName.toLowerCase()) !== -1;
}

export function isEmptyText(node: Node) {
    return (node.textContent || "").length === 0;
}

export function simpleIsTextSegment(anchor: Anchor, offset: number): boolean {
    return true;
}

export class AnchorQuery implements AnchorQueryInterface {
    config: LocConfig;
    root: Element;
    parentQueryer: AnchorQueryInterface | null = null;
    subQueryer: AnchorQueryInterface | null = null;
    constructor(config: LocConfig, root: HTMLElement) {
        this.config = config;
        this.root = root;
        this._textPlaceholder = document.createTextNode("");
        this.parentQueryer = config.parentQueryer || null;
    }
    
    moveQueryer(imp: AnchorQueryInterface): void {
        this.subQueryer = imp;
        this.parentQueryer = imp.parentQueryer;
    }
    // only return empty text node
    private _textPlaceholder: Text;
    public get textPlaceholder(): Text {
        if ((this._textPlaceholder.textContent || "").length !== 0) {
            this._textPlaceholder = document.createTextNode("");
        }
        return this._textPlaceholder;
    }

    isTextSegment(anchor: Anchor, offset: number) {
        if (!this.config.isTextSegment) {
            return true;
        }
        return this.config.isTextSegment(anchor, offset);
    }

    shouldIgnore(node: Node) {
        if (!(node instanceof Text || node instanceof HTMLElement)) {
            return true;
        }

        if (!this.config.shouldIgnore) {
            return false;
        }
        return this.config.shouldIgnore(node);
    }

    _getNeighborSibling({ container, direction }: BoundaryPayload): HTMLElement | Text | null {
        const siblingIterfn = direction === "left" ? "previousSibling" : "nextSibling";
        const currentSibling = container;
        let neighborSibling = currentSibling[siblingIterfn];

        if (!neighborSibling) {
            return null;
        }

        while (neighborSibling) {
            if (neighborSibling instanceof Text) {
                if (!isEmptyText(neighborSibling) || !(neighborSibling[siblingIterfn] instanceof Text)) {
                    break;
                }
            }

            if (!this.shouldIgnore(neighborSibling)) {
                break;
            }

            neighborSibling = neighborSibling[siblingIterfn] || null;
        }

        return neighborSibling as HTMLElement | Text | null;
    }


    _getBoundaryAnchor({ container, direction }: BoundaryPayload): Anchor {
        if (direction === 'left') {
            if (container instanceof Text) {
                return {
                    container: container,
                    offset: 0,
                }
            }
            if (container instanceof HTMLElement) {
                if (container.childNodes.length === 0) {
                    container.after(this.textPlaceholder);
                    return {
                        container: this.textPlaceholder,
                        offset: 0,
                    }
                }
                let i = 0;
                for (i = 0; i < container.childNodes.length; i++) {
                    const child = container.childNodes[i];
                    if (!(child instanceof HTMLElement) && !(child instanceof Text)) {
                        continue;
                    }
                    if (this.shouldIgnore(child)) {
                        continue;
                    }
                    break;
                }
                if (container.childNodes[i] instanceof Text) {
                    return {
                        container: container.childNodes[i],
                        offset: 0,
                    }
                }
                return {
                    container: container,
                    offset: i,
                }
            }
        }

        if (direction === 'right') {
            if (container instanceof Text) {
                return {
                    container: container,
                    offset: container.textContent?.length || 0,
                }
            }

            if (container instanceof HTMLElement) {
                if (container.childNodes.length === 0) {
                    container.after(this.textPlaceholder);
                    return {
                        container: this.textPlaceholder,
                        offset: 0,
                    }
                }
                let i = container.childNodes.length;
                for (i = container.childNodes.length - 1; i >= 0; i--) {
                    const child = container.childNodes[i];
                    if (!(child instanceof HTMLElement) && !(child instanceof Text)) {
                        continue;
                    }
                    if (this.shouldIgnore(child)) {
                        continue;
                    }
                    break;
                }
                if (container.childNodes[i] instanceof Text) {
                    return {
                        container: container.childNodes[i],
                        offset: container.childNodes[i].textContent?.length || 0,
                    }
                }
                return {
                    container: container,
                    offset: i,
                }
            }
        }
        throw new InvalidBoundaryDirectionError(container, direction);
    }
    /**
      * 
      * case1: caret in text node and not reach the boundary (getHorizontalNeighborCase1)
      *      hello | world     (right || left)
      * 
      * @param neighborPayload 
      * @returns 
      */
    _getHorizontalNeighborCase1({ anchor, direction }: NeighborPayload): Anchor {
        if (anchor.container.nodeType !== Node.TEXT_NODE) {
            throw new Error("Anchor is not a text node");
        }
        if ((anchor.offset === 0 && direction === "left") || (anchor.offset === (anchor.container.textContent?.length || 0) && direction === "right")) {
            throw new InvalidAnchorError(anchor);
        }
        if (direction === "left") {
            let offset = anchor.offset - 1;
            while (offset > 0) {
                if (this.isTextSegment(anchor, offset)) {
                    break;
                }
                offset--;
            }
            return {
                container: anchor.container,
                offset: offset,
            }
        }

        if (direction === "right") {
            let offset = anchor.offset + 1;
            const textContent = anchor.container.textContent || "";
            while (offset < textContent.length - 1) {
                if (this.isTextSegment(anchor, offset)) {
                    break;
                }
                offset++;
            }
            return {
                container: anchor.container,
                offset: offset,
            }
        }

        throw new Error(`Invalid neighbor direction ${direction}`);
    }

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
    _getHorizontalNeighborCase2(neighborPayload: NeighborPayload): Anchor | null {
        const { anchor, direction } = neighborPayload;
        const { container } = anchor;

        if (anchor.container.nodeType !== Node.TEXT_NODE) {
            throw new InvalidAnchorError(anchor);
        }

        const neighborSibling = this._getNeighborSibling({
            container,
            direction: direction
        });

        if (neighborSibling) {
            // case 2.1, 2.2
            return this._getBoundaryAnchor({
                container: neighborSibling,
                direction: direction === "left" ? "right" : "left"
            })
        }

        // case 2.3
        //    <p>hello world|</p>
        //  =><p>hello world</p>"|"
        const parent = container.parentElement;
        if (!parent || parent === this.root) {
            return null;
        }
        const parentNeighborSibling = this._getNeighborSibling({
            container: parent,
            direction: direction
        })
        if (parentNeighborSibling instanceof Text) {
            return this._getBoundaryAnchor({
                container: parentNeighborSibling,
                direction: direction === "left" ? "right" : "left"
            })
        }
        if (direction === "left") {
            parent.before(this.textPlaceholder);
        } else {
            parent.after(this.textPlaceholder);
        }
        return {
            container: this.textPlaceholder,
            offset: 0,
        }

    }

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
    _getHorizontalNeighborCase3({ anchor, direction }: NeighborPayload): Anchor | null {
        // do normalize then route to case1 or case2
        if (anchor.container.nodeType === Node.TEXT_NODE) {
            throw new InvalidAnchorError(anchor);
        }

        const { container, offset } = anchor;

        if (container.childNodes[offset] instanceof Text) {
            //    <p><any/>|world</p> (p, 1)
            //   =<p><any/>|world</p> (text`world`, 0)
            return this._getHorizontalNeighbor({
                anchor: this._getBoundaryAnchor({
                    container: container.childNodes[offset],
                    direction: 'left'
                }),
                direction: direction
            })
        }
        if (container.childNodes[offset - 1] instanceof Text) {
            //    <p>hello|<any/></p> (p, 1)
            //   =<p>hello|<any/></p> (text`hello`, 5)
            return this._getHorizontalNeighbor({
                anchor: this._getBoundaryAnchor({
                    container: container.childNodes[offset - 1],
                    direction: 'right'
                }),
                direction: direction
            })
        }

        if (!container.childNodes[offset]) {
            //   <p><b></b>|</p>   (p, 1)
            // = <p><b></b>"|"</p> (text``, 0)
            container.appendChild(this.textPlaceholder);
            return this._getHorizontalNeighborCase2({
                anchor: {
                    container: this.textPlaceholder,
                    offset: 0,
                },
                direction: direction
            })
        }

        //   <p><b></b>|<b></b></p>   (p, 1)
        // = <p><b></b>"|"<b></b></p> (text``, 0)
        const text = this.textPlaceholder;
        container.childNodes[offset].before(text);
        return this._getHorizontalNeighbor({
            anchor: {
                container: text,
                offset: 0,
            },
            direction: direction
        })
    }

    _getHorizontalNeighbor({ anchor, direction }: NeighborPayload): Anchor | null {
        let ret = null;
        if (anchor.container instanceof Text) {
            const { container, offset } = anchor;
            const textContent = container.textContent || "";

            if ((offset === 0 && direction === "left") ||
                (offset === textContent.length && direction === "right")) {
                ret = this._getHorizontalNeighborCase2({ anchor, direction });
            } else {
                ret = this._getHorizontalNeighborCase1({ anchor, direction });
            }

        } else if (anchor.container instanceof HTMLElement) {
            ret = this._getHorizontalNeighborCase3({ anchor, direction });
        }

        if (ret && ret.container !== anchor.container) {
            this.config.onLeaveNode?.(anchor);
            this.config.onEnterNode?.(ret);
        }

        return ret;
    }

    _getSoftVerticalNeighbor({ anchor, direction }: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }

    _nodeTokensize(node: Node): number {
        let ret = 0;
        if (this.shouldIgnore(node)) {
            return ret;
        }
        const cached = this.config.cachedTokensize;
        if (node instanceof Text) {
            console.debug(node.nodeName, node.textContent?.length || 0);
            ret = node.textContent?.length || 0;
        }
        if (node instanceof HTMLElement) {
            if (cached && node.hasAttribute("token-size")) {
                ret = Number.parseInt(node.getAttribute("token-size") || "0");
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    const child = node.childNodes[i];
                    ret += this.nodeTokensize(child);
                }
                console.debug(node.nodeName, ret + 2);
                if (isSingleClosing(node)) {
                    ret += 1;
                } else {
                    ret += 2;
                }
                if (cached) {
                    node.setAttribute("token-size", ret.toString());
                }
            }
        }
        return ret;
    }

    nodeTokensize(node: Node): number {
        if (this.subQueryer) {
            return this.subQueryer.nodeTokensize(node);
        }
        return this._nodeTokensize(node);
    }

    _getAnchorByOffset(offset: number, base?: Anchor): Anchor {
        let current = base;
        if (!current) {
            current = {
                container: this.root,
                offset: 0,
            }
        }
        let residual = offset;

        if (current.container instanceof Text) {
            const content = current.container.textContent || "";
            if (content.length < residual) {
                throw new Error("invalid search");
            }
            return {
                container: current.container,
                offset: residual,
            }
        }

        while (residual > 0) {
            for (let i = 0; i < current.container.childNodes.length; i++) {
                const child = current.container.childNodes[i];
                if (this.shouldIgnore(child)) {
                    continue;
                }
                const childSize = this.nodeTokensize(child);
                if (residual > childSize) {
                    residual -= childSize;
                } else if (residual === childSize) {
                    return {
                        container: current.container,
                        offset: i + 1,
                    }
                } else if (residual < childSize) {
                    if (child instanceof Text) {
                        return this.getAnchorByOffset(residual, {
                            container: child,
                            offset: 0
                        })
                    }
                    return this.getAnchorByOffset(residual - 1, {
                        container: child,
                        offset: 0
                    })
                }
            }
            throw new Error("Can not get anchor by offset");
        }

        return current;
    }
    getAnchorByOffset(offset: number, base?: Anchor): Anchor {
        if (this.subQueryer) {
            return this.subQueryer.getAnchorByOffset(offset, base);
        }
        return this._getAnchorByOffset(offset, base);
    }

    _getOffsetByAnchor({ container, offset }: Anchor): number {
        let current = container;
        let size = 0;
        if (container instanceof Text) {
            size += offset;
            if (!current.parentElement) {
                throw new Error("Can not get offset of this anchor");
            }
            console.debug(current.nodeName, size);
        } else if (container instanceof HTMLElement) {
            for (let i = offset - 1; i >= 0; i--) {
                if (!container.childNodes[i]) {
                    continue;
                }
                if (this.shouldIgnore(container.childNodes[i])) {
                    continue;
                }
                size += this.nodeTokensize(container.childNodes[i]);
                console.debug(container.childNodes[i].nodeName, size);
            }
            size += 1;
            console.debug(current.nodeName, size);
        } else {
            throw new Error("Invalid anchor node type");
        }

        while (current && current !== this.root) {
            let currentSibling = this._getNeighborSibling({
                container: current,
                direction: "left"
            });
            while (currentSibling) {
                size += this.nodeTokensize(currentSibling);
                console.debug(currentSibling.nodeName, size);
                currentSibling = this._getNeighborSibling({
                    container: currentSibling,
                    direction: "left"
                });
            }
            if (!current.parentElement) {
                throw new Error("Can not get offset of this anchor");
            }
            current = current.parentElement;
            console.debug(current.nodeName, size);
            size += 1;
        }
        // first location is (root, 0)
        // last location is (root, childNodes.length)
        return size - 1;
    }
    getOffsetByAnchor(anchor: Anchor): number {
        if (this.subQueryer) {
            return this.subQueryer.getOffsetByAnchor(anchor);
        }
        return this._getOffsetByAnchor(anchor);
    }

    _refreshNodeTokensize(node: Node): void {
        throw new Error("Method not implemented.")
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
    getHorizontalAnchor(neighborPayload: NeighborPayload): Anchor | null {
        if (this.subQueryer) {
            return this.subQueryer.getHorizontalAnchor(neighborPayload);
        }
        const anchor = this._getHorizontalNeighbor(neighborPayload);
        if (anchor) {
            return anchor;
        }
        if (this.parentQueryer) {
            return this.parentQueryer.getHorizontalAnchor(neighborPayload);
        }
        return null;
    }
    getVerticalAnchor(neighborPayload: NeighborPayload): Anchor | null {
        if (this.subQueryer) {
            return this.subQueryer.getVerticalAnchor(neighborPayload);
        }
        // return this._getVerticalNeighbor(neighborPayload);
        throw new Error("not implemented");
    }

}


export class AnchorEditor extends AnchorQuery implements AnchorEditorInterface {
    lastMoveDirection: "left" | "right" | "up" | "down" | "none" = "none";
    lastMoveAnchor: "start" | "end" | "none" = "none";
    // constructor(config: LocConfig, root: HTMLElement) {
    //     super(config, root);
    // }


    setAnchor(anchor: Anchor): boolean {
        const selection = document.getSelection();
        if (selection) {
            selection.setPosition(anchor.container, anchor.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "none";
            return true;
        }
        return false;
    }
    setStartAnchor(anchor: Anchor): boolean {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            range.setStart(anchor.container, anchor.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "start";
            return true;
        }
        return false;
    }
    setEndAnchor(anchor: Anchor): boolean {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            range.setEnd(anchor.container, anchor.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "end";
            return true;
        }
        return false;
    }

    setRange(start: Anchor, end: Anchor): boolean {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            range.setStart(start.container, start.offset);
            range.setEnd(end.container, end.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "none";
            return true;
        }
        return false;
    }

    setEndAnchorTo(direction: "left" | "right"): boolean {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            const next = this.getHorizontalAnchor({
                anchor: { container: range.endContainer, offset: range.endOffset },
                direction: direction
            });
            if (next) {
                this.setEndAnchor(next);
                this.lastMoveDirection = direction;
                this.lastMoveAnchor = "end";
                return true;
            }
        }
        return false;
    }

    setStartAnchorTo(direction: "left" | "right"): boolean {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            const prev = this.getHorizontalAnchor({
                anchor: { container: range.startContainer, offset: range.startOffset },
                direction: direction
            });
            if (prev) {
                this.setStartAnchor(prev);
                this.lastMoveDirection = direction;
                this.lastMoveAnchor = "start";
                return true;
            }
        }
        return false;
    }
}
