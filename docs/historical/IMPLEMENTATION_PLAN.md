# Restaurant Operations Platform — Implementation Plan

## Overview
A mobile-first, real-time restaurant operations platform with three core interfaces: Guest QR Menu, Kitchen Display System (KDS), and Waiter/Staff App, all connected through Supabase Realtime.

## Phase 1: Foundation & Authentication
Set up the database, authentication, and role-based access control.
- [ ] Auth system with email/password login for staff (admin, kitchen, waiter roles)
- [ ] Role-based routing: Admin → Dashboard, Kitchen → KDS, Waiter → Staff App
- [ ] Database schema: restaurants, tables, menu categories, menu items, orders, order items, service requests, user roles
- [ ] Dark mode default with premium dining aesthetic throughout the staff interfaces

## Phase 2: Admin Dashboard & Menu Management
Build the back-office for restaurant setup and menu control.
- [ ] Menu Builder: Add/edit/remove categories and items with name (English + Amharic), description, price (ETB), placeholder images, and station assignment (Kitchen/Bar)
- [ ] Table Management: Create and manage tables, each generating a unique QR code URL (/table/{table_id})
- [ ] Staff Management: Invite and assign roles to team members
- [ ] Sidebar navigation with sections for Menu, Tables, Staff, and Orders overview

## Phase 3: Guest QR Menu Experience
The customer-facing mobile-first ordering interface — no login required.
- [ ] Table-specific routing: Guests scan QR → land on /table/{id} with table number displayed
- [ ] Visual menu with categories, item cards with images, descriptions, and prices in ETB
- [ ] Amharic/English language toggle
- [ ] Floating Action Button with three options:
  - 🛒 Order: Add items to cart, review, and submit to kitchen
  - 🔔 Request Service: Water, Napkins, Call Waiter buttons
  - 💳 Request Bill: Locks the order and notifies staff
- [ ] Order progress bar: Received → Cooking → Ready — updated in real-time via Supabase Realtime
- [ ] Optimistic UI: Instant feedback on order submission

## Phase 4: Kitchen Display System (KDS)
Real-time order management for kitchen and bar staff.
- [ ] Station filtering: Toggle between "Kitchen" (food only) and "Bar" (drinks only) views
- [ ] Order ticket cards showing table number, items, time elapsed, and special notes
- [ ] Gloria Siren alert: Audio notification on new orders that loops until "Accept" is tapped
- [ ] Color-coded urgency: White (fresh) → Yellow (10+ min) → Red (15+ min)
- [ ] Workflow buttons: Accept → Mark Cooking → Mark Ready (per item or full order)
- [ ] Real-time sync via Supabase Realtime subscriptions

## Phase 5: Waiter/Staff App
Mobile-optimized interface for front-of-house staff.
- [ ] Live dashboard showing all active tables with status indicators
- [ ] Push-style notifications (in-app + audio) for service requests (water, napkins, bill, call waiter) tied to specific tables
- [ ] Order management: View active orders, void or edit items that haven't started cooking
- [ ] Table status overview: Open, Occupied, Needs Attention, Bill Requested

## Phase 6: Polish & PWA
Final refinements for production readiness.
- [ ] PWA setup with service worker for offline menu caching
- [ ] Performance optimization: Lazy loading, image compression, target < 2MB total assets
- [ ] AI cross-selling suggestions (e.g., "Pairs well with Arki" when ordering Kitfo) — powered by item pairings configured in admin
- [ ] Native-feel transitions and animations throughout
- [ ] Sound/notification settings for KDS and staff app
