const fs = require('fs');

const appJson = require('./app.json');

module.exports = () => {
  const config = appJson.expo;
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
