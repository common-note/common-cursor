import { expect, test } from "vitest";

test("range-tagged/in-single-text", () => {
	// <p>[hello]</p>
	// <p><b>[hello]</b></p>
	// <p>[hello]</p>
	// <p>hel[lo]</p>
	// <p>hel<b>[lo]</b></p>
	// <p>hel[lo]</p>
});

test("range-tagged/in-multi-nodes", () => {
	// <p>he[llo<i>world</i>hello]</p>
	// <p><b>he[llo<i>world</i>hello]</b></p>
	// <p>he[llo<i>world</i>hello]</p>
});


test("range-tagged/cross-tag/inside-and-cross", () => {
	// <p>he<i>l[l</i>-<i>w]o</i>rld</p>
	// <p>he<b>[<i>ll</i>-<i>wo</i>]</b>rld</p>
});

test("range-untagged/cross-tag/inside-b", () => {
	// <p>he<i>l[l</i>-<b>w]o</b>rld</p>
	// <p>he[<i>ll</i>-wo]rld</p>
});

test("range-untagged/cross-tag/inside-and-cross", () => {
	// <p><b>he<i>l[l</i>o<i>w]o</i>rld</b></p>
	// <p>[he<i>ll</i>oworld]</p>
});

test("range/cross-tag/neighbor", () => {
	// <p><b>he<i>l[l</i>o<i>w]o</i>rld</b></p>
	// <p>[he<i>ll</i>oworld]</p>
});


test("collapsed/in-plain-world", () => {
	// <p>hello hel|lo world</p>
	// <p>hello <b>hel|lo</b> world</p>
	// <p>hello [hello] world</p>
});

test("collapsed/in-b", () => {
	// <p><b>hel|lo</b></p>
	// <p>[hello]</p>
	// <p><b>[hello]</b></p>
});

test("collapsed/in-nested-tag/b-i-text", () => {
	// <p><b>he<i>l|l</i>o</b></p>
	// <p><b>[he<i>ll</i>o]</b></p>
	// <p>[he<i>ll</i>o]</p>
});

test("ranged/cross-tag/neighbor", () => {
	// <p><b>he[<i>l]l</i>o</b></p>
	// <p><b>[he<i>ll</i>o]</b></p>
	// <p>[he<i>ll</i>o]</p>
});

test("case6", () => {
	// <p><b>he[<i>ll</i>]o</b></p>
	// <p>[he<i>ll</i>o]</p>
});
