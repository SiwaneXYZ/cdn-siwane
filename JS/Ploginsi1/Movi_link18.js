$(document).ready((function() {
    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        WORKER_URL = "https://secure-player.mnaht00.workers.dev";

    // متغيرات لتتبع المؤقتات والوظائف
    let countdownInterval = null;
    let currentServer = null;

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
                AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3
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
                <header class="siwane-header"><h1>${title}</h1></header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state">
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
                        <div id="siwane-countdown"></div>
                    </div>
                    <iframe id="siwane-video-frame" allowfullscreen 
                            sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                    <a class="button ln" href="/p/offerwal.html" 
                       style="width:100%;text-align:center;display:block;margin-top:10px;">
                       انقر هنا انتقل وادعمنا بالنقر
                    </a>
                </div>
            </div>
        `);
        
        // إضافة الأقسام إلى الصفحة
        contentContainer.prepend(serverSection);
        contentContainer.append(videoSection);
        
        // إنشاء الجسيمات المتحركة
        createParticles();
        
        // تحميل السيرفرات
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
                animationDuration: (Math.random() * 4 + 3) + "s"
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
        
        $.ajax({
            url: `${params.GAS_URL}?${queryString}`,
            type: "GET",
            dataType: "json",
            success: function(servers) {
                serversGrid.removeClass("loading-state").empty();
                
                servers.forEach(server => {
                    const serverButton = $(`
                        <div class="siwane-server-btn" data-id="${server.id}">
                            <span>${server.icon || ''}</span>
                            <span>${server.title}</span>
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
                        playSelectedServer(server.id, params);
                    });
                    
                    serversGrid.append(serverButton);
                });
            },
            error: function() {
                serversGrid.html('<p class="error">فشل تحميل السيرفرات. يرجى المحاولة لاحقاً.</p>');
            }
        });
    }

    // ===== دالة تشغيل السيرفر المختار =====
    function playSelectedServer(serverId, params) {
        // إعادة تعيين العارض
        resetPlayer();
        
        // عرض رسالة التحميل
        $("#siwane-countdown-text").text("جاري تأمين الاتصال...");
        $("#siwane-countdown-display").css("display", "flex");
        $("#siwane-video-frame").hide();
        
        // جلب رابط السيرفر الآمن
        $.ajax({
            url: `${WORKER_URL}/get-secure-player`,
            data: {
                sheet: params.SHEET,
                id: serverId
            },
            type: "GET",
            dataType: "json",
            success: function(response) {
                if (response.realUrl) {
                    // إنشاء مشغل آمن
                    const encryptedUrl = btoa(response.realUrl).split("").reverse().join("");
                    const securePlayer = createSecurePlayer(encryptedUrl);
                    
                    // بدء العداد والإعلانات
                    startCountdownAndAds(securePlayer, params);
                } else {
                    $("#siwane-countdown-text").text("خطأ: " + (response.error || "تعذر جلب الرابط"));
                }
            },
            error: function() {
                $("#siwane-countdown-text").text("فشل الاتصال بالخادم.");
            }
        });
    }

    // ===== دالة إنشاء المشغل الآمن =====
    function createSecurePlayer(encryptedUrl) {
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
    }

    // ===== دالة بدء العداد والإعلانات =====
    function startCountdownAndAds(playerUrl, params) {
        let countdown = params.COUNTDOWN;
        const countdownElement = $("#siwane-countdown");
        const countdownText = $("#siwane-countdown-text");
        
        countdownText.text("جاري تحضير الفيديو...");
        
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
                showAdGate(playerUrl, params);
            }
        }, 1000);
    }

    // ===== دالة عرض بوابة الإعلانات =====
    function showAdGate(playerUrl, params) {
        const countdownText = $("#siwane-countdown-text");
        const adButtonsCount = params.AD_BUTTONS_COUNT;
        
        // إنشاء كائن لتتبع النقرات
        const clicked = {};
        for (let i = 1; i <= adButtonsCount; i++) {
            clicked[`ad${i}`] = false;
        }
        
        // إنشاء أزرار الإعلانات ديناميكياً
        let buttonsHTML = '';
        const buttonClasses = ['ad-r', 'ad-b', 'ad-o', 'ad-g', 'ad-p'];
        
        for (let i = 1; i <= adButtonsCount; i++) {
            const btnClass = buttonClasses[i - 1] || buttonClasses[buttonClasses.length - 1];
            buttonsHTML += `
                <button class="ad-gate-btn ${btnClass}" data-id="ad${i}" 
                        style="padding:6px 10px;font-size:11px;min-width:70px;">
                    إعلان ${i}
                </button>
            `;
        }
        
        // إنشاء واجهة الإعلانات
        const adHtml = `
            <div style="text-align:center;width:100%;padding:5px;">
                <p style="color:#ffeb3b;font-size:12px;margin-bottom:8px;">
                    لفتح المشغل، اضغط على الأزرار ${adButtonsCount}:
                </p>
                <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
                    ${buttonsHTML}
                </div>
                <div id="final-unlock" style="display:none;margin-top:10px;">
                    <button id="play-now" class="siwane-episode-btn" 
                            style="width:100%!important;background:var(--linkB);color:#fff;border:none;padding:8px;font-size:13px;">
                        تشغيل الفيديو الآن
                    </button>
                </div>
            </div>
        `;
        
        countdownText.html(adHtml);
        
        // إضافة أحداث النقر على أزرار الإعلانات
        $(".ad-gate-btn").click(function() {
            const id = $(this).data("id");
            const adLink = params.AD_LINKS[id];
            
            if (adLink) {
                window.open(adLink, '_blank');
            }
            
            $(this).addClass("is-faded");
            clicked[id] = true;
            
            // التحقق من نقر جميع الأزرار
            let allClicked = true;
            for (let i = 1; i <= adButtonsCount; i++) {
                if (!clicked[`ad${i}`]) {
                    allClicked = false;
                    break;
                }
            }
            
            if (allClicked) {
                $("#final-unlock").fadeIn();
            }
        });
        
        // إضافة حدث زر التشغيل النهائي
        $("#play-now").click(function() {
            countdownText.text("مشاهدة ممتعة!");
            
            setTimeout(function() {
                $("#siwane-countdown-display").hide();
                const currentSrc = $("#siwane-video-frame").attr("src");
                
                // تحرير رابط الـ blob السابق إذا كان موجوداً
                if (currentSrc && currentSrc.startsWith("blob:")) {
                    URL.revokeObjectURL(currentSrc);
                }
                
                // عرض الفيديو
                $("#siwane-video-frame")
                    .attr("src", playerUrl)
                    .show();
            }, 500);
        });
    }

    // ===== دالة إعادة تعيين المشغل =====
    function resetPlayer() {
        // إيقاف أي عداد سابق
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        
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
        container.html('<p class="note">جاري جلب الحلقات...</p>');
        
        $.ajax({
            url: `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`,
            type: "GET",
            dataType: "json",
            success: function(response) {
                if (response.episodes && response.episodes.length > 0) {
                    let html = `<div class="siwane-episodes-container"><h2>حلقات ${sheet}</h2><div class="siwane-episodes-grid">`;
                    
                    response.episodes.forEach(episode => {
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
            },
            error: function() {
                container.html('<p class="error">فشل تحميل الحلقات. يرجى المحاولة لاحقاً.</p>');
            }
        });
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
}));
