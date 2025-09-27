# UML Sequence Diagrams - Lavage Auto System

## 1. Customer Registration Sequence

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Login Page
    participant API as Auth API
    participant AS as Auth Service
    participant DB as Database
    participant NS as Notification Service

    C->>UI: Fill registration form
    C->>UI: Submit registration
    UI->>API: POST /api/auth/register
    
    API->>API: Validate input data
    API->>AS: validatePassword(password)
    AS-->>API: validation result
    
    alt Password invalid
        API-->>UI: Error: Invalid password
        UI-->>C: Show validation error
    else Password valid
        API->>AS: hashPassword(password)
        AS-->>API: hashedPassword
        
        API->>DB: Check if email exists
        DB-->>API: query result
        
        alt Email exists
            API-->>UI: Error: Email already exists
            UI-->>C: Show error message
        else Email available
            API->>DB: Create customer record
            DB-->>API: customer created
            
            API->>NS: sendWelcomeEmail(customer)
            NS-->>API: email sent
            
            API-->>UI: Success: Account created
            UI-->>C: Show success message
            UI->>UI: Switch to login form
        end
    end
```

## 2. Booking Creation Sequence

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Booking Page
    participant API as Booking API
    participant BS as Booking Service
    participant PS as Payment Service
    participant DB as Database
    participant NS as Notification Service

    C->>UI: Select service type
    C->>UI: Choose date & time
    C->>UI: Select car
    C->>UI: Enter address
    
    UI->>API: POST /api/bookings
    API->>API: Validate booking data
    
    API->>BS: checkAvailability(date, time)
    BS->>DB: Query existing bookings
    DB-->>BS: booking conflicts
    BS-->>API: availability result
    
    alt Time slot unavailable
        API-->>UI: Error: Time slot taken
        UI-->>C: Show alternative times
    else Time slot available
        API->>BS: calculatePrice(serviceType)
        BS-->>API: calculated price
        
        API->>DB: Create booking record
        DB-->>API: booking created
        
        API->>PS: processPayment(bookingId, amount)
        PS-->>API: payment result
        
        alt Payment failed
            API->>DB: Update booking status to "payment_failed"
            API-->>UI: Error: Payment failed
            UI-->>C: Show payment error
        else Payment successful
            API->>DB: Update booking status to "confirmed"
            DB-->>API: booking updated
            
            API->>NS: sendBookingConfirmation(booking)
            NS-->>API: confirmation sent
            
            API-->>UI: Success: Booking confirmed
            UI-->>C: Show confirmation details
        end
    end
```

## 3. Service Execution Sequence

```mermaid
sequenceDiagram
    participant W as Car Washer
    participant WA as Washer App
    participant API as Service API
    participant DB as Database
    participant NS as Notification Service
    participant C as Customer

    W->>WA: View assigned bookings
    WA->>API: GET /api/washer/bookings
    API->>DB: Query washer bookings
    DB-->>API: booking list
    API-->>WA: Return bookings
    WA-->>W: Display bookings

    W->>WA: Arrive at location
    W->>WA: Mark service started
    WA->>API: POST /api/bookings/{id}/start
    
    API->>DB: Update booking status to "in_progress"
    API->>DB: Set startedAt timestamp
    DB-->>API: booking updated
    
    API->>NS: sendStatusUpdate(booking, "started")
    NS->>C: Send "Service started" notification
    
    API-->>WA: Success: Service marked as started
    WA-->>W: Show service details

    Note over W,WA: Washer performs car wash service

    W->>WA: Upload before/after photos
    W->>WA: Mark service completed
    WA->>API: POST /api/bookings/{id}/complete
    
    API->>DB: Update booking status to "completed"
    API->>DB: Set completedAt timestamp
    DB-->>API: booking updated
    
    API->>NS: sendServiceComplete(booking)
    NS->>C: Send "Service completed" notification
    
    API-->>WA: Success: Service completed
    WA-->>W: Show completion confirmation
```

## 4. Authentication Flow (OAuth)

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Login Page
    participant SB as Supabase Client
    participant GO as Google OAuth
    participant SA as Supabase Auth
    participant CB as Auth Callback
    participant DB as Database

    C->>UI: Click "Login with Google"
    UI->>SB: signInWithOAuth('google')
    SB->>GO: Redirect to Google OAuth
    GO-->>C: Show Google login
    
    C->>GO: Enter credentials & authorize
    GO->>SA: Send authorization code
    SA->>SA: Exchange code for tokens
    
    SA->>CB: Redirect to /auth/callback
    CB->>SB: Get session data
    SB-->>CB: User session
    
    CB->>DB: Check if customer exists
    DB-->>CB: customer data or null
    
    alt Customer doesn't exist
        CB->>DB: Create customer record
        DB-->>CB: customer created
    end
    
    CB->>UI: Redirect to dashboard
    UI-->>C: Show authenticated state
```

## Key Sequence Insights

### Error Handling Patterns
- Input validation occurs before database operations
- Payment failures trigger booking status updates
- Failed operations provide specific error messages

### Notification Patterns
- Notifications are sent after successful database updates
- Multiple notification types (email, SMS, push) can be triggered
- Customers receive updates at key booking milestones

### Security Patterns
- Password hashing occurs before database storage
- OAuth flows redirect through secure callbacks
- Session validation occurs on protected endpoints

### Performance Considerations
- Availability checks prevent double-bookings
- Database queries are optimized for common operations
- Notifications are sent asynchronously when possible