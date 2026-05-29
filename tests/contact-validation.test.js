/**
 * Unit tests for contact form validation functions
 * Tests: validateEmail, validatePhone, validateName, validateMessage, validateSubject, validateForm
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

const {
  validateEmail,
  validatePhone,
  validateName,
  validateMessage,
  validateSubject,
  validateForm,
  displayErrors,
  clearFieldError,
  initFormValidationListeners
} = require('../js/contact.js');

// ============================================================
// validateEmail tests (Requirement 4.1)
// ============================================================
describe('validateEmail', () => {
  test('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.name@domain.co.in')).toBe(true);
    expect(validateEmail('a@b.c')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
  });

  test('rejects emails with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
    expect(validateEmail('user@ example.com')).toBe(false);
    expect(validateEmail(' user@example.com')).toBe(false);
    expect(validateEmail('user@example.com ')).toBe(false);
  });

  test('rejects emails without @ symbol', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  test('rejects emails without domain dot', () => {
    expect(validateEmail('user@example')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('rejects emails exceeding 254 characters', () => {
    var longLocal = 'a'.repeat(243);
    var longEmail = longLocal + '@example.com'; // 255 chars
    expect(validateEmail(longEmail)).toBe(false);
  });

  test('accepts emails at exactly 254 characters', () => {
    var longLocal = 'a'.repeat(242);
    var email254 = longLocal + '@example.com'; // 254 chars
    expect(validateEmail(email254)).toBe(true);
  });

  test('rejects non-string inputs', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
    expect(validateEmail(123)).toBe(false);
  });
});

// ============================================================
// validatePhone tests (Requirement 4.2)
// ============================================================
describe('validatePhone', () => {
  test('accepts valid 10-digit Indian mobile numbers', () => {
    expect(validatePhone('9876543210')).toBe(true);
    expect(validatePhone('6123456789')).toBe(true);
    expect(validatePhone('7000000000')).toBe(true);
    expect(validatePhone('8999999999')).toBe(true);
  });

  test('accepts numbers with spaces, hyphens, and parentheses', () => {
    expect(validatePhone('98765 43210')).toBe(true);
    expect(validatePhone('987-654-3210')).toBe(true);
    expect(validatePhone('(98) 765 43210')).toBe(true);
    expect(validatePhone('98 7654 3210')).toBe(true);
  });

  test('rejects numbers not starting with 6-9', () => {
    expect(validatePhone('5876543210')).toBe(false);
    expect(validatePhone('0876543210')).toBe(false);
    expect(validatePhone('1234567890')).toBe(false);
  });

  test('rejects numbers with fewer than 10 digits', () => {
    expect(validatePhone('987654321')).toBe(false);
    expect(validatePhone('98765')).toBe(false);
  });

  test('rejects numbers with more than 10 digits', () => {
    expect(validatePhone('98765432101')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validatePhone('')).toBe(false);
  });

  test('rejects non-string inputs', () => {
    expect(validatePhone(null)).toBe(false);
    expect(validatePhone(undefined)).toBe(false);
    expect(validatePhone(9876543210)).toBe(false);
  });
});

// ============================================================
// validateName tests (Requirement 4.3)
// ============================================================
describe('validateName', () => {
  test('accepts valid names', () => {
    expect(validateName('John Doe')).toBe(true);
    expect(validateName('A')).toBe(true);
    expect(validateName('Shripad Savangikar')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(validateName('')).toBe(false);
  });

  test('rejects whitespace-only strings', () => {
    expect(validateName('   ')).toBe(false);
    expect(validateName('\t\n')).toBe(false);
  });

  test('rejects strings exceeding 100 characters', () => {
    var longName = 'A'.repeat(101);
    expect(validateName(longName)).toBe(false);
  });

  test('accepts strings at exactly 100 characters', () => {
    var name100 = 'A'.repeat(100);
    expect(validateName(name100)).toBe(true);
  });

  test('rejects non-string inputs', () => {
    expect(validateName(null)).toBe(false);
    expect(validateName(undefined)).toBe(false);
    expect(validateName(123)).toBe(false);
  });
});

// ============================================================
// validateMessage tests (Requirement 4.4)
// ============================================================
describe('validateMessage', () => {
  test('accepts messages between 10 and 1000 characters (trimmed)', () => {
    expect(validateMessage('Hello there!')).toBe(true);
    expect(validateMessage('A'.repeat(10))).toBe(true);
    expect(validateMessage('A'.repeat(1000))).toBe(true);
    expect(validateMessage('A'.repeat(500))).toBe(true);
  });

  test('rejects messages shorter than 10 characters after trimming', () => {
    expect(validateMessage('Hi')).toBe(false);
    expect(validateMessage('123456789')).toBe(false);
    expect(validateMessage('   short   ')).toBe(false);
  });

  test('rejects messages longer than 1000 characters after trimming', () => {
    var longMessage = 'A'.repeat(1001);
    expect(validateMessage(longMessage)).toBe(false);
  });

  test('trims whitespace before checking length', () => {
    // 10 chars of content with surrounding whitespace
    expect(validateMessage('   ' + 'A'.repeat(10) + '   ')).toBe(true);
    // Only whitespace, trimmed to 0
    expect(validateMessage('          ')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateMessage('')).toBe(false);
  });

  test('rejects non-string inputs', () => {
    expect(validateMessage(null)).toBe(false);
    expect(validateMessage(undefined)).toBe(false);
  });
});

// ============================================================
// validateSubject tests (Requirement 4.5)
// ============================================================
describe('validateSubject', () => {
  test('accepts valid subject selections', () => {
    expect(validateSubject('Product Inquiry')).toBe(true);
    expect(validateSubject('Service Request')).toBe(true);
    expect(validateSubject('Quote Request')).toBe(true);
    expect(validateSubject('General')).toBe(true);
  });

  test('rejects empty string (no option selected)', () => {
    expect(validateSubject('')).toBe(false);
  });

  test('rejects whitespace-only string', () => {
    expect(validateSubject('   ')).toBe(false);
  });

  test('rejects non-string inputs', () => {
    expect(validateSubject(null)).toBe(false);
    expect(validateSubject(undefined)).toBe(false);
  });
});

// ============================================================
// validateForm tests (Requirements 4.6, 4.7)
// ============================================================
describe('validateForm', () => {
  var validFormData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    subject: 'Product Inquiry',
    message: 'I would like to know more about your products.'
  };

  test('returns isValid true for valid form data', () => {
    var result = validateForm(validFormData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns all errors simultaneously for multiple invalid fields', () => {
    var invalidData = {
      name: '',
      email: 'invalid',
      phone: '123',
      subject: '',
      message: 'short'
    };
    var result = validateForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(5);

    var fieldNames = result.errors.map(function(e) { return e.field; });
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('phone');
    expect(fieldNames).toContain('subject');
    expect(fieldNames).toContain('message');
  });

  test('returns specific error messages for each field', () => {
    var invalidData = {
      name: '',
      email: 'john@example.com',
      phone: '9876543210',
      subject: 'General',
      message: 'A valid message here.'
    };
    var result = validateForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('name');
    expect(result.errors[0].message).toBe('Name is required');
  });

  test('provides appropriate error message for name exceeding 100 chars', () => {
    var data = { ...validFormData, name: 'A'.repeat(101) };
    var result = validateForm(data);
    expect(result.isValid).toBe(false);
    var nameError = result.errors.find(function(e) { return e.field === 'name'; });
    expect(nameError.message).toBe('Name must not exceed 100 characters');
  });

  test('provides appropriate error message for email exceeding 254 chars', () => {
    var data = { ...validFormData, email: 'a'.repeat(243) + '@example.com' };
    var result = validateForm(data);
    expect(result.isValid).toBe(false);
    var emailError = result.errors.find(function(e) { return e.field === 'email'; });
    expect(emailError.message).toBe('Email must not exceed 254 characters');
  });

  test('provides appropriate error message for message exceeding 1000 chars', () => {
    var data = { ...validFormData, message: 'A'.repeat(1001) };
    var result = validateForm(data);
    expect(result.isValid).toBe(false);
    var msgError = result.errors.find(function(e) { return e.field === 'message'; });
    expect(msgError.message).toBe('Message must not exceed 1000 characters');
  });
});

// ============================================================
// DOM interaction tests (Requirements 4.6, 4.7)
// ============================================================
describe('displayErrors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form">
        <input id="contact-name" class="form-input" aria-invalid="false" aria-describedby="contact-name-error">
        <span id="contact-name-error" class="form-error"></span>
        <input id="contact-email" class="form-input" aria-invalid="false" aria-describedby="contact-email-error">
        <span id="contact-email-error" class="form-error"></span>
        <input id="contact-phone" class="form-input" aria-invalid="false" aria-describedby="contact-phone-error">
        <span id="contact-phone-error" class="form-error"></span>
        <select id="contact-subject" class="form-input" aria-invalid="false" aria-describedby="contact-subject-error">
          <option value="">Select</option>
        </select>
        <span id="contact-subject-error" class="form-error"></span>
        <textarea id="contact-message" class="form-input" aria-invalid="false" aria-describedby="contact-message-error"></textarea>
        <span id="contact-message-error" class="form-error"></span>
      </form>
    `;
  });

  test('displays error messages next to invalid fields', () => {
    var errors = [
      { field: 'name', message: 'Name is required' },
      { field: 'email', message: 'Please enter a valid email address' }
    ];

    displayErrors(errors);

    var nameError = document.getElementById('contact-name-error');
    var emailError = document.getElementById('contact-email-error');
    expect(nameError.textContent).toBe('Name is required');
    expect(emailError.textContent).toBe('Please enter a valid email address');
  });

  test('sets aria-invalid to true on invalid fields', () => {
    var errors = [{ field: 'name', message: 'Name is required' }];
    displayErrors(errors);

    var nameField = document.getElementById('contact-name');
    expect(nameField.getAttribute('aria-invalid')).toBe('true');
  });

  test('adds form-input--invalid CSS class on invalid fields', () => {
    var errors = [{ field: 'phone', message: 'Invalid phone' }];
    displayErrors(errors);

    var phoneField = document.getElementById('contact-phone');
    expect(phoneField.classList.contains('form-input--invalid')).toBe(true);
  });

  test('displays all errors simultaneously', () => {
    var errors = [
      { field: 'name', message: 'Name is required' },
      { field: 'email', message: 'Invalid email' },
      { field: 'phone', message: 'Invalid phone' },
      { field: 'subject', message: 'Select a subject' },
      { field: 'message', message: 'Message too short' }
    ];

    displayErrors(errors);

    expect(document.getElementById('contact-name-error').textContent).toBe('Name is required');
    expect(document.getElementById('contact-email-error').textContent).toBe('Invalid email');
    expect(document.getElementById('contact-phone-error').textContent).toBe('Invalid phone');
    expect(document.getElementById('contact-subject-error').textContent).toBe('Select a subject');
    expect(document.getElementById('contact-message-error').textContent).toBe('Message too short');
  });
});

describe('clearFieldError', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="contact-name" class="form-input form-input--invalid" aria-invalid="true">
      <span id="contact-name-error" class="form-error">Name is required</span>
    `;
  });

  test('removes error message text', () => {
    clearFieldError('contact-name');
    var errorSpan = document.getElementById('contact-name-error');
    expect(errorSpan.textContent).toBe('');
  });

  test('sets aria-invalid to false', () => {
    clearFieldError('contact-name');
    var field = document.getElementById('contact-name');
    expect(field.getAttribute('aria-invalid')).toBe('false');
  });

  test('removes form-input--invalid CSS class', () => {
    clearFieldError('contact-name');
    var field = document.getElementById('contact-name');
    expect(field.classList.contains('form-input--invalid')).toBe(false);
  });
});

describe('initFormValidationListeners - blur clears errors when corrected', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form">
        <input id="contact-name" class="form-input form-input--invalid" aria-invalid="true" value="John Doe">
        <span id="contact-name-error" class="form-error">Name is required</span>
        <input id="contact-email" class="form-input form-input--invalid" aria-invalid="true" value="john@example.com">
        <span id="contact-email-error" class="form-error">Invalid email</span>
        <input id="contact-phone" class="form-input" aria-invalid="false" value="">
        <span id="contact-phone-error" class="form-error"></span>
        <select id="contact-subject" class="form-input" aria-invalid="false">
          <option value="">Select</option>
          <option value="General">General</option>
        </select>
        <span id="contact-subject-error" class="form-error"></span>
        <textarea id="contact-message" class="form-input" aria-invalid="false"></textarea>
        <span id="contact-message-error" class="form-error"></span>
      </form>
    `;
    jest.useFakeTimers();
    initFormValidationListeners();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('clears error on blur when field is corrected', () => {
    var nameField = document.getElementById('contact-name');
    nameField.dispatchEvent(new Event('blur'));
    jest.runAllTimers();

    expect(document.getElementById('contact-name-error').textContent).toBe('');
    expect(nameField.getAttribute('aria-invalid')).toBe('false');
    expect(nameField.classList.contains('form-input--invalid')).toBe(false);
  });

  test('does not clear error on blur when field is still invalid', () => {
    var emailField = document.getElementById('contact-email');
    emailField.value = 'invalid-email';
    emailField.dispatchEvent(new Event('blur'));
    jest.runAllTimers();

    expect(document.getElementById('contact-email-error').textContent).toBe('Invalid email');
    expect(emailField.getAttribute('aria-invalid')).toBe('true');
  });

  test('does not attempt to clear error if field has no error', () => {
    var phoneField = document.getElementById('contact-phone');
    phoneField.value = '9876543210';
    phoneField.dispatchEvent(new Event('blur'));
    jest.runAllTimers();

    // Should remain unchanged (no error to clear)
    expect(document.getElementById('contact-phone-error').textContent).toBe('');
    expect(phoneField.getAttribute('aria-invalid')).toBe('false');
  });
});
