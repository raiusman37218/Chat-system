/**
 * Turns the raw strings we store on a visitor (user agent, "City, Country")
 * into the pieces the visitor panel shows: a browser and its version, an OS,
 * a device class, a country flag, and the visitor's own local time.
 *
 * Everything here degrades to null rather than guessing — an agent acting on a
 * wrong city or a wrong local time is worse off than one shown nothing.
 */

export type BrowserId =
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'safari'
  | 'opera'
  | 'samsung'
  | 'unknown';

export type OsId =
  | 'windows'
  | 'macos'
  | 'ios'
  | 'android'
  | 'linux'
  | 'chromeos'
  | 'unknown';

export type DeviceId = 'desktop' | 'mobile' | 'tablet';

export interface UserAgentInfo {
  browser: BrowserId;
  browserName: string;
  browserVersion: string | null;
  os: OsId;
  osName: string;
  osVersion: string | null;
  device: DeviceId;
}

const UNKNOWN_UA: UserAgentInfo = {
  browser: 'unknown',
  browserName: 'Unknown browser',
  browserVersion: null,
  os: 'unknown',
  osName: 'Unknown OS',
  osVersion: null,
  device: 'desktop',
};

function version(ua: string, pattern: RegExp): string | null {
  const m = ua.match(pattern);
  return m?.[1] ? m[1].split('.')[0] : null;
}

export function parseUserAgentDetailed(ua: string | null | undefined): UserAgentInfo {
  if (!ua) return UNKNOWN_UA;

  // Order matters: Edge and Opera both claim to be Chrome, and Chrome claims
  // to be Safari, so the most specific token has to win.
  let browser: BrowserId = 'unknown';
  let browserName = 'Unknown browser';
  let browserVersion: string | null = null;

  if (/Edg[A-Z]?\//.test(ua)) {
    browser = 'edge';
    browserName = 'Edge';
    browserVersion = version(ua, /Edg[A-Z]?\/([\d.]+)/);
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = 'opera';
    browserName = 'Opera';
    browserVersion = version(ua, /(?:OPR|Opera)\/([\d.]+)/);
  } else if (/SamsungBrowser\//.test(ua)) {
    browser = 'samsung';
    browserName = 'Samsung Internet';
    browserVersion = version(ua, /SamsungBrowser\/([\d.]+)/);
  } else if (/Firefox\/|FxiOS\//.test(ua)) {
    browser = 'firefox';
    browserName = 'Firefox';
    browserVersion = version(ua, /(?:Firefox|FxiOS)\/([\d.]+)/);
  } else if (/Chrome\/|CriOS\//.test(ua)) {
    browser = 'chrome';
    browserName = 'Chrome';
    browserVersion = version(ua, /(?:Chrome|CriOS)\/([\d.]+)/);
  } else if (/Safari\//.test(ua)) {
    browser = 'safari';
    browserName = 'Safari';
    browserVersion = version(ua, /Version\/([\d.]+)/);
  }

  let os: OsId = 'unknown';
  let osName = 'Unknown OS';
  let osVersion: string | null = null;

  if (/Windows NT/.test(ua)) {
    os = 'windows';
    osName = 'Windows';
    // Windows 11 is indistinguishable from 10 in the UA string, so report the
    // family rather than inventing a version.
    osVersion = /Windows NT 10/.test(ua) ? '10/11' : null;
  } else if (/Android/.test(ua)) {
    os = 'android';
    osName = 'Android';
    osVersion = version(ua, /Android ([\d.]+)/);
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    os = 'ios';
    osName = /iPad/.test(ua) ? 'iPadOS' : 'iOS';
    osVersion = version(ua, /OS ([\d_]+)/)?.replace(/_/g, '.') ?? null;
  } else if (/Mac OS X|Macintosh/.test(ua)) {
    os = 'macos';
    osName = 'macOS';
    osVersion = version(ua, /Mac OS X ([\d_]+)/)?.replace(/_/g, '.') ?? null;
  } else if (/CrOS/.test(ua)) {
    os = 'chromeos';
    osName = 'ChromeOS';
  } else if (/Linux/.test(ua)) {
    os = 'linux';
    osName = 'Linux';
  }

  const device: DeviceId = /iPad|Tablet/.test(ua)
    ? 'tablet'
    : /Mobi|Android|iPhone|iPod/.test(ua)
    ? 'mobile'
    : 'desktop';

  return { browser, browserName, browserVersion, os, osName, osVersion, device };
}

/* ------------------------------------------------------------------ country */

/**
 * Country names we can turn into a flag. Deliberately a lookup rather than a
 * clever heuristic: a wrong flag next to a customer's name looks careless.
 */
