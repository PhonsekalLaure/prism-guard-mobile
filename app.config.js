const fs = require('fs');

module.exports = ({ config }) => {
  const android = { ...config.android };
  const mapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;
  const localGoogleServicesFile = './google-services.json';
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(localGoogleServicesFile) ? localGoogleServicesFile : null);

  android.config = { ...android.config };

  if (mapsApiKey) {
    android.config.googleMaps = {
      ...(android.config.googleMaps || {}),
      apiKey: mapsApiKey,
    };
  }

  if (googleServicesFile) {
    android.googleServicesFile = googleServicesFile;
  } else {
    delete android.googleServicesFile;
  }

  return {
    ...config,
    android,
  };
};
