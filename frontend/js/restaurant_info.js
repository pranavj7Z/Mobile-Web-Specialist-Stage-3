let restaurant;
var newMap;
let favoriteBtn = document.getElementById('favoriteBtn');

document.addEventListener('DOMContentLoaded', (event) => {  
  //console.log('initmap')
  initMap();
})




const favoriteToggle = () => {
  let favButton = document.getElementById('is-fav');
  favButton.classList.toggle('toggle-heart');

  let buttonState = favButton.getAttribute('aria-pressed');
  console.log(buttonState);
  let pressed = 'false';
  let labelText = 'Mark as favourite';
  
  if (buttonState === 'true') {
    pressed = 'false';
    labelText = 'Mark as favourite';
  } else {
    pressed = 'true';
    labelText = 'Remove favourite';
  }

  favButton.setAttribute('aria-pressed', pressed);
  favButton.setAttribute('aria-label', labelText);
  favButton.innerHTML = labelText;

  DBHelper.updateFavorite(getParameterByName('id'), pressed != "false");
}
window.addEventListener('online',  ()=>{
  //console.log('going online now!');
  DBHelper.syncOfflineReviewToServer();
});
/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillFavouritesHTML = (is_favorite) => {
  let favButton = document.getElementById('is-fav');
  let pressed = '';
  let labelText = '';

  if (is_favorite === 'true' || is_favorite === true) {
    pressed = 'true';
    labelText = 'Remove favourite';
    favButton.classList.add('toggle-heart');
  } else {
    pressed = 'false';
    labelText = 'Mark as favourite';
    favButton.classList.remove('toggle-heart');
  }

  favButton.setAttribute('aria-pressed', pressed);
  favButton.setAttribute('aria-label', labelText);
  favButton.innerHTML = labelText;
}


/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoicGM1NTUiLCJhIjoiY2ppcnk5d3ltMXJjODNrcDg1eDZ0MTg4MSJ9.JPhGCzT3PHBHGRT6jdRkyg',//'<your MAPBOX API KEY HERE>',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
} 

/**
 * Initialize Google map, called from HTML.
 */
// window.initMap = () => {
//   fetchRestaurantFromURL((error, restaurant) => {
//     if (error) { // Got an error!
//       console.error(error);
//     } else {
//       self.map = new google.maps.Map(document.getElementById('map'), {
//         zoom: 16,
//         center: restaurant.latlng,
//         scrollwheel: false
//       });
//       fillBreadcrumb();
//       DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
//     }
//   });
// }

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {

  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
            fillFavouritesHTML(restaurant.is_favorite);
    });

    // DBHelper.fetchRestaurantReviewById(id, (error, reviews) => {
    //   console.log(reviews)
    //   //self.restaurant[reviews] = reviews;
    //   //print(self.restaurant)
    //   if (!reviews) {
    //     console.error(error);
    //     return;
    //   }
    //   //callback(null, reviews)
    // });
    // fillRestaurantHTML();
    // callback(null, self.restaurant);
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

function addReview(e) {
  e.preventDefault();
  // DBHelper.syncOfflineReviewToServer();
  const curId = getParameterByName('id');
  const name = document.getElementById("name").value;
  const rating = document.getElementById("rating").value;
  const comments = document.getElementById("msg").value;
  const curTime = new Date().getTime();

  //console.log(`restaurant: ${curId} reviewer: ${name} rating: ${rating} comments: ${comments}`);
  if (navigator.onLine) {
    (async () => {
      const rawResponse = await fetch('http://localhost:1337/reviews/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "restaurant_id": parseInt(curId),
            "name": name,
            "rating": parseInt(rating),
            "comments": comments,
            "createdAt": curTime,
            "updatedAt": curTime
        })
      });
      const content = await rawResponse.json();
    
      refreshReviewsHTML(curId);
    })();
  document.getElementById("post-review-form").reset();
  } else {
    // offline, store reviews in seperate idb
    // append new review to end of list for now 
    let list = document.getElementById("reviews-list");
    review = {
      "restaurant_id": parseInt(curId),
      "name": name,
      "rating": parseInt(rating),
      "comments": comments,
      "createdAt": curTime,
      "updatedAt": curTime
    };
    list.appendChild(createReviewHTML(review));
    DBHelper.addOfflineReviewToDB(review);
  }
  //frm = document.getElementById('review-form');
  document.getElementById('review-form').reset();
  
}

refreshReviewsHTML = (id) => {
  DBHelper.fetchRestaurantReviewById(id, (error, reviews) => {
    if (!reviews) {
      console.error(error);
      return;
    } else {
      if (!self.restaurant) return;
      self.restaurant.reviews = reviews;
      //callback(null, restaurant);
      // Get the <ul> element with id="myList"
      let list = document.getElementById("reviews-list");

      // As long as <ul> has a child node, remove it
      while (list.hasChildNodes()) {   
          list.removeChild(list.firstChild);
      }

      for(review of reviews) {
        list.appendChild(createReviewHTML(review));
      };
    }
  });
}



fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt);//.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
