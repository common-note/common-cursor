import { NodeToString, anchorToStrong } from "./helper";
import type { Anchor } from "./interface";

export class InvalidAnchorError extends Error {
    constructor(anchor: Anchor) {
        super(`Anchor: \n ${anchorToStrong(anchor)}`);
        this.name = "InvalidAnchorError";
    }
}

export class InvalidBoundaryDirectionError extends Error {
    constructor(container: Node, direction: string) {
        super(`Invalid boundary direction ${direction} in node: \n${NodeToString(container)}`);
        this.name = "InvalidBoundaryDirectionError";
    }
}

export class InvalidNodeTypeError extends Error {
    constructor(node: Node) {
        super(`Invalid node type ${node.nodeName}`);
        this.name = "InvalidNodeTypeError";
    }
}