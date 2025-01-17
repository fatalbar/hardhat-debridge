import "@typechain/hardhat";
import '@nomicfoundation/hardhat-chai-matchers'
import { task } from "hardhat/config";
import fs from "fs";

// need to import this package itself
import "./src"

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    }
  },
  typechain: {
    outDir: "typechain"
  }
};

task("build", "This task packs the current Hardhat's build-info file")
  .setAction(async () => {
    // read build info
    const buildInfoDir = `${__dirname}/artifacts/build-info`
    const buildInfoFiles = fs.readdirSync(buildInfoDir)
      .filter(file => file.match(/\.json/));
    if (buildInfoFiles.length != 1) {
      console.error("Don't know what build-info file to take")
    }
    const buildInfoFile = `${buildInfoDir}/${buildInfoFiles[0]}`;
    let buildInfo: string = fs.readFileSync(buildInfoFile).toString()

    // read debridge version
    const packageJsonFile = `${__dirname}/package.json`
    const packages = JSON.parse(fs.readFileSync(packageJsonFile).toString());
    const deBridgePackage = packages.devDependencies['@debridge-finance/contracts']
    const deBridgeContractsGitRev = deBridgePackage
      .match(/#([a-zA-Z0-9]+$)/)[1]
      .substring(0, 8);
    console.log(deBridgeContractsGitRev)

    // canonize filepaths, excluding findings in the contents of the contracts (e.g., import "@debridge-finance/...")
    buildInfo = buildInfo.replace(
      /(?<!import \\)"@debridge-finance\/contracts/g,
      `"https://github.com/debridge-finance/debridge-contracts-v1/blob/${deBridgeContractsGitRev}`,
    );

    // write build info
    const text = `
/** This file is autogenerated by the build task **/
type BuildInfo = {
  input: any,
  output: any,
  solcVersion: any
}
const buildInfo:any = ${buildInfo};
export default buildInfo as BuildInfo;
`;
      fs.writeFileSync(
        `${__dirname}/src/buildinfo.ts`,
        text
      )
  })
