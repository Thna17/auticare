# AutiCare — Project Planner

**Current Product → Updated Product**

> **Status:** This is a planning document. The "today" sections describe what is already built and working. The "planned update" sections describe what we intend to build; none of it is implemented yet.
>
> **Who this is for:** an external reviewer. No access to the codebase is needed — everything you need to judge the product is described below.

---

## 1. What feedback we are looking for

We want an honest outside opinion on the product direction, not on code. Specifically:

1. Does the new flow (login → assessment → five-section app) make sense for a worried parent, or does it add friction at the worst moment?
2. Is the concern-band framing the right call, or does it under-deliver on what parents actually want?
3. Are the three AI features the right three? Is anything missing, or is anything there that would not be used?
4. Where is the product likely to lose trust, and where is it likely to overwhelm?
5. Is the scope realistic for a small team, or should more be cut?

A full list of open questions is at the end of this document.

---

## 2. The product in one page

**AutiCare is a family-support platform for parents of children who may be showing signs of autism, and for the schools and hospitals that support those families.**

It helps a parent:

- keep a record of their child,
- run an early developmental screening,
- get play-based activity suggestions suited to the child's age,
- find and book appointments with hospitals and specialists,
- see reports that schools write about their child,
- and keep track of how things are going over time.

It helps schools record observations and write activity reports for enrolled children, hospitals manage their appointments and doctors, and administrators manage the school and hospital directories.

The platform is bilingual — **Khmer and English**, defaulting to Khmer — because it is built for families in Cambodia who often have no accessible local guidance between "something feels different about my child" and "a specialist has seen my child."

**The gap it is trying to close:** that stretch of time. Parents wait months for an assessment, often with no idea what to do meanwhile, no one to ask, and no way to tell whether what they are seeing is normal. AutiCare is not trying to replace the specialist. It is trying to make the waiting period less empty.

**Medical position (important and deliberate):** AutiCare screening is informational support only. It is not a medical diagnosis and does not replace a qualified clinician.

---

## 3. Who uses the app today

| Who                | What they are                          | What they come to the app for                                    |
| ------------------ | -------------------------------------- | ---------------------------------------------------------------- |
| **Parent**         | Mother, father, or guardian of a child | Understanding their child, finding help, booking care            |
| **School staff**   | Teacher or school administrator        | Recording observations and writing reports for enrolled children |
| **Hospital staff** | Hospital administrator or clinician    | Managing appointments and doctor listings                        |
| **Administrator**  | Platform operator                      | Creating and overseeing school and hospital accounts             |

Parents can register themselves. School, hospital and administrator accounts are created by invitation only — never through public sign-up.

---

## 4. What the app can do today

### For parents

| Capability                                                                 | What the parent gets                                                                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Create an account, log in, reset password                                  | A private, secure space for their family                                                                                     |
| Add a child profile (name, date of birth, photo, notes)                    | A record that the whole app is organised around; supports several children                                                   |
| Answer a developmental screening questionnaire                             | A risk level (low / moderate / high) with a breakdown by area — social interaction, play, flexibility and routine, and so on |
| Revisit past screenings                                                    | A history, so they can see change over time rather than a single snapshot                                                    |
| Browse an activity catalogue filtered to their child's age                 | Play ideas that suit the child, not a generic list                                                                           |
| Start an activity, mark it done, leave a note                              | A simple record of what they tried and how it went                                                                           |
| Open a progress page                                                       | A visual view of how the child is doing across areas                                                                         |
| Browse a hospital directory and search specialists                         | Somewhere to go next, with real options rather than a vague recommendation                                                   |
| Book an appointment                                                        | A confirmed slot with a hospital and specialist                                                                              |
| Browse schools, save favourites, read and leave reviews, request admission | Practical decisions about schooling without chasing information                                                              |
| Read school reports written about their child                              | Visibility into what school staff observe                                                                                    |
| Receive in-app notifications                                               | Knowing when something needs attention                                                                                       |
| Switch between Khmer and English at any time                               | Using the app in the language they think in                                                                                  |
| Open a crisis-support page                                                 | Emergency guidance when they need it now                                                                                     |

### For school staff

| Capability                                                                          | What they get                                                                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Manage enrolled students                                                            | A clear roster of the children they are responsible for                                              |
| Write activity reports (summary, teacher observation, recommendations, attachments) | A structured way to record and share what they see, without typing everything from scratch each time |
| Maintain the school profile                                                         | A public-facing page families can find                                                               |

### For hospital staff

