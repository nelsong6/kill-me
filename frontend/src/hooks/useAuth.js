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
