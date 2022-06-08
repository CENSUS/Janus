import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import Application from "./containers/MainApp";
import { store, persistor } from "./store";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import { PersistGate } from "redux-persist/lib/integration/react";
require("dotenv").config({ path: "./../config/.env" });

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <ReactNotification />
            <PersistGate persistor={persistor}>
                <Application />
            </PersistGate>
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);
