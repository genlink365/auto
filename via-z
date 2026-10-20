// ==UserScript==
// @name         FB Auto Register + Security Panel
// @namespace    https://viayoo.com/6rpkld
// @version      13.0
// @match        https://*.facebook.com/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
    'use strict';

    const KEY_PASS = 'fbs_pass';
    const KEY_HIDDEN = 'fbs_hidden';

    const CSS = `
    #fbs{position:fixed;top:16px;left:16px;z-index:999999;
      font-family:'Inter',-apple-system,'Segoe UI',system-ui,sans-serif;
      font-size:12px;line-height:1.4;-webkit-user-select:none;user-select:none;
      display:flex;align-items:flex-start;gap:10px}

    #fbs.hidden{display:none}

    #fbs .rail{display:flex;flex-direction:column;gap:6px;
      padding:10px;border-radius:14px;
      background:rgba(14,14,22,.86);
      backdrop-filter:blur(20px) saturate(180%);
      -webkit-backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(255,255,255,.07);
      box-shadow:0 12px 48px rgba(0,0,0,.6),
                 inset 0 1px 0 rgba(255,255,255,.06)}

    #fbs .ico{width:34px;height:34px;padding:0;border-radius:10px;
      display:inline-flex;align-items:center;justify-content:center;
      border:1px solid rgba(255,255,255,.07);
      background:rgba(255,255,255,.025);color:#b8bdd8;cursor:pointer;
      transition:all .2s cubic-bezier(.4,0,.2,1);flex-shrink:0;
      font-family:inherit;position:relative}
    #fbs .ico:hover{background:rgba(124,136,255,.15);
      border-color:rgba(124,136,255,.45);color:#fff;
      box-shadow:0 2px 12px rgba(124,136,255,.2)}
    #fbs .ico:active{transform:scale(.94)}
    #fbs .ico.ok{border-color:rgba(80,220,140,.5);
      background:rgba(80,220,140,.12);color:#5ce89a}
    #fbs .ico.ok:hover{background:rgba(80,220,140,.22);
      box-shadow:0 2px 12px rgba(80,220,140,.25)}
    #fbs .ico.on{background:rgba(124,136,255,.22);
      border-color:rgba(124,136,255,.6);color:#fff}
    #fbs .ico svg{width:16px;height:16px;stroke-width:2;
      transition:transform .2s}
    #fbs .ico:hover svg{transform:scale(1.08)}
    #fbs .ico .badge{position:absolute;top:-2px;right:-2px;
      width:8px;height:8px;border-radius:50%;background:#5ce89a;
      border:1.5px solid rgba(14,14,22,.9);display:none}
    #fbs .ico.ok .badge{display:block}

    #fbs .close-ico{color:#b07a7a}
    #fbs .close-ico:hover{background:rgba(255,107,107,.15);
      border-color:rgba(255,107,107,.45);color:#ff8f8f;
      box-shadow:0 2px 12px rgba(255,107,107,.2)}

    #fbs .panel{display:none;flex-direction:column;
      width:236px;max-width:calc(100vw - 100px);
      padding:14px;border-radius:16px;
      background:rgba(14,14,22,.86);
      backdrop-filter:blur(20px) saturate(180%);
      -webkit-backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(255,255,255,.07);
      box-shadow:0 12px 48px rgba(0,0,0,.6),
                 inset 0 1px 0 rgba(255,255,255,.06);
      max-height:calc(100vh - 32px);overflow-y:auto;
      scrollbar-width:none;gap:10px;
      animation:fbsIn .25s cubic-bezier(.4,0,.2,1)}
    #fbs .panel::-webkit-scrollbar{display:none}
    #fbs .panel.show{display:flex}
    @keyframes fbsIn{from{opacity:0;transform:translateX(-8px)}
      to{opacity:1;transform:translateX(0)}}

    #fbs .field{display:flex;gap:6px;align-items:center}
    #fbs .field input{flex:1;min-width:0;height:32px;padding:0 11px;
      border-radius:8px;border:1px solid rgba(124,136,255,.22);
      background:rgba(0,0,0,.5);color:#e0e3ff;
      font:11px 'SF Mono','Consolas','Menlo',monospace;
      letter-spacing:.2px;outline:none;
      transition:border-color .2s,box-shadow .2s,background .2s}
    #fbs .field input:hover{border-color:rgba(124,136,255,.35)}
    #fbs .field input:focus{border-color:rgba(124,136,255,.7);
      background:rgba(0,0,0,.6);
      box-shadow:0 0 0 3px rgba(124,136,255,.12)}
    #fbs .field input::placeholder{color:#565a80;font-size:10px;
      letter-spacing:.3px;font-family:'Inter',sans-serif}
    #fbs .field .ico{width:32px;height:32px}

    #fbs .totp-inner{display:flex;flex-direction:column;align-items:center;
      width:100%}
    #fbs .tcode{position:relative;width:100%;margin-top:10px;
      display:flex;align-items:center;justify-content:center}
    #fbs .code{display:flex;align-items:center;justify-content:center;
      gap:4px;min-height:34px;padding:2px 24px 2px 0;
      font:700 22px 'SF Mono','Consolas','Menlo',monospace;
      letter-spacing:3px;color:#e0e3ff;cursor:pointer;
      transition:color .2s;font-variant-numeric:tabular-nums}
    #fbs .code:hover{color:#fff;text-shadow:0 0 12px rgba(124,136,255,.5)}
    #fbs .code:active{transform:scale(.98)}
    #fbs .code.e{color:#4a4e6e;font:500 10px 'Inter',sans-serif;
      letter-spacing:.4px;cursor:default;font-variant-numeric:normal}
    #fbs .code.e:hover{color:#4a4e6e;text-shadow:none}
    #fbs .code.e:active{transform:none}
    #fbs .ring{position:absolute;top:50%;right:0;
      transform:translateY(-50%);width:18px;height:18px}
    #fbs .ring svg{width:18px;height:18px;transform:rotate(-90deg)}
    #fbs .ring circle{fill:none;stroke-width:2.5}
    #fbs .ring .bg{stroke:rgba(255,255,255,.06)}
    #fbs .ring .fg{stroke:#7c88ff;stroke-linecap:round;
      transition:stroke-dashoffset .3s linear,stroke .3s}

    #fbs-reopen{position:fixed;top:16px;left:16px;width:44px;height:44px;
      display:none;align-items:center;justify-content:center;
      border-radius:14px;cursor:pointer;z-index:999999;
      background:rgba(14,14,22,.86);
      backdrop-filter:blur(20px) saturate(180%);
      -webkit-backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(255,255,255,.07);
      box-shadow:0 12px 48px rgba(0,0,0,.6);
      color:#7c88ff;transition:all .2s}
    #fbs-reopen.show{display:flex}
    #fbs-reopen:hover{background:rgba(124,136,255,.18);
      border-color:rgba(124,136,255,.5);color:#fff;
      box-shadow:0 4px 20px rgba(124,136,255,.35)}
    #fbs-reopen:active{transform:scale(.94)}
    #fbs-reopen svg{width:18px;height:18px}

    #toast{position:fixed;bottom:24px;left:50%;
      transform:translate(-50%,24px);
      padding:9px 18px;border-radius:22px;
      background:rgba(20,22,38,.96);
      border:1px solid rgba(124,136,255,.35);
      color:#dfe2ff;font:500 12px 'Inter',sans-serif;
      letter-spacing:.2px;opacity:0;pointer-events:none;
      transition:opacity .3s,transform .3s cubic-bezier(.4,0,.2,1);
      z-index:1000000;backdrop-filter:blur(12px);
      box-shadow:0 8px 32px rgba(0,0,0,.5);
      max-width:calc(90vw - 40px);white-space:nowrap;
      overflow:hidden;text-overflow:ellipsis}
    #toast.s{opacity:1;transform:translate(-50%,0)}

    @media(max-width:480px){
      #fbs{top:10px;left:10px;gap:8px}
      #fbs .rail{padding:8px;border-radius:12px;gap:5px}
      #fbs .ico{width:30px;height:30px;border-radius:9px}
      #fbs .ico svg{width:14px;height:14px}
      #fbs .panel{width:calc(100vw - 76px);max-width:220px;
        padding:11px;border-radius:14px}
      #fbs .field input{height:30px;font-size:10px;padding:0 9px}
      #fbs .field .ico{width:30px;height:30px}
      #fbs .code{font-size:19px;letter-spacing:2px;min-height:30px}
      #fbs .ring{width:16px;height:16px}
      #fbs .ring svg{width:16px;height:16px}
      #fbs-reopen{top:10px;left:10px;width:40px;height:40px}
      #toast{font-size:11px;padding:8px 15px}
    }
    `;

    const SVG = {
        user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/></svg>`,
        shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/></svg>`,
        lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="7.5" cy="15.5" r="4.5"/>
            <path d="M10.5 12.5L20 3M16 7l3 3M18 5l3 3"/></svg>`,
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        burger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/></svg>`
    };

    const $ = id => document.getElementById(id);
    const cookie = n => (document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')) || [])[1];

    const gmGet = k => { try { return GM_getValue(k, '') || ''; } catch { return ''; } };
    const gmSet = (k, v) => {
        try { v ? GM_setValue(k, v) : GM_deleteValue(k); } catch {}
    };

    let toastTimer;
    const toast = msg => {
        const t = $('toast');
        t.textContent = msg;
        t.classList.add('s');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('s'), 1600);
    };

    const copy = async text => {
        if (!text) { toast('Tidak ada data'); return false; }
        try {
            if (navigator.clipboard && window.isSecureContext)
                await navigator.clipboard.writeText(text);
            else {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); ta.remove();
            }
            return true;
        } catch { return false; }
    };

    let password = '';
    let totpSecretRaw = '';
    let totpCode = '';
    let loop = null;
    let activeForm = null;

    const PERIOD = 30, DIGITS = 6;

    const b32 = s => {
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0, val = 0, out = [];
        for (const ch of s.replace(/[\s=]+/g, '').toUpperCase()) {
            const i = A.indexOf(ch);
            if (i < 0) continue;
            val = (val << 5) | i; bits += 5;
            if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
        }
        return new Uint8Array(out);
    };

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
        const el = $('code');
        if (!totpSecretRaw) {
            el.classList.add('e');
            el.textContent = 'TOTP kosong';
            return;
        }
        el.classList.remove('e');
        el.innerHTML = totpCode.split('').map((d, i) =>
            `<span>${d}</span>` + (i === 2 ? '<span> </span>' : '')).join('');
    }

    async function refresh() {
        if (!totpSecretRaw) return;
        try { totpCode = await totp(totpSecretRaw); renderCode(); }
        catch {
            $('code').classList.add('e');
            $('code').textContent = 'Secret invalid';
        }
    }

    function tick() {
        const r = $('ring');
        if (!r) return;
        const rem = PERIOD - (Date.now() / 1000 % PERIOD);
        r.style.strokeDashoffset = 2 * Math.PI * 9 * (1 - rem / PERIOD);
        r.style.stroke = rem <= 5 ? '#ff6b6b' : rem <= 10 ? '#ffb347' : '#7c88ff';
    }

    const start = () => { stop(); refresh(); loop = setInterval(refresh, 1000); };
    const stop = () => { if (loop) clearInterval(loop); loop = null; };

    function updatePassIco() {
        const btn = $('pass-ico');
        if (btn) btn.classList.toggle('ok', !!password);
    }

    function savePassword() {
        const v = $('pass').value.trim();
        if (!v) { toast('Password kosong'); return; }
        password = v;
        gmSet(KEY_PASS, v);
        updatePassIco();
        toast('Password tersimpan ✓');
    }

    function closeForm() {
        activeForm = null;
        $('panel').classList.remove('show');
        ['pass-ico', 'totp-ico'].forEach(id => $(id)?.classList.remove('on'));
        stop();
    }

    function openForm(type) {
        if (activeForm === type) { closeForm(); return; }
        activeForm = type;
        $('panel').classList.add('show');
        $('pass-ico').classList.toggle('on', type === 'pass');
        $('totp-ico').classList.toggle('on', type === 'totp');
        $('pass-form').style.display = type === 'pass' ? 'block' : 'none';
        $('totp-form').style.display = type === 'totp' ? 'block' : 'none';

        if (type === 'pass') {
            stop();
            setTimeout(() => $('pass').focus(), 150);
        } else {
            if (totpSecretRaw) start();
            setTimeout(() => $('totp').focus(), 150);
        }
    }

    function syncTotp() {
        const raw = $('totp').value.trim();
        if (!raw) {
            totpSecretRaw = ''; totpCode = '';
            stop(); renderCode();
            return;
        }
        const clean = raw.replace(/[\s=]+/g, '').toUpperCase();
        if (!/^[A-Z2-7]+$/.test(clean)) {
            $('code').classList.add('e');
            $('code').textContent = 'Secret invalid';
            stop(); return;
        }
        totpSecretRaw = raw;
        start();
    }

    function loadUid() {
        const uid = cookie('c_user');
        const ico = $('uid-ico');
        if (ico) ico.classList.toggle('ok', !!uid);
    }

    function build() {
        const s = document.createElement('style');
        s.textContent = CSS;
        document.head.appendChild(s);

        const el = document.createElement('div');
        el.id = 'fbs';
        el.innerHTML = `
          <div class="rail">
            <button class="ico close-ico" id="fbs-close" title="Tutup">${SVG.close}</button>
            <button class="ico" id="uid-ico" title="Copy UID">
              ${SVG.user}<span class="badge"></span></button>
            <button class="ico" id="pass-ico" title="Password">
              ${SVG.lock}<span class="badge"></span></button>
            <button class="ico" id="fa-ico" title="2FA Settings">${SVG.shield}</button>
            <button class="ico" id="totp-ico" title="TOTP">
              ${SVG.key}<span class="badge"></span></button>
          </div>
          <div class="panel" id="panel">
            <div id="pass-form" style="display:none">
              <div class="field">
                <input id="pass" type="text" placeholder="Password"
                  autocomplete="off" spellcheck="false"/>
                <button class="ico" id="pass-save" title="Simpan">${SVG.lock}</button>
              </div>
            </div>
            <div id="totp-form" style="display:none">
              <div class="totp-inner">
                <div class="field">
                  <input id="totp" type="text" placeholder="TOTP Secret"
                    autocomplete="off" spellcheck="false"/>
                </div>
                <div class="tcode">
                  <div class="code e" id="code">TOTP kosong</div>
                  <div class="ring"><svg viewBox="0 0 22 22">
                    <circle class="bg" cx="11" cy="11" r="9"/>
                    <circle class="fg" id="ring" cx="11" cy="11" r="9"
                            stroke-dasharray="56.5" stroke-dashoffset="0"/></svg></div>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(el);

        const reopen = document.createElement('div');
        reopen.id = 'fbs-reopen';
        reopen.title = 'Buka';
        reopen.innerHTML = SVG.burger;
        document.body.appendChild(reopen);

        const t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
    }

    function showPanel(show) {
        const el = $('fbs');
        const reopen = $('fbs-reopen');
        if (show) {
            el.classList.remove('hidden');
            reopen.classList.remove('show');
            gmSet(KEY_HIDDEN, '');
        } else {
            closeForm();
            el.classList.add('hidden');
            reopen.classList.add('show');
            gmSet(KEY_HIDDEN, '1');
        }
    }

    function init() {
        build();

        password = gmGet(KEY_PASS);
        if (password) {
            const p = $('pass');
            if (p) p.value = password;
            updatePassIco();
        }

        renderCode();

        if (gmGet(KEY_HIDDEN)) showPanel(false);

        $('fbs-close').onclick = () => showPanel(false);
        $('fbs-reopen').onclick = () => showPanel(true);

        $('uid-ico').onclick = async () => {
            const uid = cookie('c_user');
            if (!uid) return toast('UID tidak ada');
            if (await copy(uid)) toast('UID tersalin ✓');
        };
        $('fa-ico').onclick = () => {
            window.open('https://accountscenter.facebook.com/password_and_security/two_factor/', '_blank', 'noopener');
        };
        $('pass-ico').onclick = () => openForm('pass');
        $('totp-ico').onclick = () => openForm('totp');
        $('pass-save').onclick = savePassword;

        $('pass').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); savePassword(); } };
        $('totp').oninput = syncTotp;

        $('code').onclick = async () => {
            if (totpCode && await copy(totpCode)) toast('TOTP tersalin ✓');
        };

        tick(); setInterval(tick, 100);
        loadUid(); setInterval(loadUid, 2000);
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
        isi(e, password || '');
        q('[data-sigil="touchable multi_submit"]')?.click();
    }

    init();
    setTimeout(nama, 3000);
})();
