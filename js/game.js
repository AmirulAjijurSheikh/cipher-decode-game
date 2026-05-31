// =============================================
// START GAME — runs when player clicks Start
// =============================================
function startGame() {
  const name = document.getElementById('player-name').value.trim();
  const age  = document.getElementById('player-age').value.trim();
  if (!name || !age) { alert('Please enter your name and age!'); return; }

  // Load saved progress if name matches
  const saved = loadProgress();
  if (saved && saved.playerName === name) {
    state.level         = saved.level;
    state.solved        = saved.solved;
    state.bestStreak    = saved.bestStreak;
    state.totalCorrect  = saved.totalCorrect;
    state.totalAttempts = saved.totalAttempts;
    state.currentRank   = saved.currentRank;
  }

  state.playerName = name;
  state.playerAge  = parseInt(age);

  document.getElementById('game-subtitle').textContent =
    `Welcome, ${name}! Decode the cipher below.`;
  showScreen('game-screen');
  loadNewPuzzle();
}

// =============================================
// LOAD NEW PUZZLE
// =============================================
async function loadNewPuzzle() {
  if (state.sessionPuzzles >= 10) { showGameOver(); return; }

  const diff = getDifficulty();
  resetPuzzleState();
  applyTheme(diff.theme);

  document.getElementById('cipher-area').innerHTML =
    '<span class="loading-text">Generating your cipher...</span>';
  document.getElementById('difficulty-badge').textContent = diff.label;
  document.getElementById('level-display').textContent    = state.level;
  document.getElementById('solved-display').textContent   = state.solved;

  const rankInfo = getRankInfo();
  document.getElementById('rank-display').textContent =
    rankInfo.emoji + ' ' + rankInfo.title;

  updateStats();
  updateProgress();

  const sentence = await generateSentence(diff.wordCount);
  state.currentSentence = sentence;
  displayCipher(sentence, diff);
}

