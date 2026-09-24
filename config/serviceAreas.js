export const serviceAreas = {
  226001: "Lucknow",
  208001: "Kanpur",
};

export function getServiceCity(pinCode) {
  return serviceAreas[pinCode] || null;
}
