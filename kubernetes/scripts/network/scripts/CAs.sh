# function launch_TLS_CAs() {
#   push_fn "Launching TLS CA(s)"

#   for filename in "${KUBE_TEMPLATES_DIR}/certificate-authorities/tls-"*".yaml"; do
#     [ -e "$filename" ] || continue
#     microk8s.kubectl -n $NS apply -f "$filename"
#   done

#   kubectl -n $NS rollout status deploy/tls-ca-ministry-of-health

#   sleep 10

#   pop_fn
# }

function launch_CAs() {
  push_fn "Launching CAs"

  for filename in "${KUBE_TEMPLATES_DIR}/certificate-authorities/"*".yaml"; do
    [ -e "$filename" ] || continue
    microk8s.kubectl -n $NS apply -f "$filename"
  done

  kubectl -n $NS rollout status deploy/ca-ministry-of-health
  kubectl -n $NS rollout status deploy/ca-attikon-hospital
  kubectl -n $NS rollout status deploy/ca-general-hospital-of-athens
  kubectl -n $NS rollout status deploy/ca-medutils
  kubectl -n $NS rollout status deploy/ca-healthprods

  sleep 10

  pop_fn
}

function enroll_bootstrap_TLS_CA_users() {
  push_fn "Enrolling bootstrap TLS CA users"
  _jq() {
    echo ${row} | base64 --decode | jq -r ${1}
  }

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
    local ORDERER_OWNER=$(_jq '.owner')
    local ORDERER_ECERT_CA=$(_jq '.certificateAuthorityName')
    local ORDERER_TLS_CA=$(_jq '.tlsCertificateAuthorityName')
    local TLSADMIN_AUTH=$(_jq '.TLSCACreds')

    enroll_bootstrap_TLS_CA_user $ORDERER_OWNER $TLSADMIN_AUTH $ORDERER_ECERT_CA $ORDERER_TLS_CA

  done

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    local ORG_NAME=$(_jq '.name')
    local ORG_ECERT_CA=$(_jq '.certificateAuthorityName')
    local ORG_TLS_CA=$(_jq '.tlsCertificateAuthorityName')
    local TLSADMIN_AUTH=$(_jq '.TLSCACreds')

    enroll_bootstrap_TLS_CA_user $ORG_NAME $TLSADMIN_AUTH $ORG_ECERT_CA $ORG_TLS_CA

  done

  pop_fn
}

function enroll_bootstrap_TLS_CA_user() {
  local org=$1
  local auth=$2
  local ecertca=$3
  local tlsca=$4

  local tlsAdmin=$(echo $auth | cut -f1 -d:)

  echo 'set -x
  mkdir -p $FABRIC_CA_CLIENT_HOME/tls-root-cert
  cp $FABRIC_CA_SERVER_HOME/ca-cert.pem $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem

  fabric-ca-client enroll \
    --url https://'${auth}'@'${tlsca}' \
    --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem \
    --csr.hosts '${tlsca}' \
    --mspdir $FABRIC_CA_CLIENT_HOME/tls-ca/'${tlsAdmin}'/msp
  ' | exec kubectl -n $NS exec deploy/${tlsca} -i -- /bin/sh
}

function register_enroll_ECert_CA_bootstrap_users() {
  push_fn "Registering and enrolling ECert CA bootstrap users"

  _jq() {
    echo ${row} | base64 --decode | jq -r ${1}
  }

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
    local ORDERER_OWNER=$(_jq '.owner')
    local RCAADMIN=$(_jq '.RCAAdmin')
    local TLSADMIN_AUTH=$(_jq '.TLSCACreds')
    local ORDERER_ECERT_CA=$(_jq '.certificateAuthorityName')
    local ORDERER_TLS_CA=$(_jq '.tlsCertificateAuthorityName')

    register_enroll_ECert_CA_bootstrap_user $ORDERER_OWNER $RCAADMIN $TLSADMIN_AUTH $ORDERER_ECERT_CA $ORDERER_TLS_CA

  done

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    local ORG_NAME=$(_jq '.name')
    local RCAADMIN=$(_jq '.RCAAdmin')
    local TLSADMIN_AUTH=$(_jq '.TLSCACreds')
    local ORG_ECERT_CA=$(_jq '.certificateAuthorityName')
    local ORG_TLS_CA=$(_jq '.tlsCertificateAuthorityName')

    register_enroll_ECert_CA_bootstrap_user $ORG_NAME $RCAADMIN $TLSADMIN_AUTH $ORG_ECERT_CA $ORG_TLS_CA

  done

  pop_fn
}

