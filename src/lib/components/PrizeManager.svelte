<script>
  import { onMount, onDestroy } from 'svelte';
  import { PRIZE_TIERS, prizeTitle, prizeStars, uploadPrize, updatePrize, listPrizes, getPrizeBlob, deletePrize } from '$lib/data/prizes.js';

  let { onSpecify = () => {} } = $props();
  let prizes = $state([]);
  let selected = $state(null);
  let specifiedId = $state(null);
  let preview = $state('');
  let editing = $state(false);
  let editingId = $state(null);
  let name = $state('');
  let tier = $state('');
  let customTitle = $state('');
  let file = $state(null);
  let busy = $state(false);
  let message = $state('');
  let error = $state(false);
  let fileInput = $state();
  let selectionVersion = 0;
  let alive = true;
  const defaultTitle = $derived(PRIZE_TIERS.find(t => t.value === tier)?.label || '先选择奖品类型');

  function notify(text, failed = false) { message = text; error = failed; }
  function setPreview(blob) {
    if (preview) URL.revokeObjectURL(preview);
    preview = blob ? URL.createObjectURL(blob) : '';
  }
  async function refresh() { prizes = await listPrizes(); }
  onMount(() => { refresh().catch(err => notify(err.message || '无法读取奖品', true)); });
  onDestroy(() => { alive = false; selectionVersion++; if (preview) URL.revokeObjectURL(preview); });

  async function select(id) {
    if (busy) return;
    const version = ++selectionVersion;
    try {
      const prize = await getPrizeBlob(id);
      if (!alive || version !== selectionVersion) return;
      selected = prize;
      setPreview(prize?.blob);
      notify(prize ? '' : '该奖品已不存在');
    } catch (err) { notify(err.message || '读取失败', true); }
  }
  function add() {
    selectionVersion++;
    editing = true;
    editingId = null;
    name = ''; tier = ''; customTitle = ''; file = null;
    setPreview(null);
    notify('');
  }
  function edit() {
    if (!selected) return;
    editingId = selected.id;
    name = selected.name; tier = selected.tier; customTitle = selected.customTitle;
    editing = true;
    notify('');
  }
  function chooseFile(event) {
    const candidate = event.target.files?.[0];
    if (!candidate) return;
    if (!candidate.type.startsWith('image/')) { notify('请选择图片文件', true); return; }
    file = candidate;
    if (!name.trim()) name = candidate.name.slice(0, 100);
    setPreview(candidate);
    notify('');
    event.target.value = '';
  }
  function cancel() {
    editing = false;
    file = null;
    setPreview(selected?.blob);
    notify('');
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (editingId === null && !file) { notify('请先选择奖品图片', true); return; }
    busy = true;
    try {
      const fields = { name, tier, customTitle };
      const prize = editingId === null ? await uploadPrize(file, fields) : await updatePrize(editingId, fields);
      selected = prize;
      setPreview(prize.blob);
      editing = false;
      file = null;
      if (specifiedId === prize.id) onSpecify(prize);
      await refresh();
      notify('已保存：' + prize.name);
    } catch (err) { notify(err.message || '保存失败，请重试', true); }
    finally { busy = false; }
  }
  function specify() {
    if (!selected) return;
    specifiedId = specifiedId === selected.id ? null : selected.id;
    onSpecify(specifiedId === null ? null : selected);
    notify(specifiedId === null ? '已取消指定' : '已指定：' + selected.name);
  }
  async function remove() {
    if (!selected || busy) return;
    busy = true;
    try {
      await deletePrize(selected.id);
      if (specifiedId === selected.id) { specifiedId = null; onSpecify(null); }
      selected = null;
      setPreview(null);
      await refresh();
      notify('已删除奖品');
    } catch (err) { notify(err.message || '删除失败', true); }
    finally { busy = false; }
  }
</script>

