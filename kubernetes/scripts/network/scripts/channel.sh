#!/bin/bash

function define_channel_data() {
    if [ -z $PROPOSED_CHANNEL_NAME ]; then
        push_fn "No channel passed - Defaulting to default channel ${DEFAULT_CHANNEL}"
        PROPOSED_CHANNEL_NAME=${DEFAULT_CHANNEL}
        pop_fn
    fi

    push_fn "Defining channel data for the proposed channel name ${PROPOSED_CHANNEL_NAME^^}"
    pop_fn

    CHANNEL_DATA=$(jq '.'${NETWORK_NAME^^}'.CHANNELS | to_entries[] | select(.key=="'${PROPOSED_CHANNEL_NAME^^}'")? | .value' $ORG_DATA_JSON)
    echo $CHANNEL_DATA

    if [ -z $CHANNEL_DATA ]; then
        log "The proposed channel is not known by the System"
        exit 1
    fi

    CHANNEL_NAME=$(jq --raw-output '.CHANNEL_NAME' <<<$CHANNEL_DATA)
    CHANNEL_PROFILE=$(jq --raw-output '.CHANNEL_PROFILE' <<<$CHANNEL_DATA)

    push_fn "Channel data found | Channel name: ${CHANNEL_NAME} - Channel Profile: ${CHANNEL_PROFILE}"
    pop_fn

}

function create_channel_org_MSP() {
    local org=$1
    local org_type=$2
    local ecert_ca=$3
    local ecertcaadmin=$4
    local tlscaadmin=$5

    local rcaAdminUser=$(echo $ecertcaadmin | cut -f1 -d:)
    local tlsccaAdminUser=$(echo $tlscaadmin | cut -f1 -d:)

    echo "set -x
  mkdir -p /var/hyperledger/fabric/organizations/${org_type}Organizations/${org}/msp/cacerts
  cp \
    "'"$FABRIC_CA_CLIENT_HOME"'"/${ecert_ca}/${rcaAdminUser}/msp/cacerts/${ecert_ca}.pem \
    /var/hyperledger/fabric/organizations/${org_type}Organizations/${org}/msp/cacerts
  
  mkdir -p /var/hyperledger/fabric/organizations/${org_type}Organizations/${org}/msp/tlscacerts
  cp \
    "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/${tlsccaAdminUser}/msp/cacerts/${ecert_ca}.pem \
    /var/hyperledger/fabric/organizations/${org_type}Organizations/${org}/msp/tlscacerts
  
  echo 'NodeOUs:
    Enable: true
    ClientOUIdentifier:
      Certificate: cacerts/${ecert_ca}.pem
      OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
      Certificate: cacerts/${ecert_ca}.pem
      OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
      Certificate: cacerts/${ecert_ca}.pem
      OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
      Certificate: cacerts/${ecert_ca}.pem
      OrganizationalUnitIdentifier: orderer '> /var/hyperledger/fabric/organizations/${org_type}Organizations/${org}/msp/config.yaml
      
  " | exec kubectl -n $NS exec deploy/${ecert_ca} -i -- /bin/sh
}

function create_channel_MSP() {
    push_fn "Creating channel MSP"

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        local ORDERER_ECERTCA=$(_jq '.certificateAuthorityName')
        local ORDERER_OWNER=$(_jq '.owner')
        local RCA_ADMIN=$(_jq '.RCAAdmin')
        local TLSCA_ADMIN=$(_jq '.TLSCACreds')

        create_channel_org_MSP $ORDERER_OWNER orderer $ORDERER_ECERTCA $RCA_ADMIN $TLSCA_ADMIN

    done

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        local PEER_ORG=$(_jq '.name')
        local PEER_ECERT_CA=$(_jq '.certificateAuthorityName')
        local RCA_ADMIN=$(_jq '.RCAAdmin')
        local TLSCA_ADMIN=$(_jq '.TLSCACreds')

        create_channel_org_MSP $PEER_ORG peer $PEER_ECERT_CA $RCA_ADMIN $TLSCA_ADMIN

    done

    pop_fn
}

