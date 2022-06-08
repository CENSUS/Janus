function generateInitDataForTMSC() {
    local build_folder="build/chaincode"
    local INIT_DATA=$@

    CA_DATA_JSON=$(jq -n '{}')

    for DATA in $INIT_DATA; do
        ORGANIZATION_NAME=$(echo $DATA | cut -f1 -d@)
        ORGANIZATION_MSP=$(echo $DATA | cut -f2 -d@)
        ORGANIZATION_DOMAIN=$(echo $DATA | cut -f3 -d@)

        TLS_CA_CREDS=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select(.name=="'$ORGANIZATION_NAME'") | .TLSCACreds)' $ORG_DATA_JSON)
        local TLSCAUser=$(echo $TLS_CA_CREDS | cut -f1 -d:)

        ecertca=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select(.name=="'$ORGANIZATION_NAME'") | .certificateAuthorityName)' $ORG_DATA_JSON)
        tlsca=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select(.name=="'$ORGANIZATION_NAME'") | .tlsCertificateAuthorityName)' $ORG_DATA_JSON)

        mkdir -p "${build_folder}/${CHAINCODE_NAME}/INIT_DATA/${ORGANIZATION_NAME}"
        INIT_DATA_FOLDER="${build_folder}/${CHAINCODE_NAME}/INIT_DATA/${ORGANIZATION_NAME}"

        # Define the ACL
        local CA_ACL=$(jq -r '.'\"${ORGANIZATION_NAME^^}\"'' ${ACL_INIT_DATA_JSON} | openssl enc -A -base64)

        # Define the Certificate
        kubectl -n $NS exec -i deploy/${ecertca} -c main -- tar cf - "/var/hyperledger/fabric/organizations/peerOrganizations/${ORGANIZATION_NAME}/msp/cacerts/${ecertca}.pem" | tar xf - -C "${INIT_DATA_FOLDER}"

        local CA_CERTIFICATE=$(cat "${INIT_DATA_FOLDER}/var/hyperledger/fabric/organizations/peerOrganizations/${ORGANIZATION_NAME}/msp/cacerts/${ecertca}.pem" | openssl enc -A -base64)

        # Define the CRL
        kubectl -n $NS exec -i deploy/${tlsca} -c main -- tar cf - "/var/hyperledger/${tlsca}-client/tls-ca/${TLSCAUser}/msp/crls/crl.pem" | tar xf - -C "${INIT_DATA_FOLDER}"

        local CA_CRL=$(cat "${INIT_DATA_FOLDER}/var/hyperledger/${tlsca}-client/tls-ca/${TLSCAUser}/msp/crls/crl.pem" | openssl enc -A -base64)

        CA_DATA_JSON=$(jq '.data.'${ORGANIZATION_DOMAIN}' += {"'$ORGANIZATION_NAME'": {"name": "'$ORGANIZATION_NAME'", acl:"'${CA_ACL}'", certificate: "'${CA_CERTIFICATE}'", crl: "'$CA_CRL'", msp: "'$ORGANIZATION_MSP'"}}' <<<${CA_DATA_JSON})
    done

    CA_DATA_FOR_INIT=$(jq -Rs . <<<${CA_DATA_JSON} | jq '. | gsub("[\\n\\t]"; "")')

}
