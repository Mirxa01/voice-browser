import { describe, it, expect } from 'vitest';
import { isUrlAllowed, isNewTabPage, capTextLength, matchesWildcardPattern } from '../util';

describe('matchesWildcardPattern', () => {
  it('matches literal patterns without wildcards', () => {
    expect(matchesWildcardPattern('example.com', 'example.com')).toBe(true);
    expect(matchesWildcardPattern('example.com', 'example.org')).toBe(false);
  });

  it('treats * as any (possibly empty) sequence', () => {
    expect(matchesWildcardPattern('*', '')).toBe(true);
    expect(matchesWildcardPattern('*', 'anything/at/all')).toBe(true);
    expect(matchesWildcardPattern('a*', 'a')).toBe(true);
    expect(matchesWildcardPattern('*c', 'abc')).toBe(true);
    expect(matchesWildcardPattern('a*c', 'abbbbc')).toBe(true);
    expect(matchesWildcardPattern('a*c', 'abbbbd')).toBe(false);
  });

  it('supports multiple wildcards and collapses consecutive ones', () => {
    expect(matchesWildcardPattern('*.example.*', 'app.example.co.uk')).toBe(true);
    expect(matchesWildcardPattern('**example**', 'my-example-site')).toBe(true);
    expect(matchesWildcardPattern('a*b*c', 'axxbyyc')).toBe(true);
    expect(matchesWildcardPattern('a*b*c', 'axxcyyb')).toBe(false);
  });

  it('anchors the pattern to the whole value', () => {
    expect(matchesWildcardPattern('example.com', 'www.example.com')).toBe(false);
    expect(matchesWildcardPattern('example.com', 'example.com/path')).toBe(false);
  });

  it('terminates quickly on pathological patterns', () => {
    const pattern = `${'*a'.repeat(20)}*b`;
    const value = 'a'.repeat(2000);
    const start = Date.now();
    expect(matchesWildcardPattern(pattern, value)).toBe(false);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe('isUrlAllowed - dangerous schemes', () => {
  const dangerous = [
    'chrome://settings',
    'chrome-extension://abcdef/page.html',
    'javascript:alert(1)',
    'data:text/html,<h1>hi</h1>',
    'file:///etc/passwd',
    'vbscript:msgbox(1)',
    'ws://example.com/socket',
    'wss://example.com/socket',
    'https://chromewebstore.google.com/detail/foo',
  ];

  it.each(dangerous)('always blocks %s even with an empty firewall', url => {
    expect(isUrlAllowed(url, [], [])).toBe(false);
  });

  it('blocks dangerous schemes even when explicitly allow listed', () => {
    expect(isUrlAllowed('chrome://settings', ['chrome://settings', '*'], [])).toBe(false);
  });

  it('is case insensitive when detecting dangerous schemes', () => {
    expect(isUrlAllowed('JavaScript:alert(1)', [], [])).toBe(false);
    expect(isUrlAllowed('CHROME://settings', [], [])).toBe(false);
  });
});

describe('isUrlAllowed - basic policy', () => {
  it('allows everything when both lists are empty', () => {
    expect(isUrlAllowed('https://example.com', [], [])).toBe(true);
  });

  it('rejects empty or blank urls', () => {
    expect(isUrlAllowed('', [], [])).toBe(false);
    expect(isUrlAllowed('   ', [], [])).toBe(false);
  });

  it('rejects malformed urls when the firewall is active', () => {
    expect(isUrlAllowed('not a url', ['example.com'], [])).toBe(false);
  });

  it('always allows about:blank when the firewall is active', () => {
    expect(isUrlAllowed('about:blank', ['example.com'], [])).toBe(true);
  });

  it('allows non-denied urls when the allow list is empty', () => {
    expect(isUrlAllowed('https://example.com', [], ['blocked.com'])).toBe(true);
    expect(isUrlAllowed('https://blocked.com', [], ['blocked.com'])).toBe(false);
  });

  it('blocks urls that are not on a non-empty allow list', () => {
    expect(isUrlAllowed('https://other.com', ['example.com'], [])).toBe(false);
    expect(isUrlAllowed('https://example.com', ['example.com'], [])).toBe(true);
  });
});

describe('isUrlAllowed - domain matching', () => {
  it('matches subdomains of a bare domain entry', () => {
    expect(isUrlAllowed('https://app.example.com/dashboard', ['example.com'], [])).toBe(true);
    expect(isUrlAllowed('https://a.b.example.com', ['example.com'], [])).toBe(true);
  });

  it('does not match domains that merely share a suffix', () => {
    expect(isUrlAllowed('https://notexample.com', ['example.com'], [])).toBe(false);
    expect(isUrlAllowed('https://example.com.evil.io', ['example.com'], [])).toBe(false);
  });

  it('matches an exact url entry including its path', () => {
    expect(isUrlAllowed('https://example.com/docs', ['example.com/docs'], [])).toBe(true);
  });

  it('ignores the port when matching a domain', () => {
    expect(isUrlAllowed('http://localhost:3000/app', ['localhost'], [])).toBe(true);
  });

  it('matches IPv6 hosts', () => {
    expect(isUrlAllowed('http://[::1]:8080/app', ['::1'], [])).toBe(true);
    expect(isUrlAllowed('http://[::1]:8080/app', ['example.com'], [])).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isUrlAllowed('https://EXAMPLE.com/PATH', ['example.com'], [])).toBe(true);
  });
});

describe('isUrlAllowed - deny list priority', () => {
  it('blocks a denied domain even when the same domain is allow listed', () => {
    expect(isUrlAllowed('https://example.com', ['example.com'], ['example.com'])).toBe(false);
  });

  it('blocks a denied domain even when a specific url is allow listed', () => {
    expect(isUrlAllowed('https://example.com/docs', ['example.com/docs'], ['example.com'])).toBe(false);
  });

  it('blocks denied subdomains while allowing the rest of the domain', () => {
    expect(isUrlAllowed('https://admin.example.com', ['example.com'], ['admin.example.com'])).toBe(false);
    expect(isUrlAllowed('https://www.example.com', ['example.com'], ['admin.example.com'])).toBe(true);
  });
});

describe('isUrlAllowed - wildcards', () => {
  it('matches every subdomain with *.domain', () => {
    expect(isUrlAllowed('https://app.example.com', ['*.example.com'], [])).toBe(true);
    expect(isUrlAllowed('https://a.b.example.com/path?q=1', ['*.example.com'], [])).toBe(true);
  });

  it('does not match the apex domain with *.domain', () => {
    expect(isUrlAllowed('https://example.com', ['*.example.com'], [])).toBe(false);
  });

  it('supports path wildcards', () => {
    expect(isUrlAllowed('https://example.com/admin/users', ['example.com/admin/*'], [])).toBe(true);
    expect(isUrlAllowed('https://example.com/public', ['example.com/admin/*'], [])).toBe(false);
  });

  it('supports wildcards in the deny list', () => {
    expect(isUrlAllowed('https://tracker.ads.example.com', ['example.com'], ['*.ads.example.com'])).toBe(false);
    expect(isUrlAllowed('https://www.example.com', ['example.com'], ['*.ads.example.com'])).toBe(true);
  });

  it('blocks a denied path while allowing the rest of the domain', () => {
    expect(isUrlAllowed('https://example.com/admin/secret', ['example.com'], ['example.com/admin/*'])).toBe(false);
    expect(isUrlAllowed('https://example.com/blog', ['example.com'], ['example.com/admin/*'])).toBe(true);
  });

  it('supports a wildcard TLD', () => {
    expect(isUrlAllowed('https://example.co.uk', ['example.*'], [])).toBe(true);
    expect(isUrlAllowed('https://example.io/path', ['example.*'], [])).toBe(true);
  });

  it('supports a catch-all allow entry without bypassing the deny list', () => {
    expect(isUrlAllowed('https://anything.dev/x', ['*'], [])).toBe(true);
    expect(isUrlAllowed('https://blocked.com', ['*'], ['blocked.com'])).toBe(false);
  });

  it('ignores empty entries', () => {
    expect(isUrlAllowed('https://example.com', ['', 'example.com'], [''])).toBe(true);
  });
});

describe('isNewTabPage', () => {
  it('detects new tab pages', () => {
    expect(isNewTabPage('about:blank')).toBe(true);
    expect(isNewTabPage('chrome://new-tab-page')).toBe(true);
    expect(isNewTabPage('chrome://new-tab-page/')).toBe(true);
  });

  it('rejects regular pages', () => {
    expect(isNewTabPage('https://example.com')).toBe(false);
  });
});

describe('capTextLength', () => {
  it('leaves short text untouched', () => {
    expect(capTextLength('hello', 10)).toBe('hello');
  });

  it('truncates long text and appends an ellipsis', () => {
    expect(capTextLength('hello world', 5)).toBe('hello...');
  });
});
