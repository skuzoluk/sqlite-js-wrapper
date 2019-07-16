# sqlite-js-wrapper
Tiny SQLite helper library built on top of HTML5/Web SQL (DRAFT) API. 

This library helps you to build sqlite query in an eloquent way.

## Supported platforms
| Browser       | Mobile       | NodeJS  
| ------------- |:-------------|:-------:
| Any js library supports ES6 module (React, VueJS...)| React Native, Cordova (JS based others) | Try and inform me please :)

## Why i need this tiny library
<p>I need to use sqlite in a project and i did some research. I found some libraries, for example websqlite and TypeORM.
<p>TypeORM has model support and more complex than i need (at least for my project). Also force you to use typescript.
Websqlite also is a good library but i want to query sqlite database and get result format in a different way (Promises and result as object).
At the same time i want the library to be handy and easy to read. That's why i decided to implement one.
<p>This is a fast imlementation took one workday. So if you commit bugs or issues i will be grateful
<p> Hope you enjoy it!

## Installation
Using npm:

    npm install --save sqlite-js-wrapper

Using yarn

    yarn add sqlite-js-wrapper
    
## Features
It supports various sqlite syntax.
Here is the feature list

| Feature       | Description   
| ------------- |:-------------:
| query         | Executes single raw query 
| queryMulti    | Executes multiple raw query 
| sqlBatch      | Executes multiple raw query using plugin-specific API calls support
| insert        | Insert single object or array of objects to the table given
| createTable   | Creates table using column argument
| table         | The magic! Takes table name as an argument then let you to chain with other functions such as (select, delete, update, where, whereIn, whereRaw, whereBetween, distinct, join, orderBy, groupBy, having)

Chaining functions

| Function       | Description   
| ------------- |:-------------:
| select        | Return the data from the query builder. <p>Arguments: fields (string default is '*'. It takes comma separated string), limit (int), offset (int)
| delete        | Deletes the records. <p>Arguments: limit (int), offset (int)
| update        | Updates the matching records. <p>Arguments: data (object), limit (int), offset (int)
| where         | Adds where condition to the query builder. <p>Arguments: field (string), value, operator (string default is '=' example: =,<,>, like ...), andOr (string default is 'AND')
| whereIn       | Adds where condition to filter the records that matches with the array given. <p>Arguments: field (string), valueArray, andOr (string default is 'AND')
| whereBetween  | Adds where condition to filter the records that between the array given. <p>Arguments: field (string), valueArray (two item only), andOr (string default is 'AND')
| whereRaw      | Adds raw where condition to write complex where clause. <p>Arguments: condition (string), andOr (string default is 'AND')
| distinct      | Removes duplicates from result set. <p>Takes no argument
| join          | Joins the table to another. This is a little more complex. See the examples below <p>Arguments: joinTable (string), joinTableAlias (string), joinCallback (function (j){}), joinType (string default is 'INNER')
| orderBy       | Adds order by clause to the query. It can be used multiple times <p>Arguments: field (string), type (string default is 'ASC' values are ASC, DESC)
| groupBy       | Groups the query using the array given. <p>Arguments: groupByArray (array of string)
| having        | Adds raw having clause to a grouped query. <p>Arguments: havingStr (string)

<strong>Examples are coming soon...</strong>
