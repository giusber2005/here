
#library to work with regular expression (useful in the registration and profile edit pages)
import re

#library to work with the operating system, including file and directory operations(useful in particular with the manipulation and the storage of images)
import os

#library useful to work with time, in particular in the login page with the current time the user has tried to log in
import time

#function to calculate a period of time (useful in the session expiration time)
from datetime import timedelta, datetime, timezone

#library to work with databases
from cs50 import SQL

#libraries to connect the application with templates and to persist data between templates with session
from flask import Flask, flash, redirect, render_template, request, session, send_from_directory, url_for, jsonify, get_flashed_messages
from flask_session import Session

#library to retrieve data from list in the data folder
import requests

#libraries for the password encription, to store it securely in the database
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

#libraries and modules for running periodic scripts in the application
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import secrets

#function to read base64 formatted images (used in the events manipulations in the calendar)
import base64
#function to understand the type of the image (used in the events manipulations in the calendar)
import mimetypes

#some functions to weight down the code in app.py
from helpers import *

from dotenv import load_dotenv
load_dotenv()

# Configure application
app = Flask(__name__)
app.secret_key = os.getenv('APPLICATION_SECRET_KEY')

"""
Configuring the environment for the system of sending email to the user
"""
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

email_password = os.getenv('GMAIL_PASSWORD')

# Configuration for Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Your email server
app.config['MAIL_PORT'] = 587  # Port number (usually 587 for TLS)
app.config['MAIL_USE_TLS'] = True  # Use TLS
app.config['MAIL_USE_SSL'] = False  # Do not use SSL
app.config['MAIL_USERNAME'] = 'hereforhelp888@gmail.com'  # Your email address
app.config['MAIL_PASSWORD'] = email_password # Your email password
app.config['MAIL_DEFAULT_SENDER'] = 'hereforhelp888@gmail.com'  # Default sender email address

mail = Mail(app)


#Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

db_path = os.path.join(os.path.dirname(__file__), "database.db")
db = SQL(f"sqlite:///{db_path}")

@app.before_request
def enable_foreign_keys():
    db.execute("PRAGMA foreign_keys = ON")

# set session to expire after 30 minutes of inactivity
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# reject request bodies bigger than 16 MB (profile photos are limited to 5 MB in helpers.py)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

@app.errorhandler(413)
def request_too_large(error):
    flash("That upload is too large — profile photos can be at most 5 MB", "error")
    return redirect(request.referrer or "/")

#makes the logged user's name and avatar available in every template (used by the navbar)
@app.context_processor
def inject_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return {}
    rows = db.execute(
        "SELECT user.username, user.FirstName, user.LastName, user_optional.photo FROM user LEFT JOIN user_optional ON user_optional.id = user.id WHERE user.id = ?",
        user_id
    )
    if not rows:
        return {}
    user = rows[0]
    return {"current_user": {
        "username": user["username"],
        "first_name": user["FirstName"],
        "avatar": avatar_url(user["photo"]),
        "initials": initials(user["FirstName"], user["LastName"], user["username"]),
    }}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

"""
Initializing some app.routes in order for retrieving the files in the /data folder
"""
data_dir = os.path.join(BASE_DIR, 'data')

#app.route to make the common.txt file utilizable
@app.route('/data/common.txt')
def get_common_passwords():
    return send_from_directory(data_dir, 'common.txt')

#app.route to make the worldcities.csv file utilizable
@app.route('/data/worldcities.csv')
def get_cities_and_nations():
    return send_from_directory(data_dir, 'worldcities.csv')

#app.route to make the nations_and_prefixes.csv file utilizable
@app.route('/data/nations_and_prefixes.csv')
def get_nations_and_prefixes():
    return send_from_directory(data_dir, 'nations_and_prefixes.csv')

#endpoint to check in real time if the provided username by the user is already in the database
@app.route("/check-username/<username>", methods=["GET"])
def check_username(username):
    try:
        if session['user_id']:
            current_username = db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])[0]["username"]
            if current_username == username:
                return {"exists": False}
    except KeyError:
        pass

    # Query to check if username exists in the database
    result = db.execute("SELECT COUNT(*) AS count FROM user WHERE username = ?", username)
    exists = result[0]["count"] > 0
    return jsonify({"exists": exists})

#endpoint to check in real time if the provided email by the user is already in the database
@app.route("/check-email/<email>", methods=["GET"])
def check_email(email):
    try:
        if session['user_id']:
            current_email = db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])[0]["email"]
            if current_email == email:
                return {"exists": False}
    except KeyError:
        pass

    # Query to check if email exists in the database
    result = db.execute("SELECT COUNT(*) AS count FROM user WHERE email = ?", email)
    exists = result[0]["count"] > 0
    return jsonify({"exists": exists})

#endpoint to check in real time if the provided number by the user is already in the database
@app.route("/check-number/<number>", methods=["GET"])
def check_number(number):
    try:
        if session['user_id']:
            current_number = db.execute("SELECT * FROM user_optional WHERE id = ?", session["user_id"])[0]["number"]
            if current_number == number:
                return {"exists": False}
    except KeyError:
        pass

    # Query to check if username exists in the database
    result = db.execute("SELECT COUNT(*) AS count FROM user_optional WHERE number = ?", number)
    exists = result[0]["count"] > 0
    return jsonify({"exists": exists})

#app page after the login
@app.route("/",  methods=["GET", "POST"])
@login_required
def index():
    if request.method == "GET" or request.method == "POST":

        # Query to get all the friends of the user
        friends_dict = {friend["id"]: friend["username"] for friend in get_friends(session["user_id"])}

        return render_template("homepage.html", friends_dict=friends_dict)

