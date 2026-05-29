/**
 * Contact Form - Essential Lubricants Website
 * Handles: Form validation, submission, error display
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

'use strict';

// ============================================================
// PURE VALIDATION FUNCTIONS (no DOM access, independently testable)
// ============================================================

/**
 * Validates an email address.
 * Accepts: no spaces, matches chars@chars.chars pattern, max 254 chars.
 * @param {string} email - The email string to validate
 * @returns {boolean} true if valid
 */
function validateEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length === 0) return false;
  if (email.length > 254) return false;
  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Validates an Indian mobile phone number.
 * Strips spaces, hyphens, and parentheses, then checks for 10 digits starting with 6-9.
 * @param {string} phone - The phone string to validate
 * @returns {boolean} true if valid
 */
function validatePhone(phone) {
  if (typeof phone !== 'string') return false;
  var cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validates a name field.
 * Rejects empty/whitespace-only strings and strings exceeding 100 characters.
 * @param {string} name - The name string to validate
 * @returns {boolean} true if valid
 */
function validateName(name) {
  if (typeof name !== 'string') return false;
  var trimmed = name.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 100) return false;
  return true;
}

/**
 * Validates a message field.
 * Rejects trimmed length less than 10 or greater than 1000 characters.
 * @param {string} message - The message string to validate
 * @returns {boolean} true if valid
 */
function validateMessage(message) {
  if (typeof message !== 'string') return false;
  var trimmed = message.trim();
  if (trimmed.length < 10) return false;
  if (trimmed.length > 1000) return false;
  return true;
}

/**
 * Validates a subject selection.
 * Rejects if no option has been selected (empty string).
 * @param {string} subject - The subject value to validate
 * @returns {boolean} true if valid
 */
function validateSubject(subject) {
  if (typeof subject !== 'string') return false;
  return subject.trim().length > 0;
}

/**
 * Validates all form fields and returns an object with errors array and isValid boolean.
 * All fields are validated simultaneously — errors are collected for all invalid fields.
 * @param {object} formData - Object with name, email, phone, subject, message properties
 * @returns {{ isValid: boolean, errors: Array<{ field: string, message: string }> }}
 */
