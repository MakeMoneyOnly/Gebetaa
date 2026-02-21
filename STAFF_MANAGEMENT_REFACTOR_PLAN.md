# Staff Management Architecture: The "Command Center" Approach

## 1. Core Philosophy: Enterprise vs. Toy

The initial implementation (Cards + Calendar + Clock all-in-one) works for a cafe with 3 employees. For a "Toast-like" enterprise experience with 50+ staff, this breaks down.
We are shifting to a **Hub-and-Spoke** model.

### Key Decisions

1.  **Kill the Cards, Embrace the Table**: Detailed Cards are beautiful but low-density. You can only see 4-8 staff at a time. A **Data Table** lets you scan 20 staff instantly, sort by role, and filter by status. This is the only scalable solution for "Enterprise".
2.  **Dedicated Workspaces**:
    - **Planning (Schedule)** is a deep-focus task. It needs a full screen, not a widget.
    - **Monitoring (Time Clock)** is a daily operational task.
    - **Administration (Directory)** is a setting/management task.
    - _Solution_: These must be distinct Routes (`/staff`, `/staff/schedule`, `/staff/clock`), not just Tabs in one file.

---

## 2. Proposed Route Structure

| Route                        | View Name         | Purpose                                             | Key Components                                                     |
| :--------------------------- | :---------------- | :-------------------------------------------------- | :----------------------------------------------------------------- |
| `/merchant/staff`            | **The Directory** | Admin & Overview. Manage people, roles, and hiring. | `StaffStats` (Metrics), `StaffDirectoryTable` (New), `InviteModal` |
| `/merchant/staff/schedule`   | **The Scheduler** | Planning shifts.                                    | `ScheduleCalendar` (Expanded to full width)                        |
| `/merchant/staff/time-clock` | **Time Desk**     | Monitoring attendance & payroll.                    | `TimeClockPanel` (Enhanced), `TimeEntriesTable`                    |

---

## 3. Implementation Steps

### Phase 1: Shared Logic Injection

We need to decouple the fetching logic from the UI so it can be used across 3 different pages.

- **Create `src/hooks/useStaff.ts`**:
    - `useStaff()`: Returns `{ staff, loading, metrics, updateRole, toggleActive, inviteStaff }`.
    - This ensures that if you update a role in the "Directory", the "Schedule" sees it immediately upon navigation.

### Phase 2: Component Architecture

- **`StaffHeader.tsx`**: A premium navigation component.
    - Contains the Page Title ("Staff Management").
    - Contains the "Sub-Navigation" Pills: [Directory] [Schedule] [Time Clock].
    - Persists across all 3 routes.
- **`StaffDirectoryTable.tsx`**: The replacement for the Card Grid.
    - **Columns**: User (Avatar+Name), Role (Colored Badge), Status (Active/Inactive), Joined Date, Actions (Edit Role, Deactivate).
    - **Features**: Search Input ("Find waiter..."), Filter Dropdown (Role: Kitchen/Service).

### Phase 3: Page Refactoring

1.  **`/staff/page.tsx`**:
    - Remove Calendar and TimeClock components.
    - Implement `StaffHeader`.
    - Implement `StaffStats` (Keep the nice metric cards).
    - Render `StaffDirectoryTable`.
2.  **`/staff/schedule/page.tsx`**:
    - New route.
    - Wraps `ScheduleCalendar` in a full-screen layout.
3.  **`/staff/time-clock/page.tsx`**:
    - New route.
    - Wraps `TimeClockPanel`.

---

## 4. Visual Strategy (The "Premium" Feel)

- **The Table**:
    - Row Hover: `hover:bg-gray-50/50` with a smooth transition.
    - Avatars: Clean, rounded squares (Squircle) like Apple/Modern UI.
    - Actions: Hidden by default, appear on hover (`group-hover:opacity-100`). Keeps the interface clean.
- **The Header**:
    - Glassmorphism effect (`backdrop-blur`).
    - Active Tab: Black background, White text.
    - Inactive Tab: Transparent background, Gray text, Hover: Gray background.

## 5. Why this is "Best"?

- **Zero "Scroll Fatigue"**: Tables handle hundreds of rows naturally.
- **Performance**: Loading `/staff` doesn't load the heavy Calendar logic. Loading `/schedule` doesn't load the Administration logic.
- **Focus**: When I'm scheduling, I'm not distracted by who is deactivated. When I'm hiring, I'm not distracted by next week's shifts.
