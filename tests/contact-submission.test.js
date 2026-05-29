/**
 * Unit tests for contact form submission handler
 * Tests: handleFormSubmission, honeypot check, timeout, success/failure handling
 * Requirements: 3.2, 3.3, 3.4, 3.6, 3.7, 3.8
 */

const {
  handleFormSubmission,
  initFormSubmission,
  showFormStatus,
  clearFormStatus,
  setSubmitLoading,
  clearAllErrors,
  FORMSPREE_ENDPOINT,
  SUBMISSION_TIMEOUT
} = require('../js/contact.js');

// Helper to create the full form DOM structure
function setupFormDOM() {
  document.body.innerHTML = `
    <form id="contact-form" action="https://formspree.io/f/xformid" method="POST">
      <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
      <input id="contact-name" name="name" class="form-input" aria-invalid="false" value="John Doe">
      <span id="contact-name-error" class="form-error" role="alert"></span>
      <input id="contact-email" name="email" class="form-input" aria-invalid="false" value="john@example.com">
      <span id="contact-email-error" class="form-error" role="alert"></span>
      <input id="contact-phone" name="phone" class="form-input" aria-invalid="false" value="9876543210">
      <span id="contact-phone-error" class="form-error" role="alert"></span>
      <input id="contact-company" name="company" class="form-input" value="">
      <span id="contact-company-error" class="form-error" role="alert"></span>
      <select id="contact-subject" name="subject" class="form-input" aria-invalid="false">
        <option value="" disabled>Select a subject</option>
        <option value="Product Inquiry" selected>Product Inquiry</option>
      </select>
      <span id="contact-subject-error" class="form-error" role="alert"></span>
      <textarea id="contact-message" name="message" class="form-input" aria-invalid="false">I would like to know more about your products and services.</textarea>
      <span id="contact-message-error" class="form-error" role="alert"></span>
      <button type="submit" id="contact-submit" class="btn btn--primary btn--submit">
        <span class="btn__text">Send Message</span>
        <span class="btn__loading" aria-hidden="true">Sending...</span>
      </button>
      <div id="form-status" class="form-status" role="alert" aria-live="polite"></div>
    </form>
  `;
}

// Helper to create a mock submit event
function createSubmitEvent() {
  var event = new Event('submit', { bubbles: true, cancelable: true });
  return event;
}

describe('Form Submission Handler - Constants', () => {
  test('FORMSPREE_ENDPOINT is defined', () => {
    expect(FORMSPREE_ENDPOINT).toBe('https://formspree.io/f/xformid');
  });

  test('SUBMISSION_TIMEOUT is 10 seconds', () => {
    expect(SUBMISSION_TIMEOUT).toBe(10000);
  });
});

describe('showFormStatus', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="form-status" class="form-status" role="alert"></div>';
  });

  test('shows success message with correct class', () => {
    showFormStatus('success', '<strong>Thank you!</strong> Message sent.');
    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toBe('form-status form-status--success');
    expect(statusEl.innerHTML).toContain('Thank you!');
  });

  test('shows error message with correct class', () => {
    showFormStatus('error', '<strong>Error.</strong> Try again.');
    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toBe('form-status form-status--error');
    expect(statusEl.innerHTML).toContain('Error.');
  });
});

describe('clearFormStatus', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="form-status" class="form-status form-status--success">Some message</div>';
  });

  test('clears status message and resets class', () => {
    clearFormStatus();
    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toBe('form-status');
    expect(statusEl.innerHTML).toBe('');
  });
});

describe('setSubmitLoading', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button id="contact-submit" class="btn btn--primary">Send</button>';
  });

  test('disables button and adds loading class when true', () => {
    setSubmitLoading(true);
    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains('btn--loading')).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  test('enables button and removes loading class when false', () => {
    setSubmitLoading(true);
    setSubmitLoading(false);
    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(false);
    expect(btn.classList.contains('btn--loading')).toBe(false);
    expect(btn.getAttribute('aria-busy')).toBe('false');
  });
});

