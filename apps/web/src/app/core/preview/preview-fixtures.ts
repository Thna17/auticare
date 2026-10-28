import type {
  AdminDashboardResponse,
  AdminOverview,
  ParentDashboardResponse,
  ParentResponse,
  SchoolDashboardResponse,
} from '@auticare/contracts';
import type { PreviewRole } from './preview-mode';

/**
 * Sample answers for preview mode, keyed by API path. Only what the dashboards,
 * the sidebar and the notification badges load on arrival is covered; every
 * other request is refused by the interceptor with a clear message.
 */

const now = new Date();
const iso = (offsetDays = 0, hour = 9) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const day = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

const ACCOUNTS: Record<PreviewRole, ParentResponse> = {
  parent: {
    id: 'preview-parent',
    email: 'sophea.parent@preview.local',
    firstName: 'Sophea',
    lastName: 'Chan',
    role: 'PARENT',
    phoneNumber: null,
    socialMediaAccount: null,
  },
  admin: {
    id: 'preview-admin',
    email: 'admin@preview.local',
    firstName: 'Platform',
    lastName: 'Admin',
    role: 'ADMIN',
    phoneNumber: null,
    socialMediaAccount: null,
  },
  'school-admin': {
    id: 'preview-school-admin',
    email: 'head@brightsteps.preview.local',
    firstName: 'Vanna',
    lastName: 'Kim',
    role: 'SCHOOL',
    phoneNumber: null,
    socialMediaAccount: null,
  },
  teacher: {
    id: 'preview-teacher',
    email: 'sereyteacher.bs@staff.auticare.invalid',
    firstName: 'Serey',
    lastName: 'Teacher',
    role: 'SCHOOL',
    username: 'sereyteacher.bs',
    phoneNumber: null,
    socialMediaAccount: null,
  },
  hospital: {
    id: 'preview-hospital',
    email: 'coordinator@calmcare.preview.local',
    firstName: 'Dara',
    lastName: 'Sok',
    role: 'HOSPITAL',
    phoneNumber: null,
    socialMediaAccount: null,
  },
};

const CHILD = {
  id: 'preview-child',
  firstName: 'Dara',
  lastName: 'Chan',
  dateOfBirth: '2023-03-14',
  photoUrl: null,
  notes: null,
  archivedAt: null,
  questionnaireStatus: 'COMPLETED' as const,
};

const LATEST_SCREENING = {
  id: 'preview-session',
  childId: CHILD.id,
  status: 'ANALYZED' as const,
  ageBand: 'TODDLER' as const,
  formKind: 'SHORT' as const,
  startedAt: iso(-6),
  submittedAt: iso(-6),
  createdAt: iso(-6),
  updatedAt: iso(-6),
  answers: [],
  previousComparison: null,
  result: {
    id: 'preview-result',
    score: 4,
    riskPercentage: 38,
    riskLevel: 'MODERATE' as const,
    recommendation: 'Sample data: in the real app this comes from the AutiCare API.',
    disclaimer: 'Educational guidance only. This is not a diagnosis.',
    analysisVersion: 'preview',
    analyzedAt: iso(-6),
    categoryBreakdown: [
      { category: 'Social Interaction', riskPercentage: 40, riskLevel: 'MODERATE' as const },
      { category: 'Communication', riskPercentage: 25, riskLevel: 'LOW' as const },
      { category: 'Sensory Processing', riskPercentage: 55, riskLevel: 'MODERATE' as const },
    ],
  },
};

