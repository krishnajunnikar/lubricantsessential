/**
 * Property-Based Tests for Product Filtering
 *
 * Property 1: Product Filter Correctness
 * Property 2: Product Filter Idempotency
 * Property 3: Product Sort Order Invariant
 * Property 23: Filter Toggle Deselection
 *
 * Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.11
 */

'use strict';

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * @jest-environment jsdom
 */

// --- Load products.js into a sandbox to extract functions ---

let productCatalog, BRAND_PRIORITY, getAllProducts, filterProducts;

beforeAll(() => {
  const productsPath = path.resolve(__dirname, '..', 'js', 'products.js');
  const productsCode = fs.readFileSync(productsPath, 'utf-8');

  // Create a sandbox with minimal DOM stubs needed for the DOMContentLoaded listener
  const sandbox = {
    document: {
      addEventListener: function () {},
      createElement: function () {
        return {
          className: '',
          setAttribute: function () {},
          appendChild: function () {},
          textContent: '',
          innerHTML: ''
        };
      },
      querySelector: function () { return null; }
    },
    window: {},
    console: console
  };

  vm.createContext(sandbox);
  vm.runInContext(productsCode, sandbox);

  // Extract the globals we need
  productCatalog = sandbox.productCatalog;
  BRAND_PRIORITY = sandbox.BRAND_PRIORITY;
  getAllProducts = sandbox.getAllProducts;
  filterProducts = sandbox.filterProducts;
});

// --- Generators ---

/**
 * Generates a valid brand ID or null (no brand filter).
 */
const brandArb = fc.oneof(
  fc.constant('kluber'),
  fc.constant('chemetall'),
  fc.constant('lawas'),
  fc.constant(null)
);

/**
 * Generates a valid category ID or null (no category filter).
 * Categories are extracted dynamically from the product catalog.
 */
function getCategoryArb() {
  const allProducts = getAllProducts();
  const categories = [...new Set(allProducts.map(p => p.category))];
  return fc.oneof(
    ...categories.map(c => fc.constant(c)),
    fc.constant(null)
  );
}

// --- Property Tests ---

