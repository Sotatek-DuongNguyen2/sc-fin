// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ApeAccountant.sol";

contract MarsApe is ERC20, ERC20Burnable, Ownable, ApeAccountant {

    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    enum ScheduleType {
        PublicSale,
        PrivateSale,
        Investor
    }

    constructor() ERC20("MarsApe", "MAPE") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function distributeToken
    (
        address[] memory _beneficiaries, 
        uint[] memory _amounts,
        uint[] memory _schedulesType
    )   
    public onlyOwner {
        require(
            _beneficiaries.length == _amounts.length 
            && _amounts.length == _schedulesType.length
        );
        for (uint i = 0; i < _amounts.length; i++) {
            require(_schedulesType[i]<=uint(ScheduleType.Investor),"Invalid schedule type");
            if (_schedulesType[i] == uint(ScheduleType.Investor)) {
                _addInvestorSchedule(_beneficiaries[i], _amounts[i]);
                _grantedAmount[_beneficiaries[i]] += _amounts[i];
            }
            if(_schedulesType[i] == uint(ScheduleType.PrivateSale)){
                _addPrivateSaleSchedule(_beneficiaries[i], _amounts[i]);
                _grantedAmount[_beneficiaries[i]] += _amounts[i];
            }
            
            transfer(_beneficiaries[i],_amounts[i]);
        }
    }

    function _burn(address account, uint256 amount) internal override {
        require(account != address(0), "ERC20: burn from the zero address");
        _beforeTokenTransfer(account, BURN_ADDRESS, amount);
        transfer(BURN_ADDRESS, amount);        
        emit Transfer(account, BURN_ADDRESS, amount);
        _afterTokenTransfer(account, BURN_ADDRESS, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if(isUserOnVestingSchedule(from) && block.timestamp < finishScheduleTime(from)){
            require(balanceOf(from)-_lockedAmount(from) > amount,"Some of your tokens are still locked, you don't have enough funds");
        }
        
        super._beforeTokenTransfer(from, to, amount);
    }

}