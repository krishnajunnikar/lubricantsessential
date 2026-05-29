/**
 * WhatsApp Integration - Essential Lubricants Website
 * Handles: Floating WhatsApp button, click-to-chat link generation
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.6
 */

'use strict';

/**
 * WhatsApp configuration
 */
var whatsappConfig = {
  primaryNumber: '919422966662',
  defaultMessage: "Hi, I'd like to inquire about your products/services."
};

/**
 * Generates a WhatsApp click-to-chat URL.
 *
 * @param {string} number - The phone number in international format (no + or spaces)
 * @param {string} message - The pre-filled message text
 * @returns {string} The full wa.me URL with encoded message
 *
 * Preconditions:
 *   - number is a non-empty string of digits
 *   - message is a string (may be empty)
 *
 * Postconditions:
 *   - Returns a URL matching https://wa.me/{number}?text={encodedMessage}
 *   - The message is properly URI-encoded using encodeURIComponent
 *   - No side effects, pure function
 */
function generateLink(number, message) {
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
}

/**
 * Initializes the WhatsApp floating button by updating its href
 * with the generated link using the configured number and message.
 * This provides progressive enhancement — the button already has
 * a working href in the HTML for no-JS scenarios.
 */
function initWhatsAppButton() {
  var button = document.querySelector('.whatsapp-float');
  if (button) {
    var link = generateLink(whatsappConfig.primaryNumber, whatsappConfig.defaultMessage);
    button.setAttribute('href', link);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initWhatsAppButton);
