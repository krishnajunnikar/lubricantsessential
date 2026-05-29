/**
 * SRI (Subresource Integrity) Verification Infrastructure
 * Essential Lubricants Website
 *
 * This module provides SRI verification logic for third-party resources.
 * Currently, the site uses no third-party scripts or stylesheets (all resources
 * are served locally). This infrastructure is in place for future additions.
 *
 * When third-party resources are added:
 * 1. Add integrity="sha384-..." and crossorigin="anonymous" attributes to the
 *    script or link tag.
 * 2. Register the resource in the THIRD_PARTY_RESOURCES registry below.
 * 3. The verifySRICompliance() function will audit loaded resources on page load.
 *
 * If an SRI check fails, the browser natively blocks the resource. This module
 * provides graceful degradation by detecting blocked resources and ensuring the
 * site remains functional with degraded styling or features.
 *
 * Requirements: 11.4, 11.5, 11.7
 */

'use strict';

/**
 * Registry of expected third-party resources with their SRI hashes.
 * Add entries here when integrating external scripts or stylesheets.
 *
 * Format:
 * {
 *   url: 'https://cdn.example.com/lib.js',
 *   type: 'script' | 'stylesheet',
 *   integrity: 'sha384-...',
 *   fallbackBehavior: 'degrade' | 'warn',
 *   description: 'Human-readable description of the resource'
 * }
 */
var THIRD_PARTY_RESOURCES = [
  // No third-party resources currently in use.
  // Example entry for future reference:
  // {
  //   url: 'https://cdn.example.com/analytics.js',
  //   type: 'script',
  //   integrity: 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC',
  //   fallbackBehavior: 'degrade',
  //   description: 'Analytics library'
  // }
];

/**
 * Verifies that all third-party resources on the page have valid SRI attributes.
 * Logs warnings for any resources missing integrity attributes.
 * Called on DOMContentLoaded to audit the page.
 *
 * @returns {Object} Audit result with pass/fail status and details
 */
function verifySRICompliance() {
  var results = {
    passed: true,
    resources: [],
    warnings: []
  };

  // Check all script elements for third-party origins
  var scripts = document.querySelectorAll('script[src]');
  scripts.forEach(function (script) {
    if (isThirdPartyResource(script.src)) {
      var hasIntegrity = script.hasAttribute('integrity');
      var hasCrossorigin = script.hasAttribute('crossorigin');

      results.resources.push({
        url: script.src,
        type: 'script',
        hasIntegrity: hasIntegrity,
        hasCrossorigin: hasCrossorigin
      });

      if (!hasIntegrity) {
        results.passed = false;
        results.warnings.push(
          'Third-party script missing integrity attribute: ' + script.src
        );
      }

      if (!hasCrossorigin) {
        results.warnings.push(
          'Third-party script missing crossorigin attribute: ' + script.src
        );
      }
    }
  });

  // Check all stylesheet link elements for third-party origins
  var stylesheets = document.querySelectorAll('link[rel="stylesheet"][href]');
  stylesheets.forEach(function (link) {
    if (isThirdPartyResource(link.href)) {
      var hasIntegrity = link.hasAttribute('integrity');
      var hasCrossorigin = link.hasAttribute('crossorigin');

      results.resources.push({
        url: link.href,
        type: 'stylesheet',
        hasIntegrity: hasIntegrity,
        hasCrossorigin: hasCrossorigin
      });

      if (!hasIntegrity) {
        results.passed = false;
        results.warnings.push(
          'Third-party stylesheet missing integrity attribute: ' + link.href
        );
      }

      if (!hasCrossorigin) {
        results.warnings.push(
          'Third-party stylesheet missing crossorigin attribute: ' + link.href
        );
      }
    }
  });

  // Log warnings in development (non-production) environments
  if (results.warnings.length > 0 && typeof console !== 'undefined') {
    results.warnings.forEach(function (warning) {
      console.warn('[SRI Audit]', warning);
    });
  }

  return results;
}

/**
 * Determines if a URL points to a third-party origin.
 * A resource is third-party if its origin differs from the current page origin.
 *
 * @param {string} url - The resource URL to check
 * @returns {boolean} True if the resource is from a third-party origin
 */
function isThirdPartyResource(url) {
  try {
    var resourceOrigin = new URL(url, window.location.href).origin;
    var pageOrigin = window.location.origin;
    return resourceOrigin !== pageOrigin;
  } catch (e) {
    // If URL parsing fails, treat as local resource
    return false;
  }
}

/**
 * Handles graceful degradation when an SRI check fails and the browser
 * blocks a third-party resource. The site should remain functional with
 * degraded styling or features rather than breaking entirely.
 *
 * This function checks registered third-party resources against what's
 * actually loaded and applies fallback behavior for any that failed.
 *
 * Requirement 11.5: If an SRI integrity check fails, the site remains
 * functional with degraded styling or features.
 */
function handleSRIFailure() {
  THIRD_PARTY_RESOURCES.forEach(function (resource) {
    var loaded = false;

    if (resource.type === 'script') {
      var scripts = document.querySelectorAll('script[src]');
      scripts.forEach(function (script) {
        if (script.src.indexOf(resource.url) !== -1) {
          loaded = true;
        }
      });
    } else if (resource.type === 'stylesheet') {
      // Check if stylesheet was actually applied
      var sheets = document.styleSheets;
      for (var i = 0; i < sheets.length; i++) {
        try {
          if (sheets[i].href && sheets[i].href.indexOf(resource.url) !== -1) {
            loaded = true;
            break;
          }
        } catch (e) {
          // Cross-origin stylesheet access may throw
        }
      }
    }

    if (!loaded && resource.fallbackBehavior === 'degrade') {
      // Add a class to the document indicating degraded mode
      document.documentElement.classList.add('sri-degraded');

      if (typeof console !== 'undefined') {
        console.warn(
          '[SRI] Resource blocked or failed to load: ' + resource.description +
          '. Site operating in degraded mode.'
        );
      }
    }
  });
}

/**
 * Initializes SRI verification on page load.
 * Runs the compliance audit and sets up degradation handling.
 */
function initSRIVerification() {
  // Run SRI compliance audit
  verifySRICompliance();

  // Check for failed resources after a short delay to allow loading
  setTimeout(handleSRIFailure, 2000);
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initSRIVerification);

// Export for testing (CommonJS compatibility)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verifySRICompliance: verifySRICompliance,
    isThirdPartyResource: isThirdPartyResource,
    handleSRIFailure: handleSRIFailure,
    THIRD_PARTY_RESOURCES: THIRD_PARTY_RESOURCES
  };
}
