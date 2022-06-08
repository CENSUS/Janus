# Allow a token to access (list) the plugin's root directory
path "stakeholders_abe_engine/*" {
    capabilities = ["list"]
}

# Allow a token to gain access to the authorities' keys
path "stakeholders_abe_engine/AUTHORITY_ATTRIBUTES/" {
    capabilities = ["read", "list"]
}

# Deny access to sensitive data that is under the "AUTHORITY_ATTRIBUTES/" path
path "stakeholders_abe_engine/AUTHORITY_ATTRIBUTES/+/+/PRIVATE_DATA" {
    capabilities = ["deny"]
}

# Allow access to public data that is under the "AUTHORITY_ATTRIBUTES/" path
path "stakeholders_abe_engine/AUTHORITY_ATTRIBUTES/+/+/PUBLIC_DATA" {
    capabilities = ["read"]
}

# Deny access to sensitive data that is under the "COMMON_ATTRIBUTES/" path
path "stakeholders_abe_engine/COMMON_ATTRIBUTES/+/PRIVATE_DATA" {
    capabilities = ["deny"]
}

# Allow access to public data that is under the "COMMON_ATTRIBUTES/" path
path "stakeholders_abe_engine/COMMON_ATTRIBUTES/+/PUBLIC_DATA" {
    capabilities = ["read"]
}

# Deny access to sensitive data that is under the "SYSTEM_ATTRIBUTES/" path
path "stakeholders_abe_engine/SYSTEM_ATTRIBUTES/+/PRIVATE_DATA" {
    capabilities = ["deny"]
}

# Allow access to public data that is under the "SYSTEM_ATTRIBUTES/" path
path "stakeholders_abe_engine/SYSTEM_ATTRIBUTES/+/PUBLIC_DATA" {
    capabilities = ["read"]
}

# Allow a token to add new attributes for the organization that it was created for
path "stakeholders_abe_engine/general-hospital-of-athens/addattributes" {
    capabilities = ["create", "update"]
}

# Allow a token to generate new keys for an object
path "stakeholders_abe_engine/keygen/general-hospital-of-athens/*" {
    capabilities = ["create", "update"]
}

# Allow a token to access the users (subjects) of the system - LIST ONLY
path "stakeholders_abe_engine/SUBJECTS/GIDS/+" {
    capabilities = ["list"]
}

# Allow a token to generate SYSTEM ATTRIBUTES for other organizations
path "stakeholders_abe_engine/syskeygen/+/general-hospital-of-athens" {
    capabilities = ["create", "update"]
}

# Allow a token to access the encryption mechanism
path "stakeholders_abe_engine/encrypt" {
    capabilities = ["create", "update"]
}

# Allow a token to access the sys-decryption mechanism
path "stakeholders_abe_engine/sysdecrypt/general-hospital-of-athens/*" {
    capabilities = ["create", "update"]
}

# Allow a token to access the decryption mechanism
path "stakeholders_abe_engine/decrypt/+" {
    capabilities = ["create", "update"]
}