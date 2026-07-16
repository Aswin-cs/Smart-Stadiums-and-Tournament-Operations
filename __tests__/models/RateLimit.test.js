import RateLimit from '@/models/RateLimit';
import mongoose from 'mongoose';

jest.mock('mongoose', () => {
  const Schema = jest.fn();
  const model = jest.fn(() => 'RateLimitModel');
  return {
    Schema,
    model,
    models: {},
  };
});

describe('RateLimit Model', () => {
  it('should define the schema correctly with defaults', () => {
    expect(mongoose.Schema).toHaveBeenCalled();
    const schemaArgs = mongoose.Schema.mock.calls[0][0];
    
    expect(schemaArgs.identifier.required).toBe(true);
    expect(schemaArgs.submissionsCount.default).toBe(0);
    expect(schemaArgs.notificationsCount.default).toBe(0);
    expect(schemaArgs.lastResetDate.default).toBeDefined();
    
    expect(mongoose.model).toHaveBeenCalledWith('RateLimit', expect.any(Object));
  });

  it('should reuse existing model if already defined', () => {
    jest.isolateModules(() => {
      const mongoose = require('mongoose');
      mongoose.models.RateLimit = 'ExistingRateLimitModel';
      const RateLimit = require('@/models/RateLimit').default;
      expect(RateLimit).toBe('ExistingRateLimitModel');
    });
  });
});
