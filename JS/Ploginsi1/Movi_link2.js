$(document).ready((function() {
    // 1. الإعدادات والبارامترات
    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        WORKER_URL = "https://secure-player.mnaht00.workers.dev";

    let countdownInterval = null;

    // --- نظام الحماية الذكي ---
    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag;

    if ("watch" === mode && canViewContent) {
        handleWatchRoute();
    } else if ("watch" === mode && !canViewContent) {
        console.warn("Direct access blocked.");
    } else {
        // تشغيل اللوبي بنظام الحماية المخصص (فيلم / مسلسل)
        initializeLobbyWithProtection(config);
    }

    // ==========================================
    // 🛡️ نظام حماية اللوبي المخصص (Level Up)
    // ==========================================
    function initializeLobbyWithProtection(config) {
        const lobbyElement = $("#siwane-lobby");
        if (lobbyElement.length === 0 || !config.GAS_URL) return;

        const sheet = lobbyElement.data("sheet");
        const movie = lobbyElement.data("movie");

        // تخصيص النصوص والأيقونات بناءً على نوع المحتوى
        let actionText, headerText, scrollContext;
        if (movie) {
            headerText = `بوابة مشاهدة فيلم: ${movie}`;
            actionText = `<i class="fa fa-play-circle"></i> بدء مشاهدة الفيلم الآن`;
            scrollContext = "رابط الفيلم";
        } else {
            headerText = `قائمة حلقات مسلسل: ${sheet}`;
            actionText = `<i class="fa fa-list-ul"></i> استعراض حلقات المسلسل`;
            scrollContext = "قائمة الحلقات";
        }

        // حقن الحاوية باستخدام كلاسات الهوية البصرية الخاصة بك
        lobbyElement.html(`
            <div class="siwane-container" id="siwane-auth-wrapper">
                <div class="siwane-server-container" style="text-align:center;">
                    <h2 id="activation-status">${headerText}</h2>
                    <div style="padding: 25px 0;">
                        <a href="javascript:void(0)" id="activate-trigger" class="button ln" style="width:100%; text-align:center; display:block; max-width:350px; margin: 0 auto;">
                           ${actionText}
                        </a>
                    </div>
                    <p id="scroll-msg" style="display:none; color: #d35400; font-weight: bold; font-size: 13px; animation: pulse 1.5s infinite;">
                        <i class="fa fa-mouse-pointer"></i> خطوة أمان: يرجى تمرير الصفحة للأسفل لتأمين ${scrollContext}...
                    </p>
                </div>
            </div>
        `);

        // منطق التفعيل (نقرة -> تمرير -> تأخير)
        $("#activate-trigger").click(function(e) {
            e.preventDefault();
            const triggerBtn = $(this);
            const statusHeader = $("#activation-status");
            const scrollMsg = $("#scroll-msg");

            triggerBtn.fadeOut(200);
            statusHeader.text("جاري فحص الاتصال البشري...");
            scrollMsg.fadeIn();

            let scrollTriggered = false;
            $(window).on('scroll.siwaneAuth', function() {
                if (!scrollTriggered) {
                    scrollTriggered = true;
                    scrollMsg.html('<i class="fa fa-spinner fa-spin"></i> جاري استخراج البيانات المشفرة (2 ثانية)...');

                    setTimeout(function() {
                        $("#siwane-auth-wrapper").fadeOut(300, function() {
                            if (movie) loadMovieLobby(sheet, movie, lobbyElement, config);
                            else loadSeriesLobby(sheet, lobbyElement, config);
                        });
                        $(window).off('scroll.siwaneAuth');
                    }, 2000); // تأخير ثانيتين للانعاش
                }
            });
        });
    }

    // ==========================================
    // 📺 وظائف جلب البيانات (AJAX)
    // ==========================================
    function loadMovieLobby(sheet, movieTitle, container, config) {
        container.html(`
            <div class="siwane-container">
                <div class="siwane-episodes-container">
                    <h2>${movieTitle}</h2>
                    <div class="siwane-episodes-grid" style="grid-template-columns: 1fr;">
                        <div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${movieTitle}', 'movie')">
                            <i class="fa fa-play"></i> تشغيل الفيلم
                        </div>
                    </div>
                </div>
            </div>
        `);
        window.siwaneRedirect = (s, t, ty) => redirectToWatchPage(s, t, ty);
    }

    function loadSeriesLobby(sheet, container, config) {
        container.html('<div class="siwane-container"><p class="note">جاري تحميل قائمة الحلقات...</p></div>');
        $.ajax({
            url: `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`,
            type: "GET",
            dataType: "json",
            success: function(response) {
                if (response.episodes && response.episodes.length > 0) {
                    let html = `
                        <div class="siwane-container">
                            <div class="siwane-episodes-container">
                                <h2>حلقات مسلسل ${sheet}</h2>
                                <div class="siwane-episodes-grid">`;
                    
                    response.episodes.forEach(episode => {
                        if (episode !== null) {
                            // يدعم الأرقام أو النصوص مثل "الحلقة الأخيرة" من الشيت مباشرة
                            html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${episode}', 'series')">الحلقة ${episode}</div>`;
                        }
                    });
                    
                    html += `</div></div></div>`;
                    window.siwaneRedirect = (s, e, t) => redirectToWatchPage(s, e, t);
                    container.hide().html(html).fadeIn(600);
                }
            },
            error: function() { container.html('<div class="siwane-container"><p class="error">فشل جلب الحلقات.</p></div>'); }
        });
    }

    // ==========================================
    // 🔗 نظام التحويل (Redirect)
    // ==========================================
    async function redirectToWatchPage(sheet, id, type) {
        try {
            const response = await fetch("/feeds/posts/summary?alt=json&max-results=150");
            const data = await response.json();
            if (data.feed.entry) {
                const randomPost = data.feed.entry[Math.floor(Math.random() * data.feed.entry.length)];
                const postUrl = randomPost.link.find(link => link.rel === "alternate").href;
                
                sessionStorage.setItem("siwane_access_token", "true");
                
                const separator = postUrl.includes("?") ? "&" : "?";
                const idParam = type === "movie" ? `&movie=${encodeURIComponent(id)}` : `&ep=${id}`;
                window.location.href = `${postUrl}${separator}mode=watch&sheet=${encodeURIComponent(sheet)}${idParam}`;
            }
        } catch (error) { alert("خطأ في التحويل."); }
    }

    // ==========================================
    // 🎬 الجزء الخاص بصفحة المشاهدة (Watch)
    // ==========================================
    function handleWatchRoute() {
        const sheet = urlParams.get("sheet"), ep = urlParams.get("ep"), movie = urlParams.get("movie");
        if (sheet && config.GAS_URL) {
            initializeWatchPage({
                GAS_URL: config.GAS_URL, COUNTDOWN: config.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheet), TYPE: movie ? "movie" : "series",
                ID: movie ? decodeURIComponent(movie) : ep,
                AD_LINKS: config.AD_LINKS || {}, AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3
            });
        }
    }

    function initializeWatchPage(params) {
        const contentContainer = $(".post-body, .entry-content, #post-body").first();
        if (contentContainer.length === 0) return;
        
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        document.title = `مشاهدة ${title}`;
        
        const serverSection = $(`
            <div class="siwane-container">
                <header class="siwane-header"><h1>${title}</h1></header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state"><p>جاري تحميل السيرفرات...</p></div>
                </div>
            </div>
        `);
        
        const videoSection = $(`
            <div class="siwane-container">
                <div class="siwane-video-container">
                    <h2>شاشة العرض</h2>
                    <div id="siwane-countdown-display" style="display:none;">
                        <div class="siwane-particles-container" id="siwane-particles-container"></div>
                        <div id="siwane-countdown-text">الرجاء اختيار سيرفر للبدء</div>
                        <div id="siwane-countdown"></div>
                    </div>
                    <iframe id="siwane-video-frame" style="display:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                    <a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا ادعمنا بالنقر</a>
                </div>
            </div>
        `);
        
        contentContainer.prepend(serverSection);
        contentContainer.append(videoSection);
        createParticles();
        loadServers(params);
    }

    function createParticles() {
        const container = $("#siwane-particles-container");
        for (let i = 0; i < 25; i++) {
            const p = $('<div class="siwane-particle"></div>').css({
                left: (Math.random() * 100) + "%", top: (Math.random() * 100) + "%",
                animationDuration: (Math.random() * 3 + 2) + "s"
            });
            container.append(p);
        }
    }

    function loadServers(params) {
        const serversGrid = $("#siwane-servers-grid");
        let query = `contentSheetName=${encodeURIComponent(params.SHEET)}&${params.TYPE === "movie" ? `movieTitle=${encodeURIComponent(params.ID)}` : `episodeNumber=${params.ID}`}`;
        
        $.ajax({
            url: `${params.GAS_URL}?${query}`,
            type: "GET",
            dataType: "json",
            success: function(servers) {
                serversGrid.removeClass("loading-state").empty();
                servers.forEach(server => {
                    const btn = $(`<div class="siwane-server-btn" data-id="${server.id}"><span>${server.icon || '🔗'}</span> <span>${server.title}</span></div>`);
                    btn.click(function() {
                        $(".siwane-server-btn").removeClass("active"); $(this).addClass("active");
                        $("html, body").animate({ scrollTop: $(".siwane-video-container").offset().top - 20 }, 600);
                        playSelectedServer(server.id, params);
                    });
                    serversGrid.append(btn);
                });
            },
            error: function() { serversGrid.html('<p class="error">فشل تحميل السيرفرات.</p>'); }
        });
    }

    function playSelectedServer(serverId, params) {
        if (countdownInterval) clearInterval(countdownInterval);
        $("#siwane-countdown-text").text("جاري تأمين الاتصال...");
        $("#siwane-countdown-display").css("display", "flex");
        $("#siwane-video-frame").hide();
        
        $.ajax({
            url: `${WORKER_URL}/get-secure-player`,
            data: { sheet: params.SHEET, id: serverId },
            type: "GET", dataType: "json",
            success: function(res) {
                if (res.realUrl) {
                    const enc = btoa(res.realUrl).split("").reverse().join("");
                    const playerBlob = createSecurePlayer(enc);
                    startCountdownAndAds(playerBlob, params);
                } else { $("#siwane-countdown-text").text("عذراً: السيرفر غير متاح"); }
            },
            error: function() { $("#siwane-countdown-text").text("فشل الاتصال بالخادم."); }
        });
    }

    function createSecurePlayer(encUrl) {
        const blob = new Blob([`
            <!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;}</style></head>
            <body><div id="c" style="width:100%;height:100%;"></div>
            <script>(function(){
                var allow="www.athar.news", host=""; try{host=window.parent.location.hostname;}catch(e){host="blocked";}
                var container=document.getElementById("c");
                if(host!==allow && host!=="athar.news"){ container.innerHTML='<div style="color:red;text-align:center;">Security Block!</div>'; }
                else { var k="${encUrl}", raw=atob(k.split('').reverse().join('')); container.innerHTML='<iframe src="'+raw+'" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>'; }
            })();<\/script></body></html>
        `], { type: "text/html" });
        return URL.createObjectURL(blob);
    }

    function startCountdownAndAds(playerUrl, params) {
        let count = params.COUNTDOWN;
        const countEl = $("#siwane-countdown"), txtEl = $("#siwane-countdown-text");
        txtEl.text("جاري تحضير الفيديو...");
        countdownInterval = setInterval(function() {
            countEl.text(count); count--;
            if (count < 0) { clearInterval(countdownInterval); countEl.hide(); showAdGate(playerUrl, params); }
        }, 1000);
    }

    function showAdGate(playerUrl, params) {
        const txtEl = $("#siwane-countdown-text"), count = params.AD_BUTTONS_COUNT, clicked = {};
        for (let i = 1; i <= count; i++) clicked[`ad${i}`] = false;
        
        let btns = ''; const colors = ['ad-r', 'ad-b', 'ad-o', 'ad-g'];
        for (let i = 1; i <= count; i++) {
            btns += `<button class="ad-gate-btn ${colors[i-1] || colors[0]}" data-id="ad${i}" style="padding:8px; margin:3px; cursor:pointer; border-radius:5px; border:none; color:#fff;">إعلان ${i}</button>`;
        }
        
        txtEl.html(`
            <div style="text-align:center;">
                <p style="color:#ffeb3b; font-size:14px; margin-bottom:10px;">اضغط لفتح المشغل:</p>
                <div style="display:flex; gap:5px; justify-content:center; flex-wrap:wrap;">${btns}</div>
                <div id="final-unlock" style="display:none; margin-top:15px;">
                    <button id="play-now" class="siwane-episode-btn" style="width:100%; background:var(--linkC); color:#fff; padding:10px; border:none; cursor:pointer;">تشغيل الفيديو الآن</button>
                </div>
            </div>
        `);
        
        $(".ad-gate-btn").click(function() {
            const id = $(this).data("id");
            if (params.AD_LINKS[id]) window.open(params.AD_LINKS[id], '_blank');
            $(this).css("opacity", "0.5").prop('disabled', true);
            clicked[id] = true;
            if (Object.values(clicked).every(v => v)) $("#final-unlock").fadeIn();
        });
        
        $("#play-now").click(function() {
            txtEl.text("مشاهدة ممتعة!");
            setTimeout(() => { $("#siwane-countdown-display").hide(); $("#siwane-video-frame").attr("src", playerUrl).show(); }, 500);
        });
    }
}));
