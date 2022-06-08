#!/bin/bash

# HELPER FUNCTIONS
function construct_base_vault_exports() {
  push_fn "Preparing Base Vault Information"

  export BASE_VAULT_EXPORTS='export VAULT_ADDR="https://vault:8200"
    export VAULT_CACERT="/vault/userconfig/vault-tls/ca.crt"
    export VAULT_CLIENT_CERT="/vault/userconfig/vault-tls/tls.crt"
    export VAULT_CLIENT_KEY="/vault/userconfig/vault-tls/tls.key"'

  export BASE_VAULT_EXPORTS_UNSET='unset VAULT_ADDR VAULT_CACERT VAULT_CLIENT_CERT VAULT_CLIENT_KEY'

  pop_fn
}

function load_vault_token() {
  if [[ "${1}" == "vault_token" ]]; then
    if [[ "${2}" == "load" ]]; then
      # log "Loading Vault Root token"
      VAULT_ROOT_TOKEN=$(cat ${VAULT_VALUES_DIR}/init_values.json | jq -r '.root_token')
    elif [[ "${2}" == "unload" ]]; then
      # log "Unloading Vault Root token"
      unset VAULT_ROOT_TOKEN
    fi
  elif [[ "${1}" == "vault_unseal_token" ]]; then
    if [[ "${2}" == "load" ]]; then
      # log "Loading Vault Unseal token"
      VAULT_UNSEAL_TOKEN=$(cat ${VAULT_VALUES_DIR}/init_values.json | jq -r '.unseal_keys_hex[0]')
    elif [[ "${2}" == "unload" ]]; then
      # log "Unloading Vault Unseal token"
      unset VAULT_UNSEAL_TOKEN
    fi
  fi
}