#dashboard with an overview of the user's events, friends and profile
@app.route("/dashboard")
@login_required
def dashboard():
    user_id = session["user_id"]
    now = datetime.now()
    today = now.date()

    user = db.execute("SELECT * FROM user WHERE id = ?", user_id)[0]
    optional = db.execute("SELECT * FROM user_optional WHERE id = ?", user_id)[0]

    friends = get_friends(user_id)
    friends_by_id = {}
    for friend in friends:
        friend["avatar"] = avatar_url(friend["photo"])
        friend["initials"] = initials(friend["FirstName"], friend["LastName"], friend["username"])
        friend["shared_events"] = 0
        friends_by_id[friend["id"]] = friend

    events = db.execute(
        "SELECT * FROM eventsPrincipal WHERE id IN (SELECT event_id FROM eventsConnections WHERE user = ?)", user_id
    )
    participants = db.execute(
        "SELECT event_id, user FROM eventsConnections WHERE event_id IN (SELECT event_id FROM eventsConnections WHERE user = ?)", user_id
    )
    photos_count = db.execute(
        "SELECT COUNT(*) AS n FROM eventsPhotos WHERE event_id IN (SELECT event_id FROM eventsConnections WHERE user = ?)", user_id
    )[0]["n"]

    members = {}
    for row in participants:
        if row["user"] != user_id and row["user"] in friends_by_id:
            members.setdefault(row["event_id"], []).append(friends_by_id[row["user"]])
            friends_by_id[row["user"]]["shared_events"] += 1

    #months shown in the activity chart: 5 before the current one and 6 after
    months = []
    for offset in range(-5, 7):
        year, month = divmod(today.month - 1 + offset, 12)
        months.append({"year": today.year + year, "month": month + 1, "count": 0,
                       "label": datetime(today.year + year, month + 1, 1).strftime("%b"),
                       "current": offset == 0})
    month_index = {(m["year"], m["month"]): m for m in months}

    tags = {}
    upcoming, week_count, month_count, shared_count = [], 0, 0, 0
    for event in events:
        try:
            start, end = parse_time_slot(event["time_slot"])
        except ValueError:
            continue
        all_day = "T" not in (event["time_slot"] or "")
        tag = (event["tag"] or "").strip() or "No tag"
        tags[tag] = tags.get(tag, 0) + 1

        if (start.year, start.month) in month_index:
            month_index[(start.year, start.month)]["count"] += 1
        if start.year == today.year and start.month == today.month:
            month_count += 1
        if event["id"] in members:
            shared_count += 1

        if end >= now or (all_day and start.date() >= today):
            if (start.date() - today).days < 7:
                week_count += 1
            upcoming.append({
                "id": event["id"], "title": event["title"], "color": event["color"] or "#FF6B35",
                "tag": event["tag"], "start": start, "all_day": all_day,
                "ongoing": start < now and not all_day,
                "friends": members.get(event["id"], []),
            })
    upcoming.sort(key=lambda e: e["start"])

    #birthdays of friends in the next 60 days
    birthdays = []
    for friend in friends:
        try:
            born = datetime.strptime(friend["birthday"], "%Y-%m-%d").date()
        except (TypeError, ValueError):
            continue
        try:
            next_birthday = born.replace(year=today.year)
        except ValueError:  # 29th of February
            next_birthday = born.replace(year=today.year, day=28)
        if next_birthday < today:
            next_birthday = next_birthday.replace(year=today.year + 1)
        days = (next_birthday - today).days
        if days <= 60:
            birthdays.append({**friend, "date": next_birthday, "days": days, "turning": next_birthday.year - born.year})
    birthdays.sort(key=lambda b: b["days"])

    optional_keys = ["photo", "number", "nation", "city", "description", "gender"]
    completeness = round(100 * sum(1 for key in optional_keys if optional[key]) / len(optional_keys))

    hour = now.hour
    greeting = "Good morning" if 5 <= hour < 12 else "Good afternoon" if 12 <= hour < 18 else "Good evening"

    return render_template(
        "dashboard.html",
        user=user,
        greeting=greeting,
        today=today,
        stats={
            "friends": len(friends),
            "events": len(events),
            "upcoming": len(upcoming),
            "week": week_count,
            "month": month_count,
            "shared": shared_count,
            "photos": photos_count,
        },
        upcoming=upcoming[:6],
        months=months,
        months_max=max([m["count"] for m in months] + [1]),
        tags=sorted(tags.items(), key=lambda t: t[1], reverse=True),
        tags_max=max(list(tags.values()) + [1]),
        top_friends=sorted(friends, key=lambda f: f["shared_events"], reverse=True)[:5],
        recent_friends=friends[:5],
        birthdays=birthdays[:4],
        completeness=completeness,
        conn_token=user["conn_token"],
    )

"""
Initializing the environment for the login enforcement with the MAX tempt. block
"""
ENABLE_LOGIN = True

#Configuring APScheduler
scheduler = BackgroundScheduler()

def login_attempt():
    global ENABLE_LOGIN
    ENABLE_LOGIN = True
    scheduler.shutdown()

# Schedule a task to run every five minutes
scheduler.add_job(
    func=login_attempt,
    trigger=IntervalTrigger(minutes=5),  # Change this to your required interval
    id='periodic_task',  # Give the task an ID
    name='Run periodic_task every five minute',
    replace_existing=True
)

