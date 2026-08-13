// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/* solhint-disable no-console */
import { Script, console } from "forge-std/Script.sol";
import { VenueRouter } from "../../src/venueRouter/VenueRouter.sol";

/**
 * Deploy VenueRouter to Coston2.
 *
 * Usage:
 *   forge script script/venueRouter/Deploy.s.sol:Deploy \
 *     --rpc-url coston2 --private-key $PRIVATE_KEY --broadcast \
 *     --verify --verifier blockscout --verifier-url https://coston2-explorer.flare.network/api/
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        VenueRouter router = new VenueRouter();

        vm.stopBroadcast();

        console.log("VenueRouter deployed at:", address(router));
        console.log("FXRP resolved to:", address(router.fxrp()));
        console.log("Firelight vault:", router.FIRELIGHT_VAULT());
        console.log("Upshift vault:", router.UPSHIFT_VAULT());
    }
}
