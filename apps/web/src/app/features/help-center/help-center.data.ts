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
