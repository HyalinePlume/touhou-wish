import { PRIZE_TIERS } from "./prizes.js";
import { drawOne } from "./characters.js";

const DB_NAME = "xtm_wish_history";
const STORE_NAME = "records";

function recordPrizeTitle(record) {
  return record.prizeTitle?.trim()
    || (record.prizeName === "暂未指定奖品" ? "未指定奖品" : PRIZE_TIERS.find(tier => tier.stars === record.stars)?.label)
    || "三等奖";
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    let blocked = false;
    request.onupgradeneeded = () => {
      const store = request.result.objectStoreNames.contains(STORE_NAME)
        ? request.transaction.objectStore(STORE_NAME)
        : request.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      // 旧记录未保存称号，按当时星级补默认称号，保留其他历史字段。
      store.openCursor().onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) return;
        cursor.update({ ...cursor.value, prizeTitle: recordPrizeTitle(cursor.value) });
        cursor.continue();
      };
    };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("请关闭其他旧版页面，再重试"));
    };
  });
}

async function transaction(mode, run) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    let result;
    let failure;
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = () => { db.close(); reject(failure || tx.error || new Error("祈愿记录保存失败")); };
    const fail = error => { failure = error; tx.abort(); };
    try { run(tx.objectStore(STORE_NAME), value => { result = value; }, fail); }
    catch (error) { fail(error); }
  });
}

export function saveWishRecord(record) {
  return transaction("readwrite", (store, done) => {
    // 保存抽取时的文本与数值，奖品后续更名或删除不会改变历史。
    const snapshot = {
      prizeName: record.prizeName,
      prizeTitle: recordPrizeTitle(record),
      stars: record.stars,
      characterName: record.characterName,
      villagerCount: record.villagerCount,
      drawnAt: record.drawnAt
    };
    store.add(snapshot).onsuccess = event => done({ ...snapshot, id: event.target.result });
  });
}

// 同一读写事务内读取历史、抽取并保存，多个标签页也不会重复抽中。
export function drawAndSaveWishRecord(record) {
  return transaction("readwrite", (store, done, fail) => {
    store.getAll().onsuccess = event => {
      try {
        const character = drawOne(event.target.result, record.villagerCount);
        const snapshot = {
          prizeName: record.prizeName,
          prizeTitle: recordPrizeTitle(record),
          stars: record.stars,
          characterName: character.name,
          villagerCount: record.villagerCount,
          drawnAt: record.drawnAt
        };
        store.add(snapshot).onsuccess = () => done(character);
      } catch (error) { fail(error); }
    };
  });
}

export async function listWishRecords() {
  const records = await transaction("readonly", (store, done) => {
    store.getAll().onsuccess = event => done(event.target.result);
  });
  return records.sort((a, b) => b.drawnAt - a.drawnAt || b.id - a.id);
}

export function resetWishRecords() {
  return transaction("readwrite", store => { store.clear(); });
}

export function formatDrawTime(timestamp) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).format(new Date(timestamp));
}
