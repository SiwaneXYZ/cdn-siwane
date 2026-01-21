$(document).ready((function() {
    const e = window.siwaneGlobalConfig || {},
        n = new URLSearchParams(window.location.search),
        t = n.get("mode"),
        i = "https://secure-player.mnaht00.workers.dev";

    // متغيرات لحفظ حالة العداد الحالي
    let currentCountdown = null;
    let currentAdDisplay = null;

    if ("watch" === t) {
        const t = n.get("sheet"),
            s = n.get("ep"),
            a = n.get("movie");
        if (t && e.GAS_URL) {
            const n = {
                GAS_URL: e.GAS_URL,
                COUNTDOWN: e.COUNTDOWN || 10,
                SHEET: decodeURIComponent(t),
                TYPE: a ? "movie" : "series",
                ID: a ? decodeURIComponent(a) : s,
                AD_LINKS: e.AD_LINKS || {},
                AD_BUTTONS_COUNT: e.AD_BUTTONS_COUNT || 3
            };
            if (n.ID) ! function(e) {
                const n = $(".post-body, .entry-content, #post-body").first();
                if (0 === n.length) return;
                let t = "movie" === e.TYPE ? e.ID : `${e.SHEET} - الحلقة ${e.ID}`;
                document.title = `مشاهدة ${t}`;
                const s = $(`
            <div class="siwane-container">
                <header class="siwane-header"><h1>${t}</h1></header>
                <div class="siwane-server-container">
                    <h2>اختر سيرفر المشاهدة</h2>
                    <div id="siwane-servers-grid" class="siwane-servers-grid loading-state"><p>جاري تحميل السيرفرات...</p></div>
                </div>
            </div>
        `),
                    a = $(`
            <div class="siwane-container">
                <div class="siwane-video-container">
                    <h2>شاشة العرض</h2>
                    <div id="siwane-countdown-display">
                        <div class="siwane-particles-container" id="siwane-particles-container"></div>
                        <div id="siwane-countdown-text">الرجاء اختيار سيرفر للبدء</div>
                        <div id="siwane-countdown"></div>
                    </div>
                    <iframe id="siwane-video-frame" allowfullscreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"></iframe>
                  <a class="button ln" href="/p/offerwal.html" style="width:100%;text-align:center;display:block;margin-top:10px;">انقر هنا انتقل وادعمنا بالنقر</a>
                </div>
            </div>
        `);
                n.prepend(s), n.append(a),
                    function() {
                        const e = $(".siwane-particles-container");
                        e.empty();
                        for (let n = 0; n < 30; n++) {
                            const n = $('<div class="siwane-particle"></div>');
                            n.css({
                                left: 100 * Math.random() + "%",
                                top: 100 * Math.random() + "%",
                                animationDuration: 4 * Math.random() + 3 + "s"
                            }), e.append(n)
                        }
                    }(),
                    function(e) {
                        const n = $("#siwane-servers-grid");
                        let t = `contentSheetName=${encodeURIComponent(e.SHEET)}`;
                        "movie" === e.TYPE ? t += `&movieTitle=${encodeURIComponent(e.ID)}` : t += `&episodeNumber=${e.ID}`;
                        $.ajax({
                            url: `${e.GAS_URL}?${t}`,
                            type: "GET",
                            dataType: "json",
                            success: function(t) {
                                n.removeClass("loading-state").empty(), t.forEach((t => {
                                    const s = $(`<div class="siwane-server-btn" data-id="${t.id}"><span>${t.icon}</span> <span>${t.title}</span></div>`);
                                    s.click((function() {
                                        // إزالة الفعالية من جميع الأزرار وإضافة الفعالية للزر المختار
                                        $(".siwane-server-btn").removeClass("active");
                                        $(this).addClass("active");
                                        
                                        // التمرير إلى قسم الفيديو
                                        $("html, body").animate({
                                            scrollTop: $(".siwane-video-container").offset().top - 20
                                        }, 800);
                                        
                                        // إعادة تعيين واجهة العداد للإعلانات
                                        function resetAdInterface() {
                                            // إخفاء الفيديو إذا كان ظاهرًا
                                            $("#siwane-video-frame").hide();
                                            
                                            // إعادة عرض شاشة العداد
                                            $("#siwane-countdown-display").css("display", "flex");
                                            $("#siwane-countdown").show();
                                            
                                            // إعادة تعيين نص العداد
                                            $("#siwane-countdown-text").text("جاري تحضير الفيديو...");
                                            $("#siwane-countdown").text("");
                                            
                                            // إيقاف أي عداد سابق
                                            if (currentCountdown) {
                                                clearInterval(currentCountdown);
                                                currentCountdown = null;
                                            }
                                            
                                            // إزالة أي عرض إعلانات سابق
                                            if (currentAdDisplay) {
                                                clearTimeout(currentAdDisplay);
                                                currentAdDisplay = null;
                                            }
                                        }
                                        
                                        // استدعاء دالة إعادة التعيين
                                        resetAdInterface();
                                        
                                        // استدعاء الدالة الأصلية مع إعادة التعيين
                                        function(e, n) {
                                            $("#siwane-countdown-text").text("جاري تأمين الاتصال...");
                                            $.ajax({
                                                url: `${i}/get-secure-player`,
                                                data: {
                                                    sheet: n.SHEET,
                                                    id: e
                                                },
                                                type: "GET",
                                                dataType: "json",
                                                success: function(e) {
                                                    if (e.realUrl) {
                                                        const t = btoa(e.realUrl).split("").reverse().join(""),
                                                            i = new Blob([`
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
                                        var key = "${t}";
                                        var raw = atob(key.split('').reverse().join(''));
                                        container.innerHTML = '<iframe src="' + raw + '" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>';
                                    }
                                })();
                            <\/script>
                        </body>
                        </html>
                    `], {
                                                                    type: "text/html"
                                                                });

                                                        // --- منطق العداد وبوابة الإعلانات المدمج ---
                                                        ! function(e, n, r, adCount) {
                                                            let t = n;
                                                            const i = $("#siwane-countdown"),
                                                                s = $("#siwane-countdown-text");
                                                            s.text("جاري تحضير الفيديو...");
                                                            
                                                            // تخزين المؤقت الحالي
                                                            currentCountdown = setInterval((() => {
                                                                i.text(t), t--, t < 0 && (clearInterval(currentCountdown), currentCountdown = null, i.hide(), function(e, r, adCount) {
                                                                    // إنشاء كائن للنقرات ديناميكياً حسب عدد الأزرار
                                                                    let clicked = {};
                                                                    for(let i = 1; i <= adCount; i++) {
                                                                        clicked['ad' + i] = false;
                                                                    }
                                                                    
                                                                    // إنشاء أزرار الإعلانات ديناميكياً
                                                                    let buttonsHTML = '';
                                                                    for(let i = 1; i <= adCount; i++) {
                                                                        const btnClass = i === 1 ? 'ad-r' : i === 2 ? 'ad-b' : 'ad-o';
                                                                        buttonsHTML += `<button class="ad-gate-btn ${btnClass}" data-id="ad${i}" style="padding:6px 10px;font-size:11px;min-width:70px;">إعلان ${i}</button>`;
                                                                    }
                                                                    
                                                                    const adHtml = `
                                                                            <div style="text-align:center;width:100%;padding:5px;">
                                                                                <p style="color:#ffeb3b;font-size:12px;margin-bottom:8px;">لفتح المشغل، اضغط على الأزرار ${adCount}:</p>
                                                                                <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
                                                                                    ${buttonsHTML}
                                                                                </div>
                                                                                <div id="final-unlock" style="display:none;margin-top:10px;">
                                                                                    <button id="play-now" class="siwane-episode-btn" style="width:100%!important;background:var(--linkB);color:#fff;border:none;padding:8px;font-size:13px;"> تشغيل الفيديو الآن</button>
                                                                                </div>
                                                                            </div>
                                                                        `;
                                                                    s.html(adHtml);
                                                                    
                                                                    // إعادة تعيين أحداث النقر للأزرار
                                                                    $(".ad-gate-btn").off('click').click(function(){
                                                                        const id = $(this).data("id");
                                                                        // استخدم الرابط المناسب من AD_LINKS
                                                                        if(r[id]) {
                                                                            window.open(r[id], '_blank');
                                                                        }
                                                                        $(this).addClass("is-faded");
                                                                        clicked[id] = true;
                                                                        
                                                                        // التحقق من جميع الأزرار
                                                                        let allClicked = true;
                                                                        for(let i = 1; i <= adCount; i++) {
                                                                            if(!clicked['ad' + i]) {
                                                                                allClicked = false;
                                                                                break;
                                                                            }
                                                                        }
                                                                        if(allClicked) $("#final-unlock").fadeIn();
                                                                    });

                                                                    // إعادة تعيين حدث زر التشغيل
                                                                    $("#play-now").off('click').click(function(){
                                                                        s.text("مشاهدة ممتعة!");
                                                                        currentAdDisplay = setTimeout((() => {
                                                                            $("#siwane-countdown-display").hide();
                                                                            const n = $("#siwane-video-frame").attr("src");
                                                                            n && n.startsWith("blob:") && URL.revokeObjectURL(n), $("#siwane-video-frame").attr("src", e).show()
                                                                        }), 500);
                                                                    });
                                                                }(e, r, adCount))
                                                            }), 1e3)
                                                        }(URL.createObjectURL(i), n.COUNTDOWN, n.AD_LINKS, n.AD_BUTTONS_COUNT)
                                                    } else $("#siwane-countdown-text").text("خطأ: " + (e.error || "تعذر جلب الرابط"))
                                                },
                                                error: function() {
                                                    $("#siwane-countdown-text").text("فشل الاتصال بالوركر.")
                                                }
                                            })
                                        }($(this).data("id"), e)
                                    })), n.append(s)
                                }))
                            }
                        })
                    }(e)
            }(n)
        }
    } else {
        const n = $("#siwane-lobby");
        if (n.length > 0 && e.GAS_URL) {
            const t = n.data("sheet"),
                i = n.data("movie");
            t && (i ? function(e, n, t) {
                let i = `<div class="siwane-episodes-container"><h2>${n}</h2><div class="siwane-episodes-grid" style="grid-template-columns: 1fr;"><div class="siwane-episode-btn" onclick="siwaneRedirect('${e}', '${n}', 'movie')">شاهد الآن</div></div></div>`;
                window.siwaneRedirect = (e, n, t) => s(e, n, t), t.html(i)
            }(t, i, n) : function(e, n, t) {
                t.html('<p class="note">جاري جلب الحلقات...</p>'), $.ajax({
                    url: `${e}?contentSheetName=${encodeURIComponent(n)}&action=getEpisodes`,
                    type: "GET",
                    dataType: "json",
                    success: function(e) {
                        if (e.episodes && e.episodes.length > 0) {
                            let i = `<div class="siwane-episodes-container"><h2>حلقات ${n}</h2><div class="siwane-episodes-grid">`;
                            e.episodes.forEach((e => {
                                null === e || "null" === e || isNaN(e) || (i += `<div class="siwane-episode-btn" onclick="siwaneRedirect('${n}', '${e}', 'series')">الحلقة ${e}</div>`)
                            })), i += "</div></div>", window.siwaneRedirect = (e, n, t) => s(e, n, t), t.html(i)
                        }
                    }
                })
            }(e.GAS_URL, t, n))
        }
    }
    async function s(e, n, t) {
        try {
            let i = await fetch("/feeds/posts/summary?alt=json&max-results=150"),
                s = (await i.json()).feed.entry;
            if (s && s.length > 0) {
                let i = s[Math.floor(Math.random() * s.length)].link.find((e => "alternate" === e.rel)).href,
                    a = i.includes("?") ? "&" : "?",
                    o = "movie" === t ? `&movie=${encodeURIComponent(n)}` : `&ep=${n}`;
                window.location.href = `${i}${a}mode=watch&sheet=${encodeURIComponent(e)}${o}`
            }
        } catch (e) {
            alert("خطأ في التحويل.")
        }
    }
}));
