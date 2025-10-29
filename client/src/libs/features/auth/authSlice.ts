// import type { SpaMembershipLevelType } from "@/services/auth";
import type { Role } from "@/common/types/auth";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthState = {
  accountId: string | null;
  username: string | null;
  fullName?: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;

  image: string | null;

  roles: Role | null;

  avatar?: string | null;

  //   levelMembership: SpaMembershipLevelType | null;
};

const initialState: AuthState = {
  accountId: null,
  fullName: null,
  username: null,
  email: null,
  phone: null,
  address: null,

  image: null,
  roles: null,

  avatar: null,
  // spaId: null,
  //   levelMembership: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initialStore: () => initialState,
    setCredentials: (state, action: PayloadAction<AuthState>) => {
      Object.assign(state, action.payload);
    },
    setAvatar: (state, action: PayloadAction<string>) => {
      state.image = action.payload;
    },
    logout: () => {
      return initialState;
    },
  },
});

export const { setCredentials, logout, initialStore } = authSlice.actions;
export default authSlice.reducer;
