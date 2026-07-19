/**
 * Helper utility to get the CSRF token from cookies in the browser.
 * This is used to implement the Double Submit Cookie pattern.
 */
export const getCsrfToken = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(^|;)\s*csrf_token\s*=\s*([^;]+)/);
  return match ? match[2] : '';
};
