import { StellarToml, type Networks } from "@stellar/stellar-sdk";

export class StellarAnchorService {
  readonly homeDomain: string;

  toml: StellarToml.Api.StellarToml | undefined;

  networkPassphrase: Networks | undefined;

  federationServer: string | undefined;

  transferServerSep6: string | undefined;

  transferServerSep24: string | undefined;

  kycServer: string | undefined;

  webAuthEndpoint: string | undefined;

  serverSigningKey: string | undefined;

  directPaymentServer: string | undefined;

  anchorQuoteServer: string | undefined;

  constructor(url: string) {
    this.homeDomain = url;
  }
  // Fetches and returns the stellar.toml file hosted by a provided domain.
  async getAnchorInfo(): Promise<StellarToml.Api.StellarToml> {
    if (this.toml) {
      return this.toml;
    }
    console.log("Fetching stellar.toml file for", this.homeDomain);
    const toml = await StellarToml.Resolver.resolve(this.homeDomain);
    console.log("TOML", toml);
    this.toml = toml;
    return toml;
  }

  /**
   * Fetches and returns the network passphrase to use with domain's infrastructure.
   * @async
   * @function getNetworkPassphrase
   * @returns {Promise<string|undefined>} The passphrase for the specific Stellar network this infrastructure operates on
   */
  async getNetworkPassphrase() {
    if (this.networkPassphrase) {
      return this.networkPassphrase;
    }
    const toml = await this.getAnchorInfo();
    if (toml.NETWORK_PASSPHRASE) {
      this.networkPassphrase = toml.NETWORK_PASSPHRASE;
    }
    return this.networkPassphrase;
  }

  /**
   * Fetches and returns the endpoint for resolving SEP-2 federation protocol requests.
   * @async
   * @function getFederationServer
   * @returns {Promise<string|undefined>} The endpoint for clients to resolve stellar addresses for users on domain via SEP-2 federation protocol
   */
  async getFederationServer() {
    if (this.federationServer) {
      return this.federationServer;
    }
    const toml = await this.getAnchorInfo();
    if (toml.FEDERATION_SERVER) {
      this.federationServer = toml.FEDERATION_SERVER;
    }
    return this.federationServer;
  }

  /**
   * Fetches and returns the endpoint used for SEP-6 transfer interactions.
   * @async
   * @function getTransferServerSep6
   * @param {string} domain Domain to get the SEP-6 transfer server for
   * @returns {Promise<string|undefined>} The endpoint used for SEP-6 Anchor/Client interoperability
   */
  async getTransferServerSep6(): Promise<string> {
    if (this.transferServerSep6) {
      return this.transferServerSep6;
    }
    const toml = await this.getAnchorInfo();
    if (toml.TRANSFER_SERVER) {
      this.transferServerSep6 = toml.TRANSFER_SERVER;
    }
    if (!this.transferServerSep6) {
      throw new Error("No transfer server found for domain");
    }
    return this.transferServerSep6;
  }

  /**
   * Fetches and returns the endpoint used for SEP-24 transfer interactions.
   * @async
   * @function getTransferServerSep24
   * @returns {Promise<string|undefined>} The endpoint used for SEP-24 Anchor/Client interoperability
   */
  async getTransferServerSep24() {
    if (this.transferServerSep24) {
      return this.transferServerSep24;
    }
    const toml = await this.getAnchorInfo();
    if (toml.TRANSFER_SERVER_SEP0024) {
      this.transferServerSep24 = toml.TRANSFER_SERVER_SEP0024;
    }
    return this.transferServerSep24;
  }

  /**
   * Fetches and returns the endpoint used for SEP-12 KYC interactions.
   * @async
   * @function getKycServer
   * @param {string} domain Domain to get the KYC server for
   * @returns {Promise<string|undefined>} The endpoint used for KYC customer info transfer
   */
  async getKycServer() {
    if (this.kycServer) {
      return this.kycServer;
    }
    const toml = await this.getAnchorInfo();
    if (toml.KYC_SERVER) {
      this.kycServer = toml.KYC_SERVER;
      return this.kycServer;
    } else {
      return this.getTransferServerSep6();
    }
  }

  /**
   * Fetches and returns the endpoint used for SEP-10 authentication interactions.
   * @async
   * @function getWebAuthEndpoint
   * @returns {Promise<string|undefined>} The endpoint used for SEP-10 Web Authentication
   */
  async getWebAuthEndpoint() {
    if (this.webAuthEndpoint) {
      return this.webAuthEndpoint;
    }
    const toml = await this.getAnchorInfo();
    if (toml.WEB_AUTH_ENDPOINT) {
      this.webAuthEndpoint = toml.WEB_AUTH_ENDPOINT;
    }
    return this.webAuthEndpoint;
  }

  /**
   * Fetches and returns the signing key the server will use for SEP-10 authentication.
   * @async
   * @function getServerSigningKey
   * @returns {Promise<string|undefined>} The public key of the keypair used for SEP-10 authentication
   */
  async getServerSigningKey() {
    if (this.serverSigningKey) {
      return this.serverSigningKey;
    }
    const toml = await this.getAnchorInfo();
    if (toml.SIGNING_KEY) {
      this.serverSigningKey = toml.SIGNING_KEY;
    }
    return this.serverSigningKey;
  }

  async getDirectPaymentServer() {
    if (this.directPaymentServer) {
      return this.directPaymentServer;
    }
    const toml = await this.getAnchorInfo();
    if (toml.DIRECT_PAYMENT_SERVER) {
      this.directPaymentServer = toml.DIRECT_PAYMENT_SERVER;
    }
    return this.directPaymentServer;
  }

  async getAnchorQuoteServer() {
    if (this.anchorQuoteServer) {
      return this.anchorQuoteServer;
    }
    const toml = await this.getAnchorInfo();
    if (toml.ANCHOR_QUOTE_SERVER) {
      this.anchorQuoteServer = toml.ANCHOR_QUOTE_SERVER;
    }
    return this.anchorQuoteServer;
  }
}
