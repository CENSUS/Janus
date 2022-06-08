import * as commonConstants from "../../utils/constants/commonConstants";

export const fetchOrganizationsList = (payload, callback) => ({
  type: commonConstants.FETCH_ORGANIZATIONS_LIST_REQUEST,
  payload,
  isAPI: false,
  callback,
});

export const appendNotification = (payload, callback) => ({
  type: commonConstants.APPEND_NEW_NOTIFICATION,
  payload,
  isAPI: false,
  callback,
});

export const updateNotifications = (payload, callback) => ({
  type: commonConstants.UI_RECEIVED_NOTIFICATION,
  payload,
  isAPI: false,
  callback,
});

export const syncWithBCRequest = (payload, callback) => ({
  type: commonConstants.SYNC_WITH_BC_REQUEST,
  payload,
  isAPI: true,
  callback,
});