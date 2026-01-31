// 🔒 نظام اكتشاف وتطهير DevTools المتقدم
(function() {
    // حالة اكتشاف DevTools
    let devToolsDetected = false;
    
    // 👁️‍🗨️ طريقة 1: اكتشاف الفرق في حجم الشاشة (الأكثر فعالية)
    const devToolsChecker = {
        threshold: 160, // الحد الأدنى للفرق للاعتبار أن DevTools مفتوحة
        lastWidth: window.innerWidth,
        lastHeight: window.innerHeight,
        
        check: function() {
            const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
            const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
            
            return widthDiff > this.threshold || heightDiff > this.threshold;
        }
    };
    
    // 👁️‍🗨️ طريقة 2: اكتشاف تباطؤ التنفيذ (عند وضع breakpoints)
    const debuggerDetector = {
        lastTime: Date.now(),
        check: function() {
            const currentTime = Date.now();
            const timeDiff = currentTime - this.lastTime;
            
            // إذا تأخر التنفيذ أكثر من 2 ثانية (مؤشر على وجود debugger)
            if (timeDiff > 2000) {
                return true;
            }
            this.lastTime = currentTime;
            return false;
        }
    };
    
    // 👁️‍🗨️ طريقة 3: اكتشاف خصائص DevTools في كائن window
    const propertyDetector = {
        check: function() {
            try {
                // تحقق من وجود خصائص DevTools
                const div = document.createElement('div');
                div.___testDevTools___ = true;
                
                if (div.___testDevTools___ && 
                    (window.Firebug || 
                     window.console._commandLineAPI || 
                     window.console.__commandLineAPI)) {
                    return true;
                }
                
                // طريقة أخرى
                const isDevTools = /./;
                isDevTools.toString = function() {
                    devToolsDetected = true;
                    return 'devtools';
                };
                
                console.log(isDevTools);
            } catch(e) {
                return false;
            }
            return false;
        }
    };
    
    // 👁️‍🗨️ طريقة 4: اكتشاف الضغطات على المفاتيح (F12, Ctrl+Shift+I, etc.)
    const keyDetector = {
        keyHistory: [],
        check: function(e) {
            // حفظ الضغطات الأخيرة
            this.keyHistory.push({
                key: e.key,
                code: e.keyCode,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
                meta: e.metaKey,
                time: Date.now()
            });
            
            // الاحتفاظ بآخر 10 ضغطات فقط
            if (this.keyHistory.length > 10) {
                this.keyHistory.shift();
            }
            
            // البحث عن أنماط فتح DevTools
            const patterns = [
                // F12
                { key: 'F12', code: 123 },
                // Ctrl+Shift+I
                { ctrl: true, shift: true, code: 73 },
                // Ctrl+Shift+J
                { ctrl: true, shift: true, code: 74 },
                // Ctrl+Shift+C
                { ctrl: true, shift: true, code: 67 },
                // Cmd+Opt+I (Mac)
                { meta: true, alt: true, code: 73 }
            ];
            
            for (const pattern of patterns) {
                const match = this.keyHistory.some(keyEvent => {
                    return (!pattern.key || keyEvent.key === pattern.key) &&
                           (!pattern.code || keyEvent.code === pattern.code) &&
                           (pattern.ctrl === undefined || keyEvent.ctrl === pattern.ctrl) &&
                           (pattern.shift === undefined || keyEvent.shift === pattern.shift) &&
                           (pattern.alt === undefined || keyEvent.alt === pattern.alt) &&
                           (pattern.meta === undefined || keyEvent.meta === pattern.meta);
                });
                
                if (match) {
                    return true;
                }
            }
            
            return false;
        }
    };
    
    // 👁️‍🗨️ طريقة 5: اكتشاف تغيير الـ console.log
    const consoleDetector = {
        originalConsole: {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        },
        
        check: function() {
            // إذا تم تغيير console.log، قد يكون بسبب DevTools
            if (console.log !== this.originalConsole.log ||
                console.warn !== this.originalConsole.warn ||
                console.error !== this.originalConsole.error ||
                console.info !== this.originalConsole.info) {
                return true;
            }
            return false;
        }
    };
    
    // 🛡️ نظام التطهير القسري للـ iframe
    const frameCleaner = {
        cleanAllFrames: function() {
            // إزالة جميع iframes
            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.remove();
            });
            
            // تنظيف جميع blobs
            if (typeof activeBlobUrl !== 'undefined' && activeBlobUrl) {
                URL.revokeObjectURL(activeBlobUrl);
                activeBlobUrl = null;
            }
            
            // تنظيف جميع object URLs
            this.cleanObjectURLs();
            
            // تعطيل الفيديو
            const videoFrame = document.getElementById('siwane-video-frame');
            if (videoFrame) {
                videoFrame.src = '';
                videoFrame.srcdoc = '';
                videoFrame.dataset.cleaned = 'true';
            }
            
            // إظهار رسالة
            this.showWarning();
        },
        
        cleanObjectURLs: function() {
            // محاولة تنظيف جميع Object URLs في الذاكرة
            try {
                if (window.URL && window.URL.revokeObjectURL) {
                    // يمكنك هنا تخزين جميع الـ URLs المخلوقة في مصفوفة
                    // وتنظيفها جميعاً عند الاكتشاف
                }
            } catch(e) {
                console.error('Error cleaning object URLs:', e);
            }
        },
        
        showWarning: function() {
            // إظهار رسالة تحذير
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #f44336;
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 999999;
                text-align: center;
                font-family: Arial, sans-serif;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            `;
            warningDiv.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">⚠️ تم اكتشاف أدوات المطور</h3>
                <p style="margin: 0;">تم إغلاق مشغل الفيديو لأسباب أمنية.</p>
                <button onclick="this.parentElement.remove(); location.reload();" 
                        style="margin-top: 10px; padding: 5px 15px; background: white; color: #f44336; border: none; border-radius: 5px; cursor: pointer;">
                    إعادة تحميل الصفحة
                </button>
            `;
            document.body.appendChild(warningDiv);
            
            // إزالة الرسالة بعد 10 ثواني
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.remove();
                }
            }, 10000);
        }
    };
    
    // 🔍 نظام المراقبة المستمر
    const devToolsMonitor = {
        interval: null,
        
        start: function() {
            // التحقق كل 500 مللي ثانية
            this.interval = setInterval(() => {
                if (!devToolsDetected) {
                    // التحقق بجميع الطرق
                    if (devToolsChecker.check() ||
                        debuggerDetector.check() ||
                        propertyDetector.check() ||
                        consoleDetector.check()) {
                        
                        devToolsDetected = true;
                        this.onDetection();
                    }
                }
            }, 500);
            
            // مراقبة تغيير حجم النافذة
            window.addEventListener('resize', () => {
                if (!devToolsDetected && devToolsChecker.check()) {
                    devToolsDetected = true;
                    this.onDetection();
                }
            });
            
            // مراقبة ضغطات المفاتيح
            document.addEventListener('keydown', (e) => {
                if (!devToolsDetected && keyDetector.check(e)) {
                    devToolsDetected = true;
                    this.onDetection();
                }
            });
            
            // حماية الـ iframe من الفحص
            this.protectIframes();
        },
        
        onDetection: function() {
            console.warn('🚨 تم اكتشاف فتح أدوات المطور!');
            frameCleaner.cleanAllFrames();
            
            // إضافة طبقة حماية إضافية
            this.addExtraProtection();
            
            // إرسال إشارة للخادم (اختياري)
            this.sendDetectionSignal();
        },
        
        protectIframes: function() {
            // حماية iframes من الفحص
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeName === 'IFRAME') {
                                this.protectSingleIframe(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            
            // حماية الـ iframes الموجودة
            document.querySelectorAll('iframe').forEach(iframe => {
                this.protectSingleIframe(iframe);
            });
        },
        
        protectSingleIframe: function(iframe) {
            // منع فتح iframe في نافذة جديدة
            iframe.addEventListener('load', () => {
                try {
                    iframe.contentWindow.open = function() {
                        return null;
                    };
                    
                    // إضافة طبقة حماية للمحتوى
                    iframe.contentDocument.addEventListener('contextmenu', (e) => e.preventDefault());
                    iframe.contentDocument.addEventListener('keydown', (e) => {
                        if (e.keyCode === 123 || // F12
                            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
                            (e.ctrlKey && e.shiftKey && e.keyCode === 74)) { // Ctrl+Shift+J
                            e.preventDefault();
                            frameCleaner.cleanAllFrames();
                        }
                    });
                } catch(e) {
                    // تجاهل أخطاء CORS
                }
            });
        },
        
        addExtraProtection: function() {
            // إضافة طبقة حماية إضافية لمنع إعادة الفتح
            Object.defineProperty(window, 'console', {
                get: function() {
                    throw new Error('غير مسموح بالوصول إلى الكونسول');
                },
                set: function() {}
            });
            
            // منع فتح DevTools عن طريق F12
            document.addEventListener('keydown', (e) => {
                if (e.keyCode === 123 || 
                    (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
                    (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
                    (e.ctrlKey && e.shiftKey && e.keyCode === 67)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
        },
        
        sendDetectionSignal: function() {
            // إرسال إشارة للخادم عن الاكتشاف (اختياري)
            try {
                fetch('/api/devtools-detected', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        timestamp: Date.now(),
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    }),
                    keepalive: true
                });
            } catch(e) {
                // تجاهل الأخطاء
            }
        }
    };
    
    // 🚀 بدء المراقبة عند تحميل الصفحة
    window.addEventListener('DOMContentLoaded', () => {
        // الانتظار قليلاً قبل البدء
        setTimeout(() => {
            devToolsMonitor.start();
        }, 2000);
    });
    
    // 📦 تصدير الوظائف للاستخدام الخارجي
    window.siwaneDevToolsProtection = {
        detect: function() { return devToolsDetected; },
        clean: function() { frameCleaner.cleanAllFrames(); },
        disable: function() { clearInterval(devToolsMonitor.interval); }
    };
})();

// 🎬 تعديل دالة createSecurePlayer لحماية إضافية
function createSecurePlayer(enc) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src * blob: data: 'unsafe-inline' 'unsafe-eval'; frame-src * blob: data:;">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; overflow:hidden; }
        body, html { width:100%; height:100%; background:#000; }
        #video-container { width:100%; height:100%; position:relative; }
        .loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-family:Arial; }
    </style>
</head>
<body>
    <div id="video-container">
        <div class="loading" id="loading-text">جاري تحميل المشغل الآمن...</div>
        <div id="player-wrapper" style="display:none;"></div>
    </div>
    <script>
        (function() {
            // 🔒 نظام الحماية الداخلي
            const internalProtection = {
                init: function() {
                    this.blockDevTools();
                    this.observeChanges();
                    this.cleanMemory();
                },
                
                blockDevTools: function() {
                    // منع فتح DevTools
                    const block = () => {
                        if (window.outerWidth - window.innerWidth > 160 ||
                            window.outerHeight - window.innerHeight > 160) {
                            // إغلاق الصفحة عند اكتشاف DevTools
                            window.location.href = 'about:blank';
                            return;
                        }
                    };
                    
                    setInterval(block, 1000);
                    window.addEventListener('resize', block);
                    
                    // منع الضغطات
                    document.addEventListener('keydown', (e) => {
                        if (e.keyCode === 123 || 
                            (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
                            (e.ctrlKey && e.shiftKey && e.keyCode === 74)) {
                            e.preventDefault();
                            window.location.href = 'about:blank';
                        }
                    });
                },
                
                observeChanges: function() {
                    // مراقبة أي تغييرات في DOM
                    const observer = new MutationObserver(() => {
                        // إذا تمت إضافة عناصر جديدة، قد تكون DevTools
                        if (document.querySelector('*[class*="devtools"], *[id*="devtools"]')) {
                            window.location.href = 'about:blank';
                        }
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true
                    });
                },
                
                cleanMemory: function() {
                    // تنظيف الذاكرة بشكل دوري
                    setInterval(() => {
                        if (window.performance && window.performance.memory) {
                            if (window.performance.memory.usedJSHeapSize > 100000000) {
                                // إذا تجاوز استخدام الذاكرة 100MB، قد يكون بسبب DevTools
                                window.location.href = 'about:blank';
                            }
                        }
                    }, 5000);
                }
            };
            
            // 🔓 فك التشفير وتحميل الفيديو
            function loadVideo() {
                try {
                    const encryptedUrl = "${enc}";
                    const decodedUrl = atob(encryptedUrl.split('').reverse().join(''));
                    
                    // إنشاء iframe ديناميكي
                    const iframe = document.createElement('iframe');
                    iframe.style.cssText = 'width:100%;height:100%;border:none;position:absolute;top:0;left:0;';
                    iframe.allowfullscreen = true;
                    iframe.sandbox = 'allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation allow-popups';
                    iframe.referrerPolicy = 'no-referrer';
                    
                    // إضافة قبل تحميل المحتوى
                    document.getElementById('player-wrapper').appendChild(iframe);
                    
                    // تأخير تحميل الرابط لمنع التتبع
                    setTimeout(() => {
                        iframe.src = decodedUrl;
                        document.getElementById('loading-text').style.display = 'none';
                        document.getElementById('player-wrapper').style.display = 'block';
                        
                        // تنظيف المتغيرات الحساسة
                        window.encryptedUrl = null;
                        window.decodedUrl = null;
                        iframe.contentWindow.eval = null;
                        
                        // تشفير الرابط في الذاكرة
                        const safeUrl = btoa(decodedUrl).split('').reverse().join('');
                        window.safeUrl = safeUrl;
                        
                        // إزالة الرابط الأصلي من أي مكان
                        document.querySelectorAll('*').forEach(el => {
                            if (el.innerHTML && el.innerHTML.includes(decodedUrl)) {
                                el.innerHTML = el.innerHTML.replace(decodedUrl, '');
                            }
                        });
                    }, 300);
                    
                } catch(e) {
                    document.getElementById('loading-text').textContent = 'خطأ في تحميل المشغل';
                }
            }
            
            // 🚀 بدء التنفيذ
            setTimeout(() => {
                internalProtection.init();
                loadVideo();
            }, 100);
        })();
    <\/script>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
}
