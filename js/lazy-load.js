/**
 * Lazy Image Loading - Essential Lubricants Website
 * Handles: IntersectionObserver-based image lazy loading with fallback
 *
 * Features:
 * - IntersectionObserver with rootMargin '50px' and threshold 0.1
 * - On intersection: set src from data-src, remove data-src, add 'loaded' class, unobserve
 * - Fallback: load all images immediately if IntersectionObserver not supported
 * - Placeholder elements matching target image dimensions to prevent layout shift
 * - Image error handling: swap to branded placeholder with company name text
 * - noscript fallback img elements with direct src for no-JS users
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5
 */

'use strict';

/**
 * Company name used in branded error placeholders.
 */
var COMPANY_NAME = 'Essential Lubricants';

/**
 * Creates a branded placeholder element to display when an image fails to load.
 * The placeholder matches the dimensions of the failed image and shows the company name.
 *
 * @param {HTMLImageElement} img - The image element that failed to load
 * @returns {HTMLElement} A div element styled as a branded placeholder
 *
 * Validates: Requirement 7.5
 */
function createBrandedPlaceholder(img) {
  var placeholder = document.createElement('div');
  placeholder.className = 'lazy-placeholder lazy-placeholder--error';
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', img.getAttribute('alt') || COMPANY_NAME + ' product image');

  // Match the dimensions of the target image to prevent layout shift
  var width = img.getAttribute('width');
  var height = img.getAttribute('height');
  if (width) {
    placeholder.style.width = width + 'px';
  }
  if (height) {
    placeholder.style.height = height + 'px';
  }

  // Company name text inside the placeholder
  var text = document.createElement('span');
  text.className = 'lazy-placeholder__text';
  text.textContent = COMPANY_NAME;
  placeholder.appendChild(text);

  return placeholder;
}

/**
 * Handles image load errors by replacing the broken image with a branded placeholder.
 * The placeholder displays the company name and matches the original image dimensions.
 *
 * @param {HTMLImageElement} img - The image element that triggered an error event
 *
 * Validates: Requirement 7.5
 */
function handleImageError(img) {
  var placeholder = createBrandedPlaceholder(img);
  if (img.parentNode) {
    img.parentNode.replaceChild(placeholder, img);
  }
}

/**
 * Loads a single lazy image by setting its src from data-src.
 * Removes the data-src attribute and adds the 'loaded' class on successful load.
 * Attaches an error handler for fallback to branded placeholder.
 * Also handles <source> elements inside <picture> parents by activating data-srcset.
 *
 * @param {HTMLImageElement} img - An image element with a data-src attribute
 *
 * Validates: Requirements 7.2, 7.5, 7.6
 */
function loadImage(img) {
  var src = img.getAttribute('data-src');
  if (!src) {
    return;
  }

  // Handle <picture> element: activate data-srcset on sibling <source> elements
  var parent = img.parentNode;
  if (parent && parent.tagName === 'PICTURE') {
    var sources = parent.querySelectorAll('source[data-srcset]');
    for (var i = 0; i < sources.length; i++) {
      sources[i].setAttribute('srcset', sources[i].getAttribute('data-srcset'));
      sources[i].removeAttribute('data-srcset');
    }
  }

  // Activate data-srcset on the img element itself if present
  var imgSrcset = img.getAttribute('data-srcset');
  if (imgSrcset) {
    img.setAttribute('srcset', imgSrcset);
    img.removeAttribute('data-srcset');
  }

  // Attach error handler before setting src
  img.addEventListener('error', function () {
    handleImageError(img);
  });

  // Attach load handler to add 'loaded' class for smooth transition
  img.addEventListener('load', function () {
    img.classList.add('loaded');
  });

  // Set the actual src from data-src
  img.src = src;
  img.removeAttribute('data-src');
}

/**
 * Loads all lazy images immediately (fallback for browsers without IntersectionObserver).
 *
 * Validates: Requirement 7.3
 */
function loadAllImages() {
  var lazyImages = document.querySelectorAll('img[data-src]');
  for (var i = 0; i < lazyImages.length; i++) {
    loadImage(lazyImages[i]);
  }
}

/**
 * IntersectionObserver callback that loads images as they enter the viewport threshold.
 *
 * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
 * @param {IntersectionObserver} observer - The observer instance
 *
 * Validates: Requirements 7.1, 7.2
 */
function handleIntersection(entries, observer) {
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.isIntersecting) {
      var img = entry.target;
      loadImage(img);
      observer.unobserve(img);
    }
  }
}

/**
 * Ensures placeholder dimensions are set on lazy images to prevent layout shift.
 * If an image has width/height attributes but no explicit inline dimensions,
 * this function sets them to maintain the reserved space.
 *
 * @param {HTMLImageElement} img - An image element with data-src attribute
 *
 * Validates: Requirement 7.4
 */
