// The MIT License (MIT)
// Copyright (c) 2015–2016 Sebastian Mayr
// https://github.com/jsdom/whatwg-url/blob/6f873fb929/src/percent-encoding.js

import { isASCIIHex } from './infra';
import { utf8Encode } from './encoding';

function p(char: string) {
  return char.codePointAt(0);
}

// https://url.spec.whatwg.org/#percent-decode
function percentDecodeBytes(input: Uint8Array): Uint8Array {
  const output = new Uint8Array(input.byteLength);
  let outputIndex = 0;
  for (let i = 0; i < input.byteLength; ++i) {
    const byte = input[i];
    if (byte !== 0x25) {
      output[outputIndex++] = byte;
    } else if (
      byte === 0x25 &&
      (!isASCIIHex(input[i + 1]) || !isASCIIHex(input[i + 2]))
    ) {
      output[outputIndex++] = byte;
    } else {
      const bytePoint = parseInt(
        String.fromCodePoint(input[i + 1], input[i + 2]),
        16
      );
      output[outputIndex++] = bytePoint;
      i += 2;
    }
  }
  // http://shockry.blogspot.com/2017/04/javascript-typed-arrays-slice-vs.html
  return output.slice(0, outputIndex);
}

// https://url.spec.whatwg.org/#string-percent-decode
function percentDecodeString(input: string): Uint8Array {
  const bytes = utf8Encode(input);
  return percentDecodeBytes(bytes);
}

// https://url.spec.whatwg.org/#c0-control-percent-encode-set
function isC0ControlPercentEncode(c: number): boolean {
  return c <= 0x1f || c > 0x7e;
}

// https://url.spec.whatwg.org/#fragment-percent-encode-set
const extraFragmentPercentEncodeSet = new Set([
  p(' '),
  p('"'),
  p('<'),
  p('>'),
  p('`'),
]);
function isFragmentPercentEncode(c: number): boolean {
  return isC0ControlPercentEncode(c) || extraFragmentPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#query-percent-encode-set
const extraQueryPercentEncodeSet = new Set([
  p(' '),
  p('"'),
  p('#'),
  p('<'),
  p('>'),
]);
function isQueryPercentEncode(c: number): boolean {
  return isC0ControlPercentEncode(c) || extraQueryPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#special-query-percent-encode-set
function isSpecialQueryPercentEncode(c: number): boolean {
  return isQueryPercentEncode(c) || c === p("'");
}

// https://url.spec.whatwg.org/#path-percent-encode-set
const extraPathPercentEncodeSet = new Set([p('?'), p('`'), p('{'), p('}')]);
function isPathPercentEncode(c: number): boolean {
  return isQueryPercentEncode(c) || extraPathPercentEncodeSet.has(c);
}

// path segments may contains U+002f `/`
function isPathSegmentPercentEncode(c: number): boolean {
  return isPathPercentEncode(c) || c === p('/');
}

// https://url.spec.whatwg.org/#userinfo-percent-encode-set
const extraUserinfoPercentEncodeSet = new Set([
  p('/'),
  p(':'),
  p(';'),
  p('='),
  p('@'),
  p('['),
  p('\\'),
  p(']'),
  p('^'),
  p('|'),
]);
function isUserinfoPercentEncode(c: number): boolean {
  return isPathPercentEncode(c) || extraUserinfoPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#component-percent-encode-set
const extraComponentPercentEncodeSet = new Set([
  p('$'),
  p('%'),
  p('&'),
  p('+'),
  p(','),
]);
function isComponentPercentEncode(c: number): boolean {
  return isUserinfoPercentEncode(c) || extraComponentPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#application-x-www-form-urlencoded-percent-encode-set
const extraURLEncodedPercentEncodeSet = new Set([
  p('!'),
  p("'"),
  p('('),
  p(')'),
  p('~'),
]);
function isURLEncodedPercentEncode(c: number): boolean {
  return isComponentPercentEncode(c) || extraURLEncodedPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#percent-encode
function percentEncode(c: number) {
  let hex = c.toString(16).toUpperCase();
  if (hex.length === 1) {
    hex = '0' + hex;
  }

  return '%' + hex;
}

// https://url.spec.whatwg.org/#code-point-percent-encode-after-encoding
// https://url.spec.whatwg.org/#utf-8-percent-encode
// Assuming encoding is always utf-8 allows us to trim one of the logic branches. TODO: support encoding.
// The "-Internal" variant here has code points as JS strings. The external version used by other files has code points
// as JS numbers, like the rest of the codebase.
function utf8PercentEncodeCodePointInternal(
  char: string,
  percentEncodePredicate: (byte: number) => boolean
) {
  const bytes = utf8Encode(char);
  let output = '';
  for (const byte of bytes) {
    // Our percentEncodePredicate operates on bytes, not code points, so this is slightly different from the spec.
    if (!percentEncodePredicate(byte)) {
      output += String.fromCharCode(byte);
    } else {
      output += percentEncode(byte);
    }
  }

  return output;
}

function utf8PercentEncodeCodePoint(
  codePoint: number,
  percentEncodePredicate: (byte: number) => boolean
): string {
  return utf8PercentEncodeCodePointInternal(
    String.fromCodePoint(codePoint),
    percentEncodePredicate
  );
}

// https://url.spec.whatwg.org/#string-percent-encode-after-encoding
// https://url.spec.whatwg.org/#string-utf-8-percent-encode
function utf8PercentEncodeString(
  input: string,
  percentEncodePredicate: (byte: number) => boolean,
  spaceAsPlus = false
): string {
  let output = '';
  for (const char of input) {
    if (spaceAsPlus && char === ' ') {
      output += '+';
    } else {
      output += utf8PercentEncodeCodePointInternal(
        char,
        percentEncodePredicate
      );
    }
  }
  return output;
}

export {
  isC0ControlPercentEncode,
  isFragmentPercentEncode,
  isQueryPercentEncode,
  isSpecialQueryPercentEncode,
  isPathPercentEncode,
  isPathSegmentPercentEncode,
  isUserinfoPercentEncode,
  isURLEncodedPercentEncode,
  percentDecodeString,
  percentDecodeBytes,
  utf8PercentEncodeString,
  utf8PercentEncodeCodePoint,
};
