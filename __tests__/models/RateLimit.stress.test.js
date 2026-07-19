/**
 * @jest-environment node
 */
import { POST, clearRateLimitCache } from '@/app/api/chat/route';
import RateLimit from '@/models/RateLimit';
import { getServerSession } from 'next-auth/next';

// Mock the Google Generative AI SDK to prevent live network calls during testing
jest.mock('@google/generative-ai', () => {
  const mockGenerateContentFn = jest.fn().mockResolvedValue({
    response: {
      text: () => 'Mocked AI response',
    },
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: () => ({
          generateContent: mockGenerateContentFn,
          generateContentStream: jest.fn(),
        }),
      };
    }),
  };
});

// Mock Next Auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => jest.fn().mockResolvedValue(true));

// Mock RateLimit model
jest.mock('@/models/RateLimit', () => {
  const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  const RateLimitMock = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(true),
  }));
  RateLimitMock.findOne = jest.fn();
  RateLimitMock.updateOne = mockUpdateOne;
  return {
    __esModule: true,
    default: RateLimitMock,
  };
});

describe('Rate Limiter Stress Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRateLimitCache();
  });

  it('should handle high concurrency of unauthenticated requests safely', async () => {
    getServerSession.mockResolvedValue(null);
    RateLimit.findOne.mockResolvedValue(null); // Simulating first-time users or cache misses
    
    // Simulate 50 concurrent requests from the SAME IP
    const numRequests = 50;
    const reqs = Array.from({ length: numRequests }).map(() => {
      return new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.1', // Same IP to trigger concurrent locks
        },
        body: JSON.stringify({ message: 'Concurrency test' }),
      });
    });
    
    const responses = [];
    for (const req of reqs) {
      responses.push(await POST(req));
    }
    
    // Unauthenticated rate limit is 10.
    // So 10 requests should succeed (200) and 40 should be rate limited (429).
    const statusCodes = responses.map(r => r.status);
    const successCount = statusCodes.filter(s => s === 200).length;
    const rateLimitedCount = statusCodes.filter(s => s === 429).length;
    
    expect(successCount).toBeLessThanOrEqual(10);
    expect(rateLimitedCount).toBeGreaterThanOrEqual(40);
  });
});
