// src/services/storageLocal.js

const KEY = 'mindlink_history';

// Zapisz nowy wpis nastroju (najnowszy na górze)
export function saveMoodLocal(entry) {
  const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
  arr.unshift(entry); // najnowszy pierwszy
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 100)));
}

// Pobierz całą historię lokalnie (używane w History.jsx)
export function listMoodsLocal() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

// Alias, jeśli gdzieś indziej użyjesz tej nazwy
export function getHistoryLocal() {
  return listMoodsLocal();
}


