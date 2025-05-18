(function() {
    // ==============================================================
    // CONFIGURATION (يجب أن تتطابق مع سكربت صفحة النقاط)
    // ==============================================================
    const APP_CONFIG_ARTICLE_PAGE = {
        pointsPageUrl: "/p/points-5.html", // !!! غيّر هذا إلى رابط صفحة النقاط الفعلية !!!
        articleReading: {
            requiredDurationMillis: 60 * 1000, 
        },
        articleKeys: {
            flowStarted: 'articlePointsFlow',
            startTime: 'articleStartTime',
            completed: 'articleCompleted'
        }
    };
    // --- نهاية التكوين ---

    const { pointsPageUrl, articleReading, articleKeys } = APP_CONFIG_ARTICLE_PAGE;
    const requiredDurationMillis = articleReading.requiredDurationMillis;

    // سيتم تعيين هذه المتغيرات عند إنشاء العناصر ديناميكيًا
    let timerBannerElement = null;
    let timerMessageSpanElement = null;
    let countdownInterval = null;

    function formatMillisToTime(millis) {
        if (millis < 0) millis = 0;
        const totalSecondsRemaining = Math.ceil(millis / 1000);
        const minutes = Math.floor(totalSecondsRemaining / 60);
        const seconds = Math.floor(totalSecondsRemaining % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function getHumanReadableDuration(millis) {
        if (millis <= 0) return "لحظات";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        let parts = [];
        if (minutes === 1) parts.push("دقيقة واحدة");
        else if (minutes > 1) parts.push(`${minutes} ${minutes === 2 ? 'دقيقتين' : 'دقائق'}`);
        if (seconds === 1) parts.push("ثانية واحدة");
        else if (seconds > 1) parts.push(`${seconds} ${seconds === 2 ? 'ثانيتين' : 'ثوانٍ'}`);
        if (parts.length === 0) {
            if (totalSeconds > 0) return `${totalSeconds} ${totalSeconds === 1 ? 'ثانية واحدة' : (totalSeconds === 2 ? 'ثانيتين' : 'ثوانٍ')}`;
            return "وقت قصير جداً";
        }
        return parts.join(" و ");
    }

    function createTimerBanner() {
        if (document.getElementById('pointsTimerBanner')) return; // لا تنشئ إذا كانت موجودة بالفعل

        timerBannerElement = document.createElement('div');
        timerBannerElement.id = 'pointsTimerBanner';
        timerBannerElement.className = 'points-timer-banner'; // لتطبيق CSS

        timerMessageSpanElement = document.createElement('span');
        timerMessageSpanElement.id = 'pointsTimerMessage';

        timerBannerElement.appendChild(timerMessageSpanElement);
        document.body.appendChild(timerBannerElement);
        console.log("Article Page: Timer banner created dynamically.");
    }

    function showTimerMessage(message, type = 'info') {
        // تأكد من أن العناصر موجودة (قد يتم استدعاؤها قبل إنشائها في حالات نادرة)
        if (!timerBannerElement || !timerMessageSpanElement) {
            // إذا لم يتم إنشاء اللافتة بعد (مثلاً عند حدوث خطأ مبكر جدًا)
            // وحاولنا عرض رسالة خطأ، قد نحتاج لإنشائها هنا
            if (type === 'error' && !document.getElementById('pointsTimerBanner')) {
                 createTimerBanner(); // حاول الإنشاء لعرض الخطأ
            }
            // إذا ما زالت غير موجودة، سجل الخطأ في الكونسول فقط
            if (!timerBannerElement || !timerMessageSpanElement) {
                console.error("Article Page Timer: Banner elements not found for message:", message);
                return;
            }
        }
        
        timerMessageSpanElement.textContent = message;
        timerBannerElement.style.display = 'block';
        timerBannerElement.className = 'points-timer-banner'; 
        if (type === 'completed') timerBannerElement.classList.add('completed');
        else if (type === 'error') timerBannerElement.classList.add('error');
        
        console.log(`Article Page Timer: ${message}`);
    }

    function redirectToPointsPage() {
        showTimerMessage("اكتمل الوقت! جارٍ العودة إلى صفحة النقاط...", "completed");
        setTimeout(() => {
            window.location.href = pointsPageUrl;
        }, 1500);
    }

    function handleCompletion() {
        console.log("Article Page: Required duration met.");
        if (countdownInterval) clearInterval(countdownInterval);
        try {
            localStorage.setItem(articleKeys.completed, 'true');
            console.log(`Article Page: localStorage.${articleKeys.completed} set to 'true'.`);
        } catch (e) {
            console.error("Article Page: Error setting localStorage for completion.", e);
            showTimerMessage("خطأ في حفظ تقدم القراءة. حاول مرة أخرى.", "error");
            return;
        }
        redirectToPointsPage();
    }

    function handlePageExit() {
        console.log("Article Page: Page is being hidden or unloaded.");
        if (countdownInterval) clearInterval(countdownInterval);
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log("Article Page: DOMContentLoaded.");

        if (pointsPageUrl === "/p/points-5.html") {
            console.error("Article Page: !!! يرجى تعديل 'pointsPageUrl' في السكربت !!!");
            // لا يمكن عرض رسالة الخطأ في اللافتة إذا لم تكن قد أنشئت بعد،
            // لذا سننشئها إذا لزم الأمر لعرض الخطأ.
            if (!document.getElementById('pointsTimerBanner')) {
                createTimerBanner();
            }
            showTimerMessage("خطأ في إعدادات الصفحة: لم يتم تحديد رابط صفحة النقاط.", "error");
            return;
        }

        let flowStarted = null;
        let startTimeStr = null;

        try {
            flowStarted = localStorage.getItem(articleKeys.flowStarted);
            startTimeStr = localStorage.getItem(articleKeys.startTime);
             if (flowStarted === 'true') {
                localStorage.removeItem(articleKeys.completed);
                console.log(`Article Page: Removed any pre-existing '${articleKeys.completed}' flag.`);
             }
        } catch (e) {
            console.error("Article Page: Error accessing localStorage on load.", e);
            if (!document.getElementById('pointsTimerBanner')) {
                createTimerBanner();
            }
            showTimerMessage("خطأ: لا يمكن الوصول إلى التخزين المحلي للمتصفح.", "error");
            return; 
        }

        console.log("Article Page: localStorage flags on load:", {
            [articleKeys.flowStarted]: flowStarted,
            [articleKeys.startTime]: startTimeStr
        });

        if (flowStarted === 'true' && startTimeStr) {
            // --- إنشاء اللافتة عند الحاجة ---
            createTimerBanner(); 
            // -----------------------------

            const startTime = parseInt(startTimeStr, 10);
            if (isNaN(startTime)) {
                console.error("Article Page: Invalid startTime in localStorage.");
                showTimerMessage("خطأ في بيانات بدء القراءة.", "error");
                try {
                    localStorage.removeItem(articleKeys.flowStarted);
                    localStorage.removeItem(articleKeys.startTime);
                    localStorage.removeItem(articleKeys.completed);
                } catch (e) { console.error("Article Page: Error cleaning up invalid localStorage state.", e); }
                return;
            }

            const endTime = startTime + requiredDurationMillis;
            const totalDurationText = getHumanReadableDuration(requiredDurationMillis);

            function updateTimer() {
                const now = Date.now();
                const timeLeftMillis = endTime - now;
                if (timeLeftMillis <= 0) {
                    handleCompletion();
                } else {
                    showTimerMessage(`سيتم توجيهك لصفحة النقاط بعد قراءة لمدة ${totalDurationText} لكسب نقطة. الوقت المتبقي: ${formatMillisToTime(timeLeftMillis)}`);
                    const nextTickDelay = timeLeftMillis % 1000 || 1000;
                    if (countdownInterval) clearInterval(countdownInterval); 
                    countdownInterval = setTimeout(updateTimer, nextTickDelay);
                }
            }
            console.log("Article Page: Article reading flow active. Starting timer.");
            updateTimer(); 
        } else {
            console.log("Article Page: Not part of an active article reading flow, or localStorage flags are missing/invalid.");
            // لا حاجة لإخفاء اللافتة إذا لم يتم إنشاؤها
        }
    });

    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('unload', handlePageExit);

})();
