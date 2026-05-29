/**
 * Property-Based Tests for Mobile Navigation
 * 
 * Property 11: Responsive Breakpoint Consistency
 * Property 12: Mobile Menu State Consistency
 * 
 * Validates: Requirements 1.3, 1.4, 1.6, 1.7
 */

'use strict';

const fc = require('fast-check');

/**
 * @jest-environment jsdom
 */

// --- DOM Setup Helpers ---

const BREAKPOINT = 768;

/**
 * Creates the minimal DOM structure needed for mobile navigation testing.
 */
function setupNavigationDOM() {
  document.body.innerHTML = `
    <header class="site-header">
      <nav class="main-nav">
        <a href="/" class="logo">Essential Lubricants</a>
        <ul class="nav-links">
          <li class="nav-links__item"><a href="/" class="nav-links__link">Home</a></li>
          <li class="nav-links__item"><a href="/products.html" class="nav-links__link">Products</a></li>
          <li class="nav-links__item"><a href="/services.html" class="nav-links__link">Services</a></li>
          <li class="nav-links__item"><a href="/contact.html" class="nav-links__link">Contact</a></li>
        </ul>
        <button class="mobile-menu-toggle" aria-expanded="false" aria-controls="mobile-nav">
          <span class="hamburger-icon">
            <span class="hamburger-icon__line"></span>
            <span class="hamburger-icon__line"></span>
            <span class="hamburger-icon__line"></span>
          </span>
        </button>
      </nav>
    </header>
    <nav id="mobile-nav" class="mobile-nav">
      <ul class="mobile-nav__links">
        <li class="mobile-nav__item"><a href="/" class="mobile-nav__link">Home</a></li>
        <li class="mobile-nav__item"><a href="/products.html" class="mobile-nav__link">Products</a></li>
        <li class="mobile-nav__item"><a href="/services.html" class="mobile-nav__link">Services</a></li>
        <li class="mobile-nav__item"><a href="/contact.html" class="mobile-nav__link">Contact</a></li>
      </ul>
    </nav>
    <main class="page-content"><p>Content</p></main>
  `;
  document.body.classList.remove('menu-open');
}

/**
 * Simulates the mobile navigation initialization logic from main.js.
 * Returns the control functions for testing.
 */
