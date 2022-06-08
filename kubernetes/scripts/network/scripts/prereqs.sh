function check_prereqs() {
  kubectl >/dev/null
  if [[ $? -ne 0 ]]; then
    echo "No 'kubectl' binary available - (https://kubernetes.io/docs/tasks/tools/)"
    exit 1
  fi
}
