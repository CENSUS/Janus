from cryptography.hazmat.backends import default_backend
from jose import jwt
from pydantic import BaseModel, UUID4, FilePath
from pydantic.fields import Field
from uuid import uuid4, UUID
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from enum import Enum


def utcnow_plus_delta(seconds=300):
    return datetime.now() + timedelta(seconds=seconds)


class jwt_type(str, Enum):

    req = 'REQ'
    resp = 'RESP'


class attributes(str, Enum):

    doctor = 'Doctor'
    on_call = 'On_Call'
    researcher = 'Researcher'
    manufacturer = 'Manufacturer'
    clinic = 'Clinic'
    technician_c = 'Clinic_Technician'
    technician_m = 'Manufacturer_Technician'
    staff_m = 'Manufacturer_Staff_Member'
    staff_c = 'Clinic_Staff_Member'


class data_request(str, Enum):

    patient_hist = 'Patients_History'
    device_firmware = 'Device_Firmware'
    fault_stats = 'Fault_Statistics'
    disease_stats = 'Disease_Statistics'
    patient_stats = 'Patient_Statistics'
    device_owned = 'Device_Owned'


class jwtRSA_payload(BaseModel):

    jti: UUID4 = Field(default_factory=uuid4)
    iss: UUID4
    aud: List[UUID4]
    type: jwt_type
    GUID: UUID4
    verified_attrs: List[attributes] = []
    data_id: data_request
    data: Dict = {}


class jwtRSA_payload_time(jwtRSA_payload):

    iat: datetime
    exp: datetime


class jwtRSA_encoder():

    def __init__(self, issuer: UUID4, private_key=Optional[str]):
        self.alg = 'RS256'
        self.issuer = UUID(issuer).hex
        self.private_key = private_key

    def read_private_key(self, filename=FilePath, password=None):
        from cryptography.hazmat.primitives import serialization

        # convert str password to bytes
        if password and isinstance(password, str):
            password = password.encode()
        else:
            password = None

        with open(filename, 'rb') as key_file:
            pk = serialization.load_pem_private_key(
                key_file.read(),
                password=password,
                backend=default_backend()
            )

        self.private_key = pk.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )

    def encode(self, payload=jwtRSA_payload, exp_delta=300, exp_time=0):

        issue_time = datetime.utcnow()
        if not exp_time:
            exp_time = issue_time + timedelta(seconds=exp_delta)
        payload = jwtRSA_payload_time(
            **payload.dict(),
            iat=issue_time,
            exp=exp_time

        )

        payload_dict = payload.dict()
        for key in ['jti', 'iss', 'GUID']:
            payload_dict[key] = payload_dict[key].hex
        payload_dict['aud'] = [audience.hex for audience in payload_dict['aud']]

        token = jwt.encode(
            payload_dict,
            self.private_key,
            algorithm=self.alg
        )

        return token


class jwtRSA_decoder():

    def __init__(self, audience: UUID4, public_key=Optional[str]):
        self.alg = 'RS256'
        self.audience = UUID(audience).hex
        self.public_key = public_key

    def read_pubic_key(self, filename=FilePath):
        with open(filename, 'r') as key_file:
            self.public_key = key_file.read()

    def decode(self, token):

        decoded = jwt.decode(
            token,
            self.public_key,
            algorithms=self.alg,
            audience=self.audience
        )

        return jwtRSA_payload_time(**decoded)
