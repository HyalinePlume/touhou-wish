<script>
  import { get } from "svelte/store";
  import DialogCloseButton from "$lib/components/DialogCloseButton.svelte";
  import { wishTitle, wishSubtitle, mainVisual, backgroundImage, loadHomeContent, setHomeContent, resetWishTitle, resetWishSubtitle, resetMainVisual, resetBackgroundImage } from "$lib/data/homeContent.js";

  let dialog;
  let draft = $state({ wishTitle: "", wishSubtitle: "", mainVisual: "", backgroundImage: "" });
  let error = $state("");
  let loading = $state(false);
  let session = 0;
  let visualInput;
  let backgroundInput;

  function loadCurrent() {
    draft = { wishTitle: get(wishTitle), wishSubtitle: get(wishSubtitle), mainVisual: get(mainVisual), backgroundImage: get(backgroundImage) };
    error = "";
    visualInput.value = "";
    backgroundInput.value = "";
  }

  export async function open() {
    const currentSession = ++session;
    loading = true;
    loadCurrent();
    dialog.showModal();
    try {
      await loadHomeContent();
      if (session === currentSession) loadCurrent();
    } catch {
      if (session === currentSession) error = "暂存内容读取失败，请关闭窗口后重试。";
    } finally {
      if (session === currentSession) loading = false;
    }
  }

  async function selectImage(event, key) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      error = "请选择图片文件。";
      return;
    }
    const currentSession = session;
    error = "";
    loading = true;
    try {
      const source = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("图片读取失败，请重新选择。"));
        reader.readAsDataURL(file);
      });
      if (session === currentSession) draft[key] = source;
    } catch (cause) {
      if (session === currentSession) error = cause.message;
    } finally {
      if (session === currentSession) loading = false;
    }
  }

  async function save(event) {
    event.preventDefault();
    if (loading) return;
    const currentSession = session;
    loading = true;
    error = "";
    try {
      await setHomeContent({ ...draft });
      if (session === currentSession) dialog.close();
    } catch {
      if (session === currentSession) error = "保存失败，请检查浏览器存储空间或权限后重试。";
    } finally {
      if (session === currentSession) loading = false;
    }
  }

  async function restore(key, reset) {
    const currentSession = session;
    loading = true;
    error = "";
    try {
      const value = await reset();
      if (session !== currentSession) return;
      draft[key] = value;
      if (key === "mainVisual") visualInput.value = "";
      if (key === "backgroundImage") backgroundInput.value = "";
    } catch {
      if (session === currentSession) error = "恢复默认值失败，请检查浏览器存储空间或权限后重试。";
    } finally {
      if (session === currentSession) loading = false;
    }
  }

</script>

