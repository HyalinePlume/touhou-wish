<script>
  import { onMount } from "svelte";

  let { onCancel = () => {}, onContinue = () => {} } = $props();
  let promptDialog;
  let dontRemind = $state(false);
  onMount(() => { promptDialog.showModal(); });

  function cancel() {
    promptDialog.close();
    onCancel();
  }

  function proceed() {
    promptDialog.close();
    onContinue(dontRemind);
  }
</script>

<dialog bind:this={promptDialog} aria-labelledby="missing-prize-message"
  oncancel={(event) => { event.preventDefault(); cancel(); }}>
  <p id="missing-prize-message">尚未指定抽奖奖品，是否继续？</p>
  <label><input type="checkbox" bind:checked={dontRemind} />不再提示</label>
  <div class="actions">
    <button onclick={cancel}>取消</button>
    <button class="continue" onclick={proceed}>继续</button>
  </div>
</dialog>

<style>
  dialog { position: fixed; inset: 0; margin: auto; width: min(420px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; padding: 24px; box-sizing: border-box; color: #594632; background: #f7efdf; border: 1px solid #dfbf8e; border-radius: 20px; box-shadow: 0 24px 80px #0005; }
  dialog::backdrop { background: #101a28b8; backdrop-filter: blur(4px); }
  p { font-size: 1.1rem; line-height: 1.7; }
  label { display: flex; align-items: center; gap: 8px; margin-top: 18px; cursor: pointer; color: #89745b; }
  input { width: 16px; height: 16px; accent-color: #bc7338; }
  .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  button { font: inherit; cursor: pointer; color: #784923; background: #eadac0; border: 1px solid #dfbf8e; border-radius: 20px; padding: 10px 18px; }
  button:hover { background: #e3cba7; }
  .continue { background: #bc7338; border-color: #bc7338; color: #fff4e2; }
  .continue:hover { background: #a9622e; border-color: #a9622e; }
  button:focus-visible, input:focus-visible { outline: 3px solid #dc904d; outline-offset: 2px; }
</style>
