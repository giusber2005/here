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

import os

base_dir = os.path.dirname(os.path.abspath(__file__))

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

db_path = os.path.join(os.path.dirname(__file__), "database.db")
db = SQL(f"sqlite:///{db_path}")

#some functions for app.py
def password_check(password):
    """
    Check the strength of the given password against common passwords
    and password strength criteria.
    """
    # Load common passwords from the file
    try:
        path = os.path.join(base_dir, 'data/common.txt')
        with open(path, 'r') as file:
            common_passwords = [line.strip() for line in file.readlines()]
    except FileNotFoundError:
        return "Error: The file with common passwords was not found."

    # Check if the password is in the list of common passwords
    if password in common_passwords:
        return "This password is too common and easy to guess — choose something less predictable"

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

    # Return the strength message (with concrete hints) based on the score
    if score >= 5:
        return 1
    hints = []
    if length <= 12: hints.append("use at least 13 characters")
    if not upper_case: hints.append("add an uppercase letter")
    if not lower_case: hints.append("add a lowercase letter")
    if not digits: hints.append("add a number")
    if not special: hints.append("add a symbol like ! ? # or *")
    return "Password is too weak — " + ", ".join(hints or ["make it longer"])


def birthday_check(birthdaycheck):
    try:
        # Attempt to parse the birthday string into a datetime object
        birthday = datetime.strptime(birthdaycheck, "%Y-%m-%d")
        current_date = datetime.now()
        age = current_date.year - birthday.year - ((current_date.month, current_date.day) < (birthday.month, birthday.day))
        if age > 130:
            return "That date doesn't look right — please check the year"
        if birthday > current_date:
            return "Your birthday can't be in the future"
        if age < 14:
            return "You must be at least 14 years old to join HERE"
    except ValueError:
        # If parsing fails, the format is incorrect or date is invalid
        return "Enter a valid date"
    return 1

def email_check(emailcheck):
    #ensure that the email follow the specific format for the email
    pattern = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
    if not re.match(pattern, emailcheck):
        return "Enter a valid email address, like name@example.com"
    return 1

file_path = os.path.join(base_dir, 'data/worldcities.csv')

# Load cities and their corresponding nations into a dictionary
with open(file_path, 'r') as f:
    reader = csv.reader(f, delimiter=';')
    next(reader)  # Skip header if there's one
    city_to_nation = {rows[0].strip().lower(): rows[1].strip().lower() for rows in reader}

def nation_check(nation):
    # Check if nation exists in the values of the dictionary
    if nation.lower() not in set(city_to_nation.values()):
        return "This nation doesn't exist"
    return True

def city_check(city, nation):
    # Check if city exists in the dictionary
    if city.lower() not in city_to_nation:
        return "City not in the list"

    # Check if the city corresponds to the nation
    if city_to_nation[city.lower()] != nation.lower():
        return "City and nation don't correspond"

    return True


# Define the path to your local CSV file
path = os.path.join(base_dir, 'data/nations_and_prefixes.csv')
file_path = path

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
            return "This doesn't look like a valid number for that prefix"
        rows = db.execute("SELECT * FROM user_optional WHERE number = ?", numbercheck)
        try:
            if session["user_id"]:
                rows = db.execute("SELECT * FROM user_optional WHERE number = ? AND id != ?", numbercheck, session["user_id"])
                if len(rows) > 0:
                    return "This phone number is already linked to another account"
        except KeyError:
            if len(rows) > 0:
                return "This phone number is already linked to another account"
    except (phonenumbers.NumberParseException, KeyError):
        return "This doesn't look like a valid number for that prefix"
    return 1


def split_phonenumber(phonenumber):
    # match the longest known prefix (some contain spaces, like "+1 684")
    for prefix in sorted(PREFIXES_NATIONS_MAP, key=len, reverse=True):
        if phonenumber.startswith(prefix + " "):
            return prefix, phonenumber[len(prefix):].strip()
    prefix, _, phone_number = phonenumber.partition(" ")
    return prefix, phone_number

def generate_unique_filename(extension):
    return f"{uuid.uuid4().hex}.{extension}"


"""
Profile photo helpers
"""
PROFILE_IMAGES_DIR = os.path.join(base_dir, 'static', 'profile_images')
ALLOWED_PHOTO_TYPES = {'image/jpeg': 'jpeg', 'image/png': 'png', 'image/heic': 'heic', 'image/webp': 'webp'}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

def validate_profile_photo(photo):
    """Return an error message for an invalid uploaded photo, or None if it's fine"""
    if photo.mimetype not in ALLOWED_PHOTO_TYPES:
        return "This file type isn't supported — please upload a JPG, PNG, WEBP or HEIC image"
    photo.stream.seek(0, os.SEEK_END)
    size = photo.stream.tell()
    photo.stream.seek(0)
    if size > MAX_PHOTO_SIZE:
        return "This photo is larger than 5 MB — please choose a smaller one"
    return None

def save_profile_photo(photo):
    """Save the uploaded photo with a unique name (so users never overwrite each other's files) and return the filename"""
    filename = generate_unique_filename(ALLOWED_PHOTO_TYPES[photo.mimetype])
    photo.save(os.path.join(PROFILE_IMAGES_DIR, filename))
    return filename

def delete_profile_photo(filename):
    """Delete a profile photo from disk, ignoring files that are already gone"""
    if not filename:
        return
    path = os.path.join(PROFILE_IMAGES_DIR, os.path.basename(filename))
    if os.path.exists(path):
        os.remove(path)

def avatar_url(filename):
    """Public URL of a profile photo, or None when the user has no photo"""
    if not filename:
        return None
    return f"/static/profile_images/{filename}"

def initials(first_name, last_name, username=""):
    """Two-letter initials used as avatar fallback"""
    letters = (first_name or "")[:1] + (last_name or "")[:1]
    return (letters or (username or "?")[:2]).upper()


def get_friends(user_id):
    """Return the friends of a user with their public info, most recent connection first"""
    return db.execute(
        """
        SELECT user.id, user.username, user.FirstName, user.LastName, user.birthday,
               user_optional.photo, user_optional.city, user_optional.nation,
               connections.timestamp AS since
        FROM connections
        JOIN user ON user.id = CASE WHEN connections.id1 = ? THEN connections.id2 ELSE connections.id1 END
        LEFT JOIN user_optional ON user_optional.id = user.id
        WHERE connections.id1 = ? OR connections.id2 = ?
        ORDER BY connections.timestamp DESC
        """,
        user_id, user_id, user_id
    )


def parse_time_slot(time_slot):
    """Split an event time_slot ('start/end') into two naive datetimes"""
    def parse(value):
        value = (value or "").strip()
        try:
            return datetime.fromisoformat(value[:19])
        except ValueError:
            return datetime.strptime(value[:10], "%Y-%m-%d")
    start, _, end = (time_slot or "").partition('/')
    start_dt = parse(start)
    try:
        end_dt = parse(end)
    except ValueError:
        end_dt = start_dt
    return start_dt, end_dt





