//wires the edit profile form to the shared validation helpers in validation.js
document.addEventListener('DOMContentLoaded', function() {
    const V = Validation;
    const $ = id => document.getElementById(id);
    const both = (...checks) => value => checks.reduce((error, check) => error || check(value), null);

    const location = V.locationFields({
        nation: $('nation'), nationList: $('nationList'),
        city: $('city'), cityList: $('cityList'),
        prefix: $('prefix'), number: $('phone_number'),
        suggestion: $('prefixSuggestion'),
    });

    V.bindForm($('profileForm'), [
        { input: $('FirstName'), validate: both(V.rules.required('your first name'), V.rules.name) },
        { input: $('LastName'), validate: both(V.rules.required('your last name'), V.rules.name) },
        {
            // the endpoint answers "not taken" for the user's own current username/email
            input: $('username'),
            validate: both(V.rules.required('a username'), V.rules.username),
            remote: V.remoteExists('/check-username', 'This username is already taken — try another one'),
        },
        {
            input: $('email'),
            validate: both(V.rules.required('your email'), V.rules.email),
            remote: V.remoteExists('/check-email', 'Another account already uses this email'),
        },
        { input: $('birthday'), validate: both(V.rules.required('your birthday'), V.rules.birthday) },
        location.nation,
        location.city,
        location.prefix,
        location.number,
        { input: $('description'), validate: V.rules.maxLength(500, 'Your bio') },
    ], {
        summary: $('formSummary'),
        submitButton: $('submit_changes'),
        busyText: 'Saving…',
    });

    V.bindCharCounters();
    document.querySelectorAll('[data-avatar-uploader]').forEach(V.avatarUploader);
});
