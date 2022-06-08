#!/bin/bash

function init_namespace() {
    push_fn "Creating namespace \"$NS\""

    kubectl create namespace $NS || true

    pop_fn
}

function init_storage_volumes() {
    push_fn "Provisioning volume storage"

    for filename in "${KUBE_TEMPLATES_DIR}/blockchain-pvcs/common/"*".yaml"; do
        [ -e "$filename" ] || continue
        microk8s.kubectl -n $NS create -f "$filename"
    done

    for filename in "${KUBE_TEMPLATES_DIR}/blockchain-pvcs/$NETWORK_NAME/"*".yaml"; do
        [ -e "$filename" ] || continue
        microk8s.kubectl -n $NS create -f "$filename"
    done

    pop_fn
}

function load_base_configs() {
    # CAs CONFIGS
    declare -a templates_array=(ministry-of-health:ministry/ca-config-ministry-of-health:ORDERERS ministry-of-health:ministry/tls-ca-config-ministry-of-health:ORDERERS attikon-hospital:attikon-hospital/ca-config-attikon-hospital:ORGANIZATIONS general-hospital-of-athens:general-hospital-of-athens/ca-config-general-hospital-of-athens:ORGANIZATIONS medutils:medutils/ca-config-medutils:ORGANIZATIONS healthprods:healthprods/ca-config-healthprods:ORGANIZATIONS)

    for stakeholder_template in "${templates_array[@]}"; do
        local STAKEHOLDER=$(echo $stakeholder_template | cut -f1 -d:)
        local CONFIG_DIR=$(echo $stakeholder_template | cut -f2 -d:)
        local ENTITY_TYPE=$(echo $stakeholder_template | cut -f3 -d:)
        local CONFIG_NAME=$(echo $CONFIG_DIR | cut -f2 -d"/")

        if [ $ENTITY_TYPE == "ORDERERS" ]; then
            SEARCH_FIELD="owner"
        else
            SEARCH_FIELD="name"
        fi

        mkdir -p "./build/templates/cas/${STAKEHOLDER}"

        ORG_DETAILS=$(jq 'first(.'${NETWORK_NAME^^}'.'${ENTITY_TYPE}'[] | select(.'${SEARCH_FIELD}'=="'$STAKEHOLDER'") | .)' $ORG_DATA_JSON)

        TLSCA_ADMIN=$(echo ${ORG_DETAILS} | jq -r '.TLSCACreds')
        RCA_ADMIN=$(echo ${ORG_DETAILS} | jq -r '.RCAAdmin')
        BACKEND_API_CREDS=$(echo ${ORG_DETAILS} | jq -r '.BackendAPICreds')
        INTERBLOCKCHAIN_API_CREDS=$(echo ${ORG_DETAILS} | jq -r '.InterblockchainAPICreds')

        # USERNAMES / PASSWORDS
        TLSCA_ADMIN_USERNAME=$(echo $TLSCA_ADMIN | cut -f1 -d:)
        TLSCA_ADMIN_PASSWORD=$(echo $TLSCA_ADMIN | cut -f2 -d:)

        RCA_ADMIN_USERNAME=$(echo $RCA_ADMIN | cut -f1 -d:)
        RCA_ADMIN_PASSWORD=$(echo $RCA_ADMIN | cut -f2 -d:)

        BACKEND_API_USERNAME=$(echo $BACKEND_API_CREDS | cut -f1 -d:)
        BACKEND_API_PASSWORD=$(echo $BACKEND_API_CREDS | cut -f2 -d:)

        INTERBLOCKCHAIN_API_USERNAME=$(echo $INTERBLOCKCHAIN_API_CREDS | cut -f1 -d:)
        INTERBLOCKCHAIN_API_PASSWORD=$(echo $INTERBLOCKCHAIN_API_CREDS | cut -f2 -d:)

        # END OF USERNAMES / PASSWORDS

        cat ${KUBE_TEMPLATES_DIR}/blockchains/configs/cas/${CONFIG_DIR}.yaml |
            sed 's,{{ TLSCA_ADMIN_USERNAME }},'${TLSCA_ADMIN_USERNAME}',g' |
            sed 's,{{ TLSCA_ADMIN_PASSWORD }},'${TLSCA_ADMIN_PASSWORD}',g' |
            sed 's,{{ RCA_ADMIN_USERNAME }},'${RCA_ADMIN_USERNAME}',g' |
            sed 's,{{ RCA_ADMIN_PASSWORD }},'${RCA_ADMIN_PASSWORD}',g' |
            sed 's,{{ BACKEND_API_USERNAME }},'${BACKEND_API_USERNAME}',g' |
            sed 's,{{ BACKEND_API_PASSWORD }},'${BACKEND_API_PASSWORD}',g' |
            sed 's,{{ INTERBLOCKCHAIN_API_USERNAME }},'${INTERBLOCKCHAIN_API_USERNAME}',g' |
            sed 's,{{ INTERBLOCKCHAIN_API_PASSWORD }},'${INTERBLOCKCHAIN_API_PASSWORD}',g' |
            sed 's,{{ INFRASTRUCTURE_ENDPOINT }},'${INFRASTRUCTURE_ENDPOINT}',g' >./build/templates/cas/${STAKEHOLDER}/${CONFIG_NAME}.yaml

        kubectl -n $NS create configmap ${CONFIG_NAME} --from-file=./build/templates/cas/${STAKEHOLDER}/${CONFIG_NAME}.yaml || true
    done

}

function load_org_config() {
    push_fn "Creating the Fabric Config Maps"

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        ORDERER_OWNER=$(_jq '.owner')

        kubectl -n $NS create configmap ${ORDERER_OWNER}-${NETWORK_NAME}-config --from-file=${KUBE_TEMPLATES_DIR}/blockchains/configs/blockchain_configs/${NETWORK_NAME}/${ORDERER_OWNER} || true

        # Append the configtx to the orderer's config
        kubectl -n $NS create configmap ${ORDERER_OWNER}-${NETWORK_NAME}-config --from-file=${KUBE_TEMPLATES_DIR}/blockchains/configs/blockchain_configs/${NETWORK_NAME}/consortium --dry-run -o yaml | kubectl apply -f - || true
    done

    # Peer configs
    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }
        ORG_NAME=$(_jq '.name')

        kubectl -n $NS create configmap ${ORG_NAME}-${NETWORK_NAME}-config --from-file=${KUBE_TEMPLATES_DIR}/blockchains/configs/blockchain_configs/${NETWORK_NAME}/${ORG_NAME} || true
    done

    pop_fn
}