// =============================================
// GENERATE SENTENCE — calls Claude AI API
// =============================================
async function generateSentence(wordCount) {
  const historyText = usedSentences.length > 0
    ? `Previously used (do NOT repeat): ${usedSentences.slice(-5).join(' | ')}` : '';

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Generate ONE simple English sentence of ${wordCount} words.
                      Player name: ${state.playerName}, age: ${state.playerAge}.
                      Rules:
                      - Do NOT start with the player name "${state.playerName}".
                      - Topic: animals, science, food, travel, sports, nature, history.
                      - Every attempt must use a completely different topic and structure.
                      - Return the sentence ONLY. No quotes. No explanation.
                      ${historyText}
                      Attempt number: ${attempt + 1}.`
          }]
        })
      });
      const data = await response.json();
      const sentence = data.content[0].text.trim();
      if (!isTooSimilar(sentence)) {
        usedSentences.push(sentence);
        if (usedSentences.length > 15) usedSentences.shift();
        return sentence;
      }
    } catch(err) { break; }
  }

  const fallback = getFallbackSentence();
  usedSentences.push(fallback);
  return fallback;
}

// =============================================
// DISPLAY CIPHER — transforms each letter
// =============================================
function displayCipher(sentence, diff) {
  const area = document.getElementById('cipher-area');
  area.innerHTML = '';

  sentence.split(' ').forEach((word, wordIndex) => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'cipher-word';
    wordDiv.dataset.wordIndex = wordIndex;

    for (let i = 0; i < word.length; i++) {
      const span = document.createElement('span');
      span.className = 'cipher-letter';
      span.dataset.original = word[i];

      const availableTransforms = diff.angles;
      const ri = Math.floor(Math.random() * availableTransforms.length);
      const transform = typeof availableTransforms[ri] === 'string'
        ? availableTransforms[ri] : transforms[availableTransforms[ri]];

      span.style.transform = transform;
      span.textContent = word[i];
      wordDiv.appendChild(span);
    }
    area.appendChild(wordDiv);
  });
}

// =============================================
// USE HINT — reveals one random word
// =============================================
function useHint() {
  if (state.hintUsed) return;
  const words = state.currentSentence.split(' ');
  const available = words.map((w, i) => i).filter(i => !state.hintedWords.includes(i));
  if (available.length === 0) return;

  const wordIndex = available[Math.floor(Math.random() * available.length)];
  state.hintedWords.push(wordIndex);
  state.hintUsed = true;

  const hintBox = document.getElementById('hint-box');
  hintBox.textContent = `💡 Hint: Word ${wordIndex + 1} is "${words[wordIndex]}"`;
  hintBox.className = 'hint-box visible';

  const wordDivs = document.querySelectorAll('.cipher-word');
  if (wordDivs[wordIndex]) {
    wordDivs[wordIndex].querySelectorAll('.cipher-letter').forEach(l => l.classList.add('hinted'));
  }
  document.getElementById('hint-btn').disabled = true;
}

// =============================================
// SKIP PUZZLE
// =============================================
function skipPuzzle() {
  state.streak = 0;
  state.sessionPuzzles++;
  updateStats();
  updateProgress();
  playSound('wrong');

  const feedback = document.getElementById('feedback');
  feedback.textContent = `⏭ Skipped! The answer was: "${state.currentSentence}"`;
  feedback.className = 'feedback reveal';

  document.getElementById('submit-btn').disabled = true;
  document.getElementById('hint-btn').disabled   = true;
  document.getElementById('skip-btn').disabled   = true;

  setTimeout(() => loadNewPuzzle(), 2500);
}

// =============================================
// CHECK ANSWER
// =============================================
function checkAnswer() {
  const input    = document.getElementById('answer-input').value;
  const feedback = document.getElementById('feedback');
  const area     = document.getElementById('cipher-area');

  const normalize     = str => str.toLowerCase().trim();
  const playerAnswer  = normalize(input);
  const correctAnswer = normalize(state.currentSentence);

  state.totalAttempts++;

  if (playerAnswer === correctAnswer) {
    state.totalCorrect++;
    state.solved++;
    state.level++;
    state.streak++;
    state.sessionPuzzles++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    playSound('correct');
    launchConfetti();

    feedback.textContent = '✅ Correct! Well decoded!';
    feedback.className   = 'feedback correct';
    area.classList.add('glow-correct');
    updateStats();
    updateProgress();
    saveProgress();

    const newRankInfo = getRankInfo();
    if (newRankInfo.title !== state.currentRank) {
      state.currentRank = newRankInfo.title;
      applyTheme(newRankInfo.theme);
      setTimeout(() => showLevelUp(newRankInfo), 800);
    } else {
      setTimeout(() => loadNewPuzzle(), 1800);
    }

  } else {
    state.wrongAttempts++;
    state.streak = 0;
    playSound('wrong');

    area.classList.remove('shake');
    void area.offsetWidth;
    area.classList.add('shake');

    const dot = document.getElementById(`dot-${state.wrongAttempts}`);
    if (dot) dot.className = 'dot wrong';
    updateStats();

    if (state.wrongAttempts >= 3) {
      state.sessionPuzzles++;
      updateProgress();
      feedback.textContent = `❌ The answer was: "${state.currentSentence}"`;
      feedback.className   = 'feedback reveal';
      document.getElementById('submit-btn').disabled   = true;
      document.getElementById('hint-btn').disabled     = true;
      document.getElementById('answer-input').disabled = true;
      setTimeout(() => loadNewPuzzle(), 3000);
    } else {
      feedback.textContent = `❌ Not quite! ${3 - state.wrongAttempts} attempt(s) remaining.`;
      feedback.className   = 'feedback wrong';
    }
  }
}

// Allow Enter key to submit
function checkEnter(event) {
  if (event.key === 'Enter') checkAnswer();
}