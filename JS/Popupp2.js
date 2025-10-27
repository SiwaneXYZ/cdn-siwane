import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    // تحديد العناصر
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

    function getConfig() {
        if (!firebaseConfigScript) return {};
        try {
            const configData = JSON.parse(firebaseConfigScript.textContent);
            if (configData && configData.apiKey && (configData.appId || configData.projectId)) {
                return {
                    apiKey: configData.apiKey,
                    authDomain: configData.authDomain,
                    projectId: configData.projectId,
                    databaseURL: configData.databaseURL,
                    storageBucket: configData.storageBucket,
                    messagingSenderId: configData.messagingSenderId,
                    appId: configData.appId,
                };
            }
        } catch (e) {
            console.error("Failed to parse Firebase config:", e);
        }
        return {};
    }

    let app;
    let auth = null;
    let config = getConfig();

    // تهيئة Firebase
    if (Object.keys(config).length > 0) {
        try {
            const apps = getApps();
            if (apps.length === 0) {
                app = initializeApp(config);
                console.log("Firebase App initialized.");
            } else {
                app = getApp();
                console.log("Firebase App already initialized.");
            }
        } catch (error) {
            console.error("Firebase initialization failed:", error);
        }
    } else {
        console.warn("Firebase config is missing or invalid. Authentication features may not work.");
    }

    // الحصول على خدمة المصادقة وبدء الاستماع
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
                        } catch (e) {
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
            showLoginPrompt();
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
        }
    } else {
        console.warn("Firebase App is not initialized. Auth state listener will not be set.");
        updateUI(false, null, null);
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

                const isAdmin = userData && userData.isAdmin === true;

                if (adminElement) adminElement.classList.toggle('hidden', !isAdmin);
                if (myProductsElement) myProductsElement.classList.toggle('hidden', isAdmin);
                if (pointsElement) pointsElement.classList.toggle('hidden', isAdmin);

                // تحديث صورة المستخدم
                if (userIconLabel) {
                    let profileImg = userIconLabel.querySelector('.current-profile-image');

                    if (!profileImg) {
                        userIconLabel.innerHTML = '';
                        profileImg = document.createElement('img');
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser', 'current-profile-image');
                        userIconLabel.appendChild(profileImg);
                    }

                    const imageUrl = profileImageUrl || DEFAULT_PROFILE_IMAGE;
                    profileImg.src = imageUrl;

                    profileImg.onerror = function () {
                        this.src = DEFAULT_PROFILE_IMAGE;
                    };

                    userIconLabel.classList.add('logged-in');
                }

            } else {
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');

                if (adminElement) adminElement.classList.add('hidden');
                if (pointsElement) pointsElement.classList.add('hidden');
                if (myProductsElement) myProductsElement.classList.add('hidden');

                if (userIconLabel) {
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

    // دالة عرض اشعار تسجيل الدخول (بدون CSS مُضمن)
    function showLoginPrompt() {
        // مفتاح جديد لهذا الإصدار مع تتبع الوقت
        const promptDismissedData = localStorage.getItem('prompt_dismissed_v13');
        const delayDuration = 5000; // 5 ثواني
        const transitionDuration = 400;

        // التحقق من الوقت المنقضي منذ آخر ظهور (3.5 أيام كحد أدنى)
        if (promptDismissedData) {
            try {
                const dismissedData = JSON.parse(promptDismissedData);
                const now = Date.now();
                const daysSinceLastShow = (now - dismissedData.timestamp) / (1000 * 60 * 60 * 24);

                if (daysSinceLastShow < 3.5) {
                    console.log("Prompt dismissed recently. Not showing.");
                    return;
                }
            } catch (e) {
                console.error("Error parsing prompt dismissal data:", e);
            }
        }

        // متغيرات بلوجر (مأخوذة من الكود الأصلي)
        const blogTitle = typeof data !== 'undefined' && data.blog && data.blog.title ? data.blog.title : 'صوانˣʸᶻ';
        const faviconUrl = typeof data !== 'undefined' && data.blog && data.blog.blogspotFaviconUrl ? data.blog.blogspotFaviconUrl : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh80X00Lvdk3ZJBmgQFmGd1SmDZvqHpPf8D6YhmW7QsWYXyo_Cbo6BFHHdv1r1ocOe4gr5OexjPYYi-9Tp6QFQsfci2WPbFDu6DGFFr4UzhyphenhyphenkbTKFEBEQyPPbuYDM08v9-OU4ySBsI4bNOPtqr-U1fKMmcqRL38XSVE_XvVjFcblgVffq1j18GvYQTZEM8/s1600/favicon.png';

        // التأكد من عدم وجود الإشعار مسبقاً
        if (document.getElementById('login-signup-prompt-dynamic')) {
            return;
        }

        // 1. تعريف الـ HTML
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

        // 2. حقن الـ HTML
        const container = document.createElement('div');
        container.innerHTML = promptHTML;
        document.body.appendChild(container.firstElementChild);

        // 3. تطبيق المنطق
        const popup = document.getElementById('login-signup-prompt-dynamic');
        const dismissButton = document.getElementById('dismiss-prompt-dynamic');

        console.log("Prompt: Attempting to show in", delayDuration, "ms.");

        // منطق العرض
        setTimeout(() => {
            // **التصحيح الحاسم:** فرض الإظهار لتجاوز أي تعارض في CSS القالب
            popup.style.setProperty('display', 'block', 'important');
            console.log("Prompt: set display: block !important.");
            
            setTimeout(() => {
                popup.classList.add('show');
                console.log("Prompt: added .show class. Should be visible now.");
            }, 50);
        }, delayDuration);

        // منطق الإغلاق
        dismissButton.addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.parentNode && popup.parentNode.removeChild(popup); // الإزالة من DOM
                // حفظ وقت الإغلاق للتتبع
                const dismissalData = {
                    timestamp: Date.now(),
                    version: 'v13'
                };
                localStorage.setItem('prompt_dismissed_v13', JSON.stringify(dis missalData));
                console.log("Prompt dismissed and removed from DOM.");
            }, transitionDuration);
        });
    }

    // إضافة مستمعي الأحداث
    if (logoutElement) {
        logoutElement.addEventListener('click', logOut);
    }

    if (adminElement) {
        adminElement.style.cursor = 'pointer';
        adminElement.addEventListener('click', () => {
            window.location.href = '/p/admin.html';
        });
    }

    if (pointsElement) {
        pointsElement.style.cursor = 'pointer';
        pointsElement.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '/p/points.html';
        });
    }

    if (myProductsElement) {
        myProductsElement.style.cursor = 'pointer';
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
