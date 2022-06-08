#!/bin/bash

function package_chaincode_for() {
  local org=$1
  local cc_folder="${CC_SRC_PATH}/${CHAINCODE_NAME}"
  local build_folder="build/chaincode"
  local cc_archive="${build_folder}/${CHAINCODE_NAME}.tgz"
  push_fn "Packaging chaincode folder ${cc_folder}"
  pop_fn

  mkdir -p "${build_folder}/${CHAINCODE_NAME}"

  echo 'set -x
    mkdir -p '${build_folder}'/'${CHAINCODE_NAME}'

    client_cert=$(awk '\''NF {sub(/\r/, ""); printf "%s\\n",$0;}'\'' <<< $(cat /var/hyperledger/fabric/organizations/peerOrganizations/'${org}'/chaincodes/cc-'${org}'-'${CHAINCODE_NAME,,}@${org}'/tls/signcerts/cert.pem))
    client_key=$(awk '\''NF {sub(/\r/, ""); printf "%s\\n",$0;}'\'' <<< $(cat /var/hyperledger/fabric/organizations/peerOrganizations/'${org}'/chaincodes/cc-'${org}'-'${CHAINCODE_NAME,,}@${org}'/tls/keystore/server.key))
    root_cert=$(awk '\''NF {sub(/\r/, ""); printf "%s\\n",$0;}'\'' <<< $(cat /var/hyperledger/fabric/organizations/peerOrganizations/'${org}'/chaincodes/cc-'${org}'-'${CHAINCODE_NAME,,}@${org}'/msp/cacerts/ca-'$org'.pem))

    cat <<EOF >'${build_folder}'/'${CHAINCODE_NAME}'/metadata.json
{"type": "external", "label": "'$CHAINCODE_LABEL'"}
EOF

    cat <<EOF >'${build_folder}'/'${CHAINCODE_NAME}'/connection.json 
{"address": "cc-'${CHAINCODE_NAME,,}'-'${org,,}':9999", "dial_timeout": "10s", "tls_required": true, "client_auth_required": true, "client_cert": "${client_cert}", "client_key": "$client_key", "root_cert": "$root_cert"}
EOF

    # peer lifecycle chaincode install build/chaincode/'${CHAINCODE_NAME}'.tgz

  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

  if [ -d "${CC_SRC_PATH}/${CHAINCODE_NAME}/META-INF" ]; then
    push_fn "Found a META-INF folder"
    pop_fn
    push_fn "Copying the META-INF folder to the builder folder"
    cp -a "${CC_SRC_PATH}/${CHAINCODE_NAME}/META-INF" "${build_folder}/${CHAINCODE_NAME}"
    pop_fn
    push_fn "Transferring the META-INF folder to the builder pod"
    tar cf - "${build_folder}/${CHAINCODE_NAME}" | kubectl -n $NS exec -i deploy/${org}-${NETWORK_NAME}-admin-cli -c main -- tar xvf -
    pop_fn
  fi

  echo 'set -x

    if [ -d '${build_folder}/${CHAINCODE_NAME}/META-INF' ]; then
      tar -C '${build_folder}/${CHAINCODE_NAME}' -zcf '${build_folder}/${CHAINCODE_NAME}'/code.tar.gz connection.json META-INF
    else
      tar -C '${build_folder}/${CHAINCODE_NAME}' -zcf '${build_folder}/${CHAINCODE_NAME}'/code.tar.gz connection.json
    fi

    cd '${build_folder}/${CHAINCODE_NAME}'

    tar cfz '${CHAINCODE_NAME}.tgz' metadata.json code.tar.gz

  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

  push_fn "Packaged chaincode folder ${cc_folder}"
  pop_fn
}

function install_chaincode_for() {
  local org=$1
  push_fn "Installing chaincode at organization ${org^^}"

  ORG_PEERS=$(echo $(cat $ORG_DATA_JSON) | jq -c '[ .'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select( .name | contains("'"$org"'")) ]')
  for row in $(echo ${ORG_PEERS} | jq -r ".[] | @base64"); do
    _jq() {
      echo ${row} | base64 --decode | jq -r ${1}
    }
    PEER_DOMAIN=$(_jq '.peerDomain')

    echo 'set -x
    export CORE_PEER_ADDRESS='${PEER_DOMAIN}':7051
    peer lifecycle chaincode install build/chaincode/'${CHAINCODE_NAME}'/'${CHAINCODE_NAME}'.tgz
    ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

  done

  pop_fn
}

