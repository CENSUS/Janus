BASE_INFRASTRUCTURE_ENDPOINT=$(jq -r .PUBLIC_IP $NETWORK_CONFIG)
if [[ -n "${BASE_INFRASTRUCTURE_ENDPOINT}" && ${BASE_INFRASTRUCTURE_ENDPOINT} != "XXX.XXX.XXX.XXX" && ${BASE_INFRASTRUCTURE_ENDPOINT} != "XXX.XXX.XXX.XXX.nip.io" ]]; then
    INFRASTRUCTURE_ENDPOINT=${BASE_INFRASTRUCTURE_ENDPOINT}
    printf "INFRASTRUCTURE_ENDPOINT was set to ${BASE_INFRASTRUCTURE_ENDPOINT}\n"
    printf "To change the value, update the PUBLIC_IP key in the '${NETWORK_CONFIG}' file\n"
else
    INFRASTRUCTURE_ENDPOINT=$(curl -s -X GET https://checkip.amazonaws.com).nip.io
    printf "INFRASTRUCTURE_ENDPOINT was automatically set to ${INFRASTRUCTURE_ENDPOINT}\n"
    printf "To change the value, update the PUBLIC_IP key in the '${NETWORK_CONFIG}' file\n"
fi

VAULT_ADDRESS=$(echo $(jq -r '.VAULT_ADDRESS' ${VAULT_VALUES_DIR}/organizations.json) | cut -f1 -d%).${INFRASTRUCTURE_ENDPOINT}:${INFRASTRUCTURE_HTTPS_PORT}
