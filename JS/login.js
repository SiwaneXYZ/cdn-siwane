// صفحة تسجيل الدخول - آخر تحديث 04-03-2024 15:05
var keyCharacters = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'],
    base64Characters = ['wxyzefgnopbcd', '0123456789+/='];

var joinedKeyCharacters = keyCharacters.join('M'),
    joinedBase64Characters = base64Characters.join('q');

// دالة لفتح تسجيل الدخول
function loginOpen(encodedString) {
    var initializeFunction = function () {
        var initialized = true;
        return function (context, callback) {
            var innerFunction = initialized ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            return initialized = false, innerFunction;
        };
    }();

    var checkFunction = initializeFunction(this, function () {
        return checkFunction.toString().search('(((.+)+)+)+$').toString().constructor(checkFunction).search('(((.+)+)+)+$');
    });
    checkFunction();

    var consoleFunction = function () {
        var initialized = true;
        return function (context, callback) {
            var innerFunction = initialized ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            return initialized = false, innerFunction;
        };
    }();

    var consoleCheck = consoleFunction(this, function () {
        var globalContext;
        try {
            var getGlobalContext = function () {
                return function () {}.constructor("return this")();
            };
            globalContext = getGlobalContext();
        } catch (error) {
            globalContext = window;
        }
        var consoleObject = globalContext.console = globalContext.console || {},
            consoleMethods = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];

        for (var i = 0; i < consoleMethods.length; i++) {
            var boundFunction = consoleFunction.constructor.prototype.bind(consoleFunction);
            var methodName = consoleMethods[i];
            var originalMethod = consoleObject[methodName] || boundFunction;
            boundFunction.__proto__ = consoleFunction.bind(consoleFunction);
            boundFunction.toString = originalMethod.toString.bind(originalMethod);
            consoleObject[methodName] = boundFunction;
        }
    });
    consoleCheck();

    var decodedString,
        char1,
        char2,
        char3,
        char4,
        charIndex1,
        charIndex2,
        charIndex3,
        charIndex4,
        combinedCharacters = joinedKeyCharacters + joinedBase64Characters,
        decodedOutput = '',
        index = 0;

    // إزالة الأحرف غير المسموح بها
    for (encodedString = encodedString.replace(/[^A-Za-z0-9+/=]/g, ''); index < encodedString.length;) {
        decodedString = combinedCharacters.indexOf(encodedString.charAt(index++)) << 2 | (charIndex1 = combinedCharacters.indexOf(encodedString.charAt(index++))) >> 4;
        char2 = (15 & charIndex1) << 4 | (charIndex2 = combinedCharacters.indexOf(encodedString.charAt(index++))) >> 2;
        char3 = (3 & charIndex2) << 6 | (charIndex4 = combinedCharacters.indexOf(encodedString.charAt(index++)));
        decodedOutput += String.fromCharCode(decodedString);
        64 !== charIndex2 && (decodedOutput += String.fromCharCode(char2));
        64 !== charIndex4 && (decodedOutput += String.fromCharCode(char3));
    }

    return decodedOutput = utf8Decode(decodedOutput);
}
// دالة لفك تشفير UTF-8
function utf8Decode(encodedString) {
    var decodedString = '', charCode, nextCharCode, nextNextCharCode;
    var index = 0;

    while (index < encodedString.length) {
        charCode = encodedString.charCodeAt(index);
        if (charCode < 128) {
            decodedString += String.fromCharCode(charCode);
            index++;
        } else if (charCode > 191 && charCode < 224) {
            nextCharCode = encodedString.charCodeAt(index + 1);
            decodedString += String.fromCharCode((31 & charCode) << 6 | 63 & nextCharCode);
            index += 2;
        } else {
            nextCharCode = encodedString.charCodeAt(index + 1);
            nextNextCharCode = encodedString.charCodeAt(index + 2);
            decodedString += String.fromCharCode((15 & charCode) << 12 | (63 & nextCharCode) << 6 | 63 & nextNextCharCode);
            index += 3;
        }
    }
    return decodedString;
}

// استخراج معلومات URL
var myMeta = document.querySelector('meta[property="og:url"]'),
    metaContent = myMeta.getAttribute('content'),
    splitMetaContent = metaContent.split('://')[1].split('/')[0];

var contentIdentifier = splitMetaContent.replace(/\./g, '_');

