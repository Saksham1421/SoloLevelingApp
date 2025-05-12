// --- SPA Navigation (Rules Page) ---
function showRulesPage() {
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('rules-page').style.display = 'block';
  document.getElementById('sidebar').style.left = '-80%';
  document.getElementById('main-content').classList.remove('blur');
  document.getElementById('overlay').style.display = 'none';
}
function showMainContent() {
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('rules-page').style.display = 'none';
  document.getElementById('sidebar').style.left = '-80%';
  document.getElementById('main-content').classList.remove('blur');
  document.getElementById('overlay').style.display = 'none';
}

// --- Main App Logic (Unchanged except penalty fix) ---

function customRound(num) {
  const fractional = num - Math.floor(num);
  return fractional < 0.5 ? Math.floor(num) : Math.ceil(num);
}
let totalXP = 0;
let totalBalance = 0;
const questHistory = {};
const dailyQuestCompleted = { workout: false, meditation: false, invites: false };
let streak = localStorage.getItem("streak") ? parseInt(localStorage.getItem("streak")) : 0;
let lastCompletionDate = localStorage.getItem("lastCompletionDate") || "";
document.getElementById("streak").textContent = streak;
let invitationCongratNotified = false;
let invitationReminderShown = false;
let currentPenaltyQuest = "";
let currentLevelGlobal = getLevelInfo(totalXP).level;
let currentRewardMultiplier = getMoneyMultiplier(getLevelInfo(totalXP).level);

// --- Penalty reward mapping for daily quests ---
function getDailyQuestBaseReward(quest) {
  // Base rewards for each daily quest
  switch (quest) {
    case "workout": return 10;
    case "invites": return 1 * (questHistory["invites"] && questHistory["invites"].value ? questHistory["invites"].value : 25);
    case "meditation": return 10;
    default: return 0;
  }
}

