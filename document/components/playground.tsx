import { useEffect, useRef } from 'react';
import { Editor } from '../../src/imp';
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
    const editor = new Editor({}, divRef.current);
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
      <div className="display" ref={displayRef}></div>
      <div ref={anchorRef}/>
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
