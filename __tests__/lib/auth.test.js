import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import connectToDatabase from '@/lib/mongodb';

jest.mock('@/lib/mongodb', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/User', () => ({
  findOne: jest.fn(() => ({ lean: jest.fn() })),
  create: jest.fn(),
}));

describe('Auth Options Callbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    const user = { name: 'Test User', email: 'test@example.com', image: 'test.png' };
    const account = { provider: 'google' };
    const profile = { sub: 'google_123' };

    it('should allow signIn for existing user and set user id', async () => {
      User.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce({ _id: { toString: () => 'db_user_123' } }) });
      
      const result = await authOptions.callbacks.signIn({ user, account, profile });
      expect(result).toBe(true);
      expect(user.id).toBe('db_user_123');
    });

    it('should create a new user and allow signIn if user does not exist', async () => {
      User.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce(null) });
      User.create.mockResolvedValueOnce({ _id: { toString: () => 'db_user_456' } });
      
      const result = await authOptions.callbacks.signIn({ user, account, profile });
      expect(result).toBe(true);
      expect(user.id).toBe('db_user_456');
    });

    it('should return false if there is a database error', async () => {
      User.findOne.mockReturnValueOnce({ lean: jest.fn().mockRejectedValueOnce(new Error('DB Down')) });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await authOptions.callbacks.signIn({ user, account, profile });
      expect(result).toBe(false);
      
      consoleSpy.mockRestore();
    });

    it('should return true for non-google providers', async () => {
      const result = await authOptions.callbacks.signIn({ user, account: { provider: 'github' }, profile });
      expect(result).toBe(true);
    });
  });

  describe('jwt and session', () => {
    it('should add user id to token', async () => {
      const token = await authOptions.callbacks.jwt({ token: {}, user: { id: 'user_123' } });
      expect(token.id).toBe('user_123');
    });

    it('should return existing token if user is not passed', async () => {
      const token = await authOptions.callbacks.jwt({ token: { id: 'existing_id' } });
      expect(token.id).toBe('existing_id');
    });

    it('should add token id to session', async () => {
      const session = await authOptions.callbacks.session({ session: { user: {} }, token: { id: 'token_123' } });
      expect(session.user.id).toBe('token_123');
    });
  });
});
