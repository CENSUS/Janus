function generate_random_password() {
  echo $(pwgen -s -B -A -c "${1:-10}" 1)
}

function update_various_credentials() {
  MASTER_KEY_NAME=${1}
  SUB_KEY_VALUE=${2}
  VALUE_1=${3}
  VALUE_2=${4}

  # Check if file exists
  if [ ! -f "${VARIOUS_CREDENTIALS_JSON}" ]; then
    touch ${VARIOUS_CREDENTIALS_JSON}
  fi

  # Check if empty file
  if [[ -z $(grep '[^[:space:]]' "${VARIOUS_CREDENTIALS_JSON}") ]]; then
    echo "{}" >${VARIOUS_CREDENTIALS_JSON}
  fi

  # If `CREDENTIALS` key does not exist, append it to the JSON file
  if [ ! echo $(cat "${VARIOUS_CREDENTIALS_JSON}") | jq --exit-status '.CREDENTIALS' ] >/dev/null; then
    jq -n '{CREDENTIALS: {}}' >${VARIOUS_CREDENTIALS_JSON}
  fi

  jq '.CREDENTIALS. "'${MASTER_KEY_NAME^^}'" |= . + { "'$SUB_KEY_VALUE'": { "username": "'$VALUE_1'", "password": "'$VALUE_2'" } }' ${VARIOUS_CREDENTIALS_JSON} >tmp.json &&
    mv tmp.json ${VARIOUS_CREDENTIALS_JSON}
}

function construct_rabbitmq_settings() {
  API_TYPE=${1}

  mkdir -p build/application/various/${API_TYPE}_rabbitmq_settings

  local RABBITMQ_USERNAME=$(jq '.CREDENTIALS.RABBITMQ.'\"$(tr a-z- A-Z_ <<<$API_TYPE)\"'.username' ${VARIOUS_CREDENTIALS_JSON})
  local RABBITMQ_PASSWORD=$(jq '.CREDENTIALS.RABBITMQ.'\"$(tr a-z- A-Z_ <<<$API_TYPE)\"'.password' ${VARIOUS_CREDENTIALS_JSON})

  echo "$(rabbitmq_info_injector ${RABBITMQ_USERNAME} ${RABBITMQ_PASSWORD})" >build/application/various/${API_TYPE}_rabbitmq_settings/rabbitmq_settings.json

  kubectl -n $NS delete configmap app-rabbitmq-settings-${API_TYPE,,}-v1-map || log "app-rabbitmq-settings-${API_TYPE,,}-v1-map for the ${API_TYPE} is not present - Constructing..."
  kubectl -n $NS create configmap app-rabbitmq-settings-${API_TYPE,,}-v1-map --from-file=./build/application/various/${API_TYPE}_rabbitmq_settings/rabbitmq_settings.json
}

function logging_init() {
  # Reset the output and debug log files
  printf '' >${LOG_FILE} >${DEBUG_FILE}

  # Write all output to the control flow log to STDOUT
  tail -f ${LOG_FILE} &

  # Call the exit handler when we exit.
  trap "exit_fn" EXIT

  # Send stdout and stderr from child programs to the debug log file
  exec 1>>${DEBUG_FILE} 2>>${DEBUG_FILE}
}

function exit_fn() {
  rc=$?

  # Write an error icon to the current logging statement.
  if [ "0" -ne $rc ]; then
    pop_fn $rc
  fi

  # always remove the log trailer when the process exits.
  pkill -P $$
}

function push_fn() {
  #echo -ne "   - entering ${FUNCNAME[1]} with arguments $@"

  echo -ne "   - $@ ..." >>${LOG_FILE}
}

function log() {
  echo -e $@ >>${LOG_FILE}
}

function pop_fn() {
  #  echo exiting ${FUNCNAME[1]}

  local res=$1
  if [ $# -eq 0 ]; then
    echo -ne "\r✅" >>${LOG_FILE}

  elif [ $res -eq 0 ]; then
    echo -ne "\r✅" >>${LOG_FILE}

  elif [ $res -eq 1 ]; then
    echo -ne "\r⚠️" >>${LOG_FILE}

  elif [ $res -eq 2 ]; then
    echo -ne "\r☠️" >>${LOG_FILE}

  else
    echo -ne "\r" >>${LOG_FILE}
  fi

  echo "" >>${LOG_FILE}
}
