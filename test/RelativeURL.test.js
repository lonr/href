const { RelativeURL } = require("..");

test("Checking examples in Spec", () => {
  // RelativeURL treats "https://example.org/💩" as a path!
  const a = new RelativeURL("https://example.org/💩");
  expect(a.href).toBe("https://example.org/%F0%9F%92%A9");
  const b = new RelativeURL("/🍣🍺");
  expect(b.href).toBe("/%F0%9F%8D%A3%F0%9F%8D%BA");
});

const props = ["pathname", "search", "hash"];

describe("RelativeURL handles relative URLs", () => {
  it("accepts an absolute path with search and hash appended", () => {
    const url = new RelativeURL("/path/to/..?q1=1&q2=2#a");
    const fullUrl = new URL("/path/to/..?q1=1&q2=2#a", "https://example.com");
    for (const name of props) {
      expect(url[name]).toBe(fullUrl[name]);
    }
    expect(url.href).toBe(props.map((name) => url[name]).join(""));
  });

  it("percent encodes chars like URL does", () => {
    const url = new RelativeURL("/中文path/😂/..?🪝a=📏&🐟=🧂b#👍c");
    const fullUrl = new URL(
      "/中文path/😂/..?🪝a=📏&🐟=🧂b#👍c",
      "https://example.com"
    );
    for (const name of props) {
      expect(url[name]).toBe(fullUrl[name]);
    }
    expect(url.href).toBe(props.map((name) => url[name]).join(""));
  });

  it("accepts a relative path with search and hash appended", () => {
    const url = new RelativeURL("path/to/..?q1=1&q2=2#a");
    const { pathname, search, hash } = url;
    expect(pathname).toBe("path/");
    expect(search).toBe("?q1=1&q2=2");
    expect(hash).toBe("#a");
  });

  it("sets props", () => {
    const url = new RelativeURL("/path/to/..?q1=1&q2=2#a");
    const aim = new RelativeURL("/path2/to2/..?q3=3&q4=4#b");
    for (const name of props) {
      url[name] = aim[name];
      expect(url[name]).toBe(aim[name]);
    }
    expect(url.href).toBe(aim.href);
  });

  it("sets href prop", () => {
    const url = new RelativeURL("/path/to/..?q1=1&q2=2#a");
    const aim = new RelativeURL("/path2/to2/..?q3=3&q4=4#b");
    url.href = aim.href;
    expect(url.href).toBe(aim.href);
  });

  it("sets pathname prop", () => {
    const url = new RelativeURL("/path/to/..?q1=1&q2=2#a");
    const fullUrl = new URL("/path/to/..?q1=1&q2=2#a", "https://example.com");
    url.pathname = "/path2/to2/..?q3=3&q4=4#b";
    fullUrl.pathname = "/path2/to2/..?q3=3&q4=4#b";
    for (const name of props) {
      url[name] = fullUrl[name];
      expect(url[name]).toBe(fullUrl[name]);
    }
    expect(url.href).toBe(`${url.pathname}${url.search}${url.hash}`);
  });

  it("sets search prop", () => {
    const url = new RelativeURL("/path/to/..?q1=1&q2=2#a");
    const fullUrl = new URL("/path/to/..?q1=1&q2=2#a", "https://example.com");
    url.search = "?q3=3&q4=4#b";
    fullUrl.search = "?q3=3&q4=4#b";
    for (const name of props) {
      url[name] = fullUrl[name];
      expect(url[name]).toBe(fullUrl[name]);
    }
    expect(url.href).toBe(`${url.pathname}${url.search}${url.hash}`);
  });
});

describe("URLSearchParams", () => {
  it("attaches to RelativeURL", () => {
    const url = new RelativeURL("/path?q1=1&q2=2#foo");
    expect(url.search).toBe("?" + url.searchParams.toString());

    url.searchParams.delete("q2");
    expect(url.search).toBe("?q1=1");
    expect(url.search).toBe("?" + url.searchParams.toString());
  });
});

