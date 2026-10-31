/** A JSON response whose body is `{ data: … }`, for operations without a named schema. */
const dataResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { properties: { data: { type: 'object' } } } } },
});

const pathParam = (name: string) => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string' },
});

export const openApiDocument: Record<string, unknown> = {
  openapi: '3.1.0',
  info: {
    title: 'AutiCare API',
    version: '0.1.0',
    description:
      'Production-grade REST API for the AutiCare neuro-inclusive developmental support platform. Connects parents, schools, and healthcare providers with role-based access, screening evaluation, activity tracking, appointment scheduling, and coordinated child support.',
    contact: {
      name: 'AutiCare Engineering',
      email: 'support@auticare.org',
      url: 'https://auticare.org/support',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
    {
      url: '/',
      description: 'Root Endpoint (Health & Metrics)',
    },
  ],
  tags: [
    {
      name: 'Admin',
      description: 'Platform admin: users, schools, staff, sponsorships, audit logs',
    },
    {
      name: 'Subscriptions',
      description: 'Pro and Business plans, and sponsored Pro family accounts',
    },
    { name: 'Auth', description: 'Authentication, session lifecycle, and invitations' },
    { name: 'Children', description: 'Child profile management and developmental records' },
    { name: 'Screening', description: 'M-CHAT-R/F neurodevelopmental screening workflow' },
    { name: 'Activities', description: 'Evidence-based activities and progress tracking' },
    { name: 'Appointments', description: 'Specialist scheduling, booking, and lifecycle' },
    { name: 'Hospitals', description: 'Specialist healthcare provider directory and management' },
    {
      name: 'Hospital Management',
      description: 'Hospital staff portal for doctors and appointments',
    },
    { name: 'Schools', description: 'Special education schools directory, staff, and admissions' },
    { name: 'Reports', description: 'School activity reports and clinical attachments' },
    { name: 'Enrollments', description: 'Student enrollment management and specialist assignment' },
    { name: 'Notifications', description: 'Multi-role notification delivery and read states' },
    { name: 'Parents', description: 'Parent account preferences and family settings' },
    { name: 'Dashboard', description: 'Role-specific operational and analytical dashboards' },
    { name: 'Health', description: 'Production liveness, readiness, startup, and metrics' },
    {
      name: 'School Registrations',
      description: 'Public registration requests and admin review workflow',
    },
    {
      name: 'Hospital Registrations',
      description: 'Public hospital registration requests and admin review workflow',
    },
    {
      name: 'Hospital Team',
      description: 'Hospital staff accounts and credentials management',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auticare_access',
        description: 'HTTP-only signed JWT access token cookie (15-minute TTL)',
      },
      refreshCookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auticare_refresh',
        description: 'HTTP-only signed JWT refresh token cookie (7-day TTL)',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token for programmatic API clients',
      },
    },
    schemas: {
      ApiErrorEnvelope: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'The provided data failed schema validation.',
              },
              details: {
                type: 'object',
                additionalProperties: true,
                example: { field: 'email', issue: 'Invalid email address' },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', minimum: 1, example: 1 },
          limit: { type: 'integer', minimum: 1, example: 20 },
          total: { type: 'integer', minimum: 0, example: 42 },
          totalPages: { type: 'integer', minimum: 0, example: 3 },
        },
      },
      UserRole: {
        type: 'string',
        enum: ['PARENT', 'ADMIN', 'SCHOOL', 'HOSPITAL'],
        example: 'PARENT',
      },
      ParentResponse: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: 'cuid_parent_123' },
          email: { type: 'string', format: 'email', example: 'parent@example.com' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          phone: { type: 'string', nullable: true, example: '+1-555-0192' },
          role: { $ref: '#/components/schemas/UserRole' },
          schoolId: { type: 'string', nullable: true, example: null },
          hospitalId: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-01T00:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-09T00:00:00.000Z' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email', example: 'newparent@example.com' },
          password: { type: 'string', minLength: 12, example: 'SecurePassword123!' },
          firstName: { type: 'string', minLength: 1, maxLength: 80, example: 'Sarah' },
          lastName: { type: 'string', minLength: 1, maxLength: 80, example: 'Connor' },
          phone: { type: 'string', maxLength: 30, example: '+1-555-1234' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'parent@example.com' },
          password: { type: 'string', example: 'SecurePassword123!' },
        },
      },
      UpdateMyProfileRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 80, example: 'Jane' },
          lastName: { type: 'string', minLength: 1, maxLength: 80, example: 'Smith' },
          phone: { type: 'string', maxLength: 30, nullable: true, example: '+1-555-9876' },
        },
      },
      PasswordResetRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
        },
      },
      VerifyEmailRequest: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email', example: 'parent@example.com' },
          code: { type: 'string', pattern: '^\\d{6}$', example: '042913' },
        },
      },
      ResendVerificationRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'parent@example.com' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', example: 'reset_token_xyz123' },
          password: { type: 'string', minLength: 12, example: 'BrandNewSecurePassword123!' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1, example: 'CurrentPassword123!' },
          newPassword: { type: 'string', minLength: 12, example: 'BrandNewSecurePassword123!' },
        },
      },
      UpdateParentPreferencesRequest: {
        type: 'object',
        properties: {
          preferredLanguage: { type: 'string', example: 'en' },
          reducedMotion: { type: 'boolean', example: true },
          highContrast: { type: 'boolean', example: false },
        },
      },
      ParentPreference: {
        type: 'object',
        required: ['preferredLanguage', 'reducedMotion', 'highContrast'],
        properties: {
          preferredLanguage: { type: 'string', example: 'en' },
          reducedMotion: { type: 'boolean', example: false },
          highContrast: { type: 'boolean', example: false },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-10T12:00:00.000Z' },
        },
      },

      AcceptInvitationRequest: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', example: 'invitation_token_abc' },
          password: { type: 'string', minLength: 12, example: 'StaffPassword123!' },
        },
      },
      SchoolRegistrationRequest: {
        type: 'object',
        required: ['schoolName', 'city', 'contactFirstName', 'contactLastName', 'email', 'phone'],
        properties: {
          schoolName: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
            example: 'Phnom Penh Early Learning',
          },
          city: { type: 'string', minLength: 1, maxLength: 120, example: 'Phnom Penh' },
          address: {
            type: 'string',
            maxLength: 500,
            nullable: true,
            example: 'Street 2004, Sen Sok',
          },
          contactFirstName: { type: 'string', minLength: 1, maxLength: 80, example: 'Sokha' },
          contactLastName: { type: 'string', minLength: 1, maxLength: 80, example: 'Keo' },
          contactTitle: { type: 'string', maxLength: 120, nullable: true, example: 'Principal' },
          email: { type: 'string', format: 'email', example: 'sokha.keo@earlylearning.edu.kh' },
          phone: { type: 'string', minLength: 1, maxLength: 32, example: '+85512345678' },
          studentCount: {
            type: 'integer',
            minimum: 1,
            maximum: 100000,
            nullable: true,
            example: 120,
          },
          message: {
            type: 'string',
            maxLength: 1000,
            nullable: true,
            example: 'Looking to integrate AutiCare in our special education classes.',
          },
        },
      },
      RejectSchoolRegistrationRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: {
            type: 'string',
            minLength: 3,
            maxLength: 500,
            example: 'Unable to verify school licensing with MoEYS.',
          },
        },
      },
      SchoolRegistration: {
        type: 'object',
        required: [
          'id',
          'schoolName',
          'city',
          'contactFirstName',
          'contactLastName',
          'email',
          'phone',
          'status',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string', example: 'cuid_reg_101' },
          schoolName: { type: 'string', example: 'Phnom Penh Early Learning' },
          city: { type: 'string', example: 'Phnom Penh' },
          address: { type: 'string', nullable: true, example: 'Street 2004, Sen Sok' },
          contactFirstName: { type: 'string', example: 'Sokha' },
          contactLastName: { type: 'string', example: 'Keo' },
          contactTitle: { type: 'string', nullable: true, example: 'Principal' },
          email: { type: 'string', format: 'email', example: 'sokha.keo@earlylearning.edu.kh' },
          phone: { type: 'string', example: '+85512345678' },
          studentCount: { type: 'integer', nullable: true, example: 120 },
          message: {
            type: 'string',
            nullable: true,
            example: 'Looking to integrate AutiCare in our special education classes.',
          },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
          rejectionReason: { type: 'string', nullable: true, example: null },
          reviewedById: { type: 'string', nullable: true, example: null },
          reviewedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
          schoolId: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-27T10:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-27T10:00:00.000Z' },
        },
      },
      HospitalRegistrationRequest: {
        type: 'object',
        required: ['hospitalName', 'city', 'contactFirstName', 'contactLastName', 'email', 'phone'],
        properties: {
          hospitalName: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
            example: 'Calmette Hospital',
          },
          city: { type: 'string', minLength: 1, maxLength: 120, example: 'Phnom Penh' },
          address: {
            type: 'string',
            maxLength: 500,
            nullable: true,
            example: 'Monivong Blvd',
          },
          contactFirstName: { type: 'string', minLength: 1, maxLength: 80, example: 'Chan' },
          contactLastName: { type: 'string', minLength: 1, maxLength: 80, example: 'Vannak' },
          contactTitle: {
            type: 'string',
            maxLength: 120,
            nullable: true,
            example: 'Medical Director',
          },
          email: { type: 'string', format: 'email', example: 'chan.vannak@calmette.gov.kh' },
          phone: { type: 'string', minLength: 1, maxLength: 32, example: '+85512345678' },
          services: {
            type: 'string',
            maxLength: 1000,
            nullable: true,
            example: 'Pediatrics, Neurological screening, Speech therapy',
          },
          message: {
            type: 'string',
            maxLength: 1000,
            nullable: true,
            example: 'Looking to integrate AutiCare in our pediatric ward.',
          },
        },
      },
      RejectHospitalRegistrationRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: {
            type: 'string',
            minLength: 3,
            maxLength: 500,
            example: 'Unable to verify medical facility licensing with MoH.',
          },
        },
      },
      HospitalRegistration: {
        type: 'object',
        required: [
          'id',
          'hospitalName',
          'city',
          'contactFirstName',
          'contactLastName',
          'email',
          'phone',
          'status',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string', example: 'cuid_hosp_reg_101' },
          hospitalName: { type: 'string', example: 'Calmette Hospital' },
          city: { type: 'string', example: 'Phnom Penh' },
          address: { type: 'string', nullable: true, example: 'Monivong Blvd' },
          contactFirstName: { type: 'string', example: 'Chan' },
          contactLastName: { type: 'string', example: 'Vannak' },
          contactTitle: { type: 'string', nullable: true, example: 'Medical Director' },
          email: { type: 'string', format: 'email', example: 'chan.vannak@calmette.gov.kh' },
          phone: { type: 'string', example: '+85512345678' },
          services: {
            type: 'string',
            nullable: true,
            example: 'Pediatrics, Neurological screening',
          },
          message: {
            type: 'string',
            nullable: true,
            example: 'Looking to integrate AutiCare in our pediatric ward.',
          },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
          rejectionReason: { type: 'string', nullable: true, example: null },
          reviewedById: { type: 'string', nullable: true, example: null },
          reviewedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
          hospitalId: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-28T10:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-28T10:00:00.000Z' },
        },
      },
      CreateHospitalStaffRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'role'],
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 80, example: 'Sok' },
          lastName: { type: 'string', minLength: 1, maxLength: 80, example: 'Dara' },
          title: { type: 'string', maxLength: 120, nullable: true, example: 'Coordinator' },
          role: { type: 'string', enum: ['COORDINATOR', 'DOCTOR'], example: 'COORDINATOR' },
          doctorId: { type: 'string', nullable: true, example: 'doc_sarah_miller' },
        },
      },
      HospitalStaffMember: {
        type: 'object',
        required: ['id', 'hospitalId', 'firstName', 'lastName', 'role', 'status', 'createdAt'],
        properties: {
          id: { type: 'string', example: 'cuid_hstaff_101' },
          hospitalId: { type: 'string', example: 'cuid_hospital_123' },
          parentId: { type: 'string', example: 'cuid_parent_123' },
          firstName: { type: 'string', example: 'Sok' },
          lastName: { type: 'string', example: 'Dara' },
          title: { type: 'string', nullable: true, example: 'Coordinator' },
          role: {
            type: 'string',
            enum: ['ADMIN', 'COORDINATOR', 'DOCTOR'],
            example: 'COORDINATOR',
          },
          doctorId: { type: 'string', nullable: true, example: null },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'SETUP_PENDING', 'DEACTIVATED'],
            example: 'ACTIVE',
          },
          username: { type: 'string', nullable: true, example: 'sdara' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-28T10:00:00.000Z' },
        },
      },
      ResendInvitationRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'invited.staff@school.org' },
        },
      },
      ChildSummary: {
        type: 'object',
        required: [
          'childId',
          'content',
          'language',
          'model',
          'promptVersion',
          'windowDays',
          'generatedAt',
          'cached',
        ],
        properties: {
          childId: { type: 'string', example: 'cuid_child_101' },
          content: {
            type: 'string',
            example:
              'Over the last four weeks you recorded eleven observations, on nine different days.',
          },
          language: { type: 'string', enum: ['en', 'km'], example: 'en' },
          model: { type: 'string', example: 'deepseek-flash' },
          promptVersion: { type: 'string', example: 'summary-v1' },
          windowDays: { type: 'integer', example: 28 },
          generatedAt: { type: 'string', format: 'date-time' },
          cached: {
            type: 'boolean',
            description: 'True when the stored text already described the current records.',
          },
        },
      },
      ChildResponse: {
        type: 'object',
        required: [
          'id',
          'parentId',
          'firstName',
          'lastName',
          'dateOfBirth',
          'gender',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string', example: 'cuid_child_101' },
          parentId: { type: 'string', example: 'cuid_parent_123' },
          firstName: { type: 'string', example: 'Leo' },
          lastName: { type: 'string', example: 'Doe' },
          dateOfBirth: { type: 'string', format: 'date', example: '2023-04-15' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' },
          notes: {
            type: 'string',
            nullable: true,
            example: 'Loves sensory play and building blocks.',
          },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-01T00:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-09T00:00:00.000Z' },
        },
      },
      CreateChildRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'dateOfBirth', 'gender'],
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 80, example: 'Leo' },
          lastName: { type: 'string', minLength: 1, maxLength: 80, example: 'Doe' },
          dateOfBirth: { type: 'string', format: 'date', example: '2023-04-15' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' },
          notes: {
            type: 'string',
            maxLength: 1000,
            nullable: true,
            example: 'Sensitive to loud noise.',
          },
        },
      },
      ScreeningQuestionResponse: {
        type: 'object',
        required: ['id', 'order', 'text', 'category', 'polarity', 'ageBand'],
        properties: {
          id: { type: 'string', example: 'q_01' },
          order: { type: 'integer', example: 1 },
          text: {
            type: 'string',
            example: 'If you point at something across the room, does your child look at it?',
          },
          category: { type: 'string', example: 'Joint Attention' },
          polarity: { type: 'string', enum: ['DIRECT', 'REVERSE'], example: 'DIRECT' },
          ageBand: { type: 'string', enum: ['TODDLER', 'PRESCHOOL'], example: 'TODDLER' },
        },
      },
      ScreeningSessionResponse: {
        type: 'object',
        required: ['id', 'childId', 'parentId', 'status', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: 'session_screening_789' },
          childId: { type: 'string', example: 'cuid_child_101' },
          parentId: { type: 'string', example: 'cuid_parent_123' },
          status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'ANALYZED'], example: 'DRAFT' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-08T08:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-08T08:15:00.000Z' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['questionId', 'value'],
              properties: {
                questionId: { type: 'string', example: 'q_01' },
                value: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      ScreeningResultResponse: {
        type: 'object',
        required: ['id', 'sessionId', 'childId', 'totalScore', 'riskLevel', 'summary', 'createdAt'],
        properties: {
          id: { type: 'string', example: 'result_456' },
          sessionId: { type: 'string', example: 'session_screening_789' },
          childId: { type: 'string', example: 'cuid_child_101' },
          totalScore: { type: 'number', example: 4 },
          riskLevel: { type: 'string', enum: ['LOW', 'MODERATE', 'HIGH'], example: 'MODERATE' },
          summary: {
            type: 'string',
            example: 'Screening indicates moderate developmental differences in joint attention.',
          },
          categoryBreakdown: {
            type: 'array',
            items: {
              type: 'object',
              required: ['category', 'score', 'maxScore'],
              properties: {
                category: { type: 'string', example: 'Joint Attention' },
                score: { type: 'number', example: 2 },
                maxScore: { type: 'number', example: 5 },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-08T08:20:00.000Z' },
        },
      },
      ActivityResponse: {
        type: 'object',
        required: [
          'id',
          'title',
          'category',
          'description',
          'targetAgeMin',
          'targetAgeMax',
          'instructions',
        ],
        properties: {
          id: { type: 'string', example: 'act_pointing_game' },
          title: { type: 'string', example: 'Mirror & Gesture Imitation' },
          category: { type: 'string', example: 'Communication' },
          description: {
            type: 'string',
            example: 'Engage in fun reciprocal facial expression and pointing play.',
          },
          targetAgeMin: { type: 'integer', example: 18 },
          targetAgeMax: { type: 'integer', example: 36 },
          instructions: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'Sit face to face with child',
              'Point to a soft toy',
              'Celebrate when child looks',
            ],
          },
        },
      },
      ActivityProgressResponse: {
        type: 'object',
        required: ['id', 'childId', 'activityId', 'status', 'completionsCount', 'lastCompletedAt'],
        properties: {
          id: { type: 'string', example: 'prog_123' },
          childId: { type: 'string', example: 'cuid_child_101' },
          activityId: { type: 'string', example: 'act_pointing_game' },
          status: {
            type: 'string',
            enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
            example: 'COMPLETED',
          },
          completionsCount: { type: 'integer', example: 5 },
          notes: {
            type: 'string',
            nullable: true,
            example: 'Child smiled and pointed back successfully.',
          },
          lastCompletedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-10-09T09:00:00.000Z',
          },
        },
      },
      HospitalResponse: {
        type: 'object',
        required: ['id', 'name', 'address', 'city', 'province', 'phone', 'serviceTags'],
        properties: {
          id: { type: 'string', example: 'hosp_central_pediatrics' },
          name: { type: 'string', example: 'Central Pediatric Neurodevelopment Clinic' },
          address: { type: 'string', example: '123 Medical Center Way' },
          city: { type: 'string', example: 'Toronto' },
          province: { type: 'string', example: 'Ontario' },
          phone: { type: 'string', example: '+1-416-555-0100' },
          serviceTags: {
            type: 'array',
            items: { type: 'string' },
            example: ['Speech Therapy', 'Occupational Therapy', 'Developmental Assessment'],
          },
        },
      },
      UpdateHospitalProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Central Pediatric Neurodevelopment Clinic' },
          phone: { type: 'string', nullable: true, example: '+1-416-555-0100' },
          address: { type: 'string', example: '123 Medical Center Way' },
          city: { type: 'string', example: 'Phnom Penh' },
          description: {
            type: 'string',
            nullable: true,
            example: 'Comprehensive neurodevelopmental clinic.',
          },
          services: { type: 'string', example: 'Speech Therapy, Occupational Therapy' },
        },
      },
      DoctorResponse: {
        type: 'object',
        required: ['id', 'hospitalId', 'fullName', 'specialty'],
        properties: {
          id: { type: 'string', example: 'doc_sarah_miller' },
          hospitalId: { type: 'string', example: 'hosp_central_pediatrics' },
          fullName: { type: 'string', example: 'Dr. Sarah Miller, MD' },
          specialty: { type: 'string', example: 'Developmental Pediatrician' },
          bio: {
            type: 'string',
            nullable: true,
            example: '15+ years experience in neurodevelopmental evaluations.',
          },
          availableDays: { type: 'string', example: 'MON,TUE,WED,THU' },
          startHour: { type: 'integer', example: 9 },
          endHour: { type: 'integer', example: 17 },
          slotDurationMinutes: { type: 'integer', example: 30 },
          timezone: { type: 'string', example: 'America/Toronto' },
        },
      },
      DoctorSlot: {
        type: 'object',
        required: ['time', 'scheduledAt', 'available'],
        properties: {
          time: { type: 'string', example: '09:00' },
          scheduledAt: { type: 'string', format: 'date-time', example: '2026-10-15T09:00:00.000Z' },
          available: { type: 'boolean', example: true },
        },
      },
      DoctorAvailabilityResponse: {
        type: 'object',
        required: ['doctor', 'date', 'slots'],
        properties: {
          doctor: { $ref: '#/components/schemas/DoctorResponse' },
          date: { type: 'string', format: 'date', example: '2026-10-15' },
          slots: {
            type: 'array',
            items: { $ref: '#/components/schemas/DoctorSlot' },
          },
        },
      },
      AppointmentResponse: {
        type: 'object',
        required: ['id', 'childId', 'hospitalId', 'doctorId', 'status', 'scheduledAt', 'createdAt'],
        properties: {
          id: { type: 'string', example: 'apt_555' },
          childId: { type: 'string', example: 'cuid_child_101' },
          hospitalId: { type: 'string', example: 'hosp_central_pediatrics' },
          doctorId: { type: 'string', example: 'doc_sarah_miller' },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED'],
            example: 'CONFIRMED',
          },
          scheduledAt: { type: 'string', format: 'date-time', example: '2026-10-15T09:00:00.000Z' },
          visitReason: { type: 'string', nullable: true, example: 'Developmental Follow-up' },
          rejectionReason: { type: 'string', nullable: true, example: null },
          parentName: { type: 'string', nullable: true, example: 'Jane Doe' },
          parentEmail: { type: 'string', nullable: true, example: 'parent@example.com' },
          parentPhoneNumber: { type: 'string', nullable: true, example: '+1-555-0199' },
          childDateOfBirth: { type: 'string', nullable: true, example: '2020-05-15' },
          childNotes: {
            type: 'string',
            nullable: true,
            example: 'Sensory sensitivity to loud noises',
          },
          doctor: { $ref: '#/components/schemas/DoctorResponse' },
          hospital: { $ref: '#/components/schemas/HospitalResponse' },
          child: { $ref: '#/components/schemas/ChildResponse' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-09T08:00:00.000Z' },
        },
      },
      SchoolResponse: {
        type: 'object',
        required: ['id', 'name', 'address', 'city', 'province', 'phone'],
        properties: {
          id: { type: 'string', example: 'school_horizon' },
          name: { type: 'string', example: 'Horizon Inclusive Academy' },
          address: { type: 'string', example: '450 Oak Avenue' },
          city: { type: 'string', example: 'Vancouver' },
          province: { type: 'string', example: 'British Columbia' },
          phone: { type: 'string', example: '+1-604-555-0188' },
          curriculum: {
            type: 'string',
            nullable: true,
            example: 'Individualized Sensory & Academic Integration',
          },
          isFavorite: { type: 'boolean', example: false },
        },
      },
      ActivityReportResponse: {
        type: 'object',
        required: ['id', 'schoolId', 'childId', 'title', 'summary', 'status', 'createdAt'],
        properties: {
          id: { type: 'string', example: 'rep_autumn_2026' },
          schoolId: { type: 'string', example: 'school_horizon' },
          childId: { type: 'string', example: 'cuid_child_101' },
          title: { type: 'string', example: 'Speech & Sensory Integration Milestone' },
          summary: {
            type: 'string',
            example: 'Great engagement during structured group circle and verbal imitation.',
          },
          status: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'ARCHIVED'],
            example: 'SUBMITTED',
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'filename', 'mimeType', 'sizeBytes'],
              properties: {
                id: { type: 'string', example: 'att_photo_01' },
                filename: { type: 'string', example: 'session-photo-01.png' },
                mimeType: { type: 'string', example: 'image/png' },
                sizeBytes: { type: 'integer', example: 1048576 },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-08T14:00:00.000Z' },
        },
      },
      NotificationResponse: {
        type: 'object',
        required: ['id', 'type', 'title', 'message', 'read', 'createdAt'],
        properties: {
          id: { type: 'string', example: 'notif_789' },
          type: { type: 'string', example: 'APPOINTMENT_CONFIRMED' },
          title: { type: 'string', example: 'Appointment Confirmed' },
          message: {
            type: 'string',
            example: 'Your visit with Dr. Sarah Miller on Oct 15 has been confirmed.',
          },
          actionUrl: { type: 'string', nullable: true, example: '/appointments/apt_555' },
          read: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-09T10:00:00.000Z' },
        },
      },
      ParentDashboardResponse: {
        type: 'object',
        required: [
          'greeting',
          'children',
          'recentScreening',
          'upcomingAppointments',
          'activityMetrics',
        ],
        properties: {
          greeting: { type: 'string', example: 'Welcome back, Jane!' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChildResponse' },
          },
          recentScreening: { $ref: '#/components/schemas/ScreeningResultResponse', nullable: true },
          upcomingAppointments: {
            type: 'array',
            items: { $ref: '#/components/schemas/AppointmentResponse' },
          },
          activityMetrics: {
            type: 'object',
            required: ['completedThisWeek', 'streakDays'],
            properties: {
              completedThisWeek: { type: 'integer', example: 6 },
              streakDays: { type: 'integer', example: 4 },
            },
          },
        },
      },
      AdminDashboardResponse: {
        type: 'object',
        required: [
          'totalParents',
          'totalChildren',
          'totalSchools',
          'totalHospitals',
          'recentAudits',
        ],
        properties: {
          totalParents: { type: 'integer', example: 342 },
          totalChildren: { type: 'integer', example: 410 },
          totalSchools: { type: 'integer', example: 28 },
          totalHospitals: { type: 'integer', example: 14 },
          recentAudits: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'action', 'actorRole', 'timestamp'],
              properties: {
                id: { type: 'string', example: 'aud_1' },
                action: { type: 'string', example: 'PROVISION_SCHOOL_ACCOUNT' },
                actorRole: { type: 'string', example: 'ADMIN' },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-10-09T12:00:00.000Z',
                },
              },
            },
          },
        },
      },
      HealthLiveResponse: {
        type: 'object',
        required: ['status', 'uptime', 'timestamp', 'version'],
        properties: {
          status: { type: 'string', example: 'live' },
          uptime: { type: 'integer', example: 3600 },
          timestamp: { type: 'string', format: 'date-time', example: '2026-10-09T14:00:00.000Z' },
          version: { type: 'string', example: '0.1.0' },
        },
      },
      HealthReadyResponse: {
        type: 'object',
        required: ['status', 'database', 'version'],
        properties: {
          status: { type: 'string', example: 'ready' },
          database: { type: 'string', example: 'connected' },
          storage: { type: 'string', example: 'local' },
          version: { type: 'string', example: '0.1.0' },
        },
      },
      HealthStartupResponse: {
        type: 'object',
        required: ['status', 'database', 'version'],
        properties: {
          status: { type: 'string', example: 'started' },
          database: { type: 'string', example: 'connected' },
          version: { type: 'string', example: '0.1.0' },
        },
      },
      HealthMetricsResponse: {
        type: 'object',
        required: ['uptimeSeconds', 'memoryBytes', 'environment', 'nodeVersion', 'version'],
        properties: {
          uptimeSeconds: { type: 'integer', example: 7200 },
          memoryBytes: {
            type: 'object',
            required: ['rss', 'heapTotal', 'heapUsed'],
            properties: {
              rss: { type: 'integer', example: 120586240 },
              heapTotal: { type: 'integer', example: 84672512 },
              heapUsed: { type: 'integer', example: 54832104 },
              external: { type: 'integer', example: 3847291 },
            },
          },
          environment: { type: 'string', example: 'production' },
          nodeVersion: { type: 'string', example: 'v22.22.2' },
          version: { type: 'string', example: '0.1.0' },
        },
      },
    },
  },
  paths: {
    // ── Health & Observability ───────────────────────────────────────────────
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        description:
          'Kubernetes/load balancer liveness check verifying the application process is running and accepting HTTP requests.',
        responses: {
          '200': {
            description: 'Application is live',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/HealthLiveResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        description:
          'Readiness check verifying database connectivity, storage driver readiness, and dependency health.',
        responses: {
          '200': {
            description: 'Application is ready for traffic',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/HealthReadyResponse' } },
                },
              },
            },
          },
          '503': {
            description: 'Database or storage unavailable',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/health/startup': {
      get: {
        tags: ['Health'],
        summary: 'Startup probe',
        description: 'Startup probe verifying initial initialization and migration compatibility.',
        responses: {
          '200': {
            description: 'Application has started successfully',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/HealthStartupResponse' } },
                },
              },
            },
          },
          '503': {
            description: 'Application failed to start',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/health/metrics': {
      get: {
        tags: ['Health'],
        summary: 'Observability metrics',
        description:
          'Returns process uptime, heap and RSS memory usage, node version, and runtime environment.',
        responses: {
          '200': {
            description: 'Runtime telemetry metrics',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/HealthMetricsResponse' } },
                },
              },
            },
          },
        },
      },
    },

    // ── Auth ─────────────────────────────────────────────────────────────────
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register parent account',
        description:
          'Creates a new parent account with secure argon2 password hashing. When email verification is on (EMAIL_VERIFICATION, on by default once an email provider is configured), no session is created: a 6-digit code is emailed and the response is { verificationRequired: true, email }; POST /auth/verify-email then signs the parent in. Otherwise an authenticated session is established and the response carries the parent.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Account created successfully',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Email already registered',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description:
          'Authenticates credentials, sets HTTP-only access and refresh cookies, and returns the user profile.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated successfully',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description:
              'EMAIL_NOT_VERIFIED: the password was right but the email is not confirmed yet. A code has been emailed; finish with POST /auth/verify-email.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        description: 'Clears HTTP-only session cookies and revokes active token refresh tokens.',
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh session',
        description:
          'Uses the HTTP-only refresh cookie to issue a new access token without re-prompting for credentials.',
        security: [{ refreshCookieAuth: [] }],
        responses: {
          '200': {
            description: 'Session refreshed',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Refresh token invalid or expired',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user profile',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update current user profile',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateMyProfileRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with the emailed code',
        description:
          'Checks the 6-digit code emailed at sign-up (or at a login attempt before verifying). A code works once, for 15 minutes, and five wrong guesses spend it. On success the address is marked verified and an authenticated session is established. Shares the login rate limit.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/VerifyEmailRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Email verified and signed in',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Code wrong, expired or already used',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '429': {
            description: 'Too many attempts',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/verify-email/resend': {
      post: {
        tags: ['Auth'],
        summary: 'Send a new verification code',
        description:
          'Emails a fresh code if the account is waiting to be verified, at most once a minute; earlier codes stop working. The response is the same whether or not the account exists.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResendVerificationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Request accepted',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset',
        description: 'Issues a secure one-time password reset link to the account email address.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PasswordResetRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Reset instructions sent',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Complete password reset',
        description: 'Consumes a valid reset token to update the account password.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
          '400': {
            description: 'Token invalid or expired',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change account password while authenticated',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password changed successfully',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        message: { type: 'string', example: 'Password changed successfully.' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or incorrect current password',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/invitations/verify': {
      get: {
        tags: ['Auth'],
        summary: 'Verify staff invitation token',
        description:
          'Verifies the validity of an invitation link for a newly provisioned school or hospital staff member.',
        parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Token valid and details returned',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
          '400': {
            description: 'Invalid or expired invitation token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/invitations/accept': {
      post: {
        tags: ['Auth'],
        summary: 'Accept staff invitation',
        description:
          'Sets staff password and completes invitation onboarding, signing in immediately.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AcceptInvitationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Invitation accepted and account activated',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: { parent: { $ref: '#/components/schemas/ParentResponse' } },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid token or weak password',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/auth/invitations/resend': {
      post: {
        tags: ['Auth'],
        summary: 'Resend staff invitation',
        description: 'Admin-only endpoint to reissue and dispatch a new invitation link.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResendInvitationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Invitation resent',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
          '403': {
            description: 'Admin access required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    // ── Children ─────────────────────────────────────────────────────────────
    '/api/v1/children': {
      get: {
        tags: ['Children'],
        summary: 'List children',
        description: 'Returns all children associated with the authenticated parent account.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'List of children',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/ChildResponse' } },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      post: {
        tags: ['Children'],
        summary: 'Create child profile',
        description: 'Adds a child profile under the authenticated parent account.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateChildRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Child profile created',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/ChildResponse' } } },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/children/{childId}': {
      get: {
        tags: ['Children'],
        summary: 'Get child profile',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Child profile detail',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/ChildResponse' } } },
              },
            },
          },
          '404': {
            description: 'Child not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      patch: {
        tags: ['Children'],
        summary: 'Update child profile',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateChildRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Child profile updated',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/ChildResponse' } } },
              },
            },
          },
          '404': {
            description: 'Child not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      delete: {
        tags: ['Children'],
        summary: 'Delete child profile',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Child profile deleted',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
          '404': {
            description: 'Child not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/children/{childId}/restore': {
      post: {
        tags: ['Children'],
        summary: 'Restore child profile',
        description: 'Restores an archived child profile by clearing its archivedAt timestamp.',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT', 'ADMIN'],
        responses: {
          '200': {
            description: 'Child profile restored',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/ChildResponse' } } },
              },
            },
          },
          '404': {
            description: 'Child not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    // ── Screening ────────────────────────────────────────────────────────────
    // ── Educational summary ─────────────────────────────────────────────────
    '/api/v1/children/{childId}/summary': {
      get: {
        tags: ['Children'],
        summary: 'Get the stored educational summary for a child',
        description:
          'Returns the most recently stored summary in the requested language, or null when none exists. Never calls the model, so it is safe to read on every page load.',
        parameters: [
          { name: 'childId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'language',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['en', 'km'], default: 'en' },
          },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'The stored summary, or null',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          allOf: [{ $ref: '#/components/schemas/ChildSummary' }],
                          nullable: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Child not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      post: {
        tags: ['Children'],
        summary: 'Write the educational summary for a child',
        description:
          'Writes a short educational summary in the requested language from facts the insights engine computed. Only the phrasing goes to the model: the facts are not model output, and no diagnosis is produced. When the records have not changed since the stored text was written, the stored text is returned with cached=true instead of generating again.',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  language: { type: 'string', enum: ['en', 'km'] },
                  days: { type: 'integer', minimum: 7, maximum: 120, example: 28 },
                  tzOffset: {
                    type: 'integer',
                    minimum: -720,
                    maximum: 840,
                    description: "Browser's minutes east of UTC, for weekday clustering.",
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'The summary, generated or already stored',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ChildSummary' } },
                },
              },
            },
          },
          '400': {
            description: 'The child has no records to summarise',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Child not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '429': {
            description: 'Daily allowance or installation budget reached',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    '/api/v1/screening/questions': {
      get: {
        tags: ['Screening'],
        summary: 'Get screening questionnaire',
        description: 'Returns the clinical M-CHAT-R/F question list and polarity indicators.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Screening questions list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ScreeningQuestionResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/screening/sessions': {
      post: {
        tags: ['Screening'],
        summary: 'Start screening session',
        description: 'Initializes a new draft screening session for a child.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['childId'],
                properties: { childId: { type: 'string', example: 'cuid_child_101' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Screening session initialized',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ScreeningSessionResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/screening/sessions/{id}': {
      get: {
        tags: ['Screening'],
        summary: 'Get screening session',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Screening session detail with saved answers',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ScreeningSessionResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/screening/sessions/{id}/answers': {
      patch: {
        tags: ['Screening'],
        summary: 'Upsert screening answer',
        description: 'Records or updates an answer for a specific question in a draft session.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['questionId', 'value'],
                properties: {
                  questionId: { type: 'string', example: 'q_01' },
                  value: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Answer recorded',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/screening/sessions/{id}/submit': {
      post: {
        tags: ['Screening'],
        summary: 'Submit complete screening',
        description:
          'Finalizes the screening session, scores answers using clinical polarity, and saves computed risk level and category breakdowns.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Screening evaluated and scored',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ScreeningResultResponse' } },
                },
              },
            },
          },
          '400': {
            description: 'Session is incomplete or already submitted',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/screening/children/{childId}/sessions': {
      get: {
        tags: ['Screening'],
        summary: 'List child screening history',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'List of screening sessions and results for child',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ScreeningResultResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Activities ───────────────────────────────────────────────────────────
    '/api/v1/activities': {
      get: {
        tags: ['Activities'],
        summary: 'List developmental activities',
        description:
          'Returns available activities filtered by optional category or child age band.',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'ageMonths', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Activities list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/activities/{activityId}/start': {
      post: {
        tags: ['Activities'],
        summary: 'Start activity progress',
        parameters: [
          { name: 'activityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['childId'],
                properties: { childId: { type: 'string', example: 'cuid_child_101' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Activity progress started',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ActivityProgressResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/activities/{activityId}/favorite': {
      post: {
        tags: ['Activities'],
        summary: 'Toggle activity favorite (Parent)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        parameters: [
          { name: 'activityId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Favorite status toggled',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/activities/progress': {
      get: {
        tags: ['Activities'],
        summary: 'Get child activity progress summary',
        parameters: [{ name: 'childId', in: 'query', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Child activity progress list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityProgressResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/activities/progress/{progressId}': {
      patch: {
        tags: ['Activities'],
        summary: 'Update activity progress',
        parameters: [
          { name: 'progressId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
                  notes: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Progress updated',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ActivityProgressResponse' } },
                },
              },
            },
          },
        },
      },
    },

    // ── Hospitals & Doctors ──────────────────────────────────────────────────
    '/api/v1/hospitals': {
      get: {
        tags: ['Hospitals'],
        summary: 'List hospitals and clinics',
        description: 'Returns hospitals with support for search, city, and province filtering.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'province', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of hospitals',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/HospitalResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Hospitals'],
        summary: 'Create hospital (Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'address', 'city', 'province', 'phone'],
                properties: {
                  name: { type: 'string', example: 'St. Jude Child Health' },
                  address: { type: 'string', example: '100 Pediatric Blvd' },
                  city: { type: 'string', example: 'Calgary' },
                  province: { type: 'string', example: 'Alberta' },
                  phone: { type: 'string', example: '+1-403-555-0199' },
                  serviceTags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Hospital created',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/HospitalResponse' } } },
              },
            },
          },
          '403': {
            description: 'Admin role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/hospitals/admin/accounts': {
      get: {
        tags: ['Hospitals'],
        summary: 'List hospital staff accounts (Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'Hospital accounts list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Hospitals'],
        summary: 'Provision hospital account and invite manager (Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '201': {
            description: 'Hospital and manager provisioned with invitation dispatched',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/hospitals/{id}/favorite': {
      post: {
        tags: ['Hospitals'],
        summary: 'Toggle hospital favorite (Parent)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Favorite status toggled',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/hospitals/{hospitalId}/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'List doctors at hospital',
        parameters: [
          { name: 'hospitalId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Doctors list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/DoctorResponse' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Appointments ─────────────────────────────────────────────────────────
    '/api/v1/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT', 'ADMIN'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'childId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Appointments list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AppointmentResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Book appointment',
        description:
          'Creates an appointment booking request with collision prevention and transaction safety.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['childId', 'hospitalId', 'doctorId', 'scheduledAt'],
                properties: {
                  childId: { type: 'string' },
                  hospitalId: { type: 'string' },
                  doctorId: { type: 'string' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  visitReason: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Appointment requested',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/AppointmentResponse' } },
                },
              },
            },
          },
          '409': {
            description: 'Doctor slot already booked or overlapping',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/appointments/doctors/{doctorId}/slots': {
      get: {
        tags: ['Appointments'],
        summary: 'Get doctor available slots',
        parameters: [
          { name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Doctor availability slots',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/DoctorAvailabilityResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/appointments/{appointmentId}/cancel': {
      patch: {
        tags: ['Appointments'],
        summary: 'Cancel appointment',
        parameters: [
          { name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT', 'HOSPITAL'],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { reason: { type: 'string' } } },
            },
          },
        },
        responses: {
          '200': {
            description: 'Appointment cancelled',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/AppointmentResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/appointments/{appointmentId}/reschedule': {
      patch: {
        tags: ['Appointments'],
        summary: 'Reschedule appointment',
        parameters: [
          { name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['scheduledAt'],
                properties: {
                  scheduledAt: { type: 'string', format: 'date-time' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Appointment rescheduled',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/AppointmentResponse' } },
                },
              },
            },
          },
          '409': {
            description: 'Target slot unavailable',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    // ── Hospital Management ──────────────────────────────────────────────────
    '/api/v1/hospital-management/me': {
      get: {
        tags: ['Hospital Management'],
        summary: 'Get hospital management profile',
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        responses: {
          '200': {
            description: 'Hospital manager info',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
      patch: {
        tags: ['Hospital Management'],
        summary: 'Update hospital institution profile',
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateHospitalProfileRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated hospital institution profile',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden: requires HOSPITAL role',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/hospital-management/appointments': {
      get: {
        tags: ['Hospital Management'],
        summary: 'List hospital appointments with filters',
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'doctorId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Hospital appointments list with pagination',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AppointmentResponse' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/hospital-management/appointments/{appointmentId}/status': {
      patch: {
        tags: ['Hospital Management'],
        summary: 'Update appointment status (Confirm / Reject / Complete)',
        parameters: [
          { name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
                  },
                  reason: {
                    type: 'string',
                    maxLength: 2000,
                    description: 'Required when rejecting an appointment',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated and notification dispatched to parent',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/AppointmentResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/hospital-management/doctors': {
      get: {
        tags: ['Hospital Management'],
        summary: 'List doctors in hospital',
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        responses: {
          '200': {
            description: 'Hospital doctors list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/DoctorResponse' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Hospital Management'],
        summary: 'Add doctor to hospital',
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/DoctorResponse' } },
          },
        },
        responses: {
          '201': {
            description: 'Doctor added',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/DoctorResponse' } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/hospital-management/doctors/{doctorId}': {
      patch: {
        tags: ['Hospital Management'],
        summary: 'Update doctor information or schedule parameters',
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': {
            description: 'Doctor updated',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/DoctorResponse' } } },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Hospital Management'],
        summary: 'Remove doctor from hospital',
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['HOSPITAL'],
        responses: {
          '200': {
            description: 'Doctor removed',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },

    // ── Schools ──────────────────────────────────────────────────────────────
    '/api/v1/schools': {
      get: {
        tags: ['Schools'],
        summary: 'List special education schools',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'province', in: 'query', schema: { type: 'string' } },
          { name: 'isFavorite', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          '200': {
            description: 'Schools list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/SchoolResponse' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/cities': {
      get: {
        tags: ['Schools'],
        summary: 'List available school cities',
        responses: {
          '200': {
            description: 'List of unique cities',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'string' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/admin/accounts': {
      get: {
        tags: ['Schools'],
        summary: 'List school accounts (Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'School accounts list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Schools'],
        summary: 'Provision school account and invite staff (Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '201': {
            description: 'School and staff account provisioned',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/me': {
      get: {
        tags: ['Schools'],
        summary: 'Get owning school profile',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Owning school details',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/SchoolResponse' } } },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Schools'],
        summary: 'Update owning school profile',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': {
            description: 'School profile updated',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/SchoolResponse' } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/staff/me': {
      get: {
        tags: ['Schools'],
        summary: 'Get current school staff account profile',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Staff account profile',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/staff': {
      get: {
        tags: ['Schools'],
        summary: "List the school's admin and teachers",
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('Staff members') },
      },
      post: {
        tags: ['Schools'],
        summary: 'Create a teacher account (username and one-time setup code)',
        description: 'School admin only. The setup code is returned once and stored hashed.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '201': dataResponse('Teacher credentials'), '403': dataResponse('Not admin') },
      },
    },
    '/api/v1/schools/staff/{staffId}/setup-code': {
      post: {
        tags: ['Schools'],
        summary: "Replace a teacher's setup code",
        parameters: [pathParam('staffId')],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('New teacher credentials') },
      },
    },
    '/api/v1/schools/staff/{staffId}/deactivate': {
      post: {
        tags: ['Schools'],
        summary: 'Deactivate a teacher (ends their sessions)',
        parameters: [pathParam('staffId')],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('Updated staff member') },
      },
    },
    '/api/v1/schools/staff/{staffId}/reactivate': {
      post: {
        tags: ['Schools'],
        summary: 'Reactivate a teacher',
        parameters: [pathParam('staffId')],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('Updated staff member') },
      },
    },
    '/api/v1/schools/enrollments/{childId}/teachers': {
      put: {
        tags: ['Schools'],
        summary: 'Replace the teachers assigned to an enrolled child',
        parameters: [pathParam('childId')],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('Assigned teachers') },
      },
    },
    '/api/v1/schools/connection-codes': {
      get: {
        tags: ['Schools'],
        summary: 'List open and recent family connection codes',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('Connection codes') },
      },
      post: {
        tags: ['Schools'],
        summary: 'Create a single-use family connection code',
        description: 'The plain code is returned once; only its HMAC is stored.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '201': dataResponse('New connection code') },
      },
    },
    '/api/v1/schools/connection-codes/{codeId}': {
      delete: {
        tags: ['Schools'],
        summary: 'Revoke an open connection code',
        parameters: [pathParam('codeId')],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: { '200': dataResponse('Revoked') },
      },
    },
    '/api/v1/admin/overview': {
      get: {
        tags: ['Admin'],
        summary: 'Platform overview: registrations, pending requests, plans, suspensions',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Overview') },
      },
    },
    '/api/v1/admin/parents': {
      get: {
        tags: ['Admin'],
        summary: 'List parent accounts with plan and child count (no child details)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
          },
        ],
        responses: { '200': dataResponse('Parents page') },
      },
    },
    '/api/v1/admin/accounts/{id}/suspend': {
      post: {
        tags: ['Admin'],
        summary: 'Suspend a non-admin account; it keeps its data but cannot sign in',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Suspended'),
          '400': dataResponse('Administrator accounts cannot be suspended'),
          '404': dataResponse('Account not found'),
        },
      },
    },
    '/api/v1/admin/accounts/{id}/reactivate': {
      post: {
        tags: ['Admin'],
        summary: 'Reactivate a suspended account',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: { '200': dataResponse('Reactivated'), '404': dataResponse('Account not found') },
      },
    },
    '/api/v1/admin/schools': {
      get: {
        tags: ['Admin'],
        summary: 'List schools with Business status, teacher count and sponsored slots',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Schools page') },
      },
    },
    '/api/v1/admin/schools/{id}': {
      patch: {
        tags: ['Admin'],
        summary: "Verify a school's listing, or suspend / restore its access",
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: { '200': dataResponse('Updated school'), '404': dataResponse('Not found') },
      },
    },
    '/api/v1/admin/staff': {
      get: {
        tags: ['Admin'],
        summary: 'List school staff (admins and teachers) across all schools',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Staff page') },
      },
    },
    '/api/v1/admin/sponsorships': {
      get: {
        tags: ['Admin'],
        summary: 'Sponsored Pro slot usage for every school',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Per-school sponsorship counts') },
      },
    },
    '/api/v1/admin/audit': {
      get: {
        tags: ['Admin'],
        summary: 'Search the audit log by action, date range, target email or id',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Audit page') },
      },
    },
    '/api/v1/admin/announcements': {
      get: {
        tags: ['Admin'],
        summary: 'List announcements (drafts, published and archived)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Announcements') },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create an announcement for parents, schools, teachers or everyone',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '201': dataResponse('Created announcement') },
      },
    },
    '/api/v1/admin/announcements/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Edit, publish, schedule or archive an announcement',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Updated announcement'),
          '404': dataResponse('Not found'),
        },
      },
    },
    '/api/v1/announcements': {
      get: {
        tags: ['Admin'],
        summary: "The live announcements for the signed-in user's audience",
        security: [{ cookieAuth: [] }],
        responses: { '200': dataResponse('Visible announcements') },
      },
    },
    '/api/v1/admin/partnerships': {
      get: {
        tags: ['Admin'],
        summary: 'List partnerships, soonest follow-up first',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Partnerships') },
      },
      post: {
        tags: ['Admin'],
        summary: 'Record a potential or active partner organization',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '201': dataResponse('Created partnership') },
      },
    },
    '/api/v1/admin/partnerships/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Update a partnership status, contact, follow-up date or notes',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: { '200': dataResponse('Updated partnership'), '404': dataResponse('Not found') },
      },
    },
    '/api/v1/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Monthly growth: registrations, plans, questionnaires, AI use (counts only)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [{ name: 'months', in: 'query', required: false, schema: { type: 'integer' } }],
        responses: { '200': dataResponse('Analytics') },
      },
    },
    '/api/v1/admin/activities': {
      get: {
        tags: ['Admin'],
        summary: 'List every activity, including drafts and archived ones',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Activities') },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create an activity (draft or published)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '201': dataResponse('Created activity') },
      },
    },
    '/api/v1/admin/activities/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Edit, publish or archive an activity',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: { '200': dataResponse('Updated activity'), '404': dataResponse('Not found') },
      },
    },
    '/api/v1/admin/questionnaire': {
      get: {
        tags: ['Admin'],
        summary: 'Every question version with answer counts, and completion statistics',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '200': dataResponse('Questionnaire') },
      },
    },
    '/api/v1/admin/questions': {
      post: {
        tags: ['Admin'],
        summary: 'Add a question to a form and age band',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: { '201': dataResponse('Created question') },
      },
    },
    '/api/v1/admin/questions/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Publish an edit as a new version; the old wording is kept for past answers',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('New version'),
          '400': dataResponse('Not the current version'),
          '404': dataResponse('Not found'),
        },
      },
    },
    '/api/v1/admin/questions/{id}/archive': {
      post: {
        tags: ['Admin'],
        summary: 'Remove a question from new questionnaires',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: { '200': dataResponse('Archived question') },
      },
    },
    '/api/v1/admin/questions/{id}/restore': {
      post: {
        tags: ['Admin'],
        summary: 'Bring an archived question back (only the latest version)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Restored question'),
          '400': dataResponse('Newer version exists'),
        },
      },
    },
    '/api/v1/admin/ai': {
      get: {
        tags: ['Admin'],
        summary: 'AI assistant usage, response times and safety rules (no conversation text)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [{ name: 'days', in: 'query', required: false, schema: { type: 'integer' } }],
        responses: { '200': dataResponse('AI monitoring') },
      },
    },
    '/api/v1/subscriptions/me': {
      get: {
        tags: ['Subscriptions'],
        summary: "The parent's plan (Free or Pro), child limit and open sponsorship offers",
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: { '200': dataResponse('Parent plan') },
      },
    },
    '/api/v1/subscriptions/offers/{id}/accept': {
      post: {
        tags: ['Subscriptions'],
        summary: "Accept a school's sponsored Pro offer with the parent's own account",
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Updated parent plan'),
          '404': dataResponse('Offer not found or no longer open'),
          '409': dataResponse("Already sponsored, or the school's plan is not active"),
        },
      },
    },
    '/api/v1/subscriptions/offers/{id}/decline': {
      post: {
        tags: ['Subscriptions'],
        summary: "Decline a school's sponsored Pro offer",
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Updated parent plan'),
          '404': dataResponse('Offer not found or no longer open'),
        },
      },
    },
    '/api/v1/subscriptions/sponsorship/leave': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Give up a sponsored Pro account (no data is removed)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': dataResponse('Updated parent plan'),
          '404': dataResponse('No sponsored account'),
        },
      },
    },
    '/api/v1/subscriptions/school': {
      get: {
        tags: ['Subscriptions'],
        summary: "The school's Business plan and its five sponsored Pro family slots",
        description: 'Shows slot status only; never child data.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': dataResponse('School subscription'),
          '403': dataResponse('School admin only'),
        },
      },
    },
    '/api/v1/subscriptions/school/sponsorships': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Offer a sponsored Pro account to a parent by email',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '201': dataResponse('Updated school subscription'),
          '403': dataResponse('No active Business plan, or all slots in use'),
          '409': dataResponse('This email already has an open offer'),
        },
      },
    },
    '/api/v1/subscriptions/school/sponsorships/{id}/withdraw': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Withdraw an offer or end a sponsored account',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Updated school subscription'),
          '404': dataResponse('Not found or already ended'),
        },
      },
    },
    '/api/v1/admin/subscriptions': {
      get: {
        tags: ['Subscriptions'],
        summary: 'List subscriptions (newest first)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'plan',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['PRO', 'BUSINESS'] },
          },
        ],
        responses: { '200': dataResponse('Subscriptions') },
      },
      post: {
        tags: ['Subscriptions'],
        summary: 'Record a Pro or Business plan by hand (no payment provider yet)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '201': dataResponse('Created subscription'),
          '404': dataResponse('Parent or school not found'),
          '409': dataResponse('The account already has a running plan'),
        },
      },
    },
    '/api/v1/admin/subscriptions/{id}': {
      patch: {
        tags: ['Subscriptions'],
        summary: 'Change a subscription status or paid-through date (never deletes data)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': dataResponse('Updated subscription'),
          '400': dataResponse('Transition not allowed'),
        },
      },
    },
    '/api/v1/connections': {
      get: {
        tags: ['Connections'],
        summary: "List the schools each of the parent's children is connected to",
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: { '200': dataResponse('Connections') },
      },
      post: {
        tags: ['Connections'],
        summary: 'Connect a child to a school with a connection code (requires consent)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '201': dataResponse('New connection'),
          '400': dataResponse('Code not valid'),
          '409': dataResponse('Already connected'),
        },
      },
    },
    '/api/v1/connections/preview': {
      post: {
        tags: ['Connections'],
        summary: 'Show which school a connection code belongs to',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: { '200': dataResponse('School preview'), '400': dataResponse('Code not valid') },
      },
    },
    '/api/v1/connections/{enrollmentId}': {
      delete: {
        tags: ['Connections'],
        summary: "End a child's connection to a school",
        parameters: [pathParam('enrollmentId')],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: { '200': dataResponse('Disconnected') },
      },
    },
    '/api/v1/auth/staff-setup': {
      post: {
        tags: ['Auth'],
        summary: 'First sign-in for a school-managed teacher (username, setup code, new password)',
        responses: {
          '200': dataResponse('Signed in; session cookies set'),
          '400': dataResponse('Username and setup code do not match'),
        },
      },
    },
    '/api/v1/screening/children/{childId}/latest': {
      get: {
        tags: ['Screening'],
        summary: 'Latest screening of a form kind for a child (e.g. the short check-in)',
        parameters: [
          pathParam('childId'),
          {
            name: 'formKind',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['FULL', 'SHORT'] },
          },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: { '200': dataResponse('Latest screening, or null') },
      },
    },
    '/api/v1/schools/my-profile': {
      get: {
        tags: ['Schools'],
        summary: 'Get staff personal profile in school',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Staff profile',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
      patch: {
        tags: ['Schools'],
        summary: 'Update staff personal profile in school',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': {
            description: 'Staff profile updated',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/me/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get school operational dashboard metrics',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'School dashboard metrics',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/{id}': {
      get: {
        tags: ['Schools'],
        summary: 'Get school profile detail',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'School profile detail',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/SchoolResponse' } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/{id}/favorites': {
      post: {
        tags: ['Schools'],
        summary: 'Favorite school (Parent)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'School favorited',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
      delete: {
        tags: ['Schools'],
        summary: 'Unfavorite school (Parent)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'School unfavorited',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/{id}/reviews': {
      get: {
        tags: ['Schools'],
        summary: 'List school reviews',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT', 'ADMIN', 'SCHOOL'],
        responses: {
          '200': {
            description: 'School reviews list',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
      post: {
        tags: ['Schools'],
        summary: 'Submit school review (Parent)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating'],
                properties: {
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Review created',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/{schoolId}': {
      patch: {
        tags: ['Schools'],
        summary: 'Update school (Admin)',
        parameters: [{ name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  city: { type: 'string' },
                  address: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  isVerified: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'School profile updated',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/SchoolResponse' } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/{schoolId}/enrollments': {
      post: {
        tags: ['Enrollments'],
        summary: 'Request student enrollment (Parent)',
        parameters: [{ name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['childId'],
                properties: { childId: { type: 'string' }, notes: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Enrollment requested',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/{schoolId}/enrollments/{childId}': {
      delete: {
        tags: ['Enrollments'],
        summary: 'Withdraw enrollment (Parent / School)',
        parameters: [
          { name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'childId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Enrollment withdrawn',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },

    // ── School Enrollments Portal ────────────────────────────────────────────
    '/api/v1/schools/enrollments': {
      get: {
        tags: ['Enrollments'],
        summary: 'List school student enrollments',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Enrollments list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/enrollments/specialists': {
      get: {
        tags: ['Enrollments'],
        summary: 'List school specialists for assignment',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'School specialists list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/enrollments/stats': {
      get: {
        tags: ['Enrollments'],
        summary: 'Get enrollment summary statistics',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Enrollment statistics',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/enrollments/students': {
      get: {
        tags: ['Enrollments'],
        summary: 'Get paginated enrolled students with filters',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'specialistId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': {
            description: 'Enrolled students page',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
      post: {
        tags: ['Enrollments'],
        summary: 'Directly enroll new student',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '201': {
            description: 'Student enrolled',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/enrollments/{childId}': {
      patch: {
        tags: ['Enrollments'],
        summary: 'Update student enrollment details',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': {
            description: 'Enrollment updated',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
      delete: {
        tags: ['Enrollments'],
        summary: 'Remove student from school enrollment',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Student removed from enrollment',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/enrolled-students': {
      get: {
        tags: ['Enrollments'],
        summary: 'List enrolled students dropdown options',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Students list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/my-students': {
      get: {
        tags: ['Enrollments'],
        summary: 'List students assigned to current specialist',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Assigned students list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },

    // ── Reports & Uploads ────────────────────────────────────────────────────
    '/api/v1/schools/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List activity reports for school',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'childId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Activity reports list with pagination',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityReportResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Reports'],
        summary: 'Create activity report',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ActivityReportResponse' } },
          },
        },
        responses: {
          '201': {
            description: 'Report created',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ActivityReportResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get activity report detail',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Activity report detail',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ActivityReportResponse' } },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Reports'],
        summary: 'Update activity report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': {
            description: 'Report updated',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ActivityReportResponse' } },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Reports'],
        summary: 'Delete activity report',
        description: 'Deletes report and securely removes all attached files from object storage.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Report and attachments deleted',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/reports/{id}/attachments/{filename}': {
      get: {
        tags: ['Reports'],
        summary: 'Download report attachment',
        description:
          'Authorized streaming download. Verifies caller is the owning school or the enrolled child’s parent.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'filename', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL', 'PARENT'],
        responses: {
          '200': {
            description: 'File binary stream',
            content: {
              'image/png': { schema: { type: 'string', format: 'binary' } },
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'application/pdf': { schema: { type: 'string', format: 'binary' } },
            },
          },
          '403': {
            description: 'Unauthorized download attempt',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/schools/upload/activity-photos': {
      post: {
        tags: ['Reports'],
        summary: 'Upload activity photos',
        description:
          'Multipart form-data upload with magic-byte file signature validation and 5MB limit.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['photos'],
                properties: {
                  photos: { type: 'array', items: { type: 'string', format: 'binary' } },
                  sessionId: { type: 'string', description: 'Temporary upload session identifier' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Photos uploaded successfully',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/upload/activity-files': {
      post: {
        tags: ['Reports'],
        summary: 'Upload activity documents',
        description: 'Multipart upload for PDF and document attachments with signature validation.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: { type: 'array', items: { type: 'string', format: 'binary' } },
                  sessionId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Documents uploaded',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },

    // ── Notifications ────────────────────────────────────────────────────────
    '/api/v1/schools/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List school notifications',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'School notifications list',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NotificationResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/schools/notifications/{id}/decision': {
      patch: {
        tags: ['Notifications'],
        summary: 'Record admission decision from notification',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision'],
                properties: { decision: { type: 'string', enum: ['ACCEPT', 'REJECT'] } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Decision recorded',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark school notification read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'Notification marked read',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/schools/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all school notifications read',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'All notifications marked read',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/parents/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List parent notifications',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        parameters: [
          { name: 'unread', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Parent notifications list with unread counts',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NotificationResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/parents/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark parent notification read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Notification marked read',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/parents/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all parent notifications read',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'All notifications marked read',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },

    '/api/v1/parents/notifications/{id}/archive': {
      patch: {
        tags: ['Notifications'],
        summary: 'Archive parent notification',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Notification archived',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    // ── Parent Specialized Endpoints ─────────────────────────────────────────
    '/api/v1/parents/activity-reports/{childId}': {
      get: {
        tags: ['Reports'],
        summary: 'Get activity reports for enrolled child (Parent)',
        parameters: [{ name: 'childId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Activity reports for parent child',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityReportResponse' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/parents/enrollment-requests': {
      get: {
        tags: ['Enrollments'],
        summary: 'List parent enrollment requests',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Parent enrollment requests',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Enrollments'],
        summary: 'Create school enrollment request',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '201': {
            description: 'Enrollment requested',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/parents/me/admission-requests': {
      get: {
        tags: ['Enrollments'],
        summary: 'List parent submitted admission requests with school details',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'Parent admission requests',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/parents/preferences': {
      get: {
        tags: ['Parents'],
        summary: 'Get accessibility and localization preferences',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Parent preferences',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        preference: { $ref: '#/components/schemas/ParentPreference' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      patch: {
        tags: ['Parents'],
        summary: 'Update accessibility and localization preferences',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateParentPreferencesRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Preferences updated',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        preference: { $ref: '#/components/schemas/ParentPreference' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    // ── Dashboard ────────────────────────────────────────────────────────────
    '/api/v1/dashboard/parent': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get parent dashboard metrics',
        description:
          'Returns real metrics, screening summary, upcoming appointments, and activity completion.',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        parameters: [
          {
            name: 'childId',
            in: 'query',
            description: 'Optional ID of a child to personalize metrics for',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Parent dashboard payload',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/ParentDashboardResponse' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/dashboard/admin': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get system administration dashboard metrics',
        security: [{ cookieAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'Admin dashboard payload',
            content: {
              'application/json': {
                schema: {
                  properties: { data: { $ref: '#/components/schemas/AdminDashboardResponse' } },
                },
              },
            },
          },
        },
      },
    },

    // ── School Registrations ──────────────────────────────────────────────────
    '/api/v1/school-registrations': {
      post: {
        tags: ['School Registrations'],
        summary: 'Submit a school registration request',
        description:
          'Public submission for schools requesting an AutiCare account. Responds 202 to prevent email enumeration.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SchoolRegistrationRequest' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Request received',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        received: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/school-registrations': {
      get: {
        tags: ['Admin', 'School Registrations'],
        summary: 'List school registration requests',
        description: 'Admin endpoint to view registration requests, newest first.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of school registration requests',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SchoolRegistration' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/school-registrations/pending-count': {
      get: {
        tags: ['Admin', 'School Registrations'],
        summary: 'Get pending registration count',
        description:
          'Returns the number of pending school registration requests for admin navigation badges.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'Pending request count',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        count: { type: 'integer', example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/school-registrations/{id}/approve': {
      post: {
        tags: ['Admin', 'School Registrations'],
        summary: 'Approve a school registration request',
        description:
          'Atomically claims a pending request, provisions the school organization, staff account and invitation email.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': {
            description: 'Registration request approved and school provisioned',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        approved: { type: 'boolean', example: true },
                        schoolId: { type: 'string', example: 'cuid_school_123' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Request not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Request already reviewed or email conflict',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/school-registrations/{id}/reject': {
      post: {
        tags: ['Admin', 'School Registrations'],
        summary: 'Reject a school registration request',
        description:
          'Atomically claims a pending request, records the rejection reason, and notifies the applicant by email.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RejectSchoolRegistrationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Registration request rejected',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        rejected: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Request already reviewed',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    // ── Hospital Registrations ────────────────────────────────────────────────
    '/api/v1/hospital-registrations': {
      post: {
        tags: ['Hospital Registrations'],
        summary: 'Submit a hospital registration request',
        description:
          'Public submission for hospitals requesting an AutiCare account. Responds 202 to prevent email enumeration.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HospitalRegistrationRequest' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Request received',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        received: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/hospital-registrations': {
      get: {
        tags: ['Admin', 'Hospital Registrations'],
        summary: 'List hospital registration requests',
        description: 'Admin endpoint to view registration requests, newest first.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of hospital registration requests',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/HospitalRegistration' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error (unknown status query parameter)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/hospital-registrations/pending-count': {
      get: {
        tags: ['Admin', 'Hospital Registrations'],
        summary: 'Get pending registration count',
        description:
          'Returns the number of pending hospital registration requests for admin navigation badges.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        responses: {
          '200': {
            description: 'Pending request count',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        count: { type: 'integer', example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/hospital-registrations/{id}/approve': {
      post: {
        tags: ['Admin', 'Hospital Registrations'],
        summary: 'Approve a hospital registration request',
        description:
          'Atomically claims a pending request, provisions the hospital organization, staff account and invitation email.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        responses: {
          '200': {
            description: 'Registration request approved and hospital provisioned',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        approved: { type: 'boolean', example: true },
                        hospitalId: { type: 'string', example: 'cuid_hospital_123' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Request not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Request already reviewed or email conflict',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/admin/hospital-registrations/{id}/reject': {
      post: {
        tags: ['Admin', 'Hospital Registrations'],
        summary: 'Reject a hospital registration request',
        description:
          'Atomically claims a pending request, records the rejection reason, and notifies the applicant by email.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['ADMIN'],
        parameters: [pathParam('id')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RejectHospitalRegistrationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Registration request rejected',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        rejected: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - ADMIN role required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Request already reviewed',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },

    // ── Inquiries ─────────────────────────────────────────────────────────────
    '/api/v1/inquiries': {
      post: {
        tags: ['Inquiries'],
        summary: 'Create inquiry to school or hospital (Parent)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                  schoolId: { type: 'string' },
                  hospitalId: { type: 'string' },
                  childFirstName: { type: 'string' },
                  subject: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Inquiry created',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },
    '/api/v1/inquiries/mine': {
      get: {
        tags: ['Inquiries'],
        summary: 'List my inquiries (Parent)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['PARENT'],
        responses: {
          '200': {
            description: 'List of inquiries',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/inquiries/school': {
      get: {
        tags: ['Inquiries'],
        summary: 'List school inquiries (School Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        responses: {
          '200': {
            description: 'School inquiries list',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { type: 'object' } } } },
              },
            },
          },
        },
      },
    },
    '/api/v1/inquiries/school/{id}/read': {
      post: {
        tags: ['Inquiries'],
        summary: 'Mark school inquiry as read (School Admin)',
        security: [{ cookieAuth: [] }],
        'x-roles': ['SCHOOL'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Inquiry marked as read',
            content: {
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
            },
          },
        },
      },
    },

    // ── Hospital Team ─────────────────────────────────────────────────────────
    '/api/v1/hospital/staff': {
      get: {
        tags: ['Hospital Team'],
        summary: 'List hospital staff accounts',
        description: 'Lists all coordinators, doctors, and admin staff for the callers hospital.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['HOSPITAL'],
        responses: {
          '200': {
            description: 'List of hospital staff members',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/HospitalStaffMember' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - Hospital Admin required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
      post: {
        tags: ['Hospital Team'],
        summary: 'Create a hospital staff member (Coordinator or Doctor)',
        description:
          'Provisions a staff account, generates a unique username and a short setup code valid for 72 hours.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['HOSPITAL'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHospitalStaffRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Staff account created with setup credentials',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        staff: { $ref: '#/components/schemas/HospitalStaffMember' },
                        username: { type: 'string', example: 'sdara' },
                        setupCode: { type: 'string', example: '123-456' },
                        expiresAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-10-31T10:00:00.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error (e.g. doctorId missing for DOCTOR role)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - Hospital Admin required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Conflict (doctor already linked)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/hospital/staff/{id}/setup-code': {
      post: {
        tags: ['Hospital Team'],
        summary: 'Issue new setup code for a staff member',
        description: 'Revokes open setup invitations and issues a new 72-hour setup code.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['HOSPITAL'],
        parameters: [pathParam('id')],
        responses: {
          '200': {
            description: 'New setup code issued',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        setupCode: { type: 'string', example: '123-456' },
                        expiresAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-10-31T10:00:00.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - Hospital Admin required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Staff member not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Cannot issue code to active or deactivated account',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/hospital/staff/{id}/deactivate': {
      post: {
        tags: ['Hospital Team'],
        summary: 'Deactivate a hospital staff member',
        description: 'Deactivates the staff member and revokes active refresh tokens.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['HOSPITAL'],
        parameters: [pathParam('id')],
        responses: {
          '200': {
            description: 'Staff member deactivated',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        deactivated: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - Hospital Admin required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Staff member not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '409': {
            description: 'Cannot deactivate yourself or another admin',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
    '/api/v1/hospital/staff/{id}/reactivate': {
      post: {
        tags: ['Hospital Team'],
        summary: 'Reactivate a deactivated hospital staff member',
        description: 'Restores access for a deactivated staff member.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        'x-roles': ['HOSPITAL'],
        parameters: [pathParam('id')],
        responses: {
          '200': {
            description: 'Staff member reactivated',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    data: {
                      properties: {
                        reactivated: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '403': {
            description: 'Forbidden - Hospital Admin required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Staff member not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiErrorEnvelope' } },
            },
          },
        },
      },
    },
  },
};
