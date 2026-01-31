document.addEventListener("DOMContentLoaded", function() {
    const config = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const WORKER_URL = "https://secure-player.siwane.workers.dev"; // رابط الووركر الخاص بك

    // 1. معالجة الروابط (لضمان ظهور الأزرار عند الضغط عليها)
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
            } catch (er) { console.error(er); }
        }
    });

    // 2. إذا كنا في صفحة المشاهدة
    if (mode === "watch") {
        const sheet = urlParams.get("sheet");
        const ep = urlParams.get("ep");
        const movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : decodeURIComponent(ep);

        if (sheet && id) {
            startPlayerProcess({ SHEET: sheet, ID: id, TYPE: movie ? "movie" : "series" });
        }
    }

    async function startPlayerProcess(params) {
        const container = document.querySelector(".siwane-video-container");
        if (!container) return;

        // بناء الواجهة
        container.innerHTML = `
            <div class="siwane-player-wrapper" style="position:relative;padding-bottom:56.25%;background:#000;border-radius:8px;margin-bottom:15px;">
                <iframe id="siwane-video-frame" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;display:none;"></iframe>
                <div id="siwane-countdown-display" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1a1a1a;color:#fff;text-align:center;">
                    <div id="siwane-countdown-text">جاري جلب السيرفرات...</div>
                    <div id="siwane-countdown" style="font-size:30px;color:var(--linkC);margin-top:10px;"></div>
                </div>
            </div>
            <div id="siwane-servers-grid" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;"></div>
            <div id="siwane-episodes-area"></div>
        `;

        // جلب السيرفرات (بنفس طريقتك القديمة الناجحة)
        let query = `contentSheetName=${encodeURIComponent(params.SHEET)}&${params.TYPE === "movie" ? `movieTitle=${encodeURIComponent(params.ID)}` : `episodeNumber=${encodeURIComponent(params.ID)}`}`;
        
        try {
            const res = await fetch(`${config.GAS_URL}?${query}`);
            const servers = await res.json();
            const grid = document.getElementById("siwane-servers-grid");
            
            servers.forEach(s => {
                const btn = document.createElement('div');
                btn.className = 'siwane-server-btn';
                btn.innerHTML = `<span>${s.icon || '🔗'}</span> <span>${s.title}</span>`;
                btn.onclick = () => {
                    document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    initVideoSecurely(s.id, params);
                };
                grid.appendChild(btn);
            });

            // جلب الحلقات إذا كان مسلسل
            if (params.TYPE === "series") loadEpisodes(params);

        } catch (e) { console.error("Error loading servers"); }
    }

    function initVideoSecurely(serverId, params) {
        const txt = document.getElementById("siwane-countdown-text");
        const countEl = document.getElementById("siwane-countdown");
        const display = document.getElementById("siwane-countdown-display");
        const frame = document.getElementById("siwane-video-frame");

        display.style.display = "flex";
        frame.style.display = "none";

        let count = config.COUNTDOWN || 10;
        txt.innerHTML = "سيتم تجهيز المشغل الآمن خلال:";
        countEl.innerHTML = count;

        const timer = setInterval(() => {
            count--;
            countEl.innerHTML = count;
            if (count <= 0) {
                clearInterval(timer);
                // السحر هنا: نضع رابط الووركر الذي يخفي الرابط الأصلي
                frame.src = `${WORKER_URL}/watch?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(serverId)}`;
                display.style.display = "none";
                frame.style.display = "block";
            }
        }, 1000);
    }

    async function loadEpisodes(params) {
        const area = document.getElementById("siwane-episodes-area");
        try {
            const res = await fetch(`${config.GAS_URL}?contentSheetName=${encodeURIComponent(params.SHEET)}&action=getEpisodes`);
            const episodes = await res.json();
            let html = `<div class="siwane-episodes-container" style="margin-top:20px;"><h2>الحلقات</h2><div class="siwane-episodes-grid">`;
            episodes.forEach(ep => {
                const active = ep.ep === params.ID ? 'background:var(--linkC);color:#fff;' : '';
                html += `<div class="siwane-episode-btn" style="${active}" onclick="location.href='?mode=watch&sheet=${encodeURIComponent(params.SHEET)}&ep=${encodeURIComponent(ep.ep)}'">${ep.ep}</div>`;
            });
            html += `</div></div>`;
            area.innerHTML = html;
        } catch (e) {}
    }
});
