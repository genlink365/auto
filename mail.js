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
        t._timer = setTimeout(() => t.classList.remove('show'), 1800);
    };

    const copy = async (text) => {
        if (!text) return false;
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    };

    /* ---------- STYLES ---------- */
    const CSS = `
    #tm-wrap{position:fixed;top:14px;right:14px;z-index:999999;
      width:min(270px,calc(100vw - 28px));
      font:13px/1.4 -apple-system,'Segoe UI',system-ui,sans-serif;
      user-select:none;-webkit-tap-highlight-color:transparent}

    #tm{display:flex;flex-direction:column;gap:10px;padding:12px;
      background:rgba(14,14,22,.88);
      backdrop-filter:blur(20px) saturate(180%);
      -webkit-backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(255,255,255,.08);border-radius:16px;
      box-shadow:0 12px 48px rgba(0,0,0,.55),
                 inset 0 1px 0 rgba(255,255,255,.06);
      color:#e0e3ff}

    .tm-title{font:600 10px system-ui,sans-serif;letter-spacing:.6px;
      text-transform:uppercase;color:#7c88ff;margin-bottom:2px}

    .tm-row{display:flex;gap:6px;align-items:stretch}

    .tm-input{flex:1;min-width:0;height:34px;padding:0 10px;
      border-radius:9px;border:1px solid rgba(124,136,255,.22);
      background:rgba(0,0,0,.45);color:#e0e3ff;
      font:12px 'SF Mono','Consolas',monospace;outline:none;
      transition:border-color .2s,background .2s}
    .tm-input:focus{border-color:rgba(124,136,255,.6);
      background:rgba(0,0,0,.6)}
    .tm-input::placeholder{color:#565a80;font-size:11px}

    .tm-btn{height:34px;padding:0 12px;border-radius:9px;cursor:pointer;
      border:1px solid rgba(124,136,255,.3);
      background:rgba(124,136,255,.15);color:#dfe2ff;
      font:600 11px system-ui,sans-serif;
      transition:all .18s ease;flex-shrink:0}
    .tm-btn:hover{background:rgba(124,136,255,.3);color:#fff}
    .tm-btn:active{transform:scale(.96)}
    .tm-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
    .tm-btn.primary{background:rgba(124,136,255,.28);
      border-color:rgba(124,136,255,.6);color:#fff}

    .tm-otp{font:700 24px 'SF Mono','Consolas',monospace;
      letter-spacing:5px;text-align:center;padding:10px 0;
      color:#5ce89a;cursor:pointer;border-radius:10px;
      background:rgba(80,220,140,.08);
      border:1px solid rgba(80,220,140,.18);
      transition:background .2s}
    .tm-otp:hover{background:rgba(80,220,140,.14)}
    .tm-otp:active{transform:scale(.98)}
    .tm-otp:empty{display:none}

    #tm-toast{position:fixed;bottom:24px;left:50%;
      transform:translate(-50%,24px);
      padding:9px 18px;border-radius:22px;
      background:rgba(20,22,38,.96);
      border:1px solid rgba(124,136,255,.35);
      color:#dfe2ff;font:500 12px system-ui,sans-serif;
      opacity:0;pointer-events:none;z-index:1000000;
      transition:opacity .3s,transform .3s cubic-bezier(.4,0,.2,1);
      max-width:calc(100vw - 40px);white-space:nowrap;
      overflow:hidden;text-overflow:ellipsis;
      backdrop-filter:blur(12px)}
    #tm-toast.show{opacity:1;transform:translate(-50%,0)}

    @media(max-width:480px){
      #tm-wrap{top:10px;right:10px;width:calc(100vw - 20px);max-width:260px}
      #tm{padding:10px;border-radius:14px;gap:8px}
      .tm-input,.tm-btn{height:32px;font-size:11px}
      .tm-otp{font-size:21px;letter-spacing:4px;padding:8px 0}
      #tm-toast{font-size:11px;padding:8px 14px}
    }
    `;

    /* ---------- BUILD ---------- */
    const build = () => {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const wrap = document.createElement('div');
        wrap.id = 'tm-wrap';
        wrap.innerHTML = `
          <div id="tm">
            <div>
              <div class="tm-title">Email Temp</div>
              <div class="tm-row">
                <input id="tm-email" class="tm-input" readonly placeholder="(belum ada)"/>
                <button id="tm-new" class="tm-btn primary">Baru</button>
                <button id="tm-cp-e" class="tm-btn">Copy</button>
              </div>
            </div>
            <div>
              <div class="tm-title">OTP</div>
              <div class="tm-row">
                <input id="tm-otp" class="tm-input" readonly placeholder="(menunggu)"/>
                <button id="tm-wait" class="tm-btn">Ambil</button>
              </div>
            </div>
            <div class="tm-otp" id="tm-big"></div>
          </div>
        `;
        document.body.appendChild(wrap);

        const toastEl = document.createElement('div');
        toastEl.id = 'tm-toast';
        document.body.appendChild(toastEl);
    };

    /* ---------- HANDLERS ---------- */
    const init = () => {
        build();

        const emailEl = $('tm-email');
        const otpEl = $('tm-otp');
        const bigEl = $('tm-big');
        const waitBtn = $('tm-wait');

        $('tm-new').onclick = async () => {
            try {
                emailEl.value = await fetchEmail();
                otpEl.value = '';
                bigEl.textContent = '';
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
