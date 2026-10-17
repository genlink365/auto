// ==UserScript==
// @name FB Auto
// @namespace https://viayoo.com/6rpkld
// @version 1.0
// @match https://limited.facebook.com/*
// @run-at document-end
// @grant none
// ==/UserScript==
(function () {
var PW = "PasswordKuat123!";

var D = [
"Olivia","Emma","Ava","Sophia","Isabella",
"Mia","Charlotte","Amelia","Harper","Evelyn",
"Abigail","Emily","Ella","Elizabeth","Camila",
"Luna","Sofia","Avery","Mila","Aria",
"Scarlett","Penelope","Layla","Chloe","Victoria"
];

var B = [
"Smith","Johnson","Williams","Brown","Jones",
"Garcia","Miller","Davis","Rodriguez","Martinez",
"Hernandez","Lopez","Gonzalez","Wilson","Anderson",
"Thomas","Taylor","Moore","Jackson","Martin",
"Lee","Perez","Thompson","White","Harris"
];

function p(a) {
return a[Math.floor(Math.random() * a.length)];
}
function q(s) {
return document.querySelector(s);
}
function f(e, v) {
e.focus();
e.value = v;
e.dispatchEvent(new Event('input', { bubbles: true }));
e.dispatchEvent(new Event('change', { bubbles: true }));
}
function vis(e) {
return !!e && e.offsetWidth > 0 && e.offsetHeight > 0
&& getComputedStyle(e).visibility !== 'hidden';
}
function next() {
var b = q('button[data-sigil="touchable multi_step_next"]');
if (b) b.click();
}

function s1() {
var a = q('#firstname_input');
if (!a) { setTimeout(s1, 500); return; }
var d = p(D), b = p(B);
var l = q('#lastname_input');
if (vis(l)) { f(a, d); f(l, b); }
else { f(a, d + ' ' + b); }
next();
setTimeout(s2, 1500);
}

function s2() {
var a = q('select[name="birthday_day"]');
var b = q('select[name="birthday_month"]');
var c = q('select[name="birthday_year"]');
if (!a || !b || !c) { setTimeout(s2, 500); return; }
var u = Math.floor(Math.random() * 21) + 25;
a.value = Math.floor(Math.random() * 28) + 1;
b.value = Math.floor(Math.random() * 12) + 1;
c.value = new Date().getFullYear() - u;
[a, b, c].forEach(function (e) {
e.dispatchEvent(new Event('change', { bubbles: true }));
});
next();
setTimeout(s3, 1500);
}

function s3() {
var e = q('input[name="reg_email__"]');
if (!e) { setTimeout(s3, 500); return; }
f(e, '+');
next();
setTimeout(s4, 1500);
}

function s4() {
var e = q('input[name="sex"][value="1"]');
if (!e) { setTimeout(s4, 500); return; }
e.click();
next();
setTimeout(s5, 1500);
}

function s5() {
var e = q('input[name="reg_passwd__"]');
if (!e) { setTimeout(s5, 500); return; }
f(e, PW);
var b = q('[data-sigil="touchable multi_step_submit"]');
if (b) b.click();
}

setTimeout(s1, 3000);
})();
