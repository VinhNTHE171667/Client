import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import authReducer from "@/libs/features/auth/authSlice";
import { authApi } from "@/services/auth";
import persistStore from "redux-persist/es/persistStore";
import { accountApi } from "@/services/account";
import { serviceApi } from "@/services/services";
import { cartApi } from "@/services/cart";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [accountApi.reducerPath]: accountApi.reducer,
  [serviceApi.reducerPath]: serviceApi.reducer,
  [cartApi.reducerPath]: cartApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({ serializableCheck: false }).concat(
      authApi.middleware,
      accountApi.middleware,
      serviceApi.middleware,
      cartApi.middleware
    );
  },
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
