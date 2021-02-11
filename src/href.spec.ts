import Href from './href';

// https://url.spec.whatwg.org/#urls

const writableURLPropNames = [
  'hash',
  'host',
  'hostname',
  'href',
  'password',
  'pathname',
  'port',
  'protocol',
  'search',
  'username',
] as const;

const readableURLPropNames = [...writableURLPropNames, 'origin' as const];

// can be read and written
const readableAndWritableURLPropNames = writableURLPropNames.filter((name) =>
  readableURLPropNames.includes(name)
);

const hrefPropNames = ['pathname', 'search', 'hash'] as const;

type ReadablePropsSpecificToURL = Exclude<
  typeof readableURLPropNames[number],
  typeof hrefPropNames[number] | 'href'
>;
// readable props specific to URL
const readablePropsSpecificToURL = readableURLPropNames.filter(
  (name): name is ReadablePropsSpecificToURL =>
    ![...hrefPropNames, 'href'].includes(name)
);

type WritablePropsSpecificToURL = Exclude<
  typeof writableURLPropNames[number],
  typeof hrefPropNames[number] | 'href'
>;
// writable
const writablePropsSpecificToURL = writableURLPropNames.filter(
  (name): name is WritablePropsSpecificToURL =>
    ![...hrefPropNames, 'href'].includes(name)
);

describe('Href delegates valid URLs to URL', () => {
  describe('Href can get the same props as the delegated URL', () => {
    const href = new Href(
      'https://user:password@example.com/path/to/..?q1=1&q2=2#a'
    );
    const url = new URL(
      'https://user:password@example.com/path/to/..?q1=1&q2=2#a'
    );
    it.each(readableURLPropNames)('gets the same `%s` prop', (name) => {
      expect(href[name]).toBe(url[name]);
    });
  });

  describe('Href can set the same props as the delegated URL', () => {
    const href = new Href(
      'https://user:password@example.com/path/to/..?q1=1&q2=2#a'
    );
    const url = new URL(
      'https://user:password@example.com/path/to/..?q1=1&q2=2#a'
    );
    const aim = new URL(
      'http://user2:password2@example2.com/path2/to2/..?q3=3&q4=4#b'
    );
    it.each(writableURLPropNames)('can set the same `%s` prop', (name) => {
      href[name] = aim[name];
      url[name] = aim[name];
      expect(href[name]).toBe(url[name]);
    });
  });

  it('should get the same URLSearchParams props as the delegated URL', () => {
    const href = new Href(
      'https://user:password@example.com/path/to/..?q1=1&q2=2#a'
    );
    const url = new URL(
      'https://user:password@example.com/path/to/..?q1=1&q2=2#a'
    );
    expect(href.searchParams.entries()).toEqual(url.searchParams.entries());
  });

  it('tries to delegate input with a valid URL as the base to URL', () => {
    expect(new Href('path', 'https://foo.com').href).toBe(
      new URL('path', 'https://foo.com').href
    );
  });

  it('tries to delegate input with an implicit scheme as the base to URL', () => {
    expect(new Href('path', '//foo.com').href).toBe(
      new URL('path', 'https://foo.com').href.replace(/https:/, '')
    );

    const href = new Href('//foo.com');
    href.protocol = 'https';
    expect(href.href).toBe(new URL('https://foo.com').href);

    expect(new Href('http://bar.com', '//foo.com').href).toBe(
      new URL('http://bar.com', 'https://foo.com').href
    );
  });

  it('parses the base as a path if the delegation failed', () => {
    // parsed as a path
    expect(new Href('path', 'https://').href).toBe('https://path');

    expect(new Href('path', '//').href).toBe('//path');

    // also treats 'http://bar.com' as a path
    expect(new Href('http://bar.com', '//').href).toBe('//http://bar.com');
  });
});

