document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var eventForm = document.getElementById('eventForm');
    var addEventForm = document.getElementById('addEventForm');
    var cancelButton = document.getElementById('cancelButton');
    var eventDetails = document.getElementById('eventDetails');
    var detailTitle = document.getElementById('detailTitle');
    var detailStart = document.getElementById('detailStart');
    var detailText = document.getElementById('detailText');
    var detailLink = document.getElementById('detailLink');
    var detailTags = document.getElementById('detailTags');  // Will handle a single tag now
    var calendar;
    var selectedEvent = null; // Variable to store the currently selected event

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
                var title = document.getElementById('eventTitle').value;
                var color = document.getElementById('eventColor').value;
                var text = document.getElementById('eventText').value;
                var link = document.getElementById('eventLink').value;
                var tag = document.getElementById('eventTags').value;  // Single tag selected from the <select>

                var eventData;
                if (title) {
                    eventData = {
                        title: title,
                        start: info.startStr,
                        end: info.endStr,
                        color: color,
                        extendedProps: {
                            text: text,
                            link: link,
                            tags: tag  // Handle the single tag value here
                        }
                    };
                    calendar.addEvent(eventData);
                }
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
                calendar.unselect();
            };

            cancelButton.onclick = function() {
                eventForm.style.display = 'none';
                document.body.classList.remove('dimmed');
                calendar.unselect();
            };
        },
        eventClick: function(info) {
            eventDetails.style.display = 'block'; // Show event details
            detailTitle.textContent = info.event.title;
            detailStart.textContent = `${info.event.startStr} - ${info.event.endStr}`;
            detailText.textContent = info.event.extendedProps.text || 'None';
            detailLink.href = info.event.extendedProps.link || '#';
            if (detailLink.href.endsWith("#") ) {
                detailLink.style.display = "none"; // Correct the "None" to "none"
                document.getElementById('altLink').innerHTML = "None";
            } else {
                detailLink.style.display = "inline-block";
                document.getElementById('altLink').style.display = "none"; // Correct "None" to "none"
            }            
            detailTags.textContent = info.event.extendedProps.tags || 'None';  // Display single tag
            detailLink.textContent = info.event.extendedProps.link || 'None';

            selectedEvent = info.event; // Store the currently selected event

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

            addButton = document.getElementById("addButton");
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
        }
    });

    document.getElementById("deleteButton").addEventListener('click', function() {
        if (selectedEvent && confirm("Are you sure you want to delete this event?")) {
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
                    newPhoto.src = value;
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
                Box.style.display = "block";
                document.getElementById("blurry").style.filter = 'blur(8px)';
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
                if (counter === 1) {
                    box.style.display = "none";
                    document.getElementById("blurry").style.filter = 'none';    
                }
    
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
                }
            }    
        });
    });
    
});         



/*
    //OLD IMPLEMENTATION OF LINK ADDER AND OTHER LINK FEATURES
    var linksCounter = 0;
    // Event listener for adding new links
    document.getElementById("addLink").addEventListener('click', function() {
        let link = document.getElementById("eventLink");
        let value = link.value;
        if (value != "") {
            linksCounter += 1;

            let container = document.getElementById("linkBox");
            let hiddenContainer = document.getElementById("hiddenBox");

            var linkWrapper = document.createElement('div');
            linkWrapper.className = 'link-wrapper';

            var newLink = document.createElement('a');
            newLink.href = value;
            newLink.textContent = value;
            newLink.target = '_blank'; // Open link in a new tab

            // Create the delete button
            var deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'deleteLink';

            var hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden'; // Set the type to 'hidden'
            hiddenInput.className = 'hiddenLink';
            hiddenInput.value = value; 

            // Append the link and button to the wrapper
            linkWrapper.appendChild(newLink);
            linkWrapper.appendChild(deleteButton);

            // Append the wrapper to the container
            container.appendChild(linkWrapper);
            hiddenContainer.appendChild(hiddenInput);

            link.value = "";
        }
    });

    // Event listeners for showing and closing the link box
    document.getElementById("showLink").addEventListener('click', function() {
        document.getElementById("linkBox").style.display = "block";
        document.getElementById("blurry").style.filter = 'blur(8px)';
    });

    document.getElementById("closeLink").addEventListener('click', function() {
        document.getElementById("linkBox").style.display = "none";
        document.getElementById("blurry").style.filter = 'none';
    });

    // Event delegation for handling delete button clicks
    document.getElementById("linkBox").addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('deleteLink')) {
            linksCounter -= 1;
            if (linksCounter === 0) {
                document.getElementById("linkBox").style.display = "none";
                document.getElementById("blurry").style.filter = 'none';
            }
            
            var parentDiv = event.target.closest('.link-wrapper');

            if (parentDiv) {
                let link = parentDiv.querySelector('a');
                if (link) {
                    let value = link.href;

                    // Remove the parent div
                    parentDiv.remove();

                    // Find and remove the hidden input with the matching value
                    let box = document.getElementById("hiddenBox");
                    if (box) {
                        let inputs = box.querySelectorAll(".hiddenLink");

                        for (let input of inputs) {
                            if (input.value === value) {
                                input.remove();
                                break; // Exit the loop after removing the element
                            }
                        }
                    }
                }
            }
        }
    });
*/

