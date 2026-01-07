const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenFaucet", function () {
    let Token, Faucet;
    let token, faucet;
    let owner, user1, user2;

    const FAUCET_AMOUNT = ethers.parseEther("100");
    const MAX_CLAIM_AMOUNT = ethers.parseEther("1000");

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        Token = await ethers.getContractFactory("FaucetToken");
        token = await Token.deploy("TestToken", "TST");
        await token.waitForDeployment();

        Faucet = await ethers.getContractFactory("TokenFaucet");
        faucet = await Faucet.deploy(await token.getAddress());
        await faucet.waitForDeployment();

        // Set faucet in token (transfer ownership/minter role logic)
        // The Token contract has a `setFaucet` function
        await token.setFaucet(await faucet.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await faucet.admin()).to.equal(owner.address);
        });

        it("Should set the right token address", async function () {
            expect(await faucet.token()).to.equal(await token.getAddress());
        });
    });

    describe("Claims", function () {
        it("Should allow a user to claim tokens", async function () {
            const tx = await faucet.connect(user1).requestTokens();
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt.blockNumber);

            await expect(tx)
                .to.emit(faucet, "TokensClaimed")
                .withArgs(user1.address, FAUCET_AMOUNT, block.timestamp);

            expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
            expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT);
        });

        it("Should fail if cooldown not elapsed", async function () {
            await faucet.connect(user1).requestTokens();
            await expect(faucet.connect(user1).requestTokens()).to.be.revertedWithCustomError(faucet, "Faucet__CooldownNotElapsed");
        });

        it("Should allow claim after cooldown", async function () {
            await faucet.connect(user1).requestTokens();

            // Increase time by 24 hours + 1 second
            await time.increase(24 * 60 * 60 + 1);

            await expect(faucet.connect(user1).requestTokens()).to.emit(faucet, "TokensClaimed");
            expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT * 2n);
        });

        it("Should enforce lifetime limit", async function () {
            // Simulate multiple claims up to limit
            // Limit is 1000, claim is 100. So 10 claims.

            for (let i = 0; i < 10; i++) {
                await faucet.connect(user1).requestTokens();
                await time.increase(24 * 60 * 60 + 1);
            }

            expect(await faucet.totalClaimed(user1.address)).to.equal(MAX_CLAIM_AMOUNT);

            await expect(faucet.connect(user1).requestTokens()).to.be.revertedWithCustomError(faucet, "Faucet__MaxClaimLimitReached");
        });
    });

    describe("Administration", function () {
        it("Should allow admin to pause and unpause", async function () {
            await faucet.connect(owner).setPaused(true);
            expect(await faucet.paused()).to.be.true;

            await expect(faucet.connect(user1).requestTokens()).to.be.revertedWithCustomError(faucet, "Faucet__Paused");

            await faucet.connect(owner).setPaused(false);
            expect(await faucet.paused()).to.be.false;

            await expect(faucet.connect(user1).requestTokens()).to.emit(faucet, "TokensClaimed");
        });

        it("Should revert if non-admin tries to pause", async function () {
            await expect(faucet.connect(user1).setPaused(true)).to.be.revertedWithCustomError(faucet, "Faucet__Unauthorized");
        });
    });

    describe("Views", function () {
        it("Should return correct remaining allowance", async function () {
            expect(await faucet.remainingAllowance(user1.address)).to.equal(MAX_CLAIM_AMOUNT);
            await faucet.connect(user1).requestTokens();
            expect(await faucet.remainingAllowance(user1.address)).to.equal(MAX_CLAIM_AMOUNT - FAUCET_AMOUNT);
        });

        it("Should return canClaim correctly", async function () {
            expect(await faucet.canClaim(user1.address)).to.be.true;
            await faucet.connect(user1).requestTokens();
            expect(await faucet.canClaim(user1.address)).to.be.false;
            await time.increase(24 * 60 * 60 + 1);
            expect(await faucet.canClaim(user1.address)).to.be.true;
        });
    });
});