const PARENT_DASHBOARD: ParentDashboardResponse = {
  selectedChild: {
    id: CHILD.id,
    firstName: CHILD.firstName,
    lastName: CHILD.lastName,
    dateOfBirth: CHILD.dateOfBirth,
    photoUrl: null,
  },
  totalChildren: 1,
  children: [
    {
      id: CHILD.id,
      firstName: CHILD.firstName,
      lastName: CHILD.lastName,
      dateOfBirth: CHILD.dateOfBirth,
      photoUrl: null,
    },
  ],
  questionnaireStatus: 'COMPLETED',
  screeningSummary: {
    hasScreening: true,
    sessionId: LATEST_SCREENING.id,
    status: 'ANALYZED',
    riskLevel: 'MODERATE',
    riskPercentage: 38,
    score: 4,
    completedDate: day(-6),
    recommendation: LATEST_SCREENING.result.recommendation,
  },
  weeklyProgress: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
      day: d,
      count: [1, 0, 2, 1, 0, 3, 1][i] ?? 0,
      percentage: [33, 0, 66, 33, 0, 100, 33][i] ?? 0,
    })),
    totalCompletedThisWeek: 8,
  },
  upcomingAppointment: {
    id: 'preview-appt',
    hospitalName: 'Calm Care Children’s Clinic',
    doctorName: 'Dr. Sok Mealea',
    specialty: 'Developmental paediatrics',
    scheduledAt: iso(5, 10),
    status: 'CONFIRMED',
    reason: 'First visit',
    childFirstName: CHILD.firstName,
  },
  recommendedAction: {
    title: 'Review Dara’s check-in',
    description: 'See which areas to watch and try one suggested activity this week.',
    actionPath: '/screening',
    actionLabel: 'Open',
    source: 'SCREENING_RESULT',
  },
};

const ADMIN_DASHBOARD: AdminDashboardResponse = {
  stats: {
    totalFamilies: 142,
    activeChildren: 189,
    totalHospitals: 8,
    totalSchools: 14,
    totalAppointments: 67,
    pendingAppointments: 5,
  },
  recentAppointments: [
    {
      id: 'preview-a1',
      parentName: 'Sophea Chan',
      childName: 'Dara',
      hospitalName: 'Calm Care Children’s Clinic',
      scheduledAt: iso(5, 10),
      status: 'CONFIRMED',
    },
  ],
  recentAuditEvents: [
    {
      id: 'preview-e1',
      action: 'SCHOOL_VERIFIED',
      actorEmail: 'admin@preview.local',
      targetEmail: null,
      createdAt: iso(-1),
    },
  ],
};

const ADMIN_OVERVIEW: AdminOverview = {
  parents: { total: 142, new7d: 6, new30d: 21 },
  schools: { active: 14, suspended: 1 },
  pending: { schoolRequests: 2, hospitalRequests: 1, teacherSetups: 4 },
  subscriptions: { pro: 23, business: 5, sponsoredActive: 12, pastDue: 1 },
  suspendedAccounts: 2,
  aiConfigured: false,
  recentActivity: [
    {
      id: 'preview-e1',
      action: 'SCHOOL_VERIFIED',
      actorEmail: 'admin@preview.local',
      actorRole: 'ADMIN',
      targetId: null,
      targetEmail: null,
      metadata: { schoolName: 'Bright Steps' },
      createdAt: iso(-1),
    },
    {
      id: 'preview-e2',
      action: 'SUBSCRIPTION_CREATED',
      actorEmail: 'admin@preview.local',
      actorRole: 'ADMIN',
      targetId: null,
      targetEmail: null,
      metadata: { plan: 'BUSINESS' },
      createdAt: iso(-2),
    },
  ],
};

const SCHOOL_DASHBOARD: SchoolDashboardResponse = {
  schoolName: 'Bright Steps Learning Centre',
  staffFirstName: 'Vanna',
  staffLastName: 'Kim',
  staffTitle: 'Principal',
  stats: {
    totalStudents: 24,
    studentsDelta: 3,
    reportsSubmitted: 41,
    pendingReports: 4,
    activitiesCompleted: 118,
    weekDelta: 12,
  },
  recentReports: [
    {
      id: 'preview-r1',
      childFirstName: 'Dara',
      activityCategory: 'Communication',
      title: 'Picture cards at snack time',
      activityDate: day(-1),
      status: 'SUBMITTED',
    },
    {
      id: 'preview-r2',
      childFirstName: 'Mealea',
      activityCategory: 'Social Interaction',
      title: 'Turn-taking game',
      activityDate: day(-2),
      status: 'DRAFT',
    },
  ],
  reminders: [
    { id: 'preview-m1', title: 'Weekly reports due', urgency: 'today', dueTime: '16:00' },
    { id: 'preview-m2', title: 'Parent meeting', urgency: 'upcoming', dueTime: null },
  ],
};

const pagination = (total: number) => ({ total, page: 1, limit: 20, totalPages: 1 });

