// ===== AuFAM.js اصدار 1.0 بتاريخ 12 يونيو 205 Automated File Access Manager V1 ===== // 
  // --- العناصر DOM ---
  const downloadButton = document.getElementById('downloadButton');
  const notLoggedInMessage = document.getElementById('notLoggedInMessage');
  const googleLoginRequiredMessage = document.getElementById('googleLoginRequiredMessage');
  const readyToDownloadMessage = document.getElementById('readyToDownloadMessage');
  const processingMessage = document.getElementById('processingMessage');
  const generalErrorMessage = document.getElementById('generalErrorMessage');

  // --- وظائف المساعدة لإدارة عرض الرسائل ---
  function hideAllMessages() {
    notLoggedInMessage.style.display = 'none';
    googleLoginRequiredMessage.style.display = 'none';
    readyToDownloadMessage.style.display = 'none';
    processingMessage.style.display = 'none';
    generalErrorMessage.style.display = 'none';
  }

  function showMessage(element) {
    hideAllMessages();
    element.style.display = 'block';
  }

  function disableDownloadButton() {
    downloadButton.style.pointerEvents = 'none';
    downloadButton.style.opacity = '0.5';
    downloadButton.href = '#';
  }

  function enableDownloadButton(fileUrl) {
    downloadButton.style.pointerEvents = 'auto';
    downloadButton.style.opacity = '1';
    downloadButton.href = fileUrl;
  }

  // --- المنطق الرئيسي للتحقق والتعامل مع التحميل ---
  async function initializeDownloadProcess() {
    hideAllMessages();
    disableDownloadButton();

    const userDataString = localStorage.getItem('firebaseUserProfileData');

    // 1. التحقق من تسجيل الدخول
    if (!userDataString) {
      showMessage(notLoggedInMessage);
      return;
    }

    const userData = JSON.parse(userDataString);
    
    // 2. فحص البريد الإلكتروني (@gmail.com)
    if (!userData.email || !userData.email.endsWith('@gmail.com')) {
      showMessage(googleLoginRequiredMessage); 
      return;
    }

    showMessage(processingMessage);

    try {
      // إرسال طلب إلى Google Apps Script
      const response = await fetch(appSettings.appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: userData.email,
          requestedFileId: appSettings.googleDriveFileId // معرف الملف من إعدادات الواجهة الأمامية
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        const driveDownloadLink = `https://drive.google.com/file/d/${appSettings.googleDriveFileId}/view?usp=sharing`;
        enableDownloadButton(driveDownloadLink);
        showMessage(readyToDownloadMessage);
      } else {
        console.error('Apps Script Error:', result.message || 'Unknown error from Apps Script');
        showMessage(generalErrorMessage);
      }

    } catch (error) {
      console.error('Network or communication error:', error);
      showMessage(generalErrorMessage);
    }
  }

  // استدعاء الوظيفة عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', initializeDownloadProcess);
