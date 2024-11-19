
document.addEventListener('DOMContentLoaded', function() {

    var passwordInput1 = document.getElementById("password1");
    var passwordInput2 = document.getElementById("password2");
    var passwordStrenght = document.getElementById("passwordStrenght");
    var error2Div = document.getElementById("error2");

    var commonPasswords;
    // Fetch the common passwords list
    fetch('/data/common.txt')
    .then(response => response.text())
    .then(data => {
        commonPasswords = data.split('\n');
    })
    .catch(error => console.error('Error fetching common passwords:', error));

    passwordInput1.addEventListener("input", () => {
        if (passwordInput1.value) {
            let level = passwordChecker(passwordInput1.value, commonPasswords, passwordStrenght);
            passwordStrenght.innerHTML = level;
        } else {
            passwordStrenght.style.color = 'red';
            passwordStrenght.innerHTML = 'password is required';
        }
    });

    passwordInput2.addEventListener("input", () => {
        if (passwordInput1.value != passwordInput2.value) {
            error2Div.style.color = "red";
            error2Div.innerHTML = "the passwords need to be equal";
        } else {
            error2Div.style.color = "green";
            error2Div.innerHTML = "passwords are equal!";  
        }
    });
});