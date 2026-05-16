// src/lib/shareImage.js
// 6軸分析結果を 1280x720 のSNSシェア画像に変換する
// 純Canvas APIで描画 + qrcode lib で QR を生成

const COLORS = {
  bg: "#f0ede8",
  surface: "#ffffff",
  border: "#c8c0b4",
  gold: "#8a6030",
  goldDim: "#5a3a10",
  goldLight: "#f5e8d0",
  text: "#1a1210",
  textSub: "#3a3028",
  textMuted: "#6a5e50",
  radarFill: "rgba(138,96,48,0.35)",
  radarStroke: "#8a6030",
};

const SITE_URL = "https://toi-suite.vercel.app";

function determineType(scores, axisLabels) {
  // 最大スコアの軸からタイプを決定
  let maxKey = null;
  let maxVal = -1;
  for (const [k, v] of Object.entries(scores || {})) {
    if (v > maxVal) {
      maxVal = v;
      maxKey = k;
    }
  }
  if (!maxKey) return "侍タイプ未判定";
  return `${axisLabels[maxKey] || maxKey} 型`;
}

function drawRadar(ctx, cx, cy, radius, axisKeys, axisLabels, scores) {
  const n = axisKeys.length;
  const angleStep = (Math.PI * 2) / n;

  // グリッド (5段階)
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  for (let g = 1; g <= 5; g++) {
    const r = (radius * g) / 5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * angleStep;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 軸線
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  // データ多角形
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    const v = (scores[axisKeys[i]] || 0) / 100;
    const r = radius * v;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.radarFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.radarStroke;
  ctx.lineWidth = 3;
  ctx.stroke();

  // データポイント
  ctx.fillStyle = COLORS.gold;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    const v = (scores[axisKeys[i]] || 0) / 100;
    const r = radius * v;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 軸ラベル
  ctx.fillStyle = COLORS.goldDim;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    const lr = radius + 36;
    const x = cx + Math.cos(a) * lr;
    const y = cy + Math.sin(a) * lr;
    const label = axisLabels[axisKeys[i]] || axisKeys[i];
    const score = scores[axisKeys[i]] || 0;
    ctx.fillText(label, x, y - 10);
    ctx.fillStyle = COLORS.gold;
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(String(score), x, y + 12);
    ctx.fillStyle = COLORS.goldDim;
    ctx.font = "bold 22px sans-serif";
  }
}

function wrapText(ctx, text, maxWidth) {
  // 日本語向け：1文字ずつ確認しながら折返し
  const chars = Array.from(text || "");
  const lines = [];
  let line = "";
  for (const ch of chars) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function generateQRDataURL(text) {
  try {
    const QRCode = (await import("qrcode")).default || (await import("qrcode"));
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 220,
      color: { dark: "#5a3a10", light: "#ffffff" },
    });
  } catch (e) {
    console.warn("QR generation failed:", e);
    return null;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 6軸結果からSNSシェア画像 (1280x720) を生成
 * @param {object} opts
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function generateShareImage({
  title,
  scores,
  summary,
  axisKeys,
  axisLabels,
}) {
  const W = 1280;
  const H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 背景
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#f8f5f0");
  grad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ヘッダー帯
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, COLORS.gold);
  headerGrad.addColorStop(1, COLORS.goldDim);
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, 80);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("🗾 200の問い / 六軸の鏡", 40, 40);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = COLORS.goldLight;
  ctx.textAlign = "right";
  ctx.fillText("toi-suite.vercel.app", W - 40, 40);

  // 左：レーダーチャート
  drawRadar(ctx, 360, 410, 220, axisKeys, axisLabels, scores || {});

  // 右側のテキストエリア
  const rx = 700;
  const ry = 120;
  const rw = W - rx - 40;

  // タイプ名
  const typeName = determineType(scores, axisLabels);
  ctx.fillStyle = COLORS.goldDim;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("【あなたのタイプ】", rx, ry);

  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(typeName, rx, ry + 36);

  // 短評（summary）
  ctx.fillStyle = COLORS.goldDim;
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("📝 総評", rx, ry + 110);

  ctx.fillStyle = COLORS.text;
  ctx.font = "20px sans-serif";
  const shortSummary = (summary || "").slice(0, 180);
  const lines = wrapText(ctx, shortSummary, rw);
  let cy = ry + 150;
  const maxLines = 8;
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i], rx, cy);
    cy += 32;
  }
  if (lines.length > maxLines) {
    ctx.fillText("…", rx, cy);
  }

  // タイトル（アプリ名）
  if (title) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "16px sans-serif";
    ctx.fillText(`from: ${title}`, rx, H - 80);
  }

  // QRコード
  const qrDataUrl = await generateQRDataURL(SITE_URL);
  if (qrDataUrl) {
    try {
      const qrImg = await loadImage(qrDataUrl);
      ctx.fillStyle = "#fff";
      ctx.fillRect(W - 200, H - 200, 160, 160);
      ctx.drawImage(qrImg, W - 195, H - 195, 150, 150);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("読み込んで体験", W - 120, H - 28);
    } catch (e) {}
  }

  // ロゴ
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("⚔️ toi-suite", 40, H - 32);

  // フッター区切り線
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, H - 60);
  ctx.lineTo(W - 220, H - 60);
  ctx.stroke();

  // Blob化
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  return { blob, dataUrl };
}

/**
 * 画像をダウンロードさせる
 */
export function downloadImage(dataUrl, filename = "toi-suite-result.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * X (Twitter) で共有
 */
export function shareToX(text) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
  window.open(url, "_blank", "noopener");
}

/**
 * LINE で共有
 */
export function shareToLine(text) {
  const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

/**
 * Web Share API があれば画像付きで共有、なければダウンロード
 */
export async function shareNative({ blob, text }) {
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], "toi-suite-result.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          text,
          files: [file],
        });
        return { ok: true, method: "native" };
      }
    } catch (e) {
      if (e.name === "AbortError") return { ok: false, method: "abort" };
    }
  }
  return { ok: false, method: "unsupported" };
}
