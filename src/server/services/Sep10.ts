// An object to easily and consistently class badges based on the status of
// a user's authentication token for a given anchor.
import { StellarAnchorService } from "~/server/services/StellarAnchorService";
import { WebAuth } from "@stellar/stellar-sdk";

const authStatusClasses = {
  unauthenticated: "badge badge-error",
  auth_expired: "badge badge-warning",
  auth_valid: "badge badge-success",
};

/**
 * @description A collection of functions that make it easier to work with
 * SEP-10 authentication servers. This method of authentication is ubiquitous
 * within the Stellar ecosystem, and is used by most SEP-6 and SEP-24 transfer
 * servers.
 */
export class Sep10 extends StellarAnchorService {
  /**
   * Requests, validates, and returns a SEP-10 challenge transaction from an anchor server.
   * @async
   * @function getChallengeTransaction
   * @param {string} opts.publicKey Public Stellar address the challenge transaction will be generated for
   * @param {string} opts.homeDomain Domain to request a challenge transaction from
   * @throws Will throw an error if one of the required entries is missing from the domain's StellarToml file
   * @param publicKey
   */
  async getChallengeTransaction(publicKey: string) {
    const WEB_AUTH_ENDPOINT = await this.getWebAuthEndpoint();
    const TRANSFER_SERVER = await this.getTransferServerSep6();
    const SIGNING_KEY = await this.getServerSigningKey();

    // In order for the SEP-10 flow to work, we must have at least a server
    // signing key, and a web auth endpoint (which can be the transfer server as
    // a fallback)
    if (!(WEB_AUTH_ENDPOINT || TRANSFER_SERVER) || !SIGNING_KEY) {
      throw new Error(
        "could not get challenge transaction (server missing toml entry or entries)",
      );
    }

    // Request a challenge transaction for the users's account
    const res = await fetch(
      `${WEB_AUTH_ENDPOINT ?? TRANSFER_SERVER}?${new URLSearchParams({
        // Possible parameters are `account`, `memo`, `home_domain`, and
        // `client_domain`. For our purposes, we only supply `account`.
        account: publicKey,
      })}`,
    );
    const json = (await res.json()) as {
      transaction: string;
      network_passphrase: string;
    };

    // Validate the challenge transaction meets all the requirements for SEP-10
    this.validateChallengeTransaction({
      transactionXDR: json.transaction,
      serverSigningKey: SIGNING_KEY,
      network: json.network_passphrase,
      clientPublicKey: publicKey,
      homeDomain: this.homeDomain,
    });
    return json;
  }

  /**
   * Validates the correct structure and information in a SEP-10 challenge transaction.
   * @function validateChallengeTransaction
   * @param {Object} opts Options object
   * @param {string} opts.transactionXDR Challenge transaction encoded in base64 XDR format
   * @param {string} opts.serverSigningKey Public Stellar address the anchor should use to sign the challenge transaction
   * @param {string} opts.network Network passphrase the challenge transaction is expected to be built for
   * @param {string} opts.clientPublicKey Public Stellar address of the client authenticating with the anchor
   * @param {string} opts.homeDomain Domain of the anchor that generated the challenge transaction
   * @param {string} [opts.clientDomain=opts.homeDomain] Used for client domain verification in the SEP-10 authentication flow
   * @throws {error} Will throw an error if any part of the challenge transaction doesn't match the SEP-10 specification
   */
  validateChallengeTransaction({
    transactionXDR,
    serverSigningKey,
    network,
    clientPublicKey,
    homeDomain,
    clientDomain,
  }: {
    transactionXDR: string;
    serverSigningKey: string;
    network: string;
    clientPublicKey: string;
    homeDomain: string;
    clientDomain?: string;
  }) {
    if (!clientDomain) {
      clientDomain = homeDomain;
    }

    try {
      // Use the `readChallengeTx` function from Stellar SDK to read and
      // verify most of the challenge transaction information
      const results = WebAuth.readChallengeTx(
        transactionXDR,
        serverSigningKey,
        network,
        homeDomain,
        clientDomain,
      );
      // Also make sure the transaction was created for the correct user
      if (results.clientAccountID === clientPublicKey) {
        return;
      } else {
        throw new Error("client account id does not match");
      }
    } catch (err) {
      throw new Error(
        (err as Error)?.message ?? "invalid challenge transaction",
      );
    }
  }

  /**
   * Submits a SEP-10 challenge transaction to an authentication server and returns the SEP-10 token.
   * @async
   * @function submitChallengeTransaction
   * @param {Object} opts Options object
   * @param {string} opts.transactionXDR Signed SEP-10 challenge transaction to be submitted to the authentication server
   * @param {string} opts.homeDomain Domain that handles SEP-10 authentication for this anchor
   * @returns {Promise<string>} JSON web token which can be used to authenticate with this anchor server
   * @throws Will throw an error if the server responds with one.
   */
  async submitChallengeTransaction(transactionXDR: string) {
    const webAuthEndpoint = await this.getWebAuthEndpoint();

    if (!webAuthEndpoint)
      throw new Error("could not get web auth endpoint from toml file");
    const res = await fetch(webAuthEndpoint, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: transactionXDR }),
    });
    const json = (await res.json()) as { token: string; error: string };

    if (!res.ok) {
      throw new Error(json.error ?? "could not get token from server");
    }
    return json.token;
  }
}
