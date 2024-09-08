document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var eventForm = document.getElementById('eventForm');
    var addEventForm = document.getElementById('addEventForm');
    var cancelButton = document.getElementById('cancelButton');
    var eventDetails = document.getElementById('eventDetails');
    var detailTitle = document.getElementById('detailTitle');
    var detailStart = document.getElementById('detailStart');
    var detailEnd = document.getElementById('detailEnd');
    var detailColor = document.getElementById('detailColor');
    var detailText = document.getElementById('detailText');
    var detailLink = document.getElementById('detailLink');
    var detailTags = document.getElementById('detailTags');
    var calendar;

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
            addEventForm.onsubmit = function(e) {
                e.preventDefault();
                var title = document.getElementById('eventTitle').value;
                var color = document.getElementById('eventColor').value;
                var text = document.getElementById('eventText').value;
                var link = document.getElementById('eventLink').value;
                var tags = document.getElementById('eventTags').value.split(',').map(tag => tag.trim());

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
                            tags: tags
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
            detailStart.textContent = info.event.startStr;
            detailEnd.textContent = info.event.endStr;
            detailColor.textContent = info.event.backgroundColor; // Assuming color is set as backgroundColor
            detailText.textContent = info.event.extendedProps.text || 'N/A';
            detailLink.href = info.event.extendedProps.link || '#';
            detailLink.textContent = info.event.extendedProps.link ? 'Open Link' : 'N/A';
            detailTags.textContent = info.event.extendedProps.tags ? info.event.extendedProps.tags.join(', ') : 'N/A';
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
        document.getElementById("eventDetails").style.display = "none";
    });
});
