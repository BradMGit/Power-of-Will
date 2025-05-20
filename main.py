from flask import Flask, render_template, request, redirect, url_for, flash
from flask_bootstrap import Bootstrap5
from flask_login import UserMixin, login_user, LoginManager, current_user, logout_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String
from werkzeug.security import generate_password_hash, check_password_hash
import os
import smtplib
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# --- Flask app setup ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_KEY')
Bootstrap5(app)

# --- Flask-Login ---
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return db.get_or_404(User, user_id)

# --- Gravatar (optional, still loaded if used in templates) ---
from flask_gravatar import Gravatar
gravatar = Gravatar(app, size=100, rating='g', default='retro')


# --- Database ---
class Base(DeclarativeBase): pass


app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DB_URI", "sqlite:///users.db")
db = SQLAlchemy(model_class=Base)
db.init_app(app)


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(100))


with app.app_context():
    db.create_all()


# === ROUTES ===

@app.route('/')
def home():
    return render_template("index.html", current_user=current_user, now=datetime.now())


@app.route('/about')
def about():
    return render_template("about.html", current_user=current_user, now=datetime.now())


@app.route('/demos')
def demos():
    return render_template("demos.html", current_user=current_user, now=datetime.now())


@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        data = request.form
        send_email(data["name"], data["email"], data["phone"], data["message"])
        return render_template("contact.html", msg_sent=True, current_user=current_user, now=datetime.now())
    return render_template("contact.html", msg_sent=False, current_user=current_user, now=datetime.now())


def send_email(name, email, phone, message):
    email_message = f"Subject: New Message from Power of Will VO\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nMessage: {message}"
    with smtplib.SMTP("smtp.gmail.com", port=587) as connection:
        connection.starttls()
        connection.login(
            user=os.environ.get("EMAIL_USER"),
            password=os.environ.get("EMAIL_PASS")
        )
        connection.sendmail(
            from_addr=os.environ.get("EMAIL_USER"),
            to_addrs=os.environ.get("EMAIL_USER"),
            msg=email_message
        )


# === Optional: Keep login system for future editing ===


from forms import RegisterForm, LoginForm


@app.route('/register', methods=["GET", "POST"])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        existing_user = db.session.execute(db.select(User).where(User.email == form.email.data)).scalar()
        if existing_user:
            flash("That email is already registered. Please log in.")
            return redirect(url_for('login'))

        new_user = User(
            email=form.email.data,
            name=form.name.data,
            password=generate_password_hash(form.password.data, method='pbkdf2:sha256', salt_length=8)
        )
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user)
        return redirect(url_for("home"))
    return render_template("register.html", form=form, current_user=current_user, now=datetime.now())


@app.route('/login', methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = db.session.execute(db.select(User).where(User.email == form.email.data)).scalar()
        if not user or not check_password_hash(user.password, form.password.data):
            flash("Invalid credentials. Please try again.")
            return redirect(url_for('login'))
        login_user(user)
        return redirect(url_for('home'))
    return render_template("login.html", form=form, current_user=current_user, now=datetime.now())


@app.route("/gallery")
def gallery():
    image_files = [f"assets/img/gallery{i}.jpg" for i in range(1, 11)]
    return render_template("gallery.html", images=image_files, now=datetime.now())


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/favicon.ico')
def favicon():
    return redirect(url_for('static', filename='assets/powerofwill.ico'))


if __name__ == "__main__":
    app.run(debug=False, port=5001)
