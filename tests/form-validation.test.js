/**
 * Property-Based Tests for Form Validation
 *
 * Property 4: Email Validation Correctness
 * Property 5: Phone Validation Correctness
 * Property 6: Name Validation Rejects Invalid Input
 * Property 7: Message Length Validation
 * Property 8: Simultaneous Error Reporting
 * Property 9: Honeypot Spam Rejection
 *
 * Validates: Requirements 3.3, 3.6, 4.1, 4.2, 4.3, 4.4, 4.6
 */

'use strict';

const fc = require('fast-check');
const {
  validateEmail,
  validatePhone,
  validateName,
  validateMessage,
  validateForm,
  handleFormSubmission
} = require('../js/contact.js');

// ============================================================
// GENERATORS
// ============================================================

/**
 * Generates a valid email: local@domain.tld
 * - No spaces anywhere
 * - At least one char before @, between @ and ., and after .
 * - Total length <= 254
 */
const validEmailArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789._+-'), { minLength: 1, maxLength: 60 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 60 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 20 })
).map(([local, domain, tld]) => {
  const email = `${local}@${domain}.${tld}`;
  // Ensure total length <= 254
  if (email.length > 254) {
    return email.substring(0, 254);
  }
  return email;
}).filter(email => {
  // Ensure the truncation didn't break the structure
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  if (parts[0].length === 0) return false;
  const domainParts = parts[1].split('.');
  if (domainParts.length < 2) return false;
  if (domainParts.some(p => p.length === 0)) return false;
  // No spaces
  if (/\s/.test(email)) return false;
  return true;
});

/**
 * Generates an invalid email (various failure modes).
 */
const invalidEmailArb = fc.oneof(
  // Empty string
  fc.constant(''),
  // No @ symbol
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789.'), { minLength: 1, maxLength: 30 })
    .filter(s => !s.includes('@')),
  // Contains spaces
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 5 })
  ).map(([local, domain, tld]) => `${local} @${domain}.${tld}`),
  // No dot after @
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 })
  ).map(([local, domain]) => `${local}@${domain}`),
  // Exceeds 254 characters
  fc.constant('a'.repeat(243) + '@example.com') // 255 chars
);

/**
 * Generates a valid Indian mobile number (10 digits starting with 6-9).
 * May include formatting characters (spaces, hyphens, parentheses).
 */
const validPhoneArb = fc.tuple(
  fc.constantFrom('6', '7', '8', '9'),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 9, maxLength: 9 })
).chain(([first, rest]) => {
  const digits = first + rest;
  // Optionally add formatting
  return fc.constantFrom(
    digits,
    `${digits.slice(0, 5)} ${digits.slice(5)}`,
    `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
    `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
  );
});

/**
 * Generates an invalid phone number (various failure modes).
 */
const invalidPhoneArb = fc.oneof(
  // Empty string
  fc.constant(''),
  // Starts with 0-5 (invalid first digit)
  fc.tuple(
    fc.constantFrom('0', '1', '2', '3', '4', '5'),
    fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 9, maxLength: 9 })
  ).map(([first, rest]) => first + rest),
  // Too few digits (less than 10)
  fc.tuple(
    fc.constantFrom('6', '7', '8', '9'),
    fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 1, maxLength: 8 })
  ).map(([first, rest]) => first + rest),
  // Too many digits (more than 10)
  fc.tuple(
    fc.constantFrom('6', '7', '8', '9'),
    fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 10, maxLength: 15 })
  ).map(([first, rest]) => first + rest)
);

/**
 * Generates an invalid name: empty, whitespace-only, or over 100 chars.
 */
const invalidNameArb = fc.oneof(
  // Empty string
  fc.constant(''),
  // Whitespace-only
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 }),
  // Over 100 characters (trimmed content > 100)
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz '), { minLength: 101, maxLength: 150 })
    .filter(s => s.trim().length > 100)
);

/**
 * Generates a valid name: non-empty, non-whitespace-only, <= 100 chars trimmed.
 */
const validNameArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '),
  { minLength: 1, maxLength: 100 }
).filter(s => s.trim().length > 0 && s.trim().length <= 100);

/**
 * Generates an invalid message: trimmed length < 10 or > 1000.
 */
