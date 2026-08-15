#!/usr/bin/env python3
"""Build a self-contained flip-card preview (preview.html) from cards.json + icons/ + sheet/.

Usage: python3 build_preview.py   (run from anywhere; paths are relative to this file)
"""
from __future__ import annotations

import base64
import html
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DECK = json.loads((HERE / "cards.json").read_text(encoding="utf-8"))
ICONS = HERE / "icons"
SHEET = HERE / "sheet"
OUT = HERE / "preview.html"

CAT_ORDER = ["struktur", "bahan", "hardware", "proses", "lembar", "baris"]
CAT_COLOR = {
    "struktur": "#2563eb", "bahan": "#7c3aed", "hardware": "#db2777",
    "proses": "#059669", "lembar": "#d97706", "baris": "#475569",
}


def esc(s: str | None) -> str:
    return html.escape(s or "", quote=True)


def inline_svg(name: str | None) -> tuple[str, bool]:
    """Return (markup, found)."""
    if not name:
        return "", True
    p = ICONS / name
    if not p.exists():
        return f'<div class="missing">missing<br>{esc(name)}</div>', False
    svg = p.read_text(encoding="utf-8")
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg).strip()
    return svg, True


def png_data(name: str | None) -> str:
    if not name:
        return ""
    p = SHEET / name
    if not p.exists():
        return ""
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode("ascii")


def card_html(c: dict) -> tuple[str, bool]:
    cat = c["cat"]
    color = CAT_COLOR.get(cat, "#475569")
    is_line = c.get("type") == "line"
    icon, ok = inline_svg(c.get("icon"))
    sheet = png_data(c.get("sheet"))
    unc = ' <span class="unc" title="翻譯沒把握，要問師傅">?</span>' if c.get("uncertain") else ""

    if is_line:
        front_main = f'<div class="raw">{esc(c["raw"])}</div>'
    else:
        front_main = f'<div class="icon">{icon}</div><div class="zh">{esc(c["zh"])}{unc}</div>'
    front_sheet = f'<img class="sheet" src="{sheet}" alt="在單子上的樣子" loading="lazy">' if sheet else ""

    if is_line:
        rows = "".join(
            f"<tr><td class='seg'>{esc(seg)}</td><td class='idn'>{esc(idn)}</td><td class='role'>{esc(role)}</td></tr>"
            for seg, idn, role in c.get("parts", [])
        )
        back_main = (
            f'<div class="idn-big">{esc(c["idn"])}</div>'
            f'<div class="en">{esc(c["en"])}</div>'
            f'<table class="parts">{rows}</table>'
        )
    else:
        back_main = (
            f'<div class="idn-big">{esc(c["idn"])}{unc}</div>'
            f'<div class="en">{esc(c["en"])}</div>'
        )
    back_hint = f'<div class="hint">{esc(c.get("hint"))}</div>' if c.get("hint") else ""

    markup = f"""
<article class="card" data-cat="{cat}" data-id="{esc(c['id'])}" tabindex="0" style="--cat:{color}">
  <div class="inner">
    <div class="face front">
      <span class="tag">{esc(DECK['meta']['categories'][cat]['zh'])}</span>
      {front_main}
      {front_sheet}
      <span class="flip-hint">點一下翻面</span>
    </div>
    <div class="face back">
      <span class="tag">{esc(DECK['meta']['categories'][cat]['idn'])}</span>
      <div class="zh-small">{esc(c['zh'])}</div>
      {back_main}
      {back_hint}
    </div>
  </div>
</article>"""
    return markup, ok


