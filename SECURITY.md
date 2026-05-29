# Security Documentation - Essential Lubricants Website

## Overview

This document describes the security measures implemented for the Essential Lubricants static website, covering Requirements 11.1 through 11.7.

## Security Measures

### 1. No Inline JavaScript (Requirement 11.2)

All JavaScript is placed in external files within the `js/` directory:
- `js/main.js` — Navigation and shared functionality
- `js/products.js` — Product catalog and filtering
- `js/contact.js` — Contact form validation and submission
- `js/whatsapp.js` — WhatsApp button enhancement
- `js/lazy-load.js` — Image lazy loading
- `js/sri-verify.js` — SRI verification infrastructure

**Verified clean of:**
- No inline `<script>` tags with executable code (only `type="application/ld+json"` for structured data)
- No inline event handler attributes (`onclick`, `onload`, `onerror`, etc.)
- No `javascript:` URIs

This supports Content Security Policy (CSP) deployment.

### 2. No Cookies (Requirement 11.6)

The website does not set any cookies:
- No first-party cookies
- No third-party cookies
- No tracking cookies
- No `document.cookie` usage in any JavaScript file
- No `localStorage` or `sessionStorage` for user data

### 3. No Server-Side Data Storage (Requirement 11.3)

- Form submissions are handled entirely by Formspree (third-party service)
- No user data is stored on the hosting server (GitHub Pages / Cloudflare Pages)
- The site is fully static with no backend processing

### 4. Subresource Integrity (SRI) Infrastructure (Requirement 11.4)

The site currently uses **no third-party scripts or stylesheets**. All resources are served locally from the same origin. However, SRI verification infrastructure is in place via `js/sri-verify.js`.

**When adding third-party resources in the future:**

1. Generate the SRI hash:
   ```bash
   curl -s https://cdn.example.com/lib.js | openssl dgst -sha384 -binary | openssl base64 -A
   ```

2. Add the `integrity` and `crossorigin` attributes:
   ```html
   <script src="https://cdn.example.com/lib.js"
           integrity="sha384-<hash>"
           crossorigin="anonymous"
           defer></script>
   ```

3. Register the resource in `js/sri-verify.js`:
   ```javascript
   var THIRD_PARTY_RESOURCES = [
     {
       url: 'https://cdn.example.com/lib.js',
       type: 'script',
       integrity: 'sha384-<hash>',
       fallbackBehavior: 'degrade',
       description: 'Description of the library'
     }
   ];
   ```

### 5. Graceful Degradation on SRI Failure (Requirement 11.5)

If an SRI integrity check fails:
- The browser natively blocks the resource (this is standard browser behavior)
- The `sri-verify.js` module detects the blocked resource
- A `sri-degraded` CSS class is added to the document root
- The site remains fully functional with degraded styling or features
- A console warning is logged for developers

### 6. HTTPS Enforcement (Requirement 11.1)

HTTPS is enforced by the hosting platform:
- GitHub Pages automatically redirects HTTP to HTTPS
- Cloudflare Pages provides automatic HTTPS with edge certificates

### 7. External Script Restrictions (Requirement 11.7)

The website does not include any external resources that execute scripts outside of those that would be verified with SRI attributes. The only external content is:
- Google Maps embed (operates in a sandboxed iframe context)
- WhatsApp links (standard anchor links, no script execution)
- Formspree form submission (POST request, no script injection)

## Content Security Policy (Recommended)

When deploying, consider adding these HTTP headers via the hosting platform:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://www.google.com/maps/; connect-src https://formspree.io; font-src 'self'
```

Note: `'unsafe-inline'` for styles is needed for the critical CSS in `<style>` tags. The JSON-LD `<script type="application/ld+json">` tags are not affected by CSP script-src because they are data blocks, not executable scripts.
