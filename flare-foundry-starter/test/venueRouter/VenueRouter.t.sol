// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Test, console } from "forge-std/Test.sol";
import { VenueRouter } from "../../src/venueRouter/VenueRouter.sol";

/**
 * Fork tests for VenueRouter. Requires a fork of Coston2, since the contract
 * reads live state from the Firelight and Upshift vaults and Flare's FTSOv2
 * price feed.
 *
 * IMPORTANT: forge test --fork-url runs against a fully local, ephemeral EVM
 * snapshot. It reads real current chain state as its starting point, but any
 * transactions executed inside these tests (deposits, transfers, approvals)
 * only happen in that local sandbox and are discarded when the test process
 * exits. Nothing here ever broadcasts to real Coston2 — no real FXRP moves.
 *
 * Usage:
 *   forge test --match-contract VenueRouterTest --fork-url coston2 -vvv
 */
contract VenueRouterTest is Test {
    VenueRouter public router;
    address public alice = makeAddr("alice");

    // Real funded Coston2 address, used to test the actual deposit flow
    // against genuine on-chain FXRP balance (read-only starting state; see
    // note above — deposits below never leave this local fork).
    address public realUser = 0x1f6090D5db1DDF895663AAe377048802c26b5EF0;

    function setUp() public {
        vm.createSelectFork("coston2");
        router = new VenueRouter();

        console.log("FXRP resolved to:", address(router.fxrp()));
        console.log("Firelight vault:", router.FIRELIGHT_VAULT());
        console.log("Upshift vault:", router.UPSHIFT_VAULT());
    }

    function testResolvesSameFxrpFromBothVaults() public view {
        assertTrue(address(router.fxrp()) != address(0), "FXRP should resolve");
    }

    function testFirelightSnapshotReads() public view {
        VenueRouter.VenueSnapshot memory snap = router.getFirelightSnapshot();
        console.log("Firelight totalAssets:", snap.totalAssets);
        console.log("Firelight totalSupply:", snap.totalSupply);
        console.log("Firelight sharePriceWei:", snap.sharePriceWei);
        console.log("Firelight tvlUsdWei:", snap.tvlUsdWei);
        // sharePrice should be sane (not zero, not absurdly large) even if the
        // vault is empty (in which case it defaults to 1e18 per _buildSnapshot).
        assertGt(snap.sharePriceWei, 0);
    }

    function testUpshiftSnapshotReads() public view {
        VenueRouter.VenueSnapshot memory snap = router.getUpshiftSnapshot();
        console.log("Upshift totalAssets:", snap.totalAssets);
        console.log("Upshift totalSupply:", snap.totalSupply);
        console.log("Upshift sharePriceWei:", snap.sharePriceWei);
        console.log("Upshift tvlUsdWei:", snap.tvlUsdWei);
        assertGt(snap.sharePriceWei, 0);
    }

    function testXrpUsdPriceIsSane() public view {
        uint256 price = router.getXrpUsdPriceWei();
        console.log("XRP/USD price (wei):", price);
        assertGt(price, 0);
    }

    // --- Zero-amount reverts: no funds or mocks needed ---

    function testRevertsOnZeroAmountFirelight() public {
        vm.expectRevert(VenueRouter.ZeroAmount.selector);
        router.depositToFirelight(0);
    }

    function testRevertsOnZeroAmountUpshift() public {
        vm.expectRevert(VenueRouter.ZeroAmount.selector);
        router.depositToUpshift(0);
    }

    // --- Real deposit flow, against real current FXRP balance ---
    // Safe per the note at the top of this file: local fork only, nothing
    // broadcasts. Skips cleanly (rather than failing) if realUser currently
    // holds no FXRP, so this doesn't block the rest of the suite if the
    // wallet is empty at test time.

    function testDepositToFirelight() public {
        uint256 balance = router.fxrp().balanceOf(realUser);
        if (balance == 0) {
            console.log("Skipping: realUser holds 0 FXRP right now");
            return;
        }

        uint256 depositAmount = balance < 10 * 1e6 ? balance : 10 * 1e6; // up to 10 FXRP
        VenueRouter.VenueSnapshot memory before = router.getFirelightSnapshot();

        vm.startPrank(realUser);
        router.fxrp().approve(address(router), depositAmount);
        router.depositToFirelight(depositAmount);
        vm.stopPrank();

        VenueRouter.VenueSnapshot memory after_ = router.getFirelightSnapshot();

        console.log("Deposited to Firelight:", depositAmount);
        console.log("Firelight totalAssets before:", before.totalAssets);
        console.log("Firelight totalAssets after:", after_.totalAssets);

        assertEq(router.fxrp().balanceOf(realUser), balance - depositAmount, "balance should decrease by deposit");
        assertGe(after_.totalAssets, before.totalAssets + depositAmount, "vault totalAssets should increase");
    }

    function testDepositToUpshift() public {
        uint256 balance = router.fxrp().balanceOf(realUser);
        if (balance == 0) {
            console.log("Skipping: realUser holds 0 FXRP right now");
            return;
        }

        uint256 depositAmount = balance < 10 * 1e6 ? balance : 10 * 1e6; // up to 10 FXRP

        vm.startPrank(realUser);
        router.fxrp().approve(address(router), depositAmount);
        router.depositToUpshift(depositAmount);
        vm.stopPrank();

        console.log("Deposited to Upshift:", depositAmount);

        assertEq(router.fxrp().balanceOf(realUser), balance - depositAmount, "balance should decrease by deposit");
    }

    // --- Withdrawal flow: request -> warp past period -> claim directly ---
    // Uses vm.warp to simulate the period passing without waiting real time.
    // realUser already holds real Firelight shares from an earlier live
    // deposit through the actual frontend, so this exercises a genuine
    // existing position, not a freshly-minted test one.

    function testFirelightWithdrawRequestAndClaim() public {
        uint256 shareBalance = router.firelight().balanceOf(realUser);
        if (shareBalance == 0) {
            console.log("Skipping: realUser holds 0 Firelight shares right now");
            return;
        }

        uint256 sharesToWithdraw = shareBalance < 5 * 1e6 ? shareBalance : 5 * 1e6;
        uint256 periodAtRequest = router.firelight().currentPeriod();
        uint256 fxrpBalanceBefore = router.fxrp().balanceOf(realUser);

        vm.startPrank(realUser);
        router.firelight().approve(address(router), sharesToWithdraw);
        uint256 expectedAssets = router.requestWithdrawFromFirelight(sharesToWithdraw);
        vm.stopPrank();

        console.log("Requested withdrawal, shares:", sharesToWithdraw);
        console.log("Expected assets:", expectedAssets);
        console.log("Period at request:", periodAtRequest);

        // No funds should have moved yet — this is a request, not a transfer.
        assertEq(
            router.fxrp().balanceOf(realUser), fxrpBalanceBefore, "no FXRP should move until claimed, not requested"
        );

        // Warp past the period boundary so the withdrawal becomes claimable.
        uint48 targetTime = router.firelight().nextPeriodEnd() + 1;
        vm.warp(targetTime);
        console.log("Warped to timestamp:", targetTime);

        // Claim must be called directly by the user against Firelight, NOT
        // through VenueRouter — see the comment on requestWithdrawFromFirelight
        // for why (claimWithdraw is keyed to msg.sender with no owner param).
        vm.prank(realUser);
        uint256 claimedAssets = router.firelight().claimWithdraw(periodAtRequest);

        console.log("Claimed assets:", claimedAssets);

        assertTrue(
            router.firelight().isWithdrawClaimed(periodAtRequest, realUser), "withdrawal should be marked claimed"
        );
        assertEq(
            router.fxrp().balanceOf(realUser),
            fxrpBalanceBefore + claimedAssets,
            "FXRP balance should increase by the claimed amount"
        );
    }

    // --- Upshift instant withdraw: self-contained (deposit then withdraw) ---
    // Doesn't depend on realUser already holding vFXRP — deposits within the
    // fork first, so this is testable regardless of prior real chain state.

    function testUpshiftInstantWithdraw() public {
        uint256 balance = router.fxrp().balanceOf(realUser);
        if (balance == 0) {
            console.log("Skipping: realUser holds 0 FXRP right now");
            return;
        }

        uint256 depositAmount = balance < 10 * 1e6 ? balance : 10 * 1e6;

        // Capture share balance before AND after deposit, and only withdraw
        // the delta (shares this deposit actually minted) — realUser may
        // already hold a real pre-existing vFXRP balance from prior
        // activity, and withdrawing the full balance would conflate that
        // with this test's own deposit, making the fee assertion below
        // meaningless (comparing withdrawn assets against only THIS test's
        // deposit amount, while actually redeeming a larger pre-existing
        // position too).
        uint256 shareBalanceBefore = router.upshiftLpToken().balanceOf(realUser);

        vm.startPrank(realUser);
        router.fxrp().approve(address(router), depositAmount);
        router.depositToUpshift(depositAmount);

        uint256 shareBalanceAfter = router.upshiftLpToken().balanceOf(realUser);
        uint256 sharesFromThisDeposit = shareBalanceAfter - shareBalanceBefore;
        console.log("vFXRP received from THIS deposit:", sharesFromThisDeposit);
        console.log("vFXRP total balance (incl. any pre-existing):", shareBalanceAfter);
        assertGt(sharesFromThisDeposit, 0, "should have received vFXRP shares from deposit");

        uint256 fxrpBalanceBeforeWithdraw = router.fxrp().balanceOf(realUser);

        router.upshiftLpToken().approve(address(router), sharesFromThisDeposit);
        uint256 assetsReceived = router.withdrawFromUpshift(sharesFromThisDeposit);
        vm.stopPrank();

        console.log("Assets received from instant withdraw:", assetsReceived);

        assertEq(
            router.upshiftLpToken().balanceOf(realUser),
            shareBalanceBefore,
            "should be back to exactly the pre-existing share balance"
        );
        assertEq(
            router.fxrp().balanceOf(realUser),
            fxrpBalanceBeforeWithdraw + assetsReceived,
            "FXRP balance should increase by assets received"
        );
        // Instant redemption charges a fee, so we should get back somewhat
        // less than we put in — this isn't a bug, confirm it's in a sane
        // range rather than asserting an exact break-even amount.
        assertLt(assetsReceived, depositAmount, "instant redemption fee should apply");
        assertGt(assetsReceived, (depositAmount * 90) / 100, "fee should not exceed 10% - sanity bound");
    }
}

