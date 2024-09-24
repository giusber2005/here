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
    var calendar;
    var selectedEvent = null; // Variable to store the currently selected event
    var nextEventId = 1;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
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
            eventForm.style.display = 'block';
            document.body.classList.add('dimmed');
            selectedEvent = null; // Clear selected event when creating a new one

            addEventForm.onsubmit = function(e) {
                e.preventDefault();

                // Your event creation logic
                var title = document.getElementById('eventTitle').value;
                var color = document.getElementById('eventColor').value;
                var text = document.getElementById('eventText').value;
                var link = document.getElementById('eventLink').value;
                var tag = document.getElementById('eventTags').value;

                // Generate a unique ID for the event
                var eventId = nextEventId++;

                // Gather additional data (photos, friends, links)
                var photos = [];
                document.querySelectorAll("#photoBox img").forEach(function(img) {
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
                        id: eventId,
                        title: title,
                        start: info.startStr,
                        end: info.endStr,
                        color: color,
                        extendedProps: {
                            text: text,
                            link: link,
                            tags: tag,
                            photos: photos,    // Store the photo URLs
                            friends: friends,  // Store the list of friends
                            links: links       // Store additional links
                        }
                    };
                    calendar.addEvent(eventData);
                }
            
                // Reset the form, clear dynamic content, and hide the form
                resetFormAndContent();
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
                calendar.unselect();
            };
            
            // Cancel event creation
            cancelButton.onclick = function() {
                resetFormAndContent();
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
                calendar.unselect();
            };
            
            // Function to reset form and clear dynamic content
            function resetFormAndContent() {
                // Reset the form inputs
                addEventForm.reset();
            
                // Clear dynamic content from photoBox, friendsBox, and linkBox
                clearDynamicContent('photoBox');
                clearDynamicContent('friendsBox');
                clearDynamicContent('linkBox');
            }
            
            // Helper function to clear dynamic content from a given container
            function clearDynamicContent(containerId) {
                var container = document.getElementById(containerId);
                
                // Remove all child nodes
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }
        },
        eventClick: function(info) {
            eventDetails.style.display = 'block'; 
            detailTitle.textContent = info.event.title;

            const start = new Date(info.event.start);
            const end = new Date(info.event.end);

            const options = {
            weekday: 'long', // "Monday", "Tuesday"
            year: 'numeric', // "2023"
            month: 'long', // "September"
            day: 'numeric', // "24"
            hour: '2-digit', // "02 PM"
            minute: '2-digit' // "02:30 PM"
            };

            const formattedStart = new Intl.DateTimeFormat('en-US', options).format(start);
            const formattedEnd = new Intl.DateTimeFormat('en-US', options).format(end);

            detailStart.textContent = `${formattedStart}`
            detailEnd.textContent = `${formattedEnd}`;
            detailText.textContent = info.event.extendedProps.text || 'None';
            detailTags.textContent = info.event.extendedProps.tags || 'None';
        
            // Clear previous content before adding new content
            clearDynamicContent('photoBox');
            clearDynamicContent('friendsBox');
            clearDynamicContent('linkBox');
        
            // Display photos
            var photos = info.event.extendedProps.photos || [];
            photos.forEach(function(photo) {
                var img = document.createElement("img");
                img.src = photo;
                img.className = "photo-preview";
                document.getElementById("photoBox").appendChild(img);
            });
        
            // Display friends
            var friends = info.event.extendedProps.friends || [];
            friends.forEach(function(friend) {
                var p = document.createElement("p");
                p.textContent = friend;
                document.getElementById("friendsBox").appendChild(p);
            });
        
            // Display links
            var links = info.event.extendedProps.links || [];
            links.forEach(function(link) {
                var a = document.createElement("a");
                a.href = link;
                a.textContent = link;
                a.target = "_blank";
                document.getElementById("linkBox").appendChild(a);
            });
        
            selectedEvent = info.event;
            console.log(selectedEvent);
            var form = selectedEvent
            sendData('/addEvent', form);

            calendar.updateSize();
        },        
        viewDidMount: function() {
            // Hide event form when the view is first rendered
            if (eventForm.style.display === 'block') {
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
            }
        },
        viewDidChange: function() {
            // Hide event form when the view changes
            if (eventForm.style.display === 'block') {
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
            }
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
            eventForm.style.display = 'block';
            document.body.classList.add('dimmed');

            var addButton = document.getElementById("addButton");
            addButton.innerHTML = "Modify Event";

            // Pre-fill the form with the current event details
            document.getElementById('eventTitle').value = selectedEvent.title;
            document.getElementById('eventColor').value = selectedEvent.backgroundColor;
            document.getElementById('eventText').value = selectedEvent.extendedProps.text || '';
            document.getElementById('eventLink').value = selectedEvent.extendedProps.link || '';
            document.getElementById('eventTags').value = selectedEvent.extendedProps.tags || '';  // Populate the select with the single tag

            addEventForm.onsubmit = function(e) {
                e.preventDefault();

                // Get updated values from the form
                var updatedTitle = document.getElementById('eventTitle').value;
                var updatedColor = document.getElementById('eventColor').value;
                var updatedText = document.getElementById('eventText').value;
                var updatedLink = document.getElementById('eventLink').value;
                var updatedTag = document.getElementById('eventTags').value;  // Single tag selected from the <select>

                // Update the event with the new values
                selectedEvent.setProp('title', updatedTitle);
                selectedEvent.setProp('backgroundColor', updatedColor);
                selectedEvent.setExtendedProp('text', updatedText);
                selectedEvent.setExtendedProp('link', updatedLink);
                selectedEvent.setExtendedProp('tags', updatedTag);  // Update single tag

                // Hide the form and remove dimming
                eventForm.style.display = 'none';
                addButton.innerHTML = "Add Event";
                document.body.classList.remove('dimmed');
            };

            cancelButton.onclick = function() {
                eventForm.style.display = 'none';
                addButton.innerHTML = "Add Event";
                document.body.classList.remove('dimmed');
            };

            var form = selectedEvent
            sendData('/modifyEvent', form);
        }
    });

    document.getElementById("deleteButton").addEventListener('click', function() {
        if (selectedEvent && confirm("Are you sure you want to delete this event?")) {
            var form = selectedEvent
            sendData('/deleteEvent', form);

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

            let input = this.closest('.column-container').querySelector('.addInput');
            let value = input.value;

            if (value != "") {
                let column = this.closest('.column-container').id;
                let hiddenContainer = this.closest('.column-container').querySelector('.hidden');
    
                let containers = document.querySelectorAll(".Box");
                let Box = null;
                containers.forEach(function(container) {
                    var id = container.id;
                    if (id.includes(column)) {
                        Box = container;
                    }
                });
    
                if (!Box) return; // If no box found, exit
    
                var Wrapper = document.createElement('div');
                Wrapper.className = 'wrapper';

                if (Box.id === 'linkBox') {
                    var newLink = document.createElement('a');
                    newLink.href = value;
                    newLink.textContent = value;
                    newLink.target = '_blank'; // Open link in a new tab
                    Wrapper.appendChild(newLink);
                } else if (Box.id === "photoBox") {
                    var newPhoto = document.createElement('img');

                    var file = input.files[0];
                    if (file) {
                        var reader = new FileReader();
            
                        reader.onload = function(e) {
                            newPhoto.src = e.target.result;
                        };
            
                        reader.readAsDataURL(file);
                    } else {
                        newPhoto.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
                    }

                    newPhoto.className = "photo-preview";
                    Wrapper.appendChild(newPhoto);
                } else if (Box.id === "friendsBox") {
                    var newFriend = document.createElement('p');
                    newFriend.innerHTML = value;
                    Wrapper.appendChild(newFriend);
                }
    
                // Create the delete button
                var deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete';
    
                var hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden'; // Set the type to 'hidden'
                hiddenInput.className = 'hiddenInstance';
                hiddenInput.value = value; 
    
                Wrapper.appendChild(deleteButton);
    
                // Append the wrapper to the container
                Box.appendChild(Wrapper);
                hiddenContainer.appendChild(hiddenInput);
    
                input.value = ""; // Clear the input
            }
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
                let counter = Box.querySelectorAll('.delete').length;
                if (counter === 0) {
                    Box.style.display = "block";
                    document.getElementById("blurry").style.filter = 'blur(8px)';
                    Box.querySelector('.alert').style.display = "block";    
                } else {
                    Box.style.display = "block";
                    document.getElementById("blurry").style.filter = 'blur(8px)';
                    Box.querySelector('.alert').style.display = "none";
                }
            }
        });
    });
    
    let closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            let Box = this.closest('.Box');
            Box.style.display = "none";
            document.getElementById("blurry").style.filter = 'none';
        });
    });
    
    let Boxes = document.querySelectorAll(".Box");
    Boxes.forEach(function(box) {
        box.addEventListener('click', function(event) {
            if (event.target && event.target.classList.contains('delete')) {
                let counter = box.querySelectorAll('.delete').length;

                var parentDiv = event.target.closest('.wrapper'); 
    
                if (parentDiv) {
                    let value;
                    if (box.id === 'links') {
                        let link = parentDiv.querySelector('a');
                        value = link.href;
                    } else if (box.id === "photo") {
                        let photo = parentDiv.querySelector('img');
                        value = photo.src;
                    } else if (box.id === "friends") {
                        let friend = parentDiv.querySelector('p');
                        value = friend.innerHTML;
                    }
    
                    parentDiv.remove();
    
                    let hiddenBoxes = document.querySelectorAll('.hidden');
                    hiddenBoxes.forEach(function(hiddenBox) {
                        let hiddenInputs = hiddenBox.querySelectorAll(".hiddenInstance");
    
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
                        box.querySelector('.alert').style.display = "block";   
                    }
        
                }
            }    
        });
    });

    function  clearDynamicContent(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    async function sendData(route, form) {
        // Associate the FormData object with the form element
        const formData = new FormData(form); // Make sure `form` is defined
    
        try {
            const response = await fetch(route, { // Endpoint should match your Flask route
                method: "POST",
                body: formData, // Sending the form data as the request body
            });
    
            // Check if the response is ok (status in the range 200-299)
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            // Parse and log the JSON response from the server
            const data = await response.json();
            console.log(data);
        } catch (e) {
            console.error(e); // Log any errors that occur
        }
    }    
});         
