# Print System Documentation

## Overview

The print system has two distinct flows: browser-based preview and server-side PDF generation. Understanding the difference between these flows is critical for debugging and development.

## Key Architectural Insight

**Dev Mode vs. Built Client:**
- The frontend typically runs in dev mode (`localhost:3000`) with hot reload
- Puppeteer for PDF generation uses the **built production client** (`localhost:5000/print`)
- Changes to CSS/components require rebuilding: `cd client && npm run build`

## Print Preview Flow (Browser-Based)

User navigates to `/print-preview` in their browser to preview what will be printed. This route requires authentication.

**Note**: The `/print` route is exclusively for Puppeteer (PDF generation) and does NOT require authentication.

### Component Chain:
1. **PrintPreview.js** (`client/src/components/PrintPreview.js`)
   - Parses URL parameters (startDate, endDate, view, labels, doctors, technicians, displayOptions)
   - Fetches filtered events via `fetchFilteredEvents()`
   - Manages email dialog state
   - Renders PrintHandler component

2. **PrintHandler.js** (`client/src/components/PrintHandler.js`)
   - Displays print controls (Back, Edit, Email, Print buttons)
   - Renders the calendar based on view type
   - Handles browser print functionality

3. **CustomPrintCalendar.js** (`client/src/components/CustomPrintCalendar.js`)
   - Routes to appropriate view component based on `view` parameter
   - For agenda view → renders `AgendaView.js`
   - For month/week view → renders `GridCalendarView.js`

4. **AgendaView.js** (`client/src/components/AgendaView.js`)
   - Renders the agenda table structure
   - Groups events by date
   - Displays doctor info, descriptions, labels, technicians based on display options
   - Applies CSS classes for styling

### Data Flow:
```
URL Params → PrintPreview → fetchFilteredEvents() → API Request → Database → Render Components
```

## PDF Generation Flow (Server-Side)

Server generates PDFs using Puppeteer headless browser.

### Component Chain:
1. **generatePrintPreviewPDF()** (`server/utils/generatePDF.js`)
   - Accepts params object: startDate, endDate, view, labels, doctors, technicians, displayOptions
   - Builds query string with filter parameters
   - Constructs URL: `http://localhost:${PORT}/print?${queryString}`
   - Calls `generatePDF(url)` which launches Puppeteer

2. **Puppeteer Navigation**
   - Headless browser navigates to `http://localhost:5000/print?...`
   - Loads **built production client** (not dev mode)
   - Renders React app in browser context

3. **ServerPrint.js** (`client/src/components/ServerPrint.js`)
   - Special component used only by Puppeteer (accessed via `/print` route)
   - Parses URL search parameters
   - Fetches events from `/api/schedules/events-print` (localhost-only endpoint)
   - Renders using same components as browser preview

4. **events-print Endpoint** (`server/routes/schedules.js`)
   - Special localhost-only endpoint (no authentication required)
   - Verifies request comes from localhost (security check)
   - Accepts filter parameters: start, end, labels, doctors, technicians
   - Returns filtered events as JSON
   - Used exclusively by Puppeteer during PDF generation

5. **Puppeteer PDF Generation**
   - Waits for page to load completely
   - Captures rendered page as PDF
   - Returns PDF buffer to calling code

### Data Flow:
```
generatePrintPreviewPDF() → Puppeteer → localhost:5000/print → ServerPrint.js →
/api/schedules/events-print → Database → Render → PDF Buffer
```

## Email System Flow

Users can email PDFs to multiple recipient types from the print preview page.

### Component Chain:
1. **User Action**
   - Clicks "Email" button in PrintHandler
   - Opens EmailPrintDialog

2. **EmailPrintDialog.js** (`client/src/components/email/EmailPrintDialog.js`)
   - Displays RecipientSelector for choosing recipients
   - Shows EmailOptionsForm for subject and message customization
   - Validates at least one recipient is selected
   - Sends parameters to `/api/schedules/send-print-emails`

3. **RecipientSelector.js** (`client/src/components/email/RecipientSelector.js`)
   - Four accordion sections:
     - **Doctors**: Quick-select buttons ("All Scheduling", "Primary Only") + individual email checkboxes
     - **Technicians**: Multi-select dropdown
     - **Users**: Multi-select dropdown
     - **Custom Emails**: Text input with validation + chips
   - Supports multiple emails per doctor
   - Displays total recipient count