function getTodayDate() {
  let today = new Date();
  return today.toISOString().split("T")[0];
}
function getResetDay() {
  let now = new Date();
  if (now.getHours() < 4) { now.setDate(now.getDate() - 1); }
  return now.toISOString().split("T")[0];
}
function getLevelInfo(totalXP) {
  let level = 1, xpNeeded = 100, cumulative = xpNeeded;
  while (totalXP >= cumulative) {
    level++;
    xpNeeded = level <= 6 ? Math.ceil(xpNeeded * 1.5) : Math.ceil(xpNeeded * 1.2);
    cumulative += xpNeeded;
  }
  let currentProgress = totalXP - (cumulative - xpNeeded);
  return { level, currentProgress, xpNeeded };
}
function getMoneyMultiplier(level) {
  return Math.round(Math.pow(1.2, level - 1) * 10) / 10;
}
function checkDailyQuestsCompletion() {
  if (dailyQuestCompleted.workout && dailyQuestCompleted.meditation && dailyQuestCompleted.invites) {
    let today = getTodayDate();
    if (lastCompletionDate !== today) {
      streak++;
      lastCompletionDate = today;
      localStorage.setItem("lastCompletionDate", today);
      localStorage.setItem("streak", streak);
      document.getElementById("streak").textContent = streak;
      showNotification("<b>Daily Streak increased!</b> Current streak: " + streak + " days.");
    }
  }
}
function resetStreakIfMissed() {
  let today = getTodayDate();
  if (lastCompletionDate !== today) {
    streak = 0;
    localStorage.setItem("streak", 0);
    document.getElementById("streak").textContent = streak;
  }
}
function markDailyQuestFailed(quest) {
  const questElem = document.getElementById("quest_" + quest);
  if (questElem) {
    questElem.style.color = "#ff6666";
    if (quest === "invites") {
      let now = new Date();
      if ((now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 30)) &&
          !(questHistory[quest] && questHistory[quest].penaltyCompleted)) {
        questElem.style.cursor = "pointer";
        questElem.onclick = () => openPenaltyModal(quest);
      } else {
        questElem.style.cursor = "default";
        questElem.onclick = null;
      }
    } else {
      if (!(questHistory[quest] && questHistory[quest].penaltyCompleted)) {
        questElem.style.cursor = "pointer";
        questElem.onclick = () => openPenaltyModal(quest);
      }
    }
  }
}
function openPenaltyModal(quest) {
  if (questHistory[quest] && questHistory[quest].penaltyCompleted) return;
  currentPenaltyQuest = quest;
  document.getElementById("penaltyModal").style.display = "flex";
}
function penaltyCompleted() {
  if (!questHistory[currentPenaltyQuest].penaltyCompleted) {
    // --- FIXED PENALTY LOGIC: Deduct current quest reward at current level ---
    const level = getLevelInfo(totalXP).level;
    const multiplier = getMoneyMultiplier(level);
    let penaltyAmount = 0;
    if (currentPenaltyQuest === "invites") {
      let invitesValue = questHistory["invites"] && questHistory["invites"].value ? questHistory["invites"].value : 25;
      penaltyAmount = customRound(invitesValue * 1 * multiplier);
    } else if (currentPenaltyQuest === "workout") {
      penaltyAmount = customRound(10 * multiplier);
    } else if (currentPenaltyQuest === "meditation") {
      penaltyAmount = customRound(10 * multiplier);
    }
    totalBalance = Math.max(totalBalance - penaltyAmount, 0);
    document.getElementById("total-balance").innerText = customRound(totalBalance);
    questHistory[currentPenaltyQuest].penaltyCompleted = true;
    updateLevelIndicator();
    showNotification("Penalty Quest for " + currentPenaltyQuest + " completed! -" + penaltyAmount + " deducted, +10 XP awarded.");
    totalXP += 10;
    updateLevelIndicator();
  }
  closePenaltyModal();
}
function closePenaltyModal() {
  document.getElementById("penaltyModal").style.display = "none";
}
function autoResetAt4AM() {
  let now = new Date();
  if (now.getHours() === 4 && now.getMinutes() === 0) {
    if (localStorage.getItem("lastResetDay") !== getResetDay()) {
      resetQuests();
      showNotification("Auto reset triggered at 4 a.m.");
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  scheduleReminder("07:00", "<b>A Hero never skips a Quest! Make it count!</b>");
  scheduleReminder("13:00", "Start your callings before 2:30 PM");
  scheduleReminder("15:00", "Complete 20 calls before 4:30 PM");

  document.getElementById("main-content").addEventListener("click", function(e) {
    if (!e.target.closest("#sidebar") && !e.target.closest("#menu-button")) {
      const sidebar = document.getElementById("sidebar");
      if (sidebar.style.left === "0px") {
        toggleSidebar();
      }
    }
  });

  setInterval(checkInvitationReminder, 60000);
  setInterval(checkDailyQuestDeadlines, 10000);
  setInterval(autoResetAt4AM, 60000);
});

function scheduleReminder(time, message) {
  let [hours, minutes] = time.split(":").map(Number);
  let now = new Date();
  let reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);
  let timeDiff = reminderTime - now;
  if (timeDiff > 0) {
    setTimeout(() => showNotification(message), timeDiff);
  }
}

function checkInvitationReminder() {
  let now = new Date();
  if (now.getHours() === 18 && !invitationReminderShown) {
    let inputField = document.getElementById("invites");
    let value = parseInt(inputField.value);
    if (value < 25) {
      showNotification("Complete 25 calls before 8:30 PM");
      invitationReminderShown = true;
    }
  }
}

function checkDailyQuestDeadlines() {
  const now = new Date();
  if ((!questHistory["workout"] || (!questHistory["workout"].completed && !questHistory["workout"].failed))
      && now.getHours() >= 12) {
    applyPenalty("workout", "<b>Workout Quest</b>: <span style='color:#ff6666;'>Failed</span>. Penalty Quest- Player must eat a spice immediately!");
    questHistory["workout"] = { failed: true };
    markDailyQuestFailed("workout");
  }
  if ((!questHistory["meditation"] || (!questHistory["meditation"].completed && !questHistory["meditation"].failed))
      && now.getHours() === 0) {
    applyPenalty("meditation", "<b>Meditation Quest</b>: <span style='color:#ff6666;'>Failed</span>. Penalty Quest- Player must eat a spice immediately!");
    questHistory["meditation"] = { failed: true };
    markDailyQuestFailed("meditation");
  }
  if ((!questHistory["invites"] || (!questHistory["invites"].notifiedEarly))
      && (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 30))
      && (now.getHours() < 20 || (now.getHours() === 20 && now.getMinutes() < 30))) {
    let inputField = document.getElementById("invites");
    let value = parseInt(inputField.value);
    if (value < 20) {
      showNotification("<b>Invitation Quest Phase 1</b>: <span style='color:#ff6666;'>Failed</span>. Penalty Quest- Player must eat half a spice for each failed condition immediately!");
      if (!questHistory["invites"]) questHistory["invites"] = {};
      questHistory["invites"].notifiedEarly = true;
    }
  }
  if ((!questHistory["invites"] || (!questHistory["invites"].completed && !questHistory["invites"].failed))
      && ((now.getHours() > 20) || (now.getHours() === 20 && now.getMinutes() >= 30))) {
    let inputField = document.getElementById("invites");
    let value = parseInt(inputField.value);
    if (value < 25) {
      applyPenalty("invites", "<b>Invitation Quest Phase 2</b>: <span style='color:#ff6666;'>Failed</span>. Penalty Quest- Player must eat a spice immediately!");
      if (!questHistory["invites"]) questHistory["invites"] = {};
      questHistory["invites"].failed = true;
      document.getElementById("invites-btn").disabled = true;
      markDailyQuestFailed("invites");
    } else {
      if (!questHistory["invites"]) questHistory["invites"] = {};
      questHistory["invites"].completed = true;
    }
  }
}

