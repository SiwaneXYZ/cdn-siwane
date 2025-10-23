import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    // تحديد العناصر باستخدام aria-label كما في الكود الأصلي
    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const myProductsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;

    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    // قراءة إعدادات Firebase
    const firebaseConfigScript = document.getElementById('json:firebaseconfig');
    let firebaseConfig = {};

    if (firebaseConfigScript) {
        const configText = firebaseConfigScript.textContent;
        try {
            const configData = JSON.parse(configText);
            if (configData && typeof configData === 'object') {
                 firebaseConfig = {
                     apiKey: configData.apiKey,
                     authDomain: configData.authDomain,
                     projectId: configData.projectId,
                     databaseURL: configData.databaseURL,
                     storageBucket: configData.storageBucket,
                     messagingSenderId: configData.messagingSenderId,
                     appId: configData.appId,
                 };

                 if (!firebaseConfig.apiKey || (!firebaseConfig.appId && !firebaseConfig.projectId)) {
                      firebaseConfig = {};
                      console.error("Firebase config is missing apiKey or appId/projectId.");
                 }
            }
        } catch (e) {
            console.error("Failed to parse Firebase config from script tag:", e);
        }
    }

    let app;
    let auth = null;

    // تهيئة Firebase
    const apps = getApps();
    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
               console.log("Firebase App initialized.");
           } catch (error) {
               console.error("Firebase initialization failed:", error);
           }
        } else {
            console.warn("Firebase config is missing or invalid. Authentication features may not work.");
        }
    } else {
       app = getApp();
       console.log("Firebase App already initialized.");
    }

    // الحصول على خدمة المصادقة
    if (app) {
       try {
           auth = getAuth(app);
           console.log("Firebase Auth service obtained.");

           onAuthStateChanged(auth, (user) => {
               if (user) {
                   console.log("User is logged in:", user.uid);

                   const firebaseUserData = {
                       uid: user.uid,
                       displayName: user.displayName,
                       photoURL: user.photoURL,
                       email: user.email,
                   };

                   let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { 
                            cachedUserData = JSON.parse(dataString); 
                        } catch(e) { 
                            console.error("Failed to parse cached user data:", e); 
                            cachedUserData = null; 
                        }
                    }

                   const combinedUserData = {
                       ...cachedUserData,
                       ...firebaseUserData,
                       isAdmin: cachedUserData ? cachedUserData.isAdmin : false
                   };

                   localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(combinedUserData));

                   updateUI(true, combinedUserData, combinedUserData.photoURL || user.photoURL);

               } else {
                   console.log("User is logged out.");
                   localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                   updateUI(false, null, null);
                   // عرض اشعار تسجيل الدخول للمستخدمين غير المسجلين
                   showLoginPrompt();
               }
               
               if (loginCheckbox) {
                   loginCheckbox.checked = false;
               }
           });

       } catch (error) {
           console.error("Failed to get Firebase Auth service:", error);
           updateUI(false, null, null);
           // عرض اشعار تسجيل الدخول في حالة الخطأ أيضاً
           showLoginPrompt();
           if (loginCheckbox) {
                loginCheckbox.checked = false;
           }
       }
    } else {
        console.warn("Firebase App is not initialized. Auth state listener will not be set.");
        updateUI(false, null, null);
        // عرض اشعار تسجيل الدخول
        showLoginPrompt();
        if (loginCheckbox) {
            loginCheckbox.checked = false;
        }
    }

    // تحديث واجهة المستخدم
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                // التحكم في عنصر المشرف
                if (adminElement) {
                    if (userData && userData.isAdmin === true) {
                        adminElement.classList.remove('hidden');
                    } else {
                        adminElement.classList.add('hidden');
                    }
                }

                // التحكم في عنصر "منتجاتي" (إخفاء إذا كان مشرف)
                if (myProductsElement) {
                     if (userData && userData.isAdmin === true) {
                         myProductsElement.classList.add('hidden');
                     } else {
                         myProductsElement.classList.remove('hidden');
                     }
                }

                // التحكم في عنصر "نقاطي" (إخفاء إذا كان مشرف)
                if (pointsElement) {
                     if (userData && userData.isAdmin === true) {
                         pointsElement.classList.add('hidden');
                     } else {
                         pointsElement.classList.remove('hidden');
                     }
                }

                // تحديث صورة المستخدم
                if (userIconLabel) {
                    const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                    if (existingProfileImg) {
                        existingProfileImg.remove();
                    }

                    const imageUrl = profileImageUrl || DEFAULT_PROFILE_IMAGE;
                    
                    const profileImg = document.createElement('img');
                    profileImg.src = imageUrl;
                    profileImg.alt = 'Profile Image';
                    profileImg.classList.add('profileUser');
                    profileImg.classList.add('current-profile-image');
                    
                    profileImg.onerror = function() {
                        this.src = DEFAULT_PROFILE_IMAGE;
                    };
                    
                    userIconLabel.innerHTML = '';
                    userIconLabel.appendChild(profileImg);

                    // تفعيل تأثير الريبل للمستخدمين المسجلين
                    userIconLabel.classList.add('logged-in');
                }

            } else {
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');

                 if (adminElement) adminElement.classList.add('hidden');
                 if (pointsElement) pointsElement.classList.add('hidden');
                 if (myProductsElement) myProductsElement.classList.add('hidden');

                 if (userIconLabel) {
                      const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                      if (existingProfileImg) {
                          existingProfileImg.remove();
                      }
                      userIconLabel.innerHTML = originalIconHtml;
                      userIconLabel.classList.remove('logged-in');
                 }
            }
        }
    }

    // تسجيل الخروج
    function logOut() {
        const performLogoutActions = () => {
            console.log("Performing post-logout cleanup and navigation.");
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            console.warn("Firebase Auth not available. Cannot perform Firebase signOut.");
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null);
            performLogoutActions();
            return;
        }

        console.log("Attempting Firebase signOut...");
        signOut(auth)
            .then(() => {
                console.log("Firebase signOut successful.");
                performLogoutActions();
            })
            .catch((error) => {
                 console.error("Logout failed:", error);
                 performLogoutActions();
            });
    }

    // دالة عرض اشعار تسجيل الدخول
    function showLoginPrompt() {
        // التحقق من الشروط الذكية
        function checkUserLoginStatus() {
            return false; // افتراضي: غير مسجل الدخول
        }
        
        const isLoggedIn = checkUserLoginStatus();
        // مفتاح جديد لهذا الإصدار مع تتبع الوقت
        const promptDismissedData = localStorage.getItem('prompt_dismissed_v13');
        const delayDuration = 5000;
        const transitionDuration = 400;
        
        // التحقق من الوقت المنقضي منذ آخر ظهور (مرتين في الأسبوع كحد أدنى)
        if (promptDismissedData) {
            try {
                const dismissedData = JSON.parse(promptDismissedData);
                const lastDismissed = dismissedData.timestamp;
                const now = Date.now();
                const daysSinceLastShow = (now - lastDismissed) / (1000 * 60 * 60 * 24);
                
                // إذا مر أقل من 3.5 أيام (نصف أسبوع) منذ آخر ظهور، لا تعرض الإشعار
                if (daysSinceLastShow < 3.5) {
                    return;
                }
            } catch (e) {
                console.error("Error parsing prompt dismissal data:", e);
            }
        }

        if (isLoggedIn) {
            return;
        }

        // **متغيرات بلوجر:**
        const blogTitle = typeof data !== 'undefined' && data.blog && data.blog.title ? data.blog.title : 'صوانˣʸᶻ';
        const faviconUrl = typeof data !== 'undefined' && data.blog && data.blog.blogspotFaviconUrl ? data.blog.blogspotFaviconUrl : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh80X00Lvdk3ZJBmgQFmGd1SmDZvqHpPf8D6YhmW7QsWYXyo_Cbo6BFHHdv1r1ocOe4gr5OexjPYYi-9Tp6QFQsfci2WPbFDu6DGFFr4UzhyphenhyphenkbTKFEBEQyPPbuYDM08v9-OU4ySBsI4bNOPtqr-U1fKMmcqRL38XSVE_XvVjFcblgVffq1j18GvYQTZEM8/s1600/favicon.png';

        // 2. **تعريف الـ HTML و CSS كوحدة واحدة**
        const promptHTML = `
            <div id="login-signup-prompt-dynamic" class="browser-notification-bar">
                <div class="prompt-content">
                    <div class="site-info">
                        <img src="${faviconUrl}" alt="${blogTitle} icon" class="site-icon"/>
                        <div class="text-block">
                            <p class="site-name">${blogTitle}</p>
                            <p class="prompt-message">هل أنت جديد هنا؟ سجل الدخول أو أنشئ حسابًا.</p>
                        </div>
                    </div>
                    <div dir="ltr" class="prompt-actions">
                        <a href="/p/login.html" class="action-button">تسجيل الدخول</a>
                        <button id="dismiss-prompt-dynamic" class="secondary-button">ليس الآن</button> 
                    </div>
                </div>
            </div>
        `;

        // 3. **تعريف الـ CSS المخصص مع دعم .drk**
        const promptCSS = `
            /* **1. متغيرات الألوان العامة** */
            :root { 
                --clr-action-primary: var(--linkC, #007aff);
                --clr-text-secondary: #6a6a6a;
            }

            /* **2. تنسيق الوضع الفاتح الافتراضي (إذا لم يكن .drk موجوداً)** */
            .browser-notification-bar {
                --clr-bg: rgba(255, 255, 255, 0.98);
                --clr-text: #1a1a1a;
                --clr-border: rgba(0, 0, 0, 0.1); 
                
                background-color: var(--clr-bg);
                box-shadow: none;
                border: 1px solid var(--clr-border); 
                color: var(--clr-text);
            }

            /* **3. تنسيق الوضع الغامق (عند وجود .drk على <body>)** */
            .drK .browser-notification-bar {
                --clr-bg: rgba(30, 30, 30, 0.98);
                --clr-text: #f0f0f0;
                --clr-border: rgba(255, 255, 255, 0.15); 
                
                background-color: var(--clr-bg);
                box-shadow: none; 
                border: 1px solid var(--clr-border);
                color: var(--clr-text);
            }
            
            /* ---------------------------------------------------- */
            /* **4. التنسيق الثابت والهيكلي لجميع الأجهزة (صف واحد)** */
            /* ---------------------------------------------------- */
            
            .browser-notification-bar {
                position: fixed;
                top: 58px;
                
                /* التوسيط المضمون */
                left: 0;
                right: 0;
                margin-left: auto;
                margin-right: auto;

                z-index: 10000;
                max-width: 650px;
                width: 95%; 
                
                /* خصائص الشكل */
                -webkit-backdrop-filter: blur(12px);
                backdrop-filter: blur(12px);
                border-radius: 8px; 
                /* التباعد الداخلي المتساوي على اليمين واليسار (18px) */
                padding: 18px 18px; 
                display: none;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
                
                /* 🛠️ دعم RTL: يضمن أن المحتوى يمينًا والأزرار يسارًا */
                direction: rtl; 
                
                /* الحركة */
                transform: translate(0, -100%);
                opacity: 0;
                transition: opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
            }
            .browser-notification-bar.show {
                opacity: 1;
                transform: translate(0, 0);
            }
            .prompt-content {
                /* 🛠️ مفتاح التقابل: يضمن أن المحتوى والأزرار على أقصى الأطراف مع وجود كل الفراغ في الوسط مهما كان حجم الشاشة */
                display: flex;
                justify-content: space-between; 
                align-items: center;
            }
            .site-info {
                /* المحتوى (الأيقونة والنص) في اليمين - يلتصق بالحافة اليمنى الداخلية */
                display: flex;
                flex-direction: row; 
                align-items: center; 
                
                /* ❌ لا يوجد margin إضافي هنا. المساحة المتوفرة بينه وبين الأزرار هي الفراغ المركزي */
                flex-grow: 1; 
                min-width: 0;
                flex-shrink: 1; 
            }
            .site-name {
                font-size: 0.95em;
                font-weight: 600;
                margin: 0 0 2px 0;
                color: var(--clr-text);
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis;
            }
            .site-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                /* المسافة بين الأيقونة والنص */
                margin-inline-end: 12px;
                object-fit: contain; 
                flex-shrink: 0;
            }
            .text-block {
                display: flex;
                flex-direction: column;
                min-width: 0;
                text-align: right;
            }
            .prompt-message {
                font-size: 0.85em; 
                color: var(--clr-text-secondary);
                margin: 0;
                white-space: nowrap;
                overflow: hidden; 
                text-overflow: ellipsis;
                line-height: 1.35;
            }
            .prompt-actions {
                display: flex;
                justify-content: flex-start;  /* الأزرار تلتصق باليسار */
                align-items: center;         /* ترتيب رأسي في المنتصف */
                gap: 10px;
                flex-shrink: 0;
            }
            .action-button {
                background-color: var(--clr-action-primary);
                color: white;
                padding: 9px 16px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.9em;
                flex-shrink: 0;
                white-space: nowrap;
                transition: background-color 0.2s;
            }
            .secondary-button {
                background: none;
                border: none;
                color: var(--clr-text-secondary);
                padding: 9px 16px;  /* نفس padding للزر الأول عشان يتوازن */
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.3s ease; /* إضافة transition لجميع الخصائص */
                opacity: 0.8;
                white-space: nowrap;
                border-radius: 8px;  /* إضافة border-radius للتوافق */
                line-height: 1;
                position: relative;
                overflow: hidden;
            }
            /* تأثير Hover للزر الثانوي */
            .secondary-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--clr-text-secondary);
                opacity: 0;
                border-radius: 8px;
                transition: opacity 0.3s ease;
                z-index: -1;
            }
            .secondary-button:hover::before {
                opacity: 0.1;
            }
            .secondary-button:hover {
                opacity: 1;
                transform: translateY(-1px); /* تأثير رفع خفيف */
            }
            .secondary-button:active {
                transform: translateY(0); /* إزالة تأثير الرفع عند النقر */
            }
            
            /* ---------------------------------------------------- */
            /* **تعديل الجوال** */
            /* ---------------------------------------------------- */
            @media (max-width: 500px) {
                .browser-notification-bar { 
                    width: 98%; 
                    padding: 10px 10px; 
                }
                .site-name { font-size: 0.85em; }
                .prompt-message { font-size: 0.75em; }
                .action-button { 
                    padding: 7px 10px; 
                    font-size: 0.8em; 
                }
                .secondary-button { 
                    font-size: 0.8em; 
                    padding: 7px 0; 
                }
            }
        `;

        // 4. **حقن الـ CSS والـ HTML في الصفحة**
        const styleElement = document.createElement('style');
        styleElement.textContent = promptCSS;
        document.head.appendChild(styleElement);

        const container = document.createElement('div');
        container.innerHTML = promptHTML;
        document.body.appendChild(container.firstElementChild);

        // 5. **تطبيق المنطق على العناصر المحقونة**
        const popup = document.getElementById('login-signup-prompt-dynamic');
        const dismissButton = document.getElementById('dismiss-prompt-dynamic');

        // منطق العرض
        setTimeout(() => {
            popup.style.display = 'block'; 
            setTimeout(() => {
                popup.classList.add('show');
            }, 50);
        }, delayDuration);

        // منطق الإغلاق
        dismissButton.addEventListener('click', () => {
            // إضافة تأثير hover قبل الإغلاق
            dismissButton.style.opacity = '1';
            dismissButton.style.transform = 'translateY(-1px)';
            
            // تأخير الإغلاق لملاحظة تأثير hover
            setTimeout(() => {
                popup.classList.remove('show');
                setTimeout(() => {
                     popup.style.display = 'none';
                }, transitionDuration);
                
                // حفظ وقت الإغلاق للتتبع (مرتين في الأسبوع)
                const dismissalData = {
                    timestamp: Date.now(),
                    version: 'v13'
                };
                localStorage.setItem('prompt_dismissed_v13', JSON.stringify(dismissalData));
            }, 150);
        });
    }

    // إضافة مستمعي الأحداث
    if (logoutElement) {
        if (logoutElement.getAttribute('onclick')) {
            logoutElement.removeAttribute('onclick');
        }
        logoutElement.addEventListener('click', logOut);
    }

    if (adminElement) {
        adminElement.style.cursor = 'pointer';
        if (adminElement.getAttribute('onclick')) {
             adminElement.removeAttribute('onclick');
         }
        adminElement.addEventListener('click', () => {
            window.location.href = '/p/admin.html';
        });
    }

    if (pointsElement) {
         pointsElement.style.cursor = 'pointer';
         if (pointsElement.getAttribute('onclick')) {
              pointsElement.removeAttribute('onclick');
          }
         pointsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/points.html';
         });
     }

    if (myProductsElement) {
         myProductsElement.style.cursor = 'pointer';
         if (myProductsElement.getAttribute('onclick')) {
              myProductsElement.removeAttribute('onclick');
          }
         myProductsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/my-products.html';
         });
     }

    if (userIconLabel && loginCheckbox) {
        userIconLabel.style.cursor = 'pointer';
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
        });
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            const isClickOutside = !userIconLabel.contains(target) && !popupWrapper.contains(target);

            if (isClickOutside) {
                loginCheckbox.checked = false;
            }
        }
    });

});
