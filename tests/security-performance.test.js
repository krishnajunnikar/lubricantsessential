/**
 * Property-Based Tests for Security and Performance
 * 
 * Property 17: No Inline JavaScript — No inline scripts, no event handler attributes, no javascript: URIs
 * Property 18: Subresource Integrity on Third-Party Resources — All third-party scripts/stylesheets have integrity attribute
 * Property 19: All Scripts Deferred — All external script elements have defer attribute
 * 
 * **Validates: Requirements 10.6, 11.2, 11.4, 11.7**
 */

'use strict';

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// --- Constants ---

const SITE_ROOT = path.resolve(__dirname, '..');

const PAGES = [
  'index.html',
  'about.html',
  'products.html',
  'services.html',
  'industries.html',
  'contact.html'
];

// Inline event handler attributes that violate CSP
const EVENT_HANDLER_ATTRIBUTES = [
  'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
  'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
  'onkeydown', 'onkeypress', 'onkeyup',
  'onfocus', 'onblur', 'onchange', 'oninput', 'onsubmit', 'onreset',
  'onload', 'onunload', 'onerror', 'onresize', 'onscroll',
  'onabort', 'oncanplay', 'oncanplaythrough', 'ondurationchange',
  'onemptied', 'onended', 'onloadeddata', 'onloadedmetadata',
  'onloadstart', 'onpause', 'onplay', 'onplaying', 'onprogress',
  'onratechange', 'onseeked', 'onseeking', 'onstalled', 'onsuspend',
  'ontimeupdate', 'onvolumechange', 'onwaiting',
  'oncopy', 'oncut', 'onpaste', 'ondrag', 'ondragend', 'ondragenter',
  'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'oncontextmenu', 'onwheel', 'ontouchstart', 'ontouchend',
  'ontouchmove', 'ontouchcancel', 'onpointerdown', 'onpointerup',
  'onpointermove', 'onpointerover', 'onpointerout',
  'onpointerenter', 'onpointerleave', 'onpointercancel',
  'ongotpointercapture', 'onlostpointercapture',
  'onanimationstart', 'onanimationend', 'onanimationiteration',
  'ontransitionend', 'ontransitionstart', 'ontransitionrun', 'ontransitioncancel'
];

// --- Helper Functions ---

/**
 * Reads an HTML file and returns its content.
 * @param {string} filename - The HTML filename
 * @returns {string} The file content
 */
function readPage(filename) {
  const filePath = path.join(SITE_ROOT, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Extracts all <script> elements from HTML content.
 * @param {string} html - The HTML content
 * @returns {Array<{type: string|null, src: string|null, hasDefer: boolean, hasIntegrity: boolean, content: string, fullTag: string}>}
 */
function extractScripts(html) {
  // Match both self-closing and content-bearing script tags
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>|<script\b([^>]*)\/>/gi;
  const scripts = [];
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1] || match[3] || '';
    const content = match[2] || '';

    // Extract type attribute
    const typeMatch = attrs.match(/type=["']([^"']*)["']/i);
    const type = typeMatch ? typeMatch[1] : null;

    // Extract src attribute
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : null;

    // Check for defer attribute
    const hasDefer = /\bdefer\b/i.test(attrs);

    // Check for integrity attribute
    const integrityMatch = attrs.match(/integrity=["']([^"']*)["']/i);
    const hasIntegrity = !!integrityMatch;

    // Check for crossorigin attribute
    const hasCrossorigin = /\bcrossorigin\b/i.test(attrs);

    scripts.push({ type, src, hasDefer, hasIntegrity, hasCrossorigin, content: content.trim(), fullTag: match[0].substring(0, 200) });
  }

  return scripts;
}

/**
 * Extracts all <link> elements (stylesheets) from HTML content.
 * @param {string} html - The HTML content
 * @returns {Array<{rel: string|null, href: string|null, hasIntegrity: boolean, fullTag: string}>}
 */
