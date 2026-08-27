const fs = require("fs");
const path = require("path");
const { createRunOncePlugin, withDangerousMod } = require("@expo/config-plugins");

const POD_LINES = [
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
];

function patchPodfile(podfilePath) {
  if (!fs.existsSync(podfilePath)) {
    return;
  }

  let contents = fs.readFileSync(podfilePath, "utf8");
  if (POD_LINES.every((line) => contents.includes(line))) {
    return;
  }

  const marker = "target 'ExpoSaas' do\n  use_expo_modules!";
  if (!contents.includes(marker)) {
    throw new Error(`Could not find ExpoSaas target marker in ${podfilePath}`);
  }

  contents = contents.replace(marker, `${marker}\n${POD_LINES.join("\n")}`);
  fs.writeFileSync(podfilePath, contents);
}

const withIosPodFixes = (config) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      patchPodfile(path.join(config.modRequest.platformProjectRoot, "Podfile"));
      return config;
    },
  ]);

module.exports = createRunOncePlugin(withIosPodFixes, "with-ios-pod-fixes", "1.0.0");
