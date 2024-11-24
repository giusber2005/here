# PROJECT

**LOGO**  
<img width="547" alt="logo" src="static/images/logo.png">

**NAME AND SURNAME**  
Giuseppe Berardi

**CITY AND COUNTRY**  
Italy, Bologna

**GITHUB USERNAME**  
giusber2005

**EDX USERNAME**  
giuseppe_83

**VIDEO URL**  
[YouTube Video](insert url)  
Date of record: 24/11/2024

**PROJECT TITLE**  
“HERE, your calendar for social and management”

**DESCRIPTION (PROBLEM -> SOLUTION, GENERAL DESCRIPTION)**  
I have always seen management applications like too complicate for the actual job they needed to do, that is help users visualise and keep track of the situation of their businesses, so I decided with the knowledge I have gained from taking the cs50 course to develop such an application.
This is HERE, a management web application that has as its principal objective to help people organise better their spaces and events in a easeful and intuitive way.

**FEATURES**
HERE has not a huge amount of features because it’s structured to be simple and easy to work with it.
It has a complete user management part that keep track of all the users principal informations, along with also their unique token for interacing with other users as friends in the application, than there is the calendar part which is structured to be as complete as possible, we have the possibility to select and personalise events, we can set their duration, we can specify the members of the events, we can add links, photos, text, all that in an easy and intuitive interface that comes with different views (day, week, month, year) and also permit the user to see some of the principals public events of their friends.
Talking more about in depth about his calendar part, we can also see if we add friends to our events their main public informations, so the events are a way to make users not also organise their spaces but also to make them interact with each other.
Another useful feature that i think is interesting is the image viewing part in the events, where you can access a carousel of all the images added to the event.
Instead, talking more about the user management part, each person that have an account in this platform can store his principal data (like in every other social) to became visible to the other users and connect with them.
And finally, is important to mention that the website is secured from brute-force attacks but at the same time has all the feature to retrieve in an easy way lost passwords (without the need of creating a whole new account).

**TECHNICAL SPECIFICATIONS**  
This web application back-end was built with Flask (a simple framework for the Python language), while the front-end is simply composed of HTML, CSS, and JS, powered by Jinja (the Flask template framework) and Bootstrap (a CSS framework to make the design process simpler).  
From the calendar part i also decided to use the FullCalendar template to gain all his feature adapting it to the needs of my application.
For the development part, I used a virtual environment to manage all the packages needed in my code, while for launching the project in production I decided to containerize it using Docker (the image of the application is findable in docker hub and for pulling it to use it directly from your terminal you can simply type in the terminal "docker pull whitewhite77/here", with of course the docker engine active), and also i hosted it in the pythonanywhere platform.  
More in specific about the back-end i decided to structure my application like a normal flask application, with an app.py file (the brain of the application, helped by a helper.py file), an sqlite database and all the code for the front-end.  
Talking instead about the communication between back-end and front-end i mixed up HTML type of connections (direct connections between endpoints of the back-end and HTML forms of the pages) especially where was needed to reload a page or change it, and AJAX type of connections (indirect connections between endpoints of the back-end and HTML forms of the page with the use of fetch() in js scripts) for more dynamic part of interaction where i didn't want to reload the page.
All more in-depth specifications are included in comments inside the code.

**THINGS I LEARNED/PROBLEMS I TACKLED**
While working on this final project i used to be, especially at the beginning, very messy with my code, and because of that i used to be very slow in the production, but with hours of pratice i finally reached a medium velocity of production, being able to send to production my application in time.
Thinking about things that i learned, i used third part services like gmail, i worked a lot with javascript, learning a new programming language (one of the most important today) and i also worked with an API like fullCalendar, that helped me a lot in learning how different parts of code in different languages interact each other.
Another thing that i learned that will help me a lot in the future is the fact that i programmed all the application outside codespaces finally learning how to really program in the real world.
One final thing that i want to mention that i learned through this process is the production part, not mentioned at all in course, that helped me understand how an application developed from anybody can start living in the web.

**A.I ASSISTANT USED**  
The principal assistant I used to improve my productivity has been ChatGPT (of the OpenAI group). I used it principally for code snippets of the architecture of some functions in my code (that I’ve improved to work in my web application) or simply to understand better some parts of the communication between the front-end and the back-end, which is not always simple to understand.

**HOW TO USE THE APPLICATION**
If you simply want to use the web application HERE, you can simply type his domain name "HEREcalendar.pythonanywhere.com" to use it!
