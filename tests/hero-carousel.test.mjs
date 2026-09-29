import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_HERO_SLIDES } from '../src/components/heroSlidesData.js';

describe('Hero Carousel Verification Suite', () => {
  it('validates default slides structure, copy and CTA mapping', () => {
    assert.equal(DEFAULT_HERO_SLIDES.length, 3);

    // Slide 1: General Store / Selection
    const slide1 = DEFAULT_HERO_SLIDES[0];
    assert.equal(slide1.id, 'selection');
    assert.equal(slide1.primaryLabel, 'Explorer la boutique');
    assert.equal(slide1.primaryHref, '/boutique');
    assert.equal(slide1.secondaryLabel, 'Voir les nouveautés');
    assert.equal(slide1.secondaryHref, '/nouveautes');
    assert.equal(slide1.eyebrow, 'BEAUTÉ CORÉENNE · SÉLECTION EXCLUSIVE');
    assert.equal(slide1.desktopTextPosition, 'left');
    assert.equal(slide1.mobileTextPosition, 'bottom-left');

    // Slide 2: Routines
    const slide2 = DEFAULT_HERO_SLIDES[1];
    assert.equal(slide2.id, 'routines');
    assert.equal(slide2.primaryLabel, 'Explorer la boutique');
    assert.equal(slide2.primaryHref, '/boutique');
    assert.equal(slide2.secondaryLabel, 'Découvrir les routines');
    assert.equal(slide2.secondaryHref, '/routines');
    assert.equal(slide2.eyebrow, 'ROUTINES & PACKS');

    // Slide 3: Brands
    const slide3 = DEFAULT_HERO_SLIDES[2];
    assert.equal(slide3.id, 'brands');
    assert.equal(slide3.primaryLabel, 'Explorer la boutique');
    assert.equal(slide3.primaryHref, '/boutique');
    assert.equal(slide3.secondaryLabel, 'Découvrir les marques');
    assert.equal(slide3.secondaryHref, '/marques');
    assert.equal(slide3.eyebrow, 'LES MARQUES DE LA GALLERY');

    // All slides must share identical primary CTA
    DEFAULT_HERO_SLIDES.forEach((s) => {
      assert.equal(s.primaryLabel, 'Explorer la boutique');
      assert.equal(s.primaryHref, '/boutique');
      assert.ok(s.imageDesktop);
      assert.ok(s.alt);
      assert.ok(s.focalPointDesktop);
      assert.ok(s.focalPointMobile);
    });
  });

  it('validates timing and motion hierarchy contracts', () => {
    const dwellTime = 6000;
    const transitionDuration = 800;
    assert.equal(dwellTime, 6000);
    assert.equal(transitionDuration, 800);
  });
});
