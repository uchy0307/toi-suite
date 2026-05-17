import React, { useEffect, useState, useRef } from "react";

/**
 * GlobalRallyNav - 全Pageの「複数質問を1画面に並列」UIを
 * 「1問1画面+前後ナビ+プログレスバー」に変換するDOMデコレータ。
 *
 * 動作:
 * 1. MutationObserverで DOM変化を監視
 * 2. 10個前後の類似カード（textarea/input/select含む）を持つ親要素を「ラリーコンテナ」と判定
 * 3. data-rally-idx 属性で現在表示インデックス管理、CSSで他のカードを display:none
 * 4. 上部にプログレスバー、下部に前へ/次へ/結果を見る ボタンを挿入
 *
 * 既存コンポーネントの状態管理（rallyAnswers state など）には触らない。
 * 純粋なビジュアル切替のみ。回答記入は通常通り保持される。
 */

const C = {
  bg: "#f0ede8", surface: "#ffffff", surface2: "#e8e4de", surface3: "#ddd8d0",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldDim: "#5a3a10",
  text: "#1a1210", textMuted: "#6a5e50"
};

// CSS injected once on mount
const CSS_TEXT = `
.__rally_card_hidden__ { display: none !important; }
.__rally_container__ { position: relative; }
.__rally_progress_wrap__ {
  position: sticky;
  top: 60px;
  z-index: 50;
  background: ${C.bg};
  padding: 8px 0 6px;
  margin-bottom: 12px;
}
.__rally_progress_label__ {
  font-size: 11px;
  font-weight: 700;
  color: ${C.gold};
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.__rally_progress_track__ {
  height: 5px;
  background: ${C.surface2};
  border-radius: 3px;
  overflow: hidden;
}
.__rally_progress_fill__ {
  height: 100%;
  background: linear-gradient(135deg, ${C.gold}, ${C.goldDim});
  border-radius: 3px;
  transition: width 0.25s ease;
}
.__rally_nav__ {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}
.__rally_nav__ button {
  padding: 12px 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.__rally_nav__ .__btn_prev__ {
  background: ${C.surface2};
  border: 1px solid ${C.border};
  color: ${C.text};
}
.__rally_nav__ .__btn_next__ {
  background: linear-gradient(135deg, ${C.gold}, ${C.goldDim});
  border: none;
  color: #fff;
}
.__rally_nav__ button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
`;

function isLikelyRallyCard(el) {
  if (!el || el.tagName !== "DIV") return false;
  // A "rally card" typically contains a question text + input element
  const hasInput = !!el.querySelector("textarea, input[type='text'], input[type='radio'], input[type='checkbox'], select, button[role='radio']");
  // Or it's a button group / option list
  const text = (el.textContent || "").trim();
  if (text.length < 8) return false;
  if (text.length > 1200) return false; // too long, probably not a single card
  return hasInput || /問\d|Q\.?\s?\d|\d+\./.test(text.slice(0, 30));
}

