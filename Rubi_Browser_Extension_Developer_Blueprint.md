Product Requirements Document: Rubi Browser Extension

1. Product Summary

The Rubi Browser Extension provides real-time, contextual, in-the-flow-of-work intelligence by analyzing visible screen content in Salesforce, email, calendars, and LinkedIn. It activates Rubi’s intelligence engine to deliver personalized recommendations, actions, and simulations.

⸻

2. Goals & Non-Goals

2.1 Goals
	•	Read screen content from supported tools (Salesforce, calendar pages, email).
	•	Provide personalized Rubi intelligence without CRM integrations.
	•	Reduce user effort by guiding them when missing information.
	•	Offer meeting prep, opportunity reviews, and strategic insights.
	•	Deep link to Rubi for full workflows or simulations.

2.2 Non-Goals
	•	Direct CRM data integration (API-based)
	•	Outlook Desktop integration
	•	Background monitoring of user activity
	•	Full-screen overlays
	•	Storing customer data locally

⸻

3. Users & Use Cases

Users
	•	Sales reps
	•	Account managers
	•	Partners and distributors
	•	Customer-facing teams

Primary Use Cases
	1.	Opportunity Review Enhancer
	2.	Real-Time Meeting Prep
	3.	Email Coach (web-based)
	4.	LinkedIn Prospect Research
	5.	Tailored practice simulations
	6.	Strategic Account Assessment

⸻

4. Functional Requirements

4.1 Extension Activation
	•	Floating bubble should always be available.
	•	Right-side drawer opens when user clicks extension icon.
	•	Auto-detection triggers a subtle prompt on supported pages.

4.2 Context Extraction

Content scripts must:
	•	Identify page type (Opportunity, Account, Contact, Compose Window, LinkedIn Profile).
	•	Extract visible text and structured fields.
	•	Verify if required fields are present. If not:
→ prompt user to navigate or answer questions.

4.3 Intelligence Panel

Drawer must display:
	•	Summary insights
	•	Key actions
	•	Patterns or diagnostic results
	•	Suggested next steps
	•	Sales messaging options
	•	Simulation launch link (deep link)

4.4 Deep Links
	•	Must carry context data to Rubi
	•	Must authenticate via Rubi session
	•	Must open the correct tool (simulation, account review, knowledge base)

4.5 Controls
	•	Toggle activation (on/off)
	•	Refresh page context
	•	Manual “Analyze This Page” button

⸻

5. Non-Functional Requirements

Performance
	•	Drawer loads within 300–800ms after activation.
	•	Context extraction < 200ms.

Security
	•	Only activeTab permission
	•	No data stored locally
	•	No CRM tokens required
	•	Compliant with Rubi privacy model

Reliability
	•	Graceful fallback when fields cannot be read
	•	Clear prompts for user assistance

⸻

6. Technical Architecture

Components
	1.	Manifest V3 Extension
	2.	Background Service Worker
	3.	Content Scripts
	4.	Drawer UI (HTML/JS/React optional)
	5.	Floating Bubble
	6.	Deep Link Router

Data Flow
	1.	User opens Salesforce → content script detects page.
	2.	Script extracts visible info.
	3.	Worker constructs payload → sends to Rubi API.
	4.	Rubi returns insights.
	5.	Drawer displays structured intelligence.
	6.	User optionally performs deep-linked actions.

⸻

7. Dependencies
	•	Rubi backend API (CI engine + simulation endpoints)
	•	Salesforce Lightning DOM (no API interactions)
	•	Browser (Chrome/Edge)
	•	Secure Rubi session authentication