function produce_tls_certs() {
  local ORG_NAME=$1
  local CC_NAME=$2
  local ALT_NAME=$3
  local CC_PW=${2}pw
  local ECERTCA_ADMIN=$4
  local TLSCA_ADMIN=$5
  local ECERT_CA=$6

  echo "set -x
  export FABRIC_CA_CLIENT_HOME=/var/hyperledger/${ECERT_CA}-client
  export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem
  
  fabric-ca-client register --id.name $CC_NAME --id.secret $CC_PW --id.type client --url https://$ECERT_CA --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/$ECERT_CA/$ECERTCA_ADMIN/msp
  fabric-ca-client enroll --url https://$CC_NAME:$CC_PW@$ECERT_CA  --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/chaincodes/$CC_NAME@$ORG_NAME/msp
 
  fabric-ca-client register --id.name $CC_NAME --id.secret $CC_PW --id.type client --url https://$ECERT_CA --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/$TLSCA_ADMIN/msp
  fabric-ca-client enroll --url https://$CC_NAME:$CC_PW@$ECERT_CA --csr.hosts $CC_NAME --csr.hosts $ALT_NAME --mspdir /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/chaincodes/$CC_NAME@$ORG_NAME/tls

  cp /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/chaincodes/$CC_NAME@$ORG_NAME/tls/keystore/*_sk /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/chaincodes/$CC_NAME@$ORG_NAME/tls/keystore/server.key
  rm /var/hyperledger/fabric/organizations/peerOrganizations/$ORG_NAME/chaincodes/$CC_NAME@$ORG_NAME/tls/keystore/*_sk
  " | exec kubectl -n $NS exec deploy/$ECERT_CA -i -- /bin/sh

}

function produce_ministry_tls_certs() {
  local ORG_NAME=$1
  local CC_NAME=$2
  local ALT_NAME=$3
  local CC_PW=${2}pw
  local TLSCA_ADMIN_CREDS=$4
  local MINISTRY_TLS_CA=$5

  local TLSCA_ADMIN=$(echo $TLSCA_ADMIN_CREDS | cut -f1 -d:)

  # Register and enroll the Chaincode
  echo "set -x
  export FABRIC_CA_CLIENT_HOME=/var/hyperledger/${MINISTRY_TLS_CA}-client
  export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem
  
  fabric-ca-client register --id.name $CC_NAME --id.secret $CC_PW --id.type client --url https://$MINISTRY_TLS_CA --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/$TLSCA_ADMIN/msp
  fabric-ca-client enroll --url https://$CC_NAME:$CC_PW@$MINISTRY_TLS_CA --csr.hosts $CC_NAME --csr.hosts $ALT_NAME --mspdir /var/hyperledger/fabric/applications/chaincodes/$ORG_NAME/$CC_NAME/tls

  cp /var/hyperledger/fabric/applications/chaincodes/$ORG_NAME/$CC_NAME/tls/keystore/*_sk /var/hyperledger/fabric/applications/chaincodes/$ORG_NAME/$CC_NAME/tls/keystore/server.key
  rm /var/hyperledger/fabric/applications/chaincodes/$ORG_NAME/$CC_NAME/tls/keystore/*_sk
  " | exec kubectl -n $NS exec deploy/$MINISTRY_TLS_CA -i -- /bin/sh

  # Move the produced certificates to the appropriate Org
  kubectl -n $NS exec deploy/$MINISTRY_TLS_CA -- tar cf - /var/hyperledger/fabric/applications/chaincodes/${ORG_NAME}/${CC_NAME} | kubectl -n $NS exec -i deploy/${org}-${NETWORK_NAME}-admin-cli -c main -- tar xf - -C /

}

function launch_chaincode_service() {
  local cc_org=$1
  local cc_id=$2
  local cc_image=$3
  local abe_domain=$4

  push_fn "Launching chaincode container ${cc_image} for organization ${cc_org^^}"

  if [ -z ${CC_CUSTOM_ENV_TEMPLATE} ]; then

    cat ${KUBE_TEMPLATES_DIR}/blockchain-chaincodes/cc-config.yaml |
      sed 's,{{ CHAINCODE_NAME }},'${CHAINCODE_NAME,,}',g' |
      sed 's,{ { CHAINCODE_CCID } },'${cc_id}',g' |
      sed 's,{ { CHAINCODE_IMAGE } },'${cc_image}',g' |
      sed 's,{{ CHAINCODE_ORGANIZATION }},'${cc_org}',g' |
      exec kubectl -n $NS apply -f -

  else

    cat ${CC_CUSTOM_TEMPLATES_DIR}/${CC_CUSTOM_ENV_TEMPLATE}.yaml |
      sed 's,{{ CHAINCODE_NAME }},'${CHAINCODE_NAME,,}',g' |
      sed 's,{ { CHAINCODE_CCID } },'${cc_id}',g' |
      sed 's,{ { CHAINCODE_IMAGE } },'${cc_image}',g' |
      sed 's,{{ CHAINCODE_ORGANIZATION }},'${cc_org}',g' |
      sed 's,{{ ABE_PLUGIN_DOMAIN }},'${abe_domain}',g' |
      exec kubectl -n $NS apply -f -

  fi

  # Create the CC deployment
  cat ${KUBE_TEMPLATES_DIR}/blockchain-chaincodes/cc-template.yaml |
    sed 's,{{ CHAINCODE_NAME }},'${CHAINCODE_NAME,,}',g' |
    sed 's,{ { CHAINCODE_CCID } },'${cc_id}',g' |
    sed 's,{ { CHAINCODE_IMAGE } },'${cc_image}',g' |
    sed 's,{{ CHAINCODE_ORGANIZATION }},'${cc_org}',g' |
    exec kubectl -n $NS apply -f -

  kubectl -n $NS rollout status deploy/cc-${CHAINCODE_NAME,,}-${cc_org}

  pop_fn
}

function stop_chaincode_service() {
  local cc_org=$1
  local cc_id=$2
  local cc_image=$3
  push_fn "Stopping chaincode container ${cc_image} for organization ${org^^}"

  cat ${KUBE_TEMPLATES_DIR}/blockchain-chaincodes/cc-template.yaml |
    sed 's,{{ CHAINCODE_NAME }},'${CHAINCODE_NAME,,}',g' |
    sed 's,{ { CHAINCODE_CCID } },'${cc_id}',g' |
    sed 's,{ { CHAINCODE_IMAGE } },'${cc_image}',g' |
    sed 's,{{ CHAINCODE_ORGANIZATION }},'${cc_org}',g' |
    exec kubectl -n $NS delete -f -

  pop_fn
}

function instantiate_peer_conn_params() {
  local build_folder="build/chaincode"

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    PEER_ORG=$(_jq '.name')
    PEER_CA=$(_jq '.certificateAuthorityName')
    PEER_DOMAIN=$(_jq '.peerDomain')

    mkdir -p "${build_folder}/${CHAINCODE_NAME}/peerConParams/${PEER_ORG}"

    kubectl -n $NS exec -i deploy/${PEER_ORG}-${NETWORK_NAME}-admin-cli -c main -- "cd /var/hyperledger/fabric/organizations/peerOrganizations/${PEER_ORG}/msp/tlscacerts/" && tar cf - "./${PEER_CA}.pem" | tar xf - -C "${build_folder}/${CHAINCODE_NAME}/peerConParams/${PEER_ORG}"

  done

}

function activate_chaincode_for() {
  local org=$1
  local cc_id=$2
  push_fn "Activating chaincode ${CHAINCODE_ID}"

  FIRST_ORDERER=$(jq 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | .ordererDomain)' $ORG_DATA_JSON)
  ORDERER_CA=$(jq 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | .certificateAuthorityName)' $ORG_DATA_JSON)
  ORDERER_OWNER=$(jq 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | .owner)' $ORG_DATA_JSON)

  PEER_DOMAIN=$(jq 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select(.name=="'$org'") | .peerDomain)' $ORG_DATA_JSON)

  echo 'set -x 
  export CORE_PEER_ADDRESS='${PEER_DOMAIN}':7051

  peer lifecycle \
    chaincode approveformyorg \
    --channelID '${CHANNEL_NAME}' \
    --name '${CHAINCODE_NAME}' \
    --version '${CHAINCODE_VERSION}' \
    --package-id '${cc_id}' \
    --signature-policy '${CC_END_POLICY}' '"${PRIVATE_COLLECTION}"' '"${CC_INIT_REQUIRED}"' \
    --sequence '${CHAINCODE_SEQUENCE}' \
    -o '$FIRST_ORDERER':6050 \
    --tls --cafile /var/hyperledger/fabric/organizations/ordererOrganizations/'$ORDERER_OWNER'/msp/tlscacerts/'$ORDERER_CA'.pem

  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

  pop_fn
}

function commit_chaincode() {

  RANDOM_PEER_DOMAIN=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | .peerDomain)' $ORG_DATA_JSON)
  RANDOM_PEER_ORG=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | .name)' $ORG_DATA_JSON)

  echo 'set -x 
  export CORE_PEER_ADDRESS='${RANDOM_PEER_DOMAIN}':7051

  parsePeerConnectionParameters() {
    PEER_CONN_PARMS=()
    PEERS=""
    while [ "$#" -gt 0 ]; do
      PEER_DATA=$1
      PEER_ADDRESS=$(echo $PEER_DATA | cut -f1 -d@)
      PEER_ORG=$(echo $PEER_DATA | cut -f2 -d@)

      PEERS="$PEERS $PEER"
      # TLSINFO="--tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE"
      PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses ${PEER_ADDRESS}:7051 --tlsRootCertFiles /var/hyperledger/fabric/organizations/peerOrganizations/${PEER_ORG}/msp/tlscacerts/ca-${PEER_ORG}.pem"
      # PEER_CONN_PARMS=$PEER_CONN_PARMS $TLSINFO
      shift
    done
    export PEER_CONN_PARMS
    PEERS="$(echo -e "$PEERS" | sed -e '\''s/^[[:space:]]*//'\'')"
  }

  parsePeerConnectionParameters $(echo '${POLICY_ORGS[*]}')

  peer lifecycle \
    chaincode commit \
    --channelID '${CHANNEL_NAME}' \
    --name '${CHAINCODE_NAME}' \
    --version '${CHAINCODE_VERSION}' \
    --sequence '${CHAINCODE_SEQUENCE}' \
    --signature-policy '${CC_END_POLICY}' '"${PRIVATE_COLLECTION}"' '"${CC_INIT_REQUIRED}"' \
    $PEER_CONN_PARMS \
    -o '$FIRST_ORDERER':6050 \
    --tls --cafile /var/hyperledger/fabric/organizations/ordererOrganizations/'$ORDERER_OWNER'/msp/tlscacerts/'$ORDERER_CA'.pem

    unset PEER_CONN_PARMS

  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

}

