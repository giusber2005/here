document.addEventListener('DOMContentLoaded', function() {
    // Password strength checker
    let password = document.getElementById('password');
    let passwordStrenght = document.getElementById('password_strenght');
    let commonPasswords = [];

    // Fetch the common passwords list
    fetch('/data/common.txt')
        .then(response => response.text())
        .then(data => {
            commonPasswords = data.split('\n');
        })
        .catch(error => console.error('Error fetching common passwords:', error));

    password.addEventListener('input', function() {
        if (password.value) {
            let level = passwordChecker(password.value, commonPasswords, passwordStrenght);
            passwordStrenght.innerHTML = level;
        } else {
            passwordStrenght.style.color = 'red';
            passwordStrenght.innerHTML = 'password is required';
        }
    });

    // Nation and city suggestions
    let cityCountryMap = new Map();
    let nationInput = document.getElementById('NewNation');
    let nationList = document.getElementById('myDatalist');
    let error_NN = document.getElementById('error_NN');
    let cityInput = document.getElementById('NewCity');
    let cityList = document.getElementById('myDatalist2');
    let error_NC = document.getElementById('error_NC');

    nationInput.disabled = true;
    nationInput.placeholder = "Loading...";
    cityInput.placeholder = "Loading...";

    // Fetch the cities-nations list
    fetch('/data/worldcities.csv')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            lines.slice(1).forEach(line => {
                const parts = line.split(';');
                if (parts[1] && parts[0]) {
                    if (!cityCountryMap.has(parts[1].trim().toLowerCase())) {
                        cityCountryMap.set(parts[1].trim().toLowerCase(), []);
                    }
                    cityCountryMap.get(parts[1].trim().toLowerCase()).push(parts[0].trim().toLowerCase());
                }
            });
            nationInput.disabled = false;
            nationInput.placeholder = "Start typing...";
            cityInput.placeholder = "Select a nation...";
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            nationInput.placeholder = "Error loading data";
        });

    //showing options for nation input and check validation of user input
    nationInput.addEventListener('keyup', function() {
        let html = '';
        let Bool = false;
        const inputVal = nationInput.value.toLowerCase().trim();
        if (inputVal === '') {
            nationList.innerHTML = html;
            error_NN.innerHTML = '';
            return;
        }
        cityCountryMap.forEach((cities, nation) => {
            if (nation.startsWith(inputVal)) {
                html += `<option value="${nation}"></option>`;
            }
            if (nation === inputVal) {
                Bool = true;
            }
        });
        nationList.innerHTML = html;
        if (Bool === false) {
            cityInput.value = '';
            cityInput.disabled = true;
            error_NN.style.color = "red"
            error_NN.innerHTML = 'You need to select one of the nation in the list';
        } else {
            cityInput.disabled = false;
            error_NN.style.color = "green"
            error_NN.innerHTML = '✅';
        }
        return 0
    });

    //showing options for city input and check validation of user input
    cityInput.addEventListener('keyup', function() {
        let Bool = false;
        let html = '';
        const inputVal = cityInput.value.toLowerCase().trim();
        const selectedNation = nationInput.value.toLowerCase().trim();
        if (inputVal === '' || !cityCountryMap.has(selectedNation)) {
            cityList.innerHTML = html;
            return;
        }
        cityCountryMap.get(selectedNation).forEach(city => {
            if (city.startsWith(inputVal)) {
                html += `<option value="${city}"></option>`;
            }
            if (city === inputVal) {
                Bool = true;
            }
        });
        if (Bool === false) {
            error_NC.style.color = "red"
            error_NC.innerHTML = 'you need to select one of the city in the list ';
        } else {
            error_NC.style.color = "green"
            error_NC.innerHTML = 'correct city selected!!';
        }
        cityList.innerHTML = html;
        return 0
    });

    // Prefix suggestions based on selected nation
    let prefixesNationsMap = new Map();
    const nationsPrefixesMap = new Map();
    let prefixInput = document.getElementById('Prefix');
    let prefixBox = document.getElementById('prefixBox');
    prefixBox.innerHTML = 'Prefix suggestion:';

    // Fetch the nations with respective prefixes
    fetch('/data/nations_and_prefixes.csv')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            lines.slice(1).forEach(line => {
                const parts = line.split(';');
                if (parts[1] && parts[0]) {
                    const prefix = parts[1].trim();
                    const nation = parts[0].trim().toLowerCase();
                    prefixesNationsMap.set(nation, prefix);
                }
            });

            // Reverse lookup map for the prefixesNationsMap
            for (const [nation, prefix] of prefixesNationsMap.entries()) {
                nationsPrefixesMap.set(prefix, nation);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

    nationInput.addEventListener('input', function() {
        const inputVal = nationInput.value.toLowerCase().trim();
        const foundPrefix = prefixesNationsMap.get(inputVal) || '';
        prefixBox.innerHTML = `prefix suggestion: ${foundPrefix}`;
        if (foundPrefix != '') {
            cityInput.placeholder = "Start typing";
            cityInput.disabled = false;
        }
    });

    // Image preview functionality
    var input = document.getElementById('NewPhoto');
    var preview = document.getElementById('PhotoPreview');

    input.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();

            reader.onload = function(e) {
                preview.src = e.target.result;
            };

            reader.readAsDataURL(file);
        } else {
            preview.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
        }
    });


    //check validation for the username input (if it contains special characters or is it is already in the database)
    const Newusername = document.getElementById('Newusername');
    const error_field_Nu = document.getElementById('error_Nu');

    Newusername.addEventListener('input', async function(event) {
        const username = Newusername.value;

        if (username != '') {
            error_field_Nu.innerHTML = noSpecial(username, error_field_Nu);
        } else {
            error_field_Nu.style.color = 'red';
            error_field_Nu.innerHTML = 'username is required';
        }

        try {
            const response = await fetch(`/check-username/${username}`);
            const result = await response.json();

            if (result.exists) {
                error_field_Nu.textContent = 'username is taken';
                error_field_Nu.style.color = 'red';
            }

        } catch (error) {
            if (username != '') {
                console.error('Error checking username:', error);
                error_field_Nu.textContent = 'Error checking username';
                error_field_Nu.style.color = 'red';
            }
        }
    });

    //check validation for the email input
    const Newemail = document.getElementById('Newemail');
    const error_field_Ne = document.getElementById('error_Ne');

    Newemail.addEventListener('input', async function(event) {
        if (Newemail.value != '') {
            error_field_Ne.innerHTML = emailCheck(Newemail.value, error_field_Ne);
        } else {
            error_field_Ne.style.color = 'red';
            error_field_Ne.innerHTML = 'email is required';
        }

        try {
            const response = await fetch(`/check-email/${Newemail.value}`);
            const result = await response.json();

            if (result.exists) {
                error_field_Ne.textContent = 'email is taken';
                error_field_Ne.style.color = 'red';
            }

        } catch (error) {
            if (Newemail.value != '') {
                console.error('Error checking email:', error);
                error_field_Ne.textContent = 'Error checking email';
                error_field_Ne.style.color = 'red';
            }
        }
    });

    //check validation for the Last Name input
    const NewLastName = document.getElementById('LastName');
    const error_field_LN = document.getElementById('error_LN');

    NewLastName.addEventListener('input', function(event) {
        if (NewLastName.value != '') {
            error_field_LN.innerHTML = isAlpha(NewLastName.value, error_field_LN);
        } else {
            error_field_LN.style.color = 'red';
            error_field_LN.innerHTML = 'Last Name is required';
        }
    });

    //check validation for the First Name input
    const NewFirstName = document.getElementById('FirstName');
    const error_field_FN = document.getElementById('error_FN');

    NewFirstName.addEventListener('input', function(event) {
        if (NewFirstName.value != '') {
            error_field_FN.innerHTML = isAlpha(NewFirstName.value, error_field_FN);
        } else {
            error_field_FN.style.color = 'red';
            error_field_FN.innerHTML = 'First Name is required';
        }
    });


    //check validation for the Birthday input
    const NewBirthday = document.getElementById('Newbirthday');
    const error_field_Nb = document.getElementById('error_Nb');

    NewBirthday.addEventListener('input', function(event) {
        if (NewBirthday.value != '') {
            error_field_Nb.innerHTML = birthdayCheck(NewBirthday.value, error_field_Nb);
        } else {
            error_field_Nb.style.color = 'red';
            error_field_Nb.innerHTML = 'birthday is required';
        }
    });

    //check validation for the description field
    let description = document.getElementById('NewDescription');
    let error_field_Nd = document.getElementById('error_Nd');

    description.addEventListener('input', function(event) {
        if (description.value != '') {
            error_field_Nd.innerHTML = checkLength(description.value, error_field_Nd);
        } else {
            error_field_Nd.innerHTML = '';
        }
    });

    //check validation for the photo field
    let photo = document.getElementById('NewPhoto');
    let error_field_NP = document.getElementById('error_NP');

    photo.addEventListener('input', function(event) {
        const file = event.target.files[0];

        if (file) {
            const fileType = file.type;
            const validImageTypes = ['image/jpeg', 'image/png', 'image/heic']

            if (!validImageTypes.includes(fileType)) {
                error_field_NP.style.color = "red"
                error_field_NP.innerText = "File type not in the permitted list"
            } else {
                error_field_NP.style.color = "green"
                error_field_NP.innerText = "✅"
            }
        } else {
            error_field_NP.style.color = "black"
            error_field_NP.innerText = "No file selected"
        }
    });

    //check validation for the gender field
    let gender = document.getElementById("NewGender");
    let error_field_NG = document.getElementById("error_NG");
    let valid_genders = ['Male', 'Female', 'Other']

    gender.addEventListener('input', function(event) {
        if (gender.value === '') {
            error_field_NG.innerHTML = '';
        } else if (!valid_genders.includes(gender.value)) {
            error_field_NG.style.color = 'red';
            error_field_NG.innerHTML = 'Choose a correct gender';
        } else {
            error_field_NG.style.color = 'green';
            error_field_NG.innerHTML = '✅';
        }
    });

    // Get elements by ID
    const NewNumber = document.getElementById("NewNumber");
    const Prefix = document.getElementById("Prefix");
    const error_field_PR = document.getElementById("error_PR");
    const error_field_NNum = document.getElementById("error_NNum");

    // Function to validate prefix and display error message
    function validatePrefix() {
        const selectedPrefix = Prefix.value.trim(); // Get the selected prefix value and trim any whitespace
        const correspondingNation = nationsPrefixesMap.get(selectedPrefix);

        if (selectedPrefix === '') {
            error_field_PR.style.color = 'red';
            error_field_PR.innerHTML = 'Please select a prefix';
        } else if (nationsPrefixesMap.get(selectedPrefix) === undefined) {
            error_field_PR.style.color = 'red';
            error_field_PR.innerHTML = 'Choose a valid prefix';
        } else {
            error_field_PR.style.color = 'green';
            error_field_PR.innerHTML = '✅';
        }
    }

    // Add event listener to NewNumber input
    NewNumber.addEventListener('input', async function(event) {
        if (NewNumber.value === '') {
            error_field_PR.innerHTML = ''; // Clear error message if NewNumber is empty
            error_field_NNum.innerHTML = ''; // Clear NewNumber error message if NewNumber is empty
            return;
        } else {
            validatePrefix(); // Validate prefix when NewNumber changes
        }

        let number = Prefix.value.trim() + ' ' + NewNumber.value.trim();

        try {
            const response = await fetch(`/check-number/${number}`);
            const result = await response.json();

            if (result.exists) {
                error_field_NNum.textContent = 'number is taken';
                error_field_NNum.style.color = 'red';
            } else {
                error_field_NNum.textContent = '';
            }

        } catch (error) {
            if (NewNumber.value != '') {
                console.error('Error checking number:', error);
                error_field_NNum.textContent = 'Error checking number';
                error_field_NNum.style.color = 'red';
            }
        }
    });

    // Add event listener to Prefix input
    Prefix.addEventListener('input', function(event) {
        if (NewNumber.value !== '') {
            validatePrefix(); // Validate prefix when Prefix changes and NewNumber is not empty
        }
    });

    // Enable submit button only when there are no errors and all required fields are filled
    let submitButton = document.getElementById('submit');
    let errors = document.querySelectorAll('div.error');
    const fields = document.querySelectorAll('.required');

    // Function to check the form validity
    function checkFormValidity() {
        // Check for errors
        const hasErrors = Array.from(errors).some(error => error.innerHTML !== '' && error.style.color === 'red');
        if (hasErrors) {
            submitButton.disabled = true;
            return;
        }

        // Check for empty required fields
        const allFieldsFilled = Array.from(fields).every(field => field.value.trim() !== '');
        submitButton.disabled = !allFieldsFilled;
    }

    // Observe changes in error messages
    let observer = new MutationObserver(checkFormValidity);
    errors.forEach(node => {
        observer.observe(node, { childList: true, subtree: true });
    });
 
    // Add input event listeners to required fields
    fields.forEach(field => {
        field.addEventListener('input', checkFormValidity);
    });

    // Initial check
    checkFormValidity();


    document.getElementById('resetButton').addEventListener('click', function () {
        document.getElementById('PhotoPreview').src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    });
    
});