function aggregate_channel_MSP() {
    push_fn "Aggregating channel MSP"

    rm -rf ./build/msp/
    mkdir -p ./build/msp

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }
        ORDERER_OWNER=$(_jq '.owner')
        CERT_AUTHORITY=$(_jq '.certificateAuthorityName')

        kubectl -n $NS exec deploy/${CERT_AUTHORITY} -- tar zcvf - -C /var/hyperledger/fabric organizations/ordererOrganizations/${ORDERER_OWNER}/msp >build/msp/msp-${ORDERER_OWNER}.tgz
    done

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }
        ORG_NAME=$(_jq '.name')
        CERT_AUTHORITY=$(_jq '.certificateAuthorityName')

        kubectl -n $NS exec deploy/${CERT_AUTHORITY} -- tar zcvf - -C /var/hyperledger/fabric organizations/peerOrganizations/${ORG_NAME}/msp >build/msp/msp-${ORG_NAME}.tgz
    done

    kubectl -n $NS delete configmap msp-config-${NETWORK_NAME} || true
    kubectl -n $NS create configmap msp-config-${NETWORK_NAME} --from-file=build/msp/

    pop_fn
}

function create_channel_genesis_block() {
    push_fn "Creating channel \"${CHANNEL_NAME}\""

    ORDERERS_AR=()
    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
        _jq() {
            echo ${row} | base64 --decode | jq -r ${1}
        }
        ORDERERS_AR+=$(_jq '.ordererDomain')
    done

    echo ${ORDERERS_AR}

    echo 'set -x
  configtxgen -profile '${CHANNEL_PROFILE}' -channelID '${CHANNEL_NAME}' -outputBlock genesis_block.pb
#   configtxgen -inspectBlock genesis_block.pb
  
  for orderer_domain in '${ORDERERS_AR[@]}'; do
    osnadmin channel join --orderer-address ${orderer_domain}:9443 --channelID '${CHANNEL_NAME}' --config-block genesis_block.pb
  done
  
  ' | exec kubectl -n $NS exec deploy/ministry-of-health-${NETWORK_NAME}-admin-cli -i -- /bin/bash

    sleep 10

    pop_fn
}

function join_org_peers() {
    local org=$1
    push_fn "Joining ${org} peers to channel \"${CHANNEL_NAME}\""

    FIRST_ORDERER=$(echo "$(cat $ORG_DATA_JSON)" | jq -r "first(.${NETWORK_NAME^^}.ORDERERS[] | .ordererDomain)")
    ORDERER_CA=$(echo "$(cat $ORG_DATA_JSON)" | jq -r "first(.${NETWORK_NAME^^}.ORDERERS[] | .certificateAuthorityName)")
    ORDERER_OWNER=$(echo "$(cat $ORG_DATA_JSON)" | jq -r "first(.${NETWORK_NAME^^}.ORDERERS[] | .owner)")

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
        _jq() {
            echo ${row} | base64 --decode | jq -r ${1}
        }
        ORG_NAME=$(_jq '.name')
        PEER_DOMAIN=$(_jq '.peerDomain')

        echo 'set -x
  # Fetch the genesis block from an orderer
  peer channel \
    fetch oldest \
    genesis_block.pb \
    -c '${CHANNEL_NAME}' \
    -o '$FIRST_ORDERER':6050 \
    --tls --cafile /var/hyperledger/fabric/organizations/ordererOrganizations/'$ORDERER_OWNER'/msp/tlscacerts/'$ORDERER_CA'.pem

  # Join peer to the channel.
  CORE_PEER_ADDRESS='$PEER_DOMAIN':7051 \
  peer channel \
    join \
    -b genesis_block.pb \
    -o '$FIRST_ORDERER':6050 \
    --tls --cafile /var/hyperledger/fabric/organizations/ordererOrganizations/'$ORDERER_OWNER'/msp/tlscacerts/'$ORDERER_CA'.pem

  ' | exec kubectl -n $NS exec deploy/${ORG_NAME}-${NETWORK_NAME}-admin-cli -i -- /bin/bash

    done
    pop_fn
}

verify_result() {
    if [ $1 -ne 0 ]; then
        echo $2
        exit $1
    fi
}

function channel_up() {

    create_channel_MSP
    aggregate_channel_MSP
    launch_admin_CLIs "up"

    create_channel_genesis_block
    join_org_peers
}
