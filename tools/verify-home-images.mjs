import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { get } from "svelte/store";
import { prepareHomeImage, createHomeImageView } from "../src/lib/helpers/homeImages.js";

// 模拟浏览器解码、Canvas 和 IndexedDB，验证数据迁移及资源生命周期。
const liveUrls = new Set();
const frames = [];
let serial = 0;
let decodes = 0;
let dimensions;
URL.createObjectURL = () => { const url = `blob:test-${++serial}`; liveUrls.add(url); return url; };
URL.revokeObjectURL = url => liveUrls.delete(url);
globalThis.requestAnimationFrame = callback => frames.push(callback);
globalThis.Image = class {
  naturalWidth = 6000;
  naturalHeight = 4000;
  async decode() { decodes++; if (this.src === "bad") throw Error("decode failed"); }
};
globalThis.document = {
  createElement() {
    return {
      getContext: () => ({ drawImage() {} }),
      toBlob(callback) { dimensions = [this.width, this.height]; callback(new Blob(["thumbnail"], { type: "image/webp" })); }
    };
  }
};
const original = new Blob(["original"], { type: "image/png" });
const prepared = await prepareHomeImage({ blob: original, name: "large.png" });
assert.equal(prepared.blob, original);
assert.deepEqual(dimensions, [480, 320]);
assert.equal(await prepareHomeImage(prepared), prepared);
assert.equal(decodes, 1, "缓存缩略图后不再解码原图");
assert.equal(liveUrls.size, 0, "生成缩略图后释放解码地址");
const view = createHomeImageView(prepared);
assert.notEqual(view.url, view.preview);
assert.equal(liveUrls.size, 2);
view.dispose();
assert.equal(liveUrls.size, 0);

let saved = { wishTitle: "旧标题", mainVisual: "data:image/png;base64,b2xk", backgroundImage: "/background.png" };
let reads = 0;
let failWrite = false;
globalThis.indexedDB = {
  open() {
    const request = {};
    queueMicrotask(() => {
      request.result = {
        close() {},
        transaction() {
          const tx = {
            objectStore() {
              return {
                get() {
                  reads++;
                  const result = {};
                  queueMicrotask(() => {
                    result.onsuccess({ target: { result: structuredClone(saved) } });
                    if (failWrite) { tx.error = Error("quota"); tx.onabort(); }
                    else tx.oncomplete();
                  });
                  return result;
                },
                put(value) { if (!failWrite) saved = structuredClone(value); }
              };
            }
          };
          return tx;
        }
      };
      request.onsuccess();
    });
    return request;
  }
};
const source = (await readFile(new URL("../src/lib/data/homeContent.js", import.meta.url), "utf8"))
  .replace('"$lib/helpers/homeImages.js"', JSON.stringify(new URL("../src/lib/helpers/homeImages.js", import.meta.url).href))
  .replace('"svelte/store"', JSON.stringify(import.meta.resolve("svelte/store")));
const content = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
await content.loadHomeContent();
assert.ok(content.getHomeImage("mainVisual").value.blob instanceof Blob);
assert.ok(get(content.mainVisual).startsWith("blob:"));
const decodedAfterLoad = decodes;
await content.loadHomeContent();
assert.equal(reads, 1, "重复打开不重新读库");
assert.equal(decodes, decodedAfterLoad, "重复打开不重新生成缩略图");
await content.setHomeContent({ wishTitle: "新标题" });
assert.ok(saved.mainVisual.blob instanceof Blob, "保存时迁移旧 Base64");
assert.ok(saved.mainVisual.thumbnail instanceof Blob);
assert.equal(await saved.mainVisual.blob.text(), "old", "原图内容保留");
assert.equal(get(content.wishTitle), "新标题");
const savedView = content.getHomeImage("mainVisual");
const draftView = createHomeImageView(prepared);
draftView.dispose();
assert.equal(content.getHomeImage("mainVisual"), savedView, "取消草稿不影响已保存图片");
failWrite = true;
await assert.rejects(content.setHomeContent({ mainVisual: prepared }));
assert.equal(content.getHomeImage("mainVisual"), savedView, "保存失败不替换首页图片");
failWrite = false;
await content.setHomeContent({ mainVisual: prepared });
assert.equal(saved.mainVisual.name, "large.png");
await content.resetMainVisual();
frames.splice(0).forEach(callback => callback());
assert.equal(get(content.mainVisual), content.DEFAULT_HOME_CONTENT.mainVisual);
assert.equal(saved.mainVisual, content.DEFAULT_HOME_CONTENT.mainVisual);
assert.equal(liveUrls.size, 0, "替换、取消及恢复默认后释放图片地址");
await assert.rejects(content.setHomeContent({ mainVisual: "blob:invalid" }));
console.log("PASS: 原图保留、缩略图缓存、旧数据迁移、重复打开、取消草稿、保存失败、恢复默认、URL 释放");
