// ============================================
//  CalcNest – Attendance Calculator
//  script.js
// ============================================

// ---- Dark mode ----
function toggleDark() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? '' : 'dark';
  document.getElementById('darkBtn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('calcnest-theme', isDark ? 'light' : 'dark');
}

// Restore saved theme on load
(function () {
  const saved = localStorage.getItem('calcnest-theme');
  if (saved === 'dark') {
    document.documentElement.dataset.theme = 'dark';
    const btn = document.getElementById('darkBtn');
    if (btn) btn.textContent = '☀️';
  }
})();


// ---- Helpers ----
function getVal(id) {
  return parseFloat(document.getElementById(id).value);
}

function setError(id, hasError) {
  document.getElementById(id).classList.toggle('error', hasError);
}

function clearErrors() {
  ['totalClasses', 'attended', 'target', 'semTotal'].forEach(id => setError(id, false));
}

function resetAll() {
  ['totalClasses', 'attended', 'semTotal'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('target').value = '75';
  clearErrors();
  document.getElementById('placeholder').style.display = '';
  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsCard').style.alignItems = 'center';
  document.getElementById('resultsCard').style.justifyContent = 'center';
}


// ---- Main calculation ----
function calculate() {
  clearErrors();

  const total    = getVal('totalClasses');
  const attended = getVal('attended');
  const target   = getVal('target') || 75;
  const semTotal = getVal('semTotal');

  // Validation
  let hasError = false;
  if (!total || total < 1)             { setError('totalClasses', true); hasError = true; }
  if (isNaN(attended) || attended < 0) { setError('attended', true);     hasError = true; }
  if (!target || target < 1 || target > 100) { setError('target', true); hasError = true; }
  if (hasError) return;

  if (attended > total) {
    setError('attended', true);
    showError('Classes attended cannot exceed total classes held.');
    return;
  }

  const pct    = (attended / total) * 100;
  const isSafe = pct >= target;
  const isWarn = pct >= (target - 5) && !isSafe;

  // Classes that can be skipped (if safe)
  // Formula: attended / (total + x) >= target/100  →  x = (attended * 100 / target) - total
  const canSkip = isSafe ? Math.max(0, Math.floor((attended * 100 / target) - total)) : 0;

  // Classes needed to reach target (if below)
  // Formula: (attended + x) / (total + x) >= target/100  →  x = (target*total - 100*attended) / (100 - target)
  const needToAttend = !isSafe && target < 100
    ? Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)))
    : 0;

  // Status
  const statusClass = isSafe ? 'status-safe' : isWarn ? 'status-warn' : 'status-danger';
  const statusIcon  = isSafe ? '✅' : isWarn ? '⚠️' : '❌';
  const statusText  = isSafe ? 'You\'re Safe!' : isWarn ? 'Borderline' : 'Below Target';

  // Progress bar
  const barClass = isSafe ? 'bar-safe' : isWarn ? 'bar-warn' : 'bar-danger';
  const barWidth = Math.min(pct, 100).toFixed(1);

  // Semester forecast
  let semHTML = '';
  if (!isNaN(semTotal) && semTotal > total) {
    const remaining = semTotal - total;
    if (isSafe) {
      const safeMiss = Math.max(0, Math.floor((attended * 100 / target) - semTotal));
      semHTML = `
        <div class="result-item">
          <div class="result-label">Semester Forecast</div>
          <div class="result-note" style="font-size:13px; margin-top:2px;">
            ${remaining} classes remain. You can miss up to
            <strong>${safeMiss}</strong> more and still hit ${target}%.
          </div>
        </div>`;
    } else {
      const semNeeded = Math.ceil((target * semTotal - 100 * attended) / (100 - target));
      const attend = Math.min(semNeeded, remaining);
      semHTML = `
        <div class="result-item">
          <div class="result-label">Semester Forecast</div>
          <div class="result-note" style="font-size:13px; margin-top:2px;">
            ${remaining} classes remain. Attend <strong>${attend}</strong> of them to reach ${target}% by end of semester.
          </div>
        </div>`;
    }
  }

  const html = `
    <div class="result-item">
      <div class="result-label">Current Attendance</div>
      <div class="result-value">${pct.toFixed(2)}%</div>
      <div class="progress-wrap">
        <div class="progress-bar ${barClass}" style="width: ${barWidth}%"></div>
      </div>
      <div class="result-note">${attended} of ${total} classes &nbsp;·&nbsp; Target: ${target}%</div>
    </div>

    <div class="result-item">
      <div class="result-label">Status</div>
      <div style="margin-top: 6px;">
        <span class="status-badge ${statusClass}">${statusIcon} ${statusText}</span>
      </div>
    </div>

    ${isSafe ? `
    <div class="result-item">
      <div class="result-label">Classes You Can Skip</div>
      <div class="result-value">${canSkip}</div>
      <div class="result-note">
        Bunk up to ${canSkip} more class${canSkip !== 1 ? 'es' : ''} and stay above ${target}%
      </div>
    </div>` : `
    <div class="result-item">
      <div class="result-label">Classes Needed to Reach ${target}%</div>
      <div class="result-value">${needToAttend}</div>
      <div class="result-note">
        Attend ${needToAttend} consecutive class${needToAttend !== 1 ? 'es' : ''} to reach your target
      </div>
    </div>`}

    ${semHTML}
  `;

  const content = document.getElementById('resultsContent');
  const card    = document.getElementById('resultsCard');
  content.innerHTML = html;
  content.style.display = 'flex';
  document.getElementById('placeholder').style.display = 'none';
  card.style.alignItems    = 'flex-start';
  card.style.justifyContent = 'flex-start';
}

function showError(msg) {
  const content = document.getElementById('resultsContent');
  content.innerHTML = `<div style="color: var(--red); font-size: 14px; padding: 0.5rem 0;">${msg}</div>`;
  content.style.display = 'flex';
  document.getElementById('placeholder').style.display = 'none';
}


// ---- Live calc on input (optional: recalculate when all fields filled) ----
['totalClasses', 'attended', 'target', 'semTotal'].forEach(id => {
  document.getElementById(id).addEventListener('input', function () {
    const total    = parseFloat(document.getElementById('totalClasses').value);
    const attended = parseFloat(document.getElementById('attended').value);
    if (!isNaN(total) && !isNaN(attended) && total > 0) {
      calculate();
    }
  });
});

// ---- Enter key triggers calculate ----
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') calculate();
});
