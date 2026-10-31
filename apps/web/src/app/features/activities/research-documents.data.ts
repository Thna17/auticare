/**
 * Further reading for families who want the research behind the activities.
 * The documents themselves are in English and live on the publishers' sites;
 * only the description of each one is translated.
 */
export interface ResearchDocument {
  readonly title: string;
  readonly source: string;
  readonly focusEn: string;
  readonly focusKm: string;
  readonly url: string;
}

export const RESEARCH_DOCUMENTS: readonly ResearchDocument[] = [
  {
    title: 'Autism spectrum disorder: definition, epidemiology, causes, and clinical evaluation',
    source: 'National Institutes of Health (PMC)',
    focusEn: 'Definition, epidemiology, neurobiology, and risk factors.',
    focusKm: 'និយមន័យ អត្រាកើតមាន ជីវវិទ្យាប្រព័ន្ធប្រសាទ និងកត្តាហានិភ័យ។',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7082249/',
  },
  {
    title: 'The Foundations of Autistic Flourishing',
    source: 'ResearchGate / Autism Science',
    focusEn: 'Reframing research around well-being and autonomy.',
    focusKm: 'ការស្រាវជ្រាវដែលផ្តោតលើសុខុមាលភាព និងស្វ័យភាពរបស់មនុស្សមានអូទីស្សឹម។',
    url: 'https://www.researchgate.net/publication/372989062_The_Foundations_of_Autistic_Flourishing',
  },
  {
    title: 'Autism Spectrum Disorder Articles & Data',
    source: 'Centers for Disease Control and Prevention (CDC)',
    focusEn: 'Public health data, prevalence, and co-occurring conditions.',
    focusKm: 'ទិន្នន័យសុខភាពសាធារណៈ អត្រាកើតមាន និងស្ថានភាពសុខភាពដែលច្រើនកើតមានជាមួយ។',
    url: 'https://www.cdc.gov/autism/articles/index.html',
  },
  {
    title: 'Introducing critical autism studies (CAS)',
    source: 'Canadian Journal of Disability Studies',
    focusEn: 'Emancipatory research, neurodiversity, and community inclusion.',
    focusKm:
      'ការស្រាវជ្រាវដែលលើកកម្ពស់សិទ្ធិ ភាពចម្រុះនៃប្រព័ន្ធប្រសាទ និងការដាក់បញ្ចូលក្នុងសហគមន៍។',
    url: 'https://cjds.uwaterloo.ca/index.php/cjds/article/download/972/1152',
  },
  {
    title: 'Autism Spectrum Disorder in Children: Early Signs',
    source: 'MDPI, Children journal',
    focusEn: 'Early neurodevelopmental indicators and predictability.',
    focusKm: 'សញ្ញាដំបូងនៃការលូតលាស់ប្រព័ន្ធប្រសាទ និងលទ្ធភាពក្នុងការព្យាករ។',
    url: 'https://www.mdpi.com/2227-9067/11/11/1311',
  },
  {
    title: 'The Double Empathy Problem Briefing Report',
    source: 'Neurodivergent Connection',
    focusEn: 'Communication dynamics between different neurotypes.',
    focusKm: 'របៀបប្រាស្រ័យទាក់ទងរវាងមនុស្សដែលមានរបៀបគិត និងយល់ដឹងខុសគ្នា។',
    url: 'https://ndconnection.co.uk/s/Autism_Some-vital-research-links_Briefing-report.pdf',
  },
];
