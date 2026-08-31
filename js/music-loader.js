/** Load all 500 soundtrack tracks and preserve their category on each item. */

const MUSIC_SOURCES = [
  'alternative','gothic-industrial','modern-heavy','female-alternative','classic-rock',
  'russian-rock','dark-folk','soundtracks','anime','metal-rock'
];

export async function loadMusicLibrary(basePath = './data/music') {
  const files = await Promise.all(MUSIC_SOURCES.map(async category => {
    const response = await fetch(`${basePath}/${category}.json`);
    if (!response.ok) throw new Error(`Не удалось загрузить ${category}.json`);
    const data = await response.json();
    return (data.tracks || []).map(track => ({ ...track, category }));
  }));

  const tracks = files.flat();
  const unique = [];
  const seen = new Set();
  for (const track of tracks) {
    const key = `${track.artist}::${track.title}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(track);
    }
  }

  return unique;
}

export { MUSIC_SOURCES };
