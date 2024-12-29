import { NodeToString, anchorToStrong } from "./helper";
import type { Anchor } from "./interface";

export enum ErrorCode {
    INVALID_NODE = "INVALID_NODE",
    INVALID_ANCHOR = "INVALID_ANCHOR",
    INVALID_DIRECTION = "INVALID_DIRECTION",
    INVALID_OFFSET = "INVALID_OFFSET",
    AT_BOUNDARY = "AT_BOUNDARY",
    PARENT_NOT_FOUND = "PARENT_NOT_FOUND",
    CALCULATION_ERROR = "CALCULATION_ERROR",
  }
  
  export interface ErrorLocation {
    clazz: string;
    method: string;
    case?: string;
  }
  

  export interface QueryError {
    code: ErrorCode;
    message: string;
    location: ErrorLocation;
    context?: { [key: string]: unknown };
  }
  


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