// TODO: group tests
describe('Href handles some other incomplete URLs', () => {
  it('accepts an absolute path with search and hash', () => {
    const href = new Href('/path/to/..?q1=1&q2=2#a');
    const url = new URL('https://example.com/path/to/..?q1=1&q2=2#a');
    for (const name of hrefPropNames) {
      expect(href[name]).toBe(url[name]);
    }
    expect(href.pathname).toBe(url.pathname);
    expect(href.href).toBe(hrefPropNames.map((name) => href[name]).join(''));
  });

  it('should percent encode chars like URL', () => {
    const href = new Href('/中文path/😂/..?🪝a=📏&🐟=🧂b#👍c');
    const url = new URL('https://example.com/中文path/😂/..?🪝a=📏&🐟=🧂b#👍c');
    for (const name of hrefPropNames) {
      expect(href[name]).toBe(url[name]);
    }
    expect(href.pathname).toBe(url.pathname);
    expect(href.href).toBe(hrefPropNames.map((name) => href[name]).join(''));
  });

  it('accepts a relative path with search and hash', () => {
    const href = new Href('path/to/..?q1=1&q2=2#a');
    const { pathname, search, hash } = href;
    expect(pathname).toBe('path/');
    expect(search).toBe('?q1=1&q2=2');
    expect(hash).toBe('#a');
  });

  it('can set some props', () => {
    const href = new Href('/path/to/..?q1=1&q2=2#a');
    const aim = new Href('/path2/to2/..?q3=3&q4=4#b');
    for (const name of [...hrefPropNames, 'href' as const]) {
      href[name] = aim[name];
      expect(href[name]).toBe(aim[name]);
    }
    expect(href.href).toBe(aim.href);
  });

  it('returns empty strings for props specific to URL', () => {
    const href = new Href('/path/');
    for (const name of readablePropsSpecificToURL) {
      expect(href[name]).toBe('');
    }
  });

  it('does no thing with setters specific to URL', () => {
    const href = new Href('/path');
    const hrefStr = href.href;
    const aim = new URL('https://example.com/path/to/..?q1=1&q2=2#a');
    for (const name of writablePropsSpecificToURL) {
      href[name] = aim[name];
    }
    expect(href.href).toBe(hrefStr);
  });

  it('has an attached searchParams', () => {
    const href = new Href('/path?q1=1&q2=2#foo');
    expect(href.search).toBe('?' + href.searchParams.toString());

    href.searchParams.delete('q2');
    expect(href.search).toBe('?q1=1');
    expect(href.search).toBe('?' + href.searchParams.toString());
  });

  it('disallows absolute paths to be above the root', () => {
    const href1 = new Href('/path/../../');
    expect(href1.pathname).toBe('/');

    const href2 = new Href('/path/../');
    expect(href2.pathname).toBe('/');

    const href3 = new Href('/path/..');
    expect(href3.pathname).toBe('/');
  });

  const relativePathTestPairs = [
    ['.', './'],
    ['./', './'],
    ['..', '../'],
    ['../', '../'],
    ['./../', '../'],
    ['../../', '../../'],

    ['path/..', './'],
    ['path/../../', '../'],

    ['./a', './a'],
  ];

  it('allows relative paths (to be above the root. No root actually)', () => {
    for (const [path, parsedPath] of relativePathTestPairs) {
      expect(new Href(path).pathname).toBe(parsedPath);
    }
  });

  const inputEdgeCasesPairs = [
    ['', '', '', ''],
    ['.', './', '', ''],
    ['./', './', '', ''],
    ['/', '/', '', ''],
    ['?', '', '', ''],
    ['#', '', '', ''],
    ['/?', '/', '', ''],
    ['/#', '/', '', ''],
    ['/?#', '/', '', ''],
    ['.?#', './', '', ''],
    ['./?#', './', '', ''],
    ['..?#', '../', '', ''],
    ['../?#', '../', '', ''],
  ];
  it('should handle these edge cases', () => {
    for (const [
      input,
      expectedPathname,
      expectedSearch,
      expectedHash,
    ] of inputEdgeCasesPairs) {
      const { pathname, search, hash } = new Href(input);
      expect(pathname).toBe(expectedPathname);
      expect(search).toBe(expectedSearch);
      expect(hash).toBe(expectedHash);
    }
  });

  const backslashParis = [
    ['\\', '/', '', ''],
    ['a\\', 'a/', '', ''],
    ['a/.\\', 'a/', '', ''],
    ['a/..\\', './', '', ''],
    ['\\a/', '/a/', '', ''],
  ];
  it('treats backslashes in path as slashes', () => {
    for (const [
      input,
      expectedPathname,
      expectedSearch,
      expectedHash,
    ] of backslashParis) {
      const { pathname, search, hash } = new Href(input);
      expect(pathname).toBe(expectedPathname);
      expect(search).toBe(expectedSearch);
      expect(hash).toBe(expectedHash);
    }
  });

  const pathBaseTestPairs = [
    ['path2', '', 'path2', '', ''],
    ['path2', '.', './path2', '', ''],
    ['path2', './', './path2', '', ''],
    ['..', 'path1/path2', './', '', ''],
    ['..', 'path1//', 'path1/', '', ''],
    ['../../', 'path1', '../../', '', ''],
    ['../../', 'path1/', '../', '', ''],
    ['path2', 'path1', 'path2', '', ''],
    ['path2', '/path1', '/path2', '', ''],
    ['path2', 'path1/', 'path1/path2', '', ''],
    ['path2', '/path1/', '/path1/path2', '', ''],
    ['/path2', '/path1/', '/path2', '', ''],
    ['?q=1', '/path1/', '/path1/', '?q=1', ''],
    ['#foo', '/path1/', '/path1/', '', '#foo'],
    ['?q=1#foo', '/path1/', '/path1/', '?q=1', '#foo'],
    ['path2?q=1#foo', '/path1/', '/path1/path2', '?q=1', '#foo'],
  ];
  it('accepts a path as the base', () => {
    for (const [
      href,
      base,
      expectedPathname,
      expectedSearch,
      expectedHash,
    ] of pathBaseTestPairs) {
      const { pathname, search, hash } = new Href(href, base);
      expect(pathname).toBe(expectedPathname);
      expect(search).toBe(expectedSearch);
      expect(hash).toBe(expectedHash);
    }
  });
});
