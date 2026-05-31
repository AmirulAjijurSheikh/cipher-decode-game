// =============================================
// CONFETTI PARTICLE SYSTEM
// Uses Canvas API + requestAnimationFrame
// =============================================
const canvas  = document.getElementById('confetti-canvas');
const ctx     = canvas.getContext('2d');
let particles = [];
let animating = false;

// Keep canvas full screen at all times
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Create 120 random colored particles
function createParticles() {
  particles = [];
  const colors = ['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#34d399','#ec4899'];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height - canvas.height,
      w:     Math.random() * 10 + 5,
      h:     Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      spin:  (Math.random() - 0.5) * 6,
      drift: (Math.random() - 0.5) * 2,
    });
  }
}

// Animation loop — runs every frame
function animateConfetti() {
  if (!animating) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.y     += p.speed;
    p.x     += p.drift;
    p.angle += p.spin;

    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate((p.angle * Math.PI) / 180);
    ctx.fillStyle   = p.color;
    ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });

  // Stop when all particles fall off screen
  if (particles.every(p => p.y > canvas.height)) {
    animating = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    requestAnimationFrame(animateConfetti);
  }
}

// Call this to trigger confetti burst
function launchConfetti() {
  createParticles();
  animating = true;
  requestAnimationFrame(animateConfetti);
}