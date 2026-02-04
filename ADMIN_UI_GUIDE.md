# Admin UI Implementation - Complete Guide

## ✅ Status: FULLY IMPLEMENTED & READY TO TEST

The Admin UI for managing the starship catalog is completely implemented with all requested features.

---

## 📋 Features Implemented

### 1. Admin-Only Access Control
- **Route Guard**: `/admin` requires `RequireAdmin` wrapper
- **Authentication**: Admin role determined from JWT token
- **Bootstrap**: Admin emails configured in `appsettings.Development.json`
  ```json
  "AdminEmails": [ "admin@example.com", "admin@email.com" ]
  ```
- **Redirect**: Non-admin users redirected to home page

### 2. Catalog Ship Management
- **List Ships** with pagination (25 per page)
  - Name, Manufacturer, Class, Status
  - Sort by: Name, Manufacturer, Class, IsActive
  - Search by: Name, Manufacturer
  - Filter by: Active/Inactive status
  
- **Status Indicators**
  - Green "Active" badge for active ships
  - Red "Retired" badge for retired ships
  
- **Retire Action**
  - Converts `IsActive = true` → `IsActive = false`
  - Ship disappears from catalog (users see active only)
  - Idempotent: Already-retired ships can be retired again (no error)
  
- **Activate Action**
  - Converts `IsActive = false` → `IsActive = true`
  - Ship reappears in catalog for users
  - Idempotent: Already-active ships can be activated again (no error)

### 3. Catalog Sync (Bonus Feature)
- **Sync Button**: 🔄 Sync Catalog
- **Purpose**: Trigger SWAPI data refresh
- **Endpoint**: `POST /api/admin/seed?catalogOnly=true`
- **Requirements**:
  - X-SEED-KEY header (configured as `dev-seed-key-123` in Development)
  - Development environment OR `Seed:AllowCatalogSyncInProduction=true`

### 4. User Feedback
- **Success Messages**: Auto-dismiss after 3 seconds
  - "Ship retired!"
  - "Ship activated!"
  - "Catalog synced!"
  
- **Error Messages**: Display error details from API
  - Persist until user dismissal or next action

---

## 🔧 Technical Implementation

### Frontend Files
- **Page**: `Client/src/pages/AdminCatalog.tsx`
- **API**: `Client/src/api/adminApi.ts`
- **Router Guard**: `Client/src/auth/RequireAuth.tsx` (RequireAdmin)
- **Auth Context**: `Client/src/auth/AuthContext.tsx` (isAdmin property)

### Backend Files
- **Controller**: `Server/StarWarsApi.Server/Controllers/AdminCatalogController.cs`
  - `GET /api/admin/catalog/starships` - List with filters
  - `PATCH /api/admin/catalog/starships/{id}/retire` - Retire ship
  - `PATCH /api/admin/catalog/starships/{id}/activate` - Activate ship
  
- **Admin Controller**: `Server/StarWarsApi.Server/Controllers/AdminController.cs`
  - `POST /api/admin/seed` - Trigger catalog sync

### Security Features
- All endpoints require `[Authorize(Roles = "Admin")]`
- JWT token checked on every request
- Admin audit logging:
  - Who performed the action
  - What was changed
  - Timestamps

---

## 🧪 Complete User Flow to Test

### Step 1: Register as Regular User
```
1. Navigate to /register
2. Enter: admin@example.com / password123
3. Click Register
4. Should see: You're logged in (not as admin)
5. Visit /admin → Should redirect to home
```

### Step 2: Register as Admin (Development Only)
```
1. Navigate to /register
2. Enter: admin@email.com / password123
3. Click Register
4. Backend bootstrap detects email in AdminEmails config
5. Assigns Admin role to user
6. Close/reopen app (token won't have Admin role until next login)
```

### Step 3: Login as Admin and Access Admin Panel
```
1. Log out (or open new incognito window)
2. Navigate to /login
3. Login with: admin@email.com / password123
4. Visit /admin → Should load admin panel
5. Should see catalog ships with:
   - List of active ships
   - Name, Manufacturer, Class, Status columns
   - Retire/Activate buttons
   - Search box
   - "Include Inactive Ships" checkbox
   - "Sync Catalog" button
```

### Step 4: Test Retire Functionality
```
1. Find a ship (e.g., "X-Wing")
2. Click "Retire" button
3. Should see: Green success message "Ship retired!"
4. Ship status should change to red "Retired" badge
5. Button text should change to "Activate"
6. Admin catalog still shows it (because "Include Inactive" is checked)
```

### Step 5: Test Catalog Visibility (Retired Ships Hidden)
```
1. Navigate to /catalog (as admin or regular user)
2. Search for the retired ship (e.g., "X-Wing")
3. Should NOT appear (unless includeInactive=true)
4. Ship is effectively "removed from sale"
```

