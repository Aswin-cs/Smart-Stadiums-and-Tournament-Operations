import { GET, POST } from '@/app/api/auth/[...nextauth]/route';
import NextAuth from 'next-auth';

jest.mock('next-auth', () => jest.fn(() => 'mockedHandler'));
jest.mock('@/lib/auth', () => ({
  authOptions: { mocked: true },
}));

describe('NextAuth API Route', () => {
  it('should export GET and POST handlers', () => {
    expect(GET).toBe('mockedHandler');
    expect(POST).toBe('mockedHandler');
    expect(NextAuth).toHaveBeenCalledWith({ mocked: true });
  });
});
