// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title ITokenizedVault
 * @notice Minimal external interface for the Upshift tokenized vault, based on
 *         Flare's official developer guide (dev.flare.network/fxrp/upshift).
 *         ERC-4626-style: deposit for shares, redeem either instantly (fee) or
 *         via a requested/delayed redemption (lower fee, lag period).
 */
interface ITokenizedVault {
    // --- Core info ---

    function asset() external view returns (address);

    function lpTokenAddress() external view returns (address);

    /// @dev CONFIRMED BROKEN on Coston2 (0x24c1a47c...) — reverts directly on
    ///      the vault. Declared here for interface completeness / in case a
    ///      future deployment implements it, but VenueRouter does NOT call
    ///      this — it derives an equivalent via previewRedemption() instead.
    ///      See VenueRouter.getUpshiftSnapshot().
    function totalAssets() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    /// @notice CONFIRMED live on Coston2 — direct total assets read, more
    ///         accurate than deriving via previewRedemption().
    function getTotalAssets() external view returns (uint256);

    /// @notice CONFIRMED live on Coston2 — direct share price, 6-decimal
    ///         scale matching FXRP/vFXRP (not 18-decimal wei).
    function getSharePrice() external view returns (uint256);

    function depositsPaused() external view returns (bool);

    function maxDepositAmount() external view returns (uint256);

    /// @notice Non-zero on Coston2 — a real whitelist contract gates which
    ///         assets can be deposited. Confirm FXRP is allowed before
    ///         assuming deposit() will succeed.
    function assetsWhitelistAddress() external view returns (address);

    // --- Deposit ---

    /// @dev CONFIRMED via Coston2 Write Contract tab — NOT the ERC-4626
    ///      convention of deposit(uint256, address). This vault's real
    ///      signature takes the asset address explicitly as the first param.
    function deposit(address assetIn, uint256 amountIn, address receiverAddr) external returns (uint256 shares);

    function previewDeposit(uint256 assets) external view returns (uint256 shares);

    // --- Instant redemption ---

    function instantRedeem(uint256 shares, address receiver) external returns (uint256 assets);

    // --- Requested (delayed) redemption ---

    /// @return assetsBeforeFee, assetsAfterFee
    function previewRedemption(uint256 shares, bool instant) external view returns (uint256, uint256);

    function requestRedeem(uint256 shares, address receiverAddr) external returns (uint256);

    /// @return year, month, day, claimableEpoch
    function getWithdrawalEpoch() external view returns (uint256, uint256, uint256, uint256);

    function claim(uint256 year, uint256 month, uint256 day, address receiver) external returns (uint256 assets);

    // --- Vault configuration ---

    function lagDuration() external view returns (uint256);

    function withdrawalFee() external view returns (uint256);

    function withdrawalsPaused() external view returns (bool);

    function maxWithdrawalAmount() external view returns (uint256);
}
