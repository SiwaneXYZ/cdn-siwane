$(document).ready((function() {
    // 1. الإعدادات والتهيئات العامة
    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        WORKER_URL = "https://secure-player.mnaht00.workers.dev";

    let countdownInterval = null;

    // دالة ذكية لتنظيف العناوين ومنع تكرار كلمة "مسلسل"
    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    // --- نظام حماية الوصول (التوكن) ---
    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag;

    if ("watch" === mode && canViewContent) {
        handleWatchRoute();
    } else if ("watch" === mode && !canViewContent) {
        console.warn("Direct access blocked. Secure mode active.");
    } else {
        // تشغيل وضع اللوبي (التحقق البشري الثلاثي)
        initializeLobbyWithProtection(config);
    }

    // ==========================================
    // 🛡️ الجزء الأول: حماية اللوبي وتخصيص الواجهة
    // ==========================================
    function initializeLobbyWithProtection(config) {
        const lobbyElement = $("#siwane-lobby");
        if (lobbyElement.length === 0 || !config.GAS_URL) return;

        const rawSheet = lobbyElement.data("sheet");
        const movie = lobbyElement.data("movie");
        const cleanName = formatTitle(rawSheet);

        let actionText = movie ? `مشاهدة فيلم: ${movie}` : `استعراض حلقات: ${cleanName}`;
        let headerText = movie ? `بوابة الفيلم` : `قائمة الحلقات`;

        lobbyElement.html(`
            <div class="siwane-container" id="siwane-auth-wrapper">
                <div class="siwane-server-container" style="text-align:center;">
                    <h2>${headerText}</h2>
                    <div style="padding: 20px 0;">
                        <a href="javascript:void(0)" id="activate-trigger" class="button ln" style="width:100%; text-align:center; display:block; max-width:350px; margin: 0 auto;">
                           <i class="fa fa-play-circle"></i> ${actionText}
                        </a>
                    </div>
                    <p id="scroll-msg" style="display:none; color: #d35400; font-weight: bold; font-size: 13px;">
                        <i class="fa fa-mouse-pointer"></i> يرجى التمرير للأسفل لتأمين المحتوى...
                    </p>
                </div>
            </div>
        `);

        $("#activate-trigger").click(function(e) {
            e.preventDefault();
            $(this).fadeOut(200);
            $("#scroll-msg").fadeIn();

            let scrollTriggered = false;
            $(window).on('scroll.siwaneAuth', function() {
                if (!scrollTriggered) {
                    scrollTriggered = true;
                    $("#scroll-msg").html('<i class="fa fa-spinner fa-spin"></i> جاري جلب البيانات المشفرة...');
                    setTimeout(function() {
                        $("#siwane-auth-wrapper").fadeOut(300, function() {
                            if (movie) loadMovieLobby(rawSheet, movie, lobbyElement, config);
                            else loadSeriesLobby(rawSheet, lobbyElement, config);
                        });
                        $(window).off('scroll.siwaneAuth');
                    }, 2000);
                }
            });
        });
    }

    // ==========================================
    // 📺 الجزء الثاني: عرض الحلقات (حل مشكلة "الأخيرة" والتكرار)
    // ==========================================
    function loadSeriesLobby(sheet, container, config) {
        const cleanName = formatTitle(sheet);
        container.html('<div class="siwane-container"><p class="note">جاري تحميل القائمة...</p></div>');
        $.ajax({
            url: `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`,
            type: "GET", dataType: "json",
            success: function(response) {
                if (response.episodes && response.episodes.length > 0) {
                    // ميزة التنقية: إزالة التكرار (6 سيرفرات لكل حلقة) والحفاظ على ترتيب الحلقات
                    const uniqueEpisodes = [...new Set(response.episodes.filter(e => e !== null && e !== ""))];
                    
                    let html = `<div class="siwane-container"><div class="siwane-episodes-container"><h2>حلقات المسلسل ${cleanName}</h2><div class="siwane-episodes-grid">`;
                    
                    uniqueEpisodes.forEach(ep => {
                        // المنطق الذكي: إذا كان النص يحتوي على "الأخيرة"، يعرضه كما هو. وإذا كان رقماً، يضيف "الحلقة".
                        let btnLabel = (ep.toString().includes("الأخيرة")) ? ep : `الحلقة ${ep}`;
                        html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${ep}', 'series')">${btnLabel}</div>`;
                    });
                    
                    html += `</div></div></div>`;
                    window.siwaneRedirect = (s, e, t) => redirectToWatchPage(s, e, t);
                    container.hide().html(html).fadeIn(600);
                }
            }
        });
    }

    function loadMovieLobby(sheet, movieTitle, container, config) {
        container.html(`<div class="siwane-container"><div class="siwane-episodes-container"><h2>${movieTitle}</h2><div class="siwane-episodes-grid" style="grid-template-columns:1fr;"><div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${movieTitle}', 'movie')">شاهد الفيلم الآن</div></div></div></div>`);
        window.siwaneRedirect = (s, t, ty) => redirectToWatchPage(s, t, ty);
    }

    // ==========================================
    // 🔗 الجزء الثالث: نظام التحويل والذاكرة الذكية
    // ==========================================
    async function redirectToWatchPage(sheet, id, type) {
        try {
            const response = await fetch("/feeds/posts/summary?alt=json&max-results=150");
            const data = await response.json();
            if (data.feed.entry) {
                const randomPost = data.feed.entry[Math.floor(Math.random() * data.feed.entry.length)];
                const postUrl = randomPost.link.find(link => link.rel === "alternate").href;
                sessionStorage.setItem("siwane_access_token", "true"); 
                const sep = postUrl.includes("?") ? "&" : "?";
                // نرسل القيمة كما هي (سواء كانت رقماً أو "الأخيرة") لضمان مطابقتها في الشيت لاحقاً
                window.location.href = `${postUrl}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}&${type==='movie'?'movie':'ep'}=${encodeURIComponent(id)}`;
            }
        } catch (e) { alert("خطأ في التحويل."); }
    }

    function handleWatchRoute() {
        const sheet = urlParams.get("sheet"), ep = urlParams.get("ep"), movie = urlParams.get("movie");
        const id = movie ? decodeURIComponent(movie) : ep;
        if (sheet && config.GAS_URL) {
            const params = {
                GAS_URL: config.GAS_URL, COUNTDOWN: config.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheet), TYPE: movie ? "movie" : "series",
                ID: id, AD_LINKS: config.AD_LINKS || {}, AD_BUTTONS_COUNT: config.AD_BUTTONS_COUNT || 3
            };
            initializeWatchPage(params);

            // استعادة السيرفر تلقائياً (الذاكرة الذكية) لضمان عدم ضياع المشغل عند العودة
            const lastSession = sessionStorage.getItem("siwane_last_server");
            if (lastSession) {
                const data = JSON.parse(lastSession);
                if (data.sheet === params.SHEET && data.id === params.ID) {
                    setTimeout(() => { $(`.siwane-server-btn[data-id="${data.serverId}"]`).trigger('click'); }, 1200);
                }
            }
        }
    }

    function playSelectedServer(serverId, params) {
        if (countdownInterval) clearInterval(countdownInterval);
        
        // حفظ بيانات الجلسة الحالية
        sessionStorage.setItem("siwane_last_server", JSON.stringify({ sheet: params.SHEET, id: params.ID, serverId: serverId }));

        $("#siwane-countdown-text").text("جاري تأمين الاتصال بالسيرفر...");
        $("#siwane-countdown-display").css("display", "flex");
        $("#siwane-video-frame").hide();
        
        $.ajax({
            url: `${WORKER_URL}/get-secure-player`,
            data: { sheet: params.SHEET, id: serverId },
            type: "GET", dataType: "json",
            success: function(res) {
                if (res.realUrl) {
                    const enc = btoa(res.realUrl).split("").reverse().join("");
                    startCountdownAndAds(createSecurePlayer(enc), params);
                }
            }
        });
    }

    // ==========================================
    // 🎬 الجزء الرابع: صفحة المشاهدة والجسيمات والبوابة الإعلانية
    // ==========================================
    function initializeWatchPage(params) {
        const container = $(".post-body, .entry-content, #post-body").first();
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        document.title = `مشاهدة ${title}`;
        container.prepend(`<div class="siwane-container"><header class="siwane-header"><h1>${title}</h1></header><div class="siwane-server-container"><h2>اختر السيرفر</h2><div id="siwane-servers-grid" class="siwane-servers-grid loading-state"></div></div></div>`);
        container.append(`<div class="siwane-container"><div class="siwane-video-container"><h2>شاشة العرض</h2><div id="siwane-countdown-display" style="display:none;"><div id="siwane-particles-container" class="siwane-particles-container"></div><div id="siwane-countdown-text"></div><div id="siwane-countdown"></div></div><iframe id="siwane-video-frame" style="display:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe><a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا للدعم واستمر بالمشاهدة</a></div></div>`);
        loadServers(params);
        for(let i=0; i<20; i++) $("#siwane-particles-container").append($('<div class="siwane-particle"></div>').css({left:Math.random()*100+"%",top:Math.random()*100+"%",animationDuration:(Math.random()*3+2)+"s"}));
    }

    function loadServers(params) {
        const grid = $("#siwane-servers-grid");
        // نرسل params.ID كما هو (سواء كان رقماً أو نص "الأخيرة") لمطابقته في الشيت
        let q = `contentSheetName=${encodeURIComponent(params.SHEET)}&${params.TYPE==="movie" ? `movieTitle=${encodeURIComponent(params.ID)}` : `episodeNumber=${encodeURIComponent(params.ID)}`}`;
        $.ajax({
            url: `${params.GAS_URL}?${q}`, type: "GET", dataType: "json",
            success: function(servers) {
                grid.removeClass("loading-state").empty();
                if(servers && servers.length > 0) {
                    servers.forEach(s => {
                        const btn = $(`<div class="siwane-server-btn" data-id="${s.id}"><span>${s.icon || '🔗'}</span> <span>${s.title}</span></div>`);
                        btn.click(function() { $(".siwane-server-btn").removeClass("active"); $(this).addClass("active"); playSelectedServer(s.id, params); });
                        grid.append(btn);
                    });
                } else { grid.html('<p class="error">لا توجد سيرفرات متاحة لهذه الحلقة حالياً.</p>'); }
            }
        });
    }

    function createSecurePlayer(enc) {
        return URL.createObjectURL(new Blob([`<html><body style="margin:0;background:#000;overflow:hidden;"><div id="c" style="width:100vw;height:100vh;"></div><script>(function(){var a="www.athar.news",h="";try{h=window.parent.location.hostname}catch(e){h="blocked"}if(h!==a&&h!=="athar.news"){document.getElementById("c").innerHTML='<div style="color:red;text-align:center;padding-top:20vh;">Security Block</div>'}else{var k="${enc}",r=atob(k.split('').reverse().join(''));document.getElementById("c").innerHTML='<iframe src="'+r+'" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>'}})();<\/script></body></html>`],{type:"text/html"}));
    }

    function startCountdownAndAds(url, params) {
        let count = params.COUNTDOWN;
        $("#siwane-countdown-text").text("جاري تحضير بيئة المشاهدة...");
        countdownInterval = setInterval(() => {
            $("#siwane-countdown").text(count); count--;
            if(count<0){ clearInterval(countdownInterval); $("#siwane-countdown").hide(); showAdGate(url, params); }
        }, 1000);
    }

    function showAdGate(url, params) {
        const txt = $("#siwane-countdown-text"), clicked = {};
        let btns = ''; const colors = ['ad-r','ad-b','ad-o','ad-g'];
        for(let i=1; i<=params.AD_BUTTONS_COUNT; i++) {
            clicked[`ad${i}`] = false;
            btns += `<button class="ad-gate-btn ${colors[i-1]||colors[0]}" data-id="ad${i}" style="padding:8px;margin:3px;cursor:pointer;border:none;color:#fff;border-radius:5px;">إعلان ${i}</button>`;
        }
        txt.html(`<div style="text-align:center;"><p style="color:#ffeb3b;margin-bottom:10px;">اضغط على ازرار الاعلانات لفتح المشغل:</p><div style="display:flex;justify-content:center;flex-wrap:wrap;">${btns}</div><div id="final-unlock" style="display:none;margin-top:15px;"><button id="play-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;padding:10px;border:none;cursor:pointer;">تشغيل الفيديو الآن</button></div></div>`);
        $(".ad-gate-btn").click(function(){ 
            const id = $(this).data("id"); if(params.AD_LINKS[id]) window.open(params.AD_LINKS[id],'_blank'); 
            $(this).css("opacity","0.5").prop('disabled',true); clicked[id]=true;
            if(Object.values(clicked).every(v=>v)) $("#final-unlock").fadeIn();
        });
        $("#play-now").click(() => { txt.text("مشاهدة ممتعة!"); setTimeout(() => { $("#siwane-countdown-display").hide(); $("#siwane-video-frame").attr("src",url).show(); }, 500); });
    }
}));
