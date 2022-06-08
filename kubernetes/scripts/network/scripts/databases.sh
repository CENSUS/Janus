#!/bin/bash

function construct_couchdb_tls() {
  local ORG_NAME=${1}
  local PEER_NAME=${2}
  local NETWORK_NAME=${3}
  local TLS_CA=${4}
  local TLS_ADMIN=${5}

  log "Producing the TLS Certificates for: ${ORG_NAME^^} - Peer: ${PEER_NAME^^} - Network: ${NETWORK_NAME^^}"

  local couchDBName=couchdb-${ORG_NAME,,}-${PEER_NAME,,}-${NETWORK_NAME,,}
  local couchDBUser=${ORG_NAME}-${PEER_NAME}-${NETWORK_NAME,,}
  local couchDBPass=${ORG_NAME}-${PEER_NAME}-${NETWORK_NAME,,}-pw

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/${TLS_CA}-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name ${couchDBUser} --id.secret ${couchDBPass} --id.type client --url https://${TLS_CA} --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/${TLS_ADMIN}/msp
    fabric-ca-client enroll --url https://${couchDBUser}:${couchDBPass}@${TLS_CA} --csr.hosts ${couchDBName} --mspdir /var/hyperledger/fabric/applications/${couchDBName}/msp

    mv /var/hyperledger/fabric/applications/${couchDBName}/msp/keystore/*_sk  /var/hyperledger/fabric/applications/${couchDBName}/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/${couchDBName}/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/${TLS_CA} -i -- /bin/sh

  mkdir -p ./build/couchdbs/${ORG_NAME}/${couchDBName}

  kubectl -n $NS exec -i deploy/${TLS_CA} -c main -- tar cf - . -C /var/hyperledger/fabric/applications/${couchDBName}/msp . | tar xf - -C "build/couchdbs/${ORG_NAME}/${couchDBName}"

  kubectl delete secret -n $NS ${couchDBName}-tls --ignore-not-found
  kubectl create secret generic -n $NS ${couchDBName}-tls --from-file=tls.crt="./build/couchdbs/${ORG_NAME}/${couchDBName}/signcerts/cert.pem" --from-file=tls.key="./build/couchdbs/${ORG_NAME}/${couchDBName}/keystore/key.pem" --from-file=ca.crt="./build/couchdbs/${ORG_NAME}/${couchDBName}/cacerts/${TLS_CA}.pem"

}

function construct_ssl_local_ini_file_config() {
  local ORG_NAME=${1}
  local PEER_NAME=${2}
  local NETWORK_NAME=${3}

  kubectl -n $NS create configmap couchdb-config --from-file="${KUBE_TEMPLATES_DIR}/blockchain_peer_databases/configs" || log "CouchDB configmap already exists"
}

function launch_couchdbs() {
  push_fn "Creating the Peer Databases"

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }
    ORG_NAME=$(_jq '.name')
    PEER_NAME=$(_jq '.peer')
    TLS_CA=$(_jq '.tlsCertificateAuthorityName')
    TLSCAAdminCreds=$(_jq '.TLSCACreds')

    local TLSAdminUser=$(echo $TLSCAAdminCreds | cut -f1 -d:)

    # construct_couchdb_tls ${ORG_NAME} ${PEER_NAME} ${NETWORK_NAME^^} ${TLS_CA} ${TLSAdminUser}
    # construct_ssl_local_ini_file_config

    launch "${KUBE_TEMPLATES_DIR}/blockchain_peer_databases/${NETWORK_NAME}/${PEER_NAME}_${ORG_NAME}.yaml"
  done

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }
    ORG_PEER=$(_jq '.peerName')

    kubectl -n $NS rollout status sts/"couchdb-${ORG_PEER}-${NETWORK_NAME}"
  done

  pop_fn
}
