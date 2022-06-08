import { refreshToken } from "../redux/actions/AuthActions";
import { decodeJWT } from "../utils/processors/data_processors";
import moment from "moment";

export default function JWTRefresher({ dispatch, getState }) {
  return (next) => (action) => {
    if (action.isAPI) {
      if (getState().authReducer && getState().authReducer.token) {
        var tokenExpiration = decodeJWT(getState().authReducer.token).exp;
        if (
          tokenExpiration &&
          moment(tokenExpiration) - moment(Date.now()) < 5000
        ) {
          if (!getState().authReducer.freshTokenPromise) {
            return refreshToken(dispatch).then(() => next(action));
          } else {
            return getState().authReducer.freshTokenPromise.then(() =>
              next(action)
            );
          }
        }
      }
    }
    return next(action);
  };
}
