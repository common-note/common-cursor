import { expect, test } from 'vitest';
import { anchorToStrong, findNode } from "../src/helper"

import { AnchorQuery, SimpleNeighborResult } from "../src/query"

function stringifySimpleNeighborResult(result: SimpleNeighborResult) {
    if (result.next) {
        return anchorToStrong(result.next);
    }
    return result.error?.message || "";
}

test("horizontalNeighbor/case1", () => {
    const container = document.createElement("div");
    container.textContent = "hello world";

    const editor = new AnchorQuery(
        {
            shouldIgnore: () => false,
        },
        container,
    )


    expect(editor._getHorizontalNeighborCase1({
        anchor: {
            container: container.childNodes[0],
            offset: 10,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next).toEqual({
        container: container.childNodes[0],
        offset: 11,
    })

    expect(editor._getHorizontalNeighborCase1({
        anchor: {
            container: container.childNodes[0],
            offset: 1,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next).toEqual({
        container: container.childNodes[0],
        offset: 0,
    })

    expect(editor._getHorizontalNeighborCase1({
        anchor: {
            container: container.childNodes[0],
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).error?.message).toEqual(editor.messages.AT_TEXT_NODE_BOUNDARY)

    expect(editor._getHorizontalNeighborCase1({
        anchor: {
            container: container.childNodes[0],
            offset: 11,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).error?.message).toEqual(editor.messages.AT_TEXT_NODE_BOUNDARY)

})

test("horizontalNeighbor/case2.1", () => {
    const container = document.createElement("div");
    container.appendChild(document.createTextNode("hello"));
    container.appendChild(document.createTextNode("world"));

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[0],
            offset: 5,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next).toEqual({
        container: container.childNodes[1],
        offset: 0,
    })

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[1],
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next).toEqual({
        container: container.childNodes[0],
        offset: 5,
    })

})

test("horizontalNeighbor/case2.2", () => {
    const container = document.createElement("div");

    const span1 = document.createElement("span");
    span1.textContent = "left-span";
    container.appendChild(span1);
    container.appendChild(document.createTextNode("hello"));
    const span2 = document.createElement("span");
    span2.textContent = "right-span";
    container.appendChild(span2);

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[1],
            offset: 5,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next).toEqual({
        container: span2.childNodes[0],
        offset: 0,
    })

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[1],
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next).toEqual({
        container: span1.childNodes[0],
        offset: 9,
    })

    span1.childNodes[0].textContent = "";
    span2.childNodes[0].textContent = "";
    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[1],
            offset: 5,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next).toEqual({
        container: span2.childNodes[0],
        offset: 0,
    })

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[1],
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next).toEqual({
        container: span1.childNodes[0],
        offset: 0,
    })

})

test("horizontalNeighbor/case2.3-1", () => {
    const container = document.createElement("div");
    container.innerHTML = "<p>hello</p>";

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    let result = editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[0].childNodes[0], // 'hello'
            offset: 5,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    })

    expect(anchorToStrong(result.next)).toEqual("<div><p>...</p>|</div>")
    result = editor._getHorizontalNeighborCase2({
        anchor: {
            container: container.childNodes[0].childNodes[0], // hello
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    })
    expect(anchorToStrong(result.next)).toEqual("<div>|<p>...</p></div>")

})


test("horizontalNeighbor/case2.3-2", () => {
    const container = document.createElement("div");

    const p1 = document.createElement("p");
    p1.textContent = "hello";
    const text1 = document.createTextNode("hello");
    container.appendChild(text1);
    container.appendChild(p1);
    const text2 = document.createTextNode("world");
    container.appendChild(text2);

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: p1.childNodes[0],
            offset: 5,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next).toEqual({
        container: text2,
        offset: 0,
    })

    expect(editor._getHorizontalNeighborCase2({
        anchor: {
            container: p1.childNodes[0],
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next).toEqual({
        container: text1,
        offset: 5,
    })

})


test("horizontalNeighbor/case3.1", () => {
    const container = document.createElement("div");
    const p1 = document.createElement("p");
    container.appendChild(p1);
    const b1 = document.createElement("b");
    b1.textContent = "hello";
    p1.appendChild(b1);

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 1,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<div><p>...</p>|</div>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<div>|<p>...</p></div>")

})

test("horizontalNeighbor/case3.2", () => {
    // <div><b>hello</b>|<b>world</b></div>
    const container = document.createElement("div");
    const b1 = document.createElement("b");
    b1.textContent = "hello";
    container.appendChild(b1);
    const b2 = document.createElement("b");
    b2.textContent = "world";
    container.appendChild(b2);

    const editor = new AnchorQuery(
        {
        },
        container,
    )
    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: container,
            offset: 1,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<b>|world</b>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: container,
            offset: 1,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<b>hello|</b>")
})

test("horizontalNeighbor/case3.3", () => {
    // <div><p>...<b>hello</b>...<p></div>
    const container = document.createElement("div");
    const p1 = document.createElement("p");
    container.appendChild(p1);
    const text1 = document.createTextNode("hello");
    const b1 = document.createElement("b");
    b1.textContent = "hello";
    const text2 = document.createTextNode("world");
    p1.appendChild(text1);
    p1.appendChild(b1);
    p1.appendChild(text2);

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    debugger;
    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 2,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<p><t/><b>...</b>w|orld</p>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 1,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<p>hell|o<b>...</b><t/></p>")
})

test("horizontalNeighbor/case1-with-text-segment", () => {

})

test("horizontalNeighbor/case2-with-ignore-1", () => {
    // <div><p><b>...</b>|<span>...</span><i>...</i></p></div>
    // <div><p><b>...</b><span>...</span><i>|...</i></p></div>

    const container = document.createElement("div");
    container.appendChild(document.createTextNode("hello"));
    const p1 = document.createElement("p");
    container.appendChild(p1);

    const b1 = document.createElement("b");
    b1.textContent = "hello";
    const span = document.createElement("span");
    span.textContent = "ignore";
    const i1 = document.createElement("i");
    i1.textContent = "world";
    p1.appendChild(b1);
    p1.appendChild(span);
    p1.appendChild(i1);

    const editor = new AnchorQuery(
        {
            shouldIgnore: (node) => {
                if (node instanceof HTMLElement && node.tagName === "SPAN") {
                    return true;
                }
                return false;
            }
        },
        container,
    )

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 2,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<b>hello|</b>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 2,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<i>|world</i>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 1,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<i>|world</i>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 1,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<b>hello|</b>")
})


test("horizontalNeighbor/case2-with-ignore-2", () => {
    // <div><p><b>...</b>|<span>...</span><span>...</span><i>...</i></p></div>
    // <div><p><b>...</b><span>...</span><span>...</span><i>|...</i></p></div>

    const container = document.createElement("div");
    container.appendChild(document.createTextNode("hello"));
    const p1 = document.createElement("p");
    container.appendChild(p1);

    const b1 = document.createElement("b");
    b1.textContent = "hello";
    const span = document.createElement("span");
    span.textContent = "ignore";
    const span2 = document.createElement("span");
    span2.textContent = "ignore";
    const i1 = document.createElement("i");
    i1.textContent = "world";
    p1.appendChild(b1);
    p1.appendChild(span);
    p1.appendChild(span2);
    p1.appendChild(i1);

    const editor = new AnchorQuery(
        {
            shouldIgnore: (node) => {
                if (node instanceof HTMLElement && node.tagName === "SPAN") {
                    return true;
                }
                return false;
            }
        },
        container,
    )


    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 1,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<i>|world</i>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 2,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<i>|world</i>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 3,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    }).next)).toEqual("<i>|world</i>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 3,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<b>hello|</b>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 2,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<b>hello|</b>")

    expect(anchorToStrong(editor._getHorizontalNeighborCase3({
        anchor: {
            container: p1,
            offset: 1,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    }).next)).toEqual("<b>hello|</b>")
})


test("horizontalNeighbor/case-in-root-boundary", () => {
    // <div><p>hello</p>|</div>
    const container = document.createElement("div");
    const p1 = document.createElement("p");
    container.appendChild(p1);
    const b1 = document.createElement("b");
    b1.textContent = "hello";
    p1.appendChild(b1);

    const editor = new AnchorQuery(
        {
        },
        container,
    )

    let result = editor._getHorizontalNeighbor({
        anchor: {
            container: container,
            offset: 1,
        },
        step: {
            direction: "right",
            stride: "char",
        },
    })
    expect(result.next).toEqual(null)
    debugger;
    result = editor._getHorizontalNeighbor({
        anchor: {
            container: container,
            offset: 0,
        },
        step: {
            direction: "left",
            stride: "char",
        },
    })
    expect(result.next).toEqual(null)
})

test("horizontalNeighbor/case-in-sub-editable", () => {
    // <div><p>hello<b class='sub-editable'>world</b>case</p></div>
    const container = document.createElement("div");
    container.innerHTML = "<p>hello<b class='sub-editable'>world</b>case</p>";


    const editor = new AnchorQuery(
        {
            onNodeChanged: (result) => {
                if (result.nodeChanged && result.next) {
                    const parent = result.imp;
                    const anchor = result.next;
                    const findResult = findNode<HTMLElement>(anchor.container, (node) => node.classList.contains("sub-editable"));
                    if (findResult) {
                        const subeditor = new AnchorQuery(
                            {
                                shouldIgnore: () => false,
                            },
                            findResult,
                        )
                        parent.moveQueryer(subeditor);
                    }
                }
            },
        },
        container,
    )




})