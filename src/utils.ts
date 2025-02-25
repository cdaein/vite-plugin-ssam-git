const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

/**
 * @param str - string to print in color
 * @param c - pre-defined color string from `colors` object
 * @returns Original string surrounded by color code and reset code.
 */
export const color = (str: string, c: keyof typeof colors) =>
  `${colors[c]}${str}${colors.reset}`;
