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
}
