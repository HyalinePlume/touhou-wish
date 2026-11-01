import { browser } from "$app/environment";

// tier 是固定的动画等级；customTitle 仅用于显示，不改变等级。
export const PRIZE_TIERS = [
  { value: "special", label: "特等奖", stars: 6 },
  { value: "first", label: "一等奖", stars: 5 },
  { value: "second", label: "二等奖", stars: 4 },
  { value: "third", label: "三等奖", stars: 3 }
];
const DB_NAME = "xtm_prizes";
const STORE_NAME = "prizes";
const MAX_PRIZES = 20;

export function prizeTitle(prize) {
  return prize.customTitle?.trim() || PRIZE_TIERS.find(t => t.value === prize.tier)?.label || "三等奖";
}

export function prizeStars(prize) {
  return PRIZE_TIERS.find(t => t.value === prize.tier)?.stars || 3;
}

function metadata(input = {}) {
  if (!PRIZE_TIERS.some(t => t.value === input.tier)) throw new Error("请选择奖品类型");
  const name = input.name?.trim();
  const customTitle = input.customTitle?.trim() || "";
  if (!name) throw new Error("请输入奖品名称");
  if (name.length > 100 || customTitle.length > 30) throw new Error("奖品名称最多 100 字，称号最多 30 字");
  return { name, tier: input.tier, customTitle, title: prizeTitle({ tier: input.tier, customTitle }) };
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    let blocked = false;
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.objectStoreNames.contains(STORE_NAME)
        ? req.transaction.objectStore(STORE_NAME)
        : db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      if (!store.indexNames.contains("tier")) store.createIndex("tier", "tier");
      // 保留已有图片、名称、ID 和时间，补齐等级、自定义称号及实际称号。
      store.openCursor().onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) return;
        const tier = cursor.value.tier || "third";
        const customTitle = cursor.value.customTitle || "";
        cursor.update({ ...cursor.value, tier, customTitle, title: prizeTitle({ tier, customTitle }) });
        cursor.continue();
      };
    };
    req.onsuccess = () => {
      const db = req.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => { blocked = true; reject(new Error("请关闭其他旧版站点标签页，再刷新重试")); };
  });
}

// 写入操作只有事务真正提交后才报告成功，并在每次操作后关闭连接。
async function transaction(mode, run) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    let result;
    let failure;
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = () => { db.close(); reject(failure || tx.error || new Error("奖品保存失败")); };
    const fail = error => { failure = error; tx.abort(); };
    try { run(tx.objectStore(STORE_NAME), value => { result = value; }, fail); }
    catch (error) { fail(error); }
  });
}

export async function uploadPrize(file, input) {
  if (!browser) return;
  const fields = metadata(input);
  if (!file?.type?.startsWith("image/")) throw new Error("请选择图片文件");
  return transaction("readwrite", (store, done, fail) => {
    store.count().onsuccess = event => {
      if (event.target.result >= MAX_PRIZES) return fail(new Error("最多只能保存 20 件奖品，请先删除旧奖品"));
      const record = { ...fields, blob: file, timestamp: Date.now() };
      store.add(record).onsuccess = event => done({ ...record, id: event.target.result });
    };
  });
}

export async function updatePrize(id, input) {
  if (!browser) return;
  const fields = metadata(input);
  return transaction("readwrite", (store, done, fail) => {
    store.get(id).onsuccess = event => {
      if (!event.target.result) return fail(new Error("该奖品已不存在，请刷新列表"));
      const record = { ...event.target.result, ...fields };
      store.put(record).onsuccess = () => done(record);
    };
  });
}

export async function listPrizes() {
  if (!browser) return [];
  return transaction("readonly", (store, done) => {
    store.getAll().onsuccess = event => done(event.target.result.map(({ blob, ...fields }) => fields));
  });
}

export async function getPrizeBlob(id) {
  if (!browser) return null;
  return transaction("readonly", (store, done) => {
    store.get(id).onsuccess = event => done(event.target.result || null);
  });
}

export async function deletePrize(id) {
  if (!browser) return;
  return transaction("readwrite", (store, done) => {
    store.delete(id).onsuccess = () => done();
  });
}

