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
  },
};
