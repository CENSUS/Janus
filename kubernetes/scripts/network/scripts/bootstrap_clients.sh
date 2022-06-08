#!/bin/bash

function register_org_clients() {
    local account=$1
    local password=$2
    local GID=$3
    local ecertca=$4
    local rcaAdmin=$5

    local rcaAdminUser=$(echo $rcaAdmin | cut -f1 -d:)

    # User Information
    local role=$(echo "$account" | jq '."role"')
    local username=$(echo "$account" | jq '."username"')

    echo 'set -x
      fabric-ca-client register \
        --id.name '${username}' \
        --id.secret '${password}' \
        --id.type client \
        --id.attrs "ROLE_'${role^^}'='${role^^}':ecert" \
        --id.attrs "GID='${GID}':ecert" \
        --url https://'${ecertca}' \
        --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem \
        --mspdir $FABRIC_CA_CLIENT_HOME/tls-ca/'${rcaAdminUser}'/msp
      ' | exec kubectl -n $NS exec deploy/${ecertca} -i -- /bin/sh

}

function register_system_clients() {
    local account=$1
    local password=$2
    local role=$3
    local ecertca=$4
    local rcaAdmin=$5
    local idType=$6

    local caAdminUsername=$(echo $account | cut -f1 -d:)
    local rcaAdminUser=$(echo $rcaAdmin | cut -f1 -d:)

    echo 'set -x
      fabric-ca-client register \
        --id.name '${caAdminUsername}' \
        --id.secret '${password}' \
        --id.type '${idType}' \
        --id.attrs "ROLE_'${role}'='${role}':ecert" \
        --url https://'${ecertca}' \
        --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem \
        --mspdir $FABRIC_CA_CLIENT_HOME/tls-ca/'${rcaAdminUser}'/msp
      ' | exec kubectl -n $NS exec deploy/${ecertca} -i -- /bin/sh
}

function bootstrap_clients() {

    for row in $(echo "$(cat ${ORG_DATA_JSON})" | jq -r ".PROXY.ORGANIZATIONS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        local ORGANIZATION=$(_jq '.name')
        local ECERT_CA=$(_jq '.certificateAuthorityName')
        local RCAADMIN=$(_jq '.RCAAdmin')
        local TLSCCACreds=$(_jq '.TLSCACreds')

        local TYPES=$(jq --raw-output '(. | keys[])' ${ORG_SUBJECTS})

        # CA-ADMIN
        push_fn "Registering a CA-Admin for organization ${ORGANIZATION^^}"
        local CAADMIN_DETAILS=$(_jq '.caAdmin')
        local CAADMIN_USERNAME=$(echo "$CAADMIN_DETAILS" | cut -f1 -d:)
        local GENERATED_PASSWORD=$(generate_random_password 10)

        register_system_clients "${CAADMIN_DETAILS}" "${GENERATED_PASSWORD}" "CA-ADMIN" ${ECERT_CA} ${RCAADMIN} "admin" &&
            echo $(jq '(.PROXY.ORGANIZATIONS[] | select(.name == '\"${ORGANIZATION}\"') | .caAdmin) |= '\"${CAADMIN_USERNAME}:${GENERATED_PASSWORD}\"'' ${ORG_DATA_JSON}) >${ORG_DATA_JSON} || log "A CA-Admin is already registered"

        pop_fn

        # AUDITOR
        push_fn "Registering an Auditor for organization ${ORGANIZATION^^}"
        local AUDITOR_DETAILS=$(_jq '.auditor')
        local AUDITOR_USERNAME=$(echo "$AUDITOR_DETAILS" | cut -f1 -d:)
        local GENERATED_PASSWORD=$(generate_random_password 10)

        register_system_clients "${AUDITOR_DETAILS}" "${GENERATED_PASSWORD}" "AUDITOR" ${ECERT_CA} ${RCAADMIN} "client" &&
            echo $(jq '(.PROXY.ORGANIZATIONS[] | select(.name == '\"${ORGANIZATION}\"') | .auditor) |= '\"${AUDITOR_USERNAME}:${GENERATED_PASSWORD}\"'' ${ORG_DATA_JSON}) >${ORG_DATA_JSON} || log "An Auditor is already registered"

        pop_fn

        # CLIENTS
        for type in $TYPES; do

            local orgHasType=$(jq --raw-output '(.'${type}')' ${ORG_SUBJECTS} | jq 'has('\"${ORGANIZATION^^}\"')')

            if [ $orgHasType == true ]; then

                push_fn "Registering the Clients of organization ${ORGANIZATION^^} (Type: ${type^^})"

                local ORG_ENTITIES=$(jq --raw-output '(.'${type}'.'\"${ORGANIZATION^^}\"'[])' ${ORG_SUBJECTS})

                for entity in $(echo ${ORG_ENTITIES} | jq -r ". | @base64"); do
                    _jq() {
                        echo "${entity}" | base64 --decode | jq -r "${1}"
                    }

                    local IDENTIFIER=$(_jq '.identifier')
                    local ENTITY_GUID=$(_jq '.guid')
                    local ACCOUNT_DETAILS=$(_jq '.account')

                    local username=$(echo "$ACCOUNT_DETAILS" | jq '."username"')
                    local GENERATED_PASSWORD=$(generate_random_password)

                    register_org_clients "${ACCOUNT_DETAILS}" "${GENERATED_PASSWORD}" ${ENTITY_GUID} ${ECERT_CA} ${RCAADMIN} &&
                        echo $(jq '(.'${type}'.'\"${ORGANIZATION^^}\"'[] | select(.identifier == '\"${IDENTIFIER}\"') | .account.password) |= '\"${GENERATED_PASSWORD}\"'' ${ORG_SUBJECTS}) >${ORG_SUBJECTS} || log "${username} is already registered"

                    # register_org_clients "${ACCOUNT_DETAILS}" "${GENERATED_PASSWORD}" ${ENTITY_GUID} ${ECERT_CA} ${RCAADMIN} || log "${username} is already registered"

                    # echo $(jq '(.'${type}'.'\"${ORGANIZATION^^}\"'[] | select(.identifier == '\"${IDENTIFIER}\"') | .account.password) |= '\"${GENERATED_PASSWORD}\"'' ${ORG_SUBJECTS}) >${ORG_SUBJECTS}

                done

                pop_fn

            fi

        done

    done
}
