import { insforge } from '../config';

export { insforge };

export const unauthenticatedError = (message = 'Session expired. Please sign in again and try again.') => ({
  code: 'UNAUTHENTICATED',
  message,
});

export const requireCurrentUser = async () => {
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  if (userError || !userData?.user) {
    return {
      data: null,
      error: unauthenticatedError(),
    };
  }

  return { data: userData.user, error: null };
};
