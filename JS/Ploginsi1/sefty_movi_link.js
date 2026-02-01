document.addEventListener("DOMContentLoaded", function() {
    const config = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const WORKER_URL = "https://secure-player.siwane.workers.dev";

    let countdownInterval = null;
    let activeBlobUrl = null;

    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag;

    const icons = {
        play: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align:middle;margin-left:8px;"><path d="M8 5v14l11-7z"/></svg>`,
        spinner: `<svg viewBox="0 0 50 50" class="si-sp" width="16" height="16" style="vertical-align:middle;margin-left:5px;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-linecap="round"></circle></svg>`,
        hand: `<svg viewBox="0 0 104.31 122.88" class="si-hd"><path d="M25.85,63.15c-0.04-0.12-0.08-0.28-0.1-0.42c-0.22-1.89-0.43-3.98-0.62-5.78c-0.26-2.64-0.55-5.69-0.76-7.83 c-0.14-1.45-0.6-2.83-1.27-3.86c-0.45-0.66-0.95-1.15-1.51-1.39c-0.45-0.18-1-0.2-1.57,0.02c-0.78,0.3-1.65,0.93-2.62,2.03 c-0.86,0.98-1.53,2.29-2.09,3.68c-0.79,2.03-1.26,4.19-1.45,5.67c-0.02,0.1-0.02,0.18-0.06,0.26L8.42,86.07 c-0.08,0.4-0.24,0.76-0.48,1.04c-1.81,2.33-2.95,4.33-3.28,5.95c-0.24,1.19,0,2.15,0.79,2.9l19.8,19.8 c1.26,1.21,2.72,1.97,4.47,2.29c1.91,0.36,4.14,0.16,6.7-0.54c0.04,0,0.1-0.02,0.14-0.02c0.97-0.26,2.24-0.57,3.46-0.88 c5.31-1.29,9.94-2.43,14.23-6.33l5.52-5.76c0.05-0.1,0.14-0.18,0.22-0.26s0.62-0.62,1.35-1.31c3.78-3.69,8.45-8.25,5.61-12.24 l-2.21-2.21c-1.07,1.04-2.21,2.05-3.3,3.02c-1,0.88-1.93,1.69-2.78,2.55c-0.91,0.91-2.38,0.91-3.30,0c-0.91-0.92-0.91-2.38,0-3.30 c0.86-0.86,1.91-1.79,3-2.76c3.74-3.30,8.03-7.07,5.73-10.38l-2.19-2.19c-0.12-0.12-0.22-0.26-0.31-0.40c-1.26,1.29-2.64,2.52-4,3.72 c-1,0.88-1.93,1.69-2.78,2.55c-0.91,0.91-2.38,0.91-3.30,0s-0.91-2.38,0-3.30c0.86-0.86,1.91-1.79,3-2.76 c3.74-3.30,8.03-7.07,5.73-10.38l-2.19-2.19c-0.16-0.16-0.28-0.31-0.38-0.50l-6.42,6.42c-0.91,0.91-2.38,0.91-3.30,0s-0.91-2.38,0-3.30 l17.22-17.25c2.88-2.88,3.54-5.88,2.78-8.15c-0.28-0.83-0.74-1.57-1.31-2.14s-1.31-1.03-2.14-1.31c-2.24-0.74-5.23-0.06-8.19,2.90 l-30.20,30.20c-0.91,0.91-2.38,0.91-3.30,0s-0.91-2.38,0-3.30l3.07-3.07L25.85,63.15z" fill="var(--linkC)"/></svg>`
    };

    if ("watch" === mode && canViewContent) {
        handleWatchRoute();
    } else {
        initializeLobbyWithProtection(config);
    }

    function initializeLobbyWithProtection(config) {
        const lobby = document.getElementById("siwane-lobby");
        if (!lobby || !config.GAS_URL) return;

        const rawSheet = lobby.dataset.sheet, movie = lobby.dataset.movie;
        const cleanName = formatTitle(rawSheet);
        let actionText = movie ? `بدء مشاهدة فيلم: ${movie}` : `استعراض حلقات: مسلسل ${cleanName}`;

        const style = `<style>
            .si-fx { min-height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            @keyframes si-sp-kf { to { transform: rotate(360deg); } }
            .si-sp { animation: si-sp-kf 0.8s linear infinite; }
            @keyframes si-sw { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
            .si-hd { animation: si-sw 1s infinite ease-in-out; margin-bottom: 5px; }
            .si-fd { animation: si-fd-kf 0.5s forwards; }
            @keyframes si-fd-kf { from { opacity: 0; } to { opacity: 1; } }
        </style>`;

        lobby.innerHTML = style + `<div class="siwane-container" id="si-auth-w">
            <div class="siwane-server-container" style="text-align:center;">
                <h2>${movie ? 'بوابة الفيلم' : 'قائمة الحلقات'}</h2>
                <div class="si-fx">
                    <div id="si-btn-z" style="width:100%;">
                        <div style="padding: 10px 0;"> 
                            <a href="javascript:void(0)" id="si-trig" class="button ln" style="width:100%; text-align:center; display:block; max-width:350px; margin: 0 auto;">
                               ${icons.play} ${actionText}
                            </a>
                        </div>
                    </div>
                    <div id="si-scr-z" style="display:none; padding: 10px 0;"> ${icons.hand}
                        <p id="si-msg" style="color: var(--linkC); font-weight: bold; font-size: 13px; margin: 0;">يرجى التمرير للأسفل قليلاً لتأمين المحتوى...</p>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById("si-trig").addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("si-btn-z").style.display = "none";
            document.getElementById("si-scr-z").style.display = "block";
            let triggered = false;
            const handler = () => {
                if (!triggered) {
                    triggered = true;
                    document.getElementById("si-msg").innerHTML = `${icons.spinner} جاري استخراج البيانات...`;
                    setTimeout(() => {
                        const wrapper = document.getElementById("si-auth-w");
                        wrapper.style.opacity = "0"; wrapper.style.transition = "opacity 0.3s";
                        setTimeout(() => {
                            if (movie) loadMovieLobby(rawSheet, movie, lobby, config);
                            else loadSeriesLobby(rawSheet, lobby, config);
                        }, 300);
                        window.removeEventListener('scroll', handler);
                    }, 1500);
                }
            };
            window.addEventListener('scroll', handler);
        });
    }

    async function loadSeriesLobby(sheet, container, config) {
        container.innerHTML = `<div class="siwane-container"><p class="note">جاري تحميل القائمة...</p></div>`;
        try {
            const res = await fetch(`${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`);
            const data = await res.json();
            if (data.episodes) {
                const unique = [...new Set(data.episodes.filter(e => e && e !== "---"))];
                let html = `<div class="siwane-container si-fd"><div class="siwane-episodes-container"><h2>حلقات مسلسل ${formatTitle(sheet)}</h2><div class="siwane-episodes-grid">`;
                unique.forEach(ep => {
                    html += `<div class="siwane-episode-btn" onclick="siRedirect('${sheet}', '${ep}', 'series')">${ep.toString().includes("الأخيرة") ? ep : `الحلقة ${ep}`}</div>`;
                });
                container.innerHTML = html + `</div></div></div>`;
                window.siRedirect = (s, e, t) => redirectToWatchPage(s, e, t);
            }
        } catch (e) { container.innerHTML = `<p class="note">خطأ في التحميل.</p>`; }
    }

    function loadMovieLobby(sheet, movieTitle, container, config) {
        container.innerHTML = `<div class="siwane-container si-fd"><div class="siwane-episodes-container"><h2>${movieTitle}</h2><div class="siwane-episodes-grid" style="grid-template-columns:1fr;"><div class="siwane-episode-btn" onclick="siRedirect('${sheet}', '${movieTitle}', 'movie')">${icons.play} شاهد الآن</div></div></div></div>`;
        window.siRedirect = (s, t, ty) => redirectToWatchPage(s, t, ty);
    }

    async function redirectToWatchPage(sheet, id, type) {
        try {
            const res = await fetch("/feeds/posts/summary?alt=json&max-results=150");
            const data = await res.json();
            const post = data.feed.entry[Math.floor(Math.random() * data.feed.entry.length)];
            const postUrl = post.link.find(l => l.rel === "alternate").href;
            sessionStorage.setItem("siwane_access_token", "true");
            window.location.href = `${postUrl}${postUrl.includes("?")?"&":"?"}mode=watch&sheet=${encodeURIComponent(sheet)}&${type==='movie'?'movie':'ep'}=${encodeURIComponent(id)}`;
        } catch (e) { alert("خطأ في التحويل."); }
    }

    function handleWatchRoute() {
        const sheet = urlParams.get("sheet"), ep = urlParams.get("ep"), movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : ep;
        if (sheet && config.GAS_URL) {
            const params = { GAS_URL: config.GAS_URL, COUNTDOWN: config.COUNTDOWN || 10, SHEET: decodeURIComponent(sheet), TYPE: movie ? "movie" : "series", ID: id, AD_LINKS: config.AD_LINKS || {}, AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3 };
            initializeWatchPage(params);
            const saved = sessionStorage.getItem("siwane_last_server");
            if (saved) {
                const data = JSON.parse(saved);
                if (data.sheet === params.SHEET && data.id === params.ID) {
                    setTimeout(() => { document.querySelector(`.siwane-server-btn[data-id="${data.serverId}"]`)?.click(); }, 1200);
                }
            }
        }
    }

    async function vDo(sid, params) { // playSelectedServer
        if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
        if (countdownInterval) clearInterval(countdownInterval);
        sessionStorage.setItem("siwane_last_server", JSON.stringify({ sheet: params.SHEET, id: params.ID, serverId: sid }));
        
        const vSec = document.querySelector(".siwane-video-container");
        window.scrollTo({ top: vSec.offsetTop - 20, behavior: 'smooth' });

        const cDisp = document.getElementById("si-c-dp"), cEl = document.getElementById("si-c-n"), cTxt = document.getElementById("si-c-tx"), vFrm = document.getElementById("si-v-f");
        cDisp.style.display = "flex"; cEl.style.display = "block"; cTxt.innerHTML = `جاري تأمين المشغل...`;
        vFrm.style.display = "none"; vFrm.src = "";

        try {
            const res = await fetch(`${WORKER_URL}/get-secure-player?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(sid)}`);
            const d = await res.json();
            if (d.realUrl) sAds(d.realUrl, params); // دالة الإعلانات
        } catch (e) { cTxt.innerHTML = "خطأ في السيرفر."; }
    }

    function sAds(pUrl, params) { // startCountdownAndAds
        let count = params.COUNTDOWN;
        const cEl = document.getElementById("si-c-n");
        cEl.textContent = count;
        countdownInterval = setInterval(() => {
            count--;
            if(count >= 0) cEl.textContent = count;
            else { clearInterval(countdownInterval); cEl.style.display = "none"; showAdGate(pUrl, params); }
        }, 1000);
    }

    function showAdGate(pUrl, params) {
        const txt = document.getElementById("si-c-tx");
        const clicked = {}; let btns = ''; const colors = ['ad-r','ad-b','ad-o','ad-g'];
        for(let i=1; i<=params.AD_BUTTONS_COUNT; i++) {
            clicked[`ad${i}`] = false;
            btns += `<button class="ad-gate-btn ${colors[i-1]||'ad-r'}" data-id="ad${i}" style="padding:8px;margin:3px;cursor:pointer;border:none;color:#fff;border-radius:5px;">إعلان ${i}</button>`;
        }
        txt.innerHTML = `<div style="text-align:center;"><p style="color:#ffeb3b;">اضغط على الاعلانات لفتح المشغل:</p>${btns}<div id="f-unl" style="display:none;margin-top:15px;"><button id="p-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;padding:10px;border:none;cursor:pointer;">تشغيل الآن</button></div></div>`;
        document.querySelectorAll(".ad-gate-btn").forEach(b => {
            b.onclick = function() {
                window.open(params.AD_LINKS[this.dataset.id], '_blank');
                this.style.opacity = "0.5"; this.disabled = true; this.textContent = "تم";
                clicked[this.dataset.id] = true;
                if(Object.values(clicked).every(v => v)) document.getElementById("f-unl").style.display = "block";
            };
        });
        document.getElementById("p-now").onclick = () => {
            txt.textContent = "مشاهدة ممتعة!";
            setTimeout(() => {
                document.getElementById("si-c-dp").style.display = "none";
                activeBlobUrl = xPl(pUrl); // إنشاء الـ Blob المشفر
                const frame = document.getElementById("si-v-f");
                frame.src = activeBlobUrl; frame.style.display = "block";
            }, 500);
        };
    }

    function xPl(pUrl) { // createSecurePlayer
        const h = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;height:100%;overflow:hidden;background:#000;}</style></head><body><iframe src="${pUrl}" style="width:100%;height:100%;border:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe></body></html>`;
        return URL.createObjectURL(new Blob([h], { type: 'text/html' }));
    }

    function initializeWatchPage(params) {
        const container = document.querySelector(".post-body, .entry-content, #post-body");
        if (!container) return;
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        document.title = `مشاهدة ${title}`;
        container.insertAdjacentHTML('afterbegin', `<div class="siwane-container"><header class="siwane-header"><h1>${title}</h1></header><div class="siwane-server-container"><h2>اختر السيرفر</h2><div id="si-sv-g" class="siwane-servers-grid"></div></div></div>`);
        container.insertAdjacentHTML('beforeend', `<div class="siwane-container"><div class="siwane-video-container"><h2>شاشة العرض</h2><div id="si-c-dp" style="display:none;"><div id="si-part-c" class="siwane-particles-container"></div><div id="si-c-tx"></div><div id="si-c-n"></div></div><iframe id="si-v-f" style="display:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe><a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا للدعم والمشاهدة</a></div></div>`);
        loadServers(params);
        createParticles();
    }

    async function loadServers(p) {
        const g = document.getElementById("si-sv-g"); g.innerHTML = `<p style="text-align:center;">جاري جلب السيرفرات...</p>`;
        try {
            const res = await fetch(`${p.GAS_URL}?contentSheetName=${encodeURIComponent(p.SHEET)}&${p.TYPE==="movie" ? `movieTitle=${encodeURIComponent(p.ID)}` : `episodeNumber=${encodeURIComponent(p.ID)}`}`);
            const svs = await res.json(); g.innerHTML = '';
            svs.forEach(s => {
                const b = document.createElement('div'); b.className = 'siwane-server-btn'; b.dataset.id = s.id;
                b.innerHTML = `<span>${s.icon || '🔗'}</span> <span>${s.title}</span>`;
                b.onclick = function() { document.querySelectorAll(".siwane-server-btn").forEach(x => x.classList.remove("active")); this.classList.add("active"); vDo(s.id, p); };
                g.appendChild(b);
            });
        } catch (e) { g.innerHTML = `<p>فشل التحميل.</p>`; }
    }

    function createParticles() {
        const c = document.getElementById("si-part-c"); if (!c) return;
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div'); p.className = 'siwane-particle';
            p.style.left = (Math.random() * 100) + "%"; p.style.top = (Math.random() * 100) + "%";
            p.style.animationDuration = (Math.random() * 4 + 3) + "s"; c.appendChild(p);
        }
    }
});
