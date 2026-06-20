# Custom Events Feature - Implementation Guide

## Overview
End-to-end custom event functionality has been implemented, allowing admins to create custom betting events with pre-configured markets, manage them as drafts, and publish them for users to bet on.

## What Was Built

### 1. Backend (Convex)

#### Schema Tables
- **customEvents**: Main event documents with status (draft/published), event details, and metadata
- **customMarkets**: Market templates linked to events with types and priorities
- **customOdds**: Odds for individual market outcomes

#### Mutations
- `createCustomEvent` - Creates new event with 59 pre-configured markets
- `updateCustomEvent` - Edits event details (draft only)
- `updateCustomMarket` - Updates individual market settings
- `createCustomOdds` - Creates odds for market outcomes
- `updateCustomOdds` - Updates odds values
- `publishCustomEvent` - Publishes event for users
- `deleteCustomEvent` - Removes draft events

#### Queries
- `getCustomEvent` - Fetches single event
- `listCustomEvents` - Lists events with filters (status, sport, search)
- `listCustomMarkets` - Gets markets for event
- `listCustomOdds` - Gets odds for market
- `getCustomEventWithMarkets` - Fetches event with full market tree

### 2. Market Template
59 pre-configured markets automatically created for each event:

**Main Markets:**
- 1X2, Double Chance, Draw No Bet

**Goal Markets:**
- Over/Under Goals (0.5 to 4.5)
- Both Teams To Score
- Handicap (-2 to +2)

**Correct Score (14 variations):**
- 0-0, 1-0, 0-1, 1-1, 2-0, 0-2, 2-1, 1-2, 2-2, 3-0, 0-3, 3-1, 1-3, 3-2, 2-3, 3-3, 4-0, 0-4

**First Half Markets:**
- 1X2, Over/Under (0.5, 1.5), Both Teams Score

**HT/FT Combinations (9 variations):**
- All combinations of 1/X/2 halftime results with 1/X/2 fulltime

**Additional Markets:**
- Goals Range (Exactly 1/2/3 Goals, 2 or 3, 3 or 4, 3+, 4+, 5+)
- Winning Margin (Win by 1, Win by 2+)
- Combined (BTTS & Over 2.5, BTTS & Over 3.5)

### 3. UI Components

#### CustomEventEditor
**Location:** `components/custom-event-editor.tsx`
- Multi-step form (3 steps):
  1. Basic Info: Title, teams, date/time, sport, competition, description
  2. Markets Review: Shows 59 pre-configured markets summary
  3. Confirmation: Review all details before creating
- Uses ResponsiveModal for mobile/desktop compatibility
- Creates event with all markets automatically

#### CustomEventsList
**Location:** `components/custom-events-list.tsx`
- Displays events in browsable list
- Features:
  - Search by event name, teams, competition
  - Status badges (draft/published)
  - Hover actions: View, Edit (draft only), Delete (draft only)
  - Metadata display: Date, market count, sport
  - Active selection highlighting

#### CustomEventDetail
**Location:** `components/custom-event-detail.tsx`
- Full event detail view with market browser
- Features:
  - Event header with full details
  - Market categories tabs
  - Market search/filtering
  - Market selection and odds display
  - Action buttons: Publish, Share (published), Edit, Delete (draft)
  - Split layout: Market list + odds view

#### AdminCustomEventsPanel
**Location:** `components/admin-custom-events-panel.tsx`
- Main admin dashboard for custom events
- Features:
  - Tab switching (Drafts/Published)
  - View mode toggle (List/Detail)
  - Create Event button
  - Integrated editor modal

### 4. Admin Page
**Location:** `app/admin/custom-events/page.tsx`
- Uses AdminLayout
- Renders AdminCustomEventsPanel
- Part of admin dashboard navigation

## Data Flow

### Creating an Event
```
Admin clicks "Create Event"
→ CustomEventEditor opens
→ Admin fills basic info (step 1)
→ Admin reviews 59 markets (step 2)
→ Admin confirms (step 3)
→ createCustomEvent mutation runs
→ Event created with status: "draft"
→ All 59 markets auto-created
→ Admin redirected to list view
```

### Managing an Event (Draft)
```
Admin selects event from list
→ CustomEventDetail opens
→ Admin views event info and markets
→ Admin can:
  - Edit basic info
  - Deactivate specific markets
  - View and edit odds
  - Delete entire event
  - Publish event
```

### Publishing an Event
```
Admin clicks "Publish" on draft event
→ Event status changes to "published"
→ Event visible to all users
→ Markets become immutable
→ Can no longer delete or edit
```