const invalidMessageArb = fc.oneof(
  // Too short (trimmed < 10)
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 0, maxLength: 9 }),
  // Whitespace-padded but trimmed content < 10
  fc.tuple(
    fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 0, maxLength: 9 }),
    fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 })
  ).map(([pre, content, post]) => pre + content + post).filter(s => s.trim().length < 10),
  // Too long (trimmed > 1000)
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz '), { minLength: 1001, maxLength: 1100 })
    .filter(s => s.trim().length > 1000)
);

/**
 * Generates a valid message: trimmed length between 10 and 1000.
 */
const validMessageArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ.,!? '),
  { minLength: 10, maxLength: 200 }
).filter(s => s.trim().length >= 10 && s.trim().length <= 1000);

/**
 * Generates a valid subject selection.
 */
const validSubjectArb = fc.constantFrom('Product Inquiry', 'Service Request', 'Quote Request', 'General');

/**
 * Generates a non-empty honeypot value (spam indicator).
 */
const nonEmptyHoneypotArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789 '),
  { minLength: 1, maxLength: 50 }
);

// ============================================================
// PROPERTY TESTS
// ============================================================

describe('Property 4: Email Validation Correctness', () => {
  /**
   * **Validates: Requirements 4.1**
   *
   * For any input string, the Form_Validator email check SHALL return true if and only if
   * the string contains no spaces, matches the pattern of one-or-more-characters@one-or-more-characters.one-or-more-characters,
   * and does not exceed 254 characters in total length.
   */

  test('accepts all valid emails (no spaces, chars@chars.chars, <= 254 chars)', () => {
    fc.assert(
      fc.property(
        validEmailArb,
        (email) => {
          expect(validateEmail(email)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('rejects all invalid emails', () => {
    fc.assert(
      fc.property(
        invalidEmailArb,
        (email) => {
          expect(validateEmail(email)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('rejects any string containing a space character', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.includes(' ')),
        (str) => {
          expect(validateEmail(str)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rejects any string exceeding 254 characters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 255, max: 500 }),
        (len) => {
          // Build a structurally valid email that exceeds 254 chars
          const local = 'a'.repeat(len - 12); // subtract @example.com length
          const email = local + '@example.com';
          expect(validateEmail(email)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 5: Phone Validation Correctness', () => {
  /**
   * **Validates: Requirements 4.2**
   *
   * For any input string, the Form_Validator phone check SHALL return true if and only if
   * the string (after removing spaces, hyphens, and parentheses) is exactly 10 digits long
   * and starts with a digit between 6 and 9.
   */

  test('accepts all valid Indian mobile numbers (10 digits starting 6-9, with optional formatting)', () => {
    fc.assert(
      fc.property(
        validPhoneArb,
        (phone) => {
          expect(validatePhone(phone)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('rejects all invalid phone numbers', () => {
    fc.assert(
      fc.property(
        invalidPhoneArb,
        (phone) => {
          expect(validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('validation result depends only on cleaned digits (formatting is irrelevant)', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('6', '7', '8', '9'),
          fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 9, maxLength: 9 })
        ),
        ([first, rest]) => {
          const digits = first + rest;
          // All formatting variants should produce the same result
          const plain = validatePhone(digits);
          const withSpaces = validatePhone(`${digits.slice(0, 5)} ${digits.slice(5)}`);
          const withHyphens = validatePhone(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
          const withParens = validatePhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);

          expect(withSpaces).toBe(plain);
          expect(withHyphens).toBe(plain);
          expect(withParens).toBe(plain);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Name Validation Rejects Invalid Input', () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * For any string that is empty, composed entirely of whitespace characters,
   * or exceeds 100 characters, the Form_Validator SHALL reject it as an invalid name.
   */

  test('rejects all invalid names (empty, whitespace-only, or over 100 chars)', () => {
    fc.assert(
      fc.property(
        invalidNameArb,
        (name) => {
          expect(validateName(name)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('accepts all valid names (non-empty, non-whitespace-only, <= 100 chars trimmed)', () => {
    fc.assert(
      fc.property(
        validNameArb,
        (name) => {
          expect(validateName(name)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('empty string is always rejected', () => {
    expect(validateName('')).toBe(false);
  });

  test('any whitespace-only string is rejected', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }),
        (ws) => {
          expect(validateName(ws)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('any string with trimmed length > 100 is rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 300 }),
        (len) => {
          const name = 'A'.repeat(len);
          expect(validateName(name)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 7: Message Length Validation', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any string whose trimmed length is less than 10 characters or greater than 1000 characters,
   * the Form_Validator SHALL reject it as an invalid message.
   */

  test('rejects all messages with trimmed length < 10 or > 1000', () => {
    fc.assert(
      fc.property(
        invalidMessageArb,
        (message) => {
          expect(validateMessage(message)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('accepts all messages with trimmed length between 10 and 1000', () => {
    fc.assert(
      fc.property(
        validMessageArb,
        (message) => {
          expect(validateMessage(message)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('validation uses trimmed length (leading/trailing whitespace ignored)', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 20 }),
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 10, maxLength: 50 }),
          fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 20 })
        ),
        ([pre, content, post]) => {
          const message = pre + content + post;
          // Content is 10-50 chars, so trimmed length is always valid
          expect(validateMessage(message)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('boundary: exactly 10 chars trimmed is accepted', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 10, maxLength: 10 }),
        (msg) => {
          expect(validateMessage(msg)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('boundary: exactly 9 chars trimmed is rejected', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 9, maxLength: 9 }),
        (msg) => {
          expect(validateMessage(msg)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 8: Simultaneous Error Reporting', () => {
  /**
   * **Validates: Requirements 3.3, 4.6**
   *
   * For any form submission containing multiple invalid fields, the Form_Validator SHALL
   * report errors for all invalid fields simultaneously without clearing any form field values,
   * rather than stopping at the first error.
   */

  test('reports errors for ALL invalid fields at once', () => {
    fc.assert(
      fc.property(
        // Generate form data where a random subset of fields are invalid
        fc.record({
          nameValid: fc.boolean(),
          emailValid: fc.boolean(),
          phoneValid: fc.boolean(),
          subjectValid: fc.boolean(),
          messageValid: fc.boolean()
        }).filter(r => {
          // Ensure at least 2 fields are invalid to test simultaneous reporting
          const invalidCount = [r.nameValid, r.emailValid, r.phoneValid, r.subjectValid, r.messageValid]
            .filter(v => !v).length;
          return invalidCount >= 2;
        }),
        (flags) => {
          const formData = {
            name: flags.nameValid ? 'John Doe' : '',
            email: flags.emailValid ? 'john@example.com' : 'invalid',
            phone: flags.phoneValid ? '9876543210' : '123',
            subject: flags.subjectValid ? 'General' : '',
            message: flags.messageValid ? 'This is a valid message for testing.' : 'short'
          };

          const result = validateForm(formData);

          // Count expected invalid fields
          const expectedInvalidFields = [];
          if (!flags.nameValid) expectedInvalidFields.push('name');
          if (!flags.emailValid) expectedInvalidFields.push('email');
          if (!flags.phoneValid) expectedInvalidFields.push('phone');
          if (!flags.subjectValid) expectedInvalidFields.push('subject');
          if (!flags.messageValid) expectedInvalidFields.push('message');

          // All invalid fields should be reported
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBe(expectedInvalidFields.length);

          const reportedFields = result.errors.map(e => e.field);
          for (const field of expectedInvalidFields) {
            expect(reportedFields).toContain(field);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('does not clear form field values when reporting errors (values remain unchanged)', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.constantFrom('', '   ', 'Valid Name'),
          email: fc.constantFrom('invalid', 'no-at-sign', 'valid@email.com'),
          phone: fc.constantFrom('123', '555', '9876543210'),
          subject: fc.constantFrom('', 'General'),
          message: fc.constantFrom('short', 'x', 'This is a valid message for testing purposes.')
        }).filter(data => {
          // Ensure at least one field is invalid
          return !validateName(data.name) || !validateEmail(data.email) ||
                 !validatePhone(data.phone) || data.subject === '' ||
                 !validateMessage(data.message);
        }),
        (formData) => {
          // Store original values
          const originalName = formData.name;
          const originalEmail = formData.email;
          const originalPhone = formData.phone;
          const originalSubject = formData.subject;
          const originalMessage = formData.message;

          // Run validation
          validateForm(formData);

          // Values should not be mutated
          expect(formData.name).toBe(originalName);
          expect(formData.email).toBe(originalEmail);
          expect(formData.phone).toBe(originalPhone);
          expect(formData.subject).toBe(originalSubject);
          expect(formData.message).toBe(originalMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('each error has both field name and message', () => {
    fc.assert(
      fc.property(
        fc.record({
          nameValid: fc.boolean(),
          emailValid: fc.boolean(),
          phoneValid: fc.boolean(),
          subjectValid: fc.boolean(),
          messageValid: fc.boolean()
        }).filter(r => {
          const invalidCount = [r.nameValid, r.emailValid, r.phoneValid, r.subjectValid, r.messageValid]
            .filter(v => !v).length;
          return invalidCount >= 1;
        }),
        (flags) => {
          const formData = {
            name: flags.nameValid ? 'John Doe' : '',
            email: flags.emailValid ? 'john@example.com' : 'invalid',
            phone: flags.phoneValid ? '9876543210' : '123',
            subject: flags.subjectValid ? 'General' : '',
            message: flags.messageValid ? 'This is a valid message for testing.' : 'short'
          };

          const result = validateForm(formData);

          for (const error of result.errors) {
            expect(error).toHaveProperty('field');
            expect(error).toHaveProperty('message');
            expect(typeof error.field).toBe('string');
            expect(typeof error.message).toBe('string');
            expect(error.field.length).toBeGreaterThan(0);
            expect(error.message.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 9: Honeypot Spam Rejection', () => {
  /**
   * **Validates: Requirements 3.6**
   *
   * For any form submission where the honeypot field contains a non-empty value,
   * the Contact_Form SHALL silently reject the submission without sending any data
   * to the Formspree endpoint.
   */

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form" action="https://formspree.io/f/xformid" method="POST">
        <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
        <input id="contact-name" name="name" class="form-input" aria-invalid="false" value="John Doe">
        <span id="contact-name-error" class="form-error" role="alert"></span>
        <input id="contact-email" name="email" class="form-input" aria-invalid="false" value="john@example.com">
        <span id="contact-email-error" class="form-error" role="alert"></span>
        <input id="contact-phone" name="phone" class="form-input" aria-invalid="false" value="9876543210">
        <span id="contact-phone-error" class="form-error" role="alert"></span>
        <select id="contact-subject" name="subject" class="form-input" aria-invalid="false">
          <option value="" disabled>Select a subject</option>
          <option value="Product Inquiry" selected>Product Inquiry</option>
        </select>
        <span id="contact-subject-error" class="form-error" role="alert"></span>
        <textarea id="contact-message" name="message" class="form-input" aria-invalid="false">I would like to know more about your products and services.</textarea>
        <span id="contact-message-error" class="form-error" role="alert"></span>
        <button type="submit" id="contact-submit" class="btn btn--primary">Send</button>
        <div id="form-status" class="form-status" role="alert" aria-live="polite"></div>
      </form>
    `;
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('any non-empty honeypot value causes silent rejection (no fetch call)', () => {
    fc.assert(
      fc.property(
        nonEmptyHoneypotArb,
        (honeypotValue) => {
          // Reset fetch mock for each iteration
          global.fetch.mockClear();

          // Fill the honeypot
          const honeypot = document.querySelector('input[name="_gotcha"]');
          honeypot.value = honeypotValue;

          // Create and dispatch submit event
          const event = new Event('submit', { bubbles: true, cancelable: true });
          event.preventDefault = jest.fn();
          handleFormSubmission(event);

          // fetch should NOT have been called
          expect(global.fetch).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('honeypot rejection shows fake success message (silent discard)', () => {
    fc.assert(
      fc.property(
        nonEmptyHoneypotArb,
        (honeypotValue) => {
          // Fill the honeypot
          const honeypot = document.querySelector('input[name="_gotcha"]');
          honeypot.value = honeypotValue;

          // Submit
          const event = new Event('submit', { bubbles: true, cancelable: true });
          event.preventDefault = jest.fn();
          handleFormSubmission(event);

          // Should show success message (fake) to fool bots
          const statusEl = document.getElementById('form-status');
          expect(statusEl.className).toContain('form-status--success');
          expect(statusEl.innerHTML).toContain('Thank you');
        }
      ),
      { numRuns: 50 }
    );
  });

  test('empty honeypot allows normal submission flow', () => {
    // Ensure honeypot is empty
    const honeypot = document.querySelector('input[name="_gotcha"]');
    honeypot.value = '';

    const event = new Event('submit', { bubbles: true, cancelable: true });
    event.preventDefault = jest.fn();
    handleFormSubmission(event);

    // fetch SHOULD have been called (form data is valid)
    expect(global.fetch).toHaveBeenCalled();
  });
});
