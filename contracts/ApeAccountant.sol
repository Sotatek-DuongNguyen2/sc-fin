// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./ApeScheduler.sol";
import "hardhat/console.sol";

contract ApeAccountant is ApeScheduler{

    mapping (address=>uint) internal _grantedAmount;

    function _unlockedBalanceFromEachSchedule(Schedule memory _schedule) private view returns (uint){
        uint time = block.timestamp < _schedule.vestUntil? block.timestamp : _schedule.vestUntil;
        return _schedule.amount * (time - _schedule.cliffUntil)/(_schedule.vestUntil-_schedule.cliffUntil);
    }

    function _unlockedBalanceFromScheduleList(Schedule[] memory _schedules) private view returns (uint){
        uint currentUnlockedBalance = 0;
        for (uint i = 0; i < _schedules.length; i++) {
            if(_schedules[i].cliffUntil < block.timestamp){
                currentUnlockedBalance +=  _unlockedBalanceFromEachSchedule(_schedules[i]);
            }
        }
        return currentUnlockedBalance;
    }

    function _unlockedAmount(address user) internal view returns (uint){
        return _unlockedBalanceFromScheduleList(investorSchedule(user)) 
        + _unlockedBalanceFromScheduleList(privateSaleSchedule(user));
    }

    function _lockedAmount(address user) internal view returns (uint){
        return _grantedAmount[user]-_unlockedAmount(user);
    }

    function unlockedAmount() public view onVestingScheduleOnly returns(uint) {
        return _unlockedAmount(msg.sender);
    }

    function lockedAmount() public view onVestingScheduleOnly returns(uint) {
        return finishScheduleTime(msg.sender) > block.timestamp ? _lockedAmount(msg.sender) : 0;
    }

    function grantedAmount() public view onVestingScheduleOnly returns(uint) {
        return _grantedAmount[msg.sender];
    }
}