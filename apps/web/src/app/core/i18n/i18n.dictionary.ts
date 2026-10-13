export type SupportedLanguage = 'km' | 'en';

export interface TranslationDictionary {
  readonly nav: {
    readonly home: string;
    readonly screening: string;
    readonly activities: string;
    readonly appointments: string;
    readonly progress: string;
    readonly schools: string;
    readonly hospitals: string;
    readonly settings: string;
    readonly crisis: string;
    readonly help: string;
    readonly notifications: string;
    readonly families: string;
    readonly students: string;
    readonly doctors: string;
    readonly profile: string;
    readonly myChildren: string;
    readonly reports: string;
  };
  readonly common: {
    readonly save: string;
    readonly cancel: string;
    readonly back: string;
    readonly next: string;
    readonly confirm: string;
    readonly delete: string;
    readonly edit: string;
    readonly submit: string;
    readonly loading: string;
    readonly filter: string;
    readonly search: string;
    readonly close: string;
    readonly viewDetails: string;
    readonly all: string;
    readonly today: string;
    readonly daysAgo: string;
    readonly languageToggle: string;
    readonly khmer: string;
    readonly english: string;
    readonly status: string;
    readonly actions: string;
    readonly select: string;
    readonly required: string;
    readonly optional: string;
    readonly noData: string;
  };
  readonly auth: {
    readonly signIn: string;
    readonly signUp: string;
    readonly signOut: string;
    readonly email: string;
    readonly password: string;
    readonly welcomeBack: string;
    readonly createAccount: string;
  };
  readonly child: {
    readonly viewingCareFor: string;
    readonly addChild: string;
    readonly latestScreening: string;
    readonly concernLevel: string;
    readonly streak: string;
    readonly milestones: string;
    readonly age: string;
    readonly dateOfBirth: string;
    readonly yearsOld: string;
    readonly monthsOld: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly gender?: string;
    readonly medicalNotes?: string;
    readonly cancel?: string;
    readonly saveChild?: string;
  };
  readonly risk: {
    readonly lowConcern: string;
    readonly moderateConcern: string;
    readonly elevatedConcern: string;
  };
  readonly status: {
    readonly active: string;
    readonly pending: string;
    readonly confirmed: string;
    readonly completed: string;
    readonly cancelled: string;
    readonly draft: string;
    readonly published: string;
  };
  readonly crisis: {
    readonly emergencyBannerTitle: string;
    readonly emergencyBannerText: string;
    readonly call119: string;
    readonly call1280: string;
    readonly tpoHotline: string;
    readonly nphTitle: string;
    readonly kanthaBophaTitle: string;
    readonly rabbitSchoolTitle: string;
  };
  readonly dashboard: {
    readonly welcomeTitle: string;
    readonly welcomeSubtitle: string;
    readonly startScreening: string;
    readonly bookSpecialist: string;
    readonly sensoryPlay: string;
    readonly growthTrajectory: string;
  };
  readonly screening: {
    readonly start: string;
    readonly history: string;
    readonly questionnaire: string;
    readonly questionGuidance: string;
    readonly guidanceTip: string;
    readonly previousQuestion: string;
    readonly nextQuestion: string;
    readonly finalQuestion: string;
    readonly submitAssessment: string;
    readonly disclaimer: string;
    readonly completionMessage: string;
    readonly scaleNever: string;
    readonly scaleRarely: string;
    readonly scaleSometimes: string;
    readonly scaleOften: string;
    readonly scaleAlways: string;
    readonly ageBands: {
      readonly toddler: string;
      readonly preschool: string;
      readonly child: string;
    };
    readonly categories: {
      readonly social: string;
      readonly communication: string;
      readonly sensory: string;
      readonly play: string;
      readonly routine: string;
    };
    readonly resultsTitle: string;
    readonly riskLevel: string;
    readonly pediatricianAdvice: string;
    readonly downloadPdf: string;
    readonly retake: string;
    readonly backToScreening: string;
  };
  readonly activities: {
    readonly title: string;
    readonly subtitle: string;
    readonly searchPlaceholder: string;
    readonly categories: {
      readonly all: string;
      readonly sensory: string;
      readonly communication: string;
      readonly calming: string;
      readonly daily: string;
      readonly grossMotor: string;
      readonly fineMotor: string;
    };
    readonly sensoryIntensity: {
      readonly low: string;
      readonly medium: string;
      readonly high: string;
    };
    readonly ageFilters: {
      readonly allAges: string;
      readonly toddler: string;
      readonly preschool: string;
      readonly schoolAge: string;
    };
    readonly materials: string;
    readonly steps: string;
    readonly reflectionPrompts: string;
    readonly milestoneCompleted: string;
    readonly markComplete: string;
    readonly timers: {
      readonly start: string;
      readonly pause: string;
      readonly reset: string;
      readonly minRemaining: string;
    };
  };
  readonly appointments: {
    readonly bookingTitle: string;
    readonly bookingSubtitle: string;
    readonly doctorSpecialties: {
      readonly developmentalPediatrician: string;
      readonly speechTherapist: string;
      readonly occupationalTherapist: string;
      readonly childPsychologist: string;
      readonly specialEducator: string;
    };
    readonly selectDate: string;
    readonly selectTime: string;
    readonly reasonForVisit: string;
    readonly confirmedBadge: string;
    readonly cancellationPrompt: string;
    readonly noAppointments: string;
    readonly bookNow: string;
  };
  readonly hospitals: {
    readonly title: string;
    readonly subtitle: string;
    readonly searchPlaceholder: string;
    readonly servicesOffered: string;
    readonly viewDoctors: string;
    readonly partnerVerified: string;
  };
  readonly schools: {
    readonly directoryTitle: string;
    readonly directorySubtitle: string;
    readonly searchPlaceholder: string;
    readonly provinces: {
      readonly phnomPenh: string;
      readonly kandal: string;
      readonly siemReap: string;
      readonly battambang: string;
      readonly all: string;
    };
    readonly ratio: string;
    readonly waitlistLabel: string;
    readonly immediate: string;
    readonly waitlist: string;
    readonly facilities: string;
    readonly inclusionRating: string;
    readonly reportCards: string;
    readonly enrollmentRequest: string;
  };
  readonly progress: {
    readonly title: string;
    readonly subtitle: string;
    readonly domains: {
      readonly communication: string;
      readonly motor: string;
      readonly cognitive: string;
      readonly social: string;
      readonly sensory: string;
    };
    readonly milestoneTimeline: string;
    readonly parentObservations: string;
    readonly streakLabel: string;
    readonly growthTrajectory: string;
    readonly addObservation: string;
  };
  readonly landing: {
    readonly heroTitle: string;
    readonly heroSubtitle: string;
    readonly getStarted: string;
    readonly learnMore: string;
    readonly clinicalCredentials: string;
    readonly progressionSteps: {
      readonly step1Title: string;
      readonly step1Desc: string;
      readonly step2Title: string;
      readonly step2Desc: string;
      readonly step3Title: string;
      readonly step3Desc: string;
      readonly step4Title: string;
      readonly step4Desc: string;
    };
    readonly trustBadges: {
      readonly evidenceTitle: string;
      readonly evidenceDesc: string;
      readonly privacyTitle: string;
      readonly privacyDesc: string;
      readonly teamTitle: string;
      readonly teamDesc: string;
      readonly sensoryTitle: string;
      readonly sensoryDesc: string;
    };
    readonly toolCards: {
      readonly screeningTitle: string;
      readonly screeningDesc: string;
      readonly specialistsTitle: string;
      readonly specialistsDesc: string;
      readonly activitiesTitle: string;
      readonly activitiesDesc: string;
      readonly progressTitle: string;
      readonly progressDesc: string;
    };
    readonly ctaExplore: string;
  };
  readonly notifications: {
    readonly title: string;
    readonly emptyNotice: string;
    readonly markAsRead: string;
    readonly appointmentReminders: string;
    readonly screeningAlerts: string;
    readonly schoolUpdates: string;
  };
  readonly settings: {
    readonly title: string;
    readonly profileSettings: string;
    readonly languageLabel: string;
    readonly notificationPreferences: string;
    readonly saveSuccess: string;
    readonly changePassword: string;
    readonly theme: string;
  };
  readonly shell: {
    readonly skipToContent: string;
    readonly expandSidebar: string;
    readonly collapseSidebar: string;
    readonly toggleNav: string;
    readonly crisisAndUrgent: string;
    readonly accountSettings: string;
    readonly helpCenter: string;
    readonly crisisSupport: string;
    readonly signOut: string;
    readonly userAccountMenu: string;
    readonly unreadNotifications: string;
    readonly notifications: string;
    readonly careAndDevelopment: string;
    readonly directoryAndVisits: string;
    readonly support: string;
    readonly overview: string;
    readonly myChildren: string;
    readonly screening: string;
    readonly activities: string;
    readonly progress: string;
    readonly appointments: string;
    readonly schools: string;
    readonly hospitals: string;
    readonly familyRecords: string;
    readonly schoolProfile: string;
    readonly hospitalProfile: string;
    readonly students: string;
    readonly reports: string;
    readonly schoolReports: string;
    readonly doctors: string;
    readonly newScreening: string;
    readonly createSchoolAccount: string;
    readonly addActivity: string;
    readonly manageAppointments: string;
    readonly parentAccount: string;
    readonly adminAccount: string;
    readonly schoolAccount: string;
    readonly hospitalAccount: string;
    readonly familyPortal: string;
    readonly adminPortal: string;
    readonly educationPortal: string;
    readonly clinicalCare: string;
    readonly highContrast: string;
    readonly calmSensory: string;
    readonly reducedMotion: string;
    readonly sensoryPreferenceTitle: string;
    readonly switchToKhmer: string;
    readonly switchToEnglish: string;
    readonly closeDrawer: string;
    readonly autiCareUser: string;
  };
}

