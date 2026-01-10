$(document).ready(function() {
    console.log("Movi_link.js Loaded Successfully");

    const globalConfig = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // 1. تحديد وضع التشغيل (مشاهدة أو تصفح)
    if (mode === 'watch') {
        const sheetName = urlParams.get('sheet');
        const episode = urlParams.get('ep');
        const movie = urlParams.get('movie');
        
        if (sheetName && globalConfig.GAS_URL) {
            const playerConfig = {
                GAS_URL: globalConfig.GAS_URL,
                COUNTDOWN: globalConfig.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheetName),
                TYPE: movie ? 'movie' : 'series',
                ID: movie ? decodeURIComponent(movie) : episode
            };
            
            if(playerConfig.ID) {
                injectWatchInterface(playerConfig);
            }
        }
    } else {
        const lobby = $('#siwane-lobby');
        if (lobby.length > 0 && globalConfig.GAS_URL) {
            const sheetName = lobby.data('sheet');
            const movieTitle = lobby.data('movie');

            if (sheetName) {
                if (movieTitle) {
                    initMovieLobby(sheetName, movieTitle, lobby);
                } else {
                    initSeriesLobby(globalConfig.GAS_URL, sheetName, lobby);
                }
            }
        }
    }

    // --- دوال اللوبي ---
    function initSeriesLobby(gasUrl, sheetName, container) {
        container.html('<p class="note">جاري جلب الحلقات...</p>');
        $.ajax({
            url: `${gasUrl}?contentSheetName=${encodeURIComponent(sheetName)}&action=getEpisodes`,
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.episodes && res.episodes.length > 0) {
                    let html = `<div class="siwane-episodes-container"><h2>حلقات ${sheetName}</h2><div class="siwane-episodes-grid">`;
                    res.episodes.forEach(ep => {
                        if (ep !== null && ep !== "null" && !isNaN(ep)) {
                            html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheetName}', '${ep}', 'series')">الحلقة ${ep}</div>`;
                        }
                    });
                    html += `</div></div>`;
                    window.siwaneRedirect = (s, id, type) => redirectToRandom(s, id, type);
                    container.html(html);
                } else {
                    container.html('<p class="note wr">لا توجد حلقات متاحة.</p>');
                }
            },
            error: function() { container.html('خطأ في الاتصال.'); }
        });
    }

    function initMovieLobby(sheetName, movieTitle, container) {
        let html = `<div class="siwane-episodes-container"><h2>${movieTitle}</h2><div class="siwane-episodes-grid" style="grid-template-columns: 1fr;"><div class="siwane-episode-btn" onclick="siwaneRedirect('${sheetName}', '${movieTitle}', 'movie')">شاهد الآن</div></div></div>`;
        window.siwaneRedirect = (s, id, type) => redirectToRandom(s, id, type);
        container.html(html);
    }

    async function redirectToRandom(sheet, id, type) {
        try {
            let r = await fetch('/feeds/posts/summary?alt=json&max-results=150');
            let d = await r.json();
            let posts = d.feed.entry;
            if (posts && posts.length > 0) {
                let rnd = posts[Math.floor(Math.random() * posts.length)];
                let link = rnd.link.find(l => l.rel === 'alternate').href;
                let sep = link.includes('?') ? '&' : '?';
                let typeParam = (type === 'movie') ? `&movie=${encodeURIComponent(id)}` : `&ep=${id}`;
                window.location.href = `${link}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}${typeParam}`;
            }
        } catch(e) { alert('خطأ في التحويل.'); }
    }

    // --- واجهة المشاهدة ---
    function injectWatchInterface(config) {
        const postBody = $('.post-body, .entry-content, #post-body').first();
        if (postBody.length === 0) return;

        let displayTitle = (config.TYPE === 'movie') ? config.ID : `${config.SHEET} - الحلقة ${config.ID}`;
        document.title = `مشاهدة ${displayTitle}`;

        const topHtml = $(`
            <div class="siwane-container">
                <header class="siwane-header"><h1>${displayTitle}</h1></header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state"><p>جاري تحميل السيرفرات...</p></div>
                </div>
            </div>
        `);

        const bottomHtml = $(`
            <div class="siwane-container">
                <div class="siwane-video-container">
                    <h2>شاشة العرض</h2>
                    <div id="siwane-countdown-display">
                        <div class="siwane-particles-container" id="siwane-particles-container"></div>
                        <div id="siwane-countdown-text">الرجاء اختيار سيرفر للبدء</div>
                        <div id="siwane-countdown"></div>
                    </div>
                    <iframe id="siwane-video-frame" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                </div>
            </div>
        `);

        postBody.prepend(topHtml);
        postBody.append(bottomHtml);
        createParticles();
        loadServers(config);
    }

    function loadServers(config) {
        const grid = $("#siwane-servers-grid");
        let params = `contentSheetName=${encodeURIComponent(config.SHEET)}`;
        if (config.TYPE === 'movie') params += `&movieTitle=${encodeURIComponent(config.ID)}`;
        else params += `&episodeNumber=${config.ID}`;

        $.ajax({
            url: `${config.GAS_URL}?${params}`,
            type: 'GET',
            dataType: 'json',
            success: function(servers) {
                grid.removeClass('loading-state').empty();
                if (!servers || servers.length === 0) {
                    grid.html('<p style="color:red">لا توجد سيرفرات.</p>');
                    return;
                }
                servers.forEach(s => {
                    const btn = $(`<div class="siwane-server-btn" data-id="${s.id}"><span>${s.icon}</span> <span>${s.title}</span></div>`);
                    
                    // إضافة حدث النقر
                    btn.click(function() {
                        console.log("تم النقر على السيرفر:", s.id); // Debug
                        $('.siwane-server-btn').removeClass('active');
                        $(this).addClass('active');
                        // استدعاء دالة التشغيل الآمن
                        decryptAndPlay($(this).data('id'), config);
                    });
                    grid.append(btn);
                });
            },
            error: function() { grid.html('<p>خطأ في الاتصال.</p>'); }
        });
    }

    // --- التشغيل الآمن عبر Cloudflare Worker ---
    function decryptAndPlay(serverId, config) {
        console.log("Start decryptAndPlay for Server ID:", serverId);
        
        $("#siwane-video-frame").hide();
        $("#siwane-countdown-display").css('display', 'flex');
        $("#siwane-countdown-text").text("جاري تأمين الاتصال...");

        // ✅ تم وضع رابط الوركر الخاص بك هنا بشكل صحيح
        const CLOUDFLARE_WORKER_URL = 'https://secure-player.mnaht00.workers.dev'; 

        $.ajax({
            url: `${CLOUDFLARE_WORKER_URL}/get-secure-player`,
            data: {
                sheet: config.SHEET,
                id: serverId
            },
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                console.log("Worker Response:", res); // Debug

                if (res.html) {
                    try {
                        const blob = new Blob([res.html], { type: 'text/html' });
                        const blobUrl = URL.createObjectURL(blob);
                        console.log("Blob Created:", blobUrl);
                        startCountdown(blobUrl, config.COUNTDOWN);
                    } catch (e) {
                        console.error("Blob Error:", e);
                        $("#siwane-countdown-text").text("خطأ في المتصفح (Blob).");
                    }
                } else {
                    console.error("Worker Error:", res);
                    $("#siwane-countdown-text").text("عذراً، الفيديو غير متاح.");
                }
            },
            error: function(xhr, status, error) {
                console.error("AJAX Error:", status, error);
                console.log("Response Text:", xhr.responseText);
                $("#siwane-countdown-text").text("خطأ في الاتصال بالخادم الآمن.");
            }
        });
    }

    function startCountdown(url, duration) {
        createParticles();
        let c = duration;
        const num = $("#siwane-countdown");
        const txt = $("#siwane-countdown-text");
        
        txt.text("جاري تحضير المشغل...");
        $('html, body').animate({ scrollTop: $(".siwane-video-container").offset().top - 20 }, 800);

        const iv = setInterval(() => {
            num.text(c);
            c--;
            if (c < 0) {
                clearInterval(iv);
                num.text("");
                txt.text("مشاهدة ممتعة!");
                setTimeout(() => {
                    $("#siwane-countdown-display").hide();
                    
                    // تنظيف الذاكرة
                    const oldSrc = $("#siwane-video-frame").attr("src");
                    if(oldSrc && oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);

                    $("#siwane-video-frame").attr("src", url).show();
                }, 1000);
            }
        }, 1000);
    }

    function createParticles() {
        const con = $("#siwane-particles-container");
        con.empty();
        for (let i = 0; i < 50; i++) {
            const p = $('<div class="siwane-particle"></div>');
            p.css({
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDuration: (Math.random() * 4 + 3) + 's',
                animationDelay: (Math.random() * 2) + 's'
            });
            con.append(p);
        }
    }
});
