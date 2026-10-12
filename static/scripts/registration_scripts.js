//wires the registration form to the shared validation helpers in validation.js
document.addEventListener('DOMContentLoaded', function() {
    const V = Validation;
    const $ = id => document.getElementById(id);
    const both = (...checks) => value => checks.reduce((error, check) => error || check(value), null);

    const location = V.locationFields({
        nation: $('NewNation'), nationList: $('nationList'),
        city: $('NewCity'), cityList: $('cityList'),
        prefix: $('Prefix'), number: $('NewNumber'),
        suggestion: $('prefixSuggestion'),
    });

    const password = $('Newpassword');

    V.bindForm($('registerForm'), [
        { input: $('FirstName'), validate: both(V.rules.required('your first name'), V.rules.name) },
        { input: $('LastName'), validate: both(V.rules.required('your last name'), V.rules.name) },
        {
            input: $('Newusername'),
            validate: both(V.rules.required('a username'), V.rules.username),
            remote: V.remoteExists('/check-username', 'This username is already taken — try another one'),
            validMessage: 'Nice, this username is available',
        },
        {
            input: $('Newemail'),
            validate: both(V.rules.required('your email'), V.rules.email),
            remote: V.remoteExists('/check-email', 'An account with this email already exists — try logging in'),
        },
        {
            input: password,
            validate: V.passwordField(password, $('strengthMeter')),
            validMessage: () => V.strengthMessage(password),
        },
        { input: $('Newbirthday'), validate: both(V.rules.required('your birthday'), V.rules.birthday) },
        location.nation,
        location.city,
        location.prefix,
        location.number,
        { input: $('NewDescription'), validate: V.rules.maxLength(500, 'Your bio') },
    ], {
        summary: $('formSummary'),
        submitButton: $('submit'),
        busyText: 'Creating your account…',
    });

    V.bindCharCounters();
    V.bindPasswordToggles();
    document.querySelectorAll('[data-avatar-uploader]').forEach(V.avatarUploader);
});
