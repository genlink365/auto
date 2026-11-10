// ==UserScript==
// @name         TempMail Helper
// @match        https://*.instagram.com/*
// @match        https://*.facebook.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      tempemail.info
// ==/UserScript==

(() => {
    'use strict';

    const BASE = 'https://tempemail.info';
    const POLL = 3000;
    const TIMEOUT = 180_000;
    const LS_EMAIL = 'tm_email';
    const LS_OTP = 'tm_otp';

    /* ---------- STORAGE (tahan refresh & hapus data) ---------- */
    const store = {
        get: k => localStorage.getItem(k) || '',
        set: (k, v) => v ? localStorage.setItem(k, v) : localStorage.removeItem(k),
    };

    /* ---------- NETWORK ---------- */
    const req = (url, opt = {}) => new Promise((ok, err) =>
        GM_xmlhttpRequest({
            method: opt.method || 'GET',
            url,
            data: opt.body,
            headers: opt.headers || {},
            onload: r => ok(r.responseText),
            onerror: err,
        })
    );

    const fetchEmail = async () => {
        const html = await req(BASE);
        const m = html.match(/emailEncoded\s*=\s*"([^"]+)"/);
        if (!m) throw new Error('email tidak ditemukan');
        return atob(m[1]);
    };

    const otpFrom = s => (s || '').match(/\b(\d{5})\b/)?.[1] || null;

    const fetchOtp = async (tick) => {
        const end = Date.now() + TIMEOUT;
        let last = 0;
        while (Date.now() < end) {
            try {
                const raw = await req(`${BASE}/template/checker.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `last_id=${last}`,
                });
                for (const m of JSON.parse(raw) || []) {
                    last = Math.max(last, m.id);
                    const otp = otpFrom(m.subject);
                    if (otp) return otp;
                }
                tick?.('Menunggu OTP...');
            } catch { /* silent */ }
            await new Promise(r => setTimeout(r, POLL));
        }
        return null;
    };

    /* ---------- UI HELPERS ---------- */
    const $ = id => document.getElementById(id);

    const toast = (msg) => {
        const t = $('tm-toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._timer);
        t._timer = setTimeout(() => t.classList.remove('show'), 1600);
    };

    const copy = async (text) => {
        if (!text) return false;
        try { await navigator.clipboard.writeText(text); return true; }
        catch { return false; }
    };

    /* ---------- STYLES ---------- */
    const CSS = `
    #tm-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);
      z-index:999999;display:flex;gap:6px;align-items:center;
      padding:8px 10px;margin-bottom:10px;
      background:rgba(14,14,22,.9);
      backdrop-filter:blur(18px) saturate(180%);
      -webkit-backdrop-filter:blur(18px) saturate(180%);
      border:1px solid rgba(255,255,255,.08);
      border-radius:14px;
      box-shadow:0 8px 32px rgba(0,0,0,.55);
      font:12px -apple-system,'Segoe UI',system-ui,sans-serif;
      color:#e0e3ff;user-select:none;
      max-width:calc(100vw - 20px);
      -webkit-tap-highlight-color:transparent;
      animation:tmIn .3s cubic-bezier(.4,0,.2,1)}

    @keyframes tmIn{from{opacity:0;transform:translate(-50%,8px)}
      to{opacity:1;transform:translate(-50%,0)}}

    #tm-bar button,#tm-bar input{border:none;outline:none;
      font:inherit;color:inherit;background:transparent}

    #tm-bar .tm-field{display:flex;align-items:center;gap:4px;
      padding:0 8px;height:30px;border-radius:8px;
      background:rgba(0,0,0,.35);
      border:1px solid rgba(124,136,255,.18);
      transition:border-color .2s}
    #tm-bar .tm-field:focus-within{border-color:rgba(124,136,255,.5)}
    #tm-bar .tm-field input{width:130px;min-width:0;
      font:11px 'SF Mono','Consolas',monospace;letter-spacing:.3px}
    #tm-bar .tm-field input::placeholder{color:#565a80}

    #tm-bar .tm-btn{height:30px;padding:0 10px;border-radius:8px;
      cursor:pointer;font:600 11px system-ui,sans-serif;
      background:rgba(124,136,255,.15);
      border:1px solid rgba(124,136,255,.25);
      color:#dfe2ff;transition:all .18s;white-space:nowrap}
    #tm-bar .tm-btn:hover{background:rgba(124,136,255,.3);color:#fff}
    #tm-bar .tm-btn:active{transform:scale(.95)}
    #tm-bar .tm-btn:disabled{opacity:.4;cursor:not-allowed}

    #tm-bar .tm-otp{font:700 14px 'SF Mono','Consolas',monospace;
      letter-spacing:2px;color:#5ce89a;cursor:pointer;
      padding:0 8px;height:30px;display:flex;align-items:center;
      border-radius:8px;background:rgba(80,220,140,.08);
      transition:background .2s}
    #tm-bar .tm-otp:hover{background:rgba(80,220,140,.16)}
    #tm-bar .tm-otp:empty{display:none}

    #tm-toast{position:fixed;bottom:56px;left:50%;
      transform:translate(-50%,16px);
      padding:8px 16px;border-radius:20px;
      background:rgba(20,22,38,.96);
      border:1px solid rgba(124,136,255,.35);
      color:#dfe2ff;font:500 12px system-ui,sans-serif;
      opacity:0;pointer-events:none;z-index:1000000;
      transition:opacity .25s,transform .25s cubic-bezier(.4,0,.2,1);
      max-width:calc(100vw - 40px);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      backdrop-filter:blur(12px)}
    #tm-toast.show{opacity:1;transform:translate(-50%,0)}

    @media(max-width:480px){
      #tm-bar{padding:6px;margin-bottom:6px;gap:4px;border-radius:12px}
      #tm-bar .tm-field{padding:0 6px;height:28px}
      #tm-bar .tm-field input{width:96px;font-size:10px}
      #tm-bar .tm-btn{height:28px;padding:0 8px;font-size:10px}
      #tm-bar .tm-otp{height:28px;font-size:13px;padding:0 6px}
      #tm-toast{font-size:11px;padding:7px 13px;bottom:48px}
    }
    `;

    /* ---------- BUILD ---------- */
    const build = () => {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const bar = document.createElement('div');
        bar.id = 'tm-bar';
        bar.innerHTML = `
          <div class="tm-field">
            <input id="tm-email" readonly placeholder="email..."/>
          </div>
          <button id="tm-new" class="tm-btn" title="Email baru">Baru</button>
          <button id="tm-cp-e" class="tm-btn" title="Copy email">Copy</button>
          <div class="tm-field">
            <input id="tm-otp" readonly placeholder="otp..."/>
          </div>
          <button id="tm-wait" class="tm-btn" title="Ambil OTP">Ambil</button>
          <div class="tm-otp" id="tm-big"></div>
        `;
        document.body.appendChild(bar);

        const toastEl = document.createElement('div');
        toastEl.id = 'tm-toast';
        document.body.appendChild(toastEl);
    };

    /* ---------- RESTORE & HANDLERS ---------- */
    const init = () => {
        build();

        const emailEl = $('tm-email');
        const otpEl = $('tm-otp');
        const bigEl = $('tm-big');
        const waitBtn = $('tm-wait');

        // restore dari localStorage
        emailEl.value = store.get(LS_EMAIL);
        otpEl.value = store.get(LS_OTP);
        if (otpEl.value) bigEl.textContent = otpEl.value;

        $('tm-new').onclick = async () => {
            try {
                const email = await fetchEmail();
                emailEl.value = email;
                otpEl.value = '';
                bigEl.textContent = '';
                store.set(LS_EMAIL, email);
                store.set(LS_OTP, '');
                toast('Email baru siap ✓');
            } catch {
                toast('Gagal ambil email');
            }
        };

        $('tm-cp-e').onclick = async () =>
            (await copy(emailEl.value)) ? toast('Email tersalin ✓') : toast('Kosong');

        waitBtn.onclick = async () => {
            waitBtn.disabled = true;
            waitBtn.textContent = '...';
            try {
                const otp = await fetchOtp(msg => (otpEl.placeholder = msg));
                if (otp) {
                    otpEl.value = otp;
                    bigEl.textContent = otp;
                    store.set(LS_OTP, otp);
                    toast('OTP diterima ✓');
                } else {
                    toast('Timeout OTP');
                }
            } catch {
                toast('Gagal ambil OTP');
            } finally {
                waitBtn.disabled = false;
                waitBtn.textContent = 'Ambil';
            }
        };

        const copyOtp = async () =>
            (await copy(otpEl.value)) ? toast('OTP tersalin ✓') : 0;
        otpEl.onclick = copyOtp;
        bigEl.onclick = copyOtp;
    };

    init();
})();