function completeQuest(quest, reward, xp, button) {
  if (questHistory[quest] && questHistory[quest].failed) {
    button.disabled = true;
    return;
  }
  const now = new Date();
  if (quest === "workout" && now.getHours() >= 12 && (!questHistory["workout"] || !questHistory["workout"].completed)) {
    applyPenalty("workout", "<b>Workout Quest</b>: <span style='color:#ff6666;'>Failed</span>. Penalty Quest- Player must eat a spice immediately!");
    questHistory["workout"] = { failed: true };
    markDailyQuestFailed("workout");
    button.disabled = true;
    return;
  }
  if (quest === "meditation" && now.getHours() === 0 && (!questHistory["meditation"] || !questHistory["meditation"].completed)) {
    applyPenalty("meditation", "<b>Meditation Quest</b>: <span style='color:#ff6666;'>Failed</span>. Penalty Quest- Player must eat a spice immediately!");
    questHistory["meditation"] = { failed: true };
    markDailyQuestFailed("meditation");
    button.disabled = true;
    return;
  }
  if (!questHistory[quest]) {
    totalXP += xp;
    totalBalance += reward * currentRewardMultiplier;
    questHistory[quest] = { reward: reward * currentRewardMultiplier, xp: xp, multiplier: currentRewardMultiplier, completed: true };
  }
  document.getElementById("total-balance").innerText = customRound(totalBalance);
  updateLevelIndicator();
  button.disabled = true;
  button.textContent = "Completed";
  if (quest === "workout" || quest === "meditation") {
    dailyQuestCompleted[quest] = true;
    checkDailyQuestsCompletion();
  }
  if (quest !== "workout" && quest !== "invites" && quest !== "meditation") {
    animateSideQuest(quest);
  }
  if (quest === "workout" || quest === "meditation") {
    showNotification("<b>Congratulations</b><br>The Player has finished <b>" +
      quest.charAt(0).toUpperCase() + quest.slice(1) +
      " Quest</b>! XP and Money rewarded.");
  }
}

function calculateQuestReward(quest, rewardPerUnit, xpPerUnit) {
  if (questHistory[quest] && questHistory[quest].failed) return;
  let inputField = document.getElementById(quest);
  let value = parseInt(inputField.value);
  if (isNaN(value)) return;
  let newReward, newXP;
  if (quest === "invites") {
    const now = new Date();
    if ((now.getHours() < 20) || (now.getHours() === 20 && now.getMinutes() < 30)) {
      if (value < 25) {
        inputField.classList.add("not-ready");
        return;
      } else {
        inputField.classList.remove("not-ready");
      }
    } else {
      if (value < 25) return;
    }
    let previousValue = (questHistory[quest] && questHistory[quest].value) ? questHistory[quest].value : 0;
    let xpAward = (previousValue === 0 ? 10 : 0);
    let newRewardTotal = customRound(value * rewardPerUnit * currentRewardMultiplier);
    let previousRewardTotal = (questHistory[quest] && questHistory[quest].reward) ? questHistory[quest].reward : 0;
    let deltaReward = newRewardTotal - previousRewardTotal;
    totalBalance += deltaReward;
    totalXP += xpAward;
    if (!questHistory[quest]) {
      questHistory[quest] = { value: 0, reward: 0, xp: 0, completed: false };
    }
    questHistory[quest].value = value;
    questHistory[quest].reward = newRewardTotal;
    if (!invitationCongratNotified) {
      invitationCongratNotified = true;
      showNotification("<b>Congratulations</b><br>The Player has finished <b>Invitation Quest</b>! XP and Money rewarded.");
    }
    dailyQuestCompleted.invites = true;
    checkDailyQuestsCompletion();
  } else {
    newReward = value * rewardPerUnit;
    newXP = value * xpPerUnit;
    if (!questHistory[quest] || (questHistory[quest] && questHistory[quest].completed)) {
      questHistory[quest] = { reward: 0, xp: 0, completed: false };
    }
    const calculatedReward = customRound(newReward * currentRewardMultiplier);
    totalBalance += calculatedReward - questHistory[quest].reward;
    totalXP += newXP - questHistory[quest].xp;
    questHistory[quest].reward = calculatedReward;
    questHistory[quest].xp = newXP;
  }
  document.getElementById("total-balance").innerText = customRound(totalBalance);
  updateLevelIndicator();
  if (quest !== "invites") {
    animateSideQuest(quest);
  }
}

