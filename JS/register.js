// إعدادات الصفحة للتسجيل
var kyO = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'],
    kyT = ['wxyzefgnopbcd', '0123456789+/='],
    jkyO = kyO.join('M'),
    jkyT = kyT.join('q');

function loginOpen(encodedString) {
  var decodedString = '';
  var chars = jkyO + jkyT;

  // إزالة الأحرف غير الصالحة
  encodedString = encodedString.replace(/[^A-Za-z0-9+/=]/g, '');

  // فك تشفير النص المشفر
  for (var i = 0; i < encodedString.length;) {
    var a = chars.indexOf(encodedString.charAt(i++)) << 2 | (b = chars.indexOf(encodedString.charAt(i++))) >> 4,
        c = (b & 15) << 4 | (d = chars.indexOf(encodedString.charAt(i++))) >> 2,
        e = (d & 3) << 6 | (f = chars.indexOf(encodedString.charAt(i++)));

    decodedString += String.fromCharCode(a);
    if (d !== 64) decodedString += String.fromCharCode(c);
    if (f !== 64) decodedString += String.fromCharCode(e);
  }

  return utf8Decode(decodedString);
}

function utf8Decode(str) {
  var result = '';
  var i = 0;

  // فك تشفير UTF-8
  while (i < str.length) {
    var charCode = str.charCodeAt(i);
    if (charCode < 128) {
      result += String.fromCharCode(charCode);
      i++;
    } else if (charCode > 191 && charCode < 224) {
      var nextChar = str.charCodeAt(i + 1);
      result += String.fromCharCode(((charCode & 31) << 6) | (nextChar & 63));
      i += 2;
    } else {
      var nextChar1 = str.charCodeAt(i + 1);
      var nextChar2 = str.charCodeAt(i + 2);
      result += String.fromCharCode(((charCode & 15) << 12) | ((nextChar1 & 63) << 6) | (nextChar2 & 63));
      i += 3;
    }
  }

  return result;
}

var myMeta = document.querySelector('meta[property="og:url"]');
var mContent = myMeta.getAttribute('content');
var splitmContent = mContent.split('://')[1].split('/')[0];
var contentFnsh = splitmContent.replace(/\./g, '_');

// تهيئة Firebase
if (splitmContent + 'firebaseLogin') {
  firebase.initializeApp(firebaseConfig);

  var email = document.querySelector('#email');
  var name = document.querySelector('#nama');
  var password = document.querySelector('#password');
  var notif = document.querySelector('#logNotif');

  // التحقق من صحة البريد الإلكتروني
  function validateEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // إظهار/إخفاء كلمة المرور
  function showPassword() {
    if (password.type === 'password') {
      password.type = 'text';
      document.querySelector('.icon1').classList.toggle('hidden');
      document.querySelector('.icon2').classList.toggle('hidden');
    } else {
      password.type = 'password';
      document.querySelector('.icon1').classList.toggle('hidden');
      document.querySelector('.icon2').classList.toggle('hidden');
    }
  }

  // تحويل البريد الإلكتروني إلى حروف صغيرة وإزالة المسافات
  email.addEventListener('keyup', function () {
    this.value = this.value.toLowerCase().replace(/\s/g, '');
  });

  // إزالة المسافات من كلمة المرور
  password.addEventListener('keyup', function () {
    this.value = this.value.replace(/\s/g, '');
  });

  // التحقق من البيانات وإتمام التسجيل
  function register() {
    if (email.value === '') {
      email.focus();
      notif.classList.remove('hidden');
      notif.innerHTML = registerSettings.emailempty;
    } else {
      if (!validateEmail(email.value)) {
        notif.classList.remove('hidden');
        notif.innerHTML = registerSettings.emaileinvalid;
      } else {
        if (name.value === '') {
          name.focus();
          notif.classList.remove('hidden');
          notif.innerHTML = registerSettings.nameempty;
        } else {
          if (password.value === '') {
            password.focus();
            notif.classList.remove('hidden');
            notif.innerHTML = registerSettings.passwordempty;
          } else {
            if (password.value.length < 6) {
              password.focus();
              notif.classList.remove('hidden');
              notif.innerHTML = registerSettings.passwordlength;
            } else {
              notif.classList.remove('hidden');
              notif.innerHTML = registerSettings.loading;
              
              // إنشاء حساب جديد عبر Firebase
              firebase.auth().createUserWithEmailAndPassword(email.value, password.value)
                .then(userCredential => {
                  var user = userCredential.user;
                  var updateInfo = { displayName: name.value };
                  
                  // تحديث معلومات المستخدم وإرسال رسالة التحقق
                  return user.updateProfile(updateInfo).then(() => {
                    return user.sendEmailVerification();
                  });
                })
                .then(() => {
                  document.querySelector('.wrapPop.sukses').classList.remove('hidden');
                  document.querySelector('.wrapPop.sukses span').innerHTML = email.value;
                  notif.classList.add('hidden');
                })
                .catch(error => {
                  document.querySelector('.wrapPop.fail').classList.remove('hidden');
                  document.querySelector('.wrapPop.fail p').innerHTML = error.message;
                });
            }
          }
        }
      }
    }
  }

  // إغلاق النوافذ المنبثقة
  function closeAll() {
    var popups = document.querySelectorAll('.wrapPop');
    popups.forEach(function (popup) {
      popup.classList.add('hidden');
    });
  }
} else {
  window.location.reload();
}
