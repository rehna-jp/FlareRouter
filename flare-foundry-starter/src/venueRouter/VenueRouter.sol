// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20 } from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { SafeERC20 } from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin-contracts/utils/ReentrancyGuard.sol";

import { ContractRegistry } from "flare-periphery/src/coston2/ContractRegistry.sol";
import { TestFtsoV2Interface } from "flare-periphery/src/coston2/TestFtsoV2Interface.sol";

import { IFirelightVault } from "../firelight/IFirelightVault.sol";
import { ITokenizedVault } from "./ITokenizedVault.sol";

/**
 * @title VenueRouter
 * @notice Compares FXRP yield venues and executes deposits into whichever the
 *         user picks. Scoped to the two venues confirmed live on Coston2
 *         (Firelight, Upshift) — see project docs for why other venues
 *         (Kinetic, Enosys Loans, Mystic) are read-only/mainnet-referenced
 *         and not routed through this contract for the hackathon demo.
 *
 * @dev Both vaults expose asset() per ERC-4626 convention, so FXRP's address
 *      is cross-checked against both rather than hardcoded or resolved from
 *      a single source.
 */
contract VenueRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Confirmed Coston2 addresses ---
    // Firelight: confirmed live via Coston2 explorer + dev.flare.network/fxrp/firelight
    address public constant FIRELIGHT_VAULT = 0xC90D6847747b85d1fa2E07859869fb9fB72c0361;
    // Upshift: confirmed via dev.flare.network/fxrp/upshift official guide + example tx output
    address public constant UPSHIFT_VAULT = 0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81;

    bytes21 public constant XRP_USD_FEED_ID = 0x015852502f55534400000000000000000000000000;

    IFirelightVault public immutable firelight;
    ITokenizedVault public immutable upshift;
    IERC20 public immutable fxrp;
    /// @notice Upshift's share token — a SEPARATE contract from the vault
    /// itself (confirmed via lpTokenAddress()), unlike Firelight where the
    /// vault IS the share token.
    IERC20 public immutable upshiftLpToken;

    /// @notice FXRP's onchain decimals, fetched at deploy time rather than
    ///         hardcoded — same lesson learned on the earlier vault contract:
    ///         never assume 18 decimals for FXRP.
    uint8 public immutable fxrpDecimals;
    uint256 private immutable fxrpUnit; // 10 ** fxrpDecimals

    struct VenueSnapshot {
        string name;
        address vaultAddress;
        uint256 totalAssets;
        uint256 totalSupply;
        uint256 sharePriceWei; // totalAssets/totalSupply normalized to 18 decimals — proxy for cumulative yield
        uint256 tvlUsdWei; // totalAssets converted to USD via FTSO, 18 decimals
    }

    event DepositedToFirelight(address indexed user, uint256 amount, uint256 shares);
    event DepositedToUpshift(address indexed user, uint256 amount, uint256 shares);
    event WithdrawRequestedFromFirelight(address indexed user, uint256 shares, uint256 period);
    event WithdrawnFromUpshift(address indexed user, uint256 shares, uint256 assetsReceived);

    error ZeroAmount();
    error FxrpAddressMismatch();

    constructor() {
        firelight = IFirelightVault(FIRELIGHT_VAULT);
        upshift = ITokenizedVault(UPSHIFT_VAULT);

        address firelightAsset = firelight.asset();
        address upshiftAsset = upshift.asset();

        // Both vaults should reference the same FXRP token — if they don't,
        // something is wrong (wrong address, wrong network, stale config)
        // and we fail loudly at deploy time rather than silently comparing
        // two different assets later.
        if (firelightAsset != upshiftAsset) revert FxrpAddressMismatch();

        fxrp = IERC20(firelightAsset);
        fxrpDecimals = IERC20Metadata(firelightAsset).decimals();
        fxrpUnit = 10 ** fxrpDecimals;
        upshiftLpToken = IERC20(upshift.lpTokenAddress());
    }

    // --- Comparison (read-only) ---

    function getFirelightSnapshot() public view returns (VenueSnapshot memory) {
        uint256 totalAssets_ = firelight.totalAssets();
        uint256 totalSupply_ = firelight.totalSupply();
        return _buildSnapshot("Firelight", FIRELIGHT_VAULT, totalAssets_, totalSupply_);
    }

    function getUpshiftSnapshot() public view returns (VenueSnapshot memory) {
        // CONFIRMED via Coston2 Write/Read Contract tabs: getTotalAssets()
        // and getSharePrice() are real, direct reads — simpler and more
        // exact than the previewRedemption-derived approximation this used
        // before. getSharePrice() returns a 6-decimal-scale value (matching
        // FXRP/vFXRP decimals), not 18-decimal wei — normalized below.
        uint256 totalAssets_ = upshift.getTotalAssets();
        address lpToken = upshift.lpTokenAddress();
        uint256 totalSupply_ = IERC20(lpToken).totalSupply();

        return _buildSnapshot("Upshift", UPSHIFT_VAULT, totalAssets_, totalSupply_);
    }

    /// @notice Both confirmed-venue snapshots in one call, to minimize RPC round trips for the frontend.
    function getAllSnapshots() external view returns (VenueSnapshot memory, VenueSnapshot memory) {
        return (getFirelightSnapshot(), getUpshiftSnapshot());
    }

    function getXrpUsdPriceWei() public view returns (uint256 valueWei) {
        /* TEST interface (free, view-only) — swap to FtsoV2Interface for mainnet. */
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        (valueWei, ) = ftsoV2.getFeedByIdInWei(XRP_USD_FEED_ID);
    }

    function _buildSnapshot(
        string memory name,
        address vaultAddress,
        uint256 totalAssets_,
        uint256 totalSupply_
    ) internal view returns (VenueSnapshot memory) {
        // sharePriceWei: dimensionless ratio (both totalAssets and
        // totalSupply are in the vault's own share/asset units, which match
        // by ERC-4626 convention), scaled to 18-decimal fixed point.
        uint256 sharePriceWei = totalSupply_ == 0 ? 1e18 : (totalAssets_ * 1e18) / totalSupply_;

        // tvlUsdWei: totalAssets_ IS in FXRP's native decimals (6, not 18) —
        // normalize by fxrpUnit, not a hardcoded 1e18, before multiplying by
        // the 18-decimal USD price.
        uint256 xrpUsdPriceWei = getXrpUsdPriceWei();
        uint256 tvlUsdWei = (totalAssets_ * xrpUsdPriceWei) / fxrpUnit;

        return VenueSnapshot({
            name: name,
            vaultAddress: vaultAddress,
            totalAssets: totalAssets_,
            totalSupply: totalSupply_,
            sharePriceWei: sharePriceWei,
            tvlUsdWei: tvlUsdWei
        });
    }

    // --- Execute: route a deposit to the user's chosen venue ---

    function depositToFirelight(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        fxrp.safeTransferFrom(msg.sender, address(this), amount);
        fxrp.forceApprove(FIRELIGHT_VAULT, amount);
        uint256 shares = firelight.deposit(amount, msg.sender);

        emit DepositedToFirelight(msg.sender, amount, shares);
    }

    function depositToUpshift(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        fxrp.safeTransferFrom(msg.sender, address(this), amount);
        fxrp.forceApprove(UPSHIFT_VAULT, amount);
        // CONFIRMED signature via Coston2 Write Contract tab:
        // deposit(address assetIn, uint256 amountIn, address receiverAddr)
        // — NOT the ERC-4626 deposit(uint256, address) originally assumed.
        uint256 shares = upshift.deposit(address(fxrp), amount, msg.sender);

        emit DepositedToUpshift(msg.sender, amount, shares);
    }

    // --- Withdraw: Firelight only for now (see project docs) ---

    /**
     * @notice Requests a Firelight withdrawal. IMPORTANT: this does NOT
     *         transfer assets immediately — Firelight's redeem() explicitly
     *         "creates a withdrawal request", confirmed via its own
     *         interface docs. The user must separately call claimWithdraw()
     *         directly on the Firelight vault (NOT through this router —
     *         see below) once the current period ends.
     *
     * @dev Requires the user to have approved this contract to spend
     *      `shares` amount of Firelight vault tokens first (the vault
     *      itself is the ERC-20 share token).
     *
     *      Claiming is intentionally NOT proxied through VenueRouter:
     *      Firelight's claimWithdraw(uint256 period) takes no owner/account
     *      parameter, so it operates on msg.sender directly. If VenueRouter
     *      called it, Firelight would look up VenueRouter's own withdrawal
     *      record (empty), not the user's. The user must call
     *      claimWithdraw() directly against the Firelight vault address.
     */
    function requestWithdrawFromFirelight(uint256 shares) external nonReentrant returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();

        // redeem(shares, receiver, owner) — receiver and owner are both the
        // calling user (msg.sender here, inside VenueRouter's own function
        // context — NOT VenueRouter's address). Requires the user to have
        // approved VenueRouter for `shares` beforehand, since owner !=
        // msg.sender from Firelight's perspective (Firelight sees
        // msg.sender == VenueRouter, owner == the user).
        assets = firelight.redeem(shares, msg.sender, msg.sender);

        emit WithdrawRequestedFromFirelight(msg.sender, shares, firelight.currentPeriod());
    }

    /**
     * @notice Instantly withdraws from Upshift (for a fee — see
     *         instantRedemptionFee() on the vault). Single transaction,
     *         no waiting period, unlike Firelight's request/claim flow.
     *
     * @dev CONFIRMED via Coston2 Write Contract tab: instantRedeem(uint256
     *      shares, address receiverAddr) — no owner parameter, unlike
     *      Firelight's redeem(). Because there's no way to specify "burn
     *      someone else's shares", this contract must first PULL the
     *      user's vFXRP shares in via transferFrom (requires prior ERC20
     *      approval to this contract on the LP token), then call
     *      instantRedeem as itself — mirroring exactly how depositToUpshift
     *      already handles the asset side.
     */
    function withdrawFromUpshift(uint256 shares) external nonReentrant returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();

        upshiftLpToken.safeTransferFrom(msg.sender, address(this), shares);

        // instantRedeem sends assets DIRECTLY to msg.sender (the user), not
        // to this contract — so we can't observe the result via our own
        // balance. We also deliberately don't trust any return value (see
        // ITokenizedVault.instantRedeem's doc comment — assuming one caused
        // a real ABI-decode revert even though the underlying redemption
        // succeeded). Balance-diff on the user is the robust alternative.
        uint256 userBalanceBefore = fxrp.balanceOf(msg.sender);
        upshift.instantRedeem(shares, msg.sender);
        assets = fxrp.balanceOf(msg.sender) - userBalanceBefore;

        emit WithdrawnFromUpshift(msg.sender, shares, assets);
    }
}
