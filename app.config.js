// Estende o app.json. O google-services.json (Firebase) não vai para o git:
// - local: coloque-o na raiz do projeto
// - EAS Build: crie uma variável de ambiente do tipo "file" chamada GOOGLE_SERVICES_JSON
const fs = require('fs');

module.exports = ({ config }) => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);

  return {
    ...config,
    android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  };
};
