import { expect, test } from 'vitest';
import { RangeEditor } from '../../src/editor';
import { NodeToString } from '../../src/helper';

test('insertAfter', () => {
  const root = document.createElement('div');
  root.innerHTML = '<p>hello</p>';
  const editor = new RangeEditor({}, root);

  const src = document.createElement('b');
  src.textContent = 'hello';
  editor._insertAfter(src, root.children[0]);
  const rootStr = NodeToString(root);

  expect(rootStr).toEqual('<div><p>hello</p><b>hello</b></div>');
});

test('insertBefore', () => {
  const root = document.createElement('div');
  root.innerHTML = '<p>hello</p>';
  const editor = new RangeEditor({}, root);

  const src = document.createElement('b');
  src.textContent = 'hello';
  editor._insertBefore(src, root.children[0]);
  const rootStr = NodeToString(root);

  expect(rootStr).toEqual('<div><b>hello</b><p>hello</p></div>');
});
