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
| createTable   | Creates table using column argument and returns true or throws error
| dropTable     | Drops table if exists given as first argument and returns true or throws error
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

## createTable->columns supported properties
| key           | value      |  required   
| ------------- |:---------:|:---------
| columnName    | string    | ✅
| dataType      | string  (null, integer, real, text, blob)   | 
| primaryKey    | boolean    | 
| autoIncrement | boolean    | 
| notNull       | boolean    | 
| unique        | boolean    | 
| default       | string     | 
| option        | string (extra attribs such as "CHECK" when needed )    | 


# Examples

#### First create database in usual way
```javascript
const db = SQLite.openDatabase(
    { name: 'test.db', location: 'default' },
    succ => console.log('DB Created: '),
    err => console.log('Err:', err)
  );
```

#### Init wrapper using database object:
```javascript
const sw = new SQLiteWrapper(db);
```
#### Drop old tables if exists
```javascript
sw.dropTable('user');
sw.dropTable('score');
```

#### Create user and score tables
```javascript
sw.createTable('user', [
{
  columnName: 'id',
  dataType: 'integer',
  primaryKey: true,
  autoIncrement: true,
},
{
  columnName: 'name',
  dataType: 'text',
  notNull: true,
  unique: true,
},
{
  columnName: 'team',
  dataType: 'text',
  default: 'gala',
  notNull: true,
},
]);

// Result is: true

sw.createTable('score', [
{
  columnName: 'id',
  dataType: 'integer',
  primaryKey: true,
  autoIncrement: true,
},
{
  columnName: 'game',
  dataType: 'integer',
  notNull: true,
},
{
  columnName: 'userId',
  dataType: 'integer',
  notNull: true,
},
{
  columnName: 'score',
  dataType: 'integer',
  notNull: true,
},
]);

// Result is: true
```

#### Sample data
```javascript
const users = [
    { id: 1, name: 'user1' },
    { id: 2, name: 'user2', team: 'madrid' },
    { id: 3, name: 'user3', team: 'barca' },
    { id: 4, name: 'user4', team: 'arsenal' },
    { id: 5, name: 'user5', team: 'barca' },
    { id: 6, name: 'user6', team: 'gala' },
];

const scores = [
    { game: 1, userId: 1, score: 5 },
    { game: 2, userId: 2, score: 2 },
    { game: 3, userId: 3, score: 4 },
    { game: 4, userId: 1, score: 8 },
    { game: 1, userId: 2, score: 3 },
    { game: 2, userId: 4, score: 1 },
    { game: 3, userId: 2, score: 2 },
    { game: 4, userId: 3, score: 4 },
    { game: 5, userId: 1, score: 3 },
    { game: 5, userId: 2, score: 1 },
    { game: 6, userId: 3, score: 5 },
    { game: 6, userId: 4, score: 2 },
    { game: 7, userId: 3, score: 2 },
    { game: 7, userId: 1, score: 1 },
    { game: 8, userId: 2, score: 4 },
    { game: 8, userId: 4, score: 3 },
];
```

#### Insert data to tables
```javascript
sw.insert('user', users);

// Result: true

```
```javascript
sw.insert('score', scores);

// Result: true

```
#### Insert single record and get insertId
```javascript
const { insertId } = sw.insert('score', { game: 9, userId: 1, score: 4 });

// Result: InsertId: 17
```

#### Update
```javascript
const rowsAffected = sw
.table('user')
.where('team', 'gala')
.update({ team: 'galatasaray' });

// rowsAffected: 2
```

#### Delete records id between 4, 6
```javascript
const rowsDeleted = sw
.table('user')
.whereBetween('id', [4, 6])
.delete();

// rowsDeleted: 3
```

#### Select all records from user table
```javascript
sw.table('user').select()

/*
  Result:
  {
     "data":[
        {
           "team":"galatasaray",
           "name":"user1",
           "id":1
        },
        {
           "team":"madrid",
           "name":"user2",
           "id":2
        },
        {
           "team":"barca",
           "name":"user3",
           "id":3
        },
        {
           "team":"arsenal",
           "name":"user4",
           "id":4
        },
        {
           "team":"barca",
           "name":"user5",
           "id":5
        },
        {
           "team":"galatasaray",
           "name":"user6",
           "id":6
        }
     ],
     "rowsAffected":0,
     "length":6
  }
 */
```

#### Select team names and remove duplicates
```javascript
const teams = sw
  .table('user')
  .distinct()
  .select('team');
const teamArray = teams.data.map(x => x.team)

// Result: ["galatasaray", "madrid", "barca", "arsenal"]
```

#### Complex query using join, where, groupBy, having, orderBy
This query return the users and total scores with user name sorted descendant by sumOfScore where sums bigger than 12 and team is not equal to arsenal

```javascript
const maxScoreList = sw
  .table('score', 'S')
  .join('user', 'U', j => {
    j.on('U.id', 'S.userId');
    j.whereIn('U.id', [1, 2, 3, 4, 5]);
  })
  .where('U.team', 'arsenal', '!=')
  .groupBy(['userId'])
  .having('sumOfScore > 12')
  .orderBy('sumOfScore', 'DESC')
  .select('U.name, SUM(S.score) as sumOfScore');

/*
  Result:
  {
     "data":[
        {
           "sumOfScore":21,
           "name":"user1"
        },
        {
           "sumOfScore":15,
           "name":"user3"
        }
     ],
     "rowsAffected":0,
     "length":2
  } 
 */
```

#### Processing results
There are 2 ways to get the results from functions
* First is using <strong>await/async</strong>

```javascript
const records = await sw.table('user').select();
```

* Second is using <strong>.then()</strong>
```javascript
sw.table('score')
    .select()
    .then(result => console.log(result));
```

#### Error handling
* Using <strong>await/async</strong>
```javascript
try {
  await sw.table('tableNotExists').select();
} catch (err) {
  console.log(err);
}
```
* Using <strong>.then()</strong>
```javascript
sw.table('tableNotExists')
    .select()
    .then(() => {})
    .catch(err => console.log(err));
```

# Feedback
All bugs, feature requests, feedback, etc., are welcome.

# Donation
If this project help you reduce time to develop, you can give me a cup of coffee ☕️ :)