function register_enroll_ECert_CA_bootstrap_user() {
  local org=$1
  local rcaAdmin=$2
  local tlsauth=$3
  local ecertca=$4
  local tlsca=$5

  local rcaAdminUser=$(echo $rcaAdmin | cut -f1 -d:)
  local rcaAdminPw=$(echo $rcaAdmin | cut -f2 -d:)

  local tlsAdminUser=$(echo $tlsauth | cut -f1 -d:)
  local tlsAdminPw=$(echo $tlsauth | cut -f2 -d:)

  echo 'set -x
  fabric-ca-client register \
    --id.name '${rcaAdminUser}' \
    --id.secret '${rcaAdminPw}' \
    --url https://'${tlsca}' \
    --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem \
    --mspdir $FABRIC_CA_CLIENT_HOME/tls-ca/'${tlsAdminUser}'/msp

  fabric-ca-client enroll \
    --url https://'${tlsauth}'@'${tlsca}' \
    --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem \
    --csr.hosts '${ecertca}' \
    --mspdir $FABRIC_CA_CLIENT_HOME/tls-ca/'${rcaAdminUser}'/msp

  cp $FABRIC_CA_CLIENT_HOME/tls-ca/'${rcaAdminUser}'/msp/keystore/*_sk $FABRIC_CA_CLIENT_HOME/tls-ca/'${rcaAdminUser}'/msp/keystore/key.pem
  ' | exec kubectl -n $NS exec deploy/${tlsca} -i -- /bin/sh

}

function enroll_bootstrap_ECert_CA_users() {
  push_fn "Enrolling bootstrap ECert CA users"

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORDERERS[] | @base64"); do
    local ORDERER_OWNER=$(_jq '.owner')
    local RCAADMIN=$(_jq '.RCAAdmin')
    local ORDERER_ECERT_CA=$(_jq '.certificateAuthorityName')
    local ORDERER_TLS_CA=$(_jq '.tlsCertificateAuthorityName')

    enroll_bootstrap_ECert_CA_user $ORDERER_OWNER $RCAADMIN $ORDERER_ECERT_CA

  done

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    local ORG_NAME=$(_jq '.name')
    local RCAADMIN=$(_jq '.RCAAdmin')
    local ORG_ECERT_CA=$(_jq '.certificateAuthorityName')
    local ORG_TLS_CA=$(_jq '.tlsCertificateAuthorityName')

    enroll_bootstrap_ECert_CA_user $ORG_NAME $RCAADMIN $ORG_ECERT_CA

  done

  pop_fn
}

function enroll_bootstrap_ECert_CA_user() {
  local org=$1
  local auth=$2
  local ecertca=$3

  local authUser=$(echo $auth | cut -f1 -d:)

  echo 'set -x
  fabric-ca-client enroll \
    --url https://'${auth}'@'${ecertca}' \
    --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem \
    --mspdir $FABRIC_CA_CLIENT_HOME/'${ecertca}'/'${authUser}'/msp
  ' | exec kubectl -n $NS exec deploy/${ecertca} -i -- /bin/sh
}

function generate_crls() {
  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".${NETWORK_NAME^^}.ORGANIZATIONS[] | @base64"); do
    local ORG_NAME=$(_jq '.name')
    local ORG_TLS_CA=$(_jq '.tlsCertificateAuthorityName')

    push_fn "Generating the CRL of organization ${ORG_NAME^^}"

    echo 'set -x
  fabric-ca-client gencrl \
    --url https://'${ORG_TLS_CA}' \
    --tls.certfiles $FABRIC_CA_CLIENT_HOME/tls-root-cert/tls-ca-cert.pem
    ' | exec kubectl -n $NS exec deploy/${ORG_TLS_CA} -i -- /bin/sh

    pop_fn

  done
}
