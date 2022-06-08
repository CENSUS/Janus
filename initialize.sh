#!/bin/bash

set -o errexit

INITIALIZE_SCRIPT_PATH="$(realpath "${BASH_SOURCE[-1]}")"
ROOT_PATH="$(dirname "${INITIALIZE_SCRIPT_PATH}")"

SCRIPTS_PATH="${ROOT_PATH}/kubernetes/scripts"
MANAGE_DEPENDENCIES_SCRIPT_NAME="manage_dependencies.sh"

NETWORK_SCRIPT_PATH="${SCRIPTS_PATH}/network"
NETWORK_SCRIPT_BOOTSTRAP="network_bootstrap"

# Installation Flag
ins_flag="./$(basename -- $0).flag"

function auto_install() {
    if [ ! -e $ins_flag ]; then
        install_dependencies "essentials"

        # Flag file to indicate that the system has installed the essential dependencies
        sudo touch ${ins_flag}

        echo "Need to reboot the system"
        REBOOT_CNTR=60
        while [ true ]; do
            if [ ${REBOOT_CNTR} -eq 0 ]; then
                break
            fi
            echo "Your system will reboot after ${REBOOT_CNTR} seconds. Press Ctrl+C to cancel."
            sleep 1
            REBOOT_CNTR=$(echo "${REBOOT_CNTR}-1" | bc)
        done
        echo -e "Your system is ready to reboot\n\nUpon reboot, rerun this script in order to complete the installation.\nRebooting..."
        sleep 15
        sudo reboot
    else
        echo "System successfully rebooted - Continuing with the installation..."

        # Remove the flag file - it is no longer needed
        sudo rm ${ins_flag}

        install_dependencies "project_images"
        install_dependencies "vault_image"
        install_dependencies "configure"

        install_project

        echo "Installation completed - Removing the Dependencies' Installation Logs"
        install_dependencies "clear_build"

    fi
}

function install_dependencies() {
    echo -e "Installing dependencies...\n"
    echo -e "Moving to the directory: "${SCRIPTS_PATH}"\n"

    pushd "${SCRIPTS_PATH}"
    ./${MANAGE_DEPENDENCIES_SCRIPT_NAME} ${1}
    popd
}

function install_project() {
    echo "Installing project...\n"
    echo "Moving to the directory: "${NETWORK_SCRIPT_PATH}"\n"

    pushd "${NETWORK_SCRIPT_PATH}"
    ./${NETWORK_SCRIPT_BOOTSTRAP}
    popd

    echo "Project installed!\n"
}

if [ "${#}" -eq 1 ]; then
    if [[ "${1}" == "install_essentials" ]]; then
        install_dependencies "essentials"
        echo -e "Essential dependencies installed\n Reboot the system to complete the installation"
    elif [[ "${1}" == "project_images" ]]; then
        install_dependencies "project_images"
        echo "Project images installed"
    elif [[ "${1}" == "vault_image" ]]; then
        install_dependencies "vault_image"
        echo "Vault image installed"
    elif [[ "${1}" == "configure" ]]; then
        install_dependencies "configure"
        echo "Configuration completed"
    elif [[ "${1}" == "project" ]]; then
        install_project
    else
        echo "Invalid argument!\n"
        echo "Usage: ./initiate_demo.sh [install_essentials|project_images|vault_image|configure|project]\n"
        exit 1
    fi
elif [ "${#}" -eq 0 ]; then
    auto_install
else
    echo "Invalid number of arguments!\n"
    echo "Usage: ./initiate_demo.sh [dependencies|project] OR ./initiate_demo.sh to install the dependencies AND the project\n"
    echo "Example: ./initiate_demo.sh dependencies\n"
fi
