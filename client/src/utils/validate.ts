import { match } from "path-to-regexp";

export const checkActiveLink = (
  activeLinks: string[],
  pathName: string
): boolean => {
  return activeLinks.some((pattern) => {
    const matcher = match(pattern, { decode: decodeURIComponent });
    return matcher(pathName);
  });
};
