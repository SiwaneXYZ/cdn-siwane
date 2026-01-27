/**
 * Siwane Secure Player - Vanilla JS Edition
 * Features: XOR Encryption, Smart DevTools Detection, No-jQuery
 */
(function() {
    'use strict';

    // 1. الإعدادات والمفاتيح (تأكد من مطابقة المفتاح في الـ Worker والسكربت)
    const config = window.siwaneGlobalConfig || {};
    const XOR_KEY = "S1w@nE_2026_SecUrE"; // مفتاح التشفير الخاص بك
    const WORKER_URL = "https://secure-player.mnaht00.workers.dev";
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    let countdownInterval = null;

    // --- أدوات التشفير والمنطق المساعد ---
    const xorCodec = (text, key) => {
        return text.split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        ).join('');
    };

    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    const isInternal = document.referrer.includes(window.location.hostname);
    const hasAccess = sessionStorage.getItem("siwane_access_token") === "true";
    const canView = isInternal || hasAccess;

    // --- المحرك الرئيسي ---
    document.addEventListener("DOMContentLoaded", () => {
        if (mode === "watch" && canView) {
            handleWatchRoute();
        } else if (mode === "watch" && !canView) {
            console.error("Access Denied");
        } else {
            initializeLobby(config);
        }
        initDevToolsProtection();
    });

    // ==========================================
    // 🛡️ اللوبي (نظام التفعيل الذكي)
    // ==========================================
    function initializeLobby(config) {
        const lobby = document.getElementById("siwane-lobby");
        if (!lobby || !config.GAS_URL) return;

        const rawSheet = lobby.dataset.sheet;
        const movie = lobby.dataset.movie;
        const cleanName = formatTitle(rawSheet);

        let actionText = movie ? `بدء مشاهدة فيلم: ${movie}` : `استعراض حلقات: مسلسل ${cleanName}`;
        
        lobby.innerHTML = `
            <div class="siwane-container" id="siwane-auth-wrapper">
                <div class="siwane-server-container" style="text-align:center;">
                    <h2>${movie ? 'بوابة الفيلم' : 'قائمة الحلقات'}</h2>
                    <div style="padding: 20px 0;">
                        <button id="activate-trigger" class="button ln" style="width:100%; max-width:350px;">
                           <i class="fa fa-play-circle"></i> ${actionText}
                        </button>
                    </div>
                    <p id="scroll-msg" style="display:none; color: #d35400; font-weight: bold;">
                        يرجى التمرير للأسفل قليلاً لتأمين المحتوى...
                    </p>
                </div>
            </div>`;

        const trigger = document.getElementById("activate-trigger");
        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            trigger.style.display = "none";
            const msg = document.getElementById("scroll-msg");
            msg.style.display = "block";

            const onScroll = () => {
                window.removeEventListener('scroll', onScroll);
                msg.innerHTML = '<i class="fa fa-spinner fa-spin"></i> جاري التحقق...';
                setTimeout(() => {
                    document.getElementById("siwane-auth-wrapper").style.opacity = "0";
                    setTimeout(() => {
                        if (movie) loadMovieLobby(rawSheet, movie, lobby, config);
                        else loadSeriesLobby(rawSheet, lobby, config);
                    }, 300);
                }, 1000);
            };
            window.addEventListener('scroll', onScroll);
        });
    }

    // ==========================================
    // 📺 جلب البيانات (Fetch API)
    // ==========================================
    async function loadSeriesLobby(sheet, container, config) {
        container.innerHTML = '<p>جاري تحميل القائمة...</p>';
        try {
            const res = await fetch(`${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`);
            const data = await res.json();
            if (data.episodes) {
                const unique = [...new Set(data.episodes.filter(e => e && e !== "---"))];
                let html = `<div class="siwane-episodes-grid">`;
                unique.forEach(ep => {
                    html += `<div class="siwane-episode-btn" data-ep="${ep}">${ep.toString().includes("الأخيرة") ? ep : 'الحلقة ' + ep}</div>`;
                });
                html += `</div>`;
                container.innerHTML = html;
                
                container.querySelectorAll('.siwane-episode-btn').forEach(btn => {
                    btn.onclick = () => redirectToWatch(sheet, btn.dataset.ep, 'series');
                });
            }
        } catch (e) { container.innerHTML = "خطأ في التحميل."; }
    }

    async function redirectToWatch(sheet, id, type) {
        try {
            const res = await fetch("/feeds/posts/summary?alt=json&max-results=100");
            const data = await res.json();
            const posts = data.feed.entry;
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            const postUrl = randomPost.link.find(l => l.rel === "alternate").href;
            
            sessionStorage.setItem("siwane_access_token", "true");
            const sep = postUrl.includes("?") ? "&" : "?";
            window.location.href = `${postUrl}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}&${type==='movie'?'movie':'ep'}=${encodeURIComponent(id)}`;
        } catch (e) { alert("حدث خطأ في التوجيه."); }
    }

    // ==========================================
    // 🔐 تشفير XOR + Base64 + Blob
    // ==========================================
    function createSecurePlayer(rawUrl) {
        // 1. XOR التشفير
        const ciphered = xorCodec(rawUrl, XOR_KEY);
        // 2. Base64
        const encoded = btoa(ciphered);

        const blobContent = `
            <html><body style="margin:0;background:#000;">
            <script>
                (function(){
                    const k = "${XOR_KEY}";
                    const data = "${encoded}";
                    const xor = (t, m) => t.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ m.charCodeAt(i % m.length))).join('');
                    const url = xor(atob(data), k);
                    document.write('<iframe src="'+url+'" style="width:100vw;height:100vh;border:none;" allowfullscreen></iframe>');
                })();
            <\/script></body></html>`;
        
        return URL.createObjectURL(new Blob([blobContent], {type: "text/html"}));
    }

    // ==========================================
    // 🛡️ حماية متقدمة لـ DevTools
    // ==========================================
    function initDevToolsProtection() {
        let isDev = false;
        
        // كشف عن طريق كائن الـ Console (أكثر ذكاءً)
        const devtools = /./;
        devtools.toString = function() {
            isDev = true;
            poisonPlayer();
        };

        setInterval(() => {
            isDev = false;
            console.log(devtools); 
            if (isDev) poisonPlayer();
            
            // كشف عن طريق فرق الأبعاد
            if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
                poisonPlayer();
            }
        }, 2000);
    }

    function poisonPlayer() {
        const frame = document.getElementById('siwane-video-frame');
        if (frame && frame.src !== "about:blank") {
            frame.src = "about:blank";
            alert("⚠️ بيئة غير آمنة! تم إيقاف المشغل.");
            location.reload();
        }
    }

    // ==========================================
    // 🎬 نظام الإعلانات والمشاهدة (Vanilla)
    // ==========================================
    function handleWatchRoute() {
        // يتم هنا بناء الواجهة تماماً كما في الكود السابق لكن باستخدام:
        // document.createElement و element.appendChild 
        // أو insertAdjacentHTML للسرعة.
        const sheet = urlParams.get("sheet");
        const ep = urlParams.get("ep") || urlParams.get("movie");
        
        // محاكاة سريعة لبناء الواجهة
        const container = document.querySelector(".post-body") || document.body;
        container.insertAdjacentHTML('afterbegin', `
            <div class="siwane-container">
                <div id="siwane-video-area">
                    <div id="siwane-countdown-display" style="display:none; height:300px; background:#111; position:relative; overflow:hidden;">
                        <div id="siwane-particles"></div>
                        <div id="status-text" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; z-index:10;"></div>
                    </div>
                    <iframe id="siwane-video-frame" style="display:none; width:100%; height:450px; border:none;" allowfullscreen></iframe>
                </div>
                <div id="servers-list" class="siwane-servers-grid"></div>
            </div>
        `);
        
        loadServers(sheet, ep);
    }

    async function loadServers(sheet, id) {
        const grid = document.getElementById("servers-list");
        const url = `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&episodeNumber=${encodeURIComponent(id)}`;
        
        try {
            const res = await fetch(url);
            const servers = await res.json();
            servers.forEach(s => {
                const btn = document.createElement("div");
                btn.className = "siwane-server-btn";
                btn.innerHTML = `<span>🔗</span> <span>${s.title}</span>`;
                btn.onclick = () => fetchRealUrl(s.id, sheet);
                grid.appendChild(btn);
            });
        } catch(e) {}
    }

    async function fetchRealUrl(serverId, sheet) {
        const status = document.getElementById("status-text");
        const display = document.getElementById("siwane-countdown-display");
        const frame = document.getElementById("siwane-video-frame");

        display.style.display = "block";
        frame.style.display = "none";
        status.innerText = "جاري تأمين الرابط...";

        try {
            const res = await fetch(`${WORKER_URL}/get-secure-player?sheet=${sheet}&id=${serverId}`);
            const data = await res.json();
            if (data.realUrl) {
                const blobUrl = createSecurePlayer(data.realUrl);
                startAdGate(blobUrl);
            }
        } catch(e) { status.innerText = "خطأ في الاتصال."; }
    }

    function startAdGate(url) {
        const status = document.getElementById("status-text");
        let count = 5;
        const timer = setInterval(() => {
            status.innerText = `انتظر ${count} ثوانٍ...`;
            if (count-- <= 0) {
                clearInterval(timer);
                status.innerHTML = `<button class="button ln" id="final-play">فتح المشغل الآن</button>`;
                document.getElementById("final-play").onclick = () => {
                    document.getElementById("siwane-countdown-display").style.display = "none";
                    const frame = document.getElementById("siwane-video-frame");
                    frame.src = url;
                    frame.style.display = "block";
                };
            }
        }, 1000);
    }

})();
