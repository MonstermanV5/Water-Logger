// 📅 Calendar.js — Calendar View Logic (Scaffold / Pseudocode)

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed

// --- 1. INITIAL SETUP ---
// When the page loads:
// - Get reference to the calendar grid container
const calendarGrid = document.getElementById('calendar-grid');

// - Get the current year and month
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth(); // 0 = January, 1 = February, etc

// - Calculate how many days are in this month
const daysInMonth = new Date(year, month + 1, 0).getDate();

// Determine the weekday of the 1st (0 = Sunday, 1 = Monday, ...)
let firstDay = new Date(year, month, 1).getDay(); 

// Convert to 0 = Monday, 6 = Sunday (European style)
firstDay = (firstDay + 6) % 7;

// Add blank cells before day 1
function renderCalendar(year, month) {
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthLabel = document.getElementById('current-month');

  // Clear existing calendar
  calendarGrid.innerHTML = '';

  // Set month label
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  currentMonthLabel.textContent = monthName;

  const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    const todayBtn = document.getElementById('go-today');
    if (year === todayYear && month === todayMonth) {
    todayBtn.classList.add('faded');
    } else {
    todayBtn.classList.remove('faded');
    }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = (firstDay + 6) % 7;

  // Add blanks before day 1
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDiv);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = `log-${date.toLocaleDateString()}`;
    const log = JSON.parse(localStorage.getItem(dateKey) || '{}');

    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    const isFuture = date > today;
    const hasLog = log.diamond || log.drank >= 0 || log.tried;

    let emoji = '';
    if (!isFuture && (hasLog || !isToday)) {
      if (log.diamond) emoji = '💎';
      else if (log.drank >= 50) emoji = '💧';
      else if (log.tried) emoji = '✨';
    }

    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isToday) dayDiv.classList.add('today');
    dayDiv.dataset.date = dateKey;
    dayDiv.innerHTML = `
      <div class="day-number">${day}</div>
      <div class="day-emoji">${emoji || '&nbsp;'}</div>
    `;
    calendarGrid.appendChild(dayDiv);
  }

  setupDayClickHandlers(); // rebind click listeners for popups
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentYear, currentMonth);
});

document.getElementById('next-month').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
});


function setupDayClickHandlers() {
  // Clear previous day click handlers to prevent stacking
  document.querySelectorAll('.calendar-day').forEach(day => {
    // Use onclick to overwrite any previous handler
    day.onclick = () => {
  const dateKey = day.dataset.date;
  if (dateKey) openDayPopup(dateKey);
    };
  });
}


const popup = document.getElementById('day-popup');
const popupContent = document.getElementById('popup-content');


// Close when clicking outside the popup box
popup.addEventListener('click', (e) => {
  if (!popupContent.contains(e.target)) {
    popup.classList.add('hidden');
  }
});




// --- 4. AMOUNT SELECTOR ---
const amountOverlay = document.getElementById('amount-overlay');
const amountButtons = document.querySelectorAll('[data-amount]');
const closeAmountBtn = document.getElementById('close-amount');

// When a drink amount is clicked:
amountButtons.forEach(button => {
  button.addEventListener('click', () => {
    const amount = parseInt(button.dataset.amount);
    const overlay = document.getElementById('amount-overlay');
    const editDateKey = overlay.dataset.editingDate;
    if (!editDateKey) return;

    const log = JSON.parse(localStorage.getItem(editDateKey) || 'null') || {};
    if (!Array.isArray(log.drinks)) log.drinks = [];

    // Push new drink (without timestamp)
    log.drinks.push({ amount, time: null });

    // Update total drank for the day
    log.drank = (log.drank || 0) + amount;

    if (editDateKey === `log-${new Date().toLocaleDateString()}`) {
        const hydrationToday = parseInt(localStorage.getItem('hydrationToday') || '0');
        localStorage.setItem('hydrationToday', hydrationToday + amount);
    }

    // === Points logic ===
    let earnedPoints = 0;
    if (amount === 50) earnedPoints = 1;
    if (amount === 200) earnedPoints = 2;
    if (amount === 400) earnedPoints = 3;
    if (amount === 800) earnedPoints = 5;

    // Add to total points
    const points = parseInt(localStorage.getItem('points')) || 0;
    localStorage.setItem('points', points + earnedPoints);

    // === Water Diamond logic ===
    const todayKey = `log-${new Date().toLocaleDateString()}`;
    const isEditingToday = (editDateKey === todayKey);

    if (log.drank >= 800 && !log.diamond) {
        log.diamond = true;

        if (isEditingToday) {
            log.diamondTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem('diamondEarned', 'true'); // ✅ now works!
        } else {
            log.diamondTime = '00:00';
        }

        const diamonds = parseInt(localStorage.getItem('waterDiamonds')) || 0;
        localStorage.setItem('waterDiamonds', diamonds + 1);
    }
    // Save updated log
    localStorage.setItem(editDateKey, JSON.stringify(log));
    openDayPopup(editDateKey);

    // Cleanup and refresh
    amountOverlay.classList.add('hidden');
    delete overlay.dataset.editingDate;

    if (typeof renderCalendar === 'function') {
      renderCalendar(currentYear, currentMonth);
    }
  });
});

