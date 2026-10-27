import type { LegalSection } from './legal-sections.component';

/** Shown under the title. Replace the placeholder before launch. */
export const TERMS_EFFECTIVE_DATE = '[Insert Date]';

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: 'about',
    title: '1. About AutiCare',
    blocks: [
      {
        kind: 'p',
        text: 'AutiCare provides AI-powered educational support, child behavior tracking, personalized dashboards, learning resources, and connections to schools and specialists.',
      },
      {
        kind: 'callout',
        title: 'Not a diagnosis.',
        text: 'AutiCare does not diagnose autism or replace professional medical advice.',
      },
    ],
  },
  {
    id: 'accounts',
    title: '2. User Accounts',
    blocks: [
      {
        kind: 'list',
        items: [
          { lead: 'Parents', text: 'Can register using their email addresses.' },
          { lead: 'Schools', text: 'Receive accounts created by the AutiCare Admin.' },
          { lead: 'Teachers', text: 'Join through invitations from their School Admin.' },
        ],
      },
      { kind: 'p', text: 'All users must protect their login information.' },
    ],
  },
  {
    id: 'child-information',
    title: '3. Child Information',
    blocks: [
      {
        kind: 'p',
        text: 'Parents must be authorized guardians and provide accurate information about their children. Child information is private and may only be shared with schools or teachers through appropriate authorization.',
      },
    ],
  },
  {
    id: 'ai-features',
    title: '4. AI Features',
    blocks: [
      {
        kind: 'p',
        text: 'AI-generated questionnaires, summaries, and suggestions are for educational purposes only. Results may contain errors and should not be treated as medical diagnoses.',
      },
    ],
  },
  {
    id: 'plans',
    title: '5. Subscription Plans',
    blocks: [
      {
        kind: 'list',
        items: [
          { lead: 'Free', text: 'Limited access to basic features.' },
          { lead: 'Pro', text: '$20/month or $200/year, supporting up to 2 children.' },
          {
            lead: 'Business',
            text: '$60/month or $600/year, including 5 complimentary Pro family accounts.',
          },
        ],
      },
      {
        kind: 'p',
        text: 'Billing, cancellation, and refund conditions will be shown before purchase.',
      },
    ],
  },
  {
    id: 'responsibilities',
    title: '6. User Responsibilities',
    blocks: [
      {
        kind: 'p',
        text: 'Users must not share unauthorized child information, misuse accounts, provide intentionally false information, or disrupt the platform.',
      },
    ],
  },
  {
    id: 'privacy',
    title: '7. Privacy and Security',
    blocks: [
      {
        kind: 'p',
        text: 'AutiCare aims to protect personal and child information using appropriate security measures. More information will be provided in our Privacy Policy.',
      },
    ],
  },
  {
    id: 'partners',
    title: '8. Educational Resources and Partners',
    blocks: [
      {
        kind: 'p',
        text: 'AutiCare may display educational content and information about partner schools and specialists. We do not guarantee the quality or results of third-party services.',
      },
    ],
  },
  {
    id: 'suspension',
    title: '9. Account Suspension',
    blocks: [
      {
        kind: 'p',
        text: 'AutiCare may suspend accounts that violate these terms or create security risks.',
      },
    ],
  },
  {
    id: 'updates',
    title: '10. Updates and Contact',
    blocks: [
      {
        kind: 'p',
        text: 'AutiCare may update its features and Terms of Use. Important changes will be communicated when appropriate.',
      },
      { kind: 'p', text: 'For questions, contact [Official Support Email].' },
      { kind: 'p', text: 'By using AutiCare, you agree to these Terms of Use.' },
    ],
  },
];
