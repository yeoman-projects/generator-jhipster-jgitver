const chalk = require('chalk');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const shelljs = require('shelljs');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    // do something when argument is 'default'
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getAllJhipsterConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
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
                if (! shelljs.test('-d', gitDir)) {
                    this.error('\Your generated project shall be configured with git\n');
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
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        // show all variables
        this.log('\n--- some config read from config ---');
        this.log(`baseName=${this.baseName}`);
        this.log(`packageName=${this.packageName}`);
        this.log(`clientFramework=${this.clientFramework}`);
        this.log(`clientPackageManager=${this.clientPackageManager}`);
        this.log(`buildTool=${this.buildTool}`);

        this.log('\n--- some function ---');
        this.log(`angularAppName=${this.angularAppName}`);

        this.log('\n--- some const ---');
        this.log(`javaDir=${javaDir}`);
        this.log(`resourceDir=${resourceDir}`);
        this.log(`webappDir=${webappDir}`);

        this.updatePom = function () {
            const pomFile = 'pom.xml';
            try {
                jhipsterUtils.replaceContent({
                    file: pomFile,
                    pattern: /(<groupId>com.mycompany.myapp<\/groupId>\n\s*<artifactId>samples<\/artifactId>\n\s*<version>)\S*(<\/version>)/m,
                    regex: true,
                    content: '$10.0.0$2'
                }, this);
            } catch (e) {
                this.log(chalk.yellow('\nUnable to find ') + pomFile + chalk.yellow(' is not updated\n'));
                this.debug('Error:', e);
            }
        };

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

        this.updateVersionParser = function () {
            const utilsFile = 'webpack/utils.js';
            let buildFolder;
            if (this.buildTool === 'gradle') {
                buildFolder = 'build';
            } else {
                buildFolder = 'target';
            }
            let newParserContent = `// return the version number from ${buildFolder} 'application.yml' file\n`;
            newParserContent += 'function parseVersion() {\n';
            newParserContent += `    const appPathFile = '${buildFolder}/classes/config/application.yml';\n`;
            newParserContent += '    const versionRegex = /^appVersion:\s*(.*$)/gm;\n';
            newParserContent += '    const appFile = fs.readFileSync(appPathFile, \'utf8\');\n';
            newParserContent += '    return versionRegex.exec(appFile)[1];\n';
            newParserContent += '}';
            try {
                jhipsterUtils.replaceContent({
                    file: utilsFile,
                    pattern: /const parseString[\s\S]*?return version;\n}/m,
                    regex: true,
                    content: newParserContent
                }, this);
            } catch (e) {
                this.log(chalk.yellow('\nUnable to find ') + utilsFile + chalk.yellow(' is not updated\n'));
                this.debug('Error:', e);
            }
        }

        this.jgitver_mavenLike = true;
        this.jgitver_autoIncrementPatch = true;
        this.jgitver_useCommitDistance = true;
        this.jgitver_useDirty = true;

        if (this.buildTool === 'maven') {
            this.template('extensions.exml', '.mvn/extensions.xml');
            this.template('jgitver.config.exml', '.mvn/jgitver.config.xml');
            this.updatePom();
            this.updateApplicationYml();
            this.updateVersionParser();

        }
        if (this.buildTool === 'gradle') {
            this.error('Gradle option is not already implemented');
        }
    }

    // install() {
    //     let logMsg =
    //         `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

    //     if (this.clientFramework === 'angular1') {
    //         logMsg =
    //             `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
    //     }
    //     const injectDependenciesAndConstants = (err) => {
    //         if (err) {
    //             this.warning('Install of dependencies failed!');
    //             this.log(logMsg);
    //         } else if (this.clientFramework === 'angular1') {
    //             this.spawnCommand('gulp', ['install']);
    //         }
    //     };
    //     const installConfig = {
    //         bower: this.clientFramework === 'angular1',
    //         npm: this.clientPackageManager !== 'yarn',
    //         yarn: this.clientPackageManager === 'yarn',
    //         callback: injectDependenciesAndConstants
    //     };
    //     if (this.options['skip-install']) {
    //         this.log(logMsg);
    //     } else {
    //         this.installDependencies(installConfig);
    //     }
    // }

    end() {
        this.log('End of jgitver generator');
    }
};
