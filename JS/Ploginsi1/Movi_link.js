document.addEventListener("DOMContentLoaded", function() {
    // ==========================================
    // 1. الإعدادات والمتغيرات
    // ==========================================
    const config = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode"); // هل نحن في وضع المشاهدة؟
    
    // ⚠️ تأكد أن هذا الرابط هو رابط الووركر الخاص بك
    const WORKER_URL = "https://secure-player.siwane.workers.dev";

    // الأيقونات
    const icons = {
        play: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align:middle;"><path d="M8 5v14l11-7z"/></svg>`,
        list: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align:middle;margin-left:5px;"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
        spinner: `<svg viewBox="0 0 50 50" class="siwane-spin" width="20" height="20" style="vertical-align:middle;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-linecap="round"></circle></svg>`
    };

    // ==========================================
    // 2. الموجه الرئيسي (Router)
    // ==========================================
    if (mode === "watch") {
        // السيناريو 1: نحن في صفحة المشغل (تم النقر على الزر مسبقاً)
        handleWatchRoute();
    } else {
        // السيناريو 2: نحن في صفحة المقال (يجب إظهار زر الدخول للمشغل)
        initPostPage();
    }

    // ==========================================
    // 3. منطق صفحة المقال (إظهار زر "شاهد الحلقات")
    // ==========================================
    function initPostPage() {
        // نبحث عن الحاوية المخصصة في قالبك
        const container = document.querySelector(".siwane-video-container") || document.getElementById("siwane-loading");
        
        if (!container) return; // لا يوجد مكان لوضع الزر

        // محاولة قراءة البيانات من الحاوية (إذا كان القالب يضعها كـ data-attributes)
        const sheetName = container.getAttribute("data-sheet");
        const entryId = container.getAttribute("data-id"); // اسم المسلسل أو ايدي الفيلم

        // إذا لم تتوفر البيانات في الـ HTML، ننتظر النقرات اليدوية (مثل الروابط القديمة)
        // ولكن سنقوم بإنشاء زر افتراضي إذا توفرت البيانات
        if (sheetName && entryId) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; background:var(--contentB, #222); border-radius:8px;">
                    <h3 style="margin-bottom:15px; color:var(--bodyC, #fff);">مشاهدة وتحميل</h3>
                    <button id="siwane-start-btn" class="siwane-episode-btn" style="width:auto; margin:0 auto; padding:10px 20px; font-size:16px;">
                        ${icons.play} اضغط هنا للمشاهدة
                    </button>
                </div>
            `;
            
            document.getElementById("siwane-start-btn").onclick = function() {
                // نحدد هل هو فيلم أم مسلسل بناءً على العنوان أو إعدادات القالب
                // افتراضياً نوجه للمشغل، والمشغل سيحدد
                const isMovie = !entryId.includes("حلقة"); // تخمين بسيط، يمكن تعديله
                
                let dest = `?mode=watch&sheet=${encodeURIComponent(sheetName)}`;
                if (isMovie) dest += `&movie=${encodeURIComponent(entryId)}`;
                else dest += `&ep=${encodeURIComponent(entryId)}`; // للحلقة الأولى مثلاً
                
                // حفظ التوكن للسماح بالمرور
                sessionStorage.setItem("siwane_access_token", "true");
                window.location.href = dest;
            };
        }
    }

    // معالجة الروابط القديمة (a href="#siwane_link_go=...")
    // هذا الجزء ضروري جداً إذا كان قالبك يعتمد على روابط مخفية
    document.addEventListener("click", function(e) {
        let t = e.target.closest("a");
        if (t && t.href && t.href.includes("#siwane_link_go")) {
            e.preventDefault();
            const raw = t.href.split("#siwane_link_go=")[1];
            if (raw) {
                try {
                    const data = JSON.parse(decodeURIComponent(raw));
                    sessionStorage.setItem("siwane_access_token", "true");
                    
                    let dest = `?mode=watch&sheet=${encodeURIComponent(data.sheet)}`;
                    if (data.type === "series") {
                        dest += `&ep=${encodeURIComponent(data.epTitle || data.title)}`;
                    } else {
                        dest += `&movie=${encodeURIComponent(data.id)}`;
                    }
                    
                    // إذا كنا في نفس الصفحة، نقوم بتحديث الـ URL وإعادة تشغيل الوظيفة
                    if (window.location.pathname === t.pathname) {
                        window.history.pushState({}, '', dest);
                        handleWatchRoute(); // تشغيل فوري
                    } else {
                        window.location.href = dest;
                    }
                } catch (er) { console.error("Link Error", er); }
            }
        }
    });

    // ==========================================
    // 4. منطق صفحة المشغل (الآمن)
    // ==========================================
    function handleWatchRoute() {
        const sheet = urlParams.get("sheet");
        const ep = urlParams.get("ep");
        const movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : (ep ? decodeURIComponent(ep) : null);

        if (!sheet || !id || !config.GAS_URL) return;

        const params = {
            GAS_URL: config.GAS_URL,
            COUNTDOWN: config.COUNTDOWN || 10,
            SHEET: decodeURIComponent(sheet),
            TYPE: movie ? "movie" : "series",
            ID: id,
            AD_LINKS: config.AD_LINKS || {},
            AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3
        };

        initializeWatchPage(params);
    }

    function initializeWatchPage(params) {
        const container = document.querySelector(".siwane-video-container");
        if (!container) return; // خطأ: الحاوية غير موجودة

        // بناء واجهة المشغل
        container.innerHTML = `
            <div class="siwane-player-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;background:#000;border-radius:8px;margin-bottom:15px;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
                <iframe id="siwane-video-frame" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;display:none;z-index:5;"></iframe>
                <div id="siwane-countdown-display" style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1a1a1a;z-index:10;color:#fff;">
                    <div style="margin-bottom:15px;opacity:0.8;">${icons.spinner}</div>
                    <div id="siwane-countdown-text" style="font-size:16px;margin-bottom:15px;text-align:center;">جاري تحميل البيانات...</div>
                    <div id="siwane-countdown" style="font-size:30px;font-weight:bold;color:var(--linkC);display:none;"></div>
                </div>
            </div>

            <div class="siwane-servers-container">
                <div id="siwane-servers-grid" class="siwane-servers-grid" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;"></div>
            </div>
            
            <div id="siwane-episodes-area"></div>
        `;

        if (params.TYPE === 'series') {
            loadEpisodesAndServers(params);
        } else {
            loadServers(params);
        }
    }

    async function loadEpisodesAndServers(params) {
        // عرض رسالة تحميل في منطقة الحلقات
        const area = document.getElementById("siwane-episodes-area");
        if(area) area.innerHTML = `<div style="text-align:center;padding:20px;">جاري جلب قائمة الحلقات... ${icons.spinner}</div>`;

        try {
            const epUrl = `${params.GAS_URL}?contentSheetName=${encodeURIComponent(params.SHEET)}&action=getEpisodes`;
            const resp = await fetch(epUrl);
            const episodes = await resp.json();
            
            if(episodes && episodes.length > 0) {
                // ترتيب الحلقات (اختياري)
                episodes.sort((a, b) => {
                    const numA = parseInt(a.ep.match(/\d+/)) || 0;
                    const numB = parseInt(b.ep.match(/\d+/)) || 0;
                    return numA - numB;
                });

                let html = `
                    <div class="siwane-episodes-container" style="margin-top:20px;padding:10px;background:var(--contentB);border-radius:8px;">
                        <h3 style="margin:0 0 15px 0;font-size:18px;border-bottom:1px solid #444;padding-bottom:10px;">
                            ${icons.list} جميع الحلقات
                        </h3>
                        <div class="siwane-episodes-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;">`;
                
                episodes.forEach(ep => {
                    const isCurrent = ep.ep === params.ID;
                    const style = isCurrent ? 'background:var(--linkC);color:#fff;border-color:var(--linkC);' : '';
                    // هنا نقوم بتحديث الصفحة بنفس التبويب
                    html += `<div class="siwane-episode-btn" style="${style}" onclick="location.href='?mode=watch&sheet=${encodeURIComponent(params.SHEET)}&ep=${encodeURIComponent(ep.ep)}'">${ep.ep}</div>`;
                });
                
                html += `</div></div>`;
                if(area) area.innerHTML = html;
            } else {
                if(area) area.innerHTML = '<p style="text-align:center;color:#999;">لا توجد حلقات متاحة.</p>';
            }
        } catch(e) { 
            console.error(e);
            if(area) area.innerHTML = '<p style="text-align:center;color:red;">خطأ في تحميل الحلقات.</p>';
        }

        // تحميل سيرفرات الحلقة الحالية
        loadServers(params);
    }

    async function loadServers(params) {
        const grid = document.getElementById("siwane-servers-grid");
        const txt = document.getElementById("siwane-countdown-text");
        
        txt.innerHTML = "اختر سيرفر للمشاهدة";
        grid.innerHTML = `<p style="text-align:center;">جاري جلب السيرفرات...</p>`;
        
        let q = `contentSheetName=${encodeURIComponent(params.SHEET)}&`;
        if (params.TYPE === "movie") q += `movieTitle=${encodeURIComponent(params.ID)}`;
        else q += `episodeNumber=${encodeURIComponent(params.ID)}`;

        try {
            const response = await fetch(`${params.GAS_URL}?${q}`);
            const servers = await response.json();
            
            grid.innerHTML = '';
            
            if (!servers || servers.length === 0 || servers.error) {
                grid.innerHTML = `<p>عذراً، المحتوى غير متوفر حالياً.</p>`;
                return;
            }

            // استرجاع آخر سيرفر تلقائياً
            const saved = sessionStorage.getItem("siwane_last_server");
            let autoClickId = null;
            if (saved) {
                const d = JSON.parse(saved);
                if (d.sheet === params.SHEET && d.id === params.ID) autoClickId = d.serverId;
            }

            servers.forEach(s => {
                const btn = document.createElement('div');
                btn.className = 'siwane-server-btn';
                if(s.id === autoClickId) btn.classList.add('active');
                
                btn.innerHTML = `<span>${s.icon || '📺'}</span> <span>${s.title}</span>`;
                btn.onclick = function() {
                    document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                    this.classList.add("active");
                    playSelectedServer(s.id, params);
                };
                grid.appendChild(btn);

                // النقر التلقائي
                if (s.id === autoClickId) {
                    setTimeout(() => btn.click(), 500);
                }
            });

        } catch (e) { grid.innerHTML = `<p style="color:red;">خطأ في الاتصال.</p>`; }
    }

    // ==========================================
    // 5. التشغيل الآمن (Worker Proxy)
    // ==========================================
    function playSelectedServer(serverId, params) {
        const txt = document.getElementById("siwane-countdown-text");
        const countEl = document.getElementById("siwane-countdown");
        const frame = document.getElementById("siwane-video-frame");
        const spinner = document.querySelector(".siwane-player-wrapper svg"); // أيقونة التحميل

        // إعادة ضبط
        frame.style.display = 'none';
        frame.src = '';
        document.getElementById("siwane-countdown-display").style.display = 'flex';
        if(spinner) spinner.style.display = 'block';

        // حفظ الحالة
        sessionStorage.setItem("siwane_last_server", JSON.stringify({sheet:params.SHEET, id:params.ID, serverId:serverId}));
        
        // بناء رابط الووركر الآمن
        const secureUrl = `${WORKER_URL}/watch?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(serverId)}`;

        // بدء العد التنازلي
        let counter = params.COUNTDOWN;
        txt.innerHTML = `يبدأ الفيديو خلال:`;
        countEl.style.display = "block";
        countEl.innerText = counter;

        const timer = setInterval(() => {
            counter--;
            if (counter > 0) {
                countEl.innerText = counter;
            } else {
                clearInterval(timer);
                countEl.style.display = "none";
                if (params.AD_LINKS && Object.keys(params.AD_LINKS).length > 0) {
                    showAdGate(secureUrl, params);
                } else {
                    startVideo(secureUrl);
                }
            }
        }, 1000);
    }

    function showAdGate(url, params) {
        const txt = document.getElementById("siwane-countdown-text");
        const colors = ['ad-r', 'ad-b', 'ad-o', 'ad-g'];
        let html = `<div style="animation:fadeIn 0.5s;"><p style="color:#ffeb3b;margin-bottom:10px;">إعلانات الدعم (اضغط لتشغيل الفيديو)</p><div class="ad-btns-flex" style="display:flex;justify-content:center;gap:5px;">`;
        
        for(let i=1; i<=params.AD_BUTTONS_COUNT; i++) {
            html += `<button class="ad-gate-btn ${colors[(i-1)%4]}" data-id="ad${i}">إعلان ${i}</button>`;
        }
        html += `</div><div id="final-unlock" style="display:none;margin-top:10px;"><button id="force-play" class="siwane-episode-btn" style="width:100%;justify-content:center;">${icons.play} تشغيل الآن</button></div></div>`;
        
        txt.innerHTML = html;
        
        const clicked = {};
        document.querySelectorAll(".ad-gate-btn").forEach(btn => {
            btn.onclick = function() {
                const id = this.dataset.id;
                if(params.AD_LINKS[id]) window.open(params.AD_LINKS[id], '_blank');
                this.style.opacity = "0.5";
                this.textContent = "✔";
                this.disabled = true;
                clicked[id] = true;
                if(Object.keys(clicked).length >= params.AD_BUTTONS_COUNT) {
                    document.getElementById("final-unlock").style.display = "block";
                }
            };
        });

        document.getElementById("force-play").onclick = () => startVideo(url);
    }

    function startVideo(url) {
        const txt = document.getElementById("siwane-countdown-text");
        const spinner = document.querySelector(".siwane-player-wrapper svg");
        
        txt.innerHTML = "جاري الاتصال بالسيرفر الآمن...";
        if(spinner) spinner.style.display = 'block'; // إظهار التحميل

        setTimeout(() => {
            document.getElementById("siwane-countdown-display").style.display = "none";
            const frame = document.getElementById("siwane-video-frame");
            frame.src = url;
            frame.style.display = "block";
        }, 800);
    }
});
