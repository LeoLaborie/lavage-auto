# UML Class Diagram - Lavage Auto System

```mermaid
classDiagram
    class Customer {
        -String id
        -String email
        -String name
        -String phone?
        -String address?
        -String profilePicture?
        -String hashedPassword?
        -Boolean emailVerified
        -String supabaseUserId?
        -DateTime createdAt
        -DateTime updatedAt
        +register(email, password, name)
        +login(email, password)
        +updateProfile(data)
        +addCar(carData)
        +createBooking(bookingData)
        +getBookings()
    }

    class Car {
        -String id
        -String customerId
        -String make
        -String model
        -Int year?
        -String color?
        -String licensePlate?
        -DateTime createdAt
        -DateTime updatedAt
        +update(carData)
        +delete()
        +getBookings()
    }

    class Booking {
        -String id
        -String customerId
        -String carId
        -String serviceType
        -Decimal price
        -String status
        -DateTime scheduledDate
        -DateTime completedAt?
        -String address
        -DateTime createdAt
        -DateTime updatedAt
        +confirm()
        +cancel()
        +markInProgress()
        +complete()
        +updateSchedule(newDate)
    }

    class AuthService {
        +hashPassword(password: String): String
        +validatePassword(password: String): ValidationResult
        +comparePassword(password: String, hash: String): Boolean
        +generateToken(customerId: String): String
        +verifyToken(token: String): Customer
    }

    class BookingService {
        +calculatePrice(serviceType: String): Decimal
        +validateSchedule(date: DateTime): Boolean
        +createBooking(data: BookingData): Booking
        +updateBookingStatus(id: String, status: String): Booking
        +getAvailableSlots(date: Date): DateTime[]
    }

    class NotificationService {
        +sendBookingConfirmation(booking: Booking): Boolean
        +sendReminder(booking: Booking): Boolean
        +sendStatusUpdate(booking: Booking): Boolean
    }

    class PrismaService {
        +customer: CustomerRepository
        +car: CarRepository
        +booking: BookingRepository
        +connect(): void
        +disconnect(): void
    }

    %% Relationships
    Customer ||--o{ Car : "owns"
    Customer ||--o{ Booking : "makes"
    Car ||--o{ Booking : "used in"
    
    Customer --> AuthService : "uses"
    Booking --> BookingService : "managed by"
    Booking --> NotificationService : "triggers"
    
    AuthService --> PrismaService : "uses"
    BookingService --> PrismaService : "uses"
    NotificationService --> PrismaService : "uses"

    %% Enumerations
    class ServiceType {
        <<enumeration>>
        EXTERIOR
        COMPLETE
        PREMIUM
    }

    class BookingStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        IN_PROGRESS
        COMPLETED
        CANCELLED
    }

    Booking --> ServiceType : "has"
    Booking --> BookingStatus : "has"
```

## Domain Model Analysis

### Core Entities

1. **Customer**: Central entity representing users of the car wash service
   - Supports both email/password and Google OAuth authentication
   - Can own multiple cars and make multiple bookings

2. **Car**: Represents vehicles owned by customers
   - Linked to customer with cascade delete
   - Contains vehicle identification and details

3. **Booking**: Represents service appointments
   - Links customer and car for a specific service
   - Tracks status, pricing, and scheduling

### Service Classes

1. **AuthService**: Handles authentication logic
2. **BookingService**: Manages booking business logic
3. **NotificationService**: Handles customer communications
4. **PrismaService**: Data access layer

### Key Design Patterns

- **Repository Pattern**: Data access through Prisma
- **Service Layer**: Business logic separation
- **Observer Pattern**: Notifications triggered by booking changes