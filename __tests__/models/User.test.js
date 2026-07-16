import User from '@/models/User';
import mongoose from 'mongoose';

jest.mock('mongoose', () => {
  const Schema = jest.fn();
  const model = jest.fn(() => 'UserModel');
  return {
    Schema,
    model,
    models: {},
  };
});

describe('User Model', () => {
  it('should define the schema correctly', () => {
    // The module has been imported, which means mongoose.Schema was called
    expect(mongoose.Schema).toHaveBeenCalled();
    const schemaArgs = mongoose.Schema.mock.calls[0][0];
    
    expect(schemaArgs.name.required).toBe(true);
    expect(schemaArgs.email.required).toBe(true);
    expect(schemaArgs.email.unique).toBe(true);
    expect(schemaArgs.image.type).toBe(String);
    expect(schemaArgs.googleId.type).toBe(String);
    
    expect(mongoose.model).toHaveBeenCalledWith('User', expect.any(Object));
  });

  it('should reuse existing model if already defined', () => {
    jest.isolateModules(() => {
      const mongoose = require('mongoose');
      mongoose.models.User = 'ExistingUserModel';
      const User = require('@/models/User').default;
      expect(User).toBe('ExistingUserModel');
    });
  });
});
