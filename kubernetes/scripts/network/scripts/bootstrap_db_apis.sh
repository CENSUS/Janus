#!/bin/bash

function construct_db_api_tls() {
  push_fn "Producing the TLS Certificates for: DB-API"

  local DB_API_CREDS=$(jq -r '.CREDENTIALS.DB_API.MASTER_PASS' ${VARIOUS_CREDENTIALS_JSON})
  local DB_API_USERNAME=$(echo ${DB_API_CREDS} | jq -r '.username')
  local DB_API_PASSWORD=$(echo ${DB_API_CREDS} | jq -r '.password')

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/ca-ministry-of-health-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name ${DB_API_USERNAME} --id.secret ${DB_API_PASSWORD} --id.type client --url https://ca-ministry-of-health --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/tlsadminmoh/msp
    fabric-ca-client enroll --url https://${DB_API_USERNAME}:${DB_API_PASSWORD}@ca-ministry-of-health --csr.hosts db-api --csr.hosts localhost --mspdir /var/hyperledger/fabric/applications/${DB_API_USERNAME}/msp

    mv /var/hyperledger/fabric/applications/${DB_API_USERNAME}/msp/keystore/*_sk  /var/hyperledger/fabric/applications/${DB_API_USERNAME}/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/${DB_API_USERNAME}/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/ca-ministry-of-health -i -- /bin/sh

  mkdir -p ./build/db-apis/${DB_API_USERNAME}

  kubectl -n $NS exec -i deploy/ca-ministry-of-health -c main -- tar cf - . -C /var/hyperledger/fabric/applications/${DB_API_USERNAME}/msp . | tar xf - -C "build/db-apis/${DB_API_USERNAME}"

  kubectl delete secret -n $NS db-api-tls --ignore-not-found
  kubectl create secret generic -n $NS db-api-tls --from-file=tls.crt="./build/db-apis/${DB_API_USERNAME}/signcerts/cert.pem" --from-file=tls.key="./build/db-apis/${DB_API_USERNAME}/keystore/key.pem" --from-file=ca.crt="./build/db-apis/${DB_API_USERNAME}/cacerts/ca-ministry-of-health.pem"

  pop_fn
}

function construct_dbc_api_tls() {
  push_fn "Producing the TLS Certificates for: DBC-API"

  local DBC_API_CREDS=$(jq -r '.CREDENTIALS.DBC_API.MASTER_PASS' ${VARIOUS_CREDENTIALS_JSON})
  local DBC_API_USERNAME=$(echo ${DBC_API_CREDS} | jq -r '.username')
  local DBC_API_PASSWORD=$(echo ${DBC_API_CREDS} | jq -r '.password')

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/ca-ministry-of-health-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name ${DBC_API_USERNAME} --id.secret ${DBC_API_PASSWORD} --id.type client --url https://ca-ministry-of-health --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/tlsadminmoh/msp
    fabric-ca-client enroll --url https://${DBC_API_USERNAME}:${DBC_API_PASSWORD}@ca-ministry-of-health --csr.hosts dbc-api --csr.hosts localhost --mspdir /var/hyperledger/fabric/applications/${DBC_API_USERNAME}/msp

    mv /var/hyperledger/fabric/applications/${DBC_API_USERNAME}/msp/keystore/*_sk  /var/hyperledger/fabric/applications/${DBC_API_USERNAME}/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/${DBC_API_USERNAME}/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/ca-ministry-of-health -i -- /bin/sh

  mkdir -p ./build/db-apis/dbc-api

  kubectl -n $NS exec -i deploy/ca-ministry-of-health -c main -- tar cf - . -C /var/hyperledger/fabric/applications/${DBC_API_USERNAME}/msp . | tar xf - -C "build/db-apis/${DBC_API_USERNAME}"

  kubectl delete secret -n $NS dbc-api-tls --ignore-not-found
  kubectl create secret generic -n $NS dbc-api-tls --from-file=tls.crt="./build/db-apis/${DBC_API_USERNAME}/signcerts/cert.pem" --from-file=tls.key="./build/db-apis/${DBC_API_USERNAME}/keystore/key.pem" --from-file=ca.crt="./build/db-apis/${DBC_API_USERNAME}/cacerts/ca-ministry-of-health.pem"

  pop_fn
}

function construct_api_keys() {

  mkdir -p build/db-apis/api-keys/db-api
  mkdir -p build/db-apis/api-keys/dbc-api

  rm build/db-apis/api-keys/db-api/api_keys.json || echo "No file to remove..."
  rm build/db-apis/api-keys/dbc-api/api_keys.json || echo "No file to remove..."

  touch build/db-apis/api-keys/db-api/api_keys.json && echo "{}" >"build/db-apis/api-keys/db-api/api_keys.json"
  touch build/db-apis/api-keys/dbc-api/api_keys.json && echo "{}" >"build/db-apis/api-keys/dbc-api/api_keys.json"

  for row in $(echo "$(cat $ORG_DATA_JSON)" | jq -r ".PROXY.ORGANIZATIONS[] | @base64"); do
    _jq() {
      echo "${row}" | base64 --decode | jq -r "${1}"
    }

    local org_name=$(_jq '.name')
    local org_uuid=$(_jq '.uuid')
    local api_key=$(generate_random_password 128)

    update_various_credentials "API_KEYS" ${org_name^^} ${org_uuid} ${api_key}

    echo $(jq '.+{'\"${api_key}\"':'\"${org_uuid}\"'}' build/db-apis/api-keys/db-api/api_keys.json) >build/db-apis/api-keys/db-api/api_keys.json
    echo $(jq '.+{'\"${org_uuid}\"':'\"${api_key}\"'}' build/db-apis/api-keys/dbc-api/api_keys.json) >build/db-apis/api-keys/dbc-api/api_keys.json

  done

}

function construct_api_keys_settings() {
  kubectl -n $NS delete configmap db-api-api-keys-v1-map || log "db-api-api-keys-v1-map for DB-API is not present - Constructing..."
  kubectl -n $NS create configmap db-api-api-keys-v1-map --from-file=./build/db-apis/api-keys/db-api/api_keys.json

  kubectl -n $NS delete configmap dbc-api-api-keys-v1-map || log "dbc-api-api-keys-v1-map for DBC-API is not present - Constructing..."
  kubectl -n $NS create configmap dbc-api-api-keys-v1-map --from-file=./build/db-apis/api-keys/dbc-api/api_keys.json
}

function db_apis_application_connection() {

  construct_db_api_tls
  construct_dbc_api_tls

  push_fn "Initializing the Database"
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/database/psql-data-persistentvolumeclaim.yaml
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/database/db-service.yaml
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/database/db-deployment.yaml
  kubectl -n $NS rollout status deploy/db
  pop_fn

  push_fn "Creating a Service Account for the DB-API"
  kubectl -n $NS create serviceaccount "db-api" || log "A Service Account already exists"
  pop_fn

  push_fn "Creating the API Keys"
  construct_api_keys
  construct_api_keys_settings
  pop_fn

  push_fn "Initializing the DB-API"
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/db-api/db-api-service.yaml
  kubectl -n $NS delete -f ${KUBE_TEMPLATES_DIR}/db-apis/db-api/db-api-deployment.yaml || echo "DB-API Deployment does not exist"
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/db-api/db-api-deployment.yaml
  kubectl -n $NS rollout status deploy/db-api
  pop_fn

  push_fn "Creating a Service Account for the DBC-API"
  kubectl -n $NS create serviceaccount "dbc-api" || log "A Service Account already exists"
  pop_fn

  push_fn "Initializing the DBC-API"
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/dbc-api/dbc-api-service.yaml
  kubectl -n $NS delete -f ${KUBE_TEMPLATES_DIR}/db-apis/dbc-api/dbc-api-deployment.yaml || echo "DBC-API Deployment does not exist"
  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/db-apis/dbc-api/dbc-api-deployment.yaml
  kubectl -n $NS rollout status deploy/dbc-api
  pop_fn

}
