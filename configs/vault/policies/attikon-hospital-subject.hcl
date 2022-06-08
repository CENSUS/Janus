# Allow a token to access (list) the plugin's root directory
path "stakeholders_abe_engine/*" {
    capabilities = ["list"]
}

# Allow a token to gain access to the authorities' keys
path "stakeholders_abe_engine/authority_keys/" {
    capabilities = ["read", "list"]
}

# Deny access to sensitive data that is under the "AUTHORITY_ATTRIBUTES/" path - Accessible is only the "public" data
path "stakeholders_abe_engine/AUTHORITY_ATTRIBUTES/+/+/PRIVATE_DATA" {
    capabilities = ["deny"]
}

# Deny access to sensitive data that is under the "COMMON_ATTRIBUTES/" path - Accessible is only the "public" data
path "stakeholders_abe_engine/COMMON_ATTRIBUTES/+/PRIVATE_DATA" {
    capabilities = ["deny"]
}

# Deny access to sensitive data that is under the "SYSTEM_ATTRIBUTES/" path - Accessible is only the "public" data
path "stakeholders_abe_engine/SYSTEM_ATTRIBUTES/+/PRIVATE_DATA" {
    capabilities = ["deny"]
}

# Deny a token to add new attributes for the organization that it was created for
path "stakeholders_abe_engine/attikon-hospital/addattributes" {
    capabilities = ["deny"]
}

# Deny a token to generate new keys for an object (user)
path "stakeholders_abe_engine/keygen/attikon-hospital/*" {
    capabilities = ["deny"]
}

# Deny a token to access the users (subjects) of the system - LIST ONLY
path "stakeholders_abe_engine/SUBJECTS/GIDS/+" {
    capabilities = ["deny"]
}

# Deny a token to generate SYSTEM ATTRIBUTES for other organizations
path "stakeholders_abe_engine/syskeygen/+/attikon-hospital" {
    capabilities = ["deny"]
}

# Allow a token to access the encryption mechanism
path "stakeholders_abe_engine/encrypt" {
    capabilities = ["create", "update"]
}

# Deny a token to access the sys-decryption mechanism
path "stakeholders_abe_engine/sysdecrypt" {
    capabilities = ["deny"]
}

# Allow a token to access the decryption mechanism
path "stakeholders_abe_engine/decrypt/{{identity.entity.name}}" {
    capabilities = ["create", "update"]
}