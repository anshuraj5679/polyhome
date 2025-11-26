// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Listing is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _listingIds;

    struct Item {
        uint256 id;
        address owner;
        uint256 pricePerNight; // in wei
        string cid; // IPFS CID for metadata
        bool active;
        uint256 createdAt;
    }

    mapping(uint256 => Item) public items;

    event Listed(uint256 indexed id, address indexed owner, uint256 price, string cid);
    event Updated(uint256 indexed id, uint256 price, string cid, bool active);
    event Unlisted(uint256 indexed id);

    function createListing(uint256 pricePerNight, string calldata cid) external nonReentrant returns (uint256) {
        require(pricePerNight > 0, "Price must be greater than 0");
        require(bytes(cid).length > 0, "CID cannot be empty");

        _listingIds.increment();
        uint256 id = _listingIds.current();

        items[id] = Item({
            id: id,
            owner: msg.sender,
            pricePerNight: pricePerNight,
            cid: cid,
            active: true,
            createdAt: block.timestamp
        });

        emit Listed(id, msg.sender, pricePerNight, cid);
        return id;
    }

    function updateListing(uint256 id, uint256 pricePerNight, string calldata cid, bool active) external {
        Item storage it = items[id];
        require(it.owner == msg.sender, "Not the owner");
        require(it.id != 0, "Listing does not exist");

        it.pricePerNight = pricePerNight;
        it.cid = cid;
        it.active = active;

        emit Updated(id, pricePerNight, cid, active);
    }

    function getListing(uint256 id) external view returns (Item memory) {
        return items[id];
    }
    
    function getListingCount() external view returns (uint256) {
        return _listingIds.current();
    }
}
