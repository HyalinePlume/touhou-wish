// 1s 为第二轮的最早启动点；第一轮独立特效可继续播放至自然结束。
export const RESULT_FIRST_PHASE_MS = 1000;

export function startResultPlayback({ node, suspense, onSecondPhase }) {
  let disposed = false;
  let waiting = false;
  let started = false;
  let paused = [];

  function beginSecondPhase() {
    if (disposed || started) return;
    started = true;
    waiting = false;
    window.removeEventListener('click', handleClick, true);
    paused.forEach(animation => animation.play());
    paused = [];
    onSecondPhase();
  }

  function handleClick() {
    if (waiting) beginSecondPhase();
  }

  const timer = setTimeout(() => {
    if (disposed) return;
    if (!suspense) {
      beginSecondPhase();
      return;
    }
    // 仅暂停参与揭晓的动画。粒子、入场光圈以真实时间独立播放，不重定位或续播。
    paused = node.getAnimations({ subtree: true }).filter(animation =>
      animation.playState !== 'finished'
      && !animation.effect?.target?.closest('[data-result-independent]')
    );
    paused.forEach(animation => {
      animation.pause();
      animation.currentTime = RESULT_FIRST_PHASE_MS;
    });
    waiting = true;
    // 满 1s 才安装监听；更早的点击不排队，也不会用于揭晓。
    window.addEventListener('click', handleClick, true);
  }, RESULT_FIRST_PHASE_MS);

  return () => {
    disposed = true;
    clearTimeout(timer);
    window.removeEventListener('click', handleClick, true);
    paused.forEach(animation => animation.cancel());
    paused = [];
  };
}