#login route
@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    ip = request.remote_addr
    global ENABLE_LOGIN
    try:
        CURRENT_BLOCK = db.execute("SELECT * FROM user_blocks WHERE user_ip = ?", ip)[0]["current_block"]
    except IndexError:
        CURRENT_BLOCK = 0

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        if ENABLE_LOGIN == False:
            flash("Too many failed attempts — please wait 5 minutes and try again", "error")
            return redirect("/login")

        # Ensure username was submitted
        if not request.form.get("username"):
            flash("Please enter your username", "error")
            success = "denied"
            current_time = time.time()
            if current_time - CURRENT_BLOCK >= 300:
                db.execute("DELETE FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)
            db.execute("INSERT INTO login_attempt (user_ip, success) VALUES (?, ?)", ip, success)
            db.execute("DELETE FROM user_blocks WHERE user_ip = ?", ip)
            db.execute("INSERT INTO user_blocks (current_block, user_ip) VALUES (?, ?)", time.time(), ip)
            if db.execute("SELECT COUNT(user_ip) FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)[0]["COUNT(user_ip)"] >= 5:
                scheduler.start()
                ENABLE_LOGIN = False
            return redirect("/login")

        # Ensure password was submitted
        elif not request.form.get("password"):
            flash("Please enter your password", "error")
            success = "denied"
            current_time = time.time()
            if current_time - CURRENT_BLOCK >= 300:
                db.execute("DELETE FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)
            db.execute("INSERT INTO login_attempt (user_ip, success) VALUES (?, ?)", ip, success)
            db.execute("DELETE FROM user_blocks WHERE user_ip = ?", ip)
            db.execute("INSERT INTO user_blocks (current_block, user_ip) VALUES (?, ?)", time.time(), ip)
            if db.execute("SELECT COUNT(user_ip) FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)[0]["COUNT(user_ip)"] >= 5:
                scheduler.start()
                ENABLE_LOGIN = False
            return redirect("/login")

        # Query database for username
        rows = db.execute("SELECT * FROM user WHERE username = ?", request.form.get("username"))
        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            flash("That username and password don't match — please try again", "error")
            success = "denied"
            current_time = time.time()
            if current_time - CURRENT_BLOCK >= 300:
                db.execute("DELETE FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)
            db.execute("INSERT INTO login_attempt (user_ip, success) VALUES (?, ?)", ip, success)
            db.execute("DELETE FROM user_blocks WHERE user_ip = ?", ip)
            db.execute("INSERT INTO user_blocks (current_block, user_ip) VALUES (?, ?)", time.time(), ip)
            if db.execute("SELECT COUNT(user_ip) FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)[0]["COUNT(user_ip)"] >= 5:
                scheduler.start()
                ENABLE_LOGIN = False
            return redirect("/login")

        # Forget any user_id
        session.clear()

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to the dashboard
        flash(f"Welcome back, {rows[0]['FirstName'] or rows[0]['username']}!", "success")
        ip = request.remote_addr
        success = "denied"
        db.execute("DELETE FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)
        db.execute("DELETE FROM user_blocks WHERE user_ip = ?", ip)
        success = "permitted"
        db.execute("INSERT INTO login_attempt (user_ip, success) VALUES (?, ?)", ip, success)
        return redirect("/dashboard")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")

#route for logging out
@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    flash("You've been logged out. See you soon!", "info")
    return redirect("/login")

#route for register an user
@app.route("/register", methods=["GET", "POST"])
def register():
    #if the user click the link in the homepage
    if request.method == "GET":
        return render_template("registration.html", form={}, errors={})

    #validation and insertion in the database of all the informations
    form = request.form

    #re-render the form keeping what the user typed and showing the message next to the wrong field
    def fail(field, message):
        flash("Please fix the highlighted field", "error")
        return render_template("registration.html", form=form, errors={field: message}), 400

    # Form validation
    required_fields = {
        "Newusername": "a username",
        "Newpassword": "a password",
        "FirstName": "your first name",
        "LastName": "your last name",
        "Newbirthday": "your birthday",
        "Newemail": "your email"
    }
    #ensure that all the required_fields are not empty
    for field, name in required_fields.items():
        if not form.get(field, "").strip():
            return fail(field, f"Please enter {name}")

    Newusername = form.get("Newusername").strip()
    #Ensure username is not composed of special characters
    if not re.fullmatch(r'[A-Za-z0-9_-]{3,30}', Newusername):
        return fail("Newusername", "Use 3–30 letters, numbers, hyphens or underscores")

    #Ensure username is not already in the database
    if db.execute("SELECT 1 FROM user WHERE username = ?", Newusername):
        return fail("Newusername", "This username is already taken — try another one")

    #Ensure the password is strong enough
    result = password_check(form.get("Newpassword").strip())
    if result != 1:
        return fail("Newpassword", result)

    #check if the birthday is in a correct format
    Newbirthday = form.get("Newbirthday").strip()
    result = birthday_check(Newbirthday)
    if result != 1:
        return fail("Newbirthday", result)

    #check if the email is in the correct format
    Newemail = form.get("Newemail").strip()
    result = email_check(Newemail)
    if result != 1:
        return fail("Newemail", result)

    #Ensure email is not already in the database
    if db.execute("SELECT 1 FROM user WHERE email = ?", Newemail):
        return fail("Newemail", "An account with this email already exists — try logging in")

    #Validate First and last name to be only names
    if not form.get("FirstName").strip().isalpha():
        return fail("FirstName", "Use letters only")
    if not form.get("LastName").strip().isalpha():
        return fail("LastName", "Use letters only")

    #variables of all the database requested fields
    NewPassword = generate_password_hash(form.get("Newpassword"))
    FirstName = form.get("FirstName").strip().lower().capitalize()
    LastName = form.get("LastName").strip().lower().capitalize()
    Token = secrets.token_urlsafe()

    #optional fields: an empty field is stored as None
    good_fields = dict()

    #validate the photo user input
    photo = request.files.get('NewPhoto')
    if photo and photo.filename:
        result = validate_profile_photo(photo)
        if result:
            return fail("NewPhoto", result)
    else:
        photo = None

    Nation = form.get("NewNation", "").strip().lower()
    if Nation:
        #create validation for the nation (check against list)
        result = nation_check(Nation)
        if result != 1:
            return fail("NewNation", "Pick a country from the suggestions")
        good_fields["nation"] = Nation

    City = form.get("NewCity", "").strip().lower()
    if City:
        #create validation for the city (check against list)
        if not Nation:
            return fail("NewCity", "Choose a country first, then your city")
        result = city_check(City, Nation)
        if result != 1:
            return fail("NewCity", f"Pick a city in {Nation.title()} from the suggestions")
        good_fields["city"] = City

    Number = form.get("NewNumber", "").strip()
    if Number:
        #create validation for the number
        Prefix = form.get("Prefix", "").strip()
        if not Prefix:
            return fail("Prefix", "Add the country prefix for your number (e.g. +39)")
        Number = Prefix + " " + Number.replace('-', ' ')
        result = number_check(Number, session)
        if result != 1:
            return fail("NewNumber", result)
        good_fields["number"] = Number

    Description = form.get("NewDescription", "").strip()
    if Description:
        #create validation for the description
        if len(Description) > 500:
            return fail("NewDescription", f"Your bio is {len(Description)} characters — the limit is 500")
        good_fields["description"] = Description

    Gender = form.get("NewGender", "").strip()
    if Gender:
        #checking if the gender is one of the allowed
        if Gender not in ("Male", "Female", "Other"):
            return fail("NewGender", "Choose one of the options in the list")
        good_fields["gender"] = Gender

    if photo:
        #saving the photo file in the folder for the photos (with a unique name)
        good_fields["photo"] = save_profile_photo(photo)

    db.execute("INSERT INTO user (username, FirstName, LastName, birthday, email, hash, conn_token) VALUES(?, ?, ?, ?, ?, ?, ?)", Newusername, FirstName, LastName, Newbirthday, Newemail, NewPassword, Token)
    user_id = db.execute("SELECT id FROM user WHERE username = ?", Newusername)[0]["id"]
    #user_optional shares the id with user
    db.execute("INSERT INTO user_optional (id, username) VALUES (?, ?)", user_id, Newusername)
    for database_name, value in good_fields.items():
        db.execute("UPDATE user_optional SET ? = ? WHERE id = ?", database_name, value, user_id)

    flash(f"Welcome aboard, {FirstName}! Your account is ready — log in to get started", "success")
    return redirect("/login")


#route for changing the password of an user
@app.route("/change", methods=["GET", "POST"])
@login_required
def change():
     """register user"""
     if request.method == "GET":
         return render_template("change.html")
     else:
        # Ensure Oldpassword was submitted
        if not request.form.get("Oldpassword"):
            flash("Please enter your current password", "error")
            return redirect("/change")
        # Ensure Newpassword was submitted
        elif not request.form.get("Newpassword"):
            flash("Please enter a new password", "error")
            return redirect("/change")

        #Ensure password is composed of more than 8 alphanumerical characters
        passwordcheck = request.form.get("Newpassword").strip()
        result = password_check(passwordcheck)
        if result != 1:
            flash(result, "error")
            return redirect("/change")

        rows = db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])
        OldPassword = request.form.get("Oldpassword")
        if not check_password_hash(rows[0]["hash"], OldPassword):
            flash("Your current password isn't correct", "error")
            return redirect("/change")

        NewPassword = generate_password_hash(request.form.get("Newpassword"))
        db.execute("UPDATE user SET hash = ? WHERE id = ?", NewPassword, session["user_id"])

        flash('Password updated', 'success')
        return redirect("/")

#loads the logged user's required and optional informations, with the phone split into prefix and number
def load_profile(user_id):
    informations = dict(db.execute("SELECT * FROM user WHERE id = ?", user_id)[0])
    optional_informations = dict(db.execute("SELECT * FROM user_optional WHERE id = ?", user_id)[0])

    phone_string = optional_informations.pop("number")
    if phone_string:
        optional_informations["prefix"], optional_informations["phone_number"] = split_phonenumber(phone_string)
    else:
        optional_informations["prefix"] = None
        optional_informations["phone_number"] = None
    return informations, optional_informations

#route for showing all the informatins of an account when a user click on the /account link
@app.route("/account", methods=["GET"])
@login_required
def account():
    informations, optional_informations = load_profile(session["user_id"])

    optional_keys = ["photo", "phone_number", "nation", "city", "description", "gender"]
    missing = [key for key in optional_keys if not optional_informations.get(key)]
    completeness = round(100 * (len(optional_keys) - len(missing)) / len(optional_keys))

    return render_template(
        "account.html",
        informations=informations,
        optional_informations=optional_informations,
        photo_url=avatar_url(optional_informations.get("photo")),
        user_initials=initials(informations["FirstName"], informations["LastName"], informations["username"]),
        friends_count=len(get_friends(session["user_id"])),
        missing=missing,
        completeness=completeness,
    )

#app route for deleting some optional user informations
@app.route("/delete_information", methods=["POST"])
@login_required
def del_informations():
    campo = request.form.get("field")
    labels = {"photo": "Profile photo", "phone_number": "Phone number", "nation": "Country and city",
              "city": "City", "description": "Bio", "gender": "Gender"}
    if campo not in labels:
        flash("That field can't be removed", "error")
        return redirect("/account")

    if campo == 'photo':
        photo = db.execute("SELECT photo FROM user_optional WHERE id = ?", session["user_id"])[0]["photo"]
        delete_profile_photo(photo)
        db.execute("UPDATE user_optional SET photo = NULL WHERE id = ?", session["user_id"])
    elif campo == 'phone_number':
        db.execute("UPDATE user_optional SET number = NULL WHERE id = ?", session["user_id"])
    elif campo == 'nation':
        db.execute("UPDATE user_optional SET nation = NULL, city = NULL WHERE id = ?", session["user_id"])
    else:
        db.execute("UPDATE user_optional SET ? = NULL WHERE id = ?", campo, session["user_id"])

    flash(f"{labels[campo]} removed", "success")
    return redirect(request.form.get("next") or "/account")


#app route for changing the user informations, or adding new ones
@app.route("/change_informations", methods=["GET", "POST"])
@login_required
def informations():
    user_id = session["user_id"]
    informations, optional_informations = load_profile(user_id)

    def render(form=None, errors=None, status=200):
        return render_template(
            "informations.html",
            informations=informations,
            optional_informations=optional_informations,
            photo_url=avatar_url(optional_informations.get("photo")),
            user_initials=initials(informations["FirstName"], informations["LastName"], informations["username"]),
            form=form or {},
            errors=errors or {},
        ), status

    if request.method == "GET":
        return render()

    form = request.form

    #re-render the form keeping what the user typed and showing the message next to the wrong field
    def fail(field, message):
        flash("Please fix the highlighted field", "error")
        return render(form, {field: message}, 400)

    # Form validation
    required_fields = {
        "username": "a username",
        "FirstName": "your first name",
        "LastName": "your last name",
        "birthday": "your birthday",
        "email": "your email"
    }
    for field, name in required_fields.items():
        if not form.get(field, "").strip():
            return fail(field, f"Please enter {name}")

    Newusername = form.get("username").strip()
    #Ensure username is not composed of special characters
    if not re.fullmatch(r'[A-Za-z0-9_-]{3,30}', Newusername):
        return fail("username", "Use 3–30 letters, numbers, hyphens or underscores")

    # Validate specific field formats
    if not form.get("FirstName").strip().isalpha():
        return fail("FirstName", "Use letters only")
    if not form.get("LastName").strip().isalpha():
        return fail("LastName", "Use letters only")

    #Ensure username is not already in the database
    if db.execute("SELECT 1 FROM user WHERE username = ? AND id != ?", Newusername, user_id):
        return fail("username", "This username is already taken — try another one")

    Newemail = form.get("email").strip()
    result = email_check(Newemail)
    if result != 1:
        return fail("email", result)

    #Ensure email is not already in the database
    if db.execute("SELECT 1 FROM user WHERE email = ? AND id != ?", Newemail, user_id):
        return fail("email", "Another account already uses this email")

    Newbirthday = form.get("birthday").strip()
    result = birthday_check(Newbirthday)
    if result != 1:
        return fail("birthday", result)

    FirstName = form.get("FirstName").strip().lower().capitalize()
    LastName = form.get("LastName").strip().lower().capitalize()

    #optional fields: an empty field is stored as None
    good_fields = {"username": Newusername}

    Nation = form.get("nation", "").strip().lower()
    if Nation and nation_check(Nation) != 1:
        return fail("nation", "Pick a country from the suggestions")
    good_fields["nation"] = Nation or None

    City = form.get("city", "").strip().lower()
    if City:
        if not Nation:
            return fail("city", "Choose a country first, then your city")
        if city_check(City, Nation) != 1:
            return fail("city", f"Pick a city in {Nation.title()} from the suggestions")
    good_fields["city"] = City or None

    Number = form.get("phone_number", "").strip()
    if Number:
        Prefix = form.get("prefix", "").strip()
        if not Prefix:
            return fail("prefix", "Add the country prefix for your number (e.g. +39)")
        Number = Prefix + " " + Number.replace('-', ' ')
        result = number_check(Number, session)
        if result != 1:
            return fail("phone_number", result)
    good_fields["number"] = Number or None

    Description = form.get("description", "").strip()
    if len(Description) > 500:
        return fail("description", f"Your bio is {len(Description)} characters — the limit is 500")
    good_fields["description"] = Description or None

    Gender = form.get("gender", "").strip()
    if Gender and Gender not in ("Male", "Female", "Other"):
        return fail("gender", "Choose one of the options in the list")
    good_fields["gender"] = Gender or None

    #the photo is replaced only when a new one is uploaded, and removed only when explicitly asked
    old_photo = optional_informations.get("photo")
    photo = request.files.get("photo")
    if photo and photo.filename:
        result = validate_profile_photo(photo)
        if result:
            return fail("photo", result)
        good_fields["photo"] = save_profile_photo(photo)
        delete_profile_photo(old_photo)
    elif form.get("remove_photo") == "1":
        good_fields["photo"] = None
        delete_profile_photo(old_photo)

    for database_name, value in good_fields.items():
        db.execute("UPDATE user_optional SET ? = ? WHERE id = ?", database_name, value, user_id)

    db.execute("UPDATE user SET username = ?, FirstName = ?, LastName = ?, birthday = ?, email = ? WHERE id = ?", Newusername, FirstName, LastName, Newbirthday, Newemail, user_id)

    flash("Profile updated", "success")
    return redirect("/account")

"""

PASSWORD RESET AREA

"""
import uuid #library to generate unique tokens

BASE_URL = "https://here-or31.onrender.com/reset_password"
def generateLink():
    token = str(uuid.uuid4())
    unique_link = f"{BASE_URL}/{token}"

    return unique_link

@app.route('/password', methods=['POST'])
def password():
    link = generateLink()
    email = request.form.get("Email")

    try:
        check = db.execute("SELECT * FROM user WHERE email = ?", email)[0]
    except IndexError:
        flash("We couldn't find an account with that email", "error")
        return redirect("/login")

    user_id = check["id"]

    token = link.split("password/")
    db.execute("INSERT INTO passwordLinks (token, user_id) VALUES (?,?)", token[1], user_id)

    username = check["username"]
    try:
        # Create email message
        msg = Message(
            subject="Reset password",
            recipients=[email],
            body=f"This is the plain text fallback for email clients that don't support HTML, hi {username}, paste this URL in the search bar to reset the password {link}",
            html=f"""
                    <h1>PASSWORD RESET</h1>
                    <p>Hi {username}, follow this link to reset the password: <a href={link}>Reset page </a> </p>
                 """
        )

        # Send the email
        mail.send(msg)
        flash("Check your inbox — we've sent you a reset link", "success")
        return redirect("/login")

    except Exception as e:
        print(e)
        flash("We couldn't send the email right now — please try again later", "error")
        return redirect("/login")

#app route for the link that is send when the user try to retrieve is password
@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if request.method == 'POST':
        link = db.execute("SELECT * FROM passwordLinks WHERE token = ?", token)[0]
        email = db.execute("SELECT * FROM user WHERE id = ?", link["user_id"])[0]["email"]

        password1 = request.form.get("password1").strip()
        password2 = request.form.get("password2").strip()

        if not password1 or not password2:
            flash("Please fill in both password fields", "error")
            db.execute("UPDATE passwordLinks SET is_used = FALSE WHERE token = ?", token)
            return redirect(f"/reset_password/{token}")

        if password1 != password2:
            flash("The two passwords don't match", "error")
            db.execute("UPDATE passwordLinks SET is_used = FALSE WHERE token = ?", token)
            return redirect(f"/reset_password/{token}")

        result = password_check(password1)
        if result != 1:
            flash(result, "error")
            db.execute("UPDATE passwordLinks SET is_used = FALSE WHERE token = ?", token)
            return redirect(f"/reset_password/{token}")
        password1 = generate_password_hash(password1)

        # Update user's password in the database
        db.execute("UPDATE user SET hash = ? WHERE email = ?", password1, email)
        flash('Your password has been updated!', 'success')
        return redirect("/login")

    link = db.execute("SELECT * FROM passwordLinks WHERE token = ?", token)[0]

    timestamp = datetime.strptime(link["expiration"], '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)  # Make timestamp aware
    current_time = datetime.now(timezone.utc)
    interval = current_time - timestamp
    if interval > timedelta(minutes=5):
        flash("This reset link has expired — request a new one", "error")
        return redirect("/login")

    if link["is_used"] == 1:
        flash("This reset link was already used — request a new one", "error")
        return redirect("/login")

    db.execute("UPDATE passwordLinks SET is_used = TRUE WHERE token = ?", token)
    email = db.execute("SELECT * FROM user WHERE id = ?", link["user_id"])[0]["email"]

    return render_template('password.html', token=token)

"""

END PASSWORD RESET AREA

"""


#app.py route for displaying the friends page and to add new friends
@app.route("/friends", methods=["GET", "POST"])
@login_required
def friends():
    if request.method == "GET":
        friends = get_friends(session["user_id"])
        for friend in friends:
            friend["avatar"] = avatar_url(friend["photo"])
            friend["initials"] = initials(friend["FirstName"], friend["LastName"], friend["username"])
            friend["shared_events"] = db.execute(
                "SELECT COUNT(*) AS n FROM eventsConnections a JOIN eventsConnections b ON a.event_id = b.event_id WHERE a.user = ? AND b.user = ?",
                session["user_id"], friend["id"]
            )[0]["n"]
        my_token = db.execute("SELECT conn_token FROM user WHERE id = ?", session["user_id"])[0]["conn_token"]
        return render_template("friends.html", friends=friends, my_token=my_token)

    token = request.form.get("token", "").strip()
    if not token:
        flash("Paste your friend's connection token to add them", "error")
        return redirect("/friends")

    rows = db.execute("SELECT * FROM user WHERE conn_token = ?", token)
    if not rows:
        flash("No one has this token — double-check it and try again", "error")
        return redirect("/friends")
    user = rows[0]

    if user["id"] == session['user_id']:
        flash("That's your own token — share it with friends so they can add you", "info")
        return redirect("/friends")

    rows = db.execute(
        "SELECT * FROM connections WHERE (id1 = ? AND id2 = ?) OR (id1 = ? AND id2 = ?)",
        user["id"], session['user_id'], session['user_id'], user["id"]
    )
    if len(rows) > 0:
        flash(f"You and {user['username']} are already friends", "info")
        return redirect("/friends")

    db.execute("INSERT INTO connections (id1, id2) VALUES(?, ?)", session['user_id'], user["id"])
    flash(f"{user['FirstName'] or user['username']} is now your friend!", "success")
    return redirect("/friends")

#app.py route for eliminating a friendship
@app.route("/destroy", methods=["POST"])
@login_required
def destroy():
    username = request.form.get("username")
    rows = db.execute("SELECT * FROM user WHERE username = ?", username)
    if rows:
        id_user = rows[0]['id']
        db.execute("DELETE FROM connections WHERE (id1 = ? AND id2 = ?) OR (id1 = ? AND id2 = ?)", id_user, session['user_id'], session['user_id'], id_user)
        flash(f"{username} removed from your friends", "success")
    return redirect("/friends")

@app.route("/delete", methods=["POST"])
@login_required
def delete_user():
    photo_profile = db.execute("SELECT * FROM user_optional WHERE id = ?", session['user_id'])[0]['photo']
    db.execute("DELETE FROM user WHERE (id = ?)", session['user_id'])
    db.execute("DELETE FROM user_optional WHERE (id = ?)", session['user_id'])
    db.execute("DELETE FROM connections WHERE (id1 = ?) OR (id2 = ?)", session['user_id'], session['user_id'])


    delete_profile_photo(photo_profile)

    session.clear()
    flash("Your account has been deleted", "info")
    return redirect("/login")

@app.route('/addEvent', methods=['POST'])
@login_required
def load_data():
    data = request.form # Getting form data

    rows = db.execute("SELECT * FROM eventsPrincipal WHERE id = ?", data.get('eventId', ""))
    if len(rows) > 0:
        photos = db.execute("SELECT * FROM eventsPhotos where event_id = ?", data.get('eventId', ""))
        for photo in photos:
            filename = photo['photo_path']
            path = os.path.join(BASE_DIR, os.path.join('static', 'events_images', filename))
            os.remove(path)

        db.execute("DELETE FROM eventsPrincipal WHERE id = ?", data.get('eventId', ""))
        db.execute("DELETE FROM eventsPhotos WHERE event_id = ?", data.get('eventId', ""))
        db.execute("DELETE FROM eventsLinks WHERE event_id = ?", data.get('eventId', ""))
        db.execute("DELETE FROM eventsConnections WHERE event_id = ?", data.get('eventId', ""))

    title = data.get('eventTitle', "")
    #title validation
    if not title:
        message = "The event must have a title"
        return jsonify({
            "success": False,
            "redirect": "/",
            "message": message
        }), 400

    event_id = data.get('eventId', "")
    #id validation
    if not title:
        message = ""
        return jsonify({
            "success": False,
            "redirect": "/",
            "message": message
        }), 400

    color = data.get('eventColor', "")
    #color validation
    hex_color_regex = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    if not bool(hex_color_regex.match(color)):
        message = "Invalid color format"
        return jsonify({
            "success": False,
            "redirect": "/",
            "message": message
        }), 400


    notes = data.get('eventText', "")
    #notes validation
    if not title:
        message = "THIS IS A FLASH MESSAGE"
        return jsonify({
            "success": False,
            "redirect": "/",
            "message": message
        }), 400

    time_slot = f"{data.get('start')}/{data.get('end')}"  # Example format, adjust as necessary
    #time_slot validation
    if not title:
        message = ""
        return jsonify({
            "success": False,
            "redirect": "/",
            "message": message
        }), 400

    tag = data.get('eventTags', "")
    #tag validation
    if not title:
        message = ""
        return jsonify({
            "success": False,
            "redirect": "/",
            "message": message
        }), 400

    # Handle photos if any
    photos = request.form.getlist("hiddenPhoto", None)
    images_base64 = {}
    images_mimetype = {}
    counter = 0
    for photo in photos:
        print(f"Processing photo")
        if photo.startswith('data:image'):
            base64_image = photo.split(",")[1]
            print(f"Base64 image data: {base64_image[:30]}...")  # Print first 30 characters for debug

            mime_type_match = re.match(r'data:(.*?);base64,', photo)
            if mime_type_match:
                mimetype = mime_type_match.group(1)
                print(f"MIME type: {mimetype}")

            # Remove the 'image/' prefix
            if mimetype.startswith('image/'):
                mimetype = mimetype.split('/')[1]

            if mimetype not in ['jpeg', 'png', 'heic']:
                message = "Invalid file type detected"
                return jsonify({
                    "success": False,
                    "redirect": "/",
                    "message": message
                }), 400

        try:
            # Decode the image
            image_data = base64.b64decode(base64_image)
            images_base64[counter] = image_data
            images_mimetype[counter] = mimetype
            counter += 1
            print(f"Image {counter} processed successfully")
        except Exception as e:
            message = f"Error decoding image: {str(e)}"
            return jsonify({
                "success": False,
                "redirect": "/",
                "message": message
            }), 400

    # Handle links if any
    links = request.form.getlist('hiddenLink')  # Get all links
    #links validation
    for link_path in links:
        if not title:
            message = ""
            return jsonify({
                "success": False,
                "redirect": "/",
                "message": message
            }), 400

    # Handle friends if any
    friends = request.form.getlist('hiddenFriend')  # Get all friends
    for friend in friends:
        #friend validation
            friend_id = db.execute("SELECT id FROM user WHERE username = ?", friend)[0]["id"]
            rows1 = db.execute("SELECT * FROM connections WHERE id1 = ? AND id2 = ?", session['user_id'], friend_id)
            rows2 = db.execute("SELECT * FROM connections WHERE id1 = ? AND id2 = ?", friend_id, session['user_id'])
            if not rows1 and not rows2:
                message = f"This user ({friend}) is not your friend"
                return jsonify({
                    "success": False,
                    "redirect": "/",
                    "message": message
                }), 400

    # Insert event details into eventsPrincipal
    db.execute("INSERT INTO eventsPrincipal (id, title, color, notes, time_slot, tag) VALUES (?, ?, ?, ?, ?, ?)",
               event_id, title, color, notes, time_slot, tag)

    photo_paths = []
    for index, photo in images_base64.items():
        filename = generate_unique_filename(images_mimetype[index])
        photo_paths.append(filename)
        path = os.path.join(BASE_DIR, os.path.join("static", "events_images", filename))
        with open(path, "wb") as f:
            f.write(photo)

        db.execute("INSERT INTO eventsPhotos (event_id, photo_path) VALUES (?, ?)", event_id, filename)

    for link_path in links:
        db.execute("INSERT INTO eventsLinks (event_id, links_path) VALUES (?, ?)", event_id, link_path)

    for friend in friends:
        user_id = db.execute("SELECT id FROM user WHERE username = ?", friend)[0]['id']
        print(f"Adding friend {friend} with ID {user_id} to event {event_id}")
        db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", event_id, user_id)

    #insert also in the connections the creator of the event
    print(f"Adding creator {session['user_id']} to event {event_id}")
    db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", event_id, session["user_id"])

    print("photo_paths: ", photo_paths)
    return jsonify({"message": "Data received and stored", "data": data, "photos": photo_paths})

# Define an endpoint to handle the deleteEvent of the calendar POST request
@app.route('/deleteEvent', methods=['POST'])
@login_required
def remove_data():
    data = request.get_json()  # Getting form data
    event_id = data

    photos = db.execute("SELECT * FROM eventsPhotos where event_id = ?", event_id)
    for photo in photos:
        filename = photo['photo_path']
        path = os.path.join(BASE_DIR, os.path.join('static', 'events_images', filename))
        os.remove(path)

    # Delete event details from eventsPrincipal
    db.execute("DELETE FROM eventsPrincipal WHERE id = ?", event_id)

    return jsonify({"message": "Event successfully cancelled!", "data": data})

@app.route('/getEvents', methods=['GET'])
@login_required
def get_events():
    events = db.execute("SELECT * FROM eventsPrincipal WHERE id IN (SELECT event_id FROM eventsConnections WHERE user = ?)", session["user_id"])
    formatted_events = []

    if events:
        for event in events:
            photos =  db.execute("SELECT * FROM eventsPhotos WHERE event_id = ?", event['id'])
            photo_paths = [photo['photo_path'] for photo in photos]
            data_urls = []
            path = os.path.join(BASE_DIR, os.path.join('static', 'events_images'))
            for filename in os.listdir(path):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')) and filename in photo_paths:  # Add other formats as needed
                    file_path = os.path.join('static', 'events_images', filename)
                    data_urls.append(file_path)

            friends = []
            friends_ids = db.execute("SELECT * FROM eventsConnections WHERE event_id = ?", event['id'])
            for friend_id in friends_ids:
                if friend_id['user'] == session["user_id"]:
                    continue
                friend = db.execute("SELECT * FROM user WHERE id = ?", friend_id['user'])[0]['username']
                friends.append(friend)

            links = []
            links_path = db.execute("SELECT * FROM eventsLinks WHERE event_id = ?", event['id'])
            for link_path in links_path:
                links.append(link_path['links_path'])
            time_slot = db.execute("SELECT * FROM eventsPrincipal WHERE id = ?", event['id'])[0]['time_slot']

            start, end = time_slot.split('/')

            formatted_events.append({
                'id': event['id'],
                'title': event['title'],
                'start': start,
                'end': end,
                'color': event['color'],
                'extendedProps': {
                    'text': event['notes'],
                    'tags': event['tag'],
                    'photos': data_urls,
                    'friends': friends,
                    'links': links
                }
            })

    return jsonify(formatted_events)


@app.route('/getFriendProfile', methods=['POST', 'GET'])
@login_required
def sendProfile():
    name = request.get_json()

    friend = db.execute("SELECT * FROM user WHERE username = ?", name['friendName'])[0]
    del friend['hash']
    del friend['conn_token']

    friend_optionals = db.execute("SELECT * FROM user_optional WHERE username = ?", name['friendName'])[0]

    friend_info = {**friend, **friend_optionals}

    return jsonify(friend_info)

@app.route('/getBase64', methods=['POST', 'GET'])
@login_required
def getBase64():
    image_path = request.get_json()

    # Extract path from /static/ onwards from URL
    if image_path.startswith('http'):
        static_index = image_path.find('static/')
        if static_index != -1:
            image_path = image_path[static_index:]


    images = db.execute("SELECT * FROM eventsPhotos")
    for image in images:
        image = 'static/events_images/' + image['photo_path']
        if image == image_path:
            path = os.path.join(BASE_DIR, image)
            with open(path, 'rb') as f:
                image_type = mimetypes.guess_type(path)[0] or "image/jpeg"
                image_data = f.read()
                base64_image = base64.b64encode(image_data).decode('utf-8')
                base64_image = f"data:{image_type};base64,{base64_image}"

    return jsonify({"base64": base64_image})

"""
TEMPLATE FOR AN APP.ROUTE

@app.route('/MEMO', methods=['POST', 'GET'])
@login_required
def MEMO():
"""