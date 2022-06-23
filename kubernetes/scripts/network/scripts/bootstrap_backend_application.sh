#!/bin/bash

function app_extract_MSP_archives() {
  mkdir -p build/msp
  set -ex

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    PEER_ORG=$(_jq '.name')
    PEER_CA=$(_jq '.certificateAuthorityName')
    PEER_ORG_ADMIN=$(_jq '.orgAdmin')

    kubectl -n $NS exec deploy/${PEER_CA} -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/${PEER_ORG}/msp | tar zxf - -C build/msp

    kubectl -n $NS exec deploy/${PEER_CA} -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/${PEER_ORG}/users/${PEER_ORG_ADMIN}@${PEER_ORG}/msp | tar zxf - -C build/msp

  done
}

function define_domain_bc_peer_details() {
  local proxy_peer_name=$1

  for domain in $(jq -r 'with_entries(select(.key != "PROXY")) | keys | .[]' $ORG_DATA_JSON); do

    local reverse_peer_domain=$(jq --raw-output 'first(.'${domain}'.ORGANIZATIONS[] | select(.peerName=="'$proxy_peer_name'") | .peerDomain)' $ORG_DATA_JSON)

    if [ "${reverse_peer_domain}" ]; then
      echo ${domain,,}:${reverse_peer_domain}
      break
    fi

  done

}

function construct_backend_application_configmap() {
  push_fn "Constructing application connection profiles"

  app_extract_MSP_archives

  mkdir -p build/application/wallet
  mkdir -p build/application/gateways

  local known_peers=()
  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local peer_domain=$(_jq '.peerDomain')
    known_peers+=("${peer_domain}")

  done

  jq --compact-output --null-input '$ARGS.positional' --args "${known_peers[@]}" >build/application/peers.json

  kubectl -n $NS delete configmap app-fabric-peers-backend-v1-map || log "app-fabric-peers-backend-v1-map for the Backend-API is not present - Constructing..."
  kubectl -n $NS create configmap app-fabric-peers-backend-v1-map --from-file=./build/application/peers.json

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local peer_org_name=$(_jq '.name')
    local peer_msp=$(_jq '.msp')
    local peer_name=$(_jq '.peerName')
    local peer_domain=$(_jq '.peerDomain')
    local peer_ca=$(_jq '.certificateAuthorityName')
    local peer_ca_port=$(_jq '.certificateAuthorityPort')
    local peer_tls_ca=$(_jq '.tlsCertificateAuthorityName')
    local app_user=$(_jq '.orgAdmin')
    local network_name=${NETWORK_NAME}

    # Define exposed (internet) values
    local EXPOSED_VALUE=$(jq -r --arg key $peer_ca '.[$key]' ${ORG_DATA_EXPOSED_VALUES})
    local peer_ca_exposed=$(echo $EXPOSED_VALUE | cut -f1 -d/).${INFRASTRUCTURE_ENDPOINT}
    local peer_ca_port_exposed=$(echo $EXPOSED_VALUE | cut -f3 -d/)

    if [[ -z "${peer_ca_port_exposed}" || "${peer_ca_port_exposed}" == "PORT" && "${peer_ca_port_exposed}" != "443" ]]; then
      peer_ca_port_exposed=${INFRASTRUCTURE_HTTPS_PORT}
    fi

    local reverse_peer_domain_info=$(define_domain_bc_peer_details ${peer_name})

    local reverse_domain_bc=$(echo $reverse_peer_domain_info | cut -f1 -d:)
    local reverse_domain_bc_peer_domain=$(echo $reverse_peer_domain_info | cut -f2 -d:)

    local peer_pem=build/msp/organizations/peerOrganizations/${peer_org_name}/msp/tlscacerts/${peer_tls_ca}.pem
    local ca_pem=build/msp/organizations/peerOrganizations/${peer_org_name}/msp/cacerts/${peer_ca}.pem

    echo "$(json_ccp ${peer_org_name} ${peer_msp} ${peer_domain} ${peer_ca} ${peer_ca_port} ${peer_ca_exposed} ${peer_ca_port_exposed} ${network_name} ${peer_pem} ${ca_pem} ${reverse_domain_bc} ${reverse_domain_bc_peer_domain})" >build/application/gateways/${peer_domain}_ccp.json

    local cert=build/msp/organizations/peerOrganizations/${peer_org_name}/users/${app_user}\@${peer_org_name}/msp/signcerts/cert.pem
    local pk=build/msp/organizations/peerOrganizations/${peer_org_name}/users/${app_user}\@${peer_org_name}/msp/keystore/server.key

    echo "$(app_id ${peer_msp} ${cert} ${pk})" >build/application/wallet/${app_user}.id

    kubectl -n $NS delete configmap app-fabric-tls-${peer_org_name}-backend-v1-map || log "app-fabric-tls-v1-map for the Backend-API is not present - Constructing..."
    kubectl -n $NS create configmap app-fabric-tls-${peer_org_name}-backend-v1-map --from-file=./build/msp/organizations/peerOrganizations/${peer_org_name}/msp/tlscacerts

    kubectl -n $NS delete configmap app-fabric-ids-backend-v1-map || log "app-fabric-id-v1-map for the Backend-API is not present - Constructing..."
    kubectl -n $NS create configmap app-fabric-ids-backend-v1-map --from-file=./build/application/wallet

    kubectl -n $NS delete configmap app-fabric-ccp-backend-v1-map || log "app-fabric-id-v1-map for the Backend-API is not present - Constructing..."
    kubectl -n $NS create configmap app-fabric-ccp-backend-v1-map --from-file=./build/application/gateways

    cat <<EOF >build/app-fabric-${peer_domain}-v1-map-backend.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-fabric-${peer_domain}-v1-map-backend
data:
  ${peer_domain}_fabric_data.json: |-
    {
      "fabric_blockchain_domain": "${NETWORK_NAME}",
      "fabric_organization": "${peer_org_name}",
      "fabric_channel": "basechannel",
      "fabric_contracts": "TMSC, PSC, LSC",
      "fabric_wallet_dir": "/fabric/application/wallet",
      "fabric_gateway_dir": "/fabric/application/gateways",
      "fabric_ccp": "${peer_domain}_ccp.json",
      "fabric_gateway_hostport": "${peer_domain}:7051",
      "fabric_gateway_sslHostOverride": "${peer_domain}",
      "fabric_user": "${app_user}",
      "fabric_gateway_tlsCertPath": "/fabric/tlscacerts/${peer_org_name}/${peer_tls_ca}.pem"
    }
EOF

    kubectl -n $NS apply -f build/app-fabric-${peer_domain}-v1-map-backend.yaml

  done

  pop_fn
}

