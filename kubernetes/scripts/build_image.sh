#!/bin/bash

INTER_BC_API_BUILD_DIR="$(dirname $(which $0))/../../blockchain/blockchain_apis/inter-blockchain-api"
BACKEND_API_BUILD_DIR="$(dirname $(which $0))/../../blockchain/blockchain_apis/backend"
ACSC_BUILD_DIR="$(dirname $(which $0))/../../blockchain/chaincodes/ACSC"
TMSC_BUILD_DIR="$(dirname $(which $0))/../../blockchain/chaincodes/TMSC"
PSC_BUILD_DIR="$(dirname $(which $0))/../../blockchain/chaincodes/PSC"
LSC_BUILD_DIR="$(dirname $(which $0))/../../blockchain/chaincodes/LSC"
KSSC_BUILD_DIR="$(dirname $(which $0))/../../blockchain/chaincodes/KSSC"
DB_APIS_BUILD_DIR="$(dirname $(which $0))/../../database_api/api"

function build_docker_image() {
	local API_DIR=${1}
	local IMAGE_NAME=${2}
	echo "Using dockerfile at: ${API_DIR}"
	docker build ${API_DIR} -t ${IMAGE_NAME} -f ${API_DIR}/${IMAGE_NAME}.dockerfile &&
		docker save ${IMAGE_NAME} >${IMAGE_NAME}.tar &&
		microk8s ctr image import ${IMAGE_NAME}.tar &&
		rm ${IMAGE_NAME}.tar
}

if [ "${#}" -eq 1 ]; then

	if [[ "${1}" == "inter_blockchain_api" ]]; then
		build_docker_image ${INTER_BC_API_BUILD_DIR} ${1}
	elif [[ "${1}" == "backend_api" ]]; then
		build_docker_image ${BACKEND_API_BUILD_DIR} ${1}
	elif [[ "${1}" == "acsc" ]]; then
		build_docker_image ${ACSC_BUILD_DIR} ${1}
	elif [[ "${1}" == "tmsc" ]]; then
		build_docker_image ${TMSC_BUILD_DIR} ${1}
	elif [[ "${1}" == "psc" ]]; then
		build_docker_image ${PSC_BUILD_DIR} ${1}
	elif [[ "${1}" == "lsc" ]]; then
		build_docker_image ${LSC_BUILD_DIR} ${1}
	elif [[ "${1}" == "kssc" ]]; then
		build_docker_image ${KSSC_BUILD_DIR} ${1}
	elif [[ "${1}" == "db_api" ]]; then
		build_docker_image ${DB_APIS_BUILD_DIR} ${1}
	elif [[ "${1}" == "dbc_api" ]]; then
		build_docker_image ${DB_APIS_BUILD_DIR} ${1}
	elif [[ "${1}" == "build_all" ]]; then
		build_docker_image ${INTER_BC_API_BUILD_DIR} "inter_blockchain_api"
		build_docker_image ${BACKEND_API_BUILD_DIR} "backend_api"
		build_docker_image ${ACSC_BUILD_DIR} "acsc"
		build_docker_image ${TMSC_BUILD_DIR} "tmsc"
		build_docker_image ${PSC_BUILD_DIR} "psc"
		build_docker_image ${LSC_BUILD_DIR} "lsc"
		build_docker_image ${KSSC_BUILD_DIR} "kssc"
		build_docker_image ${DB_APIS_BUILD_DIR} "db_api"
		build_docker_image ${DB_APIS_BUILD_DIR} "dbc_api"
	fi

else
	echo "Illegal number of parameters" >&2
fi
