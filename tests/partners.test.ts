import { describe, it, expect } from 'vitest';
import { PARTNERS_DATA, Partner } from '../src/data/partners';

describe('Institutional Partners Data & Design Integrity', () => {
  it('contains all 9 confirmed institutional partners', () => {
    expect(PARTNERS_DATA).toHaveLength(9);
  });

  it('ensures each partner has valid names, URLs, roles, and explicit acronyms', () => {
    PARTNERS_DATA.forEach((partner: Partner) => {
      expect(partner.id).toBeTruthy();
      expect(partner.name).toBeTruthy();
      expect(partner.nameFr).toBeTruthy();
      expect(partner.nameAr).toBeTruthy();
      expect(partner.role).toBeTruthy();
      expect(partner.website).toMatch(/^https?:\/\//);
      expect(partner.logo).toMatch(/^https?:\/\/|^\/partners\//);
      expect(partner.acronym).toBeTruthy();
      expect(['government', 'academic', 'conservation', 'international']).toContain(partner.category);
    });
  });

  it('verifies essential national partners (ANEF and UIZ) are properly indexed', () => {
    const anef = PARTNERS_DATA.find(p => p.id === 'partner-anef');
    const uiz = PARTNERS_DATA.find(p => p.id === 'partner-uiz');

    expect(anef).toBeDefined();
    expect(anef?.acronym).toBe('ANEF');
    expect(anef?.category).toBe('government');

    expect(uiz).toBeDefined();
    expect(uiz?.acronym).toBe('UIZ Agadir');
    expect(uiz?.category).toBe('academic');
  });
});

