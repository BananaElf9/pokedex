(() => {
  const API_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=1025';
  const TYPE_ORDER = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  const grid = document.getElementById('pokemon-grid');
  const sortSelect = document.getElementById('sort-select');
  const loadStatus = document.getElementById('load-status');
  const typeFilters = document.getElementById('type-filters');
  const searchInput = document.getElementById('search-list');

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
  const selectedTypes = new Set();
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

      meta.append(name, types);
      card.append(img, meta);
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

  async function init() {
    try {
      setStatus('Loading Pokémon (this may take a moment)…');
      const basic = await fetchList();
      setStatus('Fetching details…');
      allPokemon = await fetchDetails(basic);
      setStatus(`Loaded ${allPokemon.length} Pokémon.`);
      renderTypeFilters();
      render(allPokemon, sortSelect.value);
    } catch (err) {
      setStatus(err.message || 'Failed to load Pokémon.');
    }
  }

  sortSelect.addEventListener('change', () => {
    render(allPokemon, sortSelect.value);
  });

  searchInput?.addEventListener('input', evt => {
    query = evt.target.value.trim().toLowerCase();
    render(allPokemon, sortSelect.value);
  });

  init();
})();

