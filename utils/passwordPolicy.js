export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.";

export const PASSWORD_REQUIREMENTS = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    key: "uppercase",
    label: "At least one uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "At least one lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "At least one number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    key: "symbol",
    label: "At least one special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function isStrongPassword(value = "") {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(value));
}
