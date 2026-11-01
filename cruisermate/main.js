(() => {
  // ---- Gauge catalogue ----
  const GAUGES = {
    boost: { label: 'BOOST',   unit: 'psi', min: 0,   max: 25,   dp: 1, base: 14,  jitter: 2.5,  warn: 22 },
    egt:   { label: 'EGT',     unit: '°C',  min: 0,   max: 800,  dp: 0, base: 490, jitter: 60,   warn: 650 },
    ect:   { label: 'COOLANT', unit: '°C',  min: 40,  max: 120,  dp: 0, base: 88,  jitter: 3,    warn: 105 },
    trans: { label: 'TRANS',   unit: '°C',  min: 20,  max: 130,  dp: 0, base: 76,  jitter: 4,    warn: 110 },
    batt:  { label: 'BATT',    unit: 'V',   min: 10,  max: 15,   dp: 1, base: 14.1,jitter: .15,  warn: 99 },
    speed: { label: 'SPEED',   unit: 'km/h',min: 0,   max: 140,  dp: 0, base: 96,  jitter: 5,    warn: 999 },
    rpm:   { label: 'RPM',     unit: 'rpm', min: 0,   max: 4500, dp: 0, base: 1850,jitter: 250,  warn: 4200 },
    load:  { label: 'LOAD',    unit: '%',   min: 0,   max: 100,  dp: 0, base: 58,  jitter: 12,   warn: 999 },
    dpf:   { label: 'DPF',     unit: '%',   min: 0,   max: 100,  dp: 0, base: 23,  jitter: .5,   warn: 85 },
    fuel:  { label: 'L/100',   unit: 'km',  min: 0,   max: 30,   dp: 1, base: 13.4,jitter: 1.2,  warn: 999 },
    pitch: { label: 'PITCH',   unit: '°',   min: -30, max: 30,   dp: 0, base: 4,   jitter: 3,    warn: 25 },
    alt:   { label: 'ALT',     unit: 'm',   min: 0,   max: 2500, dp: 0, base: 412, jitter: 6,    warn: 99999 },
  };
  const state = {};
  for (const k in GAUGES) state[k] = GAUGES[k].base;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function step() {
    for (const k in GAUGES) {
      const g = GAUGES[k];
      // mean-reverting random walk
      state[k] += (g.base - state[k]) * 0.15 + (Math.random() - 0.5) * g.jitter;
      state[k] = clamp(state[k], g.min, g.max);
    }
  }
  const fmt = (k) => state[k].toFixed(GAUGES[k].dp);
  const pct = (k) => (state[k] - GAUGES[k].min) / (GAUGES[k].max - GAUGES[k].min);

  function gaugeHTML(k) {
    const g = GAUGES[k];
    return `<div class="g" data-g="${k}"><span class="g-l">${g.label}</span><span class="g-v">${fmt(k)}</span><span class="g-u">${g.unit}</span><i class="g-bar"><i style="--p:${pct(k).toFixed(3)}"></i></i></div>`;
  }

  // ---- Hero screen (static markup, update values) ----
  const heroPage = document.querySelector('#heroScreen .screen-page');
  heroPage.innerHTML = ['boost', 'egt', 'ect', 'trans', 'batt'].map(gaugeHTML).join('');

  // ---- Customiser ----
  const chipsEl = document.getElementById('chips');
  const customPage = document.getElementById('customPage');
  const countEl = document.getElementById('chipCount');
  let selected = ['boost', 'egt', 'ect', 'trans', 'batt'];

  function renderChips() {
    chipsEl.innerHTML = Object.keys(GAUGES).map(k =>
      `<button type="button" class="chip" data-k="${k}" aria-pressed="${selected.includes(k)}">${GAUGES[k].label}</button>`
    ).join('');
  }
  function renderCustom() {
    customPage.innerHTML = selected.length
      ? selected.map(gaugeHTML).join('')
      : '<div class="g"><span class="g-l">SELECT A READING</span></div>';
    countEl.textContent = selected.length;
  }
  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const k = b.dataset.k;
    if (selected.includes(k)) selected = selected.filter(x => x !== k);
    else {
      if (selected.length >= 5) selected.shift();
      selected.push(k);
    }
    renderChips();
    renderCustom();
  });
  renderChips();
  renderCustom();

  // ---- Live update loop ----
  function updateScreens() {
    document.querySelectorAll('.g[data-g]').forEach(el => {
      const k = el.dataset.g;
      el.querySelector('.g-v').textContent = fmt(k);
      el.querySelector('.g-bar > i').style.setProperty('--p', pct(k).toFixed(3));
      el.classList.toggle('warn', state[k] >= GAUGES[k].warn);
    });
  }

  // ---- Log timer ----
  const statusEl = document.querySelector('#heroScreen .screen-status');
  let secs = 2 * 3600 + 14 * 60 + 37;
  const pad = n => String(n).padStart(2, '0');
  function updateStatus() {
    const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, s = secs % 60;
    statusEl.innerHTML = `<span class="dot rec"></span>LOG ${pad(h)}:${pad(m)}:${pad(s)}<span class="sep"></span>DPF ${fmt('dpf')}%<span class="sep"></span>INCL ${fmt('pitch')}° / 2°`;
  }

  // ---- App sparkline ----
  const spark = document.getElementById('spark');
  const egtHist = Array.from({ length: 60 }, () => 490 + (Math.random() - .5) * 80);
  function updateSpark() {
    egtHist.push(state.egt); egtHist.shift();
    // 0..800 °C mapped to 70..0 (limit 650 => y≈13)
    spark.setAttribute('points', egtHist.map((v, i) =>
      `${(i / (egtHist.length - 1) * 200).toFixed(1)},${(70 - v / 800 * 70).toFixed(1)}`).join(' '));
  }
  document.querySelector('.pu-limit').setAttribute('y1', 70 - 650 / 800 * 70);
  document.querySelector('.pu-limit').setAttribute('y2', 70 - 650 / 800 * 70);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tick = 0;
  function loop() {
    step();
    // occasional EGT spike to demo alerts
    if (tick % 40 > 33) state.egt = clamp(state.egt + 70, 0, 800);
    updateScreens();
    updateSpark();
    if (tick % 2 === 0) { secs++; updateStatus(); }
    tick++;
  }
  updateStatus(); updateSpark();
  if (!reduced) setInterval(loop, 500);

  // ---- Form ----
  document.getElementById('reserveForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('formMsg').textContent = "Thanks, you're on the list. We'll be in touch before launch.";
    e.target.reset();
  });
})();
