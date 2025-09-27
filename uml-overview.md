# Lavage Auto - Complete UML Documentation

## System Overview

**Lavage Auto** is a French car washing service platform built with Next.js, Supabase, and Prisma. The system connects customers with professional car washers who provide on-location vehicle cleaning services.

## UML Diagrams Summary

### 1. Class Diagram (`uml-class-diagram.md`)
**Purpose**: Shows the static structure of the system including data models, services, and their relationships.

**Key Elements**:
- **Core Entities**: Customer, Car, Booking
- **Service Classes**: AuthService, BookingService, NotificationService
- **Data Access**: PrismaService with repository pattern
- **Enumerations**: ServiceType, BookingStatus

**Relationships**:
- Customer 1:N Car (one customer can own multiple cars)
- Customer 1:N Booking (one customer can make multiple bookings)
- Car 1:N Booking (one car can have multiple service bookings)

### 2. Use Case Diagram (`uml-use-case-diagram.md`)
**Purpose**: Identifies system functionality from user perspective and defines actor interactions.

**Actors**:
- **Customer**: Primary user who books car wash services
- **Car Washer**: Service provider who performs the washing
- **Administrator**: System manager handling pricing and reports
- **Payment System**: External payment processing service

**Key Use Cases**:
- Authentication (register, login, OAuth)
- Booking management (create, view, cancel, reschedule)
- Service execution (start, progress, complete)
- Profile management (cars, personal info)

### 3. Sequence Diagrams (`uml-sequence-diagrams.md`)
**Purpose**: Shows detailed interaction flows for key system processes over time.

**Covered Workflows**:
- **Customer Registration**: Complete signup process with validation and notifications
- **Booking Creation**: Full booking flow from selection to payment confirmation  
- **Service Execution**: Washer workflow from assignment to completion
- **OAuth Authentication**: Google login integration with Supabase

**Key Insights**:
- Error handling at each validation step
- Asynchronous notification patterns
- Payment processing integration points
- Database transaction management

### 4. Component Diagram (`uml-component-diagram.md`)
**Purpose**: Illustrates system architecture and component relationships across different layers.

**Architecture Layers**:
- **Frontend Layer**: Next.js pages, components, and context
- **API Layer**: RESTful endpoints with Next.js App Router
- **Business Logic Layer**: Services and utilities
- **Data Layer**: PostgreSQL database and external services

**Key Components**:
- Authentication system with multiple providers
- Booking engine with scheduling logic
- Notification system for customer communication
- Payment processing integration

### 5. Activity Diagram (`uml-activity-diagram.md`)
**Purpose**: Maps the complete booking process flow including decision points and parallel activities.

**Process Flow**:
- Customer authentication and service selection
- Car registration and scheduling
- Payment processing and confirmation
- Service execution and completion
- Review and feedback collection

**Business Logic**:
- Booking validation rules
- Payment failure handling
- Cancellation and refund processes
- Reminder notification scheduling

## System Architecture Insights

### Design Patterns Used
1. **Repository Pattern**: Database access abstraction through Prisma
2. **Service Layer Pattern**: Business logic separation from API endpoints
3. **Observer Pattern**: Event-driven notifications
4. **Factory Pattern**: Service type and pricing calculation

### Security Implementation
- **Authentication**: Multi-provider support (email/password + Google OAuth)
- **Authorization**: Session-based access control
- **Data Validation**: Input sanitization at API and service layers
- **Password Security**: Bcrypt hashing with salt rounds

### Scalability Considerations
- **Database**: Connection pooling and optimized queries
- **API**: Stateless design enabling horizontal scaling
- **External Services**: Async processing for notifications and payments
- **Caching**: Session and static data caching strategies

### Technology Stack Integration
- **Frontend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS for responsive design
- **Deployment**: Vercel (recommended) with environment configuration

## Business Logic Rules

### Booking Rules
- Minimum 2-hour advance booking requirement
- Maximum 30-day future booking window
- Single booking per car per time slot
- Automatic cancellation after payment timeout

### Service Types & Pricing
- **Exterior**: €15 (basic wash and dry)
- **Complete**: €25 (exterior + interior cleaning)
- **Premium**: €35 (complete + wax + detail)

### Cancellation Policy
- Free cancellation up to 1 hour before service
- 50% refund for cancellations within 1 hour
- No refund for no-shows or same-time cancellations

### Quality Assurance
- Mandatory before/after photos for washers
- Customer rating system (1-5 stars)
- Automatic refund triggers for low ratings
- Washer performance tracking

## Development Recommendations

### Immediate Priorities (MVP)
1. Complete authentication system testing
2. Implement booking creation and management
3. Basic payment processing integration
4. Email notification system

### Phase 2 Features
1. Mobile-responsive washer application
2. Real-time booking status updates
3. Advanced scheduling with washer assignments
4. Customer loyalty program

### Phase 3 Enhancements  
1. Photo upload and gallery system
2. Advanced analytics and reporting
3. Multi-language support (French/English)
4. Integration with calendar applications

## File Structure
```
/lavage-auto/
├── uml-class-diagram.md      # Data models and relationships
├── uml-use-case-diagram.md   # User interactions and system features
├── uml-sequence-diagrams.md  # Process flows and interactions
├── uml-component-diagram.md  # System architecture and components
├── uml-activity-diagram.md   # Booking process workflow
└── uml-overview.md          # This comprehensive documentation
```

Each diagram provides a different perspective on the system:
- **Static views**: Class and Component diagrams
- **Dynamic views**: Sequence and Activity diagrams  
- **Functional view**: Use Case diagram
- **Complete view**: This overview document

This documentation serves as a complete reference for understanding the Lavage Auto system architecture, business logic, and implementation strategy.