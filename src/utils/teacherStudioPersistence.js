const TEACHER_STUDIO_DB_NAME = "teacher-studio-db";
const TEACHER_STUDIO_DB_VERSION = 1;
const STORE_APP_STATE = "appState";
const STORE_BACKUPS = "backups";
const STORE_META = "meta";
const CURRENT_RECORD_ID = "current";

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionToPromise(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export function openTeacherStudioDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TEACHER_STUDIO_DB_NAME, TEACHER_STUDIO_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_APP_STATE)) {
        db.createObjectStore(STORE_APP_STATE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
        const backups = db.createObjectStore(STORE_BACKUPS, { keyPath: "id" });
        backups.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB"));
  });
}

export async function loadTeacherStudioCurrentSnapshot() {
  const db = await openTeacherStudioDb();
  try {
    const tx = db.transaction(STORE_APP_STATE, "readonly");
    const store = tx.objectStore(STORE_APP_STATE);
    const row = await requestToPromise(store.get(CURRENT_RECORD_ID));
    return row?.snapshot ?? null;
  } finally {
    db.close();
  }
}

export async function saveTeacherStudioCurrentSnapshot(snapshot) {
  const db = await openTeacherStudioDb();
  const next = {
    ...snapshot,
    savedAt: snapshot?.savedAt ?? new Date().toISOString(),
  };
  try {
    const tx = db.transaction(STORE_APP_STATE, "readwrite");
    tx.objectStore(STORE_APP_STATE).put({
      id: CURRENT_RECORD_ID,
      savedAt: next.savedAt,
      snapshot: next,
    });
    await transactionToPromise(tx);
    return next;
  } finally {
    db.close();
  }
}

export async function saveTeacherStudioRollingBackup(snapshot, reason = "manual") {
  const db = await openTeacherStudioDb();
  const createdAt = new Date().toISOString();
  const record = {
    id: `rb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    reason: String(reason || "manual"),
    snapshot: {
      ...snapshot,
      savedAt: snapshot?.savedAt ?? createdAt,
    },
  };
  try {
    const tx = db.transaction(STORE_BACKUPS, "readwrite");
    tx.objectStore(STORE_BACKUPS).put(record);
    await transactionToPromise(tx);
    return record;
  } finally {
    db.close();
  }
}

export async function listTeacherStudioRollingBackups() {
  const db = await openTeacherStudioDb();
  try {
    const tx = db.transaction(STORE_BACKUPS, "readonly");
    const store = tx.objectStore(STORE_BACKUPS);
    const index = store.index("createdAt");
    const records = [];
    await new Promise((resolve, reject) => {
      const cursorReq = index.openCursor(null, "prev");
      cursorReq.onerror = () => reject(cursorReq.error ?? new Error("Unable to read backups"));
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve();
          return;
        }
        records.push(cursor.value);
        cursor.continue();
      };
    });
    return records;
  } finally {
    db.close();
  }
}

export async function deleteTeacherStudioRollingBackup(id) {
  if (!id) return;
  const db = await openTeacherStudioDb();
  try {
    const tx = db.transaction(STORE_BACKUPS, "readwrite");
    tx.objectStore(STORE_BACKUPS).delete(id);
    await transactionToPromise(tx);
  } finally {
    db.close();
  }
}

export async function restoreTeacherStudioRollingBackup(snapshot) {
  return saveTeacherStudioCurrentSnapshot(snapshot);
}

export async function migrateTeacherStudioLocalStorageToIndexedDbIfNeeded(snapshotFromLocalStorage) {
  const db = await openTeacherStudioDb();
  try {
    const readTx = db.transaction(STORE_APP_STATE, "readonly");
    const current = await requestToPromise(readTx.objectStore(STORE_APP_STATE).get(CURRENT_RECORD_ID));
    if (current?.snapshot) {
      return { migrated: false, reason: "current-exists" };
    }
  } finally {
    db.close();
  }
  if (!snapshotFromLocalStorage || typeof snapshotFromLocalStorage !== "object") {
    return { migrated: false, reason: "no-local-snapshot" };
  }
  const saved = await saveTeacherStudioCurrentSnapshot(snapshotFromLocalStorage);
  const db2 = await openTeacherStudioDb();
  try {
    const tx = db2.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put({
      key: "localStorageMigratedAt",
      value: new Date().toISOString(),
    });
    await transactionToPromise(tx);
  } finally {
    db2.close();
  }
  return { migrated: true, snapshot: saved };
}

export async function maybePruneTeacherStudioRollingBackups(maxCount) {
  const keep = Math.max(1, Number(maxCount) || 10);
  const backups = await listTeacherStudioRollingBackups();
  if (backups.length <= keep) return backups.length;
  const doomed = backups.slice(keep);
  await Promise.all(doomed.map((b) => deleteTeacherStudioRollingBackup(b.id)));
  return keep;
}
