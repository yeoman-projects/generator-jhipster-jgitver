const chalk = require('chalk');
const shelljs = require('shelljs');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const packagejs = require('../../package.json');

const JGITVER_VER_GRADLE = '0.6.1';
// JGITVER maven plugin version is defined in extensions.exml file

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    // Nothing to do
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getAllJhipsterConfig();
                if (!this.jhipsterAppConfig.buildTool) {
                    this.error('Cannot read build tool in .yo-rc.json');
                }
            },
            displayLogo() {
                // it's here to show that you can use functions from generator-jhipster
                // this function is in: generator-jhipster/generators/generator-base.js
                // this.printJHipsterLogo();

                // Have Yeoman greet the user.
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster jgitver')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            },
            checkGitFolder() {
                const gitDir = '.git';
                if (!shelljs.test('-d', gitDir)) {
                    this.error('Your generated project shall be configured with git');
                }
            }
        };
    }

    writing() {
        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        // read config from .yo-rc.json
        this.buildTool = this.jhipsterAppConfig.buildTool;

        // show all variables
        this.log('\n--- some config read from config ---');
        this.log(`buildTool=${this.buildTool}`);

        // Update the pom file to set the version to 0.0.0
        // TODO : Regexp based on fact that version is indented with 4 spaces. Shall be modified.
        this.updatePom = function () {
            const pomFile = 'pom.xml';
            try {
                jhipsterUtils.replaceContent({
                    file: pomFile,
                    pattern: /(\s{4}<groupId>\S*<\/groupId>\r?\n\s{4}<artifactId>\S*?<\/artifactId>\r?\n\s{4}<version>)\S*?(<\/version>)/m,
                    regex: true,
                    content: '$10.0.0$2'
                }, this);
            } catch (e) {
                this.log(chalk.yellow('\nUnable to find ') + pomFile + chalk.yellow(' is not updated\n'));
                this.debug('Error:', e);
            }
        };

        // Update the build.gradle file to set the version to 0.0.0 and add dependance to jgitver plugin
        this.updateGradle = function () {
            const gradleFile = 'build.gradle';
            try {
                jhipsterUtils.replaceContent({
                    file: gradleFile,
                    pattern: /(group = '\S*?\r?\nversion = ')\S*/g,
                    regex: true,
                    content: '$10.0.0\''
                }, this);
                this.addGradlePluginToPluginsBlock('fr.brouillard.oss.gradle.jgitver', JGITVER_VER_GRADLE);
            } catch (e) {
                this.log(chalk.yellow('\nUnable to find ') + gradleFile + chalk.yellow(' is not updated\n'));
                this.debug('Error:', e);
            }
        };

        // Add the computed maven version to the application.yml file that with be resolved by maven filtering
        this.updateApplicationYml = function () {
            const applicationFile = `${jhipsterConstants.SERVER_MAIN_RES_DIR}config/application.yml`;
            const resourcesBlock = 'appVersion: #project.version#';
            try {
                jhipsterUtils.rewriteFile(
                    {
                        file: applicationFile,
                        needle: '# application:',
                        splicable: [resourcesBlock]
                    },
                    this
                );
            } catch (e) {
                this.log(chalk.yellow('\nUnable to find ') + applicationFile + chalk.yellow(' is not updated\n'));
                this.debug('Error:', e);
            }
        };

        // Change the versionParser function to read the function into the build directory
        this.updateVersionParser = function () {
            const utilsFile = 'webpack/utils.js';
            let buildFile;
            let patternSearch;
            let readPattern;
            if (this.buildTool === 'gradle') {
                buildFile = 'build/resources/main/META-INF/build-info.properties';
                patternSearch = /\/\/ Returns the second occurrence of the[\s\S]*?versionRegex.exec\(buildGradle\)\[1\];\r?\n}/m;
                readPattern = 'build.version=';
            } else {
                buildFile = 'target/classes/config/application.yml';
                patternSearch = /const parseString[\s\S]*?return version;\r?\n}/m;
                readPattern = 'appVersion:';
            }
            let newParserContent = `// return the version number from '${buildFile}' file\n`;
            newParserContent += 'function parseVersion() {\n';
            newParserContent += `    const appPathFile = '${buildFile}';\n`;
            newParserContent += `    const versionRegex = /^${readPattern}\\s*(.*$)/gm;\n`;
            newParserContent += '    const appFile = fs.readFileSync(appPathFile, \'utf8\');\n';
            newParserContent += '    return versionRegex.exec(appFile)[1];\n';
            newParserContent += '}';
            try {
                jhipsterUtils.replaceContent({
                    file: utilsFile,
                    pattern: patternSearch,
                    regex: true,
                    content: newParserContent
                }, this);
            } catch (e) {
                this.log(chalk.yellow('\nUnable to find ') + utilsFile + chalk.yellow(' is not updated\n'));
                this.debug('Error:', e);
            }
        };


        if (this.buildTool === 'maven') {
            // JgitVer options set in the configuration file
            this.jgitver_mavenLike = true;
            this.jgitver_autoIncrementPatch = true;
            this.jgitver_useCommitDistance = true;
            this.jgitver_useDirty = true;

            // Activate JGitVer at maven build startup
            this.template('maven/jgitver.config.exml', '.mvn/jgitver.config.xml');
            // Add the JGitVer configuration file
            this.template('maven/extensions.exml', '.mvn/extensions.xml');
            this.updatePom();
            this.updateApplicationYml();
        }
        if (this.buildTool === 'gradle') {
            this.updateGradle();
        }
        this.updateVersionParser();
    }

    install() {
        let logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    }

    end() {
        this.log('/nEnd of jgitver generator');
    }
};