describe('handleFormSubmission - Honeypot check (Requirement 3.6)', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('silently discards submission when honeypot is filled and shows fake success', () => {
    // Fill the honeypot field
    var honeypot = document.querySelector('input[name="_gotcha"]');
    honeypot.value = 'bot-filled-this';

    var event = createSubmitEvent();
    var form = document.getElementById('contact-form');
    form.dispatchEvent(event);

    // Manually call handler since we need to test the function directly
    handleFormSubmission(event);

    // Should NOT call fetch
    expect(global.fetch).not.toHaveBeenCalled();

    // Should show fake success message
    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toContain('form-status--success');
    expect(statusEl.innerHTML).toContain('Thank you!');
  });

  test('does not discard submission when honeypot is empty', () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    var event = createSubmitEvent();
    handleFormSubmission(event);

    // Should call fetch since honeypot is empty
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('handleFormSubmission - Validation (Requirement 3.3)', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('displays errors and does not submit when form is invalid', () => {
    // Make name field empty (invalid)
    document.getElementById('contact-name').value = '';

    var event = createSubmitEvent();
    handleFormSubmission(event);

    // Should NOT call fetch
    expect(global.fetch).not.toHaveBeenCalled();

    // Should display error for name field
    var nameError = document.getElementById('contact-name-error');
    expect(nameError.textContent).toBe('Name is required');
  });

  test('preserves field values when validation fails', () => {
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = 'valid@email.com';

    var event = createSubmitEvent();
    handleFormSubmission(event);

    // Email value should be preserved
    expect(document.getElementById('contact-email').value).toBe('valid@email.com');
  });
});

describe('handleFormSubmission - Submit button disabled (Requirement 3.2)', () => {
  beforeEach(() => {
    setupFormDOM();
    jest.useFakeTimers();
    // Mock fetch to return a pending promise we can control
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  test('disables submit button during submission', () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains('btn--loading')).toBe(true);
  });
});

describe('handleFormSubmission - Success (Requirement 3.7)', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('shows confirmation message on success', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    // Wait for fetch promise to resolve
    await Promise.resolve();
    await Promise.resolve();

    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toContain('form-status--success');
    expect(statusEl.innerHTML).toContain('Thank you!');
  });

  test('resets form on success', async () => {
    // Change a field value from its default to verify reset restores defaults
    var nameField = document.getElementById('contact-name');
    nameField.value = 'Changed Name';

    var form = document.getElementById('contact-form');
    var resetSpy = jest.spyOn(form, 'reset');

    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();

    // form.reset() should have been called
    expect(resetSpy).toHaveBeenCalled();
  });

  test('re-enables submit button on success', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();

    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(false);
    expect(btn.classList.contains('btn--loading')).toBe(false);
  });

  test('submits to Formspree with Accept: application/json header', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    expect(global.fetch).toHaveBeenCalledWith(
      FORMSPREE_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      })
    );
  });
});

describe('handleFormSubmission - Failure (Requirement 3.4)', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('shows error message with alternative contact methods on HTTP failure', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();

    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toContain('form-status--error');
    expect(statusEl.innerHTML).toContain('Submission failed');
    expect(statusEl.innerHTML).toContain('+91 94229 66662');
    expect(statusEl.innerHTML).toContain('lubricantsessential@gmail.com');
    expect(statusEl.innerHTML).toContain('wa.me/919422966662');
  });

  test('preserves form data on failure (does not reset)', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();

    // Form data should be preserved
    var nameField = document.getElementById('contact-name');
    expect(nameField.value).toBe('John Doe');
  });

  test('re-enables submit button on failure', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();

    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(false);
  });
});

describe('handleFormSubmission - Network error (Requirement 3.4)', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('shows network error message with alternative contact methods', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();
    // Extra tick for catch handler
    await Promise.resolve();

    var statusEl = document.getElementById('form-status');
    expect(statusEl.className).toContain('form-status--error');
    expect(statusEl.innerHTML).toContain('Network error');
    expect(statusEl.innerHTML).toContain('+91 94229 66662');
    expect(statusEl.innerHTML).toContain('lubricantsessential@gmail.com');
  });

  test('preserves form data on network error', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    var nameField = document.getElementById('contact-name');
    expect(nameField.value).toBe('John Doe');
  });

  test('re-enables submit button on network error', async () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(false);
  });
});

describe('handleFormSubmission - Timeout (Requirement 3.8)', () => {
  beforeEach(() => {
    setupFormDOM();
    jest.useFakeTimers();
    // Mock AbortController
    global.AbortController = jest.fn().mockImplementation(() => ({
      signal: {},
      abort: jest.fn()
    }));
    // Mock fetch that never resolves (simulates timeout)
    global.fetch = jest.fn().mockImplementation(function(url, options) {
      return new Promise(function(resolve, reject) {
        // Listen for abort
        if (options && options.signal) {
          // Simulate abort behavior - reject when abort is called
          var originalAbort = global.AbortController.mock.results[global.AbortController.mock.results.length - 1].value.abort;
          global.AbortController.mock.results[global.AbortController.mock.results.length - 1].value.abort = function() {
            originalAbort();
            reject(new DOMException('The operation was aborted', 'AbortError'));
          };
        }
      });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
    delete global.AbortController;
  });

  test('timeout is set to 10 seconds', () => {
    expect(SUBMISSION_TIMEOUT).toBe(10000);
  });

  test('disables submit button while waiting', () => {
    var event = createSubmitEvent();
    handleFormSubmission(event);

    var btn = document.getElementById('contact-submit');
    expect(btn.disabled).toBe(true);
  });
});

describe('handleFormSubmission - prevents default form submission', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('calls preventDefault on the event', () => {
    var event = createSubmitEvent();
    var preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    handleFormSubmission(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe('initFormSubmission', () => {
  beforeEach(() => {
    setupFormDOM();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('attaches submit event listener to the form', () => {
    initFormSubmission();

    var form = document.getElementById('contact-form');
    var event = new Event('submit', { bubbles: true, cancelable: true });
    var preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    form.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
