(() => {
  const API_BASE = 'https://pokeapi.co/api/v2/pokemon/';
  const MAX_ID = 1025; // Updated National Dex count
  const FAVORITES_KEY = 'pokedex-favorites';

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const randomBtn = document.getElementById('random-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const tabs = document.querySelectorAll('.tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const evolutionContainer = document.getElementById('evolution-container');
  const statusEl = document.getElementById('status');
  const card = document.getElementById('card');
  const spriteEl = document.getElementById('sprite');
  const idEl = document.getElementById('poke-id');
  const nameEl = document.getElementById('poke-name');
  const typesEl = document.getElementById('types');
  const heightEl = document.getElementById('height');
  const weightEl = document.getElementById('weight');
  const generationEl = document.getElementById('generation');
  const regionEl = document.getElementById('region');
  const baseExpEl = document.getElementById('base-exp');
  const genderEl = document.getElementById('gender');
  const eggEl = document.getElementById('egg-groups');
  const habitatEl = document.getElementById('habitat');
  const locationsEl = document.getElementById('locations');
  const versionsEl = document.getElementById('versions');
  const abilitiesEl = document.getElementById('abilities');
  const statsEl = document.getElementById('stats');
  const bstEl = document.getElementById('bst');
  const movesLevelEl = document.getElementById('moves-level');
  const movesMachineEl = document.getElementById('moves-machine');
  const movesEggEl = document.getElementById('moves-egg');
  const galleryEl = document.getElementById('gallery');
  const formsGalleryEl = document.getElementById('forms-gallery');
  const flavorEl = document.getElementById('flavor');
  const genusEl = document.getElementById('genus');
  const formsEl = document.getElementById('forms');
  const effWeakEl = document.getElementById('eff-weak');
  const effResistEl = document.getElementById('eff-resist');
  const effImmuneEl = document.getElementById('eff-immune');
  const favoriteBtn = document.getElementById('favorite-btn');
  const cryBtn = document.getElementById('cry-btn');
  const funFactsEl = document.getElementById('fun-facts');

  let currentId = null;
  let currentName = null;
  let favorites = new Set();
  let cryAudio = null;
  const abilityCache = new Map();
  const locationCache = new Map();
  const typeCache = new Map();
  const formsCache = new Map();
  const spriteVariants = [
    { label: 'Official', path: ['other', 'official-artwork', 'front_default'] },
    { label: 'Official Shiny', path: ['other', 'official-artwork', 'front_shiny'] },
    { label: 'Dream World', path: ['other', 'dream-world', 'front_default'] },
    { label: 'Default', path: ['front_default'] },
    { label: 'Shiny', path: ['front_shiny'] },
    { label: 'Female', path: ['front_female'] },
    { label: 'Shiny Female', path: ['front_shiny_female'] },
    { label: 'Back', path: ['back_default'] },
    { label: 'Back Shiny', path: ['back_shiny'] },
    { label: 'Back Female', path: ['back_female'] },
    { label: 'Back Shiny Female', path: ['back_shiny_female'] }
  ];

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

  function setStatus(message, tone = 'muted') {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  }

  function setActiveTab(target) {
    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === target;
      tab.classList.toggle('active', isActive);
    });
    tabPanels.forEach(panel => {
      const isActive = panel.dataset.tabPanel === target;
      panel.hidden = !isActive;
    });
  }

  function normalizeQuery(raw) {
    return String(raw ?? '').trim().toLowerCase();
  }

  async function fetchPokemon(query) {
    const normalized = normalizeQuery(query);
    if (!normalized) {
      throw new Error('Please enter a name or ID.');
    }

    const url = `${API_BASE}${encodeURIComponent(normalized)}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Pokémon not found. Try another name or ID.');
      }
      throw new Error('Network error. Please try again.');
    }
    return res.json();
  }

  function spriteUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
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

  function updateFavoriteButton(name) {
    if (!favoriteBtn) return;
    const active = favorites.has(name);
    favoriteBtn.textContent = active ? 'Favourited ⭐' : 'Favourite ☆';
    favoriteBtn.classList.toggle('is-active', active);
  }

  function toggleFavorite(name) {
    if (favorites.has(name)) {
      favorites.delete(name);
    } else {
      favorites.add(name);
    }
    saveFavorites();
    updateFavoriteButton(name);
  }

  function formatGender(genderRate) {
    if (genderRate === -1) return 'Genderless';
    const female = (genderRate / 8) * 100;
    const male = 100 - female;
    const fmt = v => `${Math.round(v)}%`;
    return `${fmt(male)} / ${fmt(female)}`;
  }

  function renderTypes(types) {
    typesEl.innerHTML = '';
    types.forEach(({ type }) => {
      const pill = document.createElement('span');
      pill.className = 'type-pill';
      pill.textContent = type.name;
      pill.style.background = typeColors[type.name] || '#e2e8f0';
      typesEl.appendChild(pill);
    });
  }

  function renderAbilities(abilities) {
    abilitiesEl.innerHTML = '';
    abilities.forEach(({ ability, is_hidden, effect_text }) => {
      const li = document.createElement('li');
      li.className = 'chip';
      const title = document.createElement('div');
      title.className = 'ability-title';
      title.textContent = `${ability.name}${is_hidden ? ' (hidden)' : ''}`;
      const desc = document.createElement('p');
      desc.className = 'ability-desc';
      desc.textContent = effect_text || '—';
      li.append(title, desc);
      abilitiesEl.appendChild(li);
    });
  }

  function renderStats(stats) {
    statsEl.innerHTML = '';
    const total = stats.reduce((sum, { base_stat }) => sum + base_stat, 0);
    if (bstEl) bstEl.textContent = `Base Stat Total: ${total}`;
    stats.forEach(({ base_stat, stat }) => {
      const row = document.createElement('li');
      row.className = 'stat-row';

      const name = document.createElement('span');
      name.className = 'stat-name';
      name.textContent = stat.name;

      const bar = document.createElement('div');
      bar.className = 'stat-bar';
      const fill = document.createElement('div');
      fill.className = 'stat-fill';
      fill.style.width = `${Math.min(base_stat, 200) / 2.5}%`; // shorter scale
      fill.style.background = statColor(stat.name);
      bar.appendChild(fill);

      const value = document.createElement('span');
      value.className = 'value';
      const { min, max } = statRange(base_stat, stat.name === 'hp');
      value.textContent = `${base_stat} (${min}/${max})`;

      row.append(name, bar, value);
      statsEl.appendChild(row);
    });
  }

  function renderCard(data, abilityDetails, genderText, eggGroupsText, habitatText, versionsText, flavorText, genusText, biologyText) {
    const { id, name, sprites, types, height, weight, base_experience, abilities, stats } = data;
    currentId = id;
    currentName = name;
    idEl.textContent = `#${String(id).padStart(3, '0')}`;
    nameEl.textContent = name;
    spriteEl.src = sprites.other['official-artwork'].front_default || sprites.front_default;
    spriteEl.alt = `${name} sprite`;

    renderTypes(types);
    renderAbilities(abilityDetails || abilities);
    renderStats(stats);

    heightEl.textContent = `${(height / 10).toFixed(1)} m`;
    weightEl.textContent = `${(weight / 10).toFixed(1)} kg`;
    baseExpEl.textContent = base_experience ?? '—';
    if (genderEl) {
      genderEl.textContent = genderText ?? '—';
    }
    if (eggEl) eggEl.textContent = eggGroupsText ?? '—';
    if (habitatEl) habitatEl.textContent = habitatText ?? '—';
    if (versionsEl) {
      versionsEl.innerHTML = '';
      if (!versionsText || versionsText === '—') {
        const li = document.createElement('li');
        li.className = 'move-meta';
        li.textContent = '—';
        versionsEl.appendChild(li);
      } else {
        versionsText.split(', ').forEach(version => {
          const li = document.createElement('li');
          li.className = 'version-chip';
          li.textContent = version;
          versionsEl.appendChild(li);
        });
      }
    }
    if (flavorEl) flavorEl.textContent = flavorText || '—';
    if (genusEl) genusEl.textContent = genusText || '—';
    const bioEl = document.getElementById('biology');
    if (bioEl) {
      if (biologyText) {
        bioEl.hidden = false;
        bioEl.textContent = biologyText;
      } else {
        bioEl.hidden = true;
        bioEl.textContent = '';
      }
    }

    updateFavoriteButton(name);
    card.hidden = false;
  }

  function renderForms(varieties, currentName) {
    if (!formsEl) return;
    formsEl.innerHTML = '';
    if (!varieties?.length) {
      const li = document.createElement('li');
      li.className = 'move-meta';
      li.textContent = '—';
      formsEl.appendChild(li);
      return;
    }
    varieties.forEach(v => {
      const li = document.createElement('li');
      li.className = 'chip';
      const link = document.createElement('a');
      link.href = `index.html?pokemon=${encodeURIComponent(v.pokemon.name)}`;
      const name = cleanName(v.pokemon.name);
      link.textContent = v.is_default && name === currentName ? `${name} (default)` : name;
      link.className = 'link-plain';
      li.appendChild(link);
      formsEl.appendChild(li);
    });
  }

  async function fetchSpeciesFromPokemon(pokemon) {
    const url = pokemon?.species?.url;
    if (!url) throw new Error('Species link missing for this Pokémon.');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load species info.');
    return res.json();
  }

  async function resolvePokemonFromSpecies(speciesName, currentPokemonName = null) {
    // Fetch species data from pokemon-species API
    try {
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(speciesName)}`);
      if (!speciesRes.ok) return { name: speciesName, id: null };
      const speciesData = await speciesRes.json();
      
      // If we have a current Pokémon name that matches a variety, use that form
      if (currentPokemonName) {
        const matchingVariety = speciesData.varieties?.find(
          v => v.pokemon.name.toLowerCase() === currentPokemonName.toLowerCase()
        );
        if (matchingVariety?.pokemon?.url) {
          const pokemonId = parseInt(matchingVariety.pokemon.url.split('/').filter(Boolean).pop(), 10);
          return { name: matchingVariety.pokemon.name, id: pokemonId };
        }
      }
      
      // Otherwise, get the default form (is_default: true) or first variety
      const defaultVariety = speciesData.varieties?.find(v => v.is_default) || speciesData.varieties?.[0];
      if (!defaultVariety?.pokemon?.url) {
        // Fallback: try to get ID from species URL
        const speciesId = parseInt(speciesData.id, 10);
        return { name: speciesName, id: speciesId };
      }
      
      // Extract Pokémon ID from the pokemon URL
      const pokemonId = parseInt(defaultVariety.pokemon.url.split('/').filter(Boolean).pop(), 10);
      return { name: defaultVariety.pokemon.name, id: pokemonId };
    } catch (err) {
      // Fallback: try to parse ID from species name or use species API ID
      try {
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(speciesName)}`);
        if (speciesRes.ok) {
          const speciesData = await speciesRes.json();
          return { name: speciesName, id: parseInt(speciesData.id, 10) };
        }
      } catch (e) {
        // Ignore
      }
      return { name: speciesName, id: null };
    }
  }

  function evolutionMethodText(detail) {
    if (!detail) return 'Evolves';
    const parts = [];
    const trigger = detail.trigger?.name;

    if (trigger === 'level-up') {
      if (detail.min_level) {
        let timeTag = '';
        const rawTime = detail.time_of_day;
        if (rawTime) {
          const time = rawTime === 'day' ? 'Day' : rawTime === 'night' ? 'Night' : cleanName(rawTime);
          timeTag = ` (${time} only)`;
        }
        parts.push(`Level ${detail.min_level}${timeTag}`);
      } else {
        parts.push('Level up');
      }
      if (detail.min_happiness) parts.push('High friendship');
      if (detail.min_affection) parts.push(`Affection ${detail.min_affection}+`);
      if (detail.min_beauty) parts.push(`Beauty ${detail.min_beauty}+`);
      if (detail.time_of_day && !detail.min_level) {
        const pretty = detail.time_of_day === 'day' ? 'Daytime only' : detail.time_of_day === 'night' ? 'Night only' : detail.time_of_day;
        parts.push(pretty);
      }
      if (detail.known_move?.name) parts.push(`Knowing ${cleanName(detail.known_move.name)}`);
      if (detail.known_move_type?.name) parts.push(`Knowing a ${cleanName(detail.known_move_type.name)} move`);
      if (detail.location?.name) parts.push(`at ${cleanName(detail.location.name)}`);
      if (detail.needs_overworld_rain) parts.push('While raining');
      if (detail.party_species?.name) parts.push(`With ${cleanName(detail.party_species.name)} in party`);
      if (detail.party_type?.name) parts.push(`With a ${cleanName(detail.party_type.name)} type in party`);
      if (typeof detail.relative_physical_stats === 'number') {
        const rel = detail.relative_physical_stats;
        if (rel > 0) parts.push('Atk > Def');
        else if (rel < 0) parts.push('Atk < Def');
        else parts.push('Atk = Def');
      }
      if (detail.turn_upside_down) parts.push('Hold console upside-down');
    } else if (trigger === 'use-item' && detail.item?.name) {
      parts.push(`Use ${cleanName(detail.item.name)}`);
    } else if (trigger === 'trade') {
      parts.push('Trade');
      if (detail.held_item?.name) parts.push(`holding ${cleanName(detail.held_item.name)}`);
      if (detail.trade_species?.name) parts.push(`for ${cleanName(detail.trade_species.name)}`);
    } else if (trigger) {
      parts.push(cleanName(trigger));
    }

    if (detail.gender === 1) parts.push('Female only');
    if (detail.gender === 2) parts.push('Male only');

    return parts.length ? parts.join(', ') : 'Evolves';
  }

  async function fetchEvolutionChainFromSpecies(species, currentPokemonName = null) {
    const chainUrl = species?.evolution_chain?.url;
    if (!chainUrl) return null;

    const chainRes = await fetch(chainUrl);
    if (!chainRes.ok) throw new Error('Failed to load evolution chain.');
    const chain = await chainRes.json();

    async function buildTree(node, methodText = null, isRoot = false) {
      if (!node) return null;
      const speciesName = node.species.name;
      const pokemonData = await resolvePokemonFromSpecies(
        speciesName,
        isRoot ? currentPokemonName : null
      );
      let types = [];
      try {
        if (pokemonData?.name) {
          const res = await fetch(`${API_BASE}${encodeURIComponent(pokemonData.name)}`);
          if (res.ok) {
            const data = await res.json();
            types = data.types?.map(t => t.type.name) || [];
          }
        }
      } catch (err) {
        types = [];
      }
      const children = await Promise.all(
        (node.evolves_to || []).map(async next => {
          const detail = next.evolution_details?.[0];
          const text = evolutionMethodText(detail);
          return buildTree(next, text, false);
        })
      );
      return {
        name: pokemonData.name,
        id: pokemonData.id,
        method: methodText,
        types,
        children: children.filter(Boolean)
      };
    }

    return buildTree(chain.chain, null, true);
  }

  function renderEvolution(tree, currentPokemon, specialForms = []) {
    if (!evolutionContainer) return;
    evolutionContainer.innerHTML = '';
    const hasTree = Boolean(tree);
    const hasSpecial = specialForms.length > 0;
    if (!hasTree && !hasSpecial) {
      const empty = document.createElement('p');
      empty.className = 'subtitle';
      empty.textContent = 'No evolution data.';
      evolutionContainer.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();

    const buildCard = node => {
      const card = document.createElement('a');
      card.className = 'evo-node';
      card.href = `index.html?pokemon=${encodeURIComponent(node.name)}`;

      const isCurrent =
        currentPokemon &&
        (node.name.toLowerCase() === currentPokemon.name?.toLowerCase() ||
          (node.name.toLowerCase() === currentPokemon.species?.name?.toLowerCase() &&
            currentPokemon.name?.includes('-')));
      const displayName = isCurrent ? currentPokemon.name : node.name;
      const displayId = isCurrent ? currentPokemon.id : node.id;
      if (isCurrent) card.classList.add('evo-node--current');

      const img = document.createElement('img');
      img.src =
        (isCurrent
          ? currentPokemon.sprites?.other?.['official-artwork']?.front_default ||
            currentPokemon.sprites?.front_default
          : null) || spriteUrl(displayId);
      img.alt = displayName;
      img.loading = 'lazy';

      const name = document.createElement('p');
      name.className = 'mini-card__name';
      name.textContent = displayName;

      if (isCurrent) {
        const currentTag = document.createElement('span');
        currentTag.className = 'evo-current-tag';
        currentTag.textContent = 'Current';
        name.appendChild(currentTag);
      }

      const types = document.createElement('div');
      types.className = 'evo-node__types';
      (node.types || []).forEach(type => {
        const pill = document.createElement('span');
        pill.className = 'type-pill small';
        pill.textContent = type;
        pill.style.background = typeColors[type] || '#e2e8f0';
        types.appendChild(pill);
      });

      const idTag = document.createElement('p');
      idTag.className = 'eyebrow';
      idTag.textContent = `#${String(displayId ?? '').padStart(3, '0')}`;

      card.append(img, name, idTag, types);
      return card;
    };

    const methodBadge = method => {
      const text = method || 'Evolves';
      const lower = text.toLowerCase();
      const badges = [];
      if (lower.includes('use ')) badges.push('Stone');
      if (lower.includes('friend') || lower.includes('affection')) badges.push('Friendship');
      if (lower.includes('day')) badges.push('Day');
      if (lower.includes('night')) badges.push('Night');
      if (lower.includes('trade')) badges.push('Trade');
      if (lower.includes('level')) badges.push('Level');
      if (!badges.length) return null;
      const wrap = document.createElement('div');
      wrap.className = 'evo-branch__badges';
      badges.forEach(label => {
        const chip = document.createElement('span');
        chip.className = 'evo-badge';
        chip.textContent = label;
        wrap.appendChild(chip);
      });
      return wrap;
    };

    const buildBranch = node => {
      const branch = document.createElement('div');
      branch.className = 'evo-branch';
      branch.appendChild(buildCard(node));

      if (node.children && node.children.length) {
        const childrenWrap = document.createElement('div');
        childrenWrap.className = 'evo-branch__children';
        node.children.forEach(child => {
          const childRow = document.createElement('div');
          childRow.className = 'evo-branch__child';

          const methodWrap = document.createElement('div');
          methodWrap.className = 'evo-branch__method';
          const arrow = document.createElement('span');
          arrow.className = 'evo-branch__arrow';
          arrow.textContent = '→';
          const text = document.createElement('span');
          text.className = 'evo-branch__text';
          text.textContent = child.method || 'Evolves';
          methodWrap.append(arrow, text);
          const badges = methodBadge(child.method);
          if (badges) methodWrap.appendChild(badges);

          childRow.append(methodWrap, buildBranch(child));
          childrenWrap.appendChild(childRow);
        });
        branch.appendChild(childrenWrap);
      }

      return branch;
    };

    if (hasTree) {
      frag.appendChild(buildBranch(tree));
    }

    if (hasSpecial) {
      const section = document.createElement('div');
      section.className = 'evo-special';
      const title = document.createElement('p');
      title.className = 'label';
      title.textContent = 'Special Evolutions';
      const grid = document.createElement('div');
      grid.className = 'evo-special__grid';

      specialForms.forEach(form => {
        const card = document.createElement('a');
        card.className = 'evo-node';
        card.href = `index.html?pokemon=${encodeURIComponent(form.name)}`;

        const img = document.createElement('img');
        img.src = spriteUrl(form.id);
        img.alt = form.name;
        img.loading = 'lazy';

        const name = document.createElement('p');
        name.className = 'mini-card__name';
        name.textContent = form.label;

        const idTag = document.createElement('p');
        idTag.className = 'eyebrow';
        idTag.textContent = `#${String(form.id ?? '').padStart(3, '0')}`;

        card.append(img, name, idTag);
        grid.appendChild(card);
      });

      section.append(title, grid);
      frag.appendChild(section);
    }

    evolutionContainer.appendChild(frag);
  }


  function abilityEffectText(ability) {
    if (!ability) return null;
    const entry = ability.effect_entries?.find(e => e.language.name === 'en');
    if (entry?.short_effect) return entry.short_effect;
    const flavor = ability.flavor_text_entries?.find(e => e.language.name === 'en');
    return flavor?.flavor_text?.replace(/\s+/g, ' ') || null;
  }

  async function enrichAbilities(list) {
    const results = await Promise.all(
      list.map(async entry => {
        const cached = abilityCache.get(entry.ability.name);
        if (cached) return { ...entry, effect_text: cached };
        try {
          const res = await fetch(entry.ability.url);
          if (!res.ok) throw new Error('bad ability');
          const ability = await res.json();
          const text = abilityEffectText(ability);
          abilityCache.set(entry.ability.name, text);
          return { ...entry, effect_text: text };
        } catch (err) {
          return { ...entry, effect_text: null };
        }
      })
    );
    return results;
  }

  function cleanName(text) {
    return text?.replace(/-/g, ' ') ?? '';
  }

  function generationLabel(genName) {
    const map = {
      'generation-i': 'Gen 1',
      'generation-ii': 'Gen 2',
      'generation-iii': 'Gen 3',
      'generation-iv': 'Gen 4',
      'generation-v': 'Gen 5',
      'generation-vi': 'Gen 6',
      'generation-vii': 'Gen 7',
      'generation-viii': 'Gen 8',
      'generation-ix': 'Gen 9'
    };
    return map[genName] || cleanName(genName) || '—';
  }

  function regionFromGeneration(genName) {
    const map = {
      'generation-i': 'Kanto',
      'generation-ii': 'Johto',
      'generation-iii': 'Hoenn',
      'generation-iv': 'Sinnoh',
      'generation-v': 'Unova',
      'generation-vi': 'Kalos',
      'generation-vii': 'Alola',
      'generation-viii': 'Galar',
      'generation-ix': 'Paldea'
    };
    return map[genName] || 'Unknown';
  }

  function titleCase(text) {
    return String(text || '')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function isSpecialEvolution(name) {
    return name.includes('-mega') || name.includes('-gmax');
  }

  function specialEvolutionLabel(name) {
    const base = cleanName(name);
    return titleCase(base.replace('gmax', 'Gigantamax').replace('mega', 'Mega'));
  }

  function parseIdFromUrl(url) {
    if (!url) return null;
    const parts = url.split('/').filter(Boolean);
    const id = Number(parts[parts.length - 1]);
    return Number.isFinite(id) ? id : null;
  }

  function formatHeightWeight(height, weight) {
    const meters = (height / 10) || 0;
    const inches = meters * 39.3701;
    const feet = Math.floor(inches / 12);
    const remInches = Math.round(inches % 12);
    const kg = (weight / 10) || 0;
    const lbs = kg * 2.20462;
    return {
      height: `${meters.toFixed(1)} m (${feet}'${remInches}")`,
      weight: `${kg.toFixed(1)} kg (${lbs.toFixed(1)} lb)`
    };
  }

  function renderFunFacts(pokemon, species) {
    if (!funFactsEl) return;
    funFactsEl.innerHTML = '';
    if (!pokemon || !species) {
      const empty = document.createElement('li');
      empty.className = 'move-meta';
      empty.textContent = '—';
      funFactsEl.appendChild(empty);
      return;
    }

    const facts = [];
    const pretty = value => cleanName(value || 'Unknown');
    const { height, weight } = formatHeightWeight(pokemon.height, pokemon.weight);
    facts.push(`Height: ${height}`);
    facts.push(`Weight: ${weight}`);
    facts.push(`Color: ${pretty(species.color?.name)}`);
    facts.push(`Shape: ${pretty(species.shape?.name)}`);
    facts.push(`Growth: ${pretty(species.growth_rate?.name)}`);
    facts.push(`Generation: ${pretty(species.generation?.name)}`);
    facts.push(`Capture rate: ${species.capture_rate ?? '—'}`);
    facts.push(`Base friendship: ${species.base_happiness ?? '—'}`);
    facts.push(`Egg cycles: ${species.hatch_counter ?? '—'}`);
    if (species.is_legendary) facts.push('Legendary');
    if (species.is_mythical) facts.push('Mythical');
    if (species.is_baby) facts.push('Baby Pokémon');

    facts.forEach(fact => {
      const li = document.createElement('li');
      li.className = 'chip';
      li.textContent = fact;
      funFactsEl.appendChild(li);
    });
  }

  function setupCry(pokemon) {
    if (!cryBtn) return;
    const cryUrl = pokemon?.cries?.latest || pokemon?.cries?.legacy;
    const canPlayOgg = (() => {
      try {
        const audio = document.createElement('audio');
        return Boolean(audio.canPlayType('audio/ogg; codecs="vorbis"'));
      } catch (err) {
        return false;
      }
    })();
    if (!canPlayOgg) {
    cryBtn.disabled = true;
    cryBtn.textContent = '🔊 Cry not supported';
      cryAudio = null;
      return;
    }
    if (!cryUrl) {
      cryBtn.disabled = true;
      cryBtn.textContent = '🔊 No Cry';
      cryAudio = null;
      return;
    }
    cryBtn.disabled = false;
    cryBtn.textContent = '🔊 Play Cry';
    cryAudio = new Audio(cryUrl);
  }

  function deepGet(obj, path) {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  }

  function renderGallery(sprites) {
    if (!galleryEl) return;
    galleryEl.innerHTML = '';
    const seen = new Set();
    const frag = document.createDocumentFragment();

    spriteVariants.forEach(variant => {
      const url = deepGet(sprites, variant.path);
      if (!url || seen.has(url)) return;
      seen.add(url);

      const card = document.createElement('div');
      card.className = 'gallery-card';

      const img = document.createElement('img');
      img.src = url;
      img.alt = `${variant.label} sprite`;
      img.loading = 'lazy';

      const label = document.createElement('p');
      label.className = 'label';
      label.textContent = variant.label;

      card.append(img, label);
      frag.appendChild(card);
    });

    if (!frag.childNodes.length) {
      const empty = document.createElement('p');
      empty.className = 'subtitle';
      empty.textContent = 'No additional sprites available.';
      galleryEl.appendChild(empty);
      return;
    }

    galleryEl.appendChild(frag);
  }

  async function fetchFormEntry(form) {
    if (!form?.url) return null;
    if (formsCache.has(form.url)) return formsCache.get(form.url);
    try {
      const res = await fetch(form.url);
      if (!res.ok) throw new Error('bad form');
      const data = await res.json();
      const baseName = cleanName(data.pokemon?.name || form.name || data.name);
      const formName = cleanName(data.form_name || '');
      const label =
        formName && formName !== baseName
          ? `${baseName} (${titleCase(formName)})`
          : baseName;
      const entry = {
        name: data.name || form.name,
        label,
        sprite:
          data.sprites?.other?.['official-artwork']?.front_default ||
          data.sprites?.front_default ||
          null
      };
      formsCache.set(form.url, entry);
      return entry;
    } catch (err) {
      const entry = { name: form.name, label: cleanName(form.name), sprite: null };
      formsCache.set(form.url, entry);
      return entry;
    }
  }

  async function renderAllForms(forms) {
    if (!formsGalleryEl) return;
    formsGalleryEl.innerHTML = '';
    const list = (forms || []).filter(f => f?.url);
    if (list.length <= 1) {
      const empty = document.createElement('p');
      empty.className = 'subtitle';
      empty.textContent = 'No extra forms available.';
      formsGalleryEl.appendChild(empty);
      return;
    }

    const results = await Promise.all(list.map(fetchFormEntry));
    const frag = document.createDocumentFragment();
    results
      .filter(Boolean)
      .forEach(form => {
        const card = document.createElement('div');
        card.className = 'gallery-card';

        if (form.sprite) {
          const img = document.createElement('img');
          img.src = form.sprite;
          img.alt = form.label;
          img.loading = 'lazy';
          card.appendChild(img);
        }

        const label = document.createElement('p');
        label.className = 'label';
        label.textContent = form.label;
        card.appendChild(label);

        frag.appendChild(card);
      });

    if (!frag.childNodes.length) {
      const empty = document.createElement('p');
      empty.className = 'subtitle';
      empty.textContent = 'No extra forms available.';
      formsGalleryEl.appendChild(empty);
      return;
    }

    formsGalleryEl.appendChild(frag);
  }


  function renderMoves({ level = [], machine = [], egg = [] }) {
    const fillList = (el, items, formatter) => {
      el.innerHTML = '';
      if (!items.length) {
        const li = document.createElement('li');
        li.className = 'move-meta';
        li.textContent = '—';
        el.appendChild(li);
        return;
      }
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'move-chip';
        const name = document.createElement('span');
        name.textContent = cleanName(item.name);
        const meta = document.createElement('span');
        meta.className = 'move-meta';
        meta.textContent = formatter(item);

        const type = document.createElement('span');
        type.className = 'move-type-pill';
        if (item.type) {
          type.textContent = cleanName(item.type);
          const color = typeColors[item.type] || '#94a3b8';
          type.style.background = color;
          const textColor = (() => {
            const hex = color.replace('#', '');
            if (hex.length !== 6) return '#0f172a';
            const num = parseInt(hex, 16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.7 ? '#0f172a' : '#fff';
          })();
          type.style.color = textColor;
        } else {
          type.textContent = '';
        }

        li.append(name, meta, type);
        el.appendChild(li);
      });
    };

    fillList(movesLevelEl, level, m => `Lv ${m.level || '?'}`);
    fillList(movesMachineEl, machine, m => m.source || 'TM/TR');
    fillList(movesEggEl, egg, () => 'Egg');
  }

  async function groupMoves(moves) {
    const buckets = { level: [], machine: [], egg: [] };
    await Promise.all(
      moves.map(async entry => {
        const moveName = entry.move.name;
        const moveUrl = entry.move.url;
        if (!entry.version_group_details?.length) return;
        const detail = entry.version_group_details.reduce((best, cur) => {
          if (!best) return cur;
          if ((cur.level_learned_at || 0) > (best.level_learned_at || 0)) return cur;
          return best;
        }, null);
        if (!detail) return;
        const method = detail.move_learn_method?.name;
        let type = '';
        try {
          if (moveUrl) {
            const res = await fetch(moveUrl);
            if (res.ok) {
              const mv = await res.json();
              type = mv.type?.name || '';
            }
          }
        } catch (err) {
          // ignore fetch errors for move types
        }
        const common = { name: moveName, type };
        if (method === 'level-up') {
          buckets.level.push({ ...common, level: detail.level_learned_at });
        } else if (method === 'machine') {
          buckets.machine.push({ ...common, source: 'TM/TR' });
        } else if (method === 'egg') {
          buckets.egg.push(common);
        }
      })
    );
    buckets.level.sort((a, b) => (a.level || 0) - (b.level || 0) || a.name.localeCompare(b.name));
    buckets.machine.sort((a, b) => a.name.localeCompare(b.name));
    buckets.egg.sort((a, b) => a.name.localeCompare(b.name));
    return buckets;
  }

  function statColor(name) {
    switch (name) {
      case 'hp':
        return 'linear-gradient(90deg, #ef4444, #f97316)';
      case 'attack':
        return 'linear-gradient(90deg, #f97316, #facc15)';
      case 'defense':
        return 'linear-gradient(90deg, #facc15, #22c55e)';
      case 'special-attack':
        return 'linear-gradient(90deg, #06b6d4, #3b82f6)';
      case 'special-defense':
        return 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
      case 'speed':
        return 'linear-gradient(90deg, #ec4899, #8b5cf6)';
      default:
        return 'linear-gradient(90deg, var(--accent), #fbbf24)';
    }
  }

  function statRange(base, isHp) {
    const lvl = 50;
    const ivMin = 0;
    const ivMax = 31;
    const evMin = 0;
    const evMax = 252;
    const natureMinus = 0.9;
    const naturePlus = 1.1;

    const calcHp = (iv, ev) =>
      Math.floor(((2 * base + iv + Math.floor(ev / 4)) * lvl) / 100) + lvl + 10;
    const calcOther = (iv, ev, nature) =>
      Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * lvl) / 100) + 5) * nature);

    if (isHp) {
      return {
        min: calcHp(ivMin, evMin),
        max: calcHp(ivMax, evMax)
      };
    }
    return {
      min: calcOther(ivMin, evMin, natureMinus),
      max: calcOther(ivMax, evMax, naturePlus)
    };
  }

  async function fetchType(name) {
    if (typeCache.has(name)) return typeCache.get(name);
    const res = await fetch(`https://pokeapi.co/api/v2/type/${name}`);
    if (!res.ok) throw new Error('Failed to load type data');
    const data = await res.json();
    typeCache.set(name, data);
    return data;
  }

  async function computeEffectiveness(types) {
    const attackTypes = new Set();
    const mult = {};

    for (const t of types) {
      const data = await fetchType(t.type.name);
      const rel = data.damage_relations;
      const apply = (list, factor) => {
        list.forEach(entry => {
          const atk = entry.name;
          attackTypes.add(atk);
          mult[atk] = (mult[atk] ?? 1) * factor;
        });
      };
      apply(rel.double_damage_from, 2);
      apply(rel.half_damage_from, 0.5);
      apply(rel.no_damage_from, 0);
    }

    const categorized = {
      weak: [],
      resist: [],
      immune: []
    };

    attackTypes.forEach(atk => {
      const m = mult[atk] ?? 1;
      if (m >= 2) categorized.weak.push({ name: atk, mult: m });
      else if (m === 0) categorized.immune.push({ name: atk, mult: m });
      else if (m <= 0.5) categorized.resist.push({ name: atk, mult: m });
    });

    const sortFn = (a, b) => b.mult - a.mult || a.name.localeCompare(b.name);
    categorized.weak.sort(sortFn);
    categorized.resist.sort(sortFn);
    categorized.immune.sort((a, b) => a.name.localeCompare(b.name));
    return categorized;
  }

  function renderEffectiveness(eff) {
    const fill = (el, list) => {
      if (!el) return;
      el.innerHTML = '';
      if (!list.length) {
        const li = document.createElement('li');
        li.className = 'move-meta';
        li.textContent = '—';
        el.appendChild(li);
        return;
      }
      list.forEach(item => {
        const li = document.createElement('li');
        li.className = 'eff-chip';
        const pill = document.createElement('span');
        pill.className = 'type-pill-sm';
        pill.textContent = cleanName(item.name);
        const color = typeColors[item.name] || '#cbd5e1';
        pill.style.background = color;
        const textColor = (() => {
          const hex = color.replace('#', '');
          if (hex.length !== 6) return '#0f172a';
          const num = parseInt(hex, 16);
          const r = (num >> 16) & 255;
          const g = (num >> 8) & 255;
          const b = num & 255;
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.7 ? '#0f172a' : '#fff';
        })();
        pill.style.color = textColor;
        const mult = document.createElement('span');
        mult.className = 'eff-mult';
        mult.textContent = item.mult === 0 ? '0x' : `${item.mult}x`;
        li.append(pill, mult);
        el.appendChild(li);
      });
    };
    fill(effWeakEl, eff.weak);
    fill(effResistEl, eff.resist);
    fill(effImmuneEl, eff.immune);
  }

  async function fetchLocations(url) {
    if (!url) return [];
    if (locationCache.has(url)) return locationCache.get(url);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('bad locations');
      const data = await res.json();
      const versionMap = new Map();
      data.forEach(entry => {
        const area = cleanName(entry.location_area?.name);
        if (!area) return;
        (entry.version_details || []).forEach(detail => {
          const version = cleanName(detail.version?.name);
          if (!version) return;
          const set = versionMap.get(version) || new Set();
          set.add(area);
          versionMap.set(version, set);
        });
      });

      const formatted = Array.from(versionMap.entries()).map(([version, areas]) => ({
        version,
        areas: Array.from(areas)
      }));

      locationCache.set(url, formatted);
      return formatted;
    } catch (err) {
      return [];
    }
  }

  function renderLocations(list) {
    if (!locationsEl) return;
    locationsEl.innerHTML = '';
    if (!list?.length) {
      const li = document.createElement('li');
      li.className = 'move-meta';
      li.textContent = '—';
      locationsEl.appendChild(li);
      return;
    }

    list.forEach(item => {
      const li = document.createElement('li');
      li.className = 'location-row';
      const label = document.createElement('span');
      label.className = 'location-game';
      label.textContent = item.version;
      const areas = document.createElement('span');
      areas.className = 'location-areas';
      const maxAreas = 4;
      const trimmed = item.areas.slice(0, maxAreas);
      const remaining = item.areas.length - trimmed.length;
      areas.textContent = trimmed.join(', ') + (remaining > 0 ? ` +${remaining} more` : '');
      li.append(label, areas);
      locationsEl.appendChild(li);
    });
  }

  async function handleSearch(query) {
    setStatus('Loading…');
    toggleLoading(true);
    try {
      const pokemon = await fetchPokemon(query);
      const abilityDetails = await enrichAbilities(pokemon.abilities || []);
      const species = await fetchSpeciesFromPokemon(pokemon);
      const genderText = formatGender(species.gender_rate);
      const eggGroups = species.egg_groups?.map(g => cleanName(g.name)).join(', ') || '—';
      const habitatText = cleanName(species.habitat?.name) || 'Unknown';
      const locationsList = await fetchLocations(pokemon.location_area_encounters);
      const versionsText =
        pokemon.game_indices?.map(g => cleanName(g.version?.name)).filter(Boolean).join(', ') || '—';
      const flavorEntries = (species.flavor_text_entries || []).filter(e => e.language?.name === 'en');
      const flavorText = flavorEntries[0]?.flavor_text?.replace(/\s+/g, ' ') || '';
      const biologyTextRaw = flavorEntries[1]?.flavor_text?.replace(/\s+/g, ' ') || '';
      const biologyText = biologyTextRaw && biologyTextRaw !== flavorText ? biologyTextRaw : '';
      const genusText = (species.genera || []).find(g => g.language?.name === 'en')?.genus || '';
      const genName = species.generation?.name || '';
      if (generationEl) generationEl.textContent = generationLabel(genName);
      if (regionEl) regionEl.textContent = regionFromGeneration(genName);
      const varieties = species.varieties || [];
      renderForms(varieties, pokemon.name);
      const specialForms = varieties
        .filter(v => !v.is_default && isSpecialEvolution(v.pokemon?.name || ''))
        .map(v => ({
          name: v.pokemon.name,
          id: parseIdFromUrl(v.pokemon.url),
          label: specialEvolutionLabel(v.pokemon.name)
        }))
        .filter(form => form.id);
      renderCard(pokemon, abilityDetails, genderText, eggGroups, habitatText, versionsText, flavorText, genusText, biologyText);
      renderLocations(locationsList);
      renderFunFacts(pokemon, species);
      setupCry(pokemon);
      const evoChain = await fetchEvolutionChainFromSpecies(species, pokemon.name);
      renderEvolution(evoChain, pokemon, specialForms);
      const moves = await groupMoves(pokemon.moves || []);
      renderMoves(moves);
      renderGallery(pokemon.sprites || {});
      renderAllForms(pokemon.forms || []);
      const eff = await computeEffectiveness(pokemon.types || []);
      renderEffectiveness(eff);
      setStatus('Found it!', 'success');
      const nextUrl = `index.html?pokemon=${encodeURIComponent(pokemon.name)}`;
      window.history.replaceState(null, '', nextUrl);
    } catch (err) {
      setStatus(err.message || 'Something went wrong.', 'error');
      card.hidden = true;
      if (evolutionContainer) evolutionContainer.innerHTML = '';
      if (generationEl) generationEl.textContent = '—';
      if (regionEl) regionEl.textContent = '—';
      if (formsGalleryEl) formsGalleryEl.innerHTML = '';
      renderLocations([]);
      renderFunFacts(null, null);
      renderMoves({ level: [], machine: [], egg: [] });
      renderGallery({});
      renderEffectiveness({ weak: [], resist: [], immune: [] });
    } finally {
      toggleLoading(false);
    }
  }

  function toggleLoading(isLoading) {
    form.querySelectorAll('button, input').forEach(el => {
      el.disabled = isLoading;
    });
    [prevBtn, nextBtn].forEach(btn => {
      if (btn) btn.disabled = isLoading || currentId === null;
    });
  }

  function navigate(delta) {
    if (currentId === null) return;
    const next = ((currentId - 1 + delta + MAX_ID) % MAX_ID) + 1;
    input.value = next;
    handleSearch(next);
  }

  form.addEventListener('submit', evt => {
    evt.preventDefault();
    handleSearch(input.value);
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });

  prevBtn?.addEventListener('click', () => navigate(-1));
  nextBtn?.addEventListener('click', () => navigate(1));

  randomBtn.addEventListener('click', () => {
    const id = Math.floor(Math.random() * MAX_ID) + 1;
    input.value = id;
    handleSearch(id);
  });

  favoriteBtn?.addEventListener('click', () => {
    if (currentName) toggleFavorite(currentName);
  });


  cryBtn?.addEventListener('click', () => {
    if (cryAudio) {
      cryAudio.currentTime = 0;
      cryAudio.play();
    }
  });

  // Load initial Pokémon from query param or fallback to Pikachu
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('pokemon') || 'pikachu';
  loadFavorites();
  setActiveTab('details');
  handleSearch(initial);
})();

