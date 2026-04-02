import fs from "fs";
import path from "path";

const newVersion = process.argv[2];

if (!newVersion) {
    console.error("Please provide a version string (e.g., bun run version 1.0.1)");
    process.exit(1);
}

// 1. Update app/package.json
const packageJsonPath = path.resolve(import.meta.dir, "../app/package.json");
if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    pkg.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`[Version] Updated app/package.json to ${newVersion}`);
} else {
    console.warn("[Version] app/package.json not found!");
}

// 2. Update host/src/build_exe.ahk
const buildExePath = path.resolve(import.meta.dir, "../host/src/build_exe.ahk");
if (fs.existsSync(buildExePath)) {
    let buildContent = fs.readFileSync(buildExePath, "utf-8");
    buildContent = buildContent.replace(
        /BINGEKIT_Version\s*:=\s*"[^"]+"/,
        `BINGEKIT_Version := "${newVersion}"`
    );
    fs.writeFileSync(buildExePath, buildContent);
    console.log(`[Version] Updated host/src/build_exe.ahk to ${newVersion}`);
} else {
    console.warn("[Version] host/src/build_exe.ahk not found!");
}

console.log("\nSuccess: Version updated across all components.");
