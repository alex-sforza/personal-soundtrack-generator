/**
 * Personal Soundtrack Generator — scoring engine
 *
 * Pure browser-side engine. No AI/API/music-hosting dependency is required.
 * Feed it the normalized character selections and the 500-track library.
 */

const DEFAULT_DIMENSIONS = [
  'drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos',
  'power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'
];

const clamp = (value, min = 0, max = 10) => Math.max(min, Math.min(max, Number(value) || 0));

function emptyProfile(dimensions = DEFAULT_DIMENSIONS) {
  return Object.fromEntries(dimensions.map(key => [key, 0]));
}

function addProfile(target, source, multiplier = 1) {
  if (!source) return target;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'number') target[key] = (target[key] || 0) + value * multiplier;
  }
  return target;
}

function normalizeProfile(profile, dimensions = DEFAULT_DIMENSIONS) {
  return Object.fromEntries(dimensions.map(key => [key, clamp(profile[key], 0, 10)]));
}

function profileDistance(a, b, dimensions = DEFAULT_DIMENSIONS) {
  let sum = 0;
  for (const key of dimensions) sum += Math.abs((a[key] || 0) - (b[key] || 0));
  return sum / dimensions.length;
}

function profileSimilarity(a, b, dimensions = DEFAULT_DIMENSIONS) {
  return 10 - profileDistance(a, b, dimensions);
}

function titleSignalProfile(track, scoring) {
  const profile = emptyProfile(scoring.dimensions || DEFAULT_DIMENSIONS);
  const text = `${track.title || ''} ${track.artist || ''}`.toLowerCase();
  for (const [signal, modifiers] of Object.entries(scoring.title_signals || {})) {
    if (text.includes(signal.toLowerCase())) addProfile(profile, modifiers, 0.45);
  }
  return profile;
}

function categoryProfile(track, scoring) {
  const category = track.category || track.layer || '';
  const base = scoring.base_profiles?.[category]?.dimensions;
  return base ? { ...base } : emptyProfile(scoring.dimensions || DEFAULT_DIMENSIONS);
}

function buildCharacterProfile(character, scoring) {
  const dimensions = scoring.dimensions || DEFAULT_DIMENSIONS;
  const profile = emptyProfile(dimensions);
  const modifiers = scoring.race_modifiers || {};

  if (character.race) addProfile(profile, modifiers[character.race], 0.65);
  if (character.secondaryRace) addProfile(profile, modifiers[character.secondaryRace], 0.35);

  // Story choices are intentionally mapped through generic dimensions.
  const storyMap = character.storyModifiers || {};
  addProfile(profile, storyMap, 1);

  return normalizeProfile(profile, dimensions);
}

function buildRelationshipProfile(a, b, relationshipType, trajectory, scoring) {
  const dimensions = scoring.dimensions || DEFAULT_DIMENSIONS;
  const profile = emptyProfile(dimensions);
  const rel = scoring.relationship_modifiers?.[relationshipType];
  if (rel) addProfile(profile, rel, 1);

  const trajectoryMap = scoring.trajectory_modifiers || {};
  const transition = trajectoryMap[trajectory];
  if (transition) addProfile(profile, Object.fromEntries(transition.map(tag => [tag, 1])), 0.9);

  // Shared traits reinforce the bond; opposing traits can create tension.
  const pa = buildCharacterProfile(a, scoring);
  const pb = buildCharacterProfile(b, scoring);
  for (const key of dimensions) {
    const same = Math.min(pa[key], pb[key]);
    const contrast = Math.abs(pa[key] - pb[key]);
    profile[key] += same * 0.18;
    if (['drama','danger','chaos','power','darkness','rebellion'].includes(key)) {
      profile[key] += contrast * 0.08;
    }
  }

  return normalizeProfile(profile, dimensions);
}

function buildStoryProfile(character, scoring) {
  const dimensions = scoring.dimensions || DEFAULT_DIMENSIONS;
  const profile = buildCharacterProfile(character, scoring);
  addProfile(profile, character.storyProfile, 1);
  return normalizeProfile(profile, dimensions);
}