// التحقق من صحة تسجيل الدخول
if (splitMetaContent + 'firebaseLogin' === loginOpen(loginSettings.license)) {
    var userPasswordKey = loginOpen('OwK3SQ4brOFejdu==');
    if (localStorage.getItem('user') != null) {
        window.location.href = loginSettings.redirect;
    }

    var emailInput = document.querySelector('#email'),
        passwordInput = document.querySelector('#password'),
        notification = document.querySelector('#logNotif');

    // دالة للتحقق من صحة البريد الإلكتروني
    function validateEmail(email) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // دالة لإنشاء الأحرف الأولى من الاسم
    function initializeInitials(fullName) {
        var initials = '';
        var nameParts = fullName.split(' ');
        for (var i = 0; i < nameParts.length; i++) {
            initials += nameParts[i][0].toUpperCase();
        }
        return initials;
    }

    // دالة لتبديل عرض كلمة المرور
    function togglePasswordVisibility() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            document.querySelector('.icon1').classList.toggle('hidden');
            document.querySelector('.icon2').classList.toggle('hidden');
        } else {
            passwordInput.type = 'password';
            document.querySelector('.icon1').classList.toggle('hidden');
            document.querySelector('.icon2').classList.toggle('hidden');
        }
    }

    // معالجة إدخال المستخدم
    document.querySelector('#forgotPas').addEventListener('keyup', function () {
        this.value = this.value.toLowerCase().replace(/\s/g, '');
    });
    emailInput.addEventListener('keyup', function () {
        this.value = this.value.toLowerCase().replace(/\s/g, '');
    });
    passwordInput.addEventListener('keyup', function () {
        this.value = this.value.replace(/\s/g, '');
    });

    var loginSession = new Date();

    // دالة لتحويل المستخدم إلى الصفحة المستهدفة
    function loginRedirect() {
        var currentUrl = window.location.href,
            targetUrl = new URLSearchParams(window.location.search).get('target');
        if (targetUrl !== null) {
            window.location.href = targetUrl;
        } else {
            window.location.href = loginSettings.redirect;
        }
    }

    // تسجيل الدخول باستخدام Google
    if (document.querySelector('.loginGoogle')) {
        firebase.initializeApp(firebaseConfig);
        function loginWithGoogle() {
            notification.classList.remove('hidden');
            notification.innerHTML = loginSettings.loading;
            var googleProvider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(googleProvider).then(function (result) {
                var user = result.user;
                handleUserData(user);
            }).catch(function (error) {
                var errorCode = error.code,
                    errorMessage = error.message;
                notification.classList.remove('hidden');
                notification.innerHTML = errorMessage;
            });
        }
    }
}
// دالة لمعالجة بيانات المستخدم
function handleUserData(userData) {
    fetch(firebaseConfig.databaseURL + '/data.json')
        .then(response => response.json())
        .then(data => {
            if (data.hasOwnProperty(userData.uid)) {
                var userId = userData.uid;
                var decryptedData = CryptoJS.AES.decrypt(data[userId], usrPswKey).toString(CryptoJS.enc.Utf8);
                var userDetails = decryptedData.split('{split}');
                var userName = userDetails[1];
                var userPhone = userDetails[2];
                var userMembership = userDetails[3];

                var userInfo = {
                    name: userName,
                    email: userData.email,
                    profile: userData.photoURL,
                    uid: userId,
                    nomor: userPhone,
                    membership: userMembership,
                    sesi: sesiLog
                };
                localStorage.setItem('user', JSON.stringify(userInfo));
            } else {
                var newUserInfo = {
                    name: userData.displayName,
                    email: userData.email,
                    profile: userData.photoURL,
                    uid: userData.uid,
                    nomor: userData.phoneNumber,
                    membership: 'premium-0-0-0',
                    sesi: sesiLog
                };
                localStorage.setItem('user', JSON.stringify(newUserInfo));
            }
            notif.classList.remove('hidden');
            notif.innerHTML = loginSettings.loading;
            setTimeout(function () {
                loginRedirect();
            }, 1000);
        })
        .catch(function (error) {
            var errorMessage = error.message;
            notif.classList.remove('hidden');
            notif.innerHTML = errorMessage;
        });
}

