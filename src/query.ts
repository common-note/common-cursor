import {
  ErrorCode,
  InvalidBoundaryDirectionError,
  type QueryError,
} from './errors';
import { DomRangeHelper, getLineInfo, indexOf } from './helper';
import { I18N } from './i18n';
import type { MessageType } from './i18n';
import type {
  Anchor,
  AnchorQueryInterface,
  AnchorRange,
  ContainerType,
  Direction,
  EditorRange,
  NeighborPayload,
  NeighborResult,
  QueryCallback,
  Step,
  UpdateOperation,
} from './interface';
import { DefaultTokenizer, Tokenizer } from './tokenizer';

interface BoundaryPayload {
  container: ContainerType;
  step: Step;
}

export interface SimpleNeighborResult {
  next: Anchor | null;
  error?: QueryError;
}

export interface QueryConfig {
  language?: keyof typeof I18N;
  shouldIgnore?: (node: Node, editor: AnchorQueryInterface) => boolean;
  tokenizer?: Tokenizer;
  isRoot?: (node: Node, editor: AnchorQueryInterface) => boolean;
  cachedTokensize?: boolean;
  parentQueryer?: AnchorQueryInterface;
  onDefault?: (neighborPayload: NeighborPayload) => NeighborResult;
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
  };
}

const singleClosingElems = [
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

function isSingleClosing(elem: HTMLElement) {
  return singleClosingElems.indexOf(elem.tagName.toLowerCase()) !== -1;
}

export function isEmptyText(node: Node) {
  return (node.textContent || '').length === 0;
}

export function reverseDirection(direction: Direction): Direction {
  if (direction === 'left') {
    return 'right';
  }
  if (direction === 'right') {
    return 'left';
  }
  throw new Error('Invalid direction');
}

export function reverseStep(step: Step): Step {
  return {
    direction: reverseDirection(step.direction),
    stride: step.stride,
  };
}

/**
 * AnchorQuery is a unstateful class, it is a query interface for a specific node.
 */
export class AnchorQuery implements AnchorQueryInterface, QueryCallback {
  config: QueryConfig;
  root: Element;
  tokenizer: Tokenizer;
  messages: MessageType;
  constructor(config: QueryConfig, root: HTMLElement) {
    this.config = config;
    this.root = root;
    this._textPlaceholder = document.createTextNode('');
    this.messages = I18N[config.language || 'en'];

    this.tokenizer = this.config.tokenizer || new DefaultTokenizer();
  }
  // only return empty text node
  private _textPlaceholder: Text;
  public get textPlaceholder(): Text {
    if ((this._textPlaceholder.textContent || '').length !== 0) {
      this._textPlaceholder = document.createTextNode('');
    }
    return this._textPlaceholder;
  }

  shouldIgnore(node: Node) {
    if (!(node instanceof Text || node instanceof HTMLElement)) {
      return true;
    }

    if (!this.config.shouldIgnore) {
      return false;
    }
    return this.config.shouldIgnore(node, this);
  }

  _makeError(
    code: ErrorCode,
    method: string,
    message: string,
    context?: { [key: string]: unknown },
  ): QueryError {
    return {
      code,
      message,
      location: {
        clazz: this.constructor.name,
        method: method,
      },
      context: context,
    };
  }

  _getNeighborSibling({
    container,
    step,
  }: BoundaryPayload): HTMLElement | Text | null {
    const siblingIterfn =
      step.direction === 'left' ? 'previousSibling' : 'nextSibling';
    const currentSibling = container;
    let neighborSibling = currentSibling[siblingIterfn];

    if (!neighborSibling) {
      return null;
    }

    while (neighborSibling) {
      if (neighborSibling instanceof Text) {
        if (
          !isEmptyText(neighborSibling) ||
          !(neighborSibling[siblingIterfn] instanceof Text)
        ) {
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

  onUpdate(operation: UpdateOperation) {

  }

  _getInnerBoundaryAnchor({ container, step }: BoundaryPayload): Anchor {
    if (step.direction === 'left') {
      if (container instanceof Text) {
        return {
          container: container,
          offset: 0,
        };
      }
      if (container instanceof HTMLElement) {
        if (container.childNodes.length === 0) {
          container.after(this.textPlaceholder);
          return {
            container: this.textPlaceholder,
            offset: 0,
          };
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
          };
        }
        return {
          container: container,
          offset: i,
        };
      }
    }

    if (step.direction === 'right') {
      if (container instanceof Text) {
        return {
          container: container,
          offset: container.textContent?.length || 0,
        };
      }

      if (container instanceof HTMLElement) {
        if (container.childNodes.length === 0) {
          container.after(this.textPlaceholder);
          return {
            container: this.textPlaceholder,
            offset: 0,
          };
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
          };
        }
        return {
          container: container,
          offset: i,
        };
      }
    }
    throw new InvalidBoundaryDirectionError(container, step.direction);
  }
  /**
   *
   * case1: caret in text node and not reach the boundary (getHorizontalNeighborCase1)
   *      hello | world     (right || left)
   *
   * @param neighborPayload
   * @returns
   */
  _getHorizontalNeighborCase1({
    anchor,
    step,
  }: NeighborPayload): SimpleNeighborResult {
    if (anchor.container.nodeType !== Node.TEXT_NODE) {
      return {
        next: null,
        error: this._makeError(
          ErrorCode.INVALID_ANCHOR,
          '_getHorizontalNeighborCase1',
          this.messages.QUERY_ERROR.NOT_TEXT_NODE,
        ),
      };
    }
    if (
      (anchor.offset === 0 && step.direction === 'left') ||
      (anchor.offset === (anchor.container.textContent?.length || 0) &&
        step.direction === 'right')
    ) {
      return {
        next: null,
        error: this._makeError(
          ErrorCode.AT_BOUNDARY,
          '_getHorizontalNeighborCase1',
          this.messages.QUERY_ERROR.AT_TEXT_NODE_BOUNDARY,
        ),
      };
    }

    let startOffset = anchor.offset;
    const offset = this.tokenizer.next(anchor.container.textContent || '', startOffset, step);
    if (offset !== -1) {
      return {
        next: {
          container: anchor.container,
          offset: offset,
        },
      };
    }

    return {
      next: null,
      error: this._makeError(
        ErrorCode.INVALID_DIRECTION,
        '_getHorizontalNeighborCase1',
        this.messages.QUERY_ERROR.INVALID_NEIGHBOR_DIRECTION,
      ),
    };
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
  _getHorizontalNeighborCase2(
    neighborPayload: NeighborPayload,
  ): SimpleNeighborResult {
    const { anchor, step } = neighborPayload;
    const { container } = anchor;

    if (anchor.container.nodeType !== Node.TEXT_NODE) {
      return {
        next: null,
        error: this._makeError(
          ErrorCode.INVALID_ANCHOR,
          '_getHorizontalNeighborCase2',
          this.messages.QUERY_ERROR.INVALID_ANCHOR_NODE,
        ),
      };
    }

    const neighborSibling = this._getNeighborSibling({
      container,
      step,
    });

    if (neighborSibling) {
      // case 2.1, 2.2
      return {
        next: this._getInnerBoundaryAnchor({
          container: neighborSibling,
          step: reverseStep(step),
        }),
      };
    }

    // case 2.3
    //    <p>hello world|</p>
    //  =><p>hello world</p>"|"
    const parent = container.parentElement;
    if (!parent || parent === this.root) {
      return {
        next: null,
        error: this._makeError(
          ErrorCode.AT_BOUNDARY,
          '_getHorizontalNeighborCase2',
          this.messages.QUERY_ERROR.AT_TEXT_NODE_BOUNDARY,
        ),
      };
    }
    const parentNeighborSibling = this._getNeighborSibling({
      container: parent,
      step: step,
    });
    if (parentNeighborSibling instanceof Text) {
      return {
        next: this._getInnerBoundaryAnchor({
          container: parentNeighborSibling,
          step: reverseStep(step),
        }),
      };
    }
    if (step.direction === 'left') {
      parent.before(this.textPlaceholder);
    } else {
      parent.after(this.textPlaceholder);
    }
    return {
      next: {
        container: this.textPlaceholder,
        offset: 0,
      },
    };
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
  _getHorizontalNeighborCase3({
    anchor,
    step,
  }: NeighborPayload): SimpleNeighborResult {
    // do normalize then route to case1 or case2
    if (anchor.container.nodeType === Node.TEXT_NODE) {
      return {
        next: null,
        error: this._makeError(
          ErrorCode.INVALID_ANCHOR,
          '_getHorizontalNeighborCase3',
          '[horizontal case3] Anchor is a text node',
        ),
      };
    }

    const { container, offset } = anchor;

    if (container.childNodes[offset] instanceof Text) {
      //    <p><any/>|world</p> (p, 1)
      //   =<p><any/>|world</p> (text`world`, 0)
      return this._getHorizontalNeighbor({
        anchor: this._getInnerBoundaryAnchor({
          container: container.childNodes[offset],
          step: reverseStep(step),
        }),
        step: step,
      });
    }
    if (container.childNodes[offset - 1] instanceof Text) {
      //    <p>hello|<any/></p> (p, 1)
      //   =<p>hello|<any/></p> (text`hello`, 5)
      return this._getHorizontalNeighbor({
        anchor: this._getInnerBoundaryAnchor({
          container: container.childNodes[offset - 1],
          step: reverseStep(step),
        }),
        step: step,
      });
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
        step: step,
      });
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
      step: step,
    });
  }

  _getHorizontalNeighbor(neighborPayload: NeighborPayload): SimpleNeighborResult {
    const { anchor, step } = neighborPayload;
    let ret: SimpleNeighborResult = {
      next: null,
      error: undefined,
    };

    if (step.stride === "none") {
      ret = {
        next: anchor,
        error: undefined,
      }
    }
    else if (step.stride === "paragraph") {
      ret = {
        next: this._getInnerBoundaryAnchor({
          container: this.root,
          step: reverseStep(step),
        }),
      }
    } else if (step.stride === "softline" || step.stride === "softline-boundary") {
      ret = {
        next: this._getSoftlineBoundary(neighborPayload),
      }
    } else if (step.stride === "word" || step.stride === "char") {

      if (anchor.container instanceof Text) {
        const { container, offset } = anchor;
        const textContent = container.textContent || '';

        if (
          (offset === 0 && step.direction === 'left') ||
          (offset === textContent.length && step.direction === 'right')
        ) {
          ret = this._getHorizontalNeighborCase2({ anchor, step });
        } else {
          ret = this._getHorizontalNeighborCase1({ anchor, step });
        }
      } else if (anchor.container instanceof HTMLElement) {
        ret = this._getHorizontalNeighborCase3({ anchor, step });
      } else {
        ret = {
          next: null,
          error: this._makeError(
            ErrorCode.INVALID_ANCHOR,
            '_getHorizontalNeighbor',
            this.messages.QUERY_ERROR.NOT_TEXT_NODE_OR_HTML_ELEMENT,
            {
              nodeType: anchor.container.nodeType,
            },
          ),
        };
      }

    } else {
      throw new Error(`Invalid stride ${step.stride}, maybe you should process this stride in higher level`);
    }


    return ret;
  }

  _getSoftlineBoundary(neighborPayload: NeighborPayload): Anchor {
    let { container, offset } = neighborPayload.anchor;

    function makeRange(prev: Anchor, next: Anchor): AnchorRange {
      if (neighborPayload.step.direction === 'left') {
        return {
          start: next,
          end: prev,
        }
      } else {
        return {
          start: prev,
          end: next,
        }
      }
    }

    let nextRet = this._getHorizontalNeighbor({
      anchor: {
        container: container,
        offset: offset,
      },
      step: {
        direction: neighborPayload.step.direction,
        stride: 'char',
      },
    }).next;

    // reach the end of the root
    if (!nextRet) {
      return {
        container: container,
        offset: offset,
      };
    }

    let nextLineInfo = getLineInfo(this.root as HTMLElement, makeRange({ container, offset }, nextRet));

    console.debug(nextLineInfo);
    // process simple case 1
    if (nextLineInfo.lineNumber === 1 ||
      (nextLineInfo.anchorIndex === 0 && neighborPayload.step.direction === 'left') ||
      (nextLineInfo.lineNumber === (nextLineInfo.anchorIndex! + 1) && neighborPayload.step.direction === 'right')
    ) {
      return this._getInnerBoundaryAnchor({
        container: this.root,
        step: neighborPayload.step,
      });
    }



    let prevRet = this._getHorizontalNeighbor({
      anchor: {
        container: container,
        offset: offset,
      },
      step: {
        ...reverseStep(neighborPayload.step),
        stride: 'char',
      },
    }).next;

    if (!prevRet) {
      prevRet = {
        container: container,
        offset: offset,
      };
    }

    let prevLineInfo = getLineInfo(this.root as HTMLElement, makeRange(prevRet, { container, offset }));


    if (prevLineInfo.anchorIndex !== nextLineInfo.anchorIndex && neighborPayload.step.stride === 'softline-boundary') {
      return this._getInnerBoundaryAnchor({
        container: this.root,
        step: neighborPayload.step,
      });
    }


    // process complex case:
    for (let i = 0; i < 500 /** assume line width not larger than 500 */; i++) {
      prevRet = nextRet;
      prevLineInfo = nextLineInfo;
      nextRet = this._getHorizontalNeighbor({
        anchor: {
          container: container,
          offset: offset,
        },
        step: {
          direction: neighborPayload.step.direction,
          stride: 'char',
        },
      }).next;

      if (nextRet) {
        nextLineInfo = getLineInfo(this.root as HTMLElement, makeRange(prevRet, nextRet));
        console.debug(i, { container, offset }, nextRet, nextLineInfo);
        if (prevLineInfo.anchorIndex !== nextLineInfo.anchorIndex) {
          return {
            container: container,
            offset: offset,
          };
        }
        container = nextRet.container;
        offset = nextRet.offset;
      } else {
        throw new Error("Cannot find softline boundary");
      }
    }

    return {
      container: container,
      offset: offset,
    };

  }


  _getTokenOffset(node: Node): number {
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
      if (cached && node.hasAttribute('token-size')) {
        ret = Number.parseInt(node.getAttribute('token-size') || '0');
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          ret += this.getTokenOffset(child);
        }
        console.debug(node.nodeName, ret + 2);
        if (isSingleClosing(node)) {
          ret += 1;
        } else {
          ret += 2;
        }
        if (cached) {
          node.setAttribute('token-size', ret.toString());
        }
      }
    }
    return ret;
  }

  getTokenOffset(node: Node): number {
    return this._getTokenOffset(node);
  }

  _getAnchorByOffset(offset: number, base?: Anchor): Anchor {
    let current = base;
    if (!current) {
      current = {
        container: this.root,
        offset: 0,
      };
    }
    let residual = offset;

    if (current.container instanceof Text) {
      const content = current.container.textContent || '';
      if (content.length < residual) {
        throw new Error('invalid search');
      }
      return {
        container: current.container,
        offset: residual,
      };
    }

    while (residual > 0) {
      for (let i = 0; i < current.container.childNodes.length; i++) {
        const child = current.container.childNodes[i];
        if (this.shouldIgnore(child)) {
          continue;
        }
        const childSize = this.getTokenOffset(child);
        if (residual > childSize) {
          residual -= childSize;
        } else if (residual === childSize) {
          return {
            container: current.container,
            offset: i + 1,
          };
        } else if (residual < childSize) {
          if (child instanceof Text) {
            return this.getAnchorByOffset(residual, {
              container: child,
              offset: 0,
            });
          }
          return this.getAnchorByOffset(residual - 1, {
            container: child,
            offset: 0,
          });
        }
      }
      throw new Error('Can not get anchor by offset');
    }

    return current;
  }
  getAnchorByOffset(offset: number, base?: Anchor): Anchor {
    return this._getAnchorByOffset(offset, base);
  }

  _getOffsetByAnchor({ container, offset }: Anchor): number {
    let current = container;
    let size = 0;
    if (container instanceof Text) {
      size += offset;
      if (!current.parentElement) {
        throw new Error('Can not get offset of this anchor');
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
        size += this.getTokenOffset(container.childNodes[i]);
        console.debug(container.childNodes[i].nodeName, size);
      }
      size += 1;
      console.debug(current.nodeName, size);
    } else {
      throw new Error('Invalid anchor node type');
    }

    while (current && current !== this.root) {
      let currentSibling = this._getNeighborSibling({
        container: current,
        step: {
          direction: 'left',
          stride: 'char',
        },
      });
      while (currentSibling) {
        size += this.getTokenOffset(currentSibling);
        console.debug(currentSibling.nodeName, size);
        currentSibling = this._getNeighborSibling({
          container: currentSibling,
          step: {
            direction: 'left',
            stride: 'char',
          },
        });
      }
      if (!current.parentElement) {
        throw new Error('Can not get offset of this anchor');
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
    return this._getOffsetByAnchor(anchor);
  }

  _refreshNodeTokensize(node: Node): void {
    throw new Error('Method not implemented.');
  }

  /**
   *
   * case1: caret in text node and not reach the boundary (getHorizontalNeighborCase1)
   * ```
   *      hello | world     (right || left) => neighborOffset
   * ```
   *
   * case2: caret in text node and reach the boundary (getHorizontalNeighborCase2)
   * ```
   *              container(Text)
   *                  ↓
   *      hello world | ... (right)
   *      ... | hello world (left)
   * ```
   *
   * case2.1: caret in text node and reach the boundary and the boundary is a text node
   * ```
   *      hello world | hello world         (right || left)
   *          => next.firstAnchor
   *          => prev.lastAnchor
   *      <text segment>|<text segment>
   * ```
   *
   * case2.2: caret in text node and reach the boundary and the boundary is a html element
   * ```
   *      hello world |<p>hello world</p>   (right)
   *              => next.firstAnchor
   *      <p>hello world</p>|hello world    (left)
   *              => prev.lastAnchor
   * ```
   *
   * case2.3: caret in text node and reach the boundary and the node is at boundary
   * ```
   *      <p>hello world|</p>   (right)
   *              => {container.parent, parent(p).parentElementOffset + 1}
   *      <p>|hello world</p>   (left)
   *              => {container.parent, parent(p).parentElementOffset}
   * ```
   *
   * case3: caret in html element (getHorizontalCase3)
   *
   * case3.1: caret in html element and the html element is at boundary
   * ```
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
   * ```
   *
   * case3.2: caret in html element and the html element is not at boundary
   *      <p>hello</p>|<p>world</p>  (left || right)
   *              => next.firstAnchor
   *              => prev.firstAnchor
   *
   * case3.3: caret in html element and the neighbor element is a text node
   * ```
   *      (n.case1) => refunction
   * ```
   *
   * normalize: make anchor container change from html to text but keep cursor fixed in vision.
   *
   * n.case1:
   *      caret in html element but `child[offset]` or `child[offset - 1]` is a text node
   *
   * n.case2:
   *      caret in html element but `child[offset]` and `child[offset - 1]` are both element node
   *
   * get boundary Anchor
   *
   * ```
   * <prev|next>.case1: <prev|next> exists
   * <prev|next>.case2: <prev|next> not exists
   *      anchor = parent.boundaryOffset
   * ```
   * 
   * 
   * ```
   * parent.<prev|next>.case1: <prev|next> exists
   * parent.<prev|next>.case2: <prev|next> not exists
   *      anchor = parent.parentElementOffset
   * ```
   */
  getHorizontalAnchor(neighborPayload: NeighborPayload): NeighborResult {
    // let ret = null;

    const ret = this._getHorizontalNeighbor(neighborPayload);
    const nodeChanged =
      ret.next === null
        ? null
        : ret.next?.container === neighborPayload.anchor.container;

    const result: NeighborResult = {
      prev: neighborPayload.anchor,
      next: ret.next,
      step: neighborPayload.step,
      nodeChanged: nodeChanged,
      imp: this,
      error: ret.error,
    };

    return result;
  }

  getVerticalAnchor(neighborPayload: NeighborPayload): NeighborResult {
    // return this._getVerticalNeighbor(neighborPayload);
    throw new Error('not implemented');
  }

  getNormalizeAnchor(anchor: Anchor): Anchor {
    let current = anchor.container;
    while (current && current !== this.root) {
      if (!this.shouldIgnore(current)) {
        current = current.parentElement!;
      } else {
        return {
          container: current.parentElement!,
          offset: indexOf(current),
        } 
      }
    }


    return {
      container: anchor.container,
      offset: anchor.offset,
    };
  }
}
