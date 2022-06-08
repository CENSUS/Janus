from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid

from sqlalchemy.sql.schema import ForeignKey


class uuid_model:

    uuid = Column(UUID(as_uuid=True), primary_key=True,
                  default=uuid.uuid4, unique=True, nullable=False)

class guid_model:

    guid = Column(UUID(as_uuid=True), primary_key=True,
                  default=uuid.uuid4, unique=True, nullable=False)


class id_model:

    id = Column(Integer, primary_key=True, index=True)
