/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
    .then((response)=>response.json())
    .then(data => {
      //successful fetch restaurant, put it in 
      dbPromise.then(function(db) {
        let tx = db.transaction('restaurants', 'readwrite');
        let restaurantStore = tx.objectStore('restaurants');

        for(const restaurant of data) {
          restaurantStore.put(restaurant);
        }
        return tx.complete;
      });

      callback(null, data);
    })
    .catch(error => {
      //callback(error, null)
      //fetch failed, getting data from IndexDB
      console.log('failed to fetch! '+error);
      dbPromise.then(db => {
        const tx = db.transaction("restaurants", "readonly");
        const store = tx.objectStore("restaurants");
        console.log(store)
        store.getAll().then(restaurantsIdb => {
          callback(null, restaurantsIdb)
        })
      })
    });
  }

  /**
   * Fetch all restaurants.
   */
  // static fetchRestaurantReviews(callback) {
  //   //fetch(`http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`)
  //   fetch(`http://localhost:1337/reviews/`)
  //   .then((response)=>response.json())
  //   .then(data => {
  //     //successful fetch restaurant, put it in 
  //     dbPromise.then(function(db) {
  //       let tx = db.transaction('restaurantReviews', 'readwrite');
  //       let reviewStore = tx.objectStore('restaurantReviews');

  //       for(const restaurant of data) {
  //         reviewStore.put(restaurant);
  //       }
  //       return tx.complete;
  //     });

  //     callback(null, data);
  //   })
  //   .catch(error => {
  //     //callback(error, null)
  //     //fetch failed, getting data from IndexDB
  //     console.log('failed to fetch! '+error);
  //     dbPromise.then(db => {
  //       const tx = db.transaction("restaurantReviews", "readonly");
  //       const store = tx.objectStore("restaurantReviews");
  //       console.log(store)
  //       store.getAll().then(restaurantsIdb => {
  //         callback(null, restaurantsIdb)
  //       })
  //     })
  //   });
  // }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // console.log('fetchRestaurantById');
    // fetch all restaurants with proper error handling.
    let restaurant = null;
    (async() => {
      await DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          restaurant = restaurants.find(r => r.id == id);
          if (restaurant) { // Got the restaurant
            // callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    })();
    
    

    DBHelper.fetchRestaurantReviewById(id, (error, reviews) => {
      // console.log('get review by id');
      // console.log(reviews);
        if (!reviews) {
          console.log(error);
          //return;
        } else {
          restaurant.reviews = reviews;
          //callback(null, restaurant);
        }
        callback(null, restaurant);
      });
  }

  /**
   * Fetch restaurant reviews by its ID.
   */
  static fetchRestaurantReviewById(id, callback) {
    // console.log('fetchRestaurantById');
    // fetch all restaurants with proper error handling.
    let dest = `http://localhost:1337/reviews/?restaurant_id=${id}`;
    //console.log('fetching..' + dest);
    fetch(dest)
    .then((response)=>response.json())
    .then(data => {
      //successful fetch restaurant, put it in 
      dbPromise.then(function(db) {
        let tx = db.transaction('restaurantReviews', 'readwrite');
        let reviewStore = tx.objectStore('restaurantReviews');

        for(const review of data) {
          reviewStore.put(review);
        }
        return tx.complete;
      });

      callback(null, data);
    })
    // .catch(error => {
    //   console.log('error fetch review by id' + error);
    // });
    .catch(error => {
      //callback(error, null)
      //fetch failed, getting data from IndexDB
      //console.log('fetch failed, getting review by id from IndexDB, err:' + error);
      dbPromise.then(db => {
        const tx = db.transaction("restaurantReviews", "readonly");
        const store = tx.objectStore("restaurantReviews");
        return store.getAll()
      }).then(allObjs => {
        let r = allObjs.filter(item => item.restaurant_id == id);
        //console.log(r);
        callback(null, r);
      });
    });



    // DBHelper.fetchRestaurantReviews((error, reviews) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     const review = reviews.filter(r => r.restaurant_id == id);
    //     if (review) { // Got the restaurant
    //       callback(null, review);
    //     } else { // Restaurant does not exist in the database
    //       callback('Review does not exist', null);
    //     }
    //   }
    // });
  }

  static addOfflineReviewToDB(review) {
    dbPromise.then(function(db) {
      let tx = db.transaction('offlineReviews', 'readwrite');
      let offlineStore = tx.objectStore('offlineReviews');

      offlineStore.put(review);
      //console.log('adding offline review');
      //console.log(tx.complete);
      return tx.complete;
    });
  }

  /**
   * Sync all offline reviews from idb to server
   */
  static syncOfflineReviewToServer() {
    console.log('sync offline reviews');
    
    let delKeys = [];
    (async() => {
      const offlineReviews = await dbPromise.then(db => {
        const tx = db.transaction("offlineReviews", "readonly");
        const store = tx.objectStore("offlineReviews");
        return store.getAll();
      });

      for (let review of offlineReviews) {
        DBHelper.saveReviewToServer(review);
      }
      //console.log('offlines..');
      //console.log(offlineReviews.map((r) => r.createdAt));
      DBHelper.deleteOfflineReviews(offlineReviews.map((r) => r.createdAt));


    })();
    // dbPromise.then(db => {
    //   const tx = db.transaction("offlineReviews", "readonly");
    //   const store = tx.objectStore("offlineReviews");
    //   return store.getAll();
      // store.getAll().then(allObjs => {
      //   //console.log(allObjs);
      //   for(let item of allObjs) {
      //     // Send post request to update server data
      //     delKeys.push(item.createdAt);
      //   }
      // });
      // for (let key in delKeys) {
      //   const tx = db.transaction('offlineReviews', 'readwrite');
      //   tx.objectStore('offlineReviews').delete(key);
      // }
      // console.log('keys to be deleted..');
      // console.log(delKeys);
    //});
    

  }
  static updateFavorite(rid, is_favorite) {
    (async () => {
      const rawResponse = await fetch(`http://localhost:1337/restaurants/${rid}/`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "is_favorite": Boolean(is_favorite)
        })
      });
      const content = await rawResponse.json();
    })();
  }

  static saveReviewToServer(review) {//rid, name, rating, comments, curTime) {
    (async () => {
      const rawResponse = await fetch('http://localhost:1337/reviews/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "restaurant_id": parseInt(review.restaurant_id),
            "name": review.name,
            "rating": parseInt(review.rating),
            "comments": review.comments,
            "createdAt": review.curTime,
            "updatedAt": review.curTime
        })
      });
      const content = await rawResponse.json();
    })();
  }

  static deleteOfflineReviews(delKeys) {
    console.log(delKeys);
    dbPromise.then(db => {
      const tx = db.transaction("offlineReviews", "readwrite");
      const store = tx.objectStore("offlineReviews");

      for (let key of delKeys) {
        console.log(`Deleting key: ${key}`);
        const tx = db.transaction('offlineReviews', 'readwrite');
        tx.objectStore('offlineReviews').delete(key);
      }
    });
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  

  /**
   * Restaurant reviews URL.
   */
  static urlForRestaurantReviews(restaurant) {
    return (`./reviews/?restaurant_id=${restaurant.id}`);
  }
   static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {  
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}.jpg`;
    }
    return `/img/${restaurant.id}.jpg`;
  } // 

  static imageAltAttribute(restaurant) {
    return (`Image of ${restaurant.name} Restaurant`);
  }


  
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  // static mapMarkerForRestaurant(restaurant, map) {
  //   const marker = new google.maps.Marker({
  //     position: restaurant.latlng,
  //     title: restaurant.name,
  //     url: DBHelper.urlForRestaurant(restaurant),
  //     map: map,
  //     animation: google.maps.Animation.DROP}
  //   );
  //   return marker;
  // }

}

const dbPromise = idb.open('restaurant-db', 1, function(upgradeDb) {
    restaurantStore = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });//upgradeDb.transaction.objectStore('restaurants');//upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    reviewStore = upgradeDb.createObjectStore('restaurantReviews', { keyPath: 'id' });
    offlineStore = upgradeDb.createObjectStore('offlineReviews', { keyPath: 'createdAt' });
});
