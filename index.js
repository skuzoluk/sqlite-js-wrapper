const SQLiteJSWrapper = function(db) {
  this.db = db;

  this.query = (query, params) => {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          tx.executeSql(
            query,
            params,
            (transaction, result) => {
              const data = [];
              for (let i = 0; i < result.rows.length; i++) {
                data.push(result.rows.item(i));
              }
              resolve({
                data,
                insertId: result.insertId,
                rowsAffected: result.rowsAffected,
                length: result.rows.length,
              });
            },
            error => {
              reject(error);
            }
          );
        },
        error => {
          reject(error);
        }
      );
    });
  };

  this.queryMulti = queries => {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          queries.forEach(val => {
            let query;
            let params;

            if (Array.isArray(val)) {
              [query, params] = val;
            } else {
              query = val;
              params = [];
            }
            tx.executeSql(query, params);
          });
        },
        reject,
        resolve
      );
    });
  };

  this.sqlBatch = queries => {
    return new Promise((resolve, reject) => {
      this.db.sqlBatch(queries, resolve, reject);
    });
  };

  this.insert = (table, data) => {
    if (Array.isArray(data)) {
      const batchQueries = [];
      let query;
      data.forEach(val => {
        query = `INSERT INTO ${table} (${Object.keys(val)}) VALUES (${'?'
          .repeat(Object.keys(val).length)
          .split('')
          .join(',')})`;
        batchQueries.push([query, Object.values(val)]);
      });
      return this.queryMulti(batchQueries);
    }
    const query = `INSERT INTO ${table} (${Object.keys(data)}) VALUES (${'?'
      .repeat(Object.keys(data).length)
      .split('')
      .join(',')})`;
    return this.query(query, Object.values(data));
  };

  const joinObj = function(joinTable, alias, joinType = 'INNER') {
    function on(field1, field2, operator, andOr) {
      this.onList.push([field1, field2, operator || '=', andOr || 'AND']);
    }

    function where(field, value, operator, andOr) {
      this.whereList.push([field, value, operator || '=', andOr || 'AND']);
    }

    function whereIn(field, valueArray, andOr) {
      this.whereList.push([field, valueArray, 'IN', andOr || 'AND']);
      return this;
    }

    function whereRaw(condition, andOr) {
      this.whereList.push([condition, andOr || 'AND']);
      return this;
    }

    const obj = {
      joinTable,
      alias,
      joinType,
      whereList: [],
      onList: [],
    };

    obj.on = on;
    obj.where = where;
    obj.whereIn = whereIn;
    obj.whereRaw = whereRaw;
    return obj;
  };

  // chainable table object
  this.table = function table(table, alias) {
    const getWhereData = conditions => {
      const param = [];
      const whereStr = conditions
        .map((val, i) => {
          const [field, value, operator, andOr] = val;
          // whereRaw
          if (val.length === 2) {
            return `${i > 0 ? val[1] : ''} ${val[0]}`;
          }
          if (operator === 'IN') {
            param.push(...value);
            return `${i > 0 ? andOr : ''} ${field} IN (${'?'
              .repeat(value.length)
              .split('')
              .join(',')})`;
          }
          if (operator === 'BETWEEN') {
            param.push(...value);
            return `${i > 0 ? andOr : ''} ${field} BETWEEN ? AND ?`;
          }
          param.push(value);
          return `${i > 0 ? andOr : ''} ${field} ${operator} ?`;
        })
        .join(' ');
      return { whereStr, param };
    };

    const getOrderStr = orderList => {
      return orderList
        .map(val => {
          const [field, type] = val;
          return `${field} ${type}`;
        })
        .join(', ');
    };

    function distinct() {
      this.isDistinct = true;
      return this;
    }

    function where(field, value, operator, andOr) {
      this.whereList.push([field, value, operator || '=', andOr || 'AND']);
      return this;
    }

    function whereIn(field, valueArray, andOr) {
      this.whereList.push([field, valueArray, 'IN', andOr || 'AND']);
      return this;
    }

    function whereBetween(field, valueArray, andOr) {
      this.whereList.push([field, valueArray, 'BETWEEN', andOr || 'AND']);
      return this;
    }

    function whereRaw(condition, andOr) {
      this.whereList.push([condition, andOr || 'AND']);
      return this;
    }

    function orderBy(field, type) {
      this.orderList.push([field, type || 'ASC']);
      return this;
    }

    function groupBy(groupByArray) {
      this.groupList = groupByArray;
      return this;
    }

    function having(havingStr) {
      this.havingCondition = havingStr;
      return this;
    }

    function join(joinTable, joinTableAlias, joinCallback, joinType = 'INNER') {
      const obj = joinObj(joinTable, joinTableAlias, joinType);
      joinCallback(obj);
      this.joinList.push(obj);
      return this;
    }

    function select(fields, limit, offset) {
      const whereData = getWhereData(this.whereList);
      const order = getOrderStr(this.orderList);

      let limitStr;
      if (offset) {
        limitStr = ` LIMIT ${offset}, ${limit}`;
      } else {
        limitStr = limit ? ` LIMIT ${limit}` : '';
      }

      // Build join strings
      const joinListStr = [];
      const joinParams = [];
      this.joinList.forEach(val => {
        let str = `${val.joinType} JOIN ${val.joinTable} AS ${val.alias} ON`;
        const joinWhereData = getWhereData(val.whereList);
        joinParams.push(...joinWhereData.param);

        const joinOnStr = val.onList
          .map((j, i) => {
            const [field1, field2, operator, andOr] = j;
            return `${i > 0 ? andOr : ''} ${field1} ${operator} ${field2}`;
          })
          .join(' ');
        str = str + joinOnStr + (val.whereList.length > 0 ? ` ${val.whereList[0][3]}${joinWhereData.whereStr}` : '');
        joinListStr.push(str);
      });

      const tableName = this.alias ? `${this.table} AS ${this.alias}` : table;
      const groupStr = this.groupList.length > 0 ? ` GROUP BY ${this.groupList.join(', ')}` : '';
      const distinctStr = this.isDistinct ? 'DISTINCT ' : '';
      const fieldStr = fields || '*';
      const orderStr = this.orderList.length > 0 ? ` ORDER BY ${order}` : '';
      const havingStr = this.havingCondition.length > 0 ? ` HAVING ${this.havingCondition}` : '';
      const whereStr = this.whereList.length > 0 ? ` WHERE${whereData.whereStr}` : '';
      const joinStr = joinListStr.length > 0 ? joinListStr.join(' ') : '';

      const query = `SELECT ${distinctStr}${fieldStr} FROM ${tableName} ${joinStr} ${whereStr}${groupStr}${havingStr}${orderStr}${limitStr}`;

      return this.query(query, [...joinParams, ...whereData.param]);
    }

    this.delete = function(limit, offset) {
      const tableName = this.alias ? `${this.table} AS ${this.alias}` : table;
      const whereData = getWhereData(this.whereList);
      const order = getOrderStr(this.orderList);
      let limitStr;
      if (offset) {
        limitStr = ` LIMIT ${offset}, ${limit}`;
      } else {
        limitStr = limit ? ` LIMIT ${limit}` : '';
      }

      const whereStr = this.whereList.length > 0 ? ` WHERE${whereData.whereStr}` : '';
      const orderStr = this.orderList.length > 0 ? ` ORDER BY ${order}` : '';
      const query = `DELETE FROM ${tableName}${whereStr}${orderStr}${limitStr}`;

      return new Promise(async (resolve, reject) => {
        this.query(query, whereData.param)
          .then(result => {
            resolve(result.rowsAffected);
          })
          .catch(reject);
      });
    };

    function update(data, limit, offset) {
      const tableName = this.alias ? `${this.table} AS ${this.alias}` : table;
      const whereData = getWhereData(this.whereList);
      const order = getOrderStr(this.orderList);
      let limitStr;
      if (offset) {
        limitStr = ` LIMIT ${offset}, ${limit}`;
      } else {
        limitStr = limit ? ` LIMIT ${limit}` : '';
      }

      const whereStr = this.whereList.length > 0 ? ` WHERE${whereData.whereStr}` : '';
      const orderStr = this.orderList.length > 0 ? ` ORDER BY ${order}` : '';

      const setStr = Object.keys(data)
        .map(val => `${val} = ?`)
        .join(', ');

      const query = `UPDATE ${tableName} SET ${setStr} ${whereStr}${orderStr}${limitStr}`;

      return new Promise(async (resolve, reject) => {
        this.query(query, [...Object.values(data), ...whereData.param])
          .then(result => {
            resolve(result.rowsAffected);
          })
          .catch(reject);
      });
    }

    const obj = {
      table,
      alias,
      isDistinct: false,
      whereList: [],
      orderList: [],
      groupList: [],
      joinList: [],
      havingCondition: '',
    };

    obj.where = where;
    obj.whereIn = whereIn;
    obj.whereBetween = whereBetween;
    obj.whereRaw = whereRaw;
    obj.orderBy = orderBy;
    obj.select = select;
    obj.distinct = distinct;
    obj.groupBy = groupBy;
    obj.having = having;
    obj.join = join;
    obj.delete = this.delete;
    obj.update = update;
    obj.query = this.query;
    return obj;
  };

  this.createTable = async (tableName, columns, withRowId = false) => {
    const primaryKeys = columns.filter(x => x.primaryKey).map(x => x.columnName);
    let colStr = columns
      .map(col => {
        const quote = typeof col.default === 'string' ? "'" : '';
        return [
          col.columnName,
          col.dataType || '',
          col.primaryKey && primaryKeys.length === 1 ? 'PRIMARY KEY' : '',
          col.autoIncrement && col.primaryKey && primaryKeys.length === 1 ? 'AUTOINCREMENT' : null,
          col.notNull ? 'NOT NULL' : null,
          col.unique ? 'UNIQUE' : null,
          col.default ? `DEFAULT ${quote}${col.default}${quote}` : null,
          col.option || null,
        ]
          .filter(x => x !== null)
          .join(' ');
      })
      .join(', ');

    if (primaryKeys && primaryKeys.length > 1) {
      colStr += `, PRIMARY KEY (${primaryKeys.join(', ')})`;
    }

    return new Promise((resolve, reject) => {
      this.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${colStr}) ${withRowId ? '[WITHOUT ROWID]' : ''}`)
        .then(() => resolve(true))
        .catch(err => {
          reject(err);
        });
    });
  };

  this.dropTable = tableName => {
    return new Promise((resolve, reject) => {
      this.query(`DROP TABLE IF EXISTS ${tableName}`)
        .then(() => resolve(true))
        .catch(err => {
          reject(err);
        });
    });
  };
};

export default SQLiteJSWrapper;
