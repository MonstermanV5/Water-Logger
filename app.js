// 🌟 App.js — Hydration Tracker Logic (Scaffold / Pseudocode)


// - today's date (to check for daily reset)
const today = new Date().toLocaleDateString();

// Check if the stored date is today:
// - If not, reset hydrationToday to 0
// - Save today's date to localStorage
if (localStorage.getItem('lastDate') !== today) {
    localStorage.setItem('lastDate', today);
    localStorage.setItem('hydrationToday', '0');
    localStorage.setItem('diamondEarned', 'false');
}


// --- 1. INITIAL SETUP ---
// Load or initialize variables:
// - hydrationToday (how much drank today)
let hydrationToday = parseInt(localStorage.getItem('hydrationToday')) || 0;
// - points (for effort)
let points = parseInt(localStorage.getItem('points')) || 0;
// - waterDiamonds (earned if 800ml+)
let diamonds = parseInt(localStorage.getItem('waterDiamonds')) || 0;


// --- 2. UI REFERENCES ---
// Get references to important DOM elements:
// - Buttons: drank, tried, skipped
const drankBtn = document.getElementById('drank-btn');
const triedBtn = document.getElementById('tried-btn');
const closeAmountBtn = document.getElementById('close-amount');
// - Amount buttons (small sip, cup, big glass, bottle)
const amountButtons = document.querySelectorAll('[data-amount]')
// - Stats display (hydration total, points, diamonds)
const hydrationDisplay = document.getElementById('hydration-total');
const pointsDisplay = document.getElementById('points-total');
const diamondsDisplay = document.getElementById('diamonds-total');
// - Message area
const messageBox = document.getElementById('message');
// - Amount selector section
const amountOverlay = document.getElementById('amount-overlay');
// - Bottle fill animation
const fill = document.getElementById('fill');
const fillLabel = document.getElementById('fill-label');


// load stats
updateStats();


// --- 3. BUTTON EVENT LISTENERS ---
// drank-btn → show amount selector
drankBtn.addEventListener('click', () => {
    amountOverlay.classList.remove('hidden');
});
// tried-btn → +1 point, update UI, encouragement message
triedBtn.addEventListener('click', () => {
    points++;
    localStorage.setItem('points', points);
    const logKey = `log-${today}`;
    const existingLog = JSON.parse(localStorage.getItem(logKey)) || {};
    
    if (!Array.isArray(existingLog.triedTimes)) existingLog.triedTimes = [];
    existingLog.tried = true; // still keep this for summary use
    existingLog.triedTimes.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    localStorage.setItem(logKey, JSON.stringify(existingLog));
    showMessage("You tried, and that's amazing 💛");
    updateStats();
});
// close-amount-btn -> close amount selector menu
closeAmountBtn.addEventListener('click', () => {
  amountOverlay.classList.add('fading-out');

  setTimeout(() => {
    amountOverlay.classList.remove('fading-out');
    amountOverlay.classList.add('hidden');
    delete amountOverlay.dataset.editingDate;
  }, 300); // matches the CSS transition duration
});

amountOverlay.addEventListener('click', (event) => {
    if (event.target === amountOverlay) {
        amountOverlay.classList.add('hidden');
    }
});


// --- 4. AMOUNT SELECTOR ---
// When a drink amount is clicked:
amountButtons.forEach(button => {
  button.addEventListener('click', () => {
    const amount = parseInt(button.dataset.amount);

    const overlay = document.getElementById('amount-overlay');
    const editDateKey = overlay.dataset.editingDate;
    const isEditingPast = Boolean(editDateKey);
    const logKey = isEditingPast ? editDateKey : `log-${today}`;

    const existingLog = JSON.parse(localStorage.getItem(logKey) || 'null') || {};

    // If not already an array, create one
    if (!Array.isArray(existingLog.drinks)) existingLog.drinks = [];

    // Push a new entry with or without timestamp
    existingLog.drinks.push({
      amount,
      time: isEditingPast ? null : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Add to hydrationToday if logging today
    if (!isEditingPast) {
      hydrationToday += amount;
      existingLog.drank = hydrationToday;
      localStorage.setItem('hydrationToday', hydrationToday.toString());
    } else {
      // For past day, just total up drinks manually
      existingLog.drank = (existingLog.drank || 0) + amount;
    }

    // If earned a water diamond
    if (!isEditingPast && hydrationToday >= 800 && localStorage.getItem('diamondEarned') !== 'true') {
      diamonds++;
      localStorage.setItem('waterDiamonds', diamonds.toString());
      localStorage.setItem('diamondEarned', 'true');

      existingLog.diamond = true;
      existingLog.diamondTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      showMessage("🎉 You earned a Water Diamond!");
    } else if (!isEditingPast) {
      showMessage("Water added 💧 You're doing great!");
    }

    // Save updated log
    localStorage.setItem(logKey, JSON.stringify(existingLog));

    // Add points
    let earnedPoints = 0;
    if (amount === 50) earnedPoints = 1;
    if (amount === 200) earnedPoints = 2;
    if (amount === 400) earnedPoints = 3;
    if (amount === 800) earnedPoints = 5;

    points += earnedPoints;
    localStorage.setItem('points', points.toString());

    // Update stats if editing today
    if (!isEditingPast) updateStats();

    // Hide overlay
    amountOverlay.classList.add('hidden');
    delete overlay.dataset.editingDate;

    // If editing a past day, refresh the calendar
    if (isEditingPast && typeof renderCalendar === 'function') {
      renderCalendar(currentYear, currentMonth);
    }
  });
});



// --- 5. UPDATE STATS FUNCTION ---
// Update UI elements with current hydrationToday, points, diamonds
function updateStats() {
    hydrationDisplay.textContent = hydrationToday;
    pointsDisplay.textContent = points;
    diamondsDisplay.textContent = diamonds;

    const percentage = Math.min(hydrationToday / 800, 1) * 100;
    fill.style.height = `${percentage}%`;
    document.getElementById('fill-amount').textContent = hydrationToday;
}


// --- 6. SHOW MESSAGE FUNCTION ---
// Show encouragement or reward message in the message area
// (optional: auto-hide after a few seconds)
function showMessage(text) {
    messageBox.textContent = text;
    messageBox.classList.remove('hidden');

    clearTimeout(showMessage.timeout);

    showMessage.timeout = setTimeout(() => {
        messageBox.classList.add('hidden');
        messageBox.textContent = '';
    }, 4000);

}


// --- 7. (Optional later) Vibration Feedback ---
// If on mobile, trigger short vibration on water log


// --- 8. (Optional later) Encouragement Message Rotation ---
// Pick a random message from a list after logging or trying



if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}