| Capability                   | What they get                             |
| ---------------------------- | ----------------------------------------- |
| See and manage appointments  | A working day view instead of phone calls |
| Maintain the doctor listings | Parents find the right specialist         |

### For administrators

| Capability                                     | What they get                                            |
| ---------------------------------------------- | -------------------------------------------------------- |
| Review child profiles at a high level          | Awareness of platform activity                           |
| Create and manage school and hospital accounts | Keeping the directory trustworthy                        |
| Review school reports                          | Oversight of what is being issued in the platform's name |

---

## 5. How the app flows today

### Parent — first visit

1. Lands on a public page that explains what AutiCare is.
2. Reads the medical notice: this is screening support, not a diagnosis.
3. Reads about privacy, terms, and crisis resources — all available without an account.
4. Registers with an email and password.

### Parent — first use

1. Logs in.
2. Arrives at a dashboard.
3. Is prompted to add a child, because almost nothing in the app works until a child exists.
4. Fills in the child's name, date of birth, and optionally a photo and notes.
5. Returns to the dashboard, which now shows that child's context.

### Parent — getting a screening

1. Opens **Screening**.
2. Chooses the child.
3. Answers **46 questions** across the child's age band (under 4, or 4 and older).
4. Submits.
5. Sees a result page: a risk band, a per-area breakdown, and a short observation about each area.
6. Is shown next steps that change depending on the result — for a higher result, booking an appointment is offered first; for a lower result, activities are offered first.
7. Can return to the result later, or compare against past screenings.

### Parent — acting on the result

1. Opens **Activities**, filtered to the child's age.
2. Starts one, does it with the child, marks it complete, and optionally writes what happened.
3. Checks **Progress** to see the accumulated picture.

### Parent — finding professional help

1. Opens **Hospitals**, browses or searches.
2. Opens **Appointments**, picks a hospital.
3. Picks a specialist, picks a time, confirms.

### School staff

1. Logs in and lands on their student roster.
2. Adds a student if needed.
3. Writes a report: summary, observation, recommendations, plus attachments.
4. The parent sees that report in their own app.

### Hospital staff

1. Logs in to a hospital dashboard.
2. Works through the appointment list.
3. Maintains the doctors listed for the hospital.

### Administrator

1. Logs in to a management dashboard.
2. Creates school and hospital accounts.
3. Reviews reports and profiles.

---

## 6. What we are changing, and why

The app today is good at **measuring** and **referring**. It is weak at the part in between — and that part is where families actually spend their time.

Three specific problems:

**Problem 1 — The screening is too heavy for a first impression.**
46 questions is a real commitment. A parent who is anxious, unsure, and possibly using the app for the first time may not finish it. And the questions are written for a parent who already suspects something. Many parents arrive with only a vague feeling and no vocabulary for it.

**Problem 2 — The result ends in a generic sentence.**
The screening produces a detailed per-area breakdown, and then shows the same guidance to everybody. The data is rich; the advice is not personal.

**Problem 3 — There is nowhere to put the day-to-day.**
Between appointments, a parent notices things: this week he slept badly, she covered her ears at the market, he stopped saying a word he used to say. Today there is no place for that. And because there is no place for it, the parent arrives at the appointment with nothing but memory — and the app cannot help with pattern recognition it has no data for.

**The update addresses all three:** a shorter first assessment, a result that says something useful, a way to record what happens day to day, and an assistant the parent can actually ask.

---

## 7. The new flow after login

```
Login successful
      │
      ▼
Does this parent have a child profile?
      │
      ├── No ──▶ Add child (name, date of birth)
      │              │
      ▼              ▼
Short assessment — a small set of threshold questions
      │
      ▼
Result: a concern band  +  what it means  +  what to do next
      │
      ▼
The app opens
```

**Design intent.** The assessment is a doorway, not a wall. It should take a couple of minutes, be answerable by a parent with no vocabulary for developmental delay, and produce something a parent can hold onto.

**What we are deliberately not doing here.** We are not telling a parent "your child is autistic, level 2." A questionnaire cannot establish that, and presenting a guess as a verdict can cause real harm in both directions — false reassurance that delays help, or alarm that a parent carries for months. What the parent gets instead:

- a **concern band** — low, moderate, or elevated,
- a plain-language explanation of what that band means,
- a clear statement that this is a screening indicator and not a diagnosis,
- and a suggested next step that scales with the band.

This is a decision we would like challenged (see open questions).

---

## 8. The new app structure

After the assessment, the app has five top-level areas instead of the current longer menu:

```
1. Dashboard     — analysis
2. AI            — the parent's assistant
3. Documents     — school · hospital · activities · book
4. Profile
5. Settings
```

### 1. Dashboard — analysis

The home screen, and the reason a parent comes back. It should answer "how is my child doing, and what should I notice?" without the parent having to dig.

- The child's current concern band and what has changed since last time
- The per-area breakdown from the most recent assessment
- Recent observations the parent recorded, and any pattern worth noticing
- What is coming up — appointments, school reports, follow-ups
- One suggested next action, not a menu of ten

### 2. AI — the parent's assistant

A conversation screen. The parent can type or speak a question in Khmer or English and get a useful, grounded answer. Described fully in section 9.

### 3. Documents — school · hospital · activities · book

Everything the family has accumulated, in four shelves:

| Shelf          | What lives there                                                                   |
| -------------- | ---------------------------------------------------------------------------------- |
| **School**     | Schools browsed and saved, admission requests, and reports written about the child |
| **Hospital**   | Hospitals and specialists, and the family's appointment history                    |
| **Activities** | The activity catalogue, what has been tried, and what the child responded to       |
| **Book**       | Booking a new appointment: choose hospital → choose specialist → choose time       |

### 4. Profile

Who the family is: the child's profile and details, plus the parent's own account information. The place to correct a date of birth or update a photo.

### 5. Settings

Language, notifications, privacy, and account security.

**What this restructure is really about:** the current app is organised by _feature_ — screening, activities, hospitals, schools. The new app is organised by _intent_ — what am I looking at, who can I ask, what do I have, who am I. Parents do not think in feature names.

---

## 9. The three new features

### Feature 1 — AI Parent Assistant

**What the parent does.** Opens the AI tab and asks anything:

- "My son is 3 and doesn't point at things. Is that normal?"
- "She screams when we leave the house. What can I do?"
- "How do I explain autism to my mother?"
- "What should I tell the doctor at our appointment?"

**What they get.** An answer in their own language, in plain words, with a follow-up question when the situation is unclear — the way a knowledgeable, patient person would respond. It never delivers a verdict, never diagnoses, and always points back to a clinician for anything medical.

**Why it matters.** This is the feature that fills the empty stretch. It is also the one that has to be most careful, because it is the one a parent will trust most.

**What it will never do.** Diagnose, name medication or dosage, predict a prognosis, or answer as though it were a doctor.

---

### Feature 2 — Child Behavior Tracking & AI Insights

**What the parent does.** Records what happened, in seconds:

- Crying, sleeping, eating, or sensory difficulties
- How intense it was
- When it happened
- An optional short note in their own words

**What they get.** Over days and weeks, a picture forms. Instead of a list of entries, the parent sees patterns:

- "Sleep difficulties have appeared on 6 of the last 10 nights, mostly on school days."
- "Sensory reactions cluster around noisy environments."
- "Eating concerns have reduced since the routine changes two weeks ago."

**Why it matters.** Two reasons. A parent who feels they are drowning in isolated bad days can see a shape instead. And a clinician gets evidence instead of a stressed recollection — the difference between "he's been difficult lately" and three weeks of dated observations.

**What it will never do.** Turn an observation into a diagnosis, or imply that a pattern is a cause.

---

### Feature 3 — Personalized Autism Guidance

**What the parent does.** Asks for help with a specific situation — bedtime, transitions, a meltdown at the market, getting through a haircut — or simply browses suggested guidance.

**What they get.** Practical strategies, routines, and activities grounded in **trusted published autism resources**, chosen for this child's age, concern areas, and recorded history. Every suggestion shows where it came from, so a parent can read the original.

**Why it matters.** Generic autism advice exists online in abundance, much of it contradictory and some of it harmful. The value here is not that an AI can write advice — it is that the advice is **anchored to sources a professional would recognise**, and shaped to one specific child.

**What it will never do.** Invent guidance. If there is no trusted source that answers the question, the honest answer is "I do not have a reliable source for that," and the parent is pointed to a clinician — not a confident guess.

---

## 10. The parent story after the update

The clearest way to judge this plan is to follow one family.

**Week 1.** Sokha has a three-year-old who does not speak yet. She has been told by relatives that boys talk late. She is not sure. She installs AutiCare, reads the notice that this is not a diagnosis, and answers ten questions about her son. It takes three minutes.

**The result.** His concern band is _moderate_, with the lowest area being communication and social interaction. The app tells her plainly what that means, tells her it is not a diagnosis, and suggests two things: try a few activities at home, and book an appointment so a professional can look properly.