def main() -> None:
    cards = DECK["cards"]
    by_cat: dict[str, list[dict]] = {k: [] for k in CAT_ORDER}
    for c in cards:
        by_cat.setdefault(c["cat"], []).append(c)

    sections = []
    missing = 0
    for cat in CAT_ORDER:
        items = by_cat.get(cat, [])
        if not items:
            continue
        rendered = []
        for c in items:
            m, ok = card_html(c)
            missing += 0 if ok else 1
            rendered.append(m)
        meta = DECK["meta"]["categories"][cat]
        sections.append(
            f'<section class="cat" data-cat="{cat}" style="--cat:{CAT_COLOR[cat]}">'
            f'<h2><span class="dot"></span>{esc(meta["zh"])} <small>{esc(meta["idn"])} · {len(items)} 張</small></h2>'
            f'<div class="grid">{"".join(rendered)}</div></section>'
        )

    chips = "".join(
        f'<button class="chip" data-cat="{cat}" style="--cat:{CAT_COLOR[cat]}">{esc(DECK["meta"]["categories"][cat]["zh"])} <b>{len(by_cat.get(cat, []))}</b></button>'
        for cat in CAT_ORDER if by_cat.get(cat)
    )

    page = f"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(DECK['meta']['title'])}</title>
<style>
  :root {{ --ink:#1f2937; --muted:#6b7280; --bg:#f6f7f9; --card:#ffffff; --line:#e5e7eb; --amber:#fbbf24; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family: -apple-system, "PingFang TC", "Noto Sans TC", system-ui, sans-serif; color:var(--ink); background:var(--bg); }}
  header {{ padding:28px 24px 12px; max-width:1280px; margin:0 auto; }}
  h1 {{ margin:0 0 6px; font-size:26px; letter-spacing:.02em; }}
  .sub {{ color:var(--muted); font-size:14px; line-height:1.6; }}
  .warn {{ display:inline-block; margin-top:8px; padding:6px 10px; border-radius:8px; background:#fff7ed; color:#9a3412; font-size:13px; border:1px solid #fed7aa; }}
  .bar {{ position:sticky; top:0; z-index:5; background:rgba(246,247,249,.92); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }}
  .bar-in {{ max-width:1280px; margin:0 auto; padding:10px 24px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }}
  .chip {{ border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:999px; padding:6px 12px; font-size:13px; cursor:pointer; }}
  .chip b {{ color:var(--cat); }}
  .chip.on {{ border-color:var(--cat); box-shadow:inset 0 0 0 1px var(--cat); }}
  .chip.all {{ --cat:#111827; }}
  .spacer {{ flex:1; }}
  .btn {{ border:1px solid var(--ink); background:var(--ink); color:#fff; border-radius:8px; padding:6px 12px; font-size:13px; cursor:pointer; }}
  main {{ max-width:1280px; margin:0 auto; padding:8px 24px 64px; }}
  section.cat {{ margin-top:28px; }}
  section.cat h2 {{ font-size:18px; margin:0 0 12px; display:flex; align-items:center; gap:8px; }}
  section.cat h2 small {{ color:var(--muted); font-weight:400; font-size:13px; }}
  .dot {{ width:10px; height:10px; border-radius:50%; background:var(--cat); display:inline-block; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:14px; }}
  .card {{ perspective:1200px; height:300px; cursor:pointer; outline:none; }}
  .card .inner {{ position:relative; width:100%; height:100%; transition:transform .5s; transform-style:preserve-3d; }}
  .card.flipped .inner, body.all-back .card:not(.flipped) .inner {{ transform:rotateY(180deg); }}
  .face {{ position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; background:var(--card); border:1px solid var(--line); border-top:4px solid var(--cat); border-radius:14px; padding:14px 14px 12px; display:flex; flex-direction:column; align-items:center; text-align:center; overflow:hidden; }}
  .card:focus-visible .face {{ box-shadow:0 0 0 3px #93c5fd; }}
  .back {{ transform:rotateY(180deg); align-items:stretch; text-align:left; }}
  .tag {{ position:absolute; top:8px; left:10px; font-size:11px; color:var(--cat); font-weight:600; letter-spacing:.04em; }}
  .icon {{ width:150px; height:112px; margin-top:16px; }}
  .icon svg {{ width:100%; height:100%; display:block; }}
  .missing {{ width:150px; height:112px; margin-top:16px; border:2px dashed #fca5a5; color:#b91c1c; font-size:12px; display:flex; align-items:center; justify-content:center; border-radius:8px; }}
  .zh {{ font-size:19px; font-weight:700; margin-top:8px; line-height:1.3; }}
  .raw {{ margin-top:34px; font-family: ui-monospace, Menlo, monospace; font-size:15px; font-weight:600; line-height:1.5; word-break:break-all; padding:0 4px; }}
  .sheet {{ margin-top:auto; max-width:100%; max-height:70px; object-fit:contain; border:1px solid var(--line); border-radius:6px; background:#fff; }}
  .flip-hint {{ position:absolute; bottom:6px; right:10px; font-size:10px; color:#9ca3af; }}
  .zh-small {{ margin-top:14px; font-size:12px; color:var(--muted); }}
  .idn-big {{ font-size:19px; font-weight:700; line-height:1.3; margin-top:4px; }}
  .en {{ font-size:13px; color:var(--muted); margin-top:4px; }}
  .hint {{ margin-top:auto; font-size:12.5px; line-height:1.5; color:#374151; background:#f9fafb; border-radius:8px; padding:8px 10px; }}
  .unc {{ display:inline-block; margin-left:4px; width:18px; height:18px; line-height:18px; border-radius:50%; background:#fee2e2; color:#b91c1c; font-size:12px; text-align:center; vertical-align:middle; }}
  table.parts {{ margin-top:8px; border-collapse:collapse; width:100%; font-size:11.5px; }}
  table.parts td {{ padding:2px 4px; border-bottom:1px solid #f1f5f9; vertical-align:top; }}
  table.parts .seg {{ font-family: ui-monospace, Menlo, monospace; font-weight:600; white-space:nowrap; }}
  table.parts .role {{ color:var(--muted); white-space:nowrap; }}
  .card[data-cat="baris"] {{ height:300px; grid-column: span 2; }}
  .card[data-cat="baris"] .sheet {{ max-height:110px; }}
  .card[data-cat="baris"] .back {{ overflow:auto; }}
  @media (max-width: 560px) {{ .card[data-cat="baris"] {{ grid-column: span 1; }} }}
  footer {{ max-width:1280px; margin:0 auto; padding:0 24px 40px; color:var(--muted); font-size:12px; line-height:1.6; }}
</style>
</head>
<body>
<header>
  <h1>{esc(DECK['meta']['title'])}</h1>
  <div class="sub">來源：{esc(DECK['meta']['source'])}<br>{esc(DECK['meta']['direction'])} · 共 {len(cards)} 張</div>
  <div class="warn">⚠ {esc(DECK['meta']['translation_status'])}</div>
</header>
<div class="bar"><div class="bar-in">
  <button class="chip all on" data-cat="all">全部 <b>{len(cards)}</b></button>{chips}
  <span class="spacer"></span>
  <button class="btn" id="flipAll">全部翻到背面</button>
</div></div>
<main>{"".join(sections)}</main>
<footer>圖示為示意線稿（amber = 該卡教的東西）；「在單子上長這樣」為真實製造表裁切，識別資訊未含在內。缺圖示的卡會顯示紅色虛線框。</footer>
<script>
  document.querySelectorAll('.card').forEach(el => {{
    const flip = () => el.classList.toggle('flipped');
    el.addEventListener('click', flip);
    el.addEventListener('keydown', e => {{ if (e.key === 'Enter' || e.key === ' ') {{ e.preventDefault(); flip(); }} }});
  }});
  document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {{
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
    ch.classList.add('on');
    const cat = ch.dataset.cat;
    document.querySelectorAll('section.cat').forEach(s => s.style.display = (cat === 'all' || s.dataset.cat === cat) ? '' : 'none');
  }}));
  const fa = document.getElementById('flipAll');
  fa.addEventListener('click', () => {{
    document.querySelectorAll('.card.flipped').forEach(c => c.classList.remove('flipped'));
    const on = document.body.classList.toggle('all-back');
    fa.textContent = on ? '全部翻回正面' : '全部翻到背面';
  }});
</script>
</body>
</html>
"""
    OUT.write_text(page, encoding="utf-8")
    print(f"wrote {OUT} — {len(cards)} cards, {missing} missing icons, {OUT.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
