use soroban_sdk::contracterror;

/// Contract error types
#[contracterror]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum ContractError {
    GrantNotFound = 1,
    Unauthorized = 2,
    MilestoneAlreadyApproved = 3,
    QuorumNotReached = 4,
    DeadlinePassed = 5,
    InvalidInput = 6,
    MilestoneNotSubmitted = 7,
    AlreadyVoted = 8,
    MilestoneNotFound = 9,
    InvalidState = 10,
    NoRefundableAmount = 11,
    GrantAlreadyReleased = 12,
    NotMultisigSigner = 13,
    AlreadySignedRelease = 14,
    NotAllMilestonesApproved = 15,
    InsufficientStake = 16,
    StakeNotFound = 17,
    AlreadyRegistered = 18,
    BatchEmpty = 19,
    BatchTooLarge = 20,
    MilestoneAlreadySubmitted = 21,
    ContractPaused = 26,
}
