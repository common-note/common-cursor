import { Step } from "./interface";

export interface Tokenizer {
    next(text: string, start: number, step: Step): number;
}

export class DefaultTokenizer implements Tokenizer {

    _nextChar(text: string, start: number, step: Step): number {
        if (step.direction === 'left') {
            return start - 1;
        } else if (step.direction === 'right') {
            return start + 1;
        }
        return -1;
    }

    _nextWord(text: string, start: number, step: Step): number {
        if (step.direction === 'left' || step.direction === 'right') {
            let i = start;
            // hello worl
            // 0123456789
            // right:
            // 0 -> 5
            // 5 -> 10
            // left:
            // 10 -> 6
            // 6 -> 0
            while (
                (i > 0 && step.direction === 'left') ||
                (i < text.length && step.direction === 'right')) {
                if (step.direction === 'left') {
                    i--;
                } else if (step.direction === 'right') {
                    i++;
                }
                
                if (i < 0 || i > text.length + 1) {
                    return -1;
                }

                if (text[i] === ' ') {
                    if (step.direction === 'left' && i + 1 < start) {
                        return i + 1;
                    } else if (step.direction === 'right') {
                        return i;
                    }
                }
            }
            return i;
        }
        return -1;
    }

    next(text: string, start: number, step: Step): number {
        if (step.stride === 'char') {
            return this._nextChar(text, start, step);
        } else if (step.stride === 'word') {
            return this._nextWord(text, start, step);
        }
        throw new Error('Invalid stride');
    }
}