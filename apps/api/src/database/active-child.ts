/**
 * Soft-delete filters for Child.
 *
 * A parent can archive a child, which sets `Child.archivedAt`. The row stays,
 * because reports and appointments reference it and deleting history would be
 * worse than keeping it. Archiving is therefore only meaningful if every
 * *current-roster* read excludes archived children.
 *
 * It did not. `archivedAt` was filtered in two of seventeen child reads, so a
 * child the parent had archived still appeared in the school's student picker,
 * student list and dashboard counts. These constants exist so the rule has one
 * definition rather than seventeen opportunities to forget it.
 *
 * Most school-side reads reach Child *through* SchoolChildEnrollment, so the
 * filter usually has to go on the enrollment query — a filter applied to Child
 * alone would not touch a nested `include: { child: true }`.
 *
 * ## Deliberately NOT filtered
 *
 * Omissions here are intentional, not oversights:
 *
 * - `listEnrollmentsForParent` — the parent's own view. They archived the child;
 *   hiding it from them would make the action look like data loss.
 * - `listReportsForParent`, `listReportsForSchoolWithRelations`,
 *   `findActivityReportByIdWithRelations`, `listRecentReports` — historical
 *   records. A report that was written still happened; archiving a child is not
 *   a request to retract the school's own records.
 * - `findChild`, `findChildNameById` — lookups used for authorisation and
 *   display. They must still resolve an archived child, or archive-related
 *   flows would break the moment the row is archived.
 * - Every write path, for the same reason.
 */

/** Child rows the parent has not archived. Spread into a Child where-clause. */
export const CHILD_NOT_ARCHIVED = { archivedAt: null } as const;

/**
 * Enrollment rows whose child the parent has not archived. Spread into a
 * SchoolChildEnrollment where-clause:
 *
 * ```ts
 * where: { schoolId, ...ENROLLMENT_CHILD_NOT_ARCHIVED }
 * ```
 */
export const ENROLLMENT_CHILD_NOT_ARCHIVED = { child: CHILD_NOT_ARCHIVED } as const;