function toAccount(pageUrl) {
  window.location.href = pageUrl;
}

function updateLevelIndicator() {
  const info = getLevelInfo(totalXP);
  const newLevel = info.level;
  const currentProgress = info.currentProgress;
  const xpNeeded = info.xpNeeded;
  document.getElementById("player-level").innerText = newLevel;
  document.getElementById("xp-progress").innerText = currentProgress;
  document.getElementById("xp-requirement").innerText = xpNeeded;
  const percent = Math.min((currentProgress / xpNeeded) * 100, 100);
  document.getElementById("level-meter-fill").style.width = percent + '%';
  if (newLevel > currentLevelGlobal) {
    showNotification("<b>LEVELED UP!</b><br>The rewards will be upgraded after Reset");
    currentLevelGlobal = newLevel;
  }
}

function updateQuestRewards() {
  const multiplier = currentRewardMultiplier;
  document.getElementById("reward_workout") && (document.getElementById("reward_workout").innerText = "₹" + customRound(10 * multiplier));
  document.getElementById("reward_invites") && (document.getElementById("reward_invites").innerText = "₹" + customRound(1 * multiplier) + " per invite");
  document.getElementById("reward_meditation") && (document.getElementById("reward_meditation").innerText = "₹" + customRound(10 * multiplier));
  document.getElementById("reward_hobby") && (document.getElementById("reward_hobby").innerText = "₹" + customRound(5 * multiplier));
  document.getElementById("reward_front_fu") && (document.getElementById("reward_front_fu").innerText = "₹" + customRound(2 * multiplier));
  document.getElementById("reward_team_fu") && (document.getElementById("reward_team_fu").innerText = "₹" + customRound(1 * multiplier));
  document.getElementById("reward_team_talk") && (document.getElementById("reward_team_talk").innerText = "₹" + customRound(1 * multiplier));
  document.getElementById("reward_enrollments") && (document.getElementById("reward_enrollments").innerText = "₹" + customRound(3 * multiplier));
  document.getElementById("reward_team_meeting") && (document.getElementById("reward_team_meeting").innerText = "₹" + customRound(4 * multiplier));
  document.getElementById("reward_fp_meeting") && (document.getElementById("reward_fp_meeting").innerText = "₹" + customRound(3 * multiplier));
  document.getElementById("reward_skill_development") && (document.getElementById("reward_skill_development").innerText = "₹" + customRound(3 * multiplier));
  document.getElementById("reward_learning") && (document.getElementById("reward_learning").innerText = "₹" + customRound(3 * multiplier));
  document.getElementById("reward_personal_brand") && (document.getElementById("reward_personal_brand").innerText = "₹" + customRound(5 * multiplier));
}

function resetQuests() {
  for (const key in questHistory) { delete questHistory[key]; }
  invitationCongratNotified = false;
  invitationReminderShown = false;
  dailyQuestCompleted.workout = false;
  dailyQuestCompleted.meditation = false;
  dailyQuestCompleted.invites = false;
  const questNames = ["workout", "invites", "meditation"];
  questNames.forEach(quest => {
    const questElem = document.getElementById("quest_" + quest);
    if (questElem) {
      questElem.style.color = "";
      questElem.style.cursor = "default";
      questElem.onclick = null;
    }
  });
  const buttons = document.querySelectorAll("button");
  buttons.forEach(btn => {
    if (btn.innerText === "Completed") {
      btn.disabled = false;
      if (btn.hasAttribute("onclick") && btn.getAttribute("onclick").includes("completeQuest")) {
        btn.textContent = "Complete";
      }
    }
  });
  const inputs = document.querySelectorAll("input[type='number']");
  inputs.forEach(input => {
    input.value = 0;
    input.classList.remove("not-ready");
  });
  localStorage.setItem("lastResetDay", getResetDay());
  currentRewardMultiplier = getMoneyMultiplier(getLevelInfo(totalXP).level);
  updateQuestRewards();
}

