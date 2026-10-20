// ==UserScript==
// @name         FB Auto Register
// @namespace    https://viayoo.com/6rpkld
// @version      3.0
// @match        https://*.facebook.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var PASSWORD = "manglar27";

    var NAMA_DEPAN = "Olivia,Emma,Ava,Sophia,Isabella,Mia,Charlotte,Amelia,Harper,Evelyn,Abigail,Emily,Ella,Elizabeth,Camila,Luna,Sofia,Avery,Mila,Aria,Scarlett,Penelope,Layla,Chloe,Victoria,Madison,Eleanor,Grace,Nora,Riley,Zoey,Hannah,Hazel,Lily,Ellie,Violet,Lillian,Zoe,Stella,Aurora,Natalie,Emilia,Everly,Leah,Aubrey,Willow,Addison,Lucy,Audrey,Bella,Nova,Brooklyn,Paisley,Savannah,Claire,Skylar,Isla,Genesis,Naomi,Elena,Caroline,Eliana,Anna,Maya,Valentina,Ruby,Kennedy,Ivy,Ariana,Aaliyah,Cora,Madelyn,Alice,Kinsley,Hailey,Gabriella,Allison,Gianna,Serenity,Samantha,Sarah,Autumn,Quinn,Eva,Piper,Sophie,Sadie,Delilah,Nevaeh,Adeline,Arya,Emery,Lydia,Clara,Vivian,Madeline,Peyton,Julia,Rylee,Brielle".split(",");

    var NAMA_BELAKANG = "Smith,Johnson,Williams,Brown,Jones,Garcia,Miller,Davis,Rodriguez,Martinez,Hernandez,Lopez,Gonzalez,Wilson,Anderson,Thomas,Taylor,Moore,Jackson,Martin,Lee,Perez,Thompson,White,Harris,Sanchez,Clark,Ramirez,Lewis,Robinson,Walker,Young,Allen,King,Wright,Scott,Torres,Nguyen,Hill,Flores,Green,Adams,Nelson,Baker,Hall,Rivera,Campbell,Mitchell,Carter,Roberts,Gomez,Phillips,Evans,Turner,Diaz,Parker,Cruz,Edwards,Collins,Reyes,Stewart,Morris,Morales,Murphy,Cook,Rogers,Gutierrez,Ortiz,Morgan,Cooper,Peterson,Bailey,Reed,Kelly,Howard,Ramos,Kim,Cox,Ward,Richardson,Watson,Brooks,Chavez,Wood,James,Bennett,Gray,Mendoza,Ruiz,Hughes,Price,Alvarez,Castillo,Sanders,Patel,Myers,Long,Ross,Foster,Jimenez".split(",");

    function acak(a) {
        return a[Math.floor(Math.random() * a.length)];
    }

    function ambil(s) {
        return document.querySelector(s);
    }

    function isi(el, v) {
        el.focus();
        el.value = v;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function tampak(el) {
        return !!el && el.offsetWidth > 0 && el.offsetHeight > 0 &&
            getComputedStyle(el).visibility !== 'hidden';
    }

    function lanjut() {
        var b = ambil('button[data-sigil="touchable multi_step_next"]');
        if (b) b.click();
    }

    function nama() {
        var f = ambil('#firstname_input');
        if (!f) { setTimeout(nama, 500); return; }

        var depan = acak(NAMA_DEPAN);
        var belakang = acak(NAMA_BELAKANG);
        var l = ambil('#lastname_input');

        if (tampak(l)) { isi(f, depan); isi(l, belakang); }
        else { isi(f, depan + ' ' + belakang); }

        lanjut();
        setTimeout(lahir, 1500);
    }

    function lahir() {
        var h = ambil('select[name="birthday_day"]');
        var b = ambil('select[name="birthday_month"]');
        var t = ambil('select[name="birthday_year"]');
        if (!h || !b || !t) { setTimeout(lahir, 500); return; }

        var umur = Math.floor(Math.random() * 21) + 25;
        h.value = Math.floor(Math.random() * 28) + 1;
        b.value = Math.floor(Math.random() * 12) + 1;
        t.value = new Date().getFullYear() - umur;

        [h, b, t].forEach(function (e) {
            e.dispatchEvent(new Event('change', { bubbles: true }));
        });

        lanjut();
        setTimeout(telepon, 1500);
    }

    function telepon() {
        var e = ambil('input[name="reg_email__"]');
        if (!e) { setTimeout(telepon, 500); return; }
        isi(e, '+');
        lanjut();
        setTimeout(gender, 1500);
    }

    function gender() {
        var e = ambil('input[name="sex"][value="1"]');
        if (!e) { setTimeout(gender, 500); return; }
        e.click();
        lanjut();
        setTimeout(password, 1500);
    }

    function password() {
        var e = ambil('input[name="reg_passwd__"]');
        if (!e) { setTimeout(password, 500); return; }
        isi(e, PASSWORD);
        var s = ambil('[data-sigil="touchable multi_step_submit"]');
        if (s) s.click();
    }

    setTimeout(nama, 3000);
})();
