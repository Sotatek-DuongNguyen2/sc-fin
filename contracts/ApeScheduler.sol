// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract ApeScheduler{
    struct Schedule{
        uint amount;
        uint cliffUntil;
        uint vestUntil;
    }

    uint public constant INVESTOR_CLIFF_DURATION = 1 weeks;
    uint public constant INVESTOR_VESTING_DURATION = 4 weeks;
    uint public constant PRIVATE_SALE_CLIFF_DURATION = 3 days;
    uint public constant PRIVATE_SALE_VESTING_DURATION = 1 days;

    //for local tesing
    // uint public constant INVESTOR_CLIFF_DURATION = 5 seconds;
    // uint public constant INVESTOR_VESTING_DURATION = 10 seconds;
    // uint public constant PRIVATE_SALE_CLIFF_DURATION = 3 seconds;
    // uint public constant PRIVATE_SALE_VESTING_DURATION = 10 seconds;

    mapping (address=>Schedule[]) private _investorSchedule;
    mapping (address=>Schedule[]) private _privateSaleSchedule;
    mapping (address=>uint) internal _finishScheduleTime;

    modifier onVestingScheduleOnly(){
        require(isUserOnVestingSchedule(msg.sender),"Not on any vesting schedule");
        _;
    }

    function isUserOnVestingSchedule(address user) public view returns (bool){
        return _investorSchedule[user].length>0||_privateSaleSchedule[user].length>0;
    }

    function investorSchedule(address user) public view returns(Schedule[] memory){
        return _investorSchedule[user];
    }

    function privateSaleSchedule(address user) public view returns(Schedule[] memory){
        return _privateSaleSchedule[user];
    }

    function finishScheduleTime(address user) public view returns(uint){
        return _finishScheduleTime[user];
    }

    function _updateFinishScheduleTime(address user, uint finishTime) private {
        if(finishTime>_finishScheduleTime[user]){
            _finishScheduleTime[user] = finishTime;
        }
    }

    function _addInvestorSchedule(address _user, uint _amount) internal {
        uint finishTime = block.timestamp + INVESTOR_CLIFF_DURATION + INVESTOR_VESTING_DURATION;
        _investorSchedule[_user].push(
            Schedule(
                _amount,
                finishTime - INVESTOR_VESTING_DURATION,
                finishTime
            )
        );
        _updateFinishScheduleTime(_user, finishTime);
    }

    function _addPrivateSaleSchedule(address _user, uint _amount) internal {
        uint finishTime = block.timestamp + PRIVATE_SALE_CLIFF_DURATION + PRIVATE_SALE_VESTING_DURATION;
        _privateSaleSchedule[_user].push(
            Schedule(
                _amount, 
                finishTime - PRIVATE_SALE_VESTING_DURATION,
                finishTime
            )
        );
        _updateFinishScheduleTime(_user, finishTime);
    }
}