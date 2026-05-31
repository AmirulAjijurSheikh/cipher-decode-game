// =============================================
// SHOW SCREEN — switches between screens
// =============================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// =============================================
// UPDATE STATS DISPLAY
// =============================================
function updateStats() {
  const accuracy = state.totalAttempts === 0
    ? '--' : Math.round((state.totalCorrect / state.totalAttempts) * 100) + '%';
  document.getElementById('stat-accuracy').textContent = accuracy;
  document.getElementById('stat-streak').textContent   = state.streak + '🔥';
  document.getElementById('stat-best').textContent     = state.bestStreak;
}

// =============================================
// UPDATE PROGRESS BAR
// =============================================
function updateProgress() {
  const pct = Math.min((state.sessionPuzzles / 10) * 100, 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = state.sessionPuzzles + ' / 10';
}

// =============================================
// RESET PUZZLE STATE
// Called at the start of every new puzzle
// =============================================
function resetPuzzleState() {
  state.wrongAttempts = 0;
  state.hintUsed      = false;
  state.hintedWords   = [];

  ['dot-1','dot-2','dot-3'].forEach(id => document.getElementById(id).className = 'dot');

  document.getElementById('submit-btn').disabled   = false;
  document.getElementById('hint-btn').disabled     = false;
  document.getElementById('skip-btn').disabled     = false;
  document.getElementById('answer-input').disabled = false;
  document.getElementById('answer-input').value    = '';
  document.getElementById('hint-box').className    = 'hint-box';
  document.getElementById('hint-box').textContent  = '💡 Hint:';
  document.getElementById('cipher-area').className = 'cipher-area';
  document.getElementById('feedback').textContent  = '';
}

// =============================================
// LOCALSTORAGE — save and load progress
// =============================================
function saveProgress() {
  localStorage.setItem('cipherGameSave', JSON.stringify({
    playerName:    state.playerName,
    playerAge:     state.playerAge,
    level:         state.level,
    solved:        state.solved,
    bestStreak:    state.bestStreak,
    totalCorrect:  state.totalCorrect,
    totalAttempts: state.totalAttempts,
    currentRank:   state.currentRank,
  }));
}

function loadProgress() {
  const saved = localStorage.getItem('cipherGameSave');
  if (!saved) return null;
  try { return JSON.parse(saved); } catch(e) { return null; }
}

function clearSavedData() {
  localStorage.removeItem('cipherGameSave');
  document.getElementById('returning-banner').style.display = 'none';
  document.getElementById('player-name').value = '';
  document.getElementById('player-age').value  = '';
}

// =============================================
// LEVEL UP OVERLAY
// =============================================
function showLevelUp(rankInfo) {
  playSound('levelup');
  launchConfetti();
  const accuracy = state.totalAttempts === 0 ? '0%'
    : Math.round((state.totalCorrect / state.totalAttempts) * 100) + '%';

  document.getElementById('levelup-emoji').textContent    = rankInfo.emoji;
  document.getElementById('levelup-title').textContent    = 'Rank Up! ' + rankInfo.emoji;
  document.getElementById('levelup-subtitle').textContent = `You are now a ${rankInfo.title}!`;
  document.getElementById('lu-solved').textContent        = state.solved;
  document.getElementById('lu-accuracy').textContent      = accuracy;
  document.getElementById('lu-streak').textContent        = state.bestStreak;
  document.getElementById('levelup-overlay').classList.add('active');
}

function closeLevelUp() {
  document.getElementById('levelup-overlay').classList.remove('active');
  loadNewPuzzle();
}

// =============================================
// GAME OVER OVERLAY
// =============================================
function showGameOver() {
  playSound('levelup');
  launchConfetti();
  const rankInfo = getRankInfo();
  const accuracy = state.totalAttempts === 0 ? '0%'
    : Math.round((state.totalCorrect / state.totalAttempts) * 100) + '%';

  document.getElementById('go-solved').textContent   = state.solved;
  document.getElementById('go-accuracy').textContent = accuracy;
  document.getElementById('go-streak').textContent   = state.bestStreak;
  document.getElementById('go-rank').textContent     = rankInfo.emoji;
  document.getElementById('gameover-subtitle').textContent =
    `Great job, ${state.playerName}! Here's your session summary.`;

  document.getElementById('share-box').textContent =
    `🔐 Cipher Decode Game\n` +
    `👤 Player: ${state.playerName}\n` +
    `🏆 Rank: ${rankInfo.emoji} ${rankInfo.title}\n` +
    `✅ Solved: ${state.solved}/10\n` +
    `🎯 Accuracy: ${accuracy}\n` +
    `🔥 Best Streak: ${state.bestStreak}\n` +
    `🎮 Try it yourself!`;

  document.getElementById('gameover-overlay').classList.add('active');
  saveProgress();
}

// =============================================
// COPY SCORE TO CLIPBOARD
// =============================================
function copyScore() {
  const text = document.getElementById('share-box').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy Score'; }, 2000);
  }).catch(() => alert('Please copy the text manually!'));
}

// =============================================
// PLAY AGAIN
// =============================================
function playAgain() {
  state.sessionPuzzles = 0;
  state.streak         = 0;
  document.getElementById('gameover-overlay').classList.remove('active');
  loadNewPuzzle();
}

// =============================================
// CHECK FOR RETURNING PLAYER on page load
// =============================================
window.addEventListener('load', () => {
  applyTheme('rookie');
  const saved = loadProgress();
  if (saved) {
    document.getElementById('player-name').value = saved.playerName;
    document.getElementById('player-age').value  = saved.playerAge;
    const accuracy = saved.totalAttempts > 0
      ? Math.round((saved.totalCorrect / saved.totalAttempts) * 100) + '%' : '--';
    document.getElementById('returning-welcome').textContent = `Welcome back, ${saved.playerName}!`;
    document.getElementById('returning-stats').textContent   =
      `Level ${saved.level} • ${saved.solved} solved • ${accuracy} accuracy`;
    document.getElementById('returning-banner').style.display = 'flex';
    document.getElementById('welcome-rank').textContent = saved.currentRank;
  }
});