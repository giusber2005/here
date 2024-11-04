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

    // Iterate over the children in reverse order to avoid issues with live collections
    for (let i = container.children.length - 1; i >= 0; i--) {
        const child = container.children[i];

        // Check if the child has the class 'close' or 'alert'
        if (!child.classList.contains('close') && !child.classList.contains('alert')) {
            // Remove the child if it does not have the class 'close' or 'alert'
            container.removeChild(child);
        }
    }
}

// Function to add an element to the box and store its hidden value in a hidden box
async function addElement(el = "", preValue = "", keyword = "") {
    let value;
    let input;

    if (preValue === "") {
        input = el.closest('.column-container').querySelector('.addInput');
        value = input.value;
    } else {
        value = preValue;
    }

    if (value !== "") {
        let Box, hiddenContainer;

        if (keyword !== "") {
            if (keyword === "photo") {
                Box = document.getElementById('photoBox');
                hiddenContainer = document.getElementById('hiddenPhoto');
            } else if (keyword === "friend") {
                Box = document.getElementById('friendsBox');
                hiddenContainer = document.getElementById('hiddenFriends');
            } else if (keyword === "link") {
                Box = document.getElementById('linkBox');
                hiddenContainer = document.getElementById('hiddenBox');
            }
        } else {
            const column = el.closest('.column-container').id;
            hiddenContainer = el.closest('.column-container').querySelector('.hidden');

            const containers = document.querySelectorAll(".Box");
            Box = Array.from(containers).find(container => container.id.includes(column));
        }

        if (!Box) return; // If no box found, exit

        const Wrapper = document.createElement('div');
        Wrapper.className = 'wrapper';

        let hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';

        if (Box.id === 'linkBox') {
            const newLink = document.createElement('a');
            newLink.href = value;
            newLink.textContent = value;
            newLink.target = '_blank'; // Open link in a new tab
            Wrapper.appendChild(newLink);

            hiddenInput.className = 'hiddenLink';
            hiddenInput.name = 'hiddenLink';
            hiddenInput.value = value;

        } else if (Box.id === "photoBox") {
            const newPhoto = document.createElement('img');
            
            let file;
            let base64Image;

            if (el !== "") {
                file = input.files[0];
                if (file) {
                    const reader = new FileReader();
    
                    reader.onload = function(e) {
                        newPhoto.src = e.target.result;

                        base64Image = newPhoto.src;  // The Base64-encoded image
                        hiddenInput.value = base64Image;
                    };
                    reader.readAsDataURL(file);
                } else {
                    newPhoto.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
                    hiddenInput.value = "";
                }

            } else {
                file = value;
                if (file) {
                    newPhoto.src = file;
                    if (file.startsWith('data:image')) {
                        base64Image = file;
                    } else {
                        base64Image = await getBase64Image(file);
                        base64Image = base64Image.base64;
                    }
                } else {
                    newPhoto.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
                }

                hiddenInput.value = base64Image;
            }

            hiddenInput.className = 'hiddenPhoto';
            hiddenInput.name = 'hiddenPhoto';


            hiddenContainer.appendChild(hiddenInput); // Append hidden input after setting its value

            newPhoto.className = "photo-preview";
            Wrapper.appendChild(newPhoto);

        } else if (Box.id === "friendsBox") {
            // When a friend is being added to the box, their option is eliminated from the list 
            const newFriend = document.createElement('p');
            newFriend.style.display = "inline-block";
            newFriend.innerHTML = value;
            Wrapper.appendChild(newFriend);

            hiddenInput.className = 'hiddenFriend';                      
            hiddenInput.name = 'hiddenFriend';
            hiddenInput.value = value;

            var friends_options = document.getElementById("eventFriends");
            const options = friends_options.querySelectorAll('option');
            for (let i = options.length - 1; i >= 0; i--) {
                const option = options[i];
                if (option.value === value) {
                    friends_options.removeChild(option);
                }
            }

            // Create the view profile button
            const profileButton = document.createElement('button');
            profileButton.textContent = 'View profile';
            profileButton.className = 'profileButton';

            Wrapper.appendChild(profileButton);
        }

        // Create the delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';

        Wrapper.appendChild(deleteButton);

        // Append the wrapper to the container
        Box.appendChild(Wrapper);

        if (Box.id !== "photoBox") {
            hiddenContainer.appendChild(hiddenInput); // Append hidden input for non-photo cases
        }

        if (input) {
            input.value = ""; // Clear the input
        }
    }
}

