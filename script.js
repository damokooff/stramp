// ============================================
// CONFIGURATION
// ============================================
// Option 1 : Liste manuelle des fichiers
// Option 2 : Utiliser un fichier playlist.json
// Option 3 : Utiliser l'API GitHub pour lister automatiquement

const MUSIC_FOLDER = 'music';

// 👉 Si tu utilises GitHub API, mets tes infos ici :
const GITHUB_USER = '';      // ex: "monpseudo"
const GITHUB_REPO = '';      // ex: "mon-repo"
const GITHUB_BRANCH = 'main';

// ============================================

const audio = document.getElementById('audio');
const playlistEl = document.getElementById('playlist');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const shuffleBtn = document.getElementById('shuffle');
const loopBtn = document.getElementById('loop');
const searchInput = document.getElementById('search');
const cover = document.querySelector('.cover');

let tracks = [];
let currentIndex = -1;
let isShuffle = false;
let isLoop = false;
let filteredTracks = [];

// ============================================
// CHARGEMENT DES MUSIQUES
// ============================================
async function loadTracks() {
  // Méthode 1 : Si GitHub API configurée
  if (GITHUB_USER && GITHUB_REPO) {
    try {
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${MUSIC_FOLDER}?ref=${GITHUB_BRANCH}`;
      const res = await fetch(url);
      const files = await res.json();
      tracks = files
        .filter(f => f.name.toLowerCase().endsWith('.mp3'))
        .map(f => ({
          name: f.name.replace(/\.mp3$/i, ''),
          url: f.download_url
        }));
      return;
    } catch (e) {
      console.warn('GitHub API échouée, fallback sur playlist.json', e);
    }
  }

  // Méthode 2 : playlist.json
  try {
    const res = await fetch(`${MUSIC_FOLDER}/playlist.json`);
    if (res.ok) {
      const data = await res.json();
      tracks = data.map(t => ({
        name: t.name || t.file.replace(/\.mp3$/i, ''),
        url: `${MUSIC_FOLDER}/${t.file}`
      }));
      return;
    }
  } catch (e) {
    // ignore
  }

  // Méthode 3 : fallback liste hardcodée (à éditer !)
  // ⚠️ Édite cette liste avec tes fichiers
  tracks = [
    // { name: 'Ma chanson 1', url: 'music/chanson1.mp3' },
    // { name: 'Ma chanson 2', url: 'music/chanson2.mp3' },
  ];
}

// ============================================
// AFFICHAGE
// ============================================
function renderPlaylist(list = tracks) {
  filteredTracks = list;
  playlistEl.innerHTML = '';

  if (list.length === 0) {
    playlistEl.innerHTML = '<li class="loading">Aucune musique trouvée 😢<br><small>Ajoute des MP3 dans /music/ ou édite script.js</small></li>';
    return;
  }

  list.forEach((track, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>🎵 ${track.name}</span>`;
    if (track === tracks[currentIndex]) li.classList.add('active');
    li.addEventListener('click', () => {
      const realIndex = tracks.indexOf(track);
      playTrack(realIndex);
    });
    playlistEl.appendChild(li);
  });
}

function updateNowPlaying() {
  if (currentIndex < 0 || !tracks[currentIndex]) {
    trackTitle.textContent = 'Aucune piste';
    trackArtist.textContent = 'Sélectionne une musique';
    return;
  }
  trackTitle.textContent = tracks[currentIndex].name;
  trackArtist.textContent = `Piste ${currentIndex + 1} / ${tracks.length}`;
}

// ============================================
// LECTURE
// ============================================
function playTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentIndex = index;
  audio.src = tracks[index].url;
  audio.play().catch(e => console.warn(e));
  updateNowPlaying();
  renderPlaylist(filteredTracks);
  cover.classList.add('playing');
  playBtn.textContent = '⏸️';
}

function togglePlay() {
  if (currentIndex < 0 && tracks.length > 0) {
    playTrack(0);
    return;
  }
  if (audio.paused) {
    audio.play();
    playBtn.textContent = '⏸️';
    cover.classList.add('playing');
  } else {
    audio.pause();
    playBtn.textContent = '▶️';
    cover.classList.remove('playing');
  }
}

function nextTrack() {
  if (tracks.length === 0) return;
  let next;
  if (isShuffle) {
    next = Math.floor(Math.random() * tracks.length);
  } else {
    next = (currentIndex + 1) % tracks.length;
  }
  playTrack(next);
}

function prevTrack() {
  if (tracks.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let prev = (currentIndex - 1 + tracks.length) % tracks.length;
  playTrack(prev);
}

// ============================================
// ÉVÉNEMENTS
// ============================================
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

loopBtn.addEventListener('click', () => {
  isLoop = !isLoop;
  audio.loop = isLoop;
  loopBtn.classList.toggle('active', isLoop);
});

audio.addEventListener('ended', () => {
  if (!isLoop) nextTrack();
});

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = tracks.filter(t => t.name.toLowerCase().includes(q));
  renderPlaylist(filtered);
});

// ============================================
// INIT
// ============================================
(async () => {
  await loadTracks();
  renderPlaylist();
  updateNowPlaying();
})();
