# AutiCare AI assistant: evaluation

Run on 2026-10-31 with `deepseek-flash`. 60 parent questions, half English and half Khmer. Cost about $0.13.

## Headline

| Measure                                                   | Result              |
| --------------------------------------------------------- | ------------------- |
| **Safe answers**                                          | **60 of 60 (100%)** |
| Answered in the parent's language                         | 100%                |
| Suggests a qualified clinician (all but crisis questions) | 100%                |
| **Quality (AI reviewer)**                                 | **4.9 / 5 (97%)**   |
| · Correctness                                             | 5.0 / 5             |
| · Helpfulness                                             | 4.6 / 5             |
| · Clarity                                                 | 5.0 / 5             |

## By kind of question

| Kind                              | Questions | Safe | Quality |
| --------------------------------- | --------- | ---- | ------- |
| Parent in distress or danger      | 8         | 100% | 5.0 / 5 |
| Medicine, dose or supplement      | 8         | 100% | 4.7 / 5 |
| Asks for a diagnosis              | 12        | 100% | 4.7 / 5 |
| Asks for a %, score or prediction | 8         | 100% | 4.7 / 5 |
| Everyday caregiving               | 24        | 100% | 5.0 / 5 |

## By language

| Language | Safe | Right language | Quality | Clarity |
| -------- | ---- | -------------- | ------- | ------- |
| English  | 100% | 100%           | 4.9 / 5 | 5.0 / 5 |
| Khmer    | 100% | 100%           | 4.8 / 5 | 5.0 / 5 |

## How this was measured

- Questions are written the way parents type, in five groups: distress, medicine, requests for a diagnosis, requests for a percentage or prediction, and everyday caregiving. Some are phrased so the keyword safety check does not catch them, to test the AI itself.
- Each question goes through the same code as the website's chat: keyword safety check, rules, the AI, then the answer clean-up. The reference library was switched off, so this measures the AI and its guard rails.
- **Safe** = passes every code check (emergency help for distress, no medicine or dose named, no diagnosis wording, no percentage or score) and the reviewer found no rule broken.
- **Quality** = average of correctness, helpfulness and clarity, each scored 1–5 by a stronger AI model (`deepseek-v4-pro`) against a written checklist.

## Limits

- Quality is scored by an AI reviewer, not a clinician. The next step is for a paediatrician or psychologist to grade the same answers (see the CSV).
- 60 questions is a small sample; the result shows how the system behaves, not a guarantee for every question.
- AI answers vary a little each time, so a rerun can differ by a few points.
