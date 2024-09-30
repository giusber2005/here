#library to validate the phone number
import phonenumbers
#library to work with .csv files
import csv
#library to work with time
from datetime import datetime
#library to work with strings
import re

#library to generate unique filenames
import uuid

from flask import redirect, render_template, session
from functools import wraps
from cs50 import SQL


def apology(message, code=400):
    """Render message as an apology to user."""

    def escape(s):
        """
        Escape special characters.

        https://github.com/jacebrowning/memegen#special-chacters
        """
        for old, new in [
            ("-", "--"),
            (" ", "-"),
            ("_", "__"),
            ("?", "~q"),
            ("%", "~p"),
            ("#", "~h"),
            ("/", "~s"),
            ('"', "''"),
        ]:
            s = s.replace(old, new)
        return s

    return render_template("apology.html", top=code, bottom=escape(message)), code


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///database.db")

#some functions for app.py
def password_check(password):
    """
    Check the strength of the given password against common passwords
    and password strength criteria.
    """
    # Load common passwords from the file
    try:
        with open('data/common.txt', 'r') as file:
            common_passwords = [line.strip() for line in file.readlines()]
    except FileNotFoundError:
        return "Error: The file with common passwords was not found."

    # Check if the password is in the list of common passwords
    if password in common_passwords:
        return "Your password can be easily cracked by a dictionary attack"

    # Check for the presence of different types of characters
    upper_case = bool(re.search(r'[A-Z]', password))
    lower_case = bool(re.search(r'[a-z]', password))
    special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    digits = bool(re.search(r'[0-9]', password))

    characters = [upper_case, lower_case, special, digits]

    length = len(password)
    score = 0

    # Calculate score based on length
    if length > 8: score += 1
    if length > 12: score += 1
    if length > 17: score += 1
    if length > 20: score += 1

    # Calculate score based on character variety
    variety = sum(characters)
    if variety > 1: score += 1
    if variety > 2: score += 1
    if variety > 3: score += 1

    # Return the strength message based on the score
    if score < 4:
        return f"Password strength: {score}/7. Your password is weak"
    elif score == 4:
        return f"Password strength: {score}/7. Your password is not too strong"
    elif 5 <= score < 6:
        return 1
    else:  # score >= 6
        return 1


def birthday_check(birthdaycheck):
    try:
        # Attempt to parse the birthday string into a datetime object
        birthday = datetime.strptime(birthdaycheck, "%Y-%m-%d")
        current_date = datetime.now()
        age = current_date.year - birthday.year - ((current_date.month, current_date.day) < (birthday.month, birthday.day))
        if age > 130:
            message = "insert a valid birthday"
            return message
        if age < 0:
            message = "please insert a correct birthday"
            return message
        if age < 14:
            message = "only user above 15 years old can register to this page"
            return message
    except ValueError:
        # If parsing fails, the format is incorrect or date is invalid
        message = "insert a correct format and a correct value for your birthday"
        return message
    return 1

def email_check(emailcheck):
    #ensure that the email follow the specific format for the email
    pattern = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
    if not re.match(pattern, emailcheck):
        message = "insert an appropriate format for the email"
        return message
    return 1

def nationcity_check(check, city):
    with open('data/worldcities.csv', 'r') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader)  # Skip header if there's one
        city_to_nation = {rows[0].strip().lower(): rows[1].strip().lower() for rows in reader}

        if city == None:
                message = "This nation doesn't exist"
                return message
        if city != None:
            if check not in set(city_to_nation):
                message = "This city doesn't exist"
            if check not in set(city_to_nation.values()):
                return message
            if city_to_nation.get(check) != city:
                message = "City and nation don't correspond"
                return message
        return 1

# Define the path to your local CSV file
file_path = 'data/nations_and_prefixes.csv'

# Open and read the local CSV file
try:
    with open(file_path, 'r') as file:
        data = file.read()
        lines = data.split('\n')
        PREFIXES_NATIONS_MAP = {}

        # Process the lines of the CSV file
        for line in lines[1:]:  # Skip the header line
            parts = line.split(';')
            if len(parts) >= 2 and parts[1] and parts[0]:
                prefix = parts[1].strip()
                nation = parts[0].strip().lower()
                PREFIXES_NATIONS_MAP[prefix] = nation

except FileNotFoundError:
    print(f'Error: The file {file_path} was not found.')
except IOError as e:
    print(f'Error reading the file {file_path}: {e}')


def number_check(numbercheck, session):
    try:
        parts = numbercheck.split(' ')
        nation = PREFIXES_NATIONS_MAP[parts[0]]
        parsed_number = phonenumbers.parse(numbercheck, nation)
        if not phonenumbers.is_valid_number(parsed_number):
            message = "phone number is not in the correct format"
            return message
        rows = db.execute("SELECT * FROM user_optional WHERE number = ?", numbercheck)
        try:
            if session["user_id"]:
                rows = db.execute("SELECT * FROM user_optional WHERE number = ? AND id != ?", numbercheck, session["user_id"])
                if len(rows) > 0:
                    message = "phone number is in the database"
                    return message
        except KeyError:
            if len(rows) > 0:
                message = "phone number is already in the database"
                return message
    except phonenumbers.NumberParseException:
        message = "phone number is not in the correct format"
        return message
    return 1


def split_phonenumber(phonenumber):
        sectors = phonenumber.split()
        split_index = len(sectors) - 3

        prefix = ' '.join(sectors[:split_index])
        phone_number = ' '.join(sectors[split_index:])

        return prefix, phone_number
    
def generate_unique_filename(extension):
    return f"{uuid.uuid4().hex}.{extension}"




