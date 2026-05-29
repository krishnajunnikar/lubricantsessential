/**
 * Lazy Loading Property-Based Tests - Essential Lubricants Website
 * Uses Jest + fast-check to verify universal properties of the lazy loading system.
 *
 * Property 13: Lazy Image Loading Trigger — Images with data-src load when within 50px of viewport
 * Property 14: Image Error Fallback — Failed images show branded placeholder
 * Property 24: Lazy Load Placeholder Prevents Layout Shift — Placeholder matches target dimensions
 *
 * Validates: Requirements 7.2, 7.4, 7.5, 7.6
 */

'use strict';

const fc = require('fast-check');

// Mock IntersectionObserver
let mockObserverInstances = [];

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observedElements = [];
    mockObserverInstances.push(this);
  }

  observe(element) {
    this.observedElements.push(element);
  }

  unobserve(element) {
    const index = this.observedElements.indexOf(element);
    if (index > -1) {
      this.observedElements.splice(index, 1);
    }
  }

  disconnect() {
    this.observedElements = [];
  }
}

beforeEach(() => {
  document.body.innerHTML = '';
  mockObserverInstances = [];
  global.IntersectionObserver = MockIntersectionObserver;
  window.IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  jest.resetModules();
});

function loadModule() {
  jest.resetModules();
  return require('../js/lazy-load.js');
}

// --- Generators ---

/**
 * Generates a valid image URL path (non-empty string resembling a file path).
 */
const arbImageSrc = fc.stringOf(
  fc.constantFrom(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_'
  ),
  { minLength: 1, maxLength: 30 }
).map(name => 'images/' + name + '.jpg');

/**
 * Generates a valid alt text string.
 */
const arbAltText = fc.stringOf(
  fc.constantFrom(
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ' ', '-'
  ),
  { minLength: 1, maxLength: 50 }
);

/**
 * Generates positive integer dimensions (width/height) for images.
 */
const arbDimension = fc.integer({ min: 1, max: 2000 });

/**
 * Generates a lazy image configuration object.
 */
const arbLazyImage = fc.record({
  src: arbImageSrc,
  alt: arbAltText,
  width: arbDimension,
  height: arbDimension
});

/**
 * Generates an array of lazy image configurations (1 to 10 images).
 */
const arbLazyImages = fc.array(arbLazyImage, { minLength: 1, maxLength: 10 });

// --- Helper Functions ---

/**
 * Creates a DOM img element with data-src, alt, width, height attributes.
 */
function createLazyImgElement(config) {
  const img = document.createElement('img');
  img.setAttribute('data-src', config.src);
  img.setAttribute('alt', config.alt);
  img.setAttribute('width', String(config.width));
  img.setAttribute('height', String(config.height));
  return img;
}

/**
 * Sets up the DOM with a container and lazy images.
 */
function setupDOM(imageConfigs) {
  const container = document.createElement('div');
  imageConfigs.forEach(config => {
    container.appendChild(createLazyImgElement(config));
  });
  document.body.appendChild(container);
  return container;
}

// --- Property 13: Lazy Image Loading Trigger ---
// *For any* image element with a data-src attribute that enters within 50px of the viewport,
// the Lazy_Loader SHALL set the src attribute to the data-src value, remove the data-src
// attribute, and stop observing that image.
// **Validates: Requirement 7.2**

