
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

            eventDetails.style.display = 'block'; 
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
                photos.forEach(function(photo) {
                    var img = document.createElement("img");
                    img.src = photo;
                    img.className = "photo-preview";
                    document.getElementById("detailsPhotoBox").appendChild(img);
    
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

            var eventInfo = createEventFormData(info.event);
            sendData('/addEvent2', eventInfo);
        },
        eventResize: function(info) {

            var eventInfo = createEventFormData(info.event);
            sendData('/addEvent2', eventInfo);
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
            photosInsert.forEach(function(_photo_) {
                addElement("", _photo_, "photo");
            }); 
            
            var friendsInsert = Array.isArray(selectedEvent.extendedProps.friends) ? selectedEvent.extendedProps.friends : [];
            friendsInsert.forEach(function(_friend_) {
                addElement("", _friend_, "friend");
            });
            
            var linksInsert = Array.isArray(selectedEvent.extendedProps.links) ? selectedEvent.extendedProps.links : [];
            linksInsert.forEach(function(_link_) {
                addElement("", _link_, "link");
            });

            select(eventInfo);
        }
    });

    document.getElementById("deleteButton").addEventListener('click', function() {
        if (selectedEvent && confirm("Are you sure you want to delete this event?")) {
            var form = selectedEvent
            sendData('/deleteEvent', form.id);

            // Remove the event from the calendar
            selectedEvent.remove();
            selectedEvent = null; // Clear the selected event
            eventDetails.style.display = "none";
        }
        calendar.updateSize();
    });

    var addButtons = document.querySelectorAll(".add");

    addButtons.forEach(function(item) {
        item.addEventListener('click', function() {
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
            // No need to set Content-Type for FormData; the browser will set it automatically
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
                throw new Error('Network response was not ok');
            }

            // Parse and log the JSON response from the server
            const data = await response.json();
        } catch (e) {
            console.error(e); // Log any errors that occur
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
        input.value = "";
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
        console.log("the event form is selected");

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

            console.log("the event form is submitted");
            submitEventForm(e, info, this);
        };
    } 

    //function to submit the event data to the server
    function submitEventForm(e, info, thisEvent) {
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

        console.log(":) the event started at: ", start.value);
        console.log(":) the event ended at: ", end.value);

        // Your event creation logic
        var title = document.getElementById('eventTitle').value;
        var color = document.getElementById('eventColor').value;
        var text = document.getElementById('eventText').value;
        var select = document.getElementById('eventTags');
        var tag = select.options[select.selectedIndex].textContent;

        // Gather additional data (photos, friends, links)
        var photos = [];
        document.querySelectorAll("#photoBox img").forEach(function(img) {
            if (img.src.startsWith("h")) {
                console.log("ciao")
                img.src = getBase64Image(img.src);
            }                 
                
            photos.push(img.src);
        });

        var friends = [];
        document.querySelectorAll("#friendsBox p").forEach(function(friend) {
            friends.push(friend.textContent);
        });

        var links = [];
        document.querySelectorAll("#linkBox a").forEach(function(a) {
            links.push(a.href);
        });

        if (title) {
            var eventData = {
                id: id.value,
                title: title,
                start: start.value,
                end: end.value,
                color: color,
                extendedProps: {
                    text: text,
                    tags: tag,
                    photos: photos,    // Store the photo URLs
                    friends: friends,  // Store the list of friends
                    links: links       // Store additional links
                }
            };
            calendar.addEvent(eventData);

            sendData('/addEvent', thisEvent);        
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
});         



