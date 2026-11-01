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
    <button class="continue" onclick={proceed}>继续</button>
    <button onclick={cancel}>取消</button>
  </div>
</dialog>

<style>
  dialog { position: fixed; inset: 0; margin: auto; width: min(420px, calc(100vw - 32px)); padding: 24px; box-sizing: border-box; color: #eee8df; background: #182733; border: 1px solid #639bac; border-radius: 12px; box-shadow: 0 20px 80px #0008; }
  dialog::backdrop { background: #060e1ac4; }
  p { font-size: 1.1rem; line-height: 1.7; }
  label { display: flex; align-items: center; gap: 8px; margin-top: 18px; cursor: pointer; color: #b1bec8; }
  input { width: 16px; height: 16px; accent-color: #d4b87a; }
  .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  button { font: inherit; cursor: pointer; color: #eee8df; background: #eee8e31a; border: 1px solid #b4a07866; border-radius: 6px; padding: 10px 18px; }
  button:hover { background: #eee8e32e; }
  .continue { background: #d4b87a; border-color: #d4b87a; color: #182733; }
  .continue:hover { background: #c4a768; border-color: #c4a768; }
  button:focus-visible, input:focus-visible { outline: 2px solid #d4b87a; outline-offset: 2px; }
</style>
