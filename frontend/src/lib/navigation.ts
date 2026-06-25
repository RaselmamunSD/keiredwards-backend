export const LANDING_DOMAIN = "https://iwaskilledforthisinformation.com";
export const LOGIN_DOMAIN = "https://iwaskilledforthisinformation.one";
export const SIGNUP_DOMAIN = "https://iwaskilledforthisinformation.online";

export const getCrossDomainUrl = (targetDomain: string, path: string): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Keep relative paths for local development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return path;
    }
    // Clean target domain for host checking
    const cleanTarget = targetDomain.replace(/^https?:\/\//, "").split(":")[0];
    if (hostname.includes(cleanTarget)) {
      return path;
    }
  }
  return `${targetDomain}${path}`;
};
