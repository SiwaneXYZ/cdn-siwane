$(document).ready(function() {
    const globalConfig = window.siwaneGlobalConfig || {};
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // المصدر الوحيد للبيانات هو الوركر الآن (لحل مشكلة فيسبوك)
    const WORKER_BASE_URL = 'https://secure-player.mnaht00.workers.dev';

    if (mode === 'watch') {
        const sheetName = urlParams.get('sheet');
        const episode = urlParams.get('ep');
        const movie = urlParams.get('movie');
        
        if (sheetName) {
            const playerConfig = {
                COUNTDOWN: globalConfig.COUNTDOWN || 10,
                SHEET: decodeURIComponent(sheetName),
                TYPE: movie ? 'movie' : 'series',
                ID: movie ? decodeURIComponent(movie) : episode
            };
            if(playerConfig.ID) injectWatchInterface(playerConfig);
        }
    } else {
        const lobby = $('#siwane-lobby');
        if (lobby.length > 0) {
            const sheetName = lobby.data('sheet');
            const movieTitle = lobby.data('movie');
            if (sheetName) {
                if (movieTitle) initMovieLobby(sheetName, movieTitle, lobby);
                else initSeriesLobby(sheetName, lobby);
            }
        }
    }

    function loadServers(config) {
        const grid = $("#siwane-servers-grid");
        let params = `?contentSheetName=${encodeURIComponent(config.SHEET)}`;
        if (config.TYPE === 'movie') params += `&movieTitle=${encodeURIComponent(config.ID)}`;
        else params += `&episodeNumber=${config.ID}`;

        fetch(`${WORKER_BASE_URL}${params}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(servers => {
                grid.removeClass('loading-state').empty();
                if (Array.isArray(servers)) {
                    servers.forEach(s => {
                        const btn = $(`<div class="siwane-server-btn" data-id="${s.id}"><span>${s.icon}</span> <span>${s.title}</span></div>`);
                        btn.click(function() {
                            $('.siwane-server-btn').removeClass('active');
                            $(this).addClass('active');
                            $('html, body').animate({ scrollTop: $(".siwane-video-container").offset().top - 20 }, 800);
                            decryptAndPlay($(this).data('id'), config);
                        });
                        grid.append(btn);
                    });
                }
            }).catch(() => grid.html('<p>يرجى تحديث الصفحة..</p>'));
    }

    function decryptAndPlay(serverId, config) {
        $("#siwane-video-frame").hide();
        $("#siwane-countdown-display").css('display', 'flex');
        $("#siwane-countdown-text").text("جاري تأمين الاتصال...");

        // طلب فك التشفير عبر الوركر أيضاً
        fetch(`${WORKER_BASE_URL}?contentSheetName=${encodeURIComponent(config.SHEET)}&id=${encodeURIComponent(serverId)}`)
            .then(r => r.json())
            .then(res => {
                if (res.url) {
                    const encryptedLink = btoa(res.url).split('').reverse().join('');
                    const playerHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { margin:0; padding:0; overflow:hidden; background:#000; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; text-align:center; font-family:sans-serif; }
                                .security-msg { padding:20px; border:2px solid #ff4444; border-radius:10px; background:rgba(255,0,0,0.1); direction:rtl; }
                                h1 { font-size:22px; color:#ff4444; margin-bottom:10px; }
                                p { font-size:16px; margin:0; }
                            </style>
                        </head>
                        <body>
                            <div id="c" style="width:100%;height:100%;"></div>
                            <script>
                                (function() {
                                    var allowed = "www.athar.news";
                                    var host = "";
                                    try { host = window.parent.location.hostname; } catch(e) { host = "blocked"; }
                                    var container = document.getElementById("c");
                                    if (host !== allowed && host !== "athar.news") {
                                        container.innerHTML = '<div class="security-msg"><h1>أوبس جمال اكتشفك ايها المتطفل!</h1><p>شاهد الحلقة ولا تسرق مجهودنا 😊</p></div>';
                                    } else {
                                        var key = "${encryptedLink}";
                                        var raw = atob(key.split('').reverse().join(''));
                                        container.innerHTML = '<iframe src="' + raw + '" style="width:100%;height:100%;border:none;" allowfullscreen><\/iframe>';
                                    }
                                })();
                            <\/script>
                        </body>
                        </html>
                    `;
                    const blob = new Blob([playerHtml], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    startCountdown(blobUrl, config.COUNTDOWN);
                }
            }).catch(() => $("#siwane-countdown-text").text("فشل تأمين الرابط."));
    }

    function initSeriesLobby(sheetName, container) {
        container.html('<p class="note">جاري التحميل..</p>');
        fetch(`${WORKER_BASE_URL}?contentSheetName=${encodeURIComponent(sheetName)}&action=getEpisodes`)
            .then(r => r.json())
            .then(res => {
                if (res.episodes) {
                    let html = `<div class="siwane-episodes-container"><h2>حلقات ${sheetName}</h2><div class="siwane-episodes-grid">`;
                    res.episodes.forEach(ep => {
                        html += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${sheetName}', '${ep}', 'series')">الحلقة ${ep}</div>`;
                    });
                    html += `</div></div>`;
                    window.siwaneRedirect = (s, id, type) => redirectToRandom(s, id, type);
                    container.html(html);
                }
            });
    }

    // --- بقية الدوال (startCountdown, createParticles, etc.) تبقى كما هي ---
    function startCountdown(url, duration) {
        let c = duration;
        const num = $("#siwane-countdown"), txt = $("#siwane-countdown-text");
        txt.text("جاري تحضير الفيديو...");
        const iv = setInterval(() => {
            num.text(c); c--;
            if (c < 0) {
                clearInterval(iv);
                num.text(""); txt.text("مشاهدة ممتعة!");
                setTimeout(() => {
                    $("#siwane-countdown-display").hide();
                    const oldSrc = $("#siwane-video-frame").attr("src");
                    if(oldSrc && oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);
                    $("#siwane-video-frame").attr("src", url).show();
                }, 1000);
            }
        }, 1000);
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

    function injectWatchInterface(config) {
        const postBody = $('.post-body, .entry-content, #post-body').first();
        if (postBody.length === 0) return;
        let displayTitle = (config.TYPE === 'movie') ? config.ID : `${config.SHEET} - الحلقة ${config.ID}`;
        document.title = `مشاهدة ${displayTitle}`;
        const topHtml = $(`<div class="siwane-container"><header class="siwane-header"><h1>${displayTitle}</h1></header><div class="siwane-server-container"><h2>اختر سيرفر المشاهدة</h2><div id="siwane-servers-grid" class="siwane-servers-grid loading-state"><p>جاري تحميل السيرفرات...</p></div></div></div>`);
        const bottomHtml = $(`<div class="siwane-container"><div class="siwane-video-container"><h2>شاشة العرض</h2><div id="siwane-countdown-display"><div class="siwane-particles-container" id="siwane-particles-container"></div><div id="siwane-countdown-text">الرجاء اختيار سيرفر للبدء</div><div id="siwane-countdown"></div></div><iframe id="siwane-video-frame" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe></div></div>`);
        postBody.prepend(topHtml); postBody.append(bottomHtml); createParticles(); loadServers(config);
    }

    function createParticles() {
        const con = $(".siwane-particles-container"); con.empty();
        for (let i = 0; i < 30; i++) {
            const p = $('<div class="siwane-particle"></div>');
            p.css({ left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', animationDuration: (Math.random() * 4 + 3) + 's' });
            con.append(p);
        }
    }
});
