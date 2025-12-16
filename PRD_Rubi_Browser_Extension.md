# Rubi Browser Extension — Product Requirements Document (PRD)

## 1. Product Summary
The Rubi Browser Extension delivers real-time, contextual, in-the-flow-of-work intelligence by analyzing visible screen content in Salesforce, Gmail/Outlook Web, calendars, and LinkedIn. It activates Rubi’s intelligence engine to provide personalized guidance, message coaching, simulations, and recommended next steps. When deeper workflows are needed, the extension opens Rubi through deep links.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Provide contextual, page-aware intelligence without CRM integrations.
- Enable Opportunity Review and Meeting Prep as Phase 1 must-have features.
- Read visible screen text and guide the user when required fields are missing.
- Provide message coaching (emails, outreach messages, or pasted text).
- Deep link to Rubi to launch simulations, full briefs, knowledge base content, etc.

### 2.2 Non-Goals
- Direct CRM API integrations (Salesforce, HubSpot, etc.).
- Outlook Desktop integration.
- Full-page overlays inside the extension.
- Background monitoring of user activity or browsing.
- Local storage of customer data.

---

## 3. Users & Use Cases

### 3.1 Primary Users
- Sales reps
- Account managers
- Partner teams and distributors
- Customer-facing teams

### 3.2 Core Use Cases
1. **Opportunity Review Enhancer**
2. **Real-Time Meeting Prep**
3. **Message & Email Coaching Panel**
4. **LinkedIn Prospect Research**
5. **Practice Sales Interactions (Simulation)**
6. **Strategic Account Assessment**

---

## 4. Functional Requirements

### 4.1 Extension Activation
- Floating bubble available on all supported pages.
- Right-side drawer opens when:
  - User clicks the extension icon, or
  - Supported context is auto-detected.
- Drawer provides all insights and options.

### 4.2 Context Extraction
Content scripts must:
- Detect platform and page type (Opportunity, Account, Contact, Email Compose, LinkedIn Profile, Calendar Event).
- Extract visible text and structured fields from the DOM.
- Identify missing data; prompt the user:
  - “Navigate to the Opportunity Details tab.”
  - or “Provide the stage/amount/customer profile.”

### 4.3 Intelligence Panel (Drawer UI)
The drawer must be able to render:
- Extracted summary fields
- Patterns, diagnostics, and recommended actions
- Sales messaging suggestions
- Meeting preparation insights
- Message coaching (paste or detected draft)
- Deep links for:
  - Full account review
  - Simulation practice
  - Knowledge base lookup
  - Deeper message refinement

### 4.4 Message & Email Coaching
If source type is clear (email or message):
- Auto-read draft and coach on clarity, tone, structure, and personalization.

If source type **not** clear:
- Prompt user to paste message text.
- Ask user to select message type (email, internal update, follow-up, outreach).
- Provide coaching, templates, rewrites, and personalization.

### 4.5 Controls
- On/off toggle (always visible).
- Refresh context button.
- Manual “Analyze This Page” action.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Drawer UI loads in < 800ms.
- Context extraction < 200ms.
- Rubi API calls respond within standard backend SLA.

### 5.2 Security
- Only minimal browser permissions used (`activeTab`, `scripting`, `storage`).
- No CRM authentication or CRM tokens stored.
- No background monitoring.
- No local storage of customer data.
- Uses Rubi session for authentication.

### 5.3 Reliability
- Must fail gracefully when DOM cannot be parsed.
- Clear fallback instructions provided to the user.

---

## 6. Technical Architecture

### 6.1 Components
- **Manifest V3 Extension**
- **Background Worker**
- **Content Scripts**
- **Drawer UI**
- **Floating Bubble**
- **Deep Link Handler**

### 6.2 Data Flow
1. User opens Salesforce page or email compose window.
2. Content script detects and extracts visible context.
3. Background worker calls Rubi API with extracted data.
4. Drawer UI displays insights and next steps.
5. User optionally deep-links into Rubi to complete deeper workflows.

### 6.3 Authentication
- Leverage Rubi’s existing browser session.
- If session missing/expired → open Rubi login in a new tab.

### 6.4 Supported Platforms
- Salesforce (Opportunity, Account, Contact)
- Gmail / Outlook Web (Message Coaching)
- Google Calendar / Outlook Calendar (Meeting Prep)
- LinkedIn (Prospect Research)

---

## 7. Dependencies
- Rubi Backend CI engine
- Rubi Simulation engine
- Salesforce DOM (Lightning)
- Browser support (Chrome/Edge)

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Salesforce DOM changes | Use robust selectors; fallback user prompts |
| Insufficient visible data | User guided to navigate or provide answers |
| Over-permission concerns | Keep permissions minimal |
| Auto-detection performance impact | Allow manual activation at all times |

---

## 9. Rollout Plan

### Phase 1 (6–8 weeks)
- Opportunity Review Enhancer
- Real-Time Meeting Prep
- Authentication via Rubi session
- Drawer UI + Bubble
- Deep links enabled

### Phase 2 (8–12 weeks)
- Message Coaching
- LinkedIn Research
- Practice Simulations
- Strategic Account Assessment

### Phase 3 (Post-launch)
- Additional CRM page types
- Expanded customization
- Analytics dashboards (via Rubi)

---

# End of PRD
