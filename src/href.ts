// The MIT License (MIT)
// Copyright (c) 2015–2016 Sebastian Mayr
// https://github.com/jsdom/whatwg-url/blob/6f873fb929/src/URL-impl.js
// Copyright (c) 2021 lonr
import {
  HrefContext,
  basicHrefParse,
  serializeHref,
} from './href-state-machine';
import { HrefSearchParams } from './href-search-params';

export default class Href {
  /// internally used only
  _href: HrefContext | null = null;

  private _isImplicitScheme = false;
  private _url: URL | null = null;

  private _query: HrefSearchParams | null = null;

  constructor(href?: { toString(): string }, base?: { toString(): string }) {
    const hrefStr = href?.toString() ?? '';
    const baseStr = base?.toString();

    let parsedHref: HrefContext | null = null;
    let parsedBase: HrefContext | null = null;
    // try to use `URL`
    try {
      // prevent Chrome from parsing `new URL('#abc')`
      if (baseStr === undefined && hrefStr.startsWith('#')) {
        throw 'e';
      }
      this._url = new URL(hrefStr, baseStr);
    } catch (error) {
      // with a base
      if (baseStr !== undefined) {
        parsedBase = basicHrefParse(baseStr);
        if (parsedBase === null) {
          throw new TypeError(`Invalid base Href: ${baseStr}`);
        }
        if (parsedBase.mayBeImplicitScheme) {
          // try to delegate to `URL` as a implicit scheme
          try {
            this._url = new URL(hrefStr, `https:${baseStr}`);
            this._isImplicitScheme = true;
            try {
              this._url = new URL(hrefStr);
              this._isImplicitScheme = false;
            } catch (error) {
              // nothing to do
            }
            return this;
          } catch (error) {
            // then try to parse the base as a path
            parsedBase = basicHrefParse(baseStr, {
              stateOverride: 'path like a implicit scheme',
            });
            if (parsedBase === null) {
              throw new TypeError(`Invalid base Href: ${baseStr}`);
            }
          }
        }
        parsedHref = basicHrefParse(hrefStr, { base: parsedBase });
        if (parsedHref === null) {
          throw new TypeError(`Invalid Href: ${hrefStr}`);
        }
        // without a base
      } else {
        parsedHref = basicHrefParse(hrefStr);
        if (parsedHref === null) {
          throw new TypeError(`Invalid Href: ${hrefStr}`);
        }
        if (parsedHref.mayBeImplicitScheme) {
          // try to delegate to `URL` as a implicit scheme
          try {
            this._url = new URL(`https:${hrefStr}`);
            this._isImplicitScheme = true;
            return this;
          } catch (error) {
            // then try to parse the base as a path
            parsedHref = basicHrefParse(hrefStr, {
              stateOverride: 'path like a implicit scheme',
            });
            if (parsedHref === null) {
              throw new TypeError(`Invalid Href: ${hrefStr}`);
            }
          }
        }
      }
      this._href = parsedHref;
      this._query = new HrefSearchParams(this._href.query ?? undefined);
      this._query._href = this;
    }
  }

  get href(): string {
    if (this._url) {
      if (this._isImplicitScheme) {
        return this._url.href.replace(/^https:/, '');
      } else {
        return this._url.href;
      }
    } else {
      return serializeHref(this._href!);
    }
  }

  set href(href: string) {
    let parsedHref: HrefContext | null = null;
    try {
      this._url = new URL(href);
      this._isImplicitScheme = false;
      this._href = null;
      this._query = null;
    } catch (error) {
      parsedHref = basicHrefParse(href);
      if (parsedHref === null) {
        throw new TypeError(`Invalid URL: ${href}`);
      }
      if (parsedHref.mayBeImplicitScheme) {
        // try to delegate to `URL` as a implicit scheme
        try {
          this._url = new URL(`https:${href}`);
          this._isImplicitScheme = true;
        } catch (error) {
          // then try to parse the base as a path
          parsedHref = basicHrefParse(href, {
            stateOverride: 'path like a implicit scheme',
          });
          if (parsedHref === null) {
            throw new TypeError(`Invalid Href: ${href}`);
          }
        }
      }
      this._href = parsedHref;
      this._query = new HrefSearchParams(this._href.query ?? undefined);
      this._query._href = this;
    }
  }

