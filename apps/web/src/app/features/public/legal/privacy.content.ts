import type { LegalSection } from './legal-sections.component';

/** Shown under the title. Replace the placeholder before launch. */
export const PRIVACY_EFFECTIVE_DATE = '[day] [month] [year]';

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: 'introduction',
    title: 'Article 1. Introduction and Scope',
    blocks: [
      {
        kind: 'p',
        n: '1.1',
        text: 'This Privacy Policy (the "Policy") explains how AutiCare ("AutiCare", "we", "us" or "our") collects, uses, discloses and protects Personal Data in connection with the AutiCare platform.',
      },
      {
        kind: 'p',
        n: '1.2',
        text: 'AutiCare is a digital family-support platform developed by [team name] of [university or organisation], with its address at [address], Phnom Penh, Kingdom of Cambodia. AutiCare is responsible for the Personal Data processed through the Platform.',
      },
      {
        kind: 'p',
        n: '1.3',
        text: 'This Policy applies to all Users of the Platform, including Parents, School Staff, Healthcare Provider Staff and Partner Organisations.',
      },
      {
        kind: 'p',
        n: '1.4',
        text: 'By creating an account or using the Platform, a User acknowledges that they have read and understood this Policy.',
      },
      {
        kind: 'p',
        n: '1.5',
        lead: 'Nature of the Platform.',
        text: 'AutiCare is an informational mentor and assistant. It helps families and professionals organise information, record observations, and find general guidance, activities and resources.',
      },
      {
        kind: 'callout',
        title: '1.6 No medical advice.',
        text: 'AutiCare is not a healthcare provider and does not provide medical, psychological, therapeutic or diagnostic services. No content on the Platform, including the developmental check-in, its results, guidance, activities and AI-assisted answers, constitutes medical advice, diagnosis or treatment. Use of the Platform does not create a doctor–patient, therapist–client or any other professional relationship between AutiCare and any User or child.',
      },
      {
        kind: 'p',
        n: '1.7',
        lead: 'User responsibility.',
        text: "Users shall seek the advice of a qualified clinician for any question about a child's health, development or care, and shall not disregard, delay or replace professional advice because of any content on the Platform. Any decision made on the basis of Platform content is the sole responsibility of the User and the professionals they choose.",
      },
      {
        kind: 'p',
        n: '1.8',
        lead: 'Emergencies.',
        text: 'The Platform is not an emergency service. In an emergency, Users shall contact emergency services immediately (in Cambodia: ambulance 119, police 117).',
      },
      {
        kind: 'p',
        n: '1.9',
        lead: 'Limitation of liability.',
        text: 'To the fullest extent permitted by the laws of the Kingdom of Cambodia, AutiCare shall not be liable for any loss, injury or damage arising from reliance on content provided through the Platform, or from any medical, clinical, therapeutic or educational decision made by a User or any third party. Nothing in this Policy excludes any liability that cannot be excluded under applicable law.',
      },
    ],
  },
  {
    id: 'definitions',
    title: 'Article 2. Definitions',
    blocks: [
      {
        kind: 'p',
        n: '2.1',
        text: '"Platform" means the AutiCare web application and its related services.',
      },
      {
        kind: 'p',
        n: '2.2',
        text: '"Personal Data" means any information relating to an identified or identifiable person, including a child.',
      },
      {
        kind: 'p',
        n: '2.3',
        text: '"User" means any person who holds an account on the Platform.',
      },
      {
        kind: 'p',
        n: '2.4',
        text: '"Parent" means a parent or legal guardian who creates an account and adds a Child Profile.',
      },
      {
        kind: 'p',
        n: '2.5',
        text: '"Child Profile" means the record of a child created by a Parent on the Platform.',
      },
      {
        kind: 'p',
        n: '2.6',
        text: '"School Staff" and "Healthcare Provider Staff" mean staff of a school, hospital, clinic or therapy centre who hold an account on the Platform by invitation from AutiCare.',
      },
      {
        kind: 'p',
        n: '2.7',
        text: '"Partner Organisation" means a school, hospital, clinic or therapy centre that has signed a partnership agreement or memorandum of understanding with AutiCare.',
      },
    ],
  },
  {
    id: 'collection',
    title: 'Article 3. Personal Data We Collect',
    blocks: [
      {
        kind: 'p',
        n: '3.1',
        text: 'AutiCare collects only the Personal Data necessary to provide the Platform. AutiCare does not request government identification numbers, medical record numbers or diagnostic charts.',
      },
      {
        kind: 'p',
        n: '3.2',
        text: 'AutiCare collects the following categories of Personal Data:',
      },
      {
        kind: 'table',
        head: ['Information', 'Examples', 'Who provides it'],
        rows: [
          [
            'Account',
            'Name, email, password (stored only as a secure hash), role, preferred language',
            'The account holder',
          ],
          ['Optional contact details', 'Phone number, social media handle', 'Parent'],
          [
            'Child profile',
            'First name, date of birth, support notes such as routines or communication preferences',
            'Parent',
          ],
          ['Screening', 'Answers to the short check-in, the result band and date', 'Parent'],
          [
            'Observations',
            'Daily behaviour notes and the patterns AutiCare finds in them',
            'Parent',
          ],
          ['Documents', 'Reports and files a parent or school uploads', 'Parent or school'],
          [
            'School records',
            'Enrolment, activity reports, admission requests',
            'Parent or school staff',
          ],
          [
            'Appointments',
            'Requested date, specialist, reason for visit, notes',
            'Parent or hospital staff',
          ],
          ['AI assistant', 'Questions asked and the answers given', 'Parent'],
          [
            'Technical',
            'Sign-in sessions, security logs, device and browser type',
            'Collected automatically',
          ],
        ],
      },
      {
        kind: 'p',
        n: '3.3',
        lead: 'Cookies.',
        text: "The Platform uses only strictly necessary cookies to maintain a User's signed-in session. AutiCare does not use advertising, analytics or tracking cookies.",
      },
    ],
  },
  {
    id: 'purposes',
    title: 'Article 4. Purposes of Processing',
    blocks: [
      {
        kind: 'p',
        n: '4.1',
        text: 'AutiCare processes Personal Data only for the following purposes:',
      },
      {
        kind: 'list',
        items: [
          {
            text: '(a) to provide the Parent with access to Child Profiles, check-in results, observations and progress records;',
          },
          {
            text: "(b) to provide home activities and sourced guidance appropriate to the child's age and needs;",
          },
          {
            text: '(c) to transmit appointment requests to the hospital, clinic or therapy centre selected by the Parent;',
          },
          {
            text: '(d) to transmit enrolment or admission requests to the school selected by the Parent;',
          },
          {
            text: '(e) to send service communications, including password resets and account invitations; and',
          },
          {
            text: '(f) to maintain the security, integrity and proper functioning of the Platform.',
          },
        ],
      },
      { kind: 'p', n: '4.2', text: 'AutiCare shall not:' },
      {
        kind: 'list',
        items: [
          { text: '(a) sell, rent or trade Personal Data;' },
          {
            text: '(b) display advertising or disclose Personal Data to advertising networks;',
          },
          { text: '(c) make any Child Profile or check-in result publicly available; or' },
          { text: '(d) use check-in results to provide a medical diagnosis.' },
        ],
      },
      {
        kind: 'p',
        n: '4.3',
        lead: 'AI-assisted services.',
        text: 'When a Parent submits a question to the AI assistant, the question and the minimum context necessary to answer it are transmitted to [name of AI service provider]. AutiCare shall require that provider not to use such data to train its models.',
      },
      {
        kind: 'p',
        n: '4.4',
        lead: 'Statistics.',
        text: 'AutiCare may publish statistical information only in aggregated and anonymised form from which no individual family or child can be identified.',
      },
    ],
  },
  {
    id: 'access',
    title: 'Article 5. Access and Disclosure',
    blocks: [
      {
        kind: 'p',
        n: '5.1',
        text: 'The Parent controls the Child Profile. Access to Personal Data on the Platform is limited by role as follows:',
      },
      {
        kind: 'table',
        head: ['Role', 'Can see', 'Cannot see'],
        rows: [
          ['Parent', 'Everything about their own children', "Other families' children"],
          [
            'School staff',
            'Children enrolled at their school, and the activity reports they write',
            "Screening answers, observations, AI chats, other schools' children",
          ],
          [
            'Hospital or clinic staff',
            'Appointment requests sent to them, with the details the parent included',
            "Screening answers, observations, AI chats, other providers' patients",
          ],
          [
            'AutiCare administrators',
            'Accounts, the school and hospital directory, and a list of active child profiles for oversight',
            'AI chats and observations; other details only when support or safety needs them',
          ],
        ],
      },
      {
        kind: 'p',
        n: '5.2',
        text: "The Platform verifies each User's role on every request. Sensitive actions are recorded in an audit log.",
      },
      {
        kind: 'p',
        n: '5.3',
        lead: 'Partner Organisations.',
        text: 'A Partner Organisation receives the same access as its School Staff or Healthcare Provider Staff described in clause 5.1 and no wider access. A Partner Organisation shall not copy, export or use Personal Data for any other purpose without the prior written consent of the Parent concerned.',
      },
      {
        kind: 'p',
        n: '5.4',
        lead: 'Service providers.',
        text: "AutiCare uses third-party providers for hosting, email delivery and AI-assisted services. These providers process Personal Data only on AutiCare's instructions and only to the extent necessary to provide their services.",
      },
      {
        kind: 'p',
        n: '5.5',
        lead: 'Legal requirements.',
        text: 'AutiCare shall disclose Personal Data to a public authority only where required by the laws of the Kingdom of Cambodia, or where necessary to protect a child from serious harm.',
      },
    ],
  },
  {
    id: 'children',
    title: "Article 6. Children's Personal Data and Parental Consent",
    blocks: [
      {
        kind: 'p',
        n: '6.1',
        text: 'Children shall not hold accounts on the Platform. Only a Parent may create a Child Profile.',
      },
      {
        kind: 'p',
        n: '6.2',
        text: "By creating a Child Profile, the Parent confirms that they are the child's parent or legal guardian and consents to the processing of the child's Personal Data in accordance with this Policy.",
      },
      {
        kind: 'p',
        n: '6.3',
        text: 'A school, hospital, clinic or therapy centre may access a Child Profile only after the Parent has sent it an enrolment request or appointment request through the Platform.',
      },
      {
        kind: 'p',
        n: '6.4',
        text: 'A Parent may withdraw such access at any time. Upon withdrawal, the organisation concerned shall no longer receive new Personal Data about the child.',
      },
      {
        kind: 'p',
        n: '6.5',
        text: "AutiCare collects only the minimum Personal Data about a child necessary for the Platform: the child's first name, date of birth and any notes the Parent chooses to provide.",
      },
    ],
  },
  {
    id: 'security',
    title: 'Article 7. Data Storage, Security and Retention',
    blocks: [
      {
        kind: 'p',
        n: '7.1',
        text: "Personal Data is stored on secure cloud servers in Singapore operated by AutiCare's hosting provider. AutiCare applies the following security measures:",
      },
      {
        kind: 'list',
        items: [
          {
            text: '(a) passwords are stored only as a secure one-way hash and cannot be read by AutiCare;',
          },
          {
            text: '(b) sessions use encrypted, HTTP-only cookies, and all data in transit is protected by HTTPS;',
          },
          {
            text: '(c) server logs exclude passwords, session cookies and child support notes; and',
          },
          {
            text: "(d) each request is checked against the User's role before any record is returned.",
          },
        ],
      },
      {
        kind: 'p',
        n: '7.2',
        text: 'AutiCare retains Personal Data for the periods set out below:',
      },
      {
        kind: 'table',
        head: ['Information', 'How long we keep it'],
        rows: [
          ['Account and child records', 'While the account is open'],
          ['Archived child profiles', 'Until the parent deletes them or closes the account'],
          ['Uploads not yet attached to a report', '24 hours'],
          ['Security and audit logs', '[12 months — confirm]'],
          [
            'After an account is closed',
            'Deleted within [30 days — confirm], except where law requires us to keep it',
          ],
        ],
      },
      {
        kind: 'p',
        n: '7.3',
        lead: 'Breach notification.',
        text: 'If AutiCare becomes aware of a breach affecting Personal Data, it shall notify the affected Users and Partner Organisations within [72 hours — confirm] and take prompt steps to contain the breach.',
      },
    ],
  },
  {
    id: 'rights',
    title: 'Article 8. Rights of Users',
    blocks: [
      {
        kind: 'p',
        n: '8.1',
        text: 'Subject to applicable law, each User has the right to:',
      },
      {
        kind: 'list',
        items: [
          {
            text: '(a) access the Personal Data that AutiCare holds about them and, in the case of a Parent, about their child;',
          },
          {
            text: '(b) correct inaccurate or incomplete Personal Data, including through the Settings page of the Platform;',
          },
          { text: '(c) obtain a copy of their Personal Data in a commonly used format;' },
          {
            text: '(d) request deletion of their account and associated Personal Data, subject to clause 7.2; and',
          },
          {
            text: '(e) withdraw consent to the sharing of a Child Profile with any organisation at any time.',
          },
        ],
      },
      {
        kind: 'p',
        n: '8.2',
        text: 'Requests under this Article shall be submitted to the contact set out in Article 11. AutiCare shall respond within [14 days — confirm] of receiving a request and may ask the requester to verify their identity.',
      },
    ],
  },
  {
    id: 'changes',
    title: 'Article 9. Changes to this Policy',
    blocks: [
      {
        kind: 'p',
        n: '9.1',
        text: 'AutiCare may amend this Policy from time to time. The amended Policy shall be published on the Platform with its new effective date.',
      },
      {
        kind: 'p',
        n: '9.2',
        text: 'Where an amendment materially affects how Personal Data is used or shared, AutiCare shall notify Users by email and through the Platform at least fourteen (14) days before the amendment takes effect.',
      },
    ],
  },
  {
    id: 'law',
    title: 'Article 10. Governing Law',
    blocks: [
      {
        kind: 'p',
        n: '10.1',
        text: 'This Policy shall be governed by and construed in accordance with the laws of the Kingdom of Cambodia.',
      },
      {
        kind: 'p',
        n: '10.2',
        text: 'This Policy is published in English and Khmer. In case of any inconsistency, the [English / Khmer] version shall prevail.',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Article 11. Contact Information',
    blocks: [
      {
        kind: 'p',
        n: '11.1',
        text: 'Questions, requests and complaints regarding this Policy or the processing of Personal Data shall be addressed to:',
      },
      {
        kind: 'table',
        rows: [
          ['Name', '[Name]'],
          ['Position', 'Data Protection Contact, AutiCare'],
          ['Email', '[official email]'],
          ['Telephone', '[phone]'],
          ['Address', '[address], Phnom Penh, Kingdom of Cambodia'],
        ],
      },
    ],
  },
];
