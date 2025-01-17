import { useEffect, useRef, useState } from 'react';
// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import { AnchorEditor } from '../../src/editor';
import { anchorToStrong } from '../../src/helper';
import { AnchorQuery } from '../../src/query';

interface EditableDivProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  stride?: 'char' | 'word' | 'softline';
}

export const EditableManually: React.FC<EditableDivProps> = ({
  initialContent = '',
  stride = 'char',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<AnchorEditor | null>(null);

  useEffect(() => {
    if (!divRef.current) {
      return;
    }
    // 使用 AnchorEditor 替代 AnchorQuery
    editorRef.current = new AnchorEditor({ shouldIgnore: (node) => node instanceof HTMLElement && node.tagName === 'LABEL' }, divRef.current);

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const range = editorRef.current?.normalizeRange();
      if (!range) return;
      console.log(range);
    };

    // 添加键盘事件处理
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current) return;

      // 处理方向键
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();

        const direction = e.key === 'ArrowLeft' ? 'left' : 'right';
        let ret = editorRef.current.moveRangeTo({
          direction,
          stride,
          shift: e.shiftKey,
        });

        if (ret.error) {
          console.error('moveAnchorTo failed:', ret.error);
          return;
        }

        // 更新显示信息
        if (!displayRef.current || !anchorRef.current) return;
        const range = document.getSelection()?.getRangeAt(0);
        if (!range) return;

        const offset = editorRef.current._getOffsetByAnchor({
          container: range.startContainer,
          offset: range.startOffset,
        });

        displayRef.current.innerText = `${range.startContainer.nodeName}, ${offset}`;
        anchorRef.current.innerText = anchorToStrong({
          container: range.startContainer,
          offset: range.startOffset,
        });
      }
    };

    divRef.current.addEventListener('keydown', handleKeyDown);
    divRef.current.addEventListener('mouseup', handleMouseUp);
    // 清理事件监听器
    return () => {
      divRef.current?.removeEventListener('keydown', handleKeyDown);
      divRef.current?.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stride]); // 添加 stride 作为依赖

  useEffect(() => {
    if (!divRef.current) {
      return;
    }
    // 假设 register 函数存在并需要在组件挂载时调用
    const editor = new AnchorQuery({}, divRef.current);
    console.log(editor);
    divRef.current.addEventListener('keyup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!displayRef.current) {
        return;
      }
      if (!anchorRef.current) {
        return;
      }
      const range = document.getSelection()?.getRangeAt(0);
      if (!range) {
        return;
      }
      const offset = editor._getOffsetByAnchor({
        container: range.startContainer,
        offset: range.startOffset,
      });
      displayRef.current.innerText = `${range.startContainer.nodeName}, ${offset}`;
      anchorRef.current.innerText = anchorToStrong({
        container: range.startContainer,
        offset: range.startOffset,
      });
    });
  }, []);

  // const handleInput = () => {
  //   const content = divRef.current?.innerText || '';
  //   onContentChange?.(content);
  // };

  return (
    <div>
      <h2>{`${stride} stride`}</h2>
      <div className="display" ref={displayRef} />
      <div ref={anchorRef} />
      <div
        ref={divRef}
        contentEditable
        // onInput={handleInput}
        suppressContentEditableWarning
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          minHeight: '100px',
          outline: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: initialContent }}
      >

      </div>
    </div>
  );
};

// ... existing code ...
export const EditablePlayable: React.FC<EditableDivProps> = ({
  initialContent = '',
  stride = 'char',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<AnchorEditor | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>(null);
  const isFocusRef = useRef(false);

  useEffect(() => {
    // 初始化编辑器
    if (!divRef.current) {
      return;
    }
    editorRef.current = new AnchorEditor({}, divRef.current);

    divRef.current.addEventListener('keyup', () => {
      // ... existing keyup handler code ...
    });
    divRef.current.addEventListener('focus', () => {
      isFocusRef.current = true;
      console.log('focus node');
    });
    divRef.current.addEventListener('blur', () => {
      isFocusRef.current = false;
    });
    return () => {
      // 清理定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    if (!divRef.current) {
      return;
    }
    divRef.current.focus();
    editorRef.current?.resetAnchor({
      container: divRef.current,
      offset: 0,
    });
    setIsPlaying((prev) => {
      if (!prev) {
        // 开始播放
        intervalRef.current = setInterval(() => {
          if (!editorRef.current) {
            return prev;
          }
          if (!displayRef.current) {
            return prev;
          }
          if (!anchorRef.current) {
            return prev;
          }
          if (!isFocusRef.current) {
            return prev;
          }
          const editor = editorRef.current;
          if (editor) {
            const ret = editor.moveRangeTo({
              direction: 'right',
              stride: stride,
            });

            if (ret.error && intervalRef.current) {
              console.log('setStartAnchorTo failed');
              clearInterval(intervalRef.current);
            }
            const range = document.getSelection()?.getRangeAt(0);
            if (!range) {
              return;
            }
            const offset = editor._getOffsetByAnchor({
              container: range.startContainer,
              offset: range.startOffset,
            });
            displayRef.current.innerText = `${range.startContainer.nodeName}, ${offset}`;
            anchorRef.current.innerText = anchorToStrong({
              container: range.startContainer,
              offset: range.startOffset,
            });
          }
        }, 500);
      } else {
        // 停止播放
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      return !prev;
    });
  };

  return (
    <div>
      <div className="display" ref={displayRef} />
      <div ref={anchorRef} />
      <button
        type="button"
        onClick={handlePlay}
        style={{
          marginBottom: '10px',
          padding: '5px 10px',
        }}
      >
        {isPlaying ? '停止' : '播放'}
      </button>
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          minHeight: '100px',
          outline: 'none',
        }}
      >
        {initialContent}
      </div>
    </div>
  );
};
