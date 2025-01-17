import type { Anchor, AnchorRange } from './interface';

/**
 * Convert Node to string
 * @param node
 * @returns
 */
export function NodeToString(node: Node): string {
  if (node instanceof Text) {
    return node.textContent || '';
  }
  if (node instanceof HTMLElement) {
    return node.outerHTML || '';
  }
  return '';
}

/**
 * Convert Node to simple string
 * @param node
 * @returns
 */
export function simpleNodeRepr(node: Node): string {
  if (node instanceof Text) {
    if (node.textContent?.length === 0) {
      return '';
    }
    return '<t/>';
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
    return '';
  }
  const { container, offset } = anchor;
  let innerHTML = '';
  if (container.nodeType === Node.TEXT_NODE) {
    innerHTML = container.textContent || '';
    innerHTML = `${innerHTML.slice(0, offset)}|${innerHTML.slice(offset, innerHTML.length)}`;
  } else {
    const curNode = container as HTMLElement;
    const childNodes = curNode.childNodes;
    const chunks = [];
    for (let i = 0; i < childNodes.length; i++) {
      if (offset === i) {
        chunks.push('|');
      }
      chunks.push(NodeToString(childNodes[i] as HTMLElement));
    }
    if (childNodes.length === 0) {
      chunks.push('|');
    } else if (offset === childNodes.length) {
      chunks.push('|');
    }
    const containerNode = curNode.localName;
    innerHTML = `<${containerNode}>${chunks.join('')}</${containerNode}>`;
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
    innerHTML = chunks.join('');
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
export function findNode<T extends Node>(
  node: Node,
  filter: (node: T) => boolean,
): T | null {
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


export interface TextRectInfo {
  lineNumber: number;
  lineHeight: number;
  elHeight: number;
  anchorIndex?: number;
}

// /**
//  * 获取元素的行数、行高、元素高度
//  * @param root
//  * @returns
//  */
// export function getLineInfo(root: HTMLElement, anchor?: Anchor): LineInfo {
//   console.log(getComputedStyle(root).lineHeight)
//   const oldOverFlow = root.style.overflow;
//   const oldWhiteSpace = root.style.whiteSpace;
//   const oldMinHeight = root.style.minHeight;
//   const oldLineHeight = root.style.lineHeight;
//   const oldPadding = root.style.padding;

//   root.style.overflow = "hidden";
//   root.style.whiteSpace = "nowrap";
//   root.style.minHeight = "0px";
//   root.style.lineHeight = "1";
//   root.style.padding = "0px";

//   const borderBias =  parseInt(root.style.borderTopWidth || "0") + parseInt(root.style.borderBottomWidth || "0");
//   const oneLineHeight = root.offsetHeight - borderBias;
//   // console.log(root.getBoundingClientRect());
//   root.style.overflow = oldOverFlow;
//   root.style.whiteSpace = oldWhiteSpace;
//   root.style.padding = oldPadding;
//   const lineHeight = root.offsetHeight - borderBias - parseInt(root.style.paddingTop || "0") - parseInt(root.style.paddingBottom || "0");
//   // console.log(root.getBoundingClientRect());

//   if (anchor) {
//     const { container, offset } = anchor;
//     const range = document.createRange();
//     range.setStart(container, offset);
//     range.setEnd(container, offset);
//     const rect = range.getBoundingClientRect();
//     // debugger;
//     console.log(rect);

//   }

//   root.style.lineHeight = oldLineHeight;
//   root.style.minHeight = oldMinHeight;

//   const lineNumber = Math.round(lineHeight / oneLineHeight);
//   return {
//     lineNumber: lineNumber,
//     lineHeight,
//     elHeight: oneLineHeight,
//   };
// }


/**
 * 获取元素的行数、行高、元素高度
 * @param root
 * @returns
 */
export function getLineInfo(root: HTMLElement, arange?: AnchorRange): TextRectInfo {
  const oldMinHeight = root.style.minHeight;
  const computedStyle = getComputedStyle(root);
  root.style.minHeight = "0px";


  // 获取计算后的 lineHeight，如果是 'normal' 则使用默认值 1.2

  const lineHeightStr = computedStyle.lineHeight;
  let lineHeight: number;
  if (lineHeightStr === 'normal') {
    lineHeight = parseFloat(computedStyle.fontSize) * 1.2;
  } else {
    lineHeight = parseFloat(lineHeightStr);
  }

  const firstLineY = root.getBoundingClientRect().top + (lineHeight / 2);

  // 计算内容区域的实际高度（排除padding和border）
  const contentHeight = root.offsetHeight
    - parseFloat(computedStyle.paddingTop || '0')
    - parseFloat(computedStyle.paddingBottom || '0')
    - parseFloat(computedStyle.borderTopWidth || '0')
    - parseFloat(computedStyle.borderBottomWidth || '0');

  // 计算行数（向上取整，确保部分行也被计入）
  const lineNumber = Math.ceil(contentHeight / lineHeight);


  const result: TextRectInfo = {
    lineNumber,
    lineHeight,
    elHeight: contentHeight,
  };

  if (arange) {
    // debugger;
    const { container: startContainer, offset: startOffset } = arange.start;
    const { container: endContainer, offset: endOffset } = arange.end;
    const range = document.createRange();
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);
    const rect = range.getBoundingClientRect();
    result.anchorIndex = Math.round((rect.top - firstLineY) / lineHeight);
    console.debug(arange, range, rect);
  }

  return result;
}

export namespace DomRangeHelper {
  /**
   * 创建一个 document range
   * @param startContainer
   * @param startOffset
   * @param endContainer
   * @param endOffset
   * @returns
   */
  export function createRange(
    startContainer?: Node,
    startOffset?: number,
    endContainer?: Node,
    endOffset?: number
  ): Range {
    if (!endContainer) {
      endContainer = startContainer;
      endOffset = startOffset;
    }
    const range = document.createRange();
    if (startContainer && startOffset !== undefined) {
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer!, endOffset!);
    }
    return range;
  }
}