/*eslint no-useless-escape: "warn"*/
export const ALPHABATICS_NUMERICS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~ \s]*$/;
export const ALPHABATICS_NUMERICS_REGEX_WITHOUT_SPACE = /^[^-\s][a-zA-Z0-9_\s-]+$/