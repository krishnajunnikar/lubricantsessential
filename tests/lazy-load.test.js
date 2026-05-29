/**
 * Lazy Loading Tests - Essential Lubricants Website
 * Tests for: initLazyLoading(), image error handling, placeholder dimensions, noscript fallbacks
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5
 */

'use strict';

// Mock IntersectionObserver
let mockObserverInstances = [];
let mockObserverCallback;

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observedElements = [];
    mockObserverCallback = callback;
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
  // Reset DOM
  document.body.innerHTML = '';
  mockObserverInstances = [];
  mockObserverCallback = null;

  // Set up IntersectionObserver mock
  global.IntersectionObserver = MockIntersectionObserver;
  window.IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  jest.resetModules();
});

function loadModule() {
  // Clear module cache and reload
  jest.resetModules();
  return require('../js/lazy-load.js');
}

describe('initLazyLoading', () => {
  test('creates IntersectionObserver with correct options (rootMargin 50px, threshold 0.1)', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();

    // Trigger DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    expect(mockObserverInstances.length).toBeGreaterThan(0);
    const observer = mockObserverInstances[0];
    expect(observer.options.rootMargin).toBe('50px');
    expect(observer.options.threshold).toBe(0.1);
  });

  test('observes all images with data-src attribute', () => {
    document.body.innerHTML = `
      <img data-src="img1.jpg" alt="Image 1" width="300" height="200">
      <img data-src="img2.jpg" alt="Image 2" width="300" height="200">
      <img src="already-loaded.jpg" alt="Already loaded" width="300" height="200">
    `;
    const lazyLoad = loadModule();

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const observer = mockObserverInstances[0];
    expect(observer.observedElements.length).toBe(2);
  });

  test('does nothing when no lazy images exist', () => {
    document.body.innerHTML = '<img src="loaded.jpg" alt="Loaded">';
    const lazyLoad = loadModule();

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    expect(mockObserverInstances.length).toBe(0);
  });

  test('falls back to loading all images when IntersectionObserver is not supported', () => {
    document.body.innerHTML = `
      <img data-src="img1.jpg" alt="Image 1" width="300" height="200">
      <img data-src="img2.jpg" alt="Image 2" width="300" height="200">
    `;

    // Remove IntersectionObserver
    delete window.IntersectionObserver;
    delete global.IntersectionObserver;

    const lazyLoad = loadModule();

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // All images should have src set from data-src
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      expect(img.getAttribute('src')).toBeTruthy();
      expect(img.getAttribute('data-src')).toBeNull();
    });
  });
});

describe('handleIntersection', () => {
  test('sets src from data-src when image intersects', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Simulate intersection
    const observer = mockObserverInstances[0];
    observer.callback([
      { isIntersecting: true, target: img }
    ], observer);

    expect(img.src).toContain('test.jpg');
  });

  test('removes data-src attribute after loading', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const observer = mockObserverInstances[0];
    observer.callback([
      { isIntersecting: true, target: img }
    ], observer);

    expect(img.getAttribute('data-src')).toBeNull();
  });

  test('unobserves image after intersection', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const observer = mockObserverInstances[0];
    expect(observer.observedElements).toContain(img);

    observer.callback([
      { isIntersecting: true, target: img }
    ], observer);

    expect(observer.observedElements).not.toContain(img);
  });

  test('does not load image when not intersecting', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const observer = mockObserverInstances[0];
    observer.callback([
      { isIntersecting: false, target: img }
    ], observer);

    expect(img.getAttribute('data-src')).toBe('test.jpg');
    expect(img.src).toBe('');
  });

  test('adds loaded class on successful image load', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const observer = mockObserverInstances[0];
    observer.callback([
      { isIntersecting: true, target: img }
    ], observer);

    // Simulate successful load
    img.dispatchEvent(new Event('load'));

    expect(img.classList.contains('loaded')).toBe(true);
  });
});

describe('handleImageError', () => {
  test('replaces image with branded placeholder on error', () => {
    document.body.innerHTML = '<div><img data-src="broken.jpg" alt="Test Product" width="300" height="200"></div>';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');
    const parent = img.parentNode;

    lazyLoad.handleImageError(img);

    // Image should be replaced with placeholder
    expect(parent.querySelector('img')).toBeNull();
    const placeholder = parent.querySelector('.lazy-placeholder--error');
    expect(placeholder).not.toBeNull();
  });

  test('branded placeholder contains company name text', () => {
    document.body.innerHTML = '<div><img data-src="broken.jpg" alt="Test" width="300" height="200"></div>';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    lazyLoad.handleImageError(img);

    const placeholder = document.querySelector('.lazy-placeholder--error');
    const text = placeholder.querySelector('.lazy-placeholder__text');
    expect(text.textContent).toBe('Essential Lubricants');
  });

  test('branded placeholder has role=img and aria-label', () => {
    document.body.innerHTML = '<div><img data-src="broken.jpg" alt="ISOFLEX NBU 15 - Kluber" width="300" height="200"></div>';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    lazyLoad.handleImageError(img);

    const placeholder = document.querySelector('.lazy-placeholder--error');
    expect(placeholder.getAttribute('role')).toBe('img');
    expect(placeholder.getAttribute('aria-label')).toBe('ISOFLEX NBU 15 - Kluber');
  });

  test('branded placeholder matches original image dimensions', () => {
    document.body.innerHTML = '<div><img data-src="broken.jpg" alt="Test" width="400" height="250"></div>';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    lazyLoad.handleImageError(img);

    const placeholder = document.querySelector('.lazy-placeholder--error');
    expect(placeholder.style.width).toBe('400px');
    expect(placeholder.style.height).toBe('250px');
  });
});

