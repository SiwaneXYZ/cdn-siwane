// --- 1. الحصول على الإعدادات من وسم السكريبت ---
function getScriptSettings() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        // **التعديل هنا:** تأكد من أن اسم الملف في includes() يطابق اسم ملف السكريبت على CDN
        if (script.src.includes('https://cdn.siwane.xyz/JS/dl-Gdrive-si1xyz.js')) {
            return {
                googleAppsScriptUrl: script.getAttribute('data-google-apps-script-url'),
                googleDriveFileId: script.getAttribute('data-google-drive-file-id')
            };
        }
    }
    console.error("لم يتم العثور على سمات الإعدادات في وسم السكريبت.");
    return null;
}

const settings = getScriptSettings();
if (!settings || !settings.googleAppsScriptUrl || !settings.googleDriveFileId) {
    console.error("إعدادات Google Apps Script URL أو Google Drive File ID مفقودة. يرجى التحقق من سمات data- في وسم السكريبت.");
    document.getElementById('accessMessage').textContent = "خطأ في تهيئة الأداة. يرجى الاتصال بالدعم.";
    document.getElementById('accessMessage').style.display = 'block';
    throw new Error("Configuration Error: Missing Apps Script URL or Drive File ID.");
}

const GOOGLE_APPS_SCRIPT_URL = settings.googleAppsScriptUrl;
const GOOGLE_DRIVE_FILE_ID = settings.googleDriveFileId;

// الحصول على العناصر من DOM باستخدام الـ IDs
const downloadLinkElement = document.getElementById('downloadLink');
const accessMessageElement = document.getElementById('accessMessage');

// --- 2. دالة للتحقق من بيانات المستخدم في localStorage ---
function getUserDataFromLocalStorage() {
    const userDataString = localStorage.getItem('firebaseUserProfileData');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            return userData;
        } catch (e) {
            console.error("خطأ في تحليل بيانات المستخدم من localStorage:", e);
            return null;
        }
    }
    return null;
}

// --- 3. دالة لجلب رابط التنزيل من Google Apps Script ---
async function fetchDownloadLinkFromAppsScript() {
    const requestUrl = `${GOOGLE_APPS_SCRIPT_URL}?fileId=${GOOGLE_DRIVE_FILE_ID}`;

    try {
        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.error) {
            console.error("خطأ من Google Apps Script:", data.error);
            return null;
        } else if (data.downloadUrl) {
            return data.downloadUrl;
        }
        return null;
    } catch (error) {
            console.error("خطأ في الاتصال بـ Google Apps Script:", error);
            return null;
        }
    }

// --- 4. دالة رئيسية للتحقق وتحديث الرابط ---
async function checkAndSetDownloadLink() {
    const userData = getUserDataFromLocalStorage();

    accessMessageElement.style.display = 'none';
    downloadLinkElement.style.pointerEvents = 'none';
    downloadLinkElement.style.opacity = '0.5';

    if (userData) {
        const userEmail = userData.email;
        const isGmail = userEmail && userEmail.endsWith('@gmail.com');
        const isGoogleProvider = userData.provider === 'google';

        if (isGmail && isGoogleProvider) {
            console.log("المستخدم مسجل الدخول بحساب Gmail عبر Google. محاولة جلب رابط التنزيل من Apps Script.");

            const downloadUrl = await fetchDownloadLinkFromAppsScript();
            if (downloadUrl) {
                downloadLinkElement.href = downloadUrl;
                downloadLinkElement.style.pointerEvents = 'auto';
                downloadLinkElement.style.opacity = '1';
                console.log("تم تحديث رابط التنزيل بنجاح.");
            } else {
                displayAccessError("تعذر إنشاء رابط التنزيل. تأكد من إعدادات Apps Script وأذونات الملف.");
            }
        } else {
            console.log("المستخدم ليس لديه حساب Gmail مسجل عبر Google.");
            displayAccessError("للوصول إلى هذا الملف، يرجى التأكد من أنك سجلت الدخول بحساب Google.");
        }
    } else {
        console.log("المستخدم غير مسجل الدخول.");
        displayAccessError("يرجى تسجيل الدخول للوصول إلى هذا الملف.");
    }
}

// --- 5. دالة لعرض رسائل الخطأ ---
function displayAccessError(message) {
    accessMessageElement.textContent = message;
    accessMessageElement.style.display = 'block';
}

// --- 6. تشغيل التحقق عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', () => {
    checkAndSetDownloadLink();
});
