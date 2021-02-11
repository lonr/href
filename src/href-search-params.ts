// The MIT License (MIT)
// Copyright (c) 2015–2016 Sebastian Mayr
// https://github.com/jsdom/whatwg-url/blob/master/src/URLSearchParams-impl.js
// Copyright (c) 2021 lonr

import Href from './href';

export class HrefSearchParams extends URLSearchParams {
  _href: Href | null = null;
  constructor(
    init?: string | URLSearchParams | string[][] | Record<string, string>
  ) {
    super(init);
  }

  _updateSteps(): void {
    if (this._href !== null) {
      let query: string | null = super.toString();
      if (query === '') {
        query = null;
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._href._href!.query = query;
    }
  }

  append(name: string, value: string): void {
    super.append(name, value);
    this._updateSteps();
  }

  delete(name: string): void {
    super.delete(name);
    this._updateSteps();
  }

  set(name: string, value: string): void {
    super.set(name, value);
    this._updateSteps();
  }

  sort(): void {
    super.sort();
    this._updateSteps();
  }
}
