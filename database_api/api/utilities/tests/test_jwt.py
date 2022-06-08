import os
from api.utilities import my_jwt
from datetime import timedelta


def test_jwt():
    proxy = '8b85ecc1-f6fa-467d-b6f3-2b2bd80f8dc7'
    domain = '4fdfe2a6-24b7-4e1d-95aa-01dd83d65bb4'
    guid = '5eb6cc4d-dfc2-4aae-9f7b-5cfdd07f7abf'

    cwd = os.path.dirname(__file__)

    private_keyfile = f'{cwd}/jwtRS256.key'
    public_keyfile = f'{cwd}/jwtRS256.key.pub'

    payload = my_jwt.jwtRSA_payload(
        iss=proxy,
        aud=[domain],
        type=my_jwt.jwt_type.req,
        GUID=guid,
        data_id=my_jwt.data_request.patient_hist,
        data={
            "SSN": "patient_SSN"
        }
    )

    proxy_encoder = my_jwt.jwtRSA_encoder(proxy)
    proxy_encoder.read_private_key(private_keyfile)

    token = proxy_encoder.encode(payload)

    domain_decoder = my_jwt.jwtRSA_decoder(domain)
    domain_decoder.read_pubic_key(public_keyfile)

    decoded_token = domain_decoder.decode(token)

    assert payload.jti == decoded_token.jti
    assert payload.iss == decoded_token.iss
    assert payload.aud == decoded_token.aud
    assert payload.type == decoded_token.type
    assert payload.GUID == decoded_token.GUID
    assert payload.verified_attrs == decoded_token.verified_attrs
    assert payload.data_id == decoded_token.data_id
    assert payload.data == decoded_token.data
    delta = decoded_token.exp - decoded_token.iat
    assert delta == timedelta(seconds=300)