function ensurePlaceholderDimensions(img) {
  var width = img.getAttribute('width');
  var height = img.getAttribute('height');

  // If width and height attributes are set, ensure the element reserves that space
  if (width && height) {
    // Set aspect-ratio via inline style if not already styled by CSS
    if (!img.style.width) {
      img.style.width = '100%';
    }
    if (!img.style.aspectRatio) {
      img.style.aspectRatio = width + ' / ' + height;
    }
  }
}

/**
 * Adds noscript fallback img elements for images that use lazy loading.
 * This ensures images are visible when JavaScript is disabled.
 * Called during initialization to insert noscript tags after each lazy image.
 *
 * @param {NodeList|HTMLImageElement[]} images - Collection of lazy-loaded images
 *
 * Validates: Requirement 8.5
 */
function addNoscriptFallbacks(images) {
  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    var src = img.getAttribute('data-src');
    if (!src) {
      continue;
    }

    // Check if a noscript fallback already exists for this image
    var nextSibling = img.nextElementSibling;
    if (nextSibling && nextSibling.tagName === 'NOSCRIPT') {
      continue;
    }

    var noscript = document.createElement('noscript');
    var fallbackImg = '<img src="' + src + '"';
    var alt = img.getAttribute('alt');
    if (alt) {
      fallbackImg += ' alt="' + alt.replace(/"/g, '&quot;') + '"';
    }
    var width = img.getAttribute('width');
    if (width) {
      fallbackImg += ' width="' + width + '"';
    }
    var height = img.getAttribute('height');
    if (height) {
      fallbackImg += ' height="' + height + '"';
    }
    fallbackImg += ' class="product-card__image loaded"';
    fallbackImg += '>';
    noscript.innerHTML = fallbackImg;

    // Insert noscript after the lazy image
    if (img.parentNode) {
      img.parentNode.insertBefore(noscript, img.nextSibling);
    }
  }
}

/**
 * Initializes lazy loading for all images with a data-src attribute.
 *
 * Uses IntersectionObserver with:
 * - rootMargin: '50px' (load images 50px before they enter the viewport)
 * - threshold: 0.1 (trigger when 10% of the image is visible)
 *
 * If IntersectionObserver is not supported, falls back to loading all images immediately.
 *
 * Also:
 * - Ensures placeholder dimensions are set to prevent layout shift
 * - Adds noscript fallback elements for no-JS users
 * - Attaches error handlers for branded placeholder fallback
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5
 */
function initLazyLoading() {
  var lazyImages = document.querySelectorAll('img[data-src]');

  if (lazyImages.length === 0) {
    return;
  }

  // Ensure placeholder dimensions are set for all lazy images
  for (var i = 0; i < lazyImages.length; i++) {
    ensurePlaceholderDimensions(lazyImages[i]);
  }

  // Add noscript fallback elements for no-JS users
  addNoscriptFallbacks(lazyImages);

  // Check for IntersectionObserver support
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '50px',
      threshold: 0.1
    });

    for (var j = 0; j < lazyImages.length; j++) {
      observer.observe(lazyImages[j]);
    }
  } else {
    // Fallback: load all images immediately if IntersectionObserver not supported
    loadAllImages();
  }
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  initLazyLoading();
});

// Also observe dynamically added images (e.g., from product grid rendering)
// Re-run lazy loading after product grid updates
if (typeof MutationObserver !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var productGrid = document.querySelector('.product-grid');
    if (productGrid) {
      var mutationObserver = new MutationObserver(function () {
        // Re-initialize for any new lazy images added to the grid
        var newLazyImages = productGrid.querySelectorAll('img[data-src]:not([src])');
        if (newLazyImages.length > 0) {
          for (var i = 0; i < newLazyImages.length; i++) {
            ensurePlaceholderDimensions(newLazyImages[i]);
          }
          addNoscriptFallbacks(newLazyImages);

          if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(handleIntersection, {
              rootMargin: '50px',
              threshold: 0.1
            });
            for (var j = 0; j < newLazyImages.length; j++) {
              observer.observe(newLazyImages[j]);
            }
          } else {
            for (var k = 0; k < newLazyImages.length; k++) {
              loadImage(newLazyImages[k]);
            }
          }
        }
      });

      mutationObserver.observe(productGrid, {
        childList: true,
        subtree: true
      });
    }
  });
}

// Export for testing (CommonJS compatible)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initLazyLoading: initLazyLoading,
    loadImage: loadImage,
    loadAllImages: loadAllImages,
    handleIntersection: handleIntersection,
    handleImageError: handleImageError,
    createBrandedPlaceholder: createBrandedPlaceholder,
    ensurePlaceholderDimensions: ensurePlaceholderDimensions,
    addNoscriptFallbacks: addNoscriptFallbacks,
    COMPANY_NAME: COMPANY_NAME
  };
}
