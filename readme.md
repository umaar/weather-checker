### Weather Checker

## To start locally

```sh
# Run these commands and open http://localhost:3000
rm db-development-weather-checker.sqlite && make migrate && make seed && make
```

## Run tests

```sh
# Just linting
make test
```

# Push to prod

```
git push umaar master
```

# Run these just once

```
make install
make migrate
make seed
```

# See logs in prod

```sh
pm2 show weather-checker
```

# Example API requests

## 1. Location API

```sh
curl -X GET "https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=<API_KEY_HERE>&q=<LAT_HERE>%2C<LON_HERE>&details=true"
```

See [location-based-on-lat-lon.json](example-responses/location-based-on-lat-lon.json)

### To get the town

`response.Details.Key` which gives a more granular key, which can then be used in further API requests.

### To get the city:

response.ParentCity.Key gives back a key which is needed for the next API request:

##  2. Current Conditions API

```sh
curl -X GET "https://dataservice.accuweather.com/currentconditions/v1/<LOCATION_KEY_HERE>?apikey=<API_KEY_HERE>&details=true"
```

See [current-conditions.json](example-responses/current-conditions.json)

## 3. Forecast API - 1 Day of Daily Forecasts

```sh
curl -X GET "https://dataservice.accuweather.com/forecasts/v1/daily/1day/<LOCATION_KEY_HERE>?apikey=<API_KEY_HERE>&details=true&metric=true"
```

See [forecast-1-day.json](example-responses/forecast-1-day.json)

## 4. Forecast API - 1 Hour of Hourly Forecasts

```sh
curl -X GET "https://dataservice.accuweather.com/forecasts/v1/hourly/1hour/<LOCATION_KEY_HERE>?apikey=<API_KEY_HERE>&details=true&metric=true"
```

See [forecast-1-hour.json](example-responses/forecast-1-hour.json)

## 5. Forecast API - 12 Hours of Hourly Forecasts

```sh
curl -X GET "https://dataservice.accuweather.com/forecasts/v1/hourly/12hour/<LOCATION_KEY_HERE>?apikey=<API_KEY_HERE>&details=true&metric=true"
```

See [forecast-12-hours.json](example-responses/forecast-12-hours.json)

## 6. Autocomplete Search - "bright"

```sh
curl -X GET "http://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=<API_KEY_HERE>&q=brigh"
```

See [autocomplete-bright.json](example-responses/autocomplete-bright.json)

### Note

24 hours or more are not permitted by the API.