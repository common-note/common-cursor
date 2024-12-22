import { InvalidAnchorError, InvalidBoundaryDirectionError } from "./errors";
import type { LocationMixin, EditorConfig, EditorRange, Anchor, NeighborPayload, BoundaryPayload } from "./interface";


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


export function isEmptyText(node: Node) {
    return (node.textContent || "").length === 0;
}

export function simpleIsTextSegment(anchor: Anchor, offset: number): boolean {
    return true;
}

// export function elementOffset(element: HTMLElement): number {

// }

export class Editor implements LocationMixin {
    config: EditorConfig;
    root: Element;
    textPlaceholder: Text;
    constructor(config: EditorConfig, root: HTMLElement) {
        this.config = config;
        this.root = root;
        this.textPlaceholder = document.createTextNode("");
    }

    isTextSegment(anchor: Anchor, offset: number) {
        if (!this.config.isTextSegment) {
            return true;
        }
        return this.config.isTextSegment(anchor, offset);
    }

    shouldIgnore(node: Node) {
        if (!this.config.shouldIgnore) {
            return false;
        }
        return this.config.shouldIgnore(node);
    }

    /**
     * return neighbor anchor case1: 
     *  container is a text node and neighbor anchor also in the same text node
     * 
     *  <...>hel|lo world<...> 
     *           ↓
     *  <...>hell|o world<...>
     *  <...>he|llo world<...>
     * 
     * @param neighborPayload 
     * @returns 
     */
    _getHorizontalNeighborCase1({ anchor, direction }: NeighborPayload): Anchor | null {
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

    _getNeighborSibling({ container, direction }: BoundaryPayload): Node | null {
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

        return neighborSibling;
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

    _getHorizontalNeighborCase2(neighborPayload: NeighborPayload): Anchor | null {
        const { anchor, direction } = neighborPayload;
        const { container } = anchor;
        // let neighborSibling = currentSibling[siblingIterfn];

        if (anchor.container.nodeType !== Node.TEXT_NODE) {
            throw new InvalidAnchorError(anchor);
        }

        const neighborSibling = this._getNeighborSibling({
            container,
            direction: direction
        });
        if (neighborSibling instanceof Text) {
            // case 2.1 
            return this._getBoundaryAnchor({
                container: neighborSibling,
                direction: direction === "left" ? "right" : "left"
            })
        }

        if (neighborSibling instanceof HTMLElement) {
            // case 2.2
            return this._getBoundaryAnchor({
                container: neighborSibling,
                direction: direction === "left" ? "right" : "left"
            })
        }

        if (!neighborSibling) {
            // case 2.3
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const parent = container.parentElement!;
            if (parent === this.root) {
                return null;
            }
            // parent
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
            const text = document.createTextNode("");
            if (direction === "left") {
                parent.before(text);
            } else {
                parent.after(text);
            }
            return {
                container: text,
                offset: 0,
            }
        }
        throw new InvalidAnchorError(anchor);
    }

    _getHorizontalNeighborCase3({ anchor, direction }: NeighborPayload): Anchor | null {
        if (anchor.container.nodeType === Node.TEXT_NODE) {
            throw new InvalidAnchorError(anchor);
        }

        // do normalize then route to case1 or case2
        const { container, offset } = anchor;

        // 
        if (!container.childNodes[offset]) {
            // neighbor is a text node
            if (container.childNodes[offset - 1] instanceof Text) {
                return this._getHorizontalNeighbor({
                    anchor: this._getBoundaryAnchor({
                        container: container.childNodes[offset - 1],
                        direction: direction === 'left' ? 'right' : 'left'
                    }),
                    direction: direction
                })
            }

            // neighbor is not a text node
            container.appendChild(this.textPlaceholder);
            return this._getHorizontalNeighborCase2({
                anchor: {
                    container: this.textPlaceholder,
                    offset: 0,
                },
                direction: direction
            })
        }
        if (container.childNodes[offset] instanceof Text) {
            return this._getHorizontalNeighbor({
                anchor: this._getBoundaryAnchor({
                    container: container.childNodes[offset],
                    direction: direction === 'left' ? 'right' : 'left'
                }),
                direction: direction
            })
        }
        let text = null;
        if (direction === 'left' && container.childNodes[offset - 1] instanceof Text) {
            text = container.childNodes[offset - 1];
        } else {
            text = this.textPlaceholder;
            container.childNodes[offset].before(this.textPlaceholder);
        }
        return this._getHorizontalNeighbor({
            anchor: this._getBoundaryAnchor({
                container: text,
                direction: direction === 'left' ? 'right' : 'left'
            }),
            direction: direction
        })
    }

    _getHorizontalNeighbor({ anchor, direction }: NeighborPayload): Anchor {
        if (anchor.container.nodeType === Node.TEXT_NODE) {
            const { container, offset } = anchor;
            const textContent = container.textContent || "";
            if ((offset === 0 && direction === "left") || (offset === textContent.length && direction === "right")) {
                return this._getHorizontalNeighborCase2({ anchor, direction });
            }

            return this._getHorizontalNeighborCase1({ anchor, direction });
        }

        if (anchor.container instanceof HTMLElement) {
            return this._getHorizontalNeighborCase3({ anchor, direction });
        }

        throw new Error("Invalid anchor node type");
    }

    _getSoftVerticalNeighbor({ anchor, direction }: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }


    getNextLocation(neighborPayload: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }
    getPrevLocation(neighborPayload: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }
    getUpLocation(neighborPayload: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }
    getDownLocation(neighborPayload: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }
    getLeftLocation(neighborPayload: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }
    getRightLocation(neighborPayload: NeighborPayload): Anchor {
        throw new Error("Method not implemented.");
    }
    getLocation(): EditorRange {
        throw new Error("Method not implemented.");
    }
}