function extractStylesheetLinks(html) {
  const linkRegex = /<link\b([^>]*)>/gi;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1];

    // Extract rel attribute
    const relMatch = attrs.match(/rel=["']([^"']*)["']/i);
    const rel = relMatch ? relMatch[1] : null;

    // Only process stylesheets
    if (rel !== 'stylesheet') continue;

    // Extract href attribute
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1] : null;

    // Check for integrity attribute
    const hasIntegrity = /integrity=["'][^"']+["']/i.test(attrs);

    // Check for crossorigin attribute
    const hasCrossorigin = /\bcrossorigin\b/i.test(attrs);

    links.push({ rel, href, hasIntegrity, hasCrossorigin, fullTag: match[0] });
  }

  return links;
}

/**
 * Checks if a URL is a third-party resource (not same-origin).
 * @param {string|null} url - The resource URL
 * @returns {boolean}
 */
function isThirdPartyUrl(url) {
  if (!url) return false;
  // Third-party URLs start with http:// or https:// and point to external domains
  return /^https?:\/\//i.test(url);
}

/**
 * Finds all inline event handler attributes in HTML content.
 * @param {string} html - The HTML content
 * @returns {Array<{attribute: string, element: string}>}
 */
function findInlineEventHandlers(html) {
  const violations = [];

  for (const handler of EVENT_HANDLER_ATTRIBUTES) {
    // Match the event handler attribute on any HTML element
    const regex = new RegExp(`<[a-z][^>]*\\s${handler}\\s*=`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      violations.push({
        attribute: handler,
        element: match[0].substring(0, 100)
      });
    }
  }

  return violations;
}

/**
 * Finds all javascript: URIs in HTML content.
 * @param {string} html - The HTML content
 * @returns {Array<{context: string}>}
 */
function findJavascriptUris(html) {
  const violations = [];
  // Match javascript: in href, src, action, or other URL attributes
  const regex = /(?:href|src|action|data|formaction)\s*=\s*["']javascript:/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    violations.push({
      context: html.substring(match.index, match.index + 80)
    });
  }

  return violations;
}

/**
 * Determines if a script is an inline executable script (not JSON-LD data).
 * @param {{type: string|null, src: string|null, content: string}} script
 * @returns {boolean}
 */
function isInlineExecutableScript(script) {
  // Scripts with src are external, not inline
  if (script.src) return false;

  // JSON-LD scripts are data, not executable
  if (script.type === 'application/ld+json') return false;

  // Scripts with type="application/json" or similar non-JS types are data
  if (script.type && !['text/javascript', 'module', 'application/javascript'].includes(script.type)) {
    return false;
  }

  // If it has content and no non-executable type, it's inline executable JS
  return script.content.length > 0;
}

/**
 * Determines if a script is an external script (has src attribute).
 * @param {{src: string|null}} script
 * @returns {boolean}
 */
function isExternalScript(script) {
  return script.src !== null && script.src.length > 0;
}

// --- Pre-load all page data ---

const allPageData = PAGES.map(page => {
  const html = readPage(page);
  const scripts = extractScripts(html);
  const stylesheetLinks = extractStylesheetLinks(html);
  const inlineEventHandlers = findInlineEventHandlers(html);
  const javascriptUris = findJavascriptUris(html);
  return { page, html, scripts, stylesheetLinks, inlineEventHandlers, javascriptUris };
});

// --- Property Tests ---

describe('Property 17: No Inline JavaScript', () => {
  /**
   * **Validates: Requirement 11.2**
   * 
   * For any HTML page in the Website, there SHALL be no inline script tags,
   * no inline event handler attributes (onclick, onload, onerror, etc.),
   * and no javascript: URIs.
   */

  describe('No inline executable script tags', () => {
    test('for any page, no script element contains inline executable JavaScript', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, scripts } = allPageData[pageIndex];
            const inlineScripts = scripts.filter(isInlineExecutableScript);

            expect(inlineScripts).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — no inline executable scripts', (page) => {
      const { scripts } = allPageData.find(p => p.page === page);
      const inlineScripts = scripts.filter(isInlineExecutableScript);

      if (inlineScripts.length > 0) {
        const details = inlineScripts.map(s => s.fullTag).join('\n');
        fail(`Found ${inlineScripts.length} inline executable script(s):\n${details}`);
      }
    });
  });

  describe('No inline event handler attributes', () => {
    test('for any page, no HTML element has inline event handler attributes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, inlineEventHandlers } = allPageData[pageIndex];

            expect(inlineEventHandlers).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — no inline event handlers', (page) => {
      const { inlineEventHandlers } = allPageData.find(p => p.page === page);

      if (inlineEventHandlers.length > 0) {
        const details = inlineEventHandlers.map(v => `${v.attribute}: ${v.element}`).join('\n');
        fail(`Found ${inlineEventHandlers.length} inline event handler(s):\n${details}`);
      }
    });
  });

  describe('No javascript: URIs', () => {
    test('for any page, no element uses a javascript: URI', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, javascriptUris } = allPageData[pageIndex];

            expect(javascriptUris).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — no javascript: URIs', (page) => {
      const { javascriptUris } = allPageData.find(p => p.page === page);

      if (javascriptUris.length > 0) {
        const details = javascriptUris.map(v => v.context).join('\n');
        fail(`Found ${javascriptUris.length} javascript: URI(s):\n${details}`);
      }
    });
  });
});

