<script>
  /*
   * ParticleBurst.svelte — 碎片溅射特效
   *
   * 逻辑（三步，每步独立）：
   *   1. cx = W/2, cy = H/2  →  窗口中心
   *   2. 24 个粒子散布在以 (cx,cy) 为圆心的圆周上（半径随机抖动）
   *   3. 动画：粒子沿径向（圆心→粒子连线方向）向屏幕外飞出
   *
   * 图片分配：8 张 sfx 图 Fisher-Yates 洗牌，每张恰好 3 次
   */
  import { onMount } from "svelte";

  let { sources } = $props();
  let particles = $state([]);
  const COUNT = 24;
  const K = 1.0;
  const GROW = 0.3;
  const HALF = 90;           // 图片宽 180px 的一半，用于居中对齐

  function animateParticle(node, p) {
    const t0 = 0.4;
    const ratio = t0 / p.duration;
    const s1 = p.scale + GROW * t0;
    const s2 = p.scale + GROW * p.duration;

    const anim = node.animate(
      [
        /* 仅负责位移，初始位置由 left/top 负责 */
        { transform: `translate(0px,0px) rotate(${p.rotation}deg) scale(${p.scale})`,   opacity: p.opacity0, offset: 0 },
        { transform: `translate(${p.dx * ratio}px,${p.dy * ratio}px) rotate(${p.rotation}deg) scale(${s1})`, opacity: p.opacity0, offset: ratio },
        { transform: `translate(${p.dx}px,${p.dy}px) rotate(${p.rotation}deg) scale(${s2})`,               opacity: 0,           offset: 1 }
      ],
      { duration: p.duration * 1000, delay: 0, fill: "forwards", easing: "ease-out" }
    );
    return { destroy() { anim.cancel(); } };
  }

  onMount(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2, cy = H / 2;
    const R = 0.30 * Math.min(W, H);

    /* 图片池 */
    const pool = [];
    for (let n = 1; n <= 8; n++) pool.push(n, n, n);
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }

    particles = Array.from({ length: COUNT }, (_, i) => {
      const base = (i / COUNT) * 2 * Math.PI;
      const r = R * (0.7 + Math.random() * 0.6);
      const jit = (Math.random() - 0.5) * (16 * Math.PI / 180);
      const angle = base + jit;

      /* 圆心坐标（图片中心要对齐的点） */
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);

      const imgNum = pool[i];
      const rotation = (angle * 180) / Math.PI + 90;
      const scale = 0.8 + Math.random() * 0.4;
      const opacity0 = 0.6 + Math.random() * 0.4;

      /* 飞出位移（径向朝外） */
      const dist = R * (2 + Math.random() * 3);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      const duration = 0.4 + opacity0 / K;

      return { x: px, y: py, imgNum, rotation, scale, opacity0, dx, dy, duration };
    });
  });
</script>

<div class="burst" data-result-independent>
  {#each particles as p, i (i)}
    <img class="p" src={sources[p.imgNum - 1]} alt=""
         style="left:{p.x}px;top:{p.y}px" use:animateParticle={p} />
  {/each}
</div>

<style>
  .burst {
    position: fixed; inset: 0;
    z-index: 28;
    pointer-events: none;
  }
  .p {
    position: absolute;
    width: 180px;
    height: auto;
    margin-left: -90px;       /* 图片中心对齐 left 坐标 */
    margin-top:  -90px;       /* 图片中心对齐 top 坐标 */
    transform-origin: center center;
    will-change: transform, opacity;
  }
</style>
