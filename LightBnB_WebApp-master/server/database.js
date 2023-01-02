const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);

  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])
    .then((result) => {
      user = result.rows[0];
      if (user === undefined) {
        user = null;
      }
      return Promise.resolve(user);
    })
    .catch((err) => {
      console.log(err.message);
    });

}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  // return Promise.resolve(users[id]);

  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;

  // return Promise.resolve(user);
  
  const newUser = [user.name, user.email, user.password];
  return pool
    .query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', newUser)
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  console.log(guest_id);

  return pool
  .query(`
  SELECT reservations.*, properties.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT 10;`, [guest_id])
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// const getAllProperties = function(options, limit) {
//   // const limitedProperties = {};
//   // for (let i = 1; i <= limit; i++) {
//   //   limitedProperties[i] = properties[i];
//   // }
//   // return Promise.resolve(limitedProperties);
  
//   return pool
//     .query(`SELECT * FROM properties LIMIT $1`, [limit])
//     .then((result) => {
//       // console.log(result.rows);
//       return result.rows;
//     })
//     .catch((err) => {
//       console.log(err.message);
//     });
  
// }
const getAllProperties = function (options, limit = 10) {

  const queryParams = [];
  console.log('Limit is: ', limit);
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city || options.minimum_price_per_night || options.maximum_price_per_night || options.minimum_rating) {
    queryString += 'WHERE ';
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    if (options.city) {
      queryString += 'AND ';
    }
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `cost_per_night >= $${queryParams.length} `
  }

  if (options.maximum_price_per_night) {
    if (options.city || options.minimum_price_per_night) {
      queryString += 'AND ';
    }
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `cost_per_night <= $${queryParams.length} `
  }

  if (options.minimum_rating) {
    if (options.city || options.minimum_price_per_night || options.maximum_price_per_night) {
      queryString += 'AND ';
    }
    queryParams.push(`${options.minimum_rating}`);
    queryString += `rating >= $${queryParams.length} `
  }

  queryParams.push(10);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
