document.addEventListener("DOMContentLoaded", function() {
    const config = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const WORKER_URL = "https://secure-player.siwane.workers.dev";

    let countdownInterval = null;
    let activeBlobUrl = null;
    let devToolsOpen = false;

    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag;

    // ==========================================
    // 🛡️ نظام كشف أدوات المطورين (مُبسَّط)
    // ==========================================
    function setupDevToolsDetection() {
        // 1. فقط كشف عن طريق الحجم (لا يتعارض مع fetch)
        const checkSize = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            
            if (widthThreshold || heightThreshold) {
                devToolsOpen = true;
                console.warn('⚠️ تم اكتشاف أدوات المطورين');
            }
        };

        // 2. مراقبة مستمرة ولكن بدون debugger
        setInterval(checkSize, 1000);

        // 3. كشف اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 123 || // F12
                (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
                (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
                (e.ctrlKey && e.shiftKey && e.keyCode === 67)) { // Ctrl+Shift+C
                e.preventDefault();
                devToolsOpen = true;
                console.warn('⚠️ تم ضغط اختصار أدوات المطورين');
                cleanVideoFrame();
                return false;
            }
        });

        // 4. كشف Eruda للهواتف (بعد تحميل الصفحة)
        setTimeout(() => {
            if (typeof eruda !== 'undefined' || 
                typeof erudaTools !== 'undefined' ||
                document.querySelector('.eruda-container')) {
                devToolsOpen = true;
                console.warn('⚠️ تم اكتشاف Eruda على الهاتف');
            }
        }, 2000);
    }

    // ==========================================
    // 🧹 تنظيف إطار الفيديو (فقط في وضع المشاهدة)
    // ==========================================
    function cleanVideoFrame() {
        if (!devToolsOpen || mode !== "watch") return;
        
        const videoFrame = document.getElementById('siwane-video-frame');
        if (videoFrame && videoFrame.src && videoFrame.src.includes('blob:')) {
            videoFrame.src = 'about:blank';
            console.warn('🔒 تم تنظيف إطار الفيديو لأسباب أمنية');
        }
    }

    // ==========================================
    // 🏁 البداية - لا نبدأ كشف DevTools في اللوبي
    // ==========================================
    if ("watch" === mode && canViewContent) {
        setupDevToolsDetection();
        handleWatchRoute();
    } else if ("watch" === mode && !canViewContent) {
        console.warn("تم حظر الوصول المباشر.");
    } else {
        initializeLobbyWithProtection(config);
    }

    // ==========================================
    // 🛡️ حماية اللوبي
    // ==========================================
    function initializeLobbyWithProtection(config) {
        const lobbyElement = document.getElementById("siwane-lobby");
        if (!lobbyElement || !config.GAS_URL) {
            console.error("❌ عنصر اللوبي أو GAS_URL غير موجود");
            return;
        }

        const rawSheet = lobbyElement.dataset.sheet;
        const movie = lobbyElement.dataset.movie;
        const cleanName = formatTitle(rawSheet);

        console.log("📋 بيانات اللوبي:", { rawSheet, movie, cleanName });

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
                        <div id="siwane-scroll-zone" style="display:none; padding: 10px 0;">
                            <p id="scroll-msg" style="color: var(--linkC); font-weight: bold; font-size: 13px; margin: 0;">
                                يرجى التمرير للأسفل قليلاً لتأمين المحتوى...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const trigger = document.getElementById("activate-trigger");
        if (!trigger) {
            console.error("❌ زر التفعيل غير موجود");
            return;
        }

        trigger.addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("siwane-btn-zone").style.display = "none";
            const scrollZone = document.getElementById("siwane-scroll-zone");
            scrollZone.style.display = "block";

            let scrollTriggered = false;
            const scrollHandler = function() {
                if (!scrollTriggered) {
                    scrollTriggered = true;
                    document.getElementById("scroll-msg").innerHTML = `جاري استخراج البيانات...`;
                    
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

    // ==========================================
    // 📺 جلب المحتوى (إصلاح نهائي)
    // ==========================================
    async function loadSeriesLobby(sheet, container, config) {
        console.log("🚀 بدء تحميل الحلقات لـ:", sheet);
        
        const cleanName = formatTitle(sheet);
        container.innerHTML = `<div class="siwane-container"><p class="note">جاري تحميل القائمة...</p></div>`;
        
        try {
            // بناء رابط GAS مع تسجيل
            const gasUrl = `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`;
            console.log("🔗 رابط GAS:", gasUrl);
            
            // إرسال طلب fetch بدون أي تدخل من كشف DevTools
            const response = await fetch(gasUrl);
            
            if (!response.ok) {
                throw new Error(`خطأ HTTP: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("📦 البيانات المستلمة:", data);
            
            // التحقق من بنية البيانات
            if (!data || typeof data !== 'object') {
                throw new Error('بيانات غير صالحة من الخادم');
            }
            
            if (data.error) {
                throw new Error(`خطأ من GAS: ${data.error}`);
            }
            
            if (data.episodes && Array.isArray(data.episodes) && data.episodes.length > 0) {
                console.log(`✅ عدد الحلقات: ${data.episodes.length}`);
                
                // فلترة وتنظيف الحلقات
                const validEpisodes = data.episodes.filter(ep => {
                    if (!ep && ep !== 0) return false;
                    const epStr = String(ep).trim();
                    return epStr !== "" && epStr !== "---" && epStr !== "null" && epStr !== "undefined";
                });
                
                if (validEpisodes.length === 0) {
                    throw new Error('جميع الحلقات فارغة بعد التصفية');
                }
                
                // إزالة التكرارات
                const uniqueEpisodes = [...new Set(validEpisodes)];
                console.log(`✨ حلقات فريدة: ${uniqueEpisodes.length}`);
                
                // ترتيب الحلقات
                uniqueEpisodes.sort((a, b) => {
                    const numA = parseFloat(a);
                    const numB = parseFloat(b);
                    const isANum = !isNaN(numA);
                    const isBNum = !isNaN(numB);
                    
                    if (isANum && isBNum) return numA - numB;
                    if (isANum) return -1;
                    if (isBNum) return 1;
                    
                    if (a.includes("الأخيرة") && !b.includes("الأخيرة")) return 1;
                    if (!a.includes("الأخيرة") && b.includes("الأخيرة")) return -1;
                    
                    return String(a).localeCompare(String(b), 'ar');
                });
                
                // إنشاء واجهة الحلقات
                let html = `<div class="siwane-container siwane-fade-in">
                    <div class="siwane-episodes-container">
                        <h2>حلقات مسلسل ${cleanName}</h2>
                        <div class="siwane-episodes-grid">`;
                
                uniqueEpisodes.forEach(ep => {
                    const epStr = String(ep);
                    const isLast = epStr.includes('الأخيرة');
                    const displayText = isLast ? epStr : `الحلقة ${epStr}`;
                    const safeEp = epStr.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const safeSheet = sheet.replace(/'/g, "\\'");
                    
                    html += `
                        <div class="siwane-episode-btn" 
                             onclick="window.siwaneRedirect('${safeSheet}', '${safeEp}', 'series')">
                            ${displayText}
                        </div>`;
                });
                
                html += `</div></div></div>`;
                
                // تعيين دالة التحويل
                window.siwaneRedirect = redirectToWatchPage;
                
                // عرض الحلقات
                container.innerHTML = html;
                console.log("✅ تم تحميل الحلقات بنجاح");
                
            } else {
                console.warn("⚠️ لا توجد حلقات في البيانات:", data);
                container.innerHTML = `
                    <div class="siwane-container">
                        <div class="siwane-episodes-container">
                            <h2>مسلسل ${cleanName}</h2>
                            <p class="note" style="text-align:center;color:#ff6b6b;padding:20px;">
                                ⚠️ لا توجد حلقات متاحة حالياً
                            </p>
                            <div style="text-align:center;">
                                <button onclick="location.reload()" 
                                        style="background:var(--linkC);color:#fff;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error("❌ خطأ في تحميل الحلقات:", error);
            
            container.innerHTML = `
                <div class="siwane-container">
                    <div class="siwane-episodes-container">
                        <h2>مسلسل ${cleanName}</h2>
                        <div style="text-align:center;padding:20px;">
                            <p style="color:#ff4444;margin-bottom:15px;">
                                <strong>حدث خطأ:</strong><br>
                                ${error.message || 'خطأ غير معروف'}
                            </p>
                            <div>
                                <button onclick="loadSeriesLobby('${sheet}', this.parentElement.parentElement.parentElement, ${JSON.stringify(config).replace(/"/g, '&quot;')})" 
                                        style="background:var(--linkC);color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;margin:5px;">
                                    ↻ إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // ==========================================
    // 🎬 صفحة الأفلام
    // ==========================================
    function loadMovieLobby(sheet, movieTitle, container, config) {
        console.log("🎬 تحميل فيلم:", movieTitle);
        
        container.innerHTML = `
            <div class="siwane-container siwane-fade-in">
                <div class="siwane-episodes-container">
                    <h2>${movieTitle}</h2>
                    <div class="siwane-episodes-grid" style="grid-template-columns:1fr;">
                        <div class="siwane-episode-btn" onclick="window.siwaneRedirect('${sheet.replace(/'/g, "\\'")}', '${movieTitle.replace(/'/g, "\\'")}', 'movie')">
                            شاهد الآن
                        </div>
                    </div>
                </div>
            </div>
        `;
        window.siwaneRedirect = redirectToWatchPage;
    }

    // ==========================================
    // 🔄 التحويل لصفحة المشاهدة
    // ==========================================
    async function redirectToWatchPage(sheet, id, type) {
        console.log(`🚀 التحويل: ${sheet}, ${id}, ${type}`);
        
        try {
            const response = await fetch("/feeds/posts/summary?alt=json&max-results=150");
            const data = await response.json();
            
            if (data.feed && data.feed.entry) {
                const entries = data.feed.entry;
                const randomPost = entries[Math.floor(Math.random() * entries.length)];
                const postUrl = randomPost.link.find(link => link.rel === "alternate").href;
                
                sessionStorage.setItem("siwane_access_token", "true");
                
                const sep = postUrl.includes("?") ? "&" : "?";
                const targetUrl = `${postUrl}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}&${type==='movie'?'movie':'ep'}=${encodeURIComponent(id)}`;
                
                console.log(`🎯 التحويل إلى: ${targetUrl}`);
                window.location.href = targetUrl;
                
            } else {
                alert("❌ لا يمكن العثور على صفحة للتحويل.");
            }
        } catch (e) {
            console.error('خطأ في التحويل:', e);
            alert("⚠️ حدث خطأ في عملية التحويل.");
        }
    }

    // ==========================================
    // 🎥 المشغل والعداد (الجزء المتبقي من الكود الأصلي)
    // ==========================================
    function handleWatchRoute() {
        const sheet = urlParams.get("sheet"), 
              ep = urlParams.get("ep"), 
              movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : ep;
        
        if (sheet && config.GAS_URL) {
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
                } catch (e) {
                    console.warn('تعذر تحميل السيرفر السابق:', e);
                }
            }
        }
    }

    async function playSelectedServer(serverId, params) {
        if (countdownInterval) clearInterval(countdownInterval);
        if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
            activeBlobUrl = null;
        }
        
        sessionStorage.setItem("siwane_last_server", JSON.stringify({ 
            sheet: params.SHEET, 
            id: params.ID, 
            serverId: serverId 
        }));
        
        const videoSection = document.querySelector(".siwane-video-container");
        if (videoSection) {
            window.scrollTo({ top: videoSection.offsetTop - 20, behavior: 'smooth' });
        }

        const countdownDisplay = document.getElementById("siwane-countdown-display");
        const countdownEl = document.getElementById("siwane-countdown");
        const countdownText = document.getElementById("siwane-countdown-text");
        const videoFrame = document.getElementById("siwane-video-frame");

        if (countdownDisplay) countdownDisplay.style.display = "flex";
        if (countdownEl) {
            countdownEl.style.display = "block";
            countdownEl.textContent = params.COUNTDOWN || 10;
        }
        if (countdownText) countdownText.innerHTML = `جاري تأمين المشغل و تشغيل المقطع...`;
        if (videoFrame) {
            videoFrame.style.display = "none";
            videoFrame.src = "";
        }

        try {
            const response = await fetch(`${WORKER_URL}/get-secure-player?sheet=${encodeURIComponent(params.SHEET)}&id=${encodeURIComponent(serverId)}`);
            const res = await response.json();
            
            if (res.realUrl) {
                const enc = btoa(res.realUrl).split("").reverse().join("");
                startCountdownAndAds(enc, params);
            } else {
                throw new Error(res.error || 'لم يتم استقبال رابط الفيديو');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل السيرفر:', error);
            if (countdownText) countdownText.innerHTML = `❌ خطأ: ${error.message}`;
        }
    }

    function startCountdownAndAds(enc, params) {
        let count = params.COUNTDOWN || 10;
        const countdownEl = document.getElementById("siwane-countdown");
        if (!countdownEl) return;
        
        countdownEl.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            if (count >= 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdownEl.style.display = "none";
                showAdGate(enc, params);
            }
        }, 1000);
    }

    function showAdGate(enc, params) {
        const txt = document.getElementById("siwane-countdown-text");
        if (!txt) return;
        
        const clicked = {};
        let btnsHtml = ''; 
        const colors = ['ad-r','ad-b','ad-o','ad-g'];

        for(let i = 1; i <= (params.AD_BUTTONS_COUNT || 3); i++) {
            clicked[`ad${i}`] = false;
            btnsHtml += `<button class="ad-gate-btn ${colors[i-1]||colors[0]}" data-id="ad${i}" style="padding:8px;margin:3px;cursor:pointer;border:none;color:#fff;border-radius:5px;">إعلان ${i}</button>`;
        }

        txt.innerHTML = `
            <div style="text-align:center;">
                <p style="color:#ffeb3b;margin-bottom:15px;">اضغط على الاعلانات لفتح المشغل:</p>
                ${btnsHtml}
                <div id="final-unlock" style="display:none;margin-top:20px;">
                    <button id="play-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;padding:12px;border:none;cursor:pointer;font-size:16px;">
                        🎬 تشغيل الآن
                    </button>
                </div>
            </div>
        `;

        document.querySelectorAll(".ad-gate-btn").forEach(btn => {
            btn.onclick = function() {
                const id = this.dataset.id;
                if(params.AD_LINKS && params.AD_LINKS[id]) {
                    window.open(params.AD_LINKS[id], '_blank');
                }
                this.style.opacity = "0.5"; 
                this.disabled = true; 
                this.textContent = "✅ تم";
                clicked[id] = true;
                
                const allClicked = Object.values(clicked).every(v => v);
                if(allClicked) {
                    document.getElementById("final-unlock").style.display = "block";
                }
            };
        });

        document.getElementById("play-now").onclick = () => {
            txt.textContent = "🎉 مشاهدة ممتعة!";
            
            setTimeout(() => {
                const display = document.getElementById("siwane-countdown-display");
                if (display) display.style.display = "none";
                
                const blobUrl = createSecurePlayer(enc);
                activeBlobUrl = blobUrl;
                
                const frame = document.getElementById("siwane-video-frame");
                if (frame) {
                    frame.src = blobUrl;
                    frame.style.display = "block";
                }
                
                window.addEventListener('beforeunload', () => {
                    if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
                });
            }, 800);
        };
    }

    function initializeWatchPage(params) {
        const container = document.querySelector(".post-body, .entry-content, #post-body");
        if (!container) return;
        
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        document.title = `مشاهدة ${title}`;
        
        container.insertAdjacentHTML('afterbegin', `
            <div class="siwane-container">
                <header class="siwane-header">
                    <h1>${title}</h1>
                </header>
                <div class="siwane-server-container">
                    <h2>اختر السيرفر</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid">
                        <p style="text-align:center;">جاري جلب السيرفرات...</p>
                    </div>
                </div>
            </div>
        `);
        
        container.insertAdjacentHTML('beforeend', `
            <div class="siwane-container">
                <div class="siwane-video-container">
                    <h2>شاشة العرض</h2>
                    <div id="siwane-countdown-display" style="display:none;">
                        <div id="siwane-particles-container" class="siwane-particles-container"></div>
                        <div id="siwane-countdown-text"></div>
                        <div id="siwane-countdown"></div>
                    </div>
                    <iframe id="siwane-video-frame" style="display:none;" allowfullscreen 
                            sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                    <a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">
                        انقر هنا للدعم والمشاهدة
                    </a>
                </div>
            </div>
        `);
        
        loadServers(params);
        createParticles();
    }

    function createParticles() {
        const container = document.getElementById("siwane-particles-container");
        if (!container) return;
        
        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div'); 
            p.className = 'siwane-particle';
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${Math.random() * 100}%`;
            p.style.animationDuration = `${Math.random() * 3 + 2}s`;
            p.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(p);
        }
    }

    async function loadServers(params) {
        const grid = document.getElementById("siwane-servers-grid");
        if (!grid) return;
        
        try {
            const query = params.TYPE === "movie" 
                ? `contentSheetName=${encodeURIComponent(params.SHEET)}&movieTitle=${encodeURIComponent(params.ID)}`
                : `contentSheetName=${encodeURIComponent(params.SHEET)}&episodeNumber=${encodeURIComponent(params.ID)}`;
            
            const response = await fetch(`${params.GAS_URL}?${query}`);
            const servers = await response.json();
            
            if (Array.isArray(servers) && servers.length > 0) {
                grid.innerHTML = '';
                
                servers.forEach(s => {
                    const btn = document.createElement('div');
                    btn.className = 'siwane-server-btn';
                    btn.dataset.id = s.id;
                    btn.innerHTML = `<span>${s.icon || '🔗'}</span> <span>${s.title || 'سيرفر'}</span>`;
                    
                    btn.onclick = function() {
                        document.querySelectorAll(".siwane-server-btn").forEach(b => b.classList.remove("active"));
                        this.classList.add("active");
                        playSelectedServer(s.id, params);
                    };
                    
                    grid.appendChild(btn);
                });
            } else {
                grid.innerHTML = `
                    <div style="text-align:center;padding:20px;color:#ff6b6b;">
                        ⚠️ لا توجد سيرفرات متاحة لهذا المحتوى
                    </div>
                `;
            }
        } catch (e) {
            console.error('❌ خطأ في تحميل السيرفرات:', e);
            grid.innerHTML = `
                <div style="text-align:center;padding:20px;color:#ff6b6b;">
                    ❌ فشل تحميل السيرفرات<br>
                    <small style="color:#999;">${e.message || 'اتصال بالإنترنت'}</small>
                </div>
            `;
        }
    }

    function createSecurePlayer(enc) {
        try {
            const decodedUrl = atob(enc.split('').reverse().join(''));
            
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; overflow:hidden; }
        body, html { width:100%; height:100%; background:#000; }
        #vid-frame { width:100%; height:100%; border:none; }
        .loading { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-family:Arial; }
    </style>
</head>
<body>
    <div class="loading">جاري تحميل المشغل الآمن...</div>
    <script>
        try {
            const finalUrl = "${decodedUrl}";
            
            const iframe = document.createElement('iframe');
            iframe.id = 'vid-frame';
            iframe.allowfullscreen = true;
            iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';
            iframe.referrerPolicy = 'no-referrer';
            
            setTimeout(() => {
                iframe.src = finalUrl;
                document.body.innerHTML = '';
                document.body.appendChild(iframe);
            }, 300);
            
        } catch(e) {
            document.querySelector('.loading').textContent = 'خطأ في تحميل المشغل';
        }
    <\/script>
</body>
</html>`;
            
            const blob = new Blob([htmlContent], { type: 'text/html' });
            return URL.createObjectURL(blob);
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء المشغل:', error);
            return null;
        }
    }
});

// إضافة نمط الجزيئات المتحركة
const particlesStyle = document.createElement('style');
particlesStyle.textContent = `
    .siwane-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--linkC);
        border-radius: 50%;
        opacity: 0;
        animation: floatParticle 5s infinite ease-out;
    }
    @keyframes floatParticle {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 0.7; }
        90% { opacity: 0.7; }
        100% { transform: translateY(-150px) translateX(30px); opacity: 0; }
    }
`;
document.head.appendChild(particlesStyle);
