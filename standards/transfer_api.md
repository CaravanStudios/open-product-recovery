# The Open Product Recovery Transfer API <!-- omit in toc -->

An open protocol for exchanging and accepting recovered products.

* **Version**: `0.5.1`
* **Last Updated**: October 31, 2022
* **Drafted by**: John Richter & Mike Ryckman
* **Initial draft**: May 18, 2022

# Table of Contents <!-- omit in toc -->

* [1. Background](#1-background)
* [2. Design Objectives](#2-design-objectives)
* [3. General Concepts](#3-general-concepts)
  * [3.1. Donation Offer](#31-donation-offer)
  * [3.2. Organizations](#32-organizations)
  * [3.3. Responsibility](#33-responsibility)
* [4. Security Concepts](#4-security-concepts)
  * [4.1. Cryptographic Signing & Related Assumptions](#41-cryptographic-signing--related-assumptions)
  * [4.2. Organization-Based Security](#42-organization-based-security)
  * [4.3. Organization Access Lists](#43-organization-access-lists)
  * [4.4. Friend of a Friend Sharing](#44-friend-of-a-friend-sharing)
* [5. Organizations](#5-organizations)
  * [5.1. Offering Organizations](#51-offering-organizations)
  * [5.2. Recipient Organizations](#52-recipient-organizations)
  * [5.3. Organization Description File](#53-organization-description-file)
    * [5.3.1. Organization Identification URL](#531-organization-identification-url)
    * [5.3.2. File Format](#532-file-format)
* [6. REST API](#6-rest-api)
  * [6.1. Required and Optional Operations](#61-required-and-optional-operations)
  * [6.2. Authentication & Authorization](#62-authentication--authorization)
    * [6.2.1. Authenticating & Authorizing Requests](#621-authenticating--authorizing-requests)
      * [6.2.1.1. Access Tokens](#6211-access-tokens)
        * [6.2.1.1.1. Access Token Header](#62111-access-token-header)
        * [6.2.1.1.2. Access Token Payload](#62112-access-token-payload)
      * [6.2.1.2. Authentication - Verifying Access Tokens](#6212-authentication---verifying-access-tokens)
      * [6.2.1.3. Authorization - Optional Scope Checking](#6213-authorization---optional-scope-checking)
        * [6.2.1.3.1. Supported Scopes](#62131-supported-scopes)
    * [6.2.2. Authorization - Checking the Issuing Organization](#622-authorization---checking-the-issuing-organization)
      * [6.2.2.1. Standard Requests](#6221-standard-requests)
      * [6.2.2.2. Friend of a Friend Requests](#6222-friend-of-a-friend-requests)
        * [6.2.2.2.1. The Resharing Chain](#62221-the-resharing-chain)
    * [6.2.3. Making Requests](#623-making-requests)
      * [6.2.3.1. Token Claims](#6231-token-claims)
      * [6.2.3.2. Signing and Encoding Tokens](#6232-signing-and-encoding-tokens)
  * [6.3. REST Endpoints](#63-rest-endpoints)
    * [6.3.1. Errors](#631-errors)
    * [6.3.2. `listProducts`](#632-listproducts)
      * [6.3.2.1. `SNAPSHOT` Format](#6321-snapshot-format)
      * [6.3.2.2. `DIFF` Format](#6322-diff-format)
        * [6.3.2.2.1. Using `DIFF` Format Responses](#63221-using-diff-format-responses)
      * [6.3.2.3. Reservation Considerations](#6323-reservation-considerations)
      * [6.3.2.4. Friend of a Friend `listProducts` Requests](#6324-friend-of-a-friend-listproducts-requests)
      * [6.3.2.5. `listProducts` Request Body](#6325-listproducts-request-body)
      * [6.3.2.6. `listProducts` Response Body](#6326-listproducts-response-body)
      * [6.3.2.7. `listProducts` HTTP Response Directives](#6327-listproducts-http-response-directives)
      * [6.3.2.8. Resharing Servers](#6328-resharing-servers)
    * [6.3.3. `acceptProduct`](#633-acceptproduct)
      * [6.3.3.1. `acceptProduct` Request Body](#6331-acceptproduct-request-body)
      * [6.3.3.2. `acceptProduct` Response Body](#6332-acceptproduct-response-body)
      * [6.3.3.3. `acceptProduct` Error Messages](#6333-acceptproduct-error-messages)
    * [6.3.4. `rejectProduct`](#634-rejectproduct)
      * [6.3.4.1. Friend of a Friend `rejectProduct` Requests](#6341-friend-of-a-friend-rejectproduct-requests)
      * [6.3.4.2. `rejectProduct` Request Body](#6342-rejectproduct-request-body)
      * [6.3.4.3. `rejectProduct` Response Body](#6343-rejectproduct-response-body)
    * [6.3.5. `reserveProduct`](#635-reserveproduct)
      * [6.3.5.1. `reserveProduct` Request Body](#6351-reserveproduct-request-body)
      * [6.3.5.2. `reserveProduct` Response Body](#6352-reserveproduct-response-body)
    * [6.3.6. `pushChanges`](#636-pushchanges)
      * [6.3.6.1. `pushChanges` Request Body](#6361-pushchanges-request-body)
      * [6.3.6.2. `pushChanges` Response Body](#6362-pushchanges-response-body)
    * [6.3.7. `acceptHistory`](#637-accepthistory)
      * [6.3.7.1. Acceptance Role](#6371-acceptance-role)
      * [6.3.7.2. Friend of a Friend `acceptHistory` Requests](#6372-friend-of-a-friend-accepthistory-requests)
      * [6.3.7.3. `acceptHistory` Request Body](#6373-accepthistory-request-body)
      * [6.3.7.4. `acceptHistory` Response Body](#6374-accepthistory-response-body)
        * [6.3.7.4.1. OfferHistory Object](#63741-offerhistory-object)
      * [6.3.7.5. Implementing The History Endpoint](#6375-implementing-the-history-endpoint)
      * [6.3.7.6. Using The History Endpoint](#6376-using-the-history-endpoint)
* [7. Best Practices](#7-best-practices)
  * [7.1. DDOS Protection](#71-ddos-protection)
  * [7.2. Organization Access Control Lists](#72-organization-access-control-lists)
    * [7.2.1. Enrolling New Recipients](#721-enrolling-new-recipients)
  * [7.3. Logging](#73-logging)
  * [7.4. Caching and Efficiency](#74-caching-and-efficiency)
  * [7.5. Showing Different Data to Different Recipients](#75-showing-different-data-to-different-recipients)
  * [7.6. Maintaining Clean Feeds](#76-maintaining-clean-feeds)
  * [7.7. Re-Trying Failed Requests](#77-re-trying-failed-requests)
  * [7.8. Handling Encryption Keys](#78-handling-encryption-keys)
* [8. Frequently Asked Questions](#8-frequently-asked-questions)
  * [8.1. Bad actors](#81-bad-actors)

# 1. Background

Currently, one of the most difficult problems for hunger relief organizations is finding available food in a timely manner. This problem becomes especially important for the most valuable types of food, like meat, dairy and produce, where the food is highly perishable, supply is unpredictable, and transportation costs can be relatively high, because large–scale sources of these foods tend to be far away from the places where the food is most needed.

Today, there are numerous solutions to this problem. Some highly sophisticated donors (like grocery store chains) may offer an API that allows hunger-relief organizations to query stores for information about available donations. Some hunger-relief organizations offer APIs or web portals that allow donors to push available donations into their systems. However, the majority of donation discovery is done using slow, human-to-human communication in natural language, usually over email or phone calls.

All of these existing approaches have significant drawbacks. Human-to-human communication is slow, and it is tremendously expensive, since it requires skilled human workers to make decisions that are often highly automatable. This is especially true for very large donations, like entire fields of surplus produce. In these cases, local hunger relief organizations are unlikely to have the capacity to handle a very large donation, and human beings must place phone calls to their network of contacts to attempt to find a recipient for the large quantity of surplus food. This is a literal game of telephone, where large offers are often placed by a friend of a friend of a friend of a local food rescue organization. Each link in this chain introduces a serious delay in placing perishable food.

The more advanced technical solutions, such as API integrations, do not have this problem. API communication tends to be fast and automatic. However, these integrations have their own difficulties that make them rare in practice:

1. **Lack of technical resources**: Both donors and recipients usually lack the technical expertise to build these integrations
2. **Expense** - When both parties are technically sophisticated enough to build an integration, that integration is expensive
3. **Lack of standards and reuse**: Each API is different, so every integration is unique and non-reusable.
4. **Painful authorization model**: Many existing APIs assume that every API user must have an identity that is registered with the provider of the API, and they often assume that API user ids must originate from an identity system managed by the API provider themselves.
5. **Restrictive trust model**: Most existing authorization models imply a particular trust model - a donor can only trust recipients that the donor knows, because the API requires prior knowledge of a user to authenticate them. However, this does not capture an important aspect of human-to-human donation networks: the friend of a friend model. In real life, human donors trust information about donations to organizations that re-share that information, and eventually connect a recipient directly to the donor. This cannot be done automatically in most existing APIs, because there is no way of authenticating the unfamiliar recipient against the donor's API without additional human intervention.
6. **Push model**: Many food donation APIs are built on a donation-push model, wherein available donations must be posted via API to a large recipient organization. In practice, it is often particularly difficult for donor organizations to use this sort of model, because donor systems tend to be built on top of whatever inventory database is used to run the day-to-day operations.

# 2. Design Objectives

This design sets out to solve the following problems:

1. Provide a simple, standard data format for describing food (and similar) donations
2. Specify a standard API for accepting, reserving, and refusing available donations
3. Specify a security model with the following properties:
   1. Organizations, not users, are the important actors in the system
   2. Donors have control over which organizations can see and act upon available donations
   3. A donor may trust an organization to re-share a donation to organizations that may be unknown to the donor. In this case (called friend-of-a-friend sharing), the donor can properly authenticate agents of that unknown organization and verify that they are accepting a donation that was discovered through a valid chain of trusted re-shares.

# 3. General Concepts

This protocol allows an [offering organization](#51-offering-organizations) to create an *offer feed*, which is a list of *product offers* that can be read by one or more [recipient organizations](#52-recipient-organizations). A recipient organization can then [reserve](#635-reserveproduct), [accept](#633-acceptproduct), or [reject](#634-rejectproduct) [responsibility](#33-responsibility) for the offers in that feed.

Note that some real-world organizations will act as both offering and recipient organizations. Most real world food banks are both offering and recipient organizations, because they accept offers from some organizations (like grocery stores) and make offers to others (like affiliated food banks or pantries). In this case, their roles as offering and recipient organizations are largely independent.

Some real-world organizations will *re-share* offers by creating an offer feed that republishes offers that were read from other offering organizations. This allows offers to be shown to a wide network of potential recipients that are not necessarily known to the original offering organization.

## 3.1. Donation Offer

A donation offer is a collection of goods that exists at some physical location. Although these offers are frequently referred to as "donations" in this and other related documents, a payment or other exchange may be necessary for an organization to take possession of an offer, but these transactions are out of scope for this design . The attributes and precise specification for describing a Donation Offer can be found in [The Open Product Recovery Description Format](description_format.md).

## 3.2. Organizations

An organization is an entity that can make or accept product offers (or both). An organization is described and uniquely specified by an [organization description file](#53-organization-description-file) at a URL controlled by that organization. The organization description file includes information about the organization itself, like the organization name, and information about how to communicate with that organization, including API endpoint paths and authentication and authorization details.

In this specification, organizations that publish lists of available offers are called *offering organizations*. Organizations that read lists of available offers and accept offers are called *recipient organizations*. Many organizations do both, acting as offering organizations and recipient organizations. However, in any given API request, an organization always acts in a single role as an offering organization or a recipient organization.

Real-world organizations (like food banks) may choose to model themselves as multiple organizations in this specification. For example, the Food Bank of Saskatoon might host an organization description file for "Food Bank of Saskatoon - Produce" and a different description file for "Food Bank of Saskatoon - Shelf Stable Goods."

## 3.3. Responsibility

When a recipient organization accepts a donation offer from an offering organization, the recipient organization is accepting responsibility for that donation offer. In this sense, “responsibility” means that the recipient promises to arrange for the offer to be removed from the offering organization's care, and to make the best possible effort to see that the donation offer is used in accordance with the offering organization's wishes for that donation. The recipient organization may never receive or handle the donation offer directly; it may simply arrange for some other organization to receive the donation.

# 4. Security Concepts

## 4.1. Cryptographic Signing & Related Assumptions

This specification relies on the use of [digital signatures](https://en.wikipedia.org/wiki/Digital_signature) to prove that requests from recipient organizations are authentic. These digital signatures are checked via the use of public key sets hosted at a URL controlled by the recipient organization. By default, recipient organizations are allowed to sign their requests using a self-signed certificate.

This is a reliable method for verifying the authenticity of requests as long as:

1. The recipient organization keeps their private key secret.
2. The recipient organization retains control of the URLs that host their description file and their public key.

If the recipient organization's private key is leaked, a malicious party can create unauthorized requests that appear authentic. If a recipient organization's web server is compromised, a malicious party can host a modified recipient description file or public key that will make legitimate requests from the recipient organization appear to be fake, and will allow the malicious party to issue fake requests that appear to be authentic.

Thus, recipient organizations must take special care to ensure the security of their private keys and the web servers used to host their recipient organization details. Offering organizations must implement this specification in a way that makes it easy to revoke the access of a compromised recipient organization.

## 4.2. Organization-Based Security

This specification authorizes requests at the organization level, not the user level. This specification does provide a means of specifying which user account issued a particular request to an offering organization, but that user account information is not actually used when authenticating the request, and this information is included at the discretion of the organization making the request. At most, the user account is logged for institutional tracking or debugging purposes.

When an organization authenticates a request, it is simply checking that the right requesting organization signed the request. In this specification, all users in an organization have the same privileges with respect to all other organizations.

Organizations must enforce their own policies about which of their users are allowed to act on behalf of the organization. An organization is responsible for checking the identity of its own users, and must only issue access tokens for users who have logged in properly and have permission to act on behalf of the organization.

## 4.3. Organization Access Lists

This design assumes that each organization automatically honors requests from a small number of other organizations. Each organization must store an [access control list](https://en.wikipedia.org/wiki/Access-control_list) (ACL) of these trusted organizations. By default, any request from an organization that is not on the ACL should not be honored, and the issuer should receive an appropriate authorization error, unless the request is a valid, verifiable [friend-of-a-friend](#44-friend-of-a-friend-sharing) request.

Most organizations will choose to use the same ACL for all operations on their server. However, some organizations may choose to maintain different access control lists for different operations.

## 4.4. Friend of a Friend Sharing

In friend of a friend sharing, a re-sharing organization discovers a donation offer from some other organization, and shows that offer to a trusted recipient organization that has no direct relationship with the original offering organization.

This is done through a chain of trust. When an organization accepts a friend-of-a-friend offer, that organization must specify the list of the organizations through which the request was re-shared before it was seen. This list of organizations is the "chain of trust" through which the offer was shared. The offering organization will honor the request only if it can prove that each organization in that chain of trust is allowed to re-share offers from the previous organization in the chain.

This is done through a reshare chain. A reshare chain is a list of signed JSON Web Tokens that prove that a particular offer was reshared from a source organization to another organization. The first link in the reshare chain is a signed message from the offering organization indicating that a particular offer was made available to another organization to reshare (or accept, or both). Each subsequent link indicates that the next organization has made the offer available to another organization, and signs the signature of the prior link, preventing bad actors from tampering with the chain.

See [Friend of a Friend Requests](#6222-friend-of-a-friend-requests) for more information.

# 5. Organizations

Organizations are the principal actors and resources in the Open Recovery Protocol. Organizations may publish lists of offers, and handle requests for those items from other organizations. Organizations may also act as recipients, sending requests to offering organizations requesting lists of donatable items and sending requests to take real-world responsibility for items in that list. Some organizations operate in both roles, reading offers from one collection of organizations and re-sharing them to a different collection of organizations.

## 5.1. Offering Organizations

In the typical case, an offering organization is expected to be an organization that manages an inventory of items that are stored in some physical space, and only a small subset of those items are available for donation. An offering organization will usually have their own database (or similar technology) for managing their inventory as a whole. This inventory management system will have its own way of tracking which items should be made available for donation, which items have been accepted, and which organization has accepted those items. In many cases, there will be additional person-to-person communication necessary to finalize the details of transferring a donation from the offering organization to the recipient that are outside the scope of this specification.

This specification describes a common interface layer that will wrap whatever inventory management system the offering organization uses. That interface layer will translate between the standard protocol described here and the particular APIs used by that inventory system.

## 5.2. Recipient Organizations

In the typical case, a recipient organization is expected to be an organization that is equipped to receive items from an offering organization. Typical recipient organizations include:

* A charitable organization that distributes donations directly to clients
* A warehousing organization that repackages and stores donations for future distribution
* A transportation provider organization that arranges for donations to be moved from an offering organization directly to some other recipient organization

A recipient organization may have their own system (or multiple systems) that tracks donations they receive, including inventory systems, CRMs, or accounting systems. This specification describes a common interface layer that sits on top of those systems and translates standard requests into operations on those internal systems.

## 5.3. Organization Description File

The organization description file is a JSON file hosted at a public URL. It describes the organization itself, the capabilities supported by that organization, the resharing capabilities of the system, and how other organizations can check whether requests from that organization are legitimate.

### 5.3.1. Organization Identification URL

The public URL to an organization's description file uniquely identifies this organization. This URL must be used in any case where a unique identifier for an organization is required by this specification (such as specifying re-sharing organization or chains of trust).

Organization identification URLs must be hosted using the https protocol and begin with "https." Organization identification URLs must be world-readable and accessible on the world wide web without authentication.

### 5.3.2. File Format

The organization description file contains a single JSON map with the following fields:

* `name` (`string`) : A human-readable name for this organization
* `description`[^1] : `string` - An optional human-readable description for this organization.
* `learnMoreUrls`[^2] (`Array<string>`, optional) : An optional list of URLs to human-readable web pages with more information about this organization.
* `organizationURL` (`string`) : The canonical url for this organization file. This is the url to use when identifying this organization, even if the organization description file is available at other network locations.
* `enrollmentURL` (`url`, optional) : A URL for a web page containing instructions on how to be added to this organization's [access control list](#43-organization-access-lists) so they can gain access to the organization's API.
* `listProductsEndpointURL` (`url`, optional) : The URL of the [`listProducts`](#632-listproducts) endpoint for this organization. If omitted, this server does not support the "list" operation.
* `acceptProductsEndpointURL` (`url`, optional) : The URL of the [`acceptProduct`](#633-acceptproduct) endpoint for this organization. If omitted, this organization does not support the "accept" operation.
* `reserveProductsEndpointURL` (`url`, optional) : The URL of the [`reserveProduct`](#635-reserveproduct) endpoint for this organization. If omitted, this organization does not support the "reserve" operation.
  rejectProductsEndpointURL - url (optional) : The URL of the rejectProject endpoint for this organization. If omitted, this organization does not support the reserve operation.
* `acceptHistoryEndpointURL` (`url`, optional) : The URL of the [`acceptHistory`](#637-accepthistory) endpoint for this organization. If omitted, this organization does not support the history operation.
* `jwksURL` (`url`, optional) : The url of a [JSON web key set](https://datatracker.ietf.org/doc/html/rfc7517#section-5) that contains the public signing keys used to verify signed access tokens created by this recipient. This attribute is required for organizations that make API requests to other organizations, because this key set is used to verify access token signatures. Organizations that make no outgoing requests (e.g. pure donor organizations that do not need history information) can omit this property. Note that at least one of these keys must be paired with a private key that the organization uses to [sign access tokens](#6232-signing-and-encoding-tokens).
* `scopesSupported` (`boolean`, optional) : Indicates whether this server supports [scope checking](#6213-authorization---optional-scope-checking). If this value is true, this server will check the scopes specified in access tokens and will refuse requests where the access token does not contain the required scope for the current operation. If this value is false or omitted, this server must ignore any scopes specified in access tokens.

[^1]: Not yet supported in reference implementation.
[^2]: Not yet supported in reference implementation.

# 6. REST API

All operations in this standard are implemented through REST APIs.

## 6.1. Required and Optional Operations

Any organization may implement any subset of the operations in this API. However, organizations may refuse communication or otherwise limit access to other organizations that do not implement some endpoints. For example, it may be common for organizations to refuse to reshare offers from organizations that do not implement the history endpoint, since the history endpoint is critical to determining whether reshared offers were accepted.

If an organization refuses a request because the requesting organization has failed to implement some endpoints, the server should return an HTTP 403 (Forbidden) error, with a plaintext message explaining which endpoints are required by this server.

## 6.2. Authentication & Authorization

### 6.2.1. Authenticating & Authorizing Requests

Requests must be authenticated to determine that this is a legitimate request. Then the requested must be authorized by:

1. Optionally checking that the token contains the correct scope claim for the current operation.
2. Checking that the issuing organization has permission for the requested operation.

#### 6.2.1.1. Access Tokens

Authentication in this specification is done through the use of access tokens. All requests in this protocol must specify an access token in the HTTP Authorization header, using the Bearer schema, as follows:

```http
Authorization: Bearer <accesstoken>
```

The access token must be a Base64 encoded, signed Json Web Token. It is strongly recommended that organizations use a pre-existing, standard library for decoding tokens and verifying their signatures.

The JWT access token will contain the following properties:

##### 6.2.1.1.1. Access Token Header

The header *must* specify the following fields:

* `typ`: This must be specified with the value "JWT"
* `alg`: This must be set to the algorithm used to sign the token

##### 6.2.1.1.2. Access Token Payload

The payload *must* specify the following claims:

* [`iss`](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.1) : The "issuer" claim, indicating which organization minted this token. This must be set to the public URL of the requesting organization description file
* [`aud`](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.3) : The "audience" claim, indicating which organization will be handling this token. This must be set to the public URL of the target organization description file
* [`exp`](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4) : The expiration time of this token. This must be set to a time not more than 1 hour in the future.

The payload *may* specify the following claims:

* [`nbf`](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.5) (optional) : The "not before" time of this token, that is, the earliest time this token can be used.
* [`sub`](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.2) : (optional) The "subject" of the token - the user that this token is about. The may be set to the user id of the user making the request.
* [`scope`](https://datatracker.ietf.org/doc/html/rfc8693#section-4.2) : (optional) The "scope" of the token, indicating which operations the current token is allowed to perform. Servers are not required to honor this claim - see the [scopes](#6213-authorization---optional-scope-checking) section for details.

The payload may optionally specify any other claim, but those claims will be ignored.

#### 6.2.1.2. Authentication - Verifying Access Tokens

Requests are authenticated by verifying the signature of the access token. The steps to do so are:

1. Fetch the recipient organization description file specified in the token's `iss` field
2. Fetch the key set at the URL specified in the `jwks` field of the organization description file
3. Verify that the token was signed with one of the keys in that keySet using the algorithm specified in the `alg` header field.

If the signature cannot be verified for any reason, including an inability to fetch the organization description file or the key set, the current request must fail.

If the current time is outside the window set by the `nbf` and `exp` claims, the HTTP status code 403 (forbidden) must be returned. Implementors may allow a few minutes of leeway at either end of this window to account for clock skew.

If no authorization header is present, the HTTP status code 401 (unauthorized) must be returned.

If the signature cannot be verified, the HTTP status code 403 (forbidden) must be returned.

#### 6.2.1.3. Authorization - Optional Scope Checking

If the organization supports scope checking, it must specify the property `scopesSupported=true` in its [organization description file](#53-organization-description-file).

If an organization does not support scope checking, scopes must be ignored and all operations should proceed as if the required scopes are in the access token.

If scopes are supported, the following process must be used for scope checking:

1. If the access token contains no scope claim, all operations must fail (because every operation requires at least one scope).
2. The "scope" claim should be parsed as a space-separated list of scope names. Each operation in the API is associated with exactly one scope. If the scope claim list in the access token does not contain the scope required by the current operation, the request must fail with HTTP status code 403 (Forbidden) and a text error message that explains the missing scope.

##### 6.2.1.3.1. Supported Scopes

The following scopes are supported in this API specification.

* `LISTPRODUCTS` - Required for the [`listProducts`](#632-listproducts) endpoint
* `ACCEPTPRODUCT` - Required for the [`accept`](#633-acceptproduct), [`reserve`](#635-reserveproduct) and [`reject`](#635-reserveproduct) endpoints
* `PRODUCTHISTORY` - Required for the [`history`](#637-accepthistory) endpoint
* `PUSHCHANGES` - Required for the [`pushChanges`](#636-pushchanges) endpoint

### 6.2.2. Authorization - Checking the Issuing Organization

The issuing organization must be checked for authorization to succeed. The type of check depends on whether the request body specifies the `reshareChain` parameter, which is defined for the [`accept`](#633-acceptproduct) and [`reserve`](#635-reserveproduct) endpoints. If the `reshareChain` parameter is not specified, the issuing organization should be checked per [standard request](#6221-standard-requests). If the `reshareChain` parameter is specified, the issuing organization should be checked per [friend of a friend requests](#6222-friend-of-a-friend-requests).

#### 6.2.2.1. Standard Requests

Each organization must maintain an access control list of organizations that are allowed to make requests to its API endpoints. The recipient organization URL specified in the authorization token must exactly match an entry in the access control list for the request to succeed. If the recipient organization URL is not in the access control list, the request must fail with an HTTP 403 status (forbidden), with an optional human-readable error message explaining how to gain access to the access control list.

The organization is entirely responsible for deciding how to implement this access control list, but an access control list of some sort must be maintained. API endpoints must never allow requests from wholly unknown organizations.

#### 6.2.2.2. Friend of a Friend Requests

In this case, an unknown recipient organization is attempting to reserve, accept or reject an offer that was discovered via resharing. For example, imagine the sequence of events in the following diagram:

```mermaid
graph TD;
    A[Saskatoon Farms]-- offers tomatoes to -->B[Alberta Food Charities];
    B-- reshares offer to -->C[West Canada Food Bank];
    C-- reshares offer to -->D[Vancouver Food Bank];
    style A fill:#cfe2f3ff,color:#000;
    style B fill:#d0e0e3ff,color:#000;
    style C fill:#fff2ccff,color:#000;
    style D fill:#f4ccccff,color:#000;
```

In this scenario, Vancouver Food Bank discovers an offer of tomatoes via the West Canada Food Co-Op, which discovered the offer via Alberta Food Charities, which discovered the food offer via Saskatoon Farms, the actual donor of the food.

When Vancouver Food Bank accepts the offer, it accepts the offer from Saskatoon Farms, the original donor. In the request to accept the offer, Vancouver Food Bank must present a [resharing chain](#62221-the-resharing-chain) that proves it discovered the offer via a valid chain of trust.

##### 6.2.2.2.1. The Resharing Chain

The resharing chain is a list of JSON Web Tokens proving that the recipient organization received an offer through a valid reshare chain. This is possible because each JSON Web Token encodes a payload containing the following fields:

* `iss` : The organization url of the organization that created this token and is thus resharing this offer.
* `sub` : The organization url of the organization that is being granted permission to accept or reshare this offer.
* `scope` : A string containing a space delimited list of permissions granted at this link in the chain. Possible values are RESHARE, ACCEPT, or both.
* `entitlements` : A value indicating the object that is being shared. At the first link of the chain, this is the offer id of the offer in question. At subsequent links, this is the signature of the prior link in the chain, signifying that the reshare chain up to this point is being reshared.

Further, each JSON Web Token in the chain is signed by the issuing organization. That signature can (and must) be verified using the public keyset at that organization's `jwks` url (see [Organization Description File](#53-organization-description-file)).

Note that `iat` (issued at) and `exp` (expiration time) claims are not required. The reshare chain is meant to be valid throughout the lifetime of an offer, and all tokens in the reshare chain will effectively expire when the offer expires, since the reshare chain becomes unusable when the offer expires. Servers may include `iat` and `exp` claims. If the `exp` claim is included in a token, the `exp` claim must be checked when verifying the token. If a reshare chain contains expired tokens, the entire reshare chain must be considered invalid.

In the example above, the offer received by Vancouver Food Bank might include the following resharing chain:

```json
[
  "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2Zha2VzYXNrYXRvb25mYXJtcy5jb20vb3ByL29yZy5qc29uIiwic3ViIjoiaHR0cHM6Ly9hbGJlcnRhZm9vZGNoYXJpdGllcy5vcmcvb3ByL29yZy5qc29uIiwiZW50aXRsZW1lbnRzIjoib2ZmZXI6eHl6YWJjMTIzIiwic2NvcGUiOiJSRVNIQVJFIn0.E5eYO_Lu8UkJikvPjDKcO5V4fOYyaMUkMnB8ziHuuCTS6QduYafFftA6t0Pt8No4J1GoUeNGqFYtK5hx_JV9zk1yFVmDYS2B9sd9vGZP6Gjt0ZqIYzjMzRcmZXkWTzSd3o6mNRnNty56EfoyaqZIUy17qzsW4zCWtVlVVV8Qqcchn2TEn5SkpRtKsKjj-Vzgn0s0Zfnb0jYUNAjaMPnwa3_rzWfPNIPPSyTLmP0TWvh7t9awm6N2AtLaO1NCOiPALTNFzCR-7SO04Uq9t2NUf7dwYRNPgpExnfOO7ZUq5eEzEXInZQx5Cwtnpg0tTmMXreXof6fLKoFJ7q4QKf3oeA",
  "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FsYmVydGFmb29kY2hhcml0aWVzLm9yZy9vcHIvb3JnLmpzb24iLCJzdWIiOiJodHRwczovL3dlc3RjYW5hZGFjb29wLm9yZy9vcHIvb3JnLmpzb24iLCJlbnRpdGxlbWVudHMiOiJFNWVZT19MdThVa0ppa3ZQakRLY081VjRmT1l5YU1Va01uQjh6aUh1dUNUUzZRZHVZYWZGZnRBNnQwUHQ4Tm80SjFHb1VlTkdxRll0SzVoeF9KVjl6azF5RlZtRFlTMkI5c2Q5dkdaUDZHanQwWnFJWXpqTXpSY21aWGtXVHpTZDNvNm1OUm5OdHk1NkVmb3lhcVpJVXkxN3F6c1c0ekNXdFZsVlZWOFFxY2NobjJURW41U2twUnRLc0tqai1WemduMHMwWmZuYjBqWVVOQWphTVBud2EzX3J6V2ZQTklQUFN5VExtUDBUV3ZoN3Q5YXdtNk4yQXRMYU8xTkNPaVBBTFRORnpDUi03U08wNFVxOXQyTlVmN2R3WVJOUGdwRXhuZk9PN1pVcTVlRXpFWEluWlF4NUN3dG5wZzB0VG1NWHJlWG9mNmZMS29GSjdxNFFLZjNvZUEiLCJzY29wZSI6IlJFU0hBUkUgQUNDRVBUIn0.ej5hOHLvbC3KH6XYh7hN-P4Bkdny6tr2TggfSRgjMQiItOToe1m0YcS9hOfbvSXYS1GHFzcrKMGYIL3SzhAKnfA36SP_ZhfYM9W35m2zCpFu1WgKaSxHtViIYO5EExzgz9RQ0O49CZKN3ZrgQp3mYFOz6ccMHH0V5s1pSM1XBp-Jn-BpZh59YUs7Kt6gPSOt6n8oKGHCFyWiWbMYneMkiOOLrQ0KjyI1zQAZ_tmTToVzBXzSMSvP7xYNDiWkroXf-5ijCPLFNBWbt5IIV_AEE6T8aLrGkNln4P_55gGToNq8Yw2ueAx_7E442bnNDyfVRv1qI9ranaaqJcA8ybIS0g",
  "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3dlc3RjYW5hZGFjb29wLm9yZy9vcHIvb3JnLmpzb24iLCJzdWIiOiJodHRwczovL2Zha2V2Y2Zvb2RiYW5rLm9yZy9vcHIvb3JnLmpzb24iLCJlbnRpdGxlbWVudHMiOiJlajVoT0hMdmJDM0tINlhZaDdoTi1QNEJrZG55NnRyMlRnZ2ZTUmdqTVFpSXRPVG9lMW0wWWNTOWhPZmJ2U1hZUzFHSEZ6Y3JLTUdZSUwzU3poQUtuZkEzNlNQX1poZllNOVczNW0yekNwRnUxV2dLYVN4SHRWaUlZTzVFRXh6Z3o5UlEwTzQ5Q1pLTjNacmdRcDNtWUZPejZjY01ISDBWNXMxcFNNMVhCcC1Kbi1CcFpoNTlZVXM3S3Q2Z1BTT3Q2bjhvS0dIQ0Z5V2lXYk1ZbmVNa2lPT0xyUTBLanlJMXpRQVpfdG1UVG9WekJYelNNU3ZQN3hZTkRpV2tyb1hmLTVpakNQTEZOQldidDVJSVZfQUVFNlQ4YUxyR2tObG40UF81NWdHVG9OcThZdzJ1ZUF4XzdFNDQyYm5ORHlmVlJ2MXFJOXJhbmFhcUpjQTh5YklTMGciLCJzY29wZSI6IlJFU0hBUkUgQUNDRVBUIn0.DJaBaGahe1F46JLTSyByMl2ItBCvArdPL2ZjsYJ4QQPNDU4raPz5gBZjyfGPNlX2z0Ge17AZGHocVLp2U5o7iH4pt38yYRmOHWZwWgj2-EHEkAePinAlzgohWAQXxgQ-I3ayQDCvh-9gOxAFnbMUhen4GzSW7ZILl-5q68BspAEA3TqEqCTGhSRjISIfarfEfNA-dTOrj0_-qVaypXoSfTLkKFVndNeAvT8QOcY4roPlHs1lvy0t8YX93YXZvpHKBeyiJM0yN1ayJKaf9sXIMZlaHDGeDcEpoAmxC9BGEBtXmBR8NraPcx_zJl32GqZsYcnbLobAuMSPx2ygCVnkeg"
]
```

Although it may be difficult to see, this reshare chain contains three JSON Web Tokens. The decoded payloads of each of these tokens forms the following list:

```json
[
  {
    "iss": "https://fakesaskatoonfarms.com/opr/org.json",
    "sub": "https://albertafoodcharities.org/opr/org.json",
    "entitlements": "offer:xyzabc123",
    "scope": "RESHARE"
  },
  {
    "iss": "https://albertafoodcharities.org/opr/org.json",
    "sub": "https://westcanadacoop.org/opr/org.json",
    "entitlements": "E5eYO_Lu8UkJikvPjDKcO5V4fOYyaMUkMnB8ziHuuCTS6QduYafFftA6t0Pt8No4J1GoUeNGqFYtK5hx_JV9zk1yFVmDYS2B9sd9vGZP6Gjt0ZqIYzjMzRcmZXkWTzSd3o6mNRnNty56EfoyaqZIUy17qzsW4zCWtVlVVV8Qqcchn2TEn5SkpRtKsKjj-Vzgn0s0Zfnb0jYUNAjaMPnwa3_rzWfPNIPPSyTLmP0TWvh7t9awm6N2AtLaO1NCOiPALTNFzCR-7SO04Uq9t2NUf7dwYRNPgpExnfOO7ZUq5eEzEXInZQx5Cwtnpg0tTmMXreXof6fLKoFJ7q4QKf3oeA",
    "scope": "RESHARE ACCEPT"
  },
  {
    "iss": "https://westcanadacoop.org/opr/org.json",
    "sub": "https://fakevcfoodbank.org/opr/org.json",
    "entitlements": "ej5hOHLvbC3KH6XYh7hN-P4Bkdny6tr2TggfSRgjMQiItOToe1m0YcS9hOfbvSXYS1GHFzcrKMGYIL3SzhAKnfA36SP_ZhfYM9W35m2zCpFu1WgKaSxHtViIYO5EExzgz9RQ0O49CZKN3ZrgQp3mYFOz6ccMHH0V5s1pSM1XBp-Jn-BpZh59YUs7Kt6gPSOt6n8oKGHCFyWiWbMYneMkiOOLrQ0KjyI1zQAZ_tmTToVzBXzSMSvP7xYNDiWkroXf-5ijCPLFNBWbt5IIV_AEE6T8aLrGkNln4P_55gGToNq8Yw2ueAx_7E442bnNDyfVRv1qI9ranaaqJcA8ybIS0g",
    "scope": "RESHARE ACCEPT"
  }
]
```

When Vancouver Food Bank accepts offer `offer:xyzabc123`, it must present the reshare chain as part of the accept request it sends to Saskatoon Farms.

To validate this chain, the following steps must be taken:

1. The signature of each token must be verified. This is done according to exactly the same procedure used to [verify access tokens](#6212-authentication---verifying-access-tokens).
2. For each link of the chain, ensure that the token payload contains:
   1. An `entitlements` field. For the first link in the chain, this field must contain the offer id of the offer being accepted. For all other links of the chain, this field must contain the signature of the JWT in the prior link.
   2. A `scope` field. For all links except the last link, the `scope` field must contain the RESHARE scope (and may contain the ACCEPT scope). The last link in the chain must contain the ACCEPT scope (and may contain the RESHARE scope).
   3. An `iss` field. For the first link in the chain, this field must match the organization given in the offer's `offeredBy` field. For all other links in the chain, this must match the `sub` field of the prior link in the chain.
   4. A `sub` field. For the last link of the chain, this must match the org url of the organization making the accept request. For all other links in the chain, this field must match the `iss` field of the next link.

If any part of this verification process fails, the server must return an HTTP 403 error.

This process requires multiple network fetches. It is highly recommended that organization description files, keys and access control lists are locally [cached](#74-caching-and-efficiency) to improve performance.

### 6.2.3. Making Requests

To issue a request, an organization must create an encoded, signed JWT [access token](#6211-access-tokens) that follows the specification given for [authenticating and authorizing](#62-authentication--authorization) requests. In almost every case, this should be done using a [standard JWT library](https://jwt.io/libraries).

#### 6.2.3.1. Token Claims

The token claims must be set according to the [access token](#6211-access-tokens) specification above.

It is recommended that the `exp` claim should be set at the current system clock time plus 5 minutes.

#### 6.2.3.2. Signing and Encoding Tokens

The JWT access tokens used in this specification must be signed according to the [JSON web signature specification](https://datatracker.ietf.org/doc/html/rfc7515#page-7). This is done automatically by all [standard JWT libraries](https://jwt.io/libraries), where encoded tokens are created in the following way:

1. Create a JSON object containing a collection of claims
2. Pass that object, a private key, and a signing algorithm to a utility function

This is the method that should be used to encode and sign all access tokens used by this standard. Any signing algorithm supported by JWT may be used, but `HS256` is recommended, since it is most widely supported.

Signing keys are generated in pairs, a public key and a private key. The private key used for token signatures must have its accompanying public key listed in the Java Web Signature Key Set given by the `jwks` parameter of the [organization description file](#53-organization-description-file).

## 6.3. REST Endpoints

To implement this protocol, the following REST endpoints must be available at the URLs specified in the offering organization's description file. Note, however, that some of these endpoints can provide a null implementation, or return an HTTP 501 (Not Implemented) error.

All REST requests must be POST requests.

### 6.3.1. Errors

When a REST request fails, a JSON object with the following properties must be returned:

* `message` (`string`) : A human-readable description of the error
* `code` (`string`) : A short code indicating the type of error. Error messages may change depending on the circumstances of the error, but the same type of error must always generate the same error code. Error codes may contain capital letters, numbers and underscores. No other characters are allowed.

Some REST endpoints (like [accept](#633-acceptproduct)) require other information to be returned with their errors. Servers may choose to include additional information in other fields not given in this specification.

### 6.3.2. `listProducts`

* **Scope**: `LISTPRODUCTS`
* **Organization description file attribute for url**: `listProductsEndpointURL`

The `listProducts` endpoint returns information about available offers. The `listProducts` endpoint may return that information in two different formats: `SNAPSHOT` and `DIFF`.

#### 6.3.2.1. `SNAPSHOT` Format

In `SNAPSHOT` format, offers are represented as an array of Offers in JSON format. The array contains all information about all available offers on this server at the current moment.

If `SNAPSHOT` format is requested, the server response must be in `SNAPSHOT` format.

`SNAPSHOT` responses may return the same offer more than once (although this is discouraged). If the same offer id appears more than once, only the last instance of the offer is valid; prior versions of the offer can be ignored.

#### 6.3.2.2. `DIFF` Format

In `DIFF` format, the server returns a [JSON Patch array](https://jsonpatch.com/) that, when applied, updates a collection of offers from some earlier time to match the collection of offers on the server at the current moment.

If `DIFF` format is requested, the server may respond with `DIFF` format. However, a server may be unable to respond to some `DIFF` format requests (particularly ones where the requested `diffStartTimestampUTC` parameter specifies a time in the distant past). In those cases, the server may respond in `SNAPSHOT` format.

`DIFF` format requests require the `diffStartTimestampUTC` property to be specified in the request.

##### 6.3.2.2.1. Using `DIFF` Format Responses

A [JSON patch](https://jsonpatch.com/) ([RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902/)) is an array of operation descriptions for modifying a JSON value. DIFF format is useful for organizations that store the offers read from another server, because DIFF format transfers the minimal information necessary to update a stored collection of offers to match the most recent state on a remote server.

The JSON patches used in OPR apply to an entire collection of offers on a server, not individual offers. To apply JSON patch to an offer collection, first the collection must be transformed to a map of full offer ids to offers. To do this:

1. Let offerMap = `{}` (an empty JSON object)
2. For each offer on the server:
   1. Generate a full offer id by concatenating the offer's `offeredBy` field, a '#' symbol, and the offer `id`
   2. let `offerMap[fullOfferId] = offer`

The JSON patch can then be applied to the resulting offer map using a [standard JSON patch library](https://jsonpatch.com/#libraries).

A malformed or buggy JSON patch may leave one or more offers in an invalid and unusable state. Therefore, servers must check every offer in the offer map after applying a JSON patch. If an offer is invalid after the patch is applied, the server should handle the malformed offer as if it had been deleted by the patch.

#### 6.3.2.3. Reservation Considerations

Organizations that do not support the [`reserveProduct`](#635-reserveproduct) endpoint should configure the [`listProducts`](#632-listproducts) endpoint so that every offer has a `maxReservationTimeSeconds` of 0.

#### 6.3.2.4. Friend of a Friend `listProducts` Requests

Friend-of-a-friend requests are not valid on the `listProducts` endpoint.

#### 6.3.2.5. `listProducts` Request Body

The request body to the listProducts endpoint should be a JSON map with the following properties:

* `pageToken` (`string`, optional) : A token indicating which page of the results to return. This must be a page token returned by a prior request to the `listProducts` endpoint.
* `requestedResultFormat` (`string`, optional) : Requests that results are returned in `SNAPSHOT` or `DIFF` format (see [Response Body](#6326-listproducts-response-body) below for descriptions of these formats). The server is not required to honor a request for `DIFF` format; it may return results in `SNAPSHOT` format instead. The server must always honor a request for `SNAPSHOT` format. `DIFF` and `SNAPSHOT` are the only values permitted for this property.
* `diffStartTimestampUTC` (`number`, required for `DIFF` format, ignored for `SNAPSHOT`) : The baseline time for a response in `DIFF` format. The `diff` field of the response will include a JSON patch to modify the offer set as of the requested time to the current offer set. If possible, callers should base this value on a timestamp received from the server they are calling, rather than a timestamp from their own clock, to avoid clock skew problems.
* `maxResultsPerPage` (`number`, optional) - A requested maximum number of results per page. The server may ignore this parameter. If honored, this parameter applies to both the contents of `SNAPSHOT` and `DIFF` replies.

#### 6.3.2.6. `listProducts` Response Body

The listProducts endpoint returns a JSON object containing the following fields:

* `responseFormat` (`string`) : Either the value `SNAPSHOT` or `DIFF`, indicating the format of the response. If `DIFF` format was requested, it is important to check this field, because the server may return a `SNAPSHOT` response even if `DIFF` format was requested.
* `resultsTimestampUTC` (`number`) : The timestamp at which these results are current from the point of view of the server. Servers that are requesting results in `DIFF` format should provide this value as the `diffStartTimestampUTC` parameter of their next request to this server.
* `nextPageToken` (`string`, optional) : The page token for the next page of results. If this field is missing, it means the current page is the last page of results.
* `offers` (`Array<Offer>`, (always provided in `SNAPSHOT` format, always omitted in `DIFF` format) : An array of offers in JSON format. Offers are described in detail in [The Open Product Recovery Description Format](description_format.md).
* `diff` (`JSONPatch`, always provided in `DIFF` format, always omitted in `SNAPSHOT` format) : A JSON patch object. When applied, this will transform the server's collection of offers at `diffStartTimestampUTC` to the server's current offer collection.

In all `listOffers` responses, regardless of format, there are two fields in the Offer object that have special meaning to this Transfer API:

* `offeredBy` (`url`) : The URL of the organization making this offer. This is the organization from which the offer may be accepted.
* `reshareChain` (`Array<string>`, optional) - The [reshare chain](#62221-the-resharing-chain) of this offer. This property must be included if the offer is reshared, and the reshare chain must be signed to the particular organization making this request.

An offering organization should make a best effort to only include offers that can be accepted by the current recipient organization.

An offering organization may choose to show any subset of its offers to any recipient organization.

#### 6.3.2.7. `listProducts` HTTP Response Directives

The following HTTP response directives have special meaning on this endpoint.

* `max-age` (`number`, optional) - In general, the `max-age` directive indicates the number of seconds that an HTTP response will remain fresh. This header may be specified in a response to a `listProducts` request to indicate how long a caller should wait before polling this endpoint again. An offering organization may choose to return an HTTP 429 status code if a recipient organization calls the `listProducts` endpoint again before this time period has elapsed.

#### 6.3.2.8. Resharing Servers

Servers that reshare offers have special responsibilities when building responses on the `listProducts` endpoint. Reshared offers must include a valid [reshare chain](#62221-the-resharing-chain), and each link of a reshare chain must include a payload that targets the resharing chain to a particular organization.

This means servers that reshare offers must extend the reshare chain for each offer, for each organization that calls `listProducts`. Extended reshare chains may be calculated on the fly as the `listProducts` response is created, or they can be cached in advance for every organization that might see a particular offer.

### 6.3.3. `acceptProduct`

* **Scope**: `ACCEPTPRODUCT`
* **Organization description file attribute for url**: `acceptProductEndpointUrl`

The accept endpoint allows a recipient organization to take responsibility for an offer.

When an offer is accepted, the item should be marked accepted in the underlying inventory system. The offer should be removed from the list of offers returned by the listProducts endpoint, although there may be some lag between when an offer is accepted and when it is no longer listed.

If the accept endpoint is called for an offer that has already been accepted, an HTTP 404 status (not found) should be returned. If the accept endpoint is called for an offer that has already been accepted by that organization, an offering organization may choose to return an HTTP 200 status (ok) for that request.

If the accept endpoint is called for an offer that is currently [reserved](#635-reserveproduct), the response depends on which recipient organization holds the current reservation. If the caller is the same organization that holds the reservation, the call succeeds and the caller becomes responsible for the offer. If the caller is from an organization that does not hold the reservation, an HTTP 404 status (not found) must be returned.

If the accept endpoint is called for an offer that does not exist, is expired, has been [rejected](#634-rejectproduct) by the calling organization, or is otherwise unavailable for acceptance, an HTTP 404 status (not found) must be returned.

If a caller wants to ensure that they know the exact contents of the offer they are accepting, they may specify the `ifNotNewerThanTimestampUTC` parameter. If the offer's `lastUpdateTimestampUTC` is newer than this parameter, the accept request must fail, and the latest version of the offer must be returned in the [error message](#6333-acceptproduct-error-messages).

#### 6.3.3.1. `acceptProduct` Request Body

The request body should be a JSON map with the following properties:

* `offerId` (`string`) : The id of the offer to accept.
* `ifNotNewerThanTimestampUTC` (`number`, optional) : An optional timestamp indicating the latest version of the offer that the requesting organization is willing to accept. If the offer's `lastUpdateTimestampUTC` is newer than this timestamp, the request must fail. See [Accept Error Messages](#6333-acceptproduct-error-messages) below.
* `reshareChain` (`Array<url>`, optional) : An optional array of JSON Web Tokens specifying the chain of resharing by which the current recipient organization discovered this offer. This field must be provided for offers that were received via resharing. See [Friend of a Friend Sharing](#44-friend-of-a-friend-sharing) for details.

#### 6.3.3.2. `acceptProduct` Response Body

An empty JSON object must be returned if the call is successful.

#### 6.3.3.3. `acceptProduct` Error Messages

If the request fails because the offer has changed since the time in `ifNotNewerThanTimestampUTC`, the error message JSON must also contain the following field:

* `currentOffer` (`Offer`) : The latest version of the offer.

### 6.3.4. `rejectProduct`

* **Scope**: `ACCEPTPRODUCT`
* **Organization description file attribute for url**: `rejectProductEndpointURL`

The [`reject`](#634-rejectproduct) endpoint allows a recipient organization to permanently reject an offer. The recipient organization is saying it will never accept this offer. This endpoint is especially useful for systems where the same offer is shown to multiple recipients one at a time. For example, consider an offering system where offers are only shown to high priority recipients for one hour, and any offers that have not been accepted after an hour are shown to all potential recipients. A system like that could track whether every high priority recipient has rejected the offer, and open the offer to all recipients immediately in that case.

The offering organization is free to ignore calls to `reject`.

When [`listProducts`](#632-listproducts) is called, an offering organization may hide an offer from any recipient organization that has rejected that offer.

When `accept` is called, an offering organization may return an HTTP 404 status to organizations that attempt to accept an offer they have previously rejected.

A reshared offer may be rejected, but the rejection should not be sent to the offering organization. Rather, the rejection should be sent to the most recent resharing organization, so the organization knows to stop resharing that particular offer with the given recipient.

If the `reject` endpoint is called for an offer that does not exist, is expired, has already been accepted, or is otherwise unavailable for rejection, an HTTP 404 status (not found) must be returned.

#### 6.3.4.1. Friend of a Friend `rejectProduct` Requests

A reject request cannot be a friend-of-a-friend request. A reject request is used to signal that a server should stop showing an offer to a known recipient; friend of a friend requests are used for communication between a server and an unknown recipient, so it is not sensible to accept that sort of request here.

#### 6.3.4.2. `rejectProduct` Request Body

The request body should be a JSON map with the following properties:

* `offerId` (`string`) : The id of the offer to reject.
* `offeredByUrl` (`url`) : The url of the organization in the offer's `offeredBy` field. This must be provided to disambiguate offers with the same id from different organizations.

#### 6.3.4.3. `rejectProduct` Response Body

An empty JSON object should be returned if the call is successful.

### 6.3.5. `reserveProduct`

* **Scope**: `ACCEPTPRODUCT`
* **Organization description file attribute for url**: `reserveProductEndpointURL`

The `reserve` endpoint allows a recipient organization to place a temporary reservation on an offer. No other organization may accept the offer until the reservation expires.

A reservation request may include a request for a particular length for the reservation (in seconds). The server may choose to honor the requested reservation time if it is less than the `requestedReservationSecs` listed for the offer. If the requested reservation time exceeds the `requestedReservationSecs` listed for the offer, the server must do one of the following:

* grant a reservation of length <= `requestedReservationSecs`
* return HTTP status code 400 (bad request)

If `requestedReservationSecs` is not specified, the server must choose a default value for the length of the reservation.

If the `reserve` endpoint is called for an offer that is already reserved, the response depends on which organization holds the reservation. If the reservation is already held by a different organization, an HTTP 404 status (not found) must be returned. If the reservation is held by the calling organization, the server must do one of the following:

* Extend the reservation by some number of seconds <= `requestedReservationSecs`
* return HTTP status code 400 (bad request), along with an error message indicating why the extension was not granted

If an organization tries to reserve an offer multiple times, the offering organization must do one of the following:

* Grant a reservation of length <= `maxReservationTimeSeconds`
* return HTTP status code 400 (bad request), along with an error message indicating why the reservation was not granted

Each offering organization is free to implement its own policy for re-reservation. Offering organizations may choose to disallow multiple reservations entirely.

If the `reserve` endpoint is called for an offer that does not exist, is expired, has already been [`accepted`](#633-acceptproduct) or [`rejected`](#634-rejectproduct), or is otherwise unavailable for reservation, an HTTP 404 status (not found) must be returned.

#### 6.3.5.1. `reserveProduct` Request Body

The request body should be a JSON map with the following properties:

* `offerId` (`string`) : The id of the offer to reserve.
* `requestedReservationSecs` (`number`, optional) : The requested reservation length, in seconds. If not specified, this will default to a value chosen by the server.
* `reshareChain` (`Array<url>`, optional) : An optional array of JSON Web Tokens specifying the chain of resharing by which the current recipient organization discovered this offer. This field must be provided for offers that were received via resharing. See [Friend of a Friend Sharing](#44-friend-of-a-friend-sharing) for details.

#### 6.3.5.2. `reserveProduct` Response Body

The response body will be a JSON map with the following properties:

* `reservationExpirationUTC` (`number`) : The timestamp (in term's of the server's clock) at which the requested reservation will expire.

### 6.3.6. `pushChanges`

* **Scope**: `PUSHCHANGE`
* **Organization description file attribute for url**: `pushChangesEndpointURL`

The pushChanges endpoint allows donor organization to actively push change notifications to another server.

Additional details TBD

#### 6.3.6.1. `pushChanges` Request Body

TBD

#### 6.3.6.2. `pushChanges` Response Body

TBD

### 6.3.7. `acceptHistory`

* **Scope**: `ACCEPTHISTORY`
* **Organization description file attribute for url**: `acceptHistoryEndpointUrl`

The `acceptHistory` endpoint returns a list of History objects describing offers from this organization that were accepted in recent history, for which the requesting organization has some [acceptance role](#6371-acceptance-role). In short, an organization has an acceptance role for an offer if the organization directly accepted the offer, or if the organization was in the reshare chain when the offer was accepted (see [Acceptance Role](#6371-acceptance-role) for further details).

This endpoint makes it possible for resharing organizations to determine which of the items they reshared were ultimately accepted. See [using the history endpoint](#6376-using-the-history-endpoint) for information on how resharing organizations can use this endpoint to build a complete record of the items they reshared.

If implemented, the acceptHistory endpoint must retain history information about all accepted offers for at least one year. Organizations may choose to provide longer retention periods at their discretion. Organizations may provide longer retention periods for some organizations than others, as long as every organization's records are retained for the minimum period of 1 year.

Organizations are only responsible for retaining history information about their own offers. Re-sharing organizations must not publish history information for offers they re-shared.

#### 6.3.7.1. Acceptance Role

An organization has an acceptance role for an offer if:

* It accepted the offer OR
* It was in the reshare chain for an offer

A History object for an offer must not be shown to an organization that has no responsibility for that offer.

#### 6.3.7.2. Friend of a Friend `acceptHistory` Requests

Friend-of-a-friend requests are not valid on the `acceptHistory` endpoint. Requests to the `acceptHistory` endpoint must be accepted from any server with an [acceptance role](#6371-acceptance-role).

#### 6.3.7.3. `acceptHistory` Request Body

The request body to the acceptHistory endpoint must be a JSON map with the following properties:

* `historySinceUTC` (`number`, optional) : An optional unix timestamp (milliseconds since the epoch UTC) indicating that the caller prefers to see the history of offers accepted after the requested time.

#### 6.3.7.4. `acceptHistory` Response Body

The response body must be a JSON object with the following properties:

* `offerHistories` (`Array<`[`OfferHistory`](#63741-offerhistory-object)`>`) : An array of OfferHistory objects representing the history of accepted offers for the requesting organization.

##### 6.3.7.4.1. OfferHistory Object

The `OfferHistory` Object is a JSON object containing the following properties:

* `offer` (`Offer`) : The original offer that was accepted
* `acceptingOrganization` (`url`) : The organization identifier for the organization that accepted the offer
* `reshareChain` (`Array<url>`, optional) : The reshare chain that was provided when the offer was accepted. This field will be omitted if there was no reshare chain provided when the offer was accepted.
* `acceptedAtUTC` (`timestamp`) : The Unix timestamp (milliseconds since the epoch UTC) when the offer was accepted.

#### 6.3.7.5. Implementing The History Endpoint

Most organizations will find it simplest to implement the history endpoint by creating a new storage system specifically for history information, rather than by attempting to wrap an existing inventory system or database, because:

1. The history endpoint allows filtering based on acceptance date, which may not be a natural way of filtering records in the system exposed by listProducts
2. The history endpoint requires the storage of the accepting organization url and the reshare chain, and the endpoint requires results to be filtered on the contents of the reshare chain.
3. The history endpoint must return the original offer record that was accepted, which may be difficult to reconstruct long after an offer is accepted.

Therefore, it is recommended that implementors of this endpoint create a separate storage system that stores the offer history when an offer is accepted. It is recommended that this storage system should be indexed on acceptance time, acceptingOrganization and all values in the reshare chain.

It is a serious breach of the security contract for this endpoint if historical data about an offer is displayed to an organization that has no [acceptance role](#6371-acceptance-role) for that offer. It is strongly recommended that implementors build rigorous end-to-end testing of their implementations to ensure that historical data is only returned to the appropriate organizations.

#### 6.3.7.6. Using The History Endpoint

Re-sharing organizations are expected to make the most use of the history endpoint, so that they can learn how often (and by whom) their reshared offers were accepted.

To do this, re-sharing organizations must store a list of all organization ids found in the `offeredBy` field of any offers that the organization re-shares. The organization then can build a complete history of their re-shared items by calling the history endpoint of each of those organizations.

# 7. Best Practices

This specification may be implemented using any technologies or techniques the organization chooses. However, the following best practices should be considered by all implementors, since they are likely to enhance the usability and performance of any implementation.

## 7.1. DDOS Protection

This specification must be implemented by public web endpoints, some of which must be exposed as unauthenticated static web documents. Like all public web endpoints, these endpoints are subject to distributed denial of service (DDOS) attacks by malicious actors. It is strongly suggested that implementors of this specification put some DDOS protection in place. Most public cloud service providers (like Microsoft, Google and Amazon) have some built-in DDOS protection in place automatically.

## 7.2. Organization Access Control Lists

One of the authorization steps for any request is to check the requesting organization against an access control list of known, trusted recipients. It is strongly suggested that this list be read from a storage system that can be updated quickly without requiring re-deployment of the program code. This will make it fast and convenient for organizations to add new recipients and to revoke the privileges of current recipients that are no longer trusted.

### 7.2.1. Enrolling New Recipients

It is strongly recommended that offering organizations use the `enrollmentUrl` property of the [organization description file](#53-organization-description-file) to document a process for requesting access to the organization access control list. If possible, offering organizations should consider providing a web form that allows a recipient organization to send all necessary enrollment data automatically. Manual, human review is strongly recommended for all online enrollment requests before a recipient organization is added to the access control list.

## 7.3. Logging

Implementations should strongly consider logging all details about all transactions in the system for debugging and auditing purposes. As specified this system includes NO sensitive personally-identifiable information. All information, including encoded and decoded access tokens, may be logged.

## 7.4. Caching and Efficiency

The authentication and authorization mechanisms described here require fetching data, including organization description files, public keysets, and public access control lists from the network to authorize requests. In practice, these documents will change infrequently, and much better performance can be achieved if these documents are cached locally.

It is strongly recommended that all organization description files and public keysets be cached locally. Whenever one of these files is required, they should be fetched from the local cache if available. If an authorization step fails (because a signature cannot be verified, or because an organization URL is not found in the required reshareList), the relevant document from the public URL should be fetched, recached, and re-checked. If the authorization step fails again, then the request should be rejected.

Note that caching makes it difficult for organizations to revoke privileges in the case of a security breach. Therefore, files should be cached for no longer than 48 hours, and implementors must provide a means to manually clear their cache for an organization if they receive a report that the organization's server has been compromised.

## 7.5. Showing Different Data to Different Recipients

The `listProducts` endpoint may return different data to different recipient organizations. This specification does not require that every recipient sees the same offers at the same time. Offering organizations are free to implement any business logic they choose to decide which offers to expose to which recipients at what time.

If an offering organization chooses to hide an offer from recipient A, the offering organization is encouraged to reject any attempt to accept or reserve that offer made by recipient A. If an offer is not shown to an organization via the `listProducts` endpoint, that offer does not exist as far as that organization is concerned, and the offer should not be available via any other endpoint.

## 7.6. Maintaining Clean Feeds

There are some situations where it is impossible to maintain a perfectly up-to-date list of available offers. It is inevitable that resharing feeds will include "stale" offers that cannot be accepted, because they are already expired, accepted, deleted or reserved. It is legal for the `listProducts` endpoint to return stale offers for brief periods of time, but it is strongly encouraged that organizations make the best possible effort to remove stale offers from their `listProducts` results as soon as they are detected. Thus, servers should automatically cull offers whose expiration times have elapsed (with possible leeway to account for clock skew), and use any other signals available (i.e. the server's own attempt to reserve an offer fails) to remove stale offers proactively.

## 7.7. Re-Trying Failed Requests

Failed requests may be re-tried some small number of times to account for network errors. Retries should use [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) to ensure that servers are not overloaded by frequent requests. Organizations that fail to use a polite retry strategy may be subject to banning or other consequences from their partner organizations.

## 7.8. Handling Encryption Keys

Encryption keys must be handled with great care. All major cloud service providers offer specialized key storage systems to ensure that keys are stored properly. It is strongly recommended that implementors use the key storage system provided by the cloud service provider hosting their implementation.

# 8. Frequently Asked Questions

## 8.1. Bad actors

**What if a bad actor (squats on an offer, accepts an offer they won't take, makes fake offers, misrepresents a reshare, etc)?**

This specification is all about facilitating communication between organizations that trust each other. Violations of that trust lead to very bad outcomes. It's possible for a bad actor to do all kinds of anti-social things in this specification. For example, nothing in this specification prevents bad servers from:

* Changing the contents of an offer before re-sharing it.
* Reserving many items for the maximum reservation time and not acting on those reservations.
* Automatically rejecting all acceptance requests.
* Polling other servers at an abusively high rate.

But note that nothing in this specification prevents a number of important real-world abuses of the food sharing system either, like:

* Making offers that do not exist
* Refusing to honor offer acceptances
* Lying about how food will be used

The solution in OPR is the same as the solution in the real world - only trust trustworthy organizations, and stop working with organizations that abuse that trust. That is why all OPR nodes require an access control list that specifies exactly which organizations are allowed to talk to that server. This allows any OPR node to revoke the access of an organization that is behaving abusively in the real world, or in the virtual world.

If someone on your access control list turns out to be a bad actor, remove them from the list immediately. If someone you trust reshares offers from a bad actor, reach out to them and ask them to revoke the bad actor's access. If they cannot or will not, temporarily revoke the access of the organization that is resharing the bad offers, or configure your server to ignore all reshares through the bad organization.