function validateForm(formData) {
  var errors = [];

  if (!validateName(formData.name)) {
    if (typeof formData.name === 'string' && formData.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    } else {
      errors.push({ field: 'name', message: 'Name is required' });
    }
  }

  if (!validateEmail(formData.email)) {
    if (typeof formData.email === 'string' && formData.email.length > 254) {
      errors.push({ field: 'email', message: 'Email must not exceed 254 characters' });
    } else {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
  }

  if (!validatePhone(formData.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid 10-digit mobile number starting with 6-9' });
  }

  if (!validateSubject(formData.subject)) {
    errors.push({ field: 'subject', message: 'Please select a subject' });
  }

  if (!validateMessage(formData.message)) {
    var trimmed = typeof formData.message === 'string' ? formData.message.trim() : '';
    if (trimmed.length > 1000) {
      errors.push({ field: 'message', message: 'Message must not exceed 1000 characters' });
    } else {
      errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// ============================================================
// DOM INTERACTION FUNCTIONS (display errors, clear errors, blur listeners)
// ============================================================

/**
 * Displays error messages next to each invalid field.
 * Sets aria-invalid="true" and adds form-input--invalid CSS class on invalid fields.
 * Does NOT clear any form field values.
 * @param {Array<{ field: string, message: string }>} errors - Array of error objects
 */
function displayErrors(errors) {
  for (var i = 0; i < errors.length; i++) {
    var error = errors[i];
    var fieldId = 'contact-' + error.field;
    var errorSpanId = fieldId + '-error';
    var field = document.getElementById(fieldId);
    var errorSpan = document.getElementById(errorSpanId);

    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('form-input--invalid');
    }

    if (errorSpan) {
      errorSpan.textContent = error.message;
    }
  }
}

/**
 * Removes the error message and invalid state for a specific field.
 * @param {string} fieldId - The ID of the form field (e.g., 'contact-name')
 */
function clearFieldError(fieldId) {
  var field = document.getElementById(fieldId);
  var errorSpan = document.getElementById(fieldId + '-error');

  if (field) {
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('form-input--invalid');
  }

  if (errorSpan) {
    errorSpan.textContent = '';
  }
}

/**
 * Initializes blur event listeners on form fields to clear errors when corrected.
 * Validates the field on blur and removes the error if the value is now valid.
 * Error removal happens within 1 second of the field losing focus.
 */
function initFormValidationListeners() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var fieldValidators = {
    'contact-name': function(value) { return validateName(value); },
    'contact-email': function(value) { return validateEmail(value); },
    'contact-phone': function(value) { return validatePhone(value); },
    'contact-subject': function(value) { return validateSubject(value); },
    'contact-message': function(value) { return validateMessage(value); }
  };

  var fieldIds = Object.keys(fieldValidators);

  for (var i = 0; i < fieldIds.length; i++) {
    (function(fieldId) {
      var field = document.getElementById(fieldId);
      if (!field) return;

      field.addEventListener('blur', function() {
        // Only clear error if the field previously had an error
        if (field.getAttribute('aria-invalid') === 'true') {
          var value = field.value;
          var isValid = fieldValidators[fieldId](value);

          if (isValid) {
            // Remove error within 1 second of blur (immediate removal)
            setTimeout(function() {
              clearFieldError(fieldId);
            }, 0);
          }
        }
      });
    })(fieldIds[i]);
  }
}

// ============================================================
// FORM SUBMISSION HANDLER (Requirements 3.2, 3.3, 3.4, 3.6, 3.7, 3.8)
// ============================================================

/** Formspree endpoint URL */
var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xformid';

/** Submission timeout in milliseconds */
var SUBMISSION_TIMEOUT = 10000;

/**
 * Shows a status message in the form status area.
 * @param {string} type - 'success' or 'error'
 * @param {string} message - The message HTML to display
 */
function showFormStatus(type, message) {
  var statusEl = document.getElementById('form-status');
  if (!statusEl) return;
  statusEl.className = 'form-status form-status--' + type;
  statusEl.innerHTML = message;
  statusEl.setAttribute('role', 'alert');
}

/**
 * Clears the form status message.
 */
function clearFormStatus() {
  var statusEl = document.getElementById('form-status');
  if (!statusEl) return;
  statusEl.className = 'form-status';
  statusEl.innerHTML = '';
}

/**
 * Clears all field error states from the form.
 */
function clearAllErrors() {
  var fieldIds = ['contact-name', 'contact-email', 'contact-phone', 'contact-subject', 'contact-message'];
  for (var i = 0; i < fieldIds.length; i++) {
    clearFieldError(fieldIds[i]);
  }
}

/**
 * Sets the submit button to a loading/disabled state.
 * @param {boolean} loading - Whether to show loading state
 */
function setSubmitLoading(loading) {
  var submitBtn = document.getElementById('contact-submit');
  if (!submitBtn) return;
  if (loading) {
    submitBtn.disabled = true;
    submitBtn.classList.add('btn--loading');
    submitBtn.setAttribute('aria-busy', 'true');
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove('btn--loading');
    submitBtn.setAttribute('aria-busy', 'false');
  }
}

/**
 * Handles the contact form submission.
 * - Prevents default form submission
 * - Collects FormData
 * - Checks honeypot field (silently discards if filled, shows fake success)
 * - Validates all fields
 * - Disables submit button during submission
 * - Submits to Formspree via fetch with Accept: application/json header
 * - Handles success: shows confirmation, resets form, re-enables button
 * - Handles failure: shows error with alternative contact methods, preserves data, re-enables button
 * - Handles timeout (10 seconds): treats as failure with timeout message
 *
 * @param {Event} event - The form submit event
 */
function handleFormSubmission(event) {
  event.preventDefault();

  var form = document.getElementById('contact-form');
  if (!form) return;

  // Clear previous status and errors
  clearFormStatus();
  clearAllErrors();

  // Collect form data
  var formData = new FormData(form);

  // Check honeypot field — silently discard if filled (show fake success)
  var honeypotValue = formData.get('_gotcha');
  if (honeypotValue && honeypotValue.length > 0) {
    // Show fake success to fool bots (Requirement 3.6)
    showFormStatus('success', '<strong>Thank you!</strong> Your inquiry has been received. We will get back to you within 24 hours.');
    form.reset();
    return;
  }

  // Validate form fields
  var validationData = {
    name: formData.get('name') || '',
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    subject: formData.get('subject') || '',
    message: formData.get('message') || ''
  };

  var result = validateForm(validationData);

  if (!result.isValid) {
    // Display all errors simultaneously without clearing field values (Requirement 3.3)
    displayErrors(result.errors);
    return;
  }

  // Disable submit button during submission (Requirement 3.2)
  setSubmitLoading(true);

  // Create an AbortController for timeout handling
  var abortController = null;
  var timeoutId = null;
  var timedOut = false;

  if (typeof AbortController !== 'undefined') {
    abortController = new AbortController();
  }

  // Set up timeout (10 seconds) — Requirement 3.8
  timeoutId = setTimeout(function() {
    timedOut = true;
    if (abortController) {
      abortController.abort();
    }
  }, SUBMISSION_TIMEOUT);

  // Build fetch options
  var fetchOptions = {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json'
    }
  };

  if (abortController) {
    fetchOptions.signal = abortController.signal;
  }

  // Submit to Formspree via fetch (Requirement 3.2)
  fetch(FORMSPREE_ENDPOINT, fetchOptions)
    .then(function(response) {
      clearTimeout(timeoutId);

      if (response.ok) {
        // Success: show confirmation, reset form, re-enable button (Requirement 3.7)
        showFormStatus('success', '<strong>Thank you!</strong> Your inquiry has been received. We will get back to you within 24 hours.');
        form.reset();
        setSubmitLoading(false);
      } else {
        // Non-success HTTP response: show error with alternative contact methods (Requirement 3.4)
        showFormStatus('error',
          '<strong>Submission failed.</strong> Please try again or contact us directly:' +
          '<ul class="form-status__alternatives">' +
          '<li>Phone: <a href="tel:+919422966662">+91 94229 66662</a></li>' +
          '<li>Email: <a href="mailto:lubricantsessential@gmail.com">lubricantsessential@gmail.com</a></li>' +
          '<li>WhatsApp: <a href="https://wa.me/919422966662" target="_blank" rel="noopener noreferrer">Chat with us</a></li>' +
          '</ul>'
        );
        // Preserve form data — do NOT reset (Requirement 3.4)
        setSubmitLoading(false);
      }
    })
    .catch(function(error) {
      clearTimeout(timeoutId);

      if (timedOut) {
        // Timeout: treat as failure with timeout message (Requirement 3.8)
        showFormStatus('error',
          '<strong>Request timed out.</strong> The server did not respond within 10 seconds. Please try again or contact us directly:' +
          '<ul class="form-status__alternatives">' +
          '<li>Phone: <a href="tel:+919422966662">+91 94229 66662</a></li>' +
          '<li>Email: <a href="mailto:lubricantsessential@gmail.com">lubricantsessential@gmail.com</a></li>' +
          '<li>WhatsApp: <a href="https://wa.me/919422966662" target="_blank" rel="noopener noreferrer">Chat with us</a></li>' +
          '</ul>'
        );
      } else {
        // Network error: show error with alternative contact methods (Requirement 3.4)
        showFormStatus('error',
          '<strong>Network error.</strong> Please check your connection and try again, or contact us directly:' +
          '<ul class="form-status__alternatives">' +
          '<li>Phone: <a href="tel:+919422966662">+91 94229 66662</a></li>' +
          '<li>Email: <a href="mailto:lubricantsessential@gmail.com">lubricantsessential@gmail.com</a></li>' +
          '<li>WhatsApp: <a href="https://wa.me/919422966662" target="_blank" rel="noopener noreferrer">Chat with us</a></li>' +
          '</ul>'
        );
      }
      // Preserve form data — do NOT reset (Requirements 3.4, 3.8)
      setSubmitLoading(false);
    });
}

/**
 * Initializes the form submission handler.
 * Attaches the submit event listener to the contact form.
 */
function initFormSubmission() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', handleFormSubmission);
}

// Initialize blur listeners and form submission when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    initFormValidationListeners();
    initFormSubmission();
  });
}

// Export for testing (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    validateName: validateName,
    validateMessage: validateMessage,
    validateSubject: validateSubject,
    validateForm: validateForm,
    displayErrors: displayErrors,
    clearFieldError: clearFieldError,
    clearAllErrors: clearAllErrors,
    initFormValidationListeners: initFormValidationListeners,
    handleFormSubmission: handleFormSubmission,
    initFormSubmission: initFormSubmission,
    showFormStatus: showFormStatus,
    clearFormStatus: clearFormStatus,
    setSubmitLoading: setSubmitLoading,
    FORMSPREE_ENDPOINT: FORMSPREE_ENDPOINT,
    SUBMISSION_TIMEOUT: SUBMISSION_TIMEOUT
  };
}
