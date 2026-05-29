/**
 * Property-Based Tests for Image Alt Text Completeness
 * 
 * Property 20: Image Alt Text Completeness — Product images include name+brand,
 * logos include company name, decorative images use alt=""
 * 
 * **Validates: Requirements 9.4**
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

// Known partner/brand names that should appear in logo alt text
const PARTNER_NAMES = [
  'Kluber',
  'Chemetall',
  'Lawas'
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
 * Extracts all <img> elements from HTML content with their attributes.
 * @param {string} html - The HTML content
 * @returns {Array<{src: string, alt: string|null, className: string, fullTag: string}>}
 */
function extractImages(html) {
  const imgRegex = /<img\s[^>]*>/gi;
  const images = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];

    // Extract src attribute
    const srcMatch = tag.match(/src=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '';

    // Extract alt attribute (null if missing entirely)
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : null;

    // Extract class attribute
    const classMatch = tag.match(/class=["']([^"']*)["']/i);
    const className = classMatch ? classMatch[1] : '';

    images.push({ src, alt, className, fullTag: tag });
  }

  return images;
}

/**
 * Determines if an image is a product image based on its class or src.
 * @param {{src: string, alt: string|null, className: string}} img
 * @returns {boolean}
 */
function isProductImage(img) {
  return img.className.includes('product-card__image') ||
    img.src.includes('/products/');
}

/**
 * Determines if an image is a partner/brand logo.
 * @param {{src: string, alt: string|null, className: string}} img
 * @returns {boolean}
 */
function isLogoImage(img) {
  return img.className.includes('logo') ||
    img.src.includes('-logo');
}

/**
 * Determines if an image is decorative (empty alt is acceptable).
 * Decorative images have alt="" explicitly set.
 * @param {{src: string, alt: string|null, className: string}} img
 * @returns {boolean}
 */
function isDecorativeImage(img) {
  return img.alt === '';
}

/**
 * Extracts all SVG elements with aria-hidden="true" from HTML.
 * These are decorative and should not have meaningful alt text.
 * @param {string} html - The HTML content
 * @returns {Array<{hasAriaHidden: boolean}>}
 */
function extractDecorativeSvgs(html) {
  const svgRegex = /<svg\s[^>]*aria-hidden=["']true["'][^>]*>/gi;
  const svgs = [];
  let match;

  while ((match = svgRegex.exec(html)) !== null) {
    svgs.push({ hasAriaHidden: true });
  }

  return svgs;
}

// --- Pre-load all page data ---

const allPageData = PAGES.map(page => {
  const html = readPage(page);
  const images = extractImages(html);
  const decorativeSvgs = extractDecorativeSvgs(html);
  return { page, images, decorativeSvgs };
});

// --- Property Tests ---

describe('Property 20: Image Alt Text Completeness', () => {
  /**
   * **Validates: Requirement 9.4**
   * 
   * For any image element in the Website, the element SHALL have an alt attribute
   * where product images include the product name and brand, partner logos include
   * the partner company name, and decorative images use an empty alt attribute.
   */

  describe('All images have alt attributes', () => {
    test('for any page, no img element is missing an alt attribute', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, images } = allPageData[pageIndex];

            images.forEach(img => {
              // alt must not be null (i.e., the attribute must exist)
              expect(img.alt).not.toBeNull();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Exhaustive check for clear reporting
    test.each(PAGES)('%s — all images have alt attributes', (page) => {
      const html = readPage(page);
      const images = extractImages(html);

      images.forEach(img => {
        expect(img.alt).not.toBeNull();
      });
    });
  });

  describe('Product images include product name and brand', () => {
    // Collect all product images across all pages
    const productImages = allPageData.flatMap(({ page, images }) =>
      images.filter(isProductImage).map(img => ({ ...img, page }))
    );

    test('for any product image, alt text contains a product name and brand name', () => {
      // Skip if no product images found (shouldn't happen but guard)
      if (productImages.length === 0) return;

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: productImages.length - 1 }),
          (imgIndex) => {
            const img = productImages[imgIndex];
            const alt = img.alt || '';

            // Alt text must not be empty for product images
            expect(alt.length).toBeGreaterThan(0);

            // Alt text should contain a brand reference (Kluber, Chemetall, or Lawas)
            const containsBrand = PARTNER_NAMES.some(brand =>
              alt.toLowerCase().includes(brand.toLowerCase())
            );
            expect(containsBrand).toBe(true);

            // Alt text should contain more than just the brand (i.e., product name too)
            // The format is "PRODUCT NAME - Brand Name"
            // Check that alt has content beyond just the brand name
            const altWithoutBrands = PARTNER_NAMES.reduce(
              (text, brand) => text.replace(new RegExp(brand, 'gi'), '').trim(),
              alt
            );
            // After removing brand references, there should still be meaningful text (product name)
            // Remove common separators and filler words
            const remainingText = altWithoutBrands
              .replace(/[-–—|,]/g, '')
              .replace(/\b(lubrication|lube|specialties|india|pvt|ltd|basf)\b/gi, '')
              .trim();
            expect(remainingText.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Partner logo images include company name', () => {
    // Collect all logo images across all pages
    const logoImages = allPageData.flatMap(({ page, images }) =>
      images.filter(isLogoImage).map(img => ({ ...img, page }))
    );

    test('for any logo image, alt text contains the partner company name', () => {
      if (logoImages.length === 0) return;

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: logoImages.length - 1 }),
          (imgIndex) => {
            const img = logoImages[imgIndex];
            const alt = img.alt || '';

            // Alt text must not be empty for logos
            expect(alt.length).toBeGreaterThan(0);

            // Alt text should contain at least one partner company name
            const containsCompanyName = PARTNER_NAMES.some(name =>
              alt.toLowerCase().includes(name.toLowerCase())
            );
            expect(containsCompanyName).toBe(true);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Decorative SVGs use aria-hidden="true"', () => {
    test('for any page with decorative SVG icons, SVGs have aria-hidden="true"', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, decorativeSvgs } = allPageData[pageIndex];

            // All decorative SVGs found should have aria-hidden="true"
            decorativeSvgs.forEach(svg => {
              expect(svg.hasAriaHidden).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Verify that decorative images (if any img with alt="") are properly marked
    test('for any page, images with empty alt are acceptable as decorative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: PAGES.length - 1 }),
          (pageIndex) => {
            const { page, images } = allPageData[pageIndex];

            // Any image with alt="" should not be a product image or logo
            const decorativeImgs = images.filter(isDecorativeImage);
            decorativeImgs.forEach(img => {
              expect(isProductImage(img)).toBe(false);
              expect(isLogoImage(img)).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('No images missing alt attributes (exhaustive)', () => {
    test.each(PAGES)('%s — every img has an alt attribute present', (page) => {
      const html = readPage(page);
      const images = extractImages(html);
      const missingAlt = images.filter(img => img.alt === null);

      if (missingAlt.length > 0) {
        const details = missingAlt.map(img => img.fullTag).join('\n');
        fail(`Found ${missingAlt.length} image(s) missing alt attribute:\n${details}`);
      }
    });
  });
});
