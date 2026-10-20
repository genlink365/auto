// ==UserScript==
// @name         FB Auto Register + Security Panel
// @namespace    https://viayoo.com/6rpkld
// @version      4.2
// @match        https://*.facebook.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        PASSWORD: "manglar27",
        AUTO_REGISTER_DELAY: 3000,
        TOTP_KEY: "fbs_totp_secret"
    };

    const CSS = `
    #fbs{position:fixed;top:20px;left:20px;width:300px;padding:22px 20px;border-radius:20px;
      background:rgba(20,20,35,.72);backdrop-filter:blur(18px) saturate(160%);
      -webkit-backdrop-filter:blur(18px) saturate(160%);border:1px solid rgba(255,255,255,.12);
      box-shadow:0 8px 32px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08);
      z-index:999999;font-family:'Segoe UI',system-ui,sans-serif;color:#e8e8f0;
      animation:fbsIn .5s cubic-bezier(.2,.8,.2,1)}
    @keyframes fbsIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
    #fbs .t{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b8fbf;
      margin-bottom:16px;display:flex;align-items:center;gap:8px;font-weight:600}
    #fbs .t::before{content:"";width:6px;height:6px;border-radius:50%;background:#6c7bff;box-shadow:0 0 8px #6c7bff}
    #fbs .l{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6f74a0;margin-bottom:6px;font-weight:600}
    #fbs .cb{display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;margin-bottom:14px;
      border-radius:12px;background:linear-gradient(135deg,rgba(108,123,255,.14),rgba(108,123,255,.06));
      border:1px solid rgba(108,123,255,.25);color:#dfe2ff;font-family:'SF Mono',Consolas,monospace;
      font-size:13px;cursor:pointer;transition:all .22s;text-align:left;overflow:hidden;position:relative}
    #fbs .cb:hover{background:linear-gradient(135deg,rgba(108,123,255,.28),rgba(108,123,255,.12));
      border-color:rgba(108,123,255,.55);box-shadow:0 0 18px rgba(108,123,255,.25);transform:translateY(-1px)}
    #fbs .cb .v{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #fbs .cb .v.m{color:#7e83b0}
    #fbs .cb svg{width:16px;height:16px;opacity:.7;flex-shrink:0}
    #fbs .cb:hover svg{opacity:1}
    #fbs .cb.ok{border-color:rgba(80,220,140,.6);background:linear-gradient(135deg,rgba(80,220,140,.2),rgba(80,220,140,.08))}
    #fbs .cb.ok::after{content:"✓";position:absolute;right:14px;color:#50dc8c;font-weight:bold}
    #fbs .ab{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;
      padding:12px 14px;margin-bottom:14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);
      background:linear-gradient(135deg,#2a2d5c,#1e2145);color:#e8e8f0;font-size:13px;font-weight:600;
      letter-spacing:.3px;cursor:pointer;text-decoration:none;transition:all .22s}
    #fbs .ab:hover{background:linear-gradient(135deg,#34386e,#262a56);
      border-color:rgba(108,123,255,.5);box-shadow:0 0 18px rgba(108,123,255,.3);transform:translateY(-1px)}
    #fbs .ab svg{width:16px;height:16px;opacity:.85}
    #fbs .dv{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);margin:6px 0 16px}
    #fbs .tb{border-radius:14px;background:rgba(0,0,0,.25);border:1px solid rgba(108,123,255,.18);padding:14px}
    #fbs .th{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    #fbs .th span{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6f74a0;font-weight:600}
    #fbs .tw{position:relative;width:22px;height:22px}
    #fbs .tw svg{transform:rotate(-90deg)}
    #fbs .tw circle{fill:none;stroke-width:3}
    #fbs .tbg{stroke:rgba(255,255,255,.1)}
    #fbs .tfg{stroke:#6c7bff;stroke-linecap:round;transition:stroke-dashoffset .35s linear,stroke .3s}
    #fbs .iw{display:flex;gap:8px;margin-bottom:10px}
    #fbs .in{flex:1;min-width:0;padding:9px 12px;border-radius:10px;border:1px solid rgba(108,123,255,.3);
      background:rgba(0,0,0,.35);color:#dfe2ff;font-family:'SF Mono',Consolas,monospace;font-size:12px;
      outline:none;transition:all .22s}
    #fbs .in:focus{border-color:rgba(108,123,255,.7);box-shadow:0 0 0 3px rgba(108,123,255,.15)}
    #fbs .in::placeholder{color:#5c6090}
    #fbs .sb{padding:9px 14px;border-radius:10px;border:1px solid rgba(108,123,255,.4);
      background:linear-gradient(135deg,#3a3f78,#2a2d5c);color:#dfe2ff;font-size:12px;font-weight:600;
      cursor:pointer;transition:all .22s;white-space:nowrap}
    #fbs .sb:hover{background:linear-gradient(135deg,#4a50a0,#34386e);box-shadow:0 0 14px rgba(108,123,255,.35)}
    #fbs .sb.x{border-color:rgba(255,107,107,.4);background:linear-gradient(135deg,#5c2a2a,#452020);padding:9px 10px}
    #fbs .sb.x:hover{background:linear-gradient(135deg,#7a3434,#5c2a2a);box-shadow:0 0 14px rgba(255,107,107,.35)}
    #fbs .code{display:flex;align-items:center;justify-content:center;gap:6px;
      font-family:'SF Mono',Consolas,monospace;font-size:26px;font-weight:700;letter-spacing:4px;
      color:#dfe2ff;padding:6px 0 10px;cursor:pointer;min-height:42px;transition:color .2s}
    #fbs .code:hover{color:#fff}
    #fbs .code.e{color:#4a4e7a;font-size:12px;letter-spacing:1px;
      font-family:'Segoe UI',system-ui,sans-serif;font-weight:500;cursor:default}
    #fbs .code.e:hover{color:#4a4e7a}
    #fbs .hint{text-align:center;font-size:10px;color:#5c6090;letter-spacing:.5px}
    #fbs-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
      background:rgba(30,32,60,.95);border:1px solid rgba(108,123,255,.4);color:#dfe2ff;
      padding:10px 22px;border-radius:30px;font-size:13px;opacity:0;pointer-events:none;
      transition:all .3s;z-index:1000000;backdrop-filter:blur(10px);
      font-family:'Segoe UI',system-ui,sans-serif}
    #fbs-toast.s{opacity:1;transform:translateX(-50%) translateY(0)}
    `;

    const ICON_COPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

    const $ = id => document.getElementById(id);

    function build() {
        const s = document.createElement('style');
        s.textContent = CSS;
        document.head.appendChild(s);

        const w = document.createElement('div');
        w.id = 'fbs';
        w.innerHTML = `
          <div class="t">Security Console</div>
          <div class="l">Facebook UID (c_user)</div>
          <button class="cb" id="fbs-uid" data-c="">
            <span class="v m" id="fbs-uid-v">Memuat...</span>${ICON_COPY}</button>
          <div class="l">Cookies</div>
          <button class="cb" id="fbs-ck" data-c="">
            <span class="v m" id="fbs-ck-v">Memuat...</span>${ICON_COPY}</button>
          <a class="ab" href="https://accountscenter.facebook.com/password_and_security/two_factor/" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/></svg>Buka 2FA Settings</a>
          <div class="dv"></div>
          <div class="tb">
            <div class="th"><span>TOTP Generator</span>
              <div class="tw"><svg width="22" height="22" viewBox="0 0 22 22">
                <circle class="tbg" cx="11" cy="11" r="9"/>
                <circle class="tfg" id="fbs-ring" cx="11" cy="11" r="9"
                        stroke-dasharray="56.5" stroke-dashoffset="0"/></svg></div>
            </div>
            <div class="iw">
              <input class="in" id="fbs-in" placeholder="Secret Base32..." autocomplete="off" spellcheck="false"/>
              <button class="sb" id="fbs-set">Set</button>
              <button class="sb x" id="fbs-clr" title="Hapus">✕</button>
            </div>
            <div class="code e" id="fbs-code">Masukkan secret lalu klik Set</div>
            <div class="hint" id="fbs-hint">Belum ada secret tersimpan</div>
          </div>`;
        document.body.appendChild(w);

        const t = document.createElement('div');
        t.id = 'fbs-toast';
        document.body.appendChild(t);
    }

    let toastTimer;
    function toast(msg) {
        const t = $('fbs-toast');
        t.textContent = msg;
        t.classList.add('s');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('s'), 1800);
    }

    const getCookie = n => (document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')) || [])[1];

    function loadData() {
        const uid = getCookie('c_user');
        const uv = $('fbs-uid-v'), ub = $('fbs-uid');
        if (uid) {
            uv.textContent = uid; uv.classList.remove('m');
            ub.dataset.c = uid;
        } else {
            uv.textContent = 'c_user tidak ditemukan'; uv.classList.add('m');
            ub.dataset.c = '';
        }
        const ck = document.cookie || '';
        const cv = $('fbs-ck-v'), cb = $('fbs-ck');
        if (ck) {
            const p = ck.split(';').map(s => s.trim()).filter(Boolean);
            cv.textContent = `${p.length} cookie · ${p.slice(0, 2).join('; ')}` + (p.length > 2 ? '…' : '');
            cv.classList.remove('m');
            cb.dataset.c = ck;
        } else {
            cv.textContent = 'Tidak ada cookies'; cv.classList.add('m');
            cb.dataset.c = '';
        }
    }

    async function copy(text) {
        if (!text) { toast('Tidak ada data'); return false; }
        try {
            if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
            else {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); ta.remove();
            }
            return true;
        } catch { return false; }
    }

    function bindCopy(btn) {
        btn.addEventListener('click', async e => {
            e.preventDefault();
            if (await copy(btn.dataset.c)) {
                btn.classList.add('ok');
                toast('Tersalin ✓');
                setTimeout(() => btn.classList.remove('ok'), 1400);
            }
        });
    }

    const PERIOD = 30, DIGITS = 6;
    let secret = '', code = '', loop = null;

    function b32(s) {
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0, val = 0, out = [];
        for (const ch of s.replace(/[\s=]+/g, '').toUpperCase()) {
            const i = A.indexOf(ch);
            if (i < 0) continue;
            val = (val << 5) | i; bits += 5;
            if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
        }
        return new Uint8Array(out);
    }

    async function totp(key, ts = Date.now()) {
        const kb = b32(key);
        if (!kb.length) throw 0;
        const c = Math.floor(ts / 1000 / PERIOD);
        const m = new Uint8Array(8);
        for (let i = 7, t = c; i >= 0; i--, t = Math.floor(t / 256)) m[i] = t & 0xff;
        const k = await crypto.subtle.importKey('raw', kb, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
        const h = new Uint8Array(await crypto.subtle.sign('HMAC', k, m));
        const o = h[h.length - 1] & 0x0f;
        const n = (((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 10 ** DIGITS;
        return n.toString().padStart(DIGITS, '0');
    }

    function renderCode() {
        const el = $('fbs-code');
        if (!secret) {
            el.classList.add('e');
            el.textContent = 'Masukkan secret lalu klik Set';
            return;
        }
        el.classList.remove('e');
        el.innerHTML = code.split('').map((d, i) =>
            `<span>${d}</span>` + (i === 2 ? '<span> </span>' : '')).join('');
    }

    async function refresh() {
        if (!secret) return;
        try {
            code = await totp(secret);
            renderCode();
        } catch {
            $('fbs-code').classList.add('e');
            $('fbs-code').textContent = 'Secret tidak valid';
        }
    }

    function ring() {
        const r = $('fbs-ring');
        const rem = PERIOD - (Date.now() / 1000 % PERIOD);
        r.style.strokeDashoffset = 2 * Math.PI * 9 * (1 - rem / PERIOD);
        r.style.stroke = rem <= 5 ? '#ff6b6b' : rem <= 10 ? '#ffb347' : '#6c7bff';
    }

    function start() {
        stop();
        refresh();
        loop = setInterval(refresh, 1000);
    }
    function stop() {
        if (loop) clearInterval(loop);
        loop = null;
    }

    function mask(s) {
        return s.length <= 8 ? s : s.slice(0, 4) + '•'.repeat(Math.min(8, s.length - 8)) + s.slice(-4);
    }

    function setSecret(s, silent) {
        const c = s.replace(/[\s=]+/g, '').toUpperCase();
        if (!c || !/^[A-Z2-7]+$/.test(c)) { if (!silent) toast('Secret tidak valid'); return; }
        secret = c;
        try { localStorage.setItem(CONFIG.TOTP_KEY, c); } catch {}
        $('fbs-in').value = c;
        $('fbs-hint').textContent = 'Secret: ' + mask(c);
        start();
        if (!silent) toast('Secret disimpan ✓');
    }

    function clearSecret() {
        secret = ''; code = '';
        try { localStorage.removeItem(CONFIG.TOTP_KEY); } catch {}
        stop();
        $('fbs-in').value = '';
        $('fbs-hint').textContent = 'Belum ada secret tersimpan';
        renderCode();
        toast('Secret dihapus');
    }

    function init() {
        build();
        loadData();
        bindCopy($('fbs-uid'));
        bindCopy($('fbs-ck'));

        $('fbs-set').onclick = () => setSecret($('fbs-in').value);
        $('fbs-in').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); setSecret($('fbs-in').value); } };
        $('fbs-clr').onclick = clearSecret;
        $('fbs-code').onclick = async () => {
            if (code && await copy(code)) toast('Kode TOTP tersalin ✓');
        };

        ring(); setInterval(ring, 100);
        setInterval(loadData, 2000);

        try {
            const s = localStorage.getItem(CONFIG.TOTP_KEY);
            if (s) setSecret(s, true);
            else renderCode();
        } catch { renderCode(); }
    }

    const DEPAN = "Olivia,Emma,Ava,Sophia,Isabella,Mia,Charlotte,Amelia,Harper,Evelyn,Abigail,Emily,Ella,Elizabeth,Camila,Luna,Sofia,Avery,Mila,Aria,Scarlett,Penelope,Layla,Chloe,Victoria,Madison,Eleanor,Grace,Nora,Riley,Zoey,Hannah,Hazel,Lily,Ellie,Violet,Lillian,Zoe,Stella,Aurora,Natalie,Emilia,Everly,Leah,Aubrey,Willow,Addison,Lucy,Audrey,Bella,Nova,Brooklyn,Paisley,Savannah,Claire,Skylar,Isla,Genesis,Naomi,Elena,Caroline,Eliana,Anna,Maya,Valentina,Ruby,Kennedy,Ivy,Ariana,Aaliyah,Cora,Madelyn,Alice,Kinsley,Hailey,Gabriella,Allison,Gianna,Serenity,Samantha,Sarah,Autumn,Quinn,Eva,Piper,Sophie,Sadie,Delilah,Nevaeh,Adeline,Arya,Emery,Lydia,Clara,Vivian,Madeline,Peyton,Julia,Rylee,Brielle".split(",");

    const BELAKANG = "Smith,Johnson,Williams,Brown,Jones,Garcia,Miller,Davis,Rodriguez,Martinez,Hernandez,Lopez,Gonzalez,Wilson,Anderson,Thomas,Taylor,Moore,Jackson,Martin,Lee,Perez,Thompson,White,Harris,Sanchez,Clark,Ramirez,Lewis,Robinson,Walker,Young,Allen,King,Wright,Scott,Torres,Nguyen,Hill,Flores,Green,Adams,Nelson,Baker,Hall,Rivera,Campbell,Mitchell,Carter,Roberts,Gomez,Phillips,Evans,Turner,Diaz,Parker,Cruz,Edwards,Collins,Reyes,Stewart,Morris,Morales,Murphy,Cook,Rogers,Gutierrez,Ortiz,Morgan,Cooper,Peterson,Bailey,Reed,Kelly,Howard,Ramos,Kim,Cox,Ward,Richardson,Watson,Brooks,Chavez,Wood,James,Bennett,Gray,Mendoza,Ruiz,Hughes,Price,Alvarez,Castillo,Sanders,Patel,Myers,Long,Ross,Foster,Jimenez".split(",");

    const rnd = a => a[Math.floor(Math.random() * a.length)];
    const q = s => document.querySelector(s);
    const isi = (el, v) => {
        el.focus(); el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const tampak = el => !!el && el.offsetWidth > 0 && el.offsetHeight > 0 && getComputedStyle(el).visibility !== 'hidden';
    const lanjut = () => q('button[data-sigil="touchable multi_step_next"]')?.click();

    function nama() {
        const f = q('#firstname_input');
        if (!f) return setTimeout(nama, 500);
        const l = q('#lastname_input');
        const d = rnd(DEPAN), b = rnd(BELAKANG);
        if (tampak(l)) { isi(f, d); isi(l, b); } else isi(f, `${d} ${b}`);
        lanjut(); setTimeout(lahir, 1500);
    }

    function lahir() {
        const h = q('select[name="birthday_day"]');
        const b = q('select[name="birthday_month"]');
        const t = q('select[name="birthday_year"]');
        if (!h || !b || !t) return setTimeout(lahir, 500);
        h.value = Math.floor(Math.random() * 28) + 1;
        b.value = Math.floor(Math.random() * 12) + 1;
        t.value = new Date().getFullYear() - (Math.floor(Math.random() * 21) + 25);
        [h, b, t].forEach(e => e.dispatchEvent(new Event('change', { bubbles: true })));
        lanjut(); setTimeout(telepon, 1500);
    }

    function telepon() {
        const e = q('input[name="reg_email__"]');
        if (!e) return setTimeout(telepon, 500);
        isi(e, '+'); lanjut(); setTimeout(gender, 1500);
    }

    function gender() {
        const e = q('input[name="sex"][value="1"]');
        if (!e) return setTimeout(gender, 500);
        e.click(); lanjut(); setTimeout(pass, 1500);
    }

    function pass() {
        const e = q('input[name="reg_passwd__"]');
        if (!e) return setTimeout(pass, 500);
        isi(e, CONFIG.PASSWORD);
        q('[data-sigil="touchable multi_step_submit"]')?.click();
    }

    init();
    setTimeout(nama, CONFIG.AUTO_REGISTER_DELAY);
})();
