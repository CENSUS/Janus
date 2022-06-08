#!/bin/bash

function construct_rabbitmq_tls() {
  push_fn "Producing the TLS Certificates for: RabbitMQ"

  RABBITMQ_USERNAME=rabbitmq
  RABBITMQ_PASSWORD=$(generate_random_password 25)

  update_various_credentials "RABBITMQ" "MASTER_PASS" $RABBITMQ_USERNAME $RABBITMQ_PASSWORD

  echo "set -x

    export FABRIC_CA_CLIENT_HOME=/var/hyperledger/ca-ministry-of-health-client
    export FABRIC_CA_CLIENT_TLS_CERTFILES="'"$FABRIC_CA_CLIENT_HOME"'"/tls-root-cert/tls-ca-cert.pem

    fabric-ca-client register --id.name ${RABBITMQ_USERNAME} --id.secret ${RABBITMQ_PASSWORD} --id.type client --url https://ca-ministry-of-health --mspdir "'"$FABRIC_CA_CLIENT_HOME"'"/tls-ca/tlsadminmoh/msp
    fabric-ca-client enroll --url https://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@ca-ministry-of-health --csr.hosts rabbitmq --mspdir /var/hyperledger/fabric/applications/${RABBITMQ_USERNAME}/msp

    mv /var/hyperledger/fabric/applications/${RABBITMQ_USERNAME}/msp/keystore/*_sk  /var/hyperledger/fabric/applications/${RABBITMQ_USERNAME}/msp/keystore/key.pem
    rm -rf  /var/hyperledger/fabric/applications/${RABBITMQ_USERNAME}/msp/*sk
  
  " | exec kubectl -n $NS exec deploy/ca-ministry-of-health -i -- /bin/sh

  mkdir -p ./build/rabbitmq

  kubectl -n $NS exec -i deploy/ca-ministry-of-health -c main -- tar cf - . -C /var/hyperledger/fabric/applications/${RABBITMQ_USERNAME}/msp . | tar xf - -C "build/rabbitmq"

  kubectl delete secret -n $NS rabbitmq-tls --ignore-not-found
  kubectl create secret generic -n $NS rabbitmq-tls --from-file=tls.crt="./build/rabbitmq/signcerts/cert.pem" --from-file=tls.key="./build/rabbitmq/keystore/key.pem" --from-file=ca.crt="./build/rabbitmq/cacerts/ca-ministry-of-health.pem"

  pop_fn
}

function create_vhost() {
  echo "set -x

    rabbitmqctl add_vhost /block
  
  " | exec kubectl -n $NS exec statefulSet/rabbitmq -i -- /bin/sh
}

function init_clients() {

  ADMIN_USERNAME=blockadmin
  ADMIN_PASSWORD=$(generate_random_password 25)

  BACKEND_API_ADMIN=backendapi
  BACKEND_API_PASSWORD=$(generate_random_password 25)

  INTERBLOCKCHAIN_API_ADMIN=interbcapi
  INTERBLOCKCHAIN_API_PASSWORD=$(generate_random_password 25)

  update_various_credentials "RABBITMQ" "BLOCK_ADMIN" $ADMIN_USERNAME $ADMIN_PASSWORD
  update_various_credentials "RABBITMQ" "BACKEND_API" $BACKEND_API_ADMIN $BACKEND_API_PASSWORD
  update_various_credentials "RABBITMQ" "INTERBLOCKCHAIN_API" $INTERBLOCKCHAIN_API_ADMIN $INTERBLOCKCHAIN_API_PASSWORD

  echo "set -x

    rabbitmqctl delete_user guest

    rabbitmqctl add_user ${ADMIN_USERNAME} ${ADMIN_PASSWORD}
    rabbitmqctl set_user_tags ${ADMIN_USERNAME} full_access administrator

    rabbitmqctl add_user ${BACKEND_API_ADMIN} ${BACKEND_API_PASSWORD}
    rabbitmqctl add_user ${INTERBLOCKCHAIN_API_ADMIN} ${INTERBLOCKCHAIN_API_PASSWORD}

    rabbitmqctl set_user_tags ${BACKEND_API_ADMIN} client
    rabbitmqctl set_user_tags ${INTERBLOCKCHAIN_API_ADMIN} client

    rabbitmqctl set_permissions -p /block ${ADMIN_USERNAME} '.*' '.*' '.*'
    rabbitmqctl set_permissions -p /block ${BACKEND_API_ADMIN} '.*' '.*' '.*'
    rabbitmqctl set_permissions -p /block ${INTERBLOCKCHAIN_API_ADMIN} '.*' '.*' '.*'

  " | exec kubectl -n $NS exec statefulSet/rabbitmq -i -- /bin/sh
}

function bootstrap_rabbitmq() {

  construct_rabbitmq_tls

  # RabbitMQ Config
  kubectl -n $NS create -f ${KUBE_TEMPLATES_DIR}/rabbit-mq/rabbit-mq-rbac.yaml || log "RBAC Config already exists"

  kubectl -n $NS create secret generic rabbit-secret --from-literal=RABBITMQ_ERLANG_COOKIE=$(dd if=/dev/urandom bs=30 count=1 | base64) || log "Erlang cookie is already set"

  kubectl delete configmap -n $NS rabbitmq-config || log "Rabbit-MQ Config not found - Applying..."
  kubectl -n $NS create -f ${KUBE_TEMPLATES_DIR}/rabbit-mq/rabbit-mq-config.yaml

  kubectl delete configmap -n $NS rabbitmq-queues-config || log "Rabbit-MQ Queues Config not found - Applying..."
  kubectl -n $NS create -f ${KUBE_TEMPLATES_DIR}/rabbit-mq/rabbit-mq-queues-config.yaml

  kubectl -n $NS create -f ${KUBE_TEMPLATES_DIR}/rabbit-mq/rabbit-mq-pvc.yaml || log "A PVC for the Rabbit-MQ already exists"

  kubectl -n $NS apply -f ${KUBE_TEMPLATES_DIR}/rabbit-mq/rabbit-mq.yaml
  kubectl -n $NS rollout status StatefulSet/rabbitmq

  sleep 20 # Sometimes the installation hangs (if the server is not powerful enough) - So we give it a bit more time before making any changes to the RabbitMQ

  create_vhost
  init_clients

}
