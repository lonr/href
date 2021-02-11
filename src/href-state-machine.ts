// The MIT License (MIT)
// Copyright (c) 2015–2016 Sebastian Mayr
// https://github.com/jsdom/whatwg-url/blob/6f873fb929/src/url-state-machine.js
// Copyright (c) 2021 lonr

import {
  utf8PercentEncodeCodePoint,
  utf8PercentEncodeString,
  isFragmentPercentEncode,
  isSpecialQueryPercentEncode,
  isPathPercentEncode,
} from './percent-encoding';

function p(char: string): number {
  return char.codePointAt(0)!;
}

const failure = Symbol('failure');

type failure = typeof failure;

function trimControlChars(url: string): string {
  // eslint-disable-next-line no-control-regex
  return url.replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/g, '');
}

function trimTabAndNewline(url: string): string {
  // eslint-disable-next-line no-control-regex
  return url.replace(/\u0009|\u000A|\u000D/g, '');
}

function isAbsolutePathArray(path: string[]) {
  if (path.length !== 0 && path[0] === '') {
    return true;
  }
  return false;
}

function isAbsolute(href: HrefContext) {
  const { path } = href;
  return isAbsolutePathArray(path);
}

function shortenPathArray(path: string[]) {
  const last = path[path.length - 1];
  if (isAbsolutePathArray(path)) {
    if (path.length > 1) {
      path.pop();
    }
  } else if (path.length === 0 || last === '..') {
    path.push('..');
  } else if (last === '.') {
    path[path.length - 1] = '..';
  } else if (path.length === 1) {
    path[0] = '.';
  } else {
    path.pop();
  }
}

function shortenBasePathArray(path: string[]) {
  if (path.length === 0) {
    return;
  }
  const last = path[path.length - 1];
  if (isAbsolutePathArray(path)) {
    if (path.length > 1) {
      path.pop();
    }
  } else if (last === '..') {
    path.push('..');
  } else if (last === '.') {
    path[path.length - 1] = '..';
  } else {
    path.pop();
  }
}

function shortenPath(href: HrefContext) {
  const { path } = href;
  return shortenPathArray(path);
}

function isSingleDot(buffer: string) {
  return buffer === '.' || buffer.toLowerCase() === '%2e';
}

function isDoubleDot(buffer: string) {
  buffer = buffer.toLowerCase();
  return (
    buffer === '..' ||
    buffer === '%2e.' ||
    buffer === '.%2e' ||
    buffer === '%2e%2e'
  );
}

export class HrefContext {
  // scheme: string | null;
  // username: string;
  // password: string;
  // host: string | null;
  // port: string | null;
  path: string[];
  query: string | null;
  fragment: string | null;
  cannotBeABaseURL: boolean;
  mayBeImplicitScheme: boolean;
  constructor() {
    // this.scheme = null;
    // this.username = '';
    // this.password = '';
    // this.host = null;
    // this.port = null;
    this.path = [];
    this.query = null;
    this.fragment = null;

    this.mayBeImplicitScheme = false;
    this.cannotBeABaseURL = false;
  }
}

type ParsingState =
  | 'start'
  | 'with a base'
  | 'path or maybe implicit scheme'
  | 'path like a implicit scheme'
  | 'path'
  | 'query'
  | 'fragment';

type ParsingMethodName = `parse ${ParsingState}`;

/// `true` stands for normal; `false` for error; `failure` for warning; string for other usages
type ParsingMethodReturn = 'maybe implicit scheme' | typeof failure | boolean;

interface ParsingMethod {
  (c: number, cStr?: string): ParsingMethodReturn;
}

