var CACHE_NAME = 'restaurant-review-cache-v1';
var urlsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/css/styles.css'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  let requestUrl = event.request.url;
  console.log('fetch url..');
  console.log(requestUrl);
  // if(requestUrl.origin === location.origin && requestUrl.pathname === '/') {
  //   console.log('1');
  //   event.respondWith(caches.match('index.html'));
  //   return;
  // }
  
  // need to get response from server
  if(requestUrl.includes(':1337')) {
    //if(requestUrl.includes('restaurants')) {
      console.log('2');
      // get all restaurant list from indexDB
      return;
    //}
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        console.log('3');
        // Return response from cache
        if (response) {
          return response;
        }

        // Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});