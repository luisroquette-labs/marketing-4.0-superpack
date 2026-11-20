import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parseJavaScript } from "acorn";
import { parse as parseHtml } from "parse5";
import postcss from "postcss";

const javaScriptTypes = new Set([
  "module", "application/ecmascript", "application/javascript", "application/x-ecmascript",
  "application/x-javascript", "text/ecmascript", "text/javascript", "text/javascript1.0",
  "text/javascript1.1", "text/javascript1.2", "text/javascript1.3", "text/javascript1.4",
  "text/javascript1.5", "text/jscript", "text/livescript", "text/x-ecmascript", "text/x-javascript",
]);

export function findComments(file, source) {
  const lines = [];
  const script = (code, offset = 0, sourceType = "module") => {
    parseJavaScript(code, {
      ecmaVersion: "latest",
      sourceType,
      locations: true,
      onComment: (_block, _value, _start, _end, start) => lines.push(offset + start.line),
    });
  };
  const css = (code, offset = 0) => {
    postcss.parse(code).walkComments((comment) => lines.push(offset + comment.source.start.line));
  };
  if (/\.(?:js|mjs|cjs)$/.test(file)) script(source);
  if (file.endsWith(".css")) css(source);
  if (file.endsWith(".json")) JSON.parse(source);
  if (file.endsWith(".html")) {
    const visit = (node) => {
      if (node.nodeName === "#comment") lines.push(node.sourceCodeLocation.startLine);
      const inlineStyle = node.attrs?.find((attribute) => attribute.name === "style");
      if (inlineStyle) css(`a{${inlineStyle.value}}`, node.sourceCodeLocation.attrs.style.startLine - 1);
      if (node.nodeName === "script" || node.nodeName === "style") {
        for (const child of node.childNodes ?? []) {
          if (child.nodeName !== "#text") continue;
          const offset = child.sourceCodeLocation.startLine - 1;
          if (node.nodeName === "style") css(child.value, offset);
          else {
            const type = node.attrs.find((attribute) => attribute.name === "type")?.value.toLowerCase().split(";")[0].trim();
            if (!type || javaScriptTypes.has(type)) script(child.value, offset, type === "module" ? "module" : "script");
            else if (type === "application/ld+json") JSON.parse(child.value);
          }
        }
      }
      for (const child of node.childNodes ?? []) visit(child);
    };
    visit(parseHtml(source, { sourceCodeLocationInfo: true }));
  }
  return lines.sort((a, b) => a - b);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    .toString().split("\0").filter((file) => /\.(?:js|mjs|cjs|css|html|json)$/.test(file) && existsSync(file));
  const failures = files.flatMap((file) => findComments(file, readFileSync(file, "utf8")).map((line) => `${file}:${line}`));
  if (failures.length) {
    console.error(`Comments are forbidden:\n${failures.join("\n")}`);
    process.exitCode = 1;
  }
}
