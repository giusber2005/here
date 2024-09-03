// Define the password checker function
function passwordChecker(password, commonPasswords, error_field) {
    // Check if the password is in the list of common passwords
    if (commonPasswords.includes(password)) {
        return "Your password can be easily cracked by a dictionary attack";
    }

    // Check for the presence of different types of characters
    const upperCase = /[A-Z]/.test(password);
    const lowerCase = /[a-z]/.test(password);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const digits = /[0-9]/.test(password);

    const characters = [upperCase, lowerCase, special, digits];

    const length = password.length;

    let score = 0;

    // Calculate score based on length
    if (length > 8) score += 1;
    if (length > 12) score += 1;
    if (length > 17) score += 1;
    if (length > 20) score += 1;

    // Calculate score based on character variety
    if (characters.filter(Boolean).length > 1) score += 1;
    if (characters.filter(Boolean).length > 2) score += 1;
    if (characters.filter(Boolean).length > 3) score += 1;

    // Return the strength message based on the score
    if (score < 4) {
        error_field.style.color = 'red'
        return `Password strength: ${score}/7. Your password is weak`;
    } else if (score === 4) {
        error_field.style.color = 'red'
        return `Password strength: ${score}/7. Your password is not too strong`;
    } else if (score > 4 && score < 6) {
        error_field.style.color = 'green'
        return `Password strength: ${score}/7. Your password is strong`;
    } else if (score >= 6) {
        error_field.style.color = 'green'
        return `Password strength: ${score}/7. Your password is very strong`;
    }
}

function toggleInput(nation, city) {
    var select = document.getElementById(nation);
    var input = document.getElementById(city);

    if (select.value.trim() === '') {
        input.disabled = true;
        input.placeholder = "Select a nation";
    } else {
        input.disabled = false;
        if (input.placeholder === "None" || input.placeholder === "") {
            input.placeholder = "Start typing...";
        }
    }
}


function enableSubmitButton() {
    const fields = document.querySelectorAll('.required');
    const submitButton = document.getElementById('submit');
    let allFieldsFilled = true;

    fields.forEach(field => {
        if (field.value.trim() === '') {
            allFieldsFilled = false;
        }
    });

    submitButton.disabled = !allFieldsFilled;
}

function isAlpha(Name, error_field) {
    Bool = /^[A-Za-z]+$/.test(Name.trim())
    if (Bool) {
        error_field.style.color = "green"
        return 'correct!!';
    }
    error_field.style.color = "red"
    return 'You need to insert only alphabetical keys';
}

function noSpecial(Username, error_field) {
    const pattern = /^[a-zA-Z0-9]*$/;
    const Bool = pattern.test(Username.trim());
    if (Bool) {
        error_field.style.color = "green";
        return 'Valid Username!!';
    } else  {
        error_field.style.color = "red";
        return 'Only alphanumeric values are admitted';
    }
}

function birthdayCheck(birthdayCheck, error_field) {
    try {
        // Attempt to parse the birthday string into a Date object
        let birthday = new Date(birthdayCheck);
        let currentDate = new Date();

        // Check if the date is invalid
        if (isNaN(birthday.getTime())) {
            throw new Error("Invalid date");
        }

        let age = currentDate.getFullYear() - birthday.getFullYear();
        let monthDiff = currentDate.getMonth() - birthday.getMonth();
        let dayDiff = currentDate.getDate() - birthday.getDate();

        error_field.style.color = "red"

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }

        if (age > 130) {
            return "insert a valid birthday";
        }

        if (age < 0) {
            return "please insert a correct birthday";
        }

        if (age < 15) {
            return "only user above 15 years old can register to this page";
        }
    } catch (error) {
        // If parsing fails, the format is incorrect or date is invalid
        return "insert a correct format and a correct value for your birthday";
    }

    error_field.style.color = "green"
    return 'correct birthday!!';
}

function emailCheck(emailCheck, error_field) {
    // Ensure that the email follows the specific format for the email
    const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    if (!pattern.test(emailCheck.trim())) {
        error_field.style.color = "red";
        return 'insert an appropriate format for the email';
    }

    error_field.style.color = "green";
    return 'The email is in the correct format!!';
}

function checkLength(description, error_field) {
    if (description.length > 500) {
        error_field.style.color = "red"
        return 'Your description needs to be less than 500 characters long';
    }
    error_field.style.color = "green"
    return 'description is ok!!';
}

function remove_errors() {
    errors = document.querySelectorAll('div.error')
    for (let i = 0; i < errors.length; i++) {
        errors[i].innerHTML = '';
    }
}