function construct_backend_tls() {
  push_fn "Producing the TLS Certificates for: Backend-API"

  ORG_DETAILS=$(jq 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | select(.owner == "ministry-of-health") | .)' $ORG_DATA_JSON)
  BACKEND_API_CREDS=$(echo ${ORG_DETAILS} | jq -r '.BackendAPICreds')

  BACKEND_API_USERNAME=$(echo $BACKEND_API_CREDS | cut -f1 -d:)
  BACKEND_API_PASSWORD=$(echo $BACKEND_API_CREDS | cut -f2 -d:)

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/ca-ministry-of-health-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client enroll --url https://${BACKEND_API_USERNAME}:${BACKEND_API_PASSWORD}@ca-ministry-of-health --csr.hosts api.${INFRASTRUCTURE_ENDPOINT} --csr.hosts backend-api --mspdir /var/hyperledger/fabric/applications/${BACKEND_API_USERNAME}/msp

    mv /var/hyperledger/fabric/applications/${BACKEND_API_USERNAME}/msp/keystore/*_sk  /var/hyperledger/fabric/applications/${BACKEND_API_USERNAME}/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/${BACKEND_API_USERNAME}/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/ca-ministry-of-health -i -- /bin/sh

  mkdir -p ./build/backend-api

  kubectl -n $NS exec -i deploy/ca-ministry-of-health -c main -- tar cf - . -C /var/hyperledger/fabric/applications/${BACKEND_API_USERNAME}/msp . | tar xf - -C "build/backend-api"

  kubectl delete secret -n $NS backend-api-tls --ignore-not-found
  kubectl create secret generic -n $NS backend-api-tls --from-file=tls.crt="./build/backend-api/signcerts/cert.pem" --from-file=tls.key="./build/backend-api/keystore/key.pem" --from-file=ca.crt="./build/backend-api/cacerts/ca-ministry-of-health.pem"

  pop_fn
}

function backend_application_connection() {

  construct_rabbitmq_settings "Backend-API"
  construct_backend_application_configmap
  construct_backend_tls

  kubectl -n $NS delete -f ${KUBE_TEMPLATES_DIR}/backend-api-deployment.yaml || log "Backend-API deployment not found - Applying..."
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/backend-api-deployment.yaml

}
