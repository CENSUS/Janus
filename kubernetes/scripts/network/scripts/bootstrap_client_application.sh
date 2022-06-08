#!/bin/bash

acquire_backend_certificates() {
  mkdir -p ${CLIENT_APP_DIR_BACKEND}/etc/ssl

  touch ${CLIENT_APP_DIR_BACKEND}/etc/ssl/ca.crt
  touch ${CLIENT_APP_DIR_BACKEND}/etc/ssl/backend_tls.crt

  kubectl get secrets/backend-api-tls -n ${NS} -o jsonpath="{.data['ca\.crt']}" | base64 -d >${CLIENT_APP_DIR_BACKEND}/etc/ssl/ca.crt
  kubectl get secrets/backend-api-tls -n ${NS} -o jsonpath="{.data['tls\.crt']}" | base64 -d >${CLIENT_APP_DIR_BACKEND}/etc/ssl/backend_tls.crt

}

function client_application_bootstrap() {

  push_fn "[NPM] Acquiring the Backend CA/TLS Certificates"

  acquire_backend_certificates

  pop_fn

  push_fn "[NPM] Installing the Dependencies"

  npm run install-all --prefix "${CLIENT_APP_DIR}"

  pop_fn

  push_fn "[NPM] Building the executable for: Linux OS"

  npm run build-linux --prefix "${CLIENT_APP_DIR}"

  pop_fn

  push_fn "[NPM] Building the executable for: Windows OS"

  npm run build-win --prefix "${CLIENT_APP_DIR}"

  pop_fn

  push_fn "Moving the Executables to the Kubernetes BACKEND-API Pod"

  kubectl -n $NS exec -i deploy/backend-api -c main -- mkdir -p /application/executables
  tar cf - -C "${CLIENT_APP_DIR}/dist" . | kubectl -n $NS exec -i deploy/backend-api -c main -- tar xvf - -C /application/executables

  pop_fn

  push_fn "Removing the build data"

  npm run clear-build --prefix "${CLIENT_APP_DIR}"

  pop_fn

}
