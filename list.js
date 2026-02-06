(() => {
  const API_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=2000';
  const TYPE_ORDER = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  const PARADOX_SET = new Set([
    'great-tusk',
    'scream-tail',
    'brute-bonnet',
    'flutter-mane',
    'slither-wing',
    'sandy-shocks',
    'iron-treads',
    'iron-bundle',
    'iron-hands',
    'iron-jugulis',
    'iron-moth',
    'iron-thorns',
    'roaring-moon',
    'iron-valiant',
    'walking-wake',
    'iron-leaves',
    'gouging-fire',
    'raging-bolt',
    'iron-boulder',
    'iron-crown'
  ]);
  const TERASTAL_SET = new Set([
    'terapagos-terastal',
    'terapagos-stellar'
  ]);
  const FORM_FILTERS = [
    { id: 'mega', label: 'Mega Evolution', match: name => name.includes('-mega') },
    { id: 'gmax', label: 'Gigantamax', match: name => name.includes('-gmax') },
    { id: 'alola', label: 'Alola Form', match: name => name.includes('-alola') },
    { id: 'galar', label: 'Galar Form', match: name => name.includes('-galar') },
    { id: 'hisui', label: 'Hisui Form', match: name => name.includes('-hisui') },
    { id: 'paldea', label: 'Paldea Form', match: name => name.includes('-paldea') },
    { id: 'paradox', label: 'Paradox', match: name => PARADOX_SET.has(name) },
    { id: 'terastal', label: 'Terastal Form', match: name => TERASTAL_SET.has(name) }
  ];
  const GEN_RANGES = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025]
  };
  const FAVORITES_KEY = 'pokedex-favorites';
  const TEAM_KEY = 'pokedex-team';
  const grid = document.getElementById('pokemon-grid');
  const sortSelect = document.getElementById('sort-select');
  const genSelect = document.getElementById('gen-select');
  const loadStatus = document.getElementById('load-status');
  const typeFilters = document.getElementById('type-filters');
  const formFilters = document.getElementById('form-filters');
  const searchInput = document.getElementById('search-list');
  const favoritesOnlyInput = document.getElementById('favorites-only');
  const randomBtn = document.getElementById('random-list');
  const teamSlots = document.getElementById('team-slots');
  const teamCoverage = document.getElementById('team-coverage');
  const clearTeamBtn = document.getElementById('clear-team');
  const quizImage = document.getElementById('quiz-image');
  const quizInput = document.getElementById('quiz-input');
  const quizCheckBtn = document.getElementById('quiz-check');
  const quizRevealBtn = document.getElementById('quiz-reveal');
  const quizNextBtn = document.getElementById('quiz-next');
  const quizStatus = document.getElementById('quiz-status');

  const typeColors = {
    normal: '#a8a77a',
    fire: '#ee8130',
    water: '#6390f0',
    electric: '#f7d02c',
    grass: '#7ac74c',
    ice: '#96d9d6',
    fighting: '#c22e28',
    poison: '#a33ea1',
    ground: '#e2bf65',
    flying: '#a98ff3',
    psychic: '#f95587',
    bug: '#a6b91a',
    rock: '#b6a136',
    ghost: '#735797',
    dragon: '#6f35fc',
    dark: '#705746',
    steel: '#b7b7ce',
    fairy: '#d685ad'
  };

  let allPokemon = [];
  let pokemonByName = new Map();
  const selectedTypes = new Set();
  const selectedForms = new Set();
  let favoritesOnly = false;
  let selectedGen = 'all';
  let favorites = new Set();
  let team = [];
  let quizAnswer = null;
  let query = '';

  function setStatus(text) {
    loadStatus.textContent = text;
  }

  function parseId(url) {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  function spriteUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  function getFormTags(name) {
    return FORM_FILTERS.filter(form => form.match(name)).map(form => form.id);
  }

  function parseStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadFavorites() {
    const list = parseStorage(FAVORITES_KEY, []);
    favorites = new Set(Array.isArray(list) ? list : []);
  }

  function saveFavorites() {
    saveStorage(FAVORITES_KEY, Array.from(favorites));
  }

  function loadTeam() {
    const list = parseStorage(TEAM_KEY, []);
    team = Array.isArray(list) ? list.slice(0, 6) : [];
  }

  function saveTeam() {
    saveStorage(TEAM_KEY, team);
  }

  function normalizeGuess(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  async function fetchList() {
    const res = await fetch(API_LIST);
    if (!res.ok) throw new Error('Failed to load Pokémon list.');
    const data = await res.json();
    return data.results.map(item => ({
      name: item.name,
      url: item.url,
      id: parseId(item.url)
    }));
  }

  async function fetchDetails(basicList) {
    const CONCURRENCY = 20;
    let index = 0;
    const results = [];

    async function worker() {
      while (index < basicList.length) {
        const current = index++;
        const entry = basicList[current];
        try {
          const res = await fetch(entry.url);
          if (!res.ok) throw new Error('bad status');
          const detail = await res.json();
          results.push({
            id: entry.id,
            name: entry.name,
            types: detail.types.map(t => t.type.name),
            forms: getFormTags(entry.name),
            speciesId: parseId(detail.species?.url || '') || entry.id,
            sprite: detail.sprites.other['official-artwork'].front_default || detail.sprites.front_default || spriteUrl(entry.id)
          });
        } catch (err) {
          // Skip problematic entries but keep app running.
          console.warn('Failed to load', entry.name, err);
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, worker);
    await Promise.all(workers);
    return results;
  }

  function sortPokemon(pokemon, mode) {
    const list = [...pokemon];
    switch (mode) {
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'type':
        return list.sort((a, b) => (a.types[0] || '').localeCompare(b.types[0] || '') || a.id - b.id);
      case 'number':
      default:
        return list.sort((a, b) => a.id - b.id);
    }
  }

  function filterPokemon(pokemon) {
    let filtered = pokemon;
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(mon =>
        Array.from(selectedTypes).every(type => mon.types.includes(type))
      );
    }
    if (selectedForms.size > 0) {
      filtered = filtered.filter(mon =>
        mon.forms?.some(form => selectedForms.has(form))
      );
    }
    if (selectedGen !== 'all') {
      const [min, max] = GEN_RANGES[selectedGen] || [];
      if (min && max) {
        filtered = filtered.filter(mon => mon.speciesId >= min && mon.speciesId <= max);
      }
    }
    if (favoritesOnly) {
      filtered = filtered.filter(mon => favorites.has(mon.name));
    }
    if (query) {
      const q = query;
      filtered = filtered.filter(mon => mon.name.includes(q) || String(mon.id) === q);
    }
    return filtered;
  }

  function render(pokemon, mode) {
    const filtered = filterPokemon(pokemon);
    const sorted = sortPokemon(filtered, mode);
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();

    sorted.forEach(mon => {
      const card = document.createElement('a');
      card.className = 'mini-card';
      card.href = `index.html?pokemon=${encodeURIComponent(mon.name)}`;
      card.setAttribute('aria-label', `${mon.name} details`);

      const img = document.createElement('img');
      img.src = mon.sprite;
      img.alt = mon.name;
      img.loading = 'lazy';

      const meta = document.createElement('div');
      meta.className = 'mini-card__meta';

      const name = document.createElement('p');
      name.className = 'mini-card__name';
      name.textContent = `#${String(mon.id).padStart(3, '0')} ${mon.name}`;

      const types = document.createElement('div');
      types.className = 'mini-card__types';
      mon.types.forEach(type => {
        const pill = document.createElement('span');
        pill.className = 'type-pill small';
        pill.textContent = type;
        pill.style.background = typeColors[type] || '#e2e8f0';
        types.appendChild(pill);
      });

      const actions = document.createElement('div');
      actions.className = 'mini-card__actions';

      const favBtn = document.createElement('button');
      favBtn.className = 'icon-btn icon-btn--star';
      favBtn.type = 'button';
      const isFav = favorites.has(mon.name);
      favBtn.textContent = isFav ? '⭐' : '☆';
      favBtn.setAttribute('aria-pressed', isFav);
      favBtn.setAttribute('aria-label', isFav ? 'Favourited' : 'Mark as favourite');
      if (isFav) favBtn.classList.add('is-active');
      favBtn.addEventListener('click', evt => {
        evt.preventDefault();
        evt.stopPropagation();
        if (favorites.has(mon.name)) {
          favorites.delete(mon.name);
        } else {
          favorites.add(mon.name);
        }
        saveFavorites();
        render(allPokemon, sortSelect.value);
      });

      const teamBtn = document.createElement('button');
      teamBtn.className = 'icon-btn';
      teamBtn.type = 'button';
      teamBtn.textContent = 'Team';
      teamBtn.setAttribute('aria-pressed', team.includes(mon.name));
      teamBtn.setAttribute('aria-label', 'Add or remove from team');
      if (team.includes(mon.name)) teamBtn.classList.add('is-active');
      teamBtn.addEventListener('click', evt => {
        evt.preventDefault();
        evt.stopPropagation();
        toggleTeamMember(mon.name);
      });

      actions.append(favBtn, teamBtn);
      meta.append(name, types);
      card.append(img, meta, actions);
      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  function getTextColor(hex) {
    if (!hex) return '#fff';
    const cleaned = hex.replace('#', '');
    const num = parseInt(cleaned, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7 ? '#0f172a' : '#fff';
  }

  function applyTypeStyle(label, type, isChecked) {
    if (isChecked) {
      const color = typeColors[type] || '#f97316';
      label.style.background = color;
      label.style.borderColor = color;
      label.style.color = getTextColor(color);
    } else {
      label.style.background = '';
      label.style.borderColor = '';
      label.style.color = '';
    }
  }

  function applyFormStyle(label, isChecked) {
    if (isChecked) {
      label.style.background = 'rgba(249, 115, 22, 0.2)';
      label.style.borderColor = '#f97316';
      label.style.color = '#f8fafc';
    } else {
      label.style.background = '';
      label.style.borderColor = '';
      label.style.color = '';
    }
  }

  function renderTypeFilters() {
    typeFilters.innerHTML = '';
    TYPE_ORDER.forEach(type => {
      const label = document.createElement('label');
      label.className = 'filter-pill';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = type;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedTypes.add(type);
        } else {
          selectedTypes.delete(type);
        }
        applyTypeStyle(label, type, checkbox.checked);
        render(allPokemon, sortSelect.value);
      });

      const text = document.createElement('span');
      text.textContent = type;
      text.style.textTransform = 'capitalize';

      label.append(checkbox, text);
      typeFilters.appendChild(label);
      applyTypeStyle(label, type, checkbox.checked);
    });
  }

  function renderFormFilters() {
    if (!formFilters) return;
    formFilters.innerHTML = '';
    FORM_FILTERS.forEach(form => {
      const label = document.createElement('label');
      label.className = 'filter-pill';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = form.id;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedForms.add(form.id);
        } else {
          selectedForms.delete(form.id);
        }
        applyFormStyle(label, checkbox.checked);
        render(allPokemon, sortSelect.value);
      });

      const text = document.createElement('span');
      text.textContent = form.label;

      label.append(checkbox, text);
      formFilters.appendChild(label);
      applyFormStyle(label, checkbox.checked);
    });
  }

  function renderTeam() {
    if (!teamSlots || !teamCoverage) return;
    teamSlots.innerHTML = '';
    teamCoverage.innerHTML = '';
    const filled = team
      .map(name => pokemonByName.get(name))
      .filter(Boolean);

    for (let i = 0; i < 6; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'team-slot';
      const member = filled[i];
      if (member) {
        const img = document.createElement('img');
        img.src = member.sprite;
        img.alt = member.name;
        img.loading = 'lazy';

        const name = document.createElement('p');
        name.className = 'mini-card__name';
        name.textContent = member.name;

        const remove = document.createElement('button');
        remove.className = 'icon-btn';
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => toggleTeamMember(member.name));

        slot.append(img, name, remove);
      } else {
        const empty = document.createElement('p');
        empty.className = 'label';
        empty.textContent = 'Empty slot';
        slot.appendChild(empty);
      }
      teamSlots.appendChild(slot);
    }

    const typeSet = new Set();
    filled.forEach(mon => {
      mon.types.forEach(type => typeSet.add(type));
    });
    if (typeSet.size === 0) {
      const empty = document.createElement('span');
      empty.className = 'move-meta';
      empty.textContent = '—';
      teamCoverage.appendChild(empty);
      return;
    }
    typeSet.forEach(type => {
      const pill = document.createElement('span');
      pill.className = 'type-pill small';
      pill.textContent = type;
      pill.style.background = typeColors[type] || '#e2e8f0';
      teamCoverage.appendChild(pill);
    });
  }

  function toggleTeamMember(name) {
    const idx = team.indexOf(name);
    if (idx >= 0) {
      team.splice(idx, 1);
      saveTeam();
      render(allPokemon, sortSelect.value);
      renderTeam();
      return;
    }
    if (team.length >= 6) {
      setStatus('Team is full. Remove one to add another.');
      return;
    }
    team.push(name);
    saveTeam();
    render(allPokemon, sortSelect.value);
    renderTeam();
  }

  function pickRandomFrom(list) {
    if (!list.length) return null;
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  function startQuiz(next = true) {
    if (!quizImage || !quizStatus || !quizInput) return;
    const pool = filterPokemon(allPokemon);
    const chosen = pickRandomFrom(pool.length ? pool : allPokemon);
    if (!chosen) return;
    quizAnswer = chosen;
    quizImage.src = chosen.sprite;
    quizImage.alt = 'Quiz silhouette';
    quizImage.classList.add('quiz__image--hidden');
    quizInput.value = '';
    quizStatus.textContent = next ? 'Who is this Pokémon?' : quizStatus.textContent;
  }

  function revealQuizAnswer() {
    if (!quizAnswer || !quizImage || !quizStatus) return;
    quizImage.classList.remove('quiz__image--hidden');
    quizStatus.textContent = `It was ${quizAnswer.name}!`;
  }

  function checkQuizAnswer() {
    if (!quizAnswer || !quizStatus) return;
    const guess = normalizeGuess(quizInput.value);
    const answer = normalizeGuess(quizAnswer.name);
    if (!guess) {
      quizStatus.textContent = 'Type a name to guess!';
      return;
    }
    if (guess === answer) {
      quizImage.classList.remove('quiz__image--hidden');
      quizStatus.textContent = 'Correct! Nice job.';
    } else {
      quizStatus.textContent = 'Not quite. Try again or press Reveal!';
    }
  }

  async function init() {
    try {
      setStatus('Loading Pokémon (this may take a moment)…');
      const basic = await fetchList();
      setStatus('Fetching details…');
      allPokemon = await fetchDetails(basic);
      setStatus(`Loaded ${allPokemon.length} Pokémon.`);
      pokemonByName = new Map(allPokemon.map(mon => [mon.name, mon]));
      renderTypeFilters();
      renderFormFilters();
      loadFavorites();
      loadTeam();
      render(allPokemon, sortSelect.value);
      renderTeam();
      startQuiz(false);
    } catch (err) {
      setStatus(err.message || 'Failed to load Pokémon.');
    }
  }

  sortSelect.addEventListener('change', () => {
    render(allPokemon, sortSelect.value);
  });

  genSelect?.addEventListener('change', evt => {
    selectedGen = evt.target.value;
    render(allPokemon, sortSelect.value);
  });

  searchInput?.addEventListener('input', evt => {
    query = evt.target.value.trim().toLowerCase();
    render(allPokemon, sortSelect.value);
  });

  favoritesOnlyInput?.addEventListener('change', evt => {
    favoritesOnly = evt.target.checked;
    render(allPokemon, sortSelect.value);
  });

  randomBtn?.addEventListener('click', () => {
    const pool = filterPokemon(allPokemon);
    const chosen = pickRandomFrom(pool.length ? pool : allPokemon);
    if (!chosen) return;
    window.location.href = `index.html?pokemon=${encodeURIComponent(chosen.name)}`;
  });

  clearTeamBtn?.addEventListener('click', () => {
    team = [];
    saveTeam();
    render(allPokemon, sortSelect.value);
    renderTeam();
  });

  quizCheckBtn?.addEventListener('click', checkQuizAnswer);
  quizRevealBtn?.addEventListener('click', revealQuizAnswer);
  quizNextBtn?.addEventListener('click', () => startQuiz(true));
  quizInput?.addEventListener('keydown', evt => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      checkQuizAnswer();
    }
  });

  init();
})();

