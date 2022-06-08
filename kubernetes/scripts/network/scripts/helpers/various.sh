function launch_admin_CLIs() {
    switch_type=$1

    [ $switch_type == "up" ] && push_fn "Launching the Admin CLIs" || push_fn "Removing the Admin CLIs"
    pop_fn

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
        _jq() {
            echo ${row} | base64 --decode | jq -r ${1}
        }
        ORDERER_OWNER=$(_jq '.owner')

        [ $switch_type == "up" ] && launch "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/${NETWORK_NAME}/${ORDERER_OWNER}/${ORDERER_OWNER}-${NETWORK_NAME}-admin-cli.yaml" ||
            drop "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/${NETWORK_NAME}/${ORDERER_OWNER}/${ORDERER_OWNER}-${NETWORK_NAME}-admin-cli.yaml"

        # cat "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/${NETWORK_NAME}/${ORDERER_OWNER}/${ORDERER_OWNER}-${NETWORK_NAME}-admin-cli.yaml" | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' | kubectl -n $NS apply -f -
    done

    for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
        _jq() {
            echo ${row} | base64 --decode | jq -r ${1}
        }
        ORG_NAME=$(_jq '.name')

        [ $switch_type == "up" ] && launch "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/${NETWORK_NAME}/${ORG_NAME}/${ORG_NAME}-${NETWORK_NAME}-admin-cli.yaml" ||
            drop "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/${NETWORK_NAME}/${ORG_NAME}/${ORG_NAME}-${NETWORK_NAME}-admin-cli.yaml"

        # cat "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/${NETWORK_NAME}/${ORG_NAME}/${ORG_NAME}-${NETWORK_NAME}-admin-cli.yaml" | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' | kubectl -n $NS apply -f -
    done

    if [ $switch_type == "up" ]; then

        for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
            _jq() {
                echo ${row} | base64 --decode | jq -r ${1}
            }
            ORDERER_OWNER=$(_jq '.owner')
            ORDERER_NAME=$(_jq '.ordererName')

            push_fn "Launching the orderer's ${ORDERER_NAME} Admin CLI at network ${NETWORK_NAME} for organization ${ORDERER_OWNER}"
            kubectl -n $NS rollout status deploy/${ORDERER_OWNER}-${NETWORK_NAME}-admin-cli
            pop_fn
        done

        for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
            _jq() {
                echo ${row} | base64 --decode | jq -r ${1}
            }
            ORG_NAME=$(_jq '.name')
            PEER_NAME=$(_jq '.peer')

            push_fn "Launching the peer's ${PEER_NAME} Admin CLI at network ${NETWORK_NAME^^} for organization ${ORG_NAME^^}"
            kubectl -n $NS rollout status deploy/${ORG_NAME}-${NETWORK_NAME}-admin-cli
            pop_fn
        done

    fi

}

# function launch_admin_CLIs_common() {
#     push_fn "Launching admin CLIs"

#     for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
#         _jq() {
#             echo ${row} | base64 --decode | jq -r ${1}
#         }

#         ORDERER_OWNER=$(_jq '.owner')

#         cat "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/common/${ORDERER_OWNER}/${ORDERER_OWNER}-${NETWORK_NAME}-admin-cli.yaml" | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' | kubectl -n $NS apply -f -
#     done

#     for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
#         _jq() {
#             echo ${row} | base64 --decode | jq -r ${1}
#         }
#         ORG_NAME=$(_jq '.name')

#         cat "${KUBE_TEMPLATES_DIR}/blockchains/configs/various/admin-clis/common/${ORG_NAME}/${ORG_NAME}-${NETWORK_NAME}-admin-cli.yaml" | sed 's,{{FABRIC_VERSION}},'${FABRIC_VERSION}',g' | kubectl -n $NS apply -f -
#     done

#     for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
#         _jq() {
#             echo ${row} | base64 --decode | jq -r ${1}
#         }
#         ORDERER_OWNER=$(_jq '.owner')
#         kubectl -n $NS rollout status deploy/${ORDERER_OWNER}-${NETWORK_NAME}-admin-cli-common
#     done

#     for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
#         _jq() {
#             echo ${row} | base64 --decode | jq -r ${1}
#         }
#         ORG_NAME=$(_jq '.name')

#         kubectl -n $NS rollout status deploy/${ORG_NAME}-${NETWORK_NAME}-admin-cli-common
#     done

#     pop_fn
# }

# shell-format extension messed up with the below fn
function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

# function one_line_pem {
#   echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
# }

function json_ccp {
    local org_name=$1
    local org_msp=$2
    local peer_domain=$3
    local peer_ca=$4
    local peer_ca_port=$5
    local peer_ca_exposed=$6
    local peer_ca_exposed_port=$7
    local network_name=$8
    local PP=$(one_line_pem $9)
    local CP=$(one_line_pem ${10})
    local domain_bc=${11}
    sed -e "s/\${NETWORK_NAME}/${network_name}/" \
        -e "s/\${ORG_NAME}/${org_name}/" \
        -e "s/\${ORG_MSP}/${org_msp}/" \
        -e "s/\${PEER_DOMAIN}/${peer_domain}/" \
        -e "s/\${PEER_CA}/${peer_ca}/" \
        -e "s/\${PEER_CA_PORT}/${peer_ca_port}/" \
        -e "s/\${PEER_CA_EXPOSED}/${peer_ca_exposed}/" \
        -e "s/\${PEER_CA_EXPOSED_PORT}/${peer_ca_exposed_port}/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        -e "s/\${DOMAIN_BC}/${domain_bc}/" \
        ${CCP_TEMPLATE_DIR}
}

function app_id {
    local MSP=$1
    local CERT=$(one_line_pem $2)
    local PK=$(one_line_pem $3)

    sed -e "s#\${CERTIFICATE}#$CERT#" \
        -e "s#\${PRIVATE_KEY}#$PK#" \
        -e "s#\${MSPID}#$MSP#" \
        ${APP_USER_TEMPLATE_DIR}
}

function rabbitmq_info_injector {
    local USERNAME=${1}
    local PASSWORD=${2}

    sed -e "s#\${USERNAME}#$USERNAME#" \
        -e "s#\${PASSWORD}#$PASSWORD#" \
        ${RABBITMQ_TEMPLATE}
}