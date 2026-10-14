export type FaqEntry = { readonly question: string; readonly answer: string };
export type FaqCategory = {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly FaqEntry[];
};

/**
 * Static Help Center content. There is no FAQ backend yet, so this reference
 * content lives as a structured local data file rather than a database table.
 */
export const helpCenterCategories: readonly FaqCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    entries: [
      {
        question: 'How do I add a child profile?',
        answer:
          'Go to "My Children" in the sidebar and select "Add Child." You\'ll be asked for your child\'s first name, date of birth, and optional support notes (such as routines, communication preferences, or care context). Name and date of birth are required.',
      },
      {
        question: 'Can I manage more than one child?',
        answer:
          "Yes. There's no limit to the number of child profiles you can create under one parent account. Each child has their own screening history, activity progress, and appointments.",
      },
      {
        question: 'What can I do on AutiCare?',
        answer:
          "AutiCare helps you manage your child's developmental journey in one place: complete heuristic autism screenings, search special education schools and hospitals, request appointments with hospital specialists, request school enrollments, and track developmental activities.",
      },
      {
        question: 'How do I update my account information?',
        answer:
          'Go to Settings from the sidebar to update your first name, last name, phone number, or social media handle. Your email address serves as your sign-in identifier and cannot be edited in settings. To change your password, use the forgot password recovery flow from the login page.',
      },
    ],
  },
  {
    id: 'screening',
    label: 'Screening',
    entries: [
      {
        question: 'What is the AutiCare screening tool?',
        answer:
          "It's a short questionnaire, answered by you as the parent, about your child's everyday behaviors — things like communication, play, and how they respond to their environment. It takes about 10-15 minutes.",
      },
      {
        question: 'Is this a diagnosis?',
        answer:
          'No. This screening tool is an original heuristic questionnaire for informational and educational purposes only. It does not diagnose autism or any other clinical condition. It is designed to help you notice patterns worth discussing with a licensed healthcare professional — not to replace one. Only a qualified clinician can provide a diagnosis.',
      },
      {
        question: "Why do the questions change depending on my child's age?",
        answer:
          "Children show different developmental signs at different ages. AutiCare uses two age-specific question sets — one for children under 4, and one for children 4 and older — so the questions match what's typical to observe at your child's stage.",
      },
      {
        question: 'What do the risk levels (Low, Moderate, High) mean?',
        answer:
          'These labels are heuristic risk bands based on parental questionnaire responses — they are not a clinical severity scale or diagnostic determination. A "Moderate" or "High" result indicates patterns that may warrant further evaluation with a pediatrician or specialist. A "Low" result does not rule out developmental needs. Trust your parental observations alongside this tool.',
      },
      {
        question: 'What should I do if I get a Moderate or High risk result?',
        answer:
          "We recommend discussing the results with your child's pediatrician or healthcare provider. You can browse hospitals on AutiCare to request an appointment with a specialist.",
      },
      {
        question: 'How often should I screen my child?',
        answer:
          "There's no strict rule, but many parents choose to screen again every few months, or whenever they notice changes in their child's behaviors. If your child moves from the under-4 to the 4+ age group between screenings, the questionnaire updates to reflect age-appropriate milestones.",
      },
      {
        question: "Can I see my child's past screening results?",
        answer:
          'Yes. Go to "Screening" → "View screening history" to see every past session for a child, including the date, score, and risk level.',
      },
      {
        question: "Who can see my child's screening results?",
        answer:
          'Screening questionnaire responses and results remain private within your parent account. They are not automatically transmitted to schools or hospitals. When you request a hospital appointment, only the appointment details, selected child name, and reason for visit/notes you enter are submitted with the request.',
      },
    ],
  },
  {
    id: 'schools-hospitals',
    label: 'Schools & Hospitals',
    entries: [
      {
        question: 'How do I search for schools?',
        answer:
          'Go to "Schools" from the sidebar. You can search by school name, city, or specialization keyword, and filter by Province/Region, Availability status (Immediate, Waitlist, Closed), and Specialization tags (such as ABA, Speech Therapy, Sensory Integration, Occupational Therapy, and Social Skills).',
      },
      {
        question: 'What does "Request Enrollment" do?',
        answer:
          'It submits an enrollment admission request to the school for your child. You can monitor the status (Pending, Approved, Rejected) from your dashboard and enrollment requests list.',
      },
      {
        question: 'How do I find a hospital or specialist?',
        answer:
          'Go to "Hospitals" from the sidebar to browse healthcare providers, view hospital locations, and request consultations.',
      },
      {
        question: 'How do I request an appointment?',
        answer:
          'From a hospital card or profile, select "Book Appointment," choose your child, select an available date and time slot, optionally provide reasons or symptoms, and submit. The appointment is submitted as a request for hospital staff to review and confirm or decline.',
      },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    entries: [
      {
        question: 'What are developmental activities?',
        answer:
          "Short, guided activities designed to support your child's development in specific areas like communication or social skills. Each includes step-by-step instructions and practical guidance.",
      },
      {
        question: "How do I track my child's progress on an activity?",
        answer:
          'Mark an activity as "In Progress" or "Completed" from the Activities page. You can see a full history under "Progress."',
      },
    ],
  },
  {
    id: 'account-privacy',
    label: 'Account & Privacy',
    entries: [
      {
        question: 'What information does AutiCare store about my child?',
        answer:
          'We store only the child profile fields you submit: first name, date of birth, and optional care notes. We also store associated screening responses, activity progress, and appointment/enrollment requests. This information is private to your account.',
      },
      {
        question: "Can I delete or archive my child's profile or account?",
        answer:
          'You can archive a child profile at any time directly from the child profile page. Self-serve account deletion is not available in Settings; if you wish to permanently close your account and remove your records, please email our support team at support@auticare.local.',
      },
      {
        question: 'Is my data shared with third parties?',
        answer:
          'No. AutiCare does not sell or share your family data with advertisers or third-party marketing services. Data is shared with schools or hospitals only when you explicitly submit an enrollment request or appointment request.',
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    entries: [
      {
        question: "I have a question that isn't answered here.",
        answer:
          'Email us directly at support@auticare.local, and our team will get back to you as soon as possible.',
      },
      {
        question: 'Is this a good place to ask about a medical emergency?',
        answer:
          'No. If you believe your child is in immediate danger or medical distress, contact your local emergency services right away. AutiCare and its support team do not provide medical services or emergency response.',
      },
    ],
  },
];

export const helpCenterCategoriesKm: readonly FaqCategory[] = [
  {
    id: 'getting-started',
    label: 'ការចាប់ផ្តើម',
    entries: [
      {
        question: 'តើខ្ញុំត្រូវបន្ថែមប្រវត្តិរូបកុមារដោយរបៀបណា?',
        answer:
          'សូមចូលទៅកាន់ «កុមាររបស់ខ្ញុំ» នៅក្នុងរបារចំហៀង ហើយជ្រើសរើស «បន្ថែមប្រវត្តិរូបកុមារ»។ អ្នកនឹងត្រូវបំពេញនាមខ្លួន ថ្ងៃខែឆ្នាំកំណើត និងកំណត់ត្រាគាំទ្រផ្សេងៗ។ នាមខ្លួន និងថ្ងៃខែឆ្នាំកំណើតគឺជាព័ត៌មានចាំបាច់។',
      },
      {
        question: 'តើខ្ញុំអាចគ្រប់គ្រងកុមារលើសពីម្នាក់បានទេ?',
        answer:
          'បាន។ មិនមានការកំណត់ចំនួនប្រវត្តិរូបកុមារដែលអ្នកអាចបង្កើតក្រោមគណនីអាណាព្យាបាលតែមួយឡើយ។ កុមារម្នាក់ៗមានប្រវត្តិវាយតម្លៃ ដំណើរការសកម្មភាព និងការណាត់ជួបផ្ទាល់ខ្លួន។',
      },
      {
        question: 'តើខ្ញុំអាចធ្វើអ្វីខ្លះនៅលើ AutiCare?',
        answer:
          'AutiCare ជួយអ្នកគ្រប់គ្រងដំណើរការវិវត្តរបស់កូនអ្នកនៅកន្លែងតែមួយ៖ ធ្វើតេស្តស្គ្រីនីងអូទីស្សឹម ស្វែងរកសាលាអប់រំពិសេស និងមន្ទីរពេទ្យ ស្នើសុំការណាត់ជួបជាមួយវេជ្ជបណ្ឌិតឯកទេស ស្នើសុំការចុះឈ្មោះចូលរៀន និងតាមដានសកម្មភាពអភិវឌ្ឍន៍។',
      },
      {
        question: 'តើខ្ញុំត្រូវធ្វើបច្ចុប្បន្នភាពព័ត៌មានគណនីដោយរបៀបណា?',
        answer:
          'ចូលទៅកាន់ «ការកំណត់គណនី» ពីរបារចំហៀង ដើម្បីកែប្រែនាមខ្លួន គោត្តនាម លេខទូរស័ព្ទ ឬបណ្តាញសង្គមរបស់អ្នក។ អាសយដ្ឋានអ៊ីមែលរបស់អ្នកត្រូវបានប្រើសម្រាប់ចូលគណនី ហើយមិនអាចកែប្រែនៅទីនោះបានទេ។ ដើម្បីផ្លាស់ប្តូរពាក្យសម្ងាត់ សូមប្រើមុខងារផ្លាស់ប្តូរពាក្យសម្ងាត់ពីទំព័រការកំណត់ ឬទំព័រចូល។',
      },
    ],
  },
  {
    id: 'screening',
    label: 'ការវាយតម្លៃ',
    entries: [
      {
        question: 'តើឧបករណ៍វាយតម្លៃស្គ្រីនីង AutiCare ជាអ្វី?',
        answer:
          'វាជាកម្រងសំណួរខ្លីៗដែលឆ្លើយដោយឪពុកម្តាយ អំពីអាកប្បកិរិយាប្រចាំថ្ងៃរបស់កុមារ ដូចជាការប្រាស្រ័យទាក់ទង ការលេងកម្សាន្ត និងរបៀបដែលពួកគេឆ្លើយតបទៅនឹងបរិយាកាសជុំវិញ។ វាចំណាយពេលប្រហែល ១០ ទៅ ១៥ នាទី។',
      },
      {
        question: 'តើនេះជាការធ្វើរោគវិនិច្ឆ័យមែនទេ?',
        answer:
          'ទេ ឧបករណ៍វាយតម្លៃនេះជាកម្រងសំណួរសម្រាប់គោលបំណងផ្តល់ព័ត៌មាន និងការយល់ដឹងប៉ុណ្ណោះ។ វាមិនមែនជាការធ្វើរោគវិនិច្ឆ័យជំងឺអូទីស្សឹម ឬស្ថានភាពគ្លីនិកណាមួយឡើយ។ មានតែគ្រូពេទ្យឯកទេសដែលមានអាជ្ញាបណ្ណប៉ុណ្ណោះដែលអាចផ្តល់ការធ្វើរោគវិនិច្ឆ័យបាន។',
      },
      {
        question: 'ហេតុអ្វីបានជាសំណួរផ្លាស់ប្តូរទៅតាមអាយុរបស់កុមារ?',
        answer:
          'កុមារបង្ហាញសញ្ញានៃការវិវត្តខុសៗគ្នាតាមវ័យ។ AutiCare ប្រើប្រាស់កម្រងសំណួរតាមក្រុមអាយុ — មួយសម្រាប់កុមារអាយុក្រោម ៤ ឆ្នាំ និងមួយទៀតសម្រាប់កុមារអាយុ ៤ ឆ្នាំឡើង — ដើម្បីឱ្យត្រូវគ្នានឹងដំណាក់កាលអភិវឌ្ឍន៍របស់កុមារ។',
      },
      {
        question: 'តើកម្រិតហានិភ័យ (ទាប មធ្យម ខ្ពស់) មានន័យដូចម្តេច?',
        answer:
          'កម្រិតទាំងនេះគឺជាការចង្អុលបង្ហាញផ្អែកលើការឆ្លើយសំណួររបស់ឪពុកម្តាយ — វាមិនមែនជាការកំណត់រោគវិនិច្ឆ័យគ្លីនិកឡើយ។ លទ្ធផល «មធ្យម» ឬ «ខ្ពស់» បង្ហាញពីទម្រង់អាកប្បកិរិយាដែលគួរពិភាក្សាបន្ថែមជាមួយវេជ្ជបណ្ឌិតកុមារ ឬអ្នកឯកទេស។',
      },
      {
        question: 'តើខ្ញុំគួរធ្វើអ្វីប្រសិនបើទទួលបានលទ្ធផលហានិភ័យមធ្យម ឬខ្ពស់?',
        answer:
          'យើងសូមណែនាំឱ្យយកលទ្ធផលនេះទៅពិភាក្សាជាមួយវេជ្ជបណ្ឌិតកុមារ ឬអ្នកផ្តល់សេវាថែទាំសុខភាព។ អ្នកអាចស្វែងរកមន្ទីរពេទ្យនៅលើ AutiCare ដើម្បីស្នើសុំការណាត់ជួបជាមួយអ្នកឯកទេស។',
      },
      {
        question: 'តើខ្ញុំគួរធ្វើតេស្តស្គ្រីនីងកូនញឹកញាប់ប៉ុណ្ណា?',
        answer:
          'មិនមានកាលវិភាគតឹងរ៉ឹងទេ ប៉ុន្តែឪពុកម្តាយជាច្រើនជ្រើសរើសធ្វើតេស្តឡើងវិញរៀងរាល់ពីរបីខែម្តង ឬនៅពេលកត់សម្គាល់ឃើញការផ្លាស់ប្តូរនៃអាកប្បកិរិយាកូន។',
      },
      {
        question: 'តើខ្ញុំអាចមើលលទ្ធផលវាយតម្លៃកន្លងមករបស់កូនបានទេ?',
        answer:
          'បាន។ សូមចូលទៅកាន់ «ការវាយតម្លៃ» ដើម្បីមើលប្រវត្តិនៃការធ្វើតេស្តទាំងអស់របស់កុមារ រួមទាំងកាលបរិច្ឆេទ ពិន្ទុ និងកម្រិតហានិភ័យ។',
      },
      {
        question: 'តើអ្នកណាខ្លះអាចមើលឃើញលទ្ធផលវាយតម្លៃរបស់កូនខ្ញុំ?',
        answer:
          'លទ្ធផល និងចម្លើយនៃការវាយតម្លៃត្រូវបានរក្សាទុកជាការសម្ងាត់នៅក្នុងគណនីអាណាព្យាបាលរបស់អ្នក។ ពួកវាមិនត្រូវបានផ្ញើដោយស្វ័យប្រវត្តិទៅកាន់សាលារៀន ឬមន្ទីរពេទ្យឡើយ។',
      },
    ],
  },
  {
    id: 'schools-hospitals',
    label: 'សាលារៀន និងមន្ទីរពេទ្យ',
    entries: [
      {
        question: 'តើខ្ញុំត្រូវស្វែងរកសាលារៀនដោយរបៀបណា?',
        answer:
          'ចូលទៅកាន់ «សាលារៀន» ពីរបារចំហៀង។ អ្នកអាចស្វែងរកតាមឈ្មោះសាលា ទីក្រុង ឬពាក្យគន្លឹះឯកទេស និងច្រោះតាមខេត្ត/តំបន់ ស្ថានភាព និងជំនាញឯកទេស។',
      },
      {
        question: 'តើ «ស្នើសុំការចុះឈ្មោះ» មានន័យដូចម្តេច?',
        answer:
          'វាបញ្ជូនសំណើសុំចុះឈ្មោះចូលរៀនទៅកាន់សាលាសម្រាប់កូនរបស់អ្នក។ អ្នកអាចតាមដានស្ថានភាព (រង់ចាំ យល់ព្រម ឬបដិសេធ) ពីផ្ទាំងគ្រប់គ្រងរបស់អ្នក។',
      },
      {
        question: 'តើខ្ញុំស្វែងរកមន្ទីរពេទ្យ ឬអ្នកឯកទេសដោយរបៀបណា?',
        answer:
          'ចូលទៅកាន់ «មន្ទីរពេទ្យ» ពីរបារចំហៀង ដើម្បីមើលបញ្ជីអ្នកផ្តល់សេវាថែទាំសុខភាព ទីតាំងមន្ទីរពេទ្យ និងស្នើសុំការពិគ្រោះយោបល់។',
      },
      {
        question: 'តើខ្ញុំស្នើសុំការណាត់ជួបដោយរបៀបណា?',
        answer:
          'ពីកាត ឬប្រវត្តិរូបមន្ទីរពេទ្យ សូមជ្រើសរើស «កក់ការណាត់ជួប» ជ្រើសរើសកូនរបស់អ្នក កាលបរិច្ឆេទ និងម៉ោងទំនេរ រួចបញ្ជូនសំណើ។',
      },
    ],
  },
  {
    id: 'activities',
    label: 'សកម្មភាពលេង',
    entries: [
      {
        question: 'តើសកម្មភាពអភិវឌ្ឍន៍ជាអ្វី?',
        answer:
          'ជាសកម្មភាពណែនាំខ្លីៗដែលរៀបចំឡើងដើម្បីគាំទ្រដល់ការអភិវឌ្ឍរបស់កូនក្នុងផ្នែកជាក់លាក់ ដូចជាការប្រាស្រ័យទាក់ទង ឬជំនាញសង្គម។',
      },
      {
        question: 'តើខ្ញុំតាមដានការវិវត្តរបស់កូនលើសកម្មភាពដោយរបៀបណា?',
        answer:
          'សម្គាល់សកម្មភាពថា «កំពុងអនុវត្ត» ឬ «បានបញ្ចប់» ពីទំព័រសកម្មភាព។ អ្នកអាចមើលប្រវត្តិពេញលេញក្រោមទំព័រ «ការវិវត្ត»។',
      },
    ],
  },
  {
    id: 'account-privacy',
    label: 'គណនី និងឯកជនភាព',
    entries: [
      {
        question: 'តើ AutiCare រក្សាទុកព័ត៌មានអ្វីខ្លះអំពីកូនរបស់ខ្ញុំ?',
        answer:
          'យើងរក្សាទុកតែព័ត៌មានដែលអ្នកបានផ្តល់៖ នាមខ្លួន ថ្ងៃខែឆ្នាំកំណើត និងកំណត់ត្រាថែទាំ។ ព័ត៌មានទាំងនេះត្រូវបានរក្សាទុកជាឯកជនសម្រាប់គណនីរបស់អ្នក។',
      },
      {
        question: 'តើខ្ញុំអាចលុប ឬទុកក្នុងបណ្ណសារនូវប្រវត្តិរូបកុមារ ឬគណនីបានទេ?',
        answer:
          'អ្នកអាចទុកប្រវត្តិរូបកុមារក្នុងបណ្ណសារបានគ្រប់ពេលវេលាពីទំព័រប្រវត្តិរូបកុមារ។ សម្រាប់ការលុបគណនី សូមទាក់ទងមកកាន់ក្រុមការងារគាំទ្ររបស់យើង។',
      },
      {
        question: 'តើទិន្នន័យរបស់ខ្ញុំត្រូវបានចែករំលែកជាមួយភាគីទីបីទេ?',
        answer:
          'ទេ AutiCare មិនលក់ ឬចែករំលែកទិន្នន័យគ្រួសាររបស់អ្នកទៅឱ្យអ្នកផ្សាយពាណិជ្ជកម្ម ឬសេវាកម្មទីផ្សារភាគីទីបីឡើយ។',
      },
    ],
  },
  {
    id: 'contact',
    label: 'ទំនាក់ទំនង',
    entries: [
      {
        question: 'ខ្ញុំមានសំណួរដែលមិនមានចម្លើយនៅទីនេះ។',
        answer:
          'សូមផ្ញើអ៊ីមែលមកយើងតាម support@auticare.local ហើយក្រុមការងារយើងនឹងឆ្លើយតបទៅអ្នកឱ្យបានឆាប់រហ័ស។',
      },
      {
        question: 'តើទីនេះជាកន្លែងសួរអំពីករណីសង្គ្រោះបន្ទាន់ផ្នែកវេជ្ជសាស្ត្រមែនទេ?',
        answer:
          'ទេ ប្រសិនបើអ្នកជឿជាក់ថាកូនរបស់អ្នកស្ថិតក្នុងគ្រោះថ្នាក់បន្ទាន់ ឬអាសន្នផ្នែកវេជ្ជសាស្ត្រ សូមទាក់ទងសេវាសង្គ្រោះបន្ទាន់ក្នុងតំបន់របស់អ្នកភ្លាមៗ។',
      },
    ],
  },
];

export function getHelpCenterCategories(lang: string): readonly FaqCategory[] {
  return lang === 'km' ? helpCenterCategoriesKm : helpCenterCategories;
}
