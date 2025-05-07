// Remove undefined and empty fields
export const sanitizeObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
