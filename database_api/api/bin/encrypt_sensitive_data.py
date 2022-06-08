import requests
from db_api.config.settings import accessible_key_principals_check, encryption_correlation_for_abe, encryption_foreign_key_selector, organizations_users, sensitive_key_principals_check, vault_settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from db_api.config.settings import server_settings
import  base64, os

organizations_users_loader = organizations_users()
vault_settings_loader = vault_settings()
abe_policies = encryption_correlation_for_abe()
foreign_key_selector = encryption_foreign_key_selector()
settings = server_settings()

def encryptData(data, vault_token, stakeholder_type, type):

    policy = abe_policies.abe_encryption_options[str(type)]
    vault_domain_selector = vault_settings_loader.abe_path_based_on_object_type[str(stakeholder_type)]
    # foreign_key_identifier = foreign_key_selector.encryption_foreign_key_selector[str(type)]

    encryption_key = AESGCM.generate_key(bit_length=256)

    vault_response = requests.post(f"{vault_settings_loader.vault_address}/v1/{vault_domain_selector}/encrypt",
                headers={'X-Vault-Token': vault_token},
                json= { "message": str(base64.b64encode(encryption_key).decode('ascii')),
                "policy": str(policy)},
                verify=settings.ssl_cafile,
                cert=(settings.ssl_certfile, settings.ssl_keyfile),
                timeout=5
                ).json()

    if "errors" in vault_response:
        print(f"Error encrypting the data, error: {vault_response['errors']}")
        return {}

    wrapped_encryption_key = vault_response["data"]["b64_enc_data"]

    accessible_key_principals = accessible_key_principals_check().accessible_key_principals
    sensitive_key_principals = sensitive_key_principals_check().sensitive_key_principals

    for key in data:
        if key in accessible_key_principals:
            continue    # The value of the key is not needed - The key is already known (it exists in the parent Table)

        if key in sensitive_key_principals:
            nonce = os.urandom(12)
            dataAsBytes = data[key].encode('utf-8')
            # encryptedData[key] = base64.b64encode(base64.b64encode(nonce) + ".".encode() + base64.b64encode(AESGCM(encryption_key).encrypt(nonce, dataAsBytes, associated_data.encode())))
            data[key] = base64.b64encode(base64.b64encode(nonce) + ".".encode() + base64.b64encode(AESGCM(encryption_key).encrypt(nonce, dataAsBytes, None)))

    data[foreign_key_selector.encryption_foreign_key_selector[str(type)]] = data['uuid'] if 'uuid' in data else data['id']
    data['wrapped_encryption_key'] = wrapped_encryption_key

    return data