# Appwrite Setup Guide for TennisScore

## Overview
This guide will help you set up the Appwrite backend for TennisScore, including databases, collections, storage, and permissions.

## Prerequisites
- Appwrite Cloud account (https://cloud.appwrite.io)
- Project created in Appwrite Console
- API Key generated (already done - see .env.local)

## Database Setup

### 1. Create Database
1. Go to your Appwrite Console
2. Navigate to "Databases" in the sidebar
3. Click "Create Database"
4. Name: `tennisscore-db`
5. Database ID: Use the generated ID or create a custom one
6. Update your `.env.local` with the Database ID:
   ```
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
   APPWRITE_DATABASE_ID=your-database-id
   ```

### 2. Create Collections

#### Players Collection

**Collection Settings:**
- Collection ID: `players` (or use generated)
- Name: `Players`
- Permissions: Enable document-level permissions

**Attributes:**
```json
{
  "firstName": {
    "type": "string",
    "size": 100,
    "required": true
  },
  "lastName": {
    "type": "string", 
    "size": 100,
    "required": true
  },
  "yearOfBirth": {
    "type": "integer",
    "required": false,
    "min": 1900,
    "max": 2030
  },
  "rating": {
    "type": "string",
    "size": 50,
    "required": false
  },
  "profilePictureId": {
    "type": "string",
    "size": 50,
    "required": false
  },
  "userId": {
    "type": "string",
    "size": 50,
    "required": true
  }
}
```

**Indexes:**
- `userId` (key: userId, type: key, attributes: [userId])

**Permissions:**
- Create: `users` (any authenticated user can create)
- Read: `user:[USER_ID]` (users can only read their own documents)
- Update: `user:[USER_ID]` (users can only update their own documents) 
- Delete: `user:[USER_ID]` (users can only delete their own documents)

#### Matches Collection

**Collection Settings:**
- Collection ID: `matches` (or use generated)
- Name: `Matches`
- Permissions: Enable document-level permissions

**Attributes:**
```json
{
  "playerOneId": {
    "type": "string",
    "size": 50,
    "required": true
  },
  "playerTwoId": {
    "type": "string",
    "size": 50,
    "required": true
  },
  "matchDate": {
    "type": "datetime",
    "required": true
  },
  "matchFormat": {
    "type": "string",
    "size": 1000,
    "required": true
  },
  "status": {
    "type": "string",
    "size": 20,
    "required": true,
    "default": "In Progress"
  },
  "winnerId": {
    "type": "string",
    "size": 50,
    "required": false
  },
  "score": {
    "type": "string",
    "size": 5000,
    "required": true
  },
  "pointLog": {
    "type": "string",
    "size": 50000,
    "required": false,
    "array": true
  },
  "events": {
    "type": "string", 
    "size": 10000,
    "required": false,
    "array": true
  },
  "userId": {
    "type": "string",
    "size": 50,
    "required": true
  }
}
```

**Indexes:**
- `userId` (key: userId, type: key, attributes: [userId])
- `status` (key: status, type: key, attributes: [status])
- `matchDate` (key: matchDate, type: key, attributes: [matchDate])

**Permissions:**
- Create: `users` (any authenticated user can create)
- Read: 
  - `user:[USER_ID]` (creator can read)
  - `any` (for live sharing - public read access)
- Update: `user:[USER_ID]` (only creator can update)
- Delete: `user:[USER_ID]` (only creator can delete)

## Storage Setup

### 1. Create Storage Buckets

#### Profile Pictures Bucket
1. Go to "Storage" in Appwrite Console
2. Click "Create Bucket"
3. Settings:
   - Bucket ID: `profile-pictures`
   - Name: `Profile Pictures`
   - File size limit: 5MB
   - Allowed file extensions: `jpg,jpeg,png,webp`
   - Compression: Enabled
   - Encryption: Enabled

**Permissions:**
- Create: `users` (authenticated users can upload)
- Read: `any` (public read for profile pictures)
- Update: `user:[USER_ID]` (users can update their own files)
- Delete: `user:[USER_ID]` (users can delete their own files)

#### Match Media Bucket
1. Create another bucket:
   - Bucket ID: `match-media`
   - Name: `Match Media`
   - File size limit: 10MB
   - Allowed file extensions: `jpg,jpeg,png,webp,mp4`

**Permissions:**
- Create: `users` (authenticated users can upload)
- Read: `any` (public read for shared match media)
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

## Authentication Setup

### 1. Configure Auth Settings
1. Go to "Auth" in Appwrite Console
2. Navigate to "Settings"
3. Configure:
   - Session length: 30 days
   - Password policy: At least 8 characters
   - Enable email/password authentication
   - Disable unused auth methods for security

### 2. Email Templates (Optional)
Configure custom email templates for:
- Welcome email
- Password recovery
- Email verification

## Update Environment Variables

After creating all resources, update your `.env.local`:

```bash
# Public Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=68460965002524f1942e

# Database Configuration
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_PLAYERS_COLLECTION_ID=players
NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID=matches

# Server-only Appwrite Configuration
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_PLAYERS_COLLECTION_ID=players
APPWRITE_MATCHES_COLLECTION_ID=matches
APPWRITE_PROFILE_PICTURES_BUCKET_ID=profile-pictures
APPWRITE_MATCH_MEDIA_BUCKET_ID=match-media
```

## Testing the Setup

After configuration, test the setup by:

1. **Authentication Test:**
   - Try signing up with a new account
   - Verify login works
   - Check session persistence

2. **Database Test:**
   - Create a test player
   - Verify permissions work correctly

3. **Storage Test:**
   - Upload a test profile picture
   - Verify public access works

## Next Steps

Once Appwrite is configured:
1. Update environment variables
2. Restart the development server
3. Test authentication flow
4. Begin implementing player management features

## Troubleshooting

### Common Issues:
- **Permission errors**: Check document-level permissions are configured correctly
- **CORS errors**: Verify domain is added to Appwrite project settings
- **Authentication errors**: Check API key has correct permissions

### Debug Mode:
Enable debug logging in development by adding to your Appwrite client configuration:
```typescript
// In appwrite-client.ts for debugging
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
  .setJWT(sessionToken) // if needed for debugging
```

## Security Considerations

1. **API Key Security**: Never expose server API key in client code
2. **Permissions**: Use principle of least privilege
3. **File Uploads**: Validate file types and sizes
4. **Rate Limiting**: Configure appropriate rate limits in Appwrite
5. **HTTPS**: Always use HTTPS in production

## Production Checklist

Before going live:
- [ ] Configure production domain in Appwrite
- [ ] Set up proper backup strategy
- [ ] Configure monitoring and alerts
- [ ] Review and test all permissions
- [ ] Set up CDN for file storage
- [ ] Configure proper CORS policies 