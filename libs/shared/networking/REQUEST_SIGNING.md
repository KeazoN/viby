# Request Signing Implementation

## Overview

Request signing provides HMAC-SHA256 signatures for critical API requests to prevent tampering and replay attacks. This security measure ensures that requests cannot be modified in transit and that old requests cannot be replayed.

## Requirements

- **Requirement 17.5**: THE Viby_App SHALL implement request signing for critical operations (match accept, game actions)

## Architecture

### Components

1. **RequestSigner** (`request-signer.ts`)
   - Core signing logic using HMAC-SHA256
   - Signature generation and verification
   - Configuration management

2. **Signed Request Helpers** (`signed-request.ts`)
   - `signedPost()` - POST requests with signatures
   - `signedPut()` - PUT requests with signatures
   - `signedDelete()` - DELETE requests with signatures

### How It Works

1. **Signature Generation**:
   ```
   payload = METHOD:URL:BODY:TIMESTAMP
   signature = HMAC-SHA256(payload, SECRET_KEY)
   ```

2. **Request Headers**:
   - `X-Request-Signature`: The HMAC-SHA256 signature
   - `X-Request-Timestamp`: Request timestamp in milliseconds

3. **Server Verification**:
   - Server reconstructs the payload using the same format
   - Computes expected signature using shared secret
   - Compares signatures to verify authenticity
   - Checks timestamp to prevent replay attacks (typically within 5-minute window)

## Configuration

Set the signing key in your environment:

```bash
# .env.development
EXPO_PUBLIC_REQUEST_SIGNING_KEY=your-secret-key-here

# .env.production
EXPO_PUBLIC_REQUEST_SIGNING_KEY=your-production-secret-key
```

**Important**: The secret key must be shared between the mobile app and backend server.

## Usage

### Critical Operations Using Signed Requests

The following operations automatically use request signing:

#### Matchmaking Operations
- **Match Request**: `POST /matchmaking/request`
- **Match Accept**: `POST /matchmaking/:matchId/accept`
- **Match Decline**: `POST /matchmaking/:matchId/decline`

#### Game Operations
- **Submit Answer**: `POST /game/:roomId/answer`
- **Leave Game**: `POST /game/:roomId/leave`

### Example Usage

```typescript
import { signedPost } from '@viby/shared/networking';

// Match accept with signature
const response = await signedPost<AcceptMatchResponse>(
  `/matchmaking/${matchId}/accept`
);

// Submit answer with signature
const response = await signedPost<SubmitAnswerResponse>(
  `/game/${roomId}/answer`,
  { roomId, roundId, answer }
);
```

### Graceful Degradation

If the signing key is not configured, requests will be sent without signatures:

```typescript
if (!requestSigner.isEnabled()) {
  // Falls back to regular HTTP request
  return httpClient.post(url, data, config);
}
```

## Security Properties

### Prevents Request Tampering

An attacker cannot modify the request body, URL, or method without invalidating the signature:

```typescript
// Original request
signature = sign('POST', '/game/room1/answer', { answer: 'A' }, timestamp)

// Tampered request (will fail verification)
signature = sign('POST', '/game/room1/answer', { answer: 'B' }, timestamp)
// Different signature!
```

### Prevents Replay Attacks

Each request includes a timestamp, preventing old requests from being replayed:

```typescript
// Request at time T1
signature1 = sign('POST', '/matchmaking/123/accept', {}, T1)

// Same request at time T2 (different signature)
signature2 = sign('POST', '/matchmaking/123/accept', {}, T2)

// signature1 ≠ signature2
```

The server should reject requests with timestamps outside an acceptable window (e.g., ±5 minutes).

### Prevents Man-in-the-Middle Attacks

Combined with HTTPS and certificate pinning, request signing ensures:
1. The request came from an authenticated client (has the secret key)
2. The request hasn't been modified in transit
3. The request is fresh (not replayed)

## Testing

### Unit Tests

```bash
# Run request signer tests
npx jest libs/shared/networking/src/lib/request-signer.test.ts

# Run signed request helper tests
npx jest libs/shared/networking/src/lib/signed-request.test.ts
```

### Test Coverage

- ✅ Signature generation for different methods
- ✅ Signature generation for different URLs
- ✅ Signature generation for different bodies
- ✅ Signature generation for different timestamps
- ✅ Signature verification (valid and invalid)
- ✅ Tampering detection (method, URL, body, timestamp)
- ✅ Replay attack prevention
- ✅ Graceful degradation when signing is disabled
- ✅ Header injection in signed requests

## Backend Integration

The backend must implement matching signature verification:

```typescript
// Example backend middleware (NestJS)
@Injectable()
export class RequestSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-request-signature'];
    const timestamp = parseInt(request.headers['x-request-timestamp']);
    
    // Check timestamp window (prevent replay attacks)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (Math.abs(now - timestamp) > maxAge) {
      throw new UnauthorizedException('Request timestamp expired');
    }
    
    // Verify signature
    const payload = `${request.method}:${request.url}:${JSON.stringify(request.body)}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.REQUEST_SIGNING_KEY)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid request signature');
    }
    
    return true;
  }
}

// Apply to critical endpoints
@Post('matchmaking/:matchId/accept')
@UseGuards(RequestSignatureGuard)
async acceptMatch(@Param('matchId') matchId: string) {
  // Handle match accept
}
```

## Troubleshooting

### Signature Verification Fails

1. **Check secret key**: Ensure `EXPO_PUBLIC_REQUEST_SIGNING_KEY` matches on client and server
2. **Check timestamp**: Verify server and client clocks are synchronized
3. **Check payload format**: Ensure both client and server use the same payload format
4. **Check body serialization**: JSON.stringify must produce identical results

### Requests Not Being Signed

1. **Check configuration**: Verify `EXPO_PUBLIC_REQUEST_SIGNING_KEY` is set
2. **Check isEnabled()**: Verify `requestSigner.isEnabled()` returns true
3. **Check imports**: Ensure using `signedPost` instead of `httpClient.post`

## Performance Considerations

- **Signature generation**: ~1-2ms per request (negligible)
- **Network overhead**: +64 bytes for signature header, +13 bytes for timestamp header
- **No impact on caching**: Signatures don't affect HTTP caching

## Future Enhancements

1. **Nonce support**: Add nonce to prevent replay attacks within the timestamp window
2. **Key rotation**: Implement automatic key rotation with grace period
3. **Signature algorithms**: Support multiple algorithms (SHA-256, SHA-512)
4. **Request ID**: Include unique request ID in signature for better tracking
