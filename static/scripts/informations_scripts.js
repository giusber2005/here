document.addEventListener('DOMContentLoaded', function() {
    // Function for displaying the image of the current photo profile of the user
    var photoFileName = document.getElementById('PhotoFile').textContent.trim();
    var imagePath = '/static/profile_images/' + photoFileName;
    if (photoFileName === "None") {
        document.getElementById('PhotoPreview').src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    } else {
        document.getElementById('PhotoPreview').src = imagePath;
    }
    
    var input = document.getElementById('newphoto_file');
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



    const nationInput = document.getElementById('nation');
    const nationList = document.getElementById('myDatalist');
    let error_NN = document.getElementById('error_NN');
    const cityInput = document.getElementById('city');
    const cityList = document.getElementById('myDatalist2');
    let error_NC = document.getElementById('error_NC');
    const cityCountryMap = new Map();

    // Initially disable nation input field
    nationInput.disabled = true;

    // Fetch the cities-nations list
    fetch('/data/worldcities.csv')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            lines.slice(1).forEach(line => {
                const parts = line.split(';');
                const nation = parts[1]?.trim().toLowerCase();
                const city = parts[0]?.trim().toLowerCase();
                if (nation && city) {
                    if (!cityCountryMap.has(nation)) {
                        cityCountryMap.set(nation, []);
                    }
                    cityCountryMap.get(nation).push(city);
                }
            });
            nationInput.disabled = false;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            nationInput.placeholder = "Error loading data";
        });

    // Handle nation input keyup event and manage errors in this field
    nationInput.addEventListener('keyup', () => {
        let html = '';
        let nationExists = false;
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
                nationExists = true;
            }
        });

        if (!nationExists) {
            cityInput.value = '';
            cityInput.disabled = true;
            error_NN.style.color = "red"
            error_NN.innerHTML = 'You need to select one of the nation in the list'
        } else {
            cityInput.disabled = false;
            error_NN.style.color = "green"
            error_NN.innerHTML = 'correct nation selected!!';
        }
        nationList.innerHTML = html;
        return 0;
    });

    // Handle city input keyup event and manage errors in this field
    cityInput.addEventListener('keyup', () => {
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
            error_NC.innerHTML = 'you need to select on of the city in the list';
        } else {
            error_NC.style.color = "green"
            error_NC.innerHTML = "correct city selected!!";
        }
        cityList.innerHTML = html;
        return 0
    });

    // Prefix suggestions based on selected nation
    let prefixesNationsMap = new Map();
    const nationsPrefixesMap = new Map();
    let prefixInput = document.getElementById('prefix');
    let prefixInfoBox = document.querySelector(".prefixInfo")
    prefixInfoBox.innerHTML = 'Prefix suggestion:';

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

        function initializeNationInput() {
            const inputVal = nationInput.value.toLowerCase().trim();
            const foundPrefix = prefixesNationsMap.get(inputVal) || '';
            prefixInfoBox.innerHTML = `Prefix suggestion: ${foundPrefix}`;
        }


    nationInput.addEventListener('input', initializeNationInput);

    //check validation for the username input
    const Newusername = document.querySelector('input.username');
    const error_field_Nu = document.querySelector('div.username');

    Newusername.addEventListener('input', async function(event) {
        if (Newusername.value != '') {
            error_field_Nu.innerHTML = noSpecial(Newusername.value, error_field_Nu);
        } else {
            error_field_Nu.style.color = 'red';
            error_field_Nu.innerHTML = 'username is required';
        }

        try {
            const response = await fetch(`/check-username/${Newusername.value}`);
            const result = await response.json();

            if (result.exists) {
                error_field_Nu.textContent = 'username is taken';
                error_field_Nu.style.color = 'red';
            }

        } catch (error) {
            if (Newusername.value != '') {
                console.error('Error checking username:', error);
                error_field_Nu.textContent = 'Error checking username';
                error_field_Nu.style.color = 'red';
            }
        }
    });

    //check validation for the email input
    const Newemail = document.querySelector('input.email');
    const error_field_Ne = document.querySelector('div.email');

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
    const NewLastName = document.querySelector('input.LastName');
    const error_field_LN = document.querySelector('div.LastName');

    NewLastName.addEventListener('input', function(event) {
        if (NewLastName.value != '') {
            error_field_LN.innerHTML = isAlpha(NewLastName.value, error_field_LN);
        } else {
            error_field_LN.style.color = 'red';
            error_field_LN.innerHTML = 'last name is required';
        }
    });

    //check validation for the First Name input
    const NewFirstName = document.querySelector('input.FirstName');
    const error_field_FN = document.querySelector('div.FirstName');

    NewFirstName.addEventListener('input', function(event) {
        if (NewFirstName.value != '') {
            error_field_FN.innerHTML = isAlpha(NewFirstName.value, error_field_FN);
        } else {
            error_field_FN.style.color = 'red';
            error_field_FN.innerHTML = 'first name is required';
        }
    });


    //check validation for the Birthday input
    const NewBirthday = document.querySelector('input.birthday');
    const error_field_Nb = document.querySelector('div.birthday');

    NewBirthday.addEventListener('input', function(event) {
        if (NewBirthday.value != '') {
            error_field_Nb.innerHTML = birthdayCheck(NewBirthday.value, error_field_Nb);
        } else {
            error_field_Nb.style.color = 'red';
            error_field_Nb.innerHTML = 'birthday is required';
        }
    });


    //check validation for the description field
    let description = document.getElementById('description');
    let error_field_Nd = document.querySelector('.description');

    description.addEventListener('input', function(event) {
        if (description.value != '') {
            error_field_Nd.innerHTML = checkLength(description.value, error_field_Nd);
        } else {
            error_field_Nd.innerHTML = '';
        }
    });

    //check validation for the photo field
    let photo = document.getElementById('newphoto_file');
    let error_field_NP = document.querySelector('.photo');

    photo.addEventListener('input', function(event) {
        const file = event.target.files[0];

        if (file) {
            const fileType = file.type;
            const fileName = file.name
            const validImageTypes = ['image/jpeg', 'image/png', 'image/heic']

            if (!validImageTypes.includes(fileType)) {
                error_field_NP.style.color = "red"
                error_field_NP.innerText = "File type not in the permitted list"
            } else {
                error_field_NP.style.color = "green"
                error_field_NP.innerText = "File valid!!"
            }
        } else {
            error_field_NP.style.color = "black"
            error_field_NP.innerText = "No file selected"
        }
    });

    //check validation for the gender field
    let gender = document.getElementById("gender");
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
            error_field_NG.innerHTML = 'Correct gender chosen';
        }
    });


    // Get elements by ID
    const NewNumber = document.getElementById("phone_number");
    const Prefix = document.getElementById("prefix");
    const error_field_PR = document.querySelector(".prefix");
    const error_field_NNum = document.querySelector(".phone_number");

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
            error_field_PR.innerHTML = 'Correct prefix chosen';
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

    //MutationObserver function to prevent the user to submit wrong informations
    let submitButton = document.getElementById('submit_changes');
    let errors = document.querySelectorAll('div.error');

    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            for (let i = 0; i < errors.length; i++) {
                if (errors[i].innerHTML != '' && errors[i].style.color === 'red') {
                    submitButton.disabled = true;
                    break;
                }
                submitButton.disabled = false;
            }
        });
    });

    let targetNodes = document.querySelectorAll('div.error');
    targetNodes.forEach(node => {
        observer.observe(node, { childList: true, subtree: true });
    });

    //function to change the value to a placeholder if equal to None
    let textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(function(textInput) {
        if (textInput.value === 'None') {
            textInput.value = '';
            textInput.placeholder = 'None';
        }
    });

});