closeAmountBtn.addEventListener('click', () => {
  amountOverlay.classList.add('fading-out');

  setTimeout(() => {
    amountOverlay.classList.remove('fading-out');
    amountOverlay.classList.add('hidden');
    delete amountOverlay.dataset.editingDate;
  }, 300); // matches the CSS transition duration
});

function removeDrinkFromLog(dateKey, drinkIndex) {
  const log = JSON.parse(localStorage.getItem(dateKey) || '{}');
  if (!Array.isArray(log.drinks)) return;

  const removed = log.drinks.splice(drinkIndex, 1)[0]; // Remove and get the entry
  if (!removed) return;

  // Update total
  log.drank = log.drinks.reduce((sum, d) => sum + d.amount, 0);
  if (dateKey === `log-${new Date().toLocaleDateString()}`) {
    localStorage.setItem('hydrationToday', log.drank.toString());
  }

  // Adjust Water Diamond status
if (log.drank < 800 && log.diamond) {
  log.diamond = false;
  log.diamondTime = null;

  const diamonds = parseInt(localStorage.getItem('waterDiamonds')) || 0;
  localStorage.setItem('waterDiamonds', Math.max(0, diamonds - 1));
  
  // Only reset diamondEarned if today and total < 800
  const todayKey = `log-${new Date().toLocaleDateString()}`;
  if (dateKey === todayKey) {
    localStorage.setItem('diamondEarned', 'false');
  }
} else if (log.drank >= 800 && log.diamond) {
  // If still above 800 and diamond is set, keep diamondEarned true
  const todayKey = `log-${new Date().toLocaleDateString()}`;
  if (dateKey === todayKey) {
    localStorage.setItem('diamondEarned', 'true');
  }
}

  // Adjust points
  const pointsToRemove = (removed.amount === 50) ? 1 :
                         (removed.amount === 200) ? 2 :
                         (removed.amount === 400) ? 3 :
                         (removed.amount === 800) ? 5 : 0;
  const currentPoints = parseInt(localStorage.getItem('points')) || 0;
  localStorage.setItem('points', Math.max(0, currentPoints - pointsToRemove));

  // Save updated log
  const isNowEmpty =
    (!log.diamond || log.diamond === false) &&
    (!log.drinks || log.drinks.length === 0) &&
    (!log.tried && (!log.triedTimes || log.triedTimes.length === 0)) &&
    (log.drank === undefined || log.drank === 0);

    if (isNowEmpty) {
    localStorage.removeItem(dateKey);
    } else {
    localStorage.setItem(dateKey, JSON.stringify(log));
    }

  // Refresh popup and calendar
  requestAnimationFrame(() => updatePopupContent(dateKey));
  updateCalendarDay(dateKey);  // update emoji only
}

function updateCalendarDay(dateKey) {
  const dateStr = dateKey.replace('log-', '');
  const target = [...document.querySelectorAll('.calendar-day')].find(div => div.dataset.date === dateKey);
  if (!target) return;

  const log = JSON.parse(localStorage.getItem(dateKey) || '{}');
  let emoji = '';
  if (log.diamond) emoji = '💎';
  else if (log.drank >= 50) emoji = '💧';
  else if (log.tried) emoji = '✨';

  const emojiDiv = target.querySelector('.day-emoji');
  if (emojiDiv) emojiDiv.textContent = emoji || ' ';
}

