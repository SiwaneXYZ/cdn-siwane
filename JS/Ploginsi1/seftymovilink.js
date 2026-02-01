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
        spinner: `<svg viewBox="0 0 50 50" class="siwane-spin" width="16" height="16" style="vertical-align:middle;margin-left:5px;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-linecap="round"></circle></svg>`,
        hand: `<svg viewBox="0 0 104.31 122.88" class="siwane-hand-swipe"><path d="M25.85,63.15c-0.04-0.12-0.08-0.28-0.1-0.42c-0.22-1.89-0.43-3.98-0.62-5.78c-0.26-2.64-0.55-5.69-0.76-7.83 c-0.14-1.45-0.6-2.83-1.27-3.86c-0.45-0.66-0.95-1.15-1.51-1.39c-0.45-0.18-1-0.2-1.57,0.02c-0.78,0.3-1.65,0.93-2.62,2.03 c-0.86,0.98-1.53,2.29-2.09,3.68c-0.79,2.03-1.26,4.19-1.45,5.67L25.85,63.15z" fill="var(--linkC)"/></svg>`
    };

    if ("watch" === mode && canViewContent) {
        handleWatchRoute();
    } else {
        initializeLobbyWithProtection(config);
    }

    // --- Lobby Functions ---
    function initializeLobbyWithProtection(config) {
        const lobby = document.getElementById("siwane-lobby");
        if (!lobby || !config.GAS_URL) return;
        const rawSheet = lobby.dataset.sheet, movie = lobby.dataset.movie;
        const cleanName = formatTitle(rawSheet);
        let actionText = movie ? `بدء مشاهدة فيلم: ${movie}` : `استعراض حلقات: مسلسل ${cleanName}`;

        lobby.innerHTML = `
            <style>
                .siwane-flex-box { min-height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                @keyframes siwane-spin { to { transform: rotate(360deg); } }
                .siwane-spin { animation: siwane-spin 0.8s linear infinite; }
                @keyframes siwane-swipe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
                .siwane-hand-swipe { animation: siwane-swipe 1s infinite ease-in-out; margin-bottom: 5px; }
                .siwane-fade-in { animation: siwane-fade-in-kf 0.5s forwards; }
                @keyframes siwane-fade-in-kf { from { opacity: 0; } to { opacity: 1; } }
            </style>
            <div class="siwane-container" id="siwane-auth-wrapper">
                <div class="siwane-server-container" style="text-align:center;">
                    <h2>${movie ? 'بوابة الفيلم' : 'قائمة الحلقات'}</h2>
                    <div class="siwane-flex-box">
                        <div id="siwane-btn-zone" style="width:100%;">
                            <div style="padding: 10px 0;"> 
                                <a href="javascript:void(0)" id="activate-trigger" class="button ln" style="width:100%; text-align:center; display:block; max-width:350px; margin: 0 auto;">
                                   ${icons.play} ${actionText}
                                </a>
                            </div>
                        </div>
                        <div id="siwane-scroll-zone" style="display:none; padding: 10px 0;"> ${icons.hand}
                            <p id="scroll-msg" style="color: var(--linkC); font-weight: bold; font-size: 13px; margin: 0;">يرجى التمرير للأسفل قليلاً...</p>
                        </div>
                    </div>
                </div>
            </div>`;

        document.getElementById("activate-trigger").addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("siwane-btn-zone").style.display = "none";
            document.getElementById("siwane-scroll-zone").style.display = "block";
            let triggered = false;
            const scrollHandler = () => {
                if (!triggered) {
                    triggered = true;
                    document.getElementById("scroll-msg").innerHTML = `${icons.spinner} جاري استخراج البيانات...`;
                    setTimeout(() => {
                        document.getElementById("siwane-auth-wrapper").style.opacity = "0";
                        setTimeout(() => {
                            if (movie) loadMovieLobby(rawSheet, movie, lobby, config);
                            else loadSeriesLobby(rawSheet, lobby, config);
                        }, 300);
                        window.removeEventListener('scroll', scrollHandler);
                    }, 1500);
                }
            };
            window.addEventListener('scroll', scrollHandler);
        });
    }

    // --- Watch Page Functions ---
    function handleWatchRoute() {
        const sheet = urlParams.get("sheet"), ep = urlParams.get("ep"), movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : ep;
        if (sheet && config.GAS_URL) {
            const params = { GAS_URL: config.GAS_URL, COUNTDOWN: config.COUNTDOWN || 10, SHEET: decodeURIComponent(sheet), TYPE: movie ? "movie" : "series", ID: id, AD_LINKS: config.AD_LINKS || {}, AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3 };
            initializeWatchPage(params);
        }
    }

    function initializeWatchPage(params) {
        const container = document.querySelector(".post-body, .entry-content, #post-body");
        if (!container) return;
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        
        container.insertAdjacentHTML('afterbegin', `
            <div class="siwane-container">
                <header class="siwane-header"><h1>${title}</h1></header>
                <div class="siwane-server-container">
                    <h2>اختر السيرفر</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid"></div>
                </div>
            </div>`);

        container.insertAdjacentHTML('beforeend', `
            <div class="siwane-container">
                <div class="siwane-video-container">
                    <h2>شاشة العرض</h2>
                    <div id="siwane-countdown-display" style="display:none;">
                        <div id="siwane-particles-container" class="siwane-particles-container"></div>
                        <div id="siwane-countdown-text"></div>
                        <div id="siwane-countdown"></div>
                    </div>
                    <iframe id="siwane-video-frame" style="display:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                    <a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا للدعم والمشاهدة</a>
                </div>
            </div>`);
        
        loadServers(params);
        createParticles();
    }

    async function loadServers(p) {
        const grid = document.getElementById("siwane-servers-grid");
        grid.innerHTML = `<p style="text-align:center;">جاري جلب السيرفرات...</p>`;
        try {
            const q = `contentSheetName=${encodeURIComponent(p.SHEET)}&${p.TYPE==="movie" ? `movieTitle=${encodeURIComponent(p.ID)}` : `episodeNumber=${encodeURIComponent(p.ID)}`}`;
            const res = await fetch(`${p.GAS_URL}?${q}`);
            const servers = await res.json();
            grid.innerHTML = '';
            servers.forEach(s => {
                const btn = document.createElement('div');
                btn.className = 'siwane-server-btn';
                btn.innerHTML = `<span>${s.icon || '🔗'}</span> <span>${s.title}</span>`;
                btn.onclick = function() {
                    document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                    this.classList.add("active");
                    playSelectedServer(s.id, p);
                };
                grid.appendChild(btn);
            });
        } catch (e) { grid.innerHTML = `<p>فشل التحميل.</p>`; }
    }

    async function playSelectedServer(sid, params) {
        if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
        if (countdownInterval) clearInterval(countdownInterval);
        
        const videoSection = document.querySelector(".siwane-video-container");
        window.scrollTo({ top: videoSection.offsetTop - 20, behavior: 'smooth' });

        const countdownDisplay = document.getElementById("siwane-countdown-display");
        const countdownEl = document.getElementById("siwane-countdown");
        const countdownText = document.getElementById("siwane-countdown-text");
        const videoFrame = document.getElementById("siwane-video-frame");

        countdownDisplay.style.display = "flex"; 
        countdownEl.style.display = "block";
        countdownText.innerHTML = `جاري تأمين المشغل...`;
        videoFrame.style.display = "none";
        videoFrame.src = "";

        try {
            const res = await fetch(`${WORKER_URL}/get-secure-player?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(sid)}`);
            const d = await res.json();
            if (d.realUrl) {
                // بدء العد التنازلي مع الرابط القادم من الوركر
                startCountdownAndAds(d.realUrl, params);
            }
        } catch (e) { countdownText.innerHTML = "خطأ في السيرفر."; }
    }

    function startCountdownAndAds(proxyUrl, params) {
        let count = params.COUNTDOWN;
        const countdownEl = document.getElementById("siwane-countdown");
        countdownEl.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            if(count >= 0) countdownEl.textContent = count;
            else {
                clearInterval(countdownInterval);
                countdownEl.style.display = "none";
                showAdGate(proxyUrl, params);
            }
        }, 1000);
    }

    function showAdGate(proxyUrl, params) {
        const txt = document.getElementById("siwane-countdown-text");
        const clicked = {};
        let btnsHtml = '';
        const colors = ['ad-r','ad-b','ad-o','ad-g'];

        for(let i=1; i<=params.AD_BUTTONS_COUNT; i++) {
            clicked[`ad${i}`] = false;
            btnsHtml += `<button class="ad-gate-btn ${colors[i-1]||'ad-r'}" data-id="ad${i}" style="padding:8px;margin:3px;cursor:pointer;border:none;color:#fff;border-radius:5px;">إعلان ${i}</button>`;
        }

        txt.innerHTML = `<div style="text-align:center;"><p style="color:#ffeb3b;">اضغط على الاعلانات لفتح المشغل:</p>${btnsHtml}<div id="final-unlock" style="display:none;margin-top:15px;"><button id="play-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;padding:10px;border:none;cursor:pointer;">تشغيل الآن</button></div></div>`;

        document.querySelectorAll(".ad-gate-btn").forEach(btn => {
            btn.onclick = function() {
                window.open(params.AD_LINKS[this.dataset.id], '_blank');
                this.style.opacity = "0.5"; this.disabled = true; this.textContent = "تم";
                clicked[this.dataset.id] = true;
                if(Object.values(clicked).every(v => v)) document.getElementById("final-unlock").style.display = "block";
            };
        });

        document.getElementById("play-now").onclick = () => {
            txt.textContent = "مشاهدة ممتعة!";
            setTimeout(() => {
                document.getElementById("siwane-countdown-display").style.display = "none";
                activeBlobUrl = createSecureBlob(proxyUrl);
                const frame = document.getElementById("siwane-video-frame");
                frame.src = activeBlobUrl;
                frame.style.display = "block";
            }, 500);
        };
    }

    function createSecureBlob(pUrl) {
        const h = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;height:100%;overflow:hidden;background:#000;}</style></head><body><iframe src="${pUrl}" style="width:100%;height:100%;border:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe></body></html>`;
        return URL.createObjectURL(new Blob([h], { type: 'text/html' }));
    }

    function createParticles() {
        const container = document.getElementById("siwane-particles-container");
        if (!container) return;
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div'); p.className = 'siwane-particle';
            p.style.left = (Math.random() * 100) + "%"; p.style.top = (Math.random() * 100) + "%";
            p.style.animationDuration = (Math.random() * 4 + 3) + "s";
            container.appendChild(p);
        }
    }

    // Helper functions for redirection
    window.siRedirect = (s, e, t) => redirectToWatchPage(s, e, t);
    async function loadSeriesLobby(sheet, container, config) { /* ... نفس الكود السابق مع IDs صحيحة ... */ }
});
