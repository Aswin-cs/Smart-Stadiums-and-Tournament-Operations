/**
 * @jest-environment jsdom
 */
import { getCsrfToken } from '@/app/lib/utils/csrf';

describe('getCsrfToken', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = global.document;
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it('should return empty string if document is undefined', () => {
    const tempDoc = global.document;
    delete global.document;
    
    expect(getCsrfToken()).toBe('');
    
    global.document = tempDoc;
  });

  it('should return the token when csrf_token exists in document.cookie', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'session_id=123; csrf_token=test-csrf-1234; other_cookie=val',
      configurable: true,
    });
    expect(getCsrfToken()).toBe('test-csrf-1234');
  });

  it('should return empty string when csrf_token is not in document.cookie', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'session_id=123; other_cookie=val',
      configurable: true,
    });
    expect(getCsrfToken()).toBe('');
  });

  it('should handle empty document.cookie', () => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      configurable: true,
    });
    expect(getCsrfToken()).toBe('');
  });
});
