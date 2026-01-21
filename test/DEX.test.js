const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");

    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);

    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  describe("Liquidity Management", function () {

    it("should allow initial liquidity provision", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(ethers.utils.parseEther("100"));
      expect(reserves[1]).to.equal(ethers.utils.parseEther("200"));
    });

    it("should mint correct LP tokens for first provider", async function () {
      const tx = await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100")
      );

      const liquidity = await dex.liquidity(owner.address);
      expect(liquidity).to.be.gt(0);
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await dex.addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );

      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(ethers.utils.parseEther("150"));
      expect(reserves[1]).to.equal(ethers.utils.parseEther("300"));
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const price1 = await dex.getPrice();

      await dex.addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );

      const price2 = await dex.getPrice();
      expect(price1).to.equal(price2);
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100")
      );

      const lp = await dex.liquidity(owner.address);
      await dex.removeLiquidity(lp.div(2));

      const reserves = await dex.getReserves();
      expect(reserves[0]).to.be.gt(0);
      expect(reserves[1]).to.be.gt(0);
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(
        dex.addLiquidity(0, 0)
      ).to.be.reverted;
    });

    it("should revert when removing more liquidity than owned", async function () {
      await expect(
        dex.removeLiquidity(1)
      ).to.be.reverted;
    });
  });

  describe("Token Swaps", function () {

    beforeEach(async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
    });

it("should swap token A for token B", async function () {
  await dex.swapForB(ethers.utils.parseEther("10"));
  const reserves = await dex.getReserves();
  expect(reserves[1]).to.be.lt(ethers.utils.parseEther("200"));
});


it("should swap token B for token A", async function () {
  await tokenB.approve(dex.address, ethers.utils.parseEther("100"));
  await dex.swapForA(ethers.utils.parseEther("10"));
  const reserves = await dex.getReserves();
  expect(reserves[0]).to.be.lt(ethers.utils.parseEther("100"));
});

    it("should calculate correct output amount with fee", async function () {
      const out = await dex.getAmountOut(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      expect(out).to.be.gt(0);
    });

    it("should update reserves after swap", async function () {
      await dex.swapForB(ethers.utils.parseEther("10"));
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.be.gt(ethers.utils.parseEther("100"));
    });

    it("should increase k after swap due to fees", async function () {
      const r1 = await dex.getReserves();
      const k1 = r1[0].mul(r1[1]);

      await dex.swapForB(ethers.utils.parseEther("10"));

      const r2 = await dex.getReserves();
      const k2 = r2[0].mul(r2[1]);

      expect(k2).to.be.gt(k1);
    });

    it("should revert on zero swap amount", async function () {
      await expect(
        dex.swapForB(0)
      ).to.be.reverted;
    });

it("should handle large swaps with high price impact", async function () {
  await dex.swapForB(ethers.utils.parseEther("90"));
  const reserves = await dex.getReserves();
  expect(reserves[1]).to.be.lt(ethers.utils.parseEther("120"));
});


    it("should update price after swaps", async function () {
      const price1 = await dex.getPrice();
      await dex.swapForB(ethers.utils.parseEther("10"));
      const price2 = await dex.getPrice();
      expect(price1).to.not.equal(price2);
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      const DEX = await ethers.getContractFactory("DEX");
      const emptyDex = await DEX.deploy(tokenA.address, tokenB.address);
      await expect(emptyDex.getPrice()).to.be.reverted;
    });
  });

  describe("Fee Distribution", function () {

    it("should accumulate fees for liquidity providers", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await dex.swapForB(ethers.utils.parseEther("10"));

      const reserves = await dex.getReserves();
      expect(reserves[0]).to.be.gt(ethers.utils.parseEther("100"));
    });

    it("should distribute fees proportionally to LP share", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100")
      );

      await dex.swapForB(ethers.utils.parseEther("10"));
      const lp = await dex.liquidity(owner.address);

      await dex.removeLiquidity(lp);
      const balance = await tokenA.balanceOf(owner.address);
      expect(balance).to.be.gt(ethers.utils.parseEther("999900"));
    });
  });

  describe("Edge Cases", function () {

    it("should handle very small liquidity amounts", async function () {
      await dex.addLiquidity(1, 1);
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.equal(1);
    });

    it("should handle very large liquidity amounts", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100000"),
        ethers.utils.parseEther("100000")
      );
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.be.gt(0);
    });

    it("should prevent unauthorized access", async function () {
      await expect(
        dex.connect(addr1).removeLiquidity(1)
      ).to.be.reverted;
    });
  });

  describe("Events", function () {

    it("should emit LiquidityAdded event", async function () {
      await expect(
        dex.addLiquidity(
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("10")
        )
      ).to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("10")
      );

      const lp = await dex.liquidity(owner.address);
      await expect(
        dex.removeLiquidity(lp)
      ).to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("20")
      );

      await expect(
        dex.swapForB(ethers.utils.parseEther("1"))
      ).to.emit(dex, "Swap");
    });
  });
});
