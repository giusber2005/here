
#library to work with regular expression (useful in the registration and profile edit pages)
import re

#library to work with the operating system, including file and directory operations(useful in particular with the manipulation and the storage of images)
import os

#library useful to work with time, in particular in the login page with the current time the user has tried to log in
import time

#function to calculate a period of time (useful in the session expiration time)
from datetime import timedelta, datetime

#library to work with databases
from cs50 import SQL

#libraries to connect the application with templates and to persist data between templates with session
from flask import Flask, flash, redirect, render_template, request, session, send_from_directory, url_for, jsonify
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

#some functions to weight down the code in app.py
from helpers import *

# Configure application
app = Flask(__name__)
app.secret_key = "5&_~H$=O4<{^O6y"

"""
Configuring the environment for the system of sending email to the user
"""
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

email_password = "J5F6RYcAkCQj29PZ"

# Configuration for Flask-Mail
app.config['MAIL_SERVER'] = 'smtp-relay.brevo.com'  # Your email server
app.config['MAIL_PORT'] = 587  # Port number (usually 587 for TLS)
app.config['MAIL_USE_TLS'] = True  # Use TLS
app.config['MAIL_USE_SSL'] = False  # Do not use SSL
app.config['MAIL_USERNAME'] = '7c2d17001@smtp-brevo.com'  # Your email address
app.config['MAIL_PASSWORD'] = email_password # Your email password
app.config['MAIL_DEFAULT_SENDER'] = 'hereforhelp888@gmail.com'  # Default sender email address

mail = Mail(app)


#Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///database.db")

# set session to expire after 30 minutes of inactivity
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

"""
Initializing some app.routes in order for retrieving the files in the /data folder
"""
#app.route to make the common.txt file utilizable
@app.route('/data/common.txt')
def get_common_passwords():
    return send_from_directory('data', 'common.txt')

#app.route to make the worldcities.csv file utilizable
@app.route('/data/worldcities.csv')
def get_cities_and_nations():
    return send_from_directory('data', 'worldcities.csv')

#app.route to make the nations_and_prefixes.csv file utilizable
@app.route('/data/nations_and_prefixes.csv')
def get_nations_and_prefixes():
    return send_from_directory('data', 'nations_and_prefixes.csv')

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
@app.route("/")
@login_required
def index():

    friendsId = []
    friends1 = db.execute("SELECT * FROM connections WHERE id1 = ?", session["user_id"])
    for friend in friends1:
        friendsId.append(friend["id2"])
    friends2 = db.execute("SELECT * FROM connections WHERE id2 = ?", session["user_id"])
    for friend in friends2:
        friendsId.append(friend["id1"])
    
    friends = []
    for friend in friendsId:
         friends.append(db.execute("SELECT * FROM user WHERE id = ?", friend)[0]["username"])
    
    friends_dict = dict(zip(friendsId, friends))     
    
    return render_template("homepage.html", friends_dict=friends_dict)

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
            flash("too many access attempts denied, wait 5 minutes")
            return redirect("/login")

        # Ensure username was submitted
        if not request.form.get("username"):
            flash("must provide username")
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
            flash("must provide password")
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
            flash("invalid username and/or password")
            success = "denied"
            current_time = time.time()
            if current_time - CURRENT_BLOCK >= 300:
                print(current_time)
                print(CURRENT_BLOCK)
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

        # Redirect user to home page
        flash("logged in")
        ip = request.remote_addr
        success = "denied"
        db.execute("DELETE FROM login_attempt WHERE user_ip = ? AND success = ?", ip, success)
        db.execute("DELETE FROM user_blocks WHERE user_ip = ?", ip)
        success = "permitted"
        db.execute("INSERT INTO login_attempt (user_ip, success) VALUES (?, ?)", ip, success)
        return redirect("/")

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
    flash("logged out")
    return redirect("/login")

