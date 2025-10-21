// 1. تحديث قائمة الاستيراد: إضافة Firestore
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'; // <-- إضافة جديدة

document.addEventListener('DOMContentLoaded', () => {
    // --- عناصر الواجهة (كما هي) ---
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); 
    const sudahLogDiv = document.querySelector('.DonLog'); 

    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const productsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;

    // --- متغيرات عامة (كما هي) ---
    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; 
    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';
    let colorToggleInterval = null;

    // --- جلب الإعدادات (كما هي) ---
    let firebaseConfig = {};
    let ownerAdminEmail = ''; 
    if (typeof encryptedBase64 !== 'undefined' && encryptedBase64.customSettings) {
        firebaseConfig = encryptedBase64.customSettings.firebase;
        ownerAdminEmail = encryptedBase64.customSettings.ownerAdminEmail;
    } else {
        console.error("Popup.js: Custom settings (encryptedBase64) not found.");
    }

    // --- تهيئة Firebase (تحديث: إضافة db) ---
    let app;
    let auth = null;
    let db = null; // <-- إضافة جديدة

    const apps = getApps();
    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
           } catch (error) {
               console.error("Firebase initialization failed:", error);
           }
        } else {
            console.warn("Firebase config is missing or invalid.");
        }
    } else {
       app = getApp();
    }

    if (app) {
       try {
           auth = getAuth(app);
           db = getFirestore(app); // <-- تهيئة Firestore
       } catch (error) {
           console.error("Failed to get Firebase Auth/Firestore service:", error);
       }
    }
    // --- نهاية التهيئة ---

    
    /**
     * [مهم جداً] دالة حساب الأدوار (كما هي، مستنسخة من profile.js)
     * تحسب الأدوار بناءً على البيانات المخزنة أو التي تم جلبها.
     */
    function getCalculatedRoles(storedData, currentUser) {
        const roles = {
            isOwner: false,
            isAdmin: false,
            isVIP: false,
            isPremium: false,
            isAdFree: false,
        };

        if (!storedData || !currentUser) {
            return roles;
        }

        // 1. المالك والمدير
        const isEmailOwner = currentUser.email && ownerAdminEmail &&
                             currentUser.email.toLowerCase() === ownerAdminEmail.toLowerCase();
        
        if (isEmailOwner) {
            roles.isOwner = true;
            roles.isAdmin = true;
        } else if (storedData.isAdmin === true) {
            roles.isAdmin = true;
        }

        // 2. العضوية
        const accountType = (storedData.accountType || 'normal').toLowerCase();
        if (accountType === 'vipp') {
            roles.isVIP = true;
        }

        // 3. البريميوم (يعتمد على تاريخ الانتهاء)
        const premiumExpiry = storedData.premiumExpiry; 
        const isPremiumActive = premiumExpiry && (premiumExpiry.seconds * 1000) > Date.now();
        
        if (accountType === 'premium' || isPremiumActive) {
            roles.isPremium = true;
        }

        // 4. معفي من الإعلانات (يعتمد على تاريخ الانتهاء)
        const adFreeExpiry = storedData.adFreeExpiry; 
        const isAdFreePermanent = (adFreeExpiry === null);
        const isAdFreeTemporary = adFreeExpiry && (adFreeExpiry.seconds * 1000) > Date.now();

        if (isAdFreePermanent || isAdFreeTemporary) {
            roles.isAdFree = true;
        }
        
        // 5. VIP يشمل البريميوم والإعفاء
        if (roles.isVIP) {
            roles.isPremium = true;
            roles.isAdFree = true;
        }

        return roles;
    }


    // =================================================================
    //  --- [تحديث جوهري] onAuthStateChanged (الآن يجلب البيانات إذا لزم الأمر) ---
    // =================================================================
    if (auth && db) { // <-- التأكد من وجود Auth و DB
        onAuthStateChanged(auth, async (user) => { // <-- الدالة أصبحت async
            if (user) {
                let cachedUserData = null;
                
                // 1. محاولة القراءة من localStorage (المسار السريع)
                const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                if (dataString) {
                    try { cachedUserData = JSON.parse(dataString); } catch (e) { cachedUserData = null; }
                }

                // 2. التحقق من صحة الكاش. إذا لم يكن صالحاً، اجلبه من Firestore (المسار البطيء)
                if (!cachedUserData || cachedUserData.uid !== user.uid) {
                    console.log("Popup.js: لا يوجد كاش، جاري الجلب من Firestore...");
                    try {
                        const userDocRef = doc(db, 'users', user.uid);
                        const userDoc = await getDoc(userDocRef);

                        if (userDoc.exists()) {
                            const firestoreData = userDoc.data();
                            
                            // 3. بناء كائن بيانات مطابق لما يحفظه profile.js
                            const dataToSave = {
                                uid: user.uid,
                                accountType: firestoreData.accountType || 'normal',
                                emailVerified: firestoreData.emailVerified === true,
                                fullName: firestoreData.fullName || user.displayName,
                                username: firestoreData.username,
                                phoneNumber: firestoreData.phoneNumber,
                                email: user.email,
                                isAdmin: firestoreData.isAdmin === true,
                                // الأولوية لصورة الحساب (Auth) لأنها أحدث
                                photoURL: user.photoURL || firestoreData.photoURL, 
                                createdAt: firestoreData.createdAt,
                                provider: firestoreData.provider,
                                points: firestoreData.points,
                                totalPointsEarned: firestoreData.totalPointsEarned,
                                totalExchanges: firestoreData.totalExchanges,
                                premiumExpiry: firestoreData.premiumExpiry,
                                adFreeExpiry: firestoreData.adFreeExpiry,
                            };

                            // 4. حفظ البيانات التي تم جلبها في localStorage للصفحات التالية
                            localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(dataToSave));
                            cachedUserData = dataToSave; // استخدام هذه البيانات الجديدة
                        
                        } else {
                            // حالة خطأ: المستخدم مسجل دخول ولكن ليس له ملف
                            console.error("Popup.js: المستخدم موجود في Auth ولكن غير موجود في Firestore.");
                            updateUI(false, null, null); // التعامل معه كأنه مسجل خروج
                            if (loginCheckbox) loginCheckbox.checked = false;
                            return; // إيقاف التنفيذ
                        }
                    } catch (fetchError) {
                        console.error("Popup.js: خطأ أثناء جلب بيانات المستخدم:", fetchError);
                        updateUI(false, null, null); // فشل الجلب، اعتبره مسجل خروج
                        if (loginCheckbox) loginCheckbox.checked = false;
                        return; // إيقاف التنفيذ
                    }
                }

                // 5. الآن، `cachedUserData` موجود (إما من الكاش أو من الجلب)
                const calculatedRoles = getCalculatedRoles(cachedUserData, user);
                const displayData = {
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    email: user.email,
                    ...calculatedRoles 
                };
                
                const finalPhotoURL = cachedUserData.photoURL || user.photoURL || DEFAULT_PROFILE_IMAGE;
                
                updateUI(true, displayData, finalPhotoURL);

            } else {
                // مستخدم غير مسجل الدخول
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                updateUI(false, null, null);
            }
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
        });
    } else {
        // فشل تهيئة Auth أو DB
        updateUI(false, null, null);
        if (loginCheckbox) loginCheckbox.checked = false;
    }
    // =================================================================
    //           --- نهاية التحديث الجوهري ---
    // =================================================================


    /**
     * (دالة تطبيق الأدوار) - (كما هي، لا تغيير)
     */
    function applyRoleClasses(element, userData) {
        const allRoleClasses = ['owner', 'admin', 'vipp', 'premium', 'adfree', 'normal'];
        const allBorderClasses = allRoleClasses.map(r => `border-${r}`);
        const allRippleClasses = allRoleClasses.map(r => `ripple-${r}`);
        const allRoleClassesSvg = allRoleClasses.map(r => `role-${r}`);

        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        element.classList.remove(...allRippleClasses, ...allRoleClassesSvg);
        const profileImage = element.querySelector('.current-profile-image');
        if (profileImage) {
            profileImage.classList.remove(...allBorderClasses);
        }

        const isLoggedOut = !userData || !userData.uid;
        if (isLoggedOut) {
            return; // لا تطبق أي لون (للحفاظ على SVG الأصلي)
        }

        const hasPremium = userData.isPremium;
        const hasAdFree = userData.isAdFree;
        const isSpecialToggleCase = hasPremium && hasAdFree && !userData.isOwner && !userData.isAdmin;

        if (isSpecialToggleCase) {
            // --- حالة التناوب ---
            const toggleRoles = ['premium', 'adfree'];
            const toggleBorderClasses = toggleRoles.map(r => `border-${r}`);
            const toggleRippleClasses = toggleRoles.map(r => `ripple-${r}`);
            let colorIndex = 0;
            element.classList.add('role-premium'); 

            const toggleColors = () => {
                const currentRole = toggleRoles[colorIndex % toggleRoles.length];
                colorIndex++;
                const currentBorderClass = `border-${currentRole}`;
                const currentRippleClass = `ripple-${currentRole}`;
                if (profileImage) profileImage.classList.remove(...toggleBorderClasses);
                element.classList.remove(...toggleRippleClasses);
                if (profileImage) profileImage.classList.add(currentBorderClass);
                element.classList.add(currentRippleClass);
            };
            toggleColors();
            colorToggleInterval = setInterval(toggleColors, 3000);
        } else {
            // --- حالة اللون الثابت (الأولوية) ---
            const rolesPriority = [
                { check: userData.isOwner, className: 'owner' },
                { check: userData.isAdmin, className: 'admin' },
                { check: userData.isVIP, className: 'vipp' },
                { check: userData.isPremium, className: 'premium' },
                { check: userData.isAdFree, className: 'adfree' },
            ];
            let primaryRole = 'normal';
            for (const role of rolesPriority) {
                if (role.check) {
                    primaryRole = role.className;
                    break; 
                }
            }
            const primaryBorderClass = `border-${primaryRole}`;
            const primaryRoleClass = `role-${primaryRole}`;
            const primaryRippleClass = `ripple-${primaryRole}`;
            if (profileImage) profileImage.classList.add(primaryBorderClass);
            element.classList.add(primaryRoleClass, primaryRippleClass); 
        }
    }


    /**
     * (دالة تحديث الواجهة) - (كما هي، لا تغيير)
     */
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (userIconLabel) userIconLabel.classList.remove('logged-in');
        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        if (belumLogDiv && sudahLogDiv && userIconLabel) {
            if (isLoggedIn && userData) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');
                userIconLabel.classList.add('logged-in');
                const finalImageUrl = profileImageUrl || DEFAULT_PROFILE_IMAGE;

                let profileImg = userIconLabel.querySelector('.current-profile-image');
                if (!profileImg) {
                    profileImg = document.createElement('img');
                    profileImg.classList.add('profileUser', 'current-profile-image');
                    userIconLabel.innerHTML = '';
                    userIconLabel.appendChild(profileImg);
                }
                profileImg.src = finalImageUrl;
                
                // (userData.isAdmin يتضمن المالك)
                const isAdminOrOwner = (userData.isAdmin === true); 

                if (adminElement) adminElement.classList.toggle('hidden', !isAdminOrOwner);
                if (pointsElement) pointsElement.classList.toggle('hidden', isAdminOrOwner);
                if (productsElement) productsElement.classList.toggle('hidden', isAdminOrOwner);
                
                applyRoleClasses(userIconLabel, userData);

            } else { // Not logged in
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');
                 if (adminElement) adminElement.classList.add('hidden');
                 if (pointsElement) pointsElement.classList.add('hidden');
                 if (productsElement) productsElement.classList.add('hidden');

                 const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                 if (existingProfileImg) existingProfileImg.remove();
                 if (!userIconLabel.querySelector('svg')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
                 applyRoleClasses(userIconLabel, null); 
            }
        }
    }

    // --- (مستمعي الأحداث وتسجيل الخروج) - (كما هي، لا تغيير) ---
    function logOut() {
        const performLogoutActions = () => {
            if (loginCheckbox) { loginCheckbox.checked = false; }
            window.location.href = "/p/login.html";
        };
        if (!auth) {
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null);
            performLogoutActions();
            return;
        }
        signOut(auth)
            .catch(() => { /* سيتم إعادة التوجيه في كل الأحوال */ })
            .finally(() => {
                // onAuthStateChanged سيهتم بمسح localStorage
                performLogoutActions();
            });
    }

    if (logoutElement) logoutElement.addEventListener('click', logOut);
    if (adminElement) adminElement.addEventListener('click', () => { window.location.href = '/p/admin.html'; });
    if (pointsElement) pointsElement.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/p/points.html'; });
    if (userIconLabel && loginCheckbox) {
        userIconLabel.addEventListener('click', (e) => { e.preventDefault(); loginCheckbox.checked = !loginCheckbox.checked; });
    }
    document.addEventListener('click', (e) => {
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            if (!userIconLabel.contains(e.target) && !popupWrapper.contains(e.target)) {
                loginCheckbox.checked = false;
            }
        }
    });
});
