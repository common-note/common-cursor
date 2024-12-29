import type { Anchor } from "./interface";

/**
 * Convert Node to string
 * @param node 
 * @returns 
 */
export function NodeToString(node: Node): string {
    if (node instanceof Text) {
        return node.textContent || "";
    }
    if (node instanceof HTMLElement) {
        return node.outerHTML || "";
    }
    return "";
}

/**
 * Convert Node to simple string
 * @param node 
 * @returns 
 */
export function simpleNodeRepr(node: Node): string {
    if (node instanceof Text) {
        if (node.textContent?.length === 0) {
            return "";
        }
        return "<t/>";
    }
    if (node instanceof HTMLElement) {
        const tag = node.localName;
        return `<${tag}>...</${tag}>`;
    }
    return `<${node.nodeName}/>`;
} 


/**
 * Convert node to string, with anchor position marked as |
 * @param anchor 
 * @returns 
 */
export function anchorToStrong(anchor: Anchor | null): string {
    if (anchor === null) {
        return "";
    }
    const { container, offset } = anchor;
    let innerHTML = "";
    if (container.nodeType === Node.TEXT_NODE) {
        innerHTML = container.textContent || "";
        innerHTML = `${innerHTML.slice(0, offset)}|${innerHTML.slice(offset, innerHTML.length)}`;
    } else {
        const curNode = container as HTMLElement;
        const childNodes = curNode.childNodes;
        const chunks = [];
        for (let i = 0; i < childNodes.length; i++) {
            if (offset === i) {
                chunks.push("|");
            }
            chunks.push(NodeToString(childNodes[i] as HTMLElement));
        }
        if (childNodes.length === 0) {
            chunks.push("|");
        } else if (offset === childNodes.length) {
            chunks.push("|");
        }
        const containerNode = curNode.localName;
        innerHTML = `<${containerNode}>${chunks.join("")}</${containerNode}>`;
    }
    const parent = container.parentElement;
    if (parent) {
        const chunks: string[] = [];
        for (let i = 0; i < parent.childNodes.length; i++) {
            const item = parent.childNodes[i];
            if (item === container) {
                chunks.push(innerHTML);
            } else {
                chunks.push(simpleNodeRepr(item));
            }
        }
        innerHTML = chunks.join("");
        const parentNode = parent.localName;
        innerHTML = `<${parentNode}>${innerHTML}</${parentNode}>`;
    }

    return innerHTML;
}

/**
 * find node with filter function
 * @param node 
 * @param filter 
 * @returns 
 */
export function findNode<T extends Node>(node: Node, filter: (node: T) => boolean): T | null {
    let curNode = node;
    while (curNode) {
        if (filter(curNode as T)) {
            return curNode as T;
        }
        if (!curNode.parentElement) {
            break;
        }
        curNode = curNode.parentElement;
    }
    return null;
}