/**
 * @jest-environment node
 */

import { POST } from '@/app/api/chat/route';

// Mock the Google Generative AI SDK to prevent live network calls during testing
jest.mock('@google/generative-ai', () => {
  const mockGenerateContentFn = jest.fn().mockResolvedValue({
    response: {
      text: () => 'Mocked AI response for seat search',
    },
  });

  const mockStream = (async function* () {
    yield { text: () => 'Chunk 1 ' };
    yield { text: () => 'Chunk 2' };
  })();

  const mockGenerateContentStreamFn = jest.fn().mockResolvedValue({
    stream: mockStream,
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: () => ({
          generateContent: mockGenerateContentFn,
          generateContentStream: mockGenerateContentStreamFn,
        }),
      };
    }),
    __mockGenerateContentFn: mockGenerateContentFn,
    __mockGenerateContentStreamFn: mockGenerateContentStreamFn,
  };
});

// Mock Next Auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth/next';

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => jest.fn().mockResolvedValue(true));

// Mock RateLimit model
const mockSave = jest.fn().mockResolvedValue(true);
jest.mock('@/models/RateLimit', () => {
  const RateLimitMock = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
  RateLimitMock.findOne = jest.fn();
  return {
    __esModule: true,
    default: RateLimitMock,
  };
});
import RateLimit from '@/models/RateLimit';

describe('/api/chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a mocked AI response for unauthenticated users', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
      },
      body: JSON.stringify({
        message: 'Where is my seat?',
        ticket: { section: 'North Stand', row: 'A', seat: '12' },
      }),
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.reply).toBe('Mocked AI response for seat search');
  });

  it('should return a stream when stream: true is passed', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Where is my seat?',
        stream: true,
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    expect(text).toBe('Chunk 1 Chunk 2');
  });

  it('should handle authenticated users and existing rate limit records', async () => {
    getServerSession.mockResolvedValueOnce({
      user: { id: 'user_123', email: 'test@example.com' },
    });
    RateLimit.findOne.mockResolvedValueOnce({
      submissionsCount: 5,
      notificationsCount: 2,
      lastResetDate: new Date(),
      save: mockSave,
    });

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        requestType: 'notification'
      }),
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.reply).toBe('Mocked AI response for seat search');
  });

  it('should reset rate limit if 24 hours have passed', async () => {
    getServerSession.mockResolvedValueOnce(null);
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 2); // 2 days ago

    RateLimit.findOne.mockResolvedValueOnce({
      submissionsCount: 15,
      notificationsCount: 8,
      lastResetDate: oldDate,
      save: mockSave,
    });

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Are you there?',
      }),
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
  });

  it('should return 429 if rate limit is exceeded', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce({
      submissionsCount: 15, // Over the unauthenticated limit of 10
      notificationsCount: 0,
      lastResetDate: new Date(),
      save: mockSave,
    });

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Where is my seat?',
      }),
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json.error).toMatch(/limit/i);
  });

  it('should handle errors gracefully and return 500 status code', async () => {
    getServerSession.mockResolvedValueOnce(null);
    
    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json', // Triggers parsing error in req.json()
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(mockRequest);
    const json = await response.json();

    consoleSpy.mockRestore();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch AI response');
  });
  it('should fallback to x-real-ip if x-forwarded-for is missing', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '192.168.1.2',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });

  it('should fallback to unknown-ip if no IP headers are present', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });

  it('should extract user prompt from messages as a string', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: 'Hello from string messages' }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });

  it('should extract user prompt from messages as an array of objects', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ text: 'Hello from array' }] }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
  });

  it('should return 429 when AI service is overwhelmed (quota error)', async () => {
    getServerSession.mockResolvedValueOnce(null);
    RateLimit.findOne.mockResolvedValueOnce(null);

    const { __mockGenerateContentFn } = require('@google/generative-ai');
    __mockGenerateContentFn.mockRejectedValueOnce({ status: 429, message: 'Quota exceeded' });

    const mockRequest = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await POST(mockRequest);
    consoleSpy.mockRestore();
    
    expect(response.status).toBe(429);
  });
});
