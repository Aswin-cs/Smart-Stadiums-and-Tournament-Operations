import mongoose from 'mongoose';

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
}));

describe('MongoDB Connection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost:27017' };
    global.mongoose = { conn: null, promise: null };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw an error if MONGODB_URI is not defined', () => {
    delete process.env.MONGODB_URI;
    expect(() => {
      require('@/lib/mongodb');
    }).toThrow(/Please define the MONGODB_URI/);
  });

  it('should call mongoose.connect if not cached', async () => {
    const localMongoose = require('mongoose');
    localMongoose.connect.mockClear();
    const connectToDatabase = require('@/lib/mongodb').default;
    await connectToDatabase();
    expect(localMongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017', expect.any(Object));
  });

  it('should return cached connection if already connected', async () => {
    global.mongoose = { conn: { readyState: 1 }, promise: null };
    const localMongoose = require('mongoose');
    localMongoose.connect.mockClear();
    const connectToDatabase = require('@/lib/mongodb').default;
    const conn = await connectToDatabase();
    expect(localMongoose.connect).not.toHaveBeenCalled();
    expect(conn.readyState).toBe(1);
  });

  it('should reuse cached promise if available', async () => {
    global.mongoose = { conn: null, promise: Promise.resolve({ readyState: 2 }) };
    const localMongoose = require('mongoose');
    localMongoose.connect.mockClear();
    const connectToDatabase = require('@/lib/mongodb').default;
    const conn = await connectToDatabase();
    expect(localMongoose.connect).not.toHaveBeenCalled();
    expect(conn.readyState).toBe(2);
  });
});