  get origin(): string {
    if (this._url !== null) {
      if (this._isImplicitScheme) {
        return this._url.origin.replace(/^https:/, '');
      } else {
        return this._url.origin;
      }
    }
    return '';
  }

  get protocol(): string {
    if (this._url !== null) {
      if (this._isImplicitScheme) {
        return '';
      } else {
        return this._url.protocol;
      }
    }
    return '';
  }

  set protocol(protocol: string) {
    if (this._url !== null) {
      if (
        (protocol === 'https' || protocol === 'http') &&
        this._isImplicitScheme
      ) {
        this._isImplicitScheme = false;
      }
      this._url.protocol = protocol;
    }
  }

  get username(): string {
    if (this._url !== null) {
      return this._url.username;
    }
    return '';
  }

  set username(username: string) {
    if (this._url !== null) {
      this._url.username = username;
    }
  }

  get password(): string {
    if (this._url !== null) {
      return this._url.password;
    }
    return '';
  }

  set password(password: string) {
    if (this._url !== null) {
      this._url.password = password;
    }
  }

  get host(): string {
    if (this._url !== null) {
      return this._url.host;
    }
    return '';
  }

  set host(host: string) {
    if (this._url !== null) {
      this._url.host = host;
    }
  }

  get hostname(): string {
    if (this._url !== null) {
      return this._url.hostname;
    }
    return '';
  }

  set hostname(hostname: string) {
    if (this._url !== null) {
      this._url.hostname = hostname;
    }
  }
  get port(): string {
    if (this._url !== null) {
      return this._url.port;
    }
    return '';
  }

  set port(port: string) {
    if (this._url !== null) {
      this._url.port = port;
    }
  }

  get pathname(): string {
    if (this._url !== null) {
      return this._url.pathname;
    }
    return this._href!.path.join('/');
  }

  set pathname(pathname: string) {
    if (this._url !== null) {
      this._url.pathname = pathname;
    } else {
      this._href!.path = [];
      if (pathname !== '') {
        basicHrefParse(pathname, {
          href: this._href!,
          stateOverride: 'path',
        });
      }
    }
  }

  get search(): string {
    if (this._url !== null) {
      return this._url.search;
    }
    const { query } = this._href!;
    if (query === null || query === '') {
      return '';
    }
    return '?' + query;
  }

  set search(search: string) {
    if (this._url !== null) {
      this._url.search = search;
    } else {
      if (search === '') {
        this._href!.query = null;
        this._query = new HrefSearchParams();
        this._query._href = this;
      } else {
        const input = search.startsWith('?') ? search.substring(1) : search;
        this._href!.query = '';
        basicHrefParse(input, { href: this._href!, stateOverride: 'query' });
        this._query = new HrefSearchParams(input);
        this._query._href = this;
      }
    }
  }

  get searchParams(): URLSearchParams {
    if (this._url !== null) {
      return this._url.searchParams;
    }
    return this._query!;
  }

  get hash(): string {
    if (this._url !== null) {
      return this._url.hash;
    }
    const { fragment } = this._href!;
    if (fragment === null || fragment === '') {
      return '';
    }
    return '#' + fragment;
  }

  set hash(hash: string) {
    if (this._url !== null) {
      this._url.hash = hash;
    } else {
      if (hash === '') {
        this._href!.fragment = null;
      } else {
        const input = hash.startsWith('#') ? hash.substring(1) : hash;
        this._href!.fragment = '';
        basicHrefParse(input, { href: this._href!, stateOverride: 'fragment' });
      }
    }
  }

  toString(): string {
    return this.href;
  }

  toJSON(): string {
    return this.href;
  }
}
