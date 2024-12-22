// test anchor and range text serialization is correct
import { expect, test } from 'vitest';
import { anchorToStrong } from "../src/errors";

test("anchorToStrong1", () => {
    const anchor = {
        container: document.createElement("div"),
        offset: 0,
    };
    expect(anchorToStrong(anchor)).toBe("<div>|</div>");
});

test("anchorToStrong2", () => {
    const div = document.createElement("div");
    div.innerHTML = "hello world";
    
    expect(anchorToStrong({
        container: div.childNodes[0],
        offset: 1,
    })).toBe("<div>h|ello world</div>");
    
    expect(anchorToStrong({
        container: div.childNodes[0],
        offset: 11,
    })).toBe("<div>hello world|</div>");
});

test("anchorToStrong3", () => {
    const div = document.createElement("div");
    div.innerHTML = "hello<p>world</p>";
    expect(anchorToStrong({
        container: div,
        offset: 0
    })).toBe("<div>|hello<p>world</p></div>");
    expect(anchorToStrong({
        container: div,
        offset: 1
    })).toBe("<div>hello|<p>world</p></div>");
    expect(anchorToStrong({
        container: div,
        offset: 2
    })).toBe("<div>hello<p>world</p>|</div>");
    expect(anchorToStrong({
        container: div.childNodes[1],
        offset: 1
    })).toBe("<div><t/><p>world|</p></div>");
    expect(anchorToStrong({
        container: div.childNodes[0],
        offset: 1
    })).toBe("<div>h|ello<p>...</p></div>");
});