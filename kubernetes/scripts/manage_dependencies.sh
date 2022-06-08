#!/bin/bash

set -o errexit

PARENT_DIR="./../../.."
ROOT_DIR="./../.."

DEP_DEBUG_LOGS="${ROOT_DIR}/debug_logs/dependencies"
mkdir -p ${DEP_DEBUG_LOGS}

LOG_FILE=${DEPENDENCIES_LOG_FILE:-${DEP_DEBUG_LOGS}/dependencies.log}
DEBUG_FILE=${DEPENDENCIES_LOG_FILE:-${DEP_DEBUG_LOGS}/dependencies_debug.log}

. network/scripts/utils.sh

logging_init

# Dependencies Management

function install_essentials() {
    push_fn "\nInstalling essential dependencies\n"

    sudo apt-get update
    sudo apt-get install build-essential gcc g++ -y

    pop_fn "Essential dependencies installed\n"
}

function install_kubernetes() {

    push_fn "Installing Kubernetes"
    sudo snap install microk8s --classic --channel=1.23/stable
    pop_fn

    push_fn "Adding an alias for Kubernetes: microk8s.kubectl => kubectl"
    sudo snap alias microk8s.kubectl kubectl
    pop_fn

    push_fn "Updating the User's Permissions for: Microk8s"
    sudo usermod -a -G microk8s $USER
    sudo mkdir -p $HOME/.kube
    sudo chown -R $USER:$USER $HOME/.kube
    pop_fn

    push_fn "Exporting the default Kubeconfig to ~/.kube/config"
    sudo microk8s.kubectl config view --raw >$HOME/.kube/config
    pop_fn

}

function install_kubernetes_addons() {

    push_fn "Installing Kubernetes addons (storage, dns, ingress)"
    sudo microk8s.enable storage dns ingress
    pop_fn

}

function install_docker() {

    push_fn "Installing Docker"

    log "Setting up the repository"
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

    log "Installing the Docker Engine"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    pop_fn

    push_fn "Updating the User's Permissions for: Docker"
    sudo usermod -a -G docker $USER
    pop_fn

}

function install_golang() {

    push_fn "Installing Golang"
    sudo snap install go --classic
    pop_fn

}

function install_nvm() {

    push_fn "Installing NVM"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    pop_fn

    push_fn "Installing NodeJS - Version 14"
    nvm install 14
    pop_fn

    push_fn "Using NodeJS - Version 14"
    nvm use 14
    pop_fn

}

function install_other_deps() {

    push_fn "Installing other dependencies (make, jq, pwgen etc.)"
    sudo apt-get update
    sudo apt-get install -y make jq pwgen
    pop_fn

}

function install_wine() {

    push_fn "Installing Wine"
    sudo dpkg --add-architecture i386
    sudo apt-get install -y wine64
    pop_fn

}

# Vault Management
function create_vault_image() {

    VAULT_DIR="${PARENT_DIR}/vault-secrets-abe-janus"
    local VAULT_IMAGE_NAME="vault-abe"

    printf "Using Vault at: "${VAULT_DIR}"\n"

    push_fn "Creating the Vault image"
    pushd "${VAULT_DIR}"
    make build-sa-enabled &&
        docker save ${VAULT_IMAGE_NAME} >${VAULT_IMAGE_NAME}.tar &&
        microk8s ctr image import ${VAULT_IMAGE_NAME}.tar &&
        rm ${VAULT_IMAGE_NAME}.tar
    popd
    pop_fn

}

# Project Management
function construct_application_images() {

    push_fn "Constructing the application's images - Be patient, this may take a while"
    ./build_image.sh build_all
    pop_fn

}

function allow_ssl_termination() {

    push_fn "Allowing SSL termination"

    kubectl -n ingress patch daemonset nginx-ingress-microk8s-controller \
        --type=json \
        -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--enable-ssl-passthrough"}]'

    pop_fn

}

if [ "${#}" -eq 1 ]; then
    if [[ "${1}" == "essentials" ]]; then
        # Install all the essential dependencies
        install_essentials
        install_kubernetes
        install_kubernetes_addons
        install_docker
        install_golang
        install_nvm
        install_other_deps
        install_wine

    elif [[ "${1}" == "project_images" ]]; then
        construct_application_images
    elif [[ "${1}" == "vault_image" ]]; then
        create_vault_image
    elif [[ "${1}" == "configure" ]]; then
        allow_ssl_termination
    elif [[ "${1}" == "clear_build" ]]; then
        rm -rf dependencies_installation
    else
        printf "Invalid argument!\n"
        printf "Usage: ./manage_dependencies.sh [essentials|project_images|vault_image|configure|clear_build]\n"
        printf "Example: ./manage_dependencies.sh essentials\n"
        exit 1
    fi
else
    printf "Invalid number of arguments!\n"
    printf "Usage: ./manage_dependencies.sh [essentials|project_images|vault_image|configure|clear_build]\n"
    printf "Example: ./manage_dependencies.sh project_images\n"
fi
