// ==UserScript==
// @name         TempMail Helper
// @namespace    tempmail-helper
// @version      5.1
// @match        https://*.instagram.com/*
// @match        https://*.facebook.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @connect      tempemail.info
// ==/UserScript==

(() => {
    'use strict';

    const BASE = 'https://tempemail.info';
    const POLL = 3000;
    const TIMEOUT = 180_000;
    const KEY_EMAIL = 'tm_email';
    const KEY_OTP = 'tm_otp';
    const KEY_LAST_ID = 'tm_last_id';
    const KEY_SESS = 'tm_sess';
    const KEY_MIN = 'tm_min';
    const KEY_PHONE = 'tm_phone';

    const gmGet = k => { try { return GM_getValue(k, '') || ''; } catch { return ''; } };
    const gmSet = (k, v) => {
        try { v ? GM_setValue(k, v) : GM_deleteValue(k); } catch { /* silent */ }
    };

    const req = (url, opt = {}) => new Promise((ok, err) =>
        GM_xmlhttpRequest({
            method: opt.method || 'GET',
            url,
            data: opt.body,
            headers: opt.headers || {},
            cookie: opt.cookie || undefined,
            onload: r => {
                if (r.responseHeaders) {
                    const sc = r.responseHeaders.match(/set-cookie:\s*([^\r\n]+)/i);
                    if (sc) {
                        const p = sc[1].match(/PHPSESSID=([^;]+)/);
                        if (p) gmSet(KEY_SESS, p[1]);
                    }
                }
                ok(r.responseText);
            },
            onerror: err,
        })
    );

    const fetchEmail = async () => {
        const old = gmGet(KEY_SESS);
        const html = await req(BASE, {
            cookie: old ? `PHPSESSID=${old}` : undefined,
        });
        const m = html.match(/emailEncoded\s*=\s*"([^"]+)"/);
        if (!m) throw new Error('email tidak ditemukan');
        return atob(m[1]);
    };

    const otpFrom = subject =>
        (subject || '').match(/\b(\d{5})\b/)?.[1] || null;

    const genPhone = () => {
        const prefix = '62';
        let n = '';
        for (let i = 0; i < 10; i++) n += Math.floor(Math.random() * 10);
        return prefix + n;
    };

    let lastOtpId = Number(gmGet(KEY_LAST_ID)) || 0;
    let waiting = false;
    let aborted = false;

    const fetchOtp = async (tick) => {
        const end = Date.now() + TIMEOUT;
        aborted = false;
        while (Date.now() < end && !aborted) {
            try {
                const sess = gmGet(KEY_SESS);
                if (!sess) {
                    tick?.('Session hilang');
                    await new Promise(r => setTimeout(r, POLL));
                    continue;
                }
                const raw = await req(`${BASE}/template/checker.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `last_id=${lastOtpId}`,
                    cookie: `PHPSESSID=${sess}`,
                });
                const mails = JSON.parse(raw) || [];
                for (const m of mails) {
                    lastOtpId = Math.max(lastOtpId, m.id || 0);
                    gmSet(KEY_LAST_ID, String(lastOtpId));
                    const otp = otpFrom(m.subject);
                    if (otp) return otp;
                }
                tick?.();
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
        t._timer = setTimeout(() => t.classList.remove('show'), 1500);
    };

    const copy = async (text) => {
        if (!text) return false;
        try { await navigator.clipboard.writeText(text); return true; }
        catch {
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
      position:fixed;left:0;right:0;bottom:0;width:100%;
      z-index:2147483647;
      background:rgba(14,14,22,.97);
      -webkit-backdrop-filter:blur(24px) saturate(180%);
      backdrop-filter:blur(24px) saturate(180%);
      border-top:1px solid rgba(255,255,255,.08);
      box-shadow:0 -8px 32px rgba(0,0,0,.5);
      font:12px -apple-system,'Segoe UI',system-ui,sans-serif;
      color:#e0e3ff;
      user-select:none;
      -webkit-tap-highlight-color:transparent;
      box-sizing:border-box;
      transition:max-height .28s cubic-bezier(.4,0,.2,1);
      max-height:200px;overflow:hidden
    }
    #tm-bar.min{max-height:36px}

    #tm-bar .tm-body{
      display:flex;flex-direction:column;gap:6px;
      padding:6px 10px calc(8px + env(safe-area-inset-bottom,0px))
    }

    #tm-bar .tm-head{
      display:flex;align-items:center;justify-content:space-between;
      height:24px;padding:0 2px;
      font:600 10px -apple-system,system-ui,sans-serif;
      letter-spacing:.8px;text-transform:uppercase;
      color:#7c88ff
    }
    #tm-bar .tm-head .tm-left{
      display:flex;align-items:center;gap:6px;
      cursor:pointer;flex:1;min-width:0
    }
    #tm-bar .tm-head .tm-dot{
      width:7px;height:7px;border-radius:50%;
      background:#5ce89a;flex-shrink:0;
      box-shadow:0 0 8px #5ce89a;
      transition:background .3s,box-shadow .3s
    }
    #tm-bar .tm-head .tm-dot.off{background:#565a80;box-shadow:none}
    #tm-bar .tm-head .tm-dot.wait{
      background:#ffb347;box-shadow:0 0 8px #ffb347;
      animation:tmPulse 1.2s ease-in-out infinite
    }
    @keyframes tmPulse{
      0%,100%{opacity:1}
      50%{opacity:.4}
    }
    #tm-bar .tm-head .tm-title{
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis
    }
    #tm-bar .tm-head .tm-min{
      width:24px;height:24px;padding:0;
      display:inline-flex;align-items:center;justify-content:center;
      border-radius:6px;cursor:pointer;flex-shrink:0;
      background:transparent;border:none;
      color:#7c88ff;transition:all .16s
    }
    #tm-bar .tm-head .tm-min:hover{background:rgba(124,136,255,.18);color:#fff}
    #tm-bar .tm-head .tm-min:active{transform:scale(.9)}
    #tm-bar .tm-head .tm-min svg{
      width:14px;height:14px;
      transition:transform .28s cubic-bezier(.4,0,.2,1)
    }
    #tm-bar.min .tm-head .tm-min svg{transform:rotate(180deg)}

    #tm-bar .tm-row{
      display:flex;align-items:center;gap:6px;
      min-width:0;width:100%
    }

    #tm-bar .tm-field{
      display:flex;align-items:center;
      height:36px;flex:1 1 0;min-width:0;
      padding:0 10px;border-radius:9px;
      background:rgba(0,0,0,.5);
      border:1px solid rgba(124,136,255,.18);
      transition:border-color .2s,background .2s
    }
    #tm-bar .tm-field:focus-within{
      border-color:rgba(124,136,255,.6);
      background:rgba(0,0,0,.65)
    }
    #tm-bar .tm-field input{
      width:100%;min-width:0;
      border:none;outline:none;background:transparent;
      font:11.5px 'SF Mono','Consolas',monospace;
      letter-spacing:.3px;color:#e0e3ff;
      text-align:center
    }
    #tm-bar .tm-field input::placeholder{
      color:#565a80;font-weight:500;font-size:11px
    }
    #tm-bar .tm-field.phone{
      border-color:rgba(92,232,154,.22);
      background:rgba(80,220,140,.05)
    }
    #tm-bar .tm-field.phone:focus-within{
      border-color:rgba(92,232,154,.55)
    }
    #tm-bar .tm-field.phone input{color:#5ce89a}

    #tm-bar .tm-btn{
      height:36px;padding:0 12px;
      border-radius:9px;cursor:pointer;
      font:600 11.5px -apple-system,system-ui,sans-serif;
      background:rgba(124,136,255,.14);
      border:1px solid rgba(124,136,255,.25);
      color:#dfe2ff;
      transition:all .16s;
      white-space:nowrap;flex-shrink:0;
      -webkit-tap-highlight-color:transparent;
      display:inline-flex;align-items:center;justify-content:center
    }
    #tm-bar .tm-btn:hover{background:rgba(124,136,255,.28);color:#fff}
    #tm-bar .tm-btn:active{transform:scale(.94)}
    #tm-bar .tm-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
    #tm-bar .tm-btn.primary{
      background:rgba(124,136,255,.35);
      border-color:rgba(124,136,255,.55);color:#fff;
      min-width:64px
    }
    #tm-bar .tm-btn.danger{
      background:rgba(255,107,107,.14);
      border-color:rgba(255,107,107,.3);color:#ff8f8f;
      padding:0 10px
    }
    #tm-bar .tm-btn.danger:hover{
      background:rgba(255,107,107,.28);color:#fff
    }
    #tm-bar .tm-btn.copy{padding:0 10px;font-size:11px}
    #tm-bar .tm-btn.gen{
      background:rgba(80,220,140,.14);
      border-color:rgba(80,220,140,.3);
      color:#5ce89a;
      padding:0 10px;font-size:11px
    }
    #tm-bar .tm-btn.gen:hover{
      background:rgba(80,220,140,.28);color:#fff
    }

    #tm-bar .tm-otp{
      height:42px;width:100%;
      display:flex;align-items:center;justify-content:center;
      border-radius:9px;
      font:700 21px 'SF Mono','Consolas',monospace;
      letter-spacing:5px;
      color:#5ce89a;
      background:rgba(80,220,140,.08);
      border:1px solid rgba(80,220,140,.22);
      cursor:pointer;
      transition:all .2s;
      padding-left:5px
    }
    #tm-bar .tm-otp:hover{background:rgba(80,220,140,.14)}
    #tm-bar .tm-otp:active{transform:scale(.98)}
    #tm-bar .tm-otp:empty{display:none}
    #tm-bar .tm-otp.waiting{
      color:#ffb347;background:rgba(255,179,71,.08);
      border-color:rgba(255,179,71,.22);
      font:600 12px -apple-system,system-ui,sans-serif;
      letter-spacing:.5px;
      padding-left:0
    }

    #tm-toast{
      position:fixed;left:50%;
      bottom:calc(180px + env(safe-area-inset-bottom,0px));
      transform:translate(-50%,14px);
      padding:9px 18px;border-radius:22px;
      background:rgba(20,22,38,.97);
      border:1px solid rgba(124,136,255,.4);
      color:#dfe2ff;
      font:500 12px -apple-system,system-ui,sans-serif;
      opacity:0;pointer-events:none;z-index:2147483647;
      transition:opacity .25s,transform .25s cubic-bezier(.4,0,.2,1);
      max-width:calc(100vw - 32px);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      -webkit-backdrop-filter:blur(12px);
      backdrop-filter:blur(12px);
      box-shadow:0 8px 32px rgba(0,0,0,.5)
    }
    #tm-toast.show{opacity:1;transform:translate(-50%,0)}

    @media(max-width:380px){
      #tm-bar .tm-btn.copy{display:none}
      #tm-bar .tm-btn{padding:0 9px;font-size:11px}
      #tm-bar .tm-btn.primary{min-width:56px}
      #tm-bar .tm-field input{font-size:11px}
      #tm-bar .tm-otp{font-size:19px;letter-spacing:4px;height:40px}
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
          <div class="tm-body">
            <div class="tm-head">
              <div class="tm-left" id="tm-toggle">
                <span class="tm-dot off" id="tm-dot"></span>
                <span class="tm-title">TempMail</span>
              </div>
              <button class="tm-min" id="tm-min" title="Minimize">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
            <div class="tm-row">
              <div class="tm-field" title="Email">
                <input id="tm-email" readonly placeholder="klik Load"/>
              </div>
              <button id="tm-load" class="tm-btn primary" title="Email + OTP baru">Load</button>
              <button id="tm-reset" class="tm-btn danger" title="Reset">Reset</button>
              <button id="tm-cp-e" class="tm-btn copy" title="Copy email">Copy</button>
            </div>
            <div class="tm-row">
              <div class="tm-field phone" title="Nomor HP">
                <input id="tm-phone" readonly placeholder="62..."/>
              </div>
              <button id="tm-gen-phone" class="tm-btn gen" title="Generate nomor">Gen</button>
              <button id="tm-cp-p" class="tm-btn copy" title="Copy nomor">Copy</button>
            </div>
            <div class="tm-row">
              <div class="tm-otp" id="tm-big"></div>
            </div>
          </div>
        `;
        document.body.appendChild(bar);

        const toastEl = document.createElement('div');
        toastEl.id = 'tm-toast';
        document.body.appendChild(toastEl);
    };

    const sync = () => {
        const emailEl = $('tm-email');
        const phoneEl = $('tm-phone');
        const bigEl = $('tm-big');
        const dot = $('tm-dot');
        if (!emailEl || !bigEl) return;

        const email = gmGet(KEY_EMAIL);
        const otp = gmGet(KEY_OTP);

        emailEl.value = email;
        if (phoneEl) phoneEl.value = gmGet(KEY_PHONE);

        if (waiting) {
            bigEl.classList.add('waiting');
            bigEl.textContent = 'Menunggu OTP...';
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

    const setMin = (min) => {
        const bar = $('tm-bar');
        if (!bar) return;
        bar.classList.toggle('min', min);
        gmSet(KEY_MIN, min ? '1' : '');
    };

    const resetAll = () => {
        aborted = true;
        waiting = false;
        lastOtpId = 0;
        gmSet(KEY_EMAIL, '');
        gmSet(KEY_OTP, '');
        gmSet(KEY_LAST_ID, '0');
        gmSet(KEY_SESS, '');
        sync();
    };

    const bind = () => {
        const emailEl = $('tm-email');
        const phoneEl = $('tm-phone');
        const bigEl = $('tm-big');
        const loadBtn = $('tm-load');
        const resetBtn = $('tm-reset');
        const minBtn = $('tm-min');
        const toggle = $('tm-toggle');
        if (!emailEl || !bigEl || !loadBtn || !resetBtn || !minBtn) return;

        const copyEmail = async () =>
            (await copy(gmGet(KEY_EMAIL)))
                ? toast('Email tersalin ✓')
                : toast('Kosong');

        const copyPhone = async () =>
            (await copy(gmGet(KEY_PHONE)))
                ? toast('Nomor tersalin ✓')
                : toast('Kosong');

        emailEl.onclick = copyEmail;
        const cpBtn = $('tm-cp-e');
        if (cpBtn) cpBtn.onclick = copyEmail;

        if (phoneEl) phoneEl.onclick = copyPhone;
        const cpPhone = $('tm-cp-p');
        if (cpPhone) cpPhone.onclick = copyPhone;

        const genBtn = $('tm-gen-phone');
        if (genBtn) genBtn.onclick = () => {
            const phone = genPhone();
            gmSet(KEY_PHONE, phone);
            sync();
            toast('Nomor baru ✓');
        };

        minBtn.onclick = () => {
            const bar = $('tm-bar');
            setMin(!bar.classList.contains('min'));
        };

        toggle.onclick = () => {
            const bar = $('tm-bar');
            setMin(!bar.classList.contains('min'));
        };

        resetBtn.onclick = () => {
            resetAll();
            toast('Direset');
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
                gmSet(KEY_EMAIL, email);
                sync();

                const otp = await fetchOtp(() => sync());
                if (otp) {
                    gmSet(KEY_OTP, otp);
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
            (await copy(gmGet(KEY_OTP))) ? toast('OTP tersalin ✓') : 0;
    };

    const init = () => {
        build();
        sync();
        bind();

        if (gmGet(KEY_MIN)) setMin(true);

        const observer = new MutationObserver(() => {
            if (!$('tm-bar')) {
                build();
                sync();
                bind();
                if (gmGet(KEY_MIN)) setMin(true);
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        try {
            GM_addValueChangeListener(KEY_EMAIL, (n, o, v, r) => { if (r) sync(); });
            GM_addValueChangeListener(KEY_OTP, (n, o, v, r) => { if (r) sync(); });
            GM_addValueChangeListener(KEY_PHONE, (n, o, v, r) => { if (r) sync(); });
            GM_addValueChangeListener(KEY_LAST_ID, (n, o, v, r) => {
                if (r) { lastOtpId = Number(v) || 0; sync(); }
            });
        } catch { /* silent */ }

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                lastOtpId = Number(gmGet(KEY_LAST_ID)) || 0;
                sync();
                bind();
                if (gmGet(KEY_MIN)) setMin(true);
            }
        });
    };

    init();
})();
