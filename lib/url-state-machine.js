// https://github.com/jsdom/whatwg-url/blob/master/lib/url-state-machine.js
"use strict";

const infra = require("./infra");
const {
  utf8PercentEncodeCodePoint,
  utf8PercentEncodeString,
  isFragmentPercentEncode,
  isSpecialQueryPercentEncode,
  isPathPercentEncode,
} = require("./percent-encoding");

function p(char) {
  return char.codePointAt(0);
}
const failure = Symbol("failure");

function isSingleDot(buffer) {
  return buffer === "." || buffer.toLowerCase() === "%2e";
}

function isDoubleDot(buffer) {
  buffer = buffer.toLowerCase();
  return (
    buffer === ".." ||
    buffer === "%2e." ||
    buffer === ".%2e" ||
    buffer === "%2e%2e"
  );
}

function trimControlChars(url) {
  return url.replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/gu, "");
}

function trimTabAndNewline(url) {
  return url.replace(/\u0009|\u000A|\u000D/gu, "");
}

// [''] ['', 'otherSegment']
function isAbsolute(path) {
  return path.length > 0 && path[0] === "";
}

function shortenPath(url) {
  const { path } = url;
  shortenPathArray(path);
}

function shortenPathArray(path) {
  const lastSegment = path[path.length - 1];

  if (isAbsolute(path)) {
    if (path.length > 1) {
      path.pop();
    }
  } else if (path.length === 0 || lastSegment === "..") {
    path.push("..");
  } else if (lastSegment === ".") {
    path[path.length - 1] = "..";
  } else if (path.length === 1) {
    path[0] = ".";
  } else {
    path.pop();
  }
}

function shortenBasePathArray(path) {
  if (path.length === 0) {
    return;
  }

  const lastSegment = path[path.length - 1];

  if (lastSegment === "..") {
    path.push("..");
  } else if (lastSegment === ".") {
    path[path.length - 1] = "..";
  } else {
    path.pop();
  }
}

function URLStateMachine(input, base, encodingOverride, url, stateOverride) {
  this.pointer = 0;
  this.input = input;
  this.base = base || null;
  this.encodingOverride = encodingOverride || "utf-8";
  this.stateOverride = stateOverride;
  this.url = url;
  this.failure = false;
  this.parseError = false;

  if (!this.url) {
    this.url = {
      path: [],
      query: null,
      fragment: null,
    };

    const res = trimControlChars(this.input);
    if (res !== this.input) {
      this.parseError = true;
    }
    this.input = res;
  }

  const res = trimTabAndNewline(this.input);
  if (res !== this.input) {
    this.parseError = true;
  }
  this.input = res;

  this.state = stateOverride || "relative";

  this.buffer = "";

  this.input = Array.from(this.input, (c) => c.codePointAt(0));

  for (; this.pointer <= this.input.length; ++this.pointer) {
    const c = this.input[this.pointer];
    const cStr = isNaN(c) ? undefined : String.fromCodePoint(c);

    // exec state machine
    const ret = this[`parse ${this.state}`](c, cStr);
    if (!ret) {
      break; // terminate algorithm
    } else if (ret === failure) {
      this.failure = true;
      break;
    }
  }
}

URLStateMachine.prototype["parse relative"] = function parseRelative(c) {
  if (c === p("\\")) {
    this.parseError = true;
  }

  if (this.base !== null && c !== p("/") && c !== p("\\")) {
    this.url.path = this.base.path.slice();
    this.url.query = this.base.query;
    if (c === p("?")) {
      this.url.query = "";
      this.state = "query";
    } else if (c === p("#")) {
      this.url.fragment = "";
      this.state = "fragment";
    } else {
      this.url.query = null;
      shortenBasePathArray(this.url.path);
      this.state = "path";
      --this.pointer;
    }
  } else {
    this.state = "path";
    --this.pointer;
  }
  return true;
};

