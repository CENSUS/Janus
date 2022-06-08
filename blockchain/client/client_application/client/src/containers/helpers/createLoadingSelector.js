const createLoadingSelector = (actions) => (state) =>
  actions.some((action) => state[action]);

export default createLoadingSelector;
