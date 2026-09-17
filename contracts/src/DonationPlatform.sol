// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DonationPlatform
/// @notice Multi-organisation donation escrow. Anyone can create an org; donors give ETH to a
///         specific org; the org owner requests milestone releases; the platform admin approves;
///         the org owner releases approved funds to their wallet. Every state change emits an event.
/// @dev One contract for all orgs: one address to verify, one address to index. Org balances are
///      tracked per-org; invariant: sum(org.balance) == address(this).balance.
contract DonationPlatform {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct Org {
        address owner;
        string name;
        string description;
        uint256 totalDonated;
        uint256 totalReleased;
        uint256 balance; // escrowed for this org
        uint256 donorCount;
        uint256 createdAt;
    }

    struct Milestone {
        string description;
        uint256 amount; // wei
        bool approved;
        bool released;
        uint256 createdAt;
        uint256 releasedAt; // 0 until released
    }

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error NotAdmin();
    error NotOrgOwner();
    error InvalidOrg();
    error EmptyName();
    error ZeroAmount();
    error EmptyDescription();
    error InvalidMilestone();
    error AlreadyApproved();
    error NotApproved();
    error AlreadyReleased();
    error InsufficientBalance();
    error TransferFailed();
    error DirectTransferNotAllowed();

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event OrgCreated(uint256 indexed orgId, address indexed owner, string name, string description);
    event OrgUpdated(uint256 indexed orgId, string name, string description);
    event Donated(uint256 indexed orgId, address indexed donor, uint256 amount, string message, uint256 timestamp);
    event MilestoneRequested(uint256 indexed orgId, uint256 indexed milestoneId, string description, uint256 amount);
    event MilestoneApproved(uint256 indexed orgId, uint256 indexed milestoneId);
    event MilestoneReleased(uint256 indexed orgId, uint256 indexed milestoneId, uint256 amount, uint256 timestamp);

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    /// @notice Platform admin: approves milestone releases. Set to deployer.
    address public immutable admin;

    /// @notice Platform-wide lifetime totals.
    uint256 public totalDonated;
    uint256 public totalReleased;

    Org[] private _orgs;
    mapping(uint256 orgId => Milestone[]) private _milestones;
    /// @notice orgId => donor => cumulative amount donated.
    mapping(uint256 orgId => mapping(address donor => uint256)) public donations;

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyAdmin() {
        _checkAdmin();
        _;
    }

    modifier onlyOrgOwner(uint256 orgId) {
        _checkOrgOwner(orgId);
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor() {
        admin = msg.sender;
    }

    /// @dev Plain ETH transfers can't be attributed to an org, so reject them.
    receive() external payable {
        revert DirectTransferNotAllowed();
    }

    // ---------------------------------------------------------------------
    // Orgs
    // ---------------------------------------------------------------------

    /// @notice Register a new organisation. Caller becomes its owner.
    function createOrg(string calldata name, string calldata description) external returns (uint256 orgId) {
        if (bytes(name).length == 0) revert EmptyName();

        orgId = _orgs.length;
        _orgs.push(
            Org({
                owner: msg.sender,
                name: name,
                description: description,
                totalDonated: 0,
                totalReleased: 0,
                balance: 0,
                donorCount: 0,
                createdAt: block.timestamp
            })
        );

        emit OrgCreated(orgId, msg.sender, name, description);
    }

    /// @notice Update an org's public profile.
    function updateOrg(uint256 orgId, string calldata name, string calldata description) external onlyOrgOwner(orgId) {
        if (bytes(name).length == 0) revert EmptyName();
        Org storage o = _orgs[orgId];
        o.name = name;
        o.description = description;
        emit OrgUpdated(orgId, name, description);
    }

    // ---------------------------------------------------------------------
    // Donations
    // ---------------------------------------------------------------------

    /// @notice Donate ETH to an org, with an optional public message.
    function donate(uint256 orgId, string calldata message) external payable {
        if (msg.value == 0) revert ZeroAmount();
        Org storage o = _getOrg(orgId);

        if (donations[orgId][msg.sender] == 0) o.donorCount += 1;
        donations[orgId][msg.sender] += msg.value;

        o.totalDonated += msg.value;
        o.balance += msg.value;
        totalDonated += msg.value;

        emit Donated(orgId, msg.sender, msg.value, message, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Milestones
    // ---------------------------------------------------------------------

    /// @notice Org owner records what funds will be used for and how much.
    function addMilestone(uint256 orgId, string calldata description, uint256 amount)
        external
        onlyOrgOwner(orgId)
        returns (uint256 milestoneId)
    {
        if (amount == 0) revert ZeroAmount();
        if (bytes(description).length == 0) revert EmptyDescription();

        Milestone[] storage list = _milestones[orgId];
        milestoneId = list.length;
        list.push(
            Milestone({
                description: description,
                amount: amount,
                approved: false,
                released: false,
                createdAt: block.timestamp,
                releasedAt: 0
            })
        );

        emit MilestoneRequested(orgId, milestoneId, description, amount);
    }

    /// @notice Platform admin approves a pending milestone.
    function approveMilestone(uint256 orgId, uint256 milestoneId) external onlyAdmin {
        _getOrg(orgId);
        Milestone storage m = _getMilestone(orgId, milestoneId);
        if (m.approved) revert AlreadyApproved();
        m.approved = true;
        emit MilestoneApproved(orgId, milestoneId);
    }

    /// @notice Org owner releases an approved milestone's funds to their wallet.
    function releaseMilestone(uint256 orgId, uint256 milestoneId) external onlyOrgOwner(orgId) {
        Org storage o = _orgs[orgId];
        Milestone storage m = _getMilestone(orgId, milestoneId);
        if (!m.approved) revert NotApproved();
        if (m.released) revert AlreadyReleased();
        if (o.balance < m.amount) revert InsufficientBalance();

        // effects
        m.released = true;
        m.releasedAt = block.timestamp;
        o.balance -= m.amount;
        o.totalReleased += m.amount;
        totalReleased += m.amount;

        // interaction
        (bool ok,) = payable(o.owner).call{value: m.amount}("");
        if (!ok) revert TransferFailed();

        emit MilestoneReleased(orgId, milestoneId, m.amount, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getOrgs() external view returns (Org[] memory) {
        return _orgs;
    }

    function getOrg(uint256 orgId) external view returns (Org memory) {
        return _getOrg(orgId);
    }

    function getOrgCount() external view returns (uint256) {
        return _orgs.length;
    }

    function getMilestones(uint256 orgId) external view returns (Milestone[] memory) {
        _getOrg(orgId);
        return _milestones[orgId];
    }

    function getMilestone(uint256 orgId, uint256 milestoneId) external view returns (Milestone memory) {
        _getOrg(orgId);
        return _getMilestone(orgId, milestoneId);
    }

    function getMilestoneCount(uint256 orgId) external view returns (uint256) {
        return _milestones[orgId].length;
    }

    /// @notice Total ETH escrowed across all orgs.
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _checkAdmin() internal view {
        if (msg.sender != admin) revert NotAdmin();
    }

    function _checkOrgOwner(uint256 orgId) internal view {
        if (_getOrg(orgId).owner != msg.sender) revert NotOrgOwner();
    }

    function _getOrg(uint256 orgId) internal view returns (Org storage) {
        if (orgId >= _orgs.length) revert InvalidOrg();
        return _orgs[orgId];
    }

    function _getMilestone(uint256 orgId, uint256 milestoneId) internal view returns (Milestone storage) {
        Milestone[] storage list = _milestones[orgId];
        if (milestoneId >= list.length) revert InvalidMilestone();
        return list[milestoneId];
    }
}
