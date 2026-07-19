/**
 * @jest-environment node
 */
import { getCsrfToken } from '@/app/lib/utils/csrf';

describe('getCsrfToken (Node Environment)', () => {
  it('should return empty string if document is undefined', () => {
    expect(typeof document).toBe('undefined');
    expect(getCsrfToken()).toBe('');
  });
});
