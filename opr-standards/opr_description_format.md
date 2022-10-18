# The Open Product Recovery Description Format

This defines a standard JSON format for describing food (or other consumer products) that is available for transfer between organizations. This design doc does not specify how this standard format should be used, but it was designed as the primary datamodel for the transfer protocol described in Design Doc Proposal - The Open Product Recovery Transfer API.

- **Version:** `0.5.0`
- **Last Updated:** October 10, 2022
- **Drafted by:** John Richter & Mike Ryckman
- **Initial draft:** May 18, 2022

# Table of Contents <!-- omit in toc -->

* [The Open Product Recovery Description Format](#the-open-product-recovery-description-format)
* [1. Background](#1-background)
* [2. Concepts](#2-concepts)
  * [2.1. Offer](#21-offer)
  * [2.2. Product](#22-product)
  * [2.3. ProductBundle](#23-productbundle)
* [3. Datamodels](#3-datamodels)
  * [3.1. Basic Types](#31-basic-types)
    * [3.1.1. PlaintextDescription](#311-plaintextdescription)
    * [3.1.2. TypeIdentifier](#312-typeidentifier)
      * [3.1.2.1. Vocabulary Aliases](#3121-vocabulary-aliases)
    * [3.1.3. Measurement](#313-measurement)
      * [3.1.3.1. Supported Units and Dimensions](#3131-supported-units-and-dimensions)
    * [3.1.4. PackagingType](#314-packagingtype)
    * [3.1.5. Transportation Details](#315-transportation-details)
    * [3.1.6. Price](#316-price)
  * [3.2. Product](#32-product)
  * [3.3. ProductBundle](#33-productbundle)
  * [3.4. Offer](#34-offer)
    * [3.4.1. OfferContact](#341-offercontact)
    * [3.4.2. OfferLocation](#342-offerlocation)
    * [3.4.3. LatLong](#343-latlong)
    * [3.4.4. AccessWindow](#344-accesswindow)
* [4.1. Frequently Asked Questions](#41-frequently-asked-questions)

# 1. Background

Today, there is no common language for describing food (or other products) that is available for donation or other recovery. This makes it very difficult to establish automated communication between donors and recipients. Today, if a donor (say, a grocery store) wishes to announce an available donation to a recipient (say, a food bank), this communication is done via one of three methods:

  * **Implicit** : There is no realtime communication about donations at all. Rather, telephone, email or face-to-face communication is used to set up a recurring pickup schedule. Recipients have no idea what they're actually receiving until they see it on the loading dock.
  * **Human-to-human** : Communication is done via natural language communication over email or telephone.
  * **Bespoke API**: Communication is done automatically, through a custom API integration. There is no standard data format or protocol for communication over these APIs, so each of these integrations must be custom built.

All 3 of these existing methods entail significant inefficiency and expense. By establishing a common protocol, we can develop libraries to parse and process records in a common format, greatly lowering the complexity and expense of establishing automated communication between donors and recipients, ensuring that the work done to build a first automated integration will then be reusable for all future integrations.

# 2. Concepts

This specification is primarily intended to describe transactions in the economy of excess edible food and food insecurity. A typical transaction in that economy is a food donation, where excess food from a for-profit organization is offered to a charitable organization to prevent it going to waste. However, there are many other very transactions in this space that have similar characteristics and related intent:

  * A restaurant offers excess food to another company for resale at a lower price
  * A produce supplier offers a truckload of produce to a distant, high-capacity food bank for a small fee
  * A food bank offers excess food to another food bank
  * A restaurant offers spoiled food to a composting company
  * A grocery store offers a pallet of diapers with discolored packaging to a local food bank

In all of these scenarios, the types of items or actors are slightly different, but the anatomy of the exchange is similar. An item that will be wasted is offered to another party to recoup some of the potential losses from that waste.

This specification models such offers using 3 main concepts:

## 2.1. Offer

A bundle of products at a particular location that can be accessed (or picked up) at a particular set of times. An offer has an expiration time, after which that offer may not be accepted. An offer cannot be broken up. Any organization that accepts an offer must agree to take all of its contents.

## 2.2. Product

An item that is being offered. Products have attributes including descriptions, measurements, and their meaning may be specified using terms from a controlled vocabulary, like GTIN identifiers. Products have expiration times after which they are no longer usable.

## 2.3. ProductBundle

A collection of Products that must be accepted and transported together. The products in a bundle may be packaged inside some sort of physical container.

# 3. Datamodels

## 3.1. Basic Types

### 3.1.1. PlaintextDescription

Plaintext descriptions are used in several datamodels specified below. Plaintext descriptions are human-readable strings in a particular human language. Plaintext descriptions are either strings, description objects, or a list of description objects.

A description object is JSON map with the following properties:

  * `text` (`string`): A string containing the plaintext description, up to 4096 characters long.
  * `language` (`string`): A BCP-47 language code indicating the language of the string

A plaintext description may be a list of description objects, each of which specifies the same description in several different languages. Each item in the list must specify a different language, and the plain text should convey roughly the same meaning in each language.

If a plaintext description is specified as a simple string, it is automatically assigned the language code "en-US".

### 3.1.2. TypeIdentifier

A type identifier is a reference to a term in a controlled vocabulary that describes a particular product. A type identifier is a JSON map with two fields:

 * `vocabularyId` (`string`): An identifier for the controlled vocabulary. This may be a short alias (see vocabulary aliases below) or the URL of a document that describes the controlled vocabulary.
 * `itemId` (`string`): An identifier for a term in the controlled vocabulary. The maximum identifier length is 4096 characters.

#### 3.1.2.1. Vocabulary Aliases

While not required to be used, the standard supports short aliases for a few well known (or particularly useful) vocabularies:


| vocabularyId                                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [gtin](https://schema.org/gtin)                                    | Indicates a valid GTIN code. itemIds in this vocabulary will be standard gtin codes with 8, 12, 13 or 14 digits. A [gtin](https://schema.org/gtin) value should be a valid GTIN, which means that it should be an all-numeric string of either 8, 12, 13 or 14 digits, or a "GS1 Digital Link" URL based on such a string. The numeric component should also have a [valid GS1 check digit](https://www.gs1.org/services/check-digit-calculator) and meet the other rules for valid GTINs.<br/><br/>_Note: Language and usage of the gtin code is taken from schema.org’s Product schema, found at [https://schema.org/Product](https://schema.org/Product), and used here under the Creative Commons Attribution-ShareAlike License (version 3.0)._ |
| [foodex2](https://www.efsa.europa.eu/en/data/data-standardisation) | Indicates an identifier in the [foodex2 controlled vocabulary](https://efsa.onlinelibrary.wiley.com/doi/pdf/10.2903/sp.efsa.2015.EN-804). Note that although foodex2 identifiers may contain any number of characters in theory, identifiers in this specification may not exceed 4096 characters in length.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [plu](https://en.wikipedia.org/wiki/Price_look-up_code)            | A 4 or 5 digit standard price-lookup code, as specified in the [IFPS database](https://www.ifpsglobal.com/PLU-Codes/PLU-codes-Search).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |


### 3.1.3. Measurement

A measurement is a data structure specifying some physical measurement of an item or a collection of items. A measurement is specified as a JSON map with the following 3 fields:

  * `unit` (`string`): A constant string indicating the unit of measurement
  * `dimension` (`string`, optional for some units): A constant string indicating the dimension of measurement. Note that units and dimensions are closely related, and constrain each other. For example, the unit "pounds" is only applicable to the dimension "weight," while the unit "meters" is applicable to the dimensions "length," "width," and "height." When a measurement's unit is applicable to a single dimension, the "dimension" field may be omitted.
  * `value` (`number`): A floating point value indicating the magnitude of the measurement.

#### 3.1.3.1. Supported Units and Dimensions

| Unit Type                | Supported Units                                                                                     | Supported Dimensions                          | Sums in collections |
| ------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------- |
| Physical extent          | centimeter<br/>foot<br/>inch<br/>meter yard                                                         | length<br/>depth<br/>width                    | no                  |
| Liquid volume            | fluidonce<br/>gallon<br/>liter                                                                      | volume-liquid                                 | yes                 |
| Spatial volume           | cubiccentimeter<br/>cubicfoot<br/>cubicinch<br/>cubicmeter<br/>pallet[^1]<br/>shippingcontainer[^2] | volume                                        | yes                 |
| Weight                   | gram<br/>kilogram<br/>ounce pound                                                                   | weight                                        | yes                 |
| Temperature Requirements | celsius<br/>fahrenheit                                                                              | temperature-max<br/>temperature-min<br/>ideal | no                  |


[^1]: A "pallet" is a custom volume unit equalling 260 cubic feet, the volume of a standard 48"x40" pallet stacked to a height of 6.5 feet.
[^2]: A "shippingcontainer" is a custom volume unit equaling 1150 cubic feet, the volume of a standard shipping container.


### 3.1.4. PackagingType

Products may be bundled together. Sometimes those bundles are contained within physical packages. The type of physical packaging can be specified with one of the following constants:

| Packaging Type Id | Description                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| none              | The contents of the bundle are not physically packaged in any way. This is the default if packaging type is not specified. |
| box               | Items are inside a closed box                                                                                              |
| bin               | Items are inside an open bin                                                                                               |
| bag               | Items are in a bag                                                                                                         | Items are stacked and wrapped on a pallet |
| shippingcontainer | Items are inside a shipping container                                                                                      |
| truckload         | Items fill a shipping container on a truck                                                                                 |

### 3.1.5. Transportation Details

A JSON map containing details about transporting this product.
Details TBD.

### 3.1.6. Price

A price is an amount of money that must be paid to achieve some outcome for an offer, such as a transfer of responsibility, administrative fee or transportation. The Open Product Recovery specifications provide no mechanism for managing payments of these prices or handling pricing or payment disputes. Prices are used for purely descriptive purposes here.

A price is represented a JSON map containing the following fields:

  * `value` (`number`): The amount of the given currency that must be paid
  * `currency` (`string`, currency code): The ISO 4217 currency code for the currency in which the value field is measured. This field does not imply that the price must be paid in this currency; it may be that an equivalent value of another currency could be accepted. This simply specifies the unit of measurement for the price value.

## 3.2. Product

A product is a description of a single type of item (usually a food). Products are JSON objects with the following fields:

  * `id` (`string`): A unique identifier for this product
  * `description` ([`PlaintextDescription`](#311-plaintextdescription)): A description of the item
  * `quantity` (`integer`, optional): An optional specification of the number of identical items of this type. If this number is omitted, the quantity is assumed to be 1.
  * `unitWeight` ([`Measurement`](#313-measurements), optional): The weight of a single item of this type. If specified, the given measurement object must specify a unit that measures the "weight" dimension. This weight is purely informational, and is used to indicate how a particular product contributes to the total weight of a bundle. It is not required that the weights of products in a bundle sum to the weight of that bundle as a whole, but the sum of the weights of products in a bundle should not exceed the weight of the whole bundle.
  * `otherUnitMeasurements` ([`Array<Measurement>`](#313-measurements), optional): A list of other measurements for a single item of this type. Each measurement must specify a different unit/dimension pairing.
  * `itemTypeIds` ([`Array<TypeIdentifier>`](#312-type-identifiers), optional): A list of up to 10 type identifiers describing this product. Each type identifier in the list must specify a different vocabulary id. The identifiers in this list must be synonyms to the extent possible given the vocabularies in use, although it is valid to specify terms at different levels of description in different vocabularies.
  * `price` ([`Price`](#316-price), optional): A price that must be paid for this item to be transferred. This price is purely informational, and is used to indicate how a particular product contributes to the total price of a bundle. It is not required that the prices of products in a bundle sum to the price of the bundle as a whole, but the sum of the prices of products in a bundle should not exceed the weight of the whole bundle. If a product specifies a price, the top-level bundle that contains it must also specify a price.
  * `estimatedValue` ([`Price`](#316-price), optional): The estimated total value of this product. The total estimated value must equal or exceed the estimated values for all child products and bundles.
  * `expirationTimestampUTC` (`number`, optional): A unix timestamp (number of milliseconds since the epoch UTC) indicating when the products of this type will expire, that is, become unusable. This timestamp is purely informational, but if this product is part of a bundle, that bundle's expiration timestamp must be equal to or earlier than this timestamp.
  * `photoUris` (`Array<string>`, optional): A list of URIs containing up to 10 images of the product. Each URI may contain any number of characters, but the total number of characters in ALL photo URIs for a product must not exceed 1,000,000 characters.
## 3.3. ProductBundle

A product bundle is a collection of products or other product bundles that must remain together. If a product bundle describes a food donation, for example, all items in the product bundle must be accepted and transported together. A recipient may not accept just a part of a donated product bundle; they must accept and remove the entire bundle.

A product bundle may contain other product bundles. Some data fields in a product bundle are only required for a "top-level bundle". A top-level bundle is a product bundle that is not contained within any other product bundle.

A product bundle is a JSON map containing the following fields:

  * `id` (`string`): A unique identifier for this product bundle as a whole.
  * `description` ([`PlaintextDescription`](#311-plaintextdescription), required at top-level): A description of the bundle as a whole.
  * `quantity` (`number` optional): The number of bundles of this type contained within the parent bundle. If omitted, this value is assumed to be 1. At the top level, the quantity must be 1 or omitted.
  * `unitWeight` ([`Measurement`](#313-measurements), required at top-level): The weight of this type of bundle. The given measurement object must specify a unit that measures the "weight" dimension. This weight must equal or exceed the combined weights of the bundle's contents.
  * `expirationTimestampUTC` (`number`, required at top-level): A unix timestamp (number of milliseconds since the epoch UTC) indicating when at least one of the products in this bundle will expire, that is, become unusable. The bundle is considered unusable when any of its contents become unusable. This timestamp must equal or precede any expiration timestamps specified in child products or bundles.
  * `otherUnitMeasurements` ([`Array<Measurement>`](#313-measurements), optional): Additional measurements for this type of bundle. Measurements specified for child products or bundles need not be specified in parent bundles. However, if a measurement is specified, it must sensibly aggregate measurements specified in child products or bundles. For example, if a bundle specifies a "minimum-temperature" measurement, it must not contain child products or bundles that specify a lower minimum temperature.
  * `packagingType` ([`PackagingType`](#314-packaging-types), optional): The packaging type that encloses the contents of this bundle. If not specified, the value is assumed to be "none"
  * `contents` ([`Array<Product`](#32-product)`|`[`ProductBundle>`](#33-productbundle)): A list of at least one product or product bundle contained within this bundle.
  * `price` (_[`Price`](#316-price)_, optional) - A price for this bundle. If payment is required for this bundle, the total payment must be specified in the top-level bundle. The price of a bundle must equal or exceed the prices for all child products and bundles. All prices must be resolved between parties via some mechanism outside the scope of this specification.
  * `estimatedValue` ([`Price`](#316-price), optional): The estimated total value of this bundle. The total estimated value must equal or exceed the estimated values for all child products and bundles.
  * `photoUris` (`Array<string>`, optional): A list of URIs containing up to 10 images of the product. Each URI may contain any number of characters, but the total number of characters in ALL photo URIs for a product must not exceed 1,000,000 characters.
  * `isGrossEstimate` (`boolean`, optional): Indicates that the details of this product bundle are not known, and this entry represents an attempt to make a gross estimate of some unknown quantity. For example, if a grocery store does not have an up-to-date donation inventory, but they know that 100 pounds of produce are typically available for donation every Wednesday, they might create a product record with the "isGrossEstimate" field set to true, indicating that the entry is a placeholder for an unknown quantity. If this field is omitted, it is assumed to have the value "false." If a product bundle contains a child bundle that is a gross estimate, the enclosing bundle must also be a gross estimate. Use of this field implies that the contents of this bundle may not be accurately represented in the contents field.

## 3.4. Offer

An offer is a declaration that some bundle of products is available to be taken from some particular location in the real world, possibly for a fee. For example, if a grocery store wishes to make excess produce available to their local food bank, they would send the food bank an offer of that food.

An offer is a JSON map containing the following fields:

  * `id` (`string`): A unique identifier for this offer
  * `contents` ([`ProductBundle`](#33-productbundle)): A product bundle specifying the contents of this offer.
  * `notes` (`string`): General purpose, human-readable notes containing additional information about the offer. This field must not contain structured, computable data.
  * `transportation` ([`TransportationDetails`](#315-transportation-details)): A structured block containing transportation details about this offer.
  * `contactInfo` ([`Array<OfferContact`](#341-offercontact)` | `[`OfferContact>`](#341-offercontact): A contact description (or list of contact descriptions) for a person who can be contacted to communicate about this offer. This means of communication is considered a last resort when automated communication systems are not adequate.
  * `offeredBy` (`string`, url, optional): A URL specifying which organization is making this offer. This field is only used if this offer is being made available via the Open Product Recovery Transfer API. See ListProducts Response Body for details.
  * `reshareChain` (`Array<string>`, optional):  The reshare chain used to accept and view history of friend-of-a-friend offers. This field is only used if this offer is being made available via the Open Product Recovery Transfer API. See ListProducts Response Body for details.
  * `offerLocation` ([`OfferLocation`](#342-offerlocation)): A location description indicating where this offer is available. This is typically the location where physical items should be picked up by anyone accepting an offer.
  * `offerExpirationUTC` (`number`): A unix timestamp (milliseconds since the epoch UTC) indicating when this offer is no longer available to the holder of this record. There is not necessarily any relationship between this expiration time and any of the expiration times of the contents of the offer. An offer may become unavailable before this timestamp elapses (because, for example, someone else took it), but it will definitely become unavailable once this timestamp elapses.
  * `offerCreationUTC` (`number`): A unix timestamp (milliseconds since the epoch UTC) indicating when this offer was first made available.
  * `offerUpdateUTC` (`number`): A unix timestamp (milliseconds since the epoch UTC) indicating when this offer was last updated. This field is initially set to the offerCreationUTC.
  * `maxReservationTimeSecs` (`number`, optional): The number of seconds for which an offer may be reserved by an organization. Defaults to 0, disabling reservations for this offer.

### 3.4.1. OfferContact

An OfferContact provides contact information for a human being in the real world. Although all of the contact method fields are optional, at least one contact method must be provided. An OfferContact is a JSON map containing the following fields:

  * `contactName` (`string`): The name of the contact person
  * `contactEmail` (`string`, optional): The email of the contact person
  * `contactPhone` (`string`, optional): A voice phone number for the contact person
  * `contactSMS` (`string`, optional): An SMS text number for the contact person

### 3.4.2. OfferLocation

An offer location specifies the location where an offer exists, and times when that offer may be accessed (i.e. picked up). An OfferLocation is a JSON map with the following fields:

  * `locationName` (`string`): The name of the location
  * `locationAddress` (`string`, optional): The address of the location. Optional, but this field or locationLatLong must be provided.
  * `locationLatLong` ([`LatLong`](#343-latlong), optional): The latitude and longitude of the location .Optional, but this field or locationAddress must be provided.
  * `accessWindows` ([`Array<AccessWindow>`](#344-accesswindow), optional): A list of one or more AccessWindows indicating when the offer may be accessed. Note that there is not necessarily any relationship between the AccessWindows for an offer and the time when an offer at that location expires. The access windows in this list must not overlap.
  * `pickupNotes` (`string`, optional): Human readable notes about the pickup process or that further inform the accessWindows.

### 3.4.3. LatLong

A LatLong is a physical location encoded as latitude and longitude. A LatLong is a JSON map with the following fields:
  * `latitude` (`number`): The latitude of the location.
  * `longitude` (`number`): The longitude of the location.

### 3.4.4. AccessWindow

An access window is a range of time during which a resource can be physically accessed. It is a JSON map with the following fields:

  * `startTimeUTC` (`number`): The unix timestamp (milliseconds since the epoch UTC) when this access window begins
  * `endTimeUTC` (`number`): The unix timestamp (milliseconds since the epoch UTC) when this access window ends

# 4.1. Frequently Asked Questions

Since this specification was first shared, a number of common questions have come up from thoughtful readers.

**How do I indicate the category of an item in our organization's internal categorization system?**

If your organization uses a published categorization system (that others can see and use), you can represent a category in that system as an item type id. An item type id includes a type identifier (that specifies which categorization system is in use) and an item identifier (indicating which category in that system applies to the current product). If your organization has created a categorization system, we suggest you create a type identifier for your categorization system using your organization's OPR organization description URL or a public website.

As an example, imagine if The Example Food Bank used 12 categories of food in their systems and wanted to encourage other organizations to categorize food using those categories.

We can identify this categorization system with a unique identifier for the organization that created it, and an id for this particular system (since they might someday have many food categorization systems). If the categorization is published in a structured, computable way, a link to the published version of the system is a great type identifier for terms in that system. Maybe something like:

`https://example.org/vocabularies/primary-categories.json`

In this example, that URL is itself being used as the identifier. With the list then being at a public URL, it helps more organizations find and understand that vocabulary.

Lastly, we can use items from that published taxonomy:

```
{
  "vocabularyId" : "https://example.org/vocabularies/primary-categories.json",
  "itemId":"Bread"
}
```

**How do I indicate that a product is vegetarian/organic/etc?**

Create an itemTypeId for the product. If you know of a public categorization system that includes the facets you want to capture, you can use the procedure described in the previous question to publish a vocabulary you can use.

However, we strongly encourage the use of FoodEx2 for this kind of classification. FoodEx2 uses a faceted system to describe food and its attributes that is very flexible:

| Food                             | FoodEx2 Term              |
| -------------------------------- | ------------------------- |
| Organic kale                     | A00GL#F21.A07SE           |
| Organic imitation meat           | A03TE#F21.A07SE           |
| Pan friend imitation meat        | A03TE#F28.A07GR           |
| Pan fried organic imitation meat | A03TE#F21.A07SE$F28.A07GS |

Notice how the attributes (organic, pan-fried) are encoded in the final id along with a base term. If you'd like to use FoodEx2 in your own systems, you can try their free Smart Food Coding app at https://r4eu.efsa.europa.eu/app/FoodEx2-SCA. Note that you must register for an account with the EFSA in order to use this tool. You can also read the detailed documentation for the classification system at https://efsa.onlinelibrary.wiley.com/doi/pdf/10.2903/sp.efsa.2015.EN-804.

**How do I split/merge offers? How do I allow an organization to accept part of an offer?**

These operations are not supported in this specification. Offers are atomic, and must be listed, shared and accepted as a whole. Therefore, offers should be broken down into the smallest unit that the offering organization can support. If an organization has 50 pallets of bananas, and they're willing to allow each pallet to be accepted separately, ideally they would list each pallet as a different offer.

Sometimes an organization will change its mind about the minimum size of an acceptable offer. Initially, an organization may want all 50 pallets of bananas to be accepted at once, but after a few hours they may decide they're willing to allow lots of 10 pallets to be taken instead. In that case, the original offer should be deleted and 5 new offers of 10 pallets each should be listed. In most cases offer splits and merges can be accomplished by deleting existing offers and re-listing their contents in new offers.


**Would donors be held accountable for the accuracy of an offer's (weight/description/photos/etc), and if so how?**

Yes - they're held accountable via the same social and legal mechanisms that enforce honesty in the real world. Organizations that are consistently inaccurate in their food descriptions should be penalized in exactly the same way as organizations that made misleading verbal or written claims about their donations. Organizations that use the OPR Transfer API are encouraged to revoke access to organizations that engage in abusive behavior.

And, just as in the real world, honest mistakes will be understood and dealt with graciously.
