import { createBrowserHistory as createHistory } from "history";
import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import { persistStore } from "redux-persist";
import { routerMiddleware } from "react-router-redux";
import rootReducer from "./redux/reducers/index";
import rootSaga from "./rootSaga";
import createSagaMiddleware from "redux-saga";
import JWTRefresher from "./middlewares/jwtRefresher";
import NotificationsManager from "./middlewares/notificationsManager";
import config from "./config";

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const history = createHistory({ basename: config.baseUrl });

const routingMiddleware = routerMiddleware(history);
const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
    rootReducer,
    composeEnhancers(
        applyMiddleware(
            JWTRefresher,
            thunkMiddleware,
            routingMiddleware,
            sagaMiddleware,
            NotificationsManager
        )
    )
);

export const persistor = persistStore(store);

sagaMiddleware.run(rootSaga);
