const fs = require('fs');

module.exports = {
    parseVersion
};

const parseString = function () {
    return 'toto';
};
// return the version number from `pom.xml` file
function parseVersion() {
    let version = null;
    const pomXml = fs.readFileSync('pom.xml', 'utf8');
    parseString(pomXml, (err, result) => {
        if (err) {
            throw new Error('Failed to parse pom.xml: ');
        }
        if (result.project.version && result.project.version[0]) {
            version = result.project.version[0];
        } else if (result.project.parent && result.project.parent[0] && result.project.parent[0].version && result.project.parent[0].version[0]) {
            version = result.project.parent[0].version[0];
        }
    });
    if (version === null) {
        throw new Error('pom.xml is malformed. No version is defined');
    }
    return version;
}
