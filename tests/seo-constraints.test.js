/**
 * Property-Based Tests for SEO Constraints
 * 
 * Property 21: Meta Description Constraints — Title ≤60 chars, description 120-160 chars
 * Property 22: Local SEO City References — Each meta description includes ≥2 city names
 * 
 * Validates: Requirements 6.2, 6.6
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

const CITY_NAMES = [
  'Aurangabad',
  'Jalna',
  'Khamgaon',
  'Malkapur',
  'Burhanpur',
  'Latur',
  'Nanded'
];

// --- Helper Functions ---

/**
 * Reads an HTML file and extracts the meta title and description.
 * @param {string} filename - The HTML filename (e.g., 'index.html')
 * @returns {{ title: string, description: string }} The extracted meta values
 */
function extractPageMeta(filename) {
  const filePath = path.join(SITE_ROOT, filename);
  const html = fs.readFileSync(filePath, 'utf-8');

  // Extract <title> content
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract <meta name="description" content="...">
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']\s*\/?>/i);
  const description = descMatch ? descMatch[1].trim() : '';

  return { title, description };
}

/**
 * Counts how many city names from the list appear in a given text (case-insensitive).
 * @param {string} text - The text to search
 * @returns {string[]} Array of city names found
 */
function findCityReferences(text) {
  const lowerText = text.toLowerCase();
  return CITY_NAMES.filter(city => lowerText.includes(city.toLowerCase()));
}

// --- Property Tests ---

describe('Property 21: Meta Description Constraints', () => {
  /**
   * **Validates: Requirement 6.2**
   * 
   * For any page in the Website, the meta title SHALL not exceed 60 characters
   * and the meta description SHALL be between 120 and 160 characters in length.
   */

  // Pre-load all page meta data
  const allPageMeta = PAGES.map(page => ({
    page,
    ...extractPageMeta(page)
  }));

  test('for any page, meta title does not exceed 60 characters', () => {
    fc.assert(
      fc.property(
        // Generate an index into the pages array to test each page
        fc.integer({ min: 0, max: PAGES.length - 1 }),
        (pageIndex) => {
          const { page, title } = allPageMeta[pageIndex];

          // Title must not be empty
          expect(title.length).toBeGreaterThan(0);

          // Title must not exceed 60 characters
          expect(title.length).toBeLessThanOrEqual(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('for any page, meta description is between 120 and 160 characters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: PAGES.length - 1 }),
        (pageIndex) => {
          const { page, description } = allPageMeta[pageIndex];

          // Description must not be empty
          expect(description.length).toBeGreaterThan(0);

          // Description must be at least 120 characters
          expect(description.length).toBeGreaterThanOrEqual(120);

          // Description must not exceed 160 characters
          expect(description.length).toBeLessThanOrEqual(160);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Exhaustive check across all pages for clear reporting
  test.each(PAGES)('%s has meta title ≤60 characters', (page) => {
    const { title } = extractPageMeta(page);
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThanOrEqual(60);
  });

  test.each(PAGES)('%s has meta description between 120-160 characters', (page) => {
    const { description } = extractPageMeta(page);
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);
  });
});

describe('Property 22: Local SEO City References', () => {
  /**
   * **Validates: Requirement 6.6**
   * 
   * For any page in the Website, the meta description SHALL include at least
   * two city names from the list (Aurangabad, Jalna, Khamgaon, Malkapur,
   * Burhanpur, Latur, Nanded).
   */

  // Pre-load all page meta data
  const allPageMeta = PAGES.map(page => ({
    page,
    ...extractPageMeta(page)
  }));

  test('for any page, meta description includes at least 2 city names', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: PAGES.length - 1 }),
        (pageIndex) => {
          const { page, description } = allPageMeta[pageIndex];
          const citiesFound = findCityReferences(description);

          // Must include at least 2 city names
          expect(citiesFound.length).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Exhaustive check across all pages for clear reporting
  test.each(PAGES)('%s meta description includes ≥2 city names', (page) => {
    const { description } = extractPageMeta(page);
    const citiesFound = findCityReferences(description);

    expect(citiesFound.length).toBeGreaterThanOrEqual(2);
  });
});
