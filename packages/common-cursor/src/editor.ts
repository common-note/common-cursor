import type {
  Anchor,
  AnchorRange,
  MoveAnchorPayload,
  MoveResult,
  RangeDirection,
  StatefulRangeEditorInterface,
  Step,
} from './interface';
import { AnchorQuery } from './query';

export interface EditorConfig {
  defaultQuery: AnchorQuery;
  // rules: [];
}

/**
 *
 * paragraph_rule: (node: Node) => boolean | { clazzName?: string, tagName?: string };
 * rich_rule: (node: Node) => boolean | { clazzName?: string, tagName?: string };
 *
 * RangeEditor(config, root)
 *
 */

export class RangeEditor
  extends AnchorQuery
  implements StatefulRangeEditorInterface
{
  lastMoveDirection: 'left' | 'right' | 'up' | 'down' | 'none' = 'none';
  moveAnchor: RangeDirection = 'start';
  fixedAnchor: RangeDirection = 'start';

  isCollapsed(): boolean {
    const range = document.getSelection()?.getRangeAt(0);
    if (!range) {
      return false;
    }
    return range.collapsed;
  }

  collapse(rangeDirection: RangeDirection): Anchor | null {
    const range = document.getSelection()?.getRangeAt(0);
    if (range) {
      range.collapse(rangeDirection === 'start');
      return {
        container: range.startContainer,
        offset: range.startOffset,
      };
    }
    return null;
  }

  setAnchor(anchor: Anchor, payload: MoveAnchorPayload): Anchor | null {
    const range = document.getSelection()?.getRangeAt(0);
    if (range) {
      if (payload.rangeDirection === 'both') {
        range.setStart(anchor.container, anchor.offset);
        range.setEnd(anchor.container, anchor.offset);
      } else if (payload.rangeDirection === 'start') {
        range.setStart(anchor.container, anchor.offset);
      } else {
        range.setEnd(anchor.container, anchor.offset);
      }

      if (payload.collapsed) {
        range.collapse(payload.collapsed === 'start');
      }
      // range.setStart(anchor.container, anchor.offset);
      // range.setEnd(anchor.container, anchor.offset);
      // if (payload.rangeDirection === "start") {
      //   const end = {
      //     container: range.endContainer,
      //     offset: range.endOffset,
      //   };
      // } else {
      //   const start = {
      //     container: range.startContainer,
      //     offset: range.startOffset,
      //   };
      //   range.setStart(start.container, start.offset);
      //   range.setEnd(anchor.container, anchor.offset);
      // }
      return anchor;
    }
    return null;
  }

  /**
   * moveAnchorTo only considered keyboard event:
   *
   * it set the selection by control the moveAnchor and fixedAnchor
   * 1. selection is collapsed
   *    - moveAnchor = caretAnchor = 'start'
   *
   * 2. selection is not collapsed
   *    - if shift direction is left, moveAnchor = 'start', fixedAnchor = 'end'
   *    - if shift direction is right, moveAnchor = 'end', fixedAnchor = 'start'
   *
   */
  moveRangeTo(step: Step): MoveResult {
    const range = document.getSelection()?.getRangeAt(0);
    if (!range) {
      throw new Error('no selection');
    }

    if (step.direction === 'left' || step.direction === 'right') {
      if (!step.shift && !this.isCollapsed()) {
        this.collapse(step.direction === 'left' ? 'start' : 'end');
        this.fixedAnchor = this.moveAnchor;
        // TODO: neighborresult not include range result
        return this.getHorizontalAnchor({
          anchor: {
            container:
              this.moveAnchor === 'start'
                ? range.startContainer
                : range.endContainer,
            offset:
              this.moveAnchor === 'start' ? range.startOffset : range.endOffset,
          },
          step: {
            direction: step.direction,
            stride: 'none',
          },
        });
      }

      const result = this.getHorizontalAnchor({
        anchor: {
          container:
            this.moveAnchor === 'start'
              ? range.startContainer
              : range.endContainer,
          offset:
            this.moveAnchor === 'start' ? range.startOffset : range.endOffset,
        },
        step: step,
      });
      if (!result.next) {
        return result;
      }

      const payload: MoveAnchorPayload = {
        rangeDirection: this.moveAnchor,
      };
      if (step.shift) {
        if (this.moveAnchor !== this.fixedAnchor) {
          // 1. if shift and previous is also shift
          // only move the moveAnchor
        } else {
          // 2. if shift and previous is not shift
          // move moveAnchor and keep the fixedAnchor in the same anchor
          this.moveAnchor = step.direction === 'left' ? 'start' : 'end';
          this.fixedAnchor = step.direction === 'left' ? 'end' : 'start';

          payload.rangeDirection = this.moveAnchor;
        }
      } else {
        if (!this.isCollapsed()) {
          // 3. if not shift and previous is shift
          // collapse the selection in the moveAnchor and make fixedAnchor align with moveAnchor
          this.fixedAnchor = this.moveAnchor;
        } else {
          // 4. if not shift and previous is not shift
          // move moveAnchor and fixedAnchor in the same direction
          this.moveAnchor = step.direction === 'left' ? 'start' : 'end';
          this.fixedAnchor = step.direction === 'left' ? 'start' : 'end';
        }
        payload.collapsed = this.moveAnchor === 'start' ? 'start' : 'end';
      }
      this.setAnchor(result.next, payload);

      if (this.isCollapsed()) {
        this.fixedAnchor = step.direction === 'left' ? 'start' : 'end';
        this.moveAnchor = this.fixedAnchor;
      }

      return result;
    }
    throw new Error(`invalid direction ${step.direction}`);
  }

  normalizeRange(range?: Range): Range {
    if (!range) {
      // biome-ignore lint/style/noParameterAssign: <explanation>
      range = document.getSelection()?.getRangeAt(0);
      if (!range) {
        throw new Error('no selection');
      }
    }
    const start = this.getNormalizeAnchor({
      container: range.startContainer,
      offset: range.startOffset,
    });
    const end = this.getNormalizeAnchor({
      container: range.endContainer,
      offset: range.endOffset,
    });
    range.setStart(start.container, start.offset);
    range.setEnd(end.container, end.offset);
    return range;
  }

  getRange(): AnchorRange {
    const range = this.normalizeRange();
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
}
