// Base API URL for production and development environments
// export const API_URL = process.env.NODE_ENV === 'production'
//   ? 'https://api.machintel.com/api'
//   : 'http://localhost:8000/api';

export const API_URL = 'http://localhost:8000/api';

// Validation constants
export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.csv'];

// Pagination
export const DEFAULT_ITEMS_PER_PAGE = 10;

// Date format
export const DATE_FORMAT = 'MMM DD, YYYY, HH:mm';

// Status codes
export const STATUS_CODES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Timeouts
export const POLLING_INTERVAL = 5000; // 5 seconds