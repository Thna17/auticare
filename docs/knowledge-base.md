# Reviewed guidance corpus

The assistant and the guidance browser only ever cite material from this corpus.
Nothing is generated into it. A passage exists because a person put it there,
with a publisher, a licence and a review date.

This is a product rule, not a filing convention: **if it is not in here, the app
says it does not know.** That sentence is the whole reason the feature can be
trusted, and the import script enforces half of it technically (an unreviewed
document is imported but invisible).

## What belongs in it

Include material that:

- comes from a named, reputable publisher (a health body, a professional
  association, an established NGO);
- has a licence that permits this use, recorded verbatim;
- is written for caregivers, not clinicians;
- describes **what a caregiver can do** — routines, communication strategies,
  preparing for appointments, sensory accommodations.

Do not include:

- anything that diagnoses, grades severity, or predicts outcomes;
- medication names, doses, or supplement protocols;
- unattributed content, forum posts, or AI-generated summaries of other pages;
- material you cannot link to.

## Adding a source

1. Put a `.json` file in `apps/api/prisma/knowledge/`.
2. Run the import:

   ```bash
   pnpm --filter @auticare/api db:knowledge
   ```

3. Spot-check retrieval for two or three real questions before relying on it.

### File format

```json
{
  "title": "Caregiver skills training — everyday routines",
  "publisher": "Example Health Organisation",
  "sourceUrl": "https://example.org/caregiver-routines",
  "licence": "CC BY-NC-SA 4.0",
  "language": "en",
  "version": "2024-06",
  "reviewedAt": "2026-10-20",
  "chunks": [
    {
      "heading": "Bedtime",
      "content": "A predictable sequence — bath, teeth, book, lights out — helps a child know what comes next. Keep the order the same and the words short."
    }
  ]
}
```

| Field        | Required | Notes                                                              |
| ------------ | -------- | ------------------------------------------------------------------ |
| `title`      | yes      | Shown to the parent as the source title.                           |
| `publisher`  | yes      | Shown next to every citation.                                      |
| `sourceUrl`  | yes      | Unique. Re-importing the same URL updates in place.                |
| `licence`    | yes      | Recorded for audit. Use the exact licence string.                  |
| `version`    | yes      | The edition or date of the source you copied from.                 |
| `language`   | no       | `en` (default) or `km`. Retrieval only returns the UI language.    |
| `reviewedAt` | **no**   | **Without it the document cannot be cited.** Omit while in review. |
| `chunks`     | yes      | One idea per chunk, 2–6 sentences. Shorter chunks retrieve better. |

### Chunks

Chunk by **situation**, not by page structure: "Bedtime", "Leaving the house",
"Haircuts", "What to say at an appointment". A parent's question is a situation,
and retrieval is lexical, so the heading carries real weight.

`keywords` are derived from the chunk text at import time. You do not write them.

## How retrieval decides

- Latin-script questions are scored on keyword, heading and body matches.
- Khmer questions are scored on character-trigram overlap, because Khmer is
  written without spaces.
- There is a minimum relevance. Below it, the result is empty — by design.

The retrieval code and its tests are in
`apps/api/src/modules/guidance/retrieval.ts` and `retrieval.test.ts`.

## Reviewing an existing document

`reviewedAt` is the audit trail. If a source is updated upstream, bump `version`,
update the chunks, and set a new `reviewedAt` — a document never silently becomes
current again.
