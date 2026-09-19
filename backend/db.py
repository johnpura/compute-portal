"""
db.py
-----
This file holds the single SQLAlchemy "db" object that the rest of the app
imports. Keeping it in its own module avoids circular imports: models.py and
app.py both import `db` from here, instead of from each other.

SQLAlchemy is an ORM (Object Relational Mapper). It lets you work with database
rows as Python objects instead of writing raw SQL. You already know SQL, so think
of the ORM as a convenience layer: `Job.query.all()` becomes `SELECT * FROM jobs`.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
