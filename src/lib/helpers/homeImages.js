// 原图保留在 Blob 中，缩略图仅供编辑面板使用。
export function isLocalImage(value) {
  return value?.blob instanceof Blob;
}

export async function prepareHomeImage(value) {
  if (typeof value === "string" && value.startsWith("data:image/")) {
    const response = await fetch(value);
    value = { blob: await response.blob(), name: "已保存的本地图片" };
  }
  if (!isLocalImage(value) || value.thumbnail instanceof Blob) return value;
  const url = URL.createObjectURL(value.blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("缩略图生成失败，请重新选择图片。")), "image/webp", 0.85);
    });
    return { blob: value.blob, name: value.name || "本地图片", thumbnail };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createHomeImageView(value) {
  if (!isLocalImage(value)) return { value, url: value, preview: value, name: "", dispose() {} };
  const url = URL.createObjectURL(value.blob);
  const preview = URL.createObjectURL(value.thumbnail || value.blob);
  return { value, url, preview, name: value.name || "已保存的本地图片", dispose() {
    URL.revokeObjectURL(url);
    URL.revokeObjectURL(preview);
  } };
}
