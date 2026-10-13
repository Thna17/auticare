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
        required: ['token', 'password', 'firstName', 'lastName'],
        properties: {
          token: { type: 'string', example: 'invitation_token_abc' },
          password: { type: 'string', minLength: 12, example: 'StaffPassword123!' },
          firstName: { type: 'string', minLength: 1, example: 'Michael' },
          lastName: { type: 'string', minLength: 1, example: 'Chang' },
        },
      },
      ResendInvitationRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'invited.staff@school.org' },
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
          'Creates a new parent account with secure argon2 password hashing and establishes an authenticated session.',
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
        description: 'Sets staff password and completes invitation onboarding.',
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
              'application/json': { schema: { properties: { data: { type: 'object' } } } },
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
  },
};