// دالة لتسجيل الدخول
const auth = firebase.auth();
function login() {
    if (emailInput.value === '') {
        emailInput.focus();
        notif.classList.remove('hidden');
        notif.innerHTML = loginSettings.emailempty;
    } else {
        if (!validateEmail(emailInput.value)) {
            notif.classList.remove('hidden');
            notif.innerHTML = loginSettings.emaileinvalid;
        } else if (passwordInput.value === '') {
            passwordInput.focus();
            notif.classList.remove('hidden');
            notif.innerHTML = loginSettings.passwordempty;
        } else {
            notif.classList.remove('hidden');
            notif.innerHTML = loginSettings.loading;
            auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
                .then(function (authResult) {
                    var user = authResult.user;
                    fetch(firebaseConfig.databaseURL + '/data.json')
                        .then(response => response.json())
                        .then(data => {
                            if (data.hasOwnProperty(user.uid)) {
                                const userId = user.uid;
                                const decryptedData = CryptoJS.AES.decrypt(data[userId], usrPswKey).toString(CryptoJS.enc.Utf8);
                                const userDetails = decryptedData.split('{split}');
                                const userPhone = userDetails[2];
                                const userName = userDetails[1];
                                const userMembership = userDetails[3];

                                var userInfo = {
                                    name: userName,
                                    email: user.email,
                                    profile: user.photoURL,
                                    uid: userId,
                                    nomor: userPhone,
                                    membership: userMembership,
                                    sesi: sesiLog
                                };
                                if (user.emailVerified) {
                                    localStorage.setItem('user', JSON.stringify(userInfo));
                                }
                            } else {
                                var newUserInfo = {
                                    name: user.displayName,
                                    email: user.email,
                                    profile: user.photoURL,
                                    uid: user.uid,
                                    nomor: user.phoneNumber,
                                    membership: 'premium-0-0-0',
                                    sesi: sesiLog
                                };
                                if (user.emailVerified) {
                                    localStorage.setItem('user', JSON.stringify(newUserInfo));
                                }
                            }
                        });

                    if (user.emailVerified) {
                        notif.classList.remove('hidden');
                        notif.innerHTML = loginSettings.loading;
                        setTimeout(function () {
                            loginRedirect();
                        }, 1000);
                    } else {
                        document.querySelector('.notverified').classList.remove('hidden');
                        document.querySelector('.notverified span').innerHTML = emailInput.value;
                    }
                })
                .catch(function (error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    notif.classList.remove('hidden');
                    notif.innerHTML = loginSettings.emailpaswrong;
                });
        }
    }
}
// دالة لعرض نموذج استعادة كلمة المرور
function showForgotPassword() {
    document.querySelector('.forgotPas').classList.remove('hidden');
}

// دالة لإرسال بريد إلكتروني للتحقق من كلمة المرور
function sendEmailVerification() {
    var emailInputValue = document.querySelector('#forgotPas').value;
    if (emailInputValue !== '') {
        notif.classList.remove('hidden');
        notif.innerHTML = loginSettings.loading;
        firebase.auth().sendPasswordResetEmail(emailInputValue)
            .then(function () {
                document.querySelector('.wrapPop.sukses').classList.remove('hidden');
                document.querySelector('.notverified span').innerHTML = emailInputValue;
            })
            .catch(function (error) {
                document.querySelector('.wrapPop.fail').classList.remove('hidden');
            });
    }
}

// دالة لإغلاق جميع النوافذ المنبثقة
function closeAllPopups() {
    document.querySelector('#logNotif').classList.add('hidden');
    var popupElements = document.querySelectorAll('.wrapPop');
    popupElements.forEach(function (popup) {
        popup.classList.add('hidden');
    });
}

// التحقق من حالة المستخدم وإعادة تحميل الصفحة إذا لزم الأمر
if (someCondition) {
    window.location.reload();
}

// جلب بيانات المستخدم والتحقق من الحالة
fetch(loginOpen('Xiv0Zia6md9gY2hzYB1qXNK4TRynWLPwSRPghH1dhLvBmwWzZwPBSRrEXQ8oS29nmd9wXRkESwKqWOcpW2EomwzqY24=='))
    .then(response => response.json())
    .then(data => {
        if (!data.user || data.user[contentIdentifier] !== true) {
            window.location.reload();
        }
    })
    .catch(error => {
        window.location.reload();
    });
