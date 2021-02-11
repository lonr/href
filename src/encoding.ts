// // The MIT License (MIT)
// Copyright (c) 2015–2016 Sebastian Mayr
// https://github.com/jsdom/whatwg-url/blob/6f873fb929/src/encoding.js

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8');

function utf8Encode(string: string): Uint8Array {
  return utf8Encoder.encode(string);
}

function utf8Decode(bytes: BufferSource): string {
  return utf8Decoder.decode(bytes);
}

export { utf8Encode, utf8Decode };
