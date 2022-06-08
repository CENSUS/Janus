#!/bin/bash

function launch() {
  local yaml=$1
  cat ${yaml} | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' | kubectl -n $NS apply -f -
}

function drop() {
  local yaml=$1
  cat ${yaml} | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' | kubectl -n $NS delete -f -
}

function orderers_switch() {
  local switch_type=$1
  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
    _jq() {
      echo ${row} | base64 --decode | jq -r ${1}
    }
    ORDERER_OWNER=$(_jq '.owner')
    ORDERER_NAME=$(_jq '.ordererName')

    [ $switch_type == "up" ] && push_fn "Launching ${ORDERER_NAME^^} of ${ORDERER_OWNER^^}" || push_fn "Pausing ${ORDERER_NAME^^} of ${ORDERER_OWNER^^}"

    [ $switch_type == "up" ] && launch "${KUBE_TEMPLATES_DIR}/blockchains/${NETWORK_NAME}-blockchain/${ORDERER_NAME}_deploy.yaml" ||
      drop "${KUBE_TEMPLATES_DIR}/blockchains/${NETWORK_NAME}-blockchain/${ORDERER_NAME}_deploy.yaml"

    pop_fn
  done

  if [ $switch_type == "up" ]; then
    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
      _jq() {
        echo ${row} | base64 --decode | jq -r ${1}
      }

      ORDERER_NAME=$(_jq '.ordererName')

      kubectl -n $NS rollout status deploy/${ORDERER_NAME}-$NETWORK_NAME

    done
  fi

}

function peers_switch() {
  local switch_type=$1
  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    ORG_NAME=$(_jq '.name')
    PEER_NAME=$(_jq '.peer')

    [ $switch_type == "up" ] && push_fn "Launching ${PEER_NAME^^} of ${ORG_NAME^^}" || push_fn "Pausing ${PEER_NAME^^} of ${ORG_NAME^^}"

    [ $switch_type == "up" ] && launch "${KUBE_TEMPLATES_DIR}/blockchains/${NETWORK_NAME}-blockchain/${PEER_NAME}_${ORG_NAME}_deploy.yaml" ||
      drop "${KUBE_TEMPLATES_DIR}/blockchains/${NETWORK_NAME}-blockchain/${PEER_NAME}_${ORG_NAME}_deploy.yaml"

    pop_fn

  done

  if [ $switch_type == "up" ]; then
    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
      _jq() {
        echo "${row}" | base64 --decode | jq -r "${1}"
      }

      DEPLOYMENT=$(_jq '.peerDomain')

      kubectl -n $NS rollout status deploy/$DEPLOYMENT
    done
  fi

}

