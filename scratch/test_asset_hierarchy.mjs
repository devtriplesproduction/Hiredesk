import assert from "node:assert";

// Simulation of the HireDesk Asset Hierarchy & Storage Logic

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const localStorage = new MockStorage();

function getContractAssetKey(contractId, assetType) {
  return `contract_${contractId}_${assetType}`;
}

function resolveContractAsset(contractId, assetType, contractAsset, globalAsset) {
  if (contractAsset !== undefined && contractAsset !== null && contractAsset.trim() !== "") {
    return contractAsset.trim();
  }
  const localContractAsset = localStorage.getItem(getContractAssetKey(contractId, assetType));
  if (localContractAsset && localContractAsset.trim() !== "") {
    return localContractAsset.trim();
  }
  if (globalAsset !== undefined && globalAsset !== null && globalAsset.trim() !== "") {
    return globalAsset.trim();
  }
  const localGlobal = localStorage.getItem(`tsp_${assetType}`);
  if (localGlobal && localGlobal.trim() !== "") {
    return localGlobal.trim();
  }
  return "";
}

function uploadGlobalAsset(assetType, url) {
  localStorage.setItem(`tsp_${assetType}`, url);
}

function deleteGlobalAsset(assetType) {
  localStorage.removeItem(`tsp_${assetType}`);
}

function uploadContractAsset(contractId, url, assetType) {
  localStorage.setItem(getContractAssetKey(contractId, assetType), url);
}

function deleteContractAsset(contractId, assetType) {
  localStorage.removeItem(getContractAssetKey(contractId, assetType));
}

console.log("--- Starting Hierarchy Tests ---");

// Test 1: Initially no assets exist
assert.strictEqual(resolveContractAsset("contract-1", "logo", "", ""), "");
assert.strictEqual(resolveContractAsset("contract-2", "logo", "", ""), "");
console.log("✔ Test 1: No assets resolves to empty string");

// Test 2: Upload Global Logo A and Signature A
uploadGlobalAsset("logo", "https://cdn.example.com/logo-global-a.png");
uploadGlobalAsset("sign", "https://cdn.example.com/sign-global-a.png");
const globalLogoA = "https://cdn.example.com/logo-global-a.png";
const globalSignA = "https://cdn.example.com/sign-global-a.png";

// Both contracts should resolve to Global Assets
assert.strictEqual(
  resolveContractAsset("contract-1", "logo", "", globalLogoA),
  globalLogoA
);
assert.strictEqual(
  resolveContractAsset("contract-1", "sign", "", globalSignA),
  globalSignA
);
assert.strictEqual(
  resolveContractAsset("contract-2", "logo", "", globalLogoA),
  globalLogoA
);
assert.strictEqual(
  resolveContractAsset("contract-2", "sign", "", globalSignA),
  globalSignA
);
console.log("✔ Test 2: Global Logo & Sign inherit across all contracts");

// Test 3: Contract 1 uploads custom Logo B and Signature B
uploadContractAsset("contract-1", "https://cdn.example.com/logo-contract1-b.png", "logo");
uploadContractAsset("contract-1", "https://cdn.example.com/sign-contract1-b.png", "sign");
const contract1LogoB = "https://cdn.example.com/logo-contract1-b.png";
const contract1SignB = "https://cdn.example.com/sign-contract1-b.png";

// Contract 1 now resolves to custom override B
assert.strictEqual(
  resolveContractAsset("contract-1", "logo", contract1LogoB, globalLogoA),
  contract1LogoB
);
assert.strictEqual(
  resolveContractAsset("contract-1", "sign", contract1SignB, globalSignA),
  contract1SignB
);

// Contract 2 still resolves to Global Logo A & Signature A (NO LEAKAGE)
assert.strictEqual(
  resolveContractAsset("contract-2", "logo", "", globalLogoA),
  globalLogoA
);
assert.strictEqual(
  resolveContractAsset("contract-2", "sign", "", globalSignA),
  globalSignA
);
console.log("✔ Test 3: Contract-specific override works without leaking to other contracts");

// Test 4: Removing Contract 1 custom logo reverts to Global Logo A immediately
deleteContractAsset("contract-1", "logo");
const contract1LogoAfterRemoval = "";
assert.strictEqual(
  resolveContractAsset("contract-1", "logo", contract1LogoAfterRemoval, globalLogoA),
  globalLogoA
);
// Signature B on contract 1 is untouched
assert.strictEqual(
  resolveContractAsset("contract-1", "sign", contract1SignB, globalSignA),
  contract1SignB
);
console.log("✔ Test 4: Removing contract custom logo reverts immediately to Global Logo");

// Test 5: Updating Global Logo A to Global Logo C propagates to Contract 1 (now fallback) and Contract 2
uploadGlobalAsset("logo", "https://cdn.example.com/logo-global-c.png");
const globalLogoC = "https://cdn.example.com/logo-global-c.png";

assert.strictEqual(
  resolveContractAsset("contract-1", "logo", "", globalLogoC),
  globalLogoC
);
assert.strictEqual(
  resolveContractAsset("contract-2", "logo", "", globalLogoC),
  globalLogoC
);
// Contract 1 custom signature B is STILL preserved
assert.strictEqual(
  resolveContractAsset("contract-1", "sign", contract1SignB, globalSignA),
  contract1SignB
);
console.log("✔ Test 5: Global asset change propagates to all contracts relying on global default");

// Test 6: Global Logo is cleared entirely
deleteGlobalAsset("logo");
const globalLogoCleared = "";

assert.strictEqual(
  resolveContractAsset("contract-1", "logo", "", globalLogoCleared),
  ""
);
assert.strictEqual(
  resolveContractAsset("contract-2", "logo", "", globalLogoCleared),
  ""
);
// Contract 1 signature B still preserved
assert.strictEqual(
  resolveContractAsset("contract-1", "sign", contract1SignB, globalSignA),
  contract1SignB
);
console.log("✔ Test 6: Clearing global logo cleanly clears inheriting contracts while preserving overrides");

console.log("All 6 test cases passed successfully!");
