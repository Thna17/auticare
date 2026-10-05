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
          'Go to "My Children" in the sidebar and select "Add Child." You\'ll be asked for your child\'s name, date of birth, and gender. You can add more details like diagnosis notes at any time — none of these fields are required upfront except name and date of birth.',
      },
      {
        question: 'Can I manage more than one child?',
        answer:
          "Yes. There's no limit to the number of child profiles you can create under one parent account. Each child has their own screening history, activity progress, and appointments.",
      },
      {
        question: 'What can I do on AutiCare?',
        answer:
          "AutiCare helps you manage your child's developmental journey in one place: complete autism screenings, search and compare special education schools and hospitals, book appointments with specialists, track developmental activities, and save schools you're interested in.",
      },
      {
        question: 'How do I update my account information?',
        answer: 'Go to Settings from the sidebar to update your name, email, or password.',
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
          "No. This screening tool is for informational purposes only and does not diagnose autism or any other condition. It's designed to help you notice patterns worth discussing with a healthcare professional — not to replace one. Only a qualified clinician can provide a diagnosis.",
      },
      {
        question: "Why do the questions change depending on my child's age?",
        answer:
          "Children show different developmental signs at different ages. AutiCare uses two question sets — one for children under 4, and one for children 4 and older — so the questions match what's typical to look for at your child's stage. This follows the general approach used by established screening tools in the field.",
      },
      {
        question: 'What do the risk levels (Low, Moderate, High) mean?',
        answer:
          'These labels describe how your child\'s answers compare to expected patterns for their age group — they are not a severity or diagnostic scale. A "Moderate" or "High" result doesn\'t mean your child has autism; it means the responses suggest it may be worth discussing with a pediatrician or specialist. A "Low" result doesn\'t guarantee there\'s nothing to watch for either — trust your own observations as a parent alongside this tool.',
      },
      {
        question: 'What should I do if I get a Moderate or High risk result?',
        answer:
          'We recommend talking with your child\'s pediatrician, especially if this is a new or unexpected result. You can use the "Book an appointment" or "Browse hospitals" options directly from the results page to find a specialist near you. Early conversations with a professional are valuable regardless of the exact result.',
      },
      {
        question: 'How often should I screen my child?',
        answer:
          "There's no strict rule, but many parents choose to screen again every few months, or whenever they notice a change in their child's behavior. If your child moves from the under-4 to the 4+ age group between screenings, keep in mind the questions will change, so results before and after that switch aren't directly compared.",
      },
      {
        question: "Can I see my child's past screening results?",
        answer:
          'Yes. Go to "Screening" → "View screening history" to see every past session for a child, including the date, score, and risk level.',
      },
      {
        question: "Who can see my child's screening results?",
        answer:
          "Only your parent account has access to your children's screening results. They are not shared with schools, hospitals, or other users unless you choose to share them yourself (for example, when booking an appointment).",
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
          'Go to "Schools" from the sidebar. You can filter by region, distance, school type (private, public, non-profit), and specialization (like ABA, speech therapy, or sensory integration).',
      },
      {
        question: 'What does "Request Enrollment" do?',
        answer:
          'It sends an admission request to the school on behalf of your child. You can track the status (Pending, Approved, etc.) from your dashboard.',
      },
      {
        question: 'How do I save a school for later?',
        answer:
          'Click the save/favorite icon on any school card. Saved schools appear under "Saved" in the sidebar.',
      },
      {
        question: 'How do I find a hospital or specialist?',
        answer:
          'Go to "Hospitals" to browse hospitals by services offered (speech therapy, occupational therapy, developmental pediatrics, child psychiatry) and location.',
      },
      {
        question: 'How do I book an appointment?',
        answer:
          'From a hospital\'s page, select "Book Appointment," choose the child and a time, and confirm. You\'ll see the appointment listed under "Appointments" in the sidebar.',
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
          "Short, guided activities designed to support your child's development in specific areas like communication or social skills. Each includes step-by-step instructions and sometimes a video.",
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
          'We store the profile information you provide (name, age, gender, birthday, diagnosis notes if any), along with screening history, activity progress, appointments, and saved schools. This information is only visible to your parent account.',
      },
      {
        question: "Can I delete my child's profile or my account?",
        answer:
          'Yes. Go to Settings to delete a child profile or your entire account. This action is permanent and removes all associated screening history, appointments, and saved items.',
      },
      {
        question: 'Is my data shared with third parties?',
        answer:
          "No. Your family's information is not sold or shared with advertisers. It's used only to provide AutiCare's features to you.",
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
          "Use the contact form below or email us at support@auticare.local, and we'll get back to you as soon as possible.",
      },
      {
        question: 'Is this a good place to ask about a medical emergency?',
        answer:
          "No. If you believe your child is in immediate danger or medical distress, contact your local emergency services right away. This Help Center and AutiCare's support team are not equipped to respond to emergencies.",
      },
    ],
  },
];
