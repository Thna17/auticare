/**
 * Free guides for parents, from the parent education directory (October 2026).
 * Every guide is hosted by its publisher; AutiCare only links to it. Titles are
 * the publisher's own, in English, because that is the language of the guide.
 */
export interface ParentGuide {
  readonly id: string;
  readonly topicEn: string;
  readonly topicKm: string;
  readonly title: string;
  readonly publisher: string;
  readonly year: number | null;
  readonly url: string;
  readonly summaryEn: string;
  readonly summaryKm: string;
}

export const PARENT_GUIDES: readonly ParentGuide[] = [
  {
    id: 'autism-speaks-parents-guide',
    topicEn: 'Understanding autism',
    topicKm: 'ការយល់ដឹងអំពីអូទីស្សឹម',
    title: 'A Parent’s Guide to Autism',
    publisher: 'Autism Speaks',
    year: 2018,
    url: 'https://www.autismspeaks.org/sites/default/files/2018-08/Parents%20Guide%20to%20Autism.pdf',
    summaryEn:
      'A handbook for families who have just learned their child may be autistic: common behaviours, what an assessment can involve, and practical next steps.',
    summaryKm:
      'សៀវភៅណែនាំសម្រាប់គ្រួសារដែលទើបដឹងថាកូនអាចមានអូទីស្សឹម៖ អាកប្បកិរិយាទូទៅ អ្វីដែលការវាយតម្លៃអាចរួមបញ្ចូល និងជំហានបន្ទាប់ដែលអាចធ្វើបាន។',
  },
  {
    id: 'cdc-milestone-checklists',
    topicEn: 'Watching your child grow',
    topicKm: 'ការតាមដានការលូតលាស់របស់កូន',
    title: 'Milestones Matter! Developmental Checklists',
    publisher: 'Centers for Disease Control and Prevention (CDC)',
    year: 2024,
    url: 'https://www.cdc.gov/ncbddd/actearly/pdf/checklists/all_checklists.pdf',
    summaryEn:
      'Age-by-age checklists, from 2 months to 5 years, to help you notice how your child plays, learns, speaks and moves, and to talk with a health worker about what you see.',
    summaryKm:
      'បញ្ជីត្រួតពិនិត្យតាមអាយុ ចាប់ពី ២ ខែ ដល់ ៥ ឆ្នាំ ដើម្បីជួយអ្នកសង្កេតពីរបៀបដែលកូនលេង រៀន និយាយ និងធ្វើចលនា ហើយពិភាក្សាជាមួយបុគ្គលិកសុខាភិបាលអំពីអ្វីដែលអ្នកឃើញ។',
  },
  {
    id: 'who-caregiver-skills-training',
    topicEn: 'Communication and play',
    topicKm: 'ការប្រាស្រ័យទាក់ទង និងការលេង',
    title: 'WHO Caregiver Skills Training (CST)',
    publisher: 'World Health Organization (WHO)',
    year: 2022,
    url: 'https://iris.who.int/server/api/core/bitstreams/5acf950f-e586-456a-b1fc-f348a334c222/content',
    summaryEn:
      'A programme made for places with few specialists. It shows caregivers of children aged 2 to 9 how everyday routines and play at home can support communication.',
    summaryKm:
      'កម្មវិធីដែលរៀបចំសម្រាប់តំបន់ដែលមានអ្នកជំនាញតិច។ វាបង្ហាញអ្នកថែទាំកុមារអាយុ ២ ដល់ ៩ ឆ្នាំ ពីរបៀបដែលទម្លាប់ប្រចាំថ្ងៃ និងការលេងនៅផ្ទះ អាចគាំទ្រការប្រាស្រ័យទាក់ទង។',
  },
  {
    id: 'unicef-feeding-disability-ecd',
    topicEn: 'Everyday care',
    topicKm: 'ការថែទាំប្រចាំថ្ងៃ',
    title: 'Feeding and Disability Resource Bank: Early Childhood Development',
    publisher: 'UNICEF',
    year: null,
    url: 'https://knowledge.unicef.org/feeding-and-disability-resource-bank/early-childhood-development',
    summaryEn:
      'UNICEF’s collection of practical guides for caring for young children with disabilities, including daily play, feeding and safety at home.',
    summaryKm:
      'បណ្តុំឯកសារណែនាំជាក់ស្តែងរបស់ UNICEF សម្រាប់ការថែទាំកុមារតូចៗដែលមានពិការភាព រួមទាំងការលេងប្រចាំថ្ងៃ ការផ្តល់អាហារ និងសុវត្ថិភាពនៅផ្ទះ។',
  },
  {
    id: 'gov-sg-autism-handbook',
    topicEn: 'Sensory needs and routines',
    topicKm: 'តម្រូវការញាណដឹង និងទម្លាប់',
    title: 'Autism Handbook for Parents',
    publisher: 'Government of Singapore',
    year: 2024,
    url: 'https://isomer-user-content.by.gov.sg/373/44650c53-ff8b-46ee-8a8d-cc26602074ab/Autism_Handbook_for_Parents__Final_.pdf',
    summaryEn:
      'A step-by-step handbook on helping your child cope with sensory overload, noise and changes in routine at home.',
    summaryKm:
      'សៀវភៅណែនាំមួយជំហានម្តងៗ អំពីការជួយកូនឱ្យទប់ទល់នឹងការភ្ញោចញាណខ្លាំងពេក សំឡេងរំខាន និងការផ្លាស់ប្តូរទម្លាប់នៅផ្ទះ។',
  },
  {
    id: 'ari-family-resources',
    topicEn: 'Difficult moments',
    topicKm: 'ពេលវេលាលំបាក',
    title: 'Autism Research Institute: resources for families',
    publisher: 'Autism Research Institute',
    year: null,
    url: 'https://autism.org/',
    summaryEn:
      'The institute’s website, with articles and webinars for caregivers on calming distress and keeping everyone safe. Search the site for the topic you need.',
    summaryKm:
      'គេហទំព័ររបស់វិទ្យាស្ថាន ដែលមានអត្ថបទ និងវគ្គបណ្តុះបណ្តាលតាមអនឡាញសម្រាប់អ្នកថែទាំ អំពីការជួយកុមារឱ្យស្ងប់ពីភាពតានតឹង និងរក្សាសុវត្ថិភាពគ្រប់គ្នា។ ស្វែងរកប្រធានបទដែលអ្នកត្រូវការនៅលើគេហទំព័រ។',
  },
  {
    id: 'neurodivergence-wales-parent-guide',
    topicEn: 'Daily routines at home',
    topicKm: 'ទម្លាប់ប្រចាំថ្ងៃនៅផ្ទះ',
    title: 'Autism: A Guide for Parents and Carers',
    publisher: 'Neurodivergence Wales (NHS Wales)',
    year: 2024,
    url: 'https://neurodivergencewales.org/wp-content/uploads/2024/03/Autism_ParentCarersGuide_Eng.pdf',
    summaryEn:
      'A guide for parents and carers of children aged 3 to 12, with visual timetables and templates for building predictable daily routines.',
    summaryKm:
      'ឯកសារណែនាំសម្រាប់ឪពុកម្តាយ និងអ្នកថែទាំកុមារអាយុ ៣ ដល់ ១២ ឆ្នាំ ដែលមានកាលវិភាគជារូបភាព និងគំរូសម្រាប់រៀបចំទម្លាប់ប្រចាំថ្ងៃឱ្យទៀងទាត់។',
  },
  {
    id: 'unicef-ghana-caregiver-manual',
    topicEn: 'Learning at home',
    topicKm: 'ការរៀននៅផ្ទះ',
    title: 'Training Manual for Caregivers of Children with Disabilities',
    publisher: 'UNICEF Ghana',
    year: 2020,
    url: 'https://www.unicef.org/ghana/media/3406/file/Training%20Manual%20for%20Caregivers%20of%20Children%20with%20Disabilities.pdf',
    summaryEn:
      'A manual that helps caregivers adapt simple learning, movement and thinking exercises for their child at home.',
    summaryKm:
      'សៀវភៅណែនាំដែលជួយអ្នកថែទាំកែសម្រួលលំហាត់ការរៀន ចលនា និងការគិតសាមញ្ញៗ សម្រាប់កូននៅផ្ទះ។',
  },
  {
    id: 'who-ecd-guideline-summary',
    topicEn: 'Looking after yourself',
    topicKm: 'ការថែរក្សាខ្លួនឯង',
    title: 'Improving Early Childhood Development: WHO Guideline (summary)',
    publisher: 'World Health Organization (WHO)',
    year: 2020,
    url: 'https://cdn.who.int/media/docs/default-source/mca-documents/child/early-child-development/improving-early-childhood-development-who-guideline-summary.pdf',
    summaryEn:
      'WHO’s recommendations on responsive caregiving and early learning, including support for parents’ and caregivers’ own mental health.',
    summaryKm:
      'អនុសាសន៍របស់ WHO អំពីការថែទាំដោយយកចិត្តទុកដាក់ និងការរៀនសូត្រដំបូង រួមទាំងការគាំទ្រសុខភាពផ្លូវចិត្តរបស់ឪពុកម្តាយ និងអ្នកថែទាំផ្ទាល់។',
  },
  {
    id: 'ccamh-cambodia-research',
    topicEn: 'Support in Cambodia',
    topicKm: 'ការគាំទ្រនៅកម្ពុជា',
    title:
      'Children with neuro-developmental disorders at Center for Child and Adolescent Mental Health in Cambodia',
    publisher: 'Nagoya Journal of Medical Science',
    year: 2022,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9529632/',
    summaryEn:
      'A research article about the children seen at Caritas-CCAMH and the support available in Cambodia. It is written for professionals.',
    summaryKm:
      'អត្ថបទស្រាវជ្រាវអំពីកុមារដែលបានមកទទួលសេវានៅ Caritas-CCAMH និងការគាំទ្រដែលមាននៅកម្ពុជា។ អត្ថបទនេះសរសេរសម្រាប់អ្នកជំនាញ។',
  },
];