function query_chaincode() {
  set -x
  echo '
  export CORE_PEER_ADDRESS=attikon-hospital-peer0:7051
  peer lifecycle chaincode querycommitted --channelID '${CHANNEL_NAME}' --name '${CHAINCODE_NAME}'

  peer chaincode query -n '${CHAINCODE_NAME}' -C '${CHANNEL_NAME}' -c '"'$@'"'
  ' | exec kubectl -n $NS exec deploy/attikon-hospital-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash
}

function query_chaincode_metadata() {
  set -x
  local org=${1}
  local args='{"Args":["org.hyperledger.fabric:GetMetadata"]}'

  PEER_DOMAIN=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select(.name=="'$org'") | .peerDomain)' $ORG_DATA_JSON)
  echo '
  export CORE_PEER_ADDRESS='${PEER_DOMAIN}':7051
  peer chaincode query -n '${CHAINCODE_NAME}' -C '${CHANNEL_NAME}' -c '"'$args'"'
  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash
}

function pass_private_collection_to_build() {
  local org=$1
  local build_folder="build/chaincode"

  mkdir -p ${build_folder}/${CHAINCODE_NAME}/private_collection && cp ${PRIVATE_COLLECTION_DIR}/${PRIVATE_COLLECTION_NAME} ${build_folder}/${CHAINCODE_NAME}/private_collection/

  echo '
  mkdir -p /root/'${build_folder}'/'${CHAINCODE_NAME}'/private_collection/
  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

  tar cf - ${build_folder}/${CHAINCODE_NAME}/private_collection/${PRIVATE_COLLECTION_NAME} | kubectl -n $NS exec -i deploy/${org}-${NETWORK_NAME}-admin-cli -c main -- tar xvf -

  echo '  
  mv /root/'${build_folder}'/'${CHAINCODE_NAME}'/private_collection/'${PRIVATE_COLLECTION_NAME}' /root/'${build_folder}'/'${CHAINCODE_NAME}'/private_collection/'${CHAINCODE_NAME}'_private_collection.json
  ' | exec kubectl -n $NS exec deploy/${org}-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

}