#route for register an user
@app.route("/register", methods=["GET", "POST"])
def register():
    #if the user click the link in the homepage
     if request.method == "GET":
         return render_template("registration.html")
     #validation and insertion in the database of all the informations
     else:
        # Form validation
        required_fields = {
            "Newusername": "username",
            "Newpassword": "password",
            "FirstName": "first name",
            "LastName": "last name",
            "Newbirthday": "birthday",
            "Newemail": "email"
        }
        #ensure that all the required_fields are not empty
        for field, name in required_fields.items():
            if not request.form.get(field):
                message = f"must provide {name}"
                flash(message)
                return render_template("registration.html")

        #Ensure username is not composed of special characters
        if not re.fullmatch(r'[A-Za-z0-9_-]+', request.form.get("Newusername").strip()):
            message = "the username cannot have special characters, only hyphens and underscores are allowed"
            flash(message)
            return render_template("registration.html")

        #Ensure username is not already in the database
        username_check = db.execute("SELECT * FROM user WHERE username = (?)", request.form.get("Newusername").strip())
        if username_check:
            message = "username already registered"
            flash(message)
            return render_template("registration.html")

        #Ensure password is composed of more than 8 alphanumerical characters
        passwordcheck = request.form.get("Newpassword").strip()
        result = password_check(passwordcheck)
        if result != 1:
            flash(result)
            return render_template("registration.html")

        #check if the birthday is in a correct format
        birthdaycheck = request.form.get("Newbirthday").strip()
        result = birthday_check(birthdaycheck)
        if result != 1:
            flash(result)
            return render_template("registration.html")

        #check if the email is in the correct format
        emailcheck = request.form.get("Newemail").strip()
        result = email_check(emailcheck)
        if result != 1:
            flash(result)
            return render_template("registration.html")

        #Ensure email is not already in the database
        email_checking = db.execute("SELECT * FROM user WHERE email = (?)", emailcheck)
        if email_checking:
            message = "email already registered!"
            flash(message)
            return render_template("registration.html")

        #Validate First and last name to be only names
        if not request.form.get("FirstName").strip().isalpha():
            message = "provide an appropriate first name"
            flash(message)
            return render_template("registration.html")
        if not request.form.get("LastName").strip().isalpha():
            message = "provide an appropriate last name"
            flash(message)
            return render_template("registration.html")

        #variables of all the database requested fields
        Newusername = request.form.get("Newusername").strip()
        NewPassword = generate_password_hash(request.form.get("Newpassword"))
        Newbirthday = request.form.get("Newbirthday").strip()
        Newemail = request.form.get("Newemail").strip()
        FirstName = request.form.get("FirstName").strip().lower().capitalize()
        LastName = request.form.get("LastName").strip().lower().capitalize()
        Token = secrets.token_urlsafe()

        #initializing some values for the optional fields management
        good_fields = dict()
        photo = None
        filename = None

        optional_fields = {
            "NewNumber": "number",
            "NewNation": "nation",
            "NewCity": "city",
            "NewDescription": "description",
            "NewPhoto": "photo",
            "NewGender": "gender"
        }
        for field, db_name in optional_fields.items():
            #validate the photo user input
            if field == "NewPhoto":
                #take the photo file from the form
                photo = request.files.get('NewPhoto', None)
                #if the photo has been loaded
                if photo:
                    #if the photo file type is one of the requested
                    if photo.mimetype not in ['image/jpeg', 'image/png', 'image/heic']:
                        message = "Invalid file type detected"
                        flash(message)
                        return render_template("registration.html")
                    #sanitize the file to avoid traverse directories attack or problems with white spaces and not allowed characters
                    filename = secure_filename(photo.filename)
                else:
                    photo = None
                good_fields["photo"] = filename

            elif not request.form.get(field):
                #if the form of this specific field is empty, the value in the database will be None
                x = None
            else:
                x = request.form.get(field).strip()

                if field == "NewNation":
                    #create validation for the nation (check against list)
                    Nation = x.lower()
                    result = nation_check(Nation)
                    if result != 1:
                        flash(result)
                        return render_template("registration.html")

                if field == "NewCity":
                    #create validation for the city (check against list)
                    City = x.lower()
                    Nation = request.form.get("NewNation").lower()
                    if not Nation:
                        flash("Please select a nation to select a city")
                        return render_template("registration.html")
                    result = city_check(City, Nation)
                    if result != 1:
                        flash(result)
                        return render_template("registration.html")

                if field == "NewNumber":
                    #create validation for the number
                    x = x.replace('-', ' ')
                    Prefix = request.form.get("Prefix").strip()
                    if not Prefix:
                        flash("you need to select a prefix")
                        return render_template("registration.html")
                    Nation = request.form.get("NewNation").strip()
                    x = Prefix + " " + x
                    result = number_check(x, session)
                    if result != 1:
                        flash(result)
                        return render_template("registration.html")

                if field == "NewDescription":
                    #create validation for the description
                    if len(x) > 500:
                        message = "The description must be no longer than 500 characters"
                        flash(message)
                        return render_template("registration.html")

                if field == "NewGender":
                    #checking if the gender is one of the allowed
                    Gender = ("Male", "Female", "Other")
                    if x not in Gender:
                        if x != "":
                            message = "Select on of the appropriate genders"
                            flash(message)
                            return render_template("registration.html")

                good_fields[db_name] = x

        if photo != None:
            #saving the photo file in the folder for the photos
            photo.save(os.path.join('static/profile_images', filename))

        db.execute("INSERT INTO user_optional (username) VALUES (?)", Newusername)
        for database_name, value in good_fields.items():
            db.execute("UPDATE user_optional SET ? = ? WHERE username = ?", database_name, value, Newusername)
        db.execute("INSERT INTO user (username, FirstName, LastName, birthday, email, hash, conn_token) VALUES(?, ?, ?, ?, ?, ?, ?)", Newusername, FirstName, LastName, Newbirthday, Newemail, NewPassword, Token)

        flash('Registered')
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
            flash("must provide Oldpassword")
            return redirect("/change")
        # Ensure Newpassword was submitted
        elif not request.form.get("Newpassword"):
            flash("must provide Newpassword")
            return redirect("/change")

        #Ensure password is composed of more than 8 alphanumerical characters
        passwordcheck = request.form.get("Newpassword").strip()
        result = password_check(passwordcheck)
        if result != 1:
            flash(result)
            return redirect("/change")

        rows = db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])
        OldPassword = request.form.get("Oldpassword")
        if not check_password_hash(rows[0]["hash"], OldPassword):
            message = "old password is not correct"
            flash(message)
            return render_template("change.html")

        NewPassword = generate_password_hash(request.form.get("Newpassword"))
        db.execute("UPDATE user SET hash = ? WHERE id = ?", NewPassword, session["user_id"])

        flash('Password changed')
        return redirect("/")

