
from pydantic.tools import parse_obj_as
from sqlalchemy.orm import Session
from pydantic import UUID4
from ...src import models, schemas


def get_by_uuid(db: Session, model, uuid: UUID4):
    return db.query(model).get(uuid)


def get_by_id(db: Session, model, id: int):
    return db.query(model).get(id)


def create(db: Session, model, schema, commit=True):
    entry = model(**schema.dict())
    db.add(entry)
    if commit:
        db.commit()
    return schema