function set_chaincode_id() {
  local build_folder="build/chaincode"
  local org=$1

  kubectl -n $NS exec -i deploy/${org}-${NETWORK_NAME}-admin-cli -c main -- tar cf - "build/chaincode/${CHAINCODE_NAME}/${CHAINCODE_NAME}.tgz" | tar xf - -C .

  local cc_sha256=$(shasum -a 256 "$build_folder/${CHAINCODE_NAME}/${CHAINCODE_NAME}.tgz" | tr -s ' ' | cut -d ' ' -f 1)
  CHAINCODE_ID=${CHAINCODE_LABEL}:${cc_sha256}
}

# Package and install the chaincode, but do not activate.
function install_chaincode() {
  local org=${1}

  package_chaincode_for ${org}
  install_chaincode_for ${org}

  set_chaincode_id ${org}
}

# Activate the installed chaincode but do not package/install a new archive.
function activate_chaincode() {
  set -x
  local org=$1

  set_chaincode_id ${org}
  activate_chaincode_for ${org} $CHAINCODE_ID
}

function initCC() {
  FCN_CALL='{"function":"'${CC_INIT_FCN}'","Args":['$CA_DATA_FOR_INIT']}'

  RANDOM_PEER_DOMAIN=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | .peerDomain)' $ORG_DATA_JSON)
  RANDOM_PEER_ORG=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | .name)' $ORG_DATA_JSON)

  RANDOM_ORDERER_DOMAIN=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | .ordererDomain)' $ORG_DATA_JSON)
  RANDOM_ORDERER_CA=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | .certificateAuthorityName)' $ORG_DATA_JSON)
  RANDOM_ORDERER_OWNER=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORDERERS[] | .owner)' $ORG_DATA_JSON)

  echo '
    export CORE_PEER_ADDRESS='${RANDOM_PEER_DOMAIN}':7051

    parsePeerConnectionParameters() {
      PEER_CONN_PARMS=()
      PEERS=""
      while [ "$#" -gt 0 ]; do
        PEER_DATA=$1
        PEER_ADDRESS=$(echo $PEER_DATA | cut -f1 -d@)
        PEER_ORG=$(echo $PEER_DATA | cut -f2 -d@)

        PEERS="$PEERS $PEER"
        # TLSINFO="--tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE"
        PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses ${PEER_ADDRESS}:7051 --tlsRootCertFiles /var/hyperledger/fabric/organizations/peerOrganizations/${PEER_ORG}/msp/tlscacerts/ca-${PEER_ORG}.pem"
        # PEER_CONN_PARMS=$PEER_CONN_PARMS $TLSINFO
        shift
      done
      export PEER_CONN_PARMS
      PEERS="$(echo -e "$PEERS" | sed -e '\''s/^[[:space:]]*//'\'')"
    }

    parsePeerConnectionParameters $(echo '${POLICY_ORGS[*]}')

    peer chaincode \
      invoke \
      --isInit -c '\'''${FCN_CALL}''\'' \
      -o '${RANDOM_ORDERER_DOMAIN}':6050 \
      --tls --cafile /var/hyperledger/fabric/organizations/ordererOrganizations/'$RANDOM_ORDERER_OWNER'/msp/tlscacerts/'$RANDOM_ORDERER_CA'.pem \
      -n '${CHAINCODE_NAME}' \
      -C '${CHANNEL_NAME}' \
      $PEER_CONN_PARMS

    ' | exec kubectl -n $NS exec deploy/$RANDOM_PEER_ORG-${NETWORK_NAME}-admin-cli -c main -i -- /bin/bash

}

