use dep::std;

// ------------------------------
// CONFIG
// ------------------------------
const MAX_CONTENT_LEN: u32 = 1024 * 1024; // optional max content size in bytes

// ------------------------------
// CIRCUIT FUNCTIONS
// ------------------------------

// 1️⃣ Membership Proof
fn prove_membership(secret: Field, circle_commitment: Field) -> bool {
    // Hash the secret
    let secret_hash = std::hash::poseidon::bn254::hash_1([secret]);

    // Check against circle commitment
    assert(secret_hash == circle_commitment);

    return true;
}

// 2️⃣ Compute Nullifier Commitment
fn compute_nullifier_commitment(secret: Field, nullifier: Field, circle_id: Field) -> Field {
    return std::hash::poseidon::bn254::hash_3([secret, nullifier, circle_id]);
}

// 3️⃣ Post Encrypted Content
fn post_content(
    secret: Field, 
    circle_commitment: Field, 
    nullifier: Field, 
    circle_id: Field, 
    content_hash: Field
) -> Field {
    // Verify membership
    let valid_member = prove_membership(secret, circle_commitment);
    assert(valid_member);

    // Compute nullifier commitment (prevents double-posting)
    let null_commit = compute_nullifier_commitment(secret, nullifier, circle_id);
    assert(null_commit != 0); // placeholder; uniqueness checked on-chain

    // Content hash (encrypted content uploaded to IPFS)
    assert(content_hash != 0); // ensure content exists

    return null_commit; // send to on-chain verifier
}

// 4️⃣ Vote
fn vote(
    secret: Field, 
    circle_commitment: Field, 
    nullifier: Field, 
    circle_id: Field, 
    vote_option: Field
) -> Field {
    // Verify membership
    let valid_member = prove_membership(secret, circle_commitment);
    assert(valid_member);

    // Compute nullifier commitment (prevents double-voting)
    let null_commit = compute_nullifier_commitment(secret, nullifier, circle_id);
    assert(null_commit != 0);

    // Validate vote option (example: 0 or 1)
    assert(vote_option == 0 || vote_option == 1);

    return null_commit; // send to on-chain verifier
}

// 5️⃣ Main function for proving membership
fn main(
    secret: Field,
    circle_commitment: Field,
    nullifier: Field,
    circle_id: Field,
    action_type: Field, // 0 for post, 1 for vote
    content_hash: Field,
    vote_option: Field
) -> Field {
    let null_commit = compute_nullifier_commitment(secret, nullifier, circle_id);
    
    // Verify membership
    let valid_member = prove_membership(secret, circle_commitment);
    assert(valid_member);
    
    // Route based on action type
    if (action_type == 0) {
        // Post content
        assert(content_hash != 0);
        return null_commit;
    } else {
        // Vote
        assert(vote_option == 0 || vote_option == 1);
        return null_commit;
    }
}