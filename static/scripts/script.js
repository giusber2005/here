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

// Helper function to clear dynamic content from a given container
function clearDynamicContent(containerId) {

                
    var container = document.getElementById(containerId);
                
    // Remove all child nodes
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

//Function to add an element to the box and store his hidden value in an hidden box
function addElement(el="", preValue="", keyword="") {

    if (preValue==="") {
        let input = el.closest('.column-container').querySelector('.addInput');
        var value = input.value;
    } else {
        var value = preValue;
    }

    if (value != "") {
        if (keyword != "") {
            if (keyword === "photo") {
                var Box = document.getElementById('photoBox');
                var hiddenContainer = document.getElementById('hiddenPhoto')
            } else if (keyword === "friend") {
                var Box = document.getElementById('friendsBox');
                var hiddenContainer = document.getElementById('hiddenFriends');
            } else if (keyword === "link") {
                var Box = document.getElementById('link');
                var hiddenContainer = document.getElementById('hiddenBox');
            };
        } else {
            var column = el.closest('.column-container').id;
            var hiddenContainer = el.closest('.column-container').querySelector('.hidden');

            var containers = document.querySelectorAll(".Box");
            var Box = null;
            containers.forEach(function(container) {
                var id = container.id;
                if (id.includes(column)) {
                    Box = container;
                }
            });
        }

        if (!Box) return; // If no box found, exit

        var Wrapper = document.createElement('div');
        Wrapper.className = 'wrapper';

        if (Box.id === 'linkBox') {
            var newLink = document.createElement('a');
            newLink.href = value;
            newLink.textContent = value;
            newLink.target = '_blank'; // Open link in a new tab
            Wrapper.appendChild(newLink);

            var hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden'; // Set the type to 'hidden'
            hiddenInput.className = 'hiddenLink';
            hiddenInput.name = 'hiddenLink';
            hiddenInput.value = value; 

        } else if (Box.id === "photoBox") {
            var newPhoto = document.createElement('img');

            var file = input.files[0];
            if (file) {
                var reader = new FileReader();
    
                reader.onload = function(e) {
                    newPhoto.src = e.target.result;

                    const base64Image = e.target.result;  // The Base64-encoded image

                    var hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden'; // Set the type to 'hidden'
                    hiddenInput.className = 'hiddenPhoto';
                    hiddenInput.name = 'hiddenPhoto';
                    hiddenInput.value = base64Image; 
                };
    
                reader.readAsDataURL(file);
            } else {
                newPhoto.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
            }

            newPhoto.className = "photo-preview";
            Wrapper.appendChild(newPhoto);

        } else if (Box.id === "friendsBox") {
            //when a friend is being added to the box, his option is eliminated from the list 
            var newFriend = document.createElement('p');
            newFriend.style.display = "inline-block";
            newFriend.innerHTML = value;
            Wrapper.appendChild(newFriend);

            var hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden'; // Set the type to 'hidden'
            hiddenInput.className = 'hiddenFriend';
            hiddenInput.name = 'hiddenFriend';
            hiddenInput.value = value;
            
            var options = friends_options.querySelectorAll('option');
            for (var i = options.length - 1; i >= 0; i--) {
                var option = options[i];
                if (option.value === value) {
                    friends_options.removeChild(option);
                }
            }

            // Create the view profile button
            var profileButton = document.createElement('button');
            profileButton.textContent = 'View profile';
            profileButton.className = 'profileButton';

            Wrapper.appendChild(profileButton);
        }

        // Create the delete button
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';

        Wrapper.appendChild(deleteButton);

        // Append the wrapper to the container
        Box.appendChild(Wrapper);
        hiddenContainer.appendChild(hiddenInput);

        input.value = ""; // Clear the input
    }
};