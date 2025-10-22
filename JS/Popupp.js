import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // العناصر الأساسية
    const elements = {
        loginCheckbox: document.getElementById('forlogPop'),
        userIconLabel: document.querySelector('.logReg'),
        popupWrapper: document.querySelector('.logPop-wrp'),
        belumLogDiv: document.querySelector('.NotLog'),
        sudahLogDiv: document.querySelector('.DonLog')
    };

    if (!validateElements(elements)) return;

    // الثوابت
    const CONSTANTS = {
        STORAGE_KEY: 'firebaseUserProfileData',
        DEFAULT_IMAGE: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        PATHS: {
            login: '/p/login.html',
            admin: '/p/admin.html', 
            points: '/p/points.html',
            products: '/p/my-products.html'
        }
    };

    const originalIconHtml = elements.userIconLabel.innerHTML;
    const firebaseConfig = getFirebaseConfig();
    
    if (!firebaseConfig) {
        console.warn("Firebase config missing - auth features disabled");
        updateUI(false, elements, CONSTANTS, originalIconHtml);
        return;
    }

    // تهيئة Firebase
    const app = initializeFirebase(firebaseConfig);
    if (!app) {
        updateUI(false, elements, CONSTANTS, originalIconHtml);
        return;
    }

    const auth = getAuth(app);
    setupAuthListener(auth, elements, CONSTANTS, originalIconHtml);
    setupEventListeners(elements, auth, CONSTANTS);
});

// الدوال المساعدة
function validateElements(elements) {
    const required = ['userIconLabel', 'belumLogDiv', 'sudahLogDiv', 'popupWrapper', 'loginCheckbox'];
    return required.every(key => {
        if (!elements[key]) {
            console.warn(`Element ${key} not found`);
            return false;
        }
        return true;
    });
}

function getFirebaseConfig() {
    const script = document.getElementById('json:firebaseconfig');
    if (!script) return null;

    try {
        const config = JSON.parse(script.textContent);
        if (!config.apiKey || (!config.appId && !config.projectId)) {
            throw new Error("Missing required Firebase config fields");
        }
        return config;
    } catch (error) {
        console.error("Invalid Firebase config:", error);
        return null;
    }
}

function initializeFirebase(config) {
    try {
        return getApps().length === 0 ? initializeApp(config) : getApp();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        return null;
    }
}

function setupAuthListener(auth, elements, CONSTANTS, originalIconHtml) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            handleUserLogin(user, CONSTANTS);
        } else {
            handleUserLogout(CONSTANTS);
        }
        updateAuthUI(user, elements, CONSTANTS, originalIconHtml);
        if (elements.loginCheckbox) elements.loginCheckbox.checked = false;
    });
}

function handleUserLogin(user, CONSTANTS) {
    const cachedData = getCachedUserData(CONSTANTS.STORAGE_KEY);
    const userData = {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
        isAdmin: cachedData?.isAdmin || false
    };
    
    localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(userData));
    return userData;
}

function handleUserLogout(CONSTANTS) {
    localStorage.removeItem(CONSTANTS.STORAGE_KEY);
}

function getCachedUserData(storageKey) {
    try {
        return JSON.parse(localStorage.getItem(storageKey));
    } catch {
        return null;
    }
}

function updateAuthUI(user, elements, CONSTANTS, originalIconHtml) {
    const isLoggedIn = !!user;
    const userData = getCachedUserData(CONSTANTS.STORAGE_KEY);
    
    elements.belumLogDiv.classList.toggle('hidden', isLoggedIn);
    elements.sudahLogDiv.classList.toggle('hidden', !isLoggedIn);

    if (isLoggedIn) {
        setupLoggedInUI(elements, userData, CONSTANTS);
        updateUserIcon(elements.userIconLabel, userData?.photoURL || CONSTANTS.DEFAULT_IMAGE, true);
    } else {
        setupLoggedOutUI(elements);
        updateUserIcon(elements.userIconLabel, null, false, originalIconHtml);
    }
}

function setupLoggedInUI(elements, userData, CONSTANTS) {
    const { adminElement, pointsElement, myProductsElement } = getMenuElements(elements.sudahLogDiv);
    const isAdmin = userData?.isAdmin === true;

    // إظهار/إخفاء العناصر بناءً على صلاحية المشرف
    [pointsElement, myProductsElement].forEach(el => el?.classList.toggle('hidden', isAdmin));
    adminElement?.classList.toggle('hidden', !isAdmin);
}

