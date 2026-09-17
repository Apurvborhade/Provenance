// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DonationPlatform} from "../src/DonationPlatform.sol";

contract DonationPlatformTest is Test {
    DonationPlatform internal platform;

    address internal admin = makeAddr("admin");
    address internal orgA = makeAddr("orgA");
    address internal orgB = makeAddr("orgB");
    address internal donor = makeAddr("donor");
    address internal donor2 = makeAddr("donor2");
    address internal stranger = makeAddr("stranger");
    address internal vendor = makeAddr("vendor");

    event OrgCreated(uint256 indexed orgId, address indexed owner, string name, string description);
    event OrgUpdated(uint256 indexed orgId, string name, string description);
    event Donated(uint256 indexed orgId, address indexed donor, uint256 amount, string message, uint256 timestamp);
    event MilestoneRequested(
        uint256 indexed orgId, uint256 indexed milestoneId, string description, uint256 amount, address payee
    );
    event MilestoneApproved(uint256 indexed orgId, uint256 indexed milestoneId);
    event MilestoneReleased(
        uint256 indexed orgId, uint256 indexed milestoneId, uint256 amount, address payee, uint256 timestamp
    );
    event ProofAttached(
        uint256 indexed orgId, uint256 indexed milestoneId, bytes32 proofHash, string proofUri, uint256 timestamp
    );

    function setUp() public {
        vm.prank(admin);
        platform = new DonationPlatform();
        vm.deal(donor, 10 ether);
        vm.deal(donor2, 10 ether);
        vm.deal(stranger, 10 ether);
    }

    // ------------------------------------------------------------------ helpers

    function _createOrg(address owner, string memory name) internal returns (uint256 id) {
        vm.prank(owner);
        id = platform.createOrg(name, "desc");
    }

    function _donate(address from, uint256 orgId, uint256 amount) internal {
        vm.prank(from);
        platform.donate{value: amount}(orgId, "");
    }

    function _addMilestone(address owner, uint256 orgId, uint256 amount) internal returns (uint256 id) {
        vm.prank(owner);
        id = platform.addMilestone(orgId, "Textbooks", amount, vendor);
    }

    function _attachProof(address owner, uint256 orgId, uint256 mid) internal {
        vm.prank(owner);
        platform.attachProof(orgId, mid, keccak256("receipt.pdf"), "ipfs://Qm...receipt");
    }

    function _approve(uint256 orgId, uint256 mid) internal {
        vm.prank(admin);
        platform.approveMilestone(orgId, mid);
    }

    // ------------------------------------------------------------------ orgs

    function test_CreateOrg() public {
        vm.expectEmit(true, true, false, true);
        emit OrgCreated(0, orgA, "Org A", "desc");

        uint256 id = _createOrg(orgA, "Org A");
        assertEq(id, 0);
        assertEq(platform.getOrgCount(), 1);

        DonationPlatform.Org memory o = platform.getOrg(0);
        assertEq(o.owner, orgA);
        assertEq(o.name, "Org A");
        assertEq(o.balance, 0);
        assertEq(o.createdAt, block.timestamp);
    }

    function test_CreateMultipleOrgs() public {
        assertEq(_createOrg(orgA, "A"), 0);
        assertEq(_createOrg(orgB, "B"), 1);
        assertEq(_createOrg(orgA, "A2"), 2); // same wallet can own several
        assertEq(platform.getOrgs().length, 3);
        assertEq(platform.getOrg(1).owner, orgB);
    }

    function test_RevertCreateOrgEmptyName() public {
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.EmptyName.selector);
        platform.createOrg("", "x");
    }

    function test_UpdateOrg() public {
        uint256 id = _createOrg(orgA, "A");
        vm.expectEmit(true, false, false, true);
        emit OrgUpdated(id, "New", "New desc");
        vm.prank(orgA);
        platform.updateOrg(id, "New", "New desc");
        assertEq(platform.getOrg(id).name, "New");
    }

    function test_RevertUpdateOrgNotOwner() public {
        uint256 id = _createOrg(orgA, "A");
        vm.prank(orgB);
        vm.expectRevert(DonationPlatform.NotOrgOwner.selector);
        platform.updateOrg(id, "x", "y");
    }

    function test_RevertInvalidOrg() public {
        vm.expectRevert(DonationPlatform.InvalidOrg.selector);
        platform.getOrg(0);
        vm.prank(donor);
        vm.expectRevert(DonationPlatform.InvalidOrg.selector);
        platform.donate{value: 1 ether}(7, "");
    }

    // ------------------------------------------------------------------ donate

    function test_Donate() public {
        uint256 id = _createOrg(orgA, "A");

        vm.expectEmit(true, true, false, true);
        emit Donated(id, donor, 1 ether, "good luck", block.timestamp);

        vm.prank(donor);
        platform.donate{value: 1 ether}(id, "good luck");

        DonationPlatform.Org memory o = platform.getOrg(id);
        assertEq(o.totalDonated, 1 ether);
        assertEq(o.balance, 1 ether);
        assertEq(o.donorCount, 1);
        assertEq(platform.donations(id, donor), 1 ether);
        assertEq(platform.totalDonated(), 1 ether);
        assertEq(platform.getBalance(), 1 ether);
    }

    function test_DonorCountOnlyCountsUniqueDonors() public {
        uint256 id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        _donate(donor, id, 1 ether);
        _donate(donor2, id, 1 ether);
        assertEq(platform.getOrg(id).donorCount, 2);
        assertEq(platform.donations(id, donor), 2 ether);
    }

    function test_DonationsAreIsolatedPerOrg() public {
        uint256 a = _createOrg(orgA, "A");
        uint256 b = _createOrg(orgB, "B");
        _donate(donor, a, 2 ether);
        _donate(donor, b, 1 ether);

        assertEq(platform.getOrg(a).balance, 2 ether);
        assertEq(platform.getOrg(b).balance, 1 ether);
        assertEq(platform.donations(a, donor), 2 ether);
        assertEq(platform.donations(b, donor), 1 ether);
        assertEq(platform.totalDonated(), 3 ether);
    }

    function test_RevertDonateZero() public {
        uint256 id = _createOrg(orgA, "A");
        vm.prank(donor);
        vm.expectRevert(DonationPlatform.ZeroAmount.selector);
        platform.donate{value: 0}(id, "");
    }

    function test_RevertDirectTransfer() public {
        vm.prank(donor);
        (bool ok,) = address(platform).call{value: 1 ether}("");
        assertFalse(ok);
        assertEq(address(platform).balance, 0);
    }

    // ------------------------------------------------------------------ milestones

    function test_AddMilestone() public {
        uint256 id = _createOrg(orgA, "A");
        vm.expectEmit(true, true, false, true);
        emit MilestoneRequested(id, 0, "Textbooks", 0.5 ether, vendor);

        uint256 mid = _addMilestone(orgA, id, 0.5 ether);
        assertEq(mid, 0);
        assertEq(platform.getMilestoneCount(id), 1);

        DonationPlatform.Milestone memory m = platform.getMilestone(id, mid);
        assertEq(m.description, "Textbooks");
        assertEq(m.amount, 0.5 ether);
        assertEq(m.payee, vendor);
        assertFalse(m.approved);
        assertFalse(m.released);
        assertEq(m.proofAt, 0);
    }

    function test_RevertAddMilestoneZeroPayee() public {
        uint256 id = _createOrg(orgA, "A");
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.ZeroPayee.selector);
        platform.addMilestone(id, "x", 1, address(0));
    }

    function test_MilestoneIdsAreScopedPerOrg() public {
        uint256 a = _createOrg(orgA, "A");
        uint256 b = _createOrg(orgB, "B");
        assertEq(_addMilestone(orgA, a, 1), 0);
        assertEq(_addMilestone(orgA, a, 1), 1);
        assertEq(_addMilestone(orgB, b, 1), 0);
        assertEq(platform.getMilestones(a).length, 2);
        assertEq(platform.getMilestones(b).length, 1);
    }

    function test_RevertAddMilestoneNotOrgOwner() public {
        uint256 id = _createOrg(orgA, "A");
        vm.prank(orgB);
        vm.expectRevert(DonationPlatform.NotOrgOwner.selector);
        platform.addMilestone(id, "x", 1, vendor);
        // admin is not the org owner either
        vm.prank(admin);
        vm.expectRevert(DonationPlatform.NotOrgOwner.selector);
        platform.addMilestone(id, "x", 1, vendor);
    }

    function test_RevertAddMilestoneBadInput() public {
        uint256 id = _createOrg(orgA, "A");
        vm.startPrank(orgA);
        vm.expectRevert(DonationPlatform.ZeroAmount.selector);
        platform.addMilestone(id, "x", 0, vendor);
        vm.expectRevert(DonationPlatform.EmptyDescription.selector);
        platform.addMilestone(id, "", 1, vendor);
        vm.stopPrank();
    }

    function test_ApproveMilestone() public {
        uint256 id = _createOrg(orgA, "A");
        uint256 mid = _addMilestone(orgA, id, 1 ether);
        vm.expectEmit(true, true, false, false);
        emit MilestoneApproved(id, mid);
        _approve(id, mid);
        assertTrue(platform.getMilestone(id, mid).approved);
    }

    function test_RevertApproveNotAdmin() public {
        uint256 id = _createOrg(orgA, "A");
        uint256 mid = _addMilestone(orgA, id, 1 ether);
        // org owner cannot self-approve
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.NotAdmin.selector);
        platform.approveMilestone(id, mid);
    }

    function test_RevertApproveTwice() public {
        uint256 id = _createOrg(orgA, "A");
        uint256 mid = _addMilestone(orgA, id, 1 ether);
        _approve(id, mid);
        vm.prank(admin);
        vm.expectRevert(DonationPlatform.AlreadyApproved.selector);
        platform.approveMilestone(id, mid);
    }

    function test_RevertApproveInvalidMilestone() public {
        uint256 id = _createOrg(orgA, "A");
        vm.prank(admin);
        vm.expectRevert(DonationPlatform.InvalidMilestone.selector);
        platform.approveMilestone(id, 9);
    }

    function test_ReleaseMilestone() public {
        uint256 id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        uint256 mid = _addMilestone(orgA, id, 0.4 ether);
        _approve(id, mid);

        uint256 ownerBefore = orgA.balance;
        uint256 vendorBefore = vendor.balance;
        vm.expectEmit(true, true, false, true);
        emit MilestoneReleased(id, mid, 0.4 ether, vendor, block.timestamp);

        vm.prank(orgA);
        platform.releaseMilestone(id, mid);

        // funds go to the payee, never through the org wallet
        assertEq(vendor.balance, vendorBefore + 0.4 ether);
        assertEq(orgA.balance, ownerBefore);
        assertEq(platform.getOrg(id).releasedCount, 1);
        assertEq(platform.getOrg(id).proofCount, 0);
        DonationPlatform.Org memory o = platform.getOrg(id);
        assertEq(o.balance, 0.6 ether);
        assertEq(o.totalReleased, 0.4 ether);
        assertEq(platform.totalReleased(), 0.4 ether);
        assertEq(address(platform).balance, 0.6 ether);

        DonationPlatform.Milestone memory m = platform.getMilestone(id, mid);
        assertTrue(m.released);
        assertEq(m.releasedAt, block.timestamp);
    }

    function test_RevertReleaseNotApproved() public {
        uint256 id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        uint256 mid = _addMilestone(orgA, id, 0.4 ether);
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.NotApproved.selector);
        platform.releaseMilestone(id, mid);
    }

    function test_RevertReleaseTwice() public {
        uint256 id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        uint256 mid = _addMilestone(orgA, id, 0.4 ether);
        _approve(id, mid);
        vm.startPrank(orgA);
        platform.releaseMilestone(id, mid);
        vm.expectRevert(DonationPlatform.AlreadyReleased.selector);
        platform.releaseMilestone(id, mid);
        vm.stopPrank();
    }

    function test_RevertReleaseNotOrgOwner() public {
        uint256 id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        uint256 mid = _addMilestone(orgA, id, 0.4 ether);
        _approve(id, mid);
        vm.prank(admin);
        vm.expectRevert(DonationPlatform.NotOrgOwner.selector);
        platform.releaseMilestone(id, mid);
    }

    function test_RevertReleaseInsufficientOrgBalance() public {
        uint256 a = _createOrg(orgA, "A");
        uint256 b = _createOrg(orgB, "B");
        _donate(donor, b, 5 ether); // plenty in the contract, but it belongs to org B
        _donate(donor, a, 0.1 ether);
        uint256 mid = _addMilestone(orgA, a, 0.4 ether);
        _approve(a, mid);
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.InsufficientBalance.selector);
        platform.releaseMilestone(a, mid);
    }

    // ------------------------------------------------------------------ proof of spend

    function _releasedMilestone(uint256 amount) internal returns (uint256 id, uint256 mid) {
        id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        mid = _addMilestone(orgA, id, amount);
        _approve(id, mid);
        vm.prank(orgA);
        platform.releaseMilestone(id, mid);
    }

    function test_AttachProof() public {
        (uint256 id, uint256 mid) = _releasedMilestone(0.4 ether);
        bytes32 h = keccak256("receipt.pdf");

        vm.expectEmit(true, true, false, true);
        emit ProofAttached(id, mid, h, "ipfs://Qm...receipt", block.timestamp);

        vm.prank(orgA);
        platform.attachProof(id, mid, h, "ipfs://Qm...receipt");

        DonationPlatform.Milestone memory m = platform.getMilestone(id, mid);
        assertEq(m.proofHash, h);
        assertEq(m.proofUri, "ipfs://Qm...receipt");
        assertEq(m.proofAt, block.timestamp);
        assertEq(platform.getOrg(id).proofCount, 1);
    }

    function test_RevertAttachProofNotReleased() public {
        uint256 id = _createOrg(orgA, "A");
        uint256 mid = _addMilestone(orgA, id, 0.4 ether);
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.NotReleased.selector);
        platform.attachProof(id, mid, keccak256("x"), "https://x");
    }

    function test_RevertAttachProofTwice() public {
        (uint256 id, uint256 mid) = _releasedMilestone(0.4 ether);
        _attachProof(orgA, id, mid);
        vm.prank(orgA);
        vm.expectRevert(DonationPlatform.ProofAlreadyAttached.selector);
        platform.attachProof(id, mid, keccak256("y"), "https://y");
    }

    function test_RevertAttachProofNotOwner() public {
        (uint256 id, uint256 mid) = _releasedMilestone(0.4 ether);
        vm.prank(admin);
        vm.expectRevert(DonationPlatform.NotOrgOwner.selector);
        platform.attachProof(id, mid, keccak256("x"), "https://x");
    }

    function test_RevertAttachProofEmpty() public {
        (uint256 id, uint256 mid) = _releasedMilestone(0.4 ether);
        vm.startPrank(orgA);
        vm.expectRevert(DonationPlatform.EmptyProof.selector);
        platform.attachProof(id, mid, bytes32(0), "https://x");
        vm.expectRevert(DonationPlatform.EmptyProof.selector);
        platform.attachProof(id, mid, keccak256("x"), "");
        vm.stopPrank();
    }

    function test_SequencingBlocksNewRequestUntilProof() public {
        (uint256 id, uint256 mid) = _releasedMilestone(0.4 ether);

        // can't request more while a release is unproofed
        vm.prank(orgA);
        vm.expectRevert(abi.encodeWithSelector(DonationPlatform.ProofRequired.selector, mid));
        platform.addMilestone(id, "More", 0.1 ether, vendor);

        // attach proof -> unblocked
        _attachProof(orgA, id, mid);
        uint256 next = _addMilestone(orgA, id, 0.1 ether);
        assertEq(next, 1);
    }

    function test_SequencingOnlyCountsReleased() public {
        uint256 id = _createOrg(orgA, "A");
        _donate(donor, id, 1 ether);
        // pending / approved milestones don't need proof, so several can be open at once
        _addMilestone(orgA, id, 0.1 ether);
        uint256 m1 = _addMilestone(orgA, id, 0.1 ether);
        _approve(id, m1);
        _addMilestone(orgA, id, 0.1 ether);
        assertEq(platform.getMilestoneCount(id), 3);
    }

    function test_SequencingIsPerOrg() public {
        (uint256 a,) = _releasedMilestone(0.4 ether); // org A now has an unproofed release
        uint256 b = _createOrg(orgB, "B");
        // org B is unaffected
        uint256 mid = _addMilestone(orgB, b, 0.1 ether);
        assertEq(mid, 0);
        assertEq(platform.getOrg(a).releasedCount, 1);
    }

    // ------------------------------------------------------------------ invariants

    function test_ContractBalanceEqualsSumOfOrgBalances() public {
        uint256 a = _createOrg(orgA, "A");
        uint256 b = _createOrg(orgB, "B");
        _donate(donor, a, 2 ether);
        _donate(donor2, b, 1.5 ether);

        uint256 ma = _addMilestone(orgA, a, 0.5 ether);
        uint256 mb = _addMilestone(orgB, b, 1 ether);
        _approve(a, ma);
        _approve(b, mb);
        vm.prank(orgA);
        platform.releaseMilestone(a, ma);
        vm.prank(orgB);
        platform.releaseMilestone(b, mb);

        uint256 sum = platform.getOrg(a).balance + platform.getOrg(b).balance;
        assertEq(address(platform).balance, sum);
        assertEq(platform.totalDonated() - platform.totalReleased(), sum);
        assertEq(sum, 2 ether);
    }

    function testFuzz_Donate(uint96 amount) public {
        vm.assume(amount > 0);
        uint256 id = _createOrg(orgA, "A");
        vm.deal(donor, amount);
        _donate(donor, id, amount);
        assertEq(platform.getOrg(id).balance, amount);
        assertEq(address(platform).balance, amount);
    }
}
