import { useEffect, useRef, useState } from 'react';
import { AnchorQuery, LocEditor } from '../../src/imp';
import { anchorToStrong } from '../../src/errors';

interface EditableDivProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export const EditableDiv: React.FC<EditableDivProps> = ({
  initialContent = '',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 假设 register 函数存在并需要在组件挂载时调用
    const editor = new AnchorQuery({}, divRef.current);
    console.log(editor);
    divRef.current.addEventListener('keyup', () => {
      const range = document.getSelection()?.getRangeAt(0);
      if (!range) {
        return;
      }
      const offset = editor._getOffsetByAnchor({
        container: range.startContainer,
        offset: range.startOffset,
      });
      displayRef.current.innerText = `${range.startContainer.nodeName}, ${offset}`;
      console.log(range.startContainer);
      console.log(range.startOffset);
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
      >
        {initialContent}
      </div>
    </div>
  );
};

// ... existing code ...
export const EditablePlay: React.FC<EditableDivProps> = ({
  initialContent = '',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<LocEditor | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // 初始化编辑器
    editorRef.current = new LocEditor({}, divRef.current);

    divRef.current.addEventListener('keyup', () => {
      // ... existing keyup handler code ...
    });

    return () => {
      // 清理定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    divRef.current.focus();
    editorRef.current?.setAnchor({
      container: divRef.current,
      offset: 0,
    });
    setIsPlaying((prev) => {
      if (!prev) {
        // 开始播放
        intervalRef.current = setInterval(() => {
          const editor = editorRef.current;
          if (editor) {
            const ret = editor.setStartAnchorTo('right');
            if (!ret) {
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
            console.log(range.startContainer);
            console.log(range.startOffset);
            anchorRef.current.innerText = anchorToStrong({
              container: range.startContainer,
              offset: range.startOffset,
            });
          }
        }, 100);
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
