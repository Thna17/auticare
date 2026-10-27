# AutiCare — Missing Features Checklist

What the website still needs, compared with the "Whole Website workflow" document
(`Whole Website workflow.docx`). Work through it over several days; tick each box
(`- [x]`) when it is built, tested and merged.

_Last updated: 2026-10-27 (admin portal done on branch `feat/admin-portal`, except deferred items)_

---

## Decisions needed first

- [x] **Teacher invitations:** keep **username + setup code** (decided 2026-10-27). No email invitations.
- [ ] **Extra sponsored Pro accounts at $15/month:** add them now as a manual extra
      (like plans today), or wait until online payment exists?
- [ ] **Payment gateway:** **on hold** (decided 2026-10-27): payments are not being built yet.
      Needed later for payments, invoices, billing history and the $15 extras.
- [ ] **Free plan limits:** how many children, how many AI messages, which reports.
      Until decided, Free has no limits (`FREE_PLAN_CHILD_LIMIT` is empty).
- [ ] **Grace period and refunds:** what happens when a payment is late or refunded.
- [ ] **Sponsored families when a school stops paying:** today they fall back to Free
      and keep all their data.

---

## Suggested order

1. Parent core: behaviour tracking fields, questionnaire screen, report PDFs
2. School report approval (Draft → Submitted → Reviewed → Shared)
3. Find Support: organisation pages and one-way inquiries
4. Landing page: the 7 missing sections
5. Admin tools: user lists, audit logs, questionnaire and resource management
6. Payments (after the gateway decision)

---

## 1. Landing page

Built: header, hero, features, how it works, pricing, final call to action.

- [ ] Hero: 2 mobile phone images
- [ ] **Our Partners:** 3 partner school logos, names, optional links _(need logos)_
- [ ] **About AutiCare:** mission, vision, who AutiCare supports
- [ ] **Who We Support:** Parents & Families, Schools, Teachers
- [ ] **Why Choose AutiCare:** easy to use, personalized support, privacy, parent–school collaboration
- [ ] **Mobile App Preview:** 2 phone mockups with real screenshots _(need screenshots)_
- [ ] **FAQ:** AutiCare, AI, privacy, schools, subscriptions
- [ ] **Contact Us:** email, phone, Telegram, social media _(need real contact details)_
- [ ] **Footer:** quick links, contact, social icons, Terms, Privacy Policy
- [ ] Replace the placeholder support email (`support@auticare.local`) with a real one

## 2. Sign up & questionnaire

- [ ] Questionnaire shows **one question per full screen**, then goes to the dashboard
      (check the current onboarding flow against this)
- [ ] Questionnaire state per child (not started / in progress / completed) on the children page

## 3. Parent portal

### Dashboard

- [ ] Recent behaviour records
- [ ] Latest educational summary and progress highlights
- [ ] Recommended activities and recent notifications
- [ ] Quick actions: Add Behaviour Log, View Reports, Ask AI

### My Children

- [ ] Child detail page shows the AI educational summary with a clear
      "not a medical diagnosis" notice

### Behaviour Tracking

- [ ] New form fields: **possible trigger, duration, parent response, outcome**
- [ ] Categories from the workflow: **Communication, Sensory, Social, Emotional**
      (today: Crying, Sleep, Eating, Sensory, Social, Routine, Other)
- [ ] Daily / weekly / monthly history
- [ ] Calendar view
- [ ] Trends and charts
- [ ] Filter by category

### AI Parent Assistant

- [ ] Save helpful responses
- [ ] Feedback on AI responses (helpful / not helpful)
- [ ] Links to related resources
- [ ] Child-specific suggestions only when the parent opts in

### Resources & Activities

- [ ] Filter by category, age range and learning goal
- [ ] Articles, videos and downloadable guides
- [ ] Save favourites
- [ ] Suggestions based on the child's learning goals

### Find Support

- [ ] Map view
- [ ] Organisation detail page (overview, services, age groups, contact, location, partnership)
- [ ] **Send an inquiry** (one-way, no chat)
- [ ] Save favourite organisations
- [ ] Filter by location and service type

### Reports

- [ ] Filter by date
- [ ] **Download PDF**
- [ ] Behaviour tracking reports and progress trends
- [ ] Manage report-sharing permissions
- [ ] Clearly separate parent observations, AI suggestions and professional comments

### Notifications

- [ ] All / Unread filters
- [ ] Mark all as read
- [ ] Delete or archive
- [ ] Notification preferences
- [ ] Click opens the related page

### Settings & Privacy

- [ ] One place to approve, review and revoke school access per child

## 4. AutiCare Admin portal

### Overview

