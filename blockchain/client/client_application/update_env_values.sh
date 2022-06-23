#!/bin/bash

source ./../../../kubernetes/scripts/network/scripts/init_values.sh
CLIENT_ENV_FILE=${CLIENT_ENV_FILE:-client/.env}
BACKEND_ENV_FILE=${BACKEND_ENV_FILE:-backend/express/.env}

function set_infrastructure_port() {

    BASE_INFRASTRUCTURE_HTTPS_PORT=$(jq -r .HTTPS_PORT ${NETWORK_CONFIG})
    if [[ -n "${BASE_INFRASTRUCTURE_HTTPS_PORT}" && ${BASE_INFRASTRUCTURE_HTTPS_PORT} != "80" ]]; then
        printf "INFRASTRUCTURE PORT was set to ${BASE_INFRASTRUCTURE_HTTPS_PORT}\n"
        INFRASTRUCTURE_ENDPOINT="${INFRASTRUCTURE_ENDPOINT}:${BASE_INFRASTRUCTURE_HTTPS_PORT}"
        printf "Client: To change the value, update the PORT key in the '${NETWORK_CONFIG}' file\n"
    fi

}

function define_client_infrastructure_endpoint() {
    echo "HERE ${NETWORK_CONFIG}"

    BASE_INFRASTRUCTURE_ENDPOINT=$(jq -r .PUBLIC_IP ${NETWORK_CONFIG})
    if [[ -n "${BASE_INFRASTRUCTURE_ENDPOINT}" && ${BASE_INFRASTRUCTURE_ENDPOINT} != "XXX.XXX.XXX.XXX.nip.io" ]]; then
        INFRASTRUCTURE_ENDPOINT=${BASE_INFRASTRUCTURE_ENDPOINT}
        set_infrastructure_port
        printf "Client: INFRASTRUCTURE_ENDPOINT was set to ${INFRASTRUCTURE_ENDPOINT}\n"
        printf "Client: To change the value, update the PUBLIC_IP/PORT key in the '${NETWORK_CONFIG}' file\n"
    else
        printf "Client: Automatically setting the INFRASTRUCTURE_ENDPOINT\n"
        INFRASTRUCTURE_ENDPOINT=$(curl -s -X GET https://checkip.amazonaws.com).nip.io
        set_infrastructure_port
        sed -i '/^REACT_APP_INFRASTRUCTURE_ENDPOINT=/s/=.*/='"${INFRASTRUCTURE_ENDPOINT}"'/' ${CLIENT_ENV_FILE}
        printf "Client: INFRASTRUCTURE_ENDPOINT was automatically set to ${INFRASTRUCTURE_ENDPOINT}\n"
        printf "Client: To change the value, update the PUBLIC_IP/PORT key in the '${NETWORK_CONFIG}' file\n"
    fi

}

function define_backend_infrastructure_endpoint() {

    BASE_INFRASTRUCTURE_ENDPOINT=$(jq -r .PUBLIC_IP ${NETWORK_CONFIG})
    if [[ -n "${BASE_INFRASTRUCTURE_ENDPOINT}" && ${BASE_INFRASTRUCTURE_ENDPOINT} != "XXX.XXX.XXX.XXX.nip.io" ]]; then
        INFRASTRUCTURE_ENDPOINT=${BASE_INFRASTRUCTURE_ENDPOINT}
        set_infrastructure_port
        printf "Backend: INFRASTRUCTURE_ENDPOINT was set to ${INFRASTRUCTURE_ENDPOINT}\n"
        printf "Backend: To change the value, update the PUBLIC_IP/PORT key in the '${NETWORK_CONFIG}' file\n"
    else
        printf "Backend: Automatically setting the INFRASTRUCTURE_ENDPOINT\n"
        INFRASTRUCTURE_ENDPOINT=$(curl -s -X GET https://checkip.amazonaws.com).nip.io
        set_infrastructure_port
        sed -i '/^INFRASTRUCTURE_ENDPOINT=/s/=.*/='"${INFRASTRUCTURE_ENDPOINT}"'/' ${BACKEND_ENV_FILE}
        printf "Backend: INFRASTRUCTURE_ENDPOINT was automatically set to ${INFRASTRUCTURE_ENDPOINT}\n"
        printf "Backend: To change the value, update the PUBLIC_IP/PORT key in the '${NETWORK_CONFIG}' file\n"
    fi

}

function revert_changes() {

    printf "Reverting changes\n"
    sed -i '/^REACT_APP_INFRASTRUCTURE_ENDPOINT=/s/=.*/=XXX.XXX.XXX.XXX/' ${CLIENT_ENV_FILE}
    sed -i '/^INFRASTRUCTURE_ENDPOINT=/s/=.*/=XXX.XXX.XXX.XXX/' ${BACKEND_ENV_FILE}

}

if [ "${#}" -eq 1 ]; then
    if [ "${1}" == "define" ]; then
        printf "Updating the Client and Backend Infrastructure endpoints\n"
        define_client_infrastructure_endpoint
        define_backend_infrastructure_endpoint
        printf "Done"
    elif [ "${1}" == "revert" ]; then
        printf "Reverting Infrastructure endpoints changes\n"
        revert_changes
        printf "Done"
    fi
else
    echo "Illegal number of parameters" >&2
fi