# MAIN FUNCTIONS
function construct_vault_tls() {
  push_fn "Producing the TLS Certificates for: Vault"

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/ca-ministry-of-health-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name vault --id.secret vaultpw --id.type client --url https://ca-ministry-of-health --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/tlsadminmoh/msp
    fabric-ca-client enroll --url https://vault:vaultpw@ca-ministry-of-health \
    --csr.hosts vault.${INFRASTRUCTURE_ENDPOINT} \
    --csr.hosts vault \
    --csr.hosts vault.vault \
    --csr.hosts vault.vault.svc \
    --csr.hosts vault.vault.svc.cluster.local \
    --csr.hosts vault-agent-injector-svc \
    --csr.hosts vault-agent-injector-svc.vault \
    --csr.hosts vault-agent-injector-svc.vault.svc \
    --csr.hosts vault-agent-injector-svc.vault.svc.cluster.local \
    --mspdir /var/hyperledger/fabric/applications/vault/msp

    mv /var/hyperledger/fabric/applications/vault/msp/keystore/*_sk  /var/hyperledger/fabric/applications/vault/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/vault/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/ca-ministry-of-health -i -- /bin/sh

  mkdir -p ./build/vault

  kubectl -n $NS exec -i deploy/ca-ministry-of-health -c main -- tar cf - . -C /var/hyperledger/fabric/applications/vault/msp . | tar xf - -C "build/vault"

  kubectl delete secret -n $NS vault-tls --ignore-not-found
  kubectl create secret generic -n $NS vault-tls --from-file=tls.crt="./build/vault/signcerts/cert.pem" --from-file=tls.key="./build/vault/keystore/key.pem" --from-file=ca.crt="./build/vault/cacerts/ca-ministry-of-health.pem"

  pop_fn
}

function vault_init() {
  push_fn "Initializing Vault"

  echo 'set -x
    '${BASE_VAULT_EXPORTS}'

    VAULT_INITIALIZATION_INFO=$(vault operator init -key-shares=1 -key-threshold=1 -format=json | base64)

    printf "${VAULT_INITIALIZATION_INFO}"

    '${BASE_VAULT_EXPORTS_UNSET}'


  ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh | base64 --decode >${VAULT_VALUES_DIR}/init_values.json

  pop_fn

}

function vault_unseal() {
  push_fn "Unsealing Vault"

  load_vault_token "vault_token" "load"
  load_vault_token "vault_unseal_token" "load"

  echo 'set -x
    '${BASE_VAULT_EXPORTS}'

    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

    vault operator unseal "'$VAULT_UNSEAL_TOKEN'"

    unset VAULT_TOKEN

    '${BASE_VAULT_EXPORTS_UNSET}'

  ' | exec kubectl -n ${NS} exec statefulSet/vault -i -- /bin/sh

  load_vault_token "vault_token" "unload"
  load_vault_token "vault_unseal_token" "unload"

  pop_fn

}

function vault_init_abe_plugin() {

  push_fn "Initializing the ABE Vault Plugin"

  load_vault_token "vault_token" "load"

  for row in $(echo "$(cat ${VAULT_VALUES_DIR}/plugin_values.json)" | jq -r ".PLUGINS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    PLUGINS_VAULT_DIR=$(cat ${VAULT_VALUES_DIR}/plugin_values.json | jq -r '.VAULT_PLUGINS_DIR')

    PLUGIN_NAME=$(_jq '.PLUGIN_NAME')
    PLUGIN_VAULT_PATH=$(_jq '.PLUGIN_VAULT_PATH')

    echo 'set -x

    '${BASE_VAULT_EXPORTS}'

    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

    PLUGIN_SHA256=$(sha256sum '$PLUGINS_VAULT_DIR/$PLUGIN_NAME' | cut -d " " -f1)

    # Disable if it exists
    vault secrets disable stakeholders_abe_engine/

    vault plugin register -sha256=$PLUGIN_SHA256 secret '$PLUGIN_NAME'

    vault secrets enable -path='$PLUGIN_VAULT_PATH' '$PLUGIN_NAME'

    unset VAULT_TOKEN
    '${BASE_VAULT_EXPORTS_UNSET}'

    ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

  done

  load_vault_token "vault_token" "unload"

  pop_fn
}

function create_vault_abe_policies() {

  push_fn "Creating the ABE Vault Policies"

  load_vault_token "vault_token" "load"

  for file in ${VAULT_VALUES_DIR}/policies/*.hcl; do

    POLICY_NAME="${file##*/}"

    POLICY_DATA=$(cat ${file} | base64)

    echo 'set -x

    '${BASE_VAULT_EXPORTS}'

    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

    echo "'$POLICY_DATA'" | base64 -d | vault policy write "'${POLICY_NAME%.*}'" -

    unset VAULT_TOKEN

    '${BASE_VAULT_EXPORTS_UNSET}'

  ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

  done

  load_vault_token "vault_token" "unload"

  pop_fn
}

function enable_vault_authentication_methods() {

  push_fn "Enabling the Vault Authentication Methods (Userpass/Kubernetes)"

  load_vault_token "vault_token" "load"

  echo 'set -x

  '${BASE_VAULT_EXPORTS}'
  export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

  vault auth enable -path="userpass" userpass
  vault auth enable -path="userpass-attikon-hospital" userpass
  vault auth enable -path="userpass-general-hospital-of-athens" userpass
  vault auth enable -path="userpass-medutils" userpass
  vault auth enable -path="userpass-healthprods" userpass

  vault auth enable kubernetes


  unset VAULT_TOKEN
  '${BASE_VAULT_EXPORTS_UNSET}'

    ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

  pop_fn
}