### Step 6: Test Reactivation
```
1. Go back to /admin
2. Retired ship still visible in table
3. Click "Activate" button
4. Should see: Green success message "Ship activated!"
5. Status badge changes back to green "Active"
6. Button changes back to "Retire"
7. Ship reappears in /catalog for all users
```

### Step 7: Test Catalog Sync (Optional)
```
1. In admin panel, click "🔄 Sync Catalog"
2. Should trigger POST /api/admin/seed?catalogOnly=true
3. Requires X-SEED-KEY header
4. Should see success: "Catalog synced!"
5. Catalog data refreshed from SWAPI
```

### Step 8: Test Pagination & Search
```
1. Check "Include Inactive Ships" checkbox
2. You should see both active + retired ships
3. Use search box: type a partial ship name
4. Results should filter in real-time
5. Pagination buttons allow page navigation
```

---

## 📊 Exit Criteria Validation

✅ **User can register**
- Register endpoint working
- JWT token issued
- User persisted to database

✅ **Browse catalog**
- /catalog endpoint lists active ships only
- Ships appear in table with all details

✅ **Fork ship** (Create custom variant)
- /ship-builder allows creating custom ships
- Fork operation copies catalog ship data

✅ **Edit custom ship**
- /hangar/:id/edit allows editing
- Changes persist to database

✅ **Add to fleet**
- Custom ships can be added to user's fleet
- Fleet displays ships with details

✅ **See retired behavior**
- Admin retires a catalog ship
- Ship disappears from user's /catalog view
- Retired ship still visible to admin (with Include Inactive)
- Can be reactivated to make visible again

---

## 🔐 Configuration for Production

### Admin Role Assignment
In `appsettings.json` (production):
```json
{
  "Seed": {
    "AdminEmails": [ "admin@company.com", "support@company.com" ]
  }
}
```

Users must register with matching email. Admin role assigned on next startup.

### Catalog Sync in Production
By default, catalog sync is disabled in Production for safety.

To enable:
```json
{
  "Seed": {
    "AllowCatalogSyncInProduction": true,
    "ApiKey": "YOUR_SECURE_API_KEY_HERE"
  }
}
```

Sync requires:
- User has Admin role
- Correct X-SEED-KEY header value
- Endpoint: `POST /api/admin/seed?catalogOnly=true`

---

## 🐛 Troubleshooting

### Admin redirects to home instead of showing admin panel
- **Cause**: User not in Admin role
- **Fix**: Register with email in `appsettings.Development.json` AdminEmails array, then login again

### Sync Catalog button shows error
- **Cause**: Missing or incorrect X-SEED-KEY
- **Check**: `appsettings.Development.json` has `"ApiKey": "dev-seed-key-123"`
- **Check**: API request includes header: `X-SEED-KEY: dev-seed-key-123`

### Retired ships still appear in catalog
- **Cause**: Pagination/cache issue
- **Fix**: Refresh page (Ctrl+F5 for hard refresh)
- **Check**: Catalog API filters `WHERE IsActive = true`

### Sorting not working correctly
- **Supported sorts**: name, manufacturer, class, isactive
- **Directions**: asc, desc
- **Example**: GET `/api/admin/catalog/starships?sort=manufacturer&dir=desc`

---

## 📝 API Documentation

### List Catalog Ships
```
GET /api/admin/catalog/starships
Authorization: Bearer {token}

Query Parameters:
- page: int (default: 1)
- pageSize: int (default: 25, max: 200)
- includeInactive: boolean (default: false)
- search: string (searches name and manufacturer)
- sort: string (name|manufacturer|class|isactive, default: name)
- dir: string (asc|desc, default: asc)

Response:
{
  "items": [
    {
      "id": 1,
      "name": "X-Wing",
      "manufacturer": "Incom Corporation",
      "starshipClass": "Starfighter",
      "isActive": true,
      "swapiUrl": "https://swapi.dev/api/starships/12/"
    }
  ],
  "totalCount": 42
}
```

### Retire Ship
```
PATCH /api/admin/catalog/starships/{id}/retire
Authorization: Bearer {token}

Response: 204 No Content
```

### Activate Ship
```
PATCH /api/admin/catalog/starships/{id}/activate
Authorization: Bearer {token}

Response: 204 No Content
```

### Sync Catalog
```
POST /api/admin/seed?catalogOnly=true
Authorization: Bearer {token}
X-SEED-KEY: dev-seed-key-123

Response: 200 OK
{
  "inserted": 37,
  "updated": 5,
  "unchanged": 0,
  "errors": []
}
```

---

## ✨ Implementation Quality

- ✅ Type-safe TypeScript (strict mode)
- ✅ React Query for data fetching & caching
- ✅ Proper error handling with user feedback
- ✅ Responsive Tailwind CSS design
- ✅ Loading states and disabled buttons during mutations
- ✅ Backend validation and authorization
- ✅ Comprehensive audit logging
- ✅ Idempotent operations (safe retries)
- ✅ Pagination support
- ✅ Search and filtering
- ✅ Sorting across multiple fields
