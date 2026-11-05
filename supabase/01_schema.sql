-- ====================================================================
-- MOROCCO HERPETOLOGY SCIENTIFIC PLATFORM — MASTER SUPABASE SCHEMA
-- Project ID: dtjyaxquidmehjkndmjb
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUMS & TYPES
DO $$ BEGIN
  CREATE TYPE conservation_status AS ENUM ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE taxonomic_group AS ENUM ('amphibians', 'turtles', 'lizards', 'snakes', 'scorpions');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE observation_status AS ENUM ('pending', 'under_review', 'verified', 'rejected', 'flagged_sensitive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TAXONOMIC SPECIES TABLE
CREATE TABLE IF NOT EXISTS taxa_species (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id TEXT,
    slug TEXT NOT NULL UNIQUE,
    scientific_name TEXT NOT NULL UNIQUE,
    genus TEXT NOT NULL,
    species_epithet TEXT NOT NULL,
    authority TEXT NOT NULL,
    taxonomic_class TEXT NOT NULL,
    taxonomic_order TEXT NOT NULL,
    family TEXT NOT NULL,
    species_group taxonomic_group NOT NULL,
    common_name_en TEXT NOT NULL DEFAULT '',
    common_name_fr TEXT NOT NULL DEFAULT '',
    common_name_ar TEXT NOT NULL DEFAULT '',
    iucn_status conservation_status NOT NULL DEFAULT 'NE',
    is_endemic BOOLEAN NOT NULL DEFAULT FALSE,
    possible_endemic BOOLEAN NOT NULL DEFAULT FALSE,
    distribution_notes TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    image_credit TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxa_slug ON taxa_species(slug);
CREATE INDEX IF NOT EXISTS idx_taxa_group ON taxa_species(species_group);
CREATE INDEX IF NOT EXISTS idx_taxa_family ON taxa_species(family);
CREATE INDEX IF NOT EXISTS idx_taxa_status ON taxa_species(iucn_status);
CREATE INDEX IF NOT EXISTS idx_taxa_endemic ON taxa_species(is_endemic);

-- 4. CONSERVATION PROJECTS TABLE
CREATE TABLE IF NOT EXISTS conservation_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_fr TEXT NOT NULL DEFAULT '',
    title_ar TEXT NOT NULL DEFAULT '',
    kicker_en TEXT DEFAULT '',
    kicker_fr TEXT DEFAULT '',
    kicker_ar TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active',
    category_en TEXT NOT NULL DEFAULT '',
    category_fr TEXT NOT NULL DEFAULT '',
    category_ar TEXT NOT NULL DEFAULT '',
    overview_en TEXT NOT NULL DEFAULT '',
    overview_fr TEXT NOT NULL DEFAULT '',
    overview_ar TEXT NOT NULL DEFAULT '',
    problem_en TEXT NOT NULL DEFAULT '',
    problem_fr TEXT NOT NULL DEFAULT '',
    problem_ar TEXT NOT NULL DEFAULT '',
    geographic_scope_en TEXT NOT NULL DEFAULT '',
    geographic_scope_fr TEXT NOT NULL DEFAULT '',
    geographic_scope_ar TEXT NOT NULL DEFAULT '',
    objectives_en JSONB NOT NULL DEFAULT '[]',
    objectives_fr JSONB NOT NULL DEFAULT '[]',
    objectives_ar JSONB NOT NULL DEFAULT '[]',
    methods_en JSONB NOT NULL DEFAULT '[]',
    methods_fr JSONB NOT NULL DEFAULT '[]',
    methods_ar JSONB NOT NULL DEFAULT '[]',
    milestones_en JSONB NOT NULL DEFAULT '[]',
    milestones_fr JSONB NOT NULL DEFAULT '[]',
    milestones_ar JSONB NOT NULL DEFAULT '[]',
    image_url TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    partners_json JSONB NOT NULL DEFAULT '[]',
    lead_researchers TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proj_slug ON conservation_projects(slug);
CREATE INDEX IF NOT EXISTS idx_proj_status ON conservation_projects(status);

-- 5. SCIENTIFIC PUBLICATIONS TABLE
CREATE TABLE IF NOT EXISTS publications (
    id TEXT PRIMARY KEY,
    publication_year INTEGER NOT NULL,
    publication_type TEXT NOT NULL DEFAULT 'Journal Article',
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    journal TEXT NOT NULL DEFAULT '',
    volume TEXT NOT NULL DEFAULT '',
    issue TEXT NOT NULL DEFAULT '',
    pages TEXT NOT NULL DEFAULT '',
    doi TEXT NOT NULL DEFAULT '',
    pdf_url TEXT NOT NULL DEFAULT '',
    publisher TEXT NOT NULL DEFAULT '',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    abstract_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pubs_year ON publications(publication_year);
CREATE INDEX IF NOT EXISTS idx_pubs_featured ON publications(is_featured);

-- 6. RESEARCHERS & TEAM TABLE
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT DEFAULT '',
    role_en TEXT NOT NULL,
    role_fr TEXT NOT NULL DEFAULT '',
    role_ar TEXT NOT NULL DEFAULT '',
    bio_en TEXT NOT NULL DEFAULT '',
    bio_fr TEXT NOT NULL DEFAULT '',
    bio_ar TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'principal',
    display_order INTEGER NOT NULL DEFAULT 99,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_category ON team_members(category);

-- 7. ACADEMIC COURSES TABLE
CREATE TABLE IF NOT EXISTS academic_courses (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_fr TEXT NOT NULL DEFAULT '',
    title_ar TEXT NOT NULL DEFAULT '',
    institution_en TEXT NOT NULL DEFAULT '',
    institution_fr TEXT NOT NULL DEFAULT '',
    institution_ar TEXT NOT NULL DEFAULT '',
    level_en TEXT NOT NULL DEFAULT '',
    level_fr TEXT NOT NULL DEFAULT '',
    level_ar TEXT NOT NULL DEFAULT '',
    duration_en TEXT NOT NULL DEFAULT '',
    duration_fr TEXT NOT NULL DEFAULT '',
    duration_ar TEXT NOT NULL DEFAULT '',
    summary_en TEXT NOT NULL DEFAULT '',
    summary_fr TEXT NOT NULL DEFAULT '',
    summary_ar TEXT NOT NULL DEFAULT '',
    syllabus_json JSONB NOT NULL DEFAULT '[]',
    instructors TEXT[] NOT NULL DEFAULT '{}',
    prerequisites_en TEXT NOT NULL DEFAULT '',
    prerequisites_fr TEXT NOT NULL DEFAULT '',
    prerequisites_ar TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. OUTREACH & EDUCATION PROGRAMS
CREATE TABLE IF NOT EXISTS outreach_programs (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_fr TEXT NOT NULL DEFAULT '',
    title_ar TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'youth',
    audience_en TEXT NOT NULL DEFAULT '',
    audience_fr TEXT NOT NULL DEFAULT '',
    audience_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    description_fr TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    highlights_en JSONB NOT NULL DEFAULT '[]',
    highlights_fr JSONB NOT NULL DEFAULT '[]',
    highlights_ar JSONB NOT NULL DEFAULT '[]',
    image_url TEXT NOT NULL DEFAULT '',
    date_text TEXT DEFAULT '',
    media_outlet TEXT DEFAULT '',
    external_link TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. FIELD EXPEDITIONS TABLE
CREATE TABLE IF NOT EXISTS field_expeditions (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_fr TEXT NOT NULL DEFAULT '',
    title_ar TEXT NOT NULL DEFAULT '',
    expedition_year INTEGER NOT NULL,
    dates_text TEXT NOT NULL DEFAULT '',
    region_en TEXT NOT NULL DEFAULT '',
    region_fr TEXT NOT NULL DEFAULT '',
    region_ar TEXT NOT NULL DEFAULT '',
    bioclimatic_zone TEXT NOT NULL DEFAULT '',
    objectives_en TEXT NOT NULL DEFAULT '',
    objectives_fr TEXT NOT NULL DEFAULT '',
    objectives_ar TEXT NOT NULL DEFAULT '',
    summary_en TEXT NOT NULL DEFAULT '',
    summary_fr TEXT NOT NULL DEFAULT '',
    summary_ar TEXT NOT NULL DEFAULT '',
    contributors TEXT[] NOT NULL DEFAULT '{}',
    species_observed TEXT[] NOT NULL DEFAULT '{}',
    photos_json JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INSTITUTIONAL PARTNERS TABLE
CREATE TABLE IF NOT EXISTS partner_organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_fr TEXT DEFAULT '',
    name_ar TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'conservation',
    role_en TEXT NOT NULL DEFAULT '',
    role_fr TEXT NOT NULL DEFAULT '',
    role_ar TEXT NOT NULL DEFAULT '',
    website_url TEXT NOT NULL DEFAULT '',
    logo_url TEXT NOT NULL DEFAULT '',
    acronym TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. BIBLIOGRAPHIC REPOSITORY (Over 2,100+ Scientific Records)
CREATE TABLE IF NOT EXISTS bibliographic_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT NOT NULL UNIQUE,
    pdf_nr TEXT,
    authors TEXT NOT NULL,
    publication_year INTEGER,
    title TEXT NOT NULL,
    country TEXT DEFAULT 'Morocco',
    taxonomic_class TEXT,
    taxonomic_order TEXT,
    species_group TEXT,
    genus TEXT,
    topics TEXT,
    primary_topic TEXT,
    secondary_topics TEXT,
    topic_confidence TEXT,
    source TEXT,
    citation TEXT NOT NULL,
    doi TEXT,
    online_url TEXT,
    pdf_available BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_confidence TEXT DEFAULT 'High',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bib_year ON bibliographic_references(publication_year);
CREATE INDEX IF NOT EXISTS idx_bib_group ON bibliographic_references(species_group);
CREATE INDEX IF NOT EXISTS idx_bib_primary_topic ON bibliographic_references(primary_topic);
CREATE INDEX IF NOT EXISTS idx_bib_authors_trgm ON bibliographic_references USING gin (authors gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bib_title_trgm ON bibliographic_references USING gin (title gin_trgm_ops);

-- 12. CITIZEN SCIENCE OBSERVATIONS (Community Field Records)
CREATE TABLE IF NOT EXISTS observation_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_reference_code TEXT NOT NULL UNIQUE,
    observation_date DATE NOT NULL,
    observation_time TIME,
    location_description TEXT NOT NULL,
    raw_latitude NUMERIC(9, 6) NOT NULL,
    raw_longitude NUMERIC(9, 6) NOT NULL,
    public_latitude NUMERIC(6, 3) NOT NULL,
    public_longitude NUMERIC(6, 3) NOT NULL,
    species_id UUID REFERENCES taxa_species(id) ON DELETE SET NULL,
    species_name TEXT NOT NULL,
    microhabitat TEXT,
    condition TEXT,
    individual_count INTEGER NOT NULL DEFAULT 1,
    field_notes TEXT,
    observer_name TEXT NOT NULL,
    observer_email TEXT NOT NULL,
    observer_role TEXT DEFAULT 'Naturalist',
    image_url TEXT,
    image_credit TEXT,
    review_status observation_status NOT NULL DEFAULT 'pending',
    is_sensitive_location BOOLEAN NOT NULL DEFAULT FALSE,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obs_status ON observation_submissions(review_status);
CREATE INDEX IF NOT EXISTS idx_obs_species ON observation_submissions(species_id);
CREATE INDEX IF NOT EXISTS idx_obs_date ON observation_submissions(observation_date);

-- 13. AUDIT EDITORIAL EVENTS TABLE
CREATE TABLE IF NOT EXISTS audit_editorial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE taxa_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliographic_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE observation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_editorial_events ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access for all scientific and educational content
DO $$ BEGIN
  CREATE POLICY "Public read taxa species" ON taxa_species FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read projects" ON conservation_projects FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read publications" ON publications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read team" ON team_members FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read courses" ON academic_courses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read outreach" ON outreach_programs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read expeditions" ON field_expeditions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read partners" ON partner_organizations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read bibliography" ON bibliographic_references FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Observation policies: public can submit observations
DO $$ BEGIN
  CREATE POLICY "Public submit observations" ON observation_submissions FOR INSERT WITH CHECK (review_status = 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Observation policies: public can view verified non-sensitive observations
DO $$ BEGIN
  CREATE POLICY "Public view verified observations" ON observation_submissions FOR SELECT USING (review_status = 'verified' AND is_sensitive_location = false);
EXCEPTION WHEN duplicate_object THEN null; END $$;
