/**
 * Property-Based Tests for Internal Link Integrity
 * 
 * Property 16: No Broken Internal Links — All internal navigation links resolve to existing HTML files
 * 
 * **Validates: Requirement 12.5**
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
 * Extracts all internal links (href attributes pointing to .html files) from HTML content.
 * Excludes external URLs (http://, https://), anchors (#), mailto:, tel:, javascript:, and whatsapp links.
 * @param {string} html - The HTML content
 * @returns {string[]} Array of internal link targets
 */
function extractInternalLinks(html) {
  const hrefRegex = /href=["']([^"']*?)["']/gi;
  const links = [];
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1].trim();

    // Skip empty hrefs
    if (!href || href === '') continue;

    // Skip external URLs
    if (/^https?:\/\//i.test(href)) continue;

    // Skip protocol-relative URLs
    if (href.startsWith('//')) continue;

    // Skip anchors (fragment-only links)
    if (href.startsWith('#')) continue;

    // Skip mailto: links
    if (href.startsWith('mailto:')) continue;

    // Skip tel: links
    if (href.startsWith('tel:')) continue;

    // Skip javascript: URIs
    if (href.startsWith('javascript:')) continue;

    // Only include links pointing to .html files
    // Strip any fragment identifier from the href
    const hrefWithoutFragment = href.split('#')[0];

    if (hrefWithoutFragment.endsWith('.html')) {
      links.push(hrefWithoutFragment);
    }
  }

  return links;
}

/**
 * Checks if a file exists in the site root directory.
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether the file exists
 */
function fileExistsInSiteRoot(filename) {
  const filePath = path.join(SITE_ROOT, filename);
  return fs.existsSync(filePath);
}

// --- Pre-load all page data ---

const allPageData = PAGES.map(page => {
  const html = readPage(page);
  const internalLinks = extractInternalLinks(html);
  return { page, html, internalLinks };
});

// --- Property Tests ---

describe('Property 16: No Broken Internal Links', () => {
  /**
   * **Validates: Requirement 12.5**
   * 
   * For any internal navigation link in the Website, the href target SHALL resolve
   * to an existing, valid HTML file with no 404 errors.
   */

  describe('All internal links resolve to existing HTML files', () => {
    test('for any page, all internal links point to existing HTML files', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, internalLinks } = allPageData[pageIndex];

            internalLinks.forEach(link => {
              const exists = fileExistsInSiteRoot(link);
              expect(exists).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — all internal links resolve to existing files', (page) => {
      const { internalLinks } = allPageData.find(p => p.page === page);
      const brokenLinks = internalLinks.filter(link => !fileExistsInSiteRoot(link));

      if (brokenLinks.length > 0) {
        fail(
          `Found ${brokenLinks.length} broken internal link(s) in ${page}:\n` +
          brokenLinks.map(link => `  → ${link} (file not found)`).join('\n')
        );
      }
    });
  });

  describe('Every page has at least one internal navigation link', () => {
    test('for any page, at least one internal link exists (site is interconnected)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, internalLinks } = allPageData[pageIndex];

            // Every page should have at least one internal link (navigation)
            expect(internalLinks.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Internal links only reference known site pages', () => {
    test('for any page, all internal .html links reference one of the 6 known pages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, internalLinks } = allPageData[pageIndex];

            internalLinks.forEach(link => {
              expect(PAGES).toContain(link);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — all internal links reference known pages', (page) => {
      const { internalLinks } = allPageData.find(p => p.page === page);
      const unknownLinks = internalLinks.filter(link => !PAGES.includes(link));

      if (unknownLinks.length > 0) {
        fail(
          `Found ${unknownLinks.length} link(s) to unknown pages in ${page}:\n` +
          unknownLinks.map(link => `  → ${link}`).join('\n')
        );
      }
    });
  });
});