function updatePopupContent(dateKey) {
  const popup = document.getElementById('day-popup');
  if (popup.classList.contains('hidden')) return;

  const log = JSON.parse(localStorage.getItem(dateKey) || '{}');

  if (log.diamondTime === '00:00') log.diamondTime = null;

  const dateText = dateKey.replace('log-', '');
  const popupDate = document.getElementById('popup-date');
  const popupDetails = document.getElementById('popup-details');
  const clearBtn = document.getElementById('clear-day');
  const addDrinkBtn = document.getElementById('add-drink');
  const addTriedBtn = document.getElementById('add-tried');

  // Determine if this day is in the future
  const date = new Date(dateText);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFuture = date > today;

  popupDate.textContent = `Details for ${dateText}`;
  popupDetails.innerHTML = '';

  const actionLog = [];

  if (log.diamond) {
    actionLog.push({ type: 'diamond', label: '🏆 Earned a Water Diamond', time: log.diamondTime || null });
  }

  if (Array.isArray(log.drinks)) {
    log.drinks.forEach((entry, index) => {
      actionLog.push({ type: 'drink', label: `💧 Drank ${entry.amount}ml`, time: entry.time || null, index });
    });
  }

  if (Array.isArray(log.triedTimes)) {
    log.triedTimes.forEach((time, index) => {
    actionLog.push({
      type: 'tried',
      label: '✨ Tried to drink water',
      time: time || null,  // Use actual logged time
      index
    });
});
  }

  const diamondEntry = actionLog.find(e => e.type === 'diamond');
  const otherEntries = actionLog.filter(e => e.type !== 'diamond');

  otherEntries.sort((a, b) => {
    const tA = new Date(`1970-01-01T${a.time}`);
    const tB = new Date(`1970-01-01T${b.time}`);
    return tA - tB;
  });

  if (diamondEntry) {
    const li = document.createElement('li');
    li.textContent = diamondEntry.time
      ? `${diamondEntry.label} at ${diamondEntry.time}`
      : diamondEntry.label;
    popupDetails.appendChild(li);
  }

  if (otherEntries.length > 0) {
    otherEntries.forEach(entry => {
      const li = document.createElement('li');

      const labelSpan = document.createElement('span');
      if (entry.time && entry.time !== '00:00') {
  labelSpan.textContent = `${entry.label} at ${entry.time}`;
} else {
  labelSpan.textContent = entry.label;
}

      labelSpan.style.flex = '1';
      labelSpan.style.textAlign = 'left';
      labelSpan.style.whiteSpace = 'nowrap';
      labelSpan.style.overflow = 'hidden';
      labelSpan.style.textOverflow = 'ellipsis';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '❌';
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (entry.type === 'drink') {
          removeDrinkFromLog(dateKey, entry.index);
        } else if (entry.type === 'tried') {
          removeTriedFromLog(dateKey, entry.index);
        }
      };

      li.appendChild(labelSpan);
      li.appendChild(removeBtn);
      popupDetails.appendChild(li);
    });
  } else if (!diamondEntry) {
    const li = document.createElement('li');
    li.textContent = 'No entry for this day.';
    popupDetails.appendChild(li);
  }

  const isEmpty =
    !log.diamond &&
    (!log.drinks || log.drinks.length === 0) &&
    (!log.triedTimes || log.triedTimes.length === 0) &&
    log.drank == null &&
    !log.tried;

  // Show clear button only if not future AND not empty
  if (!isFuture && !isEmpty) {
    clearBtn.classList.remove('hidden');
    clearBtn.onclick = () => {
      const confirmClear = confirm('Are you sure you want to clear this day? This can’t be undone.');
      if (!confirmClear) return;

      // Clear day logic here (you can reuse your existing clear day code)
      const log = JSON.parse(localStorage.getItem(dateKey) || '{}');

      if (log.diamond) {
        const diamonds = parseInt(localStorage.getItem('waterDiamonds')) || 0;
        localStorage.setItem('waterDiamonds', Math.max(0, diamonds - 1));
      }

      let pointsToRemove = 0;
      if (Array.isArray(log.drinks)) {
        for (const drink of log.drinks) {
          if (drink.amount === 50) pointsToRemove += 1;
          else if (drink.amount === 200) pointsToRemove += 2;
          else if (drink.amount === 400) pointsToRemove += 3;
          else if (drink.amount === 800) pointsToRemove += 5;
        }
      }

      if (Array.isArray(log.triedTimes)) {
        pointsToRemove += log.triedTimes.length;
      } else if (log.tried) {
        pointsToRemove += 1;
      }

      const currentPoints = parseInt(localStorage.getItem('points')) || 0;
      localStorage.setItem('points', Math.max(0, currentPoints - pointsToRemove));

      const todayKey = `log-${new Date().toLocaleDateString()}`;
      if (dateKey === todayKey) {
        localStorage.setItem('hydrationToday', '0');
        localStorage.setItem('diamondEarned', 'false');
      }

      localStorage.removeItem(dateKey);
      popup.classList.add('hidden');
      renderCalendar(currentYear, currentMonth);
    };
  } else {
    clearBtn.classList.add('hidden');
    clearBtn.onclick = null;
  }

  // Show Add Drink and Add Tried buttons only if not future
  if (!isFuture) {
    addDrinkBtn.classList.remove('hidden');
    addDrinkBtn.onclick = () => {
      const overlay = document.getElementById('amount-overlay');
      overlay.classList.remove('hidden');
      overlay.dataset.editingDate = dateKey;
    };

    addTriedBtn.classList.remove('hidden');
    addTriedBtn.onclick = () => {
      const log = JSON.parse(localStorage.getItem(dateKey) || '{}');
      if (!Array.isArray(log.triedTimes)) log.triedTimes = [];
      log.tried = true;
      log.triedTimes.push('00:00');
      localStorage.setItem(dateKey, JSON.stringify(log));

      points++;
      localStorage.setItem('points', points.toString());

      updatePopupContent(dateKey);
      renderCalendar(currentYear, currentMonth);
    };
  } else {
    addDrinkBtn.classList.add('hidden');
    addDrinkBtn.onclick = null;
    addTriedBtn.classList.add('hidden');
    addTriedBtn.onclick = null;
  }
}

