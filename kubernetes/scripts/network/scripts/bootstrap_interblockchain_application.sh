#!/bin/bash

function app_extract_MSP_archives_interbc() {
  mkdir -p build/interbc/msp
  set -ex

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    PEER_ORG=$(_jq '.name')
    PEER_CA=$(_jq '.certificateAuthorityName')
    PEER_ORG_ADMIN=$(_jq '.orgAdmin')

    kubectl -n $NS exec deploy/${PEER_CA} -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/${PEER_ORG}/msp | tar zxf - -C build/interbc/msp

    kubectl -n $NS exec deploy/${PEER_CA} -- tar zcf - -C /var/hyperledger/fabric organizations/peerOrganizations/${PEER_ORG}/users/${PEER_ORG_ADMIN}@${PEER_ORG}/msp | tar zxf - -C build/interbc/msp

  done
}

function construct_interblockchain_tls() {
  push_fn "Producing the TLS Certificates for: InterBlockchain-API"

  ORG_DETAILS=$(jq 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | select(.owner == "ministry-of-health") | .)' $ORG_DATA_JSON)
  INTERBLOCKCHAIN_API_CREDS=$(echo ${ORG_DETAILS} | jq -r '.InterblockchainAPICreds')

  INTERBLOCKCHAIN_API_USERNAME=$(echo $INTERBLOCKCHAIN_API_CREDS | cut -f1 -d:)
  INTERBLOCKCHAIN_API_PASSWORD=$(echo $INTERBLOCKCHAIN_API_CREDS | cut -f2 -d:)

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/ca-ministry-of-health-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client enroll --url https://${INTERBLOCKCHAIN_API_USERNAME}:${INTERBLOCKCHAIN_API_PASSWORD}@ca-ministry-of-health --csr.hosts interblockchain-api --mspdir /var/hyperledger/fabric/applications/${INTERBLOCKCHAIN_API_USERNAME}/msp

    mv /var/hyperledger/fabric/applications/${INTERBLOCKCHAIN_API_USERNAME}/msp/keystore/*_sk  /var/hyperledger/fabric/applications/${INTERBLOCKCHAIN_API_USERNAME}/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/${INTERBLOCKCHAIN_API_USERNAME}/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/ca-ministry-of-health -i -- /bin/sh

  mkdir -p ./build/interbc

  kubectl -n $NS exec -i deploy/ca-ministry-of-health -c main -- tar cf - . -C /var/hyperledger/fabric/applications/${INTERBLOCKCHAIN_API_USERNAME}/msp . | tar xf - -C "build/interbc"

  kubectl delete secret -n $NS interbc-api-tls --ignore-not-found
  kubectl create secret generic -n $NS interbc-api-tls --from-file=tls.crt="./build/interbc/signcerts/cert.pem" --from-file=tls.key="./build/interbc/keystore/key.pem" --from-file=ca.crt="./build/interbc/cacerts/ca-ministry-of-health.pem"

  pop_fn
}

function construct_interbc_application_configmap() {
  push_fn "Constructing application connection profiles"

  app_extract_MSP_archives_interbc

  mkdir -p build/interbc/application/wallet
  mkdir -p build/interbc/application/gateways

  local known_peers=()
  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local peer_domain=$(_jq '.peerDomain')
    known_peers+=("${peer_domain}")

  done

  jq --compact-output --null-input '$ARGS.positional' --args "${known_peers[@]}" >build/interbc/application/peers.json

  kubectl -n $NS delete configmap app-fabric-peers-interbc-v1-map || log "app-fabric-peers-interbc-v1-map for the InterBlockchain-API is not present - Constructing..."
  kubectl -n $NS create configmap app-fabric-peers-interbc-v1-map --from-file=./build/interbc/application/peers.json

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

    local reverse_peer_domain_info=$(define_domain_bc_peer_details ${peer_name})

    local reverse_domain_bc=$(echo $reverse_peer_domain_info | cut -f1 -d:)
    local reverse_domain_bc_peer_domain=$(echo $reverse_peer_domain_info | cut -f2 -d:)

    local peer_pem=build/interbc/msp/organizations/peerOrganizations/${peer_org_name}/msp/tlscacerts/${peer_tls_ca}.pem
    local ca_pem=build/interbc/msp/organizations/peerOrganizations/${peer_org_name}/msp/cacerts/${peer_tls_ca}.pem

    echo "$(json_ccp ${peer_org_name} ${peer_msp} ${peer_domain} ${peer_ca} ${peer_ca_port} ${peer_ca_exposed} ${peer_ca_port_exposed} ${network_name} ${peer_pem} ${ca_pem})" >build/interbc/application/gateways/${peer_domain}_${network_name}_ccp.json
    echo "$(json_ccp ${peer_org_name} ${peer_msp} ${reverse_domain_bc_peer_domain} ${peer_ca} ${peer_ca_port} ${peer_ca_exposed} ${peer_ca_port_exposed} ${reverse_domain_bc} ${peer_pem} ${ca_pem})" >build/interbc/application/gateways/${peer_domain}_${reverse_domain_bc}_ccp.json

    local cert=build/interbc/msp/organizations/peerOrganizations/${peer_org_name}/users/${app_user}\@${peer_org_name}/msp/signcerts/cert.pem
    local pk=build/interbc/msp/organizations/peerOrganizations/${peer_org_name}/users/${app_user}\@${peer_org_name}/msp/keystore/server.key

    echo "$(app_id ${peer_msp} ${cert} ${pk})" >build/interbc/application/wallet/${app_user}.id

    kubectl -n $NS delete configmap app-fabric-tls-${peer_org_name}-interbc-v1-map || log "app-fabric-tls-v1-map for the InterBlockchain-API is not present - Constructing..."
    kubectl -n $NS create configmap app-fabric-tls-${peer_org_name}-interbc-v1-map --from-file=./build/interbc/msp/organizations/peerOrganizations/${peer_org_name}/msp/tlscacerts

    kubectl -n $NS delete configmap app-fabric-ids-interbc-v1-map || log "app-fabric-id-v1-map for the InterBlockchain-API is not present - Constructing..."
    kubectl -n $NS create configmap app-fabric-ids-interbc-v1-map --from-file=./build/interbc/application/wallet

    kubectl -n $NS delete configmap app-fabric-ccp-interbc-v1-map || log "app-fabric-id-v1-map for the InterBlockchain-API is not present - Constructing..."
    kubectl -n $NS create configmap app-fabric-ccp-interbc-v1-map --from-file=./build/interbc/application/gateways

    cat <<EOF >build/interbc/app-fabric-${peer_domain}-v1-map-interbc.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-fabric-${peer_domain}-v1-map-interbc
data:
  ${peer_domain}_fabric_data.json: |-
    {
      "fabric_blockchain_domain": "${NETWORK_NAME}, ${reverse_domain_bc}",
      "fabric_organization": "${peer_org_name}",
      "fabric_channel": "basechannel",
      "fabric_${NETWORK_NAME}_contracts": "TMSC, PSC, LSC",
      "fabric_${reverse_domain_bc}_contracts": "KSSC, ACSC",
      "fabric_wallet_dir": "/fabric/application/wallet",
      "fabric_gateway_dir": "/fabric/application/gateways",
      "fabric_ccp_${network_name}": "${peer_domain}_${network_name}_ccp.json",
      "fabric_ccp_${reverse_domain_bc}": "${peer_domain}_${reverse_domain_bc}_ccp.json",
      "fabric_gateway_hostport": "${peer_domain}:7051",
      "fabric_gateway_sslHostOverride": "${peer_domain}",
      "fabric_${reverse_domain_bc}_gateway_hostport": "${reverse_domain_bc_peer_domain}:7051",
      "fabric_${reverse_domain_bc}_gateway_sslHostOverride": "${reverse_domain_bc_peer_domain}",
      "fabric_user": "${app_user}",
      "fabric_gateway_tlsCertPath": "/fabric/tlscacerts/${peer_org_name}/${peer_tls_ca}.pem"
    }
EOF

    kubectl -n $NS apply -f build/interbc/app-fabric-${peer_domain}-v1-map-interbc.yaml

  done

  pop_fn
}

function interblockchain_application_connection() {

  construct_rabbitmq_settings "Interblockchain-API"
  construct_interblockchain_tls
  construct_interbc_application_configmap

  kubectl -n $NS delete -f ${KUBE_TEMPLATES_DIR}/interblockchain-api-deployment.yaml || log "Inter-Blockchain API deployment not found - Applying..."
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/interblockchain-api-deployment.yaml

  kubectl -n $NS rollout status deploy/interblockchain-api

}