describe('ensurePlaceholderDimensions', () => {
  test('sets aspect-ratio style based on width and height attributes', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test" width="300" height="200">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    lazyLoad.ensurePlaceholderDimensions(img);

    expect(img.style.aspectRatio).toBe('300 / 200');
    expect(img.style.width).toBe('100%');
  });

  test('does not set dimensions when width/height attributes are missing', () => {
    document.body.innerHTML = '<img data-src="test.jpg" alt="Test">';
    const lazyLoad = loadModule();
    const img = document.querySelector('img');

    lazyLoad.ensurePlaceholderDimensions(img);

    expect(img.style.aspectRatio).toBeFalsy();
    expect(img.style.width).toBeFalsy();
  });
});

describe('addNoscriptFallbacks', () => {
  test('adds noscript element after each lazy image', () => {
    document.body.innerHTML = `
      <div>
        <img data-src="img1.jpg" alt="Image 1" width="300" height="200">
        <img data-src="img2.jpg" alt="Image 2" width="300" height="200">
      </div>
    `;
    const lazyLoad = loadModule();
    const images = document.querySelectorAll('img[data-src]');

    lazyLoad.addNoscriptFallbacks(images);

    const noscripts = document.querySelectorAll('noscript');
    expect(noscripts.length).toBe(2);
  });

  test('noscript contains img with direct src attribute', () => {
    document.body.innerHTML = '<div><img data-src="product.jpg" alt="Product Name" width="300" height="200"></div>';
    const lazyLoad = loadModule();
    const images = document.querySelectorAll('img[data-src]');

    lazyLoad.addNoscriptFallbacks(images);

    const noscript = document.querySelector('noscript');
    expect(noscript.innerHTML).toContain('src="product.jpg"');
    expect(noscript.innerHTML).toContain('alt="Product Name"');
    expect(noscript.innerHTML).toContain('width="300"');
    expect(noscript.innerHTML).toContain('height="200"');
  });

  test('does not duplicate noscript elements on repeated calls', () => {
    document.body.innerHTML = '<div><img data-src="img.jpg" alt="Test" width="300" height="200"></div>';
    const lazyLoad = loadModule();
    const images = document.querySelectorAll('img[data-src]');

    lazyLoad.addNoscriptFallbacks(images);
    lazyLoad.addNoscriptFallbacks(images);

    const noscripts = document.querySelectorAll('noscript');
    expect(noscripts.length).toBe(1);
  });

  test('escapes quotes in alt text within noscript', () => {
    document.body.innerHTML = '<div><img data-src="img.jpg" alt="Product &quot;Special&quot;" width="300" height="200"></div>';
    const lazyLoad = loadModule();
    const images = document.querySelectorAll('img[data-src]');

    lazyLoad.addNoscriptFallbacks(images);

    const noscript = document.querySelector('noscript');
    // Should not have unescaped quotes breaking the HTML
    expect(noscript.innerHTML).toContain('alt=');
  });
});

describe('loadAllImages (fallback)', () => {
  test('sets src from data-src for all lazy images', () => {
    document.body.innerHTML = `
      <img data-src="img1.jpg" alt="Image 1" width="300" height="200">
      <img data-src="img2.jpg" alt="Image 2" width="300" height="200">
      <img data-src="img3.jpg" alt="Image 3" width="300" height="200">
    `;
    const lazyLoad = loadModule();

    lazyLoad.loadAllImages();

    const images = document.querySelectorAll('img');
    expect(images[0].src).toContain('img1.jpg');
    expect(images[1].src).toContain('img2.jpg');
    expect(images[2].src).toContain('img3.jpg');
  });

  test('removes data-src from all images after loading', () => {
    document.body.innerHTML = `
      <img data-src="img1.jpg" alt="Image 1" width="300" height="200">
      <img data-src="img2.jpg" alt="Image 2" width="300" height="200">
    `;
    const lazyLoad = loadModule();

    lazyLoad.loadAllImages();

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      expect(img.getAttribute('data-src')).toBeNull();
    });
  });
});

describe('createBrandedPlaceholder', () => {
  test('creates a div with correct class names', () => {
    const lazyLoad = loadModule();
    const img = document.createElement('img');
    img.setAttribute('alt', 'Test Product');
    img.setAttribute('width', '300');
    img.setAttribute('height', '200');

    const placeholder = lazyLoad.createBrandedPlaceholder(img);

    expect(placeholder.tagName).toBe('DIV');
    expect(placeholder.classList.contains('lazy-placeholder')).toBe(true);
    expect(placeholder.classList.contains('lazy-placeholder--error')).toBe(true);
  });

  test('uses alt text as aria-label', () => {
    const lazyLoad = loadModule();
    const img = document.createElement('img');
    img.setAttribute('alt', 'ISOFLEX NBU 15 - Kluber Lubrication');
    img.setAttribute('width', '300');
    img.setAttribute('height', '200');

    const placeholder = lazyLoad.createBrandedPlaceholder(img);

    expect(placeholder.getAttribute('aria-label')).toBe('ISOFLEX NBU 15 - Kluber Lubrication');
  });

  test('uses default aria-label when alt is empty', () => {
    const lazyLoad = loadModule();
    const img = document.createElement('img');
    img.setAttribute('width', '300');
    img.setAttribute('height', '200');

    const placeholder = lazyLoad.createBrandedPlaceholder(img);

    expect(placeholder.getAttribute('aria-label')).toBe('Essential Lubricants product image');
  });
});