describe('Property 13: Lazy Image Loading Trigger', () => {
  test('for any image with data-src, when intersection is triggered, src is set from data-src, data-src is removed, and image is unobserved', () => {
    fc.assert(
      fc.property(arbLazyImages, (imageConfigs) => {
        // Setup
        document.body.innerHTML = '';
        mockObserverInstances = [];
        const container = setupDOM(imageConfigs);

        const lazyLoad = loadModule();

        // Trigger DOMContentLoaded to initialize observer
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Verify observer was created with correct rootMargin (50px threshold)
        expect(mockObserverInstances.length).toBeGreaterThan(0);
        const observer = mockObserverInstances[0];
        expect(observer.options.rootMargin).toBe('50px');

        // Get all lazy images
        const images = container.querySelectorAll('img');

        // Simulate each image entering the viewport (intersecting)
        images.forEach((img, index) => {
          const originalDataSrc = img.getAttribute('data-src');

          // Simulate intersection entry
          observer.callback(
            [{ isIntersecting: true, target: img }],
            observer
          );

          // Property assertions:
          // 1. src is set to the original data-src value
          expect(img.src).toContain(originalDataSrc);

          // 2. data-src attribute is removed
          expect(img.getAttribute('data-src')).toBeNull();

          // 3. Image is unobserved (removed from observed list)
          expect(observer.observedElements).not.toContain(img);
        });
      }),
      { numRuns: 50 }
    );
  });

  test('for any image with data-src, when NOT intersecting, src is NOT set and data-src remains', () => {
    fc.assert(
      fc.property(arbLazyImages, (imageConfigs) => {
        // Setup
        document.body.innerHTML = '';
        mockObserverInstances = [];
        const container = setupDOM(imageConfigs);

        const lazyLoad = loadModule();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const observer = mockObserverInstances[0];
        const images = container.querySelectorAll('img');

        // Simulate each image NOT intersecting
        images.forEach((img) => {
          const originalDataSrc = img.getAttribute('data-src');

          observer.callback(
            [{ isIntersecting: false, target: img }],
            observer
          );

          // data-src should remain unchanged
          expect(img.getAttribute('data-src')).toBe(originalDataSrc);
          // src should not be set (or remain empty)
          expect(img.src).toBe('');
        });
      }),
      { numRuns: 50 }
    );
  });

  test('once an image is loaded via intersection, subsequent intersections have no effect', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        mockObserverInstances = [];
        const container = document.createElement('div');
        const img = createLazyImgElement(imageConfig);
        container.appendChild(img);
        document.body.appendChild(container);

        const lazyLoad = loadModule();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const observer = mockObserverInstances[0];

        // First intersection - loads the image
        observer.callback(
          [{ isIntersecting: true, target: img }],
          observer
        );

        const srcAfterFirstLoad = img.src;

        // Calling loadImage again should have no effect since data-src is removed
        lazyLoad.loadImage(img);

        // src should remain the same
        expect(img.src).toBe(srcAfterFirstLoad);
        expect(img.getAttribute('data-src')).toBeNull();
      }),
      { numRuns: 50 }
    );
  });
});

// --- Property 14: Image Error Fallback ---
// *For any* image that fails to load (triggers an error event), the Website SHALL display
// a branded placeholder image with the company name text instead of a broken image icon.
// **Validates: Requirement 7.5**

describe('Property 14: Image Error Fallback', () => {
  test('for any image that fails to load, a branded placeholder with company name replaces it', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        mockObserverInstances = [];
        const container = document.createElement('div');
        const img = createLazyImgElement(imageConfig);
        container.appendChild(img);
        document.body.appendChild(container);

        const lazyLoad = loadModule();

        // Simulate image error
        lazyLoad.handleImageError(img);

        // Property assertions:
        // 1. The original img element is no longer in the DOM
        expect(container.querySelector('img')).toBeNull();

        // 2. A branded placeholder is present
        const placeholder = container.querySelector('.lazy-placeholder--error');
        expect(placeholder).not.toBeNull();

        // 3. The placeholder contains the company name text
        const text = placeholder.querySelector('.lazy-placeholder__text');
        expect(text).not.toBeNull();
        expect(text.textContent).toBe('Essential Lubricants');
      }),
      { numRuns: 50 }
    );
  });

  test('for any image that fails, the branded placeholder has role=img and aria-label', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        const container = document.createElement('div');
        const img = createLazyImgElement(imageConfig);
        container.appendChild(img);
        document.body.appendChild(container);

        const lazyLoad = loadModule();

        lazyLoad.handleImageError(img);

        const placeholder = container.querySelector('.lazy-placeholder--error');

        // Placeholder has role=img for accessibility
        expect(placeholder.getAttribute('role')).toBe('img');

        // Placeholder has aria-label (either from alt text or default)
        const ariaLabel = placeholder.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();

        // If the image had alt text, it should be used as aria-label
        if (imageConfig.alt) {
          expect(ariaLabel).toBe(imageConfig.alt);
        }
      }),
      { numRuns: 50 }
    );
  });

  test('for any image that fails, the branded placeholder matches the original image dimensions', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        const container = document.createElement('div');
        const img = createLazyImgElement(imageConfig);
        container.appendChild(img);
        document.body.appendChild(container);

        const lazyLoad = loadModule();

        lazyLoad.handleImageError(img);

        const placeholder = container.querySelector('.lazy-placeholder--error');

        // Placeholder dimensions match the original image
        expect(placeholder.style.width).toBe(imageConfig.width + 'px');
        expect(placeholder.style.height).toBe(imageConfig.height + 'px');
      }),
      { numRuns: 50 }
    );
  });
});