function openDayPopup(dateKey) {
  const log = JSON.parse(localStorage.getItem(dateKey) || '{}');

  const dateString = dateKey.replace('log-', '');
const date = parseDMY(dateString);
date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFuture = date > today;


  if (log.diamondTime === '00:00') {
    log.diamondTime = null;
  }

  const dateText = dateKey.replace('log-', '');
  const popup = document.getElementById('day-popup');
  const popupDate = document.getElementById('popup-date');
  const popupDetails = document.getElementById('popup-details');
  const clearBtn = document.getElementById('clear-day');
  const addDrinkBtn = document.getElementById('add-drink');
  const addTriedBtn = document.getElementById('add-tried');

  popupDate.textContent = `Details for ${dateText}`;
  popupDetails.innerHTML = '';

  const actionLog = [];

  if (log.diamond !== undefined && log.diamond !== false) {
    actionLog.push({
      type: 'diamond',
      label: '🏆 Earned a Water Diamond',
      time: log.diamondTime || null
    });
  }

  if (Array.isArray(log.drinks)) {
    log.drinks.forEach((entry, index) => {
      actionLog.push({
        type: 'drink',
        label: `💧 Drank ${entry.amount}ml`,
        time: entry.time || null,
        index
      });
    });
  }

  if (Array.isArray(log.triedTimes)) {
    log.triedTimes.forEach((time, index) => {
      actionLog.push({
        type: 'tried',
        label: '✨ Tried to drink water',
        time: time || null,
        index
      });
    });
  }

  const diamondEntry = actionLog.find(e => e.type === 'diamond');
  const otherEntries = actionLog.filter(e => e.type !== 'diamond');

  otherEntries.sort((a, b) => {
    const tA = new Date(`1970-01-01T${a.time}`);
    const tB = new Date(`1970-01-01T${b.time}`);
    return tA - tB;
  });

  if (diamondEntry) {
    const li = document.createElement('li');
    li.textContent = diamondEntry.time
      ? `${diamondEntry.label} at ${diamondEntry.time}`
      : diamondEntry.label;
    popupDetails.appendChild(li);
  }

  if (otherEntries.length > 0) {
    otherEntries.forEach(entry => {
      const li = document.createElement('li');

      const labelSpan = document.createElement('span');
      if (entry.time && entry.time !== '00:00') {
  labelSpan.textContent = `${entry.label} at ${entry.time}`;
} else {
  labelSpan.textContent = entry.label;
}

      labelSpan.style.flex = '1';
      labelSpan.style.textAlign = 'left';
      labelSpan.style.whiteSpace = 'nowrap';
      labelSpan.style.overflow = 'hidden';
      labelSpan.style.textOverflow = 'ellipsis';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '❌';
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (entry.type === 'drink') {
          removeDrinkFromLog(dateKey, entry.index);
        } else if (entry.type === 'tried') {
          removeTriedFromLog(dateKey, entry.index);
        }
      };

      li.appendChild(labelSpan);
      li.appendChild(removeBtn);
      popupDetails.appendChild(li);
    });
  } else if (!diamondEntry) {
    const li = document.createElement('li');
    li.textContent = 'No entry for this day.';
    popupDetails.appendChild(li);
  }

  const isEmpty =
    !log.diamond &&
    (!log.drinks || log.drinks.length === 0) &&
    (!log.triedTimes || log.triedTimes.length === 0) &&
    log.drank == null &&
    !log.tried;

  // Show Clear Day button only if not future and day is not empty
  if (!isFuture && !isEmpty) {
    clearBtn.classList.remove('hidden');
    clearBtn.onclick = () => {
      const confirmClear = confirm('Are you sure you want to clear this day? This can’t be undone.');
      if (!confirmClear) return;

      const log = JSON.parse(localStorage.getItem(dateKey) || '{}');

      if (log.diamond) {
        const diamonds = parseInt(localStorage.getItem('waterDiamonds')) || 0;
        localStorage.setItem('waterDiamonds', Math.max(0, diamonds - 1));
      }

      let pointsToRemove = 0;
      if (Array.isArray(log.drinks)) {
        for (const drink of log.drinks) {
          if (drink.amount === 50) pointsToRemove += 1;
          else if (drink.amount === 200) pointsToRemove += 2;
          else if (drink.amount === 400) pointsToRemove += 3;
          else if (drink.amount === 800) pointsToRemove += 5;
        }
      }

      if (Array.isArray(log.triedTimes)) {
        pointsToRemove += log.triedTimes.length;
      } else if (log.tried) {
        pointsToRemove += 1;
      }

      const currentPoints = parseInt(localStorage.getItem('points')) || 0;
      localStorage.setItem('points', Math.max(0, currentPoints - pointsToRemove));

      const todayKey = `log-${new Date().toLocaleDateString()}`;
      if (dateKey === todayKey) {
        localStorage.setItem('hydrationToday', '0');
        localStorage.setItem('diamondEarned', 'false');
      }

      localStorage.removeItem(dateKey);
      popup.classList.add('hidden');
      renderCalendar(currentYear, currentMonth);
    };
  } else {
    clearBtn.classList.add('hidden');
    clearBtn.onclick = null;
  }

  // Show Add Drink and Add Tried buttons only if not future
  if (!isFuture) {
    addDrinkBtn.classList.remove('hidden');
    addDrinkBtn.onclick = () => {
      const overlay = document.getElementById('amount-overlay');
      overlay.classList.remove('hidden');
      overlay.dataset.editingDate = dateKey;
    };

    addTriedBtn.classList.remove('hidden');
    addTriedBtn.onclick = () => {
      const log = JSON.parse(localStorage.getItem(dateKey) || '{}');
      if (!Array.isArray(log.triedTimes)) log.triedTimes = [];
      log.tried = true;
      log.triedTimes.push('00:00');
      localStorage.setItem(dateKey, JSON.stringify(log));

      points++;
      localStorage.setItem('points', points.toString());
      updateStats();

      openDayPopup(dateKey); // Re-render
      renderCalendar(currentYear, currentMonth); // Refresh calendar
    };
  } else {
    addDrinkBtn.classList.add('hidden');
    addDrinkBtn.onclick = null;
    addTriedBtn.classList.add('hidden');
    addTriedBtn.onclick = null;
  }

  popup.classList.remove('hidden');
}