/** Some more tests */
describe("RelativeURL", () => {
  it("disallows absolute paths to be above the root", () => {
    const url1 = new RelativeURL("/path/../../");
    expect(url1.pathname).toBe("/");

    const url2 = new RelativeURL("/path/../");
    expect(url2.pathname).toBe("/");

    const url3 = new RelativeURL("/path/..");
    expect(url3.pathname).toBe("/");
  });

  const relativePathTestPairs = [
    [".", "./"],
    ["./", "./"],
    ["..", "../"],
    ["../", "../"],
    ["./../", "../"],
    ["../../", "../../"],

    ["path/..", "./"],
    ["path/../../", "../"],

    ["./a", "./a"],
  ];
  it("allows relative paths (to be above the root in some cases)", () => {
    for (const [path, parsedPath] of relativePathTestPairs) {
      expect(new RelativeURL(path).pathname).toBe(parsedPath);
    }
  });

  const inputEdgeCasesPairs = [
    ["", "", "", ""],
    [".", "./", "", ""],
    ["./", "./", "", ""],
    ["/", "/", "", ""],
    ["?", "", "", ""],
    ["#", "", "", ""],
    ["/?", "/", "", ""],
    ["/#", "/", "", ""],
    ["/?#", "/", "", ""],
    [".?#", "./", "", ""],
    ["./?#", "./", "", ""],
    ["..?#", "../", "", ""],
    ["../?#", "../", "", ""],
  ];
  it("handles some edge cases", () => {
    for (const [
      input,
      expectedPathname,
      expectedSearch,
      expectedHash,
    ] of inputEdgeCasesPairs) {
      const { pathname, search, hash } = new RelativeURL(input);
      expect(pathname).toBe(expectedPathname);
      expect(search).toBe(expectedSearch);
      expect(hash).toBe(expectedHash);
    }
  });

  const backslashParis = [
    ["\\", "/", "", ""],
    ["a\\", "a/", "", ""],
    ["a/.\\", "a/", "", ""],
    ["a/..\\", "./", "", ""],
    ["\\a/", "/a/", "", ""],
  ];
  it("treats backslashes in path as slashes", () => {
    for (const [
      input,
      expectedPathname,
      expectedSearch,
      expectedHash,
    ] of backslashParis) {
      const { pathname, search, hash } = new RelativeURL(input);
      expect(pathname).toBe(expectedPathname);
      expect(search).toBe(expectedSearch);
      expect(hash).toBe(expectedHash);
    }
  });

  const pathBaseTestPairs = [
    ["path2", undefined, "path2", "", ""],
    ["path2", "", "path2", "", ""],
    ["path2", ".", "./path2", "", ""],
    ["path2", "./", "./path2", "", ""],
    ["..", "path1/path2", "./", "", ""],
    ["..", "path1//", "path1/", "", ""],
    ["../../", "path1", "../../", "", ""],
    ["../../", "path1/", "../", "", ""],
    ["path2", "path1", "path2", "", ""],
    ["path2", "/path1", "/path2", "", ""],
    ["path2", "path1/", "path1/path2", "", ""],
    ["path2", "/path1/", "/path1/path2", "", ""],
    ["/path2", "/path1/", "/path2", "", ""],
    ["?q=1", "/path1/", "/path1/", "?q=1", ""],
    ["#foo", "/path1/", "/path1/", "", "#foo"],
    ["?q=1#foo", "/path1/", "/path1/", "?q=1", "#foo"],
    ["path2?q=1#foo", "/path1/", "/path1/path2", "?q=1", "#foo"],
  ];
  it("accepts a path as the base", () => {
    for (const [
      url,
      base,
      expectedPathname,
      expectedSearch,
      expectedHash,
    ] of pathBaseTestPairs) {
      const { pathname, search, hash } = new RelativeURL(url, base);
      expect(pathname).toBe(expectedPathname);
      expect(search).toBe(expectedSearch);
      expect(hash).toBe(expectedHash);
    }
  });
});
