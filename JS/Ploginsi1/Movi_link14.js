$(document).ready((function() {
    // 1. الإعدادات العامة (لم يتم تغيير أي وظيفة)
    const config = window.siwaneGlobalConfig || {},
        urlParams = new URLSearchParams(window.location.search),
        mode = urlParams.get("mode"),
        WORKER_URL = "https://secure-player.mnaht00.workers.dev";

    let countdownInterval = null;

    const formatTitle = (text) => text ? text.trim().replace(/^مسلسل\s+/i, "") : "";

    const isInternalNavigation = document.referrer.indexOf(window.location.hostname) !== -1;
    const hasAccessFlag = sessionStorage.getItem("siwane_access_token") === "true";
    const canViewContent = isInternalNavigation || hasAccessFlag;

    // تعريف الأيقونات كمتغيرات SVG لتوفير المساحة وتسهيل الاستخدام
    const icons = {
        play: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="vertical-align:middle;margin-left:8px;"><path d="M8 5v14l11-7z"/></svg>`,
        spinner: `<svg viewBox="0 0 50 50" class="siwane-spin" width="16" height="16" style="vertical-align:middle;margin-left:5px;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-linecap="round"></circle></svg>`,
        hand: `<svg viewBox="0 0 104.31 122.88" class="siwane-hand-swipe"><path d="M25.85,63.15c-0.04-0.12-0.08-0.28-0.1-0.42c-0.22-1.89-0.43-3.98-0.62-5.78c-0.26-2.64-0.55-5.69-0.76-7.83 c-0.14-1.45-0.6-2.83-1.27-3.86c-0.45-0.66-0.95-1.15-1.51-1.39c-0.45-0.18-1-0.2-1.57,0.02c-0.78,0.3-1.65,0.93-2.62,2.03 c-0.86,0.98-1.53,2.29-2.09,3.68c-0.79,2.03-1.26,4.19-1.45,5.67c-0.02,0.1-0.02,0.18-0.06,0.26L8.42,86.07 c-0.08,0.4-0.24,0.76-0.48,1.04c-1.81,2.33-2.95,4.33-3.28,5.95c-0.24,1.19,0,2.15,0.79,2.9l19.8,19.8 c1.26,1.21,2.72,1.97,4.47,2.29c1.91,0.36,4.14,0.16,6.7-0.54c0.04,0,0.1-0.02,0.14-0.02c0.97-0.26,2.24-0.57,3.46-0.88 c5.31-1.29,9.94-2.43,14.23-6.33l5.52-5.76c0.05-0.1,0.14-0.18,0.22-0.26s0.62-0.62,1.35-1.31c3.78-3.69,8.45-8.25,5.61-12.24 l-2.21-2.21c-1.07,1.04-2.21,2.05-3.3,3.02c-1,0.88-1.93,1.69-2.78,2.55c-0.91,0.91-2.38,0.91-3.3,0c-0.91-0.92-0.91-2.38,0-3.3 c0.86-0.86,1.91-1.79,3-2.76c3.74-3.3,8.03-7.07,5.73-10.38l-2.19-2.19c-0.12-0.12-0.22-0.26-0.31-0.4c-1.26,1.29-2.64,2.52-4,3.72 c-1,0.88-1.93,1.69-2.78,2.55c-0.91,0.91-2.38,0.91-3.3,0s-0.91-2.38,0-3.3c0.86-0.86,1.91-1.79,3-2.76 c3.74-3.3,8.03-7.07,5.73-10.38l-2.19-2.19c-0.16-0.16-0.28-0.31-0.38-0.5l-6.42,6.42c-0.91,0.91-2.38,0.91-3.3,0s-0.91-2.38,0-3.3 l17.22-17.25c2.88-2.88,3.54-5.88,2.78-8.15c-0.28-0.83-0.74-1.57-1.31-2.14s-1.31-1.03-2.14-1.31c-2.24-0.74-5.23-0.06-8.19,2.9 l-30.2,30.2c-0.91,0.91-2.38,0.91-3.3,0s-0.91-2.38,0-3.3l3.07-3.07L25.85,63.15L25.85,63.15L25.85,63.15z M83.23,24.31 c-1.22,1.3-3.24,1.34-4.52,0.14c-1.3-1.22-1.34-3.24-0.14-4.52l8.82-9.39c1.22-1.3,3.25-1.34,4.52-0.14 c1.3,1.22,1.34,3.24,0.14,4.52L83.23,24.31L83.23,24.31L83.23,24.31L83.23,24.31z M43.96,23.65c1.3,1.22,1.34,3.25,0.14,4.52 c-1.22,1.3-3.25,1.34-4.52,0.14l-9.4-8.82c-1.29-1.23-1.33-3.25-0.14-4.52c1.22-1.3,3.25-1.34,4.52-0.14L43.96,23.65L43.96,23.65 L43.96,23.65z M63.69,15.96c0.05,1.76-1.34,3.24-3.09,3.3s-3.24-1.34-3.3-3.09L56.91,3.3c-0.06-1.75,1.34-3.24,3.09-3.3 c1.76-0.05,3.24,1.34,3.29,3.09L63.69,15.96L63.69,15.96L63.69,15.96z M76.88,63.31c-1.3-1.22-1.34-3.25-0.14-4.52 c1.22-1.3,3.24-1.34,4.52-0.14l9.39,8.82c1.3,1.22,1.34,3.24,0.14,4.52c-1.22,1.3-3.24,1.34-4.52,0.14L76.88,63.31L76.88,63.31 L76.88,63.31z M88.36,44.35c-1.75,0.06-3.24-1.34-3.3-3.09c-0.05-1.75,1.34-3.24,3.09-3.3l12.86-0.43c1.75-0.06,3.24,1.34,3.3,3.09 s-1.34,3.24-3.09,3.3L88.36,44.35L88.36,44.35L88.36,44.35z M60.88,58.97c0.17,0.1,0.34,0.22,0.5,0.38l2.29,2.29 c0.12,0.12,0.24,0.28,0.34,0.42c2.57,3.52,2.17,6.66,0.42,9.52c0.31,0.12,0.62,0.29,0.86,0.54l2.29,2.29 c0.12,0.12,0.24,0.28,0.34,0.42c2.76,3.8,2.07,7.12,0,10.14c0.1,0.05,0.17,0.14,0.28,0.24l2.29,2.29c0.12,0.12,0.24,0.28,0.34,0.42 c5.31,7.26-1.02,13.42-6.1,18.39l-1.31,1.31l-5.67,5.95l-0.18,0.17c-5.19,4.71-10.33,5.97-16.28,7.42c-1,0.24-2,0.5-3.4,0.86 c-0.04,0-0.06,0.02-0.1,0.02c-3.22,0.88-6.14,1.09-8.76,0.62c-2.66-0.48-4.97-1.67-6.9-3.56L2.31,99.29 c-2-1.93-2.69-4.31-2.12-7.14c0.43-2.26,1.75-4.77,3.81-7.47L9.3,54.74v-0.12c0.24-1.71,0.78-4.24,1.71-6.68 c0.71-1.83,1.67-3.62,2.92-5.07c1.51-1.71,3-2.76,4.47-3.32c1.81-0.69,3.54-0.6,5.07,0.06c1.43,0.6,2.64,1.69,3.56,3.08 c1.12,1.67,1.85,3.8,2.05,6.02c0.16,1.83,0.48,4.85,0.78,7.81l0.24,2.47L53,36.07c4.4-4.4,9.16-5.27,12.97-4.02 c1.53,0.5,2.88,1.33,4,2.45s1.95,2.47,2.45,4c1.26,3.8,0.4,8.63-3.92,12.95l-7.59,7.59L60.88,58.97L60.88,58.97L60.88,58.97z"/></svg>`
    };

    if ("watch" === mode && canViewContent) {
        handleWatchRoute();
    } else if ("watch" === mode && !canViewContent) {
        console.warn("Direct access blocked.");
    } else {
        initializeLobbyWithProtection(config);
    }

    // ==========================================
    // 🛡️ حماية اللوبي (تحسين الواجهة بالكامل بـ SVG)
    // ==========================================
    function initializeLobbyWithProtection(config) {
        const lobbyElement = $("#siwane-lobby");
        if (lobbyElement.length === 0 || !config.GAS_URL) return;

        const rawSheet = lobbyElement.data("sheet");
        const movie = lobbyElement.data("movie");
        const cleanName = formatTitle(rawSheet);

        let actionText = movie ? `بدء مشاهدة فيلم: ${movie}` : `استعراض حلقات: مسلسل ${cleanName}`;
        let headerText = movie ? `بوابة الفيلم` : `قائمة الحلقات`;

        // إضافة حركات الـ SVG عبر CSS
        const style = `
            <style>
                .siwane-flex-box { min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                @keyframes siwane-spin { to { transform: rotate(360deg); } }
                .siwane-spin { animation: siwane-spin 0.8s linear infinite; }
                @keyframes siwane-swipe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
                .siwane-hand-swipe { animation: siwane-swipe 1s infinite ease-in-out; margin-bottom: 10px; }
            </style>
        `;

        lobbyElement.html(style + `
            <div class="siwane-container" id="siwane-auth-wrapper">
                <div class="siwane-server-container" style="text-align:center;">
                    <h2>${headerText}</h2>
                    <div class="siwane-flex-box">
                        <div id="siwane-btn-zone" style="width:100%;">
                            <div style="padding: 20px 0;">
                                <a href="javascript:void(0)" id="activate-trigger" class="button ln" style="width:100%; text-align:center; display:block; max-width:350px; margin: 0 auto;">
                                   ${icons.play} ${actionText}
                                </a>
                            </div>
                        </div>
                        <div id="siwane-scroll-zone" style="display:none;">
                            ${icons.hand}
                            <p id="scroll-msg" style="color: #d35400; font-weight: bold; font-size: 13px; margin: 0;">
                                يرجى التمرير للأسفل قليلاً لتأمين المحتوى...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $("#activate-trigger").click(function(e) {
            e.preventDefault();
            $("#siwane-btn-zone").hide();
            $("#siwane-scroll-zone").fadeIn(200);

            let scrollTriggered = false;
            $(window).on('scroll.siwaneAuth', function() {
                if (!scrollTriggered) {
                    scrollTriggered = true;
                    $("#scroll-msg").html(`${icons.spinner} جاري استخراج البيانات...`);
                    $(".siwane-hand-swipe").fadeOut(100);

                    setTimeout(function() {
                        $("#siwane-auth-wrapper").fadeOut(300, function() {
                            if (movie) loadMovieLobby(rawSheet, movie, lobbyElement, config);
                            else loadSeriesLobby(rawSheet, lobbyElement, config);
                        });
                        $(window).off('scroll.siwaneAuth');
                    }, 1500);
                }
            });
        });
    }

    // ==========================================
    // 📺 وظائف جلب المحتوى (الحفاظ على الأداء الأصلي)
    // ==========================================
    function loadSeriesLobby(sheet, container, config) {
        const cleanName = formatTitle(sheet);
        container.html(`<div class="siwane-container" style="text-align:center;"><p class="note"> ${icons.spinner} جاري تحميل القائمة...</p></div>`);
        $.ajax({
            url: `${config.GAS_URL}?contentSheetName=${encodeURIComponent(sheet)}&action=getEpisodes`,
            type: "GET", dataType: "json",
            success: function(response) {
                if (response.episodes && response.episodes.length > 0) {
                    const uniqueEpisodes = [...new Set(response.episodes.filter(e => e !== null && e !== "" && e !== "---"))];
                    let html = `<div class="siwane-container"><div class="siwane-episodes-container"><h2>حلقات مسلسل ${cleanName}</h2><div class="siwane-episodes-grid">`;
                    uniqueEpisodes.forEach(ep => {
                        let btnLabel = (ep.toString().includes("الأخيرة")) ? ep : `الحلقة ${ep}`;
                        html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${ep}', 'series')">${btnLabel}</div>`;
                    });
                    html += `</div></div></div>`;
                    window.siwaneRedirect = (s, e, t) => redirectToWatchPage(s, e, t);
                    container.hide().html(html).fadeIn(500);
                }
            }
        });
    }

    function loadMovieLobby(sheet, movieTitle, container, config) {
        container.html(`<div class="siwane-container"><div class="siwane-episodes-container"><h2>${movieTitle}</h2><div class="siwane-episodes-grid" style="grid-template-columns:1fr;"><div class="siwane-episode-btn" onclick="siwaneRedirect('${sheet}', '${movieTitle}', 'movie')">${icons.play} شاهد الآن</div></div></div></div>`);
        window.siwaneRedirect = (s, t, ty) => redirectToWatchPage(s, t, ty);
    }

    // ==========================================
    // الذاكرة والمشغل (لم يتغير شيء في المنطق)
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
            const saved = sessionStorage.getItem("siwane_last_server");
            if (saved) {
                const data = JSON.parse(saved);
                if (data.sheet === params.SHEET && data.id === params.ID) {
                    setTimeout(() => { $(`.siwane-server-btn[data-id="${data.serverId}"]`).click(); }, 1200);
                }
            }
        }
    }

    function playSelectedServer(serverId, params) {
        if (countdownInterval) clearInterval(countdownInterval);
        sessionStorage.setItem("siwane_last_server", JSON.stringify({ sheet: params.SHEET, id: params.ID, serverId: serverId }));
        $("html, body").animate({ scrollTop: $(".siwane-video-container").offset().top - 20 }, 800);
        $("#siwane-countdown-text").html(`${icons.spinner} جاري تأمين المشغل...`);
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

    function initializeWatchPage(params) {
        const container = $(".post-body, .entry-content, #post-body").first();
        const title = params.TYPE === "movie" ? params.ID : `${params.SHEET} - الحلقة ${params.ID}`;
        document.title = `مشاهدة ${title}`;
        container.prepend(`<div class="siwane-container"><header class="siwane-header"><h1>${title}</h1></header><div class="siwane-server-container"><h2>اختر السيرفر</h2><div id="siwane-servers-grid" class="siwane-servers-grid"></div></div></div>`);
        container.append(`<div class="siwane-container"><div class="siwane-video-container"><h2>شاشة العرض</h2><div id="siwane-countdown-display" style="display:none;"><div id="siwane-particles-container" class="siwane-particles-container"></div><div id="siwane-countdown-text"></div><div id="siwane-countdown"></div></div><iframe id="siwane-video-frame" style="display:none;" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe><a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا للدعم والمشاهدة</a></div></div>`);
        loadServers(params);
        createParticles();
    }

    function createParticles() {
        const container = $("#siwane-particles-container");
        container.empty();
        for (let i = 0; i < 30; i++) {
            const particle = $('<div class="siwane-particle"></div>');
            particle.css({ left: (Math.random() * 100) + "%", top: (Math.random() * 100) + "%", animationDuration: (Math.random() * 4 + 3) + "s" });
            container.append(particle);
        }
    }

    function loadServers(params) {
        const grid = $("#siwane-servers-grid");
        grid.html(`<p style="text-align:center;width:100%;">${icons.spinner} جاري جلب السيرفرات...</p>`);
        let q = `contentSheetName=${encodeURIComponent(params.SHEET)}&${params.TYPE==="movie" ? `movieTitle=${encodeURIComponent(params.ID)}` : `episodeNumber=${encodeURIComponent(params.ID)}`}`;
        $.ajax({
            url: `${params.GAS_URL}?${q}`, type: "GET", dataType: "json",
            success: function(servers) {
                grid.empty();
                servers.forEach(s => {
                    const btn = $(`<div class="siwane-server-btn" data-id="${s.id}"><span>${s.icon || '🔗'}</span> <span>${s.title}</span></div>`);
                    btn.click(function() { $(".siwane-server-btn").removeClass("active"); $(this).addClass("active"); playSelectedServer(s.id, params); });
                    grid.append(btn);
                });
            }
        });
    }

    function createSecurePlayer(enc) {
        return URL.createObjectURL(new Blob([`<html><body style="margin:0;background:#000;"><script>var k="${enc}",r=atob(k.split('').reverse().join(''));document.write('<iframe src="'+r+'" style="width:100vw;height:100vh;border:none;" allowfullscreen></iframe>');<\/script></body></html>`],{type:"text/html"}));
    }

    function startCountdownAndAds(url, params) {
        let count = params.COUNTDOWN;
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
        txt.html(`<div style="text-align:center;"><p style="color:#ffeb3b;">اضغط على ازرار الاعلانات لفتح المشغل:</p>${btns}<div id="final-unlock" style="display:none;margin-top:15px;"><button id="play-now" class="siwane-episode-btn" style="width:100%;background:var(--linkC);color:#fff;padding:10px;border:none;cursor:pointer;">تشغيل الآن</button></div></div>`);
        $(".ad-gate-btn").click(function(){ 
            const id = $(this).data("id"); if(params.AD_LINKS[id]) window.open(params.AD_LINKS[id],'_blank'); 
            $(this).css("opacity","0.5").prop('disabled',true).text("تم الفتح"); clicked[id]=true;
            if(Object.values(clicked).every(v=>v)) $("#final-unlock").fadeIn();
        });
        $("#play-now").click(() => { txt.text("مشاهدة ممتعة!"); setTimeout(() => { $("#siwane-countdown-display").hide(); $("#siwane-video-frame").attr("src",url).show(); }, 500); });
    }
}));
