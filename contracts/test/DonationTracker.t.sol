// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DonationTracker} from "../src/DonationTracker.sol";

contract DonationTrackerTest is Test {
    DonationTracker internal tracker;

    address internal owner = makeAddr("owner");
    address internal donor = makeAddr("donor");
    address internal stranger = makeAddr("stranger");

    event Donated(address indexed donor, uint256 amount, uint256 timestamp);
    event MilestoneRequested(uint256 indexed id, string description, uint256 amount);
    event MilestoneApproved(uint256 indexed id);
    event MilestoneReleased(uint256 indexed id, uint256 amount, uint256 timestamp);

    function setUp() public {
        vm.prank(owner);
        tracker = new DonationTracker();
        vm.deal(donor, 10 ether);
        vm.deal(stranger, 10 ether);
    }

    // ------------------------------------------------------------------ helpers

    function _donate(address from, uint256 amount) internal {
        vm.prank(from);
        tracker.donate{value: amount}();
    }

    function _addMilestone(string memory desc, uint256 amount) internal returns (uint256 id) {
        vm.prank(owner);
        id = tracker.addMilestone(desc, amount);
    }

    // ------------------------------------------------------------------ donate

    function test_Donate() public {
        vm.expectEmit(true, false, false, true);
        emit Donated(donor, 1 ether, block.timestamp);

        _donate(donor, 1 ether);

        assertEq(address(tracker).balance, 1 ether);
        assertEq(tracker.getBalance(), 1 ether);
        assertEq(tracker.donations(donor), 1 ether);
        assertEq(tracker.totalDonated(), 1 ether);
    }

    function test_DonateAccumulates() public {
        _donate(donor, 1 ether);
        _donate(donor, 2 ether);
        assertEq(tracker.donations(donor), 3 ether);
        assertEq(tracker.totalDonated(), 3 ether);
    }

    function test_DonateViaReceive() public {
        vm.prank(donor);
        (bool ok,) = address(tracker).call{value: 0.5 ether}("");
        assertTrue(ok);
        assertEq(tracker.donations(donor), 0.5 ether);
        assertEq(tracker.totalDonated(), 0.5 ether);
    }

    function test_RevertDonateZero() public {
        vm.prank(donor);
        vm.expectRevert(DonationTracker.ZeroAmount.selector);
        tracker.donate{value: 0}();
    }

    // ------------------------------------------------------------------ addMilestone

    function test_AddMilestone() public {
        vm.expectEmit(true, false, false, true);
        emit MilestoneRequested(0, "Textbooks", 0.02 ether);

        uint256 id = _addMilestone("Textbooks", 0.02 ether);
        assertEq(id, 0);
        assertEq(tracker.getMilestoneCount(), 1);

        DonationTracker.Milestone memory m = tracker.getMilestone(0);
        assertEq(m.description, "Textbooks");
        assertEq(m.amount, 0.02 ether);
        assertFalse(m.approved);
        assertFalse(m.released);
        assertEq(m.createdAt, block.timestamp);
        assertEq(m.releasedAt, 0);
    }

    function test_AddMilestoneIncrementsId() public {
        assertEq(_addMilestone("A", 1), 0);
        assertEq(_addMilestone("B", 1), 1);
        assertEq(tracker.getMilestones().length, 2);
    }

    function test_RevertAddMilestoneNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(DonationTracker.NotOwner.selector);
        tracker.addMilestone("x", 1);
    }

    function test_RevertAddMilestoneZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(DonationTracker.ZeroAmount.selector);
        tracker.addMilestone("x", 0);
    }

    function test_RevertAddMilestoneEmptyDescription() public {
        vm.prank(owner);
        vm.expectRevert(DonationTracker.EmptyDescription.selector);
        tracker.addMilestone("", 1);
    }

    // ------------------------------------------------------------------ approve

    function test_ApproveMilestone() public {
        uint256 id = _addMilestone("A", 1 ether);

        vm.expectEmit(true, false, false, false);
        emit MilestoneApproved(id);

        vm.prank(owner);
        tracker.approveMilestone(id);
        assertTrue(tracker.getMilestone(id).approved);
    }

    function test_RevertApproveTwice() public {
        uint256 id = _addMilestone("A", 1 ether);
        vm.startPrank(owner);
        tracker.approveMilestone(id);
        vm.expectRevert(DonationTracker.AlreadyApproved.selector);
        tracker.approveMilestone(id);
        vm.stopPrank();
    }

    function test_RevertApproveNotOwner() public {
        uint256 id = _addMilestone("A", 1 ether);
        vm.prank(stranger);
        vm.expectRevert(DonationTracker.NotOwner.selector);
        tracker.approveMilestone(id);
    }

    function test_RevertApproveInvalidId() public {
        vm.prank(owner);
        vm.expectRevert(DonationTracker.InvalidMilestone.selector);
        tracker.approveMilestone(42);
    }

    // ------------------------------------------------------------------ release

    function test_ReleaseMilestone() public {
        _donate(donor, 1 ether);
        uint256 id = _addMilestone("A", 0.4 ether);
        vm.prank(owner);
        tracker.approveMilestone(id);

        uint256 ownerBefore = owner.balance;

        vm.expectEmit(true, false, false, true);
        emit MilestoneReleased(id, 0.4 ether, block.timestamp);

        vm.prank(owner);
        tracker.releaseMilestone(id);

        assertEq(owner.balance, ownerBefore + 0.4 ether);
        assertEq(address(tracker).balance, 0.6 ether);
        assertEq(tracker.totalReleased(), 0.4 ether);

        DonationTracker.Milestone memory m = tracker.getMilestone(id);
        assertTrue(m.released);
        assertEq(m.releasedAt, block.timestamp);
    }

    function test_RevertReleaseNotApproved() public {
        _donate(donor, 1 ether);
        uint256 id = _addMilestone("A", 0.4 ether);
        vm.prank(owner);
        vm.expectRevert(DonationTracker.NotApproved.selector);
        tracker.releaseMilestone(id);
    }

    function test_RevertReleaseTwice() public {
        _donate(donor, 1 ether);
        uint256 id = _addMilestone("A", 0.4 ether);
        vm.startPrank(owner);
        tracker.approveMilestone(id);
        tracker.releaseMilestone(id);
        vm.expectRevert(DonationTracker.AlreadyReleased.selector);
        tracker.releaseMilestone(id);
        vm.stopPrank();
    }

    function test_RevertReleaseInsufficientBalance() public {
        _donate(donor, 0.1 ether);
        uint256 id = _addMilestone("A", 0.4 ether);
        vm.startPrank(owner);
        tracker.approveMilestone(id);
        vm.expectRevert(DonationTracker.InsufficientBalance.selector);
        tracker.releaseMilestone(id);
        vm.stopPrank();
    }

    function test_RevertReleaseNotOwner() public {
        _donate(donor, 1 ether);
        uint256 id = _addMilestone("A", 0.4 ether);
        vm.prank(owner);
        tracker.approveMilestone(id);
        vm.prank(stranger);
        vm.expectRevert(DonationTracker.NotOwner.selector);
        tracker.releaseMilestone(id);
    }

    // ------------------------------------------------------------------ invariant-ish

    function test_BalanceEqualsDonatedMinusReleased() public {
        _donate(donor, 2 ether);
        _donate(stranger, 1 ether);

        uint256 a = _addMilestone("A", 0.5 ether);
        uint256 b = _addMilestone("B", 1.25 ether);

        vm.startPrank(owner);
        tracker.approveMilestone(a);
        tracker.releaseMilestone(a);
        tracker.approveMilestone(b);
        tracker.releaseMilestone(b);
        vm.stopPrank();

        assertEq(tracker.totalDonated(), 3 ether);
        assertEq(tracker.totalReleased(), 1.75 ether);
        assertEq(address(tracker).balance, tracker.totalDonated() - tracker.totalReleased());
    }

    function testFuzz_Donate(uint96 amount) public {
        vm.assume(amount > 0);
        vm.deal(donor, amount);
        _donate(donor, amount);
        assertEq(tracker.totalDonated(), amount);
        assertEq(address(tracker).balance, amount);
    }
}
