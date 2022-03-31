export class RelativeURL {
  /**
   * Creates a relative URL object. You may want the built-in URL API instead If you're working with full URLs (e.g. `https://example.com/foo`)
   * @param url A relative URL
   * @param base The base relative URL. Optional
   */
  constructor(url: string | RelativeURL, base?: string | RelativeURL);
  get href(): string;
  set href(href: string);
  get pathname(): string;
  set pathname(pathname: string);
  get search(): string;
  set search(search: string);
  get searchParams(): URLSearchParams;
  get hash(): string;
  set hash(hash: string);
  toString(): string;
  toJSON(): string;
}
