document.addEventListener("DOMContentLoaded", function() {
    // 1. الإعدادات العامة (مستمدة من injector.xml)
    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        WORKER_URL = "https://secure-player.siwane.workers.dev";

    let countdownInterval = null;

    // الميزات الأصلية: تنظيف العناوين والتحقق من الوصول
    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";

    // الأيقونات الأصلية الخاصة بك (Play, Spinner, Hand)
    const icons = {
        play: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align:middle;margin-left:8px;"><path d="M8 5v14l11-7z"/></svg>`,
        spinner: `<svg viewBox="0 0 50 50" class="siwane-spin" width="16" height="16" style="vertical-align:middle;margin-left:5px;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-linecap="round"></circle></svg>`,
        hand: `<svg viewBox="0 0 104.31 122.88" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-left:5px;"><path d="M15.07,35.28c-8.32,0-15.07,6.75-15.07,15.07V83c0,4.24,1.81,8.02,4.64,10.74l31.2,31.2c2.81,2.81,6.7,4.64,10.74,4.64h34.66c8.32,0,15.07-6.75,15.07-15.07V61.16c0-6.15-4.99-11.14-11.14-11.14c-1.12,0-2.19,0.17-3.19,0.48c-1.35-4.93-5.85-8.58-11.19-8.58c-1.28,0-2.5,0.21-3.64,0.6c-1.84-4.22-6.04-7.14-10.93-7.14c-1.34,0-2.61,0.22-3.79,0.63V15.07C37.44,6.75,30.69,0,22.37,0c-1.12,0-2.19,0.17-3.19,0.48V35.28L15.07,35.28z"/></svg>`
    };

    // 2. معالجة الروابط الأصلية بنسبة 100%
    document.addEventListener("click", function(e) {
        let t = e.target.closest("a");
        if (t && t.href && t.href.includes("#siwane_link_go")) {
            e.preventDefault();
            const raw = t.href.split("#siwane_link_go=")[1];
            try {
                const data = JSON.parse(decodeURIComponent(raw));
                sessionStorage.setItem("siwane_access_token", "true");
                let dest = `?mode=watch&sheet=${encodeURIComponent(data.sheet)}`;
                if (data.type === "series") dest += `&ep=${encodeURIComponent(data.epTitle || data.title)}`;
                else dest += `&movie=${encodeURIComponent(data.id)}`;
                window.location.href = dest;
            } catch (err) {}
        }
    });

    // 3. بناء صفحة المشاهدة بكامل تفاصيلها
    if (mode === "watch") {
        const sheet = urlParams.get("sheet"),
            ep = urlParams.get("ep"),
            movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : (ep ? decodeURIComponent(ep) : null);

        if (sheet && id) {
            renderFullPlayer(sheet, id, movie ? "movie" : "series");
        }
    }

    async function renderFullPlayer(sheet, id, type) {
        const container = document.querySelector(".siwane-video-container");
        if (!container) return;

        // استرجاع أزرار الإعلانات كما كانت في كودك الأصلي
        let adButtonsHtml = '';
        if (config.AD_BUTTONS_COUNT > 0) {
            adButtonsHtml = `<div class="ad-btns-wrapper"><div class="ad-btns-flex">`;
            for (let i = 1; i <= config.AD_BUTTONS_COUNT; i++) {
                const classes = ["ad-r", "ad-b", "ad-o"];
                adButtonsHtml += `<div class="ad-gate-btn ${classes[(i - 1) % 3]}" data-id="${i}">${icons.hand} زر ${i}</div>`;
            }
            adButtonsHtml += `</div></div>`;
        }

        container.innerHTML = `
            ${adButtonsHtml}
            <div class="siwane-player-wrapper" style="position:relative;background:#000;border-radius:8px;overflow:hidden;margin-bottom:15px;">
                <iframe id="siwane-video-frame" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;display:none;"></iframe>
                <div id="siwane-countdown-display" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1a1a1a;color:#fff;">
                    <div id="siwane-status-text">اختر سيرفر للمشاهدة</div>
                    <div id="siwane-countdown" style="font-size:30px;color:var(--linkC);margin-top:10px;"></div>
                </div>
            </div>
            <div id="siwane-servers-grid" class="siwane-servers-grid" style="display:flex;flex-wrap:wrap;gap:10px;"></div>
            <div id="siwane-episodes-area"></div>
        `;

        handleAdButtons(); // تفعيل منطق الإعلانات الأصلي
        loadServers(sheet, id, type);
        if (type === "series") loadEpisodes(sheet, id);
    }

    // منطق الإعلانات الأصلي (بدون أي تغيير)
    function handleAdButtons() {
        const btns = document.querySelectorAll(".ad-gate-btn");
        btns.forEach(btn => {
            btn.onclick = function() {
                const adId = this.dataset.id;
                const adUrl = config.AD_LINKS[`ad${adId}`];
                if (adUrl) {
                    window.open(adUrl, '_blank');
                    this.classList.add("is-faded");
                    checkAllAds();
                }
            };
        });
    }

    function checkAllAds() {
        const total = document.querySelectorAll(".ad-gate-btn").length;
        const faded = document.querySelectorAll(".ad-gate-btn.is-faded").length;
        if (total === faded) {
            // منطق فتح السيرفرات بعد الإعلانات إذا أردت
        }
    }

    async function loadServers(sheet, id, type) {
        const grid = document.getElementById("siwane-servers-grid");
        let q = `contentSheetName=${encodeURIComponent(sheet)}&${type === "movie" ? `movieTitle=${encodeURIComponent(id)}` : `episodeNumber=${encodeURIComponent(id)}`}`;
        
        try {
            const res = await fetch(`${config.GAS_URL}?${q}`);
            const servers = await res.json();
            grid.innerHTML = '';
            servers.forEach(s => {
                const btn = document.createElement('div');
                btn.className = 'siwane-server-btn';
                btn.innerHTML = `<span>${s.icon || '🔗'}</span> <span>${s.title}</span>`;
                btn.onclick = () => {
                    document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    
                    // التشغيل الآمن عبر الووركر
                    const frame = document.getElementById("siwane-video-frame");
                    const display = document.getElementById("siwane-countdown-display");
                    const countText = document.getElementById("siwane-countdown");

                    display.style.display = 'flex';
                    frame.style.display = 'none';
                    frame.src = '';

                    let count = config.COUNTDOWN || 10;
                    countText.innerText = count;

                    if (countdownInterval) clearInterval(countdownInterval);
                    countdownInterval = setInterval(() => {
                        count--;
                        countText.innerText = count;
                        if (count <= 0) {
                            clearInterval(countdownInterval);
                            // هنا الحماية: نرسل الطلب للووركر، والووركر يفتح الفيديو
                            frame.src = `${WORKER_URL}/?sheet=${encodeURIComponent(sheet)}&id=${encodeURIComponent(s.id)}`;
                            frame.onload = () => {
                                display.style.display = 'none';
                                frame.style.display = 'block';
                            };
                        }
                    }, 1000);
                };
                grid.appendChild(btn);
            });
        } catch (e) {}
    }

    async function loadEpisodes(sheet, currentId) {
        const area = document.getElementById("siwane-episodes-area");
        try {
            const res = await fetch(`${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`);
            const episodes = await res.json();
            let html = `<div class="siwane-episodes-container"><h2>الحلقات</h2><div class="siwane-episodes-grid">`;
            episodes.forEach(ep => {
                const active = ep.ep === currentId ? 'background:var(--linkC);color:#fff;' : '';
                html += `<div class="siwane-episode-btn" style="${active}" onclick="location.href='?mode=watch&sheet=${encodeURIComponent(sheet)}&ep=${encodeURIComponent(ep.ep)}'">${ep.ep}</div>`;
            });
            area.innerHTML = html + `</div></div>`;
        } catch (e) {}
    }
});