function setupLoggedOutUI(elements) {
    const { adminElement, pointsElement, myProductsElement } = getMenuElements(elements.sudahLogDiv);
    [adminElement, pointsElement, myProductsElement].forEach(el => el?.classList.add('hidden'));
}

function getMenuElements(container) {
    return {
        adminElement: container?.querySelector('div.loginS[aria-label="ادمن"]'),
        logoutElement: container?.querySelector('div.loginS[aria-label="الخروج"]'),
        pointsElement: container?.querySelector('a.loginS[aria-label="نقاطي"]'),
        myProductsElement: container?.querySelector('a.loginS[aria-label="منتجاتي"]')
    };
}

function updateUserIcon(iconLabel, imageUrl, isLoggedIn, originalHtml = '') {
    const existingImg = iconLabel.querySelector('.current-profile-image');
    if (existingImg) existingImg.remove();

    if (isLoggedIn) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Profile Image';
        img.className = 'profileUser current-profile-image';
        img.onerror = () => { img.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; };
        
        iconLabel.innerHTML = '';
        iconLabel.appendChild(img);
        iconLabel.classList.add('logged-in');
    } else {
        iconLabel.innerHTML = originalHtml;
        iconLabel.classList.remove('logged-in');
    }
}

function setupEventListeners(elements, auth, CONSTANTS) {
    const menuElements = getMenuElements(elements.sudahLogDiv);
    
    // مستمعي الأحداث للقائمة
    Object.entries({
        [menuElements.logoutElement]: () => handleLogout(auth, elements.loginCheckbox, CONSTANTS.PATHS.login),
        [menuElements.adminElement]: () => navigateTo(CONSTANTS.PATHS.admin),
        [menuElements.pointsElement]: () => navigateTo(CONSTANTS.PATHS.points),
        [menuElements.myProductsElement]: () => navigateTo(CONSTANTS.PATHS.products)
    }).forEach(([element, handler]) => {
        if (element) {
            element.style.cursor = 'pointer';
            element.removeAttribute('onclick');
            element.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
                // إغلاق القائمة بعد النقر على أي عنصر
                if (elements.loginCheckbox) {
                    elements.loginCheckbox.checked = false;
                }
            });
        }
    });

    // فتح/إغلاق البوب أب
    if (elements.userIconLabel && elements.loginCheckbox) {
        elements.userIconLabel.style.cursor = 'pointer';
        elements.userIconLabel.addEventListener('click', (e) => {
            e.preventDefault();
            elements.loginCheckbox.checked = !elements.loginCheckbox.checked;
        });
    }

    // إغلاق البوب أب عند النقر في أي مكان في الصفحة
    document.addEventListener('click', (e) => {
        if (elements.loginCheckbox && elements.loginCheckbox.checked) {
            elements.loginCheckbox.checked = false;
        }
    });

    // منع إغلاق البوب أب عند النقر على أيقونة المستخدم نفسه
    if (elements.userIconLabel) {
        elements.userIconLabel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // منع إغلاق البوب أب عند النقر داخل القائمة نفسها (اختياري - إذا أردت أن تغلق حتى عند النقر داخلها)
    // إذا أردت أن تغلق حتى عند النقر داخل القائمة، احذف هذا الجزء
    if (elements.popupWrapper) {
        elements.popupWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

function handleLogout(auth, loginCheckbox, loginPath) {
    const logoutActions = () => {
        if (loginCheckbox) loginCheckbox.checked = false;
        window.location.href = loginPath;
    };

    if (!auth) {
        localStorage.removeItem('firebaseUserProfileData');
        logoutActions();
        return;
    }

    signOut(auth).then(logoutActions).catch(logoutActions);
}

function navigateTo(path) {
    window.location.href = path;
}

// وظيفة مساعدة للتحديث من الخارج إذا لزم الأمر
function updateUI(isLoggedIn, elements, CONSTANTS, originalIconHtml) {
    if (!elements) return;
    
    elements.belumLogDiv.classList.toggle('hidden', isLoggedIn);
    elements.sudahLogDiv.classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn) {
        updateUserIcon(elements.userIconLabel, CONSTANTS.DEFAULT_IMAGE, true);
    } else {
        updateUserIcon(elements.userIconLabel, null, false, originalIconHtml);
    }
}
