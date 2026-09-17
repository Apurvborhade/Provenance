// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DonationTracker
/// @notice Escrows donated ETH and releases it only against owner-approved milestones.
///         Every state change emits an event so the full history is reconstructable from logs.
/// @dev Single-owner by design (hackathon scope). Multi-approver governance is future scope.
contract DonationTracker {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct Milestone {
        string description;
        uint256 amount; // wei
        bool approved;
        bool released;
        uint256 createdAt; // block.timestamp when requested
        uint256 releasedAt; // 0 until released
    }

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error NotOwner();
    error ZeroAmount();
    error EmptyDescription();
    error InvalidMilestone();
    error AlreadyApproved();
    error NotApproved();
    error AlreadyReleased();
    error InsufficientBalance();
    error TransferFailed();

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event Donated(address indexed donor, uint256 amount, uint256 timestamp);
    event MilestoneRequested(uint256 indexed id, string description, uint256 amount);
    event MilestoneApproved(uint256 indexed id);
    event MilestoneReleased(uint256 indexed id, uint256 amount, uint256 timestamp);

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    address public immutable owner;
    mapping(address => uint256) public donations;
    uint256 public totalDonated;
    uint256 public totalReleased;
    Milestone[] private _milestones;

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor() {
        owner = msg.sender;
    }

    // ---------------------------------------------------------------------
    // Donations
    // ---------------------------------------------------------------------

    /// @notice Donate ETH to the escrow. Recorded against msg.sender.
    function donate() external payable {
        _donate();
    }

    /// @notice Plain ETH transfers are treated as donations too.
    receive() external payable {
        _donate();
    }

    function _donate() internal {
        if (msg.value == 0) revert ZeroAmount();
        donations[msg.sender] += msg.value;
        totalDonated += msg.value;
        emit Donated(msg.sender, msg.value, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Milestones (owner only)
    // ---------------------------------------------------------------------

    /// @notice Record a milestone / spending request.
    /// @return id Index of the new milestone.
    function addMilestone(string calldata description, uint256 amount) external onlyOwner returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (bytes(description).length == 0) revert EmptyDescription();

        id = _milestones.length;
        _milestones.push(
            Milestone({
                description: description,
                amount: amount,
                approved: false,
                released: false,
                createdAt: block.timestamp,
                releasedAt: 0
            })
        );

        emit MilestoneRequested(id, description, amount);
    }

    /// @notice Approve a pending milestone.
    function approveMilestone(uint256 id) external onlyOwner {
        Milestone storage m = _getMilestone(id);
        if (m.approved) revert AlreadyApproved();
        m.approved = true;
        emit MilestoneApproved(id);
    }

    /// @notice Release funds for an approved milestone to the owner.
    function releaseMilestone(uint256 id) external onlyOwner {
        Milestone storage m = _getMilestone(id);
        if (!m.approved) revert NotApproved();
        if (m.released) revert AlreadyReleased();
        if (address(this).balance < m.amount) revert InsufficientBalance();

        // effects
        m.released = true;
        m.releasedAt = block.timestamp;
        totalReleased += m.amount;

        // interaction
        (bool ok,) = payable(owner).call{value: m.amount}("");
        if (!ok) revert TransferFailed();

        emit MilestoneReleased(id, m.amount, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getMilestones() external view returns (Milestone[] memory) {
        return _milestones;
    }

    function getMilestone(uint256 id) external view returns (Milestone memory) {
        return _getMilestone(id);
    }

    function getMilestoneCount() external view returns (uint256) {
        return _milestones.length;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _checkOwner() internal view {
        if (msg.sender != owner) revert NotOwner();
    }

    function _getMilestone(uint256 id) internal view returns (Milestone storage) {
        if (id >= _milestones.length) revert InvalidMilestone();
        return _milestones[id];
    }
}
