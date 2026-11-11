/**
 * LUCKY SPIN 🎡 – Secret Winner Spinner
 * Vanilla JavaScript Implementation
 * 
 * Features:
 * - Fluid responsive wheel engine for Mobile, Tablet & Desktop.
 * - Hardware-accelerated High-DPI canvas with ResizeObserver.
 * - Secret winner stored in JS temporary memory ONLY (never exposed or saved).
 * - Automatic clearing of secret winner when list or checkboxes change.
 * - Exact mathematical stopping calculation at 12 o'clock fixed pointer.
 * - Deceleration physics with realistic tick clicks and flapper deflection.
 * - Mobile Web Audio unlock on touchstart/pointerdown.
 * - Fullscreen physics-based confetti fireworks & celebration modal.
 */

(() => {
  'use strict';

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  let participants = []; // { id: string, name: string, checked: boolean }
  let secretWinnerId = null; // ONLY in temporary JS memory!
  let currentAngleDeg = 0; // Cumulative rotation angle in degrees
  let isSpinning = false;
  let winningIndex = null; // Highlighted segment after stopping
  let soundEnabled = true;
  let lastTickSegment = -1;

  // Color Palette (Purple, Pink, Blue, Yellow vibrant harmonies)
  const SEGMENT_COLORS = [
    { bg: '#8b5cf6', text: '#ffffff', glow: 'rgba(139, 92, 246, 0.6)' }, // Purple
    { bg: '#ec4899', text: '#ffffff', glow: 'rgba(236, 72, 153, 0.6)' }, // Pink
    { bg: '#3b82f6', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.6)' },  // Blue
    { bg: '#fbbf24', text: '#1e293b', glow: 'rgba(251, 191, 36, 0.6)' }, // Yellow
    { bg: '#06b6d4', text: '#ffffff', glow: 'rgba(6, 182, 212, 0.6)' },  // Cyan
    { bg: '#a855f7', text: '#ffffff', glow: 'rgba(168, 85, 247, 0.6)' }, // Violet
    { bg: '#f43f5e', text: '#ffffff', glow: 'rgba(244, 63, 94, 0.6)' },  // Rose
    { bg: '#10b981', text: '#ffffff', glow: 'rgba(16, 185, 129, 0.6)' }  // Emerald
  ];

  // DOM Elements
  const canvas = document.getElementById('wheelCanvas');
  const canvasContainer = document.getElementById('canvasContainer');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spinBtn');
  const spinHint = document.getElementById('spinHint');
  const pointerNeedle = document.getElementById('pointerNeedle');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  
  const nameInput = document.getElementById('nameInput');
  const addNameBtn = document.getElementById('addNameBtn');
  const addNameForm = document.getElementById('addNameForm');
  const loadDemoBtn = document.getElementById('loadDemoBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const participantsList = document.getElementById('participantsList');
  const emptyState = document.getElementById('emptyState');
  const participantCountBadge = document.getElementById('participantCountBadge');
  const wheelCountBadge = document.getElementById('wheelCountBadge');
  const mobileCount = document.getElementById('mobileCount');
  const mobileTabs = document.querySelectorAll('.mobile-nav-tab');

  const secretSelect = document.getElementById('secretSelect');
  const clearSecretBtn = document.getElementById('clearSecretBtn');
  const secretStatusBadge = document.getElementById('secretStatusBadge');
  const stealthShield = document.getElementById('stealthShield');

  const winnerModal = document.getElementById('winnerModal');
  const winnerNameDisplay = document.getElementById('winnerNameDisplay');
  const modalSpinAgainBtn = document.getElementById('modalSpinAgainBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');

  // ==========================================================================
  // WEB AUDIO API (Synthesized Realistic Clicks & Fanfare Chimes)
  // Zero external MP3/WAV dependencies!
  // ==========================================================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Mobile audio unlock on first touch
  const unlockMobileAudio = () => {
    initAudioContext();
    window.removeEventListener('touchstart', unlockMobileAudio);
    window.removeEventListener('pointerdown', unlockMobileAudio);
  };
  window.addEventListener('touchstart', unlockMobileAudio, { passive: true });
  window.addEventListener('pointerdown', unlockMobileAudio, { passive: true });

  function playTickSound() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      // Short crisp click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, audioCtx.currentTime + 0.025);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {
      // Audio error ignored
    }
  }

  function playCelebrationFanfare() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
      // Majestic 4-note victory chord: C5, E5, G5, C6
      const victoryNotes = [523.25, 659.25, 783.99, 1046.50];
      victoryNotes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = audioCtx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.24, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.9);
      });
    } catch (e) {}
  }

  // ==========================================================================
  // HIGH-DPI CANVAS SETUP & RESIZING
  // ==========================================================================
  function setupHiDPICanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    const size = rect.width || 500;
    
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform matrix to avoid compounding
    ctx.scale(dpr, dpr);
  }

  // ==========================================================================
  // WHEEL RENDERING ENGINE
  // ==========================================================================
  function getActiveParticipants() {
    return participants.filter(p => p.checked);
  }

  function drawWheel(angleDeg = currentAngleDeg) {
    const rect = canvas.getBoundingClientRect();
    const size = rect.width || 500;
    const center = size / 2;
    const radius = center - Math.max(8, size * 0.024); // dynamic outer margin
    const active = getActiveParticipants();
    const N = active.length;

    ctx.clearRect(0, 0, size, size);

    if (N === 0) {
      drawEmptyWheel(center, radius, size);
      return;
    }

    const segmentAngleRad = (2 * Math.PI) / N;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Outer Rim Glow & Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + Math.max(4, size * 0.015), 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = Math.max(3, size * 0.012);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();
    ctx.restore();

    // Draw Individual Segments
    for (let i = 0; i < N; i++) {
      const startAngle = angleRad + i * segmentAngleRad;
      const endAngle = startAngle + segmentAngleRad;
      const colorScheme = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      // Winning segment highlight
      if (winningIndex !== null && winningIndex === i) {
        ctx.fillStyle = '#f59e0b'; // Golden flash
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = Math.round(size * 0.05);
      } else {
        ctx.fillStyle = colorScheme.bg;
      }
      ctx.fill();

      // Segment Border
      ctx.lineWidth = Math.max(1.5, size * 0.005);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();
      ctx.restore();

      // Render Participant Name text radially
      ctx.save();
      ctx.translate(center, center);
      const midAngle = startAngle + segmentAngleRad / 2;
      ctx.rotate(midAngle);

      // Text typography
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const fontSize = getAdaptiveFontSize(N, size);
      ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
      ctx.fillStyle = (winningIndex !== null && winningIndex === i) ? '#0f172a' : colorScheme.text;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Text truncation if long
      const maxTextWidth = Math.max(30, radius * 0.54);
      const truncatedName = fitText(ctx, active[i].name, maxTextWidth);
      ctx.fillText(truncatedName, radius - Math.max(14, size * 0.045), 0);

      ctx.restore();
    }

    // Outer Rim Metallic Pegs / Pins (Rivets)
    const pinCount = Math.max(N * 2, 16);
    const pinRadius = Math.max(2, size * 0.007);
    for (let p = 0; p < pinCount; p++) {
      const pinAngle = (p * 2 * Math.PI) / pinCount;
      const px = center + (radius + Math.max(1, size * 0.005)) * Math.cos(pinAngle);
      const py = center + (radius + Math.max(1, size * 0.005)) * Math.sin(pinAngle);

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pinRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      ctx.restore();
    }
  }

  function getAdaptiveFontSize(numSegments, wheelSize) {
    const scale = wheelSize / 520;
    if (numSegments <= 3) return Math.max(14, Math.round(23 * scale));
    if (numSegments <= 6) return Math.max(12, Math.round(19 * scale));
    if (numSegments <= 10) return Math.max(11, Math.round(16 * scale));
    if (numSegments <= 16) return Math.max(9, Math.round(13 * scale));
    return Math.max(8, Math.round(11 * scale));
  }

  function fitText(context, text, maxWidth) {
    if (context.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 2 && context.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
  }

  function drawEmptyWheel(center, radius, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.max(12, Math.round(15 * (size / 520)))}px Outfit, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Add participants to begin', center, center);
    ctx.restore();
  }

  // ==========================================================================
  // PARTICIPANT MANAGEMENT
  // ==========================================================================
  function generateId() {
    return 'p_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  function addParticipant(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    participants.push({
      id: generateId(),
      name: trimmed,
      checked: true
    });

    // Per Requirement 7: Clear secret selection when participant list changes
    clearSecretWinner();

    winningIndex = null;
    renderParticipants();
    drawWheel();
    updateSpinButtonState();
  }

  function toggleParticipant(id) {
    const p = participants.find(item => item.id === id);
    if (p) {
      p.checked = !p.checked;
      // Per Requirement 7: Clear secret selection when participant list changes
      clearSecretWinner();
      winningIndex = null;
      renderParticipants();
      drawWheel();
      updateSpinButtonState();
    }
  }

  function removeParticipant(id) {
    participants = participants.filter(p => p.id !== id);
    // Per Requirement 7: Clear secret selection when participant list changes
    clearSecretWinner();
    winningIndex = null;
    renderParticipants();
    drawWheel();
    updateSpinButtonState();
  }

  function clearAllParticipants() {
    if (participants.length === 0) return;
    participants = [];
    clearSecretWinner();
    winningIndex = null;
    renderParticipants();
    drawWheel();
    updateSpinButtonState();
  }

  function loadDemoParticipants() {
    // 5 standard demo participants matching specification
    const sampleNames = ['Vijay', 'Raja', 'Srujan', 'Kiran', 'Rahul'];
    participants = sampleNames.map(name => ({
      id: generateId(),
      name,
      checked: true
    }));

    clearSecretWinner();
    winningIndex = null;
    renderParticipants();
    drawWheel();
    updateSpinButtonState();
  }

  function renderParticipants() {
    participantsList.innerHTML = '';
    const total = participants.length;
    const active = getActiveParticipants().length;

    participantCountBadge.textContent = `${total} Total`;
    wheelCountBadge.textContent = `${active} on wheel`;
    if (mobileCount) mobileCount.textContent = total;

    if (total === 0) {
      emptyState.style.display = 'block';
      participantsList.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      participantsList.style.display = 'flex';

      participants.forEach((p) => {
        const item = document.createElement('div');
        item.className = `participant-item ${p.checked ? '' : 'unchecked'}`;
        
        // Critical Privacy Requirement:
        // Do NOT visually highlight or mark the secret winner in this list!
        // All participants render identically with standard checkboxes.

        item.innerHTML = `
          <div class="item-left">
            <label class="custom-checkbox">
              <input type="checkbox" ${p.checked ? 'checked' : ''} data-id="${p.id}" aria-label="Include ${escapeHtml(p.name)} in wheel">
              <span class="checkmark"></span>
            </label>
            <span class="item-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
          </div>
          <button type="button" class="item-delete-btn" data-delete-id="${p.id}" title="Remove ${escapeHtml(p.name)}" aria-label="Remove">
            ✕
          </button>
        `;

        participantsList.appendChild(item);
      });
    }

    renderSecretSelector();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // SECRET WINNER SELECTION (CORE PRIVACY FEATURE)
  // ==========================================================================
  function clearSecretWinner() {
    secretWinnerId = null;
    secretStatusBadge.textContent = 'Fair / Random';
    secretStatusBadge.classList.remove('armed');
    stealthShield.style.display = 'none';
    clearSecretBtn.style.display = 'none';
    renderSecretSelector();
  }

  function setSecretWinner(id) {
    const active = getActiveParticipants();
    const candidate = active.find(p => p.id === id);

    if (candidate) {
      secretWinnerId = candidate.id;
      // Requirement 4 & 7: Keep secret selection strictly hidden from screen onlookers!
      // We update the status to "Armed 🔒" without printing the chosen participant's name.
      secretStatusBadge.textContent = 'Armed 🔒';
      secretStatusBadge.classList.add('armed');
      stealthShield.style.display = 'flex';
      clearSecretBtn.style.display = 'inline-block';
      
      // Mask the select element so viewing the dropdown shows locked placeholder
      secretSelect.value = '';
    } else {
      clearSecretWinner();
    }
  }

  function renderSecretSelector() {
    const active = getActiveParticipants();
    secretSelect.innerHTML = '<option value="">None (Fair Random Spin 🎲)</option>';

    active.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      secretSelect.appendChild(opt);
    });

    if (secretWinnerId) {
      // If still valid among active
      const exists = active.some(p => p.id === secretWinnerId);
      if (!exists) {
        clearSecretWinner();
      }
    }
  }

  // ==========================================================================
  // SPIN ENGINE & REALISTIC DECELERATION ANIMATION
  // Pointer is at Top (12 o'clock, 270 degrees in canvas space)
  // ==========================================================================
  function updateSpinButtonState() {
    const active = getActiveParticipants();
    if (active.length < 2) {
      spinBtn.disabled = true;
      spinHint.textContent = 'Add and check at least 2 participants to spin';
    } else if (isSpinning) {
      spinBtn.disabled = true;
      spinHint.textContent = 'Spinning in progress...';
    } else {
      spinBtn.disabled = false;
      spinHint.textContent = 'Tap to spin the wheel!';
    }
  }

  function spinWheel() {
    const active = getActiveParticipants();
    if (active.length < 2 || isSpinning) return;

    // On mobile screens, smoothly scroll to wheel if out of view
    const wheelSection = document.getElementById('wheelSection');
    if (window.innerWidth <= 900 && wheelSection) {
      const rect = wheelSection.getBoundingClientRect();
      if (rect.top < -50 || rect.bottom > window.innerHeight + 100) {
        wheelSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    isSpinning = true;
    winningIndex = null;
    updateSpinButtonState();
    initAudioContext();

    // 1. Determine Target Winner Index
    let targetIndex = -1;
    if (secretWinnerId) {
      targetIndex = active.findIndex(p => p.id === secretWinnerId);
    }
    // Fallback if no secret winner or not found in active
    if (targetIndex === -1) {
      targetIndex = Math.floor(Math.random() * active.length);
    }

    const winnerParticipant = active[targetIndex];
    const N = active.length;
    const segmentAngleDeg = 360 / N;

    // 2. Exact Rotation Calculation
    // Pointer is at 12 o'clock (270° in canvas 0° = 3 o'clock system).
    // Segment `i` mid-point in local coordinates:
    // midAngle(i) = (i + 0.5) * segmentAngleDeg
    // When wheel is rotated by total angle Φ:
    // (midAngle(targetIndex) + Φ) ≡ 270° (mod 360°)
    // Φ_base = (270° - (targetIndex + 0.5) * segmentAngleDeg) mod 360°
    const winnerMidAngleDeg = (targetIndex + 0.5) * segmentAngleDeg;
    let targetAngleBase = (270 - winnerMidAngleDeg) % 360;
    if (targetAngleBase < 0) targetAngleBase += 360;

    // Normalise current angle
    const currentNorm = ((currentAngleDeg % 360) + 360) % 360;
    let diff = (targetAngleBase - currentNorm) % 360;
    if (diff <= 0) diff += 360;

    // Full extra spins for suspense (6 to 8 full revolutions)
    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const totalDeltaDeg = fullSpins * 360 + diff;
    const startAngleDeg = currentAngleDeg;
    const targetEndAngleDeg = startAngleDeg + totalDeltaDeg;

    // 3. Animation Timing & Deceleration
    const durationMs = 5400; // 5.4 seconds realistic spin
    const startTime = performance.now();
    lastTickSegment = -1;

    // Quartic ease out for realistic deceleration
    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutQuart(progress);

      const currentSpinAngle = startAngleDeg + totalDeltaDeg * easedProgress;
      currentAngleDeg = currentSpinAngle;
      drawWheel(currentAngleDeg);

      // 4. Tick detection & Pointer Flapper Deflection
      // Determine which segment is currently directly under 12 o'clock pointer (270°)
      const pointerWheelSpace = (270 - ((currentSpinAngle % 360) + 360) % 360 + 360) % 360;
      const currentSegment = Math.floor(pointerWheelSpace / segmentAngleDeg);

      if (currentSegment !== lastTickSegment && lastTickSegment !== -1) {
        playTickSound();
        triggerPointerDeflection();
      }
      lastTickSegment = currentSegment;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished!
        currentAngleDeg = targetEndAngleDeg;
        winningIndex = targetIndex;
        drawWheel(currentAngleDeg);
        
        // Finalize
        onSpinComplete(winnerParticipant);
      }
    }

    requestAnimationFrame(animate);
  }

  function triggerPointerDeflection() {
    pointerNeedle.classList.add('pointer-deflect');
    setTimeout(() => {
      pointerNeedle.classList.remove('pointer-deflect');
    }, 70);
  }

  function onSpinComplete(winner) {
    isSpinning = false;
    updateSpinButtonState();

    // Fanfare Sound
    playCelebrationFanfare();

    // Confetti Fireworks
    launchConfetti();

    // Display Winner Modal
    winnerNameDisplay.textContent = winner.name;
    winnerModal.classList.add('open');
  }

  // ==========================================================================
  // CONFETTI BURST ENGINE
  // High performance Canvas Confetti with physics & gravity
  // ==========================================================================
  let confettiParticles = [];
  let confettiAnimationId = null;

  function launchConfetti() {
    const cWidth = (confettiCanvas.width = window.innerWidth);
    const cHeight = (confettiCanvas.height = window.innerHeight);
    const cCtx = confettiCanvas.getContext('2d');

    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#fbbf24', '#06b6d4', '#f43f5e', '#ffffff'];
    confettiParticles = [];

    // Spawn 140 particles from both sides and center
    const count = window.innerWidth < 600 ? 90 : 150;
    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: cWidth * 0.5 + (Math.random() - 0.5) * (cWidth * 0.4),
        y: cHeight * 0.42,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 4,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    let confettiStart = performance.now();
    cancelAnimationFrame(confettiAnimationId);

    function renderConfetti(now) {
      const elapsed = now - confettiStart;
      cCtx.clearRect(0, 0, cWidth, cHeight);

      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.vx *= 0.985; // air drag
        p.rotation += p.rotationSpeed;

        if (elapsed > 2400) {
          p.opacity -= 0.016;
        }

        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate((p.rotation * Math.PI) / 180);
        cCtx.globalAlpha = Math.max(0, p.opacity);
        cCtx.fillStyle = p.color;

        if (p.shape === 'rect') {
          cCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          cCtx.beginPath();
          cCtx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          cCtx.fill();
        }
        cCtx.restore();
      });

      confettiParticles = confettiParticles.filter(p => p.y < cHeight + 20 && p.opacity > 0);

      if (confettiParticles.length > 0 && elapsed < 5200) {
        confettiAnimationId = requestAnimationFrame(renderConfetti);
      } else {
        cCtx.clearRect(0, 0, cWidth, cHeight);
      }
    }

    confettiAnimationId = requestAnimationFrame(renderConfetti);
  }

  // ==========================================================================
  // EVENT LISTENERS & SETUP
  // ==========================================================================
  function setupEventListeners() {
    // Add Name form
    addNameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addParticipant(nameInput.value);
      nameInput.value = '';
      nameInput.focus();
    });

    addNameBtn.addEventListener('click', () => {
      addParticipant(nameInput.value);
      nameInput.value = '';
      nameInput.focus();
    });

    // Load Demo Presets
    loadDemoBtn.addEventListener('click', () => {
      loadDemoParticipants();
    });

    // Clear All
    clearAllBtn.addEventListener('click', () => {
      clearAllParticipants();
    });

    // Delegate Checkbox & Delete inside Participants List
    participantsList.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-delete-id]');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-delete-id');
        removeParticipant(id);
        return;
      }

      const checkbox = e.target.closest('input[type="checkbox"]');
      if (checkbox) {
        const id = checkbox.getAttribute('data-id');
        toggleParticipant(id);
      }
    });

    // Secret Winner Selector
    secretSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        setSecretWinner(val);
      } else {
        clearSecretWinner();
      }
    });

    clearSecretBtn.addEventListener('click', () => {
      clearSecretWinner();
    });

    // Spin Button
    spinBtn.addEventListener('click', () => {
      spinWheel();
    });

    // Sound Toggle
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
      soundToggleBtn.querySelector('.btn-text').textContent = soundEnabled ? 'Sound: ON' : 'Sound: OFF';
      if (soundEnabled) initAudioContext();
    });

    // Modal buttons
    modalSpinAgainBtn.addEventListener('click', () => {
      winnerModal.classList.remove('open');
      // The wheel remains in its exact stopping place, ready for the next spin!
    });

    modalCloseBtn.addEventListener('click', () => {
      winnerModal.classList.remove('open');
    });

    winnerModal.addEventListener('click', (e) => {
      if (e.target === winnerModal) {
        winnerModal.classList.remove('open');
      }
    });

    // Mobile Navigation Segmented Tabs
    mobileTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        mobileTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Responsive Canvas Resizing with ResizeObserver
    if (window.ResizeObserver && canvasContainer) {
      const ro = new ResizeObserver(() => {
        setupHiDPICanvas();
        drawWheel();
      });
      ro.observe(canvasContainer);
    } else {
      window.addEventListener('resize', () => {
        setupHiDPICanvas();
        drawWheel();
      });
    }

    // Window Orientation Change for mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        setupHiDPICanvas();
        drawWheel();
      }, 150);
    });
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    setupHiDPICanvas();
    setupEventListeners();
    // Pre-populate with standard sample participants for instant showcase
    loadDemoParticipants();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
