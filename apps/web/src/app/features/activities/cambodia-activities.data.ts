import type { ActivityResponse } from '@auticare/contracts';

export interface ActivityStep {
  readonly titleKm: string;
  readonly titleEn: string;
  readonly descKm: string;
  readonly descEn: string;
  readonly bilingualTitle: string;
  readonly bilingualDesc: string;
}

export interface CambodianActivityItem extends ActivityResponse {
  readonly titleKm: string;
  readonly titleEn: string;
  readonly summaryKm: string;
  readonly summaryEn: string;
  readonly materialsBilingual: readonly string[];
  readonly steps: readonly ActivityStep[];
  /** A demonstration video, when one shows this activity. */
  readonly videoUrl?: string;
  readonly safetyEn?: string;
  readonly safetyKm?: string;
  readonly durationMinutes?: number;
}

export const CAMBODIAN_HOME_ACTIVITIES: readonly CambodianActivityItem[] = [
  {
    id: 'cambodia-act-1',
    title: 'Sensory Rice & Grain Bin (ការលេងអង្ករ និងគ្រាប់ធញ្ញជាតិចម្រុះពណ៌)',
    titleEn: 'Sensory Rice & Grain Bin',
    titleKm: 'ការលេងអង្ករ និងគ្រាប់ធញ្ញជាតិចម្រុះពណ៌',
    category: 'Sensory',
    minAgeMonths: 18,
    maxAgeMonths: 72,
    summary:
      'ការរុករកញាណដឹងដោយប្រើអង្ករផ្កាម្លិះ និងគ្រាប់សណ្តែកស្ងួត ដើម្បីផ្ដល់ការភ្ញោចស្ទាបអង្អែលស្ងប់ចិត្ត និងបង្កើនការផ្ដោតអារម្មណ៍។ (Sensory tactile exploration using jasmine rice and dry lentils for soothing proprioceptive regulation.)',
    summaryEn:
      'Sensory tactile exploration using jasmine rice and dry lentils for soothing proprioceptive regulation.',
    summaryKm:
      'ការរុករកញាណដឹងដោយប្រើអង្ករផ្កាម្លិះ និងគ្រាប់សណ្តែកស្ងួត ដើម្បីផ្ដល់ការភ្ញោចស្ទាបអង្អែលស្ងប់ចិត្ត និងបង្កើនការផ្ដោតអារម្មណ៍។',
    materialsBilingual: [
      'ចានដែកធំ ឬធុងជ័រស្អាត (Large shallow sensory bin)',
      'អង្ករផ្កាម្លិះ ឬអង្ករពណ៌ស្ងួត (Jasmine or dry colored rice)',
      'គ្រាប់សណ្តែកខៀវ ឬសណ្តែកដីស្ងួត (Dried mung beans or lentils)',
      'ស្លាបព្រាឈើ និងកែវជ័រតូចៗ (Wooden spoons and plastic cups)',
    ],
    steps: [
      {
        titleKm: '១. រៀបចំធុងអង្ករ',
        titleEn: 'Step 1: Prepare Sensory Bin',
        descKm:
          'ចាក់អង្ករផ្កាម្លិះ និងគ្រាប់ធញ្ញជាតិស្ងួតចូលក្នុងធុងជ័រស្អាត រួចដាក់នៅលើកន្ទេល ឬកម្រាលស្អាត។',
        descEn:
          'Pour jasmine rice and dried beans into a clean shallow container placed on a play mat.',
        bilingualTitle: '១. រៀបចំធុងអង្ករ (Prepare Sensory Bin)',
        bilingualDesc:
          'ចាក់អង្ករផ្កាម្លិះ និងគ្រាប់ធញ្ញជាតិស្ងួតចូលក្នុងធុងជ័រស្អាត រួចដាក់នៅលើកន្ទេល ឬកម្រាលស្អាត។ (Pour jasmine rice and dried beans into a clean shallow container placed on a play mat.)',
      },
      {
        titleKm: '២. ការរុករកដោយដៃទទេ',
        titleEn: 'Step 2: Hands-on Tactile Exploration',
        descKm:
          'លើកទឹកចិត្តកុមារឱ្យលូកដៃចាប់ ក្តាប់ និងច្រោះអង្ករយឺតៗតាមម្រាមដៃដើម្បីទទួល sensory input ស្ងប់អារម្មណ៍។',
        descEn:
          'Encourage your child to gently bury hands, scoop, and let rice trickle through fingers for calming sensory feedback.',
        bilingualTitle: '២. ការរុករកដោយដៃទទេ (Hands-on Tactile Exploration)',
        bilingualDesc:
          'លើកទឹកចិត្តកុមារឱ្យលូកដៃចាប់ ក្តាប់ និងច្រោះអង្ករយឺតៗតាមម្រាមដៃដើម្បីទទួល sensory input ស្ងប់អារម្មណ៍។ (Encourage your child to gently bury hands, scoop, and let rice trickle through fingers for calming sensory feedback.)',
      },
      {
        titleKm: '៣. ល្បែងចាក់បំពេញ និងលាក់វត្ថុ',
        titleEn: 'Step 3: Pouring & Hidden Treasure Hunt',
        descKm: 'លាក់ប្រដាប់ក្មេងលេងតូចៗក្នុងអង្ករ រួចឱ្យកុមារស្វែងរក និងចាក់បំពេញកែវជ័រតូចៗ។',
        descEn:
          'Hide small toys beneath the grains for a gentle search-and-find activity that builds motor precision.',
        bilingualTitle: '៣. ល្បែងចាក់បំពេញ និងលាក់វត្ថុ (Pouring & Hidden Treasure Hunt)',
        bilingualDesc:
          'លាក់ប្រដាប់ក្មេងលេងតូចៗក្នុងអង្ករ រួចឱ្យកុមារស្វែងរក និងចាក់បំពេញកែវជ័រតូចៗ។ (Hide small toys beneath the grains for a gentle search-and-find activity that builds motor precision.)',
      },
      {
        titleKm: '៤. អបអរសាទរការចូលរួម',
        titleEn: 'Step 4: Celebrate Focused Engagement',
        descKm: 'សរសើរកុមារចំពោះការផ្តោតអារម្មណ៍ និងការស្វែងយល់ដោយមិនបង្ខំ។',
        descEn: "Praise your child's calm focus and self-directed tactile curiosity.",
        bilingualTitle: '៤. អបអរសាទរការចូលរួម (Celebrate Focused Engagement)',
        bilingualDesc:
          'សរសើរកុមារចំពោះការផ្តោតអារម្មណ៍ និងការស្វែងយល់ដោយមិនបង្ខំ។ (Praise your child’s calm focus and self-directed tactile curiosity.)',
      },
    ],
  },
  {
    id: 'cambodia-act-2',
    title: 'Calming Coconut Water & Bubble Play (ល្បែងពពុះទឹក និងសំបកដូងបន្ធូរអារម្មណ៍)',
    titleEn: 'Calming Coconut Water & Bubble Play',
    titleKm: 'ល្បែងពពុះទឹក និងសំបកដូងបន្ធូរអារម្មណ៍',
    category: 'Sensory',
    minAgeMonths: 24,
    maxAgeMonths: 60,
    summary:
      'ការផ្លុំពពុះទឹកជាមួយត្រឡោកដូង ឬកែវជ័រ ជួយដល់ការគ្រប់គ្រងដង្ហើមវែងៗ សម្រួលសាច់ដុំមាត់ និងការតាមដានដោយភ្នែក។ (Gentle bubble blowing with coconut bowls supporting oral-motor calming and visual tracking.)',
    summaryEn:
      'Gentle bubble blowing with coconut bowls supporting oral-motor calming and visual tracking.',
    summaryKm:
      'ការផ្លុំពពុះទឹកជាមួយត្រឡោកដូង ឬកែវជ័រ ជួយដល់ការគ្រប់គ្រងដង្ហើមវែងៗ សម្រួលសាច់ដុំមាត់ និងការតាមដានដោយភ្នែក។',
    materialsBilingual: [
      'ត្រឡោកដូងស្អាត ឬចានជ័រ (Polished coconut shells or gentle bowls)',
      'ទឹកសាប៊ូពពុះកុមារធម្មជាតិ (Child-safe gentle bubble solution)',
      'ទងផ្លុំពពុះ ឬបំពង់បឺតក្រដាស (Bubble wands or paper straws)',
      'កន្សែងទន់សម្រាប់ជូតដៃ (Soft cloth for drying hands)',
    ],
    steps: [
      {
        titleKm: '១. បង្កើតពពុះក្នុងត្រឡោកដូង',
        titleEn: 'Step 1: Prepare Coconut Bubble Basin',
        descKm: 'ចាក់ទឹកសាប៊ូពពុះចូលក្នុងត្រឡោកដូងស្អាត ឬចានជ័រតូច។',
        descEn: 'Fill smooth coconut halves or bowls with warm water and child-safe bubble foam.',
        bilingualTitle: '១. បង្កើតពពុះក្នុងត្រឡោកដូង (Prepare Coconut Bubble Basin)',
        bilingualDesc:
          'ចាក់ទឹកសាប៊ូពពុះចូលក្នុងត្រឡោកដូងស្អាត ឬចានជ័រតូច។ (Fill smooth coconut halves or bowls with warm water and child-safe bubble foam.)',
      },
      {
        titleKm: '២. ការដកដង្ហើម និងផ្លុំយឺតៗ',
        titleEn: 'Step 2: Deep Breathing & Slow Blowing',
        descKm: 'ណែនាំកុមារឱ្យដកដង្ហើមវែងៗតាមច្រមុះ ហើយផ្លុំខ្យល់ចេញតាមមាត់យឺតៗដើម្បីបង្កើតពពុះ។',
        descEn:
          'Model taking a deep breath in through the nose and exhaling slowly to create gentle, floating bubbles.',
        bilingualTitle: '២. ការដកដង្ហើម និងផ្លុំយឺតៗ (Deep Breathing & Slow Blowing)',
        bilingualDesc:
          'ណែនាំកុមារឱ្យដកដង្ហើមវែងៗតាមច្រមុះ ហើយផ្លុំខ្យល់ចេញតាមមាត់យឺតៗដើម្បីបង្កើតពពុះ។ (Model taking a deep breath in through the nose and exhaling slowly to create gentle, floating bubbles.)',
      },
      {
        titleKm: '៣. ការតាមដានដោយភ្នែក',
        titleEn: 'Step 3: Visual Tracking & Popping',
        descKm: 'លើកទឹកចិត្តកុមារឱ្យសម្លឹងតាមពពុះដែលហោះយឺតៗ ហើយយកចុងម្រាមដៃផ្ទុះពពុះមួយម្តងៗ។',
        descEn:
          'Encourage your child to visually follow drifting bubbles and gently pop them with fingertip taps.',
        bilingualTitle: '៣. ការតាមដានដោយភ្នែក (Visual Tracking & Popping)',
        bilingualDesc:
          'លើកទឹកចិត្តកុមារឱ្យសម្លឹងតាមពពុះដែលហោះយឺតៗ ហើយយកចុងម្រាមដៃផ្ទុះពពុះមួយម្តងៗ។ (Encourage your child to visually follow drifting bubbles and gently pop them with fingertip taps.)',
      },
      {
        titleKm: '៤. សម្រាក និងបន្ធូរសរសៃ',
        titleEn: 'Step 4: Calm Rest Transition',
        descKm: 'ជូតដៃស្ងួតដោយកន្សែងទន់ និងអរគុណកុមារចំពោះការហាត់ដកដង្ហើមស្ងប់ចិត្ត។',
        descEn:
          'Dry hands with a soft towel and transition to quiet rest, acknowledging their peaceful breathing.',
        bilingualTitle: '៤. សម្រាក និងបន្ធូរសរសៃ (Calm Rest Transition)',
        bilingualDesc:
          'ជូតដៃស្ងួតដោយកន្សែងទន់ និងអរគុណកុមារចំពោះការហាត់ដកដង្ហើមស្ងប់ចិត្ត។ (Dry hands with a soft towel and transition to quiet rest, acknowledging their peaceful breathing.)',
      },
    ],
  },
  {
    id: 'cambodia-act-3',
    title: 'Banana Leaf & Paper Folding (ការបត់ស្លឹកចេក និងក្រដាស)',
    titleEn: 'Banana Leaf & Paper Folding',
    titleKm: 'ការបត់ស្លឹកចេក និងក្រដាស',
    category: 'Fine Motor',
    minAgeMonths: 36,
    maxAgeMonths: 84,
    summary:
      'ការបត់ស្លឹកចេកបែបប្រពៃណីខ្មែរ និងក្រដាសពណ៌ ជួយអភិវឌ្ឍចលករតូច ភាពរហ័សរហួននៃម្រាមដៃ និងការសម្របសម្រួលដៃទាំងសងខាង។ (Traditional Cambodian banana leaf and paper folding building fine motor precision and bilateral coordination.)',
    summaryEn:
      'Traditional Cambodian banana leaf and paper folding building fine motor precision and bilateral coordination.',
    summaryKm:
      'ការបត់ស្លឹកចេកបែបប្រពៃណីខ្មែរ និងក្រដាសពណ៌ ជួយអភិវឌ្ឍចលករតូច ភាពរហ័សរហួននៃម្រាមដៃ និងការសម្របសម្រួលដៃទាំងសងខាង។',
    materialsBilingual: [
      'ស្លឹកចេកស្រស់ ឬក្រដាសពណ៌ (Fresh pliable banana leaves or soft origami paper)',
      'កន្ត្រៃកុមារចុងមូលសុវត្ថិភាព (Safety blunt-tip children’s scissors)',
      'បន្ទះទ្រនាប់តុ (Smooth work mat)',
      'ផ្កាម្លិះ ឬផ្លែឈើតូចៗ (Small flowers or fruit pieces for decoration)',
    ],
    steps: [
      {
        titleKm: '១. ស្ទាបអង្អែលសរសៃស្លឹក',
        titleEn: 'Step 1: Tactile Leaf Exploration',
        descKm: 'ឱ្យកុមារស្ទាបផ្ទៃរលោង និងសរសៃស្លឹកចេកស្រស់ដើម្បីស្គាល់វាយនភាពធម្មជាតិ។',
        descEn:
          'Invite your child to feel the smooth surface and natural ribs of fresh banana leaves.',
        bilingualTitle: '១. ស្ទាបអង្អែលសរសៃស្លឹក (Tactile Leaf Exploration)',
        bilingualDesc:
          'ឱ្យកុមារស្ទាបផ្ទៃរលោង និងសរសៃស្លឹកចេកស្រស់ដើម្បីស្គាល់វាយនភាពធម្មជាតិ។ (Invite your child to feel the smooth surface and natural ribs of fresh banana leaves.)',
      },
      {
        titleKm: '២. ការហែកតាមទ្រនិច',
        titleEn: 'Step 2: Guided Linear Tearing',
        descKm: 'បង្ហាញការហែកស្លឹកចេកជាបន្ទះៗតាមទ្រនិចសរសៃស្លឹកដោយប្រើមេដៃ និងចង្អុលដៃទាំងពីរ។',
        descEn:
          'Demonstrate pinching and tearing strips along the leaf grain using thumb and index pinch grip.',
        bilingualTitle: '២. ការហែកតាមទ្រនិច (Guided Linear Tearing)',
        bilingualDesc:
          'បង្ហាញការហែកស្លឹកចេកជាបន្ទះៗតាមទ្រនិចសរសៃស្លឹកដោយប្រើមេដៃ និងចង្អុលដៃទាំងពីរ។ (Demonstrate pinching and tearing strips along the leaf grain using thumb and index pinch grip.)',
      },
      {
        titleKm: '៣. ការបត់ជារាងកន្ទោង',
        titleEn: 'Step 3: Folding Traditional Cones/Triangles',
        descKm: 'ជួយកុមារបត់ស្លឹកជាកន្ទោងត្រីកោណសាមញ្ញ ឬបត់ក្រដាសជាពាក់កណ្តាលដោយចុចតាមគែម។',
        descEn:
          'Guide your child to fold simple triangle cones or creases, pressing gently along the folds.',
        bilingualTitle: '៣. ការបត់ជារាងកន្ទោង (Folding Traditional Cones/Triangles)',
        bilingualDesc:
          'ជួយកុមារបត់ស្លឹកជាកន្ទោងត្រីកោណសាមញ្ញ ឬបត់ក្រដាសជាពាក់កណ្តាលដោយចុចតាមគែម។ (Guide your child to fold simple triangle cones or creases, pressing gently along the folds.)',
      },
      {
        titleKm: '៤. ដាក់ផ្កាក្នុងកន្ទោង និងអបអរ',
        titleEn: 'Step 4: Fill & Celebrate',
        descKm: 'ដាក់ផ្កា ឬផ្លែឈើតូចៗចូលក្នុងកន្ទោងស្លឹក រួចកោតសរសើរការខិតខំប្រឹងប្រែង។',
        descEn:
          'Place small jasmine flowers or fruit into the leaf cup and celebrate their fine motor achievement.',
        bilingualTitle: '៤. ដាក់ផ្កាក្នុងកន្ទោង និងអបអរ (Fill & Celebrate)',
        bilingualDesc:
          'ដាក់ផ្កា ឬផ្លែឈើតូចៗចូលក្នុងកន្ទោងស្លឹក រួចកោតសរសើរការខិតខំប្រឹងប្រែង។ (Place small jasmine flowers or fruit into the leaf cup and celebrate their fine motor achievement.)',
      },
    ],
  },
  {
    id: 'cambodia-act-4',
    title: 'Clay & Soft Dough Sculpting (ការឆ្លាក់ដីឥដ្ឋទន់ និងម្សៅពណ៌)',
    titleEn: 'Clay & Soft Dough Sculpting',
    titleKm: 'ការឆ្លាក់ដីឥដ្ឋទន់ និងម្សៅពណ៌',
    category: 'Sensory',
    minAgeMonths: 24,
    maxAgeMonths: 72,
    summary:
      'ការច្របាច់ និងឆ្លាក់ដីឥដ្ឋទន់ ឬម្សៅមីធ្វើផ្ទាល់ខ្លួន ផ្ដល់សម្ពាធសាច់ដុំបន្ធូរភាពតានតឹង និងពង្រឹងកម្លាំងដៃ។ (Deep proprioceptive pressure and modeling with soft dough for emotional grounding and hand dexterity.)',
    summaryEn:
      'Deep proprioceptive pressure and modeling with soft dough for emotional grounding and hand dexterity.',
    summaryKm:
      'ការច្របាច់ និងឆ្លាក់ដីឥដ្ឋទន់ ឬម្សៅមីធ្វើផ្ទាល់ខ្លួន ផ្ដល់សម្ពាធសាច់ដុំបន្ធូរភាពតានតឹង និងពង្រឹងកម្លាំងដៃ។',
    materialsBilingual: [
      'ដីឥដ្ឋទន់ធម្មជាតិ ឬម្សៅមីធ្វើខ្លួនឯង (Soft natural clay or homemade flour playdough)',
      'បន្ទះទ្រនាប់ជ័រ ឬឈើ (Flat rolling mat or board)',
      'ឧបករណ៍ចុចជារាង ឬស្លាបព្រាជ័រ (Safe plastic cutters or spoons)',
      'ក្រណាត់សើមសម្រាប់គ្រប់ដី (Damp cloth to preserve moisture)',
    ],
    steps: [
      {
        titleKm: '១. ការច្របាច់ផ្ដល់សម្ពាធ',
        titleEn: 'Step 1: Deep Pressure Palm Kneading',
        descKm:
          'ច្របាច់ដីឥដ្ឋដោយបាតដៃទាំងសងខាង ដើម្បីបញ្ចេញ sensory deep pressure ជួយឱ្យអារម្មណ៍ស្ងប់។',
        descEn:
          'Knead and squeeze the clay between both palms, providing calming proprioceptive deep pressure input.',
        bilingualTitle: '១. ការច្របាច់ផ្ដល់សម្ពាធ (Deep Pressure Palm Kneading)',
        bilingualDesc:
          'ច្របាច់ដីឥដ្ឋដោយបាតដៃទាំងសងខាង ដើម្បីបញ្ចេញ sensory deep pressure ជួយឱ្យអារម្មណ៍ស្ងប់។ (Knead and squeeze the clay between both palms, providing calming proprioceptive deep pressure input.)',
      },
      {
        titleKm: '២. ការលុញជារាងមូល និងសរសៃវែង',
        titleEn: 'Step 2: Rolling Balls & Snake Coils',
        descKm: 'បង្ហាត់កុមារឱ្យលុញដីឥដ្ឋជារាងពងក្រពើ មូល ឬពស់វែងនៅលើក្តារបន្ទះ។',
        descEn:
          'Guide your child to roll spheres between palms or long snake coils on the table surface.',
        bilingualTitle: '២. ការលុញជារាងមូល និងសរសៃវែង (Rolling Balls & Snake Coils)',
        bilingualDesc:
          'បង្ហាត់កុមារឱ្យលុញដីឥដ្ឋជារាងពងក្រពើ មូល ឬពស់វែងនៅលើក្តារបន្ទះ។ (Guide your child to roll spheres between palms or long snake coils on the table surface.)',
      },
      {
        titleKm: '៣. ការចុច និងឆ្លាក់រូបរាង',
        titleEn: 'Step 3: Imprinting & Sculpting',
        descKm: 'ប្រើម្រាមដៃ ឬស្លាបព្រាជ័រចុចបង្កើតស្នាម និងឆ្លាក់រូបរាងសត្វ ឬផ្លែឈើ។',
        descEn:
          'Use fingers, plastic tools, or stamps to make indentations and sculpt familiar animals or fruits.',
        bilingualTitle: '៣. ការចុច និងឆ្លាក់រូបរាង (Imprinting & Sculpting)',
        bilingualDesc:
          'ប្រើម្រាមដៃ ឬស្លាបព្រាជ័រចុចបង្កើតស្នាម និងឆ្លាក់រូបរាងសត្វ ឬផ្លែឈើ។ (Use fingers, plastic tools, or stamps to make indentations and sculpt familiar animals or fruits.)',
      },
      {
        titleKm: '៤. ការកត់ត្រាស្នាដៃ',
        titleEn: 'Step 4: Applaud Creative Expression',
        descKm: 'ដាក់តាំងស្នាដៃកុមារលើតុ និងសរសើរការតស៊ូព្យាយាមរបស់កុមារ។',
        descEn:
          'Display the completed dough sculptures and praise their tactile endurance and creativity.',
        bilingualTitle: '៤. ការកត់ត្រាស្នាដៃ (Applaud Creative Expression)',
        bilingualDesc:
          'ដាក់តាំងស្នាដៃកុមារលើតុ និងសរសើរការតស៊ូព្យាយាមរបស់កុមារ។ (Display the completed dough sculptures and praise their tactile endurance and creativity.)',
      },
    ],
  },
  {
    id: 'cambodia-act-5',
    title: 'Rhythm & Clapping Games with Khmer Rhymes (ល្បែងទះដៃ និងចង្វាក់ភ្លេងខ្មែរ)',
    titleEn: 'Rhythm & Clapping Games with Khmer Rhymes',
    titleKm: 'ល្បែងទះដៃ និងចង្វាក់ភ្លេងខ្មែរ',
    category: 'Social',
    minAgeMonths: 24,
    maxAgeMonths: 72,
    summary:
      'ល្បែងទះដៃតាមចង្វាក់ភ្លេង និងចម្រៀងកុមារខ្មែរ ជួយលើកកម្ពស់ទំនាក់ទំនងសង្គម ការសម្លឹងភ្នែក និងការប្តូរវេនគ្នា។ (Musical turn-taking and clapping routines using Khmer nursery rhymes to foster eye contact and social engagement.)',
    summaryEn:
      'Musical turn-taking and clapping routines using Khmer nursery rhymes to foster eye contact and social engagement.',
    summaryKm:
      'ល្បែងទះដៃតាមចង្វាក់ភ្លេង និងចម្រៀងកុមារខ្មែរ ជួយលើកកម្ពស់ទំនាក់ទំនងសង្គម ការសម្លឹងភ្នែក និងការប្តូរវេនគ្នា។',
    materialsBilingual: [
      'ចម្រៀងកុមារខ្មែរ (Khmer nursery rhymes e.g., "ចាបស្រុក" or "កូនមាន់")',
      'ស្គរដៃតូច ឬប្រដាប់អង្រួនសំឡេង (Small hand drum or soft shaker)',
      'កម្រាលអង្គុយទល់មុខគ្នា (Seating mat for face-to-face interaction)',
      'ប័ណ្ណរូបភាពបង្ហាញវេន (Visual turn-taking indicator card)',
    ],
    steps: [
      {
        titleKm: '១. អង្គុយទល់មុខគ្នា',
        titleEn: 'Step 1: Face-to-Face Connection',
        descKm:
          'អង្គុយលើកម្រាលស្មើកម្ពស់ភ្នែកកុមារ ដើម្បីបង្កើតភាពកក់ក្តៅ និងការសម្លឹងភ្នែកដោយមិនបង្ខំ។',
        descEn:
          'Sit on a floor mat at child eye level, establishing friendly, non-threatening eye contact.',
        bilingualTitle: '១. អង្គុយទល់មុខគ្នា (Face-to-Face Connection)',
        bilingualDesc:
          'អង្គុយលើកម្រាលស្មើកម្ពស់ភ្នែកកុមារ ដើម្បីបង្កើតភាពកក់ក្តៅ និងការសម្លឹងភ្នែកដោយមិនបង្ខំ។ (Sit on a floor mat at child eye level, establishing friendly, non-threatening eye contact.)',
      },
      {
        titleKm: '២. ចង្វាក់ទះដៃមូលដ្ឋាន ១-២',
        titleEn: 'Step 2: Basic 1-2 Rhythm Clapping',
        descKm: 'ទះដៃតាមចង្វាក់ ១-២ យឺតៗ ហើយលើកដៃទះប៉ះបាតដៃកុមារថ្នមៗ។',
        descEn:
          'Clap hands together in a slow, predictable rhythm, then gently high-five your child’s palms.',
        bilingualTitle: '២. ចង្វាក់ទះដៃមូលដ្ឋាន ១-២ (Basic 1-2 Rhythm Clapping)',
        bilingualDesc:
          'ទះដៃតាមចង្វាក់ ១-២ យឺតៗ ហើយលើកដៃទះប៉ះបាតដៃកុមារថ្នមៗ។ (Clap hands together in a slow, predictable rhythm, then gently high-five your child’s palms.)',
      },
      {
        titleKm: '៣. ច្រៀងចម្រៀងកុមារខ្មែរ',
        titleEn: 'Step 3: Sing Khmer Rhymes with Gestures',
        descKm: 'ច្រៀងចម្រៀងកុមារខ្មែរស្រួលៗ (ដូចជា ចាបស្រុក ឬ កូនមាន់) អមដោយកាយវិការសប្បាយៗ។',
        descEn:
          'Sing familiar Khmer nursery rhymes with exaggerated, cheerful facial expressions and simple hand gestures.',
        bilingualTitle: '៣. ច្រៀងចម្រៀងកុមារខ្មែរ (Sing Khmer Rhymes with Gestures)',
        bilingualDesc:
          'ច្រៀងចម្រៀងកុមារខ្មែរស្រួលៗ (ដូចជា ចាបស្រុក ឬ កូនមាន់) អមដោយកាយវិការសប្បាយៗ។ (Sing familiar Khmer nursery rhymes with exaggerated, cheerful facial expressions and simple hand gestures.)',
      },
      {
        titleKm: '៤. ហ្គេមប្តូរវេនគ្នានាំមុខ',
        titleEn: 'Step 4: Turn-Taking Rhythm Leadership',
        descKm: 'ផ្អាកចង្វាក់ រង់ចាំកុមារទះដៃ ឬធ្វើកាយវិការតបមកវិញ រួចទះដៃអបអរសាទរ។',
        descEn:
          'Pause the beat and wait for your child to initiate a clap or sound before resuming, celebrating reciprocal turn-taking.',
        bilingualTitle: '៤. ហ្គេមប្តូរវេនគ្នានាំមុខ (Turn-Taking Rhythm Leadership)',
        bilingualDesc:
          'ផ្អាកចង្វាក់ រង់ចាំកុមារទះដៃ ឬធ្វើកាយវិការតបមកវិញ រួចទះដៃអបអរសាទរ។ (Pause the beat and wait for your child to initiate a clap or sound before resuming, celebrating reciprocal turn-taking.)',
      },
    ],
  },

  // From the home activity video directory. The API seeds the same ids
  // (apps/api/prisma/directory.seed-data.ts), so progress tracking works.
  directoryActivity({
    id: 'dir-activity-water-play',
    titleEn: 'Calming Water Play',
    titleKm: 'ការលេងទឹកដើម្បីស្ងប់អារម្មណ៍',
    category: 'Sensory',
    minAgeMonths: 24,
    maxAgeMonths: 96,
    summaryEn:
      'Pouring and squeezing warm water gives gentle touch input that can help a child settle and explore.',
    summaryKm:
      'ការចាក់ និងច្របាច់ទឹកឧណ្ហៗ ផ្តល់អារម្មណ៍ប៉ះពាល់ថ្នមៗ ដែលអាចជួយឱ្យកុមារស្ងប់ចិត្ត និងរុករកដោយខ្លួនឯង។',
    materialsBilingual: [
      'ទឹកឧណ្ហៗ (Warm water)',
      'ធុង ឬចានទឹករាក់ (Bucket or shallow basin)',
      'កែវជ័រតូចៗ (Small cups)',
      'អេប៉ុង (Sponge)',
      'ពពុះសាប៊ូ (Bubbles)',
    ],
    steps: [
      step(
        '១. រៀបចំចានទឹក',
        'Step 1: Prepare the basin',
        'ចាក់ទឹកឧណ្ហៗចូលក្នុងចានរាក់ ហើយពិនិត្យកម្តៅទឹកដោយកដៃរបស់អ្នកជាមុនសិន។',
        'Fill a shallow basin with warm water and check the temperature on your wrist first.',
      ),
      step(
        '២. ចាក់ និងច្របាច់',
        'Step 2: Pour and squeeze',
        'ផ្តល់កែវ និងអេប៉ុងឱ្យកុមារ។ បង្ហាញពីរបៀបចាក់ទឹក និងច្របាច់អេប៉ុង រួចឱ្យកុមារសាកល្បង។',
        'Offer cups and a sponge. Show how to pour and squeeze, then let your child try.',
      ),
      step(
        '៣. ធ្វើតាមកុមារ',
        'Step 3: Follow your child’s lead',
        'ឱ្យកុមាររុករករយៈពេល ៥ ទៅ ១០ នាទី។ ឈប់នៅពេលកុមារហាក់ដូចជាអស់កម្លាំង ឬមិនចង់លេង។',
        'Let your child explore for 5–10 minutes. Stop when they seem tired or lose interest.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=2wfaY95MdeE',
    safetyEn:
      'Stay beside your child the whole time they are near water, and check the temperature before you start.',
    safetyKm: 'នៅក្បែរកុមារជានិច្ចនៅពេលលេងទឹក ហើយពិនិត្យកម្តៅទឹកមុនពេលចាប់ផ្តើម។',
    durationMinutes: 8,
  }),
  directoryActivity({
    id: 'dir-activity-say-and-drop',
    titleEn: 'Say It and Drop It',
    titleKm: 'និយាយ ហើយទម្លាក់',
    category: 'Communication',
    minAgeMonths: 24,
    maxAgeMonths: 72,
    summaryEn:
      'A simple box game that invites your child to look, point or make a sound to ask for an object.',
    summaryKm:
      'ល្បែងប្រអប់ដ៏សាមញ្ញ ដែលលើកទឹកចិត្តកុមារឱ្យមើល ចង្អុល ឬបញ្ចេញសំឡេង ដើម្បីស្នើសុំវត្ថុមួយ។',
    materialsBilingual: [
      'ប្រអប់ទទេ (Empty box)',
      'របស់របរតូចៗក្នុងផ្ទះ (Small household items)',
      'ប្លុកលេងសាមញ្ញ (Simple toy blocks)',
    ],
    steps: [
      step(
        '១. បង្ហាញ និងប្រាប់ឈ្មោះ',
        'Step 1: Show and name',
        'កាន់វត្ថុមួយនៅជិតមាត់របស់អ្នក ហើយនិយាយឈ្មោះវាឱ្យច្បាស់ៗ បីដង។',
        'Hold an item near your mouth and say its name clearly three times.',
      ),
      step(
        '២. រង់ចាំសញ្ញា',
        'Step 2: Wait for a signal',
        'រង់ចាំរហូតដល់កុមារមើល ចង្អុល ឬបញ្ចេញសំឡេង បន្ទាប់មកហុចវត្ថុនោះឱ្យកុមារ។',
        'Wait until your child looks, points or makes a sound, then hand them the item.',
      ),
      step(
        '៣. ទម្លាក់ចូលប្រអប់',
        'Step 3: Drop it in the box',
        'ឱ្យកុមារទម្លាក់វត្ថុចូលក្នុងប្រអប់ ហើយអបអរសាទរជាមួយគ្នា។',
        'Let your child drop it into the box, and celebrate together.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=IUhairheOII',
    safetyEn: 'Do not force eye contact. Looking at the object together is enough.',
    safetyKm: 'កុំបង្ខំឱ្យកុមារមើលភ្នែក។ ការមើលវត្ថុជាមួយគ្នាគឺគ្រប់គ្រាន់ហើយ។',
    durationMinutes: 5,
  }),
  directoryActivity({
    id: 'dir-activity-cap-posting',
    titleEn: 'Bottle Cap Posting',
    titleKm: 'ការទម្លាក់គម្របដបចូលប្រអប់',
    category: 'Fine Motor',
    minAgeMonths: 36,
    maxAgeMonths: 120,
    summaryEn:
      'Picking up small objects with finger and thumb and posting them through a slot builds hand strength and coordination.',
    summaryKm:
      'ការរើសវត្ថុតូចៗដោយម្រាមដៃ និងមេដៃ ហើយទម្លាក់ចូលតាមរន្ធ ជួយពង្រឹងកម្លាំងដៃ និងការសម្របសម្រួលចលនា។',
    materialsBilingual: [
      'គម្របដបជ័រ (Plastic bottle caps)',
      'កាក់ធំៗ ឬឡេវអាវ (Large coins or buttons)',
      'ប្រអប់មានរន្ធលើគម្រប (Container with a slot in the lid)',
    ],
    steps: [
      step(
        '១. រៀបចំប្រអប់',
        'Step 1: Set up',
        'កាត់រន្ធមួយលើគម្របប្រអប់ ហើយដាក់គម្របដបនៅលើតុរាបស្មើ។',
        'Cut a slot in a container lid and place the caps on a flat table.',
      ),
      step(
        '២. បង្ហាញការចាប់',
        'Step 2: Show the pinch',
        'បង្ហាញពីរបៀបរើសគម្របដបដោយមេដៃ និងម្រាមចង្អុល។',
        'Show how to pick up a cap with thumb and index finger.',
      ),
      step(
        '៣. ទម្លាក់ម្តងមួយៗ',
        'Step 3: Post one at a time',
        'ឱ្យកុមារទម្លាក់គម្របចូលរន្ធម្តងមួយៗ ហើយរាប់ជាមួយគ្នា។',
        'Let your child post them one at a time, and count together.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=VymP7-J4wMY',
    safetyEn:
      'Use items too large to swallow, and stay close if your child tends to put things in their mouth.',
    safetyKm: 'ប្រើវត្ថុដែលធំល្មមមិនអាចលេបបាន ហើយនៅជិតកុមារ ប្រសិនបើកុមារចូលចិត្តដាក់របស់ចូលមាត់។',
    durationMinutes: 6,
  }),
  directoryActivity({
    id: 'dir-activity-cushion-path',
    titleEn: 'Cushion Path',
    titleKm: 'ផ្លូវខ្នើយ',
    category: 'Motor',
    minAgeMonths: 36,
    maxAgeMonths: 144,
    summaryEn:
      'Stepping, crawling and jumping across cushions builds balance, core strength and body awareness.',
    summaryKm:
      'ការដើរ វារ និងលោតឆ្លងកាត់ខ្នើយ ជួយពង្រឹងតុល្យភាព កម្លាំងខ្លួន និងការយល់ដឹងពីរាងកាយ។',
    materialsBilingual: [
      'ខ្នើយកម្រាលឥដ្ឋ (Floor cushions)',
      'ខ្នើយធំៗ (Large pillows)',
      'ភួយទន់ៗ (Soft blankets)',
    ],
    steps: [
      step(
        '១. រៀបចំផ្លូវ',
        'Step 1: Build the path',
        'រុញរបស់រឹងៗចេញ ហើយរៀបខ្នើយជាផ្លូវមួយនៅលើកម្រាលដែលមិនរអិល។',
        'Move hard objects away and lay the cushions in a path on a non-slip floor.',
      ),
      step(
        '២. បង្ហាញជាគំរូ',
        'Step 2: Show the way',
        'បង្ហាញពីរបៀបដើរ វារ ឬលោតពីខ្នើយមួយទៅខ្នើយមួយ។',
        'Show how to step, crawl or jump from one cushion to the next.',
      ),
      step(
        '៣. ឆ្លងកាត់ជាមួយគ្នា',
        'Step 3: Cross together',
        'ឱ្យកុមារឆ្លងកាត់ផ្លូវ។ ប្តូររបៀបរៀបខ្នើយ ដើម្បីឱ្យការលេងនៅតែគួរឱ្យចាប់អារម្មណ៍។',
        'Let your child cross the path. Change the layout to keep it interesting.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=12k0XUCKzbk',
    safetyEn: 'Clear away hard furniture and keep the cushions on a non-slip surface.',
    safetyKm: 'រុញគ្រឿងសង្ហារិមរឹងៗចេញ ហើយដាក់ខ្នើយលើផ្ទៃដែលមិនរអិល។',
    durationMinutes: 10,
  }),
  directoryActivity({
    id: 'dir-activity-ball-roll',
    titleEn: 'Turn-Taking Ball Roll',
    titleKm: 'ការរមៀលបាល់ឆ្លាស់វេន',
    category: 'Social',
    minAgeMonths: 48,
    maxAgeMonths: 120,
    summaryEn:
      'Rolling a soft ball back and forth practises shared attention and taking turns with a parent.',
    summaryKm:
      'ការរមៀលបាល់ទន់ទៅមក ជួយហ្វឹកហាត់ការយកចិត្តទុកដាក់រួមគ្នា និងការរង់ចាំវេនជាមួយឪពុកម្តាយ។',
    materialsBilingual: ['បាល់ទន់ (Soft ball)', 'ឬស្រោមជើងរុំជាដុំ (Or rolled-up socks)'],
    steps: [
      step(
        '១. អង្គុយទល់មុខគ្នា',
        'Step 1: Sit face to face',
        'អង្គុយលើឥដ្ឋទល់មុខកុមារ ចម្ងាយប្រហែលមួយម៉ែត្រ។',
        'Sit on the floor facing your child, about a metre apart.',
      ),
      step(
        '២. វេនរបស់ម៉ាក់ ឬប៉ា',
        'Step 2: My turn',
        'និយាយថា «វេនម៉ាក់» ឬ «វេនប៉ា» ហើយរមៀលបាល់ទៅកុមារ។',
        'Say “Mama’s turn” or “Papa’s turn” and roll the ball to your child.',
      ),
      step(
        '៣. វេនរបស់កូន',
        'Step 3: Your turn',
        'និយាយថា «វេនកូន!» ហើយរង់ចាំកុមាររមៀលបាល់ត្រឡប់មកវិញ។',
        'Say “Your turn!” and wait for your child to roll it back.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=izEIGyBDaUA',
    safetyEn: 'Use a soft foam ball or rolled-up socks so there are no sudden, hard knocks.',
    safetyKm: 'ប្រើបាល់ស្ពុងទន់ ឬស្រោមជើងរុំជាដុំ ដើម្បីកុំឱ្យប៉ះទង្គិចខ្លាំង។',
    durationMinutes: 5,
  }),
  directoryActivity({
    id: 'dir-activity-blanket-wrap',
    titleEn: 'Blanket Hug Wrap',
    titleKm: 'ការរុំភួយឱបថ្នមៗ',
    category: 'Calming',
    minAgeMonths: 12,
    maxAgeMonths: 144,
    summaryEn:
      'Being wrapped snugly in a soft blanket gives deep, even pressure that many children find calming.',
    summaryKm: 'ការរុំខ្លួនក្នុងភួយទន់ៗ ផ្តល់សម្ពាធស្មើៗ ដែលកុមារជាច្រើនរកឃើញថាធ្វើឱ្យស្ងប់ចិត្ត។',
    materialsBilingual: [
      'ភួយធំទន់ៗ (Large soft blanket)',
      'កន្ទេល ឬកម្រាលយូហ្គា (Floor mat or yoga mat)',
    ],
    steps: [
      step(
        '១. ក្រាលភួយ',
        'Step 1: Spread the blanket',
        'ក្រាលភួយលើកន្ទេល ហើយឱ្យកុមារដេកនៅគែមម្ខាង។',
        'Spread the blanket on a mat and have your child lie along one edge.',
      ),
      step(
        '២. រុំថ្នមៗ',
        'Step 2: Wrap gently',
        'រមៀលកុមារថ្នមៗក្នុងភួយ ដោយទុកក្បាល និងមុខនៅខាងក្រៅជានិច្ច។',
        'Roll your child gently inside the blanket, always keeping the head and face outside.',
      ),
      step(
        '៣. សង្កត់ថ្នមៗ',
        'Step 3: Gentle pressure',
        'សង្កត់ថ្នមៗស្មើៗតាមដៃ និងខ្នង ហើយសួរកុមារថាចង់ឱ្យខ្លាំង ឬស្រាលជាងនេះ។',
        'Press gently and evenly along arms and back, and ask whether they want more or less.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=iZSDkcKMjSc',
    safetyEn:
      'Never cover the face or restrict breathing. Unwrap at once if your child wants to stop.',
    safetyKm: 'កុំគ្របមុខ ឬរារាំងការដកដង្ហើមដាច់ខាត។ ដោះភួយភ្លាមៗ ប្រសិនបើកុមារចង់ឈប់។',
    durationMinutes: 5,
  }),
  directoryActivity({
    id: 'dir-activity-handwashing',
    titleEn: 'Handwashing Step by Step',
    titleKm: 'ការលាងដៃមួយជំហានម្តងៗ',
    category: 'Daily Living',
    minAgeMonths: 36,
    maxAgeMonths: 144,
    summaryEn:
      'Breaking handwashing into small steps, with picture cards if they help, builds independence in a daily routine.',
    summaryKm:
      'ការបំបែកការលាងដៃជាជំហានតូចៗ (អាចប្រើកាតរូបភាព បើវាជួយ) ជួយកុមារឱ្យចេះធ្វើទម្លាប់ប្រចាំថ្ងៃដោយខ្លួនឯង។',
    materialsBilingual: [
      'សាប៊ូលាងដៃ (Hand soap)',
      'កន្សែងជូតដៃ (Towel or washcloth)',
      'កាតរូបភាពជំហាន (Picture step cards)',
    ],
    steps: [
      step(
        '១. បើកទឹក',
        'Step 1: Turn on the water',
        'ជួយកុមារបើកក្បាលរ៉ូប៊ីណេ ហើយធ្វើឱ្យដៃសើម។ ប្រើកៅអីជើងទាបរឹងមាំ ប្រសិនបើកុមារមិនដល់។',
        'Help your child turn on the tap and wet their hands. Use a sturdy stool if they cannot reach.',
      ),
      step(
        '២. ដាក់សាប៊ូ និងដុសដៃ',
        'Step 2: Soap and rub',
        'ដាក់សាប៊ូ ហើយដុសបាតដៃ ខ្នងដៃ និងចន្លោះម្រាមដៃជាមួយគ្នា។',
        'Add soap and rub palms, backs of hands and between fingers together.',
      ),
      step(
        '៣. លាង និងជូតឱ្យស្ងួត',
        'Step 3: Rinse and dry',
        'លាងសាប៊ូចេញ បិទទឹក ហើយជូតដៃឱ្យស្ងួត។ សរសើរកុមារនៅពេលបញ្ចប់។',
        'Rinse off the soap, turn off the water and dry hands. Praise your child when done.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/playlist?list=PLNL4Ls5aZkt8jxvcJ7MmkoftCJWlzgUhB',
    safetyEn:
      'Keep soap away from the eyes, and use a sturdy stool if your child cannot reach the sink.',
    safetyKm: 'កុំឱ្យសាប៊ូចូលភ្នែក ហើយប្រើកៅអីជើងទាបរឹងមាំ ប្រសិនបើកុមារមិនដល់អាងលាងដៃ។',
    durationMinutes: 4,
  }),
  directoryActivity({
    id: 'dir-activity-ice-painting',
    titleEn: 'Ice Cube Painting',
    titleKm: 'ការគូរដោយដុំទឹកកកពណ៌',
    category: 'Sensory',
    minAgeMonths: 24,
    maxAgeMonths: 96,
    summaryEn:
      'Drawing with frozen coloured ice combines a cold, interesting texture with grip practice and naming colours.',
    summaryKm:
      'ការគូរដោយដុំទឹកកកពណ៌ ផ្តល់អារម្មណ៍ត្រជាក់គួរឱ្យចាប់អារម្មណ៍ ហ្វឹកហាត់ការក្តាប់ និងការស្គាល់ពណ៌។',
    materialsBilingual: [
      'ថាសធ្វើទឹកកក (Ice cube tray)',
      'ទឹក (Water)',
      'ពណ៌ចំណីអាហារសុវត្ថិភាព (Safe food colouring)',
      'ក្រដាសស (Plain white paper)',
    ],
    steps: [
      step(
        '១. ធ្វើទឹកកកពណ៌',
        'Step 1: Make coloured ice',
        'លាយទឹកជាមួយពណ៌ចំណីអាហារ ចាក់ចូលថាស ហើយដាក់ក្នុងទូទឹកកកមួយយប់។',
        'Mix water with food colouring, pour it into the tray and freeze overnight.',
      ),
      step(
        '២. គូរលើក្រដាស',
        'Step 2: Draw on paper',
        'ឱ្យកុមារកាន់ដុំទឹកកក ហើយគូរលើក្រដាស។ អាចរុំដុំទឹកកកនឹងក្រណាត់តូច ប្រសិនបើត្រជាក់ពេក។',
        'Let your child hold a cube and draw on the paper. Wrap it in a small cloth if it feels too cold.',
      ),
      step(
        '៣. និយាយពីពណ៌',
        'Step 3: Talk about colours',
        'ប្រាប់ឈ្មោះពណ៌នីមួយៗ នៅពេលកុមារគូរ ហើយមើលពណ៌លាយបញ្ចូលគ្នា។',
        'Name each colour as your child draws, and watch the colours mix.',
      ),
    ],
    safetyEn:
      'Use non-toxic, skin-safe colouring, and watch closely if your child tends to bite or chew ice.',
    safetyKm:
      'ប្រើពណ៌គ្មានជាតិពុល និងសុវត្ថិភាពសម្រាប់ស្បែក ហើយមើលឱ្យជិត ប្រសិនបើកុមារចូលចិត្តខាំ ឬទំពារទឹកកក។',
    durationMinutes: 10,
  }),
  directoryActivity({
    id: 'dir-activity-colour-sorting',
    titleEn: 'Colour Sorting Bowls',
    titleKm: 'ការតម្រៀបពណ៌ក្នុងចាន',
    category: 'Fine Motor',
    minAgeMonths: 36,
    maxAgeMonths: 108,
    summaryEn:
      'Sorting coloured items into matching bowls practises matching, grouping and staying with a task.',
    summaryKm:
      'ការតម្រៀបវត្ថុពណ៌ៗចូលក្នុងចានពណ៌ដូចគ្នា ហ្វឹកហាត់ការផ្គូផ្គង ការដាក់ជាក្រុម និងការផ្តោតលើកិច្ចការ។',
    materialsBilingual: [
      'ចានជ័របីពណ៌ (Three plastic bowls of different colours)',
      'វត្ថុតូចៗពណ៌ដូចចាន (Small items in matching colours)',
    ],
    steps: [
      step(
        '១. តម្រៀបចាន',
        'Step 1: Line up the bowls',
        'ដាក់ចានបីពណ៌ផ្សេងគ្នាជាជួរលើតុទាប។',
        'Line up three bowls of different colours on a low table.',
      ),
      step(
        '២. បង្ហាញម្តង',
        'Step 2: Show once',
        'យកវត្ថុមួយ និយាយពណ៌របស់វា ហើយដាក់វាក្នុងចានពណ៌ដូចគ្នា។',
        'Pick up an item, say its colour and place it in the matching bowl.',
      ),
      step(
        '៣. ឱ្យកុមារតម្រៀប',
        'Step 3: Your child sorts',
        'ហុចវត្ថុម្តងមួយៗ ហើយជួយណែនាំថ្នមៗ ប្រសិនបើកុមារត្រូវការ។',
        'Hand over one item at a time and guide gently if your child needs help.',
      ),
    ],
    videoUrl: 'https://www.youtube.com/watch?v=baWphKqkiAY',
    safetyEn: 'Use items large enough not to be a choking risk, and work at a low table.',
    safetyKm: 'ប្រើវត្ថុធំល្មមដែលមិនអាចស្ទះបំពង់ក ហើយលេងនៅលើតុទាប។',
    durationMinutes: 6,
  }),
  directoryActivity({
    id: 'dir-activity-blanket-swing',
    titleEn: 'Blanket Swing',
    titleKm: 'ការយោលក្នុងភួយ',
    category: 'Social',
    minAgeMonths: 24,
    maxAgeMonths: 84,
    summaryEn:
      'Gentle rocking in a blanket held by two adults gives calming motion and a shared, joyful moment.',
    summaryKm:
      'ការយោលថ្នមៗក្នុងភួយដែលមនុស្សពេញវ័យពីរនាក់កាន់ ផ្តល់ចលនាស្ងប់ចិត្ត និងពេលវេលារីករាយជាមួយគ្នា។',
    materialsBilingual: [
      'ភួយ ឬកម្រាលពូកធំរឹងមាំ (Large, strong bedsheet or blanket)',
      'កម្រាលព្រំទន់ (Soft carpet or mat)',
      'មនុស្សពេញវ័យពីរនាក់ (Two adults)',
    ],
    steps: [
      step(
        '១. ក្រាលភួយ',
        'Step 1: Lay out the blanket',
        'ក្រាលភួយរឹងមាំលើកម្រាលព្រំទន់ ហើយឱ្យកុមារដេកនៅកណ្តាល។',
        'Lay the strong blanket on a soft carpet and have your child lie in the middle.',
      ),
      step(
        '២. លើកទាបៗ',
        'Step 2: Lift a little',
        'មនុស្សពេញវ័យពីរនាក់កាន់ជ្រុងភួយឱ្យជាប់ ហើយលើកវាឡើងបន្តិចពីឥដ្ឋ។',
        'Two adults hold the corners firmly and lift the blanket just a little off the floor.',
      ),
      step(
        '៣. យោលយឺតៗ',
        'Step 3: Rock slowly',
        'យោលទៅមកយឺតៗ ដោយរាប់ ឬច្រៀង។ ដាក់ចុះភ្លាមៗ ប្រសិនបើកុមារចង់ឈប់។',
        'Rock slowly from side to side while counting or singing. Lower at once if your child wants to stop.',
      ),
    ],
    safetyEn: 'Keep a firm grip on the corners and keep the blanket low over a soft surface.',
    safetyKm: 'កាន់ជ្រុងភួយឱ្យជាប់ ហើយទុកភួយឱ្យទាបនៅពីលើផ្ទៃទន់។',
    durationMinutes: 4,
  }),
];

/** One instruction step, with the combined Khmer (English) forms filled in. */
function step(titleKm: string, titleEn: string, descKm: string, descEn: string): ActivityStep {
  return {
    titleKm,
    titleEn,
    descKm,
    descEn,
    bilingualTitle: `${titleKm} (${titleEn.replace(/^Step \d+: /, '')})`,
    bilingualDesc: `${descKm} (${descEn})`,
  };
}

/** A directory activity, with the combined title and summary built from each language. */
function directoryActivity(
  item: Omit<CambodianActivityItem, 'title' | 'summary'>,
): CambodianActivityItem {
  return {
    ...item,
    title: `${item.titleEn} (${item.titleKm})`,
    summary: `${item.summaryEn} (${item.summaryKm})`,
  };
}

/**
 * Match a specific Cambodian activity by title or id.
 */
export function findCambodianActivity(
  activity: ActivityResponse,
): CambodianActivityItem | undefined {
  const title = (activity.title || '').toLowerCase();
  const id = activity.id || '';

  // An exact id wins over the title heuristics below, so a keyword in one
  // activity's title can never pull up a different activity's steps.
  const byId = CAMBODIAN_HOME_ACTIVITIES.find((item) => item.id === id);
  if (byId) return byId;

  return CAMBODIAN_HOME_ACTIVITIES.find((item) => {
    const itemTitle = item.title.toLowerCase();
    const itemTitleEn = item.titleEn.toLowerCase();
    const itemTitleKm = item.titleKm.toLowerCase();

    if (title.includes(itemTitle) || title.includes(itemTitleEn) || title.includes(itemTitleKm)) {
      return true;
    }

    // Keyword heuristics
    if ((title.includes('rice') || title.includes('អង្ករ')) && item.id === 'cambodia-act-1')
      return true;
    if (
      (title.includes('coconut') || title.includes('ដូង') || title.includes('bubble')) &&
      item.id === 'cambodia-act-2'
    )
      return true;
    if (
      (title.includes('banana leaf') || title.includes('ស្លឹកចេក') || title.includes('folding')) &&
      item.id === 'cambodia-act-3'
    )
      return true;
    if (
      (title.includes('clay') || title.includes('ដីឥដ្ឋ') || title.includes('dough')) &&
      item.id === 'cambodia-act-4'
    )
      return true;
    if (
      (title.includes('rhymes') ||
        title.includes('ចង្វាក់ភ្លេង') ||
        title.includes('clapping') ||
        title.includes('ទះដៃ')) &&
      item.id === 'cambodia-act-5'
    )
      return true;

    return false;
  });
}