function findRallyContainer(root) {
  // Find a parent that has ~10 (8-12) similar-sized direct children that look like rally cards
  const candidates = [];
  const all = root.querySelectorAll("div");
  for (const el of all) {
    const children = [...el.children].filter(c => c.tagName === "DIV");
    if (children.length < 8 || children.length > 14) continue;
    let cardCount = 0;
    for (const c of children) {
      if (isLikelyRallyCard(c)) cardCount++;
    }
    if (cardCount >= Math.floor(children.length * 0.7)) {
      candidates.push({ container: el, cards: children, score: cardCount });
    }
  }
  // Pick the candidate with most cards
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

function setupRallyNav(container, cards) {
  if (container.dataset.rallyApplied === "1") return;
  container.dataset.rallyApplied = "1";
  container.classList.add("__rally_container__");

  const total = cards.length;
  let idx = 0;

  // Progress bar
  const progressWrap = document.createElement("div");
  progressWrap.className = "__rally_progress_wrap__";
  progressWrap.innerHTML = `
    <div class="__rally_progress_label__">
      <span>Q<span class="__cur__">1</span> / ${total}</span>
      <span class="__answered__" style="font-weight:500;color:#6a5e50">回答済み <span class="__ans_count__">0</span>/${total}</span>
    </div>
    <div class="__rally_progress_track__"><div class="__rally_progress_fill__" style="width:${(1 / total) * 100}%"></div></div>
  `;
  container.insertBefore(progressWrap, container.firstChild);

  // Nav buttons
  const nav = document.createElement("div");
  nav.className = "__rally_nav__";
  nav.innerHTML = `
    <button class="__btn_prev__" type="button">← 前へ</button>
    <button class="__btn_next__" type="button">次へ →</button>
  `;
  container.appendChild(nav);

  const updateView = () => {
    cards.forEach((c, i) => {
      if (i === idx) c.classList.remove("__rally_card_hidden__");
      else c.classList.add("__rally_card_hidden__");
    });
    const fill = progressWrap.querySelector(".__rally_progress_fill__");
    if (fill) fill.style.width = `${((idx + 1) / total) * 100}%`;
    const cur = progressWrap.querySelector(".__cur__");
    if (cur) cur.textContent = String(idx + 1);

    // Update answered count
    let ans = 0;
    cards.forEach((c) => {
      const ta = c.querySelector("textarea, input[type='text']");
      if (ta && ta.value && ta.value.trim().length > 0) ans++;
      else {
        const checked = c.querySelector("input[type='radio']:checked, input[type='checkbox']:checked, [aria-pressed='true'], [data-selected='true']");
        if (checked) ans++;
      }
    });
    const ansEl = progressWrap.querySelector(".__ans_count__");
    if (ansEl) ansEl.textContent = String(ans);

    // Disable buttons at edges
    const prevBtn = nav.querySelector(".__btn_prev__");
    const nextBtn = nav.querySelector(".__btn_next__");
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) {
      nextBtn.textContent = idx === total - 1 ? "🎯 結果を見る ↓" : "次へ →";
      // never disable next, just changes text
    }

    // Scroll the visible card into view smoothly
    if (cards[idx]) cards[idx].scrollIntoView({ behavior: "smooth", block: "center" });
  };

  nav.querySelector(".__btn_prev__").addEventListener("click", () => {
    if (idx > 0) { idx--; updateView(); }
  });
  nav.querySelector(".__btn_next__").addEventListener("click", () => {
    if (idx < total - 1) { idx++; updateView(); }
    else {
      // Final: scroll past the container to reveal whatever's below (likely "結果" CTA)
      const after = container.nextElementSibling;
      if (after) after.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollBy({ top: 400, behavior: "smooth" });
    }
  });

  // Update answered count when user types/selects within container
  container.addEventListener("input", () => updateView());
  container.addEventListener("change", () => updateView());
  container.addEventListener("click", (e) => {
    // A small delay so React state updates first
    setTimeout(updateView, 80);
  });

  updateView();
}

export default function GlobalRallyNav() {
  useEffect(() => {
    // Inject CSS once
    if (!document.getElementById("__rally_nav_css__")) {
      const style = document.createElement("style");
      style.id = "__rally_nav_css__";
      style.textContent = CSS_TEXT;
      document.head.appendChild(style);
    }

    let raf = null;
    const scan = () => {
      const root = document.querySelector("#root") || document.body;
      // Skip if already on catalog or onboarding
      const path = window.location.pathname;
      if (path === "/" || !/^\/[0-9]{3}$/.test(path)) return;
      const found = findRallyContainer(root);
      if (found) {
        setupRallyNav(found.container, found.cards);
      }
    };

    const observer = new MutationObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        scan();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial pass
    setTimeout(scan, 500);
    setTimeout(scan, 1500);
    setTimeout(scan, 3000);

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