const COUNTRY_CODES: Record<string, string> = {
  afghanistan: 'AF', argentina: 'AR', australia: 'AU', austria: 'AT',
  bangladesh: 'BD', belgium: 'BE', brazil: 'BR', bulgaria: 'BG',
  canada: 'CA', chile: 'CL', china: 'CN', colombia: 'CO', croatia: 'HR',
  czechia: 'CZ', 'czech republic': 'CZ', denmark: 'DK', egypt: 'EG',
  estonia: 'EE', ethiopia: 'ET', finland: 'FI', france: 'FR', germany: 'DE',
  ghana: 'GH', greece: 'GR', 'hong kong': 'HK', hungary: 'HU', iceland: 'IS',
  india: 'IN', indonesia: 'ID', iran: 'IR', iraq: 'IQ', ireland: 'IE',
  israel: 'IL', italy: 'IT', japan: 'JP', jordan: 'JO', kazakhstan: 'KZ',
  kenya: 'KE', kuwait: 'KW', latvia: 'LV', lebanon: 'LB', lithuania: 'LT',
  luxembourg: 'LU', malaysia: 'MY', mexico: 'MX', morocco: 'MA',
  nepal: 'NP', netherlands: 'NL', 'new zealand': 'NZ', nigeria: 'NG',
  norway: 'NO', oman: 'OM', pakistan: 'PK', peru: 'PE', philippines: 'PH',
  poland: 'PL', portugal: 'PT', qatar: 'QA', romania: 'RO', russia: 'RU',
  'saudi arabia': 'SA', serbia: 'RS', singapore: 'SG', slovakia: 'SK',
  slovenia: 'SI', 'south africa': 'ZA', 'south korea': 'KR', korea: 'KR',
  spain: 'ES', 'sri lanka': 'LK', sweden: 'SE', switzerland: 'CH',
  taiwan: 'TW', tanzania: 'TZ', thailand: 'TH', tunisia: 'TN', turkey: 'TR',
  'türkiye': 'TR', uganda: 'UG', ukraine: 'UA', 'united arab emirates': 'AE',
  uae: 'AE', 'united kingdom': 'GB', uk: 'GB', england: 'GB',
  'united states': 'US', 'united states of america': 'US', usa: 'US',
  us: 'US', uruguay: 'UY', uzbekistan: 'UZ', venezuela: 'VE', vietnam: 'VN',
  yemen: 'YE', zimbabwe: 'ZW',
};

export function countryCodeFor(country: string | null | undefined): string | null {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key];
  // Already an ISO-3166 alpha-2 code.
  if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();
  return null;
}

/** ISO code → regional-indicator flag emoji. */
export function flagEmoji(code: string | null): string | null {
  if (!code || code.length !== 2) return null;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  );
}

export interface LocationInfo {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  flag: string | null;
  /** "Lahore, Pakistan" — whatever we can actually say. */
  label: string | null;
  /** True when the stored value is an IANA zone, not a real place. */
  isTimezoneOnly: boolean;
}

/**
 * The widget stores either "City, Country" from IP lookup, or — when that
 * lookup is blocked — the browser's IANA timezone as a fallback. Both arrive in
 * the same column, so they have to be told apart here.
 */
export function parseLocation(
  raw: string | null | undefined,
  city?: string | null,
  country?: string | null
): LocationInfo {
  let c = city?.trim() || null;
  let k = country?.trim() || null;

  const value = raw?.trim() || null;
  const looksLikeTimezone = !!value && value.includes('/') && !value.includes(',');

  if (!c && !k && value && !looksLikeTimezone) {
    const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      c = parts[0];
      k = parts[parts.length - 1];
    } else if (parts.length === 1) {
      k = parts[0];
    }
  }

  const countryCode = countryCodeFor(k);

  return {
    city: c,
    country: k,
    countryCode,
    flag: flagEmoji(countryCode),
    label: [c, k].filter(Boolean).join(', ') || null,
    isTimezoneOnly: looksLikeTimezone && !c && !k,
  };
}

/* --------------------------------------------------------------- local time */

/** Pulls an IANA timezone out of whatever we stored, if there is one. */
export function timezoneFrom(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  return value.includes('/') && !value.includes(',') ? value : null;
}

/**
 * The visitor's own wall-clock time. Returns null for an unknown zone rather
 * than silently falling back to the agent's clock, which would be misleading.
 */
export function localTimeIn(timezone: string | null): string | null {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    })
      .format(new Date())
      .toLowerCase()
      .replace(' ', '');
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- language */

/** "en-IN" → "English (India)", falling back to the raw tag. */
export function languageLabel(tag: string | null | undefined): string | null {
  if (!tag) return null;
  try {
    const [lang, region] = tag.split('-');
    const langName =
      new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) ?? lang;
    if (!region) return langName;
    const regionName =
      new Intl.DisplayNames(['en'], { type: 'region' }).of(region.toUpperCase()) ??
      region;
    return `${langName} (${regionName})`;
  } catch {
    return tag;
  }
}
