// The MIT License (MIT)
// Copyright (c) 2015–2016 Sebastian Mayr
// https://github.com/jsdom/whatwg-url/blob/6f873fb929/src/infra.js

// Note that we take code points as JS numbers, not JS strings.

function isASCIIDigit(c: number): boolean {
  return c >= 0x30 && c <= 0x39;
}

function isASCIIAlpha(c: number): boolean {
  return (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
}

function isASCIIAlphanumeric(c: number): boolean {
  return isASCIIAlpha(c) || isASCIIDigit(c);
}

function isASCIIHex(c: number): boolean {
  return (
    isASCIIDigit(c) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66)
  );
}

export { isASCIIDigit, isASCIIAlpha, isASCIIAlphanumeric, isASCIIHex };
