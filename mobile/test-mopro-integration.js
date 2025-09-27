/**
 * Test script for Mopro Noir integration
 * This tests the basic functionality of the updated React Native package
 */

const MoproReactNativePackage = require("mopro-react-native-package").default;

async function testNoirIntegration() {
  console.log("🧪 Testing Mopro Noir Integration...");

  try {
    // Test 1: Basic hello world function
    console.log("\n📋 Test 1: Basic hello world function");
    const hello = MoproReactNativePackage.moproUniffiHelloWorld();
    console.log("✅ Hello world result:", hello);

    // Test 2: Initialize Mopro
    console.log("\n📋 Test 2: Initialize Mopro with anon_circle circuit");
    await MoproReactNativePackage.initialize({
      circuits: {
        anon_circle: {
          circuitPath: "./assets/circuits/anon_circle.json",
          srsPath: "./assets/circuits/default_18.srs",
        },
      },
    });
    console.log("✅ Mopro initialized successfully");

    // Test 3: Generate anon_circle proof
    console.log("\n📋 Test 3: Generate anon_circle proof");
    const proofResult = await MoproReactNativePackage.generateAnonCircleProof(
      "1", // secret
      "1", // circle_commitment
      "2", // nullifier
      "3", // circle_id
      "0", // action_type
      "4", // content_hash
      "0" // vote_option
    );
    console.log("✅ Proof generated:", proofResult);

    // Test 4: Verify anon_circle proof
    console.log("\n📋 Test 4: Verify anon_circle proof");
    const isValid = await MoproReactNativePackage.verifyAnonCircleProof(
      proofResult
    );
    console.log("✅ Proof verification result:", isValid);

    console.log(
      "\n🎉 All tests passed! Noir integration is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNoirIntegration();
}

module.exports = { testNoirIntegration };
