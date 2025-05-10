import catchAsync from './catchError.js';

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const formatLocationToGeoJson = (req, res, next) => {
  if (req.body?.location && (req.body.location.lat || req.body.location.lng)) {
    // If location is in lat/lng format, convert to GeoJSON
    const lng = req.body.location.lng;
    const lat = req.body.location.lat;
    req.body.location = {
      type: 'Point',
      coordinates: [lng, lat],
    };
  }

  next();
};

export const formatLocationToClient = (location) => {
  if (location && location.coordinates) {
    return {
      lat: location.coordinates[1],
      lng: location.coordinates[0],
    };
  }
  return null;
};
