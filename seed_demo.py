"""
Seeds the database with a demo account, fake friends and fake events for a showcase.

    python seed_demo.py

The demo user is giusber2000 (the password is set below). The script can be run again at any time:
it removes the previous demo data and recreates it with dates relative to today,
so the calendar and the dashboard always look "alive".
"""
import os
import random
import secrets
import shutil
import sqlite3
import uuid
from datetime import date, datetime, timedelta

from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
DEMO_IMAGES = os.path.join(BASE_DIR, "static", "demo")
EVENTS_IMAGES = os.path.join(BASE_DIR, "static", "events_images")

DEMO_USER = {
    "username": "giusber2000",
    "password": "JD([*Bps/9-vx[t:",
    "first": "Giuseppe", "last": "Berardi",
    "birthday": "2005-08-13",
    "email": "giusber2000@here-demo.app",
    "number": "+39 333 482 1937",
    "nation": "italy", "city": "bologna",
    "gender": "Male",
    "description": "Computer engineering student in Bologna. I built HERE to keep my events and friends in one place. Always up for a concert or a hike.",
    "photo": None,
}

# birthday_in: days from today to the friend's next birthday (so the dashboard shows upcoming ones)
FRIENDS = [
    {"username": "marco_esp", "first": "Marco", "last": "Esposito", "born": 1999, "birthday_in": 3,
     "nation": "italy", "city": "naples", "gender": "Male", "photo": "profile1.jpeg", "number": "+39 347 210 5583",
     "description": "Pizza purist, football on Sundays.", "friends_since": 400},
    {"username": "lucaferri", "first": "Luca", "last": "Ferri", "born": 2004, "birthday_in": 17,
     "nation": "italy", "city": "bologna", "gender": "Male", "photo": "profile2.jpeg", "number": None,
     "description": "Climber and trail runner. Ask me about the Dolomites.", "friends_since": 620},
    {"username": "dan_brooks", "first": "Daniel", "last": "Brooks", "born": 1996, "birthday_in": 41,
     "nation": "united kingdom", "city": "london", "gender": "Male", "photo": "profile3.jpeg", "number": "+44 7911 123456",
     "description": "Backend developer. Coffee-driven, open-source enthusiast.", "friends_since": 210},
    {"username": "ale_conti", "first": "Alessandro", "last": "Conti", "born": 1991, "birthday_in": 95,
     "nation": "italy", "city": "milan", "gender": "Male", "photo": "profile4.jpeg", "number": None,
     "description": "Product manager. I schedule meetings about meetings.", "friends_since": 150},
    {"username": "julien_m", "first": "Julien", "last": "Moreau", "born": 1994, "birthday_in": 130,
     "nation": "france", "city": "paris", "gender": "Male", "photo": "profile5.jpeg", "number": None,
     "description": "Photographer and jazz lover.", "friends_since": 90},
    {"username": "sofia_ricci", "first": "Sofia", "last": "Ricci", "born": 2003, "birthday_in": 58,
     "nation": "italy", "city": "florence", "gender": "Female", "photo": None, "number": None,
     "description": "Architecture student, volunteer at the food bank.", "friends_since": 45},
    {"username": "emma_larsen", "first": "Emma", "last": "Larsen", "born": 2001, "birthday_in": 200,
     "nation": "denmark", "city": "copenhagen", "gender": "Female", "photo": None, "number": None,
     "description": "Erasmus in Bologna this year. Teaching everyone hygge.", "friends_since": 12},
]

WORK, FUN, OTHER = "🔴 Work", "⚪️ Entertainment", "🔵 Other"