#route for showing all the informatins of an account when a user click on the /account link
@app.route("/account", methods=["GET", "POST"])
@login_required
def account():
    if request.method == "GET":
        informations = dict(db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])[0])
        optional_informations = dict(db.execute("SELECT * FROM user_optional WHERE id = ?", session["user_id"])[0])

        phone_string = optional_informations["number"]
        if phone_string != None:
            del optional_informations["number"]
            optional_informations["prefix"], optional_informations["phone_number"] = split_phonenumber(phone_string)
        else:
            del optional_informations["number"]
            optional_informations["prefix"] = None
            optional_informations["phone_number"] = None

        counter = 0
        for key, value in optional_informations.items():
            if value == None:
                counter += 1

        return render_template("account.html", informations= informations, optional_informations=optional_informations, counter=counter)

#app route for deleting some optional user informations
@app.route("/delete_information", methods=["POST"])
@login_required
def del_informations():
            campo = request.form.get("field")
            if campo != None:
                if campo != "photo" and campo != "phone_number" and campo != "nation":
                    db.execute("UPDATE user_optional SET ? = ? WHERE id = ?", campo, None, session["user_id"])
                elif campo == 'photo':
                    photo = db.execute("SELECT * FROM user_optional WHERE id = ?", session["user_id"])[0][campo]
                    os.remove(f'static/profile_images/{photo}')
                    db.execute("UPDATE user_optional SET ? = ? WHERE id = ?", campo, None, session["user_id"])
                elif campo == 'phone_number':
                    db.execute("UPDATE user_optional SET number = ? WHERE id = ?", None, session["user_id"])
                elif campo == 'nation':
                    db.execute("UPDATE user_optional SET nation = ?, city = ? WHERE id = ?", None, None, session["user_id"])
            return redirect("/account")


