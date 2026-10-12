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

        var Wrapper = document.createElement('div');
        Wrapper.className = 'wrapper';
        Wrapper.style.display = "flex";
        Wrapper.style.whiteSpace = "nowrap";
        Wrapper.style.overflow = "auto";

        let hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';

        if (Box.id === 'linkBox') {
            const newLink = document.createElement('a');
            if (!value.startsWith("https://") && !value.startsWith("http://")) {
                var value2 = "https://" + value;
                newLink.href = value2;
            } else {
                newLink.href = value;
            }
            
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

            newPhoto.className = "photoPreview";
            Wrapper.appendChild(newPhoto);
            Wrapper.classList.add("gridElement");

        } else if (Box.id === "friendsBox") {
            // When a friend is being added to the box, their option is eliminated from the list 
            const newFriend = document.createElement('p');
            newFriend.style.display = "inline-block";
            newFriend.style.marginTop = "15px";
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
            profileButton.style.marginLeft = "5px";

            Wrapper.appendChild(profileButton);
        }

        // Create the delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';
        deleteButton.style.marginLeft = "5px";

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
        start = start.format('YYYY-MM-DDTHH:mm:ss'); // ISO format with timezone
        end = end.format('YYYY-MM-DDTHH:mm:ss'); // ISO format with timezone
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

// Shows a temporary notification in the top-right corner (type: success | error | info)
function showToast(message, type = 'info') {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = `app-toast app-toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = '<span class="app-toast-icon" aria-hidden="true"></span><span class="app-toast-text"></span><button type="button" class="app-toast-close" aria-label="Dismiss">&times;</button>';
    toast.querySelector('.app-toast-text').textContent = message;
    stack.appendChild(toast);
    scheduleToastDismiss(toast);
}

function dismissToast(toast) {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 300);
}

function scheduleToastDismiss(toast) {
    // errors stay a little longer so they can be read
    const delay = toast.classList.contains('app-toast-error') ? 7000 : 4500;
    let timer = setTimeout(() => dismissToast(toast), delay);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => { timer = setTimeout(() => dismissToast(toast), 2000); });
    toast.querySelector('.app-toast-close').addEventListener('click', () => dismissToast(toast));
}

// kept for the calendar scripts: alerts are now shown as toasts
function showAlert(message, type) {
    showToast(message, type === 'danger' ? 'error' : 'info');
}

document.addEventListener('DOMContentLoaded', function() {
    // toasts rendered by the server (flash messages)
    document.querySelectorAll('#toastStack .app-toast').forEach(scheduleToastDismiss);

    // buttons with data-copy="<text>" copy their value to the clipboard
    document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
                showToast('Copied to clipboard — share it with a friend!', 'success');
            } catch (error) {
                showToast("Couldn't copy automatically — select the token and copy it manually", 'error');
            }
        });
    });
});