## Key Features

### Draft/Published Workflow
- **Draft Status**: Events can be freely edited, deleted, markets can be toggled
- **Published Status**: Immutable, appears in user-facing event list, users can add to betslip

### Pre-configured Markets
- 59 realistic betting markets automatically created
- Markets grouped by type (1X2, Over/Under, Correct Score, etc.)
- Each market has pre-set priority for display order

### Event Management
- Search and filter events by status, sport, text
- Quick actions on hover (view, edit, delete)
- Responsive design (mobile/tablet/desktop)
- Status indicators and badges

### Market Organization
- Markets grouped by category
- Search within markets
- Market priority controls display order
- Individual odds management

## Testing Checklist

### Create Event
- [ ] Navigate to Admin → Custom Events
- [ ] Click "Create Event" button
- [ ] Fill in basic info (title, teams, date, sport, competition)
- [ ] Proceed to markets review step
- [ ] Verify 59 markets listed
- [ ] Complete creation
- [ ] Verify event appears in Drafts tab

### View Event
- [ ] Click event in list
- [ ] Verify event details display correctly
- [ ] Verify all 59 markets visible
- [ ] Test market search
- [ ] Test category filtering
- [ ] Click market to view odds

### Edit Event
- [ ] Select draft event
- [ ] Click Edit button
- [ ] Modify basic info
- [ ] Save changes
- [ ] Verify changes persisted

### Publish Event
- [ ] Select draft event
- [ ] Click Publish button
- [ ] Confirm action
- [ ] Verify event status changed to "published"
- [ ] Verify Edit/Delete buttons hidden
- [ ] Verify Share button appears

### Delete Event
- [ ] Select draft event
- [ ] Click Delete button
- [ ] Confirm action
- [ ] Verify event removed from list
- [ ] (Cannot delete published events)

### Market Display
- [ ] Verify markets grouped by category
- [ ] Switch categories in tabs
- [ ] Search for specific market
- [ ] Verify market priority ordering
- [ ] View odds for selected market

### Responsive Design
- [ ] Test on desktop (1920px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Verify modals convert to drawers on mobile
- [ ] Verify scroll areas work correctly

## File Locations

### Backend
- `convex/schema.ts` - Schema definitions
- `convex/customEvents.ts` - Mutations and queries

### Frontend Components
- `components/custom-event-editor.tsx` - Event creation/editing
- `components/custom-events-list.tsx` - Event listing
- `components/custom-event-detail.tsx` - Event details & market browser
- `components/admin-custom-events-panel.tsx` - Main admin panel

### Pages
- `app/admin/custom-events/page.tsx` - Admin page

## Integration Points

### With Existing System
- Uses existing Convex setup
- Uses existing ShadCN UI components
- Integrates with existing admin layout
- Follows existing code patterns

### With User Betting Interface
- Custom events can be displayed alongside scraped events
- Events marked as "custom" type
- Same market/odds display patterns as scraped events
- Users can add odds to betslip (if integrated)

## Future Enhancements

1. **Odds Management UI** - Better UI for bulk updating odds
2. **Event Cloning** - Clone existing events as template
3. **Bulk Operations** - Edit multiple markets at once
4. **Scheduled Publishing** - Set event to publish at specific time
5. **Event Editing** - Allow editing published events (with caution)
6. **User-Facing Display** - Display custom events in main betting interface
7. **Odds Recommendations** - Auto-suggest odds based on templates
8. **Event Versioning** - Track changes to events over time
9. **Advanced Market Types** - Add more specialized markets
10. **Live Updates** - Real-time odds updates during event

## Troubleshooting

### Event not appearing after creation
- Check Convex logs for errors
- Verify Convex deployment connected
- Try refreshing page
- Check browser console for errors

### Markets not displaying
- Verify event has markets created
- Check query returned results
- Verify market IDs are valid

### Publish button not working
- Verify event is in draft status
- Check browser console for mutation errors
- Verify user has permission

### UI not updating after actions
- Check Convex query is re-running
- Verify useQuery hooks properly configured
- Try manual page refresh

## Performance Considerations

### Optimizations Implemented
- Markets limited to 500 per query
- Odds limited to 4000 per query
- Index on eventId for fast lookups
- Index on status for quick filtering
- Bounded list queries (max 100 items)

### Potential Bottlenecks
- Large number of odds per market
- Frequent market updates
- Bulk event operations

## Security Notes

- Events created with "admin" creator (hardcoded - update when auth available)
- Published events immutable to prevent tampering
- Draft events only accessible to admin (future: add user context)
- All operations include proper error handling
