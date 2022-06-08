import { call, put } from "redux-saga/effects";

export function* functionRequestStart(action, apiFunction) {
  const { payload } = action;

  let success = true;
  let response = {};
  try {
    response = yield call(apiFunction, payload);
  } catch (e) {
    response = e.response;
    success = false;
  }

  if (typeof response === "undefined") {
    success = false;
  }

  return {
    action,
    success,
    response,
  };
}

export function* functionRequestEnd({ action, success, response }) {
  const { type, isAPI } = action;
  const matches = /(.*)_(REQUEST)/.exec(type);
  const [, requestName] = matches;

  // if (success) {
  //   yield put({
  //     type: `${requestName}_SUCCESS`,
  //     isAPI: isAPI,
  //     payload: response,
  //   });
  // } else {
  //   yield put({
  //     type: `${requestName}_FAILURE`,
  //     isAPI: isAPI,
  //     payload: response,
  //   });
  // }

  yield put({
    type: success ? `${requestName}_SUCCESS` : `${requestName}_FAILURE`,
    isAPI: isAPI,
    payload: response,
  });

  return {
    action,
    success,
    response,
  };
}

export function* callbackHandler({ action, success, response }) {
  const { callback } = action;
  if (typeof callback === "function") {
    yield call(callback, success, response);
  }

  return action;
}

export function* composeHandlersHelper(action, { functionCall = () => {} } = {}) {
  const { success, response } = yield functionRequestStart(action, functionCall);

  yield functionRequestEnd({ action, success, response });

  yield callbackHandler({ action, success, response });
}

export function composeHandlers(config) {
  return function* (action) {
    yield composeHandlersHelper(action, config);
  };
}
