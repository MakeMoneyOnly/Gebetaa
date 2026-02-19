# Gebeta Restaurant OS - Architecture Diagrams

## C4 Model Architecture Documentation

This document provides a comprehensive view of the Gebeta Restaurant OS architecture using the C4 model.

---

## Level 1: System Context Diagram

```mermaid
graph TB
    subgraph External
        Guest[Guest Customer]
        Staff[Restaurant Staff]
        Manager[Restaurant Manager]
        Admin[Agency Admin]
        Telebirr[Telebirr Payment]
        Chapa[Chapa Payment]
    end

    subgraph System[Gebeta Restaurant OS]
        WebApp[Web Application]
        API[API Layer]
        Database[(Database)]
    end

    Guest -->|Browse Menu, Place Orders| WebApp
    Staff -->|Manage Orders, KDS| WebApp
    Manager -->|Dashboard, Analytics| WebApp
    Admin -->|Multi-tenant Management| WebApp
    
    WebApp -->|API Calls| API
    API -->|CRUD Operations| Database
    
    API -->|Process Payments| Telebirr
    API -->|Process Payments| Chapa

    style System fill:#4A90D9,color:#fff
    style External fill:#999,color:#fff
```

### System Description

**Gebeta Restaurant OS** is a comprehensive restaurant operating system designed for Addis Ababa, Ethiopia. It provides:

- **Guest Ordering**: QR code-based table ordering for customers
- **Kitchen Display System (KDS)**: Real-time order management for kitchen staff
- **Merchant Dashboard**: Analytics, inventory, and staff management
- **Multi-Tenant SaaS**: Agency model for managing multiple restaurants

---

## Level 2: Container Diagram

```mermaid
graph TB
    subgraph Client
        Browser[Web Browser]
        Mobile[Mobile Browser PWA]
    end

    subgraph Frontend[Next.js Application]
        SSR[Server Components]
        CSR[Client Components]
        PWA[PWA Service Worker]
    end

    subgraph Backend[Backend Services]
        APIRoutes[API Routes]
        ServerActions[Server Actions]
        Middleware[Auth Middleware]
    end

    subgraph Data[Data Layer]
        PostgreSQL[(PostgreSQL<br/>Supabase)]
        Redis[(Redis Cache)]
        IndexedDB[(IndexedDB<br/>Offline Storage)]
        Storage[Object Storage<br/>Supabase]
    end

    subgraph External[External Services]
        SupabaseAuth[Supabase Auth]
        TelebirrAPI[Telebirr API]
        ChapaAPI[Chapa API]
        Sentry[Sentry Monitoring]
    end

    Browser -->|HTTPS| SSR
    Browser -->|HTTPS| CSR
    Mobile -->|HTTPS PWA| PWA
    
    SSR -->|Server-side Fetch| APIRoutes
    CSR -->|Client-side Fetch| APIRoutes
    CSR -->|Offline Queue| IndexedDB
    PWA -->|Cache| IndexedDB
    
    APIRoutes --> Middleware
    Middleware --> SupabaseAuth
    APIRoutes --> PostgreSQL
    APIRoutes --> Redis
    APIRoutes --> Storage
    
    ServerActions --> PostgreSQL
    
    APIRoutes -->|Payment| TelebirrAPI
    APIRoutes -->|Payment| ChapaAPI
    APIRoutes -->|Error Tracking| Sentry

    style Frontend fill:#61DAFB,color:#000
    style Backend fill:#4A90D9,color:#fff
    style Data fill:#336791,color:#fff
    style External fill:#999,color:#fff
```

### Container Descriptions

| Container | Technology | Description |
|-----------|------------|-------------|
| **Web Browser** | React 19, Next.js 16 | Desktop web application |
| **Mobile Browser PWA** | PWA, Service Worker | Progressive web app for mobile |
| **Server Components** | Next.js RSC | Server-rendered React components |
| **Client Components** | React, Zustand | Interactive client-side components |
| **API Routes** | Next.js API Routes | RESTful API endpoints |
| **Server Actions** | Next.js Server Actions | Form submissions and mutations |
| **PostgreSQL** | Supabase | Primary database with RLS |
| **Redis** | ioredis | Rate limiting and caching |
| **IndexedDB** | Dexie.js | Offline-first data storage |

---

## Level 3: Component Diagram - Merchant Dashboard

```mermaid
graph TB
    subgraph Dashboard[Merchant Dashboard]
        AuthGuard[Auth Guard]
        Layout[Dashboard Layout]
        
        subgraph Pages
            OrdersPage[Orders Page]
            MenuPage[Menu Page]
            AnalyticsPage[Analytics Page]
            StaffPage[Staff Page]
            SettingsPage[Settings Page]
        end
        
        subgraph Components
            OrderBoard[Orders Kanban Board]
            MenuEditor[Menu Editor]
            Charts[Revenue Charts]
            StaffTable[Staff Management]
        end
    end

    subgraph State[State Management]
        CartStore[Cart Store<br/>Zustand]
        QueryCache[Query Cache<br/>TanStack Query]
    end

    subgraph Services[API Services]
        OrdersAPI[Orders API]
        MenuAPI[Menu API]
        AnalyticsAPI[Analytics API]
        StaffAPI[Staff API]
    end

    AuthGuard --> Layout
    Layout --> Pages
    Pages --> Components
    
    Components --> State
    State --> Services
    Services -->|HTTP| Backend[(Backend API)]

    style Dashboard fill:#61DAFB,color:#000
    style State fill:#FFD93D,color:#000
    style Services fill:#4A90D9,color:#fff
```

