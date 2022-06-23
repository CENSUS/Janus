function construct_infrastructure_ingress_yaml() {

  cat ${INGRESS_TEMPLATE} |
    sed 's,{{ INFRASTRUCTURE_ENDPOINT }},'${INFRASTRUCTURE_ENDPOINT}',g' |
    sed 's,{{ INFRASTRUCTURE_HTTP_PORT }},'${INFRASTRUCTURE_HTTP_PORT}',g' |
    sed 's,{{ INFRASTRUCTURE_HTTPS_PORT }},'${INFRASTRUCTURE_HTTPS_PORT}',g' >${OUTPUT_DEST}/${INGRESS_TEMPLATE_INFRASTRUCTURE}

}

function ingress_up() {

  push_fn "Getting: Ingress Up"

  local OUTPUT_DEST=./build/templates/ingress
  local INGRESS_TEMPLATE_INFRASTRUCTURE=ingress_infrastructure.yaml

  mkdir -p ${OUTPUT_DEST}

  construct_infrastructure_ingress_yaml

  kubectl -n ${NS} create -f ${OUTPUT_DEST}/${INGRESS_TEMPLATE_INFRASTRUCTURE} || log "Ingress is already active"

  pop_fn

}

function ingress_down() {

  push_fn "Getting: Ingress Down"

  local OUTPUT_DEST=./build/templates/ingress
  local INGRESS_TEMPLATE_INFRASTRUCTURE=ingress_infrastructure.yaml

  mkdir -p ${OUTPUT_DEST}

  construct_infrastructure_ingress_yaml

  kubectl -n ${NS} delete -f ${OUTPUT_DEST}/${INGRESS_TEMPLATE_INFRASTRUCTURE} || log "Ingress is not active"
  pop_fn

}
