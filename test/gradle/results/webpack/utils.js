const fs = require('fs');

module.exports = {
    parseVersion
};

// return the version number from 'build/resources/main/META-INF/build-info.properties' file
function parseVersion() {
    const appPathFile = 'build/resources/main/META-INF/build-info.properties';
    const versionRegex = /^build.version=\s*(.*$)/gm;
    const appFile = fs.readFileSync(appPathFile, 'utf8');
    return versionRegex.exec(appFile)[1];
}