<div class="manager">
  {#if editing}
    <form onsubmit={save}>
      <div class="editor">
        <div class="preview">
          <img src={preview || '/img/gift_default.png'} alt="奖品图片预览" />
          {#if editingId === null}
            <input bind:this={fileInput} class="file-input" type="file" accept="image/*" onchange={chooseFile} />
            <button type="button" disabled={busy} onclick={() => fileInput?.click()}>选择图片</button>
          {/if}
        </div>
        <div class="fields">
          <label>奖品名称<input required maxlength="100" bind:value={name} disabled={busy} placeholder="例如：灵梦挂件" /></label>
          <label>奖品类型<select aria-label="奖品类型" required bind:value={tier} disabled={busy} class:placeholder={!tier}>
            <option value="" disabled hidden>请选择等级</option>
            {#each PRIZE_TIERS as option}<option value={option.value}>{option.label} - {'⭐'.repeat(option.stars)}</option>{/each}
          </select></label>
          <label>自定义称号<input maxlength="30" bind:value={customTitle} disabled={busy} placeholder={tier ? '留空则默认为' + defaultTitle : '留空则默认为x等奖'} /></label>
        </div>
      </div>
      <div class="toolbar">
        <span class="hint">称号：{customTitle.trim() || defaultTitle}</span>
        <button type="button" disabled={busy} onclick={cancel}>取消</button>
        <button type="submit" disabled={busy}>{busy ? '保存中…' : '保存奖品'}</button>
      </div>
    </form>
  {:else}
    <div class="toolbar">
      <span class="hint">{prizes.length} / 20 件</span>
      <button disabled={busy} onclick={add}>新增奖品</button>
      <button disabled={busy || !selected} onclick={edit}>编辑 / 重命名</button>
    </div>
    <div class="catalog">
      <div class="preview">
        <img src={preview || '/img/gift_default.png'} alt="奖品图片预览" />
        <span class="preview-title">{selected ? prizeTitle(selected) : '选择奖品预览'}</span>
      </div>
      <div class="prize-list" aria-label="奖品列表">
        {#each prizes as prize (prize.id)}
          <button class="prize-row" class:selected={selected?.id === prize.id} disabled={busy} aria-pressed={selected?.id === prize.id} onclick={() => select(prize.id)}>
            <span class="prize-text"><span>{prize.name}</span><small>{prizeTitle(prize)}{specifiedId === prize.id ? ' · 当前指定' : ''}</small></span>
            <span class="stars" aria-label={prizeStars(prize) + '星'} title={prizeStars(prize) + '星'}>{'★'.repeat(prizeStars(prize))}</span>
          </button>
        {:else}<p class="empty">暂无奖品，点击“新增奖品”添加。</p>{/each}
      </div>
    </div>
  {/if}
  <div class="footer">
    <p class="message" class:error role="status" aria-live="polite" title={message}>{message}</p>
    {#if !editing}
      <div class="toolbar bottom">
        <button disabled={busy || !selected} onclick={specify}>{selected && specifiedId === selected.id ? '取消指定' : '指定奖品'}</button>
        <button disabled={busy || !selected} onclick={remove}>删除奖品</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .manager { flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  button, input, select { font: inherit; font-size: 0.75rem; border: 1px solid rgba(180,160,120,.4); border-radius: 4px; }
  button { color: #e4ce98; background: #293d49; padding: .3rem .55rem; cursor: pointer; }
  button:hover:not(:disabled) { background: #3c5360; }
  button:disabled { opacity: .45; cursor: default; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #e4ce98; outline-offset: 2px; }
  .toolbar { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
  .hint { flex: 1; min-width: 0; font-size: .7rem; color: #c8beaa; overflow-wrap: anywhere; }
  .catalog, .editor { display: grid; grid-template-columns: 95px minmax(0,1fr); gap: .7rem; min-height: 0; }
  .catalog { flex: 1; }
  .preview { min-width: 0; display: flex; flex-direction: column; gap: .35rem; align-items: stretch; }
  .preview img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 4px; background: rgba(0,0,0,.2); }
  .preview-title { font-size: .7rem; color: #e4ce98; text-align: center; overflow-wrap: anywhere; }
  .prize-list { overflow-y: auto; min-height: 0; }
  .prize-row { width: 100%; text-align: left; display: flex; align-items: center; justify-content: space-between; gap: .5rem; background: transparent; border-color: transparent; margin-top: .15rem; overflow-wrap: anywhere; }
  .prize-text { display: flex; flex-direction: column; min-width: 0; }
  .stars { flex-shrink: 0; white-space: nowrap; color: #f6d77b; font-size: .8rem; letter-spacing: .05em; }
  .prize-row.selected { background: #40515a; border-color: #d4b87a; }
  small { font-size: .65rem; color: #c8beaa; }
  .empty { margin: .2rem .3rem; font-size: .65rem; color: #9cabb5; }
  .footer { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .4rem; }
  .bottom { justify-content: flex-end; flex-wrap: nowrap; }
  form { display: flex; flex-direction: column; gap: .4rem; min-height: 0; overflow-y: auto; }
  .fields { display: flex; flex-direction: column; gap: .35rem; }
  label { display: grid; grid-template-columns: 5em minmax(0,1fr); align-items: center; gap: .4rem; font-size: .75rem; color: #c8beaa; }
  input, select { min-width: 0; width: 100%; padding: .3rem; background: #14232e; color: #fff; }
  select.placeholder { color: #a6b2ba; }
  option { color: #fff; }
  .file-input { display: none; }
  .message { min-width: 0; margin: 0; color: #d4e9d8; font-size: .7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .message.error { color: #ffb5ad; }
  @media (max-width:700px) {
    .manager { min-height: 280px; }
    .prize-list { max-height: 240px; }
    .catalog, .editor { grid-template-columns: 70px minmax(0,1fr); }
    label { grid-template-columns: 1fr; gap: .2rem; }
    button, input, select { min-height: 36px; }
  }
</style>
