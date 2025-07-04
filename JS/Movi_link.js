// **هذا هو محتوى ملف Movi_link.js على CDN**

$(document).ready(function() {
    // التحقق مما إذا كان كائن الإعدادات موجودًا
    // هذا الشرط ضروري لضمان أن ملف player_config.js قد تم تحميله بنجاح
    if (typeof window.playerConfig === 'undefined' || !window.playerConfig.gasUrl || !window.playerConfig.seriesName || isNaN(window.playerConfig.episodeNumber)) {
        console.error("خطأ: كائن إعدادات المشغل (window.playerConfig) غير موجود أو غير كامل في الصفحة. تأكد من تحميل player_config.js قبل Movi_link.js.");
        $("#countdown-text").text("خطأ في تهيئة المشغل. يرجى مراجعة الإعدادات.");
        return; // إيقاف التنفيذ إذا لم يتم تمرير الإعدادات بشكل صحيح
    }

    // قراءة القيم من كائن الإعدادات
    const GAS_WEB_APP_URL = window.playerConfig.gasUrl;
    const SERIES_SHEET_NAME = window.playerConfig.seriesName;
    const CURRENT_EPISODE_NUMBER = window.playerConfig.episodeNumber;
    const INITIAL_COUNTDOWN_SECONDS = window.playerConfig.countdownSeconds || 10; // الافتراضي 10 ثواني إذا لم يتم تحديده

    // تحديث عنوان الصفحة وعنوان الحلقة
    $('title').text(`مشغل حلقة المسلسل - الحلقة ${CURRENT_EPISODE_NUMBER}`);
    $('#episode-title').text(`الحلقة ${CURRENT_EPISODE_NUMBER} - ${SERIES_SHEET_NAME}`);

    function createParticles() {
        const container = $("#particles-container");
        container.empty();

        for (let i = 0; i < 50; i++) {
            const particle = $('<div class="particle"></div>');
            particle.css({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 4 + 3}s`,
                animationDelay: `${Math.random() * 2}s`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                opacity: Math.random() * 0.5 + 0.2
            });
            container.append(particle);
        }
    }

    createParticles();

    let countdownInterval;
    let countdownValue = INITIAL_COUNTDOWN_SECONDS;

    function startCountdownAndPlay(videoUrl) {
        clearInterval(countdownInterval);
        countdownValue = INITIAL_COUNTDOWN_SECONDS; // إعادة ضبط العداد
        $("#countdown").text(countdownValue);
        $("#countdown-text").text("جاري تحضير الفيديو...");
        $("#countdown-display").show();
        $("#video-frame").hide();
        createParticles();

        $('html, body').animate({
            scrollTop: $("#countdown-display").offset().top - 20
        }, 800);

        countdownInterval = setInterval(() => {
            countdownValue--;
            $("#countdown").text(countdownValue);

            if (countdownValue <= 0) {
                clearInterval(countdownInterval);
                $("#countdown-text").text("جاري تشغيل الفيديو...");

                setTimeout(() => {
                    $("#video-frame").attr("src", videoUrl);
                    $("#countdown-display").hide();
                    $("#video-frame").show();
                }, 1000);
            }
        }, 1000);
    }

    function loadServersForEpisode(seriesName, episodeNum) {
        $("#serversGrid").empty();
        $("#serversGrid").html(`<p style='color: #a9d6e5; text-align: center;'>جاري تحميل سيرفرات الحلقة ${episodeNum}...</p>`);

        $.ajax({
            url: GAS_WEB_APP_URL + '?seriesSheetName=' + encodeURIComponent(seriesName) + '&episodeNumber=' + encodeURIComponent(episodeNum),
            type: 'GET',
            dataType: 'json',
            success: function(servers) {
                $("#serversGrid").empty();
                if (servers.length === 0) {
                    $("#serversGrid").html(`<p style='color: #a9d6e5; text-align: center;'>لا توجد سيرفرات متاحة للحلقة ${episodeNum}.</p>`);
                    return;
                }

                servers.forEach(server => {
                    const serverBtn = $(`
                        <div class="server-btn"
                             data-server-id="${server.id}"
                             data-series-sheet-name="${seriesName}">
                            <div class="server-icon">${server.icon}</div>
                            <span>${server.title}</span>
                        </div>
                    `);
                    $("#serversGrid").append(serverBtn);
                });

                $(".server-btn[data-server-id]").off('click').on('click', function() {
                    $(".server-btn[data-server-id]").removeClass("active");
                    $(this).addClass("active");

                    const serverId = $(this).data("server-id");
                    const seriesSheetNameForDecryption = $(this).data("series-sheet-name");

                    $.ajax({
                        url: GAS_WEB_APP_URL + '?id=' + encodeURIComponent(serverId) + '&seriesSheetName=' + encodeURIComponent(seriesSheetNameForDecryption),
                        type: 'GET',
                        dataType: 'json',
                        success: function(response) {
                            if (response.url) {
                                startCountdownAndPlay(response.url);
                            } else if (response.error) {
                                alert("خطأ في جلب الفيديو: " + response.error);
                                $("#countdown-text").text("حدث خطأ: " + response.error);
                            }
                        },
                        error: function(xhr, status, error) {
                            alert("خطأ في الاتصال بالخادم: " + error);
                            $("#countdown-text").text("خطأ في الاتصال بالسيرفر.");
                        }
                    });
                });
            },
            error: function(xhr, status, error) {
                console.error("فشل في تحميل قائمة السيرفرات:", status, error);
                alert("فشل في تحميل قائمة السيرفرات. يرجى المحاولة لاحقًا.");
                $("#serversGrid").html("<p style='color: red; text-align: center;'>فشل في تحميل السيرفرات. يرجى المحاولة لاحقًا. (الرجاء فحص Console المتصفح).<br>الخطأ: " + error + "</p>");
            }
        });
    }

    $("#countdown").text("");
    $("#countdown-text").text("الرجاء اختيار سيرفر للبدء");
    $("#countdown-display").show();
    $("#video-frame").hide();

    loadServersForEpisode(SERIES_SHEET_NAME, CURRENT_EPISODE_NUMBER);
});
