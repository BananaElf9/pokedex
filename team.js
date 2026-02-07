(() => {
  const API_BASE = 'https://pokeapi.co/api/v2/pokemon/';
  const TEAM_KEY = 'pokedex-team';
  const MAX_TEAM = 6;

  const addInput = document.getElementById('team-add-input');
  const addBtn = document.getElementById('team-add-btn');
  const clearBtn = document.getElementById('clear-team');
  const statusEl = document.getElementById('team-status');
  const teamSlots = document.getElementById('team-slots');
  const teamCoverage = document.getElementById('team-coverage');

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

  let team = [];
  let teamDetails = [];

  function setStatus(text, tone = 'muted') {
    statusEl.textContent = text;
    statusEl.dataset.tone = tone;
  }

  function loadTeam() {
    try {
      const raw = localStorage.getItem(TEAM_KEY);
      team = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(team)) team = [];
    } catch (err) {
      team = [];
    }
  }

  function saveTeam() {
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  }

  async function fetchPokemon(query) {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) throw new Error('Type a name or ID.');
    const res = await fetch(`${API_BASE}${encodeURIComponent(normalized)}`);
    if (!res.ok) throw new Error('Pokémon not found.');
    return res.json();
  }

  function renderTeam() {
    if (!teamSlots || !teamCoverage) return;
    teamSlots.innerHTML = '';
    teamCoverage.innerHTML = '';

    for (let i = 0; i < MAX_TEAM; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'team-slot';
      const member = teamDetails[i];
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
        remove.addEventListener('click', () => removeMember(member.name));

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
    teamDetails.forEach(mon => {
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

  async function refreshTeamDetails() {
    if (!team.length) {
      teamDetails = [];
      renderTeam();
      return;
    }
    const results = await Promise.all(
      team.map(async name => {
        try {
          const data = await fetchPokemon(name);
          return {
            name: data.name,
            sprite:
              data.sprites?.other?.['official-artwork']?.front_default ||
              data.sprites?.front_default ||
              '',
            types: data.types?.map(t => t.type.name) || []
          };
        } catch (err) {
          return null;
        }
      })
    );
    teamDetails = results.filter(Boolean);
    renderTeam();
  }

  async function addMember() {
    try {
      const query = addInput.value.trim();
      if (!query) return;
      if (team.length >= MAX_TEAM) {
        setStatus('Team is full. Remove one to add another.', 'warn');
        return;
      }
      const data = await fetchPokemon(query);
      const name = data.name;
      if (team.includes(name)) {
        setStatus('That Pokémon is already on the team.', 'warn');
        return;
      }
      team.push(name);
      saveTeam();
      addInput.value = '';
      setStatus('Added to team!', 'success');
      await refreshTeamDetails();
    } catch (err) {
      setStatus(err.message || 'Could not add Pokémon.', 'error');
    }
  }

  function removeMember(name) {
    team = team.filter(n => n !== name);
    saveTeam();
    refreshTeamDetails();
  }

  addBtn?.addEventListener('click', addMember);
  addInput?.addEventListener('keydown', evt => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      addMember();
    }
  });

  clearBtn?.addEventListener('click', () => {
    team = [];
    saveTeam();
    refreshTeamDetails();
  });

  loadTeam();
  refreshTeamDetails();
})();