# (days from today, start time or None for all-day, duration in hours (timed) or days (all-day),
#  title, tag, color, notes, friends, links, demo photos)
EVENTS = [
    (-58, None, 3, "Weekend in the Dolomites", FUN, "#10B981", "Rifugio booked, bring warm clothes!", ["lucaferri", "marco_esp"], [], ["mountains", "forest"]),
    (-45, "19:30", 3, "Marco's farewell dinner", FUN, "#F59E0B", "Trattoria da Me, table for 4.", ["marco_esp", "lucaferri", "sofia_ricci"], [], []),
    (-40, "09:00", 2, "Sprint planning", WORK, "#3B82F6", "Q4 roadmap and backlog grooming.", ["ale_conti"], [], []),
    (-33, "21:00", 3, "Jazz night at Cantina Bentivoglio", FUN, "#8B5CF6", "", ["julien_m", "emma_larsen"], ["https://www.cantinabentivoglio.it"], ["city"]),
    (-27, "10:00", 1, "Dentist", OTHER, "#6B7280", "Check-up", [], [], []),
    (-20, None, 1, "Hackathon @ Unibo", WORK, "#EF4444", "24h hackathon — team HERE.", ["dan_brooks", "ale_conti"], ["https://github.com/giusber2005"], []),
    (-14, "18:30", 2, "Climbing session", FUN, "#10B981", "", ["lucaferri"], [], []),
    (-9, "14:00", 1, "Thesis meeting", WORK, "#3B82F6", "Bring the draft of chapter 2.", [], [], []),
    (-5, "20:00", 3, "Movie night: Dune Part Two", FUN, "#F59E0B", "Popcorn is on Sofia.", ["sofia_ricci", "marco_esp", "emma_larsen"], [], []),
    (-2, "08:00", 1, "Morning run — Giardini Margherita", OTHER, "#06B6D4", "5k easy pace", ["lucaferri"], [], ["sunset"]),
    (0, "09:30", 1, "Team stand-up", WORK, "#3B82F6", "", ["ale_conti"], [], []),
    (0, "18:30", 2, "Aperitivo in Piazza Santo Stefano", FUN, "#FF6B35", "First round is on me!", ["marco_esp", "sofia_ricci", "julien_m", "emma_larsen"], [], []),
    (1, "14:00", 2, "Code review with Daniel", WORK, "#EF4444", "Calendar refactor PR.", ["dan_brooks"], ["https://github.com/giusber2005"], []),
    (3, "20:00", 4, "Surprise party for Marco 🎉", FUN, "#EC4899", "Shh! Meet at 19:45, Marco arrives at 20:15.", ["lucaferri", "sofia_ricci", "dan_brooks", "julien_m"], [], []),
    (5, "07:30", 1, "Gym", OTHER, "#6B7280", "Leg day.", [], [], []),
    (8, None, 2, "Trip to Lake Garda", FUN, "#10B981", "Train at 8:12 from Bologna Centrale.", ["lucaferri", "sofia_ricci", "emma_larsen"], ["https://www.visitgarda.com"], ["lake"]),
    (11, "16:00", 2, "Client demo — HERE v2", WORK, "#EF4444", "Show the new dashboard and profile pages.", ["ale_conti", "dan_brooks"], ["https://hereforyou.live"], []),
    (15, "19:00", 2, "Cooking class: fresh pasta", FUN, "#F59E0B", "", ["emma_larsen"], [], []),
    (19, "09:00", 8, "Design workshop", WORK, "#3B82F6", "UX workshop on onboarding flows.", ["ale_conti"], [], []),
    (24, "21:00", 3, "Concert at Unipol Arena", FUN, "#8B5CF6", "Doors open at 19:30.", ["marco_esp", "lucaferri", "julien_m"], [], ["city"]),
    (31, "21:00", 4, "Costume party", FUN, "#F97316", "Theme: 80s movies.", ["sofia_ricci", "emma_larsen", "marco_esp"], [], []),
    (38, "11:00", 3, "Volunteering at the food bank", OTHER, "#06B6D4", "", ["sofia_ricci"], [], []),
    (46, None, 4, "Winter trip to Paris", FUN, "#EC4899", "Julien is our guide!", ["julien_m", "emma_larsen"], ["https://www.parisinfo.com"], ["dunes"]),
    (55, "17:00", 2, "End-of-year retrospective", WORK, "#3B82F6", "", ["ale_conti", "dan_brooks"], [], []),
    (68, None, 1, "Christmas market in Bologna", FUN, "#EF4444", "Mulled wine at Piazza Minghetti.", ["lucaferri", "sofia_ricci", "marco_esp"], [], []),
]


def time_slot(day, start, duration):
    if start is None:
        return f"{day.isoformat()}/{(day + timedelta(days=duration)).isoformat()}"
    hours, minutes = map(int, start.split(":"))
    begin = datetime.combine(day, datetime.min.time()) + timedelta(hours=hours, minutes=minutes)
    end = begin + timedelta(hours=duration)
    return f"{begin.isoformat(timespec='seconds')}/{end.isoformat(timespec='seconds')}"