---

## Level 3: Component Diagram - Guest Ordering

```mermaid
graph TB
    subgraph Guest[Guest Ordering Flow]
        QRScanner[QR Code Scanner]
        
        subgraph ContextValidation[Context Validation]
            HMAC[HMAC Verification]
            Session[Session Creation]
        end
        
        Menu[Menu Browser]
        Cart[Shopping Cart]
        Checkout[Checkout Flow]
        
        subgraph Payment[Payment Processing]
            TelebirrCheckout[Telebirr Checkout]
            ChapaCheckout[Chapa Checkout]
            CashPayment[Cash Payment]
        end
    end

    subgraph Offline[Offline Support]
        Queue[Order Queue]
        Sync[Sync Service]
        ConflictResolver[Conflict Resolver]
    end

    QRScanner -->|Scanned URL| ContextValidation
    ContextValidation -->|Valid Session| Menu
    Menu --> Cart
    Cart --> Checkout
    Checkout --> Payment
    
    Cart -->|Offline| Queue
    Queue -->|Online| Sync
    Sync --> ConflictResolver

    style Guest fill:#61DAFB,color:#000
    style Offline fill:#FFD93D,color:#000
```

---

## Level 3: Component Diagram - Kitchen Display System

```mermaid
graph TB
    subgraph KDS[Kitchen Display System]
        AuthGuard[Auth Guard]
        
        subgraph Views
            OrderQueue[Order Queue View]
            OrderDetail[Order Detail View]
            StatusUpdate[Status Update]
        end
        
        subgraph Realtime[Realtime Updates]
            Subscription[Supabase Realtime]
            Notifications[Push Notifications]
        end
        
        subgraph Audio[Audio Alerts]
            NewOrder[New Order Sound]
            Urgent[Expedite Alert]
        end
    end

    subgraph API[Backend]
        OrdersChannel[Orders Channel]
        StatusAPI[Status Update API]
    end

    AuthGuard --> Views
    Views --> Realtime
    Views --> Audio
    Realtime --> Subscription
    Subscription --> OrdersChannel
    StatusUpdate --> StatusAPI

    style KDS fill:#61DAFB,color:#000
    style API fill:#4A90D9,color:#fff
```

---

## Database Schema Overview

```mermaid
erDiagram
    RESTAURANTS ||--o{ STAFF : employs
    RESTAURANTS ||--o{ MENU_ITEMS : has
    RESTAURANTS ||--o{ ORDERS : receives
    RESTAURANTS ||--o{ TABLES : has
    RESTAURANTS ||--o{ SERVICE_REQUESTS : handles
    
    STAFF ||--o{ ORDERS : creates
    STAFF ||--o{ SHIFTS : works
    
    TABLES ||--o{ TABLE_SESSIONS : hosts
    TABLE_SESSIONS ||--o{ ORDERS : contains
    
    ORDERS ||--|{ ORDER_ITEMS : includes
    ORDERS ||--o| PAYMENTS : has
    ORDERS ||--o{ ORDER_EVENTS : generates
    
    MENU_ITEMS ||--o{ ORDER_ITEMS : ordered_in
    MENU_CATEGORIES ||--o{ MENU_ITEMS : contains
    
    GUESTS ||--o{ ORDERS : places
    GUESTS ||--o{ GUEST_VISITS : has

    RESTAURANTS {
        uuid id PK
        string name
        string slug
        jsonb settings
        timestamp created_at
    }
    
    ORDERS {
        uuid id PK
        uuid restaurant_id FK
        uuid table_session_id FK
        string status
        decimal total
        string idempotency_key
        timestamp created_at
    }
    
    MENU_ITEMS {
        uuid id PK
        uuid restaurant_id FK
        uuid category_id FK
        string name
        decimal price
        boolean is_available
    }
```

---

## Security Architecture