<dialog bind:this={dialog} aria-labelledby="home-editor-title" onclose={() => { session++; }}>
  <form onsubmit={save}>
    <header>
      <h2 id="home-editor-title">编辑首页内容</h2>
      <DialogCloseButton label="关闭编辑窗口" onclick={() => dialog.close()} />
    </header>
    <div class="scroll-content">
    <div class="fields">
      <div class="field-heading">
        <label for="home-wish-title">标题</label>
        <button class="restore" type="button" disabled={loading} onclick={() => restore("wishTitle", resetWishTitle)}>恢复默认值</button>
      </div>
      <input id="home-wish-title" type="text" disabled={loading} bind:value={draft.wishTitle} />
      <div class="field-heading">
        <label for="home-wish-subtitle">副标题</label>
        <button class="restore" type="button" disabled={loading} onclick={() => restore("wishSubtitle", resetWishSubtitle)}>恢复默认值</button>
      </div>
      <textarea id="home-wish-subtitle" rows="3" disabled={loading} bind:value={draft.wishSubtitle}></textarea>
      <div class="image-fields">
      <fieldset>
        <legend>主视觉图</legend>
        <div class="field-heading">
          <label for="home-main-visual">图片地址</label>
          <button class="restore" type="button" disabled={loading} onclick={() => restore("mainVisual", resetMainVisual)}>恢复默认值</button>
        </div>
        <input id="home-main-visual" type="text" disabled={loading} bind:value={draft.mainVisual} placeholder="输入图片地址，或选择本地图片" />
        <label class="file-label" for="home-visual-file">选择本地图片</label>
        <input id="home-visual-file" type="file" accept="image/*" bind:this={visualInput} disabled={loading} onchange={(event) => selectImage(event, "mainVisual")} />
        {#if draft.mainVisual}<img class="preview" src={draft.mainVisual} alt="主视觉图预览" />{/if}
      </fieldset>
      <fieldset>
        <legend>背景图</legend>
        <div class="field-heading">
          <label for="home-background">图片地址</label>
          <button class="restore" type="button" disabled={loading} onclick={() => restore("backgroundImage", resetBackgroundImage)}>恢复默认值</button>
        </div>
        <input id="home-background" type="text" disabled={loading} bind:value={draft.backgroundImage} placeholder="输入图片地址，或选择本地图片" />
        <label class="file-label" for="home-background-file">选择本地图片</label>
        <input id="home-background-file" type="file" accept="image/*" bind:this={backgroundInput} disabled={loading} onchange={(event) => selectImage(event, "backgroundImage")} />
        {#if draft.backgroundImage}<img class="preview" src={draft.backgroundImage} alt="背景图预览" />{/if}
      </fieldset>
      </div>
    </div>
    <p class="note">内容保存后会暂存在当前浏览器，不会因刷新而重置</p>
    <p class="note"></p>
    {#if loading}<p role="status">正在处理，请稍候…</p>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    </div>
    <footer>
      <button type="button" onclick={() => dialog.close()}>取消</button>
      <button class="primary" type="submit" disabled={loading}>保存</button>
    </footer>
  </form>
</dialog>

<style>
  dialog { position: fixed; inset: 0; margin: auto; width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: hidden; padding: 0; border: 1px solid #dfbf8e; border-radius: 20px; background: #f7efdf; color: #594632; box-shadow: 0 24px 80px #0005; }
  form { display: flex; flex-direction: column; max-height: calc(100dvh - 34px); }
  .scroll-content { min-height: 0; overflow-y: auto; padding: 4px 28px 0; }
  dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 28px 28px 16px; flex-shrink: 0; }
  h2 { margin: 0; font-size: 1.35rem; color: #9a592b; }
  button, input, textarea { font: inherit; }
  button { border: 1px solid #dfbf8e; border-radius: 20px; padding: 9px 16px; background: #eadac0; color: #784923; cursor: pointer; }
  button:hover { background: #e3cba7; }
  .fields { display: grid; gap: 10px; }
  .image-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  label, legend { font-size: .9rem; font-weight: 600; }
  input[type="text"], textarea { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid #d8bd96; border-radius: 8px; background: #fffbf3; color: #594632; }
  textarea { resize: vertical; }
  fieldset { min-width: 0; display: grid; gap: 10px; margin: 8px 0 0; padding: 14px; border: 1px solid #dfbf8e; border-radius: 10px; }
  legend { padding: 0 6px; color: #9a592b; }
  input[type="file"] { width: 100%; min-width: 0; font-size: .8rem; }
  .file-label { font-size: .8rem; font-weight: 400; }
  .preview { display: block; width: 100%; height: 120px; object-fit: contain; border-radius: 6px; background: #eadac0; }
  .note { font-size: .78rem; line-height: 1.7; color: #89745b; margin: 8px 0; }
  .error { color: #b13928; }
  footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 28px 24px; border-top: 1px solid #dfbf8e; background: #f7efdf; flex-shrink: 0; }
  .field-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .restore { padding: 5px 10px; font-size: .78rem; white-space: nowrap; }
  .primary { background: #bc7338; color: #fff4e2; border-color: #bc7338; }
  .primary:hover { background: #a9622e; }
  button:disabled { opacity: .5; cursor: wait; }
  button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #dc904d; outline-offset: 3px; }
  @media (max-width: 700px) {
    header { padding: 20px 20px 16px; }
    .scroll-content { padding: 4px 20px 0; }
    footer { padding: 14px 20px 20px; }
  }
</style>
