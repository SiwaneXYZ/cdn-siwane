$(document).ready(function() {
    const globalConfig = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // ==========================================
    // الحالة 1: وضع المشاهدة (Watch Mode)
    // ==========================================
    if (mode === 'watch') {
        const sheetName = urlParams.get('sheet');
        const episode = urlParams.get('ep');     // للمسلسلات
        const movie = urlParams.get('movie');    // للأفلام
        
        if (sheetName && globalConfig.GAS_URL) {
            const playerConfig = {
                GAS_URL: globalConfig.GAS_URL,
                COUNTDOWN: globalConfig.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheetName),
                // تحديد النوع بناءً على البارامتر الموجود
                TYPE: movie ? 'movie' : 'series',
                ID: movie ? decodeURIComponent(movie) : episode
            };
            
            // شرط الأمان: يجب توفر معرف (حلقة أو اسم فيلم)
            if(playerConfig.ID) {
                injectWatchInterface(playerConfig);
            }
        }
    } 
    // ==========================================
    // الحالة 2: وضع اللوبي (Lobby Mode)
    // ==========================================
    else {
        const lobby = $('#siwane-lobby');
        if (lobby.length > 0 && globalConfig.GAS_URL) {
            const sheetName = lobby.data('sheet');
            const movieTitle = lobby.data('movie'); // خاصية جديدة للأفلام

            if (sheetName) {
                if (movieTitle) {
                    // إذا وجد اسم فيلم -> وضع الفيلم
                    initMovieLobby(sheetName, movieTitle, lobby);
                } else {
                    // إذا لم يجد اسم فيلم -> وضع المسلسل (جلب الحلقات)
                    initSeriesLobby(globalConfig.GAS_URL, sheetName, lobby);
                }
            }
        }
    }

    // ---------------------------------------------------------
    // دوال اللوبي للمسلسلات (Series Lobby)
    // ---------------------------------------------------------
    function initSeriesLobby(gasUrl, sheetName, container) {
        container.html('<p class="note">جاري جلب الحلقات...</p>');
        
        $.ajax({
            url: `${gasUrl}?contentSheetName=${encodeURIComponent(sheetName)}&action=getEpisodes`,
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.episodes && res.episodes.length > 0) {
                    let html = `
                    <div class="siwane-episodes-container">
                        <h2>قائمة حلقات ${sheetName}</h2>
                        <div class="siwane-episodes-grid">`;
                    
                    res.episodes.forEach(ep => {
                        if (ep !== null && ep !== "null" && !isNaN(ep)) {
                            html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheetName}', '${ep}', 'series')">الحلقة ${ep}</div>`;
                        }
                    });
                    
                    html += `</div></div>`;
                    window.siwaneRedirect = (s, id, type) => redirectToRandom(s, id, type);
                    container.html(html);
                } else {
                    container.html('<p class="note wr">لا توجد حلقات متاحة.</div>');
                }
            },
            error: function() { container.html('خطأ في الاتصال.'); }
        });
    }

    // ---------------------------------------------------------
    // دوال اللوبي للأفلام (Movie Lobby) - [جديد]
    // ---------------------------------------------------------
    function initMovieLobby(sheetName, movieTitle, container) {
        // عرض زر واحد مباشر لمشاهدة الفيلم
        let html = `
        <div class="siwane-episodes-container">
            <h2>مشاهدة الفيلم</h2>
            <div class="siwane-episodes-grid" style="grid-template-columns: 1fr;">
                <div class="siwane-episode-btn" onclick="siwaneRedirect('${sheetName}', '${movieTitle}', 'movie')">
                    شاهد الفيلم الآن
                </div>
            </div>
        </div>`;
        
        window.siwaneRedirect = (s, id, type) => redirectToRandom(s, id, type);
        container.html(html);
    }

    // ---------------------------------------------------------
    // دالة التحويل العشوائي (الموحدة)
    // ---------------------------------------------------------
    async function redirectToRandom(sheet, id, type) {
        try {
            let r = await fetch('/feeds/posts/summary?alt=json&max-results=150');
            let d = await r.json();
            let posts = d.feed.entry;
            if (posts && posts.length > 0) {
                let rnd = posts[Math.floor(Math.random() * posts.length)];
                let link = rnd.link.find(l => l.rel === 'alternate').href;
                let sep = link.includes('?') ? '&' : '?';
                
                // تحديد البارامتر بناءً على النوع
                let typeParam = (type === 'movie') ? `&movie=${encodeURIComponent(id)}` : `&ep=${id}`;
                
                window.location.href = `${link}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}${typeParam}`;
            }
        } catch(e) { alert('خطأ في التحويل.'); }
    }

    // ---------------------------------------------------------
    // دوال المشاهدة والحقن (Inject Logic)
    // ---------------------------------------------------------
    function injectWatchInterface(config) {
        const postBody = $('.post-body, .entry-content, #post-body').first();
        if (postBody.length === 0) return;

        // صياغة العنوان بناءً على النوع مع تمييز الأنمي
        let displayTitle;
        if (config.TYPE === 'movie') {
            displayTitle = `فيلم: ${config.ID}`;
        } else {
            // تمييز الأنمي من اسم الورقة
            const sheetLower = config.SHEET.toLowerCase();
            const isAnime = sheetLower.includes('انمي') || sheetLower.includes('anime');
            
            displayTitle = isAnime 
                ? `أنمي ${config.SHEET} : الحلقة ${config.ID}`
                : `مسلسل ${config.SHEET} : الحلقة ${config.ID}`;
        }

        document.title = `مشاهدة ${displayTitle}`;

        const topHtml = $(`
            <div class="siwane-container">
                <header class="siwane-header">
                    <h1>${displayTitle}</h1>
                </header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state">
                        <p>جاري تحميل السيرفرات...</p>
                    </div>
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
                    <iframe id="siwane-video-frame" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
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
        
        // [هام]: تكوين الرابط بناءً على النوع ليتوافق مع GAS
        let params = `contentSheetName=${encodeURIComponent(config.SHEET)}`;
        if (config.TYPE === 'movie') {
            params += `&movieTitle=${encodeURIComponent(config.ID)}`; // للأفلام
        } else {
            params += `&episodeNumber=${config.ID}`; // للمسلسلات
        }

        const url = `${config.GAS_URL}?${params}`;

        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(servers) {
                grid.removeClass('loading-state').empty();
                if (!servers || servers.length === 0) {
                    grid.html('<p style="color:red">لا توجد سيرفرات.</p>');
                    return;
                }

                servers.forEach(s => {
                    const btn = $(`
                        <div class="siwane-server-btn" data-id="${s.id}">
                            <span>${s.icon}</span> <span>${s.title}</span>
                        </div>
                    `);
                    
                    btn.click(function() {
                        $('.siwane-server-btn').removeClass('active');
                        $(this).addClass('active');
                        decryptAndPlay($(this).data('id'), config);
                    });
                    grid.append(btn);
                });
            },
            error: function() { grid.html('<p>خطأ في الاتصال.</p>'); }
        });
    }

    function decryptAndPlay(serverId, config) {
        $("#siwane-video-frame").hide();
        $("#siwane-countdown-display").css('display', 'flex');
        $("#siwane-countdown-text").text("جاري فك تشفير الرابط...");
        
        $.ajax({
            url: `${config.GAS_URL}?contentSheetName=${encodeURIComponent(config.SHEET)}&id=${encodeURIComponent(serverId)}`,
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.url) {
                    startCountdown(res.url, config.COUNTDOWN);
                } else {
                    $("#siwane-countdown-text").text("خطأ: الرابط غير صالح.");
                }
            },
            error: function() { $("#siwane-countdown-text").text("خطأ في الاتصال."); }
        });
    }

    function startCountdown(url, duration) {
        createParticles();
        let c = duration;
        const num = $("#siwane-countdown");
        const txt = $("#siwane-countdown-text");
        
        txt.text("جاري تحضير الفيديو...");
        
        $('html, body').animate({
            scrollTop: $(".siwane-video-container").offset().top - 20
        }, 800);

        const iv = setInterval(() => {
            num.text(c);
            c--;
            if (c < 0) {
                clearInterval(iv);
                num.text("");
                txt.text("مشاهدة ممتعة!");
                setTimeout(() => {
                    $("#siwane-countdown-display").hide();
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
