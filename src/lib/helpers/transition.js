/*
 * transition.js — Svelte use: 指令辅助
 *
 * removeAnimClass：
 *   元素挂载时自动添加 class="anim" 触发 CSS 动画
 *   动画结束后移除 anim class，避免重复触发
 *   注意：不再先移除再添加，避免导致布局闪烁
 */
export function removeAnimClass(node) {
  // 如果已经有 anim 类（模板中设置的），不先移除，直接等动画结束清理
  if (!node.classList.contains('anim')) {
    requestAnimationFrame(() => {
      node.classList.add('anim');
    });
  }

  node.addEventListener('animationend', () => {
    node.classList.remove('anim');
  });
}