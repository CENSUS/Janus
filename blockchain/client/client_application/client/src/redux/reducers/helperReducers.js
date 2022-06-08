import * as publicTypes from "../../utils/constants/commonConstants";

export function loadingReducer(state = {}, { type }) {
  const matches = /(.*)_(REQUEST|SUCCESS|FAILURE)/.exec(type);
  if (!matches) return state;

  const [, requestName, requestState] = matches;

  return {
    ...state,
    [requestName]: requestState === "REQUEST",
  };
}

export function errorReducer(state = {}, { type, payload }) {
  const matches = /(.*)_(REQUEST|FAILURE)/.exec(type);
  if (!matches) return state;

  const [, requestName, requestState] = matches;
  return {
    ...state,
    [requestName]:
      requestState === "FAILURE"
        ? payload
          ? payload.message
          : ""
        : "Unknown error",
  };
}

export function notificationsReducer(
  state = { notifications: [] },
  { type, payload }
) {
  const matches = /(.*)_(NOTIFICATION)/.exec(type);
  if (!matches) return state;

  // const [, requestName, requestState] = matches;

  switch (type) {
    case publicTypes.APPEND_NEW_NOTIFICATION:
      const { key, message } = payload;
      return {
        notifications: [...state.notifications, { key: key, message: message }],
      };
    case publicTypes.UI_RECEIVED_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.key !== payload.key
        ),
      };
    default:
      return { ...state };
  }
}