const PARENT_NOTIFICATIONS = {
  notifications: [
    {
      id: 'preview-n1',
      type: 'SCHOOL_REPORT' as const,
      status: 'UNREAD' as const,
      title: 'New report from Bright Steps',
      body: 'Dara’s teacher shared a progress report.',
      enrollmentId: null,
      reportId: 'preview-r1',
      appointmentId: null,
      createdAt: iso(-1),
    },
    {
      id: 'preview-n2',
      type: 'APPOINTMENT' as const,
      status: 'READ' as const,
      title: 'Appointment confirmed',
      body: 'Calm Care confirmed Dara’s visit.',
      enrollmentId: null,
      reportId: null,
      appointmentId: 'preview-appt',
      createdAt: iso(-3),
    },
  ],
  pagination: pagination(1),
};

const HOSPITAL_ME = {
  hospital: {
    id: 'preview-hospital-org',
    name: 'Calm Care Children’s Clinic',
    city: 'Phnom Penh',
    address: 'Street 271',
    services: 'Developmental paediatrics, speech therapy',
    createdAt: iso(-200),
    updatedAt: iso(-10),
  },
  staff: {
    id: 'preview-hospital-staff',
    parentId: 'preview-hospital',
    hospitalId: 'preview-hospital-org',
    title: 'Coordinator',
    phone: null,
  },
  staffRole: 'ADMIN' as const,
};

/** The sample answer for one request, or undefined when it is not covered. */
export const previewResponse = (
  method: string,
  path: string,
  role: PreviewRole,
): { body: unknown } | undefined => {
  const get = method === 'GET';
  const account = ACCOUNTS[role];

  if (path === 'auth/me' && get) return { body: { parent: account } };
  if (path === 'auth/logout') return { body: { loggedOut: true } };
  if (path === 'announcements' && get) {
    return {
      body: [
        {
          id: 'preview-announcement',
          title: 'Preview mode',
          body: 'You are looking at sample data. Nothing you do here is saved.',
          publishedAt: iso(-1),
        },
      ],
    };
  }

  if (role === 'parent') {
    if (path === 'children' && get) return { body: [CHILD] };
    if (path === `screening/children/${CHILD.id}/latest` && get) return { body: LATEST_SCREENING };
    if (path === 'dashboard/parent' && get) return { body: PARENT_DASHBOARD };
    if (path === `insights/children/${CHILD.id}` && get) {
      return {
        body: {
          childId: CHILD.id,
          windowStart: day(-28),
          windowEnd: day(0),
          observationCount: 0,
          distinctDays: 0,
          patterns: [],
          summary: '',
          analysisVersion: 'preview',
          generatedAt: iso(0),
        },
      };
    }
    if (path === 'parents/notifications' && get) return { body: PARENT_NOTIFICATIONS };
    if (path === 'parents/preferences' && get) {
      return {
        body: {
          preference: { preferredLanguage: 'en', reducedMotion: false, highContrast: false },
        },
      };
    }
  }

  if (role === 'admin') {
    if (path === 'dashboard/admin' && get) return { body: ADMIN_DASHBOARD };
    if (path === 'admin/overview' && get) return { body: ADMIN_OVERVIEW };
    if (path === 'children' && get) return { body: [] };
    if (path === 'admin/school-registrations/pending-count' && get) return { body: { count: 2 } };
    if (path === 'admin/hospital-registrations/pending-count' && get) return { body: { count: 1 } };
  }

  if (role === 'school-admin' || role === 'teacher') {
    if (path === 'schools/staff/me' && get) {
      return {
        body: {
          id: `preview-staff-${role}`,
          schoolId: 'preview-school',
          parentId: account.id,
          title: role === 'teacher' ? 'Speech therapist' : 'Principal',
          role: role === 'teacher' ? 'TEACHER' : 'ADMIN',
        },
      };
    }
    if (path === 'schools/me/dashboard' && get) {
      return {
        body:
          role === 'teacher'
            ? {
                ...SCHOOL_DASHBOARD,
                staffFirstName: 'Serey',
                staffLastName: 'Teacher',
                staffTitle: 'Speech therapist',
              }
            : SCHOOL_DASHBOARD,
      };
    }
    if (path === 'schools/notifications' && get) {
      return { body: { notifications: [], pagination: pagination(0) } };
    }
  }

  if (role === 'hospital') {
    if (path === 'hospital-management/me' && get) return { body: HOSPITAL_ME };
    if (path === 'hospital-management/appointments' && get) return { body: [] };
    if (path === 'hospital-management/doctors' && get) return { body: [] };
  }

  return undefined;
};
