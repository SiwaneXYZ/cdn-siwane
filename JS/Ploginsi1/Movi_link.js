// ============================================
// Siwane Video Player - متوافق مع جميع المتصفحات
// ============================================

$(document).ready((function() {
    // كشف المتصفح ومعالجة التوافق
    const BrowserCompatibility = {
        isOldBrowser: function() {
            const ua = navigator.userAgent;
            return /UCBrowser|Opera Mini|MQQBrowser|Quark|Baidu|QQBrowser/i.test(ua);
        },
        
        supportsBlobURL: function() {
            try {
                return !!new Blob();
            } catch (e) {
                return false;
            }
        },
        
        supportsOpenInNewTab: function() {
            // اختبار فتح نافذة جديدة
            try {
                const testWindow = window.open('', '_blank');
                if (testWindow) {
                    testWindow.close();
                    return true;
                }
            } catch (e) {}
            return false;
        }
    };

    // إعدادات التخزين المحلي
    const StorageManager = {
        prefix: 'siwane_',
        
        set: function(key, value, ttl = 3600000) { // تلقائيا ساعة واحدة
            const item = {
                value: value,
                expires: Date.now() + ttl
            };
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        },
        
        get: function(key) {
            const itemStr = localStorage.getItem(this.prefix + key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expires) {
                localStorage.removeItem(this.prefix + key);
                return null;
            }
            return item.value;
        },
        
        remove: function(key) {
            localStorage.removeItem(this.prefix + key);
        },
        
        clearOld: function() {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    this.get(key); // هذا سيحذف التخزين المنتهي تلقائيا
                }
            }
        }
    };

    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        WORKER_URL = "https://secure-player.mnaht00.workers.dev";

    // متغيرات النظام
    let countdownInterval = null;
    let currentPlayerUrl = null;
    let adState = {};
    let serverCache = {};

    // تنظيف التخزين القديم عند التحميل
    StorageManager.clearOld();

    // التحقق من التوافق
    if (!BrowserCompatibility.supportsBlobURL()) {
        console.warn('المتصفح لا يدعم Blob URLs، سيتم استخدام طرق بديلة');
    }

    // ===== الدالة الرئيسية =====
    if ("watch" === mode) {
        const sheet = urlParams.get("sheet"),
            episode = urlParams.get("ep"),
            movie = urlParams.get("movie");
            
        if (sheet && config.GAS_URL) {
            const params = {
                GAS_URL: config.GAS_URL,
                COUNTDOWN: config.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheet),
                TYPE: movie ? "movie" : "series",
                ID: movie ? decodeURIComponent(movie) : episode,
                AD_LINKS: config.AD_LINKS || {},
                AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3,
                // إضافة إعدادات التوافق
                COMPATIBILITY_MODE: config.COMPATIBILITY_MODE || BrowserCompatibility.isOldBrowser()
            };
            
            if (params.ID) {
                initializeWatchPage(params);
            }
        }
    } else {
        initializeLobbyPage(config);
    }

    // ===== دالة تهيئة صفحة المشاهدة =====
    function initializeWatchPage(params) {
        const contentContainer = $(".post-body, .entry-content, #post-body").first();
        if (contentContainer.length === 0) return;
        
        // إنشاء العنوان
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        document.title = `مشاهدة ${title}`;
        
        // إنشاء واجهة السيرفرات
        const serverSection = $(`
            <div class="siwane-container">
                <header class="siwane-header">
                    <h1>${title}</h1>
                    <div class="compatibility-notice" style="display:none; background:#fff3cd; padding:8px; margin-top:10px; border-radius:4px; border:1px solid #ffeaa7;">
                        <p style="margin:0; font-size:12px; color:#856404;">
                            <strong>ملاحظة:</strong> يتم تشغيل وضع التوافق للمتصفحات القديمة
                        </p>
                    </div>
                </header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state">
                        <div class="loading-spinner"></div>
                        <p>جاري تحميل السيرفرات...</p>
                    </div>
                </div>
            </div>
        `);
        
        // إنشاء واجهة الفيديو
        const videoSection = $(`
            <div class="siwane-container">
                <div class="siwane-video-container">
                    <h2>شاشة العرض</h2>
                    <div id="siwane-countdown-display">
                        <div class="siwane-particles-container" id="siwane-particles-container"></div>
                        <div id="siwane-countdown-text">الرجاء اختيار سيرفر للبدء</div>
                        <div id="siwane-countdown" class="countdown-number"></div>
                    </div>
                    <div id="siwane-video-wrapper">
                        <iframe id="siwane-video-frame" allowfullscreen 
                                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                    </div>
                    <div class="support-section">
                        <a class="button ln" href="/p/offerwal.html">
                            انقر هنا انتقل وادعمنا بالنقر
                        </a>
                        <div class="browser-help" style="display:none; margin-top:10px; padding:8px; background:#e7f3ff; border-radius:4px;">
                            <p style="margin:0; font-size:11px; color:#0c5460;">
                                <strong>مساعدة:</strong> إذا واجهت مشكلة، جرب <button class="help-btn" onclick="location.reload()">إعادة التحميل</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        // إضافة الأقسام إلى الصفحة
        contentContainer.prepend(serverSection);
        contentContainer.append(videoSection);
        
        // عرض إشعار التوافق إذا لزم الأمر
        if (params.COMPATIBILITY_MODE) {
            $(".compatibility-notice").fadeIn();
            $(".browser-help").fadeIn();
        }
        
        // إنشاء الجسيمات المتحركة
        createParticles();
        
        // تحميل السيرفرات (مع التخزين المؤقت)
        loadServers(params);
    }

    // ===== دالة إنشاء الجسيمات المتحركة =====
    function createParticles() {
        const container = $("#siwane-particles-container");
        container.empty();
        
        for (let i = 0; i < 30; i++) {
            const particle = $('<div class="siwane-particle"></div>');
            particle.css({
                left: (Math.random() * 100) + "%",
                top: (Math.random() * 100) + "%",
                animationDuration: (Math.random() * 4 + 3) + "s",
                animationDelay: (Math.random() * 2) + "s"
            });
            container.append(particle);
        }
    }

    // ===== دالة تحميل السيرفرات =====
    function loadServers(params) {
        const serversGrid = $("#siwane-servers-grid");
        let queryString = `contentSheetName=${encodeURIComponent(params.SHEET)}`;
        
        if (params.TYPE === "movie") {
            queryString += `&movieTitle=${encodeURIComponent(params.ID)}`;
        } else {
            queryString += `&episodeNumber=${params.ID}`;
        }
        
        // التحقق من التخزين المؤقت أولاً
        const cacheKey = `servers_${params.SHEET}_${params.ID}`;
        const cachedServers = StorageManager.get(cacheKey);
        
        if (cachedServers) {
            displayServers(cachedServers, params);
            return;
        }
        
        // تحميل جديد
        $.ajax({
            url: `${params.GAS_URL}?${queryString}`,
            type: "GET",
            dataType: "json",
            timeout: 10000,
            success: function(servers) {
                // تخزين في الكاش
                StorageManager.set(cacheKey, servers, 300000); // 5 دقائق
                displayServers(servers, params);
            },
            error: function(xhr, status, error) {
                if (status === "timeout") {
                    serversGrid.html('<p class="error">انتهت مهلة الاتصال. تحقق من اتصالك بالإنترنت.</p>');
                } else {
                    serversGrid.html('<p class="error">فشل تحميل السيرفرات. يرجى المحاولة لاحقاً.</p>');
                }
            }
        });
    }

    // ===== دالة عرض السيرفرات =====
    function displayServers(servers, params) {
        const serversGrid = $("#siwane-servers-grid");
        serversGrid.removeClass("loading-state").empty();
        
        if (!servers || servers.length === 0) {
            serversGrid.html('<p class="error">لا توجد سيرفرات متاحة حاليًا.</p>');
            return;
        }
        
        servers.forEach(server => {
            const serverButton = $(`
                <div class="siwane-server-btn" data-id="${server.id}" data-title="${server.title}">
                    <span class="server-icon">${server.icon || '📺'}</span>
                    <span class="server-title">${server.title}</span>
                    <span class="server-status"></span>
                </div>
            `);
            
            serverButton.click(function() {
                // إزالة التحديد من جميع الأزرار
                $(".siwane-server-btn").removeClass("active");
                // إضافة التحديد للزر الجديد
                $(this).addClass("active");
                
                // التمرير إلى قسم الفيديو
                $("html, body").animate({
                    scrollTop: $(".siwane-video-container").offset().top - 20
                }, 800);
                
                // تشغيل السيرفر المختار
                playSelectedServer(server.id, server.title, params);
            });
            
            serversGrid.append(serverButton);
        });
    }

    // ===== دالة تشغيل السيرفر المختار =====
    function playSelectedServer(serverId, serverTitle, params) {
        // إعادة تعيين العارض
        resetPlayer();
        
        // عرض رسالة التحميل
        $("#siwane-countdown-text").html(`
            <div class="loading-message">
                <div class="spinner-small"></div>
                <span>جاري تأمين الاتصال مع ${serverTitle}...</span>
            </div>
        `);
        $("#siwane-countdown-display").css("display", "flex");
        $("#siwane-video-frame").hide();
        
        // التحقق من التخزين المؤقت للرابط
        const cacheKey = `server_${params.SHEET}_${params.ID}_${serverId}`;
        const cachedUrl = StorageManager.get(cacheKey);
        
        if (cachedUrl && !params.COMPATIBILITY_MODE) {
            // استخدام الرابط المخزن
            startCountdownAndAds(cachedUrl, params);
        } else {
            // جلب رابط جديد
            fetchSecurePlayerUrl(serverId, params, cacheKey);
        }
    }

    // ===== دالة جلب رابط السيرفر الآمن =====
    function fetchSecurePlayerUrl(serverId, params, cacheKey) {
        $.ajax({
            url: `${WORKER_URL}/get-secure-player`,
            data: {
                sheet: params.SHEET,
                id: serverId
            },
            type: "GET",
            dataType: "json",
            timeout: 15000,
            success: function(response) {
                if (response.realUrl) {
                    // إنشاء مشغل آمن
                    const playerUrl = createSecurePlayer(response.realUrl, params);
                    
                    // تخزين في الكاش
                    if (playerUrl) {
                        StorageManager.set(cacheKey, playerUrl, 1800000); // 30 دقيقة
                    }
                    
                    // بدء العداد والإعلانات
                    startCountdownAndAds(playerUrl, params);
                } else {
                    $("#siwane-countdown-text").html(`
                        <div class="error-message">
                            خطأ: ${response.error || "تعذر جلب الرابط"}
                            <button onclick="location.reload()" style="margin-top:10px; padding:5px 15px; background:#dc3545; color:white; border:none; border-radius:3px;">
                                إعادة المحاولة
                            </button>
                        </div>
                    `);
                }
            },
            error: function(xhr, status, error) {
                $("#siwane-countdown-text").html(`
                    <div class="error-message">
                        فشل الاتصال بالخادم.
                        <p style="font-size:12px; margin-top:5px;">جرب اختيار سيرفر آخر أو إعادة التحميل</p>
                    </div>
                `);
            }
        });
    }

    // ===== دالة إنشاء المشغل الآمن =====
    function createSecurePlayer(realUrl, params) {
        try {
            const encryptedUrl = btoa(realUrl).split("").reverse().join("");
            
            if (params.COMPATIBILITY_MODE || !BrowserCompatibility.supportsBlobURL()) {
                // وضع التوافق: استخدام iframe مباشرة
                return realUrl;
            }
            
            const blob = new Blob([`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            margin:0; 
                            padding:0; 
                            overflow:hidden; 
                            background:#000; 
                            color:#fff; 
                            display:flex; 
                            align-items:center; 
                            justify-content:center; 
                            height:100vh; 
                            text-align:center; 
                            font-family:sans-serif; 
                        }
                        .security-msg { 
                            padding:20px; 
                            border:2px solid #ff4444; 
                            border-radius:10px; 
                            background:rgba(255,0,0,0.1); 
                            direction:rtl; 
                        }
                        h1 { 
                            font-size:22px; 
                            color:#ff4444; 
                            margin-bottom:10px; 
                        }
                        p { 
                            font-size:16px; 
                            margin:0; 
                        }
                    </style>
                </head>
                <body>
                    <div id="c" style="width:100%;height:100%;"></div>
                    <script>
                        (function() {
                            var allowed = "www.athar.news";
                            var host = "";
                            try { 
                                host = window.parent.location.hostname; 
                            } catch(e) { 
                                host = "blocked"; 
                            }
                            var container = document.getElementById("c");
                            
                            if (host !== allowed && host !== "athar.news") {
                                container.innerHTML = '<div class="security-msg"><h1>أوبس جمال اكتشفك ايها المتطفل!</h1><p>شاهد الحلقة ولا تسرق مجهودنا 😊</p></div>';
                            } else {
                                var key = "${encryptedUrl}";
                                var raw = atob(key.split('').reverse().join(''));
                                container.innerHTML = '<iframe src="' + raw + '" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>';
                            }
                        })();
                    <\/script>
                </body>
                </html>
            `], { type: "text/html" });
            
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error creating secure player:', error);
            return realUrl; // العودة للرابط المباشر في حالة الخطأ
        }
    }

    // ===== دالة بدء العداد والإعلانات =====
    function startCountdownAndAds(playerUrl, params) {
        let countdown = params.COUNTDOWN;
        const countdownElement = $("#siwane-countdown");
        const countdownText = $("#siwane-countdown-text");
        
        countdownText.html(`
            <div class="preparing-video">
                <div class="spinner-small"></div>
                <span>جاري تحضير الفيديو...</span>
            </div>
        `);
        
        // إيقاف أي عداد سابق
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // بدء عداد جديد
        countdownInterval = setInterval(function() {
            countdownElement.text(countdown);
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                countdownElement.hide();
                currentPlayerUrl = playerUrl;
                showAdGate(playerUrl, params);
            }
        }, 1000);
    }

    // ===== دالة عرض بوابة الإعلانات (متوافقة مع كل المتصفحات) =====
    function showAdGate(playerUrl, params) {
        const countdownText = $("#siwane-countdown-text");
        const adButtonsCount = params.AD_BUTTONS_COUNT;
        
        // إعادة تعيين حالة الإعلانات
        adState = {
            clicked: {},
            completed: false,
            playerUrl: playerUrl
        };
        
        // إنشاء أزرار الإعلانات ديناميكياً
        let buttonsHTML = '';
        const colors = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800'];
        
        for (let i = 1; i <= adButtonsCount; i++) {
            const color = colors[i - 1] || colors[0];
            const adLink = params.AD_LINKS[`ad${i}`] || '#';
            
            buttonsHTML += `
                <a href="${adLink}" 
                   id="ad-btn-${i}"
                   target="_blank"
                   data-id="ad${i}"
                   class="ad-link-btn"
                   style="display:inline-block; padding:10px 15px; margin:5px;
                          background:${color}; color:white; text-decoration:none;
                          border-radius:5px; font-size:14px; font-weight:bold;
                          border:none; cursor:pointer; min-width:80px; position:relative;">
                   <span class="btn-text">إعلان ${i}</span>
                   <span class="btn-check" style="display:none; position:absolute; right:5px;">✓</span>
                </a>
            `;
        }
        
        const adHtml = `
            <div class="ad-gate-container">
                <div class="ad-instructions">
                    <h3>خطوات المشاهدة</h3>
                    <ol style="text-align:right; padding-right:15px; font-size:13px;">
                        <li>اضغط على ${adButtonsCount} إعلانات أدناه</li>
                        <li>انتظر حتى تفتح كل الإعلانات</li>
                        <li>اضغط على زر التشغيل</li>
                    </ol>
                </div>
                
                <div class="ad-buttons-container">
                    ${buttonsHTML}
                </div>
                
                <div class="ad-progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="ad-progress-fill" style="width:0%"></div>
                    </div>
                    <div class="progress-text">
                        <span id="ads-clicked">0</span> / ${adButtonsCount} إعلانات
                    </div>
                </div>
                
                <div id="final-unlock" class="final-unlock" style="display:none;">
                    <button id="play-now-btn" class="play-button">
                        تشغيل الفيديو الآن
                    </button>
                    <p class="unlock-message">تم تفعيل جميع الإعلانات بنجاح</p>
                </div>
                
                <div id="compatibility-help" class="compatibility-help" style="display:none;">
                    <div class="help-content">
                        <h4>لماذا لا تفتح الإعلانات؟</h4>
                        <ul>
                            <li>المتصفح يمنع النوافذ المنبثقة</li>
                            <li>اضغط مطولاً على الزر واختر "فتح في نافذة جديدة"</li>
                            <li>أو سمح بالنوافذ المنبثقة لهذا الموقع</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        countdownText.html(adHtml);
        
        // عرض رسائل المساعدة للمتصفحات القديمة
        if (params.COMPATIBILITY_MODE) {
            setTimeout(() => {
                $("#compatibility-help").fadeIn();
            }, 1000);
        }
        
        // إضافة أحداث النقر على أزرار الإعلانات
        $(".ad-link-btn").click(function(e) {
            e.preventDefault();
            const adId = $(this).data("id");
            const href = $(this).attr("href");
            
            if (!adState.clicked[adId]) {
                adState.clicked[adId] = true;
                
                // تحديث مظهر الزر
                $(this).css({
                    'background': '#607D8B',
                    'opacity': '0.8',
                    'transform': 'scale(0.95)'
                });
                $(this).find('.btn-text').hide();
                $(this).find('.btn-check').show();
                
                // تحديث شريط التقدم
                updateAdProgress();
                
                // فتح الرابط باستخدام الطريقة المتوافقة
                openAdLink(href, params.COMPATIBILITY_MODE);
            }
            
            return false;
        });
        
        // إضافة حدث زر التشغيل النهائي
        $("#play-now-btn").click(function() {
            completeAdGate();
        });
    }

    // ===== دالة فتح رابط الإعلان (متوافقة مع كل المتصفحات) =====
    function openAdLink(url, compatibilityMode) {
        if (!url || url === '#') return;
        
        try {
            if (compatibilityMode || !BrowserCompatibility.supportsOpenInNewTab()) {
                // طريقة التوافق: استخدام form submit
                const form = document.createElement('form');
                form.method = 'GET';
                form.action = url;
                form.target = '_blank';
                form.style.display = 'none';
                document.body.appendChild(form);
                form.submit();
                setTimeout(() => {
                    document.body.removeChild(form);
                }, 100);
            } else {
                // طريقة عادية
                const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                if (!newWindow || newWindow.closed) {
                    throw new Error('Popup blocked');
                }
            }
        } catch (error) {
            // طريقة الطوارئ: فتح في نفس الصفحة
            window.location.href = url;
        }
    }

    // ===== دالة تحديث تقدم الإعلانات =====
    function updateAdProgress() {
        const totalAds = Object.keys(adState.clicked).length;
        const progressPercent = (totalAds / (adState.playerUrl ? adButtonsCount : 1)) * 100;
        
        $("#ads-clicked").text(totalAds);
        $("#ad-progress-fill").css('width', progressPercent + '%');
        
        if (totalAds === adButtonsCount) {
            adState.completed = true;
            $("#final-unlock").fadeIn(500);
            $("#compatibility-help").fadeOut();
        }
    }

    // ===== دالة إكمال بوابة الإعلانات =====
    function completeAdGate() {
        if (!adState.completed) return;
        
        const countdownText = $("#siwane-countdown-text");
        countdownText.html(`
            <div class="success-message">
                <div class="success-icon"></div>
                <h3>جاهز للمشاهدة!</h3>
                <p>جاري تحميل الفيديو...</p>
            </div>
        `);
        
        setTimeout(() => {
            $("#siwane-countdown-display").fadeOut(300, function() {
                const videoFrame = $("#siwane-video-frame");
                const currentSrc = videoFrame.attr("src");
                
                // تحرير رابط الـ blob السابق إذا كان موجوداً
                if (currentSrc && currentSrc.startsWith("blob:")) {
                    try {
                        URL.revokeObjectURL(currentSrc);
                    } catch (e) {
                        console.warn('Could not revoke blob URL:', e);
                    }
                }
                
                // عرض الفيديو
                videoFrame
                    .attr("src", adState.playerUrl)
                    .fadeIn();
            });
        }, 800);
    }

    // ===== دالة إعادة تعيين المشغل =====
    function resetPlayer() {
        // إيقاف أي عداد سابق
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        
        // إعادة تعيين حالة الإعلانات
        adState = {};
        
        // إعادة تعيين العناصر
        $("#siwane-countdown").show().text("");
        $("#siwane-video-frame").hide();
    }

    // ===== دالة تهيئة صفحة اللوبي =====
    function initializeLobbyPage(config) {
        const lobbyElement = $("#siwane-lobby");
        
        if (lobbyElement.length > 0 && config.GAS_URL) {
            const sheet = lobbyElement.data("sheet");
            const movie = lobbyElement.data("movie");
            
            if (sheet) {
                if (movie) {
                    loadMovieLobby(sheet, movie, lobbyElement, config);
                } else {
                    loadSeriesLobby(sheet, lobbyElement, config);
                }
            }
        }
    }

    // ===== دالة تحميل لوبي الأفلام =====
    function loadMovieLobby(sheet, movieTitle, container, config) {
        const html = `
            <div class="siwane-episodes-container">
                <h2>${movieTitle}</h2>
                <div class="siwane-episodes-grid" style="grid-template-columns: 1fr;">
                    <div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${movieTitle}', 'movie')">
                        شاهد الآن
                    </div>
                </div>
            </div>
        `;
        
        window.siwaneRedirect = function(sheet, title, type) {
            redirectToWatchPage(sheet, title, type);
        };
        
        container.html(html);
    }

    // ===== دالة تحميل لوبي المسلسلات =====
    function loadSeriesLobby(sheet, container, config) {
        container.html(`
            <div class="loading-episodes">
                <div class="spinner"></div>
                <p class="note">جاري جلب الحلقات...</p>
            </div>
        `);
        
        // التحقق من التخزين المؤقت
        const cacheKey = `episodes_${sheet}`;
        const cachedEpisodes = StorageManager.get(cacheKey);
        
        if (cachedEpisodes) {
            displayEpisodes(cachedEpisodes, sheet, container);
            return;
        }
        
        $.ajax({
            url: `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`,
            type: "GET",
            dataType: "json",
            timeout: 10000,
            success: function(response) {
                if (response.episodes && response.episodes.length > 0) {
                    StorageManager.set(cacheKey, response.episodes, 300000); // 5 دقائق
                    displayEpisodes(response.episodes, sheet, container);
                } else {
                    container.html('<p class="error">لا توجد حلقات متاحة.</p>');
                }
            },
            error: function() {
                container.html('<p class="error">فشل تحميل الحلقات. يرجى المحاولة لاحقاً.</p>');
            }
        });
    }

    // ===== دالة عرض الحلقات =====
    function displayEpisodes(episodes, sheet, container) {
        let html = `<div class="siwane-episodes-container"><h2>حلقات ${sheet}</h2><div class="siwane-episodes-grid">`;
        
        episodes.forEach(episode => {
            if (episode !== null && episode !== "null" && !isNaN(episode)) {
                html += `
                    <div class="siwane-episode-btn" 
                         onclick="siwaneRedirect('${sheet}', '${episode}', 'series')">
                        الحلقة ${episode}
                    </div>
                `;
            }
        });
        
        html += "</div></div>";
        
        window.siwaneRedirect = function(sheet, episode, type) {
            redirectToWatchPage(sheet, episode, type);
        };
        
        container.html(html);
    }

    // ===== دالة التحويل إلى صفحة المشاهدة =====
    async function redirectToWatchPage(sheet, id, type) {
        try {
            const response = await fetch("/feeds/posts/summary?alt=json&max-results=150");
            const data = await response.json();
            
            if (data.feed.entry && data.feed.entry.length > 0) {
                const randomPost = data.feed.entry[Math.floor(Math.random() * data.feed.entry.length)];
                const postUrl = randomPost.link.find(link => link.rel === "alternate").href;
                
                const separator = postUrl.includes("?") ? "&" : "?";
                const idParam = type === "movie" ? `&movie=${encodeURIComponent(id)}` : `&ep=${id}`;
                
                window.location.href = `${postUrl}${separator}mode=watch&sheet=${encodeURIComponent(sheet)}${idParam}`;
            }
        } catch (error) {
            alert("خطأ في التحويل. يرجى المحاولة مرة أخرى.");
        }
    }

    // ===== وظائف مساعدة إضافية =====
    
    // تحديث تلقائي للعداد عند تبديل علامات التبويب
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && countdownInterval) {
            // إيقاف مؤقت للعداد عند ترك الصفحة
            clearInterval(countdownInterval);
        }
    });
    
    // استئناف العداد عند العودة للصفحة
    $(window).focus(function() {
        // يمكن إضافة منطق استئناف العداد إذا لزم
    });
}));