function register_vault_organizations() {

  push_fn "Registering the Organizations with Vault"

  load_vault_token "vault_token" "load"

  mkdir -p build/vault/various/vault_settings
  rm build/vault/various/vault_settings/org_creds.json || echo "No file to remove..." && touch build/vault/various/vault_settings/org_creds.json && echo "{}" >"build/vault/various/vault_settings/org_creds.json"

  for row in $(echo "$(cat ${VAULT_VALUES_DIR}/organizations.json)" | jq -r ".ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    ORGANIZATION_NAME=$(_jq '.organizationName')
    local ORGANIZATION_PW=$(generate_random_password 25)
    ORGANIZATION_VAULT_POLICY=$(_jq '.vaultPolicy')

    echo 'set -x

    '${BASE_VAULT_EXPORTS}'

    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

    vault write auth/userpass/users/'\"${ORGANIZATION_NAME}\"' password='${ORGANIZATION_PW}' policies='${ORGANIZATION_VAULT_POLICY}'

    unset VAULT_TOKEN
    '${BASE_VAULT_EXPORTS_UNSET}'

    ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

    echo $(jq '(.ORGANIZATIONS[] | select(.organizationName == '\"${ORGANIZATION_NAME}\"') | .organizationVaultPW) |= '\"${ORGANIZATION_PW}\"'' ${VAULT_VALUES_DIR}/organizations.json) >"${VAULT_VALUES_DIR}/organizations.json"

    echo $(jq '.+{'\"${ORGANIZATION_NAME^^}\"':'\"${ORGANIZATION_PW}\"'}' build/vault/various/vault_settings/org_creds.json) >build/vault/various/vault_settings/org_creds.json

  done

  load_vault_token "vault_token" "unload"

}

function construct_vault_organization_settings() {
  kubectl -n $NS delete configmap vault-settings-organizations-credentials-v1-map || log "vault-settings-organizations-credentials-v1-map for Vault is not present - Constructing..."
  kubectl -n $NS create configmap vault-settings-organizations-credentials-v1-map --from-file=./build/vault/various/vault_settings/org_creds.json
}

function create_vault_authenticator_service() {
  push_fn "Creating the Vault Authenticator service"

  load_vault_token "vault_token" "load"

  VAULT_SVC_AUTHENTICATOR=$(cat ${VAULT_VALUES_DIR}/vault_values.json | jq -r '.VAULT_SVC_AUTHENTICATOR')
  KUBERNETES_HOST=$(cat ${VAULT_VALUES_DIR}/vault_values.json | jq -r '.KUBERNETES_HOST')

  kubectl create serviceaccount "${VAULT_SVC_AUTHENTICATOR}" || echo "Service account ${VAULT_SVC_AUTHENTICATOR} exists"

  log "Need to let the VAULT-AUTHENTICATOR with name $VAULT_SVC_AUTHENTICATOR to validate other services - Applying the definition"

  kubectl apply -f - <<EOH
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: role-tokenreview-binding
  namespace: ${NS}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: ${VAULT_SVC_AUTHENTICATOR}
  namespace: ${NS}
EOH

  SECRET_VAULT_ACCOUNT_SVC="$(kubectl get serviceaccount ${VAULT_SVC_AUTHENTICATOR} -o go-template='{{ (index .secrets 0).name }}')"
  VAULT_ACCOUNT_TOKEN_RV_ROLE="$(kubectl get secret "${SECRET_VAULT_ACCOUNT_SVC}" -o go-template='{{ .data.token }}' | base64 --decode)"
  KUBERNETES_CACERT="$(microk8s.kubectl config view --raw --minify --flatten -o jsonpath='{.clusters[].cluster.certificate-authority-data}' | base64 --decode)"

  echo 'set -x

    '${BASE_VAULT_EXPORTS}'

    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"
    
    vault write auth/kubernetes/config issuer="https://kubernetes.default.svc" \
    token_reviewer_jwt="'"${VAULT_ACCOUNT_TOKEN_RV_ROLE}"'" \
    kubernetes_host="'"${KUBERNETES_HOST}"'" \
    kubernetes_ca_cert="'"${KUBERNETES_CACERT}"'" \
    disable_iss_validation=true

    unset VAULT_TOKEN
    '${BASE_VAULT_EXPORTS_UNSET}'

    ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

  load_vault_token "vault_token" "unload"

}

function enroll_services_with_vault() {
  push_fn "Enrolling the Services with Vault"

  load_vault_token "vault_token" "load"

  for row in $(echo "$(cat ${VAULT_VALUES_DIR}/vault_values.json)" | jq -r ".SERVICE_ACCOUNTS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    ROLE_NAME=$(_jq '.role')
    ACCOUNT_NAME=$(_jq '.accountName')
    POLICY_NAME=$(_jq '.policy')

    kubectl -n ${NS} create serviceaccount ${ACCOUNT_NAME} || echo "Service Account ${ROLE_NAME} already exists"

    echo 'set -x

    '${BASE_VAULT_EXPORTS}'

    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

    vault write auth/kubernetes/role/'${ROLE_NAME}' bound_service_account_names='${ACCOUNT_NAME}' bound_service_account_namespaces='${NS}' policies='${POLICY_NAME}' ttl=1h

    unset VAULT_TOKEN
    '${BASE_VAULT_EXPORTS_UNSET}'

    ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh
  done

}

function initialize_abe_attributes() {
  for row in $(echo "$(cat ${VAULT_VALUES_DIR}/organizations.json)" | jq -r ".ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    ORG_NAME=$(_jq '.organizationName')
    ORG_PW=$(_jq '.organizationVaultPW')
    ORG_VAULT_DOMAIN=$(_jq '.domain')
    ABE_ATTRIBUTES=$(_jq '.ABE_ATTRIBUTES')

    local COMMON_ATTRIBUTES=$(echo ${ABE_ATTRIBUTES} | jq -r '.COMMON_ATTRIBUTES')
    local AUTHORITY_ATTRIBUTES=$(echo ${ABE_ATTRIBUTES} | jq -r '.AUTHORITY_ATTRIBUTES')

    # Login with Vault as Org
    local ORG_VAULT_TOKEN=$(curl -k --location --request POST ''${VAULT_ADDRESS}'/v1/auth/userpass/login/'${ORG_NAME}'' \
      --header 'Content-Type: application/json' \
      --data-raw '{
    "password": "'${ORG_PW}'"
    }' | jq -r .auth.client_token)

    # System Key Generation (per Org)
    curl -k --location --request POST ''${VAULT_ADDRESS}'/v1/'${ORG_VAULT_DOMAIN}'/syskeygen/SA/'${ORG_NAME}'' \
      --header 'X-Vault-Token: '${ORG_VAULT_TOKEN}'' \
      --header 'Content-Type: text/plain'

    # Initialize the Organization's Common Attributes
    curl -k --location --request POST ''${VAULT_ADDRESS}'/v1/'${ORG_VAULT_DOMAIN}'/'${ORG_NAME}'/addattributes' \
      --header 'X-Vault-Token: '${ORG_VAULT_TOKEN}'' \
      --header 'Content-Type: text/plain' \
      --data-raw '{
    "commonAttributes": '"${COMMON_ATTRIBUTES}"'
    }'

    # Initialize the Organization's Authority Attributes
    curl -k --location --request POST ''${VAULT_ADDRESS}'/v1/'${ORG_VAULT_DOMAIN}'/'${ORG_NAME}'/addattributes' \
      --header 'X-Vault-Token: '${ORG_VAULT_TOKEN}'' \
      --header 'Content-Type: text/plain' \
      --data-raw '{
    "authorityAttributes": '"${AUTHORITY_ATTRIBUTES}"'
    }'

  done
}

function initialize_vault_user_groups() {

  push_fn "Creating the Vault User Groups"

  load_vault_token "vault_token" "load"

  for row in $(echo "$(cat ${VAULT_VALUES_DIR}/vault_values.json)" | jq -r ".VAULT_USER_GROUPS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local GROUP_NAME=$(_jq '.groupName')
    local GROUP_POLICIES=$(_jq '.groupPolicies[]')

    local GROUP_POLICIES_CONSTRUCTED=""

    for policy in $GROUP_POLICIES; do
      local newPolicy="policies='"$policy"'"
      GROUP_POLICIES_CONSTRUCTED="${GROUP_POLICIES_CONSTRUCTED} ${newPolicy}"
    done

    echo 'set -x

    '${BASE_VAULT_EXPORTS}'
    export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

    vault write identity/group name='"${GROUP_NAME}"' \
    '"${GROUP_POLICIES_CONSTRUCTED}"' \


    unset VAULT_TOKEN
    '${BASE_VAULT_EXPORTS_UNSET}'

    ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

  done

  load_vault_token "vault_token" "unload"

  pop_fn
}

function register_vault_clients() {

  push_fn "Registering the Vault Users (Per Organization)"

  load_vault_token "vault_token" "load"

  declare -a REGISTERED_GUIDS
  declare -a REGISTERED_GUIDS_PASS_COMBINED

  local TYPES=$(jq --raw-output '(. | keys[])' ${ORG_SUBJECTS})

  for type in $TYPES; do

    for organization in $(jq --raw-output '(.'${type}' | keys[])' ${ORG_SUBJECTS}); do

      ORG_ENTITIES=$(jq --raw-output '(.'${type}'.'\"${organization}\"'[])' ${ORG_SUBJECTS})

      for entity in $(echo ${ORG_ENTITIES} | jq -r ". | @base64"); do
        _jq() {
          echo "${entity}" | base64 --decode | jq -r "${1}"
        }

        _constructMetadata() {
          local metadataKVs=${1}
          echo $(echo $metadataKVs | jq 'keys[] as $k | "metadata='${organization,,}'_\($k)=\(.[$k]|tostring)"')
        }

        local ENTITY_IDENTIFIER=$(_jq '.identifier')
        local ENTITY_GUID=$(_jq '.guid')
        local ENTITY_METADATA=$(_jq '.metadata')
        local ENTITY_VAULT_GROUPS=$(_jq '.vaultGroups[]')

        local CONSTRUCTED_ENTITY_METADATA=$(_constructMetadata "${ENTITY_METADATA}")

        local ENTITY_VAULT_GROUPS_CONSTRUCTED=""
        for groups in $GROUP_POLICIES; do
          local newGroup="member_entity_ids='"$policy"'"
          ENTITY_VAULT_GROUPS_CONSTRUCTED="${ENTITY_VAULT_GROUPS_CONSTRUCTED} ${newGroup}"
        done

        VAULT_CLIENT_USERNAME_GUID=$ENTITY_GUID

        if [[ " ${REGISTERED_GUIDS[*]} " =~ " ${VAULT_CLIENT_USERNAME_GUID} " ]]; then
          for vault_creds in "${REGISTERED_GUIDS_PASS_COMBINED[@]}"; do
            local KNOWN_VAULT_GUID=$(echo "$vault_creds" | cut -f1 -d:)

            if [ $KNOWN_VAULT_GUID == $VAULT_CLIENT_USERNAME_GUID ]; then
              VAULT_CLIENT_PASSWORD=$(echo "$vault_creds" | cut -f2 -d:)
            fi

          done

        else
          VAULT_CLIENT_PASSWORD=$(generate_random_password 10)

          REGISTERED_GUIDS=("${REGISTERED_GUIDS[@]}" "${VAULT_CLIENT_USERNAME_GUID}")
          REGISTERED_GUIDS_PASS_COMBINED=("${REGISTERED_GUIDS_PASS_COMBINED[@]}" "${VAULT_CLIENT_USERNAME_GUID}:${VAULT_CLIENT_PASSWORD}")
        fi

        # Store the User's Vault Username/Password to the appropriate Client's file
        echo $(jq '(.'${type}'.'\"${organization^^}\"'[] | select(.guid == '\"${VAULT_CLIENT_USERNAME_GUID}\"') | .account.vaultCredentials) |= {"username": '\"${VAULT_CLIENT_USERNAME_GUID}\"', "password": '\"${VAULT_CLIENT_PASSWORD}\"'}' ${ORG_SUBJECTS}) >${ORG_SUBJECTS}

        echo 'set -x

          '${BASE_VAULT_EXPORTS}'
          export VAULT_TOKEN="'${VAULT_ROOT_TOKEN}'"

          # Register the Identity
          vault write auth/userpass-'\"${organization,,}\"'/users/'${VAULT_CLIENT_USERNAME_GUID}' \
          password='${VAULT_CLIENT_PASSWORD}'
          
          # Derive the userpass accessor
          # Access Example: vault auth list -format=json | jq -r ''.[\"token/\"]''

          USERPASS_ACCESSOR=$(vault auth list -format=json | jq -r ''.[\"userpass-'\"${organization,,}\"'/\"].accessor'' )

          # Check if an Entity for the `GUID` already exists
          ENTITY_DATA=$(vault read -format=json identity/entity/name/'"${ENTITY_GUID}"' | jq ".data" || echo )

          # An Entity does not exist (Empty ENTITY ID) => Create an Entity
          if [ -z "$ENTITY_DATA" ]
          then
          # Register the Identity`s Entity
            ENTITY_ID=$(vault write -format=json identity/entity \
            name='"${ENTITY_GUID}"' \
            '${CONSTRUCTED_ENTITY_METADATA}' \
            | jq -r ".data.id")
          else
            ENTITY_ID=$(echo $ENTITY_DATA | jq -r ".id")
            
            # UPDATE THE ENTITY`S METADATA
            DERIVED_METADATA=$(echo $ENTITY_DATA | jq ".metadata")
            DERIVED_METADATA=$(echo $DERIVED_METADATA | jq -r '\''keys[] as $k | "metadata=\($k)=\(.[$k]|tostring)"'\'')

            # Update the Entitys`s Metadata
            vault write -format=json identity/entity/id/${ENTITY_ID} \
            '${CONSTRUCTED_ENTITY_METADATA}' \
            ${DERIVED_METADATA}
          fi 

          # Add the User (GUID) to the Entity
          vault write identity/entity-alias name='"${ENTITY_GUID}"' \
          canonical_id=$ENTITY_ID \
          mount_accessor=$USERPASS_ACCESSOR

          # Add the User (GUID) to the Group(s)
          for vaultGroup in '${ENTITY_VAULT_GROUPS}'; do

            GROUP_DATA_ENTITIES_IDs=$(vault read -format=json identity/group/name/${vaultGroup} | jq -r ".data.member_entity_ids" )

            # Append the ENTITY_ID to the already known IDs of the Group
            GROUP_DATA_ENTITIES_IDs=$(echo $GROUP_DATA_ENTITIES_IDs | jq --arg entityId $ENTITY_ID '\''.[.| length] |= . + $entityId '\'')

            GROUP_DATA_ENTITIES_PAYLOAD=""
            for entityId in $(echo $GROUP_DATA_ENTITIES_IDs | jq -r ".[]"); do
              GROUP_DATA_ENTITIES_PAYLOAD="${GROUP_DATA_ENTITIES_PAYLOAD} "member_entity_ids=$entityId""
            done

            # Update the Group
            vault write identity/group name=${vaultGroup} \
            ${GROUP_DATA_ENTITIES_PAYLOAD}

          done

          unset VAULT_TOKEN
          '${BASE_VAULT_EXPORTS_UNSET}'

      ' | exec kubectl -n $NS exec statefulSet/vault -i -- /bin/sh

      done
    done
  done

}

function vault_install() {
  push_fn "Installing Vault"

  kubectl -n ${NS} create -f ${KUBE_TEMPLATES_DIR}/hashicorp_vault/configmap.yaml || log "Vault Configmap already exists"

  kubectl -n ${NS} create -f ${KUBE_TEMPLATES_DIR}/hashicorp_vault/rbac.yaml || log "Vault RBAC already exists"

  kubectl -n ${NS} create -f ${KUBE_TEMPLATES_DIR}/hashicorp_vault/services.yaml || log "Vault Services already exists"

  kubectl -n ${NS} create -f ${KUBE_TEMPLATES_DIR}/hashicorp_vault/statefulset.yaml || log "Vault StatefulSet already exists"

  kubectl -n ${NS} rollout status statefulSet/vault

  pop_fn
}

function initialize_user_abe_attributes() {
  # ORG_SUBJECTS
  for row in $(echo "$(cat ${VAULT_VALUES_DIR}/organizations.json)" | jq -r ".ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local ORG_NAME=$(_jq '.organizationName')
    local ORG_PW=$(_jq '.organizationVaultPW')
    local ORG_VAULT_DOMAIN=$(_jq '.domain')

    # Login with Vault as Org
    local ORG_VAULT_TOKEN=$(curl -k --location --request POST ''${VAULT_ADDRESS}'/v1/auth/userpass/login/'${ORG_NAME}'' \
      --header 'Content-Type: application/json' \
      --data-raw '{
    "password": "'${ORG_PW}'"
    }' | jq -r .auth.client_token)

    local TYPES=$(jq --raw-output '(. | keys[])' ${ORG_SUBJECTS})

    for type in ${TYPES}; do
      push_fn "User Type: ${type}"
      pop_fn

      local ORGANIZATION_CLIENTS=$(jq --arg userType ${type} \
        --arg organization ${ORG_NAME^^} \
        '(.[$userType]."\($organization)")[]' ${ORG_SUBJECTS})

      if [ "$ORGANIZATION_CLIENTS" != null ]; then
        for client in $(echo ${ORGANIZATION_CLIENTS} | jq -r ". | @base64"); do
          _jq() {
            echo "${client}" | base64 --decode | jq -r "${1}"
          }
          local CLIENT_GUID=$(_jq '.guid')
          local CLIENT_ABE_ATTRIBUTES=$(_jq '.abeAttributes')

          local COMMON_CLIENT_ATTRIBUTES=$(echo ${CLIENT_ABE_ATTRIBUTES} | jq -r '.COMMON_ATTRIBUTES')
          local AUTHORITY_CLIENT_ATTRIBUTES=$(echo ${CLIENT_ABE_ATTRIBUTES} | jq -r '.AUTHORITY_ATTRIBUTES')

          curl -k --location --request POST ''${VAULT_ADDRESS}'/v1/'${ORG_VAULT_DOMAIN}'/keygen/'${ORG_NAME}'/'${CLIENT_GUID}'' \
            --header 'X-Vault-Token: '${ORG_VAULT_TOKEN}'' \
            --header 'Content-Type: application/json' \
            --data-raw '{
                  "commonAttributes": '"${COMMON_CLIENT_ATTRIBUTES}"',
                  "authorityAttributes": '"${AUTHORITY_CLIENT_ATTRIBUTES}"'
              }'

        done
      fi
    done
  done

}

function enable_vault_cors() {
  push_fn "Enabling CORS (Vault API)"

  curl -k --location --request PUT ''${VAULT_ADDRESS}'/v1/sys/config/cors' \
    --header 'X-Vault-Token: '${VAULT_ROOT_TOKEN}'' \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "allowed_origins": "*",
    "allowed_headers": "X-Custom-Header"
    }'

  pop_fn
}

function vault_connection() {

  construct_vault_tls

  construct_base_vault_exports

  vault_install

  vault_init

  vault_unseal

  vault_init_abe_plugin

  create_vault_abe_policies

  enable_vault_authentication_methods

  register_vault_organizations

  construct_vault_organization_settings

  initialize_abe_attributes

  create_vault_authenticator_service

  enroll_services_with_vault

  initialize_vault_user_groups

  register_vault_clients

  initialize_user_abe_attributes

  enable_vault_cors
}
