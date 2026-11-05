'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SPECIES_DATA } from '@/data/species';
import { useLocale } from '@/context/LocaleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import ObservationMap from '@/components/observations/ObservationMap';
import { 
  Camera, Check, FileCheck, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { submitObservationToSupabase } from '@/utils/supabaseClient';

function ObservationSubmitContent() {
  const { locale, t, dir } = useLocale();
  const searchParams = useSearchParams();
  const initialSpeciesParam = searchParams.get('species') || '';

  // Form State
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');
  const [date, setDate] = useState<string>('2026-04-20');
  const [time, setTime] = useState<string>('12:00');
  const [observerName, setObserverName] = useState('');
  const [observerEmail, setObserverEmail] = useState('');
  const [observerRole, setObserverRole] = useState('Naturalist / Citizen Scientist');
  const [region, setRegion] = useState('Souss-Massa');
  const [latitude, setLatitude] = useState<number | null>(30.4278);
  const [longitude, setLongitude] = useState<number | null>(-9.5981);
  const [microhabitat, setMicrohabitat] = useState('Argan woodland & rocky slopes');
  const [condition, setCondition] = useState('Adult (Alive & Healthy)');
  const [count, setCount] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCredit, setImageCredit] = useState('');
  const [ethicsAgreed, setEthicsAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    id: string;
    speciesName: string;
    date: string;
    coordinates: string;
    sensitive: boolean;
  } | null>(null);

  // Sync initial query
  useEffect(() => {
    if (initialSpeciesParam) {
      const match = SPECIES_DATA.find(s => 
        s.scientificName.toLowerCase().includes(initialSpeciesParam.toLowerCase())
      );
      if (match) setSelectedSpeciesId(match.id);
    }
  }, [initialSpeciesParam]);

  const selectedSpecies = SPECIES_DATA.find(s => s.id === selectedSpeciesId);

  // Sensitive species check (Viperidae, Elapidae, Chamaeleonidae, Testudinidae)
  const isSensitiveTaxon = Boolean(
    selectedSpecies && (
      selectedSpecies.family === 'Viperidae' ||
      selectedSpecies.family === 'Elapidae' ||
      selectedSpecies.family === 'Chamaeleonidae' ||
      selectedSpecies.family === 'Testudinidae'
    )
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecies) {
      alert('Please select an observed species from the checklist.');
      return;
    }
    if (!latitude || !longitude) {
      alert('Please specify the observation latitude and longitude.');
      return;
    }
    if (!ethicsAgreed) {
      alert('Please agree to the ethical field observation standards.');
      return;
    }

    setSubmitting(true);
    const receiptId = `MH-OBS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await submitObservationToSupabase({
        public_reference_code: receiptId,
        observation_date: date,
        observation_time: time,
        location_description: `${region} - ${microhabitat}`,
        raw_latitude: latitude,
        raw_longitude: longitude,
        public_latitude: Number(latitude.toFixed(3)),
        public_longitude: Number(longitude.toFixed(3)),
        species_name: selectedSpecies.scientificName,
        microhabitat,
        condition,
        individual_count: count,
        field_notes: notes,
        observer_name: observerName || 'Anonymous Contributor',
        observer_email: observerEmail || 'contributor@example.com',
        observer_role: observerRole,
        image_url: imagePreview || undefined,
        image_credit: imageCredit || undefined,
        is_sensitive_location: isSensitiveTaxon,
      });
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
      setSubmittedReceipt({
        id: receiptId,
        speciesName: selectedSpecies.scientificName,
        date: `${date} at ${time}`,
        coordinates: isSensitiveTaxon 
          ? `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W (10km Quadrate Obfuscated)` 
          : `${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°W`,
        sensitive: isSensitiveTaxon,
      });
    }
  };

  const regionsOfMorocco = [
    'Souss-Massa',
    'Drâa-Tafilalet',
    'Marrakech-Safi',
    'Guelmim-Oued Noun',
    'Laâyoune-Sakia El Hamra',
    'Dakhla-Oued Ed-Dahab',
    'Fès-Meknès',
    'Rabat-Salé-Kénitra',
    'Tanger-Tétouan-Al Hoceïma',
    'Béni Mellal-Khénifra',
    'Casablanca-Settat',
    'L\'Oriental',
  ];

  const microhabitats = [
    'Argan woodland & rocky slopes (Souss-Massa)',
    'Montane limestone cliffs & sub-alpine scree (High/Middle Atlas)',
    'Temporary rainwater pond (Daya) / Marshland',
    'Riverbed / Stream (Oued) riparian gallery',
    'Sandy desert dunes (Erg)',
    'Stony desert plateau (Hamada / Reg)',
    'Agricultural reservoir / Matfiya (Cistern trap)',
    'Olive orchard or agricultural terrace',
    'Coastal sand dunes / Maritime cliff',
    'Cave, mine or subterranean adit',
    'Rural village stone wall / Farm boundary',
  ];

  const sectionSteps = [
    { num: 1, label: locale === 'ar' ? 'تحديد النوع' : locale === 'fr' ? 'Identification du taxon' : 'Species Identification' },
    { num: 2, label: locale === 'ar' ? 'بيانات الراصد' : locale === 'fr' ? 'Métadonnées observateur' : 'Observer Metadata' },
    { num: 3, label: locale === 'ar' ? 'الموقع الجغرافي' : locale === 'fr' ? 'Localisation géographique' : 'Geographic Locality' },
    { num: 4, label: locale === 'ar' ? 'الموئل والحالة' : locale === 'fr' ? 'Micro-habitat & condition' : 'Microhabitat & Condition' },
    { num: 5, label: locale === 'ar' ? 'الدليل الفوتوغرافي' : locale === 'fr' ? 'Preuve photographique' : 'Photographic Evidence' },
  ];

  /* ── shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    background: '#F7F4EE',
    border: '1px solid rgba(26, 43, 30, 0.12)',
    borderRadius: '3px',
    color: '#1A2B1E',
    fontSize: '0.8125rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'DM Mono, monospace',
    fontSize: '0.6875rem',
    color: 'rgba(26, 43, 30, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.4rem',
  };

  const sectionBadgeStyle: React.CSSProperties = {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: '#FEF9E7',
    color: '#8A5D00',
    fontFamily: 'DM Mono, monospace',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(179, 130, 40, 0.25)',
    flexShrink: 0,
  };

  return (
    <div style={{ background: '#F7F4EE', minHeight: '100vh', paddingBottom: '6rem' }}>
      <PageHeader
        eyebrow={locale === 'ar' ? 'أطلس الزواحف والبرمائيات بالمغرب · سجل المشاهدات الميدانية' : locale === 'fr' ? "HerpAtlas Maroc · Registre des Observations Naturalistes" : "HerpAtlas Morocco · Citizen Science Occurrence Registry"}
        title={t.observationForm.title}
        description={t.observationForm.sub}
        stats={[
          { value: locale === 'ar' ? 'تدقيق علمي' : locale === 'fr' ? 'Audit Scientifique' : 'Scientific Audit', label: locale === 'ar' ? 'مراجعة الأقران والمتخصصين' : locale === 'fr' ? 'Validation par les pairs' : 'Peer Review Verification' },
          { value: locale === 'ar' ? 'تعميم 10 كم' : locale === 'fr' ? 'Floutage 10km' : '10km Obfuscation', label: locale === 'ar' ? 'حماية الأنواع الحساسة' : locale === 'fr' ? 'Protection des taxons sensibles' : 'Sensitive Species Protection' },
          { value: 'HerpAtlas', label: locale === 'ar' ? 'تكامل مع قاعدة البيانات الوطنية' : locale === 'fr' ? 'Intégration à la base nationale' : 'National Database Integration' },
        ]}
      />

      <div className="container-site" style={{ paddingTop: '2.5rem' }}>
        {/* Two-column layout: sticky sidebar + scrollable form */}
        <div
          className="obs-submit-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(220px, 22%, 300px) 1fr',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* ── LEFT SIDEBAR ── */}
          <aside style={{ position: 'sticky', top: '6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Step Navigator */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26, 43, 30, 0.1)',
                borderRadius: '4px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(26, 43, 30, 0.03)',
              }}
            >
              <span style={{ display: 'block', fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)', fontSize: '0.625rem', fontWeight: 700, color: '#8A5D00', textTransform: locale === 'ar' ? 'none' : 'uppercase', letterSpacing: locale === 'ar' ? 'normal' : '0.1em', marginBottom: '1rem' }}>
                {locale === 'ar' ? 'أقسام الاستمارة' : locale === 'fr' ? 'Sections du formulaire' : 'Form Sections'}
              </span>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {sectionSteps.map(step => (
                  <li key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                      flexShrink: 0,
                      width: '22px', height: '22px',
                      borderRadius: '50%',
                      background: '#FEF9E7',
                      color: '#8A5D00',
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(179, 130, 40, 0.25)',
                    }}>
                      {step.num}
                    </span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8125rem', color: '#4A5E4E', lineHeight: 1.4 }}>
                      {step.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Why Submit card */}
            <div
              style={{
                background: '#1A2B1E',
                borderRadius: '4px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <span style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(254, 249, 231, 0.7)', textTransform: locale === 'ar' ? 'none' : 'uppercase', letterSpacing: locale === 'ar' ? 'normal' : '0.1em' }}>
                {locale === 'ar' ? 'لماذا تسجل ملاحظتك؟' : locale === 'fr' ? 'Pourquoi soumettre ?' : 'Why Submit?'}
              </span>
              <p style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: '0.8125rem', color: 'rgba(247, 244, 238, 0.85)', lineHeight: 1.7, margin: 0 }}>
                {locale === 'ar' ? (
                  <>كل تسجيل معتمد يدخل مباشرة في قاعدة <strong style={{ color: '#FEF9E7' }}>أطلس الزواحف والبرمائيات بالمغرب</strong> — المنصة الوطنية المستخدمة في مخططات الحماية، وتقييمات القائمة الحمراء لـ IUCN، والبحوث الأكاديمية.</>
                ) : locale === 'fr' ? (
                  <>Chaque observation vérifiée intègre <strong style={{ color: '#FEF9E7' }}>l'HerpAtlas Maroc</strong> — la base de données nationale de distribution utilisée pour les plans de conservation, les listes rouges UICN et la recherche.</>
                ) : (
                  <>Every verified record enters <strong style={{ color: '#FEF9E7' }}>HerpAtlas Morocco</strong> — the national distribution database used in conservation planning, IUCN assessments, and peer-reviewed research.</>
                )}
              </p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(locale === 'ar' ? [
                  'سجلات موثقة بالصور المقبولة حصراً',
                  'تعميم تلقائي للأنواع الحساسة (شبكة 10 كم)',
                  'إشعار إلكتروني يصل الراصد مباشرة',
                  'مشاركة البيانات مع المياه والغابات (ANEF)'
                ] : locale === 'fr' ? [
                  'Observations vérifiées par photo uniquement',
                  'Floutage automatique des taxons sensibles (10 km)',
                  'Récépissé envoyé par e-mail',
                  'Données partagées avec l\'ANEF'
                ] : [
                  'Photo-verified records only',
                  'Sensitive taxa auto-obfuscated',
                  'Receipt emailed to observer',
                  'Data shared with ANEF'
                ]).map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(247, 244, 238, 0.75)' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#B38228', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sensitive species alert — only when a sensitive taxon is selected */}
            {isSensitiveTaxon && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '4px',
                  background: '#FEF9E7',
                  border: '1px solid rgba(179, 130, 40, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  boxShadow: '0 2px 8px rgba(179, 130, 40, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#8A5D00', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.625rem', fontWeight: 700, color: '#8A5D00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Sensitive Taxon — 10 km Obfuscation Active
                  </span>
                </div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#4A5E4E', lineHeight: 1.6, margin: 0 }}>
                  <em>{selectedSpecies?.scientificName}</em> — raw coordinates stored privately; public view shows 10×10 km quadrate only.
                </p>
              </div>
            )}
          </aside>

          {/* ── RIGHT: FORM ── */}
          <div>
            <form
              onSubmit={handleSubmit}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26, 43, 30, 0.1)',
                borderRadius: '4px',
                padding: 'clamp(1.75rem, 4vw, 2.75rem)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                boxShadow: '0 2px 8px rgba(26, 43, 30, 0.03)',
              }}
            >
              {/* Section 1: Taxon Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(26, 43, 30, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={sectionBadgeStyle}>1</span>
                  <h2 style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-display)', fontSize: '1.45rem', fontWeight: 600, color: '#1A2B1E' }}>
                    {locale === 'ar' ? 'تحديد النوع المرصود' : locale === 'fr' ? 'Identification du Taxon Observé' : 'Observed Species Identification'}
                  </h2>
                </div>

                <div>
                  <label style={labelStyle}>
                    {locale === 'ar' ? 'اختر النوع من القائمة المرجعية المغربية (136 نوعاً) *' : locale === 'fr' ? 'Sélectionner le taxon dans la liste marocaine (136 espèces) *' : 'Select Taxon from Moroccan Checklist (136 Species) *'}
                  </label>
                  <select
                    value={selectedSpeciesId}
                    onChange={e => setSelectedSpeciesId(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    required
                  >
                    <option value="">{locale === 'ar' ? '-- اختر النوع المرصود --' : locale === 'fr' ? '-- Choisir l\'espèce observée --' : '-- Choose observed species --'}</option>
                    {SPECIES_DATA.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.scientificName} — {(locale === 'ar' && sp.commonNames.ar) || (locale === 'fr' && sp.commonNames.fr) || sp.commonNames.en || sp.scientificName} ({sp.group.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSpecies && (
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '3px',
                      background: '#F7F4EE',
                      border: '1px solid rgba(26, 43, 30, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#8A5D00', fontWeight: 600 }}>{selectedSpecies.family}</span> · {selectedSpecies.order}
                      <div style={{ color: '#4A5E4E', marginTop: '0.2rem' }}>
                        IUCN: <strong style={{ color: '#1A2B1E' }}>{selectedSpecies.status}</strong> · {selectedSpecies.isEndemic ? (locale === 'ar' ? 'متوطن بالمغرب' : locale === 'fr' ? 'Endémique du Maroc' : 'Moroccan Endemic') : (locale === 'ar' ? 'نوع أصيل' : locale === 'fr' ? 'Indigène' : 'Native')}
                      </div>
                    </div>
                    <Link
                      href={`/checklist?q=${encodeURIComponent(selectedSpecies.genus)}`}
                      target="_blank"
                      style={{ color: '#8A5D00', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      {locale === 'ar' ? 'معاينة بطاقة النوع ←' : locale === 'fr' ? 'Consulter la fiche espèce →' : 'Inspect Species Sheet →'}
                    </Link>
                  </div>
                )}
              </div>

              {/* Section 2: Date, Time & Observer Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(26, 43, 30, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={sectionBadgeStyle}>2</span>
                  <h2 style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-display)', fontSize: '1.45rem', fontWeight: 600, color: '#1A2B1E' }}>
                    {locale === 'ar' ? 'بيانات الراصد والتوقيت الزمني' : locale === 'fr' ? 'Métadonnées Temporelles & Observateur' : 'Temporal & Observer Metadata'}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'تاريخ الملاحظة *' : locale === 'fr' ? 'Date d\'observation *' : 'Observation Date *'}</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'توقيت الملاحظة (نظام 24 ساعة)' : locale === 'fr' ? 'Heure de la journée (24h)' : 'Time of Day (24-Hour)'}</label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'الاسم الكامل للراصد *' : locale === 'fr' ? 'Nom complet de l\'observateur *' : 'Observer Full Name *'}</label>
                    <input
                      type="text"
                      value={observerName}
                      onChange={e => setObserverName(e.target.value)}
                      placeholder={locale === 'ar' ? 'مثال: ذ. يوسف العلمي' : locale === 'fr' ? 'ex. Dr. Youssef Alami' : 'e.g. Dr. Youssef Alami'}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'البريد الإلكتروني *' : locale === 'fr' ? 'Adresse e-mail *' : 'Email Address *'}</label>
                    <input
                      type="email"
                      value={observerEmail}
                      onChange={e => setObserverEmail(e.target.value)}
                      placeholder="youssef@example.com"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'صفة الراصد / الانتماء' : locale === 'fr' ? 'Affiliation de l\'observateur' : 'Observer Affiliation'}</label>
                    <select
                      value={observerRole}
                      onChange={e => setObserverRole(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="Naturalist / Citizen Scientist">
                        {locale === 'ar' ? 'طبيعي هاوٍ / مشارك في علوم المواطن' : locale === 'fr' ? 'Naturaliste / Scientifique citoyen' : 'Naturalist / Citizen Scientist'}
                      </option>
                      <option value="University Researcher / Faculty">
                        {locale === 'ar' ? 'أستاذ باحث / إطار جامعي' : locale === 'fr' ? 'Chercheur universitaire / Enseignant' : 'University Researcher / Faculty'}
                      </option>
                      <option value="PhD / Master Student">
                        {locale === 'ar' ? 'طالب باحث (دكتوراه أو ماستر)' : locale === 'fr' ? 'Étudiant en doctorat / Master' : 'PhD / Master Student'}
                      </option>
                      <option value="Park Ranger / ANEF Agent">
                        {locale === 'ar' ? 'حارس متنزه / إطار بالوكالة الوطنية للمياه والغابات' : locale === 'fr' ? 'Garde de parc / Agent ANEF' : 'Park Ranger / ANEF Agent'}
                      </option>
                      <option value="Veterinarian / Healthcare Worker">
                        {locale === 'ar' ? 'طبيب بيطري / ممارس صحي' : locale === 'fr' ? 'Vétérinaire / Professionnel de santé' : 'Veterinarian / Healthcare Worker'}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Geographic Coordinates & Map */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(26, 43, 30, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={sectionBadgeStyle}>3</span>
                  <h2 style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-display)', fontSize: '1.45rem', fontWeight: 600, color: '#1A2B1E' }}>
                    {locale === 'ar' ? 'الموقع الجغرافي والإحداثيات' : locale === 'fr' ? 'Localisation Géographique & Coordonnées' : 'Geographic Locality & Coordinates'}
                  </h2>
                </div>

                <div>
                  <label style={labelStyle}>{locale === 'ar' ? 'الجهة الإدارية بالمملكة المغربية *' : locale === 'fr' ? 'Région administrative du Maroc *' : 'Administrative Region of Morocco *'}</label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    required
                  >
                    {regionsOfMorocco.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Map Picker Component */}
                <ObservationMap
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  isSensitive={isSensitiveTaxon}
                />
              </div>

              {/* Section 4: Ecological Context */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(26, 43, 30, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={sectionBadgeStyle}>4</span>
                  <h2 style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-display)', fontSize: '1.45rem', fontWeight: 600, color: '#1A2B1E' }}>
                    {locale === 'ar' ? 'الموئل الدقيق والحالة والعدد' : locale === 'fr' ? 'Micro-habitat, État & Quantité' : 'Microhabitat, Condition & Quantity'}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'نوع الموئل الدقيق' : locale === 'fr' ? 'Type de micro-habitat' : 'Microhabitat Type'}</label>
                    <select
                      value={microhabitat}
                      onChange={e => setMicrohabitat(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {microhabitats.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'حالة العينة المرصودة' : locale === 'fr' ? 'État du spécimen' : 'Specimen Condition'}</label>
                    <select
                      value={condition}
                      onChange={e => setCondition(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="Adult (Alive & Healthy)">
                        {locale === 'ar' ? 'بالغ (حي وبصحة جيدة)' : locale === 'fr' ? 'Adulte (Vivant & En bonne santé)' : 'Adult (Alive & Healthy)'}
                      </option>
                      <option value="Juvenile (Alive & Healthy)">
                        {locale === 'ar' ? 'يافع / صغير (حي)' : locale === 'fr' ? 'Juvénile (Vivant & En bonne santé)' : 'Juvenile (Alive & Healthy)'}
                      </option>
                      <option value="Tadpole / Larva">
                        {locale === 'ar' ? 'شرغوف / يرقة مائية' : locale === 'fr' ? 'Têtard / Larve aquatique' : 'Tadpole / Larva'}
                      </option>
                      <option value="Road Mortality (DOR)">
                        {locale === 'ar' ? 'دهس طرقي (DOR)' : locale === 'fr' ? 'Mortalité routière (DOR)' : 'Road Mortality (DOR)'}
                      </option>
                      <option value="Trapped in Cistern / Matfiya (Rescue)">
                        {locale === 'ar' ? 'عالق في مطفية / صهريج (إنقاذ)' : locale === 'fr' ? 'Piégé dans une citerne / Matfiya (Sauvetage)' : 'Trapped in Cistern / Matfiya (Rescue)'}
                      </option>
                      <option value="Shed Skin / Slough / Shell">
                        {locale === 'ar' ? 'انسلاخ جلد / قوقعة / أثر' : locale === 'fr' ? 'Exuvie / Mue / Carapace' : 'Shed Skin / Slough / Shell'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'عدد الأفراد' : locale === 'fr' ? 'Nombre d\'individus' : 'Count of Individuals'}</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={count}
                      onChange={e => setCount(Number(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{locale === 'ar' ? 'ملاحظات حقلية وسلوكية' : locale === 'fr' ? 'Notes de terrain & Comportement' : 'Field Notes & Behavioural Observations'}</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder={locale === 'ar' ? 'وصف طبيعة الأرض، الأحوال الجوية، النشاط (تشمس، تغذية، اختباء)، أو مؤشرات التهديد...' : locale === 'fr' ? 'Décrivez le substrat, météo, activité (bain de soleil, chasse, fuite) ou menaces...' : 'Describe substrate, weather conditions, activity (basking, foraging, hiding), or threat signs...'}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Section 5: Photo Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(26, 43, 30, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={sectionBadgeStyle}>5</span>
                  <h2 style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-display)', fontSize: '1.45rem', fontWeight: 600, color: '#1A2B1E' }}>
                    {locale === 'ar' ? 'الدليل الفوتوغرافي (إلزامي للتوثيق والتحقق)' : locale === 'fr' ? 'Preuve Photographique (Requise pour validation)' : 'Photographic Evidence (Required for Validation)'}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                  <div>
                    <label style={labelStyle}>{locale === 'ar' ? 'تحميل صورة العينة *' : locale === 'fr' ? 'Téléverser la photo du spécimen *' : 'Upload Specimen Photo *'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{
                        fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                        fontSize: '0.75rem',
                        color: '#4A5E4E',
                      }}
                    />
                    <p style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: '0.75rem', color: '#4A5E4E', marginTop: '0.5rem' }}>
                      {locale === 'ar'
                        ? 'صيغ JPEG أو PNG أو WebP. يُنصح بشدة بالتقاط صور مقربة تظهر النقوش الظهرية وحراشف الرأس لتسهيل التحقق العلمي.'
                        : locale === 'fr'
                        ? 'JPEG, PNG ou WebP. Les photos en gros plan montrant les motifs dorsaux ou les écailles céphaliques sont vivement recommandées.'
                        : 'JPEG, PNG, or WebP. Close-up photos showing diagnostic dorsal patterns or head scales are strongly recommended.'}
                    </p>

                    <div style={{ marginTop: '1rem' }}>
                      <label style={labelStyle}>{locale === 'ar' ? 'حقوق الصورة / المصور' : locale === 'fr' ? 'Crédit photo / Copyright' : 'Photographer / Copyright Credit'}</label>
                      <input
                        type="text"
                        value={imageCredit}
                        onChange={e => setImageCredit(e.target.value)}
                        placeholder="e.g. Y. Alami / Morocco Herpetology"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4/3',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      background: '#EFECE6',
                      border: '1px solid rgba(26, 43, 30, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                    }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Uploaded voucher specimen"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#4A5E4E' }}>
                        <Camera style={{ width: '32px', height: '32px', marginInline: 'auto', marginBottom: '0.5rem', opacity: 0.5, color: '#8A5D00' }} />
                        <span style={{ display: 'block', fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)', fontSize: '0.75rem', color: '#1A2B1E' }}>
                          {locale === 'ar' ? 'معاينة صورة التوثيق' : locale === 'fr' ? 'Aperçu de la photo' : 'Voucher Photo Preview'}
                        </span>
                        <span style={{ display: 'block', fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: '0.6875rem', opacity: 0.7 }}>
                          {locale === 'ar' ? 'لم يتم تحديد أي ملف بعد' : locale === 'fr' ? 'Aucun fichier sélectionné' : 'No file selected yet'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 6: Ethical Agreement */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(26, 43, 30, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: '0.875rem', color: '#4A5E4E', lineHeight: 1.6 }}>
                  <input
                    type="checkbox"
                    checked={ethicsAgreed}
                    onChange={e => setEthicsAgreed(e.target.checked)}
                    style={{ marginTop: '0.25rem', accentColor: '#1A2B1E' }}
                    required
                  />
                  <span>
                    <strong style={{ color: '#1A2B1E' }}>
                      {locale === 'ar' ? 'ميثاق أخلاقيات العمل الميداني:' : locale === 'fr' ? 'Charte éthique de terrain :' : 'Fieldwork Ethics Confirmation:'}
                    </strong>{' '}
                    {locale === 'ar'
                      ? 'أؤكد أن هذه الملاحظة أُجريت في الطبيعة دون الإضرار بالعينة أو صيدها الدائم أو نقلها أو إزعاج موئلها البري. وأفوّض موروكو هيربيتولوجي لاستخدام هذه البيانات في التدقيق العلمي والخرائط البيئية.'
                      : locale === 'fr'
                      ? 'Je confirme que cette observation a été effectuée sans capture permanente, sans manipulation dommageable ni perturbation de l\'animal dans son milieu naturel. J\'autorise Morocco Herpetology à exploiter cette donnée à des fins de recherche et cartographie.'
                      : 'I confirm this observation was conducted non-destructively in the wild without harming, permanently capturing, translocating, or harassing the specimen. I authorize Morocco Herpetology to audit this record for scientific mapping.'}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.95rem 1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: '#1A2B1E',
                    color: '#FFFFFF',
                    fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textTransform: locale === 'ar' ? 'none' : 'uppercase',
                    letterSpacing: locale === 'ar' ? 'normal' : '0.08em',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? (
                    <span>{locale === 'ar' ? 'جاري الإرسال وتطبيق قواعد التعتيم...' : locale === 'fr' ? 'Envoi et application des règles de floutage...' : 'Submitting & Verifying Obfuscation Rules...'}</span>
                  ) : (
                    <>
                      <FileCheck style={{ width: '16px', height: '16px' }} />
                      <span>{locale === 'ar' ? 'إرسال الملاحظة للمراجعة والتدقيق العلمي' : locale === 'fr' ? 'Soumettre l\'observation pour révision scientifique' : 'Submit Observation for Scientific Review'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .obs-submit-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .obs-submit-grid aside {
            position: static !important;
          }
        }
      `}</style>

      {/* Success Modal Receipt */}
      {submittedReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'rgba(26, 43, 30, 0.65)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(26, 43, 30, 0.15)',
              borderRadius: '4px',
              padding: '2.25rem',
              maxWidth: '32rem',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#FEF9E7',
                color: '#8A5D00',
                border: '1px solid rgba(179, 130, 40, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginInline: 'auto',
              }}
            >
              <Check style={{ width: '26px', height: '26px' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <span
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                  fontSize: '0.6875rem',
                  letterSpacing: locale === 'ar' ? 'normal' : '0.12em',
                  textTransform: locale === 'ar' ? 'none' : 'uppercase',
                  color: '#8A5D00',
                  fontWeight: 600,
                }}
              >
                {locale === 'ar' ? 'تم استلام الاستمارة بنجاح' : locale === 'fr' ? 'Soumission Reçue' : 'Submission Received'}
              </span>
              <h3 style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-display)', fontSize: '1.75rem', color: '#1A2B1E', marginBottom: '0.35rem', fontWeight: 600 }}>
                {locale === 'ar' ? 'تم تسجيل الملاحظة الميدانية' : locale === 'fr' ? 'Observation Enregistrée' : 'Observation Registered'}
              </h3>
              <p style={{ fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: '0.875rem', color: '#4A5E4E' }}>
                {locale === 'ar'
                  ? 'دخل تسجيلك في قائمة التدقيق العلمي وسيقوم أخصائيو التصنيف بمراجعته واعتماده.'
                  : locale === 'fr'
                  ? 'Votre enregistrement a été placé en file d\'attente de validation par nos spécialistes taxonomiques.'
                  : 'Your record has entered the peer-review queue and will be evaluated by our taxonomic specialists.'}
              </p>
            </div>

            <div
              style={{
                background: '#F7F4EE',
                border: '1px solid rgba(26, 43, 30, 0.1)',
                borderRadius: '3px',
                padding: '1.25rem',
                fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(26, 43, 30, 0.6)' }}>{locale === 'ar' ? 'الرقم المرجعي:' : locale === 'fr' ? 'Réf. Suivi :' : 'Tracking Ref:'}</span>
                <strong style={{ color: '#8A5D00' }}>{submittedReceipt.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(26, 43, 30, 0.6)' }}>{locale === 'ar' ? 'النوع:' : locale === 'fr' ? 'Taxon :' : 'Taxon:'}</span>
                <span style={{ fontStyle: 'italic', color: '#1A2B1E' }}>{submittedReceipt.speciesName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(26, 43, 30, 0.6)' }}>{locale === 'ar' ? 'التاريخ والوقت:' : locale === 'fr' ? 'Date & Heure :' : 'Date & Time:'}</span>
                <span style={{ color: '#1A2B1E' }}>{submittedReceipt.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(26, 43, 30, 0.6)' }}>{locale === 'ar' ? 'الموقع العام:' : locale === 'fr' ? 'Localisation publique :' : 'Public Location:'}</span>
                <span style={{ color: '#1A2B1E' }}>{submittedReceipt.coordinates}</span>
              </div>
              {submittedReceipt.sensitive && (
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(26, 43, 30, 0.08)', color: '#8A5D00', lineHeight: 1.4 }}>
                  🛡️ {locale === 'ar' ? 'نوع حساس: الإحداثيات العامة معماة ضمن مربع 10 كم لحماية العينات البرية.' : locale === 'fr' ? 'Taxon protégé : Coordonnées floutées à une maille de 10km.' : 'Protected: Public coordinates blurred to 10km grid to safeguard wild population.'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                onClick={() => {
                  setSubmittedReceipt(null);
                  setSelectedSpeciesId('');
                  setImagePreview(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#1A2B1E',
                  color: '#FFFFFF',
                  fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: locale === 'ar' ? 'none' : 'uppercase',
                  letterSpacing: locale === 'ar' ? 'normal' : '0.06em',
                  borderRadius: '2px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {locale === 'ar' ? 'تسجيل ملاحظة أخرى' : locale === 'fr' ? 'Soumettre une autre' : 'Submit Another'}
              </button>
              <Link
                href="/checklist"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1rem',
                  background: '#FFFFFF',
                  color: '#1A2B1E',
                  border: '1px solid rgba(26, 43, 30, 0.2)',
                  fontFamily: locale === 'ar' ? 'var(--font-arabic)' : 'var(--font-meta)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: locale === 'ar' ? 'none' : 'uppercase',
                  letterSpacing: locale === 'ar' ? 'normal' : '0.06em',
                  borderRadius: '2px',
                  textDecoration: 'none',
                }}
              >
                {locale === 'ar' ? 'العودة للقائمة المرجعية' : locale === 'fr' ? 'Retour au catalogue' : 'Return to Checklist'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmitObservationPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F4EE', color: '#4A5E4E', fontFamily: 'DM Mono, monospace' }}>
        Loading Observation Platform...
      </div>
    }>
      <ObservationSubmitContent />
    </Suspense>
  );
}
