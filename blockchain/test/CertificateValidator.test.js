const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs"); // <--- import anyValue

describe("CertificateValidator", function () {
  let contract;
  let owner, institution, stranger;

  const CERT_ID   = "CERT-AB12CD34";
  const CERT_HASH = "a".repeat(64); // valid 64-char hex

  beforeEach(async () => {
    [owner, institution, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateValidator");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ── Authorization ──────────────────────────────────────────────────────────
  it("owner is authorized by default", async () => {
    expect(await contract.authorizedInstitutions(owner.address)).to.equal(true);
  });

  it("admin can authorize an institution", async () => {
    await contract.setInstitutionAuth(institution.address, true);
    expect(await contract.authorizedInstitutions(institution.address)).to.equal(true);
  });

  it("unauthorized address cannot store certificates", async () => {
    await expect(
      contract.connect(stranger).storeCertificate(CERT_ID, CERT_HASH)
    ).to.be.revertedWith("CertValidator: not authorized institution");
  });

  // ── Store ──────────────────────────────────────────────────────────────────
  it("owner can store a certificate", async () => {
    await expect(contract.storeCertificate(CERT_ID, CERT_HASH))
      .to.emit(contract, "CertificateStored")
      .withArgs(CERT_ID, CERT_HASH, owner.address, anyValue); // <--- fix here
  });

  it("cannot store the same certId twice", async () => {
    await contract.storeCertificate(CERT_ID, CERT_HASH);
    await expect(
      contract.storeCertificate(CERT_ID, CERT_HASH)
    ).to.be.revertedWith("CertValidator: certificate already stored");
  });

  it("rejects hash that is not 64 chars", async () => {
    await expect(
      contract.storeCertificate(CERT_ID, "tooshort")
    ).to.be.revertedWith("CertValidator: invalid hash length");
  });

  // ── Verify ─────────────────────────────────────────────────────────────────
  it("verifyCertificate returns isValid=true for stored cert", async () => {
    await contract.storeCertificate(CERT_ID, CERT_HASH);
    const [storedHash, isValid, isRevoked] = await contract.verifyCertificate(CERT_ID);
    expect(storedHash).to.equal(CERT_HASH);
    expect(isValid).to.equal(true);
    expect(isRevoked).to.equal(false);
  });

  it("validateHash returns true for correct hash", async () => {
    await contract.storeCertificate(CERT_ID, CERT_HASH);
    expect(await contract.validateHash(CERT_ID, CERT_HASH)).to.equal(true);
  });

  it("validateHash returns false for wrong hash", async () => {
    await contract.storeCertificate(CERT_ID, CERT_HASH);
    expect(await contract.validateHash(CERT_ID, "b".repeat(64))).to.equal(false);
  });

  // ── Revoke ─────────────────────────────────────────────────────────────────
  it("owner can revoke a certificate", async () => {
    await contract.storeCertificate(CERT_ID, CERT_HASH);
    await expect(contract.revokeCertificate(CERT_ID, "Fraud detected"))
      .to.emit(contract, "CertificateRevoked");

    const [, isValid, isRevoked] = await contract.verifyCertificate(CERT_ID);
    expect(isValid).to.equal(false);
    expect(isRevoked).to.equal(true);
  });

  it("cannot revoke an already revoked certificate", async () => {
    await contract.storeCertificate(CERT_ID, CERT_HASH);
    await contract.revokeCertificate(CERT_ID, "reason");
    await expect(
      contract.revokeCertificate(CERT_ID, "again")
    ).to.be.revertedWith("CertValidator: already revoked");
  });
});