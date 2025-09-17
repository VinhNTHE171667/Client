import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import persistStore from "redux-persist/es/persistStore";


const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({

});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({ serializableCheck: false }).concat(

    );
  },
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
