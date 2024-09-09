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
    });
});