#app route for changing the user informations, or adding new ones
@app.route("/change_informations", methods=["GET", "POST"])
@login_required
def informations():
    if request.method == "GET":
        informations = dict(db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])[0])
        optional_informations = dict(db.execute("SELECT * FROM user_optional WHERE id = ?", session["user_id"])[0])

        phone_string = optional_informations["number"]
        if phone_string != None:
            del optional_informations["number"]
            optional_informations["prefix"], optional_informations["phone_number"] = split_phonenumber(phone_string)
        else:
            del optional_informations["number"]
            optional_informations["prefix"] = None
            optional_informations["phone_number"] = None

        return render_template("informations.html", informations=informations.items(), optional_informations=optional_informations.items(), gender=optional_informations.get('gender'))
    else:
        informations = db.execute("SELECT * FROM user WHERE id = ?", session["user_id"])[0].items()
        optional_informations = db.execute("SELECT * FROM user_optional WHERE id = ?", session["user_id"])[0]


        # Form validation
        required_fields = {
            "username": "username",
            "FirstName": "first name",
            "LastName": "last name",
            "birthday": "birthday",
            "email": "email"
        }
        for field, name in required_fields.items():
            if not request.form.get(field):
                message = f"must provide {name}"
                flash(message)
                return redirect("/change_informations")

        #Ensure username is not composed of special characters
        if not re.fullmatch(r'[A-Za-z0-9_-]+', request.form.get("username").strip()):
            message = "the username cannot have special characters, only hyphens and underscores are allowed"
            flash(message)
            return redirect("/change_informations")

        # Validate specific field formats
        if not request.form.get("FirstName").strip().isalpha():
            message = "provide an appropriate first name"
            flash(message)
            return redirect("/change_informations")

        if not request.form.get("LastName").strip().isalpha():
            message = "provide an appropriate last name"
            flash(message)
            return redirect("/change_informations")

        #Ensure username is not already in the database
        username_check = db.execute("SELECT * FROM user WHERE username = (?) AND NOT id = (?)", request.form.get("username").strip(), session["user_id"])
        if username_check:
            message = "username already registered"
            flash(message)
            return redirect("/change_informations")

        #Ensure email is not already in the database
        email_checking = db.execute("SELECT * FROM user WHERE email = (?) AND NOT id = (?)", request.form.get("email").strip(), session["user_id"])
        if email_checking:
            message = "email already registered"
            flash(message)
            return redirect("/change_informations")

        result = email_check(request.form.get("email"))
        if result != 1:
            # Assuming the apology returns a tuple (error, status_code)
            flash(result)
            return redirect("/change_informations")

        result = birthday_check(request.form.get("birthday"))
        if result != 1:
            # Assuming the apology returns a tuple (error, status_code)
            flash(result)
            return redirect("/change_informations")

        Newusername = request.form.get("username").strip()
        Newbirthday = request.form.get("birthday").strip()
        Newemail = request.form.get("email").strip()
        FirstName = request.form.get("FirstName").strip().capitalize()
        LastName = request.form.get("LastName").strip().capitalize()

        #initializing some values for the optional fields management
        good_fields = dict()
        photo = None
        filename = None

        optional_fields = {
            "phone_number": "number",
            "prefix": "prefix",
            "nation": "nation",
            "city": "city",
            "description": "description",
            "photo": "photo",
            "gender": "gender"
        }
        for field, db_name in optional_fields.items():
            #validate the photo user input
            if field == "photo":
                photo = request.files.get("photo", None)
                if photo:
                    if photo.mimetype not in ['image/jpeg', 'image/png', 'image/heic']:
                        message = "Invalid file type detected"
                        flash(message)
                        return redirect("/change_informations")
                    filename = secure_filename(photo.filename)
                else:
                    filename = None
                if filename != None:
                    good_fields["photo"] = filename

            elif not request.form.get(field):
                #if the form of this specific field is empty, the value in the database will be None
                x = None
            else:
                x = request.form.get(field).strip()
                if field == "nation":
                    #create validation for the nation (check against list)
                    Nation = x.lower()
                    result = nation_check(Nation)
                    if result != 1:
                        # Assuming the apology returns a tuple (error, status_code)
                        flash(result)
                        return redirect("/change_informations")
                if field == "city":
                    #create validation for the city (check against list)
                    City = x.lower()
                    Nation = request.form.get("nation").lower()
                    result = city_check(City, Nation)
                    if result != 1:
                        # Assuming the apology returns a tuple (error, status_code)
                        flash(result)
                        return redirect("/change_informations")

                if field == "prefix":
                    continue

                if field == "phone_number":
                    #create validation for the number
                    x = x.replace('-', ' ')
                    Prefix = request.form.get("prefix").strip()
                    if not Prefix:
                        flash("you need to select a prefix")
                        return render_template("registration.html")
                    Nation = request.form.get("nation").strip()
                    x = Prefix + " " + x
                    result = number_check(x, session)
                    if result != 1:
                        # Assuming the apology returns a tuple (error, status_code)
                        flash(result)
                        return redirect("/change_informations")

                if field == "description":
                    #create validation for the description
                    if len(x) > 500:
                        message = "The description must be no longer than 500 characters"
                        flash(message)
                        return redirect("/change_informations")

                if field == "gender":
                    Gender = ("Male", "Female", "Other")
                    if x not in Gender:
                        if x != "":
                            message = "Select on of the appropriate genders"
                            flash(message)
                            return redirect("/change_informations")

                good_fields[db_name] = x

        if photo != None:
            if filename != None:
                photo.save(os.path.join('static/profile_images', filename))

        for database_name, value in good_fields.items():
            db.execute("UPDATE user_optional SET ? = ? WHERE username = ?", database_name, value, Newusername)

        db.execute("UPDATE user SET username = ?, FirstName = ?, LastName = ?, birthday = ?, email = ? WHERE id = ?", Newusername, FirstName, LastName, Newbirthday, Newemail, session["user_id"])


        return redirect("/account")