4. **send-print-emails Endpoint** (`server/routes/schedules.js`)
   - Requires authentication
   - Accepts: startDate, endDate, view, labels, doctors, technicians, displayOptions, recipients, emailSubject, emailMessage
   - Returns 202 status with tracking ID immediately
   - Flattens all recipients into single array:
     - Doctors with selectedEmails array (multiple emails per doctor)
     - Technicians (single email each)
     - Users (single email each)
     - Custom email addresses
   - Generates PDF once using `generatePrintPreviewPDF()`
   - Loops through recipients sending emails asynchronously
   - Updates `global.emailStatus` map for progress tracking

5. **EmailStatusDialog.js** (`client/src/components/email/EmailStatusDialog.js`)
   - Opens automatically after sending starts
   - Polls `/api/schedules/email-status/:id` every 2 seconds
   - Displays progress summary and per-recipient status table
   - Shows successful/failed/processing status for each recipient

### Data Flow:
```
Email Button → EmailPrintDialog → RecipientSelector → Validate →
POST /send-print-emails → Generate PDF → Loop Recipients → Send Emails →
Update Status Map → Poll Status → EmailStatusDialog
```

## Styling System

### CSS Architecture:
All print-specific styles are in `client/src/index.css`:
- `.agenda-*` classes for agenda table styling
- `.calendar-*` classes for month/week grid styling
- `@media print` blocks for print-specific overrides
- `.print-*` classes for print-specific elements

### Key Agenda Styles:
```css
.agenda-date, .agenda-time {
  padding: 2px 8px;
  vertical-align: middle;
  font-size: 0.875rem;
  color: #4a5568;
}

.agenda-event {
  padding: 1px 4px;
  vertical-align: middle;
}

.agenda-event-content {
  display: flex;
  align-items: center;  /* Vertically centers content */
  line-height: 1.1;
}
```

### Print Media Query:
```css
@media print {
  .no-print { display: none !important; }

  /* Agenda print optimizations - fit more rows per page */
  .agenda-header {
    padding: 3px 6px;
    font-size: 0.75rem;
  }

  .agenda-date, .agenda-time {
    padding: 2px 6px;
    font-size: 0.75rem;
    line-height: 1.2;
    vertical-align: top;
  }

  /* ... additional print-specific styles */
}
```

## URL Parameters

### Print Preview URL Structure (User-Facing):
```
/print-preview?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&view=agenda&labels=...&doctors=...&technicians=...&opts=...
```

### Puppeteer URL Structure (PDF Generation):
```
/print?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&view=agenda&labels=...&doctors=...&technicians=...&opts=...
```

**Both routes accept the same parameters, but `/print-preview` requires authentication while `/print` is localhost-only.**

### Parameters:
- **startDate**: ISO date string (required)
- **endDate**: ISO date string (required)
- **view**: `month`, `week`, or `agenda` (default: month)
- **header**: Custom header text (optional, appears below "Mobile Mohs, Inc." on every page)
- **labels**: JSON array of label objects `[{value:"label1",label:"Label 1"}]`
- **doctors**: Comma-separated IDs `1,2,3` or JSON array of doctor objects
- **technicians**: Comma-separated IDs `1,2,3` or JSON array of technician objects
- **opts**: Compact display options object:
  - `d`: showDescription (boolean)
  - `l`: showLabel (boolean)
  - `t`: showTechnicians (boolean)
  - `on`: showOfficeNotes (boolean, default: false)
  - `dn`: doctorInfo.showName (boolean)
  - `da`: doctorInfo.showAddress (boolean)
  - `dp`: doctorInfo.showPhone (boolean)

### Example URLs:

**User-facing preview:**
```
/print-preview?startDate=2025-01-01&endDate=2025-01-31&view=agenda&doctors=1,2,3&opts=%7B%22d%22%3Atrue%2C%22l%22%3Atrue%2C%22t%22%3Atrue%2C%22dn%22%3Atrue%7D
```

**Puppeteer PDF generation:**
```
/print?startDate=2025-01-01&endDate=2025-01-31&view=agenda&doctors=1,2,3&opts=%7B%22d%22%3Atrue%2C%22l%22%3Atrue%2C%22t%22%3Atrue%2C%22dn%22%3Atrue%7D
```

## Security Considerations

### Route Access Control:
**`/print-preview` (User-Facing)**
- Requires authentication via authMiddleware
- Protected route - redirects to login if not authenticated
- Users can access with valid token