- [x] New registrations, pending school activations, active subscriptions
- [x] AI service status
- [ ] Failed payments _(waits for payments)_; pending support inquiries _(needs the parent inquiries from Gemini)_
- [x] Recent admin activity

### User Management

- [x] Parents & Families list: search, plan, number of children, suspend/reactivate
- [ ] Parents: data export and deletion requests _(deferred by the user, 2026-10-27)_
- [x] Schools list: Business status, teacher count, sponsored accounts, suspend
- [x] Teachers & Staff list across schools: search, activation status, disable
- [ ] Admin Team & Roles: invite admins, Super Admin / Staff Admin, permissions, **MFA** _(deferred by the user, 2026-10-27)_

### AI & Educational Content

- [x] Questionnaire Management: create, edit, archive, question types, age ranges,
      drafts, published versions (old reports keep their version)
- [x] AI Configuration & Monitoring: errors, prompt versions, usage and cost,
      flagged responses, safety rules
- [x] Resources & Activities editor: upload images, videos, PDFs; drafts; featured;
      professional review status
- [ ] Support Services Directory: review submitted listings, verify, feature, hide _(deferred; schools can be verified on Schools & Organizations)_

### Subscriptions & Revenue

- [x] Subscription Plans: record Pro / Business by hand, change status
- [ ] Edit plan configuration and limits from the admin page
- [ ] Payments & Transactions _(needs gateway)_
- [x] Sponsored Pro Accounts overview across all schools
- [ ] $15/month extra sponsored accounts _(waits for payments)_

### Operations & Growth

- [x] Partnerships tracker (Prospect → Contacted → In Discussion → Active → Ended)
- [ ] Inquiries & Support inbox: assign, notes, resolve
- [x] Analytics: registrations, school growth, Free→Pro conversion, revenue, churn,
      questionnaire completion, AI usage
- [x] Announcements: audience, schedule, banner in the app
- [ ] Promotions and subscription offers _(waits for payments)_

### System

- [x] Audit Logs page (events are already recorded; no screen yet)
- [ ] Platform Settings: branding, languages, email, MFA policy, data retention _(deferred by the user, 2026-10-27)_
- [x] Help & Documentation for admins

## 5. School Admin portal

### Overview

- [ ] Pending parent inquiries, sponsored account usage, recent activity
- [ ] Quick actions: Add Teacher, View Students, View Reports

### Students

- [ ] Access status: Active / Pending Consent / Revoked
- [ ] Learning goals on the student detail page
- [ ] Parent-shared information and parent comments

### Progress Reports

- [ ] Status workflow: **Draft → Submitted → Reviewed → Shared**
- [ ] School admin approves before a report reaches the parent
- [ ] Return a report to the teacher for revision
- [ ] Download PDF

### Teachers & Staff

- [ ] Reassign students when a teacher leaves
- [ ] Staff permissions

### Sponsored Pro Accounts

- [x] Offer up to 5 sponsored Pro accounts by email; withdraw
- [ ] Buy extra accounts at $15/month _(see decision above)_
- [ ] Renewal and expiration dates

### School Profile

- [ ] Photos, opening hours, map location, supported age groups
- [ ] Public listing preview; submit changes for review

### Settings

- [ ] Parent Collaboration: list of connected parents, access requests, revoked access
- [ ] **Parent inquiries (read-only)**
- [ ] Subscription & Billing: payment method, invoices, cancel/change plan _(needs gateway)_

### Help & Support

- [ ] FAQ and school portal guide
- [ ] Submit and track support requests

## 6. Teacher portal

- [ ] Overview: pending reports, recent student updates
- [ ] My Students: learning goals, parent-shared information
- [ ] Report form fields: reporting period, communication, social interaction,
      learning activities, daily routine, progress notes, challenges, next goals
- [ ] Report statuses: draft, submitted, returned for revision, approved
- [ ] Resources & Activities (currently "Soon")
- [ ] Notifications: new student assigned, report approved / returned
- [ ] My Profile (currently "Soon")

---

## Known issues

- [ ] 4 integration tests fail (booking and admission race tests, and the admin
      appointment list); they fail on their own too, so they predate this work
- [ ] 2 hospital registration tests fail only when all test files run together
- [ ] Landing page styles are slightly over the size budget (build warning)

---

## Already done (for reference)

- Sidebars for parent, admin, school admin and teacher
- School and hospital account requests with admin approval
- Hospital team: admin, coordinator, doctor roles
- Teachers with username + setup code; family connection codes with consent
- Subscriptions phase 1: Free / Pro / Business, 2-child Pro limit, admin records plans,
  5 sponsored Pro accounts, parent and school subscription pages, landing prices
- Dashboard asks for each child's questionnaire before showing their analysis
