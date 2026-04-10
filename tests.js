import { authService, isGSTInWhitelist, isValidGSTFormat } from "./src/app/lib/auth.js";
import { dataService } from "./src/app/lib/data.js";

function assert(condition, message) {
    if (!condition) {
        console.error("❌ FAIL: " + message);
        process.exit(1);
    }
    console.log("✅ PASS: " + message);
}

// 1. GST Format validation
assert(isValidGSTFormat("27AABCU9603R1ZM"), "Valid GST format should pass");
assert(!isValidGSTFormat("INVALID_GST"), "Invalid GST format should fail");

// 2. GST Whitelist validation
assert(isGSTInWhitelist("27AABCU9603R1ZM"), "Whitelisted GST should pass");
assert(!isGSTInWhitelist("27AABCU9603R1ZA"), "Non-whitelisted GST should fail");

console.log("All unit tests passed.");