function updateDateTime() {
  const now = new Date();
  const dateOptions = { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric" };
  const timeOptions = { timeZone: "Asia/Kolkata", hour12: true, hour: "numeric", minute: "numeric", second: "numeric" };
  document.getElementById("current-date").innerText = now.toLocaleDateString("en-US", dateOptions);
  document.getElementById("current-time").innerText = now.toLocaleTimeString("en-US", timeOptions);
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    invitationReminderShown = false;
    resetStreakIfMissed();
  }
}
updateDateTime();
setInterval(updateDateTime, 1000);

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification-overlay";
  notification.innerHTML = message;
  document.body.appendChild(notification);
  setTimeout(() => { notification.remove(); }, 5000);
}

// Penalty now takes quest name and message
function applyPenalty(quest, questMessage) {
  const level = getLevelInfo(totalXP).level;
  const multiplier = getMoneyMultiplier(level);
  let penaltyAmount = 0;
  if (quest === "invites") {
    let invitesValue = questHistory["invites"] && questHistory["invites"].value ? questHistory["invites"].value : 25;
    penaltyAmount = customRound(invitesValue * 1 * multiplier);
  } else if (quest === "workout") {
    penaltyAmount = customRound(10 * multiplier);
  } else if (quest === "meditation") {
    penaltyAmount = customRound(10 * multiplier);
  }
  totalBalance = Math.max(totalBalance - penaltyAmount, 0);
  document.getElementById("total-balance").innerText = customRound(totalBalance);
  showNotification(questMessage + "<br>Penalty: -" + penaltyAmount + " balance.");
}

function checkInvites() {
  const inputField = document.getElementById("invites");
  const value = parseInt(inputField.value, 10);
  if (isNaN(value) || value < 25) {
    inputField.style.color = "red";
  } else {
    inputField.style.color = "";
  }
}

function openBalanceModal() {
  document.getElementById("balanceModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("balanceModal").style.display = "none";
  document.getElementById("adjustmentForm").style.display = "none";
  document.getElementById("modalButtons").style.display = "block";
}
function startBalanceAdjustment() {
  document.getElementById("modalButtons").style.display = "none";
  document.getElementById("adjustmentForm").style.display = "block";
}
function saveBalance() {
  let newBalance = parseFloat(document.getElementById("newBalanceInput").value);
  if (!isNaN(newBalance)) {
    totalBalance = newBalance;
    document.getElementById("total-balance").innerText = customRound(totalBalance);
  }
  closeModal();
}

setInterval(autoResetAt4AM, 60000);

function animateSideQuest(quest) {
  if (quest === "workout" || quest === "invites" || quest === "meditation") return;
  const card = document.getElementById("card_" + quest);
  if (!card) return;
  card.classList.add("floating");
  card.addEventListener("animationend", () => {
    card.classList.remove("floating");
    const container = document.getElementById("side-quests-container");
    if (container && container.firstChild !== card) {
      container.insertBefore(card, container.firstChild);
    }
  }, { once: true });
}

function toggleSidebar(e) {
  if (e) e.stopPropagation();
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  const overlay = document.getElementById("overlay");
  if (sidebar.style.left === "0px") {
    sidebar.style.left = "-80%";
    mainContent.classList.remove("blur");
    overlay.style.display = "none";
  } else {
    sidebar.style.left = "0px";
    mainContent.classList.add("blur");
    overlay.style.display = "block";
  }
}

// --- Load saved player icon on main page ---
document.addEventListener("DOMContentLoaded", () => {
  const savedIcon = localStorage.getItem("playerIcon");
  if (savedIcon) {
    // Update the sidebar/menu button
    const menuBtn = document.getElementById("menu-button");
    if (menuBtn) {
      menuBtn.src = savedIcon;
    }
    // Update any other .player-icon element if present
    const profileIcon = document.querySelector(".player-icon");
    if (profileIcon) {
      profileIcon.src = savedIcon;
    }
  }
});
