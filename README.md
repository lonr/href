# @lonr/href

The `@lonr/href` package exports a `RelativeURL` Class, a [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)-like API that helps you resolve relative URLs

## Usage

Install href:

```bash
# npm
npm install @lonr/href
# yarn
yarn add @lonr/href
```

Usage:

```js
import { RelativeURL } from "@lonr/href";
// ⛔️ Don't use RelativeURL to parse complete URLs. Use the built-in URL instead
new RelativeURL("https://example.com").pathname === "https://example.com";

new RelativeURL("path/to/file1?q=1").searchParams.set("q", "2");
new RelativeURL("file2", "path/to/file1").pathname === "path/to/file2";
new RelativeURL("file2", "path/to/").pathname === "path/to/file2";
new RelativeURL("../../file2").pathname === "../../file2";
```

Supported properties: `href`, `pathname`, `search`, `searchPrams`, `hash`

## Credits

This package is based on the work of [jsdom/whatwg-url](https://github.com/jsdom/whatwg-url)
