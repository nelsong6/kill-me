// Thin wrapper around Auth0's useAuth0 hook that pre-fills the audience parameter.
// Every API call needs a Bearer token scoped to the backend's Auth0 resource server.
// getToken() is passed down through the component tree (App → TodayTab, HistoryTab,
// WorkoutDrawer) so each component can make authenticated fetch calls.

import { useAuth0 } from '@auth0/auth0-react';

const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

export const useAuth = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const getToken = async () =>
    getAccessTokenSilently({ authorizationParams: { audience: AUDIENCE } });

  const login = () =>
    loginWithRedirect({ authorizationParams: { audience: AUDIENCE } });

  const logoutUser = () =>
    logout({ logoutParams: { returnTo: window.location.origin } });

  return { isAuthenticated, isLoading, user, login, logout: logoutUser, getToken };
};
