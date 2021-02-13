# href

> **Unstable now, use it at your own risk**

href is a lib for working with incomplete (without a base) URLs in the builtin [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)'s way

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
import Href from "@lonr/href";
const href = new Href("path/to/file");
```

It behaviors like the builtin URL API:

- If it is given valid arguments of `new URL(url, base)`, it will use `URL` internally. All properties in `URL` are available. E.g., `new Href('https://foo.com').searchParams.set('q', '1')`
- It can also be used with some other inputs:
  - `new Href('//foo.com')` is also delegated to `URL`
  - When using `Href` with other incomplete URLs, only `href`, `pathname`, `search`, `searchParams`, `hash` will work
  - `new Href('path/to/file1?q=1').searchParams.set('q','2')`
  - `new Href('file2', 'path/to/file1').pathname === 'path/to/file2'`
  - `new Href('file2', 'path/').pathname === 'path/file2'`
  - `new Href('../../file2')` keeps `../../`

## Credits

This package is based on the work of [jsdom/whatwg-url](https://github.com/jsdom/whatwg-url)

## Notes

If you found the path resolving surprising, try thinking the `url` and `base` in `new URL(url, base)` this way:

- Imagine an `<a href='./foo.html'>` link in `https://https://example.com/path/bar.html`, the link navigates to `'https://example.com/path/foo.html'`
  - So `new URL('./foo.html', 'https://example.com/path/bar.html')` is parsed to `'https://example.com/path/foo.html'`
  - And `new URL('./foo', 'https://example.com/path/bar')` is parsed to `'https://example.com/path/foo'`
  - And `new Href('./foo', 'path/bar')` is parsed to `'path/foo'`
- An `<a href='./foo.html'>` link in `https://https://example.com/path/`, then the link navigates to `'https://example.com/path/foo.html'`
  - So `new URL('./foo.html', 'https://example.com/path/')` is parsed to `'https://example.com/path/foo.html'`
  - And `new URL('./foo', 'https://example.com/path/')` is parsed to `'https://example.com/path/foo'`
  - And `new Href('./foo', 'path/')` is parsed to `'path/foo'`
- `.` means the current dir and `..` means the parent dir. `URL` treats trailing `.` as `./` and `..` as `../`
  - So `new URL('https://f.c/a/b/.').pathname === '/a/b/'`
  - And `new Href('/a/b/.')` is parsed to `'/a/b/'`
- `URL` keeps continuous slashes in the path section. E.g., `///` in `'path///path2'` won't be joined
  - So `new URL('https://f.c/a///b').pathname === '/a///b'`
  - And `new Href('/a///b')` is parsed to `'/a///b'`
