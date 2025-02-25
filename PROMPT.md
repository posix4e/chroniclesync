# ChronicleSync Client-Side Encryption Implementation Guide

## Objective
Implement client-side encryption for browser history data using the Web Crypto API and BIP32 seed phrase as the encryption key source.

## Technical Requirements

### 1. Encryption Service Implementation
- Create EncryptionService class in extension/src/services/Encryption.ts
- Use AES-GCM encryption with Web Crypto API
- Implement HKDF for key derivation from BIP32 seed
- Structure encrypted data with:
```typescript
interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  tag: string; // Base64 encoded
}
```

### 2. Data Store Integration
- Update HistoryStore to handle encrypted data
- Modify schema to store encrypted URLs and titles
- Implement encryption before storage
- Handle decryption during retrieval
- Maintain metadata in plaintext
- Implement schema versioning for migration
- Ensure proper initialization sequence

### 3. Sync Service Updates
- Modify SyncService to work with encrypted data
- Ensure data remains encrypted during transmission
- Handle encrypted data during sync operations
- Implement client-side decryption after retrieval
- Return sync status and handle server-reported failures

### 4. Testing Requirements
- Add comprehensive encryption tests
- Mock IndexedDB for testing environment
- Test key derivation from seed
- Test encryption/decryption operations
- Test error handling and edge cases
- Ensure backward compatibility
- Test initialization sequence

### 5. Implementation Guidelines
- Use TypeScript with strict type checking
- Handle all errors gracefully with meaningful messages
- Maintain proper encapsulation of services
- Follow proper async/await patterns
- Avoid async Promise executors
- Use proper type assertions
- Handle all required browser events

### 6. Development Process
- Run build && unit test && lint until all 3 are clean
- Fix any TypeScript errors in test mocks
- Ensure proper initialization sequence
- Handle all browser API edge cases
- Commit with clear messages

### 7. Browser Integration
- Initialize encryption service with default seed
- Share HistoryStore instance between services
- Handle all browser events properly
- Maintain proper error handling
- Ensure smooth user experience

## Testing Focus

### Key Derivation
- Correct key generation from seed
- Consistent results with same seed
- Error handling for invalid seeds

### Encryption/Decryption
- Successful encryption/decryption
- IV uniqueness
- Error handling
- Edge cases

### Integration
- Service initialization
- Data flow
- Error propagation
- Browser events

## Important Notes
- Initialize encryption before any operations
- Handle all async operations properly
- Maintain type safety throughout
- Follow proper error handling patterns
- Use proper mocking in tests

## Implementation Steps

1. Create EncryptionService:
   - Implement AES-GCM encryption
   - Add key derivation using HKDF
   - Add proper error handling
   - Add TypeScript types

2. Update HistoryStore:
   - Add encrypted data schema
   - Implement encryption/decryption
   - Handle initialization
   - Add version migration

3. Update SyncService:
   - Handle encrypted data
   - Add sync status
   - Improve error handling
   - Maintain encryption during sync

4. Add Tests:
   - Mock IndexedDB
   - Test encryption
   - Test initialization
   - Test error cases

5. Fix Integration:
   - Handle initialization sequence
   - Share service instances
   - Fix async operations
   - Add error handling

## Common Issues to Watch For

1. Initialization:
   - Services must be initialized in correct order
   - Encryption must be ready before operations
   - Handle all async initialization properly

2. Type Safety:
   - Use proper TypeScript types
   - Avoid unsafe type assertions
   - Handle all possible states

3. Error Handling:
   - Provide meaningful error messages
   - Handle all edge cases
   - Maintain good user experience

4. Testing:
   - Mock browser APIs properly
   - Test all error cases
   - Ensure proper async handling

5. Browser Integration:
   - Handle all browser events
   - Maintain state properly
   - Handle service sharing

## Success Criteria
- All tests pass
- Build succeeds
- Lint shows no errors
- Types are properly checked
- Encryption works correctly
- Data remains secure
- User experience is smooth