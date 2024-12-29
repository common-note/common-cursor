import type { StatefulAnchorEditorInterface, Anchor, Step, NeighborResult } from "./interface";
import { AnchorQuery } from "./query";



export class AnchorEditor extends AnchorQuery implements StatefulAnchorEditorInterface {
    lastMoveDirection: "left" | "right" | "up" | "down" | "none" = "none";
    lastMoveAnchor: "start" | "end" | "none" = "none";
    // constructor(config: LocConfig, root: HTMLElement) {
    //     super(config, root);
    // }
    resetAnchor(anchor: Anchor): Anchor | null {
        const selection = document.getSelection();
        if (selection) {
            selection.setPosition(anchor.container, anchor.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "none";
            return anchor;
        }
        return null;
    }
    resetStartAnchor(anchor: Anchor): Anchor | null {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            range.setStart(anchor.container, anchor.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "start";
            return anchor;
        }
        return null;
    }
    resetEndAnchor(anchor: Anchor): Anchor | null {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            range.setEnd(anchor.container, anchor.offset);
            this.lastMoveDirection = "none";
            this.lastMoveAnchor = "end";
            return anchor;
        }
        return null;
    }


    resetRange(start: Anchor, end: Anchor): boolean {
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



    moveEndAnchorTo(step: Step): NeighborResult {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            const result = this.getHorizontalAnchor({
                anchor: { container: range.endContainer, offset: range.endOffset },
                step: step,
            });
            if (result.next) {
                this.resetEndAnchor(result.next);
                this.lastMoveDirection = step.direction;
                this.lastMoveAnchor = "end";
                return result;
            }
        }
        throw new Error("no selection");
    }

    moveStartAnchorTo(step: Step): NeighborResult {
        const range = document.getSelection()?.getRangeAt(0);
        if (range) {
            const result = this.getHorizontalAnchor({
                anchor: { container: range.startContainer, offset: range.startOffset },
                step: step,
            });
            if (result.next) {
                this.resetStartAnchor(result.next);
                this.lastMoveDirection = step.direction;
                this.lastMoveAnchor = "start";
            }
            return result;
        }
        throw new Error("no selection");
    }
}