//function to fetch the base64 image of a photo 
async function getBase64Image(src) {
    let header = {}
    let data;
    try {
        file_path = JSON.stringify(src);

        header['Content-Type'] = 'application/json'; // Set the correct content type for JSON

        const response = await fetch("/getBase64", {
            method: "POST", 
            headers: header,
            body: file_path, //sending the form data as the request body
        });

        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Parse and log the JSON response from the server
        data = await response.json();
    } catch (e) {
        console.error(e); // Log any errors that occur
    }

    console.log("data: ", data);
    return data;
}

// Function to format data into a FormData object to be sent to the server
async function createEventFormData(event) {
    // Create a new FormData object
    const formData = new FormData();

    // Get the values from the specified fields
    const eventTitle = event.title;
    const eventId = event.id;
    const eventColor = event.backgroundColor;
    const eventText = event.extendedProps.text || '';

    var start = event.start;
    start = moment(start, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    var end = event.end;
    if (end != null) {
        end = moment(end, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }


    if (end === null) {
        // If the end date is null, add one day to the start date
        end = moment(start).add(1, 'days').format('YYYY-MM-DD');
        start = start.format('YYYY-MM-DD');
    }else if (end.diff(start, 'days') === 1) {
        // If they are one day apart, return in the format YYYY-MM-DD
        start = start.format('YYYY-MM-DD'); // Format start date
        end = end.format('YYYY-MM-DD'); // Format end dateo
    } else {
        // Otherwise, return in the format YYYY-MM-DDTHH:mm:ss+02:00
        start = start.format('YYYY-MM-DDTHH:mm:ss+02:00'); // ISO format with timezone
        end = end.format('YYYY-MM-DDTHH:mm:ss+02:00'); // ISO format with timezone
    }

    var detailsBox = document.getElementById('eventDetails');
    var startDate = document.getElementById('detailStart');
    var endDate =  document.getElementById('detailEnd');
    if (detailsBox.style.display != 'hidden') {
        startDate.textContent = datesFormatter(event.start);

        if (event.end != null) {
            endDate.textContent = datesFormatter(event.end);
        } else {
            var startPoint = moment(event.start, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
            endDate.textContent = datesFormatter(moment(startPoint).add(1, 'days'));
        }
    }

    const eventTags = event.extendedProps.tags;
    const eventHiddenPhoto = event.extendedProps.photos || [];
    const hiddenLinks = event.extendedProps.links || [];
    const hiddenFriends = event.extendedProps.friends || [];

    // Append the values to the FormData object
    formData.append('eventTitle', eventTitle);
    formData.append('eventId', eventId);
    formData.append('eventColor', eventColor);
    formData.append('eventText', eventText);
    formData.append('start', start);
    formData.append('end', end);
    formData.append('eventTags', eventTags);

    // Append files (photos) to FormData
    for (let i = 0; i < eventHiddenPhoto.length; i++) {
        if (!eventHiddenPhoto[i].startsWith('data:image')) {
            var photo_data = await getBase64Image(eventHiddenPhoto[i]);
            photo_data = photo_data.base64;
        } else {
            var photo_data = eventHiddenPhoto[i];
        }
        formData.append('hiddenPhoto', photo_data);
    }

    // Append hidden links to FormData
    hiddenLinks.forEach(link => {
        formData.append('hiddenLink', link);
    });

    // Append hidden friends to FormData
    hiddenFriends.forEach(friend => {
        formData.append('hiddenFriend', friend);
    });

    return formData;
}

function datesFormatter(date) {
    if (date != null) {
        const object = new Date(date);

        const options = {
        weekday: 'long', // "Monday", "Tuesday"
        year: 'numeric', // "2023"
        month: 'long', // "September"
        day: 'numeric', // "24"
        hour: '2-digit', // "02 PM"
        minute: '2-digit' // "02:30 PM"
        };

        const formattedObject = new Intl.DateTimeFormat('en-US', options).format(object);
        return formattedObject;
    }

    return "";
}

function showAlert(message, type) {
    // Find the nav element
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Find or create the header element
    let header = document.querySelector('header');
    if (!header) {
        header = document.createElement('header');
        // Insert header after nav
        nav.insertAdjacentElement('afterend', header);
    }

    // Create the alert div with the same structure as your template
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-primary mb-0 text-center`;
    alertDiv.role = 'alert';
    alertDiv.textContent = message;

    // Replace any existing alert or add the new one
    const existingAlert = header.querySelector('.alert');
    if (existingAlert) {
        header.replaceChild(alertDiv, existingAlert);
    } else {
        header.appendChild(alertDiv);
    }

    // Remove the alert after some time
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}