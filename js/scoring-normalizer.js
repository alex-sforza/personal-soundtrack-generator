/* Bridges semantic tags (night, magic, trust, etc.) to the 16 numeric soundtrack dimensions. */
(function (global) {
  'use strict';

  const MAP = {
    magic:['mystery','epic'], night:['mystery','darkness','loneliness'], moon:['mystery','nostalgia','romance'],
    beast:['danger','power','chaos'], hunger:['danger','darkness','drama'], wind:['freedom','energy'], bird:['freedom','mystery'],
    storm:['danger','chaos','power','energy'], lightning:['danger','power','energy'], fire:['danger','power','chaos','energy'],
    ash:['darkness','melancholy','drama'], water:['mystery','melancholy','freedom'], horse:['freedom','danger'], predator:['danger'],
    lake:['mystery','melancholy'], irish:['nostalgia','mystery'], fae:['mystery','freedom','nostalgia'], shadow:['mystery','darkness'],
    dreams:['mystery','tenderness'], dream:['mystery','tenderness'], spirit:['mystery','loneliness'], dead:['darkness','nostalgia'],
    death:['drama','darkness','danger'], voice:['romance','mystery'], omen:['mystery','danger'], fate:['mystery','epic'], destiny:['mystery','epic'],
    contract:['power','danger'], debt:['power','drama'], choice:['freedom','drama'], identity:['drama','loneliness'], duality:['drama','mystery'],
    hybrid:['identity','drama'], outsider:['loneliness','freedom'], belonging:['hope','tenderness'], illusion:['mystery','danger'],
    luck:['hope','chaos'], trickster:['chaos','freedom'], ancient:['nostalgia','mystery','epic'], ritual:['mystery','darkness'],
    knowledge:['mystery','power'], records:['nostalgia','mystery'], library:['nostalgia','mystery'], observation:['mystery'], secrecy:['mystery','loneliness'],
    investigation:['mystery','danger'], evidence:['mystery'], science:['mystery'], research:['mystery','power'], forbidden_knowledge:['mystery','darkness'],
    visions:['mystery','epic'], future:['mystery','hope'], prophecy:['mystery','epic'], intuition:['mystery'], empathy:['tenderness'],
    monsters:['danger'], combat:['danger','energy'], duty:['drama','power'], purity:['hope','drama'], archives:['nostalgia','mystery'], books:['nostalgia','mystery'],
    hidden_world:['mystery','epic'], otherworld:['mystery','darkness'], guardian:['hope','duty'], celestial:['hope','epic'], divine:['hope','mystery'],
    infernal:['darkness','danger'], temptation:['romance','danger'], rebellion:['rebellion','freedom'], fallen:['drama','darkness'], exile:['loneliness','freedom'],
    guilt:['drama','melancholy'], power:['power','energy'], chaos:['chaos','energy'], choice:['freedom','drama'], freedom:['freedom','hope'],
    control:['power','drama'], loss:['drama','melancholy','loneliness'], pain:['drama','melancholy'], growth:['hope','energy'], betrayal:['drama','mistrust'],
    respect:['hope','power'], tension:['drama','danger'], obsession:['romance','danger'], competition:['energy','rebellion'], loyalty:['tenderness','hope'],
    warmth:['tenderness','hope'], trust:['hope','tenderness'], mistrust:['danger','loneliness'], cruelty:['darkness','danger'], tenderness:['tenderness','romance'],
    stability:['hope'], dependence:['romance','loneliness'], equality:['freedom'], romance:['romance','tenderness'], danger:['danger'], conflict:['drama','danger'],
    nostalgia:['nostalgia','melancholy'], loneliness:['loneliness','melancholy'], hope:['hope'], darkness:['darkness'], epic:['epic'], energy:['energy'],
    drama:['drama'], melancholy:['melancholy'], freedom:['freedom'], rebellion:['rebellion']
  };

  function tagsToDimensions(tags, amount = 1) {
    const result = {};
    for (const tag of tags || []) {
      const dims = MAP[tag];
      if (!dims) continue;
      for (const dim of dims) result[dim] = (result[dim] || 0) + amount;
    }
    return result;
  }

  function normalizeScoring(scoring) {
    const out = JSON.parse(JSON.stringify(scoring));
    for (const profile of Object.values(out.race_modifiers || {})) {
      for (const key of Object.keys(profile)) {
        if (!out.dimensions.includes(key) && MAP[key]) {
          const value = profile[key]; delete profile[key];
          Object.assign(profile, merge(profile, tagsToDimensions([key], value)));
        }
      }
    }
    for (const profile of Object.values(out.relationship_modifiers || {})) {
      for (const key of Object.keys(profile)) {
        if (!out.dimensions.includes(key) && MAP[key]) {
          const value = profile[key]; delete profile[key];
          Object.assign(profile, merge(profile, tagsToDimensions([key], value)));
        }
      }
    }
    for (const [category, profile] of Object.entries(out.base_profiles || {})) {
      if (!profile.dimensions) profile.dimensions = {};
      const extras = tagsToDimensions(profile.genre || [], 0.15);
      profile.dimensions = merge(profile.dimensions, extras);
      out.base_profiles[category] = profile;
    }
    return out;
  }

  function merge(a, b) {
    const out = { ...a };
    for (const [k,v] of Object.entries(b)) out[k] = (out[k] || 0) + v;
    return out;
  }

  global.SoundtrackScoringNormalizer = { MAP, tagsToDimensions, normalizeScoring };
})(typeof window !== 'undefined' ? window : globalThis);
