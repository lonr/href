[Exposed=(Window,Worker),
 LegacyWindowAlias=webkitURL]
interface RelativeURL {
  constructor(USVString url, optional USVString base);

  stringifier attribute USVString href;
  attribute USVString pathname;
  attribute USVString search;
  [SameObject] readonly attribute URLSearchParams searchParams;
  attribute USVString hash;

  USVString toJSON();
};
