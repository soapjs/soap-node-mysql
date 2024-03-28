# MySql for SoapJS

This package provides MySql integration for the SoapJS framework, enabling seamless interaction with MySql databases and ensuring that your data access layer is clean, efficient, and scalable.

## Features

- Easy-to-use MySql collections and query factories.
- Integration with the SoapJS framework for structured, clean architecture.
- Support for MySql operations such as find, insert, update, and delete.
- Custom error handling to improve debugging and error resolution.

## Installation

Remember to have `mysql2` and `@soapjs/soap` installed in your project in which you want to use this package.

Install the package using npm:

```bash
npm install @soapjs/soap-node-mysql
```

## Usage

1. Import the necessary components from the package:

   ```typescript
   import {
     MySqlCollection,
     MySqlConfig,
     MySqlQueryFactory,
     MySqlSource,
   } from '@soapjs/soap-node-mysql';
   ```

2. Set up your MySql configuration:

   ```typescript
   const config = new MySqlConfig({
     database: 'yourDatabase',
     hosts: ['localhost'],
     ports: ['27017'],
     user: 'yourUser',
     password: 'yourPassword'
     // additional config parameters
   });
   ```

3. Create a new `MySqlSource` instance:

   ```typescript
   const mysqlSource = await MySqlSource.create(config);
   ```

4. Utilize `MySqlQueryFactory` for building queries and aggregations:

   ```typescript
   const queryFactory = new MySqlQueryFactory();
   const params = FindParams.create({
     where: new Where().valueOf('customer').isEq(userId)
   });
   const queryParts = queryFactory.createFindQuery(params);
   ```

5. Use `MySqlCollection` to perform database operations:

   ```typescript
   const collection = new MySqlCollection<MyDocumentType>(mysqlSource, 'myCollectionName');
   const documents = await collection.find(queryParts);
   /*
   // You can also use a raw SQL query as a string. Then remember to validate this query beforehand
   const documents = await collection.find(`SELECT * FROM ${collection.collectionName} ...`);
   */
   ```

## Documentation

For detailed documentation and additional usage examples, visit [SoapJS documentation](https://docs.soapjs.com).


## Issues
If you encounter any issues, please feel free to report them [here](https://github.com/soapjs/soap/issues/new/choose).

## Contact
For any questions, collaboration interests, or support needs, you can contact us through the following:

- Official:
  - Email: [contact@soapjs.com](mailto:contact@soapjs.com)
  - Website: https://soapjs.com
- Radoslaw Kamysz:
  - Email: [radoslaw.kamysz@gmail.com](mailto:radoslaw.kamysz@gmail.com)
  - Warpcast: [@k4mr4ad](https://warpcast.com/k4mr4ad)
  - Twitter: [@radoslawkamysz](https://x.com/radoslawkamysz)

## License

@soapjs/soap-node-mysql is [MIT licensed](./LICENSE).
