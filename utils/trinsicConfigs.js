const {
    CredentialsServiceClient,
    ProviderServiceClient,
    WalletServiceClient,
    Credentials,
    ProviderCredentials
} = require("@trinsic/service-clients");

// Credentials API
const credentialsClient = new CredentialsServiceClient(
    new Credentials(process.env.REACT_APP_API_KEY),
    { noRetryPolicy: true }
);

// Provider API
const providerClient = new ProviderServiceClient(
    new ProviderCredentials(process.env.REACT_APP_PROVIDER_KEY),
    { noRetryPolicy: true }
);

// Wallet API
const walletClient = new WalletServiceClient(
    new Credentials(process.env.REACT_APP_API_KEY),
    { noRetryPolicy: true }
);

export { providerClient, walletClient, credentialsClient };