"""

PASSWORD RESET AREA

"""
import uuid #library to generate unique tokens

BASE_URL = "http://127.0.0.1:5000/reset_password"
def generateLink():
    token = str(uuid.uuid4())
    unique_link = f"{BASE_URL}?token={token}"
    
    return unique_link

@app.route('/password', methods=['POST'])
def password():
    link = generateLink()
    email = request.form.get("Email")
    
    try:
        check = db.execute("SELECT * FROM user WHERE email = ?", email)[0]
    except IndexError:
        flash("The email doesn't correspond to any user in the database")
        return redirect("/login")
            
    user_id = check["id"]
    db.execute("INSERT INTO passwordLinks (token, user_id) VALUES (?,?)", link, user_id)
    
    username = check["username"]
    try:
        # Create email message
        msg = Message(
            subject="Reset password",
            recipients=[email],
            body="This is the plain text fallback for email clients that don't support HTML.",
            html=f"""
                    <h1>PASSWORD RESET</h1>
                    <p>Hi {username}, follow this link to reset the password: <a href={link}>Reset page </a> </p>
                 """
        )
        
        # Send the email
        mail.send(msg)
        flash("Email sent successfully!")
        return redirect("/login")
    
    except Exception as e:
        flash("Error into sending the email")
        return redirect("/login")        
    