function priv_collection_init() {
  if [ ! $PRIVATE_COLLECTION_NAME = null ]; then
    local build_folder="build/chaincode"
    org=${1}
    log "Chaincode ${CHAINCODE_NAME} utilizes a Private Collection"
    push_fn "Passing the Private Collection configuration to the build instance"

    pass_private_collection_to_build ${org}
    PRIVATE_COLLECTION='--collections-config ~/'${build_folder}'/'${CHAINCODE_NAME}'/private_collection/'${CHAINCODE_NAME}'_private_collection.json'

    pop_fn
  fi
}

function create_chaincode_service_account() {
  local ACCOUNT_NAME=${1}
  kubectl -n ${NS} create serviceaccount ${ACCOUNT_NAME} || echo "Service Account ${ROLE_NAME} already exists"
}

# BASE FUNCTIONS
function export_chaincode_init_information() {
  CHAINCODE_ORGANIZATION=$1
  CHAINCODE_NAME=$2
  CHAINCODE_ID=$3

  # Check if file exists
  if [ ! -f "${CC_INIT_INFO_JSON}" ]; then
    touch ${CC_INIT_INFO_JSON}
  fi

  # Check if empty file
  if [[ -z $(grep '[^[:space:]]' "${CC_INIT_INFO_JSON}") ]]; then
    echo "{}" >${CC_INIT_INFO_JSON}
  fi

  # If `CHAINCODE_IDS` key does not exist, append it to the JSON file
  if [ ! echo $(cat "${CC_INIT_INFO_JSON}") | jq --exit-status '.CHAINCODE_IDS' ] >/dev/null; then
    jq -n '{CHAINCODE_IDS: {}}' >${CC_INIT_INFO_JSON}
  fi

  jq '.CHAINCODE_IDS. "'${CHAINCODE_ORGANIZATION}'" |= . + {"'$CHAINCODE_NAME'": "'$CHAINCODE_ID'"}' ${CC_INIT_INFO_JSON} >tmp.json &&
    mv tmp.json ${CC_INIT_INFO_JSON}
}

