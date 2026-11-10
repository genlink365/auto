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
    const LS_LAST_ID = 'tm_last_id';

    /* ---------- STORAGE ---------- */
    const store = {
        get: k => localStorage.getItem(k) || '',
        set: (k, v) => v !== '' && v != null
            ? localStorage.setItem(k, v)
            : localStorage.removeItem(k),
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

    /* ---------- OTP (5 digit, dari SUBJECT saja) ---------- */
    const otpFrom = (subject) =>
        (subject || '').match(/\b(\d{5})\b/)?.[1] || null;

    /* ---------- OTP POLLING ---------- */
    let lastOtpId = Number(store.get(LS_LAST_ID)) || 0;

    const fetchOtp = async (tick) => {
        const end = Date.now() + TIMEOUT;

        while (Date.now() < end) {
            try {
                const raw = await req(`${BASE}/template/checker.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `last_id=${lastOtpId}`,
                });

                const mails = JSON.parse(raw) || [];

                for (const m of mails) {
                    lastOtpId = Math.max(lastOtpId, m.id || 0);
                    store.set(LS_LAST_ID, String(lastOtpId));

                    const otp = otpFrom(m.subject);
                    if (otp) return otp;
                }

                tick?.('Menunggu OTP...');
            } catch { /* silent */ }

            await new Promise(r => setTimeout(r, POLL));
        }

        return null;
    };

    /* ---------- HELPERS ---------- */
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
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                return true;
            } catch { return false; }
        }
    };

    /* ---------- STYLES ---------- */
    const CSS = `
    #tm-bar{
      position:fixed;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));
      transform:translateX(-50%);
      z-index:999999;
      display:flex;align-items:center;
      gap:6px;
      padding:6px;
      max-width:calc(100vw - 16px);
      background:rgba(14,14,22,.92);
      -webkit-backdrop-filter:blur(20px) saturate(180%);
      backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(255,255,255,.08);
      border-radius:14px;
      box-shadow:0 10px 32px rgba(0,0,0,.55),
                 inset 0 1px 0 rgba(255,255,255,.06);
      font:12px -apple-system,'Segoe UI',system-ui,sans-serif;
      color:#e0e3ff;
      user-select:none;
      -webkit-tap-highlight-color:transparent;
      animation:tmIn .28s cubic-bezier(.4,0,.2,1)
    }
    @keyframes tmIn{
      from{opacity:0;transform:translate(-50%,10px)}
      to{opacity:1;transform:translate(-50%,0)}
    }

    #tm-bar .tm-field{
      display:flex;align-items:center;
      height:32px;flex:1 1 0;min-width:0;
      padding:0 9px;border-radius:9px;
      background:rgba(0,0,0,.4);
      border:1px solid rgba(124,136,255,.16);
      transition:border-color .2s,background .2s
    }
    #tm-bar .tm-field:focus-within{
      border-color:rgba(124,136,255,.55);
      background:rgba(0,0,0,.55)
    }
    #tm-bar .tm-field input{
      width:100%;min-width:0;
      border:none;outline:none;background:transparent;
      font:11px 'SF Mono','Consolas',monospace;
      letter-spacing:.3px;color:#e0e3ff;
      text-align:center;
    }
    #tm-bar .tm-field input::placeholder{
      color:#565a80;font-weight:500
    }

    #tm-bar .tm-btn{
      height:32px;padding:0 10px;
      border-radius:9px;cursor:pointer;
      font:600 11px -apple-system,system-ui,sans-serif;
      background:rgba(124,136,255,.14);
      border:1px solid rgba(124,136,255,.22);
      color:#dfe2ff;
      transition:all .16s;
      white-space:nowrap;flex-shrink:0;
      -webkit-tap-highlight-color:transparent
    }
    #tm-bar .tm-btn:hover{background:rgba(124,136,255,.28);color:#fff}
    #tm-bar .tm-btn:active{transform:scale(.94)}
    #tm-bar .tm-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
    #tm-bar .tm-btn.primary{background:rgba(124,136,255,.3);
      border-color:rgba(124,136,255,.5);color:#fff}

    #tm-bar .tm-otp{
      height:32px;padding:0 12px;
      display:flex;align-items:center;
      border-radius:9px;
      font:700 13px 'SF Mono','Consolas',monospace;
      letter-spacing:1.5px;
      color:#5ce89a;
      background:rgba(80,220,140,.08);
      border:1px solid rgba(80,220,140,.16);
      cursor:pointer;
      transition:background .2s;
      flex-shrink:0
    }
    #tm-bar .tm-otp:hover{background:rgba(80,220,140,.16)}
    #tm-bar .tm-otp:active{transform:scale(.96)}
    #tm-bar .tm-otp:empty{display:none}

    #tm-toast{
      position:fixed;left:50%;
      bottom:calc(56px + env(safe-area-inset-bottom,0px));
      transform:translate(-50%,14px);
      padding:8px 16px;border-radius:20px;
      background:rgba(20,22,38,.96);
      border:1px solid rgba(124,136,255,.35);
      color:#dfe2ff;
      font:500 12px -apple-system,system-ui,sans-serif;
      opacity:0;pointer-events:none;z-index:1000000;
      transition:opacity .25s,transform .25s cubic-bezier(.4,0,.2,1);
      max-width:calc(100vw - 32px);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      -webkit-backdrop-filter:blur(12px);
      backdrop-filter:blur(12px)
    }
    #tm-toast.show{opacity:1;transform:translate(-50%,0)}

    /* ===== MOBILE ===== */
    @media(max-width:600px){
      #tm-bar{
        gap:4px;padding:5px;
        max-width:calc(100vw - 12px);
        border-radius:12px
      }
      #tm-bar .tm-field{height:30px;padding:0 6px;border-radius:8px}
      #tm-bar .tm-field input{font-size:10px;letter-spacing:0}
      #tm-bar .tm-btn{height:30px;padding:0 8px;font-size:10px;border-radius:8px}
      #tm-bar .tm-otp{height:30px;font-size:12px;padding:0 8px;letter-spacing:1px}
      #tm-toast{font-size:11px;padding:7px 13px}
    }

    /* HP kecil: sembunyikan tombol Copy email (masih bisa klik field) */
    @media(max-width:380px){
      #tm-bar .tm-btn.copy{display:none}
      #tm-bar .tm-field input{font-size:9.5px}
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
          <div class="tm-field" title="Email">
            <input id="tm-email" readonly placeholder="email..."/>
          </div>
          <button id="tm-new" class="tm-btn primary" title="Email baru">Baru</button>
          <button id="tm-cp-e" class="tm-btn copy" title="Copy email">Copy</button>
          <div class="tm-field" title="OTP">
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

    /* ---------- INIT ---------- */
    const init = () => {
        build();

        const emailEl = $('tm-email');
        const otpEl = $('tm-otp');
        const bigEl = $('tm-big');
        const waitBtn = $('tm-wait');

        // restore
        emailEl.value = store.get(LS_EMAIL);
        otpEl.value = store.get(LS_OTP);
        if (otpEl.value) bigEl.textContent = otpEl.value;

        // tap email field = copy
        emailEl.onclick = async () =>
            (await copy(emailEl.value)) ? toast('Email tersalin ✓') : toast('Kosong');

        // Email baru: reset juga lastOtpId supaya inbox baru dipindai dari awal
        $('tm-new').onclick = async () => {
            try {
                const email = await fetchEmail();
                emailEl.value = email;
                otpEl.value = '';
                bigEl.textContent = '';
                lastOtpId = 0;
                store.set(LS_EMAIL, email);
                store.set(LS_OTP, '');
                store.set(LS_LAST_ID, '0');
                toast('Email baru ✓');
            } catch {
                toast('Gagal ambil email');
            }
        };

        $('tm-cp-e').onclick = emailEl.onclick;

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
