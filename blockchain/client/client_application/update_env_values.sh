#!/bin/bash

CLIENT_ENV_FILE=${CLIENT_ENV_FILE:-client/.env}
BACKEND_ENV_FILE=${BACKEND_ENV_FILE:-backend/express/.env}

function define_client_infrastructure_endpoint() {

    INFRASTRUCTURE_ENDPOINT=$(grep REACT_APP_INFRASTRUCTURE_ENDPOINT ${CLIENT_ENV_FILE} | cut -d '=' -f2)
    if [[ -n "${INFRASTRUCTURE_ENDPOINT}" && ${INFRASTRUCTURE_ENDPOINT} != "XXX.XXX.XXX.XXX" ]]; then
        printf "Client: INFRASTRUCTURE_ENDPOINT was set to ${INFRASTRUCTURE_ENDPOINT}\n"
        printf "Client: To change the value, update the REACT_APP_INFRASTRUCTURE_ENDPOINT value in the '${CLIENT_ENV_FILE}' file\n"
    else
        printf "Client: INFRASTRUCTURE_ENDPOINT was not set\n"
        printf "Client: Automatically setting the INFRASTRUCTURE_ENDPOINT\n"
        INFRASTRUCTURE_ENDPOINT=$(curl -s -X GET https://checkip.amazonaws.com).nip.io
        sed -i '/^REACT_APP_INFRASTRUCTURE_ENDPOINT=/s/=.*/='"${INFRASTRUCTURE_ENDPOINT}"'/' ${CLIENT_ENV_FILE}
        printf "Client: INFRASTRUCTURE_ENDPOINT was automatically set to $INFRASTRUCTURE_ENDPOINT\n"
        printf "Client: To change the value, update the REACT_APP_INFRASTRUCTURE_ENDPOINT value in the '${CLIENT_ENV_FILE}' file\n"
    fi

}

function define_backend_infrastructure_endpoint() {
    INFRASTRUCTURE_ENDPOINT=$(grep INFRASTRUCTURE_ENDPOINT ${BACKEND_ENV_FILE} | cut -d '=' -f2)
    if [[ -n "${INFRASTRUCTURE_ENDPOINT}" && ${INFRASTRUCTURE_ENDPOINT} != "XXX.XXX.XXX.XXX" ]]; then
        printf "Backend: INFRASTRUCTURE_ENDPOINT was set to ${INFRASTRUCTURE_ENDPOINT}\n"
        printf "Backend: To change the value, update the INFRASTRUCTURE_ENDPOINT value in the '${BACKEND_ENV_FILE}' file\n"
    else
        printf "Backend: INFRASTRUCTURE_ENDPOINT was not set\n"
        printf "Backend: Automatically setting the INFRASTRUCTURE_ENDPOINT\n"
        INFRASTRUCTURE_ENDPOINT=$(curl -s -X GET https://checkip.amazonaws.com).nip.io
        sed -i '/^INFRASTRUCTURE_ENDPOINT=/s/=.*/='"${INFRASTRUCTURE_ENDPOINT}"'/' ${BACKEND_ENV_FILE}
        printf "Backend: INFRASTRUCTURE_ENDPOINT was automatically set to $INFRASTRUCTURE_ENDPOINT\n"
        printf "Client: To change the value, update the INFRASTRUCTURE_ENDPOINT value in the '${BACKEND_ENV_FILE}' file\n"
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
