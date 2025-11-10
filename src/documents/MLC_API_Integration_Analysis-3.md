# MLC API Integration Analysis

## Overview
The MLC (Mechanical Licensing Collective) Public API provides access to musical works data for verification and lookup purposes. The API uses OAuth 2.0 Bearer token authentication with JWT tokens.

## Authentication Flow

### Step 1: Obtain Access Token
**Endpoint**: `POST https://public-api.themlc.com/oauth/token`

**Request**:
```json
{
  "username": "info@encoremusic.tech",
  "password": "1GVV7uM@#vfco%tJ"
}
```

**Response**:
```json
{
  "accessToken": "string",
  "expiresIn": "string",
  "refreshToken": "string",
  "tokenType": "string"
}
```

**Important Notes**:
- The `accessToken` must be included in all subsequent API requests as a Bearer token
- Token has an expiration time (`expiresIn`)
- Use `refreshToken` to obtain a new access token when it expires
- Authorization header format: `Authorization: Bearer {accessToken}`

## Core Verification Endpoints

### 1. Song Code Search (Primary Verification Method)
**Endpoint**: `POST https://public-api.themlc.com/search/songcode`

**Purpose**: Search for songs by title and writers to verify if they exist in MLC database

**Request**:
```json
{
  "title": "Song Title",
  "writers": [
    {
      "writerFirstName": "John",
      "writerLastName": "Doe",
      "writerIPI": "optional IPI number"
    }
  ]
}
```

**Response** (Array):
```json
[
  {
    "iswc": "T-123.456.789-0",
    "mlcSongCode": "MLC-XXXXX",
    "workTitle": "Song Title",
    "writers": [
      {
        "writerFirstName": "John",
        "writerLastName": "Doe",
        "writerIPI": "00123456789",
        "writerId": "writer-id",
        "writerRoleCode": "C" 
      }
    ]
  }
]
```

**Verification Logic**:
- If array is empty: Song NOT found in MLC database
- If array has results: Song IS registered with MLC
- Returns `mlcSongCode` which can be used for detailed lookup

### 2. Recording Search (Alternative Verification)
**Endpoint**: `POST https://public-api.themlc.com/search/recordings`

**Purpose**: Search by recording details (artist, title, ISRC)

**Request**:
```json
{
  "title": "Recording Title",
  "artist": "Artist Name",
  "isrc": "USRC12345678"
}
```

**Response** (Array):
```json
[
  {
    "id": "recording-id",
    "title": "Recording Title",
    "artist": "Artist Name",
    "isrc": "USRC12345678",
    "labels": "Record Label",
    "mlcsongCode": "MLC-XXXXX"
  }
]
```

### 3. Get Work Details (Full Information)
**Endpoint**: `POST https://public-api.themlc.com/works`

**Purpose**: Get complete work information using MLC Song Code from search results

**Request** (Array):
```json
[
  {
    "mlcsongCode": "MLC-XXXXX"
  }
]
```

**Response** (Array):
```json
[
  {
    "mlcSongCode": "MLC-XXXXX",
    "primaryTitle": "Song Title",
    "iswc": "T-123.456.789-0",
    "artists": "Artist Names",
    "membersSongId": "internal-id",
    "akas": [
      {
        "akaId": "aka-id",
        "akaTitle": "Alternative Title",
        "akaTitleTypeCode": "AT"
      }
    ],
    "writers": [
      {
        "writerId": "writer-id",
        "writerFirstName": "John",
        "writerLastName": "Doe",
        "writerIPI": "00123456789",
        "writerRoleCode": "C",
        "chainId": "chain-id",
        "chainParentId": "parent-id"
      }
    ],
    "publishers": [
      {
        "publisherId": "publisher-id",
        "publisherName": "Publisher Name",
        "publisherIpiNumber": "00987654321",
        "mlcPublisherNumber": "PUB-XXXXX",
        "publisherRoleCode": "E",
        "collectionShare": 50.00,
        "chainId": "chain-id",
        "chainParentId": "parent-id",
        "administrators": [],
        "parentPublishers": []
      }
    ]
  }
]
```

**Alternative**: `GET https://public-api.themlc.com/work/id/{id}` for single work lookup

## Recommended Integration Flow for MLC Verification

### Flow 1: Basic Verification (Is song in MLC database?)
1. **Authenticate**: Get access token using credentials
2. **Search**: POST to `/search/songcode` with title and writers
3. **Verify**: Check if response array has results
   - Empty array = NOT in MLC database
   - Has results = IS in MLC database
4. **Store**: Save `mlcSongCode` for future reference

### Flow 2: Detailed Verification (Get full work information)
1. **Authenticate**: Get access token
2. **Search**: POST to `/search/songcode` with title and writers
3. **Get Details**: If found, POST to `/works` with `mlcSongCode`
4. **Display**: Show complete work information including:
   - Primary title and alternative titles (AKAs)
   - All writers with IPI numbers
   - All publishers with ownership shares
   - ISWC code

### Flow 3: Recording-Based Verification
1. **Authenticate**: Get access token
2. **Search**: POST to `/search/recordings` with artist, title, or ISRC
3. **Verify**: Check if recording is linked to MLC song code
4. **Get Details**: Use `mlcsongCode` from response to get full work details

## Error Handling

**Common HTTP Status Codes**:
- `200`: Success
- `201`: Created (for token generation)
- `401`: Unauthorized (invalid or expired token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (work/recording not found)

**Best Practices**:
- Implement token refresh logic before expiration
- Cache access tokens to reduce authentication calls
- Handle empty search results gracefully
- Implement retry logic for network errors
- Store `refreshToken` securely for token renewal

## Security Considerations

1. **Never expose credentials in frontend code**
2. **Store credentials as environment variables**
3. **Implement backend proxy for API calls**
4. **Use HTTPS for all API communications**
5. **Implement rate limiting to avoid API abuse**
6. **Securely store and refresh access tokens**

## Data Models Summary

### Key Fields for Verification:
- **mlcSongCode**: Unique identifier in MLC system
- **iswc**: International Standard Musical Work Code
- **primaryTitle**: Main title of the work
- **writers**: Array of songwriters with IPI numbers
- **publishers**: Array of publishers with ownership shares

### Writer Role Codes:
- `C`: Composer
- `A`: Author
- `CA`: Composer/Author

### Publisher Role Codes:
- `E`: Original Publisher
- `AM`: Administrator
- `SE`: Sub-Publisher

## Rate Limiting & Performance
- No explicit rate limits documented
- Implement caching for frequently searched songs
- Batch requests when possible using array endpoints
- Store MLC Song Codes to avoid repeated searches
