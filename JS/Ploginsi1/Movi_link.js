$(document).ready(function() {
    // جلب الإعدادات العامة
    const globalConfig = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // ==========================================
    // الحالة 1: وضع المشاهدة (Watch Mode)
    // ==========================================
    if (mode === 'watch') {
        const sheetName = urlParams.get('sheet');
        const episode = urlParams.get('ep');
        
        if (sheetName && episode && globalConfig.GAS_URL) {
            const playerConfig = {
                GAS_URL: globalConfig.GAS_URL,
                COUNTDOWN: globalConfig.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheetName),
                EP: episode
            };
            injectWatchInterface(playerConfig);
        }
    } 
    // ==========================================
    // الحالة 2: وضع اللوبي (Lobby Mode)
    // ==========================================
    else {
        const lobby = $('#siwane-lobby');
        if (lobby.length > 0 && globalConfig.GAS_URL) {
            const sheetName = lobby.data('sheet');
            if (sheetName) {
                initLobby(globalConfig.GAS_URL, sheetName, lobby);
            }
        }
    }

    // ---------------------------------------------------------
    // دوال اللوبي (إنشاء قائمة الحلقات)
    // ---------------------------------------------------------
    function initLobby(gasUrl, sheetName, container) {
        container.html('<p class="note">جاري جلب الحلقات...</p>');
        
        $.ajax({
            url: `${gasUrl}?contentSheetName=${encodeURIComponent(sheetName)}&action=getEpisodes`,
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.episodes && res.episodes.length > 0) {
                    // بناء الهيكل الجديد المطابق لـ CSS
                    let html = `
                    <div class="siwane-episodes-container">
                        <h2>قائمة حلقات ${sheetName}</h2>
                        <div class="siwane-episodes-grid">`;
                    
                    res.episodes.forEach(ep => {
                        // [تحديث هام]: التحقق من أن القيمة رقم وليست null قبل الرسم
                        if (ep !== null && ep !== "null" && !isNaN(ep)) {
                            html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheetName}', '${ep}')">${ep}</div>`;
                        }
                    });
                    
                    html += `</div></div>`;
                    
                    // تعريف دالة التوجيه لتكون عامة
                    window.siwaneRedirect = (s, e) => redirectToRandom(s, e);
                    container.html(html);
                } else {
                    container.html('<div style="color:red;text-align:center;">لا توجد حلقات متاحة.</div>');
                }
            },
            error: function() { container.html('خطأ في الاتصال.'); }
        });
    }

    async function redirectToRandom(sheet, ep) {
        try {
            let r = await fetch('/feeds/posts/summary?alt=json&max-results=150');
            let d = await r.json();
            let posts = d.feed.entry;
            if (posts && posts.length > 0) {
                let rnd = posts[Math.floor(Math.random() * posts.length)];
                let link = rnd.link.find(l => l.rel === 'alternate').href;
                let sep = link.includes('?') ? '&' : '?';
                window.location.href = `${link}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}&ep=${ep}`;
            }
        } catch(e) { alert('خطأ في التحويل.'); }
    }

    // ---------------------------------------------------------
    // دوال المشاهدة (الحقن والتشغيل)
    // ---------------------------------------------------------
    function injectWatchInterface(config) {
        const postBody = $('.post-body, .entry-content, #post-body').first();
        if (postBody.length === 0) return;

        document.title = `مشاهدة ${config.SHEET} - الحلقة ${config.EP}`;

        // 1. بناء هيكل السيرفرات (الأعلى) - مطابق للـ CSS
        const topHtml = $(`
            <div class="siwane-container">
                <header class="siwane-header">
                    <h1>${config.SHEET} : الحلقة ${config.EP}</h1>
                </header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state">
                        <p>جاري تحميل السيرفرات...</p>
                    </div>
                </div>
            </div>
        `);

        // 2. بناء هيكل المشغل (الأسفل) - مطابق للـ CSS
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

        // الحقن
        postBody.prepend(topHtml);
        postBody.append(bottomHtml);

        // تشغيل الجسيمات
        createParticles();

        // جلب السيرفرات
        loadServers(config);
    }

    function loadServers(config) {
        const grid = $("#siwane-servers-grid");
        const url = `${config.GAS_URL}?contentSheetName=${encodeURIComponent(config.SHEET)}&episodeNumber=${config.EP}`;

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
