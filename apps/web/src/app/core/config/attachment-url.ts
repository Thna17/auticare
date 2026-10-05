/**
 * Build the authorised download URL for one of an activity report's attachments.
 *
 * Attachments used to be served by an unauthenticated `express.static('/uploads')`
 * mount, so the stored path could be used as a `src` directly. They are now served
 * by `GET /api/v1/schools/reports/:id/attachments/:filename`, which authorises the
 * caller against the owning report — so the stored path has to be turned into a
 * report-scoped URL before it can be rendered.
 *
 * `photoUrls` still stores the original `/uploads/activity-reports/<uuid>.<ext>`
 * path, so only the basename is taken from it. The result is relative, which keeps
 * the request same-origin and therefore carries the session cookie (they are
 * SameSite=Lax, so a cross-origin request would not).
 */
export const attachmentUrl = (reportId: string, storedUrl: string): string => {
  const filename = storedUrl.split('/').pop() ?? '';
  return `/api/v1/schools/reports/${encodeURIComponent(reportId)}/attachments/${encodeURIComponent(filename)}`;
};
