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
  const STARTER_SET = new Set([
    'bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard','squirtle','wartortle','blastoise',
    'chikorita','bayleef','meganium','cyndaquil','quilava','typhlosion','totodile','croconaw','feraligatr',
    'treecko','grovyle','sceptile','torchic','combusken','blaziken','mudkip','marshtomp','swampert',
    'turtwig','grotle','torterra','chimchar','monferno','infernape','piplup','prinplup','empoleon',
    'snivy','servine','serperior','tepig','pignite','emboar','oshawott','dewott','samurott',
    'chespin','quilladin','chesnaught','fennekin','braixen','delphox','froakie','frogadier','greninja',
    'rowlet','dartrix','decidueye','litten','torracat','incineroar','popplio','brionne','primarina',
    'grookey','thwackey','rillaboom','scorbunny','raboot','cinderace','sobble','drizzile','inteleon',
    'sprigatito','floragato','meowscarada','fuecoco','crocalor','skeledirge','quaxly','quaxwell','quaquaval'
  ]);
  const ULTRA_BEAST_SET = new Set([
    'nihilego','buzzwole','pheromosa','xurkitree','celesteela','kartana','guzzlord',
    'poipole','naganadel','stakataka','blacephalon'
  ]);
  const LEGENDARY_SET = new Set([
    'articuno','zapdos','moltres','mewtwo',
    'raikou','entei','suicune','lugia','ho-oh',
    'regirock','regice','registeel','latias','latios','kyogre','groudon','rayquaza',
    'uxie','mesprit','azelf','dialga','palkia','heatran','regigigas','giratina','cresselia',
    'cobalion','terrakion','virizion','tornadus','thundurus','landorus','reshiram','zekrom','kyurem',
    'xerneas','yveltal','zygarde','type-null','silvally',
    'tapu-koko','tapu-lele','tapu-bulu','tapu-fini','cosmog','cosmoem','solgaleo','lunala','necrozma',
    'zacian','zamazenta','eternatus','kubfu','urshifu','regieleki','regidrago','glastrier','spectrier','calyrex',
    'ting-lu','chien-pao','wo-chien','chi-yu','koraidon','miraidon','ogerpon','terapagos','pecharunt'
  ]);
  const MYTHICAL_SET = new Set([
    'mew','celebi','jirachi','deoxys','phione','manaphy','darkrai','shaymin','arceus',
    'victini','keldeo','meloetta','genesect',
    'diancie','hoopa','volcanion',
    'magearna','marshadow','zeraora','meltan','melmetal',
    'zarude'
  ]);
  const TERASTAL_SET = new Set([
    'terapagos-terastal',
    'terapagos-stellar'
  ]);
  const FORM_FILTERS = [
    { id: 'starter', label: 'Starter', match: name => STARTER_SET.has(name) },
    { id: 'mega', label: 'Mega', match: name => name.includes('-mega') },
    { id: 'gmax', label: 'Gigantamax', match: name => name.includes('-gmax') },
    { id: 'ultra-beast', label: 'Ultra beast', match: name => ULTRA_BEAST_SET.has(name) },
    { id: 'legendary', label: 'Legendary', match: name => LEGENDARY_SET.has(name) },
    { id: 'mythical', label: 'Mythical', match: name => MYTHICAL_SET.has(name) },
    { id: 'alolan', label: 'Alolan', match: name => name.includes('-alola') },
    { id: 'galarian', label: 'Galarian', match: name => name.includes('-galar') },
    { id: 'hisuian', label: 'Hisuian', match: name => name.includes('-hisui') },
    { id: 'paldean', label: 'Paldean', match: name => name.includes('-paldea') },
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
  const MAX_TEAM = 6;
  const grid = document.getElementById('pokemon-grid');
  const loadStatus = document.getElementById('load-status');
  const loadMoreBtn = document.getElementById('load-more');
  const sortFilters = document.getElementById('sort-filters');
  const genFilters = document.getElementById('gen-filters');
  const typeFilters = document.getElementById('type-filters');
  const formFilters = document.getElementById('form-filters');
  const searchInput = document.getElementById('search-list');
  const favoritesOnlyInput = document.getElementById('favorites-only');
  const randomBtn = document.getElementById('random-list');
  const sortToggle = document.getElementById('toggle-sort');
  const filterToggle = document.getElementById('toggle-filters');
  const sortPanel = document.getElementById('sort-panel');
  const filterPanel = document.getElementById('filter-panel');

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

  const typeRank = type => {
    const idx = TYPE_ORDER.indexOf(type);
    return idx === -1 ? 999 : idx;
  };

  const sortTypes = list =>
    (list || []).slice().sort((a, b) => {
      const diff = typeRank(a) - typeRank(b);
      return diff !== 0 ? diff : a.localeCompare(b);
    });

  let allPokemon = [];
  let pokemonByName = new Map();
  const selectedTypes = new Set();
  const selectedForms = new Set();
  let favoritesOnly = false;
  const selectedGens = new Set();
  let selectedSort = 'number';
  let favorites = new Set();
  let team = [];
  let query = '';
  let cardByName = new Map();
  const pokemonTypesByName = new Map();
  const typeMembersByType = new Map();
  const loadingTypes = new Set();
  const typeLoadPromises = new Map();
  const PAGE_SIZE = 60;
  let visibleCount = PAGE_SIZE;

  let statusTimer = null;

  function setStatus(text) {
    if (!loadStatus) return;
    loadStatus.textContent = text;
    loadStatus.classList.add('is-visible');
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
    if (/^Loaded\b/i.test(text) || /Failed/i.test(text)) {
      statusTimer = setTimeout(() => {
        loadStatus.classList.remove('is-visible');
      }, 3000);
    }
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
    team = Array.isArray(list) ? list.slice(0, MAX_TEAM) : [];
  }

  function saveTeam() {
    saveStorage(TEAM_KEY, team);
  }

  function toggleTeamMember(name) {
    const idx = team.indexOf(name);
    if (idx >= 0) {
      team.splice(idx, 1);
      saveTeam();
      visibleCount = PAGE_SIZE;
      renderVisible();
      return;
    }
    if (team.length >= MAX_TEAM) {
      setStatus('Team is full. Remove one to add another.');
      return;
    }
    team.push(name);
    saveTeam();
    visibleCount = PAGE_SIZE;
    renderVisible();
  }

  function setPanelState(panel, toggle, isOpen) {
    if (!panel || !toggle) return;
    panel.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
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

  function upsertPokemonType(name, typeName) {
    if (!name || !typeName) return;
    const set = pokemonTypesByName.get(name) || new Set();
    set.add(typeName);
    pokemonTypesByName.set(name, set);
    const mon = pokemonByName.get(name);
    if (mon) {
      mon.types = sortTypes(Array.from(set));
      if (cardByName.has(mon.name)) {
        updateCardDetails(mon);
      }
    }
  }

  async function fetchAllTypes() {
    const YIELD_MS = 120;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const typeName of TYPE_ORDER) {
      if (typeMembersByType.has(typeName)) continue;
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
        if (!res.ok) throw new Error('bad type');
        const data = await res.json();
        const members = new Set();
        (data.pokemon || []).forEach(entry => {
          const name = entry?.pokemon?.name;
          if (!name) return;
          members.add(name);
          upsertPokemonType(name, typeName);
        });
        typeMembersByType.set(typeName, members);
      } catch (err) {
        console.warn('Failed to load type', typeName, err);
      } finally {
        if (YIELD_MS) {
          await sleep(YIELD_MS);
        }
      }
    }
  }

  function ensureTypeData(typeName) {
    if (!typeName) return Promise.resolve();
    if (typeMembersByType.has(typeName)) return Promise.resolve();
    if (typeLoadPromises.has(typeName)) return typeLoadPromises.get(typeName);

    loadingTypes.add(typeName);
    renderTypeFilters();
    const promise = (async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
        if (!res.ok) throw new Error('bad type');
        const data = await res.json();
        const members = new Set();
        (data.pokemon || []).forEach(entry => {
          const name = entry?.pokemon?.name;
          if (!name) return;
          members.add(name);
          upsertPokemonType(name, typeName);
        });
        typeMembersByType.set(typeName, members);
      } catch (err) {
        console.warn('Failed to load type', typeName, err);
      } finally {
        loadingTypes.delete(typeName);
        typeLoadPromises.delete(typeName);
        renderTypeFilters();
      }
    })();

    typeLoadPromises.set(typeName, promise);
    return promise;
  }

  function sortPokemon(pokemon, mode) {
    const list = [...pokemon];
    const sortTypePair = mon => {
      const types = sortTypes(mon.types || []);
      const primary = types[0] || '';
      const secondary = types[1] || '';
      return {
        primaryRank: typeRank(primary),
        secondaryRank: typeRank(secondary),
        primary,
        secondary
      };
    };
    const nameKey = name => String(name || '').replace(/-/g, ' ').toLowerCase();
    switch (mode) {
      case 'name':
        return list.sort((a, b) => nameKey(a.name).localeCompare(nameKey(b.name)) || a.id - b.id);
      case 'type':
        return list.sort((a, b) => {
          const aType = sortTypePair(a);
          const bType = sortTypePair(b);
          return (
            aType.primaryRank - bType.primaryRank ||
            aType.secondaryRank - bType.secondaryRank ||
            aType.primary.localeCompare(bType.primary) ||
            aType.secondary.localeCompare(bType.secondary) ||
            nameKey(a.name).localeCompare(nameKey(b.name)) ||
            a.id - b.id
          );
        });
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
    if (selectedGens.size) {
      filtered = filtered.filter(mon =>
        Array.from(selectedGens).some(gen => {
          const [min, max] = GEN_RANGES[gen] || [];
          return min && max && mon.speciesId >= min && mon.speciesId <= max;
        })
      );
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

  function renderList(list) {
    grid.innerHTML = '';
    cardByName = new Map();
    const frag = document.createDocumentFragment();

    list.forEach(mon => {
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
        visibleCount = PAGE_SIZE;
        renderVisible();
      });

      const teamBtn = document.createElement('button');
      teamBtn.className = 'icon-btn';
      teamBtn.type = 'button';
      const inTeam = team.includes(mon.name);
      teamBtn.textContent = inTeam ? 'Team ✓' : 'Team +';
      teamBtn.setAttribute('aria-pressed', inTeam);
      teamBtn.setAttribute('aria-label', inTeam ? 'Remove from team' : 'Add to team');
      if (inTeam) teamBtn.classList.add('is-active');
      teamBtn.addEventListener('click', evt => {
        evt.preventDefault();
        evt.stopPropagation();
        toggleTeamMember(mon.name);
      });

      actions.append(favBtn, teamBtn);
      meta.append(name, types);
      card.append(img, meta, actions);
      frag.appendChild(card);
      cardByName.set(mon.name, card);
    });

    grid.appendChild(frag);
  }

  function getFilteredSorted() {
    const filtered = filterPokemon(allPokemon);
    return sortPokemon(filtered, selectedSort);
  }

  function updateLoadMoreButton(total) {
    if (!loadMoreBtn) return;
    const remaining = Math.max(total - visibleCount, 0);
    const canMore = remaining > 0;
    loadMoreBtn.hidden = !canMore;
    loadMoreBtn.disabled = !canMore;
    if (canMore) {
      const nextCount = Math.min(PAGE_SIZE, remaining);
      loadMoreBtn.textContent = `Load more (${nextCount} more)`;
    }
  }

  function renderVisible() {
    const sorted = getFilteredSorted();
    const visible = sorted.slice(0, visibleCount);
    renderList(visible);
    updateLoadMoreButton(sorted.length);
  }

  function updateCardDetails(mon) {
    const card = cardByName.get(mon.name);
    if (!card) return;

    const img = card.querySelector('img');
    if (img && mon.sprite) {
      img.src = mon.sprite;
    }

    const name = card.querySelector('.mini-card__name');
    if (name) {
      name.textContent = `#${String(mon.id).padStart(3, '0')} ${mon.name}`;
    }

    const types = card.querySelector('.mini-card__types');
    if (types) {
      types.innerHTML = '';
      (mon.types || []).forEach(type => {
        const pill = document.createElement('span');
        pill.className = 'type-pill small';
        pill.textContent = type;
        pill.style.background = typeColors[type] || '#e2e8f0';
        types.appendChild(pill);
      });
    }
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
      label.classList.add('is-active');
      const color = typeColors[type] || '#f97316';
      label.style.background = color;
      label.style.borderColor = color;
      label.style.color = getTextColor(color);
    } else {
      label.classList.remove('is-active');
      label.style.background = '';
      label.style.borderColor = '';
      label.style.color = '';
    }
  }

  function applyFormStyle(label, isChecked) {
    if (isChecked) {
      label.classList.add('is-active');
      label.style.background = 'rgba(249, 115, 22, 0.2)';
      label.style.borderColor = '#f97316';
      label.style.color = '#f8fafc';
    } else {
      label.classList.remove('is-active');
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
      checkbox.checked = selectedTypes.has(type);
      checkbox.disabled = loadingTypes.has(type);
      checkbox.addEventListener('change', async () => {
        if (checkbox.checked) {
          selectedTypes.add(type);
          applyTypeStyle(label, type, checkbox.checked);
          if (!typeMembersByType.has(type)) {
            setStatus(`Loading ${type} types…`);
            await ensureTypeData(type);
          }
        } else {
          selectedTypes.delete(type);
          applyTypeStyle(label, type, checkbox.checked);
        }
        visibleCount = PAGE_SIZE;
        renderVisible();
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
        visibleCount = PAGE_SIZE;
        renderVisible();
      });

      const text = document.createElement('span');
      text.textContent = form.label;

      label.append(checkbox, text);
      formFilters.appendChild(label);
      applyFormStyle(label, checkbox.checked);
    });
  }

  function renderGenFilters() {
    if (!genFilters) return;
    genFilters.innerHTML = '';
    const gens = [
      { id: '1', label: 'Gen 1 — Kanto' },
      { id: '2', label: 'Gen 2 — Johto' },
      { id: '3', label: 'Gen 3 — Hoenn' },
      { id: '4', label: 'Gen 4 — Sinnoh' },
      { id: '5', label: 'Gen 5 — Unova' },
      { id: '6', label: 'Gen 6 — Kalos' },
      { id: '7', label: 'Gen 7 — Alola' },
      { id: '8', label: 'Gen 8 — Galar' },
      { id: '9', label: 'Gen 9 — Paldea' }
    ];

    gens.forEach(gen => {
      const label = document.createElement('label');
      label.className = 'filter-pill';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = gen.id;
      checkbox.checked = selectedGens.has(gen.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedGens.add(gen.id);
        } else {
          selectedGens.delete(gen.id);
        }
        applyFormStyle(label, checkbox.checked);
        visibleCount = PAGE_SIZE;
        renderVisible();
      });

      const text = document.createElement('span');
      text.textContent = gen.label;

      label.append(checkbox, text);
      genFilters.appendChild(label);
      applyFormStyle(label, checkbox.checked);
    });
  }

  function renderSortFilters() {
    if (!sortFilters) return;
    sortFilters.innerHTML = '';
    const options = [
      { id: 'number', label: 'Number' },
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' }
    ];

    options.forEach(option => {
      const label = document.createElement('label');
      label.className = 'filter-pill';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'sort-filter';
      radio.value = option.id;
      radio.checked = selectedSort === option.id;
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        selectedSort = option.id;
        renderSortFilters();
        visibleCount = PAGE_SIZE;
        renderVisible();
      });

      const text = document.createElement('span');
      text.textContent = option.label;

      label.append(radio, text);
      sortFilters.appendChild(label);
      applyFormStyle(label, radio.checked);
    });
  }

  function pickRandomFrom(list) {
    if (!list.length) return null;
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  async function init() {
    try {
      setStatus('Loading Pokémon list…');
      const list = await fetchList();
      allPokemon = list.map(entry => ({
        id: entry.id,
        name: entry.name,
        types: [],
        forms: getFormTags(entry.name),
        speciesId: entry.id,
        sprite: spriteUrl(entry.id)
      }));
      pokemonByName = new Map(allPokemon.map(mon => [mon.name, mon]));
      renderTypeFilters();
      renderFormFilters();
      renderGenFilters();
      renderSortFilters();
      loadFavorites();
      loadTeam();
      renderVisible();
      setStatus(`Loaded ${allPokemon.length} Pokémon.`);
      fetchAllTypes().then(() => {
        renderVisible();
        setStatus('Types loaded.');
      });
    } catch (err) {
      setStatus(err.message || 'Failed to load Pokémon.');
    }
  }

  searchInput?.addEventListener('input', evt => {
    query = evt.target.value.trim().toLowerCase();
    visibleCount = PAGE_SIZE;
    renderVisible();
  });

  favoritesOnlyInput?.addEventListener('change', evt => {
    favoritesOnly = evt.target.checked;
    const favLabel = favoritesOnlyInput?.closest('label');
    if (favLabel) {
      favLabel.classList.toggle('is-active', favoritesOnly);
      favLabel.classList.toggle('is-favorite', favoritesOnly);
    }
    visibleCount = PAGE_SIZE;
    renderVisible();
  });

  randomBtn?.addEventListener('click', () => {
    const pool = filterPokemon(allPokemon);
    const chosen = pickRandomFrom(pool.length ? pool : allPokemon);
    if (!chosen) return;
    window.location.href = `index.html?pokemon=${encodeURIComponent(chosen.name)}`;
  });

  sortToggle?.addEventListener('click', () => {
    const isOpen = !sortPanel?.classList.contains('is-open');
    setPanelState(sortPanel, sortToggle, isOpen);
  });

  filterToggle?.addEventListener('click', () => {
    const isOpen = !filterPanel?.classList.contains('is-open');
    setPanelState(filterPanel, filterToggle, isOpen);
  });

  loadMoreBtn?.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderVisible();
  });

  const handleAutoLoad = () => {
    if (!loadMoreBtn || loadMoreBtn.hidden || loadMoreBtn.disabled) return;
    visibleCount += PAGE_SIZE;
    renderVisible();
  };

  if (loadMoreBtn && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      handleAutoLoad();
    }, { rootMargin: '200px 0px' });
    observer.observe(loadMoreBtn);
  } else {
    const onScroll = () => {
      if (!loadMoreBtn || loadMoreBtn.hidden || loadMoreBtn.disabled) return;
      const rect = loadMoreBtn.getBoundingClientRect();
      if (rect.top - window.innerHeight < 200) {
        handleAutoLoad();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  init();
})();