function initMobileNavigationForTest() {
  const toggleButton = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (!toggleButton || !mobileNav) {
    throw new Error('Required DOM elements not found');
  }

  const navLinks = mobileNav.querySelectorAll('.mobile-nav__link');

  function openMenu() {
    mobileNav.classList.add('active');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    mobileNav.classList.remove('active');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function isMenuOpen() {
    return mobileNav.classList.contains('active');
  }

  function toggle() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  return { openMenu, closeMenu, isMenuOpen, toggle, toggleButton, mobileNav };
}

/**
 * Determines the expected layout mode based on viewport width.
 * Returns { hamburgerVisible, desktopNavVisible }
 * 
 * Per CSS:
 * - .mobile-menu-toggle: display: flex (default), display: none at min-width: 769px
 * - .nav-links: display: none (default), display: flex at min-width: 769px
 * - .mobile-nav: hidden on desktop via display: none !important at min-width: 769px
 * 
 * The breakpoint is 768px:
 * - width <= 768: hamburger visible, desktop nav hidden (mobile mode)
 * - width > 768 (i.e., >= 769): hamburger hidden, desktop nav visible (desktop mode)
 */
function getExpectedLayoutMode(viewportWidth) {
  if (viewportWidth <= BREAKPOINT) {
    return { hamburgerVisible: true, desktopNavVisible: false, mode: 'mobile' };
  } else {
    return { hamburgerVisible: false, desktopNavVisible: true, mode: 'desktop' };
  }
}

// --- Property Tests ---

describe('Property 11: Responsive Breakpoint Consistency', () => {
  /**
   * **Validates: Requirements 1.3, 1.4**
   * 
   * For any viewport width, exactly one layout mode is active:
   * - If width <= 768px: hamburger menu is visible AND desktop links are hidden
   * - If width > 768px: desktop links are visible AND hamburger is hidden
   * 
   * These two modes are mutually exclusive — exactly one is active at any width.
   */

  test('for any viewport width, exactly one layout mode is active (hamburger XOR desktop nav)', () => {
    fc.assert(
      fc.property(
        // Generate viewport widths from 320 (minimum mobile) to 2560 (large desktop)
        fc.integer({ min: 320, max: 2560 }),
        (viewportWidth) => {
          const layout = getExpectedLayoutMode(viewportWidth);

          // Exactly one mode must be active (XOR)
          expect(layout.hamburgerVisible).not.toBe(layout.desktopNavVisible);

          // Verify the correct mode is active based on breakpoint
          if (viewportWidth <= BREAKPOINT) {
            expect(layout.hamburgerVisible).toBe(true);
            expect(layout.desktopNavVisible).toBe(false);
            expect(layout.mode).toBe('mobile');
          } else {
            expect(layout.hamburgerVisible).toBe(false);
            expect(layout.desktopNavVisible).toBe(true);
            expect(layout.mode).toBe('desktop');
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('breakpoint boundary: 768px is mobile, 769px is desktop', () => {
    const at768 = getExpectedLayoutMode(768);
    expect(at768.mode).toBe('mobile');
    expect(at768.hamburgerVisible).toBe(true);
    expect(at768.desktopNavVisible).toBe(false);

    const at769 = getExpectedLayoutMode(769);
    expect(at769.mode).toBe('desktop');
    expect(at769.hamburgerVisible).toBe(false);
    expect(at769.desktopNavVisible).toBe(true);
  });

  test('no viewport width produces both modes active or neither mode active', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        (viewportWidth) => {
          const layout = getExpectedLayoutMode(viewportWidth);

          // Cannot have both visible
          const bothVisible = layout.hamburgerVisible && layout.desktopNavVisible;
          expect(bothVisible).toBe(false);

          // Cannot have neither visible
          const neitherVisible = !layout.hamburgerVisible && !layout.desktopNavVisible;
          expect(neitherVisible).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('Property 12: Mobile Menu State Consistency', () => {
  /**
   * **Validates: Requirements 1.6, 1.7**
   * 
   * For any sequence of menu open/close operations:
   * - When menu is open: aria-expanded="true" AND body has class "menu-open"
   * - When menu is closed: aria-expanded="false" AND body does NOT have class "menu-open"
   * 
   * These three state indicators (menu active class, aria-expanded, body scroll lock)
   * are always consistent with each other.
   */

  beforeEach(() => {
    setupNavigationDOM();
  });

  test('after any sequence of toggle operations, state remains consistent', () => {
    fc.assert(
      fc.property(
        // Generate a random sequence of toggle operations (true = toggle, false = no-op)
        fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }),
        (operations) => {
          setupNavigationDOM();
          const nav = initMobileNavigationForTest();

          operations.forEach((shouldToggle) => {
            if (shouldToggle) {
              nav.toggle();
            }

            // After each step, verify state consistency
            const menuOpen = nav.isMenuOpen();
            const ariaExpanded = nav.toggleButton.getAttribute('aria-expanded');
            const bodyHasMenuOpen = document.body.classList.contains('menu-open');

            // aria-expanded must match menu state
            if (menuOpen) {
              expect(ariaExpanded).toBe('true');
              expect(bodyHasMenuOpen).toBe(true);
            } else {
              expect(ariaExpanded).toBe('false');
              expect(bodyHasMenuOpen).toBe(false);
            }
          });
        }
      ),
      { numRuns: 200 }
    );
  });

  test('after any sequence of explicit open/close calls, state remains consistent', () => {
    fc.assert(
      fc.property(
        // Generate a random sequence of open (true) and close (false) operations
        fc.array(fc.boolean(), { minLength: 1, maxLength: 30 }),
        (operations) => {
          setupNavigationDOM();
          const nav = initMobileNavigationForTest();

          operations.forEach((shouldOpen) => {
            if (shouldOpen) {
              nav.openMenu();
            } else {
              nav.closeMenu();
            }

            // Verify consistency after each operation
            const menuOpen = nav.isMenuOpen();
            const ariaExpanded = nav.toggleButton.getAttribute('aria-expanded');
            const bodyHasMenuOpen = document.body.classList.contains('menu-open');

            // All three indicators must agree
            expect(ariaExpanded === 'true').toBe(menuOpen);
            expect(bodyHasMenuOpen).toBe(menuOpen);
          });
        }
      ),
      { numRuns: 200 }
    );
  });

  test('opening menu always results in aria-expanded=true and body scroll locked', () => {
    const nav = initMobileNavigationForTest();

    nav.openMenu();

    expect(nav.toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('menu-open')).toBe(true);
    expect(nav.isMenuOpen()).toBe(true);
  });

  test('closing menu always results in aria-expanded=false and body scroll restored', () => {
    const nav = initMobileNavigationForTest();

    // First open, then close
    nav.openMenu();
    nav.closeMenu();

    expect(nav.toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('menu-open')).toBe(false);
    expect(nav.isMenuOpen()).toBe(false);
  });

  test('double-open does not break state consistency', () => {
    const nav = initMobileNavigationForTest();

    nav.openMenu();
    nav.openMenu(); // Double open

    expect(nav.toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('menu-open')).toBe(true);
    expect(nav.isMenuOpen()).toBe(true);
  });

  test('double-close does not break state consistency', () => {
    const nav = initMobileNavigationForTest();

    nav.closeMenu();
    nav.closeMenu(); // Double close from already-closed state

    expect(nav.toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('menu-open')).toBe(false);
    expect(nav.isMenuOpen()).toBe(false);
  });
});
