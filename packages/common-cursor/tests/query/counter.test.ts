import { expect, test } from 'vitest';

import { RangeEditor } from '../../src/editor';

import { beforeEach } from 'vitest';
beforeEach((ctx) => {
  const errors: Parameters<typeof console.error>[] = [];
  const original = console.error;
  console.error = (...args) => errors.push(args);
  console.debug = (...args) => errors.push(args);

  ctx.onTestFailed(() => {
    // biome-ignore lint/complexity/noForEach: <explanation>
    errors.forEach((args) => original(...args));
  });

  return () => {
    console.error = original;
    console.debug = original;
  };
});

test('getTokenOffset/case1', () => {
  const container = document.createElement('div');
  container.textContent = 'hello';

  const editor = new RangeEditor(
    {
      shouldIgnore: () => false,
    },
    container,
  );

  expect(editor.getTokenOffset(container)).toEqual(7);
});

test('getTokenOffset/case2', () => {
  const container = document.createElement('div');
  container.innerHTML = '<b>hello</b><b>world</b>';

  const editor = new RangeEditor(
    {
      shouldIgnore: () => false,
    },
    container,
  );

  expect(editor.getTokenOffset(container)).toEqual(16);
});

test('getTokenOffset/case3', () => {
  // <div><b>hello</b><img/><b>world</b></div>
  const container = document.createElement('div');
  container.innerHTML = '<b>hello</b><img/><b>world</b>';

  const editor = new RangeEditor(
    {
      shouldIgnore: () => false,
    },
    container,
  );

  expect(editor.getTokenOffset(container)).toEqual(17);
});

test('getTokenOffset/case4', () => {
  // <div><img/></div>
  const container = document.createElement('div');
  container.innerHTML = '<img/>';

  const editor = new RangeEditor(
    {
      shouldIgnore: () => false,
    },
    container,
  );

  expect(editor.getTokenOffset(container)).toEqual(3);
});

test('getOffsetByAnchor/case1', () => {
  const container = document.createElement('div');
  container.innerHTML = '<b>hello</b><b>world</b>';

  const editor = new RangeEditor(
    {
      shouldIgnore: () => false,
    },
    container,
  );

  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 0,
    }),
  ).toEqual(0);
  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 1,
    }),
  ).toEqual(7);
  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 2,
    }),
  ).toEqual(14);
});

test('getOffsetByAnchor/case-has-ignore-1', () => {
  const container = document.createElement('div');
  container.innerHTML = '<b>hel<i>ignore</i>lo</b><b>world</b>';

  const editor = new RangeEditor(
    {
      shouldIgnore: (node) => {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'I') {
            return true;
          }
        }
        return false;
      },
    },
    container,
  );

  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 0,
    }),
  ).toEqual(0);
  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 1,
    }),
  ).toEqual(7);
  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 2,
    }),
  ).toEqual(14);
});

test('getOffsetByAnchor/case-has-ignore-2', () => {
  const container = document.createElement('div');
  container.innerHTML = '<b>hel<!--  -->lo</b><!--  --><b>world</b>';

  const editor = new RangeEditor(
    {
      shouldIgnore: (node) => {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'I') {
            return true;
          }
        }
        return false;
      },
    },
    container,
  );

  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 0,
    }),
  ).toEqual(0);
  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 1,
    }),
  ).toEqual(7);
  expect(
    editor.getOffsetByAnchor({
      container: container,
      offset: 3,
    }),
  ).toEqual(14);
});

test('getAnchorByOffset/case-has-ignore-2', () => {
  const container = document.createElement('div');
  container.innerHTML = '<b>hello</b><b>world</b>';

  const editor = new RangeEditor(
    {
      shouldIgnore: (node) => {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'I') {
            return true;
          }
        }
        return false;
      },
    },
    container,
  );

  expect(editor.getAnchorByOffset(0)).toEqual({
    container: container,
    offset: 0,
  });
  expect(editor.getAnchorByOffset(1)).toEqual({
    container: container.childNodes[0],
    offset: 0,
  });
  expect(editor.getAnchorByOffset(2)).toEqual({
    container: container.childNodes[0].childNodes[0],
    offset: 1,
  });
  expect(editor.getAnchorByOffset(7)).toEqual({
    container: container,
    offset: 1,
  });
  expect(editor.getAnchorByOffset(12)).toEqual({
    container: container.childNodes[1].childNodes[0],
    offset: 4,
  });
  expect(editor.getAnchorByOffset(13)).toEqual({
    container: container.childNodes[1],
    offset: 1,
  });
  expect(editor.getAnchorByOffset(14)).toEqual({
    container: container,
    offset: 2,
  });
});