#app route for the link that is send when the user try to retrieve is password
@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    link = db.execute("SELECT * FROM passwordLinks WHERE token = ?", token)[0]
    
    timestamp = datetime.strptime(link["expiration"], '%Y-%m-%d %H:%M:%S')
    current_time = datetime.now()
    interval = current_time - timestamp    
    if interval > timedelta(minutes=5):
        flash("The selected link is expired")
        return redirect("/login")
        
    if link["is_used"] == True:
        flash("The selected link has been already used")
        return redirect("/login")
    
    db.execute("UPDATE passwordLinks SET is_used = TRUE WHERE token = ?", token)
    email = db.execute("SELECT * FROM user WHERE id = ?", link["user_id"])[0]["email"]
    if request.method == 'POST':
        password1 = request.form.get("password1").strip()
        password2 = request.form.get("password2").strip()

        if not password1 or not password2:
            flash("you need to fill all the fields")
            db.execute("UPDATE passwordLinks SET is_used = FALSE WHERE token = ?", token)
            return redirect(f"/reset_password/{token}")

        if password1 != password2:            
            flash("you need to repeat the exact same password twice")
            db.execute("UPDATE passwordLinks SET is_used = FALSE WHERE token = ?", token)
            return redirect(f"/reset_password/{token}")

        password1 = generate_password_hash(password1)

        # Update user's password in the database
        db.execute("UPDATE user SET hash = ? WHERE email = ?", password1, email)
        flash('Your password has been updated!', 'success')
        return redirect("/login")

    return render_template('password.html')

"""

END PASSWORD RESET AREA 

"""


#app.py route for displaying the friends page and to add new friends
@app.route("/friends", methods=["GET", "POST"])
@login_required
def friends():
    if request.method == "GET":
        table = []
        counter = 0
        informations = db.execute("SELECT * FROM connections WHERE id1 = ?" , session['user_id'])
        for value in informations:
            connection =  {
                'counter': counter,
                'timestamp': value['timestamp'],
                'username': db.execute("SELECT username FROM user WHERE id = ?", value['id2'])[0]['username']
            }
            table.append(connection)
            counter += 1

        informations = db.execute("SELECT * FROM connections WHERE id2 = ?", session['user_id'])
        for value in informations:
            connection = {
                'counter': counter,
                'timestamp': value['timestamp'],
                'username': db.execute("SELECT username FROM user WHERE id = ?", value['id1'])[0]['username']
            }
            table.append(connection)
            counter += 1

        return render_template("friends.html", table=table)
    else:
        if not request.form.get("token"):
            message = "please provide a token"
            flash(message)
            return redirect("/friends")

        token = request.form.get("token")

        try:
            user = db.execute("SELECT * FROM user WHERE conn_token = ?", token)[0]
        except IndexError:
            message = "There are no user with this token"
            flash(message)
            return redirect("/friends")

        if user["id"] == session['user_id']:
            message = "You can't insert your own token"
            flash(message)
            return redirect("/friends")

        rows = db.execute(
            "SELECT * FROM connections WHERE (id1 = ? AND id2 = ?) OR (id1 = ? AND id2 = ?)",
            user["id"], session['user_id'], session['user_id'], user["id"]
        )

        if len(rows) > 0:
            message = "You and this user are already friend"
            flash(message)
            return redirect("/friends")

        db.execute("INSERT INTO connections (id1, id2) VALUES(?, ?)", session['user_id'], user["id"])
        flash("new friend added!!")
        return redirect("/friends")

#app.py route for eliminating a friendship
@app.route("/destroy", methods=["POST"])
@login_required
def destroy():
    username = request.form.get("username")
    id = db.execute("SELECT * FROM user WHERE username = ?", username)[0]['id']
    print(f"{id} ciao")
    db.execute("DELETE FROM connections WHERE (id1 = ? AND id2 = ?) OR (id1 = ? AND id2 = ?)", id, session['user_id'], session['user_id'], id)
    return redirect("/friends")

