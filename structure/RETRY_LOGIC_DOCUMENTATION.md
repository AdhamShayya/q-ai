# Retry Logic Documentation

## Overview

The retry logic system provides automatic retry functionality for API calls and other async operations. It uses exponential backoff to handle transient network errors and server issues gracefully.

## Features

- ✅ Exponential backoff with configurable delays
- ✅ Configurable max retries
- ✅ Smart error detection (only retries retryable errors)
- ✅ Presets for different use cases (fast, standard, aggressive, none)
- ✅ Custom retry logic support
- ✅ Callback support for retry events
- ✅ Automatic integration with API client

## Usage

### Basic Usage (Automatic)

The API client automatically uses retry logic for all requests:

```javascript
// Automatically retries on network errors and 5xx errors
const result = await apiClient.get('/vaults');
```

### Custom Retry Configuration

You can customize retry behavior per request:

```javascript
// Fast retry (2 retries, 500ms base delay)
const result = await apiClient.get('/vaults', {
    retryConfig: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2000
    }
});

// Aggressive retry (5 retries, longer delays)
const result = await apiClient.post('/upload', formData, {
    retryConfig: {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 30000
    }
});

// No retry
const result = await apiClient.get('/status', {
    retry: false
});
```

### Using Retry Presets

```javascript
const { RETRY_PRESETS } = window.RetryUtils;

// Use fast preset
const result = await apiClient.get('/vaults', {
    retryConfig: RETRY_PRESETS.fast
});

// Use aggressive preset
const result = await apiClient.post('/critical-operation', data, {
    retryConfig: RETRY_PRESETS.aggressive
});

// Disable retry
const result = await apiClient.get('/status', {
    retryConfig: RETRY_PRESETS.none
});
```

### Direct Usage with RetryUtils

```javascript
const { withRetry } = window.RetryUtils;

// Retry any async function
const result = await withRetry(async () => {
    return await someAsyncOperation();
}, {
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (error, attempt, delay) => {
        console.log(`Retry ${attempt} after ${delay}ms`);
    }
});
```

### Creating Retry Wrappers

```javascript
const { createRetryWrapper } = window.RetryUtils;

// Wrap a function with retry logic
const fetchWithRetry = createRetryWrapper(fetch, {
    maxRetries: 3,
    baseDelay: 1000
});

// Use the wrapped function
const response = await fetchWithRetry('/api/data');
```

## Configuration Options

### RetryConfig Object

```javascript
{
    maxRetries: 3,              // Maximum number of retries (default: 3)
    baseDelay: 1000,            // Base delay in milliseconds (default: 1000)
    maxDelay: 10000,            // Maximum delay in milliseconds (default: 10000)
    exponentialBackoff: true,   // Use exponential backoff (default: true)
    retryableStatusCodes: [     // HTTP status codes to retry
        408, 429, 500, 502, 503, 504
    ],
    retryableErrors: [          // Error codes to retry
        'NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET', 'ETIMEDOUT'
    ],
    shouldRetry: (error, attempt) => {  // Custom retry logic
        // Return true to retry, false to stop
        return attempt < 3 && error.status !== 404;
    },
    onRetry: (error, attempt, delay) => {  // Callback before retry
        console.log(`Retrying (${attempt}/${maxRetries})...`);
    }
}
```

## Retryable Errors

The system automatically retries on:

### Network Errors
- `NETWORK_ERROR` - General network failures
- `TIMEOUT` - Request timeouts
- `ECONNRESET` - Connection reset
- `ETIMEDOUT` - Connection timeout
- TypeError with "fetch" in message - Browser network errors

### HTTP Status Codes
- `408` - Request Timeout
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout

### Non-Retryable Errors (Never Retried)
- `400` - Bad Request (client error)
- `401` - Unauthorized (authentication error)
- `403` - Forbidden (authorization error)
- `404` - Not Found (resource doesn't exist)
- `422` - Unprocessable Entity (validation error)
- Other 4xx errors (except 408, 429)

## Exponential Backoff

The delay between retries increases exponentially:

```
Attempt 1: 1 second (1000ms)
Attempt 2: 2 seconds (2000ms)
Attempt 3: 4 seconds (4000ms)
Attempt 4: 8 seconds (8000ms) - capped at maxDelay
```

Formula: `delay = min(baseDelay * 2^attempt, maxDelay)`

## Presets

### Fast
- Max retries: 2
- Base delay: 500ms
- Max delay: 2000ms
- Use for: Quick operations, user-facing requests

### Standard (Default)
- Max retries: 3
- Base delay: 1000ms
- Max delay: 10000ms
- Use for: Most API operations

### Aggressive
- Max retries: 5
- Base delay: 1000ms
- Max delay: 30000ms
- Use for: Critical operations, file uploads

### None
- Max retries: 0
- Use for: Operations that shouldn't be retried

## Examples

### Example 1: File Upload with Aggressive Retry

```javascript
async function uploadFile(file) {
    try {
        const result = await apiClient.uploadFile('/upload', file, {
            retryConfig: RETRY_PRESETS.aggressive,
            onProgress: (progress) => {
                console.log(`Upload progress: ${progress}%`);
            }
        });
        return result;
    } catch (error) {
        console.error('Upload failed after retries:', error);
        throw error;
    }
}
```

### Example 2: Quick Status Check with Fast Retry

```javascript
async function checkStatus() {
    try {
        const status = await apiClient.get('/status', {
            retryConfig: RETRY_PRESETS.fast
        });
        return status;
    } catch (error) {
        // Handle error
    }
}
```

### Example 3: Custom Retry Logic

```javascript
async function fetchData() {
    const result = await apiClient.get('/data', {
        retryConfig: {
            maxRetries: 3,
            baseDelay: 500,
            shouldRetry: (error, attempt) => {
                // Only retry on network errors, not 4xx errors
                if (error.status >= 400 && error.status < 500) {
                    return false; // Don't retry client errors
                }
                return attempt < 3;
            },
            onRetry: (error, attempt, delay) => {
                console.log(`Retry ${attempt}/3 in ${delay}ms`);
            }
        }
    });
    return result;
}
```

## Integration with Error Handling

The retry logic works seamlessly with the error handling system:

```javascript
try {
    const result = await apiClient.get('/vaults');
    // Success
} catch (error) {
    // ErrorUtils handles the final error after all retries fail
    if (typeof window.ErrorUtils !== 'undefined') {
        window.ErrorUtils.handleError(error);
    }
}
```

## Best Practices

1. **Use appropriate presets**: Choose fast/standard/aggressive based on operation criticality
2. **Don't retry on client errors**: 4xx errors (except 408, 429) indicate client mistakes, not transient failures
3. **Consider user experience**: Long retry delays can make the app feel slow
4. **Log retry attempts**: Use `onRetry` callback to log retry attempts for debugging
5. **Handle final errors**: Always handle errors after all retries are exhausted
6. **Disable retry for idempotent operations**: Some operations shouldn't be retried (e.g., status checks)

## Performance Considerations

- Retry logic adds minimal overhead when requests succeed
- Failed requests with retries can take several seconds (depending on configuration)
- Consider using fast preset for user-facing operations
- Use aggressive preset only for critical operations

## Testing

To test retry logic, you can simulate network failures:

```javascript
// In browser console
// Simulate network error
fetch = () => Promise.reject(new Error('Network error'));

// Make a request - it will retry automatically
apiClient.get('/vaults').catch(console.error);
```

## Related Files

- `Web/js/utils/retry.js` - Retry utility implementation
- `Web/js/api.js` - API client with retry integration
- `Web/js/utils/errors.js` - Error handling utilities

