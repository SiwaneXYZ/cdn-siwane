document.addEventListener("DOMContentLoaded", function() {
    // 1. الإعدادات العامة
    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        // هام: تأكد أن هذا الرابط مطابق لرابط الووركر الخاص بك
        WORKER_URL = "https://secure-player.siwane.workers.dev";

    let countdownInterval = null;

    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    // حماية التنقل (اختياري - كما هو في الكود القديم)
    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag; // يمكن تفعيل هذا الشرط لاحقاً

    // أيقونات الواجهة
    const icons = {
        play: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align:middle;margin-left:8px;"><path d="M8 5v14l11-7z"/></svg>`,
        spinner: `<svg viewBox="0 0 50 50" class="siwane-spin" width="16" height="16" style="vertical-align:middle;margin-left:5px;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-linecap="round"></circle></svg>`,
        hand: `<svg viewBox="0 0 104.31 122.88" width="30" height="30" fill="currentColor"><path d="M28.06,122.88h-5.02c-8.99,0-16.73-5.26-20.6-13l-0.12-0.24C-1.8,101.4-0.12,89.58,6.86,82.6l31.14-31.14V11.23 c0-6.2,5.03-11.23,11.23-11.23s11.23,5.03,11.23,11.23v34.42c0.88-0.34,1.82-0.56,2.81-0.56c4.37,0,7.91,3.54,7.91,7.91 c0,0.59-0.07,1.16-0.19,1.71c1.11-0.51,2.35-0.81,3.67-0.81c4.8,0,8.7,3.9,8.7,8.7c0,1.21-0.25,2.36-0.7,3.41 c1.18-0.45,2.46-0.71,3.8-0.71c5.96,0,10.79,4.83,10.79,10.79c0,1.96-0.53,3.8-1.45,5.39c0.91-0.08,1.83-0.13,2.77-0.13 c2.82,0,5.1,2.28,5.1,5.1v17.58c0,7.85-4.88,14.54-11.83,17.11h-0.21H28.06L28.06,122.88z"/></svg>`
    };

    // ==========================================
    // 🔗 معالجة الروابط الخارجية (للتنقل داخل الموقع)
    // ==========================================
    document.addEventListener("click", function(e) {
        let t = e.target.closest("a");
        if (t && t.href && t.href.includes("#siwane_link_go")) {
            e.preventDefault();
            const raw = t.href.split("#siwane_link_go=")[1];
            if (raw) {
                try {
                    const data = JSON.parse(decodeURIComponent(raw));
                    sessionStorage.setItem("siwane_access_token", "true");
                    let dest = "";
                    if (data.type === "series") {
                        // توجيه للمسلسلات
                        dest = `/p/watch.html?mode=watch&sheet=${encodeURIComponent(data.sheet)}&ep=${encodeURIComponent(data.epTitle)}`;
                    } else {
                        // توجيه للأفلام
                        dest = `/p/watch.html?mode=watch&sheet=${encodeURIComponent(data.sheet)}&movie=${encodeURIComponent(data.id)}`;
                    }
                    window.location.href = dest;
                } catch (er) { console.error("Link Error", er); }
            }
        }
    });

    // ==========================================
    // 🛠️ تهيئة صفحة المشاهدة
    // ==========================================
    if (mode === "watch") {
        handleWatchRoute();
    }

    function handleWatchRoute() {
        const sheet = urlParams.get("sheet"), 
              ep = urlParams.get("ep"), 
              movie = urlParams.get("movie");
        
        // تحديد المعرف (للمسلسل هو اسم الحلقة، للفيلم هو ID الفيلم)
        const id = movie ? decodeURIComponent(movie) : ep;

        if (sheet && config.GAS_URL) {
            const params = {
                GAS_URL: config.GAS_URL,
                COUNTDOWN: config.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheet),
                TYPE: movie ? "movie" : "series", // تحديد النوع
                ID: id,
                AD_LINKS: config.AD_LINKS || {},
                AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3
            };

            initializeWatchPage(params);
            
            // استعادة السيرفر الأخير إذا تم تحديث الصفحة
            const saved = sessionStorage.getItem("siwane_last_server");
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.sheet === params.SHEET && data.id === params.ID) {
                        setTimeout(() => { 
                            const btn = document.querySelector(`.siwane-server-btn[data-id="${data.serverId}"]`);
                            if (btn) btn.click();
                        }, 1200);
                    }
                } catch(e) {}
            }
        }
    }

    function initializeWatchPage(params) {
        const container = document.querySelector(".siwane-video-container");
        if (!container) return;

        // بناء الهيكل الأساسي
        container.innerHTML = `
            <div class="siwane-player-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;background:#000;border-radius:8px;margin-bottom:15px;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
                <iframe id="siwane-video-frame" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;display:none;z-index:5;"></iframe>
                
                <div id="siwane-countdown-display" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1a1a1a;z-index:10;color:#fff;">
                    <div style="margin-bottom:15px;opacity:0.8;">${icons.hand}</div>
                    <div id="siwane-countdown-text" style="font-size:16px;margin-bottom:15px;text-align:center;padding:0 20px;">اختر سيرفر للمشاهدة</div>
                    <div id="siwane-countdown" style="font-size:30px;font-weight:bold;color:var(--linkC);display:none;"></div>
                </div>
            </div>

            <div class="siwane-servers-container" style="margin-top:20px;">
                <h3 style="margin-bottom:10px;font-size:16px;border-right:3px solid var(--linkC);padding-right:10px;">سيرفرات المشاهدة:</h3>
                <div id="siwane-servers-grid" class="siwane-servers-grid" style="display:flex;flex-wrap:wrap;gap:10px;"></div>
            </div>
            
            <div id="siwane-episodes-area"></div>
        `;

        // منطق التحميل حسب النوع
        if (params.TYPE === 'series') {
            // للمسلسلات: نجلب الحلقات أولاً ثم السيرفرات للحلقة الحالية
            loadEpisodesAndServers(params);
        } else {
            // للأفلام: نجلب السيرفرات مباشرة
            loadServers(params);
        }
    }

    // دالة خاصة للمسلسلات (جلب الحلقات)
    async function loadEpisodesAndServers(params) {
        const area = document.getElementById("siwane-episodes-area");
        if(area) area.innerHTML = `<div style="text-align:center;padding:10px;">جاري تحميل الحلقات... ${icons.spinner}</div>`;

        try {
            // طلب قائمة الحلقات
            const epUrl = `${params.GAS_URL}?contentSheetName=${encodeURIComponent(params.SHEET)}&action=getEpisodes`;
            const resp = await fetch(epUrl);
            const episodes = await resp.json();
            
            if(episodes && episodes.length > 0) {
                let html = `<div class="siwane-episodes-container" style="margin-top:20px;"><h2>جميع الحلقات</h2><div class="siwane-episodes-grid">`;
                episodes.forEach(ep => {
                    const isCurrent = ep.ep === params.ID ? 'background:var(--linkC);color:#fff;' : '';
                    html += `<div class="siwane-episode-btn" style="${isCurrent}" onclick="window.location.href='?mode=watch&sheet=${encodeURIComponent(params.SHEET)}&ep=${encodeURIComponent(ep.ep)}'">${ep.ep}</div>`;
                });
                html += `</div></div>`;
                if(area) area.innerHTML = html;
            } else {
                if(area) area.innerHTML = '';
            }
        } catch(e) { console.error(e); }

        // بعد الحلقات، نحمل سيرفرات الحلقة الحالية
        loadServers(params);
    }

    // دالة جلب السيرفرات (للأفلام والمسلسلات)
    async function loadServers(params) {
        const grid = document.getElementById("siwane-servers-grid");
        grid.innerHTML = `<p style="text-align:center;width:100%;">جاري جلب السيرفرات... ${icons.spinner}</p>`;
        
        let q = `contentSheetName=${encodeURIComponent(params.SHEET)}&`;
        if (params.TYPE === "movie") {
            q += `movieTitle=${encodeURIComponent(params.ID)}`; // للأفلام نرسل الـ ID
        } else {
            q += `episodeNumber=${encodeURIComponent(params.ID)}`; // للمسلسلات نرسل رقم الحلقة
        }

        try {
            const response = await fetch(`${params.GAS_URL}?${q}`);
            const servers = await response.json();
            
            grid.innerHTML = '';
            if (!servers || servers.length === 0 || servers.error) {
                grid.innerHTML = `<p style="padding:10px;">لا توجد سيرفرات متاحة حالياً.</p>`;
                return;
            }

            servers.forEach(s => {
                const btn = document.createElement('div');
                btn.className = 'siwane-server-btn'; 
                btn.dataset.id = s.id;
                // استخدام الأيقونة واسم السيرفر
                btn.innerHTML = `<span>${s.icon || '📺'}</span> <span>${s.title}</span>`;
                
                btn.onclick = function() {
                    document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                    this.classList.add("active");
                    playSelectedServer(s.id, params);
                };
                grid.appendChild(btn);
            });
        } catch (e) { 
            grid.innerHTML = `<p style="color:red;">فشل الاتصال بقاعدة البيانات.</p>`; 
        }
    }

    // ==========================================
    // 🎥 المشغل والعداد (تم التحديث لإخفاء الرابط)
    // ==========================================
    function playSelectedServer(serverId, params) {
        // 1. تنظيف الحالة السابقة
        if (countdownInterval) clearInterval(countdownInterval);
        
        // حفظ السيرفر المختار
        sessionStorage.setItem("siwane_last_server", JSON.stringify({ 
            sheet: params.SHEET, 
            id: params.ID, 
            serverId: serverId 
        }));
        
        // التمرير للمشغل
        const videoSection = document.querySelector(".siwane-video-container");
        window.scrollTo({ top: videoSection.offsetTop - 20, behavior: 'smooth' });

        // إعداد عناصر الواجهة
        const countdownDisplay = document.getElementById("siwane-countdown-display");
        const countdownEl = document.getElementById("siwane-countdown");
        const countdownText = document.getElementById("siwane-countdown-text");
        const videoFrame = document.getElementById("siwane-video-frame");

        // إعادة تعيين العرض
        countdownDisplay.style.display = "flex"; 
        countdownEl.style.display = "block"; 
        countdownText.innerHTML = `جاري تحضير البث الآمن...`;
        videoFrame.style.display = "none";
        videoFrame.src = ""; // تصفير الرابط القديم

        // 2. بناء رابط الووركر الآمن
        // المتصفح سيطلب هذا الرابط فقط، ولن يطلب المصدر الأصلي
        const secureWorkerUrl = `${WORKER_URL}/watch?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(serverId)}`;
        
        // 3. بدء العملية (بدون Fetch JSON)
        startCountdownAndAds(secureWorkerUrl, params);
    }

    function startCountdownAndAds(url, params) {
        let count = params.COUNTDOWN;
        const countdownEl = document.getElementById("siwane-countdown");
        const txt = document.getElementById("siwane-countdown-text");
        
        txt.innerHTML = `سيتم عرض الفيديو خلال:`;
        countdownEl.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            if(count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdownEl.style.display = "none";
                // بعد انتهاء الوقت، إما نعرض الإعلانات أو نشغل الفيديو
                if (params.AD_LINKS && Object.keys(params.AD_LINKS).length > 0) {
                    showAdGate(url, params);
                } else {
                    // تشغيل مباشر إذا لم توجد إعلانات
                    playDirectly(url);
                }
            }
        }, 1000);
    }

    function showAdGate(url, params) {
        const txt = document.getElementById("siwane-countdown-text");
        const clicked = {};
        let btnsHtml = '<div class="ad-btns-flex" style="display:flex;justify-content:center;gap:5px;flex-wrap:wrap;">'; 
        const colors = ['ad-r','ad-b','ad-o','ad-g'];

        for(let i=1; i<=params.AD_BUTTONS_COUNT; i++) {
            clicked[`ad${i}`] = false;
            // استخدام كلاسات من style.css
            btnsHtml += `<button class="ad-gate-btn ${colors[(i-1)%4]}" data-id="ad${i}">إعلان ${i}</button>`;
        }
        btnsHtml += '</div>';

        txt.innerHTML = `
            <div style="text-align:center;animation:fadeIn 0.5s;">
                <p style="color:#ffeb3b;margin-bottom:10px;">👇 اضغط على الإعلانات لفتح المشغل 👇</p>
                ${btnsHtml}
                <div id="final-unlock" style="display:none;margin-top:15px;">
                    <button id="play-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;justify-content:center;font-size:16px;">
                        ${icons.play} تشغيل الفيديو
                    </button>
                </div>
            </div>`;

        // تفعيل أزرار الإعلانات
        document.querySelectorAll(".ad-gate-btn").forEach(btn => {
            btn.onclick = function() {
                const id = this.dataset.id;
                // فتح الإعلان
                if(params.AD_LINKS[id]) window.open(params.AD_LINKS[id], '_blank');
                
                // تغيير شكل الزر
                this.style.opacity = "0.5"; 
                this.disabled = true; 
                this.textContent = "✔ تم";
                clicked[id] = true;

                // التحقق من اكتمال النقر
                if(Object.values(clicked).every(v => v)) {
                    document.getElementById("final-unlock").style.display = "block";
                }
            };
        });

        // زر التشغيل النهائي
        document.getElementById("play-now").onclick = () => {
            playDirectly(url);
        };
    }

    function playDirectly(url) {
        const txt = document.getElementById("siwane-countdown-text");
        const display = document.getElementById("siwane-countdown-display");
        const frame = document.getElementById("siwane-video-frame");

        txt.innerHTML = "مشاهدة ممتعة... <br> يتم الاتصال بالسيرفر الآمن";
        
        setTimeout(() => {
            display.style.display = "none";
            // هنا اللحظة الحاسمة: وضع رابط الووركر في الـ src
            frame.src = url; 
            frame.style.display = "block";
        }, 500);
    }

});