// --- Property 24: Lazy Load Placeholder Prevents Layout Shift ---
// *For any* image that has not yet been loaded, the Lazy_Loader SHALL display a placeholder
// element matching the target image's width and height, and when the image finishes loading,
// the replacement SHALL not cause a visible layout shift.
// **Validates: Requirements 7.4, 7.6**

describe('Property 24: Lazy Load Placeholder Prevents Layout Shift', () => {
  test('for any lazy image with width/height, ensurePlaceholderDimensions sets aspect-ratio matching those dimensions', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        const img = createLazyImgElement(imageConfig);
        document.body.appendChild(img);

        const lazyLoad = loadModule();

        // Apply placeholder dimensions
        lazyLoad.ensurePlaceholderDimensions(img);

        // Property assertions:
        // 1. width is set to 100% (responsive)
        expect(img.style.width).toBe('100%');

        // 2. aspect-ratio matches the width/height ratio
        const expectedAspectRatio = imageConfig.width + ' / ' + imageConfig.height;
        expect(img.style.aspectRatio).toBe(expectedAspectRatio);
      }),
      { numRuns: 50 }
    );
  });

  test('for any lazy image, after loading via intersection, the loaded class is added without dimension change', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        mockObserverInstances = [];
        const container = document.createElement('div');
        const img = createLazyImgElement(imageConfig);
        container.appendChild(img);
        document.body.appendChild(container);

        const lazyLoad = loadModule();
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const observer = mockObserverInstances[0];

        // Verify placeholder dimensions were set during init
        expect(img.style.width).toBe('100%');
        expect(img.style.aspectRatio).toBe(imageConfig.width + ' / ' + imageConfig.height);

        // Simulate intersection (image enters viewport)
        observer.callback(
          [{ isIntersecting: true, target: img }],
          observer
        );

        // Simulate successful load event
        img.dispatchEvent(new Event('load'));

        // After loading, the 'loaded' class is added
        expect(img.classList.contains('loaded')).toBe(true);

        // The width/height attributes remain (no layout shift)
        expect(img.getAttribute('width')).toBe(String(imageConfig.width));
        expect(img.getAttribute('height')).toBe(String(imageConfig.height));
      }),
      { numRuns: 50 }
    );
  });

  test('for any image error fallback, the placeholder dimensions match the original to prevent layout shift', () => {
    fc.assert(
      fc.property(arbLazyImage, (imageConfig) => {
        // Setup
        document.body.innerHTML = '';
        const container = document.createElement('div');
        const img = createLazyImgElement(imageConfig);
        container.appendChild(img);
        document.body.appendChild(container);

        const lazyLoad = loadModule();

        // Create branded placeholder (simulating error)
        const placeholder = lazyLoad.createBrandedPlaceholder(img);

        // Placeholder dimensions match the original image dimensions
        expect(placeholder.style.width).toBe(imageConfig.width + 'px');
        expect(placeholder.style.height).toBe(imageConfig.height + 'px');
      }),
      { numRuns: 50 }
    );
  });
});
