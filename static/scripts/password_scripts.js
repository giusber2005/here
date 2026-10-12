//validation of the reset password form (strength of the new password and matching confirmation)
document.addEventListener('DOMContentLoaded', function() {
    const V = Validation;
    const password1 = document.getElementById("password1");
    const password2 = document.getElementById("password2");

    V.bindForm(document.getElementById("resetForm"), [
        { input: password1, validate: V.passwordField(password1, document.getElementById("strengthMeter")), validMessage: () => V.strengthMessage(password1) },
        {
            input: password2,
            validate: value => !value ? 'Please repeat your new password' : value !== password1.value.trim() ? "The two passwords don't match yet" : null,
            validMessage: 'Passwords match',
        },
    ], { submitButton: document.getElementById("resetSubmit"), busyText: 'Saving…' });

    // keep the confirmation in sync when the first password changes
    password1.addEventListener("input", () => { if (password2.value) password2.dispatchEvent(new Event("blur")); });
    V.bindPasswordToggles();
});
