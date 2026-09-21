export const getPublicBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};