@app.route("/delete", methods=["POST"])
@login_required
def delete_user():
    photo_profile = db.execute("SELECT * FROM user_optional WHERE id = ?", session['user_id'])[0]['photo']
    db.execute("DELETE FROM user WHERE (id = ?)", session['user_id'])
    db.execute("DELETE FROM user_optional WHERE (id = ?)", session['user_id'])
    db.execute("DELETE FROM connections WHERE (id1 = ?) OR (id2 = ?)", session['user_id'], session['user_id'])


    # Define the path to the photo
    file_path = f"static/profile_images/{photo_profile}"

    # Check if the file exists
    if os.path.exists(file_path):
        # Delete the file
        os.remove(file_path)
        print(f"File {file_path} has been deleted.")
    else:
        print(f"File {file_path} does not exist.")

    session.clear()
    return redirect("/login")

@app.route('/addEvent', methods=['POST'])
@login_required
def load_data():
    data = request.form # Getting form data
    
    for key, value in data.items():
        print(f"{key}: {value}")
                
    title = data.get('eventTitle', "")
    #title validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    event_id = data.get('eventId', "") 
    #id validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    color = data.get('eventColor', "")
    #color validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    notes = data.get('eventText', "")
    #notes validation
    if not title:
        message = ""
        flash(message)
        redirect("/")
        
    time_slot = f"{data.get('start')}/{data.get('end')}"  # Example format, adjust as necessary
    #time_slot validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    tag = data.get('eventTags', "")
    #tag validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    # Handle photos if any
    photos = request.files.getlist("hiddenPhoto", None)
    images_base64 = {}
    images_mimetype = {}
    counter = 0
    for photo in photos:
        if photo.startswith('data:image'):
            base64_image = photo.split(",")[1]
            
            mime_type_match = re.match(r'data:(.*?);base64,', base64_image)
            if mime_type_match:
                mimetype = mime_type_match.group(1)

            if mimetype not in ['image/jpeg', 'image/png', 'image/heic']:
                message = "Invalid file type detected"
                flash(message)
                return redirect("/")
            
            # Decode the image
            image_data = base64.b64decode(base64_image)
            images_base64[counter] = image_data 
            images_mimetype[counter] = mimetype 
            counter += 1
              
    # Handle links if any
    links = request.form.getlist('hiddenLink')  # Get all links
    #links validation
    for link_path in links:  
        if not title:
            message = ""
            flash(message)
            redirect("/")
    
    # Handle friends if any
    friends = request.form.getlist('hiddenFriend')  # Get all friends
    for friend in friends:
        #tag validation
        if not title:
            message = ""
            flash(message)
            redirect("/")
            
    # Insert event details into eventsPrincipal
    db.execute("INSERT INTO eventsPrincipal (title, color, notes, time_slot, tag) VALUES (?, ?, ?, ?, ?)", 
               title, color, notes, time_slot, tag)
    
    # Get the event ID of the newly created event
    event_id = db.execute("SELECT last_insert_rowid() AS id")[0]['id']
          
    for index, photo in images_base64:
        filename = generate_unique_filename(images_mimetype[index])
        with open(os.path.join("static", "events_images", filename), "wb") as f:
            f.write(photo)
            
        db.execute("INSERT INTO eventsPhotos (event_id, photo_path) VALUES (?, ?)", event_id, filename)
        
    for link_path in links:
        db.execute("INSERT INTO eventsLinks (event_id, links_path) VALUES (?, ?)", event_id, link_path)
            
    for friend in friends:
        user_id = db.execute("SELECT id FROM user WHERE username = ?", friend)[0]['id']
        db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", event_id, user_id)
    
    #insert also in the connections the creator of the event
    db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", event_id, session["user_id"])
    
    return jsonify({"message": "Data received and stored", "data": data})