URLStateMachine.prototype["parse path start"] = function parsePathStart(c) {
  if (c === p("\\")) {
    this.parseError = true;
  }
  this.state = "path";
  --this.pointer;

  return true;
};

URLStateMachine.prototype["parse path"] = function parsePath(c) {
  if (
    isNaN(c) ||
    c === p("/") ||
    c === p("\\") ||
    (!this.stateOverride && (c === p("?") || c === p("#")))
  ) {
    if (c === p("\\")) {
      this.parseError = true;
    }

    if (isDoubleDot(this.buffer)) {
      shortenPath(this.url);
      if (c !== p("/") && c !== p("\\")) {
        this.url.path.push("");
      }
    } else if (isSingleDot(this.buffer)) {
      if (this.url.path.length === 0) {
        this.url.path.push(".");
      }
      if (c !== p("/") && c !== p("\\")) {
        this.url.path.push("");
      }
    } else {
      this.url.path.push(this.buffer);
    }
    this.buffer = "";
    if (c === p("?")) {
      this.url.query = "";
      this.state = "query";
    }
    if (c === p("#")) {
      this.url.fragment = "";
      this.state = "fragment";
    }
  } else {
    // TODO: If c is not a URL code point and not "%", parse error.

    if (
      c === p("%") &&
      (!infra.isASCIIHex(this.input[this.pointer + 1]) ||
        !infra.isASCIIHex(this.input[this.pointer + 2]))
    ) {
      this.parseError = true;
    }

    this.buffer += utf8PercentEncodeCodePoint(c, isPathPercentEncode);
  }

  return true;
};

URLStateMachine.prototype["parse query"] = function parseQuery(c, cStr) {
  if ((!this.stateOverride && c === p("#")) || isNaN(c)) {
    this.url.query += utf8PercentEncodeString(
      this.buffer,
      isSpecialQueryPercentEncode
    );

    this.buffer = "";

    if (c === p("#")) {
      this.url.fragment = "";
      this.state = "fragment";
    }
  } else if (!isNaN(c)) {
    // TODO: If c is not a URL code point and not "%", parse error.

    if (
      c === p("%") &&
      (!infra.isASCIIHex(this.input[this.pointer + 1]) ||
        !infra.isASCIIHex(this.input[this.pointer + 2]))
    ) {
      this.parseError = true;
    }

    this.buffer += cStr;
  }

  return true;
};

URLStateMachine.prototype["parse fragment"] = function parseFragment(c) {
  if (!isNaN(c)) {
    // TODO: If c is not a URL code point and not "%", parse error.
    if (
      c === p("%") &&
      (!infra.isASCIIHex(this.input[this.pointer + 1]) ||
        !infra.isASCIIHex(this.input[this.pointer + 2]))
    ) {
      this.parseError = true;
    }

    this.url.fragment += utf8PercentEncodeCodePoint(c, isFragmentPercentEncode);
  }

  return true;
};

function serializeURL(url, excludeFragment) {
  let output = serializePath(url);

  if (url.query !== null) {
    output += `?${url.query}`;
  }

  if (!excludeFragment && url.fragment !== null) {
    output += `#${url.fragment}`;
  }

  return output;
}

function serializePath(url) {
  return url.path.join("/");
}

module.exports.serializeURL = serializeURL;

module.exports.serializePath = serializePath;

module.exports.basicURLParse = function (input, options) {
  if (options === undefined) {
    options = {};
  }

  const usm = new URLStateMachine(
    input,
    options.baseURL,
    options.encodingOverride,
    options.url,
    options.stateOverride
  );
  if (usm.failure) {
    return null;
  }

  return usm.url;
};

module.exports.parseURL = function (input, options) {
  if (options === undefined) {
    options = {};
  }

  // We don't handle blobs, so this just delegates:
  return module.exports.basicURLParse(input, {
    baseURL: options.baseURL,
    encodingOverride: options.encodingOverride,
  });
};
