const fs = require('fs');

module.exports = ({ config }) => {
  const android = { ...config.android };
  const localGoogleServicesFile = './google-services.json';
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(localGoogleServicesFile) ? localGoogleServicesFile : null);

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