**Week 1, evening.** She opens the AI tab and asks, in Khmer, whether it is normal for a three-year-old not to point. She gets a straight answer, a follow-up question about what he does instead, and a suggestion she can act on tonight.

**Weeks 2–5.** She records what she notices — the nights he sleeps badly, the times he covers his ears at the market. She tries two activities from the catalogue and marks them done. She books the appointment the app suggested.

**Week 5.** The dashboard tells her something she had not consciously noticed: the hard nights cluster after days with a lot of noise. She did not know that. It is not a diagnosis and the app does not pretend it is. It is a detail she would never have assembled from memory.

**The appointment.** She opens the app at the hospital and can show three weeks of dated observations and one clear pattern, instead of trying to remember.

**That is the product.** Not a diagnosis machine — a way of not losing the weeks between noticing and being seen.

---

## 11. Safety and trust rules

These are not fine print; they shape the design.

1. **No diagnoses anywhere.** Not in screening results, not in AI answers, not in insights.
2. **No medication advice.** Ever, in any form.
3. **Every screening result carries the same notice** — informational, not diagnostic.
4. **Every AI answer that touches health ends with a clinician referral.**
5. **Crisis language is handled before anything else.** If a parent expresses something that sounds like immediate danger, the app surfaces emergency contacts instead of continuing the conversation normally.
6. **Guidance is sourced.** If a suggestion cannot be traced to a trusted resource, it is not given.
7. **Data minimisation.** The AI is given the child's age, concern band and observation summaries — not the child's name, date of birth or address.
8. **The parent stays in control.** Observations and conversations can be deleted, and deleting a child profile removes everything attached to it.

---

## 12. What stays the same

Worth stating clearly, because a flow change can look like a rewrite:

- The existing full screening remains available. The short assessment is an entry point, not a replacement.
- The existing scoring and risk bands are unchanged. The short assessment reuses the same method, so results stay comparable with past screenings.
- Schools, hospitals, appointments, activities, school reports and notifications all keep working exactly as they do now — they are regrouped under new headings, not rebuilt.
- School, hospital and administrator experiences keep their current structure.
- Khmer stays the default language.

---

## 13. Decisions already taken

| Decision                      | Choice                                                    | Reasoning                                                                              |
| ----------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Assessment result wording     | Concern band, not an autism level                         | A questionnaire cannot establish autism; a verdict can cause harm either way           |
| AI provider                   | Kept open, provider-agnostic                              | Avoids locking the product to one vendor's pricing or availability                     |
| Build order                   | Flow first → tracking → assistant → sourced guidance last | Each step is useful on its own; the guidance feature depends on a reviewed content set |
| Language                      | Native Khmer generation, not translation                  | Translated phrasing reads as machine output to a Khmer speaker                         |
| Search over trusted resources | Small, curated, verified set                              | Quality and traceability matter more than volume here                                  |

---

## 14. Open questions

We would like an outside view on these, in order of how much they matter:

1. **Framing.** Is "concern band" honest and useful, or is it so hedged that parents feel the app is refusing to tell them anything? How do you get honesty without a verdict?
2. **Friction.** Putting an assessment immediately after login — does that serve the anxious parent, or chase away the merely curious? Should the assessment be skippable, and what does the app look like for someone who skips it?
3. **The three features.** Are these the right three for this audience? Is behavior tracking something a stressed parent will actually keep up, or does it become guilt-inducing homework?
4. **Trust.** Which feature is most likely to damage trust if it gets something wrong — and what one safeguard matters most?
5. **Retention.** What brings a parent back on a normal Tuesday when nothing is wrong? The dashboard analysis is our answer; is it enough?
6. **Khmer.** Any advice on making AI-generated Khmer feel natural rather than translated?
7. **Sourcing.** For the guidance feature we need a reviewed body of trusted autism resources. Where would you start, and what would you refuse to include?
8. **Scope.** If the team could only ship one of the three AI features this quarter, which one, and why?
9. **Risk.** What are we not seeing? What would make you advise against this direction entirely?

---

## 15. For the reviewer — suggested prompts

If it is useful, these can be answered in order:

- "Review this product plan and tell me the three weakest points."
- "Follow the parent story in section 10 and identify where this family would drop out."
- "Challenge the concern-band decision. Argue the other side."
- "Which of the three AI features would you cut first, and what would you build instead?"
- "What is the smallest version of this plan that still helps a parent in week one?"
