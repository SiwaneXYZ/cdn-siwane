document.addEventListener("DOMContentLoaded", function() {
    const config = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const WORKER_URL = "https://secure-player.siwane.workers.dev";

    let countdownInterval = null;
    let activeBlobUrl = null;

    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    // حفظ المنطق الأصلي الخاص بك تماماً
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
    } else if ("watch" === mode && !canViewContent) {
        console.warn("Direct access blocked.");
    } else {
        initializeLobbyWithProtection(config);
    }

    // --- Lobby Function (بنفس تصميمك تماماً) ---
    function initializeLobbyWithProtection(config) {
        const lobbyElement = document.getElementById("siwane-lobby");
        if (!lobbyElement || !config.GAS_URL) return;

        const rawSheet = lobbyElement.dataset.sheet;
        const movie = lobbyElement.dataset.movie;
        const cleanName = formatTitle(rawSheet);

        let actionText = movie ? `بدء مشاهدة فيلم: ${movie}` : `استعراض حلقات: مسلسل ${cleanName}`;
        let headerText = movie ? `بوابة الفيلم` : `قائمة الحلقات`;

        const style = `
            <style>
                .siwane-flex-box { min-height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                .siwane-server-container h2 { margin-bottom: 10px; }
                @keyframes siwane-spin { to { transform: rotate(360deg); } }
                .siwane-spin { animation: siwane-spin 0.8s linear infinite; }
                @keyframes siwane-swipe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
                .siwane-hand-swipe { animation: siwane-swipe 1s infinite ease-in-out; margin-bottom: 5px; }
                .siwane-fade-in { animation: siwane-fade-in-kf 0.5s forwards; }
                @keyframes siwane-fade-in-kf { from { opacity: 0; } to { opacity: 1; } }
            </style>
        `;

        lobbyElement.innerHTML = style + `
            <div class="siwane-container" id="siwane-auth-wrapper">
                <div class="siwane-server-container" style="text-align:center;">
                    <h2>${headerText}</h2>
                    <div class="siwane-flex-box">
                        <div id="siwane-btn-zone" style="width:100%;">
                            <div style="padding: 10px 0;"> 
                                <a href="javascript:void(0)" id="activate-trigger" class="button ln" style="width:100%; text-align:center; display:block; max-width:350px; margin: 0 auto;">
                                   ${icons.play} ${actionText}
                                </a>
                            </div>
                        </div>
                        <div id="siwane-scroll-zone" style="display:none; padding: 10px 0;"> ${icons.hand}
                            <p id="scroll-msg" style="color: var(--linkC); font-weight: bold; font-size: 13px; margin: 0;">
                                يرجى التمرير للأسفل قليلاً لتأمين المحتوى...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const trigger = document.getElementById("activate-trigger");
        trigger.addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("siwane-btn-zone").style.display = "none";
            document.getElementById("siwane-scroll-zone").style.display = "block";

            let scrollTriggered = false;
            const scrollHandler = function() {
                if (!scrollTriggered) {
                    scrollTriggered = true;
                    document.getElementById("scroll-msg").innerHTML = `${icons.spinner} جاري استخراج البيانات...`;
                    setTimeout(function() {
                        const wrapper = document.getElementById("siwane-auth-wrapper");
                        wrapper.style.opacity = "0";
                        wrapper.style.transition = "opacity 0.3s";
                        setTimeout(() => {
                            if (movie) loadMovieLobby(rawSheet, movie, lobbyElement, config);
                            else loadSeriesLobby(rawSheet, lobbyElement, config);
                        }, 300);
                        window.removeEventListener('scroll', scrollHandler);
                    }, 1500);
                }
            };
            window.addEventListener('scroll', scrollHandler);
        });
    }

    // --- Watch Page (الإبقاء على نفس المعرفات القديمة ليعمل الـ CSS) ---
    async function playSelectedServer(serverId, params) {
        if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); activeBlobUrl = null; }
        if (countdownInterval) clearInterval(countdownInterval);
        
        sessionStorage.setItem("siwane_last_server", JSON.stringify({ sheet: params.SHEET, id: params.ID, serverId: serverId }));
        
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
            // هنا التعديل الوحيد: جلب الرابط من الوركر بنظام الـ Proxy
            const response = await fetch(`${WORKER_URL}/get-secure-player?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(serverId)}`);
            const res = await response.json();
            if (res.realUrl) {
                // استكمال منطق الإعلانات والعد التنازلي الأصلي الخاص بك
                startCountdownAndAds(res.realUrl, params);
            }
        } catch (error) {
            countdownText.innerHTML = "خطأ في تحميل السيرفر.";
        }
    }

    function startCountdownAndAds(proxyUrl, params) {
        let count = params.COUNTDOWN;
        const countdownEl = document.getElementById("siwane-countdown");
        countdownEl.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            if(count >= 0) {
                countdownEl.textContent = count;
            } else {
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
            btnsHtml += `<button class="ad-gate-btn ${colors[i-1]||colors[0]}" data-id="ad${i}" style="padding:8px;margin:3px;cursor:pointer;border:none;color:#fff;border-radius:5px;">إعلان ${i}</button>`;
        }

        txt.innerHTML = `<div style="text-align:center;"><p style="color:#ffeb3b;">اضغط على الاعلانات لفتح المشغل:</p>${btnsHtml}<div id="final-unlock" style="display:none;margin-top:15px;"><button id="play-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;padding:10px;border:none;cursor:pointer;">تشغيل الآن</button></div></div>`;

        document.querySelectorAll(".ad-gate-btn").forEach(btn => {
            btn.onclick = function() {
                const id = this.dataset.id;
                if(params.AD_LINKS[id]) window.open(params.AD_LINKS[id], '_blank');
                this.style.opacity = "0.5"; this.disabled = true; this.textContent = "تم";
                clicked[id] = true;
                if(Object.values(clicked).every(v => v)) document.getElementById("final-unlock").style.display = "block";
            };
        });

        document.getElementById("play-now").onclick = () => {
            txt.textContent = "مشاهدة ممتعة!";
            setTimeout(() => {
                document.getElementById("siwane-countdown-display").style.display = "none";
                
                // إنشاء Blob يحتوي على الـ Iframe الذي يفتح رابط الـ Proxy
                const blobHtml = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;height:100%;overflow:hidden;background:#000;}</style></head><body><iframe src="${proxyUrl}" style="width:100%;height:100%;border:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe></body></html>`;
                activeBlobUrl = URL.createObjectURL(new Blob([blobHtml], { type: 'text/html' }));
                
                const frame = document.getElementById("siwane-video-frame");
                frame.src = activeBlobUrl;
                frame.style.display = "block";
            }, 500);
        };
    }

    // بقية الدوال (loadServers, loadSeriesLobby, createParticles) تبقى كما هي في كودك الأصلي تماماً
    // سأكمل لك فقط الوظائف الأساسية لضمان عمل الواجهة:

    function initializeWatchPage(params) {
        const container = document.querySelector(".post-body, .entry-content, #post-body");
        if (!container) return;
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        
        container.insertAdjacentHTML('afterbegin', `<div class="siwane-container"><header class="siwane-header"><h1>${title}</h1></header><div class="siwane-server-container"><h2>اختر السيرفر</h2><div id="siwane-servers-grid" class="siwane-servers-grid"></div></div></div>`);
        container.insertAdjacentHTML('beforeend', `<div class="siwane-container"><div class="siwane-video-container"><h2>شاشة العرض</h2><div id="siwane-countdown-display" style="display:none;"><div id="siwane-particles-container" class="siwane-particles-container"></div><div id="siwane-countdown-text"></div><div id="siwane-countdown"></div></div><iframe id="siwane-video-frame" style="display:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe><a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا للدعم والمشاهدة</a></div></div>`);
        
        loadServers(params);
        createParticles();
    }

    async function loadServers(params) {
        const grid = document.getElementById("siwane-servers-grid");
        grid.innerHTML = `<p style="text-align:center;">جاري جلب السيرفرات...</p>`;
        let q = `contentSheetName=${encodeURIComponent(params.SHEET)}&${params.TYPE==="movie" ? `movieTitle=${encodeURIComponent(params.ID)}` : `episodeNumber=${encodeURIComponent(params.ID)}`}`;
        try {
            const response = await fetch(`${params.GAS_URL}?${q}`);
            const servers = await response.json();
            grid.innerHTML = '';
            servers.forEach(s => {
                const btn = document.createElement('div');
                btn.className = 'siwane-server-btn';
                btn.innerHTML = `<span>${s.icon || '🔗'}</span> <span>${s.title}</span>`;
                btn.onclick = function() {
                    document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                    this.classList.add("active");
                    playSelectedServer(s.id, params);
                };
                grid.appendChild(btn);
            });
        } catch (e) { grid.innerHTML = `<p>فشل تحميل السيرفرات.</p>`; }
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

    async function loadSeriesLobby(sheet, container, config) {
        const cleanName = formatTitle(sheet);
        container.innerHTML = `<div class="siwane-container"><p class="note">جاري تحميل القائمة...</p></div>`;
        try {
            const response = await fetch(`${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`);
            const data = await response.json();
            if (data.episodes) {
                const uniqueEpisodes = [...new Set(data.episodes.filter(e => e !== null && e !== "" && e !== "---"))];
                let html = `<div class="siwane-container siwane-fade-in"><div class="siwane-episodes-container"><h2>حلقات مسلسل ${cleanName}</h2><div class="siwane-episodes-grid">`;
                uniqueEpisodes.forEach(ep => {
                    let btnLabel = (ep.toString().includes("الأخيرة")) ? ep : `الحلقة ${ep}`;
                    html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${ep}', 'series')">${btnLabel}</div>`;
                });
                html += `</div></div></div>`;
                window.siwaneRedirect = (s, e, t) => redirectToWatchPage(s, e, t);
                container.innerHTML = html;
            }
        } catch (error) { container.innerHTML = `<p class="note">خطأ في التحميل.</p>`; }
    }

    function loadMovieLobby(sheet, movieTitle, container, config) {
        container.innerHTML = `<div class="siwane-container siwane-fade-in"><div class="siwane-episodes-container"><h2>${movieTitle}</h2><div class="siwane-episodes-grid" style="grid-template-columns:1fr;"><div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${movieTitle}', 'movie')">${icons.play} شاهد الآن</div></div></div></div>`;
        window.siwaneRedirect = (s, t, ty) => redirectToWatchPage(s, t, ty);
    }

    async function redirectToWatchPage(sheet, id, type) {
        try {
            const response = await fetch("/feeds/posts/summary?alt=json&max-results=150");
            const data = await response.json();
            const entries = data.feed.entry;
            const randomPost = entries[Math.floor(Math.random() * entries.length)];
            const postUrl = randomPost.link.find(link => link.rel === "alternate").href;
            sessionStorage.setItem("siwane_access_token", "true");
            window.location.href = `${postUrl}${postUrl.includes("?")?"&":"?"}mode=watch&sheet=${encodeURIComponent(sheet)}&${type==='movie'?'movie':'ep'}=${encodeURIComponent(id)}`;
        } catch (e) { alert("خطأ في التحويل."); }
    }
});
