# Account Service Functional Requirements Document (FRD)

## 1. Overview

The Account Service is a core component of the JVT Authentication system, responsible for managing user accounts, authentication, and account lifecycle management. It provides RESTful APIs for account creation, login, password management, and account administration.

### 1.1 Purpose
- User account management
- Authentication and authorization
- Password security and lifecycle management
- Account type and role management
- Cookie-based session validation

### 1.2 Scope
This service handles all account-related operations including:
- Account CRUD operations
- Login/logout functionality
- Password reset and validation
- Account lifecycle management (CREATED, ACTIVE, DISABLED, EXPIRED, DELETED)
- Account type management (PERMANENT, WITH_EXPIRATION)
- Role assignment

## 2. Functional Requirements

### 2.1 Account Management

#### FR-ACC-001: Create Account
- **Description**: Create a new user account with system-generated initial password
- **Pre-conditions**: Valid account data provided
- **Post-conditions**: Account created with CREATED lifecycle, must_change_password = true
- **Business Rules**:
  - Username must be unique
  - Username format: lowercase, alphanumeric + underscore, 4-20 characters
  - Initial password is auto-generated and meets complexity requirements
  - For WITH_EXPIRATION accounts, expiry date is required
  - For PERMANENT accounts, expiry date must be null

#### FR-ACC-002: Get All Accounts
- **Description**: Retrieve all accounts (excluding passwords)
- **Access**: Admin only (assumed)

#### FR-ACC-003: Get Account by ID
- **Description**: Retrieve specific account details (excluding password)
- **Error Handling**: 404 if account not found

#### FR-ACC-004: Edit Account Role
- **Description**: Update account role
- **Validation**: Role lookup must exist

#### FR-ACC-005: Account Lifecycle Management
- **Description**: Change account lifecycle status
- **States**: CREATED, ACTIVE, DISABLED, EXPIRED, DELETED
- **Business Rules**:
  - EXPIRED: Automatically set when expiry date reached for WITH_EXPIRATION accounts
  - DELETED: Soft delete (mark as DELETED)

### 2.2 Authentication

#### FR-AUTH-001: Login
- **Description**: Authenticate user and set session cookie
- **Validation**: Username/password match
- **Business Rules**:
  - Update last_login_time on successful login
  - Check account lifecycle (DELETED=404, DISABLED/EXPIRED=403)
  - CREATED accounts can login but must change password
- **Session**: Sets httpOnly cookie 'accountId'

#### FR-AUTH-002: Logout
- **Description**: Clear session cookie

#### FR-AUTH-003: Validate Session
- **Description**: Validate cookie and return account details
- **Error Handling**: 401 if invalid cookie or account disabled/deleted/expired

### 2.3 Password Management

#### FR-PWD-001: Reset Password
- **Description**: Change account password
- **Validation**: Password meets complexity requirements
- **Business Rules**:
  - If account lifecycle is CREATED, change to ACTIVE after password reset
  - Set must_change_password = false
  - Update password_last_changed timestamp
- **Complexity Rules**:
  - Minimum 12 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character

#### FR-PWD-002: Password Generation
- **Description**: Auto-generate secure initial passwords
- **Algorithm**: Random generation with required character types

## 3. Data Models

### 3.1 Account Entity
```typescript
{
  id: string (UUID)
  username: string (unique, 4-20 chars, regex: ^[a-z][a-z0-9_]{3,19}$)
  password: string (hashed, excluded from responses)
  full_name: string
  phone_number?: string
  email?: string
  attribute?: any (JSON)
  account_lifecycle: string (UUID - lookup reference)
  account_type: string (UUID - lookup reference)
  account_role?: string (UUID - lookup reference)
  account_expiry_date?: DateTime
  password_last_changed?: DateTime
  must_change_password: boolean
  last_login_time?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 3.2 Lookup Types
- **ACCOUNT_LIFECYCLE**: CREATED, ACTIVE, DISABLED, EXPIRED, DELETED
- **ACCOUNT_TYPE**: PERMANENT, WITH_EXPIRATION
- **ACCOUNT_ROLE**: Various role definitions

## 4. API Endpoints

### 4.1 Account Management
- `GET /accounts` - Get all accounts
- `GET /accounts/:id` - Get account by ID
- `POST /accounts` - Create new account
- `PATCH /accounts/:id/role` - Update account role
- `PATCH /accounts/:id/disable` - Disable account
- `PATCH /accounts/:id/enable` - Enable account
- `DELETE /accounts/:id` - Soft delete account

### 4.2 Authentication
- `POST /accounts/login` - Login
- `POST /accounts/logout` - Logout
- `GET /accounts/validate` - Validate session

### 4.3 Password Management
- `POST /accounts/:id/reset-password` - Reset password

## 5. Business Rules

### 5.1 Account Lifecycle
- **CREATED**: Initial state, must change password on first login
- **ACTIVE**: Normal operational state
- **DISABLED**: Account disabled by admin
- **EXPIRED**: Automatically set for WITH_EXPIRATION accounts past expiry date
- **DELETED**: Soft deleted, treated as not found

### 5.2 Account Types
- **PERMANENT**: No expiry date
- **WITH_EXPIRATION**: Requires expiry date, auto-expires

### 5.3 Password Policies
- Complexity requirements as specified
- Initial passwords auto-generated
- Password change required for CREATED accounts
- Password hashing using bcrypt with salt rounds = 12

### 5.4 Session Management
- Cookie-based sessions
- HttpOnly cookies for security
- Session validation checks account status

## 6. Validation Rules

### 6.1 Username
- Unique across all accounts
- Format: `^[a-z][a-z0-9_]{3,19}$`
- Length: 4-20 characters

### 6.2 Password
- Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=[\]{}|;:,.<>]{12,}$`
- Minimum 12 characters
- Required character types: uppercase, lowercase, digit, special character

### 6.3 Email
- Optional
- Valid email format if provided

### 6.4 Phone Number
- Optional
- String format

## 7. Error Handling

### 7.1 HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials/cookie)
- 403: Forbidden (account disabled/expired)
- 404: Not Found (account deleted/not found)

### 7.2 Error Messages
- Validation errors: Specific field validation messages
- Authentication errors: Generic "Invalid credentials"
- Account status: Specific messages for disabled/expired accounts

## 8. Security Considerations

- Passwords hashed with bcrypt (12 salt rounds)
- HttpOnly cookies for session management
- No password exposure in API responses
- Account lifecycle checks on all operations
- Input validation and sanitization
- SQL injection prevention via Prisma ORM

## 9. Dependencies

- Prisma ORM for database operations
- bcrypt for password hashing
- yup for input validation
- NestJS framework
- Express for HTTP handling

## 10. Assumptions

- Admin access control is handled at higher layers
- Lookup tables are pre-seeded with required values
- Database is PostgreSQL
- Session cookies are managed by client/browser</content>
<parameter name="filePath">d:\DEV\kufayeka\jvt_auth\src\account\README.md