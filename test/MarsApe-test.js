const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

let Token, token, owner, addr1, addr2, addr3, addr4;

beforeEach(async () => {
  Token = await ethers.getContractFactory("MarsApe");
  token = await Token.deploy();
  await token.deployed();
  [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
});

describe("Deployment", async () => {
  it("Should check the owner", async () => {
    expect(await token.owner()).to.equal(owner.address);
  });
  it("Should check the balance of the owner", async () => {
    expect(await token.balanceOf(owner.address)).to.equal(
      ethers.utils.parseUnits("1000000", 18)
    );
  });
});

describe("Token Distribution", async () => {
  beforeEach(async () => {
    await token.distributeToken(
      [addr1.address, addr2.address, addr3.address],
      [
        ethers.utils.parseUnits("4", 18),
        ethers.utils.parseUnits("300", 18),
        ethers.utils.parseUnits("30000", 18),
      ],
      [0, 1, 2]
    );
  });
  it("Should distribute the token", async () => {
    expect(await token.balanceOf(owner.address)).to.equal(
      ethers.utils.parseUnits((969696).toString(), 18)
    );
  });
  it("Should transfer correct amounts to beneficiaries", async () => {
    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.utils.parseUnits("4", 18)
    );

    expect(await token.balanceOf(addr2.address)).to.equal(
      ethers.utils.parseUnits("300", 18)
    );

    expect(await token.balanceOf(addr3.address)).to.equal(
      ethers.utils.parseUnits("30000", 18)
    );
  });
});

describe("Token Vesting", async () => {
  beforeEach(async () => {
    await token.distributeToken(
      [addr1.address, addr2.address, addr3.address],
      [
        ethers.utils.parseUnits("4", 18),
        ethers.utils.parseUnits("300", 18),
        ethers.utils.parseUnits("30000", 18),
      ],
      [0, 1, 2]
    );
  });

  it("Should put tokens on vesting schedule", async () => {
    expect(await token.isUserOnVestingSchedule(addr1.address)).to.be.false;
    expect(await token.isUserOnVestingSchedule(addr2.address)).to.be.true;
    expect(await token.isUserOnVestingSchedule(addr3.address)).to.be.true;
    expect(await token.isUserOnVestingSchedule(addr4.address)).to.be.false;
  });

  it("Should return correct granted amount", async () => {
    await expect(token.connect(addr1.address).grantedAmount()).to.be.reverted;

    expect(await token.connect(addr2.address).grantedAmount()).to.equal(
      ethers.utils.parseUnits("300", 18)
    );

    expect(await token.connect(addr3.address).grantedAmount()).to.equal(
      ethers.utils.parseUnits("30000", 18)
    );

    await expect(token.connect(addr4.address).grantedAmount()).to.be.reverted;
  });

  it("Should check cliff duration", async () => {
    await expect(token.connect(addr1.address).unlockedAmount()).to.be.reverted;
    await expect(token.connect(addr1.address).lockedAmount()).to.be.reverted;
    await expect(token.connect(addr4.address).unlockedAmount()).to.be.reverted;
    await expect(token.connect(addr4.address).lockedAmount()).to.be.reverted;

    expect(await token.connect(addr2.address).unlockedAmount()).to.equal(0);
    expect(await token.connect(addr2.address).lockedAmount()).to.equal(
      ethers.utils.parseUnits("300", 18)
    );

    expect(await token.connect(addr3.address).unlockedAmount()).to.equal(0);
    expect(await token.connect(addr3.address).lockedAmount()).to.equal(
      ethers.utils.parseUnits("30000", 18)
    );

    // expect(await token.connect(addr3.address).unlockedAmount()).to.equal(0);
  });

  it("Should return correct locked and unlocked amount with private sale", async () => {
    const randomTime = Math.floor(Math.random() * 18) + 1;
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve();
      }, randomTime * 1000); // random time from 1-18s
    }).then(async () => {
      const unlockedAmount = await token
        .connect(addr2.address)
        .unlockedAmount();
      const lockedAmount = await token.connect(addr2.address).lockedAmount();

      if (randomTime <= 3) {
        expect(await token.connect(addr2.address).unlockedAmount()).to.equal(0);
        expect(await token.connect(addr2.address).lockedAmount()).to.equal(
          ethers.utils.parseUnits("300", 18)
        );
      } else {
        expect(parseFloat(unlockedAmount)).to.equal(
          (parseFloat(ethers.utils.parseUnits("300", 18)) *
            (Math.min(13, randomTime) - 3)) /
            10
        );

        expect(parseFloat(lockedAmount)).to.equal(
          parseFloat(ethers.utils.parseUnits("300", 18)) *
            (1 - (Math.min(13, randomTime) - 3) / 10)
        );
      }
    });
  });

  it("Should return correct locked and unlocked amount with investor", async () => {
    const randomTime = Math.floor(Math.random() * 18) + 1;
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve();
      }, randomTime * 1000); // random time from 1-18s
    }).then(async () => {
      const unlockedAmount = await token
        .connect(addr3.address)
        .unlockedAmount();
      const lockedAmount = await token.connect(addr3.address).lockedAmount();

      if (randomTime <= 5) {
        expect(await token.connect(addr3.address).unlockedAmount()).to.equal(0);
        expect(await token.connect(addr3.address).lockedAmount()).to.equal(
          ethers.utils.parseUnits("30000", 18)
        );
      } else {
        expect(parseFloat(unlockedAmount)).to.equal(
          (parseFloat(ethers.utils.parseUnits("30000", 18)) *
            (Math.min(15, randomTime) - 5)) /
            10
        );

        expect(parseFloat(lockedAmount)).to.equal(
          parseFloat(ethers.utils.parseUnits("30000", 18)) *
            (1 - (Math.min(15, randomTime) - 5) / 10)
        );
      }
    });
  });
});

describe("Multiple Vesting Schedule of one user", async () => {
  beforeEach(async () => {
    await token.distributeToken(
      [
        addr1.address,
        addr1.address,
        addr1.address,
        addr1.address,
        addr1.address,
        addr1.address,
      ],
      [
        ethers.utils.parseUnits("3", 18),
        ethers.utils.parseUnits("45", 18),
        ethers.utils.parseUnits("300", 18),
        ethers.utils.parseUnits("3", 18),
        ethers.utils.parseUnits("45", 18),
        ethers.utils.parseUnits("300", 18),
      ],
      [0, 1, 2, 0, 1, 2]
    );
  });

  it("Should distribute token correctly", async () => {
    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.utils.parseUnits("696", 18)
    );
    expect(await token.connect(addr1.address).grantedAmount()).to.equal(
      ethers.utils.parseUnits("690", 18)
    );
    expect(await token.connect(addr1.address).lockedAmount()).to.equal(
      ethers.utils.parseUnits("690", 18)
    );
    expect(await token.connect(addr1.address).unlockedAmount()).to.equal(
      ethers.utils.parseUnits("0", 18)
    );
  });

  it("Should return the correct locked/unlocked amount", async () => {
    const randomTime = Math.floor(Math.random() * 18) + 1;

    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve();
      }, randomTime * 1000); // random time from 1-18s
    }).then(async () => {
      const unlockedAmount = await token
        .connect(addr1.address)
        .unlockedAmount();

      const lockedAmount = await token.connect(addr1.address).lockedAmount();

      const expectedUnlockedAmount =
        (parseFloat(ethers.utils.parseUnits("90", 18)) *
          (Math.max(Math.min(13, randomTime), 3) - 3)) /
          10 +
        (parseFloat(ethers.utils.parseUnits("600", 18)) *
          (Math.max(Math.min(15, randomTime), 5) - 5)) /
          10;

      expect(parseFloat(unlockedAmount)).to.equal(expectedUnlockedAmount);
      expect(parseFloat(lockedAmount)).to.equal(
        parseFloat(ethers.utils.parseUnits("690", 18)) - expectedUnlockedAmount
      );
    });
  });
});

describe("Should not allow transfer/burn the locked amount", async () => {
  beforeEach(async () => {
    await token.distributeToken(
      [addr1.address, addr1.address],
      [ethers.utils.parseUnits("10", 18), ethers.utils.parseUnits("10", 18)],
      [0, 1]
    );
  });

  it("Check locked amount before transfer/burn", async () => {
    expect(await token.connect(addr1.address).lockedAmount()).to.equal(
      ethers.utils.parseUnits("10", 18)
    );
    await token
      .connect(addr1)
      .transfer(addr2.address, ethers.utils.parseUnits("1", 18));

    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.utils.parseUnits("19", 18)
    );
    expect(await token.balanceOf(addr2.address)).to.equal(
      ethers.utils.parseUnits("1", 18)
    );

    await token.connect(addr1).burn(ethers.utils.parseUnits("1", 18));

    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.utils.parseUnits("18", 18)
    );

    expect(await token.totalSupply()).to.equal(
      ethers.utils.parseUnits("1000000", 18)
    );

    await expect(
      token
        .connect(addr1)
        .transfer(addr2.address, ethers.utils.parseUnits("10", 18))
    ).to.be.revertedWith(
      "Some of your tokens are still locked, you don't have enough funds"
    );

    await expect(
      token.connect(addr1).burn(ethers.utils.parseUnits("10", 18))
    ).to.be.revertedWith(
      "Some of your tokens are still locked, you don't have enough funds"
    );
  });
});
