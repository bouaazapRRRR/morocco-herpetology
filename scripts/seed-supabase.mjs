/**
 * Automated Supabase Seeder for Morocco Herpetology
 * Usage:
 *   SUPABASE_URL="https://dtjyaxquidmehjkndmjb.supabase.co" SUPABASE_SERVICE_KEY="<your-key>" node scripts/seed-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dtjyaxquidmehjkndmjb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('\n❌ ERROR: Supabase key is missing!');
  console.log('Please provide your Supabase Service Role Key or Anon Key:');
  console.log('Example (PowerShell):');
  console.log('  $env:SUPABASE_SERVICE_KEY="your-service-role-key-from-supabase"');
  console.log('  node scripts/seed-supabase.mjs\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

function extractTsData(filePath, constName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const startIdx = content.indexOf(`export const ${constName}`);
  if (startIdx === -1) return null;
  const eqIdx = content.indexOf('=', startIdx);
  const semiIdx = content.lastIndexOf('];');
  const raw = content.slice(eqIdx + 1, semiIdx + 1).trim();
  const fn = new Function(`return ${raw}`);
  return fn();
}

async function seed() {
  console.log(`\n🌿 Connecting to Supabase project: ${supabaseUrl} ...\n`);

  // 1. Seed Species
  console.log('🦎 Seeding Taxa Species (136 species)...');
  const species = extractTsData('src/data/species.ts', 'SPECIES_DATA') || [];
  const speciesRows = species.map(s => ({
    original_id: s.id,
    slug: `${s.genus.toLowerCase()}-${s.speciesEpithet.toLowerCase()}`.replace(/[^a-z0-9-]/g, ''),
    scientific_name: s.scientificName,
    genus: s.genus,
    species_epithet: s.speciesEpithet,
    authority: s.authority,
    taxonomic_class: s.class,
    taxonomic_order: s.order,
    family: s.family,
    species_group: s.group,
    common_name_en: s.commonNames?.en || '',
    common_name_fr: s.commonNames?.fr || '',
    common_name_ar: s.commonNames?.ar || '',
    iucn_status: s.status || 'NE',
    is_endemic: !!s.isEndemic,
    possible_endemic: !!s.possibleEndemic,
    distribution_notes: s.distributionNotes || '',
    image_url: s.image || '',
    image_credit: s.imageCredit || ''
  }));

  const { error: spError } = await supabase.from('taxa_species').upsert(speciesRows, { onConflict: 'scientific_name' });
  if (spError) console.error('  ⚠️ Error seeding species:', spError.message);
  else console.log('  ✅ 136 Species seeded successfully!');

  // 2. Seed Projects
  console.log('📋 Seeding Conservation Projects (6 projects)...');
  const projects = extractTsData('src/data/projects.ts', 'PROJECTS_DATA') || [];
  const projectRows = projects.map(p => ({
    slug: p.slug,
    title_en: p.title || '',
    title_fr: p.titleFr || '',
    title_ar: p.titleAr || '',
    kicker_en: p.kicker || '',
    kicker_fr: p.kickerFr || '',
    kicker_ar: p.kickerAr || '',
    status: p.status || 'Active',
    category_en: p.category || '',
    category_fr: p.categoryFr || '',
    category_ar: p.categoryAr || '',
    overview_en: p.overview || '',
    overview_fr: p.overviewFr || '',
    overview_ar: p.overviewAr || '',
    problem_en: p.problem || '',
    problem_fr: p.problemFr || '',
    problem_ar: p.problemAr || '',
    geographic_scope_en: p.geographicScope || '',
    geographic_scope_fr: p.geographicScopeFr || '',
    geographic_scope_ar: p.geographicScopeAr || '',
    objectives_en: p.objectives || [],
    objectives_fr: p.objectivesFr || [],
    objectives_ar: p.objectivesAr || [],
    methods_en: p.methods || [],
    methods_fr: p.methodsFr || [],
    methods_ar: p.methodsAr || [],
    milestones_en: p.milestones || [],
    milestones_fr: p.milestonesFr || [],
    milestones_ar: p.milestonesAr || [],
    image_url: p.image || p.heroImage || '',
    tags: p.tags || [],
    partners_json: p.partners || [],
    lead_researchers: p.leadResearchers || []
  }));
  const { error: prError } = await supabase.from('conservation_projects').upsert(projectRows, { onConflict: 'slug' });
  if (prError) console.error('  ⚠️ Error seeding projects:', prError.message);
  else console.log('  ✅ 6 Projects seeded successfully!');

  // 3. Seed Publications
  console.log('📚 Seeding Publications (29 publications)...');
  const pubs = extractTsData('src/data/publications.ts', 'PUBLICATIONS_DATA') || [];
  const pubRows = pubs.map(p => ({
    id: p.id,
    publication_year: p.year || 2026,
    publication_type: p.type || 'Journal Article',
    title: p.title || '',
    authors: p.authors || '',
    journal: p.journal || '',
    volume: p.volume || '',
    issue: p.issue || '',
    pages: p.pages || '',
    doi: p.doi || '',
    pdf_url: p.pdf || '',
    publisher: p.publisher || '',
    keywords: p.keywords || [],
    is_featured: !!p.featured,
    abstract_text: p.abstract || ''
  }));
  const { error: pbError } = await supabase.from('publications').upsert(pubRows, { onConflict: 'id' });
  if (pbError) console.error('  ⚠️ Error seeding publications:', pbError.message);
  else console.log('  ✅ 29 Publications seeded successfully!');

  // 4. Seed Team Members
  console.log('👥 Seeding Team Members (15 members)...');
  const team = extractTsData('src/data/team.ts', 'TEAM_MEMBERS') || [];
  const teamRows = team.map((m, idx) => ({
    id: m.id || `member-${idx+1}`,
    name: m.name || '',
    name_ar: m.nameAr || '',
    role_en: m.role || '',
    role_fr: m.roleFr || '',
    role_ar: m.roleAr || '',
    bio_en: m.bio || '',
    bio_fr: m.bioFr || '',
    bio_ar: m.bioAr || '',
    image_url: m.image || '',
    category: m.category || 'principal',
    display_order: idx + 1
  }));
  const { error: tmError } = await supabase.from('team_members').upsert(teamRows, { onConflict: 'id' });
  if (tmError) console.error('  ⚠️ Error seeding team members:', tmError.message);
  else console.log('  ✅ 15 Team Members seeded successfully!');

  // 5. Seed Courses
  console.log('🎓 Seeding Academic Courses (2 courses)...');
  const courses = extractTsData('src/data/courses.ts', 'COURSES_DATA') || [];
  const courseRows = courses.map(c => ({
    id: c.id,
    slug: c.slug,
    title_en: c.title || '',
    title_fr: c.titleFr || '',
    title_ar: c.titleAr || '',
    institution_en: c.institution || '',
    institution_fr: c.institutionFr || '',
    institution_ar: c.institutionAr || '',
    level_en: c.level || '',
    level_fr: c.levelFr || '',
    level_ar: c.levelAr || '',
    duration_en: c.duration || '',
    duration_fr: c.durationFr || '',
    duration_ar: c.durationAr || '',
    summary_en: c.summary || '',
    summary_fr: c.summaryFr || '',
    summary_ar: c.summaryAr || '',
    syllabus_json: c.syllabus || [],
    instructors: c.instructors || [],
    prerequisites_en: c.prerequisites || '',
    prerequisites_fr: c.prerequisitesFr || '',
    prerequisites_ar: c.prerequisitesAr || ''
  }));
  const { error: crError } = await supabase.from('academic_courses').upsert(courseRows, { onConflict: 'id' });
  if (crError) console.error('  ⚠️ Error seeding courses:', crError.message);
  else console.log('  ✅ 2 Courses seeded successfully!');

  // 6. Seed Outreach Programs
  console.log('📢 Seeding Outreach Programs (3 programs)...');
  const outreach = extractTsData('src/data/outreach.ts', 'OUTREACH_PROGRAMS') || [];
  const outreachRows = outreach.map(o => ({
    id: o.id,
    slug: o.slug,
    title_en: o.title || '',
    title_fr: o.titleFr || '',
    title_ar: o.titleAr || '',
    category: o.category || 'youth',
    audience_en: o.audience || '',
    audience_fr: o.audienceFr || '',
    audience_ar: o.audienceAr || '',
    description_en: o.description || '',
    description_fr: o.descriptionFr || '',
    description_ar: o.descriptionAr || '',
    highlights_en: o.highlights || [],
    highlights_fr: o.highlightsFr || [],
    highlights_ar: o.highlightsAr || [],
    image_url: o.image || '',
    date_text: o.date || '',
    media_outlet: o.mediaOutlet || '',
    external_link: o.externalLink || ''
  }));
  const { error: orError } = await supabase.from('outreach_programs').upsert(outreachRows, { onConflict: 'id' });
  if (orError) console.error('  ⚠️ Error seeding outreach:', orError.message);
  else console.log('  ✅ 3 Outreach Programs seeded successfully!');

  // 7. Seed Expeditions
  console.log('🧭 Seeding Field Expeditions (4 expeditions)...');
  const expeditions = extractTsData('src/data/expeditions.ts', 'EXPEDITIONS_DATA') || [];
  const expRows = expeditions.map(e => ({
    id: e.id,
    slug: e.slug,
    title_en: e.title || '',
    title_fr: e.titleFr || '',
    title_ar: e.titleAr || '',
    expedition_year: e.year || 2026,
    dates_text: e.dates || '',
    region_en: e.region || '',
    region_fr: e.regionFr || '',
    region_ar: e.regionAr || '',
    bioclimatic_zone: e.bioclimaticZone || '',
    objectives_en: e.objectives || '',
    objectives_fr: e.objectivesFr || '',
    objectives_ar: e.objectivesAr || '',
    summary_en: e.summary || '',
    summary_fr: e.summaryFr || '',
    summary_ar: e.summaryAr || '',
    contributors: e.contributors || [],
    species_observed: e.speciesObserved || [],
    photos_json: e.photos || []
  }));
  const { error: exError } = await supabase.from('field_expeditions').upsert(expRows, { onConflict: 'id' });
  if (exError) console.error('  ⚠️ Error seeding expeditions:', exError.message);
  else console.log('  ✅ 4 Expeditions seeded successfully!');

  // 8. Seed Partners
  console.log('🤝 Seeding Institutional Partners (9 partners)...');
  const partners = extractTsData('src/data/partners.ts', 'PARTNERS_DATA') || [];
  const partnerRows = partners.map(pt => ({
    id: pt.id,
    name: pt.name || '',
    name_fr: pt.nameFr || '',
    name_ar: pt.nameAr || '',
    category: pt.category || 'conservation',
    role_en: pt.role || '',
    role_fr: pt.roleFr || '',
    role_ar: pt.roleAr || '',
    website_url: pt.website || '',
    logo_url: pt.logo || '',
    acronym: pt.acronym || ''
  }));
  const { error: ptError } = await supabase.from('partner_organizations').upsert(partnerRows, { onConflict: 'id' });
  if (ptError) console.error('  ⚠️ Error seeding partners:', ptError.message);
  else console.log('  ✅ 9 Partners seeded successfully!');

  // 9. Seed Bibliography (2,164 records in chunks of 100)
  console.log('📖 Seeding Bibliographic References (2,164 records in batches of 100)...');
  const bib = JSON.parse(fs.readFileSync('src/data/bibliography.json', 'utf8'));
  const CHUNK_SIZE = 100;
  let bibSuccessCount = 0;
  for (let i = 0; i < bib.length; i += CHUNK_SIZE) {
    const chunk = bib.slice(i, i + CHUNK_SIZE).map(b => ({
      record_id: b.record_id,
      pdf_nr: b.pdf_nr,
      authors: b.authors || '',
      publication_year: b.year,
      title: b.title || '',
      country: b.country || 'Morocco',
      taxonomic_class: b.taxonomic_class || b.class || '',
      taxonomic_order: b.order || '',
      species_group: b.group || '',
      genus: b.genus || '',
      topics: b.topics || '',
      primary_topic: b.primary_topic || '',
      secondary_topics: b.secondary_topics || '',
      topic_confidence: b.topic_confidence || 'High',
      source: b.source || '',
      citation: b.citation || '',
      doi: b.doi || '',
      online_url: b.online_url || '',
      pdf_available: !!b.pdf_available,
      metadata_confidence: b.metadata_confidence || 'High'
    }));

    const { error: bibErr } = await supabase.from('bibliographic_references').upsert(chunk, { onConflict: 'record_id' });
    if (bibErr) {
      console.error(`  ⚠️ Error seeding bib chunk ${i} - ${i + chunk.length}:`, bibErr.message);
    } else {
      bibSuccessCount += chunk.length;
      process.stdout.write(`\r  Progress: ${bibSuccessCount} / ${bib.length} records...`);
    }
  }
  console.log('\n  ✅ Bibliographic References seeded successfully!');

  console.log('\n🎉 ALL DATA HAS BEEN SEEDED INTO SUPABASE!\n');
}

seed().catch(err => {
  console.error('\n❌ Fatal error during seed:', err);
  process.exit(1);
});

