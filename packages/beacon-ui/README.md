# `@airgap/beacon-ui`

This package is part of the `@airgap/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package contains the UI part (alerts and toasts) of the `beacon-sdk`.

Unless you need to import types from this package, you probably don't need to add it to your project.

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)

## Content Security Policy (CSP) Configuration

The Beacon UI dynamically fetches the latest wallet list from jsDelivr CDN to ensure users always see up-to-date wallet options without requiring SDK updates. The wallet registry is maintained in a separate repository: [beacon-wallet-list](https://github.com/airgap-it/beacon-wallet-list).

If your application uses a Content Security Policy, add jsDelivr to your `connect-src` directive:

```
connect-src https://cdn.jsdelivr.net;
```

**Why jsDelivr?**
- Official CDN for GitHub repositories and npm packages
- Direct integration with GitHub - automatically serves files from GitHub releases and commits
- Global CDN with high availability and performance
- Automatic caching with purge API for instant updates
- Free and reliable service for open-source projects

The SDK includes a bundled fallback wallet list, so the application will continue to function if the CDN fetch fails or is blocked by CSP.
