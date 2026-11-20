import assert from "node:assert/strict";
import test from "node:test";
import { findComments } from "./check-comments.mjs";

test("HTML, JavaScript and CSS strings do not count as comments", () => {
  const source = '<a data-label="<!-- literal -->" href="https://example.com">x</a><script>const re = /[//]/; const x = "/* literal */";</script><style>a{content:"/* literal */"}</style>';
  assert.deepEqual(findComments("demo.html", source), []);
});

test("HTML and embedded comments are rejected", () => {
  const source = '<!-- section --><script type="module">export const x = `${fn(/* hidden */ 1)}`;</script><style>/* color */</style><div style="color:red;/* inline */"></div>';
  assert.equal(findComments("demo.html", source).length, 4);
  assert.equal(findComments("app.js", "// section\nconst x = 1; /* inline */").length, 2);
  assert.equal(findComments("style.css", "a { color: red; /* inline */ }").length, 1);
});
