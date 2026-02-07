(() => {
  const API_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=2000';

  const quizImage = document.getElementById('quiz-image');
  const quizInput = document.getElementById('quiz-input');
  const quizCheckBtn = document.getElementById('quiz-check');
  const quizRevealBtn = document.getElementById('quiz-reveal');
  const quizNextBtn = document.getElementById('quiz-next');
  const quizStatus = document.getElementById('quiz-status');

  let list = [];
  let quizAnswer = null;
  let quizAccepted = new Set();

  function normalizeGuess(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function cleanName(text) {
    return String(text || '').replace(/-/g, ' ').trim();
  }

  function formatPokemonName(name) {
    const raw = String(name || '');
    if (!raw) return '';
    const megaMatch = raw.match(/^(.*)-mega(?:-([xy]))?$/i);
    if (megaMatch) {
      const base = cleanName(megaMatch[1]);
      const suffix = megaMatch[2] ? ` ${megaMatch[2].toUpperCase()}` : '';
      return `Mega ${base}${suffix}`.trim();
    }
    const gmaxMatch = raw.match(/^(.*)-gmax$/i);
    if (gmaxMatch) {
      const base = cleanName(gmaxMatch[1]);
      return `Gigantamax ${base}`.trim();
    }
    const regionalMatch = raw.match(/^(.*)-(alola|galar|hisui|paldea)$/i);
    if (regionalMatch) {
      const base = cleanName(regionalMatch[1]);
      const regionMap = {
        alola: 'Alolan',
        galar: 'Galarian',
        hisui: 'Hisuian',
        paldea: 'Paldean'
      };
      const regionLabel = regionMap[regionalMatch[2].toLowerCase()] || regionalMatch[2];
      return `${regionLabel} ${base}`.trim();
    }
    return cleanName(raw)
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function buildAcceptedAnswers(name) {
    const raw = String(name || '');
    if (!raw) return new Set();
    const answers = new Set();
    const add = value => {
      if (!value) return;
      answers.add(normalizeGuess(value));
    };

    add(raw);
    add(cleanName(raw));
    add(formatPokemonName(raw));

    const megaMatch = raw.match(/^(.*)-mega(?:-([xy]))?$/i);
    if (megaMatch) {
      const base = cleanName(megaMatch[1]);
      const suffix = megaMatch[2] ? ` ${megaMatch[2].toUpperCase()}` : '';
      add(`mega ${base}${suffix}`);
      add(`${base} mega${suffix}`);
    }

    const gmaxMatch = raw.match(/^(.*)-gmax$/i);
    if (gmaxMatch) {
      const base = cleanName(gmaxMatch[1]);
      add(`gigantamax ${base}`);
      add(`gmax ${base}`);
      add(`${base} gigantamax`);
      add(`${base} gmax`);
    }

    const regionalMatch = raw.match(/^(.*)-(alola|galar|hisui|paldea)$/i);
    if (regionalMatch) {
      const base = cleanName(regionalMatch[1]);
      const regionMap = {
        alola: 'alolan',
        galar: 'galarian',
        hisui: 'hisuian',
        paldea: 'paldean'
      };
      const regionLabel = regionMap[regionalMatch[2].toLowerCase()] || regionalMatch[2];
      add(`${regionLabel} ${base}`);
      add(`${base} ${regionLabel}`);
    }

    return answers;
  }

  function setStatus(text) {
    if (quizStatus) quizStatus.textContent = text;
  }

  async function fetchList() {
    const res = await fetch(API_LIST);
    if (!res.ok) throw new Error('Failed to load Pokémon list.');
    const data = await res.json();
    return data.results || [];
  }

  async function fetchPokemon(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load Pokémon.');
    return res.json();
  }

  async function startQuiz() {
    if (!list.length) {
      try {
        list = await fetchList();
      } catch (err) {
        setStatus('Could not load list.');
        return;
      }
    }
    const pick = list[Math.floor(Math.random() * list.length)];
    if (!pick?.url) return;
    try {
      const data = await fetchPokemon(pick.url);
      quizAnswer = data.name;
      quizAccepted = buildAcceptedAnswers(quizAnswer);
      const sprite =
        data.sprites?.other?.['official-artwork']?.front_default ||
        data.sprites?.front_default ||
        '';
      quizImage.src = sprite;
      quizImage.alt = 'Quiz silhouette';
      quizImage.classList.add('quiz__image--hidden');
      quizInput.value = '';
      setStatus('Who is this Pokémon?');
    } catch (err) {
      setStatus('Could not load a Pokémon.');
    }
  }

  function revealQuizAnswer() {
    if (!quizAnswer) return;
    quizImage.classList.remove('quiz__image--hidden');
    setStatus(`It was ${formatPokemonName(quizAnswer)}!`);
  }

  function checkQuizAnswer() {
    if (!quizAnswer) return;
    const guess = normalizeGuess(quizInput.value);
    const accepted = quizAccepted.size ? quizAccepted : buildAcceptedAnswers(quizAnswer);
    if (!guess) {
      setStatus('Type a name to guess!');
      return;
    }
    if (accepted.has(guess)) {
      quizImage.classList.remove('quiz__image--hidden');
      setStatus('Correct! Nice job.');
    } else {
      setStatus('Not quite. Try again or press Reveal!');
    }
  }

  quizCheckBtn?.addEventListener('click', checkQuizAnswer);
  quizRevealBtn?.addEventListener('click', revealQuizAnswer);
  quizNextBtn?.addEventListener('click', () => startQuiz());
  quizInput?.addEventListener('keydown', evt => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      checkQuizAnswer();
    }
  });

  startQuiz();
})();