# Define an endpoint to handle the modifyEvent of the calendar POST request
@app.route('/modifyEvent', methods=['POST'])
@login_required
def modify_data():
    data = request.form  # Getting form data
    
    for key, value in data.items():
        print(f"{key}: {value}")

    event_id = data.get('eventId', "") 
    #id validation
    if not title:
        message = ""
        flash(message)
        redirect("/")
        
    title = data.get('eventTitle', "")
    #title validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    color = data.get('eventColor', "")
    #color validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    notes = data.get('eventText', "")
    #notes validation
    if not title:
        message = ""
        flash(message)
        redirect("/")
        
    time_slot = f"{data.get('start')}/{data.get('end')}"  # Example format, adjust as necessary
    #time_slot validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    tag = data.get('eventTags', "")
    #tag validation
    if not title:
        message = ""
        flash(message)
        redirect("/")

    # Handle photos if any
    photos = request.files.getlist("hiddenPhoto", None)
    images_base64 = {}
    images_mimetype = {}
    counter = 0
    for photo in photos:
        if photo.startswith('data:image'):
            base64_image = photo.split(",")[1]
            
            mime_type_match = re.match(r'data:(.*?);base64,', base64_image)
            if mime_type_match:
                mimetype = mime_type_match.group(1)

            if mimetype not in ['image/jpeg', 'image/png', 'image/heic']:
                message = "Invalid file type detected"
                flash(message)
                return redirect("/")
            
            # Decode the image
            image_data = base64.b64decode(base64_image)
            images_base64[counter] = image_data 
            images_mimetype[counter] = mimetype 
            counter += 1
        
    # Handle links if any
    links = request.form.getlist('hiddenLink')  # Get all links
    #links validation
    for link_path in links:  
        if not title:
            message = ""
            flash(message)
            redirect("/")

    # Handle friends if any
    friends = request.form.getlist('hiddenFriend')  # Get all friends
    for friend in friends:
        #tag validation
        if not title:
            message = ""
            flash(message)
            redirect("/")
            
    # Update event details in eventsPrincipal
    db.execute("UPDATE eventsPrincipal SET title = ?, color = ?, notes = ?, time_slot = ?, tag = ? WHERE id = ?", 
               title, color, notes, time_slot, tag, event_id)
    
    # Clear existing photos, links, and friends associated with the event
    db.execute("DELETE FROM eventsPhotos WHERE event_id = ?", event_id)
    db.execute("DELETE FROM eventsLinks WHERE event_id = ?", event_id)
    db.execute("DELETE FROM eventsConnections WHERE event_id = ?", event_id)
    
                  
    for photo in photos:
        filename = secure_filename(photo.filename) 
        photo.save(os.path.join("static", "events_images", filename))
        db.execute("INSERT INTO eventsPhotos (event_id, photo_path) VALUES (?, ?)", event_id, filename)
    
    for link_path in links:
        db.execute("INSERT INTO eventsLinks (event_id, links_path) VALUES (?, ?)", event_id, link_path)
    
    for friend in friends:
        user_id = db.execute("SELECT id FROM user WHERE username = ?", friend)[0]['id']
        db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", event_id, user_id)
    
    #insert also in the connections the creator of the event
    db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", event_id, session["user_id"])
          
    return jsonify({"message": "Event successfully modified!", "data": data})


# Define an endpoint to handle the deleteEvent of the calendar POST request
@app.route('/deleteEvent', methods=['POST'])
@login_required
def remove_data():
    data = request.get_json()  # Getting form data
    event_id = data
    
    photos = db.execute("SELECT * FROM eventsPhotos where event_id = ?", event_id)
    for photo in photos:
        filename = photo['photo_path']
        os.remove(os.path.join('static', 'events_images', filename))

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
            data_urls = {}
            for filename in os.listdir(os.path.join('static', 'events_images')):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')) and filename in photo_paths:  # Add other formats as needed
                    file_path = os.path.join('static', 'events_images', filename)
                    with open(file_path, "rb") as image_file:
                        base64_string = base64.b64encode(image_file.read()).decode('utf-8')
                        # Format as a Data URL
                        data_url = f"data:image/jpeg;base64,{base64_string}"  # Adjust MIME type as needed
                        data_urls[filename] = data_url
    
            friends = []
            friends_ids = db.execute("SELECT * FROM eventsConnections WHERE event_id = ?", event['id'])
            for friend_id in friends_ids:
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
    print(friend_info)
    
    return jsonify(friend_info)
    

    
""" 
TEMPLATE FOR AN APP.ROUTE

@app.route('/MEMO', methods=['POST', 'GET'])
@login_required
def MEMO():
"""