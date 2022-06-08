import React, { Component } from "react";
import { store } from "react-notifications-component";

/**
 *
 * @param {*} type The type of the message (Success/Failure)
 * @param {*} message The actual message - It may be an Object or a simple string
 * @returns String
 */
const constructMessage = (type, message) => {
    if (message && message.status === 500) {
        if (!message.isEndorsed)
            return "The Blockchain failed to provide the appropriate data";
        return "Internal error";
    }
    return (
        (typeof message === "string" && message) ||
        `Unknown ${type ? "message" : "error"}`
    );
};

export default class NotificationManager extends Component {
    constructor(props) {
        super(props);

        this.state = {
            notificationsReducer: {
                notifications: [],
            },
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.notificationsReducer !== this.state.notificationsReducer
        );
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.notificationsReducer !== nextProps.notificationsReducer) {
            return {
                notificationsReducer: {
                    notifications: nextProps.notificationsReducer.notifications,
                },
            };
        }
    }

    displayErrorMessage = ({ type, message }) => {
        const isSuccess = type === "SUCCESS";
        store.addNotification({
            title: isSuccess ? "Success" : "Error",
            message: constructMessage(isSuccess, message),
            type: isSuccess ? "success" : "danger",
            insert: "top",
            container: "bottom-left",
            animationIn: ["animate__animated", "animate__fadeIn"],
            animationOut: ["animate__animated", "animate__fadeOut"],
            dismiss: {
                duration: 8000,
                onScreen: true,
            },
        });
    };
    componentDidUpdate() {
        this.state.notificationsReducer.notifications.forEach(
            (notification) => {
                this.displayErrorMessage(notification.message);
                this.props.updateNotifications({ key: notification.key });
            }
        );
    }

    render() {
        return <></>;
    }
}
