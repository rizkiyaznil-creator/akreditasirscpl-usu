/* =========================================================
   Handbook Akreditasi RS — RSP CPL USU
   Vanilla JS. content.json = satu-satunya sumber data.
   ========================================================= */

(function () {
  'use strict';

  var STORAGE_PREFIX = 'handbook-akreditasi:checklist:';
  var app = document.getElementById('app');
  var footer = document.getElementById('footer-disclaimer');
  var searchForm = document.getElementById('search-form');
  var searchInput = document.getElementById('search-input');

  var DATA = null;        // isi content.json
  var SEARCH_INDEX = [];  // daftar entri untuk pencarian

  /* ---------- Util ---------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') el.className = attrs[k];
        else if (k === 'html') el.innerHTML = attrs[k];
        else if (k === 'text') el.textContent = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) {
          el.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function findProfesi(id) {
    return (DATA.profesi || []).filter(function (p) { return p.id === id; })[0] || null;
  }
  // Bersihkan kutipan pembungkus pada pertanyaan surveior di content.json
  function stripQuotes(s) {
    return String(s).replace(/^["“”'\s]+|["“”'\s]+$/g, '');
  }
  // Tombol cetak: ikon tenang di pojok kepala halaman
  function printIconBtn(label) {
    return h('button', {
      class: 'icon-btn print-btn no-print',
      type: 'button',
      title: 'Cetak',
      'aria-label': label || 'Cetak halaman ini',
      onClick: function () { window.print(); }
    }, [h('span', { 'aria-hidden': 'true', text: '🖨️' })]);
  }

  /* ---------- Footer disclaimer (di tiap halaman) ---------- */
  function renderFooter() {
    clear(footer);
    footer.appendChild(h('p', {}, [h('strong', { text: 'Sumber: ' }), DATA.sumber]));
    footer.appendChild(h('p', { text: DATA.disclaimer }));
    footer.appendChild(h('p', { class: 'credit', text: 'Curated and Design by Muhammad Rizki Yaznil' }));
  }

  /* ---------- Checklist (localStorage per-scope) ---------- */
  function loadChecks(scope) {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + scope) || '{}'); }
    catch (e) { return {}; }
  }
  function saveChecks(scope, obj) {
    try { localStorage.setItem(STORAGE_PREFIX + scope, JSON.stringify(obj)); } catch (e) {}
  }

  // items: [{badge, text}]  scope: kunci localStorage (mis. "Dokter")
  function buildChecklist(scope, items, introNote) {
    var saved = loadChecks(scope);

    var counter = h('span', { text: '0 / ' + items.length });
    var fill = h('span', { class: 'fill' });
    var progress = h('div', { class: 'progress' }, [
      counter,
      h('span', { class: 'track' }, [fill])
    ]);

    function refresh() {
      var done = items.reduce(function (n, _, i) { return n + (saved[i] ? 1 : 0); }, 0);
      counter.textContent = done + ' / ' + items.length;
      fill.style.width = (items.length ? (done / items.length * 100) : 0) + '%';
    }

    var list = h('div', {});
    items.forEach(function (it, i) {
      var box = h('input', { type: 'checkbox', id: 'chk-' + scope + '-' + i });
      if (saved[i]) box.checked = true;
      var row = h('label', {
        class: 'check-item' + (saved[i] ? ' done' : ''),
        for: 'chk-' + scope + '-' + i
      }, [
        box,
        h('span', {}, [
          it.badge ? h('span', { class: 'std-badge', text: it.badge, style: 'margin-right:.4rem' }) : null,
          it.text
        ])
      ]);
      box.addEventListener('change', function (e) {
        saved[i] = e.target.checked;
        saveChecks(scope, saved);
        row.classList.toggle('done', e.target.checked);
        refresh();
      });
      list.appendChild(row);
    });

    var resetBtn = h('button', {
      class: 'btn no-print',
      type: 'button',
      onClick: function () {
        if (!window.confirm('Reset semua centang untuk bagian ini? Tindakan ini hanya menghapus catatan di perangkat ini.')) return;
        localStorage.removeItem(STORAGE_PREFIX + scope);
        Object.keys(saved).forEach(function (k) { delete saved[k]; });
        list.querySelectorAll('input').forEach(function (c) { c.checked = false; });
        list.querySelectorAll('.check-item').forEach(function (r) { r.classList.remove('done'); });
        refresh();
      }
    }, ['↺ Reset checklist bagian ini']);

    refresh();

    return h('div', { class: 'card' }, [
      h('p', { class: 'note', html: introNote }),
      progress,
      list,
      h('div', { style: 'margin-top:1rem' }, [resetBtn])
    ]);
  }

  /* ---------- Tabs helper ---------- */
  function buildTabs(defs) {
    // defs: [{id, label, build:()=>Node}]
    var tablist = h('div', { class: 'tabs', role: 'tablist' });
    var panels = [];
    var buttons = [];

    defs.forEach(function (d, i) {
      var btn = h('button', {
        class: 'tab', role: 'tab', 'data-tab': d.id,
        'aria-selected': i === 0 ? 'true' : 'false',
        id: 'tab-' + d.id, 'aria-controls': 'panel-' + d.id, type: 'button'
      }, [d.label]);
      buttons.push(btn);
      tablist.appendChild(btn);

      var panel = h('section', {
        class: 'panel' + (i === 0 ? ' active' : ''), role: 'tabpanel',
        id: 'panel-' + d.id, 'aria-labelledby': 'tab-' + d.id
      }, [h('h2', { class: 'print-h', text: d.label })]);
      panel.appendChild(d.build());
      panels.push(panel);

      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
        panels.forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + d.id); });
      });
    });

    var frag = document.createDocumentFragment();
    frag.appendChild(tablist);
    panels.forEach(function (p) { frag.appendChild(p); });
    return { fragment: frag, buttons: buttons, panels: panels, defs: defs };
  }
  function selectTab(tabsObj, id) {
    tabsObj.defs.forEach(function (d, i) {
      var on = d.id === id;
      tabsObj.buttons[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabsObj.panels[i].classList.toggle('active', on);
    });
  }

  /* ---------- Views ---------- */
  function crumbs(parts) {
    var nav = h('nav', { class: 'crumbs', 'aria-label': 'Remah' });
    parts.forEach(function (p, i) {
      if (i > 0) nav.appendChild(document.createTextNode(' › '));
      if (p.href) nav.appendChild(h('a', { href: p.href, text: p.label }));
      else nav.appendChild(h('span', { text: p.label }));
    });
    return nav;
  }

  function viewHome() {
    clear(app);
    app.appendChild(h('div', { class: 'lead' }, [
      h('h1', { text: 'Handbook Kesiapan Akreditasi RS' }),
      h('p', { text: 'Sarikan berbasis peran dari Standar Akreditasi RS (KMK 1596/2024) dan Instrumen Survei Akreditasi RS (Kepdirjen 47104/2024) untuk orientasi internal. Pilih profesi Anda, atau buka bagian umum untuk gambaran menyeluruh.' })
    ]));

    // Referensi cepat (kode emergensi & kebersihan tangan)
    if (DATA.kodeEmergensi || DATA.cuciTangan) {
      app.appendChild(h('h2', { class: 'section-title', text: 'Referensi cepat' }));
      var qr = h('div', { class: 'grid grid-2' });
      if (DATA.kodeEmergensi) {
        qr.appendChild(h('a', { class: 'pcard qcard', href: '#/emergensi' }, [
          h('h3', {}, [h('span', { class: 'qicon', 'aria-hidden': 'true', text: '🚨' }), 'Kode Emergensi']),
          h('p', { text: 'Kode darurat rumah sakit yang umum (Code Blue, Red, Black, dll) beserta artinya.' })
        ]));
      }
      if (DATA.cuciTangan) {
        qr.appendChild(h('a', { class: 'pcard qcard', href: '#/cuci-tangan' }, [
          h('h3', {}, [h('span', { class: 'qicon', 'aria-hidden': 'true', text: '🧼' }), 'Kebersihan Tangan']),
          h('p', { text: 'Enam langkah cuci tangan (dengan ilustrasi) dan lima momen kebersihan tangan.' })
        ]));
      }
      app.appendChild(qr);
    }

    // Visi, Misi & Moto sebagai kartu di beranda
    var vmn0 = DATA.visiMisiNilai;
    if (vmn0 && ((vmn0.visi && vmn0.visi.trim()) || (vmn0.misi && vmn0.misi.length) || (vmn0.nilai && vmn0.nilai.length))) {
      app.appendChild(h('div', { class: 'section-head' }, [
        h('h2', { class: 'section-title', text: 'Visi, Misi & Moto ' + (vmn0.nama || '') }),
        h('a', { class: 'section-link', href: '#/visi' }, ['Buka & cetak →'])
      ]));

      if (vmn0.visi && vmn0.visi.trim()) {
        app.appendChild(h('div', { class: 'card' }, [
          h('h3', { class: 'card-h', text: 'Visi' }),
          h('p', { text: vmn0.visi })
        ]));
      }

      var pair = h('div', { class: 'grid grid-2' });
      if (Array.isArray(vmn0.misi) && vmn0.misi.length) {
        var olM = h('ol', { class: 'clean' });
        vmn0.misi.forEach(function (m) { olM.appendChild(h('li', { text: m })); });
        pair.appendChild(h('div', { class: 'card' }, [h('h3', { class: 'card-h', text: 'Misi' }), olM]));
      }
      if (Array.isArray(vmn0.nilai) && vmn0.nilai.length) {
        var ulN = h('ul', { class: 'clean' });
        vmn0.nilai.forEach(function (n) {
          if (Array.isArray(n)) ulN.appendChild(h('li', {}, [h('strong', { text: n[0] + (n[1] ? ' — ' : '') }), n[1] || '']));
          else ulN.appendChild(h('li', { text: n }));
        });
        var nChildren = [h('h3', { class: 'card-h', text: 'Moto' })];
        if (vmn0.moto && vmn0.moto.trim()) nChildren.push(h('p', { class: 'note' }, [h('strong', { text: vmn0.moto }), ' — enam nilai yang menjadi budaya kerja.']));
        nChildren.push(ulN);
        pair.appendChild(h('div', { class: 'card' }, nChildren));
      }
      app.appendChild(pair);
    }

    app.appendChild(h('h2', { class: 'section-title', text: 'Handbook per profesi' }));
    var grid = h('div', { class: 'grid' });
    (DATA.profesi || []).forEach(function (p) {
      var chips = h('div', { class: 'chips' });
      (p.standar || []).forEach(function (s) { chips.appendChild(h('span', { class: 'chip', text: s })); });
      grid.appendChild(h('a', { class: 'pcard', href: '#/profesi/' + encodeURIComponent(p.id) }, [
        h('h3', { text: p.judul }),
        h('p', { text: p.ruang }),
        chips
      ]));
    });
    app.appendChild(grid);

    app.appendChild(h('h2', { class: 'section-title', text: 'Bagian umum' }));
    var grid2 = h('div', { class: 'grid' });
    grid2.appendChild(h('a', { class: 'pcard', href: '#/umum' }, [
      h('h3', { text: 'Standar, SKP, Program Nasional & Skoring' }),
      h('p', { text: '15 bab standar dalam 4 kelompok, 6 Sasaran Keselamatan Pasien, 6 Program Nasional, kode pembuktian R-D-O-W-S, dan skema skoring TL/TS/TT/TDD.' })
    ]));
    if (DATA.standarRinci) {
      grid2.appendChild(h('a', { class: 'pcard', href: '#/standar' }, [
        h('h3', { text: 'Standar Rinci (Instrumen)' }),
        h('p', { text: 'Peta per-bab: pernyataan tiap standar (TKRS, KPS, SKP, PKPO, dll) beserta metode pembuktian R–D–O–W–S.' })
      ]));
    }
    app.appendChild(grid2);

    document.title = 'Handbook Kesiapan Akreditasi RS — RSP CPL USU';
    window.scrollTo(0, 0);
  }

  function viewProfesi(id, activeTab) {
    var p = findProfesi(id);
    if (!p) { viewNotFound('Profesi tidak ditemukan.'); return; }
    clear(app);

    app.appendChild(crumbs([
      { label: 'Beranda', href: '#/' },
      { label: 'Profesi' },
      { label: p.judul }
    ]));

    // Head
    var chips = h('div', { class: 'chips', 'aria-label': 'Standar terkait' });
    (p.standar || []).forEach(function (s) { chips.appendChild(h('span', { class: 'chip', text: s })); });
    app.appendChild(h('section', { class: 'profile-head' }, [
      h('div', { class: 'head-top' }, [
        h('h1', { text: p.judul }),
        printIconBtn('Cetak handbook profesi ini')
      ]),
      h('p', { class: 'ruang', text: p.ruang }),
      chips,
      h('div', { class: 'head-actions' }, [
        h('a', { class: 'btn', href: '#/' }, ['← Pilih profesi lain'])
      ])
    ]));

    // Tab: Kompetensi & Poin Standar
    function buildKompetensi() {
      var frag = document.createDocumentFragment();
      if (p.tugasInti && p.tugasInti.length) {
        var ulTugas = h('ul', { class: 'clean' });
        p.tugasInti.forEach(function (t) { ulTugas.appendChild(h('li', { text: t })); });
        frag.appendChild(h('div', { class: 'card' }, [h('h2', { text: 'Tugas inti' }), ulTugas]));
      }
      var card = h('div', { class: 'card' });
      (p.poin || []).forEach(function (blok) {
        var ul = h('ul', { class: 'clean' });
        (blok.isi || []).forEach(function (i) { ul.appendChild(h('li', { text: i })); });
        card.appendChild(h('div', { class: 'std-block' }, [
          h('h3', {}, [h('span', { class: 'std-badge', text: blok.std })]),
          ul
        ]));
      });
      frag.appendChild(card);
      return frag;
    }

    // Tab: Bukti
    function buildBukti() {
      var ul = h('ul', { class: 'clean' });
      (p.bukti || []).forEach(function (b) { ul.appendChild(h('li', { text: b })); });
      return h('div', { class: 'card' }, [ul]);
    }

    // Tab: Surveior
    function buildSurveior() {
      var ul = h('ul', { class: 'q-list' });
      (p.surveior || []).forEach(function (q) { ul.appendChild(h('li', { text: stripQuotes(q) })); });
      return h('div', { class: 'card' }, [ul]);
    }

    // Tab: KPI (opsional, mis. KPI DPJP)
    function buildKPI() {
      var k = p.kpi || {};
      var frag = document.createDocumentFragment();
      if (k.catatan) frag.appendChild(h('p', { class: 'note callout', text: k.catatan }));
      var grid = h('div', { class: 'kpi-grid' });
      (k.items || []).forEach(function (row) {
        var icon = row[0], label = row[1], aspek = row[2], nilai = row[3], target = row[4], alasan = row[5] || [];
        var ul = h('ul', { class: 'kpi-why' });
        alasan.forEach(function (a) { ul.appendChild(h('li', { text: a })); });
        grid.appendChild(h('div', { class: 'kpi-card' }, [
          h('div', { class: 'kpi-head' }, [
            h('span', { class: 'kpi-icon', 'aria-hidden': 'true', text: icon }),
            h('span', { class: 'kpi-label', text: label })
          ]),
          h('div', { class: 'kpi-metric' }, [
            aspek ? h('span', { class: 'kpi-aspek', text: aspek }) : null,
            h('span', { class: 'kpi-nilai', text: nilai })
          ]),
          h('div', { class: 'kpi-target' }, [
            h('span', { class: 'kpi-target-lbl', text: 'Target' }),
            h('strong', { class: 'kpi-target-val', text: target })
          ]),
          ul
        ]));
      });
      frag.appendChild(grid);
      return frag;
    }

    // Tab: Checklist (gabungan poin standar profesi)
    function buildChecklistTab() {
      var items = [];
      (p.poin || []).forEach(function (blok) {
        (blok.isi || []).forEach(function (i) { items.push({ badge: blok.std, text: i }); });
      });
      var note = 'Status centang <strong>tersimpan lokal di perangkat ini saja</strong> (localStorage) — tidak terkirim ke server dan tidak terpusat. Browser atau perangkat lain punya catatan tersendiri.';
      return buildChecklist(p.id, items, note);
    }

    var tabDefs = [
      { id: 'kompetensi', label: 'Kompetensi & Poin Standar', build: buildKompetensi }
    ];
    if (p.kpi && p.kpi.items && p.kpi.items.length) {
      tabDefs.push({ id: 'kpi', label: (p.kpi.judul || 'KPI'), build: buildKPI });
    }
    tabDefs.push(
      { id: 'bukti', label: 'Bukti / Dokumen', build: buildBukti },
      { id: 'surveior', label: 'Pertanyaan Surveior', build: buildSurveior },
      { id: 'checklist', label: 'Checklist Self-Assessment', build: buildChecklistTab }
    );
    var tabsObj = buildTabs(tabDefs);
    app.appendChild(tabsObj.fragment);
    if (activeTab) selectTab(tabsObj, activeTab);

    document.title = p.judul + ' — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  function viewUmum(activeTab) {
    var u = DATA.umum || {};
    clear(app);
    app.appendChild(crumbs([{ label: 'Beranda', href: '#/' }, { label: 'Bagian umum' }]));

    app.appendChild(h('section', { class: 'profile-head' }, [
      h('div', { class: 'head-top' }, [
        h('h1', { text: 'Standar, SKP, Program Nasional & Skoring' }),
        printIconBtn('Cetak bagian umum')
      ]),
      h('p', { class: 'ruang', text: 'Gambaran menyeluruh yang berlaku lintas profesi.' }),
      h('div', { class: 'head-actions' }, [
        h('a', { class: 'btn', href: '#/' }, ['← Beranda'])
      ])
    ]));

    function buildStandar() {
      var frag = document.createDocumentFragment();
      var card = h('div', { class: 'card' });
      (u.kelompok_standar || []).forEach(function (g) {
        var table = h('table', { class: 'std-table' });
        var tbody = h('tbody', {});
        (g.items || []).forEach(function (row) {
          tbody.appendChild(h('tr', {}, [
            h('td', { text: row[0] }),
            h('td', { text: row[1] })
          ]));
        });
        table.appendChild(tbody);
        card.appendChild(h('div', { class: 'grup' }, [h('h3', { text: g.grup }), table]));
      });
      frag.appendChild(card);
      return frag;
    }

    function buildSkp() {
      var ul = h('ul', { class: 'clean' });
      (u.skp || []).forEach(function (s) { ul.appendChild(h('li', { text: s })); });
      return h('div', { class: 'card' }, [h('h2', { text: 'Sasaran Keselamatan Pasien (SKP)' }), ul]);
    }

    function buildPrognas() {
      var ol = h('ol', { class: 'clean' });
      (u.prognas || []).forEach(function (s) { ol.appendChild(h('li', { text: s })); });
      var uls = h('ul', { class: 'clean' });
      (u.skoring || []).forEach(function (s) { uls.appendChild(h('li', { text: s })); });
      var frag = document.createDocumentFragment();
      frag.appendChild(h('div', { class: 'card' }, [h('h2', { text: 'Program Nasional (PROGNAS)' }), ol]));
      frag.appendChild(h('div', { class: 'card' }, [h('h2', { text: 'Skema skoring penilaian' }), uls]));
      if (Array.isArray(u.kodePembuktian) && u.kodePembuktian.length) {
        var ulK = h('ul', { class: 'clean' });
        u.kodePembuktian.forEach(function (k) {
          ulK.appendChild(h('li', {}, [h('strong', { text: k[0] + ' — ' }), k[1] || '']));
        });
        frag.appendChild(h('div', { class: 'card' }, [
          h('h2', { text: 'Metode pembuktian penilaian (R–D–O–W–S)' }),
          h('p', { class: 'note', text: 'Tiap elemen penilaian pada instrumen diberi kode metode pembuktian berikut.' }),
          ulK
        ]));
      }
      return frag;
    }

    function buildChecklistTab() {
      var items = [];
      (u.skp || []).forEach(function (s) { items.push({ badge: 'SKP', text: s }); });
      (u.prognas || []).forEach(function (s) { items.push({ badge: 'PROGNAS', text: s }); });
      var note = 'Checklist umum (SKP & Program Nasional). Status <strong>tersimpan lokal di perangkat ini saja</strong> (localStorage), tidak terpusat dan tidak terkirim ke server.';
      return buildChecklist('_umum', items, note);
    }

    var tabsObj = buildTabs([
      { id: 'standar', label: 'Kelompok Standar', build: buildStandar },
      { id: 'skp', label: 'SKP', build: buildSkp },
      { id: 'prognas', label: 'PROGNAS & Skoring', build: buildPrognas },
      { id: 'checklist', label: 'Checklist Self-Assessment', build: buildChecklistTab }
    ]);
    app.appendChild(tabsObj.fragment);
    if (activeTab) selectTab(tabsObj, activeTab);

    document.title = 'Bagian Umum — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  function viewVisiMisi() {
    var v = DATA.visiMisiNilai || {};
    clear(app);
    app.appendChild(crumbs([{ label: 'Beranda', href: '#/' }, { label: 'Visi, Misi & Moto' }]));

    app.appendChild(h('section', { class: 'profile-head' }, [
      h('div', { class: 'head-top' }, [
        h('h1', { text: 'Visi, Misi & Moto ' + (v.nama || '') }),
        printIconBtn('Cetak visi, misi & moto')
      ]),
      h('div', { class: 'head-actions' }, [
        h('a', { class: 'btn', href: '#/' }, ['← Beranda'])
      ])
    ]));

    var hasContent = (v.visi && v.visi.trim()) ||
      (Array.isArray(v.misi) && v.misi.length) ||
      (Array.isArray(v.nilai) && v.nilai.length);

    if (!hasContent) {
      app.appendChild(h('div', { class: 'card' }, [
        h('p', { class: 'note', text: 'Konten visi, misi, dan moto belum diisi. Isi bagian "visiMisiNilai" pada content.json untuk menampilkannya di sini.' })
      ]));
    }

    if (v.visi && v.visi.trim()) {
      app.appendChild(h('div', { class: 'card' }, [
        h('h2', { text: 'Visi' }),
        h('p', { text: v.visi })
      ]));
    }
    if (Array.isArray(v.misi) && v.misi.length) {
      var ol = h('ol', { class: 'clean' });
      v.misi.forEach(function (m) { ol.appendChild(h('li', { text: m })); });
      app.appendChild(h('div', { class: 'card' }, [h('h2', { text: 'Misi' }), ol]));
    }
    if (Array.isArray(v.nilai) && v.nilai.length) {
      var ul = h('ul', { class: 'clean' });
      v.nilai.forEach(function (n) {
        // Dukung format string biasa atau pasangan ["Kata","penjelasan"]
        if (Array.isArray(n)) {
          ul.appendChild(h('li', {}, [h('strong', { text: n[0] + (n[1] ? ' — ' : '') }), n[1] || '']));
        } else {
          ul.appendChild(h('li', { text: n }));
        }
      });
      var nilaiCard = [h('h2', { text: 'Moto' })];
      if (v.moto && v.moto.trim()) {
        nilaiCard.push(h('p', { class: 'note' }, [h('strong', { text: v.moto }), ' — enam nilai yang menjadi budaya kerja.']));
      }
      nilaiCard.push(ul);
      app.appendChild(h('div', { class: 'card' }, nilaiCard));
    }

    document.title = 'Visi, Misi & Moto — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  /* ---------- Referensi cepat: Kode Emergensi ---------- */
  function viewEmergensi() {
    var e = DATA.kodeEmergensi || {};
    clear(app);
    app.appendChild(crumbs([{ label: 'Beranda', href: '#/' }, { label: 'Kode Emergensi' }]));

    app.appendChild(h('section', { class: 'profile-head' }, [
      h('div', { class: 'head-top' }, [
        h('h1', { text: 'Kode Emergensi Rumah Sakit' }),
        printIconBtn('Cetak kode emergensi')
      ]),
      h('div', { class: 'head-actions' }, [
        h('a', { class: 'btn', href: '#/' }, ['← Beranda'])
      ])
    ]));

    if (e.catatan) {
      app.appendChild(h('p', { class: 'note callout', text: e.catatan }));
    }

    var labelNo = e.labelNoPenting || 'No. penting';
    var list = h('div', { class: 'code-grid' });
    (e.kode || []).forEach(function (row) {
      var nama = row[0], warna = row[1] || '#555', arti = row[2] || '', no = row[3] || '';
      var body = [
        h('span', { class: 'code-name', style: 'color:' + warna, text: nama }),
        h('p', { class: 'code-arti', text: arti })
      ];
      if (no) {
        body.push(h('a', {
          class: 'code-no', href: 'tel:' + no, style: 'background:' + warna,
          title: labelNo + ' ' + nama
        }, [
          h('span', { class: 'code-no-ico', 'aria-hidden': 'true', text: '☎' }),
          h('span', { class: 'code-no-lbl', text: labelNo + ': ' }),
          h('strong', { text: no })
        ]));
      }
      list.appendChild(h('div', { class: 'code-item' }, [
        h('span', { class: 'code-dot', style: 'background:' + warna, 'aria-hidden': 'true' }),
        h('div', { class: 'code-body' }, body)
      ]));
    });
    app.appendChild(list);

    document.title = 'Kode Emergensi — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  /* ---------- Referensi cepat: Kebersihan Tangan ---------- */
  function viewCuciTangan() {
    var c = DATA.cuciTangan || {};
    clear(app);
    app.appendChild(crumbs([{ label: 'Beranda', href: '#/' }, { label: 'Kebersihan Tangan' }]));

    app.appendChild(h('section', { class: 'profile-head' }, [
      h('div', { class: 'head-top' }, [
        h('h1', { text: 'Kebersihan Tangan' }),
        printIconBtn('Cetak panduan kebersihan tangan')
      ]),
      h('div', { class: 'head-actions' }, [
        h('a', { class: 'btn', href: '#/' }, ['← Beranda'])
      ])
    ]));

    if (c.catatan) {
      app.appendChild(h('p', { class: 'note callout', text: c.catatan }));
    }

    // Poster resmi (opsional). Tampil bila berkasnya tersedia; jika tidak,
    // figure disembunyikan otomatis dan panduan langkah di bawah tetap tampil.
    if (c.poster) {
      var pImg = h('img', {
        class: 'poster-img',
        src: c.poster,
        alt: 'Poster ' + (c.posterJudul || '6 Langkah Cuci Tangan') + ' — ' + (c.posterKredit || 'Kementerian Kesehatan RI'),
        loading: 'lazy'
      });
      var pFig = h('figure', { class: 'poster-wrap' }, [
        pImg,
        h('figcaption', { class: 'poster-kredit', text: c.posterKredit || 'Sumber: Kementerian Kesehatan RI (GERMAS)' })
      ]);
      pImg.addEventListener('error', function () { pFig.style.display = 'none'; });
      app.appendChild(pFig);
    }

    // Lima momen
    app.appendChild(h('h2', { class: 'section-title', text: 'Lima momen kebersihan tangan' }));

    // Cadangan: diagram SVG orisinal + daftar teks momen. Dipakai saat
    // poster WHO tidak tersedia (atau gagal dimuat). Saat poster tampil,
    // teks KAPAN/MENGAPA sudah termuat di dalam poster sehingga tak diulang.
    function momenFallbackNodes() {
      var frag = document.createDocumentFragment();
      frag.appendChild(h('figure', { class: 'momen-img-solo' }, [
        h('img', { src: 'assets/handwash/moments.svg', alt: 'Diagram lima momen kebersihan tangan di sekitar pasien', loading: 'lazy' })
      ]));
      var olMomen = h('ol', { class: 'momen-list' });
      (c.limaMomen || []).forEach(function (row) {
        var judul = Array.isArray(row) ? row[0] : row;
        var teks = Array.isArray(row) ? (row[1] || '') : '';
        olMomen.appendChild(h('li', {}, [
          h('strong', { text: judul }),
          teks ? h('span', { class: 'momen-why', text: teks }) : null
        ]));
      });
      frag.appendChild(olMomen);
      return frag;
    }

    if (c.momenPoster) {
      var mImg = h('img', {
        class: 'poster-img',
        src: c.momenPoster,
        alt: 'Poster lima momen kebersihan tangan — ' + (c.momenKredit || 'World Health Organization (WHO)'),
        loading: 'lazy'
      });
      var mFig = h('figure', { class: 'poster-wrap' }, [
        mImg,
        h('figcaption', { class: 'poster-kredit', text: c.momenKredit || 'Sumber: World Health Organization (WHO)' })
      ]);
      // Bila berkas poster momen gagal dimuat, jatuh ke diagram + daftar teks.
      mImg.addEventListener('error', function () {
        mFig.parentNode.insertBefore(momenFallbackNodes(), mFig);
        mFig.remove();
      });
      app.appendChild(mFig);
    } else {
      app.appendChild(momenFallbackNodes());
    }

    document.title = 'Kebersihan Tangan — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  /* ---------- Standar Rinci ---------- */
  function kodeSlug(kode) { return encodeURIComponent(kode); }

  // "D, S, W" -> badge kecil per metode
  function metodeBadges(m) {
    var out = [];
    if (!m) return [document.createTextNode('—')];
    String(m).split(/[,\s]+/).filter(Boolean).forEach(function (code) {
      out.push(h('span', { class: 'metode-badge', text: code, title: metodeNama(code) }));
    });
    return out;
  }
  function metodeNama(code) {
    return { R: 'Regulasi', D: 'Dokumen', O: 'Observasi', W: 'Wawancara', S: 'Simulasi' }[code] || code;
  }
  // Normalisasi satu entri standar (mendukung format [kode, desc] atau objek detail)
  function normStandar(s) {
    if (Array.isArray(s)) return { kode: s[0], pernyataan: s[1], tujuan: null, ep: null };
    return { kode: s.kode, pernyataan: s.pernyataan, tujuan: s.tujuan, ep: s.ep };
  }

  function viewStandarIndex() {
    var sr = DATA.standarRinci || {};
    var bab = sr.bab || [];
    clear(app);
    app.appendChild(crumbs([{ label: 'Beranda', href: '#/' }, { label: 'Standar Rinci' }]));
    app.appendChild(h('div', { class: 'lead' }, [
      h('h1', { text: 'Standar Rinci (Instrumen Akreditasi)' }),
      h('p', { text: 'Peta per-bab: pernyataan standar disarikan dari Instrumen Survei Akreditasi RS (Kepdirjen 47104/2024). Pilih bab untuk melihat daftar standarnya.' })
    ]));

    // Kelompokkan bab sesuai kelompok, urut tetap
    var kelompokUrut = [];
    bab.forEach(function (b) { if (kelompokUrut.indexOf(b.kelompok) === -1) kelompokUrut.push(b.kelompok); });
    kelompokUrut.forEach(function (kel) {
      app.appendChild(h('h2', { class: 'section-title', text: kel }));
      var grid = h('div', { class: 'grid' });
      bab.filter(function (b) { return b.kelompok === kel; }).forEach(function (b) {
        grid.appendChild(h('a', { class: 'pcard', href: '#/standar/' + kodeSlug(b.kode) }, [
          h('h3', {}, [b.nama, ' ', h('span', { class: 'chip', text: b.kode })]),
          h('p', { text: (b.standar ? b.standar.length + ' standar. ' : '') + (b.ringkas || '') })
        ]));
      });
      app.appendChild(grid);
    });

    document.title = 'Standar Rinci — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  function viewStandarDetail(kode) {
    var sr = DATA.standarRinci || {};
    var b = (sr.bab || []).filter(function (x) { return x.kode === kode; })[0];
    if (!b) { viewNotFound('Bab standar tidak ditemukan.'); return; }
    clear(app);
    app.appendChild(crumbs([
      { label: 'Beranda', href: '#/' },
      { label: 'Standar Rinci', href: '#/standar' },
      { label: b.kode }
    ]));

    app.appendChild(h('section', { class: 'profile-head' }, [
      h('div', { class: 'head-top' }, [
        h('h1', {}, [b.nama, ' ', h('span', { class: 'chip', text: b.kode })]),
        printIconBtn('Cetak bab ' + b.kode)
      ]),
      h('p', { class: 'ruang', text: b.ringkas || '' }),
      h('div', { class: 'head-actions' }, [
        h('a', { class: 'btn', href: '#/standar' }, ['← Semua bab'])
      ])
    ]));

    var adaDetail = (b.standar || []).some(function (s) { return !Array.isArray(s) && Array.isArray(s.ep); });
    app.appendChild(h('h2', { class: 'section-title', text: 'Daftar standar' + (adaDetail ? ' (dengan Elemen Penilaian)' : '') }));

    (b.standar || []).forEach(function (s0) {
      var s = normStandar(s0);
      var block = h('div', { class: 'card std-detail' });
      block.appendChild(h('h3', {}, [h('span', { class: 'std-badge', text: s.kode }), ' ', s.pernyataan || '']));
      if (s.tujuan) block.appendChild(h('p', { class: 'tujuan' }, [h('strong', { text: 'Maksud & tujuan: ' }), s.tujuan]));
      if (Array.isArray(s.ep) && s.ep.length) {
        var tbl = h('table', { class: 'ep-table' });
        tbl.appendChild(h('thead', {}, [h('tr', {}, [
          h('th', { text: 'Elemen Penilaian' }),
          h('th', { text: 'Metode' }),
          h('th', { text: 'Kelengkapan bukti' }),
          h('th', { text: 'Skor' })
        ])]));
        var tb = h('tbody', {});
        s.ep.forEach(function (e, i) {
          tb.appendChild(h('tr', {}, [
            h('td', {}, [h('span', { class: 'ep-no', text: (i + 1) + '. ' }), e.t || '']),
            h('td', {}, metodeBadges(e.m)),
            h('td', { text: e.b || '—' }),
            h('td', { class: 'ep-skor', text: e.s || '' })
          ]));
        });
        tbl.appendChild(tb);
        block.appendChild(h('div', { class: 'ep-wrap' }, [tbl]));
      }
      app.appendChild(block);
    });

    // Legenda kode pembuktian & skoring (dari umum)
    var u = DATA.umum || {};
    if (Array.isArray(u.kodePembuktian) && u.kodePembuktian.length) {
      var ulK = h('ul', { class: 'clean' });
      u.kodePembuktian.forEach(function (k) { ulK.appendChild(h('li', {}, [h('strong', { text: k[0] + ' — ' }), k[1] || ''])); });
      var kids = [
        h('h2', { text: 'Metode pembuktian (R–D–O–W–S)' }),
        h('p', { class: 'note', text: 'Tiap Elemen Penilaian (EP) pada instrumen diberi kode metode pembuktian, dinilai dengan skema TL=10 / TS=5 / TT=0 (TDD tidak dinilai). Nomor EP dan daftar kelengkapan bukti tidak dicantumkan di sini.' }),
        ulK
      ];
      app.appendChild(h('div', { class: 'card' }, kids));
    }

    document.title = b.nama + ' (' + b.kode + ') — Standar Rinci';
    window.scrollTo(0, 0);
  }

  /* ---------- Search ---------- */
  function buildSearchIndex() {
    SEARCH_INDEX = [];
    var u = DATA.umum || {};

    (u.skp || []).forEach(function (s) {
      SEARCH_INDEX.push({ text: s, badge: 'SKP', where: 'Bagian Umum · SKP', href: '#/umum/skp' });
    });
    (u.prognas || []).forEach(function (s) {
      SEARCH_INDEX.push({ text: s, badge: 'PROGNAS', where: 'Bagian Umum · PROGNAS', href: '#/umum/prognas' });
    });
    (u.kelompok_standar || []).forEach(function (g) {
      (g.items || []).forEach(function (row) {
        SEARCH_INDEX.push({ text: row[0] + ' — ' + row[1], badge: row[0], where: 'Bagian Umum · ' + g.grup, href: '#/umum/standar' });
      });
    });

    var sr = DATA.standarRinci || {};
    (sr.bab || []).forEach(function (b) {
      (b.standar || []).forEach(function (s0) {
        var s = normStandar(s0);
        SEARCH_INDEX.push({ text: s.kode + ' — ' + (s.pernyataan || ''), badge: b.kode, where: 'Standar Rinci · ' + b.nama, href: '#/standar/' + encodeURIComponent(b.kode) });
        if (Array.isArray(s.ep)) {
          s.ep.forEach(function (e) {
            SEARCH_INDEX.push({ text: e.t, badge: s.kode, where: 'Standar Rinci · ' + b.nama + ' · EP', href: '#/standar/' + encodeURIComponent(b.kode) });
          });
        }
      });
    });

    var ke = DATA.kodeEmergensi || {};
    (ke.kode || []).forEach(function (row) {
      var t = row[0] + ' — ' + (row[2] || '');
      if (row[3]) t += ' (No. penting: ' + row[3] + ')';
      SEARCH_INDEX.push({ text: t, badge: 'Kode', where: 'Referensi cepat · Kode Emergensi', href: '#/emergensi' });
    });
    var ct = DATA.cuciTangan || {};
    (ct.limaMomen || []).forEach(function (row, i) {
      var judul = Array.isArray(row) ? row[0] : row;
      var teks = Array.isArray(row) ? (row[1] || '') : '';
      SEARCH_INDEX.push({ text: 'Momen ' + (i + 1) + ': ' + judul + (teks ? ' — ' + teks : ''), badge: '5 Momen', where: 'Referensi cepat · Kebersihan Tangan', href: '#/cuci-tangan' });
    });

    (DATA.profesi || []).forEach(function (p) {
      var base = '#/profesi/' + encodeURIComponent(p.id);
      (p.tugasInti || []).forEach(function (t) {
        SEARCH_INDEX.push({ text: t, badge: 'Tugas', where: p.judul + ' · Tugas inti', href: base + '/kompetensi' });
      });
      (p.poin || []).forEach(function (blok) {
        (blok.isi || []).forEach(function (i) {
          SEARCH_INDEX.push({ text: i, badge: blok.std, where: p.judul + ' · Poin standar', href: base + '/kompetensi' });
        });
      });
      (p.bukti || []).forEach(function (b) {
        SEARCH_INDEX.push({ text: b, badge: 'Bukti', where: p.judul + ' · Bukti/Dokumen', href: base + '/bukti' });
      });
      (p.surveior || []).forEach(function (q) {
        SEARCH_INDEX.push({ text: stripQuotes(q), badge: 'Surveior', where: p.judul + ' · Pertanyaan surveior', href: base + '/surveior' });
      });
      if (p.kpi && p.kpi.items) {
        p.kpi.items.forEach(function (row) {
          var t = row[1] + ' — ' + row[3] + ' (Target ' + row[4] + ')';
          if (row[5] && row[5].length) t += '. ' + row[5].join('; ');
          SEARCH_INDEX.push({ text: t, badge: 'KPI', where: p.judul + ' · ' + (p.kpi.judul || 'KPI'), href: base + '/kpi' });
        });
      }
    });
  }

  function highlight(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    var terms = q.split(/\s+/).filter(Boolean).map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    if (!terms.length) return safe;
    var re = new RegExp('(' + terms.join('|') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function viewSearch(q) {
    clear(app);
    app.appendChild(crumbs([{ label: 'Beranda', href: '#/' }, { label: 'Pencarian' }]));
    q = (q || '').trim();
    if (searchInput.value !== q) searchInput.value = q;

    app.appendChild(h('div', { class: 'lead' }, [
      h('h1', { text: 'Hasil pencarian' }),
      h('p', {}, [q ? ('Kata kunci: “' + q + '”') : 'Ketik kata kunci pada kotak pencarian di atas.'])
    ]));

    if (!q) { document.title = 'Pencarian — Handbook Akreditasi RS'; return; }

    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = SEARCH_INDEX.filter(function (e) {
      var hay = (e.text + ' ' + e.badge + ' ' + e.where).toLowerCase();
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });

    if (!hits.length) {
      app.appendChild(h('p', { class: 'empty', text: 'Tidak ada hasil untuk kata kunci tersebut. Coba istilah lain atau lebih umum.' }));
    } else {
      app.appendChild(h('p', { class: 'meta', text: hits.length + ' hasil ditemukan.', style: 'color:var(--ink-soft);font-size:.82rem;margin:.2rem 0 1rem' }));
      hits.forEach(function (e) {
        app.appendChild(h('div', { class: 'result' }, [
          h('div', { class: 'meta' }, [
            h('span', { class: 'std-badge', text: e.badge }),
            h('span', { text: e.where })
          ]),
          h('a', { class: 'result-title', href: e.href, html: highlight(e.text, q) })
        ]));
      });
    }
    document.title = 'Pencarian: ' + q + ' — Handbook Akreditasi RS';
    window.scrollTo(0, 0);
  }

  function viewNotFound(msg) {
    clear(app);
    app.appendChild(h('div', { class: 'lead' }, [
      h('h1', { text: 'Halaman tidak ditemukan' }),
      h('p', { text: msg || 'Tautan tidak dikenali.' })
    ]));
    app.appendChild(h('a', { class: 'btn', href: '#/' }, ['← Kembali ke beranda']));
  }

  /* ---------- Router ---------- */
  function router() {
    var hash = window.location.hash.replace(/^#/, '') || '/';
    // pisahkan query untuk pencarian
    var qi = hash.indexOf('?');
    var query = '';
    if (qi !== -1) { query = hash.slice(qi + 1); hash = hash.slice(0, qi); }
    var parts = hash.split('/').filter(Boolean); // mis. ['profesi','Dokter','bukti']

    if (parts.length === 0) return viewHome();

    if (parts[0] === 'profesi' && parts[1]) {
      return viewProfesi(decodeURIComponent(parts[1]), parts[2]);
    }
    if (parts[0] === 'umum') {
      return viewUmum(parts[1]);
    }
    if (parts[0] === 'visi') {
      return viewVisiMisi();
    }
    if (parts[0] === 'emergensi') {
      return viewEmergensi();
    }
    if (parts[0] === 'cuci-tangan') {
      return viewCuciTangan();
    }
    if (parts[0] === 'standar') {
      if (parts[1]) return viewStandarDetail(decodeURIComponent(parts[1]));
      return viewStandarIndex();
    }
    if (parts[0] === 'cari') {
      var q = '';
      query.split('&').forEach(function (kv) {
        var pair = kv.split('=');
        if (pair[0] === 'q') q = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
      });
      return viewSearch(q);
    }
    viewNotFound();
  }

  /* ---------- Search box wiring ---------- */
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = searchInput.value.trim();
    window.location.hash = '/cari?q=' + encodeURIComponent(q);
  });

  /* ---------- Modal & toast ---------- */
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var lastFocus = null;

  function openModal(title, bodyNode) {
    lastFocus = document.activeElement;
    modalTitle.textContent = title;
    clear(modalBody);
    modalBody.appendChild(bodyNode);
    modal.hidden = false;
    document.getElementById('modal-close').focus();
  }
  function closeModal() {
    modal.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!modal.hidden) closeModal(); closeMenu(); }
  });

  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200);
  }

  /* ---------- Menu ---------- */
  var menuToggle = document.getElementById('menu-toggle');
  var appMenu = document.getElementById('app-menu');
  function openMenu() { appMenu.hidden = false; menuToggle.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { appMenu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); }
  menuToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (appMenu.hidden) openMenu(); else closeMenu();
  });
  document.addEventListener('click', function (e) {
    if (!appMenu.hidden && !appMenu.contains(e.target) && e.target !== menuToggle) closeMenu();
  });

  /* ---------- Aksi: Tentang ---------- */
  function showAbout() {
    var box = h('div', {});
    box.appendChild(h('p', { text: 'Sarikan handbook kesiapan akreditasi rumah sakit berbasis peran untuk orientasi internal seluruh personel RS. Pilih profesi Anda untuk melihat kompetensi, bukti/dokumen, contoh pertanyaan surveior, dan checklist self-assessment.' }));
    box.appendChild(h('p', {}, [h('strong', { text: 'Sumber: ' }), (DATA && DATA.sumber) || 'Standar Akreditasi RS (KMK 1596/2024)']));
    box.appendChild(h('ul', {}, [
      h('li', { text: 'Pencarian kata kunci lintas seluruh konten.' }),
      h('li', { text: 'Checklist yang tersimpan lokal di perangkat ini (localStorage), lengkap dengan tombol reset.' }),
      h('li', { text: 'Mode cetak per profesi / bagian umum.' }),
      h('li', { text: 'Dapat dipasang sebagai aplikasi (PWA) dan diakses walau sedang offline.' })
    ]));
    box.appendChild(h('p', { class: 'fine', text: (DATA && DATA.disclaimer) || 'Sarikan untuk orientasi internal, bukan pengganti teks standar asli. Nomor EP tidak dicantumkan.' }));
    openModal('Tentang aplikasi', box);
  }

  /* ---------- Aksi: Bagikan ---------- */
  function shareUrl() {
    // Bagikan tautan aplikasi (beranda), bukan hash spesifik.
    return window.location.origin + window.location.pathname;
  }
  function showShareFallback(url) {
    var box = h('div', {});
    box.appendChild(h('p', { text: 'Salin dan bagikan tautan berikut:' }));
    var input = h('input', {
      type: 'text', value: url, readonly: 'readonly',
      style: 'width:100%;padding:.55rem .7rem;border:1px solid var(--line);border-radius:8px;font-size:.9rem'
    });
    var copyBtn = h('button', {
      class: 'btn btn-primary', type: 'button', style: 'margin-top:.7rem',
      onClick: function () {
        input.select();
        try { document.execCommand('copy'); toast('Tautan disalin.'); }
        catch (e) { toast('Silakan salin tautan secara manual.'); }
      }
    }, ['Salin tautan']);
    box.appendChild(input);
    box.appendChild(h('div', {}, [copyBtn]));
    openModal('Bagikan aplikasi', box);
    setTimeout(function () { input.focus(); input.select(); }, 50);
  }
  function shareApp() {
    var url = shareUrl();
    var payload = { title: 'Handbook Akreditasi RS — RSP CPL USU', text: 'Handbook kesiapan akreditasi RS RSP CPL USU.', url: url };
    if (navigator.share) {
      navigator.share(payload).catch(function () { /* dibatalkan pengguna: abaikan */ });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(function () { toast('Tautan aplikasi disalin.'); })
        .catch(function () { showShareFallback(url); });
    } else {
      showShareFallback(url);
    }
  }

  /* ---------- Aksi: Install (PWA) ---------- */
  var deferredPrompt = null;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    toast('Aplikasi berhasil dipasang.');
  });

  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

  function showInstallHelp() {
    var box = h('div', {});
    if (isStandalone) {
      box.appendChild(h('p', { text: 'Aplikasi sudah terpasang dan sedang dijalankan sebagai aplikasi.' }));
    } else if (isIOS()) {
      box.appendChild(h('p', { text: 'Di iPhone/iPad (Safari):' }));
      box.appendChild(h('ol', {}, [
        h('li', { text: 'Ketuk tombol Bagikan (ikon kotak dengan panah ke atas).' }),
        h('li', { text: 'Pilih “Tambahkan ke Layar Utama”.' }),
        h('li', { text: 'Ketuk “Tambah”. Ikon aplikasi akan muncul di layar utama.' })
      ]));
    } else {
      box.appendChild(h('p', { text: 'Untuk memasang aplikasi ini:' }));
      box.appendChild(h('ul', {}, [
        h('li', { text: 'Di Chrome/Edge Android: buka menu browser (⋮) lalu pilih “Instal aplikasi” / “Tambahkan ke layar utama”.' }),
        h('li', { text: 'Di Chrome/Edge desktop: klik ikon instal di ujung kanan bilah alamat.' })
      ]));
      box.appendChild(h('p', { class: 'fine', text: 'Pastikan aplikasi diakses melalui alamat https (bukan file lokal) agar opsi instalasi tersedia.' }));
    }
    openModal('Install aplikasi', box);
  }

  function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (r) {
        if (r && r.outcome === 'accepted') toast('Memasang aplikasi…');
        deferredPrompt = null;
      });
    } else {
      showInstallHelp();
    }
  }

  // Wiring item menu
  appMenu.addEventListener('click', function (e) {
    var item = e.target.closest('[data-action]');
    if (!item) return;
    closeMenu();
    var action = item.getAttribute('data-action');
    if (action === 'visi') window.location.hash = '/visi';
    else if (action === 'standar') window.location.hash = '/standar';
    else if (action === 'about') showAbout();
    else if (action === 'share') shareApp();
    else if (action === 'install') installApp();
  });

  /* ---------- Service worker (offline + installable) ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* abaikan bila gagal */ });
    });
  }

  /* ---------- Boot ---------- */
  function fatal(msg) {
    clear(app);
    app.appendChild(h('div', { class: 'lead' }, [
      h('h1', { text: 'Gagal memuat data' }),
      h('p', { text: msg })
    ]));
  }

  fetch('content.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      DATA = data;
      renderFooter();
      buildSearchIndex();
      window.addEventListener('hashchange', router);
      router();
    })
    .catch(function (err) {
      fatal('Tidak dapat membaca content.json (' + err.message + '). Jalankan lewat server statis / HTTP, bukan dengan membuka berkas langsung (file://).');
    });
})();
