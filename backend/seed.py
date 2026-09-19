"""
seed.py
-------
Populates the database with a few sample users and jobs so the UI has
something to show on first run. It is idempotent: if data already exists,
it does nothing. Run automatically by docker-compose before the API starts.
"""

from app import app, wait_for_db
from db import db
from models import User, Job


SAMPLE_USERS = [
    {"name": "Ada Researcher", "email": "ada@example.edu", "role": "researcher"},
    {"name": "Grace Researcher", "email": "grace@example.edu", "role": "researcher"},
    {"name": "Alan Admin", "email": "alan@example.edu", "role": "admin"},
]

SAMPLE_JOBS = [
    {"email": "ada@example.edu", "project": "Protein folding model", "gpu_type": "B200", "gpu_count": 4, "hours": 12, "status": "running"},
    {"email": "ada@example.edu", "project": "Vision transformer pretrain", "gpu_type": "B200", "gpu_count": 8, "hours": 48, "status": "approved"},
    {"email": "grace@example.edu", "project": "NLP fine-tune", "gpu_type": "RTX", "gpu_count": 2, "hours": 6, "status": "pending"},
    {"email": "grace@example.edu", "project": "Climate sim", "gpu_type": "B200", "gpu_count": 2, "hours": 24, "status": "completed"},
    {"email": "ada@example.edu", "project": "Speculative side project", "gpu_type": "RTX", "gpu_count": 1, "hours": 3, "status": "pending"},
]


def seed():
    wait_for_db(app)
    with app.app_context():
        if User.query.first():
            print("Database already seeded, skipping.")
            return

        users = {}
        for u in SAMPLE_USERS:
            user = User(**u)
            db.session.add(user)
            users[u["email"]] = user
        db.session.commit()

        for j in SAMPLE_JOBS:
            data = dict(j)
            email = data.pop("email")
            db.session.add(Job(user_id=users[email].id, **data))
        db.session.commit()
        print(f"Seeded {len(SAMPLE_USERS)} users and {len(SAMPLE_JOBS)} jobs.")


if __name__ == "__main__":
    seed()
