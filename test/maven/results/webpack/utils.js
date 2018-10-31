const fs = require('fs');

module.exports = {
    parseVersion
};

// return the version number from 'target/classes/config/application.yml' file
function parseVersion() {
    const appPathFile = 'target/classes/config/application.yml';
    const versionRegex = /^appVersion:\s*(.*$)/gm;
    const appFile = fs.readFileSync(appPathFile, 'utf8');
    return versionRegex.exec(appFile)[1];
}
