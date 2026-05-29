/**
 * Property-Based Tests for WhatsApp Link Generation
 *
 * Property 10: WhatsApp Link Format Correctness
 * — URL matches pattern with properly URI-encoded message
 *
 * **Validates: Requirements 5.2, 5.3**
 */

'use strict';

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * @jest-environment jsdom
 */

// --- Load generateLink from whatsapp.js ---
// The file uses var globals and attaches a DOMContentLoaded listener,
// so we eval it in a controlled scope to extract the function.

let generateLink;

beforeAll(() => {
  const filePath = path.join(__dirname, '..', 'js', 'whatsapp.js');
  const source = fs.readFileSync(filePath, 'utf-8');

  // Provide a minimal document stub for the addEventListener call at module level
  const mockDocument = {
    addEventListener: () => {},
    querySelector: () => null
  };

  // Execute the file in a function scope to capture the var declarations
  const wrappedFn = new Function('document', source + '\nreturn { generateLink, whatsappConfig };');
  const exported = wrappedFn(mockDocument);
  generateLink = exported.generateLink;
});

// --- Property Tests ---

describe('Property 10: WhatsApp Link Format Correctness', () => {
  /**
   * **Validates: Requirements 5.2, 5.3**
   *
   * For any message string passed to the WhatsApp link generator,
   * the resulting URL SHALL match the pattern
   * https://wa.me/919422966662?text=<encoded_message>
   * where the message is properly URI-encoded using encodeURIComponent.
   */

  const PHONE_NUMBER = '919422966662';

  test('URL starts with https://wa.me/ for any message', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (message) => {
          const url = generateLink(PHONE_NUMBER, message);
          expect(url.startsWith('https://wa.me/')).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('URL contains the phone number 919422966662 for any message', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (message) => {
          const url = generateLink(PHONE_NUMBER, message);
          expect(url).toContain(PHONE_NUMBER);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('URL contains ?text= followed by URI-encoded message for any message', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (message) => {
          const url = generateLink(PHONE_NUMBER, message);
          const expectedPrefix = `https://wa.me/${PHONE_NUMBER}?text=`;
          expect(url.startsWith(expectedPrefix)).toBe(true);

          // Extract the encoded portion after ?text=
          const encodedPart = url.slice(expectedPrefix.length);
          expect(encodedPart).toBe(encodeURIComponent(message));
        }
      ),
      { numRuns: 200 }
    );
  });

  test('encoded portion decodes back to the original message for any message', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (message) => {
          const url = generateLink(PHONE_NUMBER, message);
          const expectedPrefix = `https://wa.me/${PHONE_NUMBER}?text=`;
          const encodedPart = url.slice(expectedPrefix.length);

          // Decoding the URI-encoded portion must yield the original message
          expect(decodeURIComponent(encodedPart)).toBe(message);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('URL format is correct for messages with special characters and unicode', () => {
    fc.assert(
      fc.property(
        fc.unicodeString({ minLength: 1, maxLength: 500 }),
        (message) => {
          const url = generateLink(PHONE_NUMBER, message);
          const expectedUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
          expect(url).toBe(expectedUrl);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('URL format is correct for messages with spaces, newlines, and punctuation', () => {
    fc.assert(
      fc.property(
        fc.stringOf(
          fc.oneof(
            fc.constant(' '),
            fc.constant('\n'),
            fc.constant('\t'),
            fc.constant('&'),
            fc.constant('='),
            fc.constant('?'),
            fc.constant('#'),
            fc.constant('%'),
            fc.constant('+'),
            fc.constant('/'),
            fc.constant('!'),
            fc.constant('@'),
            fc.char()
          ),
          { minLength: 1, maxLength: 300 }
        ),
        (message) => {
          const url = generateLink(PHONE_NUMBER, message);

          // Verify full URL structure
          expect(url).toBe(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`);

          // Verify round-trip decode
          const encodedPart = url.split('?text=')[1];
          expect(decodeURIComponent(encodedPart)).toBe(message);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('empty message produces valid URL with empty text parameter', () => {
    const url = generateLink(PHONE_NUMBER, '');
    expect(url).toBe(`https://wa.me/${PHONE_NUMBER}?text=`);
  });
});
