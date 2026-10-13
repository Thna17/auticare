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
];

/**
 * Match a specific Cambodian activity by title or id.
 */
export function findCambodianActivity(
  activity: ActivityResponse,
): CambodianActivityItem | undefined {
  const title = (activity.title || '').toLowerCase();
  const id = activity.id || '';

  return CAMBODIAN_HOME_ACTIVITIES.find((item) => {
    if (item.id === id) return true;
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
