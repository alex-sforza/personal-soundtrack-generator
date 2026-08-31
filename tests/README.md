# Soundtrack engine validation

The engine is designed to be deterministic and browser-safe. Use the cases in `test-cases.json` to validate behavior after wiring the UI.

## Manual checks

1. Load `data/music.json`, `data/music-scoring.json`, `data/character-options.json`, and `data/relationship-scoring.json`.
2. Normalize semantic modifiers with `js/scoring-normalizer.js` before passing scoring data to the engine.
3. Run a single-character case through `SoundtrackEngine.generatePersonalSoundtrack(character, tracks, scoring, { limit: 5 })`.
4. Run a pair case through `SoundtrackEngine.generateSharedSoundtrack(a, b, tracks, scoring, { relationshipType, trajectory, focus, limit: 5 })`.
5. Confirm that moving the emotional sliders changes the top results.
6. Confirm that changing only the relationship type changes pair results.
7. Confirm that changing the trajectory changes pair results.
8. Confirm that friends, siblings, enemies and forced allies do not receive romance merely because their profiles have high emotional intensity.
9. Confirm that the final five tracks do not repeat an artist and contain reasonable category variety.

## Example single-character input

```js
const character = {
  race: 'vampire',
  role: 'архивист',
  sphere: 'архивы',
  startingPoint: 'бежит от прошлого',
  currentArc: 'раскрывает тайну',
  futureArc: 'новая жизнь',
  sliders: {
    drama: 7, mystery: 8, loneliness: 9, melancholy: 9,
    danger: 4, hope: 3, energy: 3
  },
  volume: 3
};
```

## Example pair input

```js
const a = { race: 'vampire', sliders: { darkness: 8, danger: 7, loneliness: 7 } };
const b = { race: 'knower', sliders: { mystery: 9, danger: 5, hope: 4 } };
const options = {
  relationshipType: 'враги',
  trajectory: 'enemies_to_allies',
  focus: 'events',
  limit: 5
};
```

The engine must treat the relationship as a third profile rather than averaging the two characters.
