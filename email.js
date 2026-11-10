// ==UserScript==
// @name         TempMail Helper
// @namespace    tempmail-helper
// @version      2.0
// @match        https://*.instagram.com/*
// @match        https://*.facebook.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
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
    const LS_SESS = 'tm_sess';
    const BC_NAME = 'tm_sync';

    const hasGM = typeof GM_setValue === 'function' && typeof GM_getValue === 'function';

    let bc = null;
    try { bc = new BroadcastChannel(BC_NAME); } catch { /* fallback */ }

    const broadcast = (key, val) => {
        try { bc?.postMessage({ key, val }); } catch { /* silent */ }
    };

    const store = {
        get: (k) => {
            if (hasGM) {
                try {
                    const v = GM_getValue(k, '');
                    if (v) return String(v);
                } catch { /* fallback */ }
            }
            return localStorage.getItem(k) || sessionStorage.getItem(k) || '';
        },
        set: (k, v) => {
            const val = v !== '' && v != null ? String(v) : '';
            if (hasGM) {
                try {
                    val ? GM_setValue(k, val) : GM_deleteValue(k);
                } catch { /* fallback */ }
            }
            try {
                val ? localStorage.setItem(k, val) : localStorage.removeItem(k);
            } catch { /* fallback */ }
            try {
                val ? sessionStorage.setItem(k, val) : sessionStorage.removeItem(k);
            } catch { /* fallback */ }
            broadcast(k, val);
        },
    };

    const req = (url, opt = {}) => new Promise((ok, err) =>
        GM_xmlhttpRequest({
            method: opt.method || 'GET',
            url,
            data: opt.body,
            headers: opt.headers || {},
            cookie: opt.cookie || undefined,
            onload: r => {
                if (opt.captureCookie && r.responseHeaders) {
                    const m = r.responseHeaders.match(/set-cookie:\s*([^\r\n]+)/i);
                    if (m) {
                        const c = m[1].match(/PHPSESSID=([^;]+)/);
                        if (c) store.set(LS_SESS, c[1]);
                    }
                }
                ok(r.responseText);
            },
            onerror: err,
        })
    );

    const fetchEmail = async () => {
        const html = await req(BASE, { captureCookie: true });
        const m = html.match(/emailEncoded\s*=\s*"([^"]+)"/);
        if (!m) throw new Error('email tidak ditemukan');
        return atob(m[1]);
    };

    const otpFrom = (subject) =>
        (subject || '').match(/\b(\d{5})\b/)?.[1] || null;

    let lastOtpId = Number(store.get(LS_LAST_ID)) || 0;
    let waiting = false;
    let aborted = false;

    const fetchOtp = async (tick) => {
        const end = Date.now() + TIMEOUT;
        aborted = false;
        while (Date.now() < end && !aborted) {
            try {
                const sess = store.get(LS_SESS);
                const raw = await req(`${BASE}/template/checker.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `last_id=${lastOtpId}`,
                    cookie: sess ? `PHPSESSID=${sess}` : undefined,
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
            if (aborted) break;
            await new Promise(r => setTimeout(r, POLL));
        }
        return null;
    };

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

    const CSS = `
    #tm-bar{
      position:fixed;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));
      transform:translateX(-50%);
      z-index:2147483647;
      display:flex;flex-direction:column;gap:6px;
      padding:8px;
      max-width:calc(100vw - 16px);
      background:rgba(14,14,22,.95);
      -webkit-backdrop-filter:blur(20px) saturate(180%);
      backdrop-filter:blur(20px) saturate(180%);
      border:1px solid rgba(255,255,255,.08);
      border-radius:14px;
      box-shadow:0 10px 32px rgba(0,0,0,.6),
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

    #tm-bar .tm-head{
      display:flex;align-items:center;justify-content:space-between;
      font:600 9px -apple-system,system-ui,sans-serif;
      letter-spacing:1px;text-transform:uppercase;
      color:#7c88ff;padding:0 2px
    }
    #tm-bar .tm-head .tm-dot{
      display:inline-block;width:6px;height:6px;border-radius:50%;
      background:#5ce89a;margin-right:6px;vertical-align:middle;
      box-shadow:0 0 6px #5ce89a
    }
    #tm-bar .tm-head .tm-dot.off{background:#565a80;box-shadow:none}
    #tm-bar .tm-head .tm-dot.wait{background:#ffb347;box-shadow:0 0 6px #ffb347}

    #tm-bar .tm-row{
      display:flex;align-items:center;gap:6px;
      flex-wrap:nowrap;min-width:0
    }

    #tm-bar .tm-field{
      display:flex;align-items:center;
      height:34px;flex:1 1 0;min-width:0;
      padding:0 10px;border-radius:9px;
      background:rgba(0,0,0,.45);
      border:1px solid rgba(124,136,255,.16);
      transition:border-color .2s,background .2s
    }
    #tm-bar .tm-field:focus-within{
      border-color:rgba(124,136,255,.55);
      background:rgba(0,0,0,.6)
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
      height:34px;padding:0 12px;
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
    #tm-bar .tm-btn.primary{
      background:rgba(124,136,255,.3);
      border-color:rgba(124,136,255,.5);color:#fff
    }
    #tm-bar .tm-btn.danger{
      background:rgba(255,107,107,.14);
      border-color:rgba(255,107,107,.3);color:#ff8f8f
    }
    #tm-bar .tm-btn.danger:hover{
      background:rgba(255,107,107,.28);color:#fff
    }

    #tm-bar .tm-otp{
      height:34px;padding:0 14px;
      display:flex;align-items:center;justify-content:center;
      border-radius:9px;
      font:700 15px 'SF Mono','Consolas',monospace;
      letter-spacing:2px;
      color:#5ce89a;
      background:rgba(80,220,140,.1);
      border:1px solid rgba(80,220,140,.25);
      cursor:pointer;
      transition:background .2s,transform .15s;
      flex-shrink:0;
      min-width:100px
    }
    #tm-bar .tm-otp:hover{background:rgba(80,220,140,.2)}
    #tm-bar .tm-otp:active{transform:scale(.95)}
    #tm-bar .tm-otp:empty{display:none}
    #tm-bar .tm-otp.waiting{
      color:#ffb347;background:rgba(255,179,71,.1);
      border-color:rgba(255,179,71,.25);
      font:600 10px -apple-system,system-ui,sans-serif;
      letter-spacing:.5px
    }

    #tm-toast{
      position:fixed;left:50%;
      bottom:calc(90px + env(safe-area-inset-bottom,0px));
      transform:translate(-50%,14px);
      padding:8px 16px;border-radius:20px;
      background:rgba(20,22,38,.96);
      border:1px solid rgba(124,136,255,.35);
      color:#dfe2ff;
      font:500 12px -apple-system,system-ui,sans-serif;
      opacity:0;pointer-events:none;z-index:2147483647;
      transition:opacity .25s,transform .25s cubic-bezier(.4,0,.2,1);
      max-width:calc(100vw - 32px);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      -webkit-backdrop-filter:blur(12px);
      backdrop-filter:blur(12px)
    }
    #tm-toast.show{opacity:1;transform:translate(-50%,0)}

    @media(max-width:600px){
      #tm-bar{
        gap:4px;padding:6px;
        max-width:calc(100vw - 12px);
        border-radius:12px
      }
      #tm-bar .tm-field{height:32px;padding:0 7px;border-radius:8px}
      #tm-bar .tm-field input{font-size:10px;letter-spacing:0}
      #tm-bar .tm-btn{height:32px;padding:0 9px;font-size:10px;border-radius:8px}
      #tm-bar .tm-otp{height:32px;font-size:14px;padding:0 10px;letter-spacing:1.5px}
      #tm-toast{font-size:11px;padding:7px 13px}
    }

    @media(max-width:380px){
      #tm-bar .tm-btn.copy{display:none}
      #tm-bar .tm-field input{font-size:9.5px}
    }
    `;

    const build = () => {
        if ($('tm-bar')) return;
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const bar = document.createElement('div');
        bar.id = 'tm-bar';
        bar.innerHTML = `
          <div class="tm-head">
            <span><span class="tm-dot off" id="tm-dot"></span>TempMail</span>
          </div>
          <div class="tm-row">
            <div class="tm-field" title="Email">
              <input id="tm-email" readonly placeholder="klik Load"/>
            </div>
            <button id="tm-load" class="tm-btn primary" title="Email + OTP baru">Load</button>
            <button id="tm-reset" class="tm-btn danger" title="Reset semua">Reset</button>
            <button id="tm-cp-e" class="tm-btn copy" title="Copy email">Copy</button>
          </div>
          <div class="tm-row">
            <div class="tm-otp" id="tm-big"></div>
          </div>
        `;
        document.body.appendChild(bar);

        const toastEl = document.createElement('div');
        toastEl.id = 'tm-toast';
        document.body.appendChild(toastEl);
    };

    const sync = () => {
        const emailEl = $('tm-email');
        const bigEl = $('tm-big');
        const dot = $('tm-dot');
        if (!emailEl || !bigEl) return;

        const email = store.get(LS_EMAIL);
        const otp = store.get(LS_OTP);

        emailEl.value = email;

        if (waiting) {
            bigEl.classList.add('waiting');
            bigEl.textContent = 'Menunggu...';
        } else {
            bigEl.classList.remove('waiting');
            bigEl.textContent = otp;
        }

        if (dot) {
            dot.classList.remove('off', 'wait');
            if (waiting) dot.classList.add('wait');
            else if (!email) dot.classList.add('off');
        }
    };

    const resetAll = () => {
        aborted = true;
        waiting = false;
        lastOtpId = 0;
        store.set(LS_EMAIL, '');
        store.set(LS_OTP, '');
        store.set(LS_LAST_ID, '0');
        store.set(LS_SESS, '');
        sync();
    };

    const bind = () => {
        const emailEl = $('tm-email');
        const bigEl = $('tm-big');
        const loadBtn = $('tm-load');
        const resetBtn = $('tm-reset');
        if (!emailEl || !bigEl || !loadBtn || !resetBtn) return;

        const copyEmail = async () =>
            (await copy(store.get(LS_EMAIL)))
                ? toast('Email tersalin ✓')
                : toast('Kosong');

        emailEl.onclick = copyEmail;
        const cpBtn = $('tm-cp-e');
        if (cpBtn) cpBtn.onclick = copyEmail;

        resetBtn.onclick = () => {
            resetAll();
            toast('Session direset');
        };

        loadBtn.onclick = async () => {
            if (waiting) return;

            resetAll();

            loadBtn.disabled = true;
            loadBtn.textContent = '...';
            waiting = true;
            sync();

            try {
                const email = await fetchEmail();
                store.set(LS_EMAIL, email);
                sync();

                const otp = await fetchOtp(() => sync());
                if (otp) {
                    store.set(LS_OTP, otp);
                    toast('OTP diterima ✓');
                } else if (!aborted) {
                    toast('Timeout OTP');
                }
            } catch {
                if (!aborted) toast('Gagal load');
            } finally {
                waiting = false;
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load';
                sync();
            }
        };

        bigEl.onclick = async () =>
            (await copy(store.get(LS_OTP))) ? toast('OTP tersalin ✓') : 0;
    };

    const init = () => {
        build();
        sync();
        bind();

        const observer = new MutationObserver(() => {
            if (!$('tm-bar')) {
                build();
                sync();
                bind();
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        window.addEventListener('storage', (e) => {
            if (e.key === LS_EMAIL || e.key === LS_OTP || e.key === LS_LAST_ID) {
                lastOtpId = Number(store.get(LS_LAST_ID)) || 0;
                sync();
            }
        });

        try {
            bc?.addEventListener('message', (e) => {
                const { key } = e.data || {};
                if (key === LS_EMAIL || key === LS_OTP || key === LS_LAST_ID) {
                    lastOtpId = Number(store.get(LS_LAST_ID)) || 0;
                    sync();
                }
            });
        } catch { /* silent */ }

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                lastOtpId = Number(store.get(LS_LAST_ID)) || 0;
                sync();
                bind();
            }
        });
    };

    init();
})();
