// https://github.com/jsdom/whatwg-url/blob/master/lib/URLSearchParams-impl.js
"use strict";

exports.URLSearchParamsWrapper = class URLSearchParamsWrapper extends (
  URLSearchParams
) {
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
