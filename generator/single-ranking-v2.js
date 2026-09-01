(() => {
  'use strict';

  // Single-character ranking v2.
  // The base engine intentionally groups tracks by category, but the library also
  // contains many tracks with identical category profiles. This layer adds a
  // track-level semantic signal so changing the character/story can actually
  // change the selected song instead of repeatedly returning the same title.

  const E = window.SoundtrackEngine;
  if (!E || typeof E.generatePersonalSoundtrack !== 'function') return;

  const originalGenerate = E.generatePersonalSoundtrack.bind(E);

  const WORDS = {
    drama: ['kill','killer','bury','break','broken','fall','fading','away','aftermath','consequence','war','goodbye','death','dead','послед','смерт','войн','прощ','разрыв'],
    romance: ['love','lover','lovers','kiss','heart','beautiful','desire','romance','baby','darling','любов','целу','сердц','желан'],
    danger: ['kill','killer','blood','fire','burn','war','devil','hell','vengeance','danger','hunt','enemy','враг','кров','огн','войн','смерт'],
    mystery: ['night','moon','shadow','dream','ghost','secret','unknown','silence','strange','mystery','тень','ноч','лун','тайн','призрак','молчан'],
    hope: ['hope','home','heaven','rise','again','alive','survive','free','freedom','begin','light','надёж','дом','свобод','свет','жив'],
    loneliness: ['alone','lonely','loneliness','solitude','nobody','lost','hole','silence','shadow','один','одиноч','потер','молчан'],
    nostalgia: ['yesterday','memory','memories','old','home','again','forever','child','youth','past','nostalgia','вчера','памят','стар','дом','детств','прошл'],
    chaos: ['chaos','crazy','mad','wild','riot','fire','storm','crash','break','freak','хаос','безум','бур','огн'],
    power: ['king','queen','control','power','god','machine','war','strong','rise','throne','корол','власт','силь','машин','бог'],
    freedom: ['free','freedom','run','road','wild','escape','fly','away','rebel','свобод','бег','дорог','побег','мятеж'],
    melancholy: ['sad','blue','alone','lonely','lost','fall','fading','goodbye','silence','rain','hole','печал','один','потер','дожд','молчан'],
    tenderness: ['love','heart','home','stay','together','angel','beautiful','darling','нежн','сердц','дом','вместе','остань','ангел'],
    rebellion: ['rebel','riot','fight','war','kill','free','run','revolution','break','black','мятеж','бунт','борьб','войн'],
    darkness: ['dark','black','night','shadow','devil','hell','death','dead','blood','grave','тём','черн','ноч','тень','дьявол','ад','смерт','кров'],
    epic: ['king','queen','war','battle','heaven','hell','god','rise','hero','legend','eternal','корол','войн','битв','неб','ад','герой','легенд','вечн'],
    energy: ['run','fire','burn','storm','thunder','wild','dance','riot','rock','machine','бег','огн','бур','гром','машин']
  };

  function textOf(track) {
    return `${track.title || ''} ${track.artist || ''} ${(track.tags || []).join(' ')} ${(track.semanticTags || []).join(' ')} ${(track.themes || []).join(' ')}`.toLowerCase();
  }

  function semanticProfile(track) {
    const text = textOf(track);
    const p = {};
    for (const [dimension, words] of Object.entries(WORDS)) {
      let hits = 0;
      for (const word of words) if (text.includes(word)) hits++;
      p[dimension] = Math.min(4, hits);
    }
    return p;
  }

  function similarity(a, b) {
    const dims = ['drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos','power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'];
    let score = 0;
    for (const d of dims) {
      const signal = a[d] || 0;
      const target = Number(b[d]) || 0;
      // Positive match matters more than a lack of signal. This prevents a
      // generic song from winning solely because it belongs to the right genre.
      score += signal * (target / 10) * 3.2;
    }
    return score;
  }

  function choose(tracks, target, scoring) {
    const dims = scoring.dimensions || [];
    const candidates = tracks.map(track => {
      const semantic = semanticProfile(track);
      let score = Number(track.score ?? track.finalScore ?? 0);
      score += similarity(semantic, target) * 2.0;

      // Prefer tracks whose title carries a meaningful signal over completely
      // neutral titles when their base score is otherwise close.
      const signalCount = Object.values(semantic).filter(v => v > 0).length;
      score += Math.min(5, signalCount * 0.45);

      // Tiny deterministic tie-break based on the target profile. It is not
      // random: the same input always gives the same result, but different
      // stories are no longer forced into the same first item of a tied pool.
      let hash = 0;
      const key = `${track.artist || ''}|${track.title || ''}|${dims.map(d => Math.round(Number(target[d]) || 0)).join(',')}`;
      for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
      score += (hash % 1000) / 100000;

      return { ...track, finalScore: score };
    }).sort((a, b) => b.finalScore - a.finalScore);

    return candidates[0] || null;
  }

  E.generatePersonalSoundtrack = function(character, tracks, scoring, options = {}) {
    // Ask the original engine for the full candidate pool. We keep its base
    // scoring, then add a track-level semantic pass only for single-character mode.
    const base = originalGenerate(character, tracks, scoring, { ...options, limit: tracks.length });
    const chosen = choose(base.tracks || [], base.targetProfile || {}, scoring);
    return { targetProfile: base.targetProfile, tracks: chosen ? [chosen] : [] };
  };
})();
