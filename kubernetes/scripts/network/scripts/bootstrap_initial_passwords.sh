#!/bin/bash

DOMAIN_TYPES=$(jq -r 'keys_unsorted[]' ${ORG_DATA_JSON}) # DOMAINS

function update_domain_passwords() {
  ENTITY_TYPE=${1}
  STAKEHOLDER=${2}
  GENERATED_PASSWORD=${3}
  INPUT_NAME=${4}
  IS_ISOLATED=${5}
  USERNAME=${6}

  if [ $ENTITY_TYPE == "ORDERERS" ]; then
    SEARCH_FIELD="owner"
  else
    SEARCH_FIELD="name"
  fi

  if [ $IS_ISOLATED = true ]; then
    for TYPE in $DOMAIN_TYPES; do
      echo $(jq '(.'${TYPE}'.'${ENTITY_TYPE}'[] | select(.'${SEARCH_FIELD}' == '\"${STAKEHOLDER}\"') | .'\"${INPUT_NAME}\"') |= '\"${GENERATED_PASSWORD}\"'' ${ORG_DATA_JSON}) >${ORG_DATA_JSON}
    done
  else
    for TYPE in $DOMAIN_TYPES; do
      echo $(jq '(.'${TYPE}'.'${ENTITY_TYPE}'[] | select(.'${SEARCH_FIELD}' == '\"${STAKEHOLDER}\"') | .'\"${INPUT_NAME}\"') |= '\"${USERNAME}:${GENERATED_PASSWORD}\"'' ${ORG_DATA_JSON}) >${ORG_DATA_JSON}
    done
  fi
}

function init_orderers_passwords() {

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".PROXY.ORDERERS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local STAKEHOLDER=$(_jq '.owner')
    local RCAADMIN=$(_jq '.RCAAdmin')
    local TLSCACreds=$(_jq '.TLSCACreds')

    push_fn "Generating some passwords for ${STAKEHOLDER^^}"
    # ORDERER PASSWORD
    local GENERATED_PASSWORD=$(generate_random_password 25)
    update_domain_passwords "ORDERERS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "ordererPW" true

    # ORDERER ADMIN PASSWORD
    local GENERATED_PASSWORD=$(generate_random_password 25)
    update_domain_passwords "ORDERERS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "ordererAdminUserPW" true

    # RCA ADMIN PASSWORD
    local RCAADMIN_USERNAME=$(echo "$RCAADMIN" | cut -f1 -d:)
    local GENERATED_PASSWORD=$(generate_random_password 15)

    update_domain_passwords "ORDERERS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "RCAAdmin" false ${RCAADMIN_USERNAME}

    # TLS-CA PASSWORD
    local TLSCA_USERNAME=$(echo "$TLSCACreds" | cut -f1 -d:)
    local GENERATED_PASSWORD=$(generate_random_password 15)

    update_domain_passwords "ORDERERS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "TLSCACreds" false ${TLSCA_USERNAME}

    # BACKEND-API CREDENTIALS
    local GENERATED_PASSWORD=$(generate_random_password 15)
    update_domain_passwords "ORDERERS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "BackendAPICreds" false "backendapi"

    # INTER-BLOCKCHAIN-API CREDENTIALS
    local GENERATED_PASSWORD=$(generate_random_password 15)
    update_domain_passwords "ORDERERS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "InterblockchainAPICreds" false "interblockchainapi"

    pop_fn
  done

}

function init_organization_passwords() {

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".PROXY.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local STAKEHOLDER=$(_jq '.name')
    local CAADMIN=$(_jq '.caAdmin')
    local AUDITOR=$(_jq '.auditor')
    local RCAADMIN=$(_jq '.RCAAdmin')
    local TLSCACreds=$(_jq '.TLSCACreds')

    push_fn "Generating some passwords for ${STAKEHOLDER^^}"

    # PEER PASSWORD
    local GENERATED_PASSWORD=$(generate_random_password 25)
    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "peerPW" true

    # CA ADMIN PASSWORD
    local CAADMIN_USERNAME=$(echo "$CAADMIN" | cut -f1 -d:)
    local GENERATED_PASSWORD=$(generate_random_password 15)

    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "caAdmin" false ${CAADMIN_USERNAME}

    # AUDITOR PASSWORD
    local AUDITOR_USERNAME=$(echo "$AUDITOR" | cut -f1 -d:)
    local GENERATED_PASSWORD=$(generate_random_password 15)

    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "auditor" false ${AUDITOR_USERNAME}

    # ORG ADMIN PASSWORD
    local GENERATED_PASSWORD=$(generate_random_password 15)
    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "orgAdminPw" true

    # RCA ADMIN PASSWORD
    local RCAADMIN_USERNAME=$(echo "$RCAADMIN" | cut -f1 -d:)
    local GENERATED_PASSWORD=$(generate_random_password 15)

    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "RCAAdmin" false ${RCAADMIN_USERNAME}

    # TLS-CA PASSWORD
    local TLSCA_USERNAME=$(echo "$TLSCACreds" | cut -f1 -d:)
    local GENERATED_PASSWORD=$(generate_random_password 15)

    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "TLSCACreds" false ${TLSCA_USERNAME}

    # BACKEND-API CREDENTIALS
    local GENERATED_PASSWORD=$(generate_random_password 15)
    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "BackendAPICreds" false "backendapi"

    # INTER-BLOCKCHAIN-API CREDENTIALS
    local GENERATED_PASSWORD=$(generate_random_password 15)
    update_domain_passwords "ORGANIZATIONS" ${STAKEHOLDER} ${GENERATED_PASSWORD} "InterblockchainAPICreds" false "interblockchainapi"

    pop_fn
  done

}

function init_passwords_others() {
  push_fn "Generating DB-API Master Password"

  # DB-API CREDENTIALS
  local DB_API_USERNAME=db-api
  local DB_API_PASSWORD=$(generate_random_password 25)

  update_various_credentials "DB_API" "MASTER_PASS" $DB_API_USERNAME $DB_API_PASSWORD

  pop_fn

  push_fn "Generating DBC-API Master Password"
  # DBC-API CREDENTIALS
  local DBC_API_USERNAME=dbc-api
  local DBC_API_PASSWORD=$(generate_random_password 25)

  update_various_credentials "DBC_API" "MASTER_PASS" $DBC_API_USERNAME $DBC_API_PASSWORD

  pop_fn
}

function bootstrap_passwords() {
  push_fn "Generating the default passwords"
  pop_fn

  init_orderers_passwords
  init_organization_passwords
  init_passwords_others
}
