// https://github.com/jsdom/whatwg-url/blob/master/lib/URL-impl.js
"use strict";
const usm = require("./url-state-machine");
const { URLSearchParamsWrapper } = require("./URLSearchParams");

exports.RelativeURL = class RelativeURL {
  constructor(url, base) {
    let parsedBase = null;
    if (base !== undefined) {
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