export const DICTIONARY: Record<SupportedLanguage, TranslationDictionary> = {
  km: {
    nav: {
      home: 'ទំព័រដើម',
      screening: 'ការវាយតម្លៃ',
      activities: 'សកម្មភាពលេង',
      appointments: 'ការណាត់ជួប',
      progress: 'វឌ្ឍនភាព',
      schools: 'សាលារៀន',
      hospitals: 'មន្ទីរពេទ្យ',
      settings: 'ការកំណត់',
      crisis: 'ជំនួយបន្ទាន់',
      help: 'មជ្ឈមណ្ឌលជំនួយ',
      notifications: 'ការជូនដំណឹង',
      families: 'គ្រួសារ',
      students: 'សិស្សានុសិស្ស',
      doctors: 'វេជ្ជបណ្ឌិត',
      profile: 'ព័ត៌មានផ្ទាល់ខ្លួន',
      myChildren: 'កុមាររបស់ខ្ញុំ',
      reports: 'របាយការណ៍',
    },
    common: {
      save: 'រក្សាទុក',
      cancel: 'បោះបង់',
      back: 'ត្រឡប់ក្រោយ',
      next: 'បន្ទាប់',
      confirm: 'បញ្ជាក់',
      delete: 'លុប',
      edit: 'កែសម្រួល',
      submit: 'ដាក់ស្នើ',
      loading: 'កំពុងដំណើរការ...',
      filter: 'ចម្រាញ់',
      search: 'ស្វែងរក',
      close: 'បិទ',
      viewDetails: 'មើលលម្អិត',
      all: 'ទាំងអស់',
      today: 'ថ្ងៃនេះ',
      daysAgo: 'ថ្ងៃមុន',
      languageToggle: 'ប្តូរភាសា',
      khmer: 'ភាសាខ្មែរ',
      english: 'English',
      status: 'ស្ថានភាព',
      actions: 'សកម្មភាព',
      select: 'ជ្រើសរើស',
      required: 'ទាមទារ',
      optional: 'ជម្រើស',
      noData: 'មិនមានទិន្នន័យ',
    },
    auth: {
      signIn: 'ចូលប្រើប្រាស់',
      signUp: 'បង្កើតគណនី',
      signOut: 'ចាកចេញ',
      email: 'អ៊ីមែល',
      password: 'ពាក្យសម្ងាត់',
      welcomeBack: 'សូមស្វាគមន៍ការត្រឡប់មកវិញ',
      createAccount: 'បង្កើតគណនីថ្មី',
    },
    child: {
      viewingCareFor: 'កំពុងមើលការថែទាំសម្រាប់៖',
      addChild: 'បន្ថែមទិន្នន័យកុមារ',
      latestScreening: 'ការវាយតម្លៃចុងក្រោយ',
      concernLevel: 'កម្រិតនៃការបារម្ភ',
      streak: 'សកម្មភាពបន្តបន្ទាប់',
      milestones: 'ការវិវត្តសំខាន់ៗ',
      age: 'អាយុ',
      dateOfBirth: 'ថ្ងៃខែឆ្នាំកំណើត',
      yearsOld: 'ឆ្នាំ',
      monthsOld: 'ខែ',
      firstName: 'នាមខ្លួន',
      lastName: 'គោត្តនាម',
      gender: 'ភេទ',
      medicalNotes: 'កំណត់ត្រាវេជ្ជសាស្ត្រ',
      cancel: 'បោះបង់',
      saveChild: 'រក្សាទុកទិន្នន័យកុមារ',
    },
    risk: {
      lowConcern: 'ការបារម្ភកម្រិតទាប',
      moderateConcern: 'ការបារម្ភកម្រិតមធ្យម',
      elevatedConcern: 'ការបារម្ភកម្រិតខ្ពស់',
    },
    status: {
      active: 'សកម្ម',
      pending: 'កំពុងរង់ចាំ',
      confirmed: 'បានបញ្ជាក់',
      completed: 'បានបញ្ចប់',
      cancelled: 'បានបោះបង់',
      draft: 'ព្រាង',
      published: 'បានផ្សព្វផ្សាយ',
    },
    crisis: {
      emergencyBannerTitle: 'សង្គ្រោះបន្ទាន់ផ្នែកវេជ្ជសាស្ត្រ ឬសុវត្ថិភាពភ្លាមៗ',
      emergencyBannerText:
        'ប្រសិនបើកុមារ ឬសមាជិកគ្រួសារស្ថិតក្នុងគ្រោះថ្នាក់បន្ទាន់ សូមទូរស័ព្ទទៅកាន់លេខ ១១៩ ឬទៅកាន់មន្ទីរពេទ្យដែលនៅជិតបំផុត។',
      call119: 'ហៅទូរស័ព្ទទៅលេខ ១១៩ (សង្គ្រោះបន្ទាន់)',
      call1280: 'ហៅទូរស័ព្ទទៅលេខ ១២៨០ (ជំនួយកុមារ)',
      tpoHotline: 'ទូរស័ព្ទទាន់ហេតុការណ៍ TPO (សុខភាពផ្លូវចិត្ត)',
      nphTitle: 'មន្ទីរពេទ្យកុមារជាតិ (ភ្នំពេញ)',
      kanthaBophaTitle: 'មន្ទីរពេទ្យគន្ធបុប្ផា (ភ្នំពេញ និងសៀមរាប)',
      rabbitSchoolTitle: 'អង្គការសាលាទន្សាយ (ការអប់រំពិសេស)',
    },
    dashboard: {
      welcomeTitle: 'សូមស្វាគមន៍មកកាន់ AutiCare',
      welcomeSubtitle: 'វេទិកាគាំទ្រកុមារមានអូទីសឹម និងការលូតលាស់ប្រព័ន្ធប្រសាទនៅកម្ពុជា',
      startScreening: 'ចាប់ផ្តើមការវាយតម្លៃ',
      bookSpecialist: 'កក់ការពិគ្រោះយោបល់',
      sensoryPlay: 'សកម្មភាពលេងកម្សាន្ត',
      growthTrajectory: 'ការតាមដានការលូតលាស់',
    },
    screening: {
      start: 'ចាប់ផ្តើមការវាយតម្លៃ',
      history: 'ប្រវត្តិនៃការវាយតម្លៃ',
      questionnaire: 'កម្រងសំណួរវាយតម្លៃការលូតលាស់',
      questionGuidance: 'ការណែនាំសង្កេត',
      guidanceTip:
        'សូមពិចារណាលើអាកប្បកិរិយាធម្មជាតិក្នុងប៉ុន្មានសប្តាហ៍ថ្មីៗនេះនៅក្នុងបរិយាកាសផ្ទះដ៏ស្រណុកសុខស្រួល។ គ្មានចម្លើយណាត្រូវឬខុសឡើយ។',
      previousQuestion: 'សំណួរមុន',
      nextQuestion: 'សំណួរបន្ទាប់',
      finalQuestion: 'សំណួរចុងក្រោយ',
      submitAssessment: 'បញ្ចប់ការវាយតម្លៃ',
      disclaimer:
        'ការវាយតម្លៃនេះជាឧបករណ៍សង្កេតការលូតលាស់បឋមប៉ុណ្ណោះ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រផ្លូវការជំនួសគ្រូពេទ្យឡើយ។',
      completionMessage: 'ការវាយតម្លៃត្រូវបានបញ្ចប់ដោយជោគជ័យ',
      scaleNever: 'មិនដែល',
      scaleRarely: 'កម្រ',
      scaleSometimes: 'ម្តងម្កាល',
      scaleOften: 'ញឹកញាប់',
      scaleAlways: 'ជានិច្ច',
      ageBands: {
        toddler: 'កុមារតូច (១៨–៣០ ខែ)',
        preschool: 'មត្តេយ្យសិក្សា (៣–៥ ឆ្នាំ)',
        child: 'កុមារ (៦ ឆ្នាំឡើង)',
      },
      categories: {
        social: 'អន្តរកម្មសង្គម',
        communication: 'ការប្រាស្រ័យទាក់ទង',
        sensory: 'វិញ្ញាណ និងភាពបត់បែន',
        play: 'ការលេង និងការស្រមើស្រមៃ',
        routine: 'ទម្លាប់ និងការផ្លាស់ប្តូរ',
      },
      resultsTitle: 'លទ្ធផលនៃការវាយតម្លៃការលូតលាស់',
      riskLevel: 'កម្រិតនៃការបារម្ភ',
      pediatricianAdvice: 'ការណែនាំពីវេជ្ជបណ្ឌិតកុមារ',
      downloadPdf: 'ទាញយករបាយការណ៍សង្ខេប (PDF)',
      retake: 'ធ្វើការវាយតម្លៃម្តងទៀត',
      backToScreening: 'ត្រឡប់ទៅទំព័រវាយតម្លៃ',
    },
    activities: {
      title: 'បណ្ណាល័យសកម្មភាពលេងបែបវិញ្ញាណ',
      subtitle: 'សកម្មភាពលេងសម្របសម្រួលអារម្មណ៍ និងការលូតលាស់សម្រាប់កុមារ',
      searchPlaceholder: 'ស្វែងរកសកម្មភាព...',
      categories: {
        all: 'សកម្មភាពទាំងអស់',
        sensory: 'ការលេងបែបវិញ្ញាណ',
        communication: 'ការប្រាស្រ័យទាក់ទង',
        calming: 'ការលួងលោមអារម្មណ៍',
        daily: 'ទម្លាប់ប្រចាំថ្ងៃ',
        grossMotor: 'ចលនាធំ',
        fineMotor: 'ចលនាតូច',
      },
      sensoryIntensity: {
        low: 'កម្រិតស្រាល',
        medium: 'កម្រិតមធ្យម',
        high: 'កម្រិតខ្លាំង',
      },
      ageFilters: {
        allAges: 'គ្រប់វ័យ',
        toddler: 'កុមារតូច (១៨–៣៦ ខែ)',
        preschool: 'មត្តេយ្យ (៣–៥ ឆ្នាំ)',
        schoolAge: 'វ័យចូលរៀន (៦+ ឆ្នាំ)',
      },
      materials: 'សម្ភារៈត្រូវការ',
      steps: 'ជំហានអនុវត្ត',
      reflectionPrompts: 'កំណត់ត្រាសង្កេតរបស់ឪពុកម្តាយ',
      milestoneCompleted: 'បានបញ្ចប់សកម្មភាព',
      markComplete: 'កត់ត្រាថាបានបញ្ចប់',
      timers: {
        start: 'ចាប់ផ្តើម',
        pause: 'ផ្អាក',
        reset: 'កំណត់ឡើងវិញ',
        minRemaining: 'នាទីនៅសល់',
      },
    },
    appointments: {
      bookingTitle: 'កក់ការពិគ្រោះយោបល់ជាមួយអ្នកជំនាញ',
      bookingSubtitle: 'ជ្រើសរើសវេជ្ជបណ្ឌិត ឬអ្នកព្យាបាលឯកទេសអូទីសឹម',
      doctorSpecialties: {
        developmentalPediatrician: 'វេជ្ជបណ្ឌិតឯកទេសការលូតលាស់កុមារ',
        speechTherapist: 'អ្នកព្យាបាលការនិយាយ',
        occupationalTherapist: 'អ្នកព្យាបាលការបំពេញមុខងារ (OT)',
        childPsychologist: 'ចិត្តវិទូកុមារ',
        specialEducator: 'គ្រូអប់រំពិសេស',
      },
      selectDate: 'ជ្រើសរើសកាលបរិច្ឆេទ',
      selectTime: 'ជ្រើសរើសម៉ោង',
      reasonForVisit: 'មូលហេតុនៃការជួបពិគ្រោះ',
      confirmedBadge: 'បានបញ្ជាក់ការណាត់',
      cancellationPrompt: 'តើអ្នកប្រាកដជាចង់បោះបង់ការណាត់ជួបនេះមែនទេ?',
      noAppointments: 'មិនមានការណាត់ជួបនៅឡើយទេ',
      bookNow: 'កក់ការណាត់ជួបឥឡូវនេះ',
    },
    hospitals: {
      title: 'មន្ទីរពេទ្យ និងគ្លីនិកដៃគូ',
      subtitle: 'ស្ថាប័នវេជ្ជសាស្ត្រជំនាញផ្នែកកុមារ និងការលូតលាស់ប្រព័ន្ធប្រសាទនៅកម្ពុជា',
      searchPlaceholder: 'ស្វែងរកតាមឈ្មោះមន្ទីរពេទ្យ ឬសេវាកម្ម...',
      servicesOffered: 'សេវាកម្មពិគ្រោះ និងព្យាបាល',
      viewDoctors: 'មើលវេជ្ជបណ្ឌិតជំនាញ',
      partnerVerified: 'ដៃគូដែលបានផ្ទៀងផ្ទាត់',
    },
    schools: {
      directoryTitle: 'សាលារៀន និងមជ្ឈមណ្ឌលអប់រំបរិយាបន្ន',
      directorySubtitle: 'ស្វែងរកសាលាដែលគាំទ្រកុមារមានអូទីសឹម និងតម្រូវការពិសេសនៅកម្ពុជា',
      searchPlaceholder: 'ស្វែងរកតាមឈ្មោះសាលា ឬទីតាំង...',
      provinces: {
        phnomPenh: 'រាជធានីភ្នំពេញ',
        kandal: 'ខេត្តកណ្តាល',
        siemReap: 'ខេត្តសៀមរាប',
        battambang: 'ខេត្តបាត់ដំបង',
        all: 'គ្រប់ខេត្ត/ក្រុង',
      },
      ratio: 'សមាមាត្រសិស្ស និងគ្រូ',
      waitlistLabel: 'ស្ថានភាពទទួលសិស្ស',
      immediate: 'ចូលរៀនបានភ្លាមៗ',
      waitlist: 'បញ្ជីរង់ចាំ',
      facilities: 'បរិក្ខារ និងបន្ទប់សិក្សា',
      inclusionRating: 'កម្រិតបរិយាបន្ន',
      reportCards: 'របាយការណ៍សកម្មភាពសិក្សា',
      enrollmentRequest: 'ស្នើសុំការចុះឈ្មោះចូលរៀន',
    },
    progress: {
      title: 'ការតាមដានការលូតលាស់ និងវឌ្ឍនភាព',
      subtitle: 'សង្កេតការវិវត្តរបស់កុមារតាមពេលវេលាជាក់ស្តែង',
      domains: {
        communication: 'ការប្រាស្រ័យទាក់ទង',
        motor: 'ចលនាសាច់ដុំ',
        cognitive: 'ការយល់ដឹង និងការគិត',
        social: 'សង្គម និងមនោសញ្ចេតនា',
        sensory: 'វិញ្ញាណ និងភាពសម្របខ្លួន',
      },
      milestoneTimeline: 'បន្ទាត់ពេលវេលានៃការវិវត្ត',
      parentObservations: 'កំណត់ត្រាសង្កេតរបស់គ្រួសារ',
      streakLabel: 'សកម្មភាពបន្តបន្ទាប់ {{days}} ថ្ងៃ',
      growthTrajectory: 'គន្លងនៃការលូតលាស់',
      addObservation: 'បន្ថែមកំណត់ត្រាសង្កេត',
    },
    landing: {
      heroTitle: 'វេទិកាគាំទ្រកុមារមានអូទីសឹម និងការលូតលាស់នៅកម្ពុជា',
      heroSubtitle:
        'ការវាយតម្លៃការលូតលាស់ផ្អែកលើភស្តុតាង សកម្មភាពលេងបែបវិញ្ញាណ និងការតភ្ជាប់ដោយផ្ទាល់ជាមួយសាលារៀន និងមន្ទីរពេទ្យកុមារ។',
      getStarted: 'ចាប់ផ្តើមប្រើប្រាស់ឥតគិតថ្លៃ',
      learnMore: 'ស្វែងយល់បន្ថែម',
      clinicalCredentials: 'ផ្អែកលើស្តង់ដារវេជ្ជសាស្ត្រកុមារ និងឯកជនភាពគ្រួសារខ្ពស់បំផុត',
      progressionSteps: {
        step1Title: 'ការវាយតម្លៃការលូតលាស់បឋម',
        step1Desc: 'ឆ្លើយកម្រងសំណួរស្របតាមស្តង់ដារ M-CHAT ប្រកបដោយភាពទន់ភ្លន់ និងគ្មានការភ័យព្រួយ។',
        step2Title: 'សកម្មភាពលេងបែបវិញ្ញាណប្រចាំថ្ងៃ',
        step2Desc: 'អនុវត្តសកម្មភាពលេងដែលរៀបចំឡើងយ៉ាងពិសេសសម្រាប់តម្រូវការជាក់ស្តែងរបស់កុមារ។',
        step3Title: 'ការតភ្ជាប់ជាមួយវេជ្ជបណ្ឌិតជំនាញ',
        step3Desc: 'កក់ការពិគ្រោះយោបល់ជាមួយវេជ្ជបណ្ឌិតឯកទេសការលូតលាស់ និងអ្នកព្យាបាលការនិយាយ។',
        step4Title: 'ការអប់រំបរិយាបន្ននៅសាលារៀន',
        step4Desc:
          'ស្វែងរកសាលាគាំទ្រកុមារមានអូទីសឹម និងតាមដានរបាយការណ៍សកម្មភាពជាមួយលោកគ្រូអ្នកគ្រូ។',
      },
      trustBadges: {
        evidenceTitle: 'ស្តង់ដារផ្អែកលើភស្តុតាង',
        evidenceDesc: 'ការវាយតម្លៃស្របតាមគោលការណ៍ M-CHAT និងការអភិវឌ្ឍកុមារអន្តរជាតិ។',
        privacyTitle: 'ឯកជនភាព និងសុវត្ថិភាពទិន្នន័យ',
        privacyDesc:
          'ទិន្នន័យរបស់កុមារ និងគ្រួសារត្រូវបានការពារយ៉ាងតឹងរ៉ឹងដោយគ្មានការចែករំលែកពាណិជ្ជកម្ម។',
        teamTitle: 'កិច្ចសហការគ្រួសារ និងអ្នកជំនាញ',
        teamDesc: 'ភ្ជាប់ទំនាក់ទំនងរវាងឪពុកម្តាយ វេជ្ជបណ្ឌិត និងគ្រូបង្រៀនលើវេទិកាតែមួយ។',
        sensoryTitle: 'ការរចនាសម្រួលដល់វិញ្ញាណ',
        sensoryDesc: 'ចំណុចប្រទាក់ទន់ភ្លន់ គ្មានការរំខាន និងងាយស្រួលប្រើប្រាស់។',
      },
      toolCards: {
        screeningTitle: 'ការវាយតម្លៃហានិភ័យដំបូង',
        screeningDesc: 'ស្វែងយល់ពីចំណុចខ្លាំង និងតម្រូវការគាំទ្ររបស់កុមារតាមរយៈកម្រងសំណួរ។',
        specialistsTitle: 'ស្វែងរកអ្នកជំនាញ',
        specialistsDesc: 'រុករកមន្ទីរពេទ្យ គ្លីនិក និងអ្នកព្យាបាលឯកទេសនៅកម្ពុជា។',
        activitiesTitle: 'សកម្មភាពប្រចាំថ្ងៃ',
        activitiesDesc: 'គំនិតលេងបែបវិញ្ញាណ និងការបង្កើតទម្លាប់ល្អសម្រាប់កុមារ។',
        progressTitle: 'តាមដានការរីកចម្រើន',
        progressDesc: 'កត់ត្រាវឌ្ឍនភាព និងចំណុចសំខាន់ៗនៃការលូតលាស់។',
      },
      ctaExplore: 'ស្វែងរកឧបករណ៍គាំទ្រ',
    },
    notifications: {
      title: 'ការជូនដំណឹង',
      emptyNotice: 'មិនមានការជូនដំណឹងថ្មីទេ',
      markAsRead: 'កត់ត្រាថាបានអានទាំងអស់',
      appointmentReminders: 'ការរំលឹកការណាត់ជួប',
      screeningAlerts: 'ការជូនដំណឹងពីការវាយតម្លៃ',
      schoolUpdates: 'ដំណឹងពីសាលារៀន',
    },
    settings: {
      title: 'ការកំណត់គណនី',
      profileSettings: 'ព័ត៌មានផ្ទាល់ខ្លួន',
      languageLabel: 'ភាសាដែលពេញចិត្ត',
      notificationPreferences: 'ការកំណត់ការជូនដំណឹង',
      saveSuccess: 'ការផ្លាស់ប្តូរត្រូវបានរក្សាទុកដោយជោគជ័យ',
      changePassword: 'ផ្លាស់ប្តូរពាក្យសម្ងាត់',
      theme: 'ពណ៌ និងរូបរាង',
    },
    shell: {
      skipToContent: 'រំលងទៅមាតិកាចម្បង',
      expandSidebar: 'ពង្រីករបាររុករក (Ctrl+B)',
      collapseSidebar: 'បង្រួមរបាររុករក (Ctrl+B)',
      toggleNav: 'ប្តូររបាររុករក (Ctrl+B / ⌘B)',
      crisisAndUrgent: 'ជំនួយបន្ទាន់ និងការថែទាំ',
      accountSettings: 'ការកំណត់គណនី',
      helpCenter: 'មជ្ឈមណ្ឌលជំនួយ',
      crisisSupport: 'ជំនួយបន្ទាន់',
      signOut: 'ចាកចេញ',
      userAccountMenu: 'ម៉ឺនុយគណនីអ្នកប្រើប្រាស់',
      unreadNotifications: '{{count}} ការជូនដំណឹងមិនទាន់អាន',
      notifications: 'ការជូនដំណឹង',
      careAndDevelopment: 'ការថែទាំ និងការអភិវឌ្ឍ',
      directoryAndVisits: 'សៀវភៅបញ្ជី និងការណាត់',
      support: 'ការគាំទ្រ',
      overview: 'ទំព័រដើម',
      myChildren: 'កុមាររបស់ខ្ញុំ',
      screening: 'ការវាយតម្លៃ',
      activities: 'សកម្មភាពលេង',
      progress: 'ការវិវត្ត',
      appointments: 'ការណាត់ជួប',
      schools: 'សាលារៀន',
      hospitals: 'មន្ទីរពេទ្យ',
      familyRecords: 'កំណត់ត្រាគ្រួសារ',
      schoolProfile: 'ព័ត៌មានសាលារៀន',
      hospitalProfile: 'ព័ត៌មានមន្ទីរពេទ្យ',
      students: 'សិស្សានុសិស្ស',
      reports: 'របាយការណ៍',
      schoolReports: 'របាយការណ៍សាលា',
      doctors: 'វេជ្ជបណ្ឌិត',
      newScreening: 'ការវាយតម្លៃថ្មី',
      createSchoolAccount: 'បង្កើតគណនីសាលា',
      addActivity: 'បន្ថែមសកម្មភាព',
      manageAppointments: 'គ្រប់គ្រងការណាត់ជួប',
      parentAccount: 'គណនីអាណាព្យាបាល',
      adminAccount: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      schoolAccount: 'គណនីសាលារៀន',
      hospitalAccount: 'គណនីមន្ទីរពេទ្យ',
      familyPortal: 'AutiCare - ផតថលគ្រួសារ',
      adminPortal: 'AutiCare - ការគ្រប់គ្រងប្រព័ន្ធ',
      educationPortal: 'AutiCare - ផតថលអប់រំ',
      clinicalCare: 'AutiCare - ការថែទាំព្យាបាល',
      highContrast: 'កម្រិតពណ៌ច្បាស់',
      calmSensory: 'កាត់បន្ថយការភ្ញោច',
      reducedMotion: 'កាត់បន្ថយចលនា',
      sensoryPreferenceTitle: 'ចំណូលចិត្តវិញ្ញាណសកម្ម៖ {{mode}}។ ចុចដើម្បីកំណត់ក្នុងការកំណត់។',
      switchToKhmer: 'ប្តូរទៅភាសាខ្មែរ',
      switchToEnglish: 'ប្តូរទៅភាសាអង់គ្លេស',
      closeDrawer: 'បិទម៉ឺនុយ',
      autiCareUser: 'អ្នកប្រើប្រាស់ AutiCare',
    },
  },
  en: {
    nav: {
      home: 'Home',
      screening: 'Screening',
      activities: 'Activities',
      appointments: 'Appointments',
      progress: 'Progress',
      schools: 'Schools',
      hospitals: 'Hospitals',
      settings: 'Settings',
      crisis: 'Crisis & Urgent Help',
      help: 'Help Center',
      notifications: 'Notifications',
      families: 'Families',
      students: 'Students',
      doctors: 'Doctors',
      profile: 'Profile',
      myChildren: 'My Children',
      reports: 'Reports',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back',
      next: 'Next',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      submit: 'Submit',
      loading: 'Loading...',
      filter: 'Filter',
      search: 'Search',
      close: 'Close',
      viewDetails: 'View Details',
      all: 'All',
      today: 'Today',
      daysAgo: 'days ago',
      languageToggle: 'Switch Language',
      khmer: 'ភាសាខ្មែរ',
      english: 'English',
      status: 'Status',
      actions: 'Actions',
      select: 'Select',
      required: 'Required',
      optional: 'Optional',
      noData: 'No data available',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      welcomeBack: 'Welcome back',
      createAccount: 'Create account',
    },
    child: {
      viewingCareFor: 'Viewing care for:',
      addChild: 'Add Child',
      latestScreening: 'Latest Assessment',
      concernLevel: 'Concern Level',
      streak: 'Activity Streak',
      milestones: 'Developmental Milestones',
      age: 'Age',
      dateOfBirth: 'Date of Birth',
      yearsOld: 'years old',
      monthsOld: 'months',
      firstName: 'First Name',
      lastName: 'Last Name',
      gender: 'Gender',
      medicalNotes: 'Medical Notes',
      cancel: 'Cancel',
      saveChild: 'Save Child',
    },
    risk: {
      lowConcern: 'Low Concern',
      moderateConcern: 'Moderate Concern',
      elevatedConcern: 'Elevated Concern',
    },
    status: {
      active: 'Active',
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      draft: 'Draft',
      published: 'Published',
    },
    crisis: {
      emergencyBannerTitle: 'Immediate Medical or Safety Emergency',
      emergencyBannerText:
        'If your child, family member, or anyone else is in immediate life-threatening physical danger, call 119 or go to your nearest emergency department immediately.',
      call119: 'Call 119 (Ambulance / SAMU)',
      call1280: 'Call 1280 (Child Helpline Cambodia)',
      tpoHotline: 'TPO Cambodia Mental Health Hotline',
      nphTitle: 'National Pediatric Hospital (Phnom Penh)',
      kanthaBophaTitle: 'Kantha Bopha Children’s Hospital (Phnom Penh & Siem Reap)',
      rabbitSchoolTitle: 'Rabbit School Organization (Special Education)',
    },
    dashboard: {
      welcomeTitle: 'Welcome to AutiCare',
      welcomeSubtitle:
        'Cambodia’s neurodiversity and autism family support & developmental care platform',
      startScreening: 'Start Screening',
      bookSpecialist: 'Book Specialist',
      sensoryPlay: 'Sensory Play',
      growthTrajectory: 'Growth Trajectory',
    },
    screening: {
      start: 'Start Assessment',
      history: 'Screening History',
      questionnaire: 'Developmental Assessment Questionnaire',
      questionGuidance: 'Observational Guidance',
      guidanceTip:
        'Consider spontaneous behaviors across recent weeks in relaxed home environments. There are no right or wrong answers.',
      previousQuestion: 'Previous Question',
      nextQuestion: 'Next Question',
      finalQuestion: 'Final Question',
      submitAssessment: 'Submit Assessment',
      disclaimer:
        'This screening is an observational developmental guide and does not substitute for a formal clinical diagnosis by a licensed pediatrician.',
      completionMessage: 'Assessment completed successfully',
      scaleNever: 'Never',
      scaleRarely: 'Rarely',
      scaleSometimes: 'Sometimes',
      scaleOften: 'Often',
      scaleAlways: 'Always',
      ageBands: {
        toddler: 'Toddler (18–30 months)',
        preschool: 'Preschool (3–5 years)',
        child: 'School Age (6+ years)',
      },
      categories: {
        social: 'Social Engagement',
        communication: 'Communication & Speech',
        sensory: 'Sensory Flexibility',
        play: 'Play & Imagination',
        routine: 'Routines & Transitions',
      },
      resultsTitle: 'Developmental Screening Results',
      riskLevel: 'Concern Level',
      pediatricianAdvice: 'Pediatrician Recommendation',
      downloadPdf: 'Download Summary Report (PDF)',
      retake: 'Retake Screening',
      backToScreening: 'Back to Screening',
    },
    activities: {
      title: 'Sensory Play & Activities Library',
      subtitle: 'Developmentally tailored play, communication prompts, and calming routines',
      searchPlaceholder: 'Search activities...',
      categories: {
        all: 'All Activities',
        sensory: 'Sensory Play',
        communication: 'Communication',
        calming: 'Calming & Regulation',
        daily: 'Daily Living Routines',
        grossMotor: 'Gross Motor',
        fineMotor: 'Fine Motor',
      },
      sensoryIntensity: {
        low: 'Gentle / Low',
        medium: 'Moderate',
        high: 'High Engagement',
      },
      ageFilters: {
        allAges: 'All Ages',
        toddler: 'Toddler (18–36m)',
        preschool: 'Preschool (3–5y)',
        schoolAge: 'School Age (6y+)',
      },
      materials: 'Materials Needed',
      steps: 'Step-by-Step Instructions',
      reflectionPrompts: 'Parent Observation Notes',
      milestoneCompleted: 'Milestone Completed',
      markComplete: 'Mark as Completed',
      timers: {
        start: 'Start',
        pause: 'Pause',
        reset: 'Reset',
        minRemaining: 'min remaining',
      },
    },
    appointments: {
      bookingTitle: 'Book Specialist Consultation',
      bookingSubtitle: 'Select a developmental pediatrician, speech therapist, or psychologist',
      doctorSpecialties: {
        developmentalPediatrician: 'Developmental Pediatrician',
        speechTherapist: 'Speech & Language Therapist',
        occupationalTherapist: 'Occupational Therapist (OT)',
        childPsychologist: 'Child Psychologist',
        specialEducator: 'Special Education Specialist',
      },
      selectDate: 'Select Date',
      selectTime: 'Select Time Slot',
      reasonForVisit: 'Reason for Consultation',
      confirmedBadge: 'Appointment Confirmed',
      cancellationPrompt: 'Are you sure you want to cancel this appointment?',
      noAppointments: 'No upcoming appointments scheduled',
      bookNow: 'Book Appointment Now',
    },
    hospitals: {
      title: 'Partner Hospitals & Clinics',
      subtitle: 'Accredited pediatric and neurodevelopmental care institutions across Cambodia',
      searchPlaceholder: 'Search hospitals or clinical services...',
      servicesOffered: 'Clinical Services',
      viewDoctors: 'View Specialists',
      partnerVerified: 'Verified Partner',
    },
    schools: {
      directoryTitle: 'Inclusive Schools & Centers',
      directorySubtitle: 'Find accredited inclusive and special education programs across Cambodia',
      searchPlaceholder: 'Search by school name or location...',
      provinces: {
        phnomPenh: 'Phnom Penh',
        kandal: 'Kandal',
        siemReap: 'Siem Reap',
        battambang: 'Battambang',
        all: 'All Provinces',
      },
      ratio: 'Student-Teacher Ratio',
      waitlistLabel: 'Admission Availability',
      immediate: 'Immediate Enrollment',
      waitlist: 'Waitlist',
      facilities: 'Facilities & Classrooms',
      inclusionRating: 'Inclusion Support Rating',
      reportCards: 'Student Classroom Reports',
      enrollmentRequest: 'Request Enrollment',
    },
    progress: {
      title: 'Developmental Progress Tracker',
      subtitle: 'Track milestone trajectory and multidisciplinary observations in real time',
      domains: {
        communication: 'Communication',
        motor: 'Motor Skills',
        cognitive: 'Cognitive & Problem Solving',
        social: 'Social & Emotional',
        sensory: 'Sensory Processing',
      },
      milestoneTimeline: 'Milestone Timeline',
      parentObservations: 'Family Observation Journal',
      streakLabel: '{{days}}-Day Activity Streak',
      growthTrajectory: 'Growth Trajectory',
      addObservation: 'Add Observation Note',
    },
    landing: {
      heroTitle: 'Empowering Neurodiverse Children & Families Across Cambodia',
      heroSubtitle:
        'Evidence-based developmental screening, personalized sensory play routines, and direct coordination with inclusive schools and pediatric specialists.',
      getStarted: 'Get Started for Free',
      learnMore: 'Learn More',
      clinicalCredentials: 'Clinically Aligned & Strict Family Privacy',
      progressionSteps: {
        step1Title: 'Evidence-Based Developmental Screening',
        step1Desc:
          'Answer guided developmental questionnaires aligned with M-CHAT principles with gentle clarity.',
        step2Title: 'Personalized Daily Milestones & Sensory Play',
        step2Desc:
          'Turn screening insights into joyful daily progress with sensory-friendly play activities.',
        step3Title: 'Direct Connection to Pediatric Specialists',
        step3Desc:
          'Connect with verified developmental pediatricians and speech therapists across Cambodia.',
        step4Title: 'Inclusive Classrooms & School Coordination',
        step4Desc:
          'Discover special education programs and collaborate on classroom observation reports.',
      },
      trustBadges: {
        evidenceTitle: 'Evidence-Based Framework',
        evidenceDesc:
          'Screening aligned with validated pediatric developmental milestones and clinical M-CHAT principles.',
        privacyTitle: 'Private & Secure Family Data',
        privacyDesc:
          'Zero third-party advertising, zero data brokers. All observations belong strictly to your family.',
        teamTitle: 'Multidisciplinary Team Care',
        teamDesc:
          'Brings parents, developmental pediatricians, therapists, and educators onto one collaborative continuum.',
        sensoryTitle: 'Sensory-Friendly Design',
        sensoryDesc:
          'Designed around neuro-inclusive accessibility: gentle colors, clear typography, and zero sensory overload.',
      },
      toolCards: {
        screeningTitle: 'Early Risk Screening',
        screeningDesc:
          'Use guided questionnaires and behavioral observations to understand where extra support may help.',
        specialistsTitle: 'Find Specialists',
        specialistsDesc:
          'Browse schools, hospitals, and care providers that support neurodiverse children and families.',
        activitiesTitle: 'Personalized Activities',
        activitiesDesc:
          'Keep activity ideas connected to each child profile, support needs, and family routines.',
        progressTitle: 'Track Progress',
        progressDesc:
          'Follow milestones, appointments, and reports in one calm workspace built for repeated use.',
      },
      ctaExplore: 'Explore Support Tools',
    },
    notifications: {
      title: 'Notifications',
      emptyNotice: 'You have no new notifications.',
      markAsRead: 'Mark All as Read',
      appointmentReminders: 'Appointment Reminders',
      screeningAlerts: 'Screening Milestone Alerts',
      schoolUpdates: 'School Activity Updates',
    },
    settings: {
      title: 'Account Settings',
      profileSettings: 'Profile Information',
      languageLabel: 'Preferred Language',
      notificationPreferences: 'Notification Preferences',
      saveSuccess: 'Settings saved successfully.',
      changePassword: 'Change Password',
      theme: 'Theme & Display',
    },
    shell: {
      skipToContent: 'Skip to content',
      expandSidebar: 'Expand navigation sidebar (Ctrl+B)',
      collapseSidebar: 'Collapse navigation sidebar (Ctrl+B)',
      toggleNav: 'Toggle navigation (Ctrl+B / ⌘B)',
      crisisAndUrgent: 'Crisis & Urgent Care',
      accountSettings: 'Account Settings',
      helpCenter: 'Help Center',
      crisisSupport: 'Crisis Support',
      signOut: 'Sign out',
      userAccountMenu: 'User account menu',
      unreadNotifications: '{{count}} unread notifications',
      notifications: 'Notifications',
      careAndDevelopment: 'Care & Development',
      directoryAndVisits: 'Directory & Visits',
      support: 'Support',
      overview: 'Overview',
      myChildren: 'My Children',
      screening: 'Screening',
      activities: 'Activities',
      progress: 'Progress',
      appointments: 'Appointments',
      schools: 'Schools',
      hospitals: 'Hospitals',
      familyRecords: 'Family Records',
      schoolProfile: 'School Profile',
      hospitalProfile: 'Hospital Profile',
      students: 'Students',
      reports: 'Reports',
      schoolReports: 'School Reports',
      doctors: 'Doctors',
      newScreening: 'New Screening',
      createSchoolAccount: 'Create School Account',
      addActivity: 'Add Activity',
      manageAppointments: 'Manage Appointments',
      parentAccount: 'Parent account',
      adminAccount: 'System administrator',
      schoolAccount: 'School account',
      hospitalAccount: 'Hospital account',
      familyPortal: 'AutiCare Family Portal',
      adminPortal: 'AutiCare Administration',
      educationPortal: 'AutiCare Education Portal',
      clinicalCare: 'AutiCare Clinical Care',
      highContrast: 'High Contrast',
      calmSensory: 'Calm Sensory',
      reducedMotion: 'Reduced Motion',
      sensoryPreferenceTitle:
        'Active sensory preference: {{mode}}. Click to configure in Settings.',
      switchToKhmer: 'Switch language to Khmer',
      switchToEnglish: 'Switch language to English',
      closeDrawer: 'Close navigation drawer',
      autiCareUser: 'AutiCare user',
    },
  },
};
