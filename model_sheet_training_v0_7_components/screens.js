const screens = [
{role:'intro',title:'看懂門扇方向',sub:'Memahami arah daun pintu',kind:'開始 / Mulai',html:`
  <div class="kicker">LEVEL 1</div>
  <h2>門扇與模型單基礎</h2>
  <div class="sub">Dasar daun pintu dan lembar produksi</div>
  <div class="card dual">
    <b>朗讀對了，這張卡得 1 顆星。這一區的題全部答對，這一區才會變成 2 顆星。</b>
    <span class="idn">Baca benar = 1 bintang di kartu itu. Semua soal di zona benar = zona itu dapat 2 bintang.</span>
  </div>
  <div class="card dual">
    <b>本單元會練習：母／子、鉸鏈側，以及從模型單找尺寸、規格、數量與用途。</b>
    <span class="idn">Pada unit ini kamu akan berlatih: 「母／子」, sisi engsel, serta mencari ukuran, spesifikasi, jumlah, dan penggunaan pada lembar produksi.</span>
  </div>
  <button class="btn" data-go="1">開始學習 / Mulai belajar</button>
  <button class="btn secondary" type="button" data-reset="1">清除進度 / Hapus progres</button>
`},
{role:'teach',regionId:'door',title:'先認識：母扇・子扇',sub:'Kenali dulu: daun 「母」 dan 「子」',kind:'教學 / Belajar',html:`
  <div class="tap-area">
    <div class="door-wrap">
      <div class="door big"><div class="label-center">母</div></div>
      <div class="door small"><div class="label-center">子</div></div>
    </div>
  </div>
  <div class="card dual">
    <b>母扇：主要、較大的門扇</b>
    <span class="idn">Daun 「母」: daun utama yang lebih besar</span>
  </div>
  <div class="card dual">
    <b>子扇：輔助、較小的門扇</b>
    <span class="idn">Daun 「子」: daun tambahan yang lebih kecil</span>
  </div>
  <button class="btn" data-go="2">下一步 / Lanjut</button>
`},
{role:'quiz',regionId:'door',cardId:'daun-induk',questionId:'q-daun-induk',speechTarget:'母扇',nameZh:'母扇',nameId:'daun induk',title:'請直接點「母扇」',sub:'Sentuh langsung daun 「母」',kind:'練習 / Latihan',html:`
  <div class="tap-area">
    <div class="door-wrap">
      <div class="door small" onclick="answer(false,'fb2')"></div>
      <div class="door big" onclick="answer(true,'fb2')"></div>
    </div>
  </div>
  <div id="fb2" class="feedback">
    <b>✅ 正確！</b> 母扇是較大的主要門扇。<br>
    <span class="small">Benar! Daun 「母」 adalah daun utama yang lebih besar.</span>
    <button class="btn" data-go="3">繼續 / Lanjut</button>
  </div>
`},
{role:'quiz',regionId:'door',cardId:'daun-anak',questionId:'q-daun-anak',speechTarget:'子扇',nameZh:'子扇',nameId:'daun anak',title:'較小的輔助門扇，在模型單上用哪個字？',sub:'Huruf apa di lembar produksi untuk daun tambahan yang lebih kecil?',kind:'練習 / Latihan',html:`
  <div class="tap-area center">
    <div class="door small" style="margin:18px auto 8px"></div>
  </div>
  <div class="q">
    請選正確的字<br>
    <span class="idn">Pilih huruf yang benar</span>
  </div>
  <div class="options">
    <button class="option" onclick="answer(false,'fb3')">母</button>
    <button class="option" onclick="answer(true,'fb3')">子</button>
  </div>
  <div id="fb3" class="feedback">
    <b>✅ 正確！</b> 較小的輔助門扇，在模型單上標示為「子」。<br>
    <span class="small">Benar! Daun tambahan yang lebih kecil ditulis sebagai 「子」.</span>
    <button class="btn" data-go="4">繼續 / Lanjut</button>
  </div>
`},
{role:'teach',regionId:'hinge',title:'先認識：鉸鏈側・鎖側',sub:'Kenali dulu: sisi engsel dan sisi kunci',kind:'教學 / Belajar',html:`
  <div class="card">
    <div class="hinge-card">
      <div class="demo-door">
        <div class="hinge-strip"></div>
        <div class="lock-strip"></div>
        <div class="hinge h1"></div>
        <div class="hinge h2"></div>
        <div class="lockicon">🔒</div>
        <div class="callout left">鉸鏈側<br><span class="small">sisi engsel</span></div>
        <div class="callout right">鎖側<br><span class="small">sisi kunci</span></div>
      </div>
    </div>
  </div>
  <div class="legend-row">
    <div class="legend-pill"><b>鉸鏈側</b><br><span class="small">有鉸鏈的那一側 / sisi tempat engsel dipasang</span></div>
    <div class="legend-pill"><b>鎖側</b><br><span class="small">安裝鎖具的那一側 / sisi tempat kunci dipasang</span></div>
  </div>
  <button class="btn" data-go="5">下一步 / Lanjut</button>
`},
{role:'quiz',regionId:'hinge',cardId:'sisi-engsel',questionId:'q-sisi-engsel',speechTarget:'鉸鏈側',nameZh:'鉸鏈側',nameId:'sisi engsel',title:'請直接點「鉸鏈側」',sub:'Sentuh langsung 「sisi engsel」',kind:'練習 / Latihan',html:`
  <div class="tap-area">
    <div class="edge-quiz">
      <div class="doorMain">
        <div class="hinge h1"></div>
        <div class="hinge h2"></div>
        <div class="lockicon">🔒</div>
      </div>
      <div class="edge left" onclick="answer(true,'fb5')"></div>
      <div class="edge right" onclick="answer(false,'fb5')"></div>
    </div>
  </div>
  <div id="fb5" class="feedback">
    <b>✅ 正確！</b> 有鉸鏈的那一側，就是鉸鏈側。<br>
    <span class="small">Benar! Sisi tempat engsel berada adalah sisi engsel.</span>
    <button class="btn" data-go="6">繼續 / Lanjut</button>
  </div>
`},
{role:'quiz',regionId:'hinge',cardId:'engsel-induk',questionId:'q-engsel-induk',speechTarget:'母扇',nameZh:'母扇鉸鏈側',nameId:'sisi engsel daun induk',title:'主管說：「先檢查母扇的鉸鏈側。」',sub:'Supervisor berkata: “Periksa sisi engsel daun 「母」 terlebih dulu.”',kind:'練習 / Latihan',html:`
  <div class="tap-area">
    <div class="hotpair">
      <div class="bigDoor">
        <div class="hingeL h1"></div><div class="hingeL h2"></div>
        <div class="hit bigL" onclick="answer(true,'fb6')"></div>
        <div class="hit bigR" onclick="answer(false,'fb6')"></div>
      </div>
      <div class="smallDoor">
        <div class="hingeR h1"></div><div class="hingeR h2"></div>
        <div class="hit smallL" onclick="answer(false,'fb6')"></div>
        <div class="hit smallR" onclick="answer(false,'fb6')"></div>
      </div>
    </div>
  </div>
  <div id="fb6" class="feedback">
    <b>✅ 正確！</b> 先找母扇（較大），再找它有鉸鏈的那一側。<br>
    <span class="small">Benar! Temukan dulu daun 「母」 (lebih besar), lalu sisi yang ada engselnya.</span>
    <button class="btn" data-go="7">進入工單 / Masuk ke lembar produksi</button>
  </div>
`},
{role:'teach',regionId:'size',title:'從模型單找母／子尺寸',sub:'Belajar lembar produksi: lihat ukuran 「母／子」 terlebih dulu',kind:'學習 / Belajar',html:`
  <div class="card">
    <img class="sheetimg" src="assets/top_table.png" alt="top table">
    <div class="sheet-note">
      先看這一區：可以找到 <b>母</b>、<b>子</b>，以及各自的尺寸。<br>
      <span class="idn">Lihat bagian ini dulu: di sini ada 「母」, 「子」, dan ukuran masing-masing.</span>
    </div>
  </div>
  <div class="legend-row">
    <div class="legend-pill"><b>母</b><br><span class="small">1022 × 2202</span></div>
    <div class="legend-pill"><b>子</b><br><span class="small">701 × 2202</span></div>
  </div>
  <button class="btn" data-go="8">開始作答 / Mulai menjawab</button>
`},
{role:'quiz',regionId:'size',cardId:'ukuran-anak',questionId:'q-ukuran-anak',speechTarget:'子扇',nameZh:'子扇尺寸',nameId:'ukuran daun anak',title:'找到子扇尺寸',sub:'Praktik 1: temukan ukuran daun 「子」',kind:'練習 / Latihan',html:`
  <div class="card">
    <img class="sheetimg" src="assets/top_table.png" alt="top table">
  </div>
  <div class="q">
    子扇的尺寸是多少？<br>
    <span class="idn">Berapa ukuran daun 「子」?</span>
  </div>
  <div class="options">
    <button class="option" onclick="answer(false,'fb8')">1724 × 2202</button>
    <button class="option" onclick="answer(false,'fb8')">1022 × 2202</button>
    <button class="option" onclick="answer(true,'fb8')">701 × 2202</button>
  </div>
  <div id="fb8" class="feedback">
    <b>✅ 正確！</b> 子扇尺寸是 <b>701 × 2202</b>。<br>
    <span class="small">Benar! Ukuran daun 「子」 adalah <b>701 × 2202</b>.</span>
    <button class="btn" data-go="9">學下一種讀法 / Belajar cara baca berikutnya</button>
  </div>
`},
{role:'teach',regionId:'item85',title:'學會讀 8-5',sub:'Belajar: cara membaca baris 8-5',kind:'學習 / Belajar',html:`
  <div class="card">
    <div class="rawline">8-5　4.0碳酸鎂 × 19 × 2164 × 32片－鉸鏈側</div>
    <div class="sheet-note">
      一列資料可以拆成五種資訊：<br>
      <span class="idn">Satu baris data dapat dibaca sebagai lima jenis informasi:</span>
    </div>
    <div class="parse-row">
      <div class="parse-cell"><b>8-5</b><span>項次<br>item</span></div>
      <div class="parse-cell"><b>4.0 碳酸鎂</b><span>材料<br>material</span></div>
      <div class="parse-cell"><b>19 × 2164</b><span>尺寸<br>ukuran</span></div>
      <div class="parse-cell"><b>32 片</b><span>數量<br>jumlah</span></div>
      <div class="parse-cell"><b>鉸鏈側</b><span>用途<br>penggunaan</span></div>
    </div>
  </div>
  <button class="btn" data-go="10">開始作答 / Mulai menjawab</button>
`},
 {role:'quiz',regionId:'item85',cardId:'baris-8-5',questionId:'q-8-5-spec',speechTarget:'碳酸鎂',nameZh:'8-5 碳酸鎂',nameId:'item 8-5',title:'找到 8-5 的規格',sub:'Praktik 2: temukan spesifikasi item 8-5',kind:'練習 / Latihan',html:`
  <div class="card">
    <img class="sheetimg" src="assets/item_list.png" alt="item list">
  </div>
  <div class="q">
    請找到「8-5」。它的規格是哪一個？<br>
    <span class="idn">Temukan item “8-5”. Spesifikasinya yang mana?</span>
  </div>
  <div class="options">
    <button class="option" onclick="answer(false,'fb10')">4.0 碳酸鎂 × 41 × 2174</button>
    <button class="option" onclick="answer(true,'fb10')">4.0 碳酸鎂 × 19 × 2164</button>
    <button class="option" onclick="answer(false,'fb10')">40mm 珍珠岩複合板 × 90 × 286</button>
  </div>
  <div id="fb10" class="feedback">
    <b>✅ 正確！</b> 8-5 的規格是 <b>4.0 碳酸鎂 × 19 × 2164</b>。<br>
    <span class="small">Benar! Spesifikasi 8-5 adalah <b>4.0 碳酸鎂 × 19 × 2164</b>.</span>
    <button class="btn" data-go="11">下一題 / Soal berikutnya</button>
  </div>
`},
 {role:'quiz',regionId:'item85',cardId:'baris-8-5',questionId:'q-8-5-qty',speechTarget:'碳酸鎂',nameZh:'8-5 碳酸鎂',nameId:'item 8-5',title:'8-5 要做多少？用在哪裡？',sub:'Praktik 3: berapa jumlah item 8-5 dan digunakan di mana?',kind:'練習 / Latihan',html:`
  <div class="card">
    <img class="sheetimg" src="assets/item_list.png" alt="item list">
  </div>
  <div class="q">
    8-5 的數量與用途是哪一個？<br>
    <span class="idn">Berapa jumlah item 8-5 dan digunakan untuk bagian mana?</span>
  </div>
  <div class="options">
    <button class="option" onclick="answer(true,'fb11')">32 片・鉸鏈側<br><span class="small">32 pcs ・ sisi engsel</span></button>
    <button class="option" onclick="answer(false,'fb11')">8 片・子扇門檔<br><span class="small">8 pcs ・ penahan daun 「子」</span></button>
    <button class="option" onclick="answer(false,'fb11')">16 片・母下用<br><span class="small">16 pcs ・ bagian bawah daun 「母」</span></button>
  </div>
  <div id="fb11" class="feedback">
    <b>✅ 正確！</b> 8-5 是 <b>32 片</b>，用在 <b>鉸鏈側</b>。<br>
    <span class="small">Benar! Item 8-5 berjumlah <b>32 pcs</b> dan digunakan pada <b>sisi engsel</b>.</span>
    <button class="btn" data-go="12">用圖確認位置 / Cek posisi dengan gambar</button>
  </div>
`},
 {role:'quiz',regionId:'item85',cardId:'baris-8-5',questionId:'q-8-5-side',speechTarget:'鉸鏈側',nameZh:'8-5 碳酸鎂',nameId:'item 8-5',title:'8-5 裝在哪一側？',sub:'Ulasan visual: item 8-5 dipasang di sisi mana?',kind:'練習 / Latihan',html:`
  <div class="q">
    工單寫「鉸鏈側」。請直接點 8-5 應該裝的那一側。<br>
    <span class="idn">Pada lembar tertulis “sisi engsel”. Sentuh sisi tempat item 8-5 dipasang.</span>
  </div>
  <div class="tap-area">
    <div class="edge-quiz">
      <div class="doorMain">
        <div class="hinge h1"></div>
        <div class="hinge h2"></div>
        <div class="lockicon">🔒</div>
      </div>
      <div class="edge left" onclick="answer(true,'fb12')"></div>
      <div class="edge right" onclick="answer(false,'fb12')"></div>
    </div>
  </div>
  <div id="fb12" class="feedback">
    <b>✅ 對，8-5 是鉸鏈側用。</b><br>
    <span class="small">Benar, item 8-5 digunakan pada sisi engsel.</span>
    <button class="btn" data-go="13">下一個工單任務 / Tugas berikutnya</button>
  </div>
`},
 {role:'quiz',regionId:'item810',cardId:'baris-8-10',questionId:'q-8-10-use',speechTarget:'門檔',nameZh:'8-10 門檔',nameId:'penahan pintu',title:'8-10 用在哪裡？',sub:'Praktik 4: item 8-10 digunakan di mana?',kind:'練習 / Latihan',html:`
  <div class="card">
    <img class="sheetimg" src="assets/item_list.png" alt="item list">
  </div>
  <div class="q">
    8-10 用在哪裡？<br>
    <span class="idn">Item 8-10 digunakan untuk bagian mana?</span>
  </div>
  <div class="options">
    <button class="option" onclick="answer(false,'fb13')">鉸鏈側<br><span class="small">sisi engsel</span></button>
    <button class="option" onclick="answer(true,'fb13')">母扇門檔用<br><span class="small">untuk penahan daun 「母」</span></button>
    <button class="option" onclick="answer(false,'fb13')">子扇門檔用<br><span class="small">untuk penahan daun 「子」</span></button>
  </div>
  <div id="fb13" class="feedback">
    <b>✅ 正確！</b> 8-10 是 <b>母扇門檔用</b>。<br>
    <span class="small">Benar! Item 8-10 digunakan untuk penahan daun 「母」.</span>
    <button class="btn" data-go="14">用圖確認是哪一扇 / Cek daun dengan gambar</button>
  </div>
`},
 {role:'quiz',regionId:'item810',cardId:'baris-8-10',questionId:'q-8-10-door',speechTarget:'門檔',nameZh:'8-10 門檔',nameId:'penahan pintu',title:'8-10 是用在母扇還是子扇？',sub:'Ulasan visual: item 8-10 digunakan pada daun 「母」 atau 「子」?',kind:'練習 / Latihan',html:`
  <div class="q">
    工單寫「母扇門檔用」。請直接點 8-10 對應的門扇。<br>
    <span class="idn">Pada lembar tertulis “untuk penahan daun 「母」”. Sentuh daun pintu yang sesuai.</span>
  </div>
  <div class="tap-area">
    <div class="door-wrap">
      <div class="door big" onclick="answer(true,'fb14')"></div>
      <div class="door small" onclick="answer(false,'fb14')"></div>
    </div>
  </div>
  <div id="fb14" class="feedback">
    <b>✅ 正確！</b> 8-10 對應的是母扇。<br>
    <span class="small">Benar! Item 8-10 terkait dengan daun 「母」.</span>
    <button class="btn" data-go="15">完成 / Selesai</button>
  </div>
`},
{role:'done',title:'完成',sub:'Selesai',kind:'完成 / Selesai',html:`
  <div class="card center" style="padding:28px 18px">
    <div class="done-stars" id="doneStars">★★</div>
    <div class="q">5 區全部 2 顆星</div>
    <div class="sub" style="margin-bottom:0">Semua zona mendapat 2 bintang</div>
  </div>
  <div id="doneBreakdown"></div>
  <div class="card dual">
    <b>請通知現場測試人員。</b>
    <span class="idn">Silakan beri tahu petugas pengujian.</span>
  </div>
`}
];