**`/print` (Puppeteer-Only)**
- No authentication required
- Used exclusively by Puppeteer headless browser on localhost
- Fetches data from `/api/schedules/events-print` which is localhost-restricted

### Localhost-Only Endpoints:
The `/api/schedules/events-print` endpoint is restricted to localhost:
```javascript
// Verify request is from localhost
const isLocalhost = req.ip === '127.0.0.1' ||
                    req.ip === '::1' ||
                    req.ip === '::ffff:127.0.0.1';

if (!isLocalhost) {
  return res.status(403).json({ error: 'Access denied' });
}
```

**Reasoning**: This endpoint bypasses authentication to allow Puppeteer to fetch data. Restricting to localhost prevents external access.

### Authenticated Endpoints:
The `/api/schedules/send-print-emails` endpoint requires authentication:
```javascript
router.post('/send-print-emails', authMiddleware, async (req, res) => {
  // ... implementation
});
```

## Debugging Tips

### PDF Shows Stale Content:
**Problem**: Changes to CSS or components don't appear in generated PDFs
**Solution**: Rebuild the client: `cd client && npm run build`
**Reason**: Puppeteer uses built production client, not dev mode

### PDF Shows "No Events":
**Check**:
1. Server logs for the constructed URL
2. Request to `/api/schedules/events-print` in server logs
3. Filter parameters in the URL
4. Database query results
5. Whether ServerPrint.js is fetching data correctly

### Email Not Sending:
**Check**:
1. Email configuration in `server/config/config.js`
2. SMTP settings (host, port, auth)
3. Server logs for email sending errors
4. `global.emailStatus` map for per-recipient status
5. Email format validation

### Styling Not Applying:
**Check**:
1. CSS specificity (more specific selectors win)
2. `@media print` overrides for print-specific styles
3. Whether styles are in `index.css` (imported globally)
4. Browser vs. Puppeteer rendering differences
5. Rebuild client if changes don't appear in PDF

## File Reference

### Server Files:
- `server/routes/schedules.js` - Email endpoints and events-print endpoint
- `server/routes/events.js` - Event CRUD operations
- `server/utils/generatePDF.js` - PDF generation with Puppeteer
- `server/utils/email.js` - Email sending functionality
- `server/config/config.js` - SMTP configuration

### Client Files:
- `client/src/components/PrintPreview.js` - Print preview page
- `client/src/components/PrintHandler.js` - Print controls and rendering
- `client/src/components/ServerPrint.js` - Puppeteer-specific component
- `client/src/components/CustomPrintCalendar.js` - Calendar routing
- `client/src/components/AgendaView.js` - Agenda table rendering
- `client/src/components/GridCalendarView.js` - Month/week grid rendering
- `client/src/components/email/EmailPrintDialog.js` - Email dialog
- `client/src/components/email/RecipientSelector.js` - Recipient selection
- `client/src/components/email/EmailStatusDialog.js` - Email progress tracking
- `client/src/components/email/EmailOptionsForm.js` - Email customization
- `client/src/index.css` - All print styles

## Common Workflows

### Adding New Display Option:
1. Add option to PrintDialog form
2. Update URL parameter parsing in PrintPreview.js
3. Pass option through filterParams to AgendaView/GridCalendarView
4. Use option in conditional rendering
5. Update display options in generatePrintPreviewPDF() if needed
6. Add to compact format (`opts`) for shorter URLs

### Modifying Agenda Layout:
1. Edit JSX structure in AgendaView.js
2. Update CSS in index.css (`.agenda-*` classes)
3. Test in browser print preview
4. Rebuild client: `cd client && npm run build`
5. Test PDF generation via email or direct PDF download

### Adding New Recipient Type:
1. Add section to RecipientSelector.js
2. Update selectedRecipients state structure in EmailPrintDialog.js
3. Add flattening logic in `/send-print-emails` endpoint
4. Update validation logic
5. Update EmailStatusDialog to display new type

## Performance Considerations

### PDF Generation:
- Generates PDF once and reuses buffer for all email recipients
- Puppeteer page is launched per PDF generation (not per email)
- Typical generation time: 2-5 seconds for agenda view

### Email Sending:
- Asynchronous processing with immediate 202 response
- Status tracking in memory (`global.emailStatus` map)
- Sequential email sending (not parallel) to avoid SMTP rate limits
- Client polls status every 2 seconds

### Print Preview:
- Events fetched once on page load
- URL parameters used for all filtering (no additional API calls)
- React memo and useMemo used to prevent unnecessary re-renders
