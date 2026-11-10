// ==UserScript==
// @name         TempMail Helper
// @namespace    tempmail-helper
// @version      4.0
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
    const KEY_SESS = 'tm_sess'; // PHPSESSID

    const gmGet = k => { try { return GM_getValue(k, '') || ''; } catch { return ''; } };
    const gmSet = (k, v) => {
        try { v ? GM_setValue(k, v) : GM_deleteValue(k); } catch { /* silent */ }
    };

    // === FUNGSI REQ YANG MENANGKAP SET-COOKIE ===
    const req = (url, opt = {}) => new Promise((ok, err) =>
        GM_xmlhttpRequest({
            method: opt.method || 'GET',
            url,
            data: opt.body,
            headers: opt.headers || {},
            // Kirim cookie manual jika ada
            cookie: opt.cookie || undefined,
            onload: r => {
                // Tangkap Set-Cookie dari response
                if (r.responseHeaders) {
                    const setCookie = r.responseHeaders.match(/set-cookie:\s*([^\r\n]+)/i);
                    if (setCookie) {
                        const phpsessid = setCookie[1].match(/PHPSESSID=([^;]+)/);
                        if (phpsessid) {
                            gmSet(KEY_SESS, phpsessid[1]);
                        }
                    }
                }
                ok(r.responseText);
            },
            onerror: err,
        })
    );

    // === FETCH EMAIL (Tangkap PHPSESSID) ===
    const fetchEmail = async () => {
        // Kirim cookie lama jika ada (untuk jaga-jaga)
        const oldSess = gmGet(KEY_SESS);
        const html = await req(BASE, {
            cookie: oldSess ? `PHPSESSID=${oldSess}` : undefined,
        });
        const m = html.match(/emailEncoded\s*=\s*"([^"]+)"/);
        if (!m) throw new Error('email tidak ditemukan');
        return atob(m[1]);
    };

    const otpFrom = subject =>
        (subject || '').match(/\b(\d{5})\b/)?.[1] || null;

    let lastOtpId = Number(gmGet(KEY_LAST_ID)) || 0;
    let waiting = false;
    let aborted = false;

    // === FETCH OTP (Wajib Kirim PHPSESSID) ===
    const fetchOtp = async (tick) => {
        const end = Date.now() + TIMEOUT;
        aborted = false;
        while (Date.now() < end && !aborted) {
            try {
                const sess = gmGet(KEY_SESS);
                // JIKA PHPSESSID KOSONG, JANGAN LANJUT (karena pasti gagal)
                if (!sess) {
                    tick?.('Session hilang, coba Load ulang');
                    await new Promise(r => setTimeout(r, POLL));
                    continue;
                }

                const raw = await req(`${BASE}/template/checker.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `last_id=${lastOtpId}`,
                    cookie: `PHPSESSID=${sess}`, // <-- KIRIM PAKSA
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

    const CSS = `/* ... (CSS sama persis seperti sebelumnya, tidak saya ubah) ... */`;

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

        const email = gmGet(KEY_EMAIL);
        const otp = gmGet(KEY_OTP);

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
        gmSet(KEY_EMAIL, '');
        gmSet(KEY_OTP, '');
        gmSet(KEY_LAST_ID, '0');
        gmSet(KEY_SESS, ''); // Hapus PHPSESSID
        sync();
    };

    const bind = () => {
        const emailEl = $('tm-email');
        const bigEl = $('tm-big');
        const loadBtn = $('tm-load');
        const resetBtn = $('tm-reset');
        if (!emailEl || !bigEl || !loadBtn || !resetBtn) return;

        const copyEmail = async () =>
            (await copy(gmGet(KEY_EMAIL)))
                ? toast('Email tersalin ✓')
                : toast('Kosong');

        emailEl.onclick = copyEmail;
        const cpBtn = $('tm-cp-e');
        if (cpBtn) cpBtn.onclick = copyEmail;

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
                // 1. Ambil email + tangkap PHPSESSID
                const email = await fetchEmail();
                gmSet(KEY_EMAIL, email);
                sync();

                // 2. Polling OTP (fetchOtp akan cek PHPSESSID)
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

        try {
            GM_addValueChangeListener(KEY_EMAIL, (n, o, v, remote) => { if (remote) sync(); });
            GM_addValueChangeListener(KEY_OTP, (n, o, v, remote) => { if (remote) sync(); });
            GM_addValueChangeListener(KEY_LAST_ID, (n, o, v, remote) => {
                if (remote) { lastOtpId = Number(v) || 0; sync(); }
            });
            GM_addValueChangeListener(KEY_SESS, (n, o, v, remote) => {
                // Session berubah, tidak perlu update UI, tapi bisa log
            });
        } catch { /* silent */ }

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                lastOtpId = Number(gmGet(KEY_LAST_ID)) || 0;
                sync();
                bind();
            }
        });
    };

    init();
})();