renderCalendar(currentYear, currentMonth);

document.getElementById('go-today').addEventListener('click', () => {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  renderCalendar(currentYear, currentMonth);
});

amountOverlay.addEventListener('click', (e) => {
  const selector = document.getElementById('amount-selector');
  if (!selector.contains(e.target)) {
    amountOverlay.classList.add('hidden');
    delete amountOverlay.dataset.editingDate;
  }
});

function removeTriedFromLog(dateKey, index) {
  const log = JSON.parse(localStorage.getItem(dateKey) || '{}');
  if (!Array.isArray(log.triedTimes)) return;

  log.triedTimes.splice(index, 1);

    // Deduct 1 point for removing a tried
  points = parseInt(localStorage.getItem('points')) || 0;
  points = Math.max(0, points - 1);
  localStorage.setItem('points', points.toString());

  if (log.triedTimes.length === 0) {
    delete log.tried;
  }

  const isNowEmpty =
    (!log.diamond || log.diamond === false) &&
    (!log.drinks || log.drinks.length === 0) &&
    (!log.tried && (!log.triedTimes || log.triedTimes.length === 0)) &&
    (log.drank === undefined || log.drank === 0);

  if (isNowEmpty) {
    localStorage.removeItem(dateKey);
  } else {
    localStorage.setItem(dateKey, JSON.stringify(log));
  }

  updatePopupContent(dateKey);
  updateCalendarDay(dateKey);
}

function parseDMY(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return new Date(dateStr); // fallback
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // zero-based
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}