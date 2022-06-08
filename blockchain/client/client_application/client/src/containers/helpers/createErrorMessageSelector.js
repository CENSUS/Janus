export const createErrorMessageSelector = (actions) => (state) => {
  if (!state.error) return "";
  const errors = actions.map((action) => state.error[action]);
  if (errors && errors[0]) {
    return errors[0];
  }
  return "";
};

export default createErrorMessageSelector;
