
import re
import os
import time

from datetime import timedelta
from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session, send_from_directory, url_for
from flask_session import Session

#libraries for the password encription, to store it securely in the database
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

#libraries and modules for running periodic scripts in the application
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import secrets

#some functions to weight down the code in app.py
from helpers import *
