// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Escrow is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _bookingIds;

    enum BookingState { AWAITING_PAYMENT, AWAITING_STAY, COMPLETED, REFUNDED, DISPUTED }

    struct Booking {
        uint256 id;
        address renter;
        address host;
        uint256 listingId;
        uint256 amount;
        uint256 checkInTimestamp;
        uint256 checkOutTimestamp;
        BookingState state;
        bool exists;
    }

    mapping(uint256 => Booking) public bookings;
    
    // Events
    event Deposited(uint256 indexed bookingId, address indexed renter, address host, uint256 amount);
    event Released(uint256 indexed bookingId, address indexed host, uint256 amount);
    event Refunded(uint256 indexed bookingId, address indexed renter, uint256 amount);
    event DisputeRaised(uint256 indexed bookingId, address indexed complainant);

    function deposit(address host, uint256 listingId, uint256 checkIn, uint256 checkOut) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Deposit must be greater than 0");
        require(host != address(0), "Invalid host address");
        require(checkOut > checkIn, "Invalid dates");

        _bookingIds.increment();
        uint256 id = _bookingIds.current();

        bookings[id] = Booking({
            id: id,
            renter: msg.sender,
            host: host,
            listingId: listingId,
            amount: msg.value,
            checkInTimestamp: checkIn,
            checkOutTimestamp: checkOut,
            state: BookingState.AWAITING_STAY,
            exists: true
        });

        emit Deposited(id, msg.sender, host, msg.value);
        return id;
    }

    function releaseToHost(uint256 bookingId) external nonReentrant {
        Booking storage b = bookings[bookingId];
        require(b.exists, "Booking does not exist");
        require(b.state == BookingState.AWAITING_STAY, "Invalid state");
        // In a real app, we'd check if block.timestamp > b.checkOutTimestamp
        // For demo/auto-mode, we allow renter or admin to release anytime
        require(msg.sender == b.renter || msg.sender == owner(), "Not authorized to release");

        b.state = BookingState.COMPLETED;
        (bool sent, ) = payable(b.host).call{value: b.amount}("");
        require(sent, "Failed to send Ether");

        emit Released(bookingId, b.host, b.amount);
    }

    function refundRenter(uint256 bookingId) external nonReentrant {
        Booking storage b = bookings[bookingId];
        require(b.exists, "Booking does not exist");
        require(b.state == BookingState.AWAITING_STAY || b.state == BookingState.DISPUTED, "Invalid state");
        require(msg.sender == b.host || msg.sender == owner(), "Not authorized to refund");

        b.state = BookingState.REFUNDED;
        (bool sent, ) = payable(b.renter).call{value: b.amount}("");
        require(sent, "Failed to send Ether");

        emit Refunded(bookingId, b.renter, b.amount);
    }
    
    // Simple dispute mechanism
    function raiseDispute(uint256 bookingId) external {
        Booking storage b = bookings[bookingId];
        require(b.exists, "Booking does not exist");
        require(msg.sender == b.renter || msg.sender == b.host, "Only parties can dispute");
        require(b.state == BookingState.AWAITING_STAY, "Cannot dispute now");
        
        b.state = BookingState.DISPUTED;
        emit DisputeRaised(bookingId, msg.sender);
    }
}
