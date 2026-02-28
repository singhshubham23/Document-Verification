// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateValidator {
    // ── Storage ─────────────────────────────
    mapping(string => string) private certificates;
    mapping(address => bool) public authorizedInstitutions;
    mapping(string => bool) public revokedCertificates;

    // ── Events ──────────────────────────────
    event CertificateStored(string certId, string certHash, address indexed institution, uint256 timestamp);
    event CertificateRevoked(string certId);

    // ── Constructor ─────────────────────────
    constructor() {
        // deployer/owner is authorized by default
        authorizedInstitutions[msg.sender] = true;
    }

    // ── Authorization ───────────────────────
    function setInstitutionAuth(address _institution, bool _auth) external {
        require(authorizedInstitutions[msg.sender], "CertValidator: not authorized institution");
        authorizedInstitutions[_institution] = _auth;
    }

    // ── Store Certificates ──────────────────
    function storeCertificate(string memory certId, string memory certHash) external {
        require(authorizedInstitutions[msg.sender], "CertValidator: not authorized institution");
        require(bytes(certificates[certId]).length == 0, "CertValidator: certificate already stored");
        require(bytes(certHash).length == 64, "CertValidator: invalid hash length");

        certificates[certId] = certHash;
        emit CertificateStored(certId, certHash, msg.sender, block.timestamp);
    }

    // ── Verify / Validate ──────────────────
    function verifyCertificate(string memory certId) external view returns (string memory, bool isValid, bool isRevoked) {
        string memory hash = certificates[certId];
        bool exists = bytes(hash).length > 0;
        bool revoked = revokedCertificates[certId];
        return (hash, exists && !revoked, revoked);
    }

    function validateHash(string memory certId, string memory certHash) external view returns (bool) {
        return keccak256(bytes(certificates[certId])) == keccak256(bytes(certHash));
    }

    // ── Revoke Certificates ─────────────────
    function revokeCertificate(string memory certId, string memory reason) external {
        require(authorizedInstitutions[msg.sender], "CertValidator: not authorized institution");
        require(!revokedCertificates[certId], "CertValidator: already revoked");
        revokedCertificates[certId] = true;
        emit CertificateRevoked(certId);
    }
}