function scoreTrack(track, targetProfile, scoring, context = {}) {
  const dimensions = scoring.dimensions || DEFAULT_DIMENSIONS;
  const base = categoryProfile(track, scoring);
  const title = titleSignalProfile(track, scoring);
  const song = normalizeProfile(addProfile({ ...base }, title, 1), dimensions);

  let score = profileSimilarity(song, targetProfile, dimensions) * 10;

  // Genre/category compatibility is a useful secondary signal.
  if (context.preferredCategories?.includes(track.category)) score += 7;
  if (context.avoidCategories?.includes(track.category)) score -= 5;

  // Optional direct track metadata can refine the base model later.
  if (track.tags && context.tags) {
    const overlap = track.tags.filter(tag => context.tags.includes(tag)).length;
    score += Math.min(12, overlap * 2);
  }

  return score;
}

function diversityPenalty(track, selected, index) {
  let penalty = 0;
  for (const previous of selected) {
    if (previous.artist === track.artist) penalty += 35;
    if (previous.category === track.category) penalty += 3;
    if (previous.title === track.title) penalty += 100;
  }
  // Slightly increase diversity pressure deeper into the result list.
  return penalty + index * 0.5;
}

function rankTracks(tracks, targetProfile, scoring, options = {}) {
  const limit = options.limit || 5;
  const ranked = tracks.map(track => ({
    ...track,
    score: scoreTrack(track, targetProfile, scoring, options)
  })).sort((a, b) => b.score - a.score);

  const selected = [];
  const pool = [...ranked];
  while (selected.length < limit && pool.length) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const candidateScore = pool[i].score - diversityPenalty(pool[i], selected, selected.length);
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestIndex = i;
      }
    }
    selected.push({ ...pool.splice(bestIndex, 1)[0], finalScore: bestScore });
  }
  return selected;
}

function getFocusWeights(scoring, focus = 'connection') {
  return scoring.focus_modes?.find(mode => mode.id === focus)?.weights || {
    relationship_profile: 0.40,
    emotional_intersection: 0.25,
    character_contrast: 0.15,
    trajectory: 0.10,
    individual_context: 0.10
  };
}

function buildPairTarget(a, b, relationshipType, trajectory, scoring, focus = 'connection') {
  const dimensions = scoring.dimensions || DEFAULT_DIMENSIONS;
  const pa = buildCharacterProfile(a, scoring);
  const pb = buildCharacterProfile(b, scoring);
  const relationship = buildRelationshipProfile(a, b, relationshipType, trajectory, scoring);
  const weights = getFocusWeights(scoring, focus);
  const target = emptyProfile(dimensions);

  for (const key of dimensions) {
    const intersection = Math.min(pa[key], pb[key]);
    const contrast = Math.abs(pa[key] - pb[key]);
    const individual = (pa[key] + pb[key]) / 2;
    target[key] =
      relationship[key] * weights.relationship_profile +
      intersection * weights.emotional_intersection +
      contrast * weights.character_contrast +
      relationship[key] * weights.trajectory +
      individual * weights.individual_context;
  }

  return normalizeProfile(target, dimensions);
}

function generatePersonalSoundtrack(character, tracks, scoring, options = {}) {
  const target = buildStoryProfile(character, scoring);
  return {
    targetProfile: target,
    tracks: rankTracks(tracks, target, scoring, options)
  };
}

function generateSharedSoundtrack(a, b, tracks, scoring, options = {}) {
  const focus = options.focus || 'connection';
  const target = buildPairTarget(a, b, options.relationshipType, options.trajectory, scoring, focus);
  const result = rankTracks(tracks, target, scoring, options);
  return {
    focus,
    relationshipType: options.relationshipType,
    trajectory: options.trajectory,
    targetProfile: target,
    tracks: result
  };
}

// Export for browser globals and ES-module consumers.
const SoundtrackEngine = {
  buildCharacterProfile,
  buildStoryProfile,
  buildRelationshipProfile,
  buildPairTarget,
  generatePersonalSoundtrack,
  generateSharedSoundtrack,
  rankTracks,
  scoreTrack,
  normalizeProfile
};

if (typeof window !== 'undefined') window.SoundtrackEngine = SoundtrackEngine;
if (typeof globalThis !== 'undefined') globalThis.SoundtrackEngine = SoundtrackEngine;

export default SoundtrackEngine;
