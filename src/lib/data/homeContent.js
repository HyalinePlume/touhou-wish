import { writable } from "svelte/store";

/** 首页文案和图片的默认值；图片值为可用于 CSS 的图片地址。 */
export const DEFAULT_HOME_CONTENT = Object.freeze({
  wishTitle: "东方杏坛铭 · 抽奖祈愿",
  wishSubtitle: "鸟类都喜欢亮晶晶的小玩意……人又何尝不是呢？",
  mainVisual: "/img/visual.png",
  backgroundImage: "/img/bg_pic.png",
});

export const wishTitle = writable(DEFAULT_HOME_CONTENT.wishTitle);
export const wishSubtitle = writable(DEFAULT_HOME_CONTENT.wishSubtitle);
export const mainVisual = writable(DEFAULT_HOME_CONTENT.mainVisual);
export const backgroundImage = writable(DEFAULT_HOME_CONTENT.backgroundImage);

const contentStores = { wishTitle, wishSubtitle, mainVisual, backgroundImage };
let loadPromise;

// 与奖品使用相同的 IndexedDB 机制，独立数据库保存文案和图片数据地址。
function transaction(mode, run) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("xtm_home_content", 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore("content");
    request.onerror = () => reject(request.error);
    request.onblocked = () => { blocked = true; reject(new Error("请关闭其他旧版页面后重试")); };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      let result;
      let failure;
      try {
        const tx = db.transaction("content", mode);
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onabort = () => { db.close(); reject(failure || tx.error || new Error("首页内容保存失败")); };
        try { run(tx.objectStore("content"), value => { result = value; }); }
        catch (cause) { failure = cause; tx.abort(); }
      } catch (cause) { db.close(); reject(cause); }
    };
  });
}

function applyContent(values) {
  for (const [key, store] of Object.entries(contentStores)) {
    if (typeof values?.[key] === "string") store.set(values[key]);
  }
}

/** 页面挂载时读取暂存内容；失败后允许重试。 */
export function loadHomeContent() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("当前环境无法访问浏览器存储"));
  if (!loadPromise) {
    loadPromise = transaction("readonly", (store, done) => {
      store.get("home").onsuccess = event => done(event.target.result);
    }).then(values => { applyContent(values); }).catch(cause => { loadPromise = undefined; throw cause; });
  }
  return loadPromise;
}

/** 只更新传入的字段。例如 setHomeContent({ wishTitle: "新的标题" })。 */
export async function setHomeContent(values) {
  values = { ...values };
  // 先检查所有字段，避免错误输入导致部分字段已被修改。
  for (const [key, value] of Object.entries(values)) {
    if (!Object.hasOwn(contentStores, key) || typeof value !== "string") {
      throw new TypeError(`无效的首页内容字段或值：${key}`);
    }
  }
  await loadHomeContent();
  const saved = await transaction("readwrite", (store, done) => {
    store.get("home").onsuccess = event => {
      const merged = { ...DEFAULT_HOME_CONTENT, ...event.target.result, ...values };
      store.put(merged, "home");
      done(merged);
    };
  });
  // 事务成功提交后才更新页面，避免把存储失败显示为保存成功。
  applyContent(saved);
}

/** 分别恢复单项内容，并返回默认值，供编辑框同步显示。 */
export async function resetWishTitle() {
  await setHomeContent({ wishTitle: DEFAULT_HOME_CONTENT.wishTitle });
  return DEFAULT_HOME_CONTENT.wishTitle;
}

export async function resetWishSubtitle() {
  await setHomeContent({ wishSubtitle: DEFAULT_HOME_CONTENT.wishSubtitle });
  return DEFAULT_HOME_CONTENT.wishSubtitle;
}

export async function resetMainVisual() {
  await setHomeContent({ mainVisual: DEFAULT_HOME_CONTENT.mainVisual });
  return DEFAULT_HOME_CONTENT.mainVisual;
}

export async function resetBackgroundImage() {
  await setHomeContent({ backgroundImage: DEFAULT_HOME_CONTENT.backgroundImage });
  return DEFAULT_HOME_CONTENT.backgroundImage;
}
