/**
 * Main JavaScript - Essential Lubricants Website
 * Handles: Mobile navigation toggle, focus management, shared functionality
 */

'use strict';

// Add js-enabled class to html element for progressive enhancement (Requirement 8.3)
// This allows CSS to hide mobile nav links only when JS is available
document.documentElement.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', function () {
  initMobileNavigation();
  initSkipLink();
});

/**
 * Initializes mobile navigation behavior:
 * - Toggle menu open/close on hamburger click
 * - Set aria-expanded on toggle button
 * - Prevent body scroll when menu is open
 * - Close menu on nav link click (mobile)
 * - Close menu on resize to desktop (>768px)
 * - Focus management: move focus to first link on open, return to toggle on close
 * - Close menu on Escape key press
 */
function initMobileNavigation() {
  var toggleButton = document.querySelector('.mobile-menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');

  if (!toggleButton || !mobileNav) {
    return;
  }

  var navLinks = mobileNav.querySelectorAll('.mobile-nav__link');

  /**
   * Opens the mobile navigation menu.
   */
  function openMenu() {
    mobileNav.classList.add('active');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');

    // Move focus to the first menu link
    if (navLinks.length > 0) {
      navLinks[0].focus();
    }
  }

  /**
   * Closes the mobile navigation menu.
   */
  function closeMenu() {
    mobileNav.classList.remove('active');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');

    // Return focus to the toggle button
    toggleButton.focus();
  }

  /**
   * Returns whether the menu is currently open.
   */
  function isMenuOpen() {
    return mobileNav.classList.contains('active');
  }

  // Toggle menu on hamburger button click
  toggleButton.addEventListener('click', function () {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when any mobile nav link is clicked
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (isMenuOpen()) {
        closeMenu();
      }
    });
  });

  // Close menu on window resize when width exceeds 768px
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && isMenuOpen()) {
      closeMenu();
    }
  });

  // Close menu on Escape key press
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isMenuOpen()) {
      closeMenu();
    }
  });
}

/**
 * Initializes the skip navigation link behavior.
 * Ensures that when the skip link is activated, focus moves to the main content area.
 * This is necessary because some browsers don't move focus to fragment targets by default.
 *
 * Requirement 9.8: Skip navigation link moves focus to main content landmark when activated.
 */
function initSkipLink() {
  var skipLink = document.querySelector('.skip-link');
  var mainContent = document.getElementById('main-content');

  if (!skipLink || !mainContent) {
    return;
  }

  skipLink.addEventListener('click', function (event) {
    // Prevent default only to handle focus manually
    event.preventDefault();
    mainContent.focus();
    // Scroll to main content
    mainContent.scrollIntoView();
  });
}
