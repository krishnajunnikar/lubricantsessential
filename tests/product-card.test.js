/**
 * Property-Based Test for Product Card Rendering
 *
 * Property 15: Product Card Rendering Completeness
 * For any valid product object, the rendered product card SHALL contain:
 * - An image element with data-src attribute and alt text containing product name and brand
 * - A brand badge element with the brand display name
 * - A heading (h3) with the product name
 * - A description paragraph with text ≤200 characters (with "..." if truncated)
 * - A CTA button/link element
 *
 * **Validates: Requirement 2.1**
 *
 * @jest-environment jsdom
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// Load products.js source code
const productsSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'products.js'),
  'utf-8'
);

// Remove 'use strict' directive so that function/var declarations leak to global scope
// when evaluated with eval() in non-strict mode (this test file intentionally omits 'use strict')
const sourceWithoutStrict = productsSource.replace(/^'use strict';?\s*/m, '');

// Evaluate in the current context — jsdom provides document/window globals,
// and without strict mode, function declarations become globally accessible.
eval(sourceWithoutStrict);

// --- Arbitraries for generating valid product objects ---

/**
 * Generates a valid brand identifier (one of the three supported brands).
 */
const brandArb = fc.constantFrom('kluber', 'chemetall', 'lawas');

/**
 * Brand display names matching the BRAND_NAMES constant in products.js.
 */
const BRAND_DISPLAY_NAMES = {
  kluber: 'Kluber Lubrication',
  chemetall: 'BASF Chemetall',
  lawas: 'Lawas Lube Specialties'
};

/**
 * Generates a non-empty alphanumeric string suitable for product names.
 * Avoids empty strings and very long strings.
 */
const productNameArb = fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0);

/**
 * Generates a slug-format product ID.
 */
const productIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,30}$/);

/**
 * Generates a product description of varying length (0 to 300 chars).
 * This allows testing both truncated and non-truncated descriptions.
 */
const descriptionArb = fc.string({ minLength: 0, maxLength: 300 });

/**
 * Generates a valid category slug.
 */
const categoryArb = fc.constantFrom(
  'specialty-greases', 'synthetic-oils', 'chain-oils', 'textile-lubricants',
  'metalworking-fluids', 'rust-preventives', 'cleaners',
  'industrial-greases', 'hydraulic-oils', 'gear-oils'
);

/**
 * Generates a valid image path string.
 */
const imagePathArb = fc.string({ minLength: 5, maxLength: 100 }).map(
  s => 'assets/images/products/' + s.replace(/[^a-z0-9-]/gi, 'x') + '.webp'
);

/**
 * Generates a complete valid product object conforming to the Product data model.
 */
const validProductArb = fc.record({
  id: productIdArb,
  name: productNameArb,
  brand: brandArb,
  category: categoryArb,
  description: descriptionArb,
  applications: fc.array(fc.string({ minLength: 1, maxLength: 40 }), { minLength: 1, maxLength: 5 }),
  industries: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  image: imagePathArb,
  specifications: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    fc.string({ minLength: 1, maxLength: 50 }),
    { minKeys: 1, maxKeys: 5 }
  )
});

// --- Property Tests ---

describe('Property 15: Product Card Rendering Completeness', () => {
  /**
   * **Validates: Requirement 2.1**
   *
   * For any valid product object (generated with fast-check), the rendered card
   * DOM element contains all required sub-elements:
   * 1. An image element with data-src attribute and alt text containing product name and brand
   * 2. A brand badge element with the brand display name
   * 3. A heading (h3) with the product name
   * 4. A description paragraph with text ≤200 characters (with "..." if truncated)
   * 5. A CTA button/link element
   */

  test('every valid product renders a card with image, brand badge, name, description ≤200 chars, and CTA', () => {
    fc.assert(
      fc.property(
        validProductArb,
        (product) => {
          // Render the product card
          const card = createProductCard(product);

          // 1. Image element with data-src and alt text (inside picture element for WebP with JPEG fallback)
          const picture = card.querySelector('picture');
          expect(picture).not.toBeNull();

          const img = picture.querySelector('img');
          expect(img).not.toBeNull();
          // The img data-src is the JPEG fallback path
          const expectedJpegPath = product.image.replace(/\.webp$/, '.jpg');
          expect(img.getAttribute('data-src')).toBe(expectedJpegPath);

          // The source element has data-srcset with WebP path
          const source = picture.querySelector('source[type="image/webp"]');
          expect(source).not.toBeNull();
          expect(source.getAttribute('data-srcset')).toContain(product.image);

          const altText = img.getAttribute('alt');
          expect(altText).not.toBeNull();
          expect(altText).toContain(product.name);
          expect(altText).toContain(BRAND_DISPLAY_NAMES[product.brand]);

          // 2. Brand badge with brand display name
          const badge = card.querySelector('.product-card__badge');
          expect(badge).not.toBeNull();
          expect(badge.textContent).toBe(BRAND_DISPLAY_NAMES[product.brand]);

          // 3. Heading (h3) with product name
          const title = card.querySelector('h3');
          expect(title).not.toBeNull();
          expect(title.textContent).toBe(product.name);

          // 4. Description paragraph with text ≤200 characters
          const desc = card.querySelector('.product-card__description');
          expect(desc).not.toBeNull();
          const descText = desc.textContent;

          if (product.description.length > 200) {
            // Should be truncated with "..."
            expect(descText.length).toBeLessThanOrEqual(203); // 200 + "..."
            expect(descText).toMatch(/\.\.\.$/);
          } else {
            // Should be the original description (or empty string if no description)
            expect(descText).toBe(product.description || '');
            expect(descText.length).toBeLessThanOrEqual(200);
          }

          // 5. CTA button/link element
          const cta = card.querySelector('.product-card__cta');
          expect(cta).not.toBeNull();
          expect(cta.tagName.toLowerCase()).toBe('a');
          expect(cta.getAttribute('href')).toBeTruthy();
          expect(cta.textContent.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('card image alt text follows format: "{name} - {brand display name}"', () => {
    fc.assert(
      fc.property(
        validProductArb,
        (product) => {
          const card = createProductCard(product);
          const img = card.querySelector('img');
          const expectedAlt = product.name + ' - ' + BRAND_DISPLAY_NAMES[product.brand];
          expect(img.getAttribute('alt')).toBe(expectedAlt);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('card CTA links to WhatsApp with product name in the URL', () => {
    fc.assert(
      fc.property(
        validProductArb,
        (product) => {
          const card = createProductCard(product);
          const cta = card.querySelector('.product-card__cta');
          const href = cta.getAttribute('href');

          // CTA should link to WhatsApp
          expect(href).toMatch(/^https:\/\/wa\.me\//);
          // The encoded URL should contain the product name (URL-encoded)
          expect(href).toContain(encodeURIComponent(product.name));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('description is never longer than 203 characters (200 + "...")', () => {
    fc.assert(
      fc.property(
        validProductArb,
        (product) => {
          const card = createProductCard(product);
          const desc = card.querySelector('.product-card__description');
          // Max possible length: 200 chars + "..." = 203
          expect(desc.textContent.length).toBeLessThanOrEqual(203);
        }
      ),
      { numRuns: 200 }
    );
  });
});
