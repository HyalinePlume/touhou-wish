<script>
  import { onMount } from "svelte";

  export let onMeteorEnd = () => {};
  export let videoSrc;
  export let savesComplete = false;

  let videoEl;
  let playbackTime = 0;
  let done = false;
  let canSkip = false;
  $: canSkip = playbackTime >= 0.5 && savesComplete && !done;

  onMount(() => {
    const v = videoEl;
    if (!v) return;
    v.style.display = "unset";
    v.currentTime = 0;
    v.muted = false;
    v.play().catch(() => { if (!done) { done = true; onMeteorEnd({ skip: true }); } });
  });

  function clickSkip() {
    if (!canSkip || done) return;
    done = true;
    videoEl?.pause();
    onMeteorEnd({ skip: true });
  }

  function onEnded() {
    if (done) return;
    done = true;
    onMeteorEnd({ skip: false });
  }
</script>

<div class="meteor-wrapper">
  <video bind:this={videoEl} bind:currentTime={playbackTime} src={videoSrc}
    style="display:none" muted playsinline onended={onEnded}></video>
  {#if canSkip}
    <button class="skip" onclick={clickSkip}>跳过 &#9654;</button>
  {/if}
</div>

<style>
  .meteor-wrapper { position:fixed; inset:0; z-index:20; background:#fff; }
  video { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:105%; height:105%; object-fit:cover; }
  .skip { position:absolute; top:30px; right:3%; color:#888; font-size:1.2rem; background:none; border:none; cursor:pointer; z-index:10; }
  .skip:hover { color:#333; }
</style>