function deploy_chaincode() {

  for row in $(echo "$(cat $CC_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }
    PRIVATE_COLLECTION=""

    local CC_ORGS=$(_jq '.CC_ORGANIZATIONS | values | .[]')
    CHAINCODE_NAME=$(_jq '.CC_NAME')
    CHAINCODE_LABEL=$(_jq '.CC_LABEL')
    CHAINCODE_IMAGE=$(_jq '.CC_IMAGE')
    CHAINCODE_VERSION=$(_jq '.CC_VERSION')
    CHAINCODE_SEQUENCE=$(_jq '.CC_SEQUENCE')
    POLICY_ORGS=$(_jq '.POLICY_ORGS | values | .[]')
    CC_END_POLICY=('"'$(_jq '.CC_END_POLICY')'"')
    PRIVATE_COLLECTION_NAME=$(_jq '.PRIVATE_COLLECTION_NAME')
    CC_INIT_REQUIRED=$(_jq '.INIT_REQUIRED')
    CC_INIT_FCN=$(_jq '.CC_INIT_FCN')
    CC_INIT_DATA=$(_jq '.CC_INIT_DATA[]?')
    CC_CUSTOM_ENV_TEMPLATE=$(_jq '.DEPLOYMENT_CUSTOM_ENV_TEMPLATE')
    local CC_MINISTRY_TLS_REQUIRED=$(_jq '.MINISTRY_TLS_REQUIRED')
    local CC_MINISTRY_TLS_CA=$(_jq '.MINISTRY_TLS_CA')
    local CC_MINISTRY_TLS_CA_CREDS=$(_jq '.MINISTRY_TLS_CA_CREDS')
    local ABE_PLUGIN_DOMAIN=$(_jq '.ABE_PLUGIN_DOMAIN')

    push_fn "Will install chaincode ${CHAINCODE_NAME} at channel ${CHANNEL_NAME}"
    pop_fn

    for org in ${CC_ORGS[@]}; do
      local CA_DATA_NETWORK="PROXY"

      local PEER_CACERT_ADMIN=$(jq --raw-output 'first(.'${CA_DATA_NETWORK^^}'.ORGANIZATIONS[] | select(.name=="'$org'") | .RCAAdmin)' $ORG_DATA_JSON)
      local PEER_TLSCA_ADMIN=$(jq --raw-output 'first(.'${CA_DATA_NETWORK^^}'.ORGANIZATIONS[] | select(.name=="'$org'") | .TLSCACreds)' $ORG_DATA_JSON)
      local PEER_CA=$(jq --raw-output 'first(.'${NETWORK_NAME^^}'.ORGANIZATIONS[] | select(.name=="'$org'") | .certificateAuthorityName)' $ORG_DATA_JSON)

      local cacertAdminUser=$(echo $PEER_CACERT_ADMIN | cut -f1 -d:)
      local tlsCAAdminUser=$(echo $PEER_TLSCA_ADMIN | cut -f1 -d:)

      produce_tls_certs $org "cc-$org-${CHAINCODE_NAME,,}" "cc-${CHAINCODE_NAME,,}-$org" $cacertAdminUser $tlsCAAdminUser $PEER_CA

      if ${CC_MINISTRY_TLS_REQUIRED}; then
        produce_ministry_tls_certs $org "cc-$org-${CHAINCODE_NAME,,}" "cc-${CHAINCODE_NAME,,}-$org" $CC_MINISTRY_TLS_CA_CREDS $CC_MINISTRY_TLS_CA
      fi

      install_chaincode $org
      create_chaincode_service_account "cc-${CHAINCODE_NAME,,}-$org"
      launch_chaincode_service $org $CHAINCODE_ID $CHAINCODE_IMAGE $ABE_PLUGIN_DOMAIN
      priv_collection_init $org
      activate_chaincode $org

      export_chaincode_init_information $org $CHAINCODE_NAME $CHAINCODE_ID
    done

    commit_chaincode

    if [ ! ${CC_INIT_FCN} = null ]; then
      push_fn "Init is required, proceeding"
      if [ $CHAINCODE_NAME = 'TMSC' ]; then
        generateInitDataForTMSC ${CC_INIT_DATA}
        push_fn "Initializing"
        initCC
        sleep 5
        push_fn "Successfuly initialized"
      fi
      pop_fn
    fi

    for org in ${CC_ORGS[@]}; do
      push_fn "Querying chaincode ${CHAINCODE_NAME} as ${org^^}"
      query_chaincode_metadata ${org}
      pop_fn
    done

    push_fn "Successfuly installed chaincode ${CHAINCODE_NAME} at channel ${CHANNEL_NAME}"
    pop_fn

  done

}

function stop_chaincode() {
  CHAINCODE_NAME=${1^^}

  CC_DATA=$(jq ''".${NETWORK_NAME^^}[]"' | select (.CC_NAME=="'${CHAINCODE_NAME}'")' "$CC_DATA_JSON")

  local CC_ORGS=$(echo "${CC_DATA}" | jq --raw-output '.CC_ORGANIZATIONS | values | .[]')
  CHAINCODE_IMAGE=$(echo "${CC_DATA}" | jq '.CC_IMAGE')

  for org in ${CC_ORGS[@]}; do
    local cc_id=$(jq '.CHAINCODE_IDS.'\"${org}\"'.'\"${CHAINCODE_NAME}\"'' ${CC_INIT_INFO_JSON})

    stop_chaincode_service $org $cc_id $CHAINCODE_IMAGE

  done
}

function start_chaincode() {
  CHAINCODE_NAME=${1^^}
  CC_DATA=$(jq ''".${NETWORK_NAME^^}[]"' | select (.CC_NAME=="'${CHAINCODE_NAME}'")' "$CC_DATA_JSON")

  local CC_ORGS=$(echo "${CC_DATA}" | jq --raw-output '.CC_ORGANIZATIONS | values | .[]')
  CHAINCODE_IMAGE=$(echo "${CC_DATA}" | jq --raw-output '.CC_IMAGE')
  CC_CUSTOM_ENV_TEMPLATE=$(echo "${CC_DATA}" | jq --raw-output '.DEPLOYMENT_CUSTOM_ENV_TEMPLATE')

  local ABE_PLUGIN_DOMAIN=$(echo "${CC_DATA}" | jq --raw-output '.ABE_PLUGIN_DOMAIN')

  for org in ${CC_ORGS[@]}; do
    local cc_id=$(jq '.CHAINCODE_IDS.'\"${org}\"'.'\"${CHAINCODE_NAME}\"'' ${CC_INIT_INFO_JSON})

    launch_chaincode_service $org $cc_id $CHAINCODE_IMAGE $ABE_PLUGIN_DOMAIN

  done
}