```mermaid
graph TB
    subgraph Client[Client Layer]
        Browser[Browser]
        MobilePWA[Mobile PWA]
    end

    subgraph Edge[Edge Layer]
        Middleware[Next.js Middleware]
        RateLimiter[Rate Limiter]
    end

    subgraph Auth[Authentication]
        SupabaseAuth[Supabase Auth]
        SessionCookies[Session Cookies]
        HMAC[HMAC Verification<br/>Guest QR]
    end

    subgraph Authorization[Authorization]
        RLS[Row Level Security]
        RoleGuard[Role Guard]
        TenantCheck[Tenant Isolation]
    end

    subgraph Data[Data Layer]
        Database[(PostgreSQL)]
    end

    Browser -->|Request| Middleware
    MobilePWA -->|Request| Middleware
    
    Middleware --> RateLimiter
    Middleware --> SupabaseAuth
    
    SupabaseAuth --> SessionCookies
    SessionCookies --> RoleGuard
    
    HMAC -->|Guest Context| TenantCheck
    RoleGuard --> TenantCheck
    
    TenantCheck --> RLS
    RLS --> Database

    style Edge fill:#FF6B6B,color:#fff
    style Auth fill:#4ECDC4,color:#000
    style Authorization fill:#45B7D1,color:#000
```

---

## Offline-First Architecture

```mermaid
graph TB
    subgraph Online[Online Mode]
        API[API Server]
        Database[(Database)]
    end

    subgraph Client[Client Layer]
        UI[React UI]
        StateManagers[State Managers]
        SyncEngine[Sync Engine]
    end

    subgraph Storage[Local Storage]
        IndexedDB[(IndexedDB<br/>Dexie.js)]
        Queue[Pending Queue]
        ConflictLog[Conflict Log]
    end

    UI -->|Actions| StateManagers
    StateManagers -->|Online| API
    StateManagers -->|Offline| IndexedDB
    
    API -->|Response| StateManagers
    IndexedDB -->|Sync| SyncEngine
    SyncEngine -->|Retry| API
    
    Queue -->|Process| SyncEngine
    SyncEngine -->|Conflicts| ConflictLog
    
    API -->|Persist| Database

    style Online fill:#4ECDC4,color:#000
    style Client fill:#61DAFB,color:#000
    style Storage fill:#FFD93D,color:#000
```

### Sync Strategy

1. **Last-Write-Wins**: Conflicts resolved by `updated_at` timestamp
2. **Idempotency Keys**: Prevent duplicate operations
3. **Version Tracking**: Track entity versions for conflict detection
4. **Audit Trail**: Log all sync operations for debugging

---

## Deployment Architecture

```mermaid
graph TB
    subgraph Production[Production Environment]
        subgraph Vercel[Vercel Edge Network]
            Edge[Edge Functions]
            SSR[SSR Servers]
            Static[Static Assets CDN]
        end
        
        subgraph Supabase[Supabase Cloud]
            DB[(PostgreSQL)]
            Auth[Auth Service]
            Realtime[Realtime Server]
            Storage[Object Storage]
        end
        
        subgraph External[External Services]
            Redis[(Redis Cloud)]
            Sentry[Sentry.io]
            Telebirr[Telebirr API]
        end
    end

    Users[Users] -->|HTTPS| Vercel
    Edge --> SSR
    SSR --> Static
    SSR --> DB
    SSR --> Auth
    SSR --> Realtime
    SSR --> Storage
    SSR --> Redis
    SSR --> Sentry
    SSR --> Telebirr

    style Vercel fill:#000,color:#fff
    style Supabase fill:#3ECF8E,color:#000
    style External fill:#999,color:#fff
```

---

## Multi-Tenant Architecture

```mermaid
graph TB
    subgraph Agency[Agency Model]
        AgencyAdmin[Agency Admin]
        AgencyUsers[Agency Users]
    end

    subgraph Tenants[Restaurant Tenants]
        Restaurant1[Restaurant A]
        Restaurant2[Restaurant B]
        Restaurant3[Restaurant C]
    end

    subgraph DataIsolation[Data Isolation]
        RLS[Row Level Security]
        StaffMembership[Staff Membership]
    end

    subgraph Database[(Database)]
        OrdersTable[Orders Table]
        MenuTable[Menu Table]
        StaffTable[Staff Table]
    end

    AgencyAdmin -->|Manage All| AgencyUsers
    AgencyUsers -->|Access| Restaurant1
    AgencyUsers -->|Access| Restaurant2
    
    Restaurant1 -->|restaurant_id| RLS
    Restaurant2 -->|restaurant_id| RLS
    Restaurant3 -->|restaurant_id| RLS
    
    RLS --> StaffMembership
    StaffMembership -->|Filter| OrdersTable
    StaffMembership -->|Filter| MenuTable
    StaffMembership -->|Filter| StaffTable

    style Agency fill:#9B59B6,color:#fff
    style Tenants fill:#3498DB,color:#fff
    style DataIsolation fill:#E74C3C,color:#fff
```

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19 | SSR, RSC, App Router |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **State** | Zustand, TanStack Query | Client/Server state |
| **Backend** | Next.js API Routes | RESTful endpoints |
| **Database** | PostgreSQL (Supabase) | Primary datastore |
| **Auth** | Supabase Auth | Authentication, RLS |
| **Offline** | Dexie.js, Service Worker | PWA, offline-first |
| **Cache** | Redis | Rate limiting, sessions |
| **Monitoring** | Sentry | Error tracking |
| **Payments** | Telebirr, Chapa | Ethiopian payment gateways |

---

*Generated for Gebeta Restaurant OS - February 2026*