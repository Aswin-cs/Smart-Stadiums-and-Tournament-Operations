import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
