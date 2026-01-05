$(document).ready(function() {
    // جلب الإعدادات العامة من القالب
    const globalConfig = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // =========================================================
    // الحالة 1: وضع المشاهدة (داخل المقال العشوائي)
    // =========================================================
    if (mode === 'watch') {
        const sheetName = urlParams.get('sheet');
        const episode = urlParams.get('ep');
        
        if (sheetName && episode && globalConfig.GAS_URL) {
            // دمج الإعدادات من الرابط مع الإعدادات العامة
            const playerConfig = {
                GAS_WEB_APP_URL: globalConfig.GAS_URL,
                COUNTDOWN_DURATION: globalConfig.COUNTDOWN || 10,
                CONTENT_SHEET_NAME: decodeURIComponent(sheetName),
                EPISODE_NUMBER: episode,
                CONTENT_TYPE: 'series' // نفترض أنه مسلسل طالما هناك حلقة
            };
            
            // حقن الواجهة وبدء التشغيل
            injectAndStartPlayer(playerConfig);
        }
    } 
    // =========================================================
    // الحالة 2: وضع اللوبي (داخل مقال المسلسل لعرض الحلقات)
    // =========================================================
    else {
        // البحث عن حاوية الحلقات التي يضعها الكاتب في المقال
        const lobby = $('#siwane-lobby');
        if (lobby.length > 0 && globalConfig.GAS_URL) {
            const sheetName = lobby.data('sheet');
            if (sheetName) {
                initLobby(globalConfig.GAS_URL, sheetName, lobby);
            }
        }
    }

    // ---------------------------------------------------------
    // دوال المنطقة 1: المشغل والحقن (Player Logic)
    // ---------------------------------------------------------
    function injectAndStartPlayer(config) {
        const postBody = $('.post-body, .entry-content, #post-body').first();
        if (postBody.length === 0) return;

        // تحديث عنوان الصفحة
        document.title = `مشاهدة ${config.CONTENT_SHEET_NAME} - الحلقة ${config.EPISODE_NUMBER}`;

        // 1. بناء هيكل السيرفرات (يوضع في الأعلى)
        const topHtml = $(`
            <div class="siwane-inject-box" style="background:var(--contentB,#fff);border:1px solid var(--contentL,#ddd);padding:15px;margin-bottom:20px;border-radius:8px;">
                <h3 style="text-align:center;border-bottom:1px dashed #ccc;padding-bottom:10px;margin-bottom:15px;">
                    سيرفرات الحلقة ${config.EPISODE_NUMBER}
                </h3>
                <div id="siwane-servers-grid" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                    جاري تحميل السيرفرات...
                </div>
            </div>
        `);

        // 2. بناء هيكل المشغل (يوضع في الأسفل)
        const bottomHtml = $(`
            <div class="siwane-inject-box" style="background:var(--contentB,#fff);border:1px solid var(--contentL,#ddd);padding:15px;margin-top:20px;border-radius:8px;">
                <h3 style="text-align:center;border-bottom:1px dashed #ccc;padding-bottom:10px;margin-bottom:15px;">شاشة العرض</h3>
                <div class="siwane-player-container" style="position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;">
                    <div id="siwane-countdown-display" style="position:absolute;inset:0;background:#111;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;">
                        <div id="siwane-particles-container" style="position:absolute;inset:0;overflow:hidden;"></div>
                        <div id="siwane-countdown-text" style="z-index:2;margin-bottom:10px;font-size:1.2em;">الرجاء اختيار سيرفر</div>
                        <div id="siwane-countdown" style="z-index:2;font-size:3em;font-weight:bold;color:#3498db;"></div>
                    </div>
                    <iframe id="siwane-video-frame" allowfullscreen style="width:100%;height:100%;border:0;display:none;"></iframe>
                </div>
            </div>
        `);

        // الحقن دون حذف النص الأصلي
        postBody.prepend(topHtml);
        postBody.append(bottomHtml);

        // تشغيل الجسيمات
        createParticles();

        // بدء جلب السيرفرات
        loadServers(config);
    }

    function loadServers(config) {
        const serversGrid = $("#siwane-servers-grid");
        // نستخدم episodeNumber لجلب القائمة (تعيد ID كما في GAS الخاص بك)
        const ajaxUrl = `${config.GAS_WEB_APP_URL}?contentSheetName=${encodeURIComponent(config.CONTENT_SHEET_NAME)}&episodeNumber=${config.EPISODE_NUMBER}`;

        $.ajax({
            url: ajaxUrl,
            type: 'GET',
            dataType: 'json',
            success: function(servers) {
                serversGrid.empty();
                if (!servers || servers.length === 0) {
                    serversGrid.html('<p style="color:red">لا توجد سيرفرات متاحة.</p>');
                    return;
                }

                servers.forEach(server => {
                    const btn = $(`
                        <div class="siwane-server-btn" 
                             style="cursor:pointer;background:#f5f5f5;padding:8px 15px;border-radius:20px;border:1px solid #ddd;display:flex;align-items:center;gap:5px;transition:0.3s;"
                             data-server-id="${server.id}">
                            <span>${server.icon}</span> <span>${server.title}</span>
                        </div>
                    `);

                    // تأثيرات Hover بسيطة
                    btn.hover(function(){ $(this).css('background','#e0e0e0'); }, function(){ if(!$(this).hasClass('active')) $(this).css('background','#f5f5f5'); });

                    btn.click(function() {
                        $('.siwane-server-btn').css({'background':'#f5f5f5', 'color':'#000'}).removeClass('active');
                        $(this).css({'background':'#3498db', 'color':'#fff'}).addClass('active');
                        
                        // طلب فك التشفير
                        decryptAndPlay($(this).data('server-id'), config);
                    });
                    serversGrid.append(btn);
                });
            },
            error: function() { serversGrid.html('<p style="color:red">فشل الاتصال.</p>'); }
        });
    }

    function decryptAndPlay(serverId, config) {
        $("#siwane-video-frame").hide();
        $("#siwane-countdown-display").fadeIn();
        $("#siwane-countdown-text").text("جاري فك تشفير الرابط...");
        
        // طلب فك التشفير من GAS (id + sheetName)
        $.ajax({
            url: `${config.GAS_WEB_APP_URL}?contentSheetName=${encodeURIComponent(config.CONTENT_SHEET_NAME)}&id=${encodeURIComponent(serverId)}`,
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.url) {
                    startCountdown(res.url, config.COUNTDOWN_DURATION);
                } else {
                    $("#siwane-countdown-text").text("خطأ: " + (res.error || "رابط تالف"));
                }
            },
            error: function() { $("#siwane-countdown-text").text("خطأ في الاتصال بالسيرفر."); }
        });
    }

    function startCountdown(videoUrl, duration) {
        createParticles();
        let count = duration;
        const countEl = $("#siwane-countdown");
        const textEl = $("#siwane-countdown-text");
        
        textEl.text("جاري تحضير الفيديو...");
        
        // سكرول ناعم للمشغل
        $('html, body').animate({
            scrollTop: $(".siwane-player-container").offset().top - 100
        }, 800);

        const interval = setInterval(() => {
            countEl.text(count);
            count--;
            if (count < 0) {
                clearInterval(interval);
                countEl.text("");
                textEl.text("مشاهدة ممتعة!");
                setTimeout(() => {
                    $("#siwane-countdown-display").fadeOut();
                    $("#siwane-video-frame").attr("src", videoUrl).show();
                }, 1000);
            }
        }, 1000);
    }

    function createParticles() {
        const container = $("#siwane-particles-container");
        container.empty();
        // ستايل الجسيمات
        const styleId = 'siwane-particles-style';
        if (!$('#'+styleId).length) {
            $('head').append(`<style id="${styleId}">.siwane-particle{position:absolute;background:rgba(255,255,255,0.5);border-radius:50%;animation:floatUp linear infinite}@keyframes floatUp{0%{transform:translateY(0);opacity:0}50%{opacity:1}100%{transform:translateY(-100px);opacity:0}}</style>`);
        }

        for (let i = 0; i < 60; i++) {
            const size = Math.random() * 4 + 1;
            const particle = $('<div class="siwane-particle"></div>');
            particle.css({
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                width: size + 'px',
                height: size + 'px',
                animationDuration: (Math.random() * 4 + 3) + 's',
                animationDelay: (Math.random() * 2) + 's'
            });
            container.append(particle);
        }
    }

    // ---------------------------------------------------------
    // دوال المنطقة 2: اللوبي (Lobby Logic - Series Page)
    // ---------------------------------------------------------
    function initLobby(gasUrl, sheetName, container) {
        container.html('<div style="text-align:center;padding:20px;">جاري جلب قائمة الحلقات...</div>');
        
        $.ajax({
            url: `${gasUrl}?contentSheetName=${encodeURIComponent(sheetName)}&action=getEpisodes`,
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                if (res.episodes && res.episodes.length > 0) {
                    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:10px;margin:20px 0;">';
                    res.episodes.forEach(ep => {
                        html += `
                            <div class="siwane-ep-btn" 
                                 onclick="siwaneRedirect('${sheetName}', '${ep}')"
                                 style="background:var(--contentB,#fff);border:1px solid #ddd;padding:10px;text-align:center;cursor:pointer;border-radius:5px;font-weight:bold;transition:0.2s;">
                                ${ep}
                            </div>`;
                    });
                    html += '</div>';
                    // إضافة دالة التوجيه للـ window لتكون مرئية
                    window.siwaneRedirect = (sheet, ep) => redirectToRandom(sheet, ep);
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
            // جلب مقال عشوائي من آخر 150 مشاركة
            let r = await fetch('/feeds/posts/summary?alt=json&max-results=150');
            let d = await r.json();
            let posts = d.feed.entry;
            if (posts && posts.length > 0) {
                let rnd = posts[Math.floor(Math.random() * posts.length)];
                let link = rnd.link.find(l => l.rel === 'alternate').href;
                let sep = link.includes('?') ? '&' : '?';
                
                // التوجيه مع البارامترات
                window.location.href = `${link}${sep}mode=watch&sheet=${encodeURIComponent(sheet)}&ep=${ep}`;
            }
        } catch(e) { 
            alert('حدث خطأ أثناء الانتقال للمشاهدة.'); 
        }
    }
});
