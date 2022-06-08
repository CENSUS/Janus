import { appendNotification } from "../redux/actions/CommonActions";

const randomKey = () => new Date().getTime() + Math.random();
const constructedPayload = (message) => ({
    key: randomKey(),
    message,
});

const notificationMessageConstructor = (type, message) => ({
    type,
    message,
});

export default function NotificationsManager({ dispatch, getState }) {
    return (next) => (action) => {
        const { type, payload } = action;
        const matches = /(.*)_(SUCCESS|FAILURE)/.exec(type);
        if (!matches) return next(action);
        const [, , requestState] = matches;

        if (action.isAPI) {
            switch (requestState) {
                case "SUCCESS":
                    // API returns (mainly) { data: response } - Thus, a String => Successful Response
                    if (
                        payload.status === 200 ||
                        payload.message ||
                        typeof payload === "string"
                    ) {
                        // was (?) => const { data: successMessage = payload } = payload;
                        const { data: successMessage, message } = payload;
                        const successMessageForComponent =
                            notificationMessageConstructor(
                                requestState,
                                successMessage || message
                            );
                        dispatch(
                            appendNotification(
                                constructedPayload(successMessageForComponent)
                            )
                        );
                    }
                    return next(action);
                case "FAILURE":
                    const { message: errorMessage } = payload;
                    const errorMessageForComponent =
                        notificationMessageConstructor(
                            requestState,
                            errorMessage
                        );
                    dispatch(
                        appendNotification(
                            constructedPayload(errorMessageForComponent)
                        )
                    );
                    return next(action);
                default:
                    return next(action);
            }
        }
        return next(action);
    };
}