describe('Property 18: Subresource Integrity on Third-Party Resources', () => {
  /**
   * **Validates: Requirements 11.4, 11.7**
   * 
   * For any script or stylesheet loaded from a third-party origin,
   * the corresponding HTML element SHALL include a valid integrity attribute
   * with an SRI hash.
   */

  describe('Third-party scripts have integrity attributes', () => {
    test('for any page, all third-party scripts include integrity and crossorigin attributes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, scripts } = allPageData[pageIndex];
            const thirdPartyScripts = scripts.filter(s => isThirdPartyUrl(s.src));

            thirdPartyScripts.forEach(script => {
              expect(script.hasIntegrity).toBe(true);
              expect(script.hasCrossorigin).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — third-party scripts have SRI', (page) => {
      const { scripts } = allPageData.find(p => p.page === page);
      const thirdPartyScripts = scripts.filter(s => isThirdPartyUrl(s.src));

      const missingIntegrity = thirdPartyScripts.filter(s => !s.hasIntegrity);
      if (missingIntegrity.length > 0) {
        const details = missingIntegrity.map(s => s.fullTag).join('\n');
        fail(`Found ${missingIntegrity.length} third-party script(s) missing integrity attribute:\n${details}`);
      }
    });
  });

  describe('Third-party stylesheets have integrity attributes', () => {
    test('for any page, all third-party stylesheets include integrity and crossorigin attributes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, stylesheetLinks } = allPageData[pageIndex];
            const thirdPartyStyles = stylesheetLinks.filter(l => isThirdPartyUrl(l.href));

            thirdPartyStyles.forEach(link => {
              expect(link.hasIntegrity).toBe(true);
              expect(link.hasCrossorigin).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — third-party stylesheets have SRI', (page) => {
      const { stylesheetLinks } = allPageData.find(p => p.page === page);
      const thirdPartyStyles = stylesheetLinks.filter(l => isThirdPartyUrl(l.href));

      const missingIntegrity = thirdPartyStyles.filter(l => !l.hasIntegrity);
      if (missingIntegrity.length > 0) {
        const details = missingIntegrity.map(l => l.fullTag).join('\n');
        fail(`Found ${missingIntegrity.length} third-party stylesheet(s) missing integrity attribute:\n${details}`);
      }
    });
  });
});

describe('Property 19: All Scripts Deferred', () => {
  /**
   * **Validates: Requirement 10.6**
   * 
   * For any script element in the Website that loads an external JavaScript file,
   * the element SHALL include the defer attribute.
   */

  describe('All external scripts have defer attribute', () => {
    test('for any page, every external script element has the defer attribute', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, scripts } = allPageData[pageIndex];
            const externalScripts = scripts.filter(isExternalScript);

            externalScripts.forEach(script => {
              expect(script.hasDefer).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — all external scripts are deferred', (page) => {
      const { scripts } = allPageData.find(p => p.page === page);
      const externalScripts = scripts.filter(isExternalScript);

      const missingDefer = externalScripts.filter(s => !s.hasDefer);
      if (missingDefer.length > 0) {
        const details = missingDefer.map(s => `${s.src} — ${s.fullTag}`).join('\n');
        fail(`Found ${missingDefer.length} external script(s) missing defer attribute:\n${details}`);
      }
    });
  });
});
