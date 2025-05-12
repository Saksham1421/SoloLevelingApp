export let totalXP = 0;
export function setTotalXP(newTotalXP) {
  totalXP = newTotalXP;
}

export let totalBalance = 0;
export function setTotalBalance(newTotalBalance) {
  totalBalance = newTotalBalance;
}

export const questHistory = {};
export function updateQuestHistory(quest, data) {
  questHistory[quest] = data;
}

export const dailyQuestCompleted = { workout: false, meditation: false, invites: false };
export function setDailyQuestCompleted(quest, completed) {
  dailyQuestCompleted[quest] = completed;
}

export let streak = parseInt(localStorage.getItem('streak') || '0', 10);
export function setStreak(newStreak) {
  streak = newStreak;
}

export let lastCompletionDate = localStorage.getItem('lastCompletionDate') || '';
export function setLastCompletionDate(newDate) {
  lastCompletionDate = newDate;
}

export let invitationCongratNotified = false;
export function setInvitationCongratNotified(isNotified) {
  invitationCongratNotified = isNotified;
}

export let invitationReminderShown = false;
export function setInvitationReminderShown(isShown) {
  invitationReminderShown = isShown;
}

export let currentPenaltyQuest = '';
export function setCurrentPenaltyQuest(quest) {
  currentPenaltyQuest = quest;
}

export function getLevelInfo(xp) {
  let level = 1, xpNeeded = 100, cumulative = xpNeeded;
  while (xp >= cumulative) {
    level++;
    xpNeeded = level <= 6 ? Math.ceil(xpNeeded * 1.5) : Math.ceil(xpNeeded * 1.2);
    cumulative += xpNeeded;
  }
  const currentProgress = xp - (cumulative - xpNeeded);
  return { level, currentProgress, xpNeeded };
}

export function getMoneyMultiplier(level) {
  return Math.round(Math.pow(1.2, level - 1) * 10) / 10;
}

export function resetQuests() {
  Object.keys(questHistory).forEach(key => delete questHistory[key]);
  setInvitationCongratNotified(false);
  setInvitationReminderShown(false);
  setDailyQuestCompleted('workout', false);
  setDailyQuestCompleted('meditation', false);
  setDailyQuestCompleted('invites', false);
  localStorage.setItem('lastResetDay', new Date().toISOString().split('T')[0]);
}