document.addEventListener("DOMContentLoaded", function() {
    const config = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const WORKER_URL = "https://secure-player.siwane.workers.dev"; // رابط الوركر الخاص بك

    let countdownInterval = null;
    let activeBlobUrl = null;

    // --- الوظائف المساعدة الأصلية ---
    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";
    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag;

    // --- الأيقونات الخاصة بك ---
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

    // --- الدالة المسؤولة عن تشغيل السيرفر (تم تعديل القلب فقط) ---
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
            // الطلب يذهب للوركر لجلب الرابط المشفر (هذا هو التعديل الوحيد)
            const response = await fetch(`${WORKER_URL}/get-secure-player?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(serverId)}`);
            const data = await response.json();
            
            if (data.realUrl) {
                // نمرر رابط الوركر المشفر لدالة الإعلانات الخاصة بك
                startCountdownAndAds(data.realUrl, params);
            }
        } catch (error) {
            countdownText.innerHTML = "خطأ في تحميل السيرفر.";
        }
    }

    // --- بقية الكود (كما هو في ملفك الأصلي دون تغيير حرف واحد) ---
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
        let btns = '';
        const colors = ['ad-r','ad-b','ad-o','ad-g'];
        for(let i=1; i<=params.AD_BUTTONS_COUNT; i++) {
            clicked[`ad${i}`] = false;
            btns += `<button class="ad-gate-btn ${colors[i-1]||'ad-r'}" data-id="ad${i}">إعلان ${i}</button>`;
        }
        txt.innerHTML = `<div class="ad-gate-wrapper"><p>اضغط على الاعلانات لفتح المشغل:</p>${btns}<div id="final-unlock" style="display:none;margin-top:15px;"><button id="play-now" class="siwane-episode-btn">تشغيل الآن</button></div></div>`;
        
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
                const h = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;height:100%;overflow:hidden;background:#000;}</style></head><body><iframe src="${proxyUrl}" style="width:100%;height:100%;border:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe></body></html>`;
                activeBlobUrl = URL.createObjectURL(new Blob([h], { type: 'text/html' }));
                const frame = document.getElementById("siwane-video-frame");
                frame.src = activeBlobUrl;
                frame.style.display = "block";
            }, 500);
        };
    }

    // هنا تضع بقية دوالك الأصلية (initializeWatchPage, loadServers, createParticles, إلخ...)
    // دون أي تغيير في الأسماء.
});
