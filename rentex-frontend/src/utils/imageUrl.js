// utils/imageUrl.js
export const getImageUrl = (path) => {
  if (!path) return "/no-image.png";

  // Webpack import (assets 이미지)
  if (typeof path !== "string") return path;

  // 이미 http/https로 시작 → 외부 URL이므로 그대로 사용
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // /uploads/... → API_BASE에서 /api 잘라내고 붙이기
  const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:8080/api";
  const serverBase = apiBase.replace(/\/api$/, "");
  return `${serverBase}${path}`;
};
