r"""
models.py
---------
Defines the database tables as Python classes. Each class = one table, each
attribute = one column. This is the ORM equivalent of a CREATE TABLE statement.

Two tables:
  - users: people who can request compute (role is "researcher" or "admin")
  - jobs:  a request to run a compute job on the cluster

The Job.status field is the heart of the workflow:
  pending -> approved -> running -> completed
                      \-> denied
"""

from datetime import datetime, timezone
from db import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False, default="researcher")

    jobs = db.relationship("Job", backref="user", lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    project = db.Column(db.String(200), nullable=False)
    gpu_type = db.Column(db.String(40), nullable=False)   # e.g. "B200", "RTX"
    gpu_count = db.Column(db.Integer, nullable=False, default=1)
    hours = db.Column(db.Integer, nullable=False, default=1)
    status = db.Column(db.String(20), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "project": self.project,
            "gpu_type": self.gpu_type,
            "gpu_count": self.gpu_count,
            "hours": self.hours,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
