import { AnchorQuery } from "../../src/query";
import { expect, test } from "vitest";
import { anchorToString } from '../../src/helper';

test("boundaryAnchor/inside-node/left", () => {
	const container = document.createElement("div");
	container.innerHTML =
		'<p>hello world </p>';

	const editor = new AnchorQuery({}, container);
	{
		const result = editor.getBoundaryAnchorInsideNode({
			container: container.childNodes[0].childNodes[0],
			step: {
				direction: "left",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<p>|hello world </p>');
	}
	{
		const result = editor.getBoundaryAnchorInsideNode({
			container: container.childNodes[0],
			step: {
				direction: "left",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<p>|hello world </p>');
	}
});

test("boundaryAnchor/inside-node/right", () => {
	const container = document.createElement("div");
	container.innerHTML = "<p>hello </p>";

	const editor = new AnchorQuery({}, container);
	{
		const result = editor.getBoundaryAnchorInsideNode({
			container: container.childNodes[0].childNodes[0],
			step: {
				direction: "right",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<p>hello |</p>');
	}
	{
		const result = editor.getBoundaryAnchorInsideNode({
			container: container.childNodes[0],
			step: {
				direction: "right",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<p>hello |</p>');
	}
});

test("boundaryAnchor/outside-node/left", () => {
	const container = document.createElement("div");
	container.innerHTML =
		'<p>hello world </p>';

	const editor = new AnchorQuery({}, container);
	{
		const result = editor.getBoundaryAnchorOutsideNode({
			container: container.childNodes[0].childNodes[0],
			step: {
				direction: "left",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<p>|hello world </p>');
	}
	{
		const result = editor.getBoundaryAnchorOutsideNode({
			container: container.childNodes[0],
			step: {
				direction: "left",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<div>|<p>hello world </p></div>');
	}
});

test("boundaryAnchor/outside-node/right", () => {
	const container = document.createElement("div");
	container.innerHTML = "<p>hello </p>";

	const editor = new AnchorQuery({}, container);
	{
		const result = editor.getBoundaryAnchorOutsideNode({
			container: container.childNodes[0].childNodes[0],
			step: {
				direction: "right",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<p>hello |</p>');
	}
	{
		const result = editor.getBoundaryAnchorOutsideNode({
			container: container.childNodes[0],
			step: {
				direction: "right",
				stride: "char",
			},
		});
		expect(anchorToString(result, true)).toEqual('<div><p>hello </p>|</div>');
	}
});
