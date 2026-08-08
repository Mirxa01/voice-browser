/**
 * Matches a value against a glob pattern where `*` matches any (possibly empty)
 * sequence of characters.
 *
 * Implemented with a linear two-pointer scan rather than a compiled `RegExp` so
 * that user supplied patterns such as `*a*a*a*a*b` cannot trigger catastrophic
 * backtracking.
 *
 * @param pattern The glob pattern, already normalized to lower case
 * @param value The value to test, already normalized to lower case
 * @returns True when the whole value is matched by the pattern
 */
export function matchesWildcardPattern(pattern: string, value: string): boolean {
  let patternIndex = 0;
  let valueIndex = 0;
  let lastStarIndex = -1;
  let lastMatchIndex = 0;

  while (valueIndex < value.length) {
    if (patternIndex < pattern.length && pattern[patternIndex] === value[valueIndex]) {
      patternIndex++;
      valueIndex++;
    } else if (patternIndex < pattern.length && pattern[patternIndex] === '*') {
      lastStarIndex = patternIndex;
      lastMatchIndex = valueIndex;
      patternIndex++;
    } else if (lastStarIndex !== -1) {
      // Backtrack to the most recent `*` and let it consume one more character
      patternIndex = lastStarIndex + 1;
      lastMatchIndex++;
      valueIndex = lastMatchIndex;
    } else {
      return false;
    }
  }

  // Any trailing `*` in the pattern can match the empty string
  while (patternIndex < pattern.length && pattern[patternIndex] === '*') {
    patternIndex++;
  }

  return patternIndex === pattern.length;
}

/**
 * Checks whether a single firewall entry matches the given URL.
 *
 * Entries without a wildcard keep the historical semantics:
 *  - an exact match on the URL with the protocol stripped, or
 *  - a domain match, which also covers every subdomain of that domain.
 *
 * Entries containing `*` are treated as glob patterns and are matched against
 * both the protocol-less URL and the bare domain, so `*.example.com` matches
 * `https://app.example.com/path` while `example.com/admin/*` only matches that
 * path prefix.
 *
 * @param entry The normalized firewall list entry
 * @param urlWithoutProtocol The lower case URL with the `http(s)://` prefix removed
 * @param domain The lower case hostname of the URL
 * @returns True if the entry matches the URL
 */
function matchesFirewallEntry(entry: string, urlWithoutProtocol: string, domain: string): boolean {
  if (entry.length === 0) {
    return false;
  }

  if (entry.includes('*')) {
    return matchesWildcardPattern(entry, urlWithoutProtocol) || matchesWildcardPattern(entry, domain);
  }

  if (urlWithoutProtocol === entry) {
    return true;
  }

  return domain === entry || domain.endsWith(`.${entry}`);
}

/**
 * Checks if a URL is allowed based on firewall configuration
 * @param url The URL to check
 * @param allowList The allow list
 * @param denyList The deny list
 * @returns True if the URL is allowed, false otherwise
 */
export function isUrlAllowed(url: string, allowList: string[], denyList: string[]): boolean {
  // Normalize and validate input
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return false;
  }

  const lowerCaseUrl = trimmedUrl.toLowerCase();

  // ALWAYS block dangerous/forbidden URLs, even if firewall is disabled
  const DANGEROUS_PREFIXES = [
    'https://chromewebstore.google.com', // scripts are not allowed to be injected into chrome web store
    'chrome-extension://',
    'chrome://',
    'javascript:',
    'data:',
    'file:',
    'vbscript:',
    'ws:',
    'wss:',
  ];

  if (DANGEROUS_PREFIXES.some(prefix => lowerCaseUrl.startsWith(prefix))) {
    return false;
  }

  // If firewall is disabled, allow all other URLs
  if (allowList.length === 0 && denyList.length === 0) {
    return true;
  }

  // Special case: Allow 'about:blank' explicitly
  if (trimmedUrl === 'about:blank') {
    return true;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);

    // 1. Remove protocol prefix for further comparisons
    const urlWithoutProtocol = lowerCaseUrl.replace(/^https?:\/\//, '');

    // 2. Extract domain for domain-based checks.
    //    `URL.hostname` never contains the port; IPv6 hosts are bracketed, so strip them.
    const domain = parsedUrl.hostname.toLowerCase().replace(/^\[(.*)\]$/, '$1');

    // 3. Deny list takes priority over the allow list
    for (const deniedEntry of denyList) {
      if (matchesFirewallEntry(deniedEntry, urlWithoutProtocol, domain)) {
        return false;
      }
    }

    // 4. Check the allow list
    for (const allowedEntry of allowList) {
      if (matchesFirewallEntry(allowedEntry, urlWithoutProtocol, domain)) {
        return true;
      }
    }

    // Default policy
    return allowList.length === 0;
  } catch {
    // Invalid URL format - deny by default
    return false;
  }
}

// Check if a URL is a new tab page (about:blank or chrome://new-tab-page).
export function isNewTabPage(url: string): boolean {
  return url === 'about:blank' || url === 'chrome://new-tab-page' || url === 'chrome://new-tab-page/';
}

export function capTextLength(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}
