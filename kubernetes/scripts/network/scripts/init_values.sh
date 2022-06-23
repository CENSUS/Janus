SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" &>/dev/null && pwd 2>/dev/null)"

ROOT_DIR="${SCRIPT_DIR}/../../../.."

FABRIC_VERSION=${NETWORK_FABRIC_VERSION:-2.4.1}
FABRIC_CA_VERSION=${NETWORK_FABRIC_CA_VERSION:-1.5.2}

DEBUG_LOGS="${ROOT_DIR}/debug_logs/network"
mkdir -p ${DEBUG_LOGS}

CLUSTER_NAME=${NETWORK_CLUSTER_NAME:-melity}
NS=${NETWORK_KUBE_NAMESPACE:-melity}
LOG_FILE=${NETWORK_LOG_FILE:-${DEBUG_LOGS}/network.log}
DEBUG_FILE=${NETWORK_DEBUG_FILE:-${DEBUG_LOGS}/network-debug.log}
NGINX_HTTP_PORT=${NETWORK_INGRESS_HTTP_PORT:-80}
NGINX_HTTPS_PORT=${NETWORK_INGRESS_HTTPS_PORT:-443}
DEFAULT_CHANNEL=${NETWORK_CHANNEL_NAME:-basechannel}

CC_SRC_PATH="${ROOT_DIR}/blockchain/chaincodes"

CONFIGS_FOLDER="${ROOT_DIR}/configs"

ORG_DATA_DIR="${CONFIGS_FOLDER}/organizations_info" # Directory where the organization data is stored
ORG_DATA_JSON="${ORG_DATA_DIR}/organizations.json"
ACL_INIT_DATA_JSON="${ORG_DATA_DIR}/acl_init_info.json"
CC_DATA_JSON="${ORG_DATA_DIR}/chaincodes.json"
CC_INIT_INFO_JSON="${ORG_DATA_DIR}/chaincodes_init_info.json"
ORG_DATA_EXPOSED_VALUES="${ORG_DATA_DIR}/exposed_values.json"
ORG_SUBJECTS="${ORG_DATA_DIR}/subjects/clients.json"
NETWORK_CONFIG="${CONFIGS_FOLDER}/network/network-config.json"

PRIVATE_COLLECTION_DIR="${ORG_DATA_DIR}/private_collections" # Directory where the private collections data is stored

VARIOUS_DIR="${CONFIGS_FOLDER}/various"
VARIOUS_CREDENTIALS_JSON="${VARIOUS_DIR}/various_credentials.json"

KUBE_TEMPLATES_DIR="${ROOT_DIR}/kubernetes/templates"

CC_CUSTOM_TEMPLATES_DIR="${KUBE_TEMPLATES_DIR}/blockchain-chaincodes/custom-templates"
BACKEND_API_DIR="${ROOT_DIR}/blockchain/blockchain_apis/backend"

# VAULT CONFIGURATION
VAULT_VALUES_DIR="${CONFIGS_FOLDER}/vault" # This is the directory where the vault values are stored

# CLIENT APPLICATION
CLIENT_APP_DIR="${ROOT_DIR}/blockchain/client/client_application"
CLIENT_APP_DIR_BACKEND="${ROOT_DIR}/blockchain/client/client_application/backend"

CCP_TEMPLATE_DIR="${KUBE_TEMPLATES_DIR}/blockchains/various/ccp-template.json"
APP_USER_TEMPLATE_DIR="${KUBE_TEMPLATES_DIR}/blockchains/various/appuser.id.template"

VARIOUS_TEMPLATES_DIR="${KUBE_TEMPLATES_DIR}/various_templates"
RABBITMQ_TEMPLATE="${VARIOUS_TEMPLATES_DIR}/rabbitmq_settings.template"

# ABE Plugin Folder
ABE_PLUGIN_FOLDER="${ROOT_DIR}/../vault-secrets-abe-janus/"

# INGRESS
INGRESS_TEMPLATE="${KUBE_TEMPLATES_DIR}/ingress/base-ingress.yaml"

# INFRASTRUCTURE ENDPOINTS
INFRASTRUCTURE_HTTP_PORT=$(jq -r .HTTP_PORT $NETWORK_CONFIG)
INFRASTRUCTURE_HTTPS_PORT=$(jq -r .HTTPS_PORT $NETWORK_CONFIG)