describe('Property 1: Product Filter Correctness', () => {
  /**
   * **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
   *
   * For any product dataset and any combination of brand filter (Kluber, Chemetall, Lawas, or none)
   * and category filter (any valid category or none), all products displayed by the Filter_Engine
   * SHALL belong to the selected brand AND the selected category. When either filter is null,
   * that dimension is unconstrained.
   */

  test('all returned products match the selected brand AND category filters', () => {
    fc.assert(
      fc.property(
        brandArb,
        getCategoryArb(),
        (brand, category) => {
          const results = filterProducts(brand, category);

          for (let i = 0; i < results.length; i++) {
            const product = results[i];

            // If brand filter is active, product must match
            if (brand !== null) {
              expect(product.brand).toBe(brand);
            }

            // If category filter is active, product must match
            if (category !== null) {
              expect(product.category).toBe(category);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('no matching products are excluded from results', () => {
    fc.assert(
      fc.property(
        brandArb,
        getCategoryArb(),
        (brand, category) => {
          const results = filterProducts(brand, category);
          const allProducts = getAllProducts();

          // Every product that matches both filters should be in results
          const expected = allProducts.filter(p => {
            const brandMatch = brand === null || p.brand === brand;
            const categoryMatch = category === null || p.category === category;
            return brandMatch && categoryMatch;
          });

          expect(results.length).toBe(expected.length);

          // Verify all expected products are present (by id)
          const resultIds = results.map(p => p.id);
          for (let i = 0; i < expected.length; i++) {
            expect(resultIds).toContain(expected[i].id);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('Property 2: Product Filter Idempotency', () => {
  /**
   * **Validates: Requirement 2.9**
   *
   * For any brand and category filter combination, calling filterProducts with the same
   * arguments multiple times SHALL produce identical output each time.
   */

  test('calling filterProducts with same arguments produces identical results', () => {
    fc.assert(
      fc.property(
        brandArb,
        getCategoryArb(),
        (brand, category) => {
          const result1 = filterProducts(brand, category);
          const result2 = filterProducts(brand, category);

          // Same length
          expect(result1.length).toBe(result2.length);

          // Same products in same order
          for (let i = 0; i < result1.length; i++) {
            expect(result1[i].id).toBe(result2[i].id);
            expect(result1[i].brand).toBe(result2[i].brand);
            expect(result1[i].category).toBe(result2[i].category);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('calling filterProducts three times still produces identical results', () => {
    fc.assert(
      fc.property(
        brandArb,
        getCategoryArb(),
        (brand, category) => {
          const result1 = filterProducts(brand, category);
          const result2 = filterProducts(brand, category);
          const result3 = filterProducts(brand, category);

          // All three calls produce same output
          expect(result1.map(p => p.id)).toEqual(result2.map(p => p.id));
          expect(result2.map(p => p.id)).toEqual(result3.map(p => p.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Product Sort Order Invariant', () => {
  /**
   * **Validates: Requirement 2.8**
   *
   * For any filtered product result set containing products from multiple brands,
   * the products SHALL be ordered by brand priority: all Kluber products before all
   * Chemetall products, and all Chemetall products before all Lawas products.
   */

  test('products are always sorted by brand priority (kluber < chemetall < lawas)', () => {
    fc.assert(
      fc.property(
        brandArb,
        getCategoryArb(),
        (brand, category) => {
          const results = filterProducts(brand, category);

          // Check that brand priority never decreases as we iterate
          for (let i = 1; i < results.length; i++) {
            const prevPriority = BRAND_PRIORITY[results[i - 1].brand];
            const currPriority = BRAND_PRIORITY[results[i].brand];

            // Current product's brand priority must be >= previous product's brand priority
            expect(currPriority).toBeGreaterThanOrEqual(prevPriority);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('when no brand filter is active, kluber products appear before chemetall, chemetall before lawas', () => {
    const results = filterProducts(null, null);

    let lastKluberIndex = -1;
    let firstChemetallIndex = Infinity;
    let lastChemetallIndex = -1;
    let firstLawasIndex = Infinity;

    for (let i = 0; i < results.length; i++) {
      if (results[i].brand === 'kluber') {
        lastKluberIndex = i;
      }
      if (results[i].brand === 'chemetall') {
        if (i < firstChemetallIndex) firstChemetallIndex = i;
        lastChemetallIndex = i;
      }
      if (results[i].brand === 'lawas') {
        if (i < firstLawasIndex) firstLawasIndex = i;
      }
    }

    // All kluber products come before any chemetall product
    if (lastKluberIndex >= 0 && firstChemetallIndex < Infinity) {
      expect(lastKluberIndex).toBeLessThan(firstChemetallIndex);
    }

    // All chemetall products come before any lawas product
    if (lastChemetallIndex >= 0 && firstLawasIndex < Infinity) {
      expect(lastChemetallIndex).toBeLessThan(firstLawasIndex);
    }
  });
});

describe('Property 23: Filter Toggle Deselection', () => {
  /**
   * **Validates: Requirement 2.11**
   *
   * Simulating toggle behavior: if activeBrand equals the selected brand, setting it to null
   * and re-filtering returns all products (or category-filtered products). This verifies that
   * deselecting a brand filter restores the unfiltered (or category-only-filtered) state.
   */

  test('deselecting brand filter returns all products (or category-filtered products)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('kluber', 'chemetall', 'lawas'),
        getCategoryArb(),
        (brand, category) => {
          // Simulate: user selects a brand filter
          const filteredWithBrand = filterProducts(brand, category);

          // Simulate: user clicks the same brand again (toggle deselection)
          // activeBrand becomes null
          const afterDeselect = filterProducts(null, category);

          // After deselection, results should match filtering with no brand
          // (i.e., all products matching the category, or all products if category is null)
          const allProducts = getAllProducts();
          const expectedAfterDeselect = allProducts.filter(p => {
            return category === null || p.category === category;
          });

          expect(afterDeselect.length).toBe(expectedAfterDeselect.length);

          // The deselected result should have MORE or EQUAL products than the brand-filtered result
          expect(afterDeselect.length).toBeGreaterThanOrEqual(filteredWithBrand.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('deselecting category filter returns all products (or brand-filtered products)', () => {
    fc.assert(
      fc.property(
        brandArb,
        fc.constantFrom(
          'specialty-greases', 'synthetic-oils', 'chain-oils', 'textile-lubricants',
          'metalworking-fluids', 'rust-preventives', 'cleaners',
          'industrial-greases', 'hydraulic-oils', 'gear-oils'
        ),
        (brand, category) => {
          // Simulate: user selects a category filter
          const filteredWithCategory = filterProducts(brand, category);

          // Simulate: user clicks the same category again (toggle deselection)
          // activeCategory becomes null
          const afterDeselect = filterProducts(brand, null);

          // After deselection, results should match filtering with no category
          const allProducts = getAllProducts();
          const expectedAfterDeselect = allProducts.filter(p => {
            return brand === null || p.brand === brand;
          });

          expect(afterDeselect.length).toBe(expectedAfterDeselect.length);

          // The deselected result should have MORE or EQUAL products than the category-filtered result
          expect(afterDeselect.length).toBeGreaterThanOrEqual(filteredWithCategory.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('deselecting both filters returns all products', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('kluber', 'chemetall', 'lawas'),
        fc.constantFrom(
          'specialty-greases', 'synthetic-oils', 'chain-oils', 'textile-lubricants',
          'metalworking-fluids', 'rust-preventives', 'cleaners',
          'industrial-greases', 'hydraulic-oils', 'gear-oils'
        ),
        (brand, category) => {
          // Start with both filters active
          const filteredBoth = filterProducts(brand, category);

          // Deselect both (toggle both off)
          const allResults = filterProducts(null, null);
          const allProducts = getAllProducts();

          // Should return all products
          expect(allResults.length).toBe(allProducts.length);

          // Filtered result should be subset of all results
          expect(allResults.length).toBeGreaterThanOrEqual(filteredBoth.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
