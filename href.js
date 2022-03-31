"use strict";
var href = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // lib/infra.js
  var require_infra = __commonJS({
    "lib/infra.js"(exports, module) {
      "use strict";
      function isASCIIDigit(c) {
        return c >= 48 && c <= 57;
      }
      function isASCIIAlpha(c) {
        return c >= 65 && c <= 90 || c >= 97 && c <= 122;
      }
      function isASCIIAlphanumeric(c) {
        return isASCIIAlpha(c) || isASCIIDigit(c);
      }
      function isASCIIHex(c) {
        return isASCIIDigit(c) || c >= 65 && c <= 70 || c >= 97 && c <= 102;
      }
      module.exports = {
        isASCIIDigit,
        isASCIIAlpha,
        isASCIIAlphanumeric,
        isASCIIHex
      };
    }
  });

  // lib/encoding.js
  var require_encoding = __commonJS({
    "lib/encoding.js"(exports, module) {
      "use strict";
      var utf8Encoder = new TextEncoder();
      var utf8Decoder = new TextDecoder("utf-8", { ignoreBOM: true });
      function utf8Encode(string) {
        return utf8Encoder.encode(string);
      }
      function utf8DecodeWithoutBOM(bytes) {
        return utf8Decoder.decode(bytes);
      }
      module.exports = {
        utf8Encode,
        utf8DecodeWithoutBOM
      };
    }
  });

  // lib/percent-encoding.js
  var require_percent_encoding = __commonJS({
    "lib/percent-encoding.js"(exports, module) {
      "use strict";
      var { isASCIIHex } = require_infra();
      var { utf8Encode } = require_encoding();
      function p(char) {
        return char.codePointAt(0);
      }
      function percentEncode(c) {
        let hex = c.toString(16).toUpperCase();
        if (hex.length === 1) {
          hex = `0${hex}`;
        }
        return `%${hex}`;
      }
      function percentDecodeBytes(input) {
        const output = new Uint8Array(input.byteLength);
        let outputIndex = 0;
        for (let i = 0; i < input.byteLength; ++i) {
          const byte = input[i];
          if (byte !== 37) {
            output[outputIndex++] = byte;
          } else if (byte === 37 && (!isASCIIHex(input[i + 1]) || !isASCIIHex(input[i + 2]))) {
            output[outputIndex++] = byte;
          } else {
            const bytePoint = parseInt(String.fromCodePoint(input[i + 1], input[i + 2]), 16);
            output[outputIndex++] = bytePoint;
            i += 2;
          }
        }
        return output.slice(0, outputIndex);
      }
      function percentDecodeString(input) {
        const bytes = utf8Encode(input);
        return percentDecodeBytes(bytes);
      }
      function isC0ControlPercentEncode(c) {
        return c <= 31 || c > 126;
      }
      var extraFragmentPercentEncodeSet = /* @__PURE__ */ new Set([
        p(" "),
        p('"'),
        p("<"),
        p(">"),
        p("`")
      ]);
      function isFragmentPercentEncode(c) {
        return isC0ControlPercentEncode(c) || extraFragmentPercentEncodeSet.has(c);
      }
      var extraQueryPercentEncodeSet = /* @__PURE__ */ new Set([
        p(" "),
        p('"'),
        p("#"),
        p("<"),
        p(">")
      ]);
      function isQueryPercentEncode(c) {
        return isC0ControlPercentEncode(c) || extraQueryPercentEncodeSet.has(c);
      }
      function isSpecialQueryPercentEncode(c) {
        return isQueryPercentEncode(c) || c === p("'");
      }
      var extraPathPercentEncodeSet = /* @__PURE__ */ new Set([p("?"), p("`"), p("{"), p("}")]);
      function isPathPercentEncode(c) {
        return isQueryPercentEncode(c) || extraPathPercentEncodeSet.has(c);
      }
      var extraUserinfoPercentEncodeSet = /* @__PURE__ */ new Set([
        p("/"),
        p(":"),
        p(";"),
        p("="),
        p("@"),
        p("["),
        p("\\"),
        p("]"),
        p("^"),
        p("|")
      ]);
      function isUserinfoPercentEncode(c) {
        return isPathPercentEncode(c) || extraUserinfoPercentEncodeSet.has(c);
      }
      var extraComponentPercentEncodeSet = /* @__PURE__ */ new Set([
        p("$"),
        p("%"),
        p("&"),
        p("+"),
        p(",")
      ]);
      function isComponentPercentEncode(c) {
        return isUserinfoPercentEncode(c) || extraComponentPercentEncodeSet.has(c);
      }
      var extraURLEncodedPercentEncodeSet = /* @__PURE__ */ new Set([
        p("!"),
        p("'"),
        p("("),
        p(")"),
        p("~")
      ]);
      function isURLEncodedPercentEncode(c) {
        return isComponentPercentEncode(c) || extraURLEncodedPercentEncodeSet.has(c);
      }
      function utf8PercentEncodeCodePointInternal(codePoint, percentEncodePredicate) {
        const bytes = utf8Encode(codePoint);
        let output = "";
        for (const byte of bytes) {
          if (!percentEncodePredicate(byte)) {
            output += String.fromCharCode(byte);
          } else {
            output += percentEncode(byte);
          }
        }
        return output;
      }
      function utf8PercentEncodeCodePoint(codePoint, percentEncodePredicate) {
        return utf8PercentEncodeCodePointInternal(String.fromCodePoint(codePoint), percentEncodePredicate);
      }
      function utf8PercentEncodeString(input, percentEncodePredicate, spaceAsPlus = false) {
        let output = "";
        for (const codePoint of input) {
          if (spaceAsPlus && codePoint === " ") {
            output += "+";
          } else {
            output += utf8PercentEncodeCodePointInternal(codePoint, percentEncodePredicate);
          }
        }
        return output;
      }
      module.exports = {
        isC0ControlPercentEncode,
        isFragmentPercentEncode,
        isQueryPercentEncode,
        isSpecialQueryPercentEncode,
        isPathPercentEncode,
        isUserinfoPercentEncode,
        isURLEncodedPercentEncode,
        percentDecodeString,
        percentDecodeBytes,
        utf8PercentEncodeString,
        utf8PercentEncodeCodePoint
      };
    }
  });

  // lib/url-state-machine.js
  var require_url_state_machine = __commonJS({
    "lib/url-state-machine.js"(exports, module) {
      "use strict";
      var infra = require_infra();
      var {
        utf8PercentEncodeCodePoint,
        utf8PercentEncodeString,
        isFragmentPercentEncode,
        isSpecialQueryPercentEncode,
        isPathPercentEncode
      } = require_percent_encoding();
      function p(char) {
        return char.codePointAt(0);
      }
      var failure = Symbol("failure");
      function isSingleDot(buffer) {
        return buffer === "." || buffer.toLowerCase() === "%2e";
      }
      function isDoubleDot(buffer) {
        buffer = buffer.toLowerCase();
        return buffer === ".." || buffer === "%2e." || buffer === ".%2e" || buffer === "%2e%2e";
      }
      function trimControlChars(url) {
        return url.replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/gu, "");
      }
      function trimTabAndNewline(url) {
        return url.replace(/\u0009|\u000A|\u000D/gu, "");
      }
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
            fragment: null
          };
          const res2 = trimControlChars(this.input);
          if (res2 !== this.input) {
            this.parseError = true;
          }
          this.input = res2;
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
          const cStr = isNaN(c) ? void 0 : String.fromCodePoint(c);
          const ret = this[`parse ${this.state}`](c, cStr);
          if (!ret) {
            break;
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
        if (isNaN(c) || c === p("/") || c === p("\\") || !this.stateOverride && (c === p("?") || c === p("#"))) {
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
          if (c === p("%") && (!infra.isASCIIHex(this.input[this.pointer + 1]) || !infra.isASCIIHex(this.input[this.pointer + 2]))) {
            this.parseError = true;
          }
          this.buffer += utf8PercentEncodeCodePoint(c, isPathPercentEncode);
        }
        return true;
      };
      URLStateMachine.prototype["parse query"] = function parseQuery(c, cStr) {
        if (!this.stateOverride && c === p("#") || isNaN(c)) {
          this.url.query += utf8PercentEncodeString(this.buffer, isSpecialQueryPercentEncode);
          this.buffer = "";
          if (c === p("#")) {
            this.url.fragment = "";
            this.state = "fragment";
          }
        } else if (!isNaN(c)) {
          if (c === p("%") && (!infra.isASCIIHex(this.input[this.pointer + 1]) || !infra.isASCIIHex(this.input[this.pointer + 2]))) {
            this.parseError = true;
          }
          this.buffer += cStr;
        }
        return true;
      };
      URLStateMachine.prototype["parse fragment"] = function parseFragment(c) {
        if (!isNaN(c)) {
          if (c === p("%") && (!infra.isASCIIHex(this.input[this.pointer + 1]) || !infra.isASCIIHex(this.input[this.pointer + 2]))) {
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
      module.exports.basicURLParse = function(input, options) {
        if (options === void 0) {
          options = {};
        }
        const usm = new URLStateMachine(input, options.baseURL, options.encodingOverride, options.url, options.stateOverride);
        if (usm.failure) {
          return null;
        }
        return usm.url;
      };
      module.exports.parseURL = function(input, options) {
        if (options === void 0) {
          options = {};
        }
        return module.exports.basicURLParse(input, {
          baseURL: options.baseURL,
          encodingOverride: options.encodingOverride
        });
      };
    }
  });

  // lib/URLSearchParams.js
  var require_URLSearchParams = __commonJS({
    "lib/URLSearchParams.js"(exports) {
      "use strict";
      exports.URLSearchParamsWrapper = class URLSearchParamsWrapper extends URLSearchParams {
        constructor(init) {
          super(init);
          this._url = null;
        }
        _updateSteps() {
          if (this._url !== null) {
            let query = super.toString();
            if (query === "") {
              query = null;
            }
            this._url._url.query = query;
          }
        }
        append(name, value) {
          super.append(name, value);
          this._updateSteps();
        }
        delete(name) {
          super.delete(name);
          this._updateSteps();
        }
        set(name, value) {
          super.set(name, value);
          this._updateSteps();
        }
        sort() {
          super.sort();
          this._updateSteps();
        }
      };
    }
  });

  // lib/RelativeURL.js
  var require_RelativeURL = __commonJS({
    "lib/RelativeURL.js"(exports) {
      "use strict";
      var usm = require_url_state_machine();
      var { URLSearchParamsWrapper } = require_URLSearchParams();
      exports.RelativeURL = class RelativeURL {
        constructor(url, base) {
          let parsedBase = null;
          if (base !== void 0) {
            parsedBase = usm.basicURLParse(String(base));
            if (parsedBase === null) {
              throw new TypeError(`Invalid base URL: ${base}`);
            }
          }
          const parsedURL = usm.basicURLParse(String(url), { baseURL: parsedBase });
          if (parsedURL === null) {
            throw new TypeError(`Invalid URL: ${url}`);
          }
          const query = parsedURL.query !== null ? parsedURL.query : "";
          this._url = parsedURL;
          this._query = new URLSearchParamsWrapper(query);
          this._query._url = this;
        }
        get href() {
          return usm.serializeURL(this._url);
        }
        set href(v) {
          const parsedURL = usm.basicURLParse(v);
          if (parsedURL === null) {
            throw new TypeError(`Invalid URL: ${v}`);
          }
          this._url = parsedURL;
          const { query } = parsedURL;
          this._query = new URLSearchParamsWrapper(query);
          this._query._url = this;
        }
        get pathname() {
          return usm.serializePath(this._url);
        }
        set pathname(v) {
          this._url.path = [];
          usm.basicURLParse(v, { url: this._url, stateOverride: "path start" });
        }
        get search() {
          if (this._url.query === null || this._url.query === "") {
            return "";
          }
          return `?${this._url.query}`;
        }
        set search(v) {
          const url = this._url;
          if (v === "") {
            url.query = null;
            this._query = new URLSearchParamsWrapper();
            this._query._url = this;
            return;
          }
          const input = v[0] === "?" ? v.substring(1) : v;
          url.query = "";
          usm.basicURLParse(input, { url, stateOverride: "query" });
          this._query = new URLSearchParamsWrapper(input);
          this._query._url = this;
        }
        get searchParams() {
          return this._query;
        }
        get hash() {
          if (this._url.fragment === null || this._url.fragment === "") {
            return "";
          }
          return `#${this._url.fragment}`;
        }
        set hash(v) {
          if (v === "") {
            this._url.fragment = null;
            return;
          }
          const input = v[0] === "#" ? v.substring(1) : v;
          this._url.fragment = "";
          usm.basicURLParse(input, { url: this._url, stateOverride: "fragment" });
        }
        toString() {
          return this.href;
        }
        toJSON() {
          return this.href;
        }
      };
    }
  });

  // index.js
  var require_href = __commonJS({
    "index.js"(exports) {
      var { RelativeURL } = require_RelativeURL();
      exports.RelativeURL = RelativeURL;
    }
  });
  "use strict";
  return require_href();
})();
//# sourceMappingURL=href.js.map
