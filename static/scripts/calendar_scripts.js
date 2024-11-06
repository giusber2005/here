document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var eventForm = document.getElementById('eventForm');
    var addEventForm = document.getElementById('addEventForm');
    var cancelButton = document.getElementById('cancelButton');
    var eventDetails = document.getElementById('eventDetails');
    var detailTitle = document.getElementById('detailTitle');
    var detailStart = document.getElementById('detailStart');
    var detailEnd = document.getElementById('detailEnd');
    var detailText = document.getElementById('detailText');
    var detailTags = document.getElementById('detailTags');  // Will handle a single tag now
    var addButton = document.getElementById("addButton");
    
    var calendar;
    var selectedEvent = null; // Variable to store the currently selected event
    var nextEventId = 1;

    calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
        eventDurationEditable: true,
        eventResizableFromStart: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,multiMonthYear'
        },
        views: {
            timeGridWeek: {
                type: 'timeGridWeek',
                buttonText: 'week'
            },
            listWeek: {
                type: 'listWeek',
                buttonText: 'list week'
            },
            multiMonthYear: {
                type: 'multiMonthYear',
                duration: { months: 12 },
                buttonText: 'year'
            }
        },
        events: [
            // Your event data here
        ],
        select: function(info) {
            select(info);
        },
        eventClick: function(info) {
            selectedEvent = info.event;

            detailTitle.textContent = info.event.title;

            const formattedStart = datesFormatter(info.event.start);
            const formattedEnd = datesFormatter(info.event.end);  

            detailStart.textContent = `${formattedStart}`
            detailEnd.textContent = `${formattedEnd}`;
            detailText.textContent = info.event.extendedProps.text || 'None';
            detailTags.textContent = info.event.extendedProps.tags || 'None';
        
            // Clear previous content before adding new content
            clearDynamicContent('detailsPhotoBox');
            clearDynamicContent('detailsFriendsBox');
            clearDynamicContent('detailsLinkBox');
        
            // Display photos
            var photos = info.event.extendedProps.photos || [];
            if (Array.isArray(photos)) {
                var counter = 0;
                photos.forEach(function(photo) {
                    var detailsPhotoBox = document.getElementById("detailsPhotoBox");
                    if (detailsPhotoBox.querySelector("#photosStack") == null) {
                        var photosStack = document.createElement("div");
                        photosStack.id = "photosStack";
                        detailsPhotoBox.appendChild(photosStack);
                    } else {
                        photosStack = detailsPhotoBox.querySelector("#photosStack");
                    }
                    var andMoreElement = document.getElementById("andMore");

                    if (counter < 4) {
                        var img = document.createElement("img");
                        img.src = photo;
                        img.className = "photo-preview";
                        img.style.left = `${counter * 70}px`; // Adjust 40px based on desired overlap
                        img.style.zIndex = img.length - counter; // Ensure correct stacking order

                        photosStack.appendChild(img);
                        if (andMoreElement) {
                            andMoreElement.style.display = "none";
                        }

                        counter++;
                    } else {
                        //inserting the image but with style display: none and width and height 0
                        var img = document.createElement("img");
                        img.src = photo;
                        img.className = "photo-preview";
                        img.style.display = "none";
                        img.style.width = "0";
                        img.style.height = "0";
                        photosStack.appendChild(img);

                        // If the carousel is not open, open it
                        if (detailsPhotoBox.querySelector("#openCarousel") == null) {
                                var blank_img = document.createElement("button");
                                blank_img.textContent = "SEE ALL";
                                blank_img.style.backgroundImage = "url('static/events_images/orange.png')";
                                blank_img.className = "photo-preview";
                                blank_img.id = "openCarousel";
                                blank_img.style.left = `${counter * 70}px`; // Adjust 40px based on desired overlap
                                blank_img.style.zIndex = blank_img.length - counter; // Ensure correct stacking order
                                photosStack.appendChild(blank_img);
                        }

                        if (andMoreElement) {
                            andMoreElement.style.display = "block";
                            andMoreElement.textContent = `...and ${counter - 3} more`;
                        } else {
                            andMoreElement = document.createElement("div");
                            andMoreElement.id = "andMore";
                            andMoreElement.style.display = "block";
                            andMoreElement.textContent = `...and ${counter - 3} more`;
                            detailsPhotoBox.append(andMoreElement);
                        }
                    }            
                });
            };
        
            // Display friends
            var friends = info.event.extendedProps.friends || [];
            if (friends.length != 0) {
                friends.forEach(function(friend) {
                    var Wrapper = document.createElement('div');
                    Wrapper.className = 'wrapper';
    
                    var p = document.createElement("p");
                    p.style.display = "inline-block";
                    p.textContent = friend;
    
                    Wrapper.appendChild(p);
    
                    // Create the view profile button
                    var profileButton = document.createElement('button');
                    profileButton.textContent = 'View profile';
                    profileButton.className = 'profileButton';
                            
                    Wrapper.appendChild(profileButton);
    
                    document.getElementById("detailsFriendsBox").appendChild(Wrapper);
                });
            };
        
            // Display links
            var links = info.event.extendedProps.links || [];
            if (links.length != 0) {
                links.forEach(function(link) {
                    var a = document.createElement("a");
                    a.href = link;
                    a.textContent = link;
                    a.target = "_blank";
                    a.style.display = "inline-block"
                    document.getElementById("detailsLinkBox").appendChild(a);
                });
            };

            var labels = document.querySelectorAll('.label');
            var details = document.querySelectorAll('.detail');
        
            labels.forEach(function(label, index) {
                var detail = details[index];
                if (detail && !detail.textContent.trim()) {
                    label.style.display = 'none';
                }
            });

            eventDetails.style.display = 'block'; 
            calendar.updateSize();
        },        
        viewDidMount: function() {
            // Hide event form when the view is first rendered
            if (eventForm.style.display === 'block') {
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
            }
        },
        datesSet: function() {
            // Hide event form when the view changes
            if (eventForm.style.display === 'block') {
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
            }
        },
        eventDrop: function(info) {
            createEventFormData(info.event)
                .then(eventInfo => {
                    return sendData('/addEvent2', eventInfo);
                })
                .then(response => {
                    if (response && response.photos) {
                        
                        // Create a new array with updated photo paths
                        const updatedPhotos = response.photos.map(photo => 
                            'static/events_images/' + photo
                        );
                        
                        // Update the event's photos
                        info.event.setExtendedProp('photos', updatedPhotos);
                    }
                })
                .catch(error => {
                    console.error("Error handling event drop:", error);
                });
        },
        eventResize: function(info) {
            createEventFormData(info.event)
                .then(eventInfo => {
                    return sendData('/addEvent2', eventInfo);
                })
                .then(response => {
                    if (response && response.photos) {
                        
                        // Create a new array with updated photo paths
                        const updatedPhotos = response.photos.map(photo => 
                            'static/events_images/' + photo
                        );
                        
                        // Update the event's photos
                        info.event.setExtendedProp('photos', updatedPhotos);
                    }
                })
                .catch(error => {
                    console.error("Error handling event resize:", error);
                });
        }
    });
    calendar.render();

    // Fetch all events from the server
    async function fetchEvents() {
        try {
            const response = await fetch('/getEvents');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            var max = 0;
            const events = await response.json();
            events.forEach(event => {
                if (max < event.id) {
                    max = event.id;
                }
                calendar.addEvent({
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    color: event.color,
                    allDay: true,
                    editable: true,               
                    durationEditable: true,          
                    eventResizableFromStart: true,
                    extendedProps: event.extendedProps // Include any additional properties you defined
                });
            });
            if (max != 0) {
                nextEventId = max;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    // Call fetchEvents when the page loads
    fetchEvents();
    
    document.getElementById("closeButton").addEventListener('click', function() {
        eventDetails.style.display = "none";
        calendar.updateSize();
    });

    document.getElementById("modifyButton").addEventListener('click', function() {
        if (selectedEvent) {
            // Hide the event details and show the form to modify the event
            eventDetails.style.display = "none";
            calendar.updateSize();
            document.body.classList.add('dimmed');

            
            addButton.innerHTML = "Modify Event";

            var eventInfo = {};

            // Get the event start date from the element
            var eventStart = document.getElementById('detailStart');
            const Start = moment(eventStart.textContent, 'dddd, MMMM D, YYYY [at] h:mm A');

            // Get the event end date from the element
            var eventEnd = document.getElementById('detailEnd');
            const End = moment(eventEnd.textContent, 'dddd, MMMM D, YYYY [at] h:mm A');

            // Check if the start and end dates are exactly one day apart
            if (End.diff(Start, 'days') === 1) {
                // If they are one day apart, return in the format YYYY-MM-DD
                eventInfo.startStr = Start.format('YYYY-MM-DD'); // No need to wrap in moment() again
                eventInfo.endStr = End.format('YYYY-MM-DD'); // Same here
            } else {
                // Otherwise, return in the format YYYY-MM-DDTHH:mm:ss+02:00
                eventInfo.startStr = Start.format('YYYY-MM-DDTHH:mm:ss+02:00');
                eventInfo.endStr = End.format('YYYY-MM-DDTHH:mm:ss+02:00');
            }

            var eventId = document.getElementById('eventId');
            eventId.value = selectedEvent.id;

            // Pre-fill the form with the current event details
            document.getElementById('eventTitle').value = selectedEvent.title;
            document.getElementById('eventColor').value = selectedEvent.backgroundColor;
            document.getElementById('eventText').value = selectedEvent.extendedProps.text || '';
            document.getElementById('eventLink').value = selectedEvent.extendedProps.link || '';
            document.getElementById('eventTags').value = selectedEvent.extendedProps.tags || '';  // Populate the select with the single tag

            var photosInsert = Array.isArray(selectedEvent.extendedProps.photos) ? selectedEvent.extendedProps.photos : [];
            photosInsert.forEach(async function(_photo_) {
                await addElement("", _photo_, "photo");
            }); 
            
            var friendsInsert = Array.isArray(selectedEvent.extendedProps.friends) ? selectedEvent.extendedProps.friends : [];
            friendsInsert.forEach(async function(_friend_) {
                await addElement("", _friend_, "friend");
            });
            
            var linksInsert = Array.isArray(selectedEvent.extendedProps.links) ? selectedEvent.extendedProps.links : [];
            linksInsert.forEach(async function(_link_) {
                await addElement("", _link_, "link");
            });

            select(eventInfo);
        }
    });

    document.getElementById("deleteButton").addEventListener('click', function() {
        var sureBox = document.getElementById('sure');
        sureBox.style.display = "block";
    
        // Use querySelector to find "yes" and "no" buttons within sureBox
        sureBox.querySelector("#yes").addEventListener('click', function() {
            if (selectedEvent) {
                var form = selectedEvent;
                sendData('/deleteEvent', form.id);
    
                // Remove the event from the calendar
                selectedEvent.remove();
                selectedEvent = null; // Clear the selected event
                eventDetails.style.display = "none";
            }
            sureBox.style.display = "none"; // Hide the confirmation box
            calendar.updateSize();
        });
    
        sureBox.querySelector("#no").addEventListener('click', function() {
            sureBox.style.display = "none"; // Hide the confirmation box
        });

    });
    

    var addButtons = document.querySelectorAll(".add");

    addButtons.forEach(function(item) {
        item.addEventListener('click', async function() {
            addElement(this, "", "");
        });
    });
    
    let showButtons = document.querySelectorAll('.show');
    showButtons.forEach(function(showButton) {
        showButton.addEventListener('click', function() {
            let container = this.closest('.column-container');
            let Boxes = document.querySelectorAll('.Box');
            let Box = null;
    
            Boxes.forEach(function(box) {
                let id = box.id;
                if (id.includes(container.id)) {
                    Box = box;
                }
            });
    
            if (Box) {
                document.getElementById("blurry").style.filter = 'blur(8px)';
                document.getElementById("blurry").style.pointerEvents = "none";
                document.body.style.overflow = 'hidden';
                let counter = Box.querySelectorAll('.delete').length;
                if (counter === 0) {
                    Box.style.display = "block";
                    Box.querySelector('.alert').style.display = "block";    
                } else {
                    Box.style.display = "block";
                    Box.querySelector('.alert').style.display = "none";
                }
            }
        });
    });
    
    let closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            let Box = this.closest('.Box') || this.closest('.profileBox');
            Box.style.display = "none";

            if (document.getElementById('eventForm').style.display === "none") {
                document.getElementById("blurry").style.filter = 'none';
                document.getElementById("blurry").style.pointerEvents = "all";
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    let Boxes = document.querySelectorAll(".Box");
    Boxes.forEach(function(box) {
        box.addEventListener('click', function(event) {
            if (event.target && event.target.classList.contains('delete')) {
                let counter = box.querySelectorAll('.delete').length;

                var parentDiv = event.target.closest('.wrapper'); 
    
                if (parentDiv) {
                    var value;
                    if (box.id === 'linkBox') {
                        let link = parentDiv.querySelector('a');
                        value = link.href;
                    } else if (box.id === "photoBox") {
                        let photo = parentDiv.querySelector('img');
                        value = photo.src;
                    } else if (box.id === "friendsBox") {
                        let friend = parentDiv.querySelector('p');
                        value = friend.innerHTML;

                        //function to re-insert the eliminated friend in the list of options
                        resetFriend(value);
                    }

                    parentDiv.remove();
    
                    let hiddenBoxes = document.querySelectorAll('.hidden');
                    hiddenBoxes.forEach(function(hiddenBox) {
                        if (box.id === "linkBox") {
                            var hiddenInputs = hiddenBox.querySelectorAll(".hiddenLink");
                        } else if (box.id === "photoBox") {
                            var hiddenInputs = hiddenBox.querySelectorAll(".hiddenPhoto");
                        } else if (box.id === "friendsBox") {   
                            var hiddenInputs = hiddenBox.querySelectorAll(".hiddenFriend");
                        }

                        for (let input of hiddenInputs) {
                            if (input.value === value) {
                                input.remove();
                                break; // Exit the loop after removing the element
                            }
                        }
                    });


                    if (counter === 1) {
                        box.style.display = "block";
                        document.getElementById("blurry").style.filter = 'blur(8px)'; 
                        document.getElementById("blurry").style.pointerEvents = "none";
                        document.body.style.overflow = 'hidden';
                        box.querySelector('.alert').style.display = "block";   
                    }
        
                }
            }    
        });
    });

    async function sendData(route, form) {
        let formData;
        let headers = {};

        if (route === '/deleteEvent') {
            formData = JSON.stringify(form);
            headers['Content-Type'] = 'application/json'; // Set the correct content type for JSON
        } else if (route === '/addEvent') {
            formData = new FormData(form); // Make sure `form` is defined
        } else if (route === '/addEvent2') {
            formData = form;
            route = '/addEvent';
        }

        try {
            const response = await fetch(route, {
                method: "POST",
                headers: headers, // Include headers
                body: formData, // Sending the form data as the request body
            });

            // Check if the response is ok (status in the range 200-299)
            if (!response.ok) {
                // Check for the 400 status
                if (response.status === 400) {
                    return response.json().then(errorData => {
                        console.error("Error message:", errorData.message);
                        showAlert(errorData.message, 'danger')
                    });
                }
                throw new Error("An error occurred");
            }

            // Parse and log the JSON response from the server
            return await response.json();
        } catch (error) {
            console.error(error);
        }
    }   

    var input = document.getElementById('eventPhoto');
    var preview = document.getElementById('PhotoPreview');
    var photoButton = document.getElementById("addPhoto");

    // Function to show the image preview
    function showPreview(file) {
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            preview.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";  // Placeholder when no image is selected
        }
    }

    // Listen for file selection from input
    input.addEventListener('input', function(event) {
        var file = event.target.files[0];  // Get the first file
        showPreview(file);
    });

    // Listen for click on "Add Photo" button
    photoButton.addEventListener('click', function() {
        console.log("photo button clicked");
        input.value = "";
        var preview = document.getElementById('PhotoPreview');
        preview.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
        document.getElementById('error_NP').innerText = "";
    });

    //check validation for the photo field
    let error_field_NP = document.getElementById('error_NP');
    let photoPreview = document.getElementById('eventPhoto');

    photoPreview.addEventListener('input', function(event) {
        const file = event.target.files[0];

        if (file) {
            const fileType = file.type;
            const validImageTypes = ['image/jpeg', 'image/png', 'image/heic']

            if (!validImageTypes.includes(fileType)) {
                error_field_NP.style.color = "red"
                error_field_NP.innerText = "File type not in the permitted list"

                document.getElementById('addPhoto').disabled = true;
                document.getElementById('addPhoto').style.pointerEvents = 'none';
            } else {
                error_field_NP.style.color = "green"
                error_field_NP.innerText = "File valid!!"
                document.getElementById('addPhoto').disabled = false;
                document.getElementById('addPhoto').style.pointerEvents = 'all';
            }
        } else {
            document.getElementById('addPhoto').disabled = false;
            document.getElementById('addPhoto').style.pointerEvents = 'all';
        }
    });        

    function resetFriend(value) {
        var optionsContainer = document.getElementById('eventFriends');
    
        // Create a new option element
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value; // Use textContent instead of innerHTML for simple text
    
        // Append the new option to the select element
        optionsContainer.appendChild(option);
    };

    // Event delegation to handle clicks on dynamically inserted .profileButton elements
    document.body.addEventListener('click', async function(event) {
        // Check if the clicked element has the class .delete (adjust this if it's meant for delete buttons)
        if (event.target && event.target.classList.contains('profileButton')) {

            var viewFriendWrapper= event.target.closest('.wrapper');
            var viewFriend = viewFriendWrapper.querySelector('p');
            var friendName = viewFriend ? viewFriend.textContent.trim() : null;

            if (!friendName) {
                console.error("Friend name not found.");
                return;
            }

            var data = JSON.stringify({ friendName });

            try {
                const response = await fetch('/getFriendProfile', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },  // Set the correct headers
                    body: data,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const friend_info = await response.json();

                // Call the function to display the friend's info
                createInfoPage(friend_info);

                var profileBox = document.getElementById('friendProfile');
                if (profileBox) {
                    profileBox.style.display = "block";
                }
                document.getElementById("blurry").style.filter = 'blur(8px)';
                document.getElementById("blurry").style.pointerEvents = "none";
                document.body.style.overflow = 'hidden';
            } catch (error) {
                console.error('Error fetching friend profile:', error);
            }
        }
    });

    // Function to create and display the friend's info page
    function createInfoPage(friend_info) {

        for (const [key, value] of Object.entries(friend_info)) {
            if (key === 'photo') {
                var imageElement = document.getElementById('Photo');
                if (imageElement) {
                    var imagePath = 'static/profile_images/' + value;
                    imageElement.src = imagePath;
                }
            } else {
                var infoElement = document.getElementById(key);
                if (infoElement) {
                    infoElement.textContent = `${key}: ${value}`;
                }
            }
        }
    }

    //function for the logic after clicking in the calendar to create an event or to modify an already present event
    function select(info) {

        eventForm.style.display = 'block';
        document.getElementById("blurry").style.filter = 'blur(8px)';
        document.getElementById("blurry").style.pointerEvents = "none";
        document.body.style.overflow = 'hidden';

        document.body.classList.add('dimmed');

        addEventForm.onsubmit = function(e) {
            // function to remove the modified evento from the calendar in the page
            if (selectedEvent && Object.keys(info).length === 2) {
                selectedEvent.remove();
                selectedEvent = null;
            }

            submitEventForm(e, info, this);
        };
    } 

    //function to submit the event data to the server
    async function submitEventForm(e, info, thisEvent) {
        e.preventDefault();

        //add informations about the start and the end of the event
        var id = document.getElementById("eventId")
        if (id.value === undefined || id.value === "") { 
            // Generate a unique ID for the event
            var eventId = nextEventId += 1;
            id.value = eventId;
        } 

        var start = document.getElementById("start");
        var end = document.getElementById("end");

        start.value = info.startStr; 
        end.value = info.endStr;


        // Your event creation logic
        var title = document.getElementById('eventTitle').value;
        var color = document.getElementById('eventColor').value;
        var text = document.getElementById('eventText').value;
        var select = document.getElementById('eventTags');
        var tag = select.options[select.selectedIndex].textContent;

        // Gather additional data (photos, friends, links)
        var friends = [];
        document.querySelectorAll("#friendsBox p").forEach(function(friend) {
            friends.push(friend.textContent);
        });

        var links = [];
        document.querySelectorAll("#linkBox a").forEach(function(a) {
            links.push(a.href);
        });

        // Gather photos asynchronously
        const photoElements = document.querySelectorAll("#photoBox img");
        const photoPromises = Array.from(photoElements).map(async (img) => {
            if (!img.src.startsWith("data:image")) {
                // Wait for the base64 conversion
                const base64Data = await getBase64Image(img.src);
                return base64Data;
            }
            return img.src; // Already in base64
        });

        // Wait for all photos to be processed
        try {
            var photos = await Promise.all(photoPromises);

            //taking the base64 of the photos (with the key "base64")
            photos = photos.map(photo => {
                return photo.base64;
            });


            // Create event data with processed photos
            var eventData = {
                id: id.value,
                title: title,
                start: start.value,
                end: end.value,
                color: color,
                extendedProps: {
                    text: text,
                    tags: tag,
                    photos: photos,    
                    friends: friends,  
                    links: links      
                }
            };
            calendar.addEvent(eventData);

            // Send data to server
            sendData('/addEvent', thisEvent)
                .then(response => {
                    if (response && response.photos) {
                        
                        const updatedPhotos = response.photos.map(photo => 
                            'static/events_images/' + photo
                        );

                        const event = calendar.getEventById(response.data.eventId);
                        if (event) {
                            event.setExtendedProp('photos', updatedPhotos);
                        }
                    }
                })
                .catch(error => {
                    console.error("Error handling event modification:", error);
                });
        } catch (error) {
            console.error("Error processing images:", error);
        }

        addButton.innerHTML = "Add Event";

        // Reset the form, clear dynamic content, and hide the form
        resetFormAndContent();
        eventForm.style.display = 'none';
        document.getElementById("blurry").style.filter = 'none';
        document.getElementById("blurry").style.pointerEvents = "all";
        document.body.style.overflow = 'auto';

        document.body.classList.remove('dimmed');
        calendar.unselect();
    };

    // Cancel event creation
    cancelButton.onclick = function() {
        document.getElementById("blurry").style.filter = 'none';
        document.getElementById("blurry").style.pointerEvents = "all";
        document.body.style.overflow = 'auto';

        resetFormAndContent();
        eventForm.style.display = 'none';
        addButton.innerHTML = "Add Event";
        document.body.classList.remove('dimmed');
        calendar.unselect();
    };

    // Function to reset form and clear dynamic content
    function resetFormAndContent() {
        document.getElementById('eventId').value = "";

        // Reset the form inputs
        addEventForm.reset();
        document.getElementById('eventColor').value = "#000000"; 

        // Clear dynamic content from photoBox, friendsBox, and linkBox
        clearDynamicContent('photoBox');
        clearDynamicContent('friendsBox');
        clearDynamicContent('linkBox');
        clearDynamicContent('hiddenPhoto');
        clearDynamicContent('hiddenFriends');
        clearDynamicContent('hiddenBox');
    }

    // Use event delegation for the carousel controls
    document.addEventListener('click', function(event) {
        if (event.target && event.target.id === 'openCarousel') {
            const carouselBox = document.getElementById("carouselBox");
            const innerCarousel = document.querySelector(".carousel-inner");
            const blurry = document.getElementById("blurry");
            
            // Clear existing carousel content
            innerCarousel.innerHTML = '';
            
            // Show carousel and apply blur
            carouselBox.style.display = "block";
            blurry.style.filter = 'blur(8px)';
            blurry.style.pointerEvents = "none";
            document.body.style.overflow = 'hidden';

            // Add photos to carousel
            const photos = document.querySelectorAll("#photosStack img");
            photos.forEach(function(img, index) {
                const carouselItem = document.createElement("div");
                carouselItem.className = "carousel-item";
                if (index === 0) {
                    carouselItem.classList.add('active');
                }

                const newImg = img.cloneNode(true);
                newImg.className = "bd-placeholder-img bd-placeholder-img-lg d-block w-100";
                newImg.style.width = "800px";
                newImg.style.height = "400px";
                newImg.style.objectFit = "contain"; // This will maintain aspect ratio
                newImg.style.backgroundColor = "#777"; // Adding a background color like in the example
                
                carouselItem.appendChild(newImg);
                innerCarousel.appendChild(carouselItem);
            });

            // Initialize Bootstrap carousel
            const carousel = new bootstrap.Carousel(carouselBox, {
                interval: false, // Disable auto-sliding
                keyboard: true  // Enable keyboard controls
            });
        }
    });

    // Separate event listener for close button
    document.querySelector('#closeCarousel').addEventListener('click', function(e) {
        e.stopPropagation(); // Stop event from bubbling up
        e.preventDefault(); // Prevent any default behavior
        
        const carouselBox = document.getElementById("carouselBox");
        const blurry = document.getElementById("blurry");
        
        carouselBox.style.display = "none";
        blurry.style.filter = 'none';
        blurry.style.pointerEvents = "all";
        document.body.style.overflow = 'auto';
    });

    // Add event listeners for prev/next buttons
    document.querySelector('.carousel-control-prev').addEventListener('click', function(e) {
        e.stopPropagation(); // Stop event from bubbling up
        const carousel = bootstrap.Carousel.getInstance(document.getElementById('carouselBox'));
        carousel.prev();
    });

    document.querySelector('.carousel-control-next').addEventListener('click', function(e) {
        e.stopPropagation(); // Stop event from bubbling up
        const carousel = bootstrap.Carousel.getInstance(document.getElementById('carouselBox'));
        carousel.next();
    });

});         


