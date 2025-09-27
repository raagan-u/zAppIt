// Here we're calling a macro exported with Uniffi. This macro will
// write some functions and bind them to FFI type.
// These functions include:
// - `generate_circom_proof`
// - `verify_circom_proof`
// - `generate_halo2_proof`
// - `verify_halo2_proof`
// - `generate_noir_proof`
// - `verify_noir_proof`
mopro_ffi::app!();

/// You can also customize the bindings by #[uniffi::export]
/// Reference: https://mozilla.github.io/uniffi-rs/latest/proc_macro/index.html
#[uniffi::export]
fn mopro_uniffi_hello_world() -> String {
    "Hello, World!".to_string()
}

/// Generate a proof for circle membership and action using your anon_circle circuit
#[uniffi::export]
fn generate_anon_circle_proof(
    secret: String,
    circle_commitment: String,
    nullifier: String,
    circle_id: String,
    action_type: String,
    content_hash: String,
    vote_option: String,
) -> Result<String, String> {
    let srs_path = "./test-vectors/noir/anon_circle.srs".to_string();
    let circuit_path = "./test-vectors/noir/anon_circle.json".to_string();
    let circuit_inputs = vec![
        secret,
        circle_commitment,
        nullifier,
        circle_id,
        action_type,
        content_hash,
        vote_option,
    ];
    
    match generate_noir_proof(circuit_path, Some(srs_path), circuit_inputs) {
        Ok(proof) => Ok(proof),
        Err(e) => Err(format!("Failed to generate proof: {}", e)),
    }
}

/// Verify a proof for circle membership and action using your anon_circle circuit
#[uniffi::export]
fn verify_anon_circle_proof(proof: String) -> Result<bool, String> {
    let circuit_path = "./test-vectors/noir/anon_circle.json".to_string();
    
    match verify_noir_proof(circuit_path, proof) {
        Ok(valid) => Ok(valid),
        Err(e) => Err(format!("Failed to verify proof: {}", e)),
    }
}

// CIRCOM_TEMPLATE

// HALO2_TEMPLATE

#[cfg(test)]
mod noir_tests {
    use super::*;

    #[test]
    fn test_noir_anon_circle() {
        let srs_path = "./test-vectors/noir/anon_circle.srs".to_string();
        let circuit_path = "./test-vectors/noir/anon_circle.json".to_string();
        // Test inputs for your anon_circle circuit: secret, circle_commitment, nullifier, circle_id, action_type, content_hash, vote_option
        let circuit_inputs = vec!["1".to_string(), "1".to_string(), "2".to_string(), "3".to_string(), "0".to_string(), "4".to_string(), "0".to_string()];
        let result = generate_noir_proof(
            circuit_path.clone(),
            Some(srs_path.clone()),
            circuit_inputs.clone(),
        );
        assert!(result.is_ok());
        let proof = result.unwrap();
        let result = verify_noir_proof(circuit_path.clone(), proof);
        assert!(result.is_ok());
        let valid = result.unwrap();
        assert!(valid);
    }
}


#[cfg(test)]
mod uniffi_tests {
    use super::*;

    #[test]
    fn test_mopro_uniffi_hello_world() {
        assert_eq!(mopro_uniffi_hello_world(), "Hello, World!");
    }
}