function create_ministry_orderer {
  push_fn "Preparing the Ministry orderer for deployment"
  local org=$1
  local ecertca=ca-${org}

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
    _jq() {
      echo ${row} | base64 --decode | jq -r ${1}
    }
    ORDERER_NAME=$(_jq '.ordererName')
    ORDERER_PW=$(_jq '.ordererPW')
    RCAAdmin=$(_jq '.RCAAdmin')
    TLSAdmin=$(_jq '.TLSCACreds')
    ecertca=$(_jq '.certificateAuthorityName')
    tlsca=$(_jq '.tlsCertificateAuthorityName')

    local rcaAdminUser=$(echo $RCAAdmin | cut -f1 -d:)
    local tlsAdminUser=$(echo $TLSAdmin | cut -f1 -d:)

    echo "set -x
    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/$ecertca-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name ministry-of-health-admin --id.secret ministryofhealthadminpw  --id.type admin   --url https://$ecertca --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/${ecertca}/${rcaAdminUser}/msp --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert"
    fabric-ca-client enroll --url https://ministry-of-health-admin:ministryofhealthadminpw@$ecertca --mspdir /var/hyperledger/fabric/organizations/ordererOrganizations/ministry-of-health/users/Admin@ministry-of-health/msp
  " | exec kubectl -n $NS exec deploy/$ecertca -i -- /bin/sh

    echo "set -x
    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/$ecertca-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name ${ORDERER_NAME} --id.secret ${ORDERER_PW} --id.type orderer --url https://$ecertca --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/$ecertca/${rcaAdminUser}/msp

    fabric-ca-client enroll --url https://${ORDERER_NAME}:${ORDERER_PW}@$ecertca --csr.hosts ${ORDERER_NAME} --csr.hosts ${ORDERER_NAME}-proxy --csr.hosts ${ORDERER_NAME}-medical --csr.hosts ${ORDERER_NAME}-manufacturer --mspdir /var/hyperledger/fabric/organizations/ordererOrganizations/ministry-of-health/orderers/${ORDERER_NAME}/msp

    fabric-ca-client register --id.name ${ORDERER_NAME} --id.secret ${ORDERER_PW} --id.type orderer --url https://$tlsca --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/${tlsAdminUser}/msp

    fabric-ca-client enroll --url https://${ORDERER_NAME}:${ORDERER_PW}@$tlsca --csr.hosts ${ORDERER_NAME} --csr.hosts ${ORDERER_NAME}-proxy --csr.hosts ${ORDERER_NAME}-medical --csr.hosts ${ORDERER_NAME}-manufacturer --mspdir /var/hyperledger/fabric/organizations/ordererOrganizations/ministry-of-health/orderers/${ORDERER_NAME}/tls

    cp /var/hyperledger/fabric/organizations/ordererOrganizations/ministry-of-health/orderers/${ORDERER_NAME}/tls/keystore/*_sk /var/hyperledger/fabric/organizations/ordererOrganizations/ministry-of-health/orderers/${ORDERER_NAME}/tls/keystore/server.key

  echo 'NodeOUs:
      Enable: true
      ClientOUIdentifier:
        Certificate: cacerts/$ecertca.pem
        OrganizationalUnitIdentifier: client
      PeerOUIdentifier:
        Certificate: cacerts/$ecertca.pem
        OrganizationalUnitIdentifier: peer
      AdminOUIdentifier:
        Certificate: cacerts/$ecertca.pem
        OrganizationalUnitIdentifier: admin
      OrdererOUIdentifier:
        Certificate: cacerts/$ecertca.pem
        OrganizationalUnitIdentifier: orderer' > /var/hyperledger/fabric/organizations/ordererOrganizations/ministry-of-health/orderers/${ORDERER_NAME}/msp/config.yaml

    " | exec kubectl -n $NS exec deploy/$ecertca -i -- /bin/sh

  done

  pop_fn
}

function create_peers() {

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local ORG_NAME=$(_jq '.name')
    local PEER_DOMAIN=$(_jq '.peerDomain')
    local PEER_NAME=$(_jq '.peerName')
    local PEER_PW=$(_jq '.peerPW')
    local PEER_CA=$(_jq '.certificateAuthorityName')
    local PEER_TLS_CA=$(_jq '.certificateAuthorityName')
    local ORG_ADMIN=$(_jq '.orgAdmin')
    local ORG_ADMIN_PW=$(_jq '.orgAdminPw')
    local DOMAIN_BLOCKCHAIN=$(_jq '.domainBlockchain')
    local DOMAIN_BLOCKCHAIN=$(_jq '.domainBlockchain')
    local DOMAIN_BLOCKCHAIN=$(_jq '.domainBlockchain')
    local RCAAdmin=$(_jq '.RCAAdmin')
    local TLSAdmin=$(_jq '.TLSCACreds')

    local rcaAdminUser=$(echo $RCAAdmin | cut -f1 -d:)
    local tlsAdminUser=$(echo $TLSAdmin | cut -f1 -d:)

    push_fn "Preparing peer deployment for Peer ${PEER_NAME^^} of ${ORG_NAME^^}"

    echo "set -x
  export FABRIC_CA_CLIENT_HOME=/var/hyperledger/${PEER_CA}-client
  export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem
  # Each identity in the network needs a registration and enrollment.

  fabric-ca-client register --id.name $PEER_NAME --id.secret $PEER_PW \
    --id.type peer --url https://$PEER_CA \
    --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/$PEER_CA/${rcaAdminUser}/msp

  fabric-ca-client register --id.name $ORG_ADMIN --id.secret $ORG_ADMIN_PW \
    --id.type admin   --url https://$PEER_CA \
    --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/$PEER_CA/${rcaAdminUser}/msp \
    --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert"

  fabric-ca-client enroll --url https://$PEER_NAME:$PEER_PW@$PEER_CA \
    --csr.hosts $PEER_NAME --csr.hosts $PEER_NAME-${NETWORK_NAME} --csr.hosts ${PEER_NAME}-${DOMAIN_BLOCKCHAIN} \
    --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/peers/$PEER_NAME.$ORG_NAME/msp

  fabric-ca-client enroll --url https://$ORG_ADMIN:$ORG_ADMIN_PW@$PEER_CA \
    --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/users/$ORG_ADMIN@$ORG_NAME/msp

  # Each node in the network needs a TLS registration and enrollment.
  fabric-ca-client register --id.name $PEER_NAME --id.secret $PEER_PW \
    --id.type peer --url https://$PEER_TLS_CA \
    --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/${tlsAdminUser}/msp

  fabric-ca-client enroll --url https://$PEER_NAME:$PEER_PW@$PEER_TLS_CA \
    --csr.hosts $PEER_NAME --csr.hosts $PEER_NAME-${NETWORK_NAME} --csr.hosts ${PEER_NAME}-${DOMAIN_BLOCKCHAIN} \
    --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/peers/$PEER_NAME.$ORG_NAME/tls

  # Copy the TLS signing keys to a fixed path for convenience when launching the peers
  cp /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/peers/$PEER_NAME.$ORG_NAME/tls/keystore/*_sk /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/peers/$PEER_NAME.$ORG_NAME/tls/keystore/server.key
  cp /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/users/$ORG_ADMIN@$ORG_NAME/msp/keystore/*_sk /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/users/$ORG_ADMIN@$ORG_NAME/msp/keystore/server.key

  # Create local MSP config.yaml
  echo 'NodeOUs:
    Enable: true
    ClientOUIdentifier:
      Certificate: cacerts/$PEER_CA.pem
      OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
      Certificate: cacerts/$PEER_CA.pem
      OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
      Certificate: cacerts/$PEER_CA.pem
      OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
      Certificate: cacerts/$PEER_CA.pem
      OrganizationalUnitIdentifier: orderer' > /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/peers/$PEER_NAME.$ORG_NAME/msp/config.yaml

    cp /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/peers/$PEER_NAME.$ORG_NAME/msp/config.yaml /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/users/$ORG_ADMIN@$ORG_NAME/msp/config.yaml

    " | exec kubectl -n $NS exec deploy/$PEER_CA -i -- /bin/sh

    pop_fn
  done
}

function create_local_MSP() {
  create_ministry_orderer ministry-of-health
  create_peers
}

function base_up() {
  log "Getting the base components up"
  # Kube config
  init_namespace
  init_storage_volumes
  load_base_configs

  # Network TLS CAs
  # launch_TLS_CAs
  launch_CAs

  enroll_bootstrap_TLS_CA_users
  register_enroll_ECert_CA_bootstrap_users

  # Network ECert CAs
  enroll_bootstrap_ECert_CA_users

  # Init CA Data
  generate_crls # Needed by the TMSC Init Fn
}

function needed_by_all_domains() {
  launch_couchdbs
}

function create_configs_and_msps() {
  load_org_config

  if [ ${NETWORK_NAME} == 'proxy' ]; then
    create_local_MSP
  fi
}

function network_up() {
  log "Launching the Blockchain's ${NETWORK_NAME^^} orderer(s) & peer(s)"
  # Launch Network
  orderers_switch "up"
  peers_switch "up"
}

function network_pause() {
  log "Pausing the Blockchain's ${NETWORK_NAME^^} orderer(s) & peer(s)"
  # Launch Network
  orderers_switch "down"
  peers_switch "down"
}

function stop_services() {
  push_fn "Stopping Fabric services"

  kubectl -n $NS delete deployment --all
  kubectl -n $NS delete statefulset --all
  kubectl -n $NS delete pod --all
  kubectl -n $NS delete service --all
  kubectl -n $NS delete configmap --all
  kubectl -n $NS delete secret --all
  kubectl -n $NS delete certificates --all || log "There are no Certificates..."
  kubectl -n $NS delete issuers --all || log "There are no Issuers..."

  pop_fn
}

function purge_pvcs() {
  push_fn "Removing the PVCs"
  kubectl -n $NS delete pvc --all
  pop_fn
}

function network_destroy() {
  stop_services
  purge_pvcs
}