export class HrefStateMachine
  implements Record<ParsingMethodName, ParsingMethod> {
  input: string;
  base: HrefContext | null = null;
  href: HrefContext | undefined;
  stateOverride: ParsingState | undefined;

  pointer: number;
  failure: boolean;
  parseError: boolean;

  inputCodePoints: number[];
  buffer: string;
  atFlag: boolean;
  arrFlag: boolean;
  passwordTokenSeenFlag: boolean;
  state: ParsingState;

  constructor(
    input: string,
    options?: {
      base?: HrefContext;
      href?: HrefContext;
      stateOverride?: ParsingState;
    }
  ) {
    this.input = input;
    this.base = options?.base ?? null;
    this.href = options?.href;
    this.stateOverride = options?.stateOverride;
    this.pointer = 0;
    this.failure = false;
    this.parseError = false;

    if (!this.href) {
      this.href = new HrefContext();

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
    this.state = this.stateOverride || 'start';

    this.buffer = '';
    this.atFlag = false;
    this.arrFlag = false;
    this.passwordTokenSeenFlag = false;

    this.inputCodePoints = [...this.input].map(p);

    // Why `<=`? `this.inputCodePoints[this.inputCodePoints.length] === undefined` is as the EOF
    for (; this.pointer <= this.inputCodePoints.length; this.pointer += 1) {
      const c = this.inputCodePoints[this.pointer];
      const cStr = isNaN(c) ? undefined : String.fromCodePoint(c);
      // exec state machine
      const ret = this[('parse ' + this.state) as ParsingMethodName](c, cStr);
      if (!ret) {
        break; // terminate algorithm
      } else if (ret === failure) {
        this.failure = true;
        break;
      } else if (ret === 'maybe implicit scheme') {
        this.href.mayBeImplicitScheme = true;
        break;
      }
    }
  }

  ['parse start'](c: number, cStr?: string): ParsingMethodReturn {
    if (this.base !== null) {
      // with a base
      this.state = 'with a base';
      this.pointer -= 1;
    } else if (isNaN(c)) {
      return true;
    } else if (c === p('/') || c === p('\\')) {
      /** //foo.com or /path */
      this.state = 'path or maybe implicit scheme';
      this.pointer -= 1;
    } else if (c === p('?')) {
      this.href!.query = '';
      this.state = 'query';
    } else if (c === p('#')) {
      this.href!.fragment = '';
      this.state = 'fragment';
    } else {
      // actually a single relative path
      this.state = 'path';
      this.pointer -= 1;
    }
    return true;
  }

  /** //foo.com or /path */
  ['parse path or maybe implicit scheme'](
    c?: number,
    cStr?: string
  ): ParsingMethodReturn {
    const next = this.inputCodePoints[this.pointer + 1];
    if (next === p('/') || next === p('\\')) {
      return 'maybe implicit scheme';
    } else {
      this.state = 'path';
      this.pointer -= 1;
    }
    return true;
  }

  /** With a path as base */
  ['parse with a base'](c: number, cStr?: string): ParsingMethodReturn {
    if (isNaN(c)) {
      this.href!.path = [...this.base!.path];
      this.href!.query = this.base!.query;
      this.href!.fragment = this.base!.fragment;
      return true;
      // should use the base's path
    } else if (c !== p('/') && c !== p('\\')) {
      this.href!.path = [...this.base!.path];
      if (c === p('?')) {
        this.href!.query = '';
        this.state = 'query';
      } else if (c === p('#')) {
        this.href!.fragment = '';
        this.state = 'fragment';
      } else {
        // should use the shorten path
        shortenBasePathArray(this.href!.path);
        this.state = 'path';
        this.pointer -= 1;
      }
      // ignore the base's path
    } else {
      this.state = 'path';
      this.pointer -= 1;
    }
    return true;
  }

  // Parse `//path/to/file?q=1#foo` as path + query + hash. Used by `Href`'s constructor via `stateOverride`
  // Normally `stateOverride` is used by something like `new Href().pathname`
  // In that case `parse path` will treat `?q=1#foo` as parts of a path
  // So I added this upstream state
  // May never be called because `new Href('//anything')` seems to always fallback to URL
  // and `new Href('//anything', '/path')` always parses `//anything` as a path
  ['parse path like a implicit scheme'](
    c: number,
    cStr?: string
  ): ParsingMethodReturn {
    this.stateOverride = undefined;
    this.state = 'path';
    this.pointer -= 1;
    return true;
  }

  ['parse path'](c: number, cStr?: string): ParsingMethodReturn {
    if (
      isNaN(c) ||
      (!this.stateOverride && (c === p('?') || c === p('#'))) ||
      c === p('/') ||
      c === p('\\')
    ) {
      if (isDoubleDot(this.buffer)) {
        shortenPath(this.href!);
        if (c !== p('/') && c !== p('\\')) {
          this.href!.path.push('');
        }
      } else if (isSingleDot(this.buffer)) {
        if (this.href!.path.length === 0) {
          this.href!.path.push('.');
        }
        if (c !== p('/') && c !== p('\\')) {
          this.href!.path.push('');
        }
      } else {
        this.href!.path.push(this.buffer);
      }
      this.buffer = '';
      if (c === p('?')) {
        this.href!.query = '';
        this.state = 'query';
      }
      if (c === p('#')) {
        this.href!.fragment = '';
        this.state = 'fragment';
      }
    } else {
      this.buffer += utf8PercentEncodeCodePoint(c, isPathPercentEncode);
    }
    return true;
  }

  ['parse query'](c: number, cStr?: string): ParsingMethodReturn {
    if ((!this.stateOverride && c === p('#')) || isNaN(c)) {
      this.href!.query += utf8PercentEncodeString(
        this.buffer,
        isSpecialQueryPercentEncode
      );
      this.buffer = '';

      if (c === p('#')) {
        this.href!.fragment = '';
        this.state = 'fragment';
      }
    } else {
      this.buffer += cStr;
    }
    return true;
  }

  ['parse fragment'](c: number, cStr?: string): ParsingMethodReturn {
    if (!isNaN(c)) {
      this.href!.fragment! += utf8PercentEncodeCodePoint(
        c,
        isFragmentPercentEncode
      );
    }
    return true;
  }
}

export function basicHrefParse(
  input: string,
  options?: {
    base?: HrefContext;
    href?: HrefContext;
    stateOverride?: ParsingState;
  }
): null | HrefContext {
  if (!options) {
    options = {};
  }
  const hsm = new HrefStateMachine(input, options);
  if (hsm.failure) {
    return null;
  }
  return hsm.href!;
}

export function serializeHref(href: HrefContext): string {
  let output = '';
  output += href.path.join('/');
  if (href.query) {
    output += '?' + href.query;
  }
  if (href.fragment) {
    output += '#' + href.fragment;
  }
  return output;
}

// https://stackoverflow.com/questions/62888860/typescript-error-regarding-uninitialized-variables-in-class-constructor
