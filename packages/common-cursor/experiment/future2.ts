// export class Future {
//   _diffLineRects(rect: DOMRectList): DOMRect[] {
//     const res: DOMRect[] = [];
//     for (let i = 0; i < rect.length; i++) {
//       let flag = true;
//       for (let j = 0; j < res.length; j++) {
//         if (this.inSameLine(res[j], rect[i])) {
//           flag = false;
//         }
//       }
//       if (flag) {
//         res.push(rect[i]);
//       }
//     }

//     return res;
//   }
//   getRects(range: Range): [DOMRect[], DOMRect] {
//     let rects = range.getClientRects();
//     let rect = range.getBoundingClientRect();

//     const nextLoc = this._getHorizontalNeighbor({
//       anchor: {
//         container: range.startContainer,
//         offset: range.startOffset,
//       },
//       direction: 'right',
//     });
//     if (nextLoc) {
//       range.setEnd(...nextLoc);
//       rects = range.getClientRects();
//       rect = range.getBoundingClientRect();
//       range.collapse(true);
//     }

//     if (
//       rects.length === 0 ||
//       (range.startContainer instanceof Text &&
//         range.startContainer.textContent?.length === 0)
//     ) {
//       const flag = document.createTextNode('|');
//       range.collapse(true);
//       range.insertNode(flag);
//       rects = range.getClientRects();
//       rect = range.getBoundingClientRect();
//       flag.remove();
//     }
//     if (rects.length === 0) {
//       throw new Error('Can not get rects of this range');
//     }
//     // 尝试同时选择相邻一个字符然后计算，而不是插入
//     return [_diffLineRects(rects), rect];
//   }

//   inSameLine(a: DOMRect, b: DOMRect): boolean {
//     // 判断 a 和 b 的顶部、底部是否在同一条竖直线上
//     return (
//       (a.top <= b.top && a.bottom >= b.top) ||
//       (b.top <= a.top && b.bottom >= a.top)
//     );
//   }
//   getLocation(): EditorRange {
//     throw new Error('Method not implemented.');
//   }
// }