def clear_previous_demo(db, usernames):
    rows = db.execute(f"SELECT id FROM user WHERE username IN ({','.join('?' * len(usernames))})", usernames).fetchall()
    ids = [row[0] for row in rows]
    if not ids:
        return
    marks = ",".join("?" * len(ids))
    event_ids = [row[0] for row in db.execute(f"SELECT DISTINCT event_id FROM eventsConnections WHERE user IN ({marks})", ids)]
    if event_ids:
        event_marks = ",".join("?" * len(event_ids))
        for (photo,) in db.execute(f"SELECT photo_path FROM eventsPhotos WHERE event_id IN ({event_marks})", event_ids):
            path = os.path.join(EVENTS_IMAGES, photo)
            if os.path.exists(path):
                os.remove(path)
        for table, column in [("eventsPhotos", "event_id"), ("eventsLinks", "event_id"), ("eventsConnections", "event_id"), ("eventsPrincipal", "id")]:
            db.execute(f"DELETE FROM {table} WHERE {column} IN ({event_marks})", event_ids)
    db.execute(f"DELETE FROM connections WHERE id1 IN ({marks}) OR id2 IN ({marks})", ids + ids)
    db.execute(f"DELETE FROM user_optional WHERE id IN ({marks})", ids)
    db.execute(f"DELETE FROM user WHERE id IN ({marks})", ids)


def insert_user(db, user, password, birthday, created):
    db.execute(
        "INSERT INTO user (username, FirstName, LastName, birthday, email, hash, conn_token, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (user["username"], user["first"], user["last"], birthday,
         user.get("email") or f"{user['username']}@here-demo.app",
         generate_password_hash(password), secrets.token_urlsafe(), created.strftime("%Y-%m-%d %H:%M:%S")),
    )
    user_id = db.execute("SELECT id FROM user WHERE username = ?", (user["username"],)).fetchone()[0]
    # user_optional shares the id with user
    db.execute(
        "INSERT INTO user_optional (id, username, number, nation, city, description, photo, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, user["username"], user.get("number"), user.get("nation"), user.get("city"),
         user.get("description"), user.get("photo"), user.get("gender")),
    )
    return user_id


def main():
    today = date.today()
    now = datetime.now()
    db = sqlite3.connect(DB_PATH)

    usernames = [DEMO_USER["username"]] + [friend["username"] for friend in FRIENDS]
    clear_previous_demo(db, usernames)

    me = insert_user(db, DEMO_USER, DEMO_USER["password"], DEMO_USER["birthday"], now - timedelta(days=700))

    ids = {DEMO_USER["username"]: me}
    for friend in FRIENDS:
        next_birthday = today + timedelta(days=friend["birthday_in"])
        try:
            birthday = next_birthday.replace(year=friend["born"])
        except ValueError:  # 29th of February
            birthday = next_birthday.replace(year=friend["born"], day=28)
        # friends can't log in: they get a random password
        ids[friend["username"]] = insert_user(db, friend, secrets.token_urlsafe(24), birthday.isoformat(),
                                              now - timedelta(days=friend["friends_since"] + 30))
        since = now - timedelta(days=friend["friends_since"], hours=random.randint(0, 23))
        db.execute("INSERT INTO connections (id1, id2, timestamp) VALUES (?, ?, ?)",
                   (me, ids[friend["username"]], since.strftime("%Y-%m-%d %H:%M:%S")))

    next_id = (db.execute("SELECT MAX(id) FROM eventsPrincipal").fetchone()[0] or 0) + 1
    photos_added = 0
    for offset, start, duration, title, tag, color, notes, friends, links, photos in EVENTS:
        event_id = next_id
        next_id += 1
        db.execute("INSERT INTO eventsPrincipal (id, title, color, notes, time_slot, tag) VALUES (?, ?, ?, ?, ?, ?)",
                   (event_id, title, color, notes, time_slot(today + timedelta(days=offset), start, duration), tag))
        for username in friends + [DEMO_USER["username"]]:
            db.execute("INSERT INTO eventsConnections (event_id, user) VALUES (?, ?)", (event_id, ids[username]))
        for link in links:
            db.execute("INSERT INTO eventsLinks (event_id, links_path) VALUES (?, ?)", (event_id, link))
        for photo in photos:
            # every event gets its own copy, because deleting an event deletes its photo files
            filename = f"{uuid.uuid4().hex}.jpeg"
            shutil.copy(os.path.join(DEMO_IMAGES, f"{photo}.jpeg"), os.path.join(EVENTS_IMAGES, filename))
            db.execute("INSERT INTO eventsPhotos (event_id, photo_path) VALUES (?, ?)", (event_id, filename))
            photos_added += 1

    db.commit()
    db.close()
    print(f"Demo ready: user '{DEMO_USER['username']}' with {len(FRIENDS)} friends, {len(EVENTS)} events and {photos_added} event photos.")


if __name__ == "__main__":
    main()
