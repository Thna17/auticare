export interface MchatQuestionDefinition {
  readonly id: number;
  readonly questionEn: string;
  readonly questionKm: string;
  readonly exampleEn: string;
  readonly exampleKm: string;
  readonly domain: 'DOMAIN_A' | 'DOMAIN_B' | 'MOTOR';
  readonly domainNameEn: string;
  readonly domainNameKm: string;
  readonly subDomainEn: string;
  readonly subDomainKm: string;
  readonly category: string;
  readonly polarity: 'DIRECT' | 'REVERSE';
}

/**
 * The official 20 questions of the Modified Checklist for Autism in Toddlers,
 * Revised with Follow-Up (M-CHAT-R/F) with bilingual English and native Khmer
 * translations, clinical domain mappings (DSM-5 Domain A & Domain B), and polarities.
 */
export const MCHAT_QUESTIONS_DATA: readonly MchatQuestionDefinition[] = [
  {
    id: 1,
    questionEn: 'If you point at something across the room, does your child look at it?',
    questionKm:
      'ប្រសិនបើអ្នកចង្អុលទៅរបស់អ្វីមួយនៅម្ខាងទៀតនៃបន្ទប់ តើកូនរបស់អ្នកមើលទៅរបស់នោះដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, if you point at a toy or an animal, does your child look at the toy or animal?',
    exampleKm:
      'ឧទាហរណ៍៖ ប្រសិនបើអ្នកចង្អុលទៅប្រដាប់ក្មេងលេង ឬសត្វ តើកូនរបស់អ្នកមើលទៅប្រដាប់ក្មេងលេង ឬសត្វនោះដែរឬទេ?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Nonverbal Communicative Behaviors (Joint Attention)',
    subDomainKm: 'អាកប្បកិរិយាប្រាស្រ័យទាក់ទងមិនប្រើពាក្យសម្តី (ការយកចិត្តទុកដាក់រួម)',
    category: 'Nonverbal Communication',
    polarity: 'REVERSE',
  },
  {
    id: 2,
    questionEn: 'Have you ever wondered if your child might be deaf?',
    questionKm: 'តើអ្នកធ្លាប់ឆ្ងល់ថាកូនរបស់អ្នកអាចថ្លង់ ឬពិបាកស្តាប់ដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, appearing not to hear voices, everyday sounds, or when their name is called.',
    exampleKm: 'ឧទាហរណ៍៖ ហាក់ដូចជាមិនឮសំឡេងនិយាយ សំឡេងទូទៅ ឬនៅពេលហៅឈ្មោះ។',
    domain: 'DOMAIN_B',
    domainNameEn: 'Domain B: Restricted, Repetitive Patterns of Behavior',
    domainNameKm: 'ដែន B៖ គំរូអាកប្បកិរិយាដដែលៗ និងមានកម្រិត',
    subDomainEn: 'Sensory Hyper- or Hypo-Reactivity (Auditory Reactivity)',
    subDomainKm: 'ប្រតិកម្មវិញ្ញាណ (ការទទួលដឹងសំឡេង)',
    category: 'Sensory Response',
    polarity: 'DIRECT',
  },
  {
    id: 3,
    questionEn: 'Does your child play pretend or make-believe?',
    questionKm: 'តើកូនរបស់អ្នកចេះលេងបែបស្រមើស្រមៃ ឬធ្វើពុតដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, pretend to drink from an empty cup, pretend to talk on a phone, or pretend to feed a doll or stuffed animal?',
    exampleKm:
      'ឧទាហរណ៍៖ ធ្វើពុតជាផឹកទឹកពីកែវទទេ ធ្វើពុតជានិយាយទូរស័ព្ទ ឬធ្វើពុតជាបញ្ចុកចំណីតុក្កតា?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Developing, Maintaining, & Understanding Relationships (Shared Imaginative Play)',
    subDomainKm: 'ការអភិវឌ្ឍ និងការយល់ដឹងពីទំនាក់ទំនង (ការលេងស្រមើស្រមៃរួម)',
    category: 'Play & Imagination',
    polarity: 'REVERSE',
  },
  {
    id: 4,
    questionEn: 'Does your child like climbing on things?',
    questionKm: 'តើកូនរបស់អ្នកចូលចិត្តឡើងលើរបស់របរដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, furniture, playground equipment, or stairs.',
    exampleKm: 'ឧទាហរណ៍៖ គ្រឿងសង្ហារិម ឧបករណ៍លេងនៅសួន ឬកាំជណ្តើរ។',
    domain: 'MOTOR',
    domainNameEn: 'Physical & Motor Exploration',
    domainNameKm: 'ការរុករកចលនា និងរាងកាយ',
    subDomainEn: 'Gross Motor Development',
    subDomainKm: 'ការលូតលាស់សាច់ដុំធំ',
    category: 'Motor & Exploration',
    polarity: 'REVERSE',
  },
  {
    id: 5,
    questionEn: 'Does your child make unusual finger movements near his or her eyes?',
    questionKm: 'តើកូនរបស់អ្នកធ្វើចលនាម្រាមដៃប្លែកៗនៅជិតភ្នែករបស់គាត់ដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, does your child wiggle his or her fingers close to his or her eyes?',
    exampleKm: 'ឧទាហរណ៍៖ គ្រវី ឬរលាក់ម្រាមដៃជិតភ្នែករបស់គាត់?',
    domain: 'DOMAIN_B',
    domainNameEn: 'Domain B: Restricted, Repetitive Patterns of Behavior',
    domainNameKm: 'ដែន B៖ គំរូអាកប្បកិរិយាដដែលៗ និងមានកម្រិត',
    subDomainEn: 'Stereotyped or Repetitive Movements',
    subDomainKm: 'ចលនាដដែលៗ ឬតាមទម្លាប់ជាក់លាក់',
    category: 'Repetitive Behaviors',
    polarity: 'DIRECT',
  },
  {
    id: 6,
    questionEn: 'Does your child point with one finger to ask for something or to get help?',
    questionKm: 'តើកូនរបស់អ្នកចង្អុលម្រាមដៃមួយដើម្បីសុំរបស់អ្វីមួយ ឬសុំជំនួយដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, pointing to a snack or toy that is out of reach.',
    exampleKm: 'ឧទាហរណ៍៖ ចង្អុលទៅនំ ឬប្រដាប់ក្មេងលេងដែលនៅឆ្ងាយដៃ។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Nonverbal Communicative Behaviors (Requesting Gestures)',
    subDomainKm: 'កាយវិការប្រាស្រ័យទាក់ទង (ការចង្អុលសុំជំនួយ)',
    category: 'Communication',
    polarity: 'REVERSE',
  },
  {
    id: 7,
    questionEn: 'Does your child point with one finger to show you something interesting?',
    questionKm: 'តើកូនរបស់អ្នកចង្អុលម្រាមដៃមួយដើម្បីបង្ហាញអ្នកពីអ្វីដែលគួរឱ្យចាប់អារម្មណ៍ដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, pointing to an airplane in the sky or a big truck in the road.',
    exampleKm: 'ឧទាហរណ៍៖ ចង្អុលទៅយន្តហោះលើមេឃ ឬឡានធំនៅលើផ្លូវ។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Social-Emotional Reciprocity (Shared Enjoyment & Protodeclarative Pointing)',
    subDomainKm: 'ការឆ្លើយតបផ្លូវចិត្ត-សង្គម (ការចែករំលែកភាពរីករាយ)',
    category: 'Social Interaction',
    polarity: 'REVERSE',
  },
  {
    id: 8,
    questionEn: 'Is your child interested in other children?',
    questionKm: 'តើកូនរបស់អ្នកចាប់អារម្មណ៍លើកុមារដទៃទៀតដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, does your child watch other children, smile at them, or go to them?',
    exampleKm: 'ឧទាហរណ៍៖ សម្លឹងមើលក្មេងដទៃ ញញឹមដាក់ពួកគេ ឬដើរទៅរកពួកគេ?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Social-Emotional Reciprocity (Peer Interest)',
    subDomainKm: 'ការឆ្លើយតបផ្លូវចិត្ត-សង្គម (ការចាប់អារម្មណ៍លើមិត្តភក្តិ)',
    category: 'Social Interaction',
    polarity: 'REVERSE',
  },
  {
    id: 9,
    questionEn:
      'Does your child show you things by bringing them to you or holding them up for you to see – not to get help, but just to share?',
    questionKm:
      'តើកូនរបស់អ្នកបង្ហាញរបស់របរមកអ្នក ដោយយកវាមកឱ្យអ្នក ឬកាន់ឡើងឱ្យអ្នកមើល ដោយគ្រាន់តែចង់ចែករំលែក មិនមែនសុំជំនួយទេ?',
    exampleEn: 'FOR EXAMPLE, showing you a flower, a stuffed animal, or a toy truck.',
    exampleKm: 'ឧទាហរណ៍៖ បង្ហាញផ្កា តុក្កតា ឬឡានក្មេងលេង។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Social-Emotional Reciprocity (Showing & Joint Attention)',
    subDomainKm: 'ការឆ្លើយតបផ្លូវចិត្ត-សង្គម (ការបង្ហាញ និងចែករំលែក)',
    category: 'Social Interaction',
    polarity: 'REVERSE',
  },
  {
    id: 10,
    questionEn: 'Does your child respond when you call his or her name?',
    questionKm: 'តើកូនរបស់អ្នកឆ្លើយតបនៅពេលអ្នកហៅឈ្មោះរបស់គាត់ដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, does he or she look up, talk or babble, or stop what he or she is doing when you call his or her name?',
    exampleKm: 'ឧទាហរណ៍៖ ងើបមើល និយាយ ឬបញ្ចេញសំឡេង ឬឈប់ធ្វើអ្វីដែលគាត់កំពុងធ្វើនៅពេលហៅឈ្មោះ?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Social-Emotional Reciprocity (Response to Name)',
    subDomainKm: 'ការឆ្លើយតបផ្លូវចិត្ត-សង្គម (ការឆ្លើយតបនឹងការហៅឈ្មោះ)',
    category: 'Social Interaction',
    polarity: 'REVERSE',
  },
  {
    id: 11,
    questionEn: 'When you smile at your child, does he or she smile back at you?',
    questionKm: 'នៅពេលអ្នកញញឹមដាក់កូនរបស់អ្នក តើគាត់ញញឹមតបមកអ្នកវិញដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, returning your smile with a warm, shared facial expression.',
    exampleKm: 'ឧទាហរណ៍៖ ញញឹមឆ្លើយតបដោយក្តីស្រលាញ់ និងការចែករំលែកអារម្មណ៍។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Social-Emotional Reciprocity (Shared Smile & Affect)',
    subDomainKm: 'ការឆ្លើយតបផ្លូវចិត្ត-សង្គម (ការញញឹមឆ្លើយតប)',
    category: 'Social Interaction',
    polarity: 'REVERSE',
  },
  {
    id: 12,
    questionEn: 'Does your child get upset by everyday noises?',
    questionKm: 'តើកូនរបស់អ្នកពិបាកចិត្ត ឬខឹងនឹងសំឡេងប្រចាំថ្ងៃធម្មតាដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, does your child scream or cry to noise such as a vacuum cleaner or loud music?',
    exampleKm: 'ឧទាហរណ៍៖ ស្រែក ឬយំនៅពេលឮសំឡេងម៉ាស៊ីនបូមធូលី ឬតន្ត្រីខ្លាំង?',
    domain: 'DOMAIN_B',
    domainNameEn: 'Domain B: Restricted, Repetitive Patterns of Behavior',
    domainNameKm: 'ដែន B៖ គំរូអាកប្បកិរិយាដដែលៗ និងមានកម្រិត',
    subDomainEn: 'Sensory Hyper- or Hypo-Reactivity (Auditory Hyper-Reactivity)',
    subDomainKm: 'ប្រតិកម្មវិញ្ញាណ (ភាពរសើបខ្លាំងចំពោះសំឡេង)',
    category: 'Sensory Response',
    polarity: 'DIRECT',
  },
  {
    id: 13,
    questionEn: 'Does your child walk?',
    questionKm: 'តើកូនរបស់អ្នកចេះដើរដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, taking independent steps without being held or supported.',
    exampleKm: 'ឧទាហរណ៍៖ ដើរដោយខ្លួនឯងដោយមិនចាំបាច់មានអ្នកទប់។',
    domain: 'MOTOR',
    domainNameEn: 'Physical & Motor Exploration',
    domainNameKm: 'ការរុករកចលនា និងរាងកាយ',
    subDomainEn: 'Gross Motor Milestone',
    subDomainKm: 'ការវិវត្តចលនាធំ (ការចេះដើរ)',
    category: 'Motor & Exploration',
    polarity: 'REVERSE',
  },
  {
    id: 14,
    questionEn:
      'Does your child look you in the eye when you are talking to him or her, playing with him or her, or dressing him or her?',
    questionKm:
      'តើកូនរបស់អ្នកសម្លឹងមើលភ្នែកអ្នកនៅពេលអ្នកនិយាយជាមួយគាត់ លេងជាមួយគាត់ ឬស្លៀកពាក់ឱ្យគាត់ដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, looking directly into your eyes rather than looking away or at objects.',
    exampleKm: 'ឧទាហរណ៍៖ សម្លឹងមើលភ្នែកអ្នកដោយផ្ទាល់ មិនមែនមើលដៃ ឬមើលទៅកន្លែងផ្សេងទេ។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Nonverbal Communicative Behaviors (Eye Contact)',
    subDomainKm: 'អាកប្បកិរិយាប្រាស្រ័យទាក់ទងមិនប្រើពាក្យសម្តី (ការសម្លឹងភ្នែក)',
    category: 'Nonverbal Communication',
    polarity: 'REVERSE',
  },
  {
    id: 15,
    questionEn: 'Does your child try to copy what you do?',
    questionKm: 'តើកូនរបស់អ្នកព្យាយាមធ្វើត្រាប់តាមអ្វីដែលអ្នកធ្វើដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, wave bye-bye, clap, make a funny noise when you do.',
    exampleKm: 'ឧទាហរណ៍៖ បក់ដៃលា ទះដៃ ឬធ្វើសំឡេងកំប្លែងតាមអ្នក។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Nonverbal Communicative Behaviors (Imitation & Gestures)',
    subDomainKm: 'អាកប្បកិរិយាប្រាស្រ័យទាក់ទង (ការធ្វើត្រាប់តាម និងកាយវិការ)',
    category: 'Communication',
    polarity: 'REVERSE',
  },
  {
    id: 16,
    questionEn:
      'If you turn your head to look at something, does your child look around to see what you are looking at?',
    questionKm:
      'ប្រសិនបើអ្នកងាកក្បាលទៅមើលអ្វីមួយ តើកូនរបស់អ្នកងាកមើលតាមដើម្បីដឹងថាអ្នកកំពុងមើលអ្វីដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, following your gaze to notice an object or an event across the room.',
    exampleKm: 'ឧទាហរណ៍៖ មើលតាមខ្សែភ្នែករបស់អ្នក ដើម្បីឃើញវត្ថុ ឬព្រឹត្តិការណ៍នោះ។',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Nonverbal Communicative Behaviors (Gaze Following & Joint Attention)',
    subDomainKm: 'អាកប្បកិរិយាប្រាស្រ័យទាក់ទង (ការមើលតាមខ្សែភ្នែក)',
    category: 'Nonverbal Communication',
    polarity: 'REVERSE',
  },
  {
    id: 17,
    questionEn: 'Does your child try to get you to watch him or her?',
    questionKm: 'តើកូនរបស់អ្នកព្យាយាមឱ្យអ្នកមើលគាត់ដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, does your child look at you for praise, or say “look” or “watch me”?',
    exampleKm: 'ឧទាហរណ៍៖ សម្លឹងមើលអ្នកដើម្បីឱ្យសរសើរ ឬនិយាយថា "មើលខ្ញុំ" ឬ "មើលនេះ"?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Social-Emotional Reciprocity (Praise & Attention Seeking)',
    subDomainKm: 'ការឆ្លើយតបផ្លូវចិត្ត-សង្គម (ការស្វែងរកការសរសើរ និងការយកចិត្តទុកដាក់)',
    category: 'Social Interaction',
    polarity: 'REVERSE',
  },
  {
    id: 18,
    questionEn: 'Does your child understand when you tell him or her to do something?',
    questionKm: 'តើកូនរបស់អ្នកយល់នៅពេលអ្នកប្រាប់ឱ្យគាត់ធ្វើអ្វីមួយដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, if you don’t point, can your child understand “put the book on the chair” or “bring me the blanket”?',
    exampleKm:
      'ឧទាហរណ៍៖ ប្រសិនបើអ្នកមិនចង្អុល តើគាត់យល់ពាក្យ "យកសៀវភៅដាក់លើកៅអី" ឬ "យកភួយមកឱ្យម៉ាក់/ប៉ា" ដែរឬទេ?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Developing, Maintaining, & Understanding Relationships (Receptive Language)',
    subDomainKm: 'ការអភិវឌ្ឍទំនាក់ទំនង (ការយល់ភាសា)',
    category: 'Communication',
    polarity: 'REVERSE',
  },
  {
    id: 19,
    questionEn:
      'If something new happens, does your child look at your face to see how you feel about it?',
    questionKm:
      'ប្រសិនបើមានរឿងថ្មីអ្វីមួយកើតឡើង តើកូនរបស់អ្នកសម្លឹងមើលមុខអ្នកដើម្បីដឹងពីអារម្មណ៍របស់អ្នកដែរឬទេ?',
    exampleEn:
      'FOR EXAMPLE, if he or she hears a strange or funny noise, or sees a new toy, will he or she look at your face?',
    exampleKm:
      'ឧទាហរណ៍៖ បើឮសំឡេងចម្លែក ឬឃើញប្រដាប់ក្មេងលេងថ្មី តើគាត់មើលមុខអ្នកដើម្បីស្ទង់អារម្មណ៍ដែរឬទេ?',
    domain: 'DOMAIN_A',
    domainNameEn: 'Domain A: Social Communication & Interaction',
    domainNameKm: 'ដែន A៖ ការប្រាស្រ័យទាក់ទង និងទំនាក់ទំនងសង្គម',
    subDomainEn: 'Nonverbal Communicative Behaviors (Social Referencing & Facial Expressions)',
    subDomainKm: 'អាកប្បកិរិយាប្រាស្រ័យទាក់ទង (ការស្ទង់អារម្មណ៍តាមទឹកមុខ)',
    category: 'Nonverbal Communication',
    polarity: 'REVERSE',
  },
  {
    id: 20,
    questionEn: 'Does your child like movement activities?',
    questionKm: 'តើកូនរបស់អ្នកចូលចិត្តសកម្មភាពដែលមានចលនាដែរឬទេ?',
    exampleEn: 'FOR EXAMPLE, being swung or bounced on your knee.',
    exampleKm: 'ឧទាហរណ៍៖ យោលទោង ឬលោតផ្លោតៗលើជង្គង់របស់អ្នក។',
    domain: 'MOTOR',
    domainNameEn: 'Physical & Motor Exploration',
    domainNameKm: 'ការរុករកចលនា និងរាងកាយ',
    subDomainEn: 'Sensory Reactivity & Vestibular Movement',
    subDomainKm: 'ការចូលរួមចលនារាងកាយ និងលំនឹង',
    category: 'Motor & Exploration',
    polarity: 'REVERSE',
  },
];

/** Lookup map by question text for fast translation matching */
export const MCHAT_QUESTIONS_BY_TEXT: Readonly<Record<string, MchatQuestionDefinition>> =
  Object.fromEntries(
    MCHAT_QUESTIONS_DATA.map((q) => [
      q.questionEn
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim(),
      q,
    ]),
  );

export function findMchatQuestion(text: string): MchatQuestionDefinition | undefined {
  if (!text) return undefined;
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
  // Direct match
  if (MCHAT_QUESTIONS_BY_TEXT[normalized]) {
    return MCHAT_QUESTIONS_BY_TEXT[normalized];
  }
  // Substring match
  return MCHAT_QUESTIONS_DATA.find((q) => {
    const qNorm = q.questionEn
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
    return normalized.includes(qNorm.slice(0, 30)) || qNorm.includes(normalized.slice(0, 30));
  });
}
