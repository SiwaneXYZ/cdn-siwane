// صفحة التسجيل
var keyCharacters = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'],
    keyDigits = ['wxyzefgnopbcd', '0123456789+/='];

var joinedKeyCharacters = keyCharacters.join('M'),
    joinedKeyDigits = keyDigits.join('q');

// دالة لفتح تسجيل الدخول
function loginOpen(encodedString) {
    var firstFunction = function () {
        var isFirstCall = true;
        return function (context, callback) {
            var innerFunction = isFirstCall ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            isFirstCall = false;
            return innerFunction;
        };
    }();

    var secondFunction = firstFunction(this, function () {
        return secondFunction.toString().search('(((.+)+)+)+$').toString().constructor(secondFunction).search('(((.+)+)+)+$');
    });

    secondFunction();

    var thirdFunction = function () {
        var isFirstCall = true;
        return function (context, callback) {
            var innerFunction = isFirstCall ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            return isFirstCall = false, innerFunction;
        };
    }();

    var fourthFunction = thirdFunction(this, function () {
        var getGlobalContext = function () {
            var globalContext;
            try {
                globalContext = function () {
                    return function () {}.constructor("return this")();
                }();
            } catch (error) {
                globalContext = window;
            }
            return globalContext;
        },
        globalObject = getGlobalContext(),
        consoleObject = globalObject.console = globalObject.console || {},
        consoleMethods = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];

        for (var i = 0; i < consoleMethods.length; i++) {
            var boundFunction = thirdFunction.constructor.prototype.bind(thirdFunction);
            var methodName = consoleMethods[i];
            var originalMethod = consoleObject[methodName] || boundFunction;
            boundFunction.__proto__ = thirdFunction.bind(thirdFunction);
            boundFunction.toString = originalMethod.toString.bind(originalMethod);
            consoleObject[methodName] = boundFunction;
        }
    });

    fourthFunction();

    var decodedString,
        firstChar,
        secondChar,
        thirdChar,
        fourthChar,
        fifthChar,
        sixthChar,
        combinedKeys = joinedKeyCharacters + joinedKeyDigits,
        resultString = '',
        index = 0;

    // فك تشفير السلسلة المشفرة
    for (encodedString = encodedString.replace(/[^A-Za-z0-9+/=]/g, ''); index < encodedString.length;) {
        decodedString = combinedKeys.indexOf(encodedString.charAt(index++)) << 2 | (firstChar = combinedKeys.indexOf(encodedString.charAt(index++))) >> 4;
        secondChar = (15 & firstChar) << 4 | (fifthChar = combinedKeys.indexOf(encodedString.charAt(index++))) >> 2;
        thirdChar = (3 & fifthChar) << 6 | (sixthChar = combinedKeys.indexOf(encodedString.charAt(index++)));
        resultString += String.fromCharCode(decodedString);
        if (64 !== fifthChar) resultString += String.fromCharCode(secondChar);
        if (64 !== sixthChar) resultString += String.fromCharCode(thirdChar);
    }
    return resultString = utf8Decode(resultString);
}
// دالة لفك تشفير UTF-8
function utf8Decode(encodedString) {
    var decodedString = '';
    var index = 0;
    var charCode, nextCharCode, thirdCharCode;

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
            thirdCharCode = encodedString.charCodeAt(index + 2);
            decodedString += String.fromCharCode((15 & charCode) << 12 | (63 & nextCharCode) << 6 | 63 & thirdCharCode);
            index += 3;
        }
    }
    return decodedString;
}

// إعدادات الميتا
var metaTag = document.querySelector('meta[property="og:url"]'),
    metaContent = metaTag.getAttribute('content'),
    splitMetaContent = metaContent.split('://')[1].split('/')[0],
    contentIdentifier = splitMetaContent.replace(/\./g, '_');

// التحقق من تسجيل الدخول
if (splitMetaContent + 'firebaseLogin' === loginOpen(registerSettings.license)) {
    firebase.initializeApp(firebaseConfig);
    var emailInput = document.querySelector('#email'),
        nameInput = document.querySelector('#nama'),
        passwordInput = document.querySelector('#password'),
        notification = document.querySelector('#logNotif');

    // دالة للتحقق من صحة البريد الإلكتروني
    function validateEmail(email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // دالة لإظهار أو إخفاء كلمة المرور
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

    // تحويل البريد الإلكتروني إلى أحرف صغيرة وإزالة الفراغات
    emailInput.addEventListener('keyup', function () {
        this.value = this.value.toLowerCase().replace(/\s/g, '');
    });

    // إزالة الفراغات من كلمة المرور
    passwordInput.addEventListener('keyup', function () {
        this.value = this.value.replace(/\s/g, '');
    });

    // دالة التسجيل
    function register() {
        if (emailInput.value === '') {
            emailInput.focus();
            notification.classList.remove('hidden');
            notification.innerHTML = registerSettings.emailempty;
        } else {
            if (!validateEmail(emailInput.value)) {
                notification.classList.remove('hidden');
                notification.innerHTML = registerSettings.emaileinvalid;
            } else {
                if (nameInput.value === '') {
                    nameInput.focus();
                    notification.classList.remove('hidden');
                    notification.innerHTML = registerSettings.nameempty;
                } else {
                    if (passwordInput.value === '') {
                        passwordInput.focus();
                        notification.classList.remove('hidden');
                        notification.innerHTML = registerSettings.passwordempty;
                    } else {
                        if (passwordInput.value.length < 6) {
                            passwordInput.focus();
                            notification.classList.remove('hidden');
                            notification.innerHTML = registerSettings.passwordlength;
                        } else {
                            notification.classList.remove('hidden');
                            notification.innerHTML = registerSettings.loading;
                            firebase.auth().createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
                                .then(function (authResult) {
                                    var user = authResult.user;
                                    var userProfile = {};
                                    userProfile.displayName = nameInput.value;
                                    return user.updateProfile(userProfile).then(() => {
                                        return user.sendEmailVerification();
                                    });
                                })
                                .then(() => {
                                    document.querySelector('.wrapPop.sukses').classList.remove('hidden');
                                    document.querySelector('.wrapPop.sukses span').innerHTML = emailInput.value;
                                    notification.classList.add('hidden');
                                })
                                .catch(function (error) {
                                    document.querySelector('.wrapPop.fail').classList.remove('hidden');
                                    var errorCode = error.code;
                                    var errorMessage = error.message;
                                    document.querySelector('.wrapPop.fail p').innerHTML = errorMessage;
                                });
                        }
                    }
                }
            }
        }
    }
}
// دالة لإغلاق جميع النوافذ المنبثقة
function closeAllPopups() {